
import React, { useState } from 'react';
import { Search, Link as LinkIcon, ExternalLink, Trash2, ChevronRight, Folder, Plus, Edit2, Check, X, FolderOpen, GripVertical, Archive, Library } from 'lucide-react';
import { Drop, ResearchFolder } from '../types';

interface ResearchDossierSectionProps {
  activeId: string | null;
  drops: Drop[];
  folders: ResearchFolder[];
  onSelectActive: (id: string) => void;
  onRemove: (id: string) => void;
  onAddFolder: (name: string) => void;
  onRenameFolder: (id: string, newName: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveToFolder: (dropId: string, folderId: string | null) => void;
  isDarkMode: boolean;
}

const renderInlines = (text: string, isDarkMode: boolean) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className={`${isDarkMode ? 'text-white' : 'text-slate-950'} font-extrabold`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const FormattedText: React.FC<{ text: string; isDarkMode: boolean }> = ({ text, isDarkMode }) => {
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
          <div key={`table-${elements.length}`} className={`my-10 overflow-x-auto rounded-[2rem] border shadow-2xl ${isDarkMode ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-white'}`}>
            <table className="w-full border-collapse text-base">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                  {dataRows[0].map((cell, idx) => (
                    <th key={idx} className={`px-6 py-5 text-left font-black uppercase tracking-widest text-xs ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {renderInlines(cell, isDarkMode)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.slice(1).map((row, rIdx) => (
                  <tr key={rIdx} className={`border-b last:border-0 hover:bg-slate-400/5 transition-colors ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className={`px-6 py-5 font-medium leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
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
          <h4 key={i} className={`font-black text-xl tracking-tight pt-10 uppercase border-b pb-4 mb-6 ${isDarkMode ? 'text-white border-white/10' : 'text-slate-900 border-slate-200'}`}>
            {line.replace(/^#+\s/, '')}
          </h4>
        );
      } else if (isBoldSectionTitle) {
        elements.push(
          <div key={i} className="pt-12 pb-4">
            <h5 className="text-indigo-400 font-black text-sm uppercase tracking-[0.4em] mb-4 flex items-center gap-4">
              <span className="shrink-0">{trimmed.slice(2, -2)}</span>
              <div className={`h-px flex-1 ${isDarkMode ? 'bg-indigo-500/30' : 'bg-indigo-200'}`} />
            </h5>
          </div>
        );
      } else if (isBullet) {
        const content = trimmed.substring(2);
        elements.push(
          <div key={i} className="flex gap-4 items-start py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
            <p className={`text-lg leading-relaxed flex-1 font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {renderInlines(content, isDarkMode)}
            </p>
          </div>
        );
      } else if (trimmed === '') {
        elements.push(<div key={i} className="h-4" />);
      } else if (trimmed === '---') {
        elements.push(<div key={i} className={`h-px w-full my-10 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />);
      } else {
        elements.push(
          <p key={i} className={`text-lg leading-relaxed font-medium mb-2 ${isDarkMode ? 'text-slate-300 opacity-90' : 'text-slate-700'}`}>
            {renderInlines(line, isDarkMode)}
          </p>
        );
      }
    }
  }
  flushTable();

  return <div className="intelligence-report-content space-y-2">{elements}</div>;
};

const ResearchDossierSection: React.FC<ResearchDossierSectionProps> = ({ 
  activeId, 
  drops, 
  folders,
  onSelectActive, 
  onRemove,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveToFolder,
  isDarkMode
}) => {
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [folderInput, setFolderInput] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['uncategorized']));

  const activeDrop = drops.find(d => d.id === activeId) || drops[0];
  const historyDrops = drops.filter(d => d.id !== activeDrop?.id);

  if (!activeDrop) return null;

  const toggleFolder = (id: string) => {
    const next = new Set(expandedFolders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedFolders(next);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    const dropId = e.dataTransfer.getData('text/plain');
    onMoveToFolder(dropId, folderId);
  };

  const handleCreateFolder = () => {
    if (folderInput.trim()) {
      onAddFolder(folderInput.trim());
      setFolderInput('');
      setIsAddingFolder(false);
    }
  };

  const renderHistoryGrid = (items: Drop[], folderId: string | null) => {
    if (items.length === 0) return (
      <div className={`py-12 text-center text-[11px] font-black uppercase tracking-widest border border-dashed rounded-[2rem] ${isDarkMode ? 'text-slate-600 border-white/5 bg-black/20' : 'text-slate-400 border-slate-200 bg-slate-50'}`}>
        No dossiers here yet. Drag reports here to categorize.
      </div>
    );

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((drop) => (
          <div
            key={drop.id}
            draggable
            onDragStart={(e) => handleDragStart(e, drop.id)}
            className="group relative"
          >
            <button
              onClick={() => onSelectActive(drop.id)}
              className={`w-full glass p-6 rounded-[2.5rem] text-left transition-all hover:-translate-y-2 hover:shadow-2xl active:scale-95 ${isDarkMode ? 'border-white/5 bg-black/40' : 'border-slate-200 bg-white'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <Search className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex items-center gap-1">
                  <GripVertical className="w-4 h-4 text-slate-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" />
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
              <h5 className={`text-base font-black truncate mb-3 tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{drop.title}</h5>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
                {drop.content.replace(/[#*]/g, '').substring(0, 100)}...
              </p>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(drop.id); }}
              className="absolute -top-2 -right-2 p-2 bg-red-500/10 text-red-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-lg z-10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mb-20 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className={`group glass p-0 rounded-[3.5rem] shadow-[0_50px_120px_rgba(0,0,0,0.4)] overflow-hidden transition-colors ${isDarkMode ? 'border-emerald-500/20 bg-emerald-500/[0.01]' : 'border-emerald-500/10 bg-white'}`}>
        <div className={`flex items-center justify-between px-12 py-8 border-b ${isDarkMode ? 'border-white/[0.05] bg-emerald-500/5' : 'border-emerald-500/10 bg-emerald-50/50'}`}>
          <div className="flex items-center gap-6">
            <div className="p-4 bg-emerald-500 rounded-3xl shadow-2xl shadow-emerald-500/40 transform group-hover:scale-110 transition-transform">
              <Search className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="text-[12px] font-black uppercase tracking-[0.4em] text-emerald-500 opacity-80 mb-1 block">Deep intelligence report</span>
              <h3 className={`intelligence-report-title text-4xl font-black tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{activeDrop.title}</h3>
            </div>
          </div>
          <button onClick={() => onRemove(activeDrop.id)} className="p-4 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all">
            <Trash2 className="w-6 h-6" />
          </button>
        </div>

        <div className="p-12 lg:p-20">
          <div className="max-w-4xl mx-auto">
             <FormattedText text={activeDrop.content} isDarkMode={isDarkMode} />
          </div>

          {activeDrop.links && activeDrop.links.length > 0 && (
            <div className={`mt-20 pt-10 border-t space-y-8 max-w-4xl mx-auto ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
              <div className="flex items-center gap-4 text-[11px] font-black text-emerald-500 opacity-80 uppercase tracking-[0.5em]">
                <LinkIcon className="w-5 h-5" />
                Dossier intelligence sources
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeDrop.links.map((link, idx) => (
                  <a key={idx} href={link.url} target="_blank" rel="noreferrer" className={`flex items-center justify-between gap-4 px-8 py-6 rounded-3xl border hover:border-emerald-500 transition-all group/link shadow-xl ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                        <span className="text-xs font-black text-emerald-500">{idx + 1}</span>
                      </div>
                      <span className={`truncate font-bold tracking-tight text-base group-hover/link:text-emerald-600 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{link.title}</span>
                    </div>
                    <ExternalLink className="w-5 h-5 text-emerald-500/30 group-hover/link:text-emerald-500" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`pt-8 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-6 mb-12">
           <div className="space-y-4">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-indigo-600/10 rounded-2xl border border-indigo-500/20">
                 <Library className="w-6 h-6 text-indigo-500" />
               </div>
               <div>
                 <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.5em] leading-none mb-1">Intelligence Hub</h4>
                 <h2 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Research Archive</h2>
               </div>
             </div>
             <p className="text-slate-500 text-sm max-w-md font-medium leading-relaxed">
               Organize your deep-dive reports into logical intelligence folders.
             </p>
           </div>
           
           <div className="flex items-center gap-3">
             {isAddingFolder ? (
               <div className={`flex items-center gap-2 p-2 rounded-2xl border ${isDarkMode ? 'bg-indigo-600/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
                 <input autoFocus placeholder="Enter folder name..." className={`bg-transparent font-bold px-4 py-2 outline-none w-48 text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`} value={folderInput} onChange={(e) => setFolderInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setIsAddingFolder(false); }} />
                 <button onClick={handleCreateFolder} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all"><Check className="w-4 h-4" /></button>
                 <button onClick={() => setIsAddingFolder(false)} className="p-2 text-slate-500 hover:text-red-500 transition-all"><X className="w-4 h-4" /></button>
               </div>
             ) : (
               <button onClick={() => setIsAddingFolder(true)} className="flex items-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95">
                 <Plus className="w-5 h-5" />
                 Create Research Folder
               </button>
             )}
           </div>
        </div>

        <div className="space-y-6 px-4">
          {folders.map(folder => {
            const folderDrops = historyDrops.filter(d => d.folderId === folder.id);
            const isExpanded = expandedFolders.has(folder.id);
            const isEditing = editingFolderId === folder.id;

            return (
              <div key={folder.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, folder.id)} className={`glass rounded-[3rem] transition-all border overflow-hidden ${isExpanded ? 'bg-white/[0.03] shadow-2xl' : 'bg-black/20'} ${isDarkMode ? 'border-white/5' : 'border-slate-200 bg-slate-50/50'}`}>
                <div className="flex items-center justify-between px-8 py-7 group cursor-pointer" onClick={() => toggleFolder(folder.id)}>
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className={`p-4 rounded-2xl transition-all ${isExpanded ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white/5 text-slate-500'}`}>
                      {isExpanded ? <FolderOpen className="w-6 h-6" /> : <Folder className="w-6 h-6" />}
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-2 bg-black/40 rounded-2xl px-5 py-3 border border-indigo-500/40">
                        <input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="bg-transparent text-white font-black text-xl outline-none" />
                        <button onClick={() => { onRenameFolder(folder.id, newFolderName); setEditingFolderId(null); }} className="p-2 text-emerald-400"><Check className="w-5 h-5" /></button>
                      </div>
                    ) : (
                      <h5 className={`text-2xl font-black truncate flex items-center gap-4 tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {folder.name}
                        <span className="text-[10px] bg-slate-500/10 px-3 py-1 rounded-full border border-white/5 text-slate-500 font-black uppercase tracking-widest">{folderDrops.length} dossiers</span>
                      </h5>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setNewFolderName(folder.name); }} className="p-3 text-slate-500 hover:text-indigo-600 transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete folder?')) onDeleteFolder(folder.id); }} className="p-3 text-slate-500 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {isExpanded && <div className={`p-10 pt-2 border-t ${isDarkMode ? 'border-white/5 bg-black/40' : 'border-slate-200 bg-white'}`}>{renderHistoryGrid(folderDrops, folder.id)}</div>}
              </div>
            );
          })}
          <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, null)} className={`glass rounded-[3rem] transition-all border overflow-hidden ${expandedFolders.has('uncategorized') ? 'bg-white/[0.03]' : 'bg-black/20'} ${isDarkMode ? 'border-white/5' : 'border-slate-200 bg-slate-50/50'}`}>
            <div className="flex items-center gap-6 px-8 py-7 cursor-pointer" onClick={() => toggleFolder('uncategorized')}>
              <div className={`p-4 rounded-2xl transition-all ${expandedFolders.has('uncategorized') ? 'bg-slate-600 text-white shadow-xl' : 'bg-white/5 text-slate-500'}`}>
                {expandedFolders.has('uncategorized') ? <FolderOpen className="w-6 h-6" /> : <Archive className="w-6 h-6" />}
              </div>
              <h5 className={`text-2xl font-black uppercase tracking-[0.2em] flex items-center gap-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Inbox / Unsorted
                <span className="text-[10px] bg-slate-500/10 px-3 py-1 rounded-full border border-white/5 text-slate-500 font-black tracking-widest">{historyDrops.filter(d => !d.folderId).length} items</span>
              </h5>
            </div>
            {expandedFolders.has('uncategorized') && <div className={`p-10 pt-2 border-t ${isDarkMode ? 'border-white/5 bg-black/40' : 'border-slate-200 bg-white'}`}>{renderHistoryGrid(historyDrops.filter(d => !d.folderId), null)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchDossierSection;
