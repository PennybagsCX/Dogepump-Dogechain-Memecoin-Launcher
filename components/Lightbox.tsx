
import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { Button } from './Button';

export const Lightbox: React.FC = () => {
  const { lightboxImage, closeLightbox } = useStore();

  if (!lightboxImage) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in" onClick={closeLightbox}>
       {/* Toolbar */}
       <div className="absolute top-4 right-4 flex gap-4 z-20" onClick={(e) => e.stopPropagation()}>
          <a href={lightboxImage} download="dogepump_image.png" className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors">
             <Download size={20} />
          </a>
          <button onClick={closeLightbox} className="p-3 bg-white/10 rounded-full hover:bg-red-500/20 hover:text-red-500 text-white transition-colors">
             <X size={20} />
          </button>
       </div>

       {/* Image */}
       <div className="relative max-w-full max-h-full p-4" onClick={(e) => e.stopPropagation()}>
          <img 
            src={lightboxImage} 
            alt="Full view" 
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl border border-white/5"
          />
       </div>
    </div>
  );
};
