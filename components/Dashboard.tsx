
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, Award, Clock, Target, ChevronRight } from 'lucide-react';

const data = [
  { day: 'Mon', solved: 4, score: 85 },
  { day: 'Tue', solved: 7, score: 92 },
  { day: 'Wed', solved: 5, score: 88 },
  { day: 'Thu', solved: 9, score: 95 },
  { day: 'Fri', solved: 12, score: 98 },
  { day: 'Sat', solved: 8, score: 90 },
  { day: 'Sun', solved: 15, score: 96 },
];

const Dashboard: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Your Progress</h2>
        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold">
          <TrendingUp size={14} />
          +12% this week
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
            <Target size={20} />
          </div>
          <p className="text-2xl font-black text-slate-800">60</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Problems Solved</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
            <Award size={20} />
          </div>
          <p className="text-2xl font-black text-slate-800">92%</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg. Quiz Score</p>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Clock size={16} className="text-indigo-500" />
            Learning Activity
          </h3>
          <p className="text-xs text-slate-400">Problems solved per day</p>
        </div>
        
        <div className="h-48 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="solved" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSolved)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Badges */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-4 px-2">Achievements</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
          {[
            { label: '7 Day Streak', icon: '🔥', color: 'bg-orange-100 text-orange-600' },
            { label: 'Algebra Pro', icon: '📐', color: 'bg-blue-100 text-blue-600' },
            { label: 'Calculus Hero', icon: '∞', color: 'bg-purple-100 text-purple-600' },
            { label: 'Fast Solver', icon: '⚡', color: 'bg-yellow-100 text-yellow-600' },
          ].map((badge, i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${badge.color} border border-white shadow-sm`}>
                {badge.icon}
              </div>
              <span className="text-[10px] font-bold text-slate-500">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Path */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700 px-2">Next Steps</h3>
        <div className="bg-slate-900 text-white p-5 rounded-3xl relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="font-bold text-indigo-300">Continue: Trigonometry Basics</h4>
            <p className="text-xs text-slate-400 mt-1">Lesson 4 of 12 • 15 mins left</p>
            <div className="w-full h-1 bg-white/20 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-indigo-500 w-1/3" />
            </div>
          </div>
          <button className="absolute right-4 bottom-4 bg-white text-slate-900 p-2 rounded-xl group-hover:translate-x-1 transition-transform">
            <ChevronRight size={18} />
          </button>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 blur-3xl -mr-16 -mt-16" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
