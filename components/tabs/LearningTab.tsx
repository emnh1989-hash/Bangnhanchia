import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Eye, EyeOff, Star, BookOpen, CheckCircle, ChevronLeft, ChevronRight, Wand2, ArrowLeftRight, Volume2, Loader2, Square, List, CheckSquare } from 'lucide-react';
import { CandyButton } from '../ui/CandyButton';
import { SOUNDS, decode, decodeAudioData } from '../../utils/audioUtils';
import { getAudio } from '../../utils/dbUtils';
import { VoiceSettings } from '../../types';

interface LearningTabProps {
    isFullscreen: boolean;
    voiceSettings?: VoiceSettings;
    isOverlayOpen?: boolean; // Nhận trạng thái từ App để dừng âm thanh khi mở Modal
}

// Map các liên kết âm thanh bên ngoài cho các bảng cụ thể
const EXTERNAL_AUDIOS: Record<string, string> = {
    'mul-2': 'https://audio.jukehost.co.uk/c5uFn2WKJ6iQJ6aSyNfwjOkS7zMZmIZg',
    'mul-3': 'https://audio.jukehost.co.uk/7BKm89J0wSeHKKim1JIzlWyhdZnlovgZ',
    'mul-4': 'https://audio.jukehost.co.uk/NTg0VKt9bJF73dRNjcKcb0sxHOxHiOiB',
    'mul-5': 'https://audio.jukehost.co.uk/1Zy4zjSsxjO8p4W2azRnKoxopTJVS5N3',
    'mul-6': 'https://audio.jukehost.co.uk/JcN8OW2GChEdcylqH5F9oPTIae9BZ045',
    'mul-7': 'https://audio.jukehost.co.uk/h2BHSdpE2fR5TKE8yhSFRZRTFpE2b4tn',
    'mul-8': 'https://audio.jukehost.co.uk/uHBOjPD9Q1d6Nhy3PUb9nsEemZkgI2Dh',
    'mul-9': 'https://audio.jukehost.co.uk/s4y8lne0cPhYULuydbFc6zpMSJI2hpZj',
    'div-2': 'https://audio.jukehost.co.uk/QawYcf0a6fE1OejkXnElB5Svs2LHpYH7',
    'div-3': 'https://audio.jukehost.co.uk/vARB82HZHFhsQ6tPGcfzv9rOyQ14rcLP',
    'div-4': 'https://audio.jukehost.co.uk/iWhGGHy8mO9wlhlBYDUSslY0pxspDTHU',
    'div-5': 'https://audio.jukehost.co.uk/FMF7NkyYFewbpsQxSPGb4itzT4ubyHL5',
    'div-6': 'https://audio.jukehost.co.uk/LfLkIe5GxgcVYGoDrY5jW9EdI12AEOv9',
    'div-7': 'https://audio.jukehost.co.uk/wAbsfSDjheJxODTH2htKNs8eO61kT3jS',
    'div-8': 'https://audio.jukehost.co.uk/z9TqjVU3k5BCThL4MsW7O5B1bQGTtiW0',
    'div-9': 'https://audio.jukehost.co.uk/K6FeELTxZATxxRZKE9KVrb8F2RPteFRP',
};

const getColors = (op: 'mul' | 'div', part: 'a' | 'b' | 'res') => {
    if (op === 'mul') {
        if (part === 'a') return { text: 'text-blue-600', bg: 'bg-blue-500' };
        if (part === 'b') return { text: 'text-purple-600', bg: 'bg-purple-500' };
        return { text: 'text-rose-600', bg: 'bg-rose-500' };
    } else {
        // Lô-gic đồng nhất màu: 
        // Trong phép nhân: Thừa số 1 (xanh), Thừa số 2 (tím), Tích (hồng)
        // Trong phép chia: Số bị chia (phải cùng màu tích - hồng), Số chia (xanh), Thương (tím)
        if (part === 'a') return { text: 'text-rose-600', bg: 'bg-rose-500' }; // Số bị chia
        if (part === 'b') return { text: 'text-blue-600', bg: 'bg-blue-500' }; // Số chia
        return { text: 'text-purple-600', bg: 'bg-purple-500' }; // Kết quả
    }
};

const illColors = {
    a: { text: 'text-blue-600', bg: 'bg-blue-600' },
    b: { text: 'text-purple-600', bg: 'bg-purple-600' },
    res: { text: 'text-rose-600', bg: 'bg-rose-600' }
};

