
import React, { useState, useEffect } from 'react';
import { AccessorySuggestion } from '../types';
import { gemini } from '../geminiService';

interface AccessoryCardProps {
  suggestion: AccessorySuggestion;
  showDetails?: boolean;
}

const AccessoryCard: React.FC<AccessoryCardProps> = ({ suggestion, showDetails = true }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(suggestion.imageUrl || null);
  const [loading, setLoading] = useState(!suggestion.imageUrl);

  useEffect(() => {
    // Shared Cache Check via Service
    const fetchImage = async () => {
      setLoading(true);
      const url = await gemini.getProductImage(suggestion);
      if (url) setImageUrl(url);
      setLoading(false);
    };

    if (!imageUrl) {
      fetchImage();
    }
  }, [suggestion.id]);

  const findSimilar = () => {
    const query = encodeURIComponent(`${suggestion.name} ${suggestion.category}`);
    window.open(`https://www.google.com/search?q=${query}&tbm=shop`, '_blank');
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-neutral-100 luxury-shadow flex flex-col group transition-all hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-neutral-400">Rendering Visual...</span>
          </div>
        ) : (
          <img 
            src={imageUrl || `https://picsum.photos/seed/${suggestion.id}/500`} 
            alt={suggestion.name} 
            className="w-full h-full object-cover animate-in fade-in duration-700"
          />
        )}
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm">
            {suggestion.category}
          </span>
        </div>
      </div>
      
      {showDetails && (
        <div className="p-6 flex-1 flex flex-col">
          <div className="mb-3">
            <h3 className="text-lg font-bold leading-tight">{suggestion.name}</h3>
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium mt-1">{suggestion.category}</p>
          </div>
          
          <p className="text-xs text-neutral-500 mb-6 leading-relaxed line-clamp-2">
            {suggestion.description}
          </p>

          <button 
            onClick={findSimilar}
            className="mt-auto w-full py-3 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-all flex items-center justify-center gap-2"
          >
            Find Similar Products
          </button>
        </div>
      )}
    </div>
  );
};

export default AccessoryCard;
