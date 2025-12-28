import React, { useState } from 'react';
import { ExternalLink, ImageOff, Loader2, ZoomIn } from 'lucide-react';

// Props for the ImagePreview component
interface ImagePreviewProps {
    src: string;
    alt: string;
    onImageClick?: (src: string) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ src, alt, onImageClick }) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  // Filter out common Wikimedia HTML page patterns if they slip through
  const isLikelyHtml = src.includes('/wiki/File:') || src.includes('index.php');
  
  if (isLikelyHtml && status !== 'error') {
    setStatus('error');
  }

  return (
    <>
      <div 
        className={`inline-block mr-2 mb-2 group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition-all hover:shadow-md cursor-pointer ${status === 'error' ? 'hidden' : ''}`}
        onClick={() => status === 'loaded' && onImageClick && onImageClick(src)}
      >
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10 h-32 w-32 md:h-40 md:w-40">
            <Loader2 size={20} className="animate-spin text-green-600/50" />
          </div>
        )}

        {/* Note: We hide the error state completely as per user request to not see broken links */}
        <img 
            src={src} 
            alt={alt} 
            className={`h-32 md:h-40 w-auto min-w-[120px] object-cover transition-all duration-300 group-hover:scale-105 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('error')}
            loading="lazy"
            referrerPolicy="no-referrer"
        />

        {status === 'loaded' && (
            <div 
              className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
               <div className="bg-white/90 p-2 rounded-full shadow-lg text-green-700">
                  <ZoomIn size={18} />
               </div>
            </div>
        )}
      </div>
    </>
  );
};

// We need to pass the click handler deeply, so we use a wrapper context or just pass it down
export const MarkdownRenderer = ({ content, onImageClick }: { content: string, onImageClick?: (src: string) => void }) => {
  
  // Helper to parse inline markdown
  const parseInline = (text: string): React.ReactNode[] => {
    const regex = /(!\[.*?\]\(.*?\))|(\[.*?\]\(.*?\))|(\*\*.*?\*\*)|(\*.*?\*)|(`.*?`)/g;
    const parts = text.split(regex).filter(p => p); 

    return parts.map((part, index) => {
        // Explicit markdown images ![alt](url)
        if (part.startsWith('![') && part.includes('](') && part.endsWith(')')) {
            const match = part.match(/!\[(.*?)\]\((.*?)\)/);
            if (match) return <ImagePreview key={index} src={match[2]} alt={match[1]} onImageClick={onImageClick} />;
        }
        
        // Standard links [alt](url) - check if image
        if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
                const url = match[2];
                const text = match[1];
                
                if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)($|\?)/i.test(url)) {
                    return <ImagePreview key={index} src={url} alt={text} onImageClick={onImageClick} />;
                }
                
                return <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 underline font-medium break-words">{text}</a>;
            }
        }
        
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
        if (part.startsWith('*') && part.endsWith('*')) return <em key={index} className="italic text-gray-700">{part.slice(1, -1)}</em>;
        if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono">{part.slice(1, -1)}</code>;
        return <span key={index}>{part}</span>;
    });
  };

  const TableRenderer: React.FC<{ rows: string[] }> = ({ rows }) => {
    if (rows.length < 2) return null;
    const headers = rows[0].split('|').filter(c => c.trim() !== '');
    const dataRows = rows.slice(2).map(row => row.split('|').filter(c => c.trim() !== ''));

    return (
        <div className="block w-full my-6 overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {headers.map((h, idx) => (
                            <th key={idx} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                {parseInline(h.trim())}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {dataRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-gray-50 transition-colors">
                            {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-4 py-3 text-sm text-gray-700">
                                    {parseInline(cell.trim())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
  }

  if (!content) return null;
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      const language = trimmed.replace('```', '').trim();
      const codeLines = []; i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { codeLines.push(lines[i]); i++; }
      i++;
      elements.push(
        <div key={i} className="my-4 bg-gray-900 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 overflow-x-auto text-sm text-gray-100 font-mono"><pre>{codeLines.join('\n')}</pre></div>
        </div>
      );
      continue;
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        elements.push(<hr key={i} className="my-6 border-t border-gray-200" />);
        i++;
        continue;
    }

    if (trimmed.startsWith('|') && i + 1 < lines.length && lines[i+1].includes('---')) {
        const tableRows = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) { tableRows.push(lines[i]); i++; }
        elements.push(<TableRenderer key={i} rows={tableRows} />);
        continue;
    }

    if (line.startsWith('#')) {
        const match = line.match(/^(#+)\s*(.*)/);
        if (match) {
            const level = match[1].length;
            const text = match[2];
            const className = level === 1 ? "text-2xl font-black text-green-950 mt-8 mb-4" : "text-xl font-bold text-green-900 mt-6 mb-3";
            elements.push(React.createElement(`h${level}`, { key: i, className }, parseInline(text)));
            i++; continue;
        }
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
        elements.push(<div key={i} className="flex gap-2 my-1 ml-2 text-gray-800 leading-relaxed"><span>•</span><span>{parseInline(trimmed.replace(/^[-*]\s|^\d+\.\s/, ''))}</span></div>);
        i++; continue;
    }

    if (!trimmed) { elements.push(<div key={i} className="h-4" />); i++; continue; }
    elements.push(<div key={i} className="mb-2 text-gray-800 leading-relaxed">{parseInline(line)}</div>);
    i++;
  }

  return <div className="w-full">{elements}</div>;
};