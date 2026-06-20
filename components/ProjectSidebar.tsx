
import React, { useState } from 'react';
import { Folder, Clock, Trash2, FolderPlus, ChevronRight, ChevronDown, Edit2, Check, GripVertical, PanelLeftClose, PanelLeftOpen, FileText } from 'lucide-react';
import { Project, User, ProjectFolder } from '../types';

interface ProjectSidebarProps {
  projects: Project[];
  folders: ProjectFolder[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onRemoveProject: (id: string) => void;
  onAddFolder: (name: string, parentId?: string) => void;
  onRenameFolder: (id: string, newName: string) => void;
  onDeleteFolder: (id: string) => void;
  onToggleFolder: (id: string) => void;
  onMoveToFolder: (projectId: string, folderId: string | null) => void;
  onMoveFolderToFolder: (folderId: string, parentId: string | null) => void;
  onResetWorkspace: () => void;
  user: User;
  isDarkMode: boolean;
  isCollapsed?: boolean;
  onToggleCollapse: () => void;
  dynamicWidth: number;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ 
  projects, 
  folders,
  activeProjectId, 
  onSelectProject, 
  onRemoveProject,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onToggleFolder,
  onMoveToFolder,
  onMoveFolderToFolder,
  onResetWorkspace,
  user,
  isDarkMode,
  isCollapsed = false,
  onToggleCollapse,
  dynamicWidth
}) => {
  const [isAddingRootFolder, setIsAddingRootFolder] = useState(false);
  const [addingSubFolderTo, setAddingSubFolderTo] = useState<string | null>(null);
  const [folderInput, setFolderInput] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  const handleAddRootFolder = () => {
    if (folderInput.trim()) {
      onAddFolder(folderInput.trim());
      setFolderInput('');
      setIsAddingRootFolder(false);
    }
  };

  const handleAddSubFolder = (parentId: string) => {
    if (folderInput.trim()) {
      onAddFolder(folderInput.trim(), parentId);
      setFolderInput('');
      setAddingSubFolderTo(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, type: 'project' | 'folder', id: string) => {
    if (isCollapsed) return; 
    e.dataTransfer.setData('dragType', type);
    e.dataTransfer.setData('dragId', id);
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData('dragType');
    const id = e.dataTransfer.getData('dragId');

    if (type === 'project') {
      onMoveToFolder(id, targetFolderId);
    } else if (type === 'folder') {
      onMoveFolderToFolder(id, targetFolderId);
    }
  };

  const renderProjectItem = (project: Project, depth: number) => (
    <div 
      key={project.id} 
      className="group relative"
      style={{ marginLeft: isCollapsed ? '0' : `${depth * 16}px` }}
    >
      <button
        draggable={!isCollapsed}
        onDragStart={(e) => handleDragStart(e, 'project', project.id)}
        onClick={() => onSelectProject(project.id)}
        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-center sm:items-start gap-2.5 ${isCollapsed ? 'px-0' : 'pr-8'} ${
          activeProjectId === project.id 
          ? 'bg-indigo-600/10 text-indigo-500 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-600/5' 
          : 'text-slate-500 hover:bg-slate-400/5 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
        }`}
        title={isCollapsed ? (project.name || 'Untitled') : ''}
      >
        {isCollapsed ? (
           <FileText className={`w-5 h-5 shrink-0 ${activeProjectId === project.id ? 'text-indigo-500' : 'text-slate-400'}`} />
        ) : (
          <>
            <GripVertical className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate leading-tight mb-1">
                {project.name || 'Untitled Brainstorm'}
              </p>
              <div className="flex items-center gap-1.5 text-[8px] opacity-40 font-black uppercase tracking-wider">
                <Clock className="w-2.5 h-2.5" />
                {new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </>
        )}
      </button>
      
      {!isCollapsed && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRemoveProject(project.id);
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-slate-700 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  const renderFolder = (folder: ProjectFolder, depth: number = 0) => {
    const isEditing = editingFolderId === folder.id;
    const isAddingSub = addingSubFolderTo === folder.id;
    const subFolders = folders.filter(f => f.parentId === folder.id);
    const folderProjects = projects.filter(p => p.folderId === folder.id);

    return (
      <div 
        key={folder.id} 
        className="space-y-1"
        onDragOver={(e) => !isCollapsed && e.preventDefault()}
        onDrop={(e) => !isCollapsed && handleDrop(e, folder.id)}
      >
        <div 
          draggable={!isCollapsed}
          onDragStart={(e) => handleDragStart(e, 'folder', folder.id)}
          className={`group flex items-center justify-center sm:justify-start gap-2 p-2 rounded-xl transition-all ${
            isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'
          }`}
          style={{ marginLeft: isCollapsed ? '0' : `${depth * 12}px` }}
          title={isCollapsed ? folder.name : ''}
        >
          {!isCollapsed && (
            <button 
              onClick={() => onToggleFolder(folder.id)}
              className="p-1 text-slate-500 hover:text-indigo-500 transition-colors shrink-0"
            >
              {folder.isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
          
          {isEditing && !isCollapsed ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <input
                autoFocus
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                className={`bg-transparent text-[11px] font-black outline-none w-full ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onRenameFolder(folder.id, editFolderName);
                    setEditingFolderId(null);
                  }
                  if (e.key === 'Escape') setEditingFolderId(null);
                }}
              />
              <button onClick={() => { onRenameFolder(folder.id, editFolderName); setEditingFolderId(null); }} className="text-emerald-500"><Check className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <div 
              className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer justify-center sm:justify-start"
              onClick={() => !isCollapsed && onToggleFolder(folder.id)}
            >
              <Folder className={`w-4 h-4 shrink-0 ${folder.isExpanded && !isCollapsed ? 'text-indigo-400' : 'text-slate-400'}`} />
              {!isCollapsed && (
                <>
                  <span className={`text-[11px] font-black truncate uppercase tracking-widest ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{folder.name}</span>
                  <span className="text-[9px] font-bold text-slate-500/50 ml-auto bg-black/5 dark:bg-white/5 px-1.5 rounded-md">{folderProjects.length}</span>
                </>
              )}
            </div>
          )}

          {!isCollapsed && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); setAddingSubFolderTo(folder.id); onToggleFolder(folder.id); }}
                className="p-1 text-slate-400 hover:text-indigo-500"
                title="New Subfolder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setEditFolderName(folder.name); }}
                className="p-1 text-slate-400 hover:text-indigo-500"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); if (confirm('Delete folder and all contents?')) onDeleteFolder(folder.id); }}
                className="p-1 text-slate-400 hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {folder.isExpanded && !isCollapsed && (
          <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
            {isAddingSub && (
              <div style={{ marginLeft: `${(depth + 1) * 16}px` }} className="px-2 mb-2">
                <div className={`flex items-center gap-1 p-1 rounded-xl border ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                  <input
                    autoFocus
                    value={folderInput}
                    onChange={(e) => setFolderInput(e.target.value)}
                    placeholder="Sub..."
                    className={`bg-transparent text-[10px] font-bold outline-none px-2 flex-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSubFolder(folder.id);
                      if (e.key === 'Escape') setAddingSubFolderTo(null);
                    }}
                  />
                  <button onClick={() => handleAddSubFolder(folder.id)} className="p-1 bg-indigo-600 text-white rounded-lg">
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
            
            {subFolders.map(child => renderFolder(child, depth + 1))}
            {folderProjects.map(p => renderProjectItem(p, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootFolders = folders.filter(f => !f.parentId);
  const rootProjects = projects.filter(p => !p.folderId);

  return (
    <aside 
      style={{ width: `${dynamicWidth}px` }}
      className={`h-full border-r transition-all duration-500 ease-in-out flex flex-col shrink-0 z-50 ${isDarkMode ? 'bg-[#0a0f1d] border-white/5 shadow-2xl' : 'bg-slate-50 border-slate-200 shadow-xl'}`}
    >
      <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <GripVertical className="w-4 h-4 text-white rotate-90" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Navigator</span>
          </div>
        )}
        <button 
          onClick={onToggleCollapse}
          className={`p-2 rounded-xl transition-all ${isDarkMode ? 'text-slate-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'}`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto custom-scrollbar pb-10 pt-4 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {!isCollapsed && (
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-[0.4em]">Intelligence History</h3>
            <button 
              onClick={() => setIsAddingRootFolder(true)}
              className="p-1.5 text-slate-600 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-xl transition-all"
              title="Create Root Folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
        )}

        {isAddingRootFolder && !isCollapsed && (
          <div className="px-2 mb-6 animate-in zoom-in-95 duration-200">
            <div className={`flex items-center gap-1.5 p-2 rounded-2xl border ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 shadow-inner' : 'bg-indigo-50 border-indigo-200'}`}>
              <input
                autoFocus
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                placeholder="Folder..."
                className={`bg-transparent text-[11px] font-bold outline-none px-2 flex-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddRootFolder();
                  if (e.key === 'Escape') setIsAddingRootFolder(false);
                }}
              />
              <button onClick={handleAddRootFolder} className="p-1.5 bg-indigo-600 text-white rounded-xl">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-1">
            {rootFolders.map(folder => renderFolder(folder, 0))}
          </div>

          <div 
            className={`space-y-1 pt-4 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}
            onDragOver={(e) => !isCollapsed && e.preventDefault()}
            onDrop={(e) => !isCollapsed && handleDrop(e, null)}
          >
            {!isCollapsed && (
              <div className="flex items-center gap-2 px-2 mb-2">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-50">Unorganized</span>
              </div>
            )}
            {rootProjects.map(p => renderProjectItem(p, 0))}
            {projects.length === 0 && !isCollapsed && (
              <div className="px-3 py-6 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] text-center border-2 border-dashed border-slate-300 dark:border-white/5 rounded-[2rem] opacity-40">
                Empty
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`p-5 border-t transition-colors ${isDarkMode ? 'border-white/5 bg-black/40' : 'border-slate-200 bg-white'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`rounded-2xl border overflow-hidden shrink-0 shadow-2xl ${isCollapsed ? 'w-10 h-10' : 'w-10 h-10'} ${isDarkMode ? 'border-white/10 ring-1 ring-white/5' : 'border-slate-200 ring-1 ring-slate-100'}`}>
              <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className={`text-xs font-black truncate tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{user.name}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Architect</p>
                </div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button 
              onClick={onResetWorkspace}
              className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'text-slate-500 hover:text-red-400 hover:bg-red-400/10' : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'}`}
              title="Clear Local Workspace"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default ProjectSidebar;
