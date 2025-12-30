
import React, { useState } from 'react';

interface HeaderProps {
  userEmail: string | null;
  trialsLeft: number;
  onLogout: () => void;
  onReset: () => void;
  showReset: boolean;
  onPayClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ userEmail, trialsLeft, onLogout, onReset, showReset, onPayClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] glass px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
          <span className="text-white font-serif text-xl">A</span>
        </div>
        <h1 className="text-xl font-bold tracking-tighter uppercase hidden sm:block">Aura Style</h1>
      </div>
      
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-6">
        {showReset && (
          <button 
            onClick={onReset}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-neutral-100 hover:bg-black hover:text-white px-4 py-2 rounded-full transition-all"
          >
            New Analysis
          </button>
        )}

        {userEmail && (
          <div 
            onClick={trialsLeft <= 0 ? onPayClick : undefined}
            className={`flex items-center gap-4 text-xs font-medium uppercase tracking-widest cursor-pointer transition-opacity hover:opacity-70 ${trialsLeft <= 0 ? 'text-red-500' : 'text-neutral-500'}`}
          >
            <span>{userEmail.split('@')[0]}</span>
            <div className="h-4 w-[1px] bg-neutral-200"></div>
            <span className="font-bold">
              {trialsLeft > 0 ? `${trialsLeft} Trial` : "Top-up Required"}
            </span>
          </div>
        )}
        
        {userEmail && (
          <button onClick={onLogout} className="text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-50 transition-opacity">Logout</button>
        )}
      </div>

      {/* Mobile Toggle */}
      <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-[72px] bg-white z-50 flex flex-col p-8 space-y-8 animate-in slide-in-from-right duration-300 md:hidden">
          {showReset && (
            <button onClick={() => { onReset(); setIsMenuOpen(false); }} className="text-left text-2xl font-serif italic border-b pb-4 border-neutral-100">Analyze New Outfit</button>
          )}
          {userEmail && (
            <>
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Account</p>
                <p className="text-lg">{userEmail}</p>
                <p className={`text-sm font-bold uppercase ${trialsLeft <= 0 ? 'text-red-500 underline' : ''}`} onClick={() => { if(trialsLeft<=0) {onPayClick(); setIsMenuOpen(false);}}}>
                  {trialsLeft > 0 ? `${trialsLeft} Trial Remaining` : "Top-up Required (₹10)"}
                </p>
              </div>
              <button onClick={onLogout} className="mt-auto py-4 bg-neutral-100 rounded-xl font-bold uppercase tracking-widest text-xs">Logout</button>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
