
import React, { useState, useEffect, useRef } from 'react';
import { User, OutfitAnalysis, AnalysisCategory, CuratedSet, AccessorySuggestion } from './types';
import { gemini } from './geminiService';
import Header from './components/Header';
import Auth from './components/Auth';
import ImageUploader from './components/ImageUploader';
import AccessoryCard from './components/AccessoryCard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMoreSets, setLoadingMoreSets] = useState(false);
  const [analysis, setAnalysis] = useState<OutfitAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<AnalysisCategory>(AnalysisCategory.ALL);
  const [error, setError] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<CuratedSet | null>(null);
  
  const paymentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem('aura_email');
    const trials = parseInt(localStorage.getItem('aura_trials') || '1');
    if (savedEmail) {
      setUser({ email: savedEmail, trialsUsed: 1 - trials, isVerified: true });
    }
  }, []);

  const handleLogin = (email: string) => {
    localStorage.setItem('aura_email', email);
    localStorage.setItem('aura_trials', '1');
    setUser({ email, trialsUsed: 0, isVerified: true });
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setAnalysis(null);
    setImages([]);
    setError(null);
  };

  const handleReset = () => {
    setAnalysis(null);
    setImages([]);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToPayment = () => {
    paymentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePurchase = () => {
    if (!user) return;
    const newUser = { ...user, trialsUsed: 0 }; 
    localStorage.setItem('aura_trials', '1');
    setUser(newUser);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerLookbookVisuals = (sets: CuratedSet[], startIndex: number) => {
    if (!analysis || !images[0]) return;
    sets.forEach(async (set, relativeIndex) => {
      const globalIndex = startIndex + relativeIndex;
      const setSuggestions = analysis.suggestions.filter(s => set.itemIds.includes(s.id));
      const visual = await gemini.generateLookbookVisual(images[0], setSuggestions);
      if (visual) {
        setAnalysis(prev => {
          if (!prev) return prev;
          const updatedSets = [...prev.curatedSets];
          updatedSets[globalIndex].visualUrl = visual;
          return { ...prev, curatedSets: updatedSets };
        });
      }
    });
  };

  const handleLoadMoreLookbooks = async () => {
    if (!analysis) return;
    setLoadingMoreSets(true);
    try {
      const moreSets = await gemini.generateMoreLookbooks(analysis);
      const startIndex = analysis.curatedSets.length;
      
      setAnalysis(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          curatedSets: [...prev.curatedSets, ...moreSets]
        };
      });

      // Background visual generation for the new sets
      triggerLookbookVisuals(moreSets, startIndex);
    } catch (err) {
      console.error("Failed to load more lookbooks:", err);
    } finally {
      setLoadingMoreSets(false);
    }
  };

  const handleLoadMore = async () => {
    if (!analysis) return;
    setLoadingMore(true);
    try {
      const more = await gemini.generateMoreSuggestions(analysis);
      setAnalysis(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          suggestions: [...prev.suggestions, ...more]
        };
      });
    } catch (err) {
      console.error("Failed to load more:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleAnalyze = async () => {
    if (!user) return;
    if (user.trialsUsed >= 1) {
      setError("Free trial used. A contribution of ₹10 is required per analysis.");
      setTimeout(scrollToPayment, 100);
      return;
    }
    if (images.length === 0) return alert("Select an item first.");

    setLoading(true);
    setError(null);
    try {
      const result = await gemini.analyzeOutfitText(images);
      setAnalysis(result);
      
      const newUser = { ...user, trialsUsed: user.trialsUsed + 1 };
      localStorage.setItem('aura_trials', '0');
      setUser(newUser);
      
      // Start background visual generation
      result.curatedSets.forEach(async (set, index) => {
        const setSuggestions = result.suggestions.filter(s => set.itemIds.includes(s.id));
        const visual = await gemini.generateLookbookVisual(images[0], setSuggestions);
        if (visual) {
          setAnalysis(prev => {
            if (!prev) return prev;
            const updatedSets = [...prev.curatedSets];
            updatedSets[index].visualUrl = visual;
            return { ...prev, curatedSets: updatedSets };
          });
        }
      });

      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);

    } catch (err: any) {
      setError(err.message || "Service unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const filteredSuggestions = analysis?.suggestions.filter(s => 
    activeTab === AnalysisCategory.ALL || s.category === activeTab
  ) || [];

  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-white pb-20">
      <Header 
        userEmail={user.email} 
        trialsLeft={1 - user.trialsUsed} 
        onLogout={handleLogout} 
        onReset={handleReset}
        showReset={!!analysis}
        onPayClick={scrollToPayment}
      />

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-24">
        {!analysis && (
          <section className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-8xl font-serif mb-8 leading-[1.1]">The art of <br/>cohesion.</h2>
              <p className="text-neutral-500 text-lg md:text-xl leading-relaxed font-light">
                Our AI detects missing silhouettes in your wardrobe. Upload your canvas, and let Maison Aura craft the frame.
              </p>
            </div>

            <div className="bg-neutral-50 rounded-[3rem] p-8 md:p-16 border border-neutral-100">
              <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-serif italic">Wardrobe Studio</h3>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-400">Identify top, bottom, or full set.</p>
                  </div>
                  <button 
                    onClick={handleAnalyze}
                    disabled={loading || images.length === 0}
                    className="px-12 py-5 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-20 flex items-center gap-4"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Analyze Aura"}
                  </button>
                </div>
                <ImageUploader images={images} setImages={setImages} />
              </div>
            </div>
          </section>
        )}

        {analysis && (
          <div id="results" className="space-y-20">
            {/* Curated Lookbooks Section */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400">Maison Lookbooks</span>
                <div className="h-[1px] flex-1 bg-neutral-100"></div>
              </div>
              <div className="flex overflow-x-auto gap-8 pb-8 scrollbar-hide">
                {analysis.curatedSets.map((set, idx) => (
                  <div key={idx} className="flex-none w-[320px] md:w-[500px] bg-neutral-50 rounded-[2.5rem] p-6 space-y-6 border border-neutral-100 luxury-shadow flex flex-col group transition-all hover:-translate-y-2">
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-200">
                      {set.visualUrl ? (
                        <img src={set.visualUrl} alt={set.name} className="w-full h-full object-cover animate-in fade-in duration-1000" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                          <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 italic">Styling Lookbook Visual...</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-2xl font-serif italic mb-1">{set.name}</h4>
                      <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">{set.vibe}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedSet(set)}
                      className="w-full py-4 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-all"
                    >
                      Shop This Set
                    </button>
                  </div>
                ))}
                
                {/* Discover More Lookbooks Card */}
                <div className="flex-none w-[320px] md:w-[500px] flex items-center justify-center">
                  <button 
                    onClick={handleLoadMoreLookbooks}
                    disabled={loadingMoreSets}
                    className="group h-[300px] w-full border-2 border-dashed border-neutral-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-black hover:bg-neutral-50 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                      {loadingMoreSets ? (
                        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 group-hover:text-black transition-colors">Generate More Sets</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Individual Items Grid */}
            <section className="space-y-12">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-8 overflow-x-auto gap-12 scrollbar-hide">
                <div className="flex gap-12">
                  {Object.values(AnalysisCategory).map((cat) => (
                    <button key={cat} onClick={() => setActiveTab(cat)} className={`text-[10px] font-bold uppercase tracking-[0.3em] py-2 relative ${activeTab === cat ? "text-black" : "text-neutral-300"}`}>
                      {cat}
                      {activeTab === cat && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black"></div>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                {filteredSuggestions.map((item) => (
                  <AccessoryCard key={item.id} suggestion={item} />
                ))}
              </div>

              <div className="flex justify-center pt-12">
                <button 
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-12 py-4 border-2 border-black text-black rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Generating More Ideas...
                    </>
                  ) : "Discover More Options"}
                </button>
              </div>
            </section>
          </div>
        )}

        <div ref={paymentRef} className={`transition-all duration-1000 ${error ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none h-0 overflow-hidden'}`}>
          <div className="bg-black text-white p-12 md:p-24 rounded-[3rem] text-center space-y-8 border border-white/10 shadow-2xl">
            <h3 className="text-4xl md:text-6xl font-serif italic">Elevate for ₹10.</h3>
            <p className="text-neutral-400 max-w-xl mx-auto text-lg font-light leading-relaxed">{error}</p>
            <div className="pt-4 flex flex-col md:flex-row items-center justify-center gap-4">
              <button 
                onClick={handlePurchase}
                className="px-16 py-5 bg-white text-black rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all"
              >
                Purchase Analysis
              </button>
              <button onClick={handleReset} className="px-8 py-5 text-white/50 text-[10px] font-bold uppercase tracking-widest hover:text-white">Go Back</button>
            </div>
          </div>
        </div>
      </main>

      {/* Set Details Modal */}
      {selectedSet && analysis && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedSet(null)}></div>
          <div className="relative bg-white w-full max-w-6xl max-h-[90vh] rounded-[3rem] overflow-hidden flex flex-col lg:flex-row luxury-shadow">
            <button 
              onClick={() => setSelectedSet(null)}
              className="absolute top-6 right-6 z-10 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-black hover:text-white transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="w-full lg:w-1/2 h-[300px] lg:h-auto bg-neutral-100">
              {selectedSet.visualUrl ? (
                <img src={selectedSet.visualUrl} alt={selectedSet.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-10 h-10 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Rendering Full Look...</p>
                </div>
              )}
            </div>

            <div className="w-full lg:w-1/2 flex flex-col p-8 md:p-16 overflow-y-auto">
              <div className="mb-12">
                <h3 className="text-4xl font-serif italic mb-2">{selectedSet.name}</h3>
                <p className="text-xs uppercase font-bold tracking-[0.3em] text-neutral-400">{selectedSet.vibe}</p>
              </div>

              <div className="space-y-8">
                {selectedSet.itemIds.map(id => {
                  const item = analysis.suggestions.find(s => s.id === id);
                  if (!item) return null;
                  return (
                    <div key={id} className="flex gap-6 items-center border-b border-neutral-100 pb-8 last:border-0 group">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-neutral-50 flex-none border border-neutral-100">
                        <AccessoryCard suggestion={item} showDetails={false} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-1">{item.name}</h4>
                        <p className="text-xs text-neutral-400 uppercase tracking-widest mb-4">{item.category}</p>
                        <button 
                          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(item.name + ' ' + item.category)}&tbm=shop`, '_blank')}
                          className="px-6 py-2 border border-black rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                        >
                          Find Best Deal
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
