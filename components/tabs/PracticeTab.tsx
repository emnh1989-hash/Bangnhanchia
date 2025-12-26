import React, { useState, useEffect, useCallback } from 'react';
import { X, Star, CheckCircle, XCircle, ChevronRight, Check, User as UserIcon, Settings2, Sparkles, ArrowRight, Play, Trophy, Divide, Plus, Minus, Calculator, Gamepad2, GraduationCap } from 'lucide-react';
import { CandyButton } from '../ui/CandyButton';
import { User, QuestionConfig, Question, QuestionResult } from '../../types';
import { SOUNDS } from '../../utils/audioUtils';

interface PracticeTabProps {
    user: User;
    onUpdateUser: (user: User) => void;
}

export const PracticeTab: React.FC<PracticeTabProps> = ({ user, onUpdateUser }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [config, setConfig] = useState<QuestionConfig>({ 
        startTable: 2, 
        endTable: 9, 
        difficulty: 'medium', 
        questionCount: 10, 
        operations: ['mul', 'div'], 
        questionTypes: ['calc', 'missing', 'compare', 'tf', 'sign', 'word'] 
    });
    const [currentQ, setCurrentQ] = useState<Question | null>(null);
    const [score, setScore] = useState(0);
    const [totalQ, setTotalQ] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
    const [sessionResults, setSessionResults] = useState<QuestionResult[]>([]);

    const generateQuestion = useCallback(() => {
        setFeedback(null); 
        setInputValue("");
        setSelectedAnswer(null);
        const table = Math.floor(Math.random() * (config.endTable - config.startTable + 1)) + config.startTable;
        const multiplier = Math.floor(Math.random() * 9) + 2;
        
        const op = config.operations[Math.floor(Math.random() * config.operations.length)];
        const availableTypes = config.questionTypes;
        const type = availableTypes.length > 0 ? availableTypes[Math.floor(Math.random() * availableTypes.length)] : 'calc';
        
        const qData: Question = { type: type, operator: op === 'mul' ? '×' : ':', valA: 0, valB: 0, correct: 0 };
        
        if (op === 'mul') { 
            qData.valA = table; qData.valB = multiplier; qData.correct = table * multiplier; 
        } else { 
            const product = table * multiplier; qData.valA = product; qData.valB = table; qData.correct = multiplier; 
        }

        if (type === 'calc') {
            qData.display = { left: qData.valA, right: qData.valB, unknown: 'result' };
        } 
        else if (type === 'missing') {
            const missingPos = Math.random() > 0.5 ? 'left' : 'right';
            qData.display = { left: missingPos === 'left' ? '?' : qData.valA, right: missingPos === 'right' ? '?' : qData.valB, unknown: missingPos, result: qData.correct };
            if (op === 'mul') qData.correct = missingPos === 'left' ? qData.valA : qData.valB; 
            else { if (missingPos === 'left') qData.correct = qData.valA; else qData.correct = qData.valB; }
        }
        else if (type === 'compare') {
            let offset = Math.floor(Math.random() * 5) - 2; 
            let compareVal = (qData.correct as number) + offset; 
            if (compareVal <= 0) compareVal = (qData.correct as number) + Math.abs(offset) + 1;
            qData.compareVal = compareVal;
            if ((qData.correct as number) > compareVal) qData.correct = '>'; 
            else if ((qData.correct as number) < compareVal) qData.correct = '<'; 
            else qData.correct = '=';
        }
        else if (type === 'tf') {
            const isTrue = Math.random() > 0.5; 
            let offset = isTrue ? 0 : (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 5 + 1);
            let displayVal = (qData.correct as number) + offset;
            if (displayVal <= 0) displayVal = Math.max(1, (qData.correct as number) + Math.abs(offset));
            qData.displayAnswer = displayVal; 
            qData.correct = isTrue; 
        }
        else if (type === 'mcq') {
            const answers = new Set([qData.correct]); 
            while(answers.size < 4) { 
                const wrong = (qData.correct as number) + Math.floor(Math.random() * 10) - 5; 
                if(wrong > 0 && wrong !== qData.correct) answers.add(wrong); 
            }
            qData.options = Array.from(answers).sort(() => Math.random() - 0.5);
        }
        else if (type === 'sign') {
            qData.correct = qData.operator;
        }
        else if (type === 'word') {
            if (op === 'mul') {
                const templates = [
                    { t: "Mỗi hộp có {B} cái kẹo. Hỏi {A} hộp như vậy có tất cả bao nhiêu cái kẹo?", a: qData.correct },
                    { t: "Lớp học có {A} tổ, mỗi tổ {B} bạn. Hỏi lớp có tất cả bao nhiêu bạn?", a: qData.correct }
                ];
                const tpl = templates[Math.floor(Math.random() * templates.length)];
                qData.questionText = tpl.t.replace('{A}', String(qData.valA)).replace('{B}', String(qData.valB));
            } else {
                const templates = [
                    { t: "Có {A} quả táo chia đều cho {B} bạn. Hỏi mỗi bạn được mấy quả?", a: qData.correct },
                    { t: "Có {A} bông hoa cắm đều vào {B} lọ. Hỏi mỗi lọ có mấy bông?", a: qData.correct }
                ];
                const tpl = templates[Math.floor(Math.random() * templates.length)];
                qData.questionText = tpl.t.replace('{A}', String(qData.valA)).replace('{B}', String(qData.valB));
            }
        }
        setCurrentQ(qData);
    }, [config]);

    useEffect(() => { 
        if (isPlaying && !currentQ) {
            setSessionResults([]);
            generateQuestion(); 
        }
    }, [isPlaying, currentQ, generateQuestion]);

    const toggleConfigArray = (key: keyof QuestionConfig, value: any) => {
        setConfig(prev => { 
            const list = prev[key] as any[]; 
            if (list.includes(value)) { 
                if (list.length === 1) return prev; 
                return { ...prev, [key]: list.filter(i => i !== value) }; 
            } 
            return { ...prev, [key]: [...list, value] }; 
        });
    };

    const finishSession = (finalScore?: number, finalTotal?: number, finalResults?: QuestionResult[]) => {
        const s = finalScore ?? score;
        const t = finalTotal ?? totalQ;
        const res = finalResults ?? sessionResults;
        const historyItem = { date: new Date().toISOString(), score: s, questions: t, config: config, userName: user.name || 'Em', results: res };
        const cleanHistoryItem = JSON.parse(JSON.stringify(historyItem));
        const existing = JSON.parse(localStorage.getItem('math_history') || '[]');
        existing.unshift(cleanHistoryItem);
        localStorage.setItem('math_history', JSON.stringify(existing));
        setIsPlaying(false); setScore(0); setTotalQ(0); setCurrentQ(null); setSelectedAnswer(null); setSessionResults([]);
        onUpdateUser({ ...user, name: '' });
    };

    const handleAnswer = (ans: any) => {
        if (feedback || !currentQ || (ans === "" && currentQ.type !== 'mcq' && currentQ.type !== 'tf' && currentQ.type !== 'compare' && currentQ.type !== 'sign')) return;
        setSelectedAnswer(ans);
        let isCorrect = (currentQ.type === 'sign' ? ans === currentQ.operator : (currentQ.type === 'mcq' || currentQ.type === 'tf' || currentQ.type === 'compare' ? ans === currentQ.correct : Number(ans) === currentQ.correct)); 
        const newTotal = totalQ + 1;
        setTotalQ(newTotal);
        const newResult: QuestionResult = { question: { ...currentQ }, userAnswer: ans, isCorrect: isCorrect };
        const newSessionResults = [...sessionResults, newResult];
        setSessionResults(newSessionResults);
        if (isCorrect) { 
            const newScore = score + 10;
            setScore(newScore);
            setFeedback('correct'); 
            if (window.confetti) window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            SOUNDS.correct(); 
            if (newTotal >= config.questionCount) setTimeout(() => finishSession(newScore, newTotal, newSessionResults), 2000); 
            else setTimeout(() => generateQuestion(), 2000);
        } else { setFeedback('incorrect'); SOUNDS.incorrect(); }
    };

    const handleNext = () => totalQ >= config.questionCount ? finishSession(score, totalQ, sessionResults) : generateQuestion();

    const getButtonColor = (val: any) => {
        if (!feedback) return 'white';
        if (selectedAnswer === val) return feedback === 'correct' ? 'green' : 'red';
        if (feedback === 'incorrect' && (val === currentQ?.correct || (currentQ?.type === 'sign' && val === currentQ?.operator))) return 'green';
        return 'white';
    };

    const panelStyle = "bg-white rounded-[24px] border-b-[4px] border-slate-200 shadow-lg relative overflow-hidden transition-all border border-slate-100";
    const insetInputStyle = "w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 font-black text-slate-800 outline-none focus:bg-white focus:border-blue-400 transition-all placeholder-slate-300 text-xl shadow-inner";

    if (!user.name || !isPlaying) return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar p-2 sm:p-4">
            <div className="min-h-full flex items-start sm:items-center justify-center w-full">
                <div className="w-full max-w-3xl flex flex-col h-auto bg-white/40 backdrop-blur-md rounded-[32px] border-2 border-white shadow-xl overflow-hidden relative">
                    <div className="text-center py-4 bg-white/60 border-b border-white shrink-0 z-20 shadow-sm">
                        <h2 className="text-xl sm:text-3xl font-baloo font-black text-slate-700 flex items-center justify-center gap-3">
                            <div className="p-2 sm:p-2.5 bg-blue-500 rounded-xl text-white shadow-md border border-blue-400">
                                <Gamepad2 size={24} className="sm:w-8 sm:h-8" strokeWidth={3}/>
                            </div>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-purple-700 drop-shadow-sm uppercase tracking-tight text-lg sm:text-2xl">Luyện tập cùng em</span>
                        </h2>
                    </div>
                    
                    <div className="p-3 sm:p-5 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* PHẦN THÔNG TIN */}
                            <div className={`${panelStyle} p-3 sm:p-4 flex flex-col justify-center border-t-2 border-blue-100`}>
                                <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><UserIcon size={20} strokeWidth={3}/></div>
                                    <h3 className="font-baloo font-black text-slate-600 text-sm sm:text-base uppercase tracking-wider">Thông tin</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <input type="text" value={user.name} onChange={(e) => onUpdateUser({...user, name: e.target.value})} className={insetInputStyle} placeholder="Họ và tên..." />
                                        {user.name && <CheckCircle size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" strokeWidth={3} />}
                                    </div>
                                    <input type="text" value={user.class} onChange={(e) => onUpdateUser({...user, class: e.target.value})} className={insetInputStyle} placeholder="Lớp học..." />
                                </div>
                            </div>

                            {/* PHẦN CHỌN BẢNG */}
                            <div className={`${panelStyle} p-3 sm:p-4 bg-gradient-to-br from-white to-indigo-50/20 border-t-2 border-indigo-100`}>
                                <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
                                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><GraduationCap size={20} strokeWidth={3}/></div>
                                    <h3 className="font-baloo font-black text-slate-600 text-sm sm:text-base uppercase tracking-wider">Chọn bảng</h3>
                                </div>
                                <div className="flex items-center justify-between gap-2 bg-white/90 rounded-xl p-2.5 sm:p-3 border-2 border-indigo-50 shadow-inner">
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs sm:text-sm font-black text-slate-400 uppercase mb-0.5">Từ</span>
                                        <select value={config.startTable} onChange={(e) => setConfig({...config, startTable: Number(e.target.value)})} className="text-num-bold font-black text-2xl sm:text-3xl bg-transparent text-blue-600 outline-none appearance-none cursor-pointer hover:scale-110 transition-transform">{[2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}</option>)}</select>
                                    </div>
                                    <ArrowRight size={24} className="text-slate-200 stroke-[5px]" />
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs sm:text-sm font-black text-slate-400 uppercase mb-0.5">Đến</span>
                                        <select value={config.endTable} onChange={(e) => setConfig({...config, endTable: Number(e.target.value)})} className="text-num-bold font-black text-2xl sm:text-3xl bg-transparent text-purple-600 outline-none appearance-none cursor-pointer hover:scale-110 transition-transform">{[2,3,4,5,6,7,8,9].filter(n => n >= config.startTable).map(n => <option key={n} value={n}>{n}</option>)}</select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    <CandyButton onClick={() => toggleConfigArray('operations', 'mul')} color={config.operations.includes('mul') ? 'blue' : 'white'} className={`py-2 text-xl sm:text-2xl ${config.operations.includes('mul') ? 'shadow-inner border-2 border-blue-400' : 'opacity-60 saturate-0 grayscale'}`}>× Nhân</CandyButton>
                                    <CandyButton onClick={() => toggleConfigArray('operations', 'div')} color={config.operations.includes('div') ? 'pink' : 'white'} className={`py-2 text-xl sm:text-2xl ${config.operations.includes('div') ? 'pink' : 'white'} ${config.operations.includes('div') ? 'shadow-inner border-2 border-pink-400' : 'opacity-60 saturate-0 grayscale'}`}>: Chia</CandyButton>
                                </div>
                            </div>
                        </div>

                        {/* PHẦN TÙY CHỈNH */}
                        <div className={`${panelStyle} p-3 sm:p-4 border-t-2 border-orange-100`}>
                             <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
                                <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Trophy size={20} strokeWidth={3}/></div>
                                <h3 className="font-baloo font-black text-slate-600 text-sm sm:text-base uppercase tracking-wider">Tùy chỉnh</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Sparkles size={14}/> Độ khó</label>
                                    <div className="flex gap-2">
                                        {[{id: 'easy', l: 'Dễ'}, {id: 'medium', l: 'Vừa'}, {id: 'hard', l: 'Khó'}].map(o => (
                                            <button key={o.id} onClick={() => setConfig({...config, difficulty: o.id as any})} className={`flex-1 py-1.5 sm:py-2 rounded-xl font-black text-sm sm:text-base transition-all border-b-4 active:border-b-0 active:translate-y-1 ${config.difficulty === o.id ? 'bg-blue-600 border-blue-800 text-white shadow-lg scale-105' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-white'}`}>{o.l}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Plus size={14}/> Số câu</label>
                                    <div className="flex gap-2">
                                        {[5, 10, 20].map(c => (
                                            <button key={c} onClick={() => setConfig({...config, questionCount: c})} className={`flex-1 py-1.5 sm:py-2 rounded-xl font-black text-sm sm:text-base transition-all border-b-4 active:border-b-0 active:translate-y-1 ${config.questionCount === c ? 'bg-purple-600 border-purple-800 text-white shadow-lg scale-105' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-white'}`}>{c} câu</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* PHẦN DẠNG BÀI TẬP */}
                            <div className="mt-4">
                                <label className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Dạng bài tập</label>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {[
                                        {id: 'calc', label: 'Tính', i: '🧮'}, 
                                        {id: 'missing', label: 'Điền', i: '❓'}, 
                                        {id: 'compare', label: 'So sánh', i: '⚖️'}, 
                                        {id: 'tf', label: 'Đúng sai', i: '✅'}, 
                                        {id: 'sign', label: 'Dấu', i: '➕'}, 
                                        {id: 'word', label: 'Đố', i: '📖'}
                                    ].map(type => (
                                        <div key={type.id} onClick={() => toggleConfigArray('questionTypes', type.id)} className={`cursor-pointer select-none rounded-xl border-b-[4px] border-r-[1px] p-1.5 sm:p-2 flex flex-col items-center justify-center transition-all active:border-b-0 active:translate-y-1 h-16 sm:h-22 ${config.questionTypes.includes(type.id) ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-indigo-700 shadow-md scale-95' : 'bg-white border-slate-100 hover:bg-slate-50 shadow-sm'}`}>
                                            <span className="text-2xl sm:text-4xl mb-0.5 sm:mb-1 drop-shadow-md">{type.i}</span>
                                            <span className={`text-[9px] sm:text-[11px] font-black uppercase text-center leading-none tracking-tighter ${config.questionTypes.includes(type.id) ? 'text-white' : 'text-slate-500'}`}>{type.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 sm:p-5 bg-white/70 border-t border-white/60 shrink-0 z-20">
                        <CandyButton disabled={!user.name} onClick={() => setIsPlaying(true)} color="green" className={`w-full py-4 text-2xl sm:text-3xl shadow-lg uppercase font-black rounded-2xl hover:translate-y-[-2px] active:translate-y-[4px] border-t-2 border-emerald-300 transition-all pulse-soft ${!user.name ? 'opacity-50' : ''}`}>
                            <Play size={28} strokeWidth={4} className="mr-2 fill-white animate-pulse" /> Bắt Đầu!
                        </CandyButton>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!currentQ) return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div></div>;

    return (
        <div className="h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <div className="w-full max-w-3xl h-full flex flex-col relative max-h-[90dvh]">
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white rounded-[24px] border-b-[4px] border-slate-200 shadow-md shrink-0 z-20">
                    <CandyButton color="white" onClick={() => finishSession()} className="px-3 py-1.5 text-[10px] text-slate-500 gap-1.5 hover:bg-red-50 hover:text-red-500 rounded-xl border border-slate-50 shadow-sm transition-all"><X size={22} strokeWidth={3} /> <span className="font-black uppercase tracking-tight text-lg">Thoát</span></CandyButton>
                    <div className="flex-1 max-w-[240px] flex flex-col gap-1 items-center">
                        <div className="flex justify-between w-full text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            <span>Tiến độ</span>
                            <span>{totalQ + (feedback ? 0 : 1)} / {config.questionCount}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 sm:h-4 p-0.5 shadow-inner border border-slate-200 relative overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 transition-all duration-700 shadow-sm" style={{ width: `${(totalQ / config.questionCount) * 100}%` }}></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1 rounded-xl border-b-[3px] border-orange-200 shadow-sm">
                        <Star className="fill-orange-400 text-orange-500 w-6 h-6 sm:w-8 sm:h-8 animate-float" strokeWidth={3}/> 
                        <span className="text-xl sm:text-2xl font-black text-orange-600 font-baloo">{score}</span>
                    </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 relative w-full overflow-y-auto min-h-0">
                    {feedback && (
                        <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/30 backdrop-blur-md rounded-[32px] animate-pop-in p-4`}>
                            <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-2xl flex flex-col items-center border-b-[8px] border-slate-200 relative overflow-hidden max-w-[340px] w-full border-t-2 border-white">
                                <div className={`relative z-10 p-5 rounded-3xl border-4 border-white shadow-xl mb-4 transform -rotate-3 ${feedback === 'correct' ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {feedback === 'correct' ? <CheckCircle size={72} className="text-white"/> : <XCircle size={72} className="text-white"/>}
                                </div>
                                <h2 className={`relative z-10 text-4xl font-baloo font-black mb-3 text-center drop-shadow-sm ${feedback === 'correct' ? 'text-green-600' : 'text-red-600'}`}>{feedback === 'correct' ? 'CỰC GIỎI!' : 'SAI RỒI!'}</h2>
                                {feedback !== 'correct' && (
                                    <div className="relative z-10 w-full flex flex-col items-center gap-4">
                                        <div className="bg-slate-50 w-full py-4 rounded-xl border-2 border-slate-100 text-center shadow-inner relative">
                                            <p className="text-slate-400 font-black text-[10px] uppercase mb-0.5 tracking-widest">Đáp án đúng</p>
                                            <p className="text-slate-700 font-black text-5xl font-baloo leading-none">{currentQ.type === 'tf' ? (currentQ.correct ? 'ĐÚNG' : 'SAI') : String(currentQ.correct)}</p>
                                        </div>
                                        <CandyButton color="blue" onClick={handleNext} className="w-full py-4 text-2xl shadow-xl flex items-center justify-center gap-3 rounded-xl uppercase tracking-tighter pulse-soft">Tiếp tục <ChevronRight size={28} strokeWidth={4}/></CandyButton>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="w-full max-w-xl bg-white rounded-[32px] border-b-[8px] border-slate-200 shadow-xl mb-4 flex flex-col items-center justify-center min-h-[160px] sm:min-h-[220px] relative z-10 p-5 sm:p-8 overflow-hidden border-t-2 border-slate-50">
                        <div className="absolute inset-3 bg-slate-50/60 rounded-[28px] border border-slate-100 shadow-inner"></div>
                        <div className="relative z-10 w-full flex items-center justify-center">
                            {currentQ.type === 'word' ? (
                                <div className="text-xl sm:text-3xl font-baloo font-black text-slate-700 text-center leading-relaxed px-3 drop-shadow-sm">{currentQ.questionText}</div>
                            ) : (
                                <div className="text-5xl sm:text-7xl lg:text-8xl text-num-bold font-black text-slate-700 text-center flex items-center justify-center flex-wrap gap-2.5 sm:gap-6">
                                    {currentQ.type === 'sign' ? (
                                        <><span className="text-blue-600">{currentQ.valA}</span> <span className="bg-white border-4 border-dashed border-slate-400 rounded-2xl w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center text-slate-500 text-5xl sm:text-7xl mx-1 shadow-inner font-black">?</span> <span className="text-purple-600">{currentQ.valB}</span> <span className="text-slate-500 font-black drop-shadow-sm">=</span> <span className="text-rose-500">{(currentQ.operator === '×' ? (currentQ.valA * currentQ.valB) : (currentQ.valA / currentQ.valB))}</span></>
                                    ) : currentQ.type === 'calc' || currentQ.type === 'mcq' ? (
                                        <><span className="text-blue-600">{currentQ.valA}</span> <span className="text-slate-500 font-black drop-shadow-sm">{currentQ.operator}</span> <span className="text-purple-600">{currentQ.valB}</span> <span className="text-slate-500 font-black drop-shadow-sm">=</span> <span className="text-slate-400 animate-pulse font-black">?</span></>
                                    ) : currentQ.type === 'compare' ? (
                                        <><span className="text-blue-600">{currentQ.valA} <span className="text-slate-500 font-black">{currentQ.operator}</span> {currentQ.valB}</span> <span className="bg-white border-4 border-dashed border-slate-400 rounded-2xl w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center text-slate-500 text-4xl sm:text-6xl mx-1.5 shadow-inner font-black">?</span> <span className="text-slate-500">{currentQ.compareVal}</span></>
                                    ) : currentQ.type === 'tf' ? (
                                        <><span className="text-blue-600">{currentQ.valA} <span className="text-slate-500 font-black">{currentQ.operator}</span> {currentQ.valB}</span> <span className="text-slate-500 mx-2 font-black drop-shadow-sm">=</span> <span className="text-orange-500">{currentQ.displayAnswer}</span></>
                                    ) : (
                                        <><span className={currentQ.display.unknown==='left'?"text-slate-400 animate-pulse font-black":"text-blue-600"}>{currentQ.display.left}</span> <span className="text-slate-500 font-black drop-shadow-sm">{currentQ.operator}</span> <span className={currentQ.display.unknown==='right'?"text-slate-400 animate-pulse font-black":"text-purple-600"}>{currentQ.display.right}</span> <span className="text-slate-500 font-black drop-shadow-sm">=</span> <span className="text-rose-500">{currentQ.display.result}</span></>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="w-full max-w-xl mx-auto mt-auto relative z-20 pb-3">
                        {currentQ.type === 'mcq' ? (
                            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                                {currentQ.options?.map((opt, i) => (<CandyButton key={i} color={getButtonColor(opt)} onClick={() => handleAnswer(opt)} className="py-4 sm:py-5 text-5xl sm:text-7xl h-20 sm:h-28 rounded-2xl shadow-xl border-b-[6px]">{opt}</CandyButton>))}
                            </div>
                        ) : currentQ.type === 'tf' ? (
                            <div className="flex gap-3 sm:gap-4 h-24 sm:h-32 w-full max-w-md mx-auto">
                                <CandyButton color={getButtonColor(true)} onClick={() => handleAnswer(true)} className="flex-1 text-3xl sm:text-5xl shadow-xl rounded-2xl uppercase border-b-[6px] px-2">Đúng ✅</CandyButton>
                                <CandyButton color={getButtonColor(false)} onClick={() => handleAnswer(false)} className="flex-1 text-3xl sm:text-5xl shadow-xl rounded-2xl uppercase border-b-[6px] px-2">Sai ❌</CandyButton>
                            </div>
                        ) : currentQ.type === 'compare' ? (
                            <div className="flex gap-3 sm:gap-4 justify-center h-24 sm:h-32">
                                <CandyButton color={getButtonColor('<')} onClick={() => handleAnswer('<')} className="flex-1 text-6xl sm:text-8xl font-black shadow-xl rounded-2xl border-b-[6px]">&lt;</CandyButton>
                                <CandyButton color={getButtonColor('=')} onClick={() => handleAnswer('=')} className="flex-1 text-6xl sm:text-8xl font-black shadow-xl rounded-2xl border-b-[6px]">=</CandyButton>
                                <CandyButton color={getButtonColor('>')} onClick={() => handleAnswer('>')} className="flex-1 text-6xl sm:text-8xl font-black shadow-xl rounded-2xl border-b-[6px]">&gt;</CandyButton>
                            </div>
                        ) : currentQ.type === 'sign' ? (
                                <div className="flex gap-4 justify-center h-24 sm:h-32 max-w-md mx-auto w-full">
                                    <CandyButton color={getButtonColor('×')} onClick={() => handleAnswer('×')} className="flex-1 text-8xl sm:text-[8rem] shadow-xl rounded-2xl border-b-[6px]">×</CandyButton>
                                    <CandyButton color={getButtonColor(':')} onClick={() => handleAnswer(':')} className="flex-1 text-8xl sm:text-[8rem] shadow-xl rounded-2xl border-b-[6px]">:</CandyButton>
                                </div>
                        ) : (
                            <div className="w-full flex flex-col items-center gap-3">
                                <div className="bg-white/95 p-2 rounded-[28px] border-2 border-white shadow-xl flex items-center gap-3 max-w-[280px] sm:max-w-[360px] mx-auto w-full relative">
                                    <input 
                                        type="number" 
                                        value={inputValue} 
                                        onChange={(e) => setInputValue(e.target.value)} 
                                        onKeyDown={(e) => e.key === 'Enter' && handleAnswer(inputValue)} 
                                        className="flex-1 min-w-0 bg-slate-100 border-2 border-slate-50 rounded-2xl text-center text-5xl sm:text-7xl font-black text-slate-800 outline-none transition-all shadow-inner h-18 sm:h-24 focus:bg-white focus:border-blue-400 font-baloo"
                                        autoFocus 
                                        placeholder="?" 
                                        disabled={!!feedback}
                                    />
                                    <CandyButton color={feedback ? (feedback === 'correct' ? 'green' : 'red') : 'blue'} onClick={() => handleAnswer(inputValue)} className="px-5 sm:px-8 h-18 sm:h-24 rounded-2xl shadow-lg shrink-0 border-b-[6px] border-blue-700">
                                        <ChevronRight size={48} strokeWidth={6} className="drop-shadow-sm"/>
                                    </CandyButton>
                                </div>
                                <div className="bg-white/60 backdrop-blur-sm px-6 py-1 rounded-full border border-white/60 shadow-sm">
                                    <span className="text-[10px] sm:text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">Đáp án & nhấn nút xanh <Check size={20} strokeWidth={4} className="text-blue-600 animate-bounce"/></span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
