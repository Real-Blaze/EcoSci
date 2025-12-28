import React from 'react';
import { RANKS } from '../constants';
import { Zap, X, Star } from 'lucide-react';

interface LevelUpModalProps {
    level: number;
    xp: number;
    onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ level, xp, onClose }) => {
  const currentRank = RANKS.slice().reverse().find(r => xp >= r.minXp) || RANKS[0];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in zoom-in duration-300">
        <div className="relative bg-white w-full max-w-md mx-4 rounded-3xl overflow-hidden shadow-2xl text-center p-8">
             {/* Confetti Background Effect (CSS only for simplicity) */}
             <div className="absolute inset-0 overflow-hidden pointer-events-none">
                 <div className="absolute top-0 left-1/4 w-2 h-2 bg-red-500 rounded-full animate-bounce delay-75"></div>
                 <div className="absolute top-10 right-1/4 w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-150"></div>
                 <div className="absolute top-5 left-1/2 w-2 h-2 bg-green-500 rounded-full animate-bounce delay-300"></div>
                 <div className="absolute inset-0 bg-gradient-to-b from-yellow-50/50 to-transparent"></div>
             </div>

             <div className="relative z-10">
                 <div className="mx-auto w-24 h-24 bg-gradient-to-tr from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg mb-6 animate-[spin_3s_linear_infinite_reverse]">
                    <Star size={48} className="text-white fill-current animate-[pulse_2s_infinite]" />
                 </div>

                 <h2 className="text-4xl font-black text-gray-900 mb-2 uppercase tracking-tight">Level Up!</h2>
                 <p className="text-gray-500 font-medium mb-6">You are growing as a scientist.</p>

                 <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8">
                     <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Current Rank</div>
                     <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                         {currentRank.title}
                     </div>
                     <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="px-3 py-1 bg-gray-200 rounded-full text-xs font-bold text-gray-600">Level {level}</span>
                        <span className="px-3 py-1 bg-yellow-100 rounded-full text-xs font-bold text-yellow-700 flex items-center gap-1"><Zap size={10} fill="currentColor"/> {xp} XP</span>
                     </div>
                 </div>

                 <button 
                    onClick={onClose}
                    className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all active:scale-95"
                 >
                     Continue Research
                 </button>
             </div>
        </div>
    </div>
  );
};