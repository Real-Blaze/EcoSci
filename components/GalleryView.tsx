import React from 'react';
import { Grid, ImageIcon } from 'lucide-react';
import { GalleryItem } from '../types';

interface GalleryViewProps {
  items: GalleryItem[];
  onImageClick: (src: string) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({ items, onImageClick }) => {
  // Create a copy and reverse to show newest first
  const displayItems = [...items].reverse();

  if (displayItems.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-10">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ImageIcon size={32} className="opacity-50" />
              </div>
              <p className="font-medium">No images found in this project yet.</p>
              <p className="text-sm mt-2">Ask EcoSci to show you plants or animals!</p>
          </div>
      );
  }

  return (
    <div className="p-4 md:p-8 overflow-y-auto h-full">
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
                <Grid size={20} className="text-green-600" />
                <h2 className="text-xl font-bold text-gray-800">Project Gallery ({displayItems.length})</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayItems.map((item, idx) => (
                    <div 
                        key={idx} 
                        className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer border border-gray-200 shadow-sm hover:shadow-md transition-all"
                        onClick={() => onImageClick(item.src)}
                    >
                        <img 
                            src={item.src} 
                            alt={item.alt} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <p className="text-white text-xs font-medium line-clamp-1">{item.alt}</p>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-white/80 text-[10px]">{item.isUser ? 'Upload' : 'EcoSci'}</span>
                                <span className="text-white/80 text-[10px]">{new Date(item.timestamp).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};