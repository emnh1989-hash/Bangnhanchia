import React, { useState, useEffect } from 'react';
import { X, Settings, Mic, Gauge, Upload, Music, Trash2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { CandyButton } from '../ui/CandyButton';
import { VoiceSettings } from '../../types';
import { saveAudio, deleteAudio, getAllAudioKeys } from '../../utils/dbUtils';

interface SettingsModalProps {
    onClose: () => void;
    voiceSettings: VoiceSettings;
    setVoiceSettings: React.Dispatch<React.SetStateAction<VoiceSettings>>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, voiceSettings, setVoiceSettings }) => {
    const [settingsTab, setSettingsTab] = useState<'general' | 'custom-voice'>('general');
    const [uploadingKey, setUploadingKey] = useState<string | null>(null);
    const [existingKeys, setExistingKeys] = useState<string[]>([]);

    // Tải danh sách các bảng đã có file âm thanh từ IndexedDB
    useEffect(() => {
        const loadKeys = async () => {
            const keys = await getAllAudioKeys();
            setExistingKeys(keys);
        };
        loadKeys();
    }, []);

    const handleSpeedChange = (speed: number) => { setVoiceSettings(prev => ({ ...prev, speed })); };
    const handleGenderChange = (gender: 'female' | 'male') => { setVoiceSettings(prev => ({ ...prev, mode: 'ai', gender })); };
    const handleModeChange = (mode: 'ai' | 'custom') => { setVoiceSettings(prev => ({ ...prev, mode })); };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Giới hạn 3MB mỗi file để đảm bảo hiệu năng
        if (file.size > 3 * 1024 * 1024) {
            alert("File quá lớn! Vui lòng chọn file dưới 3MB.");
            return;
        }

        setUploadingKey(key);
        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result as string;
            try {
                await saveAudio(key, base64);
                setExistingKeys(prev => prev.includes(key) ? prev : [...prev, key]);
                // Cập nhật state local để thông báo đã thay đổi (chỉ lưu metadata vào localStorage)
                setVoiceSettings(prev => ({
                    ...prev,
                    customAudios: { ...prev.customAudios, [key]: 'indexeddb' }
                }));
            } catch (err) {
                alert("Lỗi lưu file vào bộ nhớ thiết bị.");
            } finally {
                setUploadingKey(null);
            }
        };
        reader.readAsDataURL(file);
    };

    const removeAudio = async (key: string) => {
        try {
            await deleteAudio(key);
            setExistingKeys(prev => prev.filter(k => k !== key));
            setVoiceSettings(prev => {
                const newAudios = { ...prev.customAudios };
                delete newAudios[key];
                return { ...prev, customAudios: newAudios };
            });
        } catch (err) {
            alert("Không thể xóa file.");
        }
    };

    const tables = [2, 3, 4, 5, 6, 7, 8, 9];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-pop-in">
            <div className="glass-panel rounded-[32px] w-full max-w-lg flex flex-col relative overflow-hidden max-h-[90vh] shadow-2xl border-4 border-white/60">
                <div className="p-4 border-b border-gray-100/50 flex justify-between items-center bg-white/80 backdrop-blur-md">
                    <h2 className="text-xl font-baloo font-black text-slate-700 flex items-center gap-2">
                        <Settings size={24} className="text-slate-500" strokeWidth={3} /> Cài Đặt
                    </h2>
                    <CandyButton color="white" onClick={onClose} className="w-9 h-9 !p-0">
                        <X size={18} strokeWidth={3} />
                    </CandyButton>
                </div>

                <div className="flex p-2 bg-slate-50/50 border-b border-slate-100">
                    <button 
                        onClick={() => setSettingsTab('general')}
                        className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${settingsTab === 'general' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                    >
                        Chung
                    </button>
                    <button 
                        onClick={() => setSettingsTab('custom-voice')}
                        className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${settingsTab === 'custom-voice' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-400'}`}
                    >
                        Âm thanh tự ghi
                    </button>
                </div>

                <div className="p-4 space-y-6 bg-white/30 overflow-y-auto custom-scrollbar">
                    
                    {settingsTab === 'general' && (
                        <>
                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                                <div className="flex items-center gap-2 text-amber-700 font-black mb-1">
                                    <AlertCircle size={18} />
                                    <span className="uppercase text-xs tracking-tighter">Lưu ý về giọng đọc</span>
                                </div>
                                <p className="text-[11px] font-bold text-amber-800 leading-tight">
                                    Giọng đọc AI đã được loại bỏ để nhường chỗ cho giọng đọc của em hoặc thầy cô. Hãy tải lên các tệp ghi âm ở tab "Âm thanh tự ghi" nhé!
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-500 mb-3 flex items-center gap-2 uppercase tracking-widest">
                                    <Gauge size={18} strokeWidth={3} /> Tốc độ đọc
                                </h3>
                                <div className="flex bg-slate-100 p-1 rounded-2xl border border-white shadow-inner">
                                    {[0.75, 1.0, 1.25].map((val, idx) => (
                                        <button key={val} onClick={() => handleSpeedChange(val)} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${voiceSettings.speed === val ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>
                                            {['Chậm', 'Vừa', 'Nhanh'][idx]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {settingsTab === 'custom-voice' && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 flex items-start gap-2">
                                <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold text-blue-700 leading-tight italic">
                                    Em có thể tải lên đủ 16 file MP3 (8 bảng nhân và 8 bảng chia). Dữ liệu được lưu an toàn vào bộ nhớ trình duyệt!
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {['mul', 'div'].map(op => (
                                    <div key={op} className="bg-white/60 p-4 rounded-[28px] border border-white shadow-sm">
                                        <h4 className={`text-xs font-black uppercase mb-3 flex items-center gap-2 px-1 ${op === 'mul' ? 'text-blue-600' : 'text-pink-600'}`}>
                                            {op === 'mul' ? 'Bảng Nhân (2-9)' : 'Bảng Chia (2-9)'}
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {tables.map(num => {
                                                const key = `${op}-${num}`;
                                                const hasAudio = existingKeys.includes(key);
                                                return (
                                                    <div key={key} className="flex flex-col gap-1 bg-white rounded-2xl p-2 border border-slate-100 shadow-sm relative overflow-hidden">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className={`text-sm font-black ${op === 'mul' ? 'text-blue-500' : 'text-pink-500'}`}>{num}</span>
                                                            {hasAudio && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
                                                        </div>
                                                        <div className="flex gap-1 justify-center">
                                                            <label className="cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition-colors text-slate-400">
                                                                <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, key)} />
                                                                {uploadingKey === key ? <Loader2 size={14} className="animate-spin text-blue-500" /> : <Upload size={14} />}
                                                            </label>
                                                            {hasAudio && (
                                                                <button onClick={() => removeAudio(key)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-100/50 bg-white/80 backdrop-blur-md">
                    <CandyButton color="green" onClick={onClose} className="w-full py-3 text-base">Hoàn thành</CandyButton>
                </div>
            </div>
        </div>
    );
};