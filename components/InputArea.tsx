import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Loader2, Mic, MicOff, Camera } from 'lucide-react';
import { Attachment } from '../types';

interface InputAreaProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
      // Initialize Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';
          
          recognition.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript;
              setText(prev => prev + (prev ? ' ' : '') + transcript);
              setIsListening(false);
          };

          recognition.onerror = (event: any) => {
              console.error(event.error);
              setIsListening(false);
          };
          
          recognition.onend = () => {
              setIsListening(false);
          };

          recognitionRef.current = recognition;
      }
  }, []);

  const toggleListening = () => {
      if (!recognitionRef.current) {
          alert("Voice input is not supported in this browser.");
          return;
      }

      if (isListening) {
          recognitionRef.current.stop();
          setIsListening(false);
      } else {
          recognitionRef.current.start();
          setIsListening(true);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    onSend(text, attachments);
    setText('');
    setAttachments([]);
    // Reset textarea height
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      
      const readFile = (file: File): Promise<Attachment> => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve({
              mimeType: file.type,
              data: base64String
            });
          };
          reader.readAsDataURL(file);
        });
      };

      try {
        const results = await Promise.all(files.map(readFile));
        setAttachments(prev => [...prev, ...results]);
      } catch (error) {
        console.error("Error reading files", error);
      }
    }
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const target = e.target;
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
      setText(target.value);
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto pb-2 px-1">
          {attachments.map((att, i) => (
            <div key={i} className="relative group flex-shrink-0">
              <img 
                src={`data:${att.mimeType};base64,${att.data}`} 
                alt="preview" 
                className="h-16 w-16 object-cover rounded-lg border border-green-200" 
              />
              <button 
                onClick={() => removeAttachment(i)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Box */}
      <div className={`relative flex items-end gap-2 bg-white rounded-2xl border transition-all shadow-sm ${
        isLoading 
          ? 'border-gray-200 opacity-80' 
          : 'border-gray-300 focus-within:border-green-500 focus-within:shadow-md'
      } p-2`}>
        
        {/* Attachment Options */}
        <div className="flex items-center">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors outline-none focus:outline-none hidden sm:block"
                title="Attach images"
                disabled={isLoading}
            >
                <Paperclip size={20} />
            </button>
            
            {/* Mobile Camera Button - Only shows on small screens usually, but useful everywhere */}
            <button 
                onClick={() => cameraInputRef.current?.click()}
                className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors outline-none focus:outline-none"
                title="Take Photo"
                disabled={isLoading}
            >
                <Camera size={20} />
            </button>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*"
          multiple
        />
        {/* Input specifically for camera capture */}
        <input 
          type="file" 
          ref={cameraInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*"
          capture="environment"
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={autoResize}
          onKeyDown={handleKeyDown}
          placeholder={attachments.length > 0 ? "Ask about these images..." : "Type or speak observation..."}
          className="flex-1 max-h-40 min-h-[50px] bg-transparent border-none focus:ring-0 focus:outline-none resize-none py-3 text-gray-800 placeholder-gray-400 outline-none"
          rows={1}
          disabled={isLoading}
        />

        <div className="flex items-center gap-1">
             <button
                onClick={toggleListening}
                className={`p-3 rounded-xl transition-all duration-200 outline-none focus:outline-none ${
                    isListening 
                    ? 'bg-red-100 text-red-600 animate-pulse' 
                    : 'text-gray-400 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Voice Input"
             >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
             </button>

            <button 
                onClick={handleSend}
                disabled={(!text.trim() && attachments.length === 0) || isLoading}
                className={`p-3 rounded-xl transition-all duration-200 outline-none focus:outline-none ${
                    text.trim() || attachments.length > 0
                    ? 'bg-green-600 text-white shadow-md hover:bg-green-700' 
                    : 'bg-gray-100 text-gray-400'
                }`}
            >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
        </div>
      </div>
      
      {isListening && <div className="text-xs text-center mt-2 text-red-500 font-medium animate-pulse">Listening... Speak clearly</div>}
    </div>
  );
};