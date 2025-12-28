
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { BADGES_LIST, RANKS } from '../constants';
import { Flame, Lock, Eye, Microscope, FileText, Globe, Calendar, Award, Moon, Sun, Camera, Zap, Edit3, X, Save } from 'lucide-react';

interface FieldJournalProps {
  userProfile: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
}

const IconMap: Record<string, any> = {
    Flame, Eye, Microscope, FileText, Globe, Moon, Sun, Camera
};

export const FieldJournal: React.FC<FieldJournalProps> = ({ userProfile, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
      name: userProfile.name,
      bio: userProfile.bio || "",
      specialization: userProfile.specialization || ""
  });

  // Calculate Rank
  const currentRank = RANKS.slice().reverse().find(r => userProfile.xp >= r.minXp) || RANKS[0];
  const nextRank = RANKS.find(r => r.minXp > userProfile.xp);
  
  // Calculate Progress
  const progressPercent = nextRank 
    ? ((userProfile.xp - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) * 100
    : 100;

  const handleSave = () => {
      if (onUpdateProfile) {
          onUpdateProfile({
              ...userProfile,
              name: editForm.name,
              bio: editForm.bio,
              specialization: editForm.specialization
          });
      }
      setIsEditing(false);
  };

  return (
    <div className="p-4 md:p-8 overflow-y-auto h-full bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-8">
            
            {/* ID Card / Stats Header */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-green-200 to-blue-200 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/3 group-hover:opacity-40 transition-opacity duration-700"></div>
                
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                 <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                                    <Zap size={10} className="text-yellow-400 fill-current" />
                                    Researcher ID: {userProfile.level.toString().padStart(4, '0')}
                                 </span>
                                 <button 
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-indigo-600 transition-colors"
                                 >
                                     <Edit3 size={14} />
                                 </button>
                            </div>
                            
                            {isEditing ? (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 max-w-md animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Name</label>
                                        <input 
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                            className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Specialization</label>
                                        <input 
                                            value={editForm.specialization}
                                            onChange={(e) => setEditForm({...editForm, specialization: e.target.value})}
                                            className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm"
                                            placeholder="e.g. Mycology, Botany"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Bio</label>
                                        <textarea 
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                                            className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm resize-none h-20"
                                            placeholder="Tell us about your research interests..."
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleSave} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700 flex items-center justify-center gap-1"><Save size={12}/> Save</button>
                                        <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-xs font-bold hover:bg-gray-300 flex items-center justify-center gap-1"><X size={12}/> Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-1">{userProfile.name}</h2>
                                    <p className="text-indigo-600 font-bold mb-2">{userProfile.specialization || "Field Generalist"}</p>
                                    <p className="text-gray-500 text-sm max-w-md leading-relaxed">{userProfile.bio || "No bio added yet."}</p>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-4 bg-orange-50 px-6 py-4 rounded-2xl border border-orange-100 shadow-sm">
                            <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                                <Flame size={28} fill="currentColor" />
                            </div>
                            <div>
                                <div className="text-3xl font-black text-orange-900 leading-none">{userProfile.streakDays}</div>
                                <div className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mt-1">Day Streak</div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-gray-100 h-4 rounded-full overflow-hidden border border-gray-200 relative">
                        <div 
                            className={`h-full ${currentRank.color} transition-all duration-1000 ease-out relative overflow-hidden`}
                            style={{ width: `${progressPercent}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <span>Current Rank: {currentRank.title}</span>
                        <span>{nextRank ? `Next Rank: ${nextRank.title} (${nextRank.minXp - userProfile.xp} XP left)` : 'Max Rank Achieved'}</span>
                    </div>

                    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div className="text-gray-400 text-[10px] font-bold uppercase mb-1 tracking-wider">Total Logs</div>
                            <div className="text-2xl font-black text-gray-800">{userProfile.observationsCount}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div className="text-gray-400 text-[10px] font-bold uppercase mb-1 tracking-wider">Badges</div>
                            <div className="text-2xl font-black text-gray-800">{userProfile.badges.length}/{BADGES_LIST.length}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div className="text-gray-400 text-[10px] font-bold uppercase mb-1 tracking-wider">Level</div>
                            <div className="text-2xl font-black text-gray-800">{userProfile.level}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div className="text-gray-400 text-[10px] font-bold uppercase mb-1 tracking-wider">Joined</div>
                            <div className="text-xl font-bold text-gray-800">2024</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Badges Grid */}
            <div>
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-6">
                    <Award className="text-green-600" />
                    Achievements & Certifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {BADGES_LIST.map((badgeTemplate) => {
                        const isUnlocked = userProfile.badges.find(b => b.id === badgeTemplate.id);
                        const Icon = IconMap[badgeTemplate.icon] || Award;
                        
                        return (
                            <div 
                                key={badgeTemplate.id} 
                                className={`relative p-5 rounded-2xl border transition-all duration-300 ${
                                    isUnlocked 
                                    ? 'bg-white border-green-200 shadow-md scale-[1.02]' 
                                    : 'bg-gray-50 border-gray-200 opacity-60 grayscale hover:opacity-80'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`p-3 rounded-xl ${isUnlocked ? 'bg-green-100 text-green-700 shadow-inner' : 'bg-gray-200 text-gray-400'}`}>
                                        <Icon size={24} />
                                    </div>
                                    {isUnlocked && (
                                        <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-200">
                                            UNLOCKED
                                        </span>
                                    )}
                                    {!isUnlocked && <Lock size={16} className="text-gray-400" />}
                                </div>
                                
                                <h4 className="font-bold text-gray-800">{badgeTemplate.name}</h4>
                                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{badgeTemplate.description}</p>
                                
                                {isUnlocked && (
                                     <div className="mt-4 pt-3 border-t border-green-50 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                                        <Calendar size={12} />
                                        Certified Researcher
                                     </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white text-center shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-2">Join the Global Bio-Blitz</h3>
                    <p className="text-gray-300 text-sm mb-6 max-w-lg mx-auto leading-relaxed">
                        Your data matters. Contribute your observations to local conservation efforts and help scientists track biodiversity changes in real-time.
                    </p>
                    <button className="bg-white text-gray-900 px-8 py-3 rounded-full text-sm font-bold hover:bg-green-50 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2 mx-auto">
                        <Globe size={16} />
                        Find Local Events
                    </button>
                </div>
            </div>

        </div>
    </div>
  );
};
