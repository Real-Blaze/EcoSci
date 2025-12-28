import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, ChevronLeft, ChevronRight, Calendar, User, Globe } from 'lucide-react';
import { GalleryItem } from '../types';

interface ImageModalProps {
  items: GalleryItem[];
  initialIndex: number;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ items, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentItem = items[currentIndex];

  // Update internal state if props change drastically (though usually this unmounts)
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentItem.src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ecosci-${currentItem.alt.replace(/\s+/g, '-').toLowerCase() || 'image'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      window.open(currentItem.src, '_blank');
    }
  };

  if (!currentItem) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 animate-in fade-in duration-200 backdrop-blur-sm">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
      >
        <X size={24} />
      </button>

      {/* Navigation Buttons */}
      {items.length > 1 && (
        <>
            <button 
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-4 md:left-8 z-20 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:scale-110"
            >
                <ChevronLeft size={32} />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-4 md:right-8 z-20 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:scale-110"
            >
                <ChevronRight size={32} />
            </button>
        </>
      )}

      <div className="relative w-full h-full flex flex-col md:flex-row">
          
          {/* Image Area */}
          <div className="flex-1 flex items-center justify-center p-4 md:p-10 h-[60%] md:h-full">
            <img 
            src={currentItem.src} 
            alt={currentItem.alt} 
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Sidebar / Info Area */}
          <div className="w-full md:w-96 bg-gray-900/50 md:bg-gray-900 md:border-l border-white/10 p-6 flex flex-col justify-between h-[40%] md:h-full overflow-y-auto backdrop-blur-md md:backdrop-blur-none">
            <div>
                <h3 className="text-white font-bold text-xl md:text-2xl mb-4 leading-tight">{currentItem.alt || 'Scientific Observation'}</h3>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-gray-300 text-sm">
                        <Calendar size={16} className="text-green-500" />
                        <span>{new Date(currentItem.timestamp).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-gray-300 text-sm">
                        <User size={16} className="text-green-500" />
                        <span>{currentItem.isUser ? 'Uploaded by You' : 'EcoSci AI'}</span>
                    </div>

                    {!currentItem.isUser && (
                         <div className="flex items-center gap-3 text-gray-300 text-sm break-all">
                            <Globe size={16} className="text-green-500 flex-shrink-0" />
                            <a href={currentItem.src} target="_blank" rel="noreferrer" className="hover:text-green-400 hover:underline truncate">
                                {new URL(currentItem.src).hostname}
                            </a>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-3 mt-8">
                 <button 
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
                >
                    <Download size={18} />
                    Download Image
                </button>
                <a 
                    href={currentItem.src} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
                >
                    <ExternalLink size={18} />
                    Open Source
                </a>
            </div>
            
            <div className="mt-6 text-center text-xs text-gray-500">
                Image {currentIndex + 1} of {items.length}
            </div>
          </div>
      </div>
    </div>
  );
};