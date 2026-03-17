
import React from 'react';
import { CloudRain, Moon, Sun, Sparkles, Image as ImageIcon, Globe, Loader2, Languages } from 'lucide-react';
import { User, DropType, Language } from '../types';

interface HeaderProps {
  user: User | null;
  inputValue: string;
  setInputValue: (val: string) => void;
  onAddDrop: (type: DropType) => void;
  loading: boolean;
  isDarkMode: boolean;
  toggleTheme: () => void;
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  user, 
  inputValue, 
  setInputValue, 
  onAddDrop, 
  loading,
  isDarkMode,
  toggleTheme,
  selectedLanguage,
  onLanguageChange
}) => {
  return (
    <header className={`h-20 flex items-center justify-between px-6 border-b transition-colors z-50 ${isDarkMode ? 'glass border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center gap-6 flex-1">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <CloudRain className="w-6 h-6 text-white" />
          </div>
          <div className="hidden lg:block">
            <h1 className={`text-xl font-black tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Brainstorm Trooper
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-black">AI Architect</p>
          </div>
        </div>

        {/* Global Stream Input */}
        {user && (
          <div className="flex-1 max-w-2xl px-4">
            <div className={`relative flex items-center gap-2 p-1.5 rounded-2xl border transition-all ${isDarkMode ? 'bg-black/40 border-white/5 focus-within:border-indigo-500/50' : 'bg-slate-100 border-slate-200 focus-within:border-indigo-500/50'}`}>
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={selectedLanguage === 'fr' ? "Déposez une idée, une image ou un sujet..." : "Drop an idea, image prompt, or research topic..."}
                className={`flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'}`}
                onKeyDown={(e) => e.key === 'Enter' && onAddDrop('note')}
              />
              <div className="flex items-center gap-1 pr-1 border-l border-white/10 pl-2">
                <button 
                  onClick={() => onAddDrop('note')} 
                  disabled={loading || !inputValue}
                  className={`p-2 rounded-xl transition-all ${isDarkMode ? 'text-indigo-400 hover:bg-indigo-500/10' : 'text-indigo-600 hover:bg-indigo-50'}`}
                  title="Expand Idea"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => onAddDrop('image')} 
                  disabled={loading || !inputValue}
                  className={`p-2 rounded-xl transition-all ${isDarkMode ? 'text-pink-400 hover:bg-pink-500/10' : 'text-pink-600 hover:bg-pink-50'}`}
                  title="Generate Visual"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onAddDrop('search')} 
                  disabled={loading || !inputValue}
                  className={`p-2 rounded-xl transition-all ${isDarkMode ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-emerald-600 hover:bg-emerald-50'}`}
                  title="Deep Research"
                >
                  <Globe className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <div className={`flex items-center p-1 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
          <button 
            onClick={() => onLanguageChange('en')}
            className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${selectedLanguage === 'en' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            EN
          </button>
          <button 
            onClick={() => onLanguageChange('fr')}
            className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${selectedLanguage === 'fr' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            FR
          </button>
        </div>

        <button 
          onClick={toggleTheme}
          className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {user && (
          <div className={`flex items-center gap-3 pl-4 border-l ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
            <div className="text-right hidden sm:block">
              <p className={`text-xs font-black leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{user.name.split(' ')[0]}</p>
              <div className="flex items-center gap-1 justify-end">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase text-slate-500 tracking-tighter">Live</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden ring-2 ring-indigo-500/10 hover:ring-indigo-500/40 transition-all shadow-xl">
              <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
