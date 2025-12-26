
import React, { useEffect, useState } from 'react';
import { BookOpen, Trophy, Trash2, X, List, CheckCircle, XCircle, Search, Info } from 'lucide-react';
import { CandyButton } from '../ui/CandyButton';
import { HistoryItem, QuestionResult } from '../../types';

export const AchievementsTab: React.FC = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [viewItem, setViewItem] = useState<HistoryItem | null>(null);
    
    useEffect(() => { 
        const saved = JSON.parse(localStorage.getItem('math_history') || '[]'); 
        setHistory(saved); 
    }, []);

    const handleClearHistory = () => {
        setShowConfirm(true);
    };

    const confirmDelete = () => {
        localStorage.removeItem('math_history');
        setHistory([]);
        setShowConfirm(false);
    };
    
    const getRank = (score: number, totalQuestions: number) => {
        if (totalQuestions === 0) return { title: 'Mầm Non 🌱', color: 'bg-green-100 text-green-700 border-green-200' };
        
        const maxScore = totalQuestions * 10;
        const percentage = (score / maxScore) * 100;

        if (percentage === 100) return { title: 'Thần Đồng 👑', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 ring-2 ring-yellow-50' };
        if (percentage >= 80) return { title: 'Kiện Tướng 🏆', color: 'bg-purple-100 text-purple-700 border-purple-200' };
        if (percentage >= 60) return { title: 'Tinh Anh ✨', color: 'bg-blue-100 text-blue-700 border-blue-200' };
        if (percentage >= 40) return { title: 'Nỗ Lực 🔥', color: 'bg-orange-100 text-orange-700 border-orange-200' };
        return { title: 'Mầm Non 🌱', color: 'bg-green-100 text-green-700 border-green-200' };
    };

    const renderQuestionText = (qr: QuestionResult) => {
        const q = qr.question;
        if (q.type === 'word') return q.questionText;
        if (q.type === 'calc') return `${q.valA} ${q.operator} ${q.valB} = ?`;
        if (q.type === 'missing') return `${q.display.left} ${q.operator} ${q.display.right} = ${q.display.result}`;
        if (q.type === 'compare') return `${q.valA} ${q.operator} ${q.valB} ? ${q.compareVal}`;
        if (q.type === 'tf') return `${q.valA} ${q.operator} ${q.valB} = ${q.displayAnswer}`;
        if (q.type === 'sign') return `${q.valA} ? ${q.valB} = ${q.operator === '×' ? (q.valA * q.valB) : (q.valA / q.valB)}`;
        if (q.type === 'mcq') return `${q.valA} ${q.operator} ${q.valB} = ?`;
        return 'Câu hỏi';
    };

    const renderCorrectAnswerText = (qr: QuestionResult) => {
        const q = qr.question;
        if (q.type === 'tf') return q.correct ? 'Đúng' : 'Sai';
        return String(q.correct);
    };

    const renderUserAnswerText = (qr: QuestionResult) => {
        if (qr.question.type === 'tf') return qr.userAnswer ? 'Đúng' : 'Sai';
        return String(qr.userAnswer);
    };
    
    return (
        <div className="h-full p-2 sm:p-4 overflow-y-auto custom-scrollbar relative">
            {/* Modal Xác Nhận Xóa */}
            {showConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-pop-in">
                    <div className="bg-white rounded-[32px] p-6 max-w-sm w-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-white flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 to-orange-400"></div>
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500 shadow-inner border border-red-100">
                            <Trash2 size={40} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-700 mb-2 font-baloo">Xóa tất cả?</h3>
                        <p className="text-slate-500 font-bold mb-6 text-sm leading-relaxed">
                            Toàn bộ lịch sử và danh hiệu của em sẽ bị xóa vĩnh viễn. Em có chắc chắn không?
                        </p>
                        <div className="flex gap-3 w-full">
                            <CandyButton color="white" onClick={() => setShowConfirm(false)} className="flex-1 py-3 text-slate-600 font-extrabold text-lg">
                                Giữ lại
                            </CandyButton>
                            <CandyButton color="red" onClick={confirmDelete} className="flex-1 py-3 font-extrabold text-lg shadow-red-200">
                                Xóa ngay
                            </CandyButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Xem Lại Chi Tiết */}
            {viewItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-pop-in">
                    <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border-4 border-white relative overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-sm sticky top-0 z-20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500 text-white rounded-xl shadow-md"><Search size={24} strokeWidth={3}/></div>
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-black text-slate-700 leading-none">Xem lại kết quả</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase mt-1">Lượt chơi ngày {new Date(viewItem.date).toLocaleDateString('vi-VN')}</p>
                                </div>
                            </div>
                            <CandyButton color="white" onClick={() => setViewItem(null)} className="w-10 h-10 !p-0 rounded-2xl">
                                <X size={20} strokeWidth={3} />
                            </CandyButton>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-white">
                            {viewItem.results && viewItem.results.length > 0 ? (
                                viewItem.results.map((res, idx) => (
                                    <div key={idx} className={`p-4 rounded-3xl border-2 flex flex-col gap-2 transition-all ${res.isCorrect ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="text-[10px] font-black uppercase text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">Câu {idx + 1}</span>
                                            {res.isCorrect ? 
                                                <div className="flex items-center gap-1 text-green-600 font-black text-xs uppercase"><CheckCircle size={14}/> Đúng</div> : 
                                                <div className="flex items-center gap-1 text-red-600 font-black text-xs uppercase"><XCircle size={14}/> Sai</div>
                                            }
                                        </div>
                                        <p className="text-slate-700 font-baloo font-black text-lg sm:text-xl leading-snug">{renderQuestionText(res)}</p>
                                        <div className="flex items-center gap-4 mt-1 border-t border-slate-200/50 pt-2">
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Em trả lời</p>
                                                <p className={`font-black text-lg ${res.isCorrect ? 'text-green-600' : 'text-red-600'}`}>{renderUserAnswerText(res)}</p>
                                            </div>
                                            {!res.isCorrect && (
                                                <div className="flex-1 text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Đáp án đúng</p>
                                                    <p className="font-black text-lg text-slate-700">{renderCorrectAnswerText(res)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 opacity-40">
                                    <Info size={48} className="mx-auto mb-2" />
                                    <p className="font-bold">Lượt chơi này không có dữ liệu chi tiết.</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center sticky bottom-0 z-20">
                            <CandyButton color="blue" onClick={() => setViewItem(null)} className="w-full py-3 text-lg rounded-2xl">Đã xem xong</CandyButton>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-3xl mx-auto">
                <div className="glass-panel rounded-[32px] p-4 sm:p-8 min-h-[500px]">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 relative z-10">
                        <div className="hidden sm:block w-24"></div>
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-700 flex items-center gap-3 justify-center text-center">
                            <BookOpen className="text-blue-500" size={32} strokeWidth={3}/>
                            Lịch sử & Danh hiệu
                        </h3>
                         <div className="w-full sm:w-24 flex justify-end">
                            {history.length > 0 && (
                                <CandyButton 
                                    color="red"
                                    type="button"
                                    onClick={handleClearHistory} 
                                    className="w-10 h-10 !p-0 ml-auto sm:ml-0 shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200" 
                                    title="Xóa tất cả lịch sử"
                                >
                                    <Trash2 size={20} strokeWidth={3} />
                                </CandyButton>
                            )}
                         </div> 
                    </div>
                    
                    <div className="space-y-4 relative z-10">
                        {history.length === 0 ? (
                            <div className="text-center py-20 flex flex-col items-center opacity-60">
                                <Trophy size={64} className="text-slate-300 mb-4" />
                                <p className="text-slate-400 font-bold text-xl">Chưa có dữ liệu luyện tập.</p>
                                <p className="text-slate-400 text-sm mt-2">Hãy qua tab Luyện Tập để bắt đầu nhé!</p>
                            </div>
                        ) : (
                            history.slice(0, 30).map((h, i) => {
                                const rank = getRank(h.score, h.questions);
                                return (
                                    <div key={i} className="relative flex flex-col sm:flex-row justify-between items-center p-4 sm:p-5 bg-white/60 rounded-3xl border-2 border-white shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-sm gap-4 animate-pop-in" style={{animationDelay: `${i * 0.05}s`}}>
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                                                <span className="text-2xl sm:text-3xl font-black text-blue-300">
                                                    {h.userName ? h.userName.charAt(0).toUpperCase() : 'E'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-baloo font-black text-slate-700 text-lg sm:text-xl">{h.userName || 'Em'}</span>
                                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                                        {new Date(h.date).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-bold text-slate-500 flex items-center gap-1">
                                                    <span>Đã làm {h.questions} câu</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-green-500">Đúng {h.score / 10} câu</span>
                                                </div>
                                            </div>
                                            {/* Nút Xem lại trên mobile nằm ở góc này */}
                                            <CandyButton 
                                                color="white" 
                                                onClick={() => setViewItem(h)} 
                                                className="sm:hidden w-10 h-10 !p-0 rounded-2xl shadow-sm border border-slate-100"
                                                title="Xem chi tiết"
                                            >
                                                <List size={20} className="text-blue-500" />
                                            </CandyButton>
                                        </div>

                                        <div className="flex items-center justify-between w-full sm:w-auto gap-4 pl-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0">
                                            <div className={`px-3 py-1.5 rounded-xl border-2 font-black text-xs sm:text-sm uppercase tracking-wider shadow-sm flex items-center gap-1 whitespace-nowrap ${rank.color}`}>
                                                {rank.title}
                                            </div>
                                            <div className="text-right min-w-[60px]">
                                                <div className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Điểm số</div>
                                                <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-purple-600 drop-shadow-sm font-baloo leading-none">
                                                    {h.score}
                                                </div>
                                            </div>
                                            {/* Nút Xem lại trên desktop */}
                                            <CandyButton 
                                                color="white" 
                                                onClick={() => setViewItem(h)} 
                                                className="hidden sm:flex w-10 h-10 !p-0 rounded-2xl shadow-sm border border-slate-100 hover:scale-110 active:scale-95 transition-all"
                                                title="Xem chi tiết"
                                            >
                                                <List size={22} className="text-blue-500" strokeWidth={3} />
                                            </CandyButton>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