export const LearningTab: React.FC<LearningTabProps> = ({ isFullscreen, voiceSettings, isOverlayOpen }) => {
    const [selectedTable, setSelectedTable] = useState(2);
    const [operation, setOperation] = useState<'mul' | 'div'>('mul');
    const [activeRow, setActiveRow] = useState(1);
    const [visibleTables, setVisibleTables] = useState<string[]>(['mul-2']);
    const [readingTable, setReadingTable] = useState<string | null>(null);
    
    // Refs để quản lý dừng âm thanh triệt để
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    const [hiddenNumbers, setHiddenNumbers] = useState<Record<string, boolean>>(() => {
        const initialHidden: Record<string, boolean> = {};
        ['mul', 'div'].forEach(op => {
            for(let t=2; t<=9; t++) {
                for(let r=1; r<=10; r++) {
                    initialHidden[`${op}-${t}-${r}-a`] = true;
                    initialHidden[`${op}-${t}-${r}-b`] = true;
                    initialHidden[`${op}-${t}-${r}-res`] = true;
                }
            }
        });
        return initialHidden;
    });

    const [divStep, setDivStep] = useState(0);
    const [isSwapped, setIsSwapped] = useState(false);
    const [bigEqVisible, setBigEqVisible] = useState({ a: false, b: false, res: false, addRes: false });
    const [showIllustration, setShowIllustration] = useState(false);
    const [activeMobileTab, setActiveMobileTab] = useState(0); 

    const touchStart = useRef<{x: number, y: number} | null>(null);
    const touchEnd = useRef<{x: number, y: number} | null>(null);

    const getMobileClass = (index: number) => activeMobileTab === index ? 'flex' : 'hidden lg:flex';
    const maxMobileTab = showIllustration ? 2 : 1;

    const onTouchStart = (e: React.TouchEvent) => {
        touchEnd.current = null;
        touchStart.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
    };

    const onTouchMove = (e: React.TouchEvent) => {
        touchEnd.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
    };

    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        const xDistance = touchStart.current.x - touchEnd.current.x;
        const yDistance = touchStart.current.y - touchEnd.current.y;
        if (Math.abs(yDistance) > Math.abs(xDistance)) return;
        if (xDistance > 50 && activeMobileTab < maxMobileTab) setActiveMobileTab(prev => prev + 1);
        if (xDistance < -50 && activeMobileTab > 0) setActiveMobileTab(prev => prev - 1);
    };

    const handleMobileNav = (direction: 'next' | 'prev') => {
        if (direction === 'next' && activeMobileTab < maxMobileTab) setActiveMobileTab(p => p + 1);
        if (direction === 'prev' && activeMobileTab > 0) setActiveMobileTab(p => p - 1);
    };

    const stopCurrentAudio = () => {
        if (audioRef.current) {
            audioRef.current.onended = null;
            audioRef.current.onerror = null;
            audioRef.current.pause();
            audioRef.current.removeAttribute('src'); 
            audioRef.current.load();
            audioRef.current = null;
        }
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch(e) {}
            sourceRef.current = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => {});
            audioCtxRef.current = null;
        }
        setReadingTable(null);
    };

    useEffect(() => {
        setActiveMobileTab(showIllustration ? 1 : 0); 
    }, [showIllustration]);

    useEffect(() => {
        stopCurrentAudio();
        return () => {
            stopCurrentAudio();
        };
    }, [selectedTable, operation]);

    useEffect(() => {
        if (isOverlayOpen) {
            stopCurrentAudio();
        }
    }, [isOverlayOpen]);

    const getKey = (op: string, table: number, row: number, part: string) => `${op}-${table}-${row}-${part}`;
    
    const toggleCell = (op: string, table: number, row: number, part: string) => {
        const key = getKey(op, table, row, part);
        setHiddenNumbers(prev => ({ ...prev, [key]: !prev[key] }));
        SOUNDS.click();
    };

    const isTableFullyHidden = (op: string, table: number) => {
        for(let i=1; i<=10; i++) {
            if (!hiddenNumbers[getKey(op, table, i, 'a')] || !hiddenNumbers[getKey(op, table, i, 'b')] || !hiddenNumbers[getKey(op, table, i, 'res')]) return false;
        }
        return true;
    };

    const toggleTableVisibility = (op: string, table: number) => {
        const targetState = !isTableFullyHidden(op, table);
        const newHiddenMap: Record<string, boolean> = {};
        for(let i=1; i<=10; i++) {
            newHiddenMap[getKey(op, table, i, 'a')] = targetState;
            newHiddenMap[getKey(op, table, i, 'b')] = targetState;
            newHiddenMap[getKey(op, table, i, 'res')] = targetState;
        }
        setHiddenNumbers(prev => ({...prev, ...newHiddenMap}));
        SOUNDS.click();
    };

    const toggleAllNumbersInOp = (op: 'mul' | 'div', hide: boolean) => {
        const newHiddenMap: Record<string, boolean> = { ...hiddenNumbers };
        for (let t = 2; t <= 9; t++) {
            for (let r = 1; r <= 10; r++) {
                newHiddenMap[getKey(op, t, r, 'a')] = hide;
                newHiddenMap[getKey(op, t, r, 'b')] = hide;
                newHiddenMap[getKey(op, t, r, 'res')] = hide;
            }
        }
        setHiddenNumbers(newHiddenMap);
        SOUNDS.click();
    };

    const toggleAllTablesInOp = (op: 'mul' | 'div', show: boolean) => {
        if (show) {
            const allOfOp = Array.from({ length: 8 }, (_, i) => `${op}-${i + 2}`);
            setVisibleTables(prev => {
                const filtered = prev.filter(k => !k.startsWith(op));
                return [...filtered, ...allOfOp];
            });
        } else {
            setVisibleTables(prev => prev.filter(k => !k.startsWith(op)));
        }
        SOUNDS.click();
    };

    const playAudioSource = async (source: string, isUrl: boolean, onStart: () => void, onEnd: () => void) => {
        try {
            stopCurrentAudio();
            onStart();
            if (isUrl) {
                const audio = new Audio();
                audio.src = source;
                audioRef.current = audio;
                audio.onended = () => {
                    audioRef.current = null;
                    onEnd();
                };
                audio.onerror = (e) => {
                    if (audioRef.current === audio) {
                        console.warn("Audio playback failed. Please check network or file link.", e);
                        audioRef.current = null;
                        onEnd();
                    }
                };
                try {
                    await audio.play();
                } catch (playErr) {
                    if (audioRef.current === audio) {
                        console.warn("Autoplay was prevented or playback failed:", playErr);
                        onEnd();
                    }
                }
            } else {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                audioCtxRef.current = audioCtx;
                const audioBuffer = await decodeAudioData(decode(source), audioCtx, 24000, 1);
                const audioSource = audioCtx.createBufferSource();
                sourceRef.current = audioSource;
                audioSource.buffer = audioBuffer;
                audioSource.connect(audioCtx.destination);
                audioSource.onended = () => {
                    if (sourceRef.current === audioSource) {
                        sourceRef.current = null;
                        onEnd();
                    }
                    if (audioCtx.state !== 'closed') audioCtx.close().catch(() => {});
                    if (audioCtxRef.current === audioCtx) audioCtxRef.current = null;
                };
                audioSource.start();
            }
        } catch (err) {
            console.error("Audio system error:", err);
            onEnd();
        }
    };

    const handleReadTable = async (num: number, op: 'mul' | 'div') => {
        const tableKey = `${op}-${num}`;
        if (readingTable === tableKey) {
            stopCurrentAudio();
            return;
        }
        const customAudio = await getAudio(tableKey);
        if (customAudio) {
            await playAudioSource(customAudio, false, () => setReadingTable(tableKey), () => setReadingTable(null));
            return;
        }
        if (EXTERNAL_AUDIOS[tableKey]) {
            await playAudioSource(EXTERNAL_AUDIOS[tableKey], true, () => setReadingTable(tableKey), () => setReadingTable(null));
            return;
        }
        alert("Bảng tính này chưa có tệp âm thanh.");
    };

    useEffect(() => {
        setDivStep(0);
        setBigEqVisible({ a: false, b: false, res: false, addRes: false });
        if (showIllustration) SOUNDS.correct();
    }, [activeRow, selectedTable, operation, isSwapped]);

    useEffect(() => {
        if (showIllustration) {
            toggleTableVisibility(operation, selectedTable);
            const newHidden: Record<string, boolean> = {};
            for(let i=1; i<=10; i++) {
                newHidden[`${operation}-${selectedTable}-${i}-a`] = true;
                newHidden[`${operation}-${selectedTable}-${i}-b`] = true;
                newHidden[`${operation}-${selectedTable}-${i}-res`] = true;
            }
            setHiddenNumbers(prev => ({...prev, ...newHidden}));
        } else {
            if (!visibleTables.includes(`${operation}-${selectedTable}`)) {
                 if (visibleTables.length === 0) setVisibleTables([`${operation}-${selectedTable}`]);
            }
        }
    }, [showIllustration]);

    const handleTableSelection = (num: number, op: 'mul' | 'div') => {
        const key = `${op}-${num}`;
        
        if (showIllustration) {
            // Trong chế độ minh họa: Nhấn vào bảng đang chọn sẽ ẩn minh họa
            if (selectedTable === num && operation === op) {
                setShowIllustration(false);
            } else {
                setSelectedTable(num);
                setOperation(op);
                setActiveRow(1);
                if (activeMobileTab === 2) setActiveMobileTab(1);
            }
        } else {
            // Trong chế độ lưới: Nhấn để toggle hiển thị
            setVisibleTables(prev => {
                if (prev.includes(key)) return prev.filter(k => k !== key);
                return [...prev, key];
            });
            setSelectedTable(num);
            setOperation(op);
            setActiveRow(1);
            if (activeMobileTab === 1) setActiveMobileTab(0);
        }
        SOUNDS.click();
    };

    const handleTakeStars = () => {
        const resultVal = operation === 'mul' ? (selectedTable * activeRow) : activeRow;
        if (divStep < resultVal) {
            setDivStep(prev => prev + 1);
            SOUNDS.correct();
            if (window.confetti) window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
    };

    const valA_ = operation === 'mul' ? selectedTable : (selectedTable * activeRow);
    const valB_ = operation === 'mul' ? activeRow : selectedTable;
    const result_ = operation === 'mul' ? (valA_ * valB_) : activeRow;
    const displayValA = isSwapped && operation === 'mul' ? valB_ : valA_;
    const displayValB = isSwapped && operation === 'mul' ? valA_ : valB_;

    // Helpers to check current toggle states for the right sidebar
    const isOpAllSelected = (op: 'mul' | 'div') => [2,3,4,5,6,7,8,9].every(n => visibleTables.includes(`${op}-${n}`));
    const isOpAnyNumberVisible = (op: 'mul' | 'div') => {
        for (let t = 2; t <= 9; t++) {
            for (let r = 1; r <= 10; r++) {
                if (!hiddenNumbers[getKey(op, t, r, 'a')] || 
                    !hiddenNumbers[getKey(op, t, r, 'b')] || 
                    !hiddenNumbers[getKey(op, t, r, 'res')]) return true;
            }
        }
        return false;
    };

    const renderTableCard = (num: number, op: 'mul' | 'div', isMultiView = false) => {
        const isHidden = isTableFullyHidden(op, num);
        const isReadingThisTable = readingTable === `${op}-${num}`;
        const cardWidthClass = isFullscreen && showIllustration ? 'lg:w-[240px] xl:w-[280px]' : (isFullscreen ? 'lg:w-[260px] xl:w-[300px]' : 'lg:w-[230px] xl:w-[280px]');
        const cardClass = `glass-panel rounded-xl sm:rounded-3xl flex flex-col overflow-hidden border-b-[8px] border-white/20 transition-all duration-300 w-full ${cardWidthClass} h-fit ${isMultiView ? 'hover:scale-[1.03] hover:shadow-2xl' : ''}`;
        const headerPadding = isFullscreen ? 'p-1.5 sm:p-2 2xl:p-2.5' : 'p-1 sm:p-1.5 2xl:p-2';
        const titleSize = isFullscreen ? 'text-lg sm:text-xl 2xl:text-2xl' : 'text-[12px] sm:text-base 2xl:text-xl';
        const btnBase = isFullscreen ? 'w-10 sm:w-14 2xl:w-16 h-8 sm:h-12 2xl:h-14 flex items-center justify-center' : 'w-9 sm:w-12 2xl:w-16 h-8 sm:h-10 2xl:h-14 flex items-center justify-center';
        const numTextSize = isFullscreen ? 'text-xl sm:text-2xl 2xl:text-4xl' : 'text-base sm:text-xl 2xl:text-3xl';
        const opSize = isFullscreen ? 'text-xl sm:text-2xl 2xl:text-3xl' : 'text-base sm:text-xl 2xl:text-2xl';
        const rowPadding = isFullscreen ? 'py-1 px-1 sm:px-2 2xl:py-2' : 'py-0.5 px-0.5 sm:px-1 2xl:py-1';
        const cA = getColors(op, 'a');
        const cB = getColors(op, 'b');
        const cRes = getColors(op, 'res');
        
        const renderCell = (val: number, isCellHidden: boolean, colors: any, onClick: (e: any) => void) => (
            <button onClick={onClick} className={`${btnBase} ${numTextSize} font-black transition-all hover:scale-110 active:scale-90 ${colors.text} drop-shadow-sm select-none text-num-bold`}>
                {isCellHidden ? <div className={`${isFullscreen ? 'w-6 h-6 sm:w-8 sm:h-8 2xl:w-12 2xl:h-12' : 'w-5 h-5 sm:w-8 sm:h-8 2xl:w-12 2xl:h-12'} bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] sm:text-lg 2xl:text-2xl text-slate-400 shadow-inner`}>?</div> : val}
            </button>
        );

        return (
            <div key={`${op}-${num}`} className={cardClass}>
                <div className={`${headerPadding} border-b border-slate-100 flex justify-between items-center bg-white/60 backdrop-blur-md shrink-0 gap-1.5`}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleTableVisibility(op, num); }} 
                        className={`
                            relative group flex items-center justify-center rounded-2xl transition-all duration-300 
                            hover:scale-110 active:scale-95 shadow-lg border-t border-white/40
                            ${isFullscreen ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-7 h-7 sm:w-8 sm:h-8'}
                            ${isHidden 
                                ? 'bg-gradient-to-br from-slate-400 to-slate-500' 
                                : 'bg-gradient-to-br from-teal-400 to-emerald-500'
                            }
                            text-white overflow-hidden shrink-0
                        `}
                        title={isHidden ? "Hiện tất cả" : "Ẩn tất cả"}
                    >
                        {/* Shine effect inside button */}
                        <div className="absolute inset-x-0 top-0 h-[40%] bg-white/20 rounded-t-2xl pointer-events-none"></div>
                        {isHidden ? (
                            <EyeOff size={isFullscreen ? 18 : 16} strokeWidth={3} className="group-hover:scale-125 transition-transform drop-shadow-md" />
                        ) : (
                            <Eye size={isFullscreen ? 18 : 16} strokeWidth={3} className="group-hover:scale-125 transition-transform drop-shadow-md" />
                        )}
                    </button>
                    <h2 className={`font-baloo font-black ${op === 'mul' ? 'text-blue-700' : 'text-pink-600'} ${titleSize} tracking-tight uppercase flex-1 text-center whitespace-nowrap overflow-hidden text-ellipsis`}>{op === 'mul' ? 'Bảng nhân' : 'Bảng chia'} {num}</h2>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleReadTable(num, op); }}
                        className={`
                            relative group flex items-center justify-center rounded-2xl transition-all duration-300 
                            hover:scale-110 active:scale-95 shadow-lg border-t border-white/40
                            ${isFullscreen ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-7 h-7 sm:w-8 sm:h-8'} 
                            ${op === 'mul' 
                                ? (isReadingThisTable ? 'bg-gradient-to-br from-blue-500 to-indigo-600 ring-4 ring-blue-100' : 'bg-gradient-to-br from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600') 
                                : (isReadingThisTable ? 'bg-gradient-to-br from-pink-500 to-rose-600 ring-4 ring-pink-100' : 'bg-gradient-to-br from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600')
                            }
                            text-white overflow-hidden shrink-0
                        `}
                        title={isReadingThisTable ? "Dừng đọc" : "Đọc bảng tính"}
                    >
                        {/* Shine effect inside button */}
                        <div className="absolute inset-x-0 top-0 h-[40%] bg-white/20 rounded-t-2xl pointer-events-none"></div>
                        
                        {isReadingThisTable && (
                            <>
                                <div className={`absolute inset-0 rounded-2xl ${op === 'mul' ? 'bg-blue-400' : 'bg-pink-400'} animate-sound-ripple -z-10`}></div>
                                <div className={`absolute inset-0 rounded-2xl ${op === 'mul' ? 'bg-blue-300' : 'bg-pink-300'} animate-sound-ripple -z-10`} style={{ animationDelay: '0.5s' }}></div>
                            </>
                        )}
                        
                        {isReadingThisTable ? (
                            <div className="flex items-end gap-1 h-4 w-5 justify-center">
                                <div className="w-1 bg-white rounded-full animate-eq-bar" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-1 bg-white rounded-full animate-eq-bar" style={{ animationDelay: '0.3s' }}></div>
                                <div className="w-1 bg-white rounded-full animate-eq-bar" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        ) : (
                            <Volume2 size={isFullscreen ? 18 : 16} strokeWidth={3} className="group-hover:scale-125 transition-transform group-active:scale-90 drop-shadow-md" />
                        )}
                    </button>
                </div>
                <div className={`${isFullscreen ? 'p-1.5 sm:p-2' : 'p-0.5 sm:p-1'} space-y-0.5 bg-white/30`}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(row => {
                        const a = op === 'mul' ? num : (num * row);
                        const b = op === 'mul' ? row : num;
                        const res = op === 'mul' ? (a * b) : row;
                        const keyA = getKey(op, num, row, 'a');
                        const keyB = getKey(op, num, row, 'b');
                        const keyRes = getKey(op, num, row, 'res');
                        
                        return (
                            <div key={row} onClick={() => { if(showIllustration) { setSelectedTable(num); setOperation(op); setActiveRow(row); } }} className={`flex items-center justify-center gap-0.5 ${rowPadding} rounded-lg border transition-all duration-200 cursor-pointer select-none ${showIllustration && activeRow === row && selectedTable === num && operation === op ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100/50 scale-[1.01] shadow-md' : 'bg-white/60 border-transparent hover:bg-white hover:shadow-sm'}`}>
                                {renderCell(a, !!hiddenNumbers[keyA], cA, (e) => { e.stopPropagation(); toggleCell(op, num, row, 'a'); })}
                                <span className={`w-3 sm:w-6 text-center font-black drop-shadow-sm ${op === 'div' && 'text-pink-600'} ${opSize} text-op`}>{op === 'mul' ? '×' : ':'}</span>
                                {renderCell(b, !!hiddenNumbers[keyB], cB, (e) => { e.stopPropagation(); toggleCell(op, num, row, 'b'); })}
                                <span className={`w-3 sm:w-6 text-center font-black drop-shadow-sm ${opSize} text-op`}>=</span>
                                {renderCell(res, !!hiddenNumbers[keyRes], cRes, (e) => { e.stopPropagation(); toggleCell(op, num, row, 'res'); })}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderBigNumIcon = (isVisible: boolean, val: number | string, colors: any, toggle: () => void) => (
        <div onClick={() => { toggle(); SOUNDS.click(); }} className={`cursor-pointer transition-all flex items-center justify-center ${isFullscreen ? 'min-w-[60px] sm:min-w-[120px] xl:min-w-[160px] 2xl:min-w-[200px]' : 'min-w-[40px] sm:min-w-[80px] xl:min-w-[100px] 2xl:min-w-[140px]'} h-[1.1em] text-center hover:scale-110 ${colors.text} text-num-bold`}>
            {!isVisible ? <div className="w-full h-full bg-white border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xl sm:text-4xl 2xl:text-6xl text-slate-200 shadow-inner">?</div> : <span>{val}</span>}
        </div>
    );

    return (
        <div className={`flex flex-col lg:flex-row h-full w-full pb-2 relative transition-all duration-300 gap-2 sm:gap-4 xl:gap-6 max-w-[1920px] mx-auto`} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            <div className={`flex-col h-full overflow-hidden ${getMobileClass(0)} ${showIllustration ? (isFullscreen ? 'w-full lg:w-[250px] xl:w-[290px] shrink-0' : 'w-full lg:w-[230px] xl:w-[280px] shrink-0') : 'flex-1'}`}>
                {showIllustration && <div className="h-full overflow-y-auto custom-scrollbar pr-1 animate-pop-in">{renderTableCard(selectedTable, operation, false)}</div>}
                {!showIllustration && (
                    <div className="h-full overflow-y-auto custom-scrollbar pb-16 animate-pop-in flex flex-col">
                        <div className={`w-full min-h-full px-2 py-2 ${visibleTables.length === 0 ? 'flex items-center justify-center' : `flex flex-wrap justify-center content-start ${isFullscreen ? 'gap-3 sm:gap-4 xl:gap-6' : 'gap-4 sm:gap-8 xl:gap-12'}`}`}>
                            {visibleTables.length === 0 ? (
                                <div className="text-center text-slate-400 p-8">
                                    <div className="w-16 h-16 bg-white/40 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl animate-bounce"><BookOpen size={32} className="text-slate-300" strokeWidth={3}/></div>
                                    <p className="text-sm sm:text-lg font-baloo font-black text-slate-500">Chưa chọn bảng tính</p>
                                </div>
                            ) : (visibleTables.map(key => { 
                                const [op, numStr] = key.split('-'); 
                                return <div key={key} className="transition-all duration-300 flex justify-center h-fit">{renderTableCard(parseInt(numStr), op as any, true)}</div>; 
                            }))}
                        </div>
                    </div>
                )}
            </div>

            {showIllustration && (
                <div className={`flex-1 min-w-0 h-full flex flex-col animate-pop-in ${getMobileClass(1)}`}>
                     <div className="glass-panel rounded-3xl p-2 sm:p-5 flex flex-col h-full overflow-hidden relative border-2 border-white shadow-xl bg-white/40">
                        <div className="flex justify-between items-center mb-2 shrink-0">
                             <div className={`flex items-center gap-1.5 bg-slate-100/60 p-1 rounded-lg border border-white shadow-inner ${isFullscreen ? 'scale-110 origin-left ml-2 mt-1' : ''}`}>
                                <button onClick={() => { setActiveRow(Math.max(1, activeRow - 1)); SOUNDS.click(); }} className="w-8 h-8 rounded-lg bg-white shadow-md flex items-center justify-center text-slate-600 hover:text-blue-600 active:scale-90 transition font-black text-lg border border-slate-50">-</button>
                                <span className="text-[9px] font-black text-slate-600 w-16 text-center uppercase tracking-tighter">{activeRow} LẦN</span>
                                <button onClick={() => { setActiveRow(Math.min(10, activeRow + 1)); SOUNDS.click(); }} className="w-8 h-8 rounded-lg bg-white shadow-md flex items-center justify-center text-slate-600 hover:text-blue-600 active:scale-90 transition font-black text-lg border border-slate-50">+</button>
                            </div>
                            {operation === 'mul' && <CandyButton color="blue" onClick={() => { setIsSwapped(!isSwapped); SOUNDS.click(); }} className={`${isFullscreen ? 'px-4 py-2 text-base' : 'px-3 py-1.5 text-[10px] xl:text-sm'} uppercase tracking-wider shadow-sm border border-blue-400 rounded-lg`}><ArrowLeftRight size={isFullscreen ? 18 : 14} strokeWidth={3} /> Đổi</CandyButton>}
                        </div>
                        
                        <div className="flex-none flex flex-col items-center justify-center py-1 shrink-0">
                            <div className={`flex items-center gap-1 sm:gap-6 ${isFullscreen ? 'text-3xl sm:text-[3rem] xl:text-[5rem]' : 'text-2xl sm:text-5xl xl:text-[4rem]'} text-slate-800 select-none`}>
                                {renderBigNumIcon(bigEqVisible.a, displayValA, operation === 'mul' ? illColors.a : illColors.res, () => setBigEqVisible(p => ({...p, a: !p.a})))}
                                <span className={operation === 'mul' ? `text-op ${isFullscreen ? 'text-3xl sm:text-[4rem]' : 'text-3xl sm:text-6xl'} text-slate-400 font-black` : `text-op ${isFullscreen ? 'text-3xl sm:text-[4rem]' : 'text-3xl sm:text-6xl'} text-pink-500 font-black`}>{operation === 'mul' ? '×' : ':'}</span>
                                {renderBigNumIcon(bigEqVisible.b, displayValB, operation === 'mul' ? illColors.b : illColors.a, () => setBigEqVisible(p => ({...p, b: !p.b})))}
                                <span className={`text-op ${isFullscreen ? 'text-3xl sm:text-[4rem]' : 'text-3xl sm:text-6xl'} text-slate-400 font-black`}>=</span>
                                {renderBigNumIcon(bigEqVisible.res, result_, operation === 'mul' ? illColors.res : illColors.b, () => setBigEqVisible(p => ({...p, res: !p.res})))}
                            </div>
                            
                            <div className={`mt-2 ${isFullscreen ? 'sm:mt-4' : 'sm:mt-6'} flex flex-col items-center w-full gap-2`}>
                                {operation === 'mul' && (
                                    <div className={`bg-blue-600/10 px-6 py-2 rounded-2xl border-2 border-dashed border-blue-200 flex items-center gap-3 animate-pop-in shadow-sm`}>
                                        <div className="text-num-bold text-xl sm:text-3xl lg:text-4xl text-blue-700 flex items-center gap-1 flex-wrap justify-center">
                                            {Array.from({ length: displayValB }).map((_, i) => (
                                                <React.Fragment key={i}>
                                                    <span>{displayValA}</span>
                                                    {i < displayValB - 1 && <span className="text-slate-400 scale-75">+</span>}
                                                </React.Fragment>
                                            ))}
                                            <span className="text-slate-400 ml-1">=</span>
                                            <button onClick={() => { setBigEqVisible(p => ({...p, addRes: !p.addRes})); SOUNDS.click(); }} className={`ml-1 cursor-pointer transition-all hover:scale-110 flex items-center justify-center min-w-[1.2em]`}>
                                                {!bigEqVisible.addRes ? <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-xl sm:text-2xl text-slate-300 shadow-inner">?</div> : <span className="text-rose-600">{result_}</span>}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className={`px-4 py-1.5 bg-white/95 border-2 border-slate-50 rounded-xl ${isFullscreen ? 'text-base sm:text-xl xl:text-2xl px-8 py-3' : 'text-xs sm:text-lg xl:text-xl'} font-black text-slate-700 shadow-md flex items-center gap-1.5 text-center font-baloo`}>
                                    {operation === 'mul' ? <span><span className={`${illColors.a.text}`}>{displayValA}</span> được lấy <span className={`${illColors.b.text}`}>{displayValB}</span> lần</span> : <span><span className={`${illColors.res.text}`}>{displayValA}</span> ngôi sao chia mỗi nhóm <span className={`${illColors.a.text}`}>{displayValB}</span> ngôi sao, được mấy nhóm?</span>}
                                </div>
                            </div>
                        </div>

                        <div className={`flex-1 mt-2 relative flex flex-col min-h-0 ${operation === 'mul' ? 'bg-gradient-to-b from-slate-50/50 to-white/50 rounded-xl border-2 border-dashed border-slate-200 overflow-y-auto custom-scrollbar p-3 shadow-inner' : 'overflow-hidden'}`}>
                            {operation === 'mul' && (
                                <div className="flex flex-wrap justify-center gap-2 sm:gap-5 w-full">
                                    {Array.from({ length: displayValB }).map((_, gIdx) => (
                                        <div key={gIdx} className={`bg-white ${isFullscreen ? 'p-3 sm:p-5 rounded-2xl' : 'p-2.5 sm:p-5 rounded-xl'} shadow-sm border border-white flex items-center justify-center min-w-[60px] sm:min-w-[120px] relative animate-pop-in hover:scale-105 transition-transform duration-300`}>
                                            <span className={`absolute top-1 left-1 ${isFullscreen ? 'w-6 h-6 sm:w-7 sm:h-7 text-xs' : 'w-4 h-4 sm:w-6 sm:h-6 text-[8px]'} ${illColors.b.text.replace('text', 'bg')} bg-opacity-70 text-white rounded-md flex items-center justify-center font-black shadow-sm z-10`}>{gIdx + 1}</span>
                                            <div className={`flex gap-1 justify-center flex-wrap ${isFullscreen ? 'max-w-[140px]' : 'max-w-[100px]'}`}>
                                                {Array.from({ length: displayValA }).map((_, iIdx) => (
                                                    <Star 
                                                        key={iIdx} 
                                                        className={`animate-star-pop ${isFullscreen ? 'w-6 h-6 sm:w-8 h-8' : 'w-4 h-4 sm:w-8 sm:h-8'} text-yellow-500 fill-yellow-500`} 
                                                        strokeWidth={4} 
                                                        style={{ animationDelay: `${(gIdx * 0.1) + (iIdx * 0.04)}s` }} 
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {operation === 'div' && (
                                <div className="flex flex-col h-full w-full gap-2 overflow-hidden">
                                    <div className={`shrink-0 bg-blue-100/60 rounded-xl border-2 border-blue-200 shadow-sm ${isFullscreen ? 'p-4 sm:p-6' : 'p-3 sm:p-5'} relative min-h-[100px] backdrop-blur-sm transition-all duration-500`}>
                                        <span className={`absolute top-0 right-0 bg-blue-700 text-white ${isFullscreen ? 'text-base px-3 py-1.5' : 'text-[8px] px-2 py-1'} font-black rounded-bl-xl uppercase z-10`}>Đã chia: {divStep} nhóm</span>
                                        <div className="flex flex-wrap justify-center gap-3 mt-3 content-start">
                                            {Array.from({ length: divStep }).map((_, gIdx) => (
                                                <div key={gIdx} className={`bg-white ${isFullscreen ? 'p-3 sm:p-4 rounded-2xl' : 'p-3 sm:p-4 rounded-xl'} shadow-sm border border-white flex items-center justify-center min-w-[70px] sm:min-w-[90px] relative animate-star-pop hover:scale-110 transition-transform duration-300`}>
                                                    <span className={`absolute top-1 left-1 ${isFullscreen ? 'w-6 h-6 sm:w-7 sm:h-7 text-xs' : 'w-4 h-4 sm:w-6 sm:h-6 text-[8px]'} ${illColors.b.text.replace('text', 'bg')} bg-opacity-70 text-white rounded-md flex items-center justify-center font-black shadow-sm z-10`}>{gIdx + 1}</span>
                                                    <div className="flex gap-1.5 justify-center flex-wrap">
                                                        {Array.from({ length: selectedTable }).map((_, iIdx) => (
                                                            <Star 
                                                                key={iIdx} 
                                                                className={`animate-star-pop ${isFullscreen ? 'w-6 h-6 sm:w-8 h-8' : 'w-5 h-5 sm:w-7 sm:h-7'} text-yellow-500 fill-yellow-500`} 
                                                                strokeWidth={4} 
                                                                style={{ animationDelay: `${iIdx * 0.04}s` }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex justify-center"> 
                                        {divStep < activeRow ? <CandyButton color="pink" onClick={handleTakeStars} className={`${isFullscreen ? 'px-6 py-3 text-lg' : 'px-5 py-2 text-[11px] sm:text-lg'} gap-2 shadow-md border border-pink-400 rounded-xl group`}>Lấy {selectedTable} sao <Star size={isFullscreen ? 24 : 16} fill="currentColor" strokeWidth={3} className="animate-pulse group-hover:scale-125 transition-transform" /></CandyButton> : <div className={`bg-emerald-600 text-white ${isFullscreen ? 'px-8 py-3 text-lg' : 'px-6 py-2 text-xs'} rounded-xl font-black shadow-sm flex items-center gap-2 animate-pop-in`}><CheckCircle size={isFullscreen ? 24 : 18} strokeWidth={4} /> Xong!</div>}
                                    </div>
                                    <div className="flex-1 min-h-0 bg-rose-50/50 border-2 border-rose-100 shadow-inner rounded-xl p-3 relative overflow-y-auto custom-scrollbar flex flex-col justify-end transition-all duration-500">
                                        <span className={`absolute top-1 right-1 ${isFullscreen ? 'w-10 h-10 text-lg' : 'w-8 h-8 text-xs'} bg-rose-600 text-white font-black rounded-full shadow-sm flex items-center justify-center z-10`}>{(selectedTable * activeRow) - (divStep * selectedTable)}</span>
                                        <div className="flex flex-wrap justify-center gap-2 mt-1 content-end">
                                            {Array.from({ length: (selectedTable * activeRow) - (divStep * selectedTable) }).map((_, i) => (
                                                <Star 
                                                    key={i} 
                                                    className={`animate-star-pop animate-star-idle ${isFullscreen ? 'w-6 h-6 sm:w-8 h-8' : 'w-5 h-5 sm:w-7 sm:h-7'} text-yellow-500 fill-yellow-500`} 
                                                    strokeWidth={4} 
                                                    style={{ animationDelay: `${i * 0.015}s` }}
                                                />
                                            ))}
                                            {(selectedTable * activeRow) - (divStep * selectedTable) === 0 && <span className={`${isFullscreen ? 'text-xl py-4' : 'text-sm py-2'} text-slate-600 font-black bg-white/70 px-4 rounded-xl w-full text-center font-baloo animate-pop-in`}>Đã hết sao! ✨</span>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* CỘT PHẢI: Điều khiển / Chọn bảng */}
            <div className={`flex-col gap-2 shrink-0 animate-pop-in ${getMobileClass(showIllustration ? 2 : 1)} w-full lg:w-[210px] xl:w-[250px] h-fit lg:h-full lg:max-h-full overflow-y-auto lg:overflow-y-auto custom-scrollbar pt-1 pr-1 pb-20 lg:pb-0`}>
                <div className="flex flex-col gap-1.5 shrink-0 mb-1">
                    <CandyButton onClick={() => { setShowIllustration(!showIllustration); SOUNDS.click(); }} color={showIllustration ? 'orange' : 'green'} className="w-full py-3 text-sm sm:text-base shadow-sm border-b-4 uppercase rounded-xl">
                        {showIllustration ? <><EyeOff size={16} className="mr-1.5" /> Ẩn mẫu</> : <><Wand2 size={16} className="mr-1.5" /> Minh họa mẫu</>}
                    </CandyButton>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="glass-panel rounded-2xl p-2.5 border border-white shadow-sm bg-white/60 w-full">
                        <div className="flex items-center justify-between mb-2 bg-blue-50/80 py-1 px-2 rounded-lg">
                            <h3 className="text-[10px] font-black text-blue-700 uppercase leading-none">Bảng nhân</h3>
                            {!showIllustration && (
                                <div className="flex gap-2">
                                    {/* Combined Selection Toggle for Mul */}
                                    <button 
                                        title={isOpAllSelected('mul') ? "Bỏ chọn tất cả" : "Chọn tất cả bảng"} 
                                        onClick={() => toggleAllTablesInOp('mul', !isOpAllSelected('mul'))} 
                                        className="text-blue-500 hover:text-blue-700 transition-colors hover:scale-125 transition-transform"
                                    >
                                        {isOpAllSelected('mul') ? <Square size={14} strokeWidth={3} /> : <CheckSquare size={14} strokeWidth={3} />}
                                    </button>
                                    <span className="w-[1px] h-3 bg-slate-300 mx-0.5"></span>
                                    {/* Combined Visibility Toggle for Mul */}
                                    <button 
                                        title={isOpAnyNumberVisible('mul') ? "Ẩn tất cả kết quả" : "Hiện tất cả kết quả"} 
                                        onClick={() => toggleAllNumbersInOp('mul', isOpAnyNumberVisible('mul'))} 
                                        className="text-blue-500 hover:text-blue-700 transition-colors hover:scale-125 transition-transform"
                                    >
                                        {isOpAnyNumberVisible('mul') ? <EyeOff size={14} strokeWidth={3} /> : <Eye size={14} strokeWidth={3} />}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {[2,3,4,5,6,7,8,9].map((num, idx) => {
                                const isSelectedInIll = showIllustration && selectedTable === num && operation === 'mul';
                                const isVisibleInGrid = !showIllustration && visibleTables.includes(`mul-${num}`);
                                const isActive = isSelectedInIll || isVisibleInGrid;

                                return (
                                    <button 
                                        key={`mul-${num}`} 
                                        onClick={() => handleTableSelection(num, 'mul')} 
                                        style={{ animationDelay: `${idx * 0.05}s` }}
                                        className={`
                                            relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl text-xl font-black transition-all duration-200 
                                            flex items-center justify-center border-b-4 active:translate-y-1 active:border-b-0
                                            animate-pop-in group
                                            ${isActive ? 
                                                'bg-blue-600 border-blue-800 text-white shadow-[0_4px_0_0_#1e40af] translate-y-1 border-b-0 scale-95 z-10' : 
                                                'bg-white border-slate-100 text-slate-500 hover:border-blue-200 hover:text-blue-500 hover:-translate-y-1 shadow-sm'
                                            }
                                        `}
                                    >
                                        <span className="font-baloo drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]">{num}</span>
                                        <div className="absolute inset-x-0 top-0 h-1/3 bg-white/20 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="glass-panel rounded-2xl p-2.5 border border-white shadow-sm bg-white/60 w-full">
                        <div className="flex items-center justify-between mb-2 bg-pink-50/80 py-1 px-2 rounded-lg">
                            <h3 className="text-[10px] font-black text-pink-700 uppercase leading-none">Bảng chia</h3>
                            {!showIllustration && (
                                <div className="flex gap-2">
                                    {/* Combined Selection Toggle for Div */}
                                    <button 
                                        title={isOpAllSelected('div') ? "Bỏ chọn tất cả" : "Chọn tất cả bảng"} 
                                        onClick={() => toggleAllTablesInOp('div', !isOpAllSelected('div'))} 
                                        className="text-pink-500 hover:text-pink-700 transition-colors hover:scale-125 transition-transform"
                                    >
                                        {isOpAllSelected('div') ? <Square size={14} strokeWidth={3} /> : <CheckSquare size={14} strokeWidth={3} />}
                                    </button>
                                    <span className="w-[1px] h-3 bg-slate-300 mx-0.5"></span>
                                    {/* Combined Visibility Toggle for Div */}
                                    <button 
                                        title={isOpAnyNumberVisible('div') ? "Ẩn tất cả kết quả" : "Hiện tất cả kết quả"} 
                                        onClick={() => toggleAllNumbersInOp('div', isOpAnyNumberVisible('div'))} 
                                        className="text-pink-500 hover:text-pink-700 transition-colors hover:scale-125 transition-transform"
                                    >
                                        {isOpAnyNumberVisible('div') ? <EyeOff size={14} strokeWidth={3} /> : <Eye size={14} strokeWidth={3} />}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {[2,3,4,5,6,7,8,9].map((num, idx) => {
                                const isSelectedInIll = showIllustration && selectedTable === num && operation === 'div';
                                const isVisibleInGrid = !showIllustration && visibleTables.includes(`div-${num}`);
                                const isActive = isSelectedInIll || isVisibleInGrid;

                                return (
                                    <button 
                                        key={`div-${num}`} 
                                        onClick={() => handleTableSelection(num, 'div')} 
                                        style={{ animationDelay: `${idx * 0.05 + 0.1}s` }}
                                        className={`
                                            relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl text-xl font-black transition-all duration-200 
                                            flex items-center justify-center border-b-4 active:translate-y-1 active:border-b-0
                                            animate-pop-in group
                                            ${isActive ? 
                                                'bg-pink-600 border-pink-800 text-white shadow-[0_4px_0_0_#be185d] translate-y-1 border-b-0 scale-95 z-10' : 
                                                'bg-white border-slate-100 text-slate-500 hover:border-pink-200 hover:text-pink-500 hover:-translate-y-1 shadow-sm'
                                            }
                                        `}
                                    >
                                        <span className="font-baloo drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]">{num}</span>
                                        <div className="absolute inset-x-0 top-0 h-1/3 bg-white/20 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Bar */}
            <div className="lg:hidden absolute bottom-4 left-0 right-0 flex justify-center px-4 z-[60] pointer-events-none">
                 <div className="pointer-events-auto bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_10px_40px_rgba(0,0,0,0.15)] rounded-full px-2 py-1.5 flex items-center gap-3 animate-tab-enter border-b-4">
                    <button disabled={activeMobileTab === 0} onClick={() => handleMobileNav('prev')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activeMobileTab === 0 ? 'text-slate-200' : 'text-blue-600 bg-blue-50/50 hover:bg-blue-100 active:scale-90 shadow-sm border border-blue-100'}`}><ChevronLeft size={24} strokeWidth={3} /></button>
                    <div className="flex gap-1.5">{Array.from({ length: maxMobileTab + 1 }).map((_, idx) => <button key={idx} onClick={() => setActiveMobileTab(idx)} className={`transition-all duration-300 rounded-full ${activeMobileTab === idx ? 'w-8 h-2.5 bg-blue-600' : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'}`} />)}</div>
                    <button disabled={activeMobileTab === maxMobileTab} onClick={() => handleMobileNav('next')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activeMobileTab === maxMobileTab ? 'text-slate-200' : 'text-blue-600 bg-blue-50/50 hover:bg-blue-100 active:scale-90 shadow-sm border border-blue-100'}`}><ChevronRight size={24} strokeWidth={3} /></button>
                 </div>
            </div>
        </div>
    );
};
