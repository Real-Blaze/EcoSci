import React from 'react';
import { ChatSession } from '../types';
import { MessageSquarePlus, MessageSquare, Leaf, Trash2, Microscope, BookOpen, Award, NotebookPen } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  sessions: ChatSession[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (e: React.MouseEvent, id: string) => void;
  setIsOpen: (open: boolean) => void;
  viewMode: 'chat' | 'gallery' | 'journal';
  setViewMode: (mode: 'chat' | 'gallery' | 'journal') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  sessions, 
  currentChatId, 
  onSelectChat, 
  onNewChat, 
  onDeleteChat,
  setIsOpen,
  viewMode,
  setViewMode
}) => {
  return (
    <>
        {/* Mobile Overlay */}
        {isOpen && (
            <div 
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 md:hidden"
                onClick={() => setIsOpen(false)}
            />
        )}
        
        <aside className={`fixed md:relative z-30 flex flex-col h-full w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out shadow-xl md:shadow-none ${
            isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-r from-green-50 to-white">
            <div className="bg-green-600 p-2.5 rounded-xl shadow-md text-white">
                <Leaf size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold text-gray-800 tracking-tight leading-none">EcoSci</h1>
                <p className="text-[10px] text-green-700 font-semibold tracking-wider uppercase mt-1">Expedition Hub</p>
            </div>
        </div>

        {/* Large Navigation Buttons */}
        <div className="p-4 space-y-2">
             <div className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1">Mission Control</div>
             
             <button 
                onClick={() => { setViewMode('chat'); if (window.innerWidth < 768) setIsOpen(false); }}
                className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all duration-200 border text-left ${
                    viewMode === 'chat' 
                    ? 'bg-green-50 border-green-200 shadow-sm' 
                    : 'bg-white border-gray-100 hover:border-green-200 hover:shadow-sm'
                }`}
             >
                 <div className={`p-2.5 rounded-full ${viewMode === 'chat' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Microscope size={20} />
                 </div>
                 <div className="flex-1">
                     <span className={`block font-bold text-sm ${viewMode === 'chat' ? 'text-green-900' : 'text-gray-700'}`}>Current Investigation</span>
                     <span className="text-[10px] text-gray-500">Active Lab</span>
                 </div>
             </button>

             <button 
                onClick={() => { setViewMode('gallery'); if (window.innerWidth < 768) setIsOpen(false); }}
                className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all duration-200 border text-left ${
                    viewMode === 'gallery' 
                    ? 'bg-green-50 border-green-200 shadow-sm' 
                    : 'bg-white border-gray-100 hover:border-green-200 hover:shadow-sm'
                }`}
             >
                 <div className={`p-2.5 rounded-full ${viewMode === 'gallery' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <BookOpen size={20} />
                 </div>
                 <div className="flex-1">
                     <span className={`block font-bold text-sm ${viewMode === 'gallery' ? 'text-green-900' : 'text-gray-700'}`}>Project Library</span>
                     <span className="text-[10px] text-gray-500">Visual Evidence</span>
                 </div>
             </button>

             <button 
                onClick={() => { setViewMode('journal'); if (window.innerWidth < 768) setIsOpen(false); }}
                className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all duration-200 border text-left ${
                    viewMode === 'journal' 
                    ? 'bg-green-50 border-green-200 shadow-sm' 
                    : 'bg-white border-gray-100 hover:border-green-200 hover:shadow-sm'
                }`}
             >
                 <div className={`p-2.5 rounded-full ${viewMode === 'journal' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Award size={20} />
                 </div>
                 <div className="flex-1">
                     <span className={`block font-bold text-sm ${viewMode === 'journal' ? 'text-green-900' : 'text-gray-700'}`}>Field Journal</span>
                     <span className="text-[10px] text-gray-500">Badges & Streaks</span>
                 </div>
             </button>
        </div>

        <div className="mx-4 my-2 border-t border-gray-100"></div>

        {/* New Chat Button */}
        <div className="px-4 pb-2">
            <button 
                onClick={() => {
                    onNewChat();
                    if (window.innerWidth < 768) setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-3.5 px-4 rounded-xl transition-all shadow-md active:scale-95 font-semibold"
            >
                <NotebookPen size={20} />
                Start New Expedition
            </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3 pt-4 pb-4 space-y-1">
            <div className="px-2 mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Logs</div>
            {sessions.length === 0 ? (
                <div className="text-center text-gray-400 mt-8 text-sm p-6 bg-gray-50 rounded-xl border border-gray-100 border-dashed mx-2">
                    <p>No field logs found.</p>
                </div>
            ) : (
                sessions.sort((a,b) => b.updatedAt - a.updatedAt).map(session => (
                    <button
                        key={session.id}
                        onClick={() => {
                            onSelectChat(session.id);
                            if (window.innerWidth < 768) setIsOpen(false);
                        }}
                        className={`group relative w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${
                            currentChatId === session.id 
                                ? 'bg-white border-l-4 border-green-500 shadow-sm' 
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <MessageSquare size={18} className={currentChatId === session.id ? 'text-green-600' : 'text-gray-400'} />
                        <span className={`truncate text-sm font-medium pr-6 ${currentChatId === session.id ? 'text-gray-900' : 'text-gray-600'}`}>{session.title}</span>
                        
                        <div 
                            onClick={(e) => onDeleteChat(e, session.id)}
                            className="absolute right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete Log"
                        >
                            <Trash2 size={14} />
                        </div>
                    </button>
                ))
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 text-[10px] text-gray-400 text-center font-medium bg-gray-50/50">
            EcoSci Expedition OS v2.0
        </div>
        </aside>
    </>
  );
};