import React, { useState, useEffect } from 'react';
import { Calculator, Trophy, HelpCircle, Maximize, Minimize, Phone, GraduationCap } from 'lucide-react';
import { CandyButton } from './components/ui/CandyButton';
import { HelpModal } from './components/modals/HelpModal';
import { LearningTab } from './components/tabs/LearningTab';
import { PracticeTab } from './components/tabs/PracticeTab';
import { AchievementsTab } from './components/tabs/AchievementsTab';
import { User, VoiceSettings } from './types';

export default function App() {
    const [activeTab, setActiveTab] = useState<'learn' | 'practice' | 'achievements'>('learn'); 
    
    const [user, setUser] = useState<User>(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('math_user') || '{}');
            return { name: "", class: saved.class || "" };
        } catch {
            return { name: "", class: "" };
        }
    });

    const [voiceSettings] = useState<VoiceSettings>(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('math_voice_settings') || '{}');
            return {
                speed: saved.speed || 1.0,
                mode: saved.mode || 'ai',
                gender: saved.gender || 'female',
                customAudios: saved.customAudios || {}
            };
        } catch {
            return { speed: 1.0, mode: 'ai', gender: 'female', customAudios: {} };
        }
    });

    const [showHelp, setShowHelp] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((e) => {
                console.warn(`Fullscreen error: ${e.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const handleUserUpdate = (newUser: User) => { 
        setUser(newUser); 
        const dataToSave = { class: newUser.class };
        localStorage.setItem('math_user', JSON.stringify(dataToSave)); 
    };

    return (
        <div className="flex flex-col h-[100dvh] w-screen max-w-full mx-auto px-2 sm:px-4 py-2 gap-2 relative z-10 overflow-hidden transition-all duration-300 touch-pan-x bg-transparent">
            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
            
            <header className="glass-panel rounded-[20px] sm:rounded-[32px] px-3 py-1.5 sm:py-3 flex flex-wrap lg:flex-nowrap gap-2 sm:gap-4 justify-between items-center z-50 shrink-0 shadow-lg border-b-4 border-white/40">
                <div className="flex items-center gap-1 sm:gap-2 group">
                    <div className="w-12 h-14 sm:w-28 sm:h-28 flex items-center justify-center animate-float shrink-0 overflow-visible">
                        <img src="https://i.ibb.co/WNdXX0nf/Logo-nhan-chia.png" alt="App Logo" className="w-10 h-10 sm:w-24 sm:h-24 object-contain rounded-2xl shadow-sm" />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h1 className="text-base sm:text-2xl md:text-3xl font-baloo font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 leading-none">Bảng Nhân Chia</h1>
                        <div className="flex items-center gap-1 mt-1 sm:mt-1.5">
                            <span className="px-2 py-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] sm:text-xs font-baloo font-black rounded-full shadow-sm border border-white/40 uppercase tracking-wide">
                                Vui học
                            </span>
                            <span className="text-slate-300 font-black text-xs sm:text-sm">•</span>
                            <span className="px-2 py-0.5 bg-gradient-to-r from-blue-500 to-sky-500 text-white text-[9px] sm:text-xs font-baloo font-black rounded-full shadow-sm border border-white/40 uppercase tracking-wide">
                                Sáng tạo
                            </span>
                        </div>
                    </div>
                </div>
                
                <nav className="flex gap-1 p-1 bg-slate-200/40 rounded-full sm:rounded-[32px] border border-white/60 shadow-inner backdrop-blur-md overflow-x-auto no-scrollbar">
                    <CandyButton 
                        color={activeTab === 'learn' ? 'blue' : 'white'} 
                        onClick={() => setActiveTab('learn')} 
                        className={`px-3 py-1.5 sm:px-5 sm:py-3 text-[10px] sm:text-base gap-1 shrink-0 ${activeTab !== 'learn' ? 'opacity-80' : 'ring-2 ring-blue-100 shadow-md'}`}
                    >
                        <GraduationCap size={18} strokeWidth={3} className="sm:w-6 sm:h-6" /> 
                        <span className="uppercase font-black">Học bảng</span>
                    </CandyButton>
                    <CandyButton 
                        color={activeTab === 'practice' ? 'purple' : 'white'} 
                        onClick={() => setActiveTab('practice')} 
                        className={`px-3 py-1.5 sm:px-5 sm:py-3 text-[10px] sm:text-base gap-1 shrink-0 ${activeTab !== 'practice' ? 'opacity-80' : 'ring-2 ring-purple-100 shadow-md'}`}
                    >
                        <Calculator size={18} strokeWidth={3} className="sm:w-6 sm:h-6" /> 
                        <span className="uppercase font-black">Luyện tập</span>
                    </CandyButton>
                    <CandyButton 
                        color={activeTab === 'achievements' ? 'yellow' : 'white'} 
                        onClick={() => setActiveTab('achievements')} 
                        className={`px-3 py-1.5 sm:px-5 sm:py-3 text-[10px] sm:text-base gap-1 shrink-0 ${activeTab !== 'achievements' ? 'opacity-80' : 'ring-2 ring-yellow-100 shadow-md'}`}
                    >
                        <Trophy size={18} strokeWidth={3} className="sm:w-6 sm:h-6" /> 
                        <span className="uppercase font-black">Thành Tích</span>
                    </CandyButton>
                </nav>

                <div className="flex gap-2 ml-auto lg:ml-0">
                    <CandyButton color="white" onClick={() => setShowHelp(true)} className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg !p-0 shadow-md">
                        <HelpCircle size={20} className="text-blue-500 sm:w-8 sm:h-8" strokeWidth={3}/>
                    </CandyButton>
                    <CandyButton color="white" onClick={toggleFullScreen} className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg !p-0 hidden sm:flex shadow-md">
                        {isFullscreen ? <Minimize size={24} className="text-slate-500" /> : <Maximize size={24} className="text-slate-500" />}
                    </CandyButton>
                </div>
            </header>

            <main className="flex-1 relative overflow-hidden min-h-0">
                <div key={activeTab} className="h-full w-full animate-tab-enter">
                    {activeTab === 'learn' && <LearningTab isFullscreen={isFullscreen} voiceSettings={voiceSettings} />}
                    {activeTab === 'practice' && <PracticeTab user={user} onUpdateUser={handleUserUpdate} />}
                    {activeTab === 'achievements' && <AchievementsTab />}
                </div>
            </main>

            <footer className="shrink-0 text-center pb-1 hidden lg:block">
                <p className="text-[10px] sm:text-xs font-black text-slate-400 tracking-wide flex items-center justify-center gap-3">
                    <span className="bg-white/50 px-3 py-1 rounded-full shadow-sm">@ 2025 Nguyễn Hoàng Em - Tiểu học Thạnh Phước</span>
                    <span className="text-blue-500 flex items-center gap-1">
                        <Phone size={14} strokeWidth={3}/> 0933 474 843
                    </span>
                </p>
            </footer>
        </div>
    );
}
