
import React, { useState } from 'react';
import { generateQuiz } from '../services/geminiService';
import { QuizQuestion } from '../types';
import { Brain, ArrowRight, CheckCircle2, XCircle, Loader2, Trophy, Flame } from 'lucide-react';

const QuizModule: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const startQuiz = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    const q = await generateQuiz(topic, difficulty);
    if (q.length > 0) {
      setQuestions(q);
      setCurrentIndex(0);
      setScore(0);
      setShowResult(false);
    }
    setIsGenerating(false);
  };

  const handleAnswer = (option: string) => {
    if (answered) return;
    setSelectedOption(option);
    setAnswered(true);
    if (option === questions[currentIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-96">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <h3 className="text-xl font-bold text-slate-800">Generating Personalized Quiz...</h3>
        <p className="text-slate-500 mt-2 text-center">Our AI is crafting challenging questions for your level</p>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="p-8 text-center animate-in zoom-in duration-300">
        <div className="mb-6 flex justify-center">
          <div className="bg-yellow-50 p-6 rounded-full border-4 border-yellow-200">
            <Trophy className="text-yellow-500 w-16 h-16" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800">Quiz Completed!</h2>
        <div className="my-6">
          <div className="text-6xl font-black text-indigo-600">{score}/{questions.length}</div>
          <p className="text-slate-500 mt-2 font-medium">Your score on {topic}</p>
        </div>
        <div className="bg-indigo-50 p-6 rounded-2xl mb-8 border border-indigo-100">
          <p className="text-indigo-700 italic">"Great job! Practicing {topic} will strengthen your analytical skills even more."</p>
        </div>
        <button
          onClick={() => {
            setQuestions([]);
            setTopic('');
          }}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
        >
          Try Another Topic
        </button>
      </div>
    );
  }

  if (questions.length > 0) {
    const q = questions[currentIndex];
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</span>
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300" 
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-slate-800 mb-8 leading-snug">{q.question}</h2>

        <div className="space-y-3">
          {q.options.map((opt, i) => {
            const isCorrect = opt === q.correctAnswer;
            const isSelected = opt === selectedOption;
            let bgColor = "bg-white border-slate-200 hover:border-indigo-300";
            if (answered) {
              if (isCorrect) bgColor = "bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500";
              else if (isSelected) bgColor = "bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500";
              else bgColor = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                disabled={answered}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${bgColor}`}
              >
                <span className="font-medium text-sm">{opt}</span>
                {answered && isCorrect && <CheckCircle2 size={18} />}
                {answered && isSelected && !isCorrect && <XCircle size={18} />}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-8 bg-slate-50 p-4 rounded-2xl border border-slate-200 animate-in slide-in-from-top-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Explanation</h4>
            <p className="text-sm text-slate-700 leading-relaxed">{q.explanation}</p>
            <button
              onClick={nextQuestion}
              className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700"
            >
              {currentIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Brain size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Knowledge Quest</h2>
        <p className="text-slate-500 mt-1">Challenge yourself with AI-generated math quizzes</p>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">What do you want to practice?</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Calculus, Long Division, Matrix Algebra"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Difficulty Level</label>
          <div className="grid grid-cols-3 gap-2">
            {['Basic', 'Intermediate', 'Advanced'].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                  difficulty === level 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startQuiz}
          disabled={!topic.trim()}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 mt-4"
        >
          <Flame size={20} />
          Launch Quiz
        </button>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-4">
        {['Algebra 101', 'Geometry Dash', 'Calculus Hub', 'Trig Master'].map((t) => (
          <button 
            key={t}
            onClick={() => { setTopic(t); startQuiz(); }}
            className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left hover:border-indigo-400 hover:bg-white transition-all group"
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Recommended</p>
            <p className="text-sm font-bold text-slate-800 mt-1 group-hover:text-indigo-600">{t}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuizModule;
