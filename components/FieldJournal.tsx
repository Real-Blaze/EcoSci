import React from 'react';
import { UserProfile } from '../types';
import { BADGES_LIST } from '../constants';
import { Flame, Lock, Eye, Microscope, FileText, Globe, Calendar, Award } from 'lucide-react';

interface FieldJournalProps {
  userProfile: UserProfile;
}

const IconMap: Record<string, any> = {
    Flame, Eye, Microscope, FileText, Globe
};

export const FieldJournal: React.FC<FieldJournalProps> = ({ userProfile }) => {
  return (
    <div className="p-4 md:p-8 overflow-y-auto h-full bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Header / ID Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Researcher ID: {userProfile.name}</span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Field Journal</h2>
                        <p className="text-gray-500 mt-1">Track your contributions to the global scientific community.</p>
                    </div>

                    <div className="flex items-center gap-4 bg-orange-50 px-5 py-3 rounded-2xl border border-orange-100">
                        <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                            <Flame size={24} fill="currentColor" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-orange-900 leading-none">{userProfile.streakDays}</div>
                            <div className="text-xs font-bold text-orange-600 uppercase tracking-wide">Day Streak</div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="text-gray-400 text-xs font-bold uppercase mb-1">Total Logs</div>
                        <div className="text-xl font-bold text-gray-800">{userProfile.observationsCount}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="text-gray-400 text-xs font-bold uppercase mb-1">Badges</div>
                        <div className="text-xl font-bold text-gray-800">{userProfile.badges.length}/{BADGES_LIST.length}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="text-gray-400 text-xs font-bold uppercase mb-1">Status</div>
                        <div className="text-xl font-bold text-green-700">Active</div>
                    </div>
                     <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="text-gray-400 text-xs font-bold uppercase mb-1">Joined</div>
                        <div className="text-xl font-bold text-gray-800">2024</div>
                    </div>
                </div>
            </div>

            {/* Badges Grid */}
            <div>
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-4">
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
                                className={`relative p-5 rounded-2xl border transition-all ${
                                    isUnlocked 
                                    ? 'bg-white border-green-200 shadow-sm' 
                                    : 'bg-gray-100 border-gray-200 opacity-70 grayscale'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`p-3 rounded-xl ${isUnlocked ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-400'}`}>
                                        <Icon size={24} />
                                    </div>
                                    {isUnlocked && (
                                        <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                            UNLOCKED
                                        </span>
                                    )}
                                    {!isUnlocked && <Lock size={16} className="text-gray-400" />}
                                </div>
                                
                                <h4 className="font-bold text-gray-800">{badgeTemplate.name}</h4>
                                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{badgeTemplate.description}</p>
                                
                                {isUnlocked && (
                                     <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                                        <Calendar size={12} />
                                        Unlocked recently
                                     </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white text-center shadow-lg">
                <h3 className="text-lg font-bold mb-2">Join the Next Bio-Blitz</h3>
                <p className="text-gray-300 text-sm mb-4 max-w-lg mx-auto">
                    Contribute your observations to local conservation efforts. Your data helps scientists track biodiversity changes in real-time.
                </p>
                <button className="bg-white text-gray-900 px-6 py-2 rounded-full text-sm font-bold hover:bg-green-50 transition-colors">
                    Find Local Events
                </button>
            </div>

        </div>
    </div>
  );
};