import React from 'react';
import { MISSION_TYPES } from '../constants';
import { Leaf, PawPrint, Mountain, Compass, ArrowRight } from 'lucide-react';
import { MissionType } from '../types';

interface MissionSelectorProps {
    onSelect: (type: MissionType) => void;
    onCancel: () => void;
}

const IconMap: Record<string, any> = { Leaf, PawPrint, Mountain, Compass };

export const MissionSelector: React.FC<MissionSelectorProps> = ({ onSelect, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Left Sidebar */}
            <div className="w-full md:w-1/3 bg-gray-900 text-white p-8 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black mb-2 tracking-tight">New Expedition</h2>
                    <p className="text-gray-400 text-lg mb-8">Select your research specialization for this field trip.</p>
                    
                    <div className="hidden md:block">
                        <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Why choose?</div>
                        <ul className="space-y-4 text-sm text-gray-300">
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Tailored AI Persona
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                Specialized Vocabulary
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                Focused Suggestions
                            </li>
                        </ul>
                    </div>
                </div>
                <button onClick={onCancel} className="mt-8 text-sm text-gray-500 hover:text-white transition-colors underline">
                    Cancel
                </button>
            </div>

            {/* Right Grid */}
            <div className="flex-1 p-6 md:p-8 bg-gray-50 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MISSION_TYPES.map((mission) => {
                        const Icon = IconMap[mission.icon] || Compass;
                        
                        return (
                            <button
                                key={mission.id}
                                onClick={() => onSelect(mission.id as MissionType)}
                                className="group relative p-6 bg-white border-2 border-transparent hover:border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all text-left flex flex-col h-full active:scale-[0.98]"
                            >
                                <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-colors
                                    ${mission.color === 'green' ? 'bg-green-100 text-green-700 group-hover:bg-green-600 group-hover:text-white' : ''}
                                    ${mission.color === 'orange' ? 'bg-orange-100 text-orange-700 group-hover:bg-orange-600 group-hover:text-white' : ''}
                                    ${mission.color === 'stone' ? 'bg-stone-100 text-stone-700 group-hover:bg-stone-600 group-hover:text-white' : ''}
                                    ${mission.color === 'blue' ? 'bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white' : ''}
                                `}>
                                    <Icon size={24} />
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{mission.label}</h3>
                                <p className="text-sm text-gray-500 mb-6 leading-relaxed">{mission.description}</p>
                                
                                <div className="mt-auto flex items-center gap-2 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                                    Launch Mission <ArrowRight size={16} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    </div>
  );
};