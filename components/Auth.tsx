
import React, { useState } from 'react';
import { CloudRain, LogIn, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth, googleProvider } from '../services/firebase';
import { User } from '../types';

interface AuthProps {
  onSignIn: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onSignIn }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      onSignIn({
        id: user.uid,
        name: user.displayName || 'Anonymous Explorer',
        email: user.email || '',
        photoUrl: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.uid}`
      });
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1d] p-4 font-['Inter'] relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full animate-pulse" />

      <div className="max-w-md w-full glass p-10 sm:p-14 rounded-[4rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.6)] relative z-10 flex flex-col items-center">
        
        <div className="mb-12 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/50 mx-auto mb-8 relative group">
            <div className="absolute inset-0 bg-indigo-400 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-40 transition-opacity" />
            <CloudRain className="w-12 h-12 text-white relative z-10" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-3">Brainstorm Trooper</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] opacity-80">Enterprise Intelligence</p>
        </div>

        <div className="w-full space-y-6 animate-in zoom-in-95 duration-500 delay-200">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold mb-4">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 bg-white hover:bg-slate-50 text-slate-900 font-black py-5 px-6 rounded-[2rem] transition-all shadow-xl shadow-white/5 active:scale-[0.98] disabled:opacity-50 group"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/pjax-loader.gif" alt="" className="hidden" />
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p className="text-[10px] text-slate-500 text-center leading-relaxed font-medium">
            By continuing, you agree to allow <span className="text-white">Brainstorm Trooper</span> to access your workspace intelligence and profile data.
          </p>
        </div>

        <div className="mt-16 flex flex-col items-center gap-6 opacity-40 hover:opacity-100 transition-opacity">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            ))}
          </div>
          <button className="text-[10px] font-black text-slate-400 hover:text-indigo-400 uppercase tracking-widest transition-colors flex items-center gap-2">
            Secure Enterprise Encryption Active
          </button>
        </div>
      </div>

      <style>{`
        .glass {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(40px);
        }
      `}</style>
    </div>
  );
};

export default Auth;
