
import React from 'react';
import { X, BookOpen, HelpCircle, Trophy, Star, Wand2, EyeOff, Gamepad2, Volume2, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { CandyButton } from '../ui/CandyButton';

interface HelpModalProps {
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-pop-in">
            <div className="glass-panel rounded-[32px] w-full max-w-2xl max-h-[90vh] flex flex-col relative overflow-hidden shadow-2xl border-4 border-white/60">
                {/* Header */}
                <div className="p-4 border-b border-gray-100/50 flex justify-between items-center bg-white/80 backdrop-blur-md">
                    <h2 className="text-xl sm:text-2xl font-baloo font-black text-blue-600 flex items-center gap-2">
                        <HelpCircle size={24} className="text-yellow-400 fill-yellow-400" strokeWidth={3} /> Bí Kíp Học Tập Cùng Roboki
                    </h2>
                    <CandyButton color="white" onClick={onClose} className="w-10 h-10 !p-0">
                        <X size={20} strokeWidth={3} />
                    </CandyButton>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-white/30">
                    
                    {/* Welcome Message */}
                    <div className="text-center space-y-2 mb-4">
                        <p className="text-slate-600 font-bold text-base">Chào mừng em đến với thế giới toán học kỳ thú! Hãy cùng khám phá 4 bước để trở thành "Thần đồng" nhé:</p>
                    </div>

                    {/* Bước 1: Khám phá */}
                    <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-5 rounded-[28px] border-2 border-blue-200 shadow-sm relative overflow-hidden group">
                        <h3 className="text-lg font-baloo font-black text-blue-700 mb-3 flex items-center gap-2 border-b border-blue-100 pb-2">
                            <span className="bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black shadow-md">1</span>
                            Khám Phá Bảng Tính
                        </h3>
                        <div className="space-y-3 text-slate-600 text-sm font-bold leading-relaxed">
                            <p className="flex items-start gap-3">
                                <span className="p-1 bg-white rounded-lg shadow-sm text-blue-500"><BookOpen size={16}/></span>
                                <span>Chọn <strong>Bảng Nhân</strong> hoặc <strong>Bảng Chia</strong> ở phía trên, sau đó nhấn vào các con số từ 2 đến 9 để đổi bảng tính em muốn học.</span>
                            </p>
                            <p className="flex items-start gap-3">
                                <span className="p-1 bg-white rounded-lg shadow-sm text-indigo-500"><Volume2 size={16}/></span>
                                <span>Nhấn nút <strong>Loa xanh</strong> để nghe Thầy Giáo AI đọc mẫu. Em cũng có thể tự ghi âm giọng mình trong phần Cài đặt đấy!</span>
                            </p>
                        </div>
                    </div>

                    {/* Bước 2: Hiểu bản chất */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-[28px] border-2 border-emerald-200 shadow-sm relative overflow-hidden group">
                        <h3 className="text-lg font-baloo font-black text-emerald-700 mb-3 flex items-center gap-2 border-b border-emerald-100 pb-2">
                            <span className="bg-emerald-600 text-white w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black shadow-md">2</span>
                            Hiểu Bản Chất Phép Tính
                        </h3>
                        <div className="space-y-3 text-slate-600 text-sm font-bold leading-relaxed">
                            <p className="flex items-start gap-3">
                                <span className="p-1 bg-white rounded-lg shadow-sm text-orange-500"><Wand2 size={16}/></span>
                                <span>Nhấn <strong>"Minh họa mẫu"</strong> để xem các nhóm ngôi sao. Nó giúp em biết phép nhân thực chất là các phép cộng lặp lại, và phép chia là chia đều các nhóm.</span>
                            </p>
                            <p className="flex items-start gap-3">
                                <span className="p-1 bg-white rounded-lg shadow-sm text-pink-500"><ArrowLeftRight size={16}/></span>
                                <span>Thử nhấn nút <strong>"Đổi"</strong> trong phép nhân để thấy rằng <span className="text-blue-600">2 × 3</span> cũng giống như <span className="text-purple-600">3 × 2</span> đều bằng 6 nhé!</span>
                            </p>
                        </div>
                    </div>

                    {/* Bước 3: Thử thách trí nhớ */}
                    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-5 rounded-[28px] border-2 border-orange-200 shadow-sm relative overflow-hidden group">
                        <h3 className="text-lg font-baloo font-black text-orange-700 mb-3 flex items-center gap-2 border-b border-orange-100 pb-2">
                            <span className="bg-orange-600 text-white w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black shadow-md">3</span>
                            Thử Thách Trí Nhớ
                        </h3>
                        <div className="space-y-3 text-slate-600 text-sm font-bold leading-relaxed">
                            <p className="flex items-start gap-3">
                                <span className="p-1 bg-white rounded-lg shadow-sm text-orange-600"><EyeOff size={16}/></span>
                                <span>Nhấn vào các <strong>Con số</strong> hoặc <strong>Kết quả</strong> trong bảng để ẩn chúng đi. Em hãy thử tự nhẩm xem mình đã thuộc lòng chưa nhé!</span>
                            </p>
                            <p className="flex items-start gap-3">
                                <span className="p-1 bg-white rounded-lg shadow-sm text-orange-500"><Star size={16} fill="currentColor"/></span>
                                <span>Dùng phím <span className="px-2 py-0.5 bg-white border rounded font-black">+</span> hoặc <span className="px-2 py-0.5 bg-white border rounded font-black">-</span> để đổi số lần lấy (ví dụ 2 lấy 5 lần là bao nhiêu?).</span>
                            </p>
                        </div>
                    </div>

                    {/* Bước 4: Luyện tập & Thăng hạng */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-[28px] border-2 border-purple-200 shadow-sm relative overflow-hidden group">
                        <h3 className="text-lg font-baloo font-black text-purple-700 mb-3 flex items-center gap-2 border-b border-purple-100 pb-2">
                            <span className="bg-purple-600 text-white w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black shadow-md">4</span>
                            Luyện Tập & Thăng Hạng
                        </h3>
                        <div className="space-y-3 text-slate-600 text-sm font-bold leading-relaxed">
                            <p className="flex items-start gap-3">
                                <span className="p-1 bg-white rounded-lg shadow-sm text-purple-600"><Gamepad2 size={16}/></span>
                                <span>Vào tab <strong>"Luyện Tập"</strong> để thử thách với 6 dạng bài tập vui nhộn như: Điền số, So sánh, Toán đố...</span>
                            </p>
                            <p className="flex items-start gap-3">
                                <span className="p-1 bg-white rounded-lg shadow-sm text-yellow-500"><Trophy size={16}/></span>
                                <span>Làm đúng thật nhiều để nhận danh hiệu <strong>Thần Đồng</strong> và xem lại các thành tích của mình ở tab <strong>"Thành Tích"</strong>.</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Button */}
                <div className="p-5 border-t border-gray-100/50 bg-white/80 flex justify-center backdrop-blur-md">
                    <CandyButton color="blue" onClick={onClose} className="px-12 py-4 text-xl w-full max-w-md shadow-xl rounded-[20px] uppercase tracking-wider">
                        Đã hiểu! Bắt đầu học nào 🚀
                    </CandyButton>
                </div>
            </div>
        </div>
    );
};
