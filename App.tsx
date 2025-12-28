
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Menu, MessageSquarePlus, Telescope, FlaskConical, Users, ArrowRight, Compass, Sparkles } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { InputArea } from './components/InputArea';
import { GalleryView } from './components/GalleryView';
import { ImageModal } from './components/ImageModal';
import { FieldJournal } from './components/FieldJournal';
import { LabReportView } from './components/LabReportView';
import { MissionSelector } from './components/MissionSelector';
import { LevelUpModal } from './components/LevelUpModal';
import { CommunityBench } from './components/CommunityBench';
import { sendMessageToGemini, generateChatTitle } from './services/geminiService';
import { ChatSession, Message, Role, Attachment, GalleryItem, UserProfile, MissionType, Post } from './types';
import { FALLBACK_SUGGESTIONS, BADGES_LIST, RANKS, DAILY_CHALLENGES, MISSION_TYPES, INITIAL_POSTS } from './constants';

const generateId = () => Math.random().toString(36).substring(2, 15);

type ViewMode = 'chat' | 'gallery' | 'journal' | 'community';

const App: React.FC = () => {
  // --- STATE ---
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('ecoSci_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('ecoSci_posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
      const saved = localStorage.getItem('ecoSci_profile');
      return saved ? JSON.parse(saved) : {
          name: 'Student-01',
          bio: 'Aspiring field researcher.',
          specialization: 'Generalist',
          avatar: 'https://i.pravatar.cc/150?u=student',
          xp: 0,
          level: 1,
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
  const [dailyMission, setDailyMission] = useState("");
  
  // New State for "World Class" Features
  const [showMissionSelector, setShowMissionSelector] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
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

  useEffect(() => {
      localStorage.setItem('ecoSci_posts', JSON.stringify(posts));
  }, [posts]);

  // Initialization & Gamification Logic (Streaks & Daily Mission)
  useEffect(() => {
    const saved = localStorage.getItem('ecoSci_sessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) setCurrentChatId(parsed[0].id);
      else setShowMissionSelector(true); // Open selector if no chats
    } else {
      setShowMissionSelector(true);
    }

    // Set Daily Mission based on day of month to be consistent for the day
    const dayOfMonth = new Date().getDate();
    setDailyMission(DAILY_CHALLENGES[dayOfMonth % DAILY_CHALLENGES.length]);

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
            streakDays: newStreak,
            xp: prev.xp + 50 // Login bonus
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
          
          return {
              ...prev,
              badges: [...prev.badges, { ...badgeInfo, unlockedAt: Date.now() }]
          };
      });
  };

  const addXp = (amount: number) => {
      setUserProfile(prev => {
          const newXp = prev.xp + amount;
          // Calculate level (every 300 xp)
          const newLevel = Math.floor(newXp / 300) + 1;
          
          if (newLevel > prev.level) {
              setShowLevelUp(true);
          }

          return {
              ...prev,
              xp: newXp,
              level: newLevel
          };
      });
  };

  const handleImageClick = (src: string) => {
    const index = allGalleryItems.findIndex(item => item.src === src);
    if (index !== -1) setLightboxIndex(index);
  };

  const initNewChat = () => {
      // Instead of creating directly, open selector
      setShowMissionSelector(true);
  };

  const handleStartMission = (type: MissionType) => {
    if (isLoading) handleStopGeneration();
    const mission = MISSION_TYPES.find(m => m.id === type);
    
    const newChat: ChatSession = {
      id: generateId(),
      title: `New ${mission?.label || 'Expedition'}`,
      missionType: type,
      messages: [],
      updatedAt: Date.now()
    };
    
    setSessions(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setIsSidebarOpen(false);
    setIsLoading(false);
    setViewMode('chat');
    setShowMissionSelector(false);

    // Inject hidden system prompt as a fake message context (or just send a greeting)
    // We will do a user message to kickstart it nicely
    setTimeout(() => {
        handleSendMessage(`[SYSTEM: Initializing ${mission?.label} Mode. ${mission?.prompt}]`, [], true);
    }, 100);
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

  const handleSendMessage = async (text: string, attachments: Attachment[], isSystemInit = false) => {
    let activeId = currentChatId;
    if (!activeId) {
        // Create default chat if sending from community bench without active chat
        const newId = generateId();
        const newChat: ChatSession = {
            id: newId,
            title: "Community Bench Analysis",
            messages: [],
            updatedAt: Date.now()
        };
        setSessions(prev => [newChat, ...prev]);
        activeId = newId;
        setCurrentChatId(newId);
    }
    
    // Auto switch to chat view to see response
    setViewMode('chat');

    // --- GAMIFICATION ENGINE ---
    if (!isSystemInit) {
        const lowerText = text.toLowerCase();
        const now = new Date();
        const hour = now.getHours();

        if (lowerText.includes('report')) unlockBadge('publisher');
        if (lowerText.includes('bio-blitz')) unlockBadge('bioblitz');
        if (hour >= 22 || hour < 4) unlockBadge('night_owl');
        if (hour >= 5 && hour < 8) unlockBadge('early_bird');

        let xpGain = 10;
        if (attachments.length > 0) {
            xpGain += 50;
            setUserProfile(prev => {
                const newCount = prev.observationsCount + attachments.length;
                if (newCount >= 10) setTimeout(() => unlockBadge('shutterbug'), 0);
                if (newCount >= 5) setTimeout(() => unlockBadge('taxonomist'), 0); 
                return {...prev, observationsCount: newCount};
            });
            unlockBadge('novice_observer');
        }
        addXp(xpGain);
    }
    // ---------------------------

    const userMessage: Message = {
      id: generateId(),
      role: Role.USER,
      text: isSystemInit ? "Ready for expedition." : text, 
      attachments: attachments,
      timestamp: Date.now()
    };
    
    // --- CONTEXT INJECTION FOR AI ---
    let messageTextToSend = text;
    if (isSystemInit) {
         userMessage.text = "Initializing Expedition Protocols...";
         messageTextToSend = text; 
    } else if (viewMode === 'community' || text.toLowerCase().includes('community') || text.toLowerCase().includes('post')) {
        // If coming from Community Bench or asking about community, inject post data
        const communityContext = JSON.stringify(posts.map(p => ({
            id: p.id,
            author: p.user,
            title: p.title,
            description: p.description,
            tags: p.tags,
            likes: p.likes
        })));
        messageTextToSend = `[SYSTEM CONTEXT: The user is currently looking at the Community Bench. Here are the visible posts: ${communityContext}]\n\nUser Question: ${text}`;
    }
    // -------------------------------

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
      const history = sessions.find(s => s.id === activeId)?.messages || [];
      
      await sendMessageToGemini(history, messageTextToSend, attachments, (streamedText, metadata, suggestions) => {
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
      
      if (!isSystemInit) {
        setTimeout(async () => {
            const freshSessions = JSON.parse(localStorage.getItem('ecoSci_sessions') || '[]');
            const freshCurrent = freshSessions.find((s: ChatSession) => s.id === activeId);
            if (freshCurrent && (freshCurrent.title.startsWith('New') || freshCurrent.messages.length <= 4)) {
                const newTitle = await generateChatTitle(freshCurrent.messages);
                setSessions(prev => prev.map(s => s.id === activeId ? { ...s, title: newTitle } : s));
            }
        }, 500);
      }

    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error(error);
      setSessions(prev => prev.map(session => {
        if (session.id === activeId) {
             const messages = session.messages.map(msg => {
                 if (msg.id === botMessageId) {
                     return { ...msg, text: msg.text + (msg.text ? "\n\n" : "") + "*[Connection Error]*" };
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
        onNewChat={initNewChat} onDeleteChat={deleteChat}
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
                        {viewMode === 'gallery' ? 'Visual Library' : 
                         viewMode === 'journal' ? 'Researcher Profile' : 
                         viewMode === 'community' ? 'Community Bench' : 'Active Fieldwork'}
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
                  onClick={initNewChat} 
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
                <FieldJournal 
                    userProfile={userProfile} 
                    onUpdateProfile={(updated) => setUserProfile(updated)}
                />
             </div>
        ) : viewMode === 'community' ? (
             <div className="flex-1 overflow-hidden bg-gray-50">
                <CommunityBench 
                    onSendMessage={handleSendMessage} 
                    posts={posts}
                    setPosts={setPosts}
                    userProfile={userProfile}
                />
             </div>
        ) : (
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scroll-smooth">
            <div className="max-w-4xl mx-auto min-h-full">
                {!currentChat || currentChat.messages.length === 0 ? (
                // DYNAMIC HUB / EMPTY STATE
                <div className="flex-1 flex flex-col items-center justify-center py-10 animate-in fade-in slide-in-from-bottom-4">
                    <div className="text-center mb-10 max-w-2xl px-2">
                         <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Mission Control</h2>
                         <p className="text-gray-500 text-lg">Welcome to the Field, Researcher. Choose your expedition path.</p>
                    </div>
                    
                    {/* Daily Mission Card */}
                    <div className="w-full max-w-5xl px-4 mb-6">
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 shadow-lg text-white flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-full">
                                    <Compass size={24} className="text-yellow-400" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Daily Field Mission</div>
                                    <div className="text-lg font-bold">{dailyMission}</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleSendMessage(`I am reporting for the daily mission: ${dailyMission}`, [])}
                                className="px-5 py-2 bg-yellow-400 text-gray-900 rounded-full text-xs font-bold hover:bg-yellow-300 transition-colors shadow-sm"
                            >
                                Start Mission
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl px-4">
                         <button 
                            onClick={() => initNewChat()}
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
                                <p className="text-sm text-gray-500 mb-4">Start a new identification mission.</p>
                                <div className="flex items-center gap-2 text-green-600 font-bold text-sm group-hover:gap-4 transition-all">
                                    Select Mission <ArrowRight size={16} />
                                </div>
                            </div>
                        </button>

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

                        <button 
                             onClick={() => setViewMode('community')}
                            className="group relative p-6 bg-white rounded-3xl border-2 border-transparent hover:border-indigo-400 shadow-sm hover:shadow-xl transition-all text-left flex flex-col h-64 overflow-hidden"
                        >
                             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Users size={100} />
                            </div>
                            <div className="bg-indigo-100 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-700 mb-auto">
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Community Bench</h3>
                                <p className="text-sm text-gray-500 mb-4">View 3D Phenotypes and shared findings.</p>
                                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm group-hover:gap-4 transition-all">
                                    Enter Lab <ArrowRight size={16} />
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
                                className="whitespace-nowrap px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-1.5"
                            >
                                <Sparkles size={12} className="text-green-500" />
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
        {viewMode === 'chat' && (
            <div className="bg-white/90 backdrop-blur-md border-t border-gray-200 sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <InputArea onSend={(text, att) => handleSendMessage(text, att)} isLoading={isLoading} />
            </div>
        )}
        
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

        {showMissionSelector && (
            <MissionSelector 
                onSelect={handleStartMission} 
                onCancel={() => {
                    setShowMissionSelector(false);
                    // If no chat exists, create a default one or just stay on empty screen
                    if (!currentChat) setCurrentChatId(null);
                }} 
            />
        )}

        {showLevelUp && (
            <LevelUpModal 
                level={userProfile.level} 
                xp={userProfile.xp} 
                onClose={() => setShowLevelUp(false)} 
            />
        )}
      </main>
    </div>
  );
};

export default App;
