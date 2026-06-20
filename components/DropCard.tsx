
import React from 'react';
import { Trash2, ExternalLink, Hash, Clock, FileText, Image as ImageIcon, Search, GitBranch, Quote, Link as LinkIcon } from 'lucide-react';
import { Drop } from '../types';

interface DropCardProps {
  drop: Drop;
  onRemove: (id: string) => void;
  onStartMindMap: (drop: Drop) => void;
  isDarkMode: boolean;
}

const renderInlines = (text: string, isDarkMode: boolean) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className={`${isDarkMode ? 'text-white' : 'text-slate-900'} font-extrabold`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const FormattedText: React.FC<{ text: string; isDarkMode: boolean; mode?: 'default' | 'dossier' }> = ({ text, isDarkMode, mode = 'default' }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[] = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      const rows = tableRows.map(row => 
        row.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim())
      );
      
      const dataRows = rows.filter(row => !row.every(cell => cell.match(/^[:\s-]+$/)));
      
      if (dataRows.length > 0) {
        elements.push(
          <div key={`table-${elements.length}`} className={`my-6 overflow-x-auto rounded-2xl border shadow-inner ${isDarkMode ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-slate-50'}`}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
                  {dataRows[0].map((cell, idx) => (
                    <th key={idx} className={`px-5 py-4 text-left font-black uppercase tracking-widest text-[10px] ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>
                      {renderInlines(cell, isDarkMode)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.slice(1).map((row, rIdx) => (
                  <tr key={rIdx} className={`border-b last:border-0 hover:bg-slate-400/5 transition-colors ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className={`px-5 py-4 font-medium leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {renderInlines(cell, isDarkMode)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const isTableRow = trimmed.startsWith('|') && trimmed.endsWith('|');

    if (isTableRow) {
      tableRows.push(trimmed);
    } else {
      flushTable();
      
      const isHeading = line.startsWith('###') || line.startsWith('##');
      const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
      const isBoldSectionTitle = trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**');

      if (isHeading) {
        elements.push(
          <h4 key={i} className={`font-black text-base tracking-tight pt-4 uppercase border-b pb-2 mb-3 ${isDarkMode ? 'text-white border-white/5' : 'text-slate-900 border-slate-100'}`}>
            {line.replace(/^#+\s/, '')}
          </h4>
        );
      } else if (isBoldSectionTitle) {
        elements.push(
          <div key={i} className="pt-6 pb-2">
            <h5 className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="shrink-0">{trimmed.slice(2, -2)}</span>
              <div className={`h-px flex-1 ${isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'}`} />
            </h5>
          </div>
        );
      } else if (isBullet) {
        const content = trimmed.substring(2);
        elements.push(
          <div key={i} className="flex gap-3 items-start group/li py-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
            <p className={`text-sm leading-relaxed flex-1 font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {renderInlines(content, isDarkMode)}
            </p>
          </div>
        );
      } else if (trimmed === '') {
        elements.push(<div key={i} className="h-3" />);
      } else if (trimmed === '---') {
        elements.push(<div key={i} className={`h-px w-full my-6 ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`} />);
      } else {
        elements.push(
          <p key={i} className={`text-sm leading-relaxed font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} ${mode === 'dossier' ? 'opacity-90' : ''}`}>
            {renderInlines(line, isDarkMode)}
          </p>
        );
      }
    }
  }
  flushTable();

  return <div className="intelligence-report-content space-y-1">{elements}</div>;
};

const DropCard: React.FC<DropCardProps> = ({ drop, onRemove, onStartMindMap, isDarkMode }) => {
  const isSearch = drop.type === 'search';
  const isNote = drop.type === 'note';

  return (
    <div className={`group glass p-0 rounded-[2.5rem] border hover:shadow-[0_50px_100px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden relative transition-all duration-500 ${isDarkMode ? 'border-white/[0.03] hover:border-white/10' : 'border-slate-200 hover:border-indigo-200'}`}>
      <div className={`flex items-center justify-between px-7 py-5 border-b transition-colors ${isDarkMode ? 'border-white/[0.03] bg-black/20' : 'border-slate-100 bg-slate-50'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${isSearch ? 'bg-emerald-500/10 border-emerald-500/20' : isNote ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-pink-500/10 border-pink-500/20'}`}>
            {isSearch ? <Search className="w-4 h-4 text-emerald-500" /> : isNote ? <FileText className="w-4 h-4 text-indigo-500" /> : <ImageIcon className="w-4 h-4 text-pink-500" />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            {isSearch ? 'Intelligence Module' : drop.type}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={() => onStartMindMap(drop)} className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'text-slate-500 hover:text-purple-400 hover:bg-white/5' : 'text-slate-400 hover:text-purple-600 hover:bg-white'}`} title="Map Idea">
            <GitBranch className="w-4 h-4" />
          </button>
          <button onClick={() => onRemove(drop.id)} className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'text-slate-500 hover:text-red-400 hover:bg-white/5' : 'text-slate-400 hover:text-red-600 hover:bg-white'}`} title="Archive">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`p-10 flex-1 transition-colors ${isDarkMode ? '' : 'bg-white'}`}>
        {drop.title && (
          <h3 className={`intelligence-report-title text-2xl font-black mb-8 leading-tight tracking-tighter transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'} ${isNote ? 'border-l-4 border-indigo-600 pl-6' : 'text-center uppercase tracking-widest'}`}>
            {drop.title}
          </h3>
        )}

        {drop.imageUrl && (
          <div className="mb-10 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl transition-transform group-hover:scale-[1.02] duration-700">
            <img src={drop.imageUrl} alt={drop.content} className="w-full object-cover max-h-96" />
          </div>
        )}

        <div className={`${isSearch ? `p-10 rounded-[2.5rem] border shadow-inner ${isDarkMode ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-100'}` : 'relative'}`}>
          {isNote && <Quote className={`absolute -left-3 -top-6 w-12 h-12 opacity-10 rotate-180 ${isDarkMode ? 'text-white' : 'text-indigo-600'}`} />}
          <FormattedText text={drop.content} isDarkMode={isDarkMode} mode={isSearch ? 'dossier' : 'default'} />
        </div>

        {isSearch && drop.links && drop.links.length > 0 && (
          <div className="mt-12 space-y-6">
            <div className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] border-b pb-5 ${isDarkMode ? 'text-emerald-500/70 border-emerald-500/10' : 'text-emerald-600 border-slate-100'}`}>
              <LinkIcon className="w-4 h-4" />
              Verified source network
            </div>
            <div className="grid grid-cols-1 gap-3">
              {drop.links.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noreferrer" className={`flex items-center justify-between gap-5 px-6 py-5 rounded-3xl border transition-all group/link ${isDarkMode ? 'bg-emerald-500/5 border-white/5 hover:bg-emerald-500/10' : 'bg-slate-50 border-slate-100 hover:bg-emerald-50 hover:border-emerald-300'}`}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <span className="text-[10px] font-black text-emerald-500">{idx + 1}</span>
                    </div>
                    <span className={`truncate font-bold tracking-tight ${isDarkMode ? 'text-slate-300 group-hover/link:text-emerald-300' : 'text-slate-700 group-hover/link:text-emerald-700'}`}>{link.title}</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-emerald-500/40 group-hover/link:text-emerald-500" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-2">
          {drop.tags.map(tag => (
            <span key={tag} className={`inline-flex items-center gap-2 px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.1em] transition-all ${isDarkMode ? 'bg-white/5 border-white/5 text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-400' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-indigo-100 hover:text-indigo-700'}`}>
              <Hash className="w-3 h-3 opacity-40" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className={`px-10 py-6 border-t flex items-center justify-between transition-colors ${isDarkMode ? 'border-white/[0.03] bg-black/40' : 'border-slate-100 bg-slate-50'}`}>
        <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
          <Clock className="w-4 h-4 opacity-40" />
          {new Date(drop.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-300'}`} />
          <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-300'}`} />
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
        </div>
      </div>
    </div>
  );
};

export default DropCard;
