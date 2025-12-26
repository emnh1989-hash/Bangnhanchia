
import React, { useState } from 'react';
import { Camera, Upload, Loader2, Sparkles, X, CheckCircle } from 'lucide-react';
import { analyzeMathImage } from '../services/geminiService';
import { CandyButton } from './ui/CandyButton';

export default function ProblemScanner() {
    const [image, setImage] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result as string);
            setResult(null);
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyze = async () => {
        if (!image) return;
        setIsAnalyzing(true);
        const explanation = await analyzeMathImage(image, 'image/jpeg');
        setResult(explanation);
        setIsAnalyzing(false);
    };

    return (
        <div className="flex flex-col h-full bg-white/40 backdrop-blur-md rounded-[32px] border-2 border-white shadow-xl overflow-hidden animate-pop-in">
            <div className="p-4 bg-white/60 border-b border-white flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center text-white shadow-md">
                    <Camera size={24} />
                </div>
                <div>
                    <h3 className="font-baloo font-black text-slate-700 leading-none">Quét Bài Tập</h3>
                    <p className="text-[10px] text-pink-500 font-black uppercase mt-1">Sử dụng Trí tuệ nhân tạo</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                {!image ? (
                    <div className="h-full flex flex-col items-center justify-center border-4 border-dashed border-slate-200 rounded-[32px] bg-slate-50/50 p-8 text-center group hover:border-blue-300 transition-colors">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-300 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                            <Upload size={40} />
                        </div>
                        <h4 className="text-lg font-black text-slate-600 mb-2">Chụp ảnh bài tập</h4>
                        <p className="text-sm text-slate-400 font-bold mb-6">Em chụp ảnh rõ bài toán muốn giải nhé!</p>
                        <label className="cursor-pointer">
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            <div className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all">Chọn ảnh từ máy</div>
                        </label>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="relative rounded-2xl overflow-hidden border-4 border-white shadow-lg max-w-sm mx-auto">
                            <img src={image} alt="Problem" className="w-full h-auto object-contain bg-slate-100" />
                            <button 
                                onClick={() => { setImage(null); setResult(null); }}
                                className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {!result && (
                            <CandyButton 
                                color="blue" 
                                onClick={handleAnalyze} 
                                disabled={isAnalyzing}
                                className="w-full py-4 text-xl shadow-xl"
                            >
                                {isAnalyzing ? (
                                    <><Loader2 size={24} className="animate-spin mr-2" /> Đang phân tích...</>
                                ) : (
                                    <><Sparkles size={24} className="mr-2" /> Giải bài toán này</>
                                )}
                            </CandyButton>
                        )}

                        {result && (
                            <div className="bg-white p-5 rounded-[28px] border-2 border-emerald-100 shadow-sm animate-pop-in">
                                <div className="flex items-center gap-2 mb-3 text-emerald-600 font-black uppercase text-xs">
                                    <CheckCircle size={18} /> Lời giải từ Thầy Giáo AI
                                </div>
                                <div className="text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">
                                    {result}
                                </div>
                                <CandyButton color="white" onClick={() => setImage(null)} className="mt-6 w-full py-3 text-slate-500 font-black">Chụp bài khác</CandyButton>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
