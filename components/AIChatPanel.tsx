
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { ChatMessage, Drop } from '../types';
import { chatWithWorkspace } from '../services/minimaxService';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  drops: Drop[];
  isDarkMode: boolean;
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({ isOpen, onClose, drops, isDarkMode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      text: "I'm your Brainstorm Trooper assistant. How can I help you organize or expand your ideas today?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatWithWorkspace(input, messages, drops);
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <aside 
      className={`fixed top-0 right-0 h-full w-full sm:w-96 z-[60] transition-transform duration-300 transform border-l flex flex-col ${
        isOpen ? 'translate-x-0 shadow-[-50px_0_100px_rgba(0,0,0,0.5)]' : 'translate-x-full'
      } ${isDarkMode ? 'glass border-white/5' : 'bg-white border-slate-200'}`}
    >
      <div className={`p-4 border-b flex items-center justify-between transition-colors ${isDarkMode ? 'border-white/5 bg-black/20' : 'border-slate-100 bg-slate-50'}`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <h2 className={`font-black tracking-tight text-sm uppercase ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>AI Assistant</h2>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div ref={scrollRef} className={`flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar ${isDarkMode ? '' : 'bg-slate-50'}`}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-lg ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : `${isDarkMode ? 'glass border-white/10' : 'bg-white border-slate-200'} text-slate-200 rounded-tl-none`
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {msg.role === 'assistant' ? <Sparkles className="w-3 h-3 text-indigo-400" /> : <User className="w-3 h-3 text-indigo-200" />}
                <span className={`text-[10px] font-bold uppercase tracking-wider opacity-60 ${msg.role === 'assistant' && !isDarkMode ? 'text-slate-700' : ''}`}>
                  {msg.role}
                </span>
              </div>
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'assistant' && !isDarkMode ? 'text-slate-800' : ''}`}>{msg.text}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className={`rounded-2xl p-4 rounded-tl-none ${isDarkMode ? 'glass' : 'bg-white border border-slate-200'}`}>
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            </div>
          </div>
        )}
      </div>

      <div className={`p-4 border-t transition-colors ${isDarkMode ? 'border-white/5 bg-black/40' : 'border-slate-200 bg-white'}`}>
        <div className="relative">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about your workspace..."
            className={`w-full border rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all pr-12 ${
              isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          />
          <button 
            onClick={handleSend}
            disabled={isTyping}
            className="absolute right-2 top-2 p-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AIChatPanel;
