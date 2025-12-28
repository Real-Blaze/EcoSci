import React, { useState } from 'react';
import { Message, Role } from '../types';
import { MarkdownRenderer } from '../utils/markdown';
import { Bot, User, Globe, ExternalLink, ChevronDown, ChevronUp, Copy, Check, Download, Sparkles, Volume2, Square } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onSuggestionClick?: (text: string) => void;
  onImageClick?: (src: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming = false, onSuggestionClick, onImageClick }) => {
  const [showAllSources, setShowAllSources] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isUser = message.role === Role.USER;

  // Extract sources if they exist
  const allSources = message.groundingMetadata?.groundingChunks?.filter(c => c.web).map(c => c.web!) || [];
  
  const displayedSources = showAllSources ? allSources : allSources.slice(0, 3);
  const hasMore = allSources.length > 3;

  const handleCopy = async () => {
    try {
        await navigator.clipboard.writeText(message.text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
        console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([message.text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `ecosci-response-${new Date().getTime()}.txt`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message.text);
    
    // Attempt to find a clear male voice
    const voices = window.speechSynthesis.getVoices();
    const maleVoice = voices.find(v => 
      (v.name.includes('Google US English') || v.name.includes('David') || v.name.toLowerCase().includes('male')) && v.lang.startsWith('en')
    );
    
    if (maleVoice) {
      utterance.voice = maleVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col max-w-[95%] md:max-w-[80%] lg:max-w-[70%] min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
        
        <div className={`flex gap-3 md:gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} w-full`}>
            <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm ${isUser ? 'bg-gray-200' : 'bg-green-600'}`}>
            {isUser ? <User size={18} className="text-gray-600" /> : <Bot size={22} className="text-white" />}
            </div>

            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0 overflow-hidden w-full`}>
            <div className={`relative w-full px-5 py-3.5 md:px-6 md:py-4 rounded-2xl shadow-sm text-sm md:text-base group ${
                isUser 
                ? 'bg-green-50 text-gray-800 border border-green-100 rounded-tr-sm' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
            }`}>
                
                {/* Attachments (User Images) */}
                {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {message.attachments.map((att, idx) => (
                    <div 
                        key={idx} 
                        className="relative group overflow-hidden rounded-lg border border-gray-200 cursor-pointer"
                        onClick={() => onImageClick && onImageClick(`data:${att.mimeType};base64,${att.data}`)}
                    >
                        <img 
                        src={`data:${att.mimeType};base64,${att.data}`} 
                        alt="User attachment" 
                        className="h-32 w-auto object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    </div>
                    ))}
                </div>
                )}

                {/* Text Content */}
                <MarkdownRenderer content={message.text} onImageClick={onImageClick} />
                
                {isStreaming && (
                    <div className="flex gap-1 mt-3 mb-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></div>
                    </div>
                )}
                
                {!isStreaming && (
                    <div className={`text-[10px] mt-2 opacity-50 ${isUser ? 'text-right' : 'text-left'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}

                {!isUser && !isStreaming && (
                    <div className="absolute -bottom-8 left-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                            onClick={handleSpeak}
                            className={`flex items-center gap-1.5 px-2 py-1 bg-white border rounded-md shadow-sm text-xs font-medium hover:border-green-200 ${isSpeaking ? 'text-green-600 border-green-200' : 'text-gray-600 border-gray-200 hover:text-green-600'}`}
                            title="Read Aloud"
                        >
                            {isSpeaking ? <Square size={12} className="fill-current" /> : <Volume2 size={12} />}
                            {isSpeaking ? 'Stop' : 'Read'}
                        </button>
                        <button 
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded-md shadow-sm text-xs font-medium text-gray-600 hover:text-green-600 hover:border-green-200"
                        >
                            {isCopied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                            {isCopied ? 'Copied' : 'Copy'}
                        </button>
                        <button 
                            onClick={handleDownload}
                            className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded-md shadow-sm text-xs font-medium text-gray-600 hover:text-green-600 hover:border-green-200"
                        >
                            <Download size={12} />
                            Save
                        </button>
                    </div>
                )}
            </div>

            {/* Grounding Sources */}
            {!isUser && allSources.length > 0 && (
                <div className="mt-2 w-full max-w-full bg-white/60 p-2.5 rounded-2xl border border-green-100/50">
                <div 
                    className="flex items-center justify-between mb-2 cursor-pointer group px-1"
                    onClick={() => hasMore && setShowAllSources(!showAllSources)}
                >
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-800 uppercase tracking-widest">
                        <Globe size={10} />
                        Sources ({allSources.length})
                    </div>
                    {hasMore && (
                        <div className="text-green-600 group-hover:bg-green-100 p-1 rounded-full transition-colors">
                            {showAllSources ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </div>
                    )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {displayedSources.map((source, idx) => (
                    <a 
                        key={idx}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 p-1.5 rounded-xl bg-white hover:bg-green-50 border border-gray-100 hover:border-green-200 transition-all text-xs text-gray-600 hover:text-green-900 group shadow-sm hover:shadow-md"
                    >
                        <div className="mt-0.5 bg-gray-50 p-1 rounded-md group-hover:bg-green-200/50 transition-colors flex-shrink-0">
                        <ExternalLink size={9} />
                        </div>
                        <span className="line-clamp-2 leading-tight break-words text-[11px] font-medium">{source.title}</span>
                    </a>
                    ))}
                </div>
                
                {hasMore && !showAllSources && (
                    <button 
                        onClick={() => setShowAllSources(true)}
                        className="w-full text-center text-[10px] text-green-600 hover:text-green-800 mt-1.5 font-semibold uppercase tracking-wider hover:underline"
                    >
                        + {allSources.length - 3} more
                    </button>
                )}
                </div>
            )}
            </div>
        </div>

        {/* Follow-up Suggestions */}
        {!isUser && !isStreaming && message.suggestions && message.suggestions.length > 0 && (
             <div className="mt-4 flex flex-wrap gap-2 ml-12 md:ml-14">
                {message.suggestions.map((sug, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSuggestionClick && onSuggestionClick(sug)}
                        className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-green-50 border border-green-200 hover:border-green-300 rounded-full text-sm text-green-800 transition-all shadow-sm hover:shadow-md text-left"
                    >
                        <Sparkles size={14} className="text-green-500 flex-shrink-0" />
                        <span>{sug}</span>
                    </button>
                ))}
             </div>
        )}
      </div>
    </div>
  );
};