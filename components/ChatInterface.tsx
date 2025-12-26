import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { chatWithTutor } from '../services/geminiService';
import { CandyButton } from './ui/CandyButton';

interface Message {
    role: 'user' | 'model';
    text: string;
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: 'Chào em yêu quý! Thầy là Gia sư AI đây. 🍎 Em đang gặp khó khăn với phép tính nào? Đừng ngần ngại hỏi Thầy, Thầy sẽ chỉ em cách giải siêu dễ hiểu bằng những ví dụ vui nhộn nhé! 🌟' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        const history = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));

        const response = await chatWithTutor(history, userMsg);
        setMessages(prev => [...prev, { role: 'model', text: response || '' }]);
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-full bg-white/40 backdrop-blur-md rounded-[32px] border-2 border-white shadow-xl overflow-hidden animate-pop-in">
            <div className="p-4 bg-white/60 border-b border-white flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-transparent shrink-0">
                    <img src="https://i.ibb.co/WNdXX0nf/Logo-nhan-chia.png" alt="AI Tutor Logo" className="w-full h-full object-contain rounded-lg" />
                </div>
                <div>
                    <h3 className="font-baloo font-black text-slate-700 leading-none">Thầy Giáo AI</h3>
                    <p className="text-[10px] text-green-500 font-black uppercase mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Đang trực tuyến
                    </p>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-pop-in`}>
                        <div className={`max-w-[90%] p-4 rounded-3xl border-2 transition-all ${
                            msg.role === 'user' 
                            ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none shadow-lg' 
                            : 'bg-white text-slate-700 border-white rounded-tl-none shadow-md'
                        }`}>
                            <p className="text-sm sm:text-base font-bold leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start animate-pulse">
                        <div className="bg-white p-3 rounded-2xl border-2 border-white flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-indigo-500" />
                            <span className="text-xs font-black text-slate-400 uppercase">Thầy đang soạn bài giảng...</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-3 sm:p-4 bg-white/60 border-t border-white flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Hỏi Thầy về phép nhân, phép chia..."
                    className="flex-1 bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-blue-400 transition-all shadow-inner"
                />
                <CandyButton color="blue" onClick={handleSend} disabled={isLoading} className="w-14 h-14 !p-0">
                    <Send size={24} strokeWidth={3} />
                </CandyButton>
            </div>
        </div>
    );
}
