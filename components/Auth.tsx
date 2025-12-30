
import React, { useState } from 'react';

interface AuthProps {
  onLogin: (email: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes('@')) {
      setIsLoading(true);
      // Simulate sending OTP
      setTimeout(() => {
        setStep('otp');
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      onLogin(email);
    } else {
      alert("Please enter a valid 6-digit OTP.");
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-6 bg-white">
      <div className="max-w-md w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-block px-3 py-1 bg-neutral-100 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] mb-4">
            Maison Aura
          </div>
          <h1 className="text-6xl font-serif">Curate your aura.</h1>
          <p className="text-neutral-400 text-lg">AI-powered luxury styling for the modern aesthetic.</p>
        </div>

        {step === 'email' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => setEmail('google.user@gmail.com')}
              className="w-full flex items-center justify-center gap-3 py-4 border border-neutral-200 rounded-2xl font-medium text-sm hover:bg-neutral-50 transition-all active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-white px-2 text-neutral-300 font-bold">Or Email</span></div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input 
                type="email" 
                placeholder="Enter your professional email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-black transition-colors"
                required
              />
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Continue to Studio"}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center">
              <p className="text-sm text-neutral-500">We've sent a code to <br/><span className="font-bold text-black">{email}</span></p>
            </div>
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <input 
                type="text" 
                maxLength={6}
                placeholder="0 0 0 0 0 0" 
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-6 py-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-black transition-colors text-center text-2xl tracking-[0.5em] font-mono"
                required
              />
              <button 
                type="submit"
                className="w-full py-4 bg-black text-white rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all hover:scale-[1.02] active:scale-95"
              >
                Verify & Enter
              </button>
              <button 
                type="button" 
                onClick={() => setStep('email')}
                className="w-full text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors"
              >
                Change Email
              </button>
            </form>
          </div>
        )}
        
        <p className="text-[10px] text-neutral-400 uppercase tracking-[0.3em] text-center">
          Join 5,000+ stylists in the private beta.
        </p>
      </div>
    </div>
  );
};

export default Auth;
