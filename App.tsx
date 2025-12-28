import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Menu, MessageSquarePlus, Telescope, FlaskConical, Users, ArrowRight } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { InputArea } from './components/InputArea';
import { GalleryView } from './components/GalleryView';
import { ImageModal } from './components/ImageModal';
import { FieldJournal } from './components/FieldJournal';
import { LabReportView } from './components/LabReportView';
import { sendMessageToGemini, generateChatTitle } from './services/geminiService';
import { ChatSession, Message, Role, Attachment, GalleryItem, UserProfile, Badge } from './types';
import { FALLBACK_SUGGESTIONS, BADGES_LIST } from './constants';

const generateId = () => Math.random().toString(36).substring(2, 15);

type ViewMode = 'chat' | 'gallery' | 'journal';

const App: React.FC = () => {
  // --- STATE ---
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('ecoSci_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
      const saved = localStorage.getItem('ecoSci_profile');
      return saved ? JSON.parse(saved) : {
          name: 'Student-01',
          streakDays: 1,
          lastLoginDate: new Date().toISOString().split('T')[0],
          badges: [],
          observationsCount: 0
      };
  });

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [showLabReport, setShowLabReport] = useState(false);
  
  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- DERIVED STATE ---
  const currentChat = useMemo(() => 
    sessions.find(s => s.id === currentChatId), 
    [sessions, currentChatId]
  );

  const allGalleryItems = useMemo<GalleryItem[]>(() => {
    if (!currentChat) return [];
    const items: GalleryItem[] = [];
    currentChat.messages.forEach(msg => {
        if (msg.attachments) {
            msg.attachments.forEach(att => {
                items.push({
                    src: `data:${att.mimeType};base64,${att.data}`,
                    alt: 'User Upload',
                    sourceMessageId: msg.id,
                    timestamp: msg.timestamp,
                    isUser: true
                });
            });
        }
        if (msg.role === Role.MODEL && msg.text) {
            const regex = /!\[(.*?)\]\((.*?)\)/g;
            let match;
            while ((match = regex.exec(msg.text)) !== null) {
                items.push({
                    src: match[2],
                    alt: match[1] || 'Scientific Illustration',
                    sourceMessageId: msg.id,
                    timestamp: msg.timestamp,
                    isUser: false
                });
            }
            const linkRegex = /\[(.*?)\]\((.*?)\)/g;
            while ((match = linkRegex.exec(msg.text)) !== null) {
                 if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)($|\?)/i.test(match[2])) {
                     items.push({
                        src: match[2],
                        alt: match[1] || 'Image',
                        sourceMessageId: msg.id,
                        timestamp: msg.timestamp,
                        isUser: false
                    });
                 }
            }
        }
    });
    return items;
  }, [currentChat]);

  // --- EFFECTS ---

  // Persistence
  useEffect(() => {
    localStorage.setItem('ecoSci_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
      localStorage.setItem('ecoSci_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Initialization & Gamification Logic (Streaks)
  useEffect(() => {
    const saved = localStorage.getItem('ecoSci_sessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) setCurrentChatId(parsed[0].id);
      else handleNewChat();
    } else {
      handleNewChat();
    }

    // Check Streak
    const today = new Date().toISOString().split('T')[0];
    if (userProfile.lastLoginDate !== today) {
        const last = new Date(userProfile.lastLoginDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - last.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        let newStreak = userProfile.streakDays;
        if (diffDays === 1) newStreak += 1; // Consecutive day
        else if (diffDays > 1) newStreak = 1; // Broken streak

        setUserProfile(prev => ({
            ...prev,
            lastLoginDate: today,
            streakDays: newStreak
        }));

        // Award Streak Badge
        if (newStreak >= 3) unlockBadge('streak_3');
    }
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (viewMode === 'chat') {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentChat?.messages, isLoading, viewMode]);


  // --- HANDLERS ---

  const unlockBadge = (badgeId: string) => {
      setUserProfile(prev => {
          if (prev.badges.find(b => b.id === badgeId)) return prev;
          const badgeInfo = BADGES_LIST.find(b => b.id === badgeId);
          if (!badgeInfo) return prev;
          
          // In a real app, show a toast here
          return {
              ...prev,
              badges: [...prev.badges, { ...badgeInfo, unlockedAt: Date.now() }]
          };
      });
  };

  const handleImageClick = (src: string) => {
    const index = allGalleryItems.findIndex(item => item.src === src);
    if (index !== -1) setLightboxIndex(index);
  };

  const handleNewChat = () => {
    if (isLoading) handleStopGeneration();
    const newChat: ChatSession = {
      id: generateId(),
      title: 'New Investigation',
      messages: [],
      updatedAt: Date.now()
    };
    setSessions(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setIsSidebarOpen(false);
    setIsLoading(false);
    setViewMode('chat');
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setIsLoading(false);
  };

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedSessions = sessions.filter(s => s.id !== id);
    setSessions(updatedSessions);
    if (currentChatId === id) {
      setCurrentChatId(updatedSessions.length > 0 ? updatedSessions[0].id : null);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    let activeId = currentChatId;
    if (!activeId) return;
    
    setViewMode('chat');

    // Gamification Triggers
    if (text.toLowerCase().includes('report')) unlockBadge('publisher');
    if (text.toLowerCase().includes('bio-blitz')) unlockBadge('bioblitz');
    if (attachments.length > 0) {
        setUserProfile(prev => ({...prev, observationsCount: prev.observationsCount + 1}));
        unlockBadge('novice_observer');
        if (userProfile.observationsCount >= 4) unlockBadge('taxonomist');
    }

    const userMessage: Message = {
      id: generateId(),
      role: Role.USER,
      text: text,
      attachments: attachments,
      timestamp: Date.now()
    };

    const botMessageId = generateId();
    const initialBotMessage: Message = {
        id: botMessageId,
        role: Role.MODEL,
        text: '',
        timestamp: Date.now() + 1
    };

    setSessions(prev => prev.map(session => {
      if (session.id === activeId) {
        return {
          ...session,
          messages: [...session.messages, userMessage, initialBotMessage],
          updatedAt: Date.now()
        };
      }
      return session;
    }));

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const history = currentChat ? currentChat.messages : [];
      
      await sendMessageToGemini(history, text, attachments, (streamedText, metadata, suggestions) => {
        setSessions(currentSessions => currentSessions.map(session => {
            if (session.id === activeId) {
                const updatedMessages = session.messages.map(msg => {
                    if (msg.id === botMessageId) {
                        return { 
                            ...msg, 
                            text: streamedText, 
                            groundingMetadata: metadata,
                            suggestions: suggestions
                        };
                    }
                    return msg;
                });
                return { ...session, messages: updatedMessages };
            }
            return session;
        }));
      });
      
      setTimeout(async () => {
          const freshSessions = JSON.parse(localStorage.getItem('ecoSci_sessions') || '[]');
          const freshCurrent = freshSessions.find((s: ChatSession) => s.id === activeId);
          if (freshCurrent && (freshCurrent.title === 'New Investigation' || freshCurrent.messages.length <= 4)) {
              const newTitle = await generateChatTitle(freshCurrent.messages);
              setSessions(prev => prev.map(s => s.id === activeId ? { ...s, title: newTitle } : s));
          }
      }, 500);

    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error(error);
      
      setSessions(prev => prev.map(session => {
        if (session.id === activeId) {
             const messages = session.messages.map(msg => {
                 if (msg.id === botMessageId) {
                     return { 
                         ...msg, 
                         text: msg.text + (msg.text ? "\n\n" : "") + "*[Connection Error: The response was interrupted. Please try again.]*"
                     };
                 }
                 return msg;
             });
            return { ...session, messages, updatedAt: Date.now() };
        }
        return session;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
        sessions={sessions} currentChatId={currentChatId}
        onSelectChat={(id) => { setCurrentChatId(id); setIsLoading(false); setViewMode('chat'); }}
        onNewChat={handleNewChat} onDeleteChat={deleteChat}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <main className="flex-1 flex flex-col h-full relative w-full">
        {/* Top Header */}
        <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm z-10 h-16">
            <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg md:hidden"><Menu size={22} /></button>
                <div className="flex flex-col">
                    <span className="font-bold text-gray-800 truncate max-w-[200px] text-lg leading-tight">{currentChat?.title || 'EcoSci'}</span>
                    <span className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">
                        {viewMode === 'gallery' ? 'Visual Library' : viewMode === 'journal' ? 'Researcher Profile' : 'Active Fieldwork'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {currentChat && currentChat.messages.length > 0 && viewMode === 'chat' && (
                     <button 
                        onClick={() => setShowLabReport(true)}
                        className="hidden md:flex p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg items-center gap-2 font-semibold text-sm transition-colors"
                        title="Generate PDF Report"
                     >
                        <span>Export Report</span>
                        <FlaskConical size={18} />
                     </button>
                )}
                
                <button 
                  onClick={handleNewChat} 
                  className="p-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg flex items-center gap-2 font-semibold text-sm transition-colors"
                >
                    <span className="hidden sm:inline">New Expedition</span>
                    <MessageSquarePlus size={20} />
                </button>
            </div>
        </header>

        {/* MAIN CONTENT AREA */}
        {viewMode === 'gallery' ? (
            <div className="flex-1 overflow-hidden bg-gray-50">
                <GalleryView items={allGalleryItems} onImageClick={handleImageClick} />
            </div>
        ) : viewMode === 'journal' ? (
             <div className="flex-1 overflow-hidden bg-gray-50">
                <FieldJournal userProfile={userProfile} />
             </div>
        ) : (
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scroll-smooth">
            <div className="max-w-4xl mx-auto min-h-full">
                {!currentChat || currentChat.messages.length === 0 ? (
                // DYNAMIC HUB / EMPTY STATE
                <div className="flex-1 flex flex-col items-center justify-center py-10 animate-in fade-in slide-in-from-bottom-4">
                    <div className="text-center mb-10 max-w-2xl">
                         <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Mission Control</h2>
                         <p className="text-gray-500 text-lg">Welcome to the Field, Researcher. Choose your expedition path.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl px-4">
                        {/* Path 1: Identification */}
                        <button 
                            onClick={() => handleSendMessage("Identify a Specimen", [])}
                            className="group relative p-6 bg-white rounded-3xl border-2 border-transparent hover:border-green-400 shadow-sm hover:shadow-xl transition-all text-left flex flex-col h-64 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Telescope size={100} />
                            </div>
                            <div className="bg-green-100 w-12 h-12 rounded-2xl flex items-center justify-center text-green-700 mb-auto">
                                <Telescope size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Identify Specimen</h3>
                                <p className="text-sm text-gray-500 mb-4">Upload photos for morphological breakdown and taxonomic ID.</p>
                                <div className="flex items-center gap-2 text-green-600 font-bold text-sm group-hover:gap-4 transition-all">
                                    Start Analysis <ArrowRight size={16} />
                                </div>
                            </div>
                        </button>

                        {/* Path 2: Lab Report */}
                        <button 
                             onClick={() => handleSendMessage("Start Lab Report", [])}
                            className="group relative p-6 bg-white rounded-3xl border-2 border-transparent hover:border-blue-400 shadow-sm hover:shadow-xl transition-all text-left flex flex-col h-64 overflow-hidden"
                        >
                             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <FlaskConical size={100} />
                            </div>
                            <div className="bg-blue-100 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-700 mb-auto">
                                <FlaskConical size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Start Lab Report</h3>
                                <p className="text-sm text-gray-500 mb-4">Compile observations into formal scientific documentation.</p>
                                <div className="flex items-center gap-2 text-blue-600 font-bold text-sm group-hover:gap-4 transition-all">
                                    Open Editor <ArrowRight size={16} />
                                </div>
                            </div>
                        </button>

                        {/* Path 3: Bio-Blitz */}
                        <button 
                             onClick={() => handleSendMessage("Join Bio-Blitz", [])}
                            className="group relative p-6 bg-white rounded-3xl border-2 border-transparent hover:border-orange-400 shadow-sm hover:shadow-xl transition-all text-left flex flex-col h-64 overflow-hidden"
                        >
                             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Users size={100} />
                            </div>
                            <div className="bg-orange-100 w-12 h-12 rounded-2xl flex items-center justify-center text-orange-700 mb-auto">
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Join Bio-Blitz</h3>
                                <p className="text-sm text-gray-500 mb-4">Contribute to local biodiversity surveys and community science.</p>
                                <div className="flex items-center gap-2 text-orange-600 font-bold text-sm group-hover:gap-4 transition-all">
                                    View Events <ArrowRight size={16} />
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Quick Prompts */}
                    <div className="mt-10 flex gap-2 overflow-x-auto max-w-2xl px-4 pb-2">
                        {FALLBACK_SUGGESTIONS.map((sug, idx) => (
                             <button 
                                key={idx} 
                                onClick={() => handleSendMessage(sug, [])} 
                                className="whitespace-nowrap px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                            >
                                {sug}
                            </button>
                        ))}
                    </div>
                </div>
                ) : (
                currentChat.messages.map((msg, idx) => (
                    <MessageBubble 
                        key={msg.id} 
                        message={msg} 
                        isStreaming={isLoading && idx === currentChat.messages.length - 1 && msg.role === Role.MODEL}
                        onSuggestionClick={(text) => handleSendMessage(text, [])}
                        onImageClick={handleImageClick}
                    />
                ))
                )}
                
                <div ref={chatEndRef} className="h-10" />
            </div>
            </div>
        )}

        {/* Input Area */}
        <div className="bg-white/90 backdrop-blur-md border-t border-gray-200 sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <InputArea onSend={handleSendMessage} isLoading={isLoading} />
        </div>
        
        {/* MODALS */}
        {lightboxIndex !== -1 && (
            <ImageModal 
                items={allGalleryItems}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxIndex(-1)}
            />
        )}
        
        {showLabReport && currentChat && (
            <LabReportView 
                title={currentChat.title}
                messages={currentChat.messages}
                onClose={() => setShowLabReport(false)}
            />
        )}
      </main>
    </div>
  );
};

export default App;