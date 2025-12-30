
import React, { useState, useEffect } from 'react';
import { AccessorySuggestion, AnalysisCategory } from '../types';
import { gemini } from '../geminiService';

interface AccessoryCardProps {
  suggestion: AccessorySuggestion;
  showDetails?: boolean;
}

// Curated high-end fashion placeholders for when AI generation hits limits
const CATEGORY_FALLBACKS: Record<string, string> = {
  [AnalysisCategory.WATCHES]: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=60&w=800",
  [AnalysisCategory.SHOES]: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=60&w=800",
  [AnalysisCategory.JEWELRY]: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=60&w=800",
  [AnalysisCategory.BAGS]: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=60&w=800",
  [AnalysisCategory.EYEWEAR]: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=60&w=800",
  [AnalysisCategory.CLOTHING]: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&q=60&w=800",
  "default": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=60&w=800"
};

const AccessoryCard: React.FC<AccessoryCardProps> = ({ suggestion, showDetails = true }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(suggestion.imageUrl || null);
  const [loading, setLoading] = useState(!suggestion.imageUrl);

  useEffect(() => {
    const fetchImage = async () => {
      setLoading(true);
      try {
        const url = await gemini.getProductImage(suggestion);
        if (url) setImageUrl(url);
      } catch (e) {
        console.error("Card image fetch failed, using fallback.");
      } finally {
        setLoading(false);
      }
    };

    if (!imageUrl) {
      fetchImage();
    }
  }, [suggestion.id]);

  const findSimilar = () => {
    const query = encodeURIComponent(`${suggestion.name} ${suggestion.category}`);
    window.open(`https://www.google.com/search?q=${query}&tbm=shop`, '_blank');
  };

  // Determine which symbolic image to show if AI is unavailable
  const fallback = CATEGORY_FALLBACKS[suggestion.category] || CATEGORY_FALLBACKS.default;

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-neutral-100 luxury-shadow flex flex-col group transition-all hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-neutral-400">Consulting Stylist...</span>
          </div>
        ) : (
          <img 
            src={imageUrl || fallback} 
            alt={suggestion.name} 
            className={`w-full h-full object-cover transition-opacity duration-1000 ${imageUrl ? 'opacity-100' : 'opacity-60 grayscale-[0.3]'}`}
          />
        )}
        
        {!loading && !imageUrl && (
          <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/20 to-transparent">
             <span className="text-[8px] text-white/70 uppercase font-bold tracking-widest italic">Aura Signature Visual</span>
          </div>
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
