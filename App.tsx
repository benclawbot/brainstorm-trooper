
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, Image as ImageIcon, Globe, Loader2, MessageSquare, GitBranch, FileDown, Search, AlertCircle } from 'lucide-react';
import { Drop, DropType, MindMapNode, Project, User, ResearchFolder, ProjectFolder, Language } from './types';
import { expandIdea, researchIdea, generateVisual, generateDeepMindMap } from './services/geminiService';
import Header from './components/Header';
import DropBoard from './components/DropBoard';
import AIChatPanel from './components/AIChatPanel';
import MindMapPanel from './components/MindMapPanel';
import Auth from './components/Auth';
import ProjectSidebar from './components/ProjectSidebar';
import ResearchDossierSection from './components/ResearchDossierSection';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFolders, setProjectFolders] = useState<ProjectFolder[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeResearchId, setActiveResearchId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMindMapOpen, setIsMindMapOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          photoUrl: firebaseUser.photoURL || ''
        });
      } else {
        setUser(null);
      }
    });

    const savedProjects = localStorage.getItem('brainstorm_trooper_projects');
    if (savedProjects) {
      const parsed = JSON.parse(savedProjects);
      setProjects(parsed);
      if (parsed.length > 0 && !activeProjectId) setActiveProjectId(parsed[0].id);
    }

    const savedFolders = localStorage.getItem('brainstorm_trooper_project_folders');
    if (savedFolders) {
      setProjectFolders(JSON.parse(savedFolders));
    }

    const savedTheme = localStorage.getItem('brainstorm_theme');
    const initialDarkMode = savedTheme !== 'light';
    setIsDarkMode(initialDarkMode);
    if (!initialDarkMode) document.documentElement.classList.add('light-mode');

    const savedLang = localStorage.getItem('brainstorm_language') as Language;
    if (savedLang === 'en' || savedLang === 'fr') setSelectedLanguage(savedLang);

    const savedSidebarState = localStorage.getItem('brainstorm_sidebar_collapsed');
    if (savedSidebarState === 'true') setIsSidebarCollapsed(true);

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('brainstorm_trooper_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('brainstorm_trooper_project_folders', JSON.stringify(projectFolders));
  }, [projectFolders]);

  // Calculate dynamic sidebar width based on maximum visible depth
  const sidebarWidth = useMemo(() => {
    if (isSidebarCollapsed) return 80;

    const getFolderDepth = (folderId: string): number => {
      const folder = projectFolders.find(f => f.id === folderId);
      if (!folder || !folder.parentId) return 0;
      return 1 + getFolderDepth(folder.parentId);
    };

    const isFolderVisible = (folderId: string): boolean => {
      const folder = projectFolders.find(f => f.id === folderId);
      if (!folder) return false;
      if (!folder.parentId) return true;
      const parent = projectFolders.find(p => p.id === folder.parentId);
      return (parent?.isExpanded ?? false) && isFolderVisible(folder.parentId);
    };

    let maxD = 0;
    projectFolders.forEach(f => {
      if (isFolderVisible(f.id)) {
        const d = getFolderDepth(f.id);
        maxD = Math.max(maxD, d);
        if (f.isExpanded) {
          const hasProjects = projects.some(p => p.folderId === f.id);
          const hasSubFolders = projectFolders.some(sf => sf.parentId === f.id);
          if (hasProjects || hasSubFolders) maxD = Math.max(maxD, d + 1);
        }
      }
    });

    // Base width 260 + 28px per depth level, maxed at 500px
    return Math.min(500, 260 + (maxD * 28));
  }, [projectFolders, projects, isSidebarCollapsed]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('brainstorm_theme', newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setSelectedLanguage(lang);
    localStorage.setItem('brainstorm_language', lang);
  };

  const toggleSidebarCollapse = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('brainstorm_sidebar_collapsed', newState.toString());
  };

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  useEffect(() => {
    if (activeProject) {
      const searchDrops = activeProject.drops.filter(d => d.type === 'search');
      const belongsToCurrentProject = searchDrops.some(d => d.id === activeResearchId);
      
      if (searchDrops.length > 0 && (!activeResearchId || !belongsToCurrentProject)) {
        setActiveResearchId(searchDrops[0].id);
      } else if (searchDrops.length === 0) {
        setActiveResearchId(null);
      }
    } else {
      setActiveResearchId(null);
    }
  }, [activeProjectId, activeProject?.drops.length, activeResearchId]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeProjectId, activeResearchId]);

  const handleSignIn = (newUser: User) => setUser(newUser);
  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setProjects([]);
    setProjectFolders([]);
    setActiveProjectId(null);
  };

  const removeProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
      setActiveResearchId(null);
    }
  };

  const updateActiveProject = (updater: (p: Project) => Project) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...updater(p), updatedAt: Date.now() } : p));
  };

  const addProjectFolder = (name: string, parentId?: string) => {
    const newFolder: ProjectFolder = { id: Date.now().toString(), name, isExpanded: true, parentId };
    setProjectFolders(prev => [...prev, newFolder]);
  };

  const renameProjectFolder = (id: string, newName: string) => {
    setProjectFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
  };

  const deleteProjectFolder = (id: string) => {
    const getAllSubFolderIds = (fid: string): string[] => {
      const children = projectFolders.filter(f => f.parentId === fid);
      return [fid, ...children.flatMap(c => getAllSubFolderIds(c.id))];
    };
    
    const idsToDelete = getAllSubFolderIds(id);
    setProjectFolders(prev => prev.filter(f => !idsToDelete.includes(f.id)));
    setProjects(prev => prev.map(p => (p.folderId && idsToDelete.includes(p.folderId)) ? { ...p, folderId: undefined } : p));
  };

  const toggleProjectFolder = (id: string) => {
    setProjectFolders(prev => prev.map(f => f.id === id ? { ...f, isExpanded: !f.isExpanded } : f));
  };

  const moveProjectToFolder = (projectId: string, folderId: string | null) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, folderId: folderId || undefined } : p));
  };

  const moveFolderToFolder = (folderId: string, parentId: string | null) => {
    const isDescendant = (parent: string, child: string): boolean => {
      const childObj = projectFolders.find(f => f.id === child);
      if (!childObj || !childObj.parentId) return false;
      if (childObj.parentId === parent) return true;
      return isDescendant(parent, childObj.parentId);
    };

    if (folderId === parentId || (parentId && isDescendant(folderId, parentId))) return;

    setProjectFolders(prev => prev.map(f => f.id === folderId ? { ...f, parentId: parentId || undefined } : f));
  };

  const addResearchFolder = (name: string) => {
    const newFolder: ResearchFolder = { id: Date.now().toString(), name };
    updateActiveProject(p => ({
      ...p,
      researchFolders: [...(p.researchFolders || []), newFolder]
    }));
  };

  const renameResearchFolder = (id: string, newName: string) => {
    updateActiveProject(p => ({
      ...p,
      researchFolders: (p.researchFolders || []).map(f => f.id === id ? { ...f, name: newName } : f)
    }));
  };

  const deleteResearchFolder = (id: string) => {
    updateActiveProject(p => ({
      ...p,
      researchFolders: (p.researchFolders || []).filter(f => f.id !== id),
      drops: p.drops.map(d => d.folderId === id ? { ...d, folderId: undefined } : d)
    }));
  };

  const moveResearchDropToFolder = (dropId: string, folderId: string | null) => {
    updateActiveProject(p => ({
      ...p,
      drops: p.drops.map(d => d.id === dropId ? { ...d, folderId: folderId || undefined } : d)
    }));
  };

  const addDrop = (drop: Drop, rawInput?: string) => {
    if (drop.type === 'search') {
      setActiveResearchId(drop.id);
    }
    
    if (!activeProjectId) {
      const newId = 'proj-' + Date.now();
      const newProj: Project = {
        id: newId,
        name: rawInput || drop.title || "New Session",
        drops: [drop],
        mindMapRoot: null,
        researchFolders: [],
        updatedAt: Date.now()
      };
      setProjects(prev => [newProj, ...prev]);
      setActiveProjectId(newId);
    } else {
      updateActiveProject(p => {
        const name = (p.name === "New Brainstorm" && rawInput) ? rawInput : p.name;
        return { ...p, name, drops: [drop, ...p.drops] };
      });
    }
  };

  const removeDrop = (id: string) => {
    if (id === activeResearchId) {
      setActiveResearchId(null);
    }
    updateActiveProject(p => ({
      ...p,
      drops: p.drops.filter(d => d.id !== id)
    }));
  };

  const handleQuickDrop = async (type: DropType = 'note') => {
    if (!inputValue.trim()) return;
    
    setLoading(true);
    setError(null);
    const text = inputValue;
    setInputValue('');

    try {
      let firstDrop: Drop | null = null;
      let titleForMindMap = text;

      if (type === 'note') {
        const expanded = await expandIdea(text, selectedLanguage);
        firstDrop = {
          id: Date.now().toString(),
          type: 'note',
          title: expanded.title,
          content: expanded.content,
          tags: expanded.tags,
          createdAt: Date.now()
        };
        titleForMindMap = expanded.title;
      } else if (type === 'image') {
        const url = await generateVisual(text);
        if (url) {
          firstDrop = {
            id: Date.now().toString(),
            type: 'image',
            content: text,
            imageUrl: url,
            tags: ['AI Generated'],
            createdAt: Date.now()
          };
        }
      } else if (type === 'search') {
        const research = await researchIdea(text, selectedLanguage);
        firstDrop = {
          id: Date.now().toString(),
          type: 'search',
          title: text,
          content: research.text,
          links: research.links,
          tags: ['Deep Research'],
          createdAt: Date.now()
        };
      }

      if (firstDrop) {
        if (!activeProject) {
          const mindMapTask = generateDeepMindMap(titleForMindMap, selectedLanguage);
          const newId = 'proj-' + Date.now();
          const deepRoot = await mindMapTask;
          
          const newProj: Project = {
            id: newId,
            name: titleForMindMap,
            drops: [firstDrop],
            mindMapRoot: deepRoot,
            researchFolders: [],
            updatedAt: Date.now()
          };
          
          setProjects(prev => [newProj, ...prev]);
          setActiveProjectId(newId);
          setIsMindMapOpen(true);
          if (firstDrop.type === 'search') setActiveResearchId(firstDrop.id);
        } else {
          addDrop(firstDrop, text);
          if (!activeProject.mindMapRoot) {
            const deepRoot = await generateDeepMindMap(titleForMindMap, selectedLanguage);
            updateActiveProject(p => ({ ...p, mindMapRoot: deepRoot }));
            setIsMindMapOpen(true);
          }
        }
      }
    } catch (err: any) {
      console.error("Drop creation failed:", err);
      const msg = err.message || "An unexpected error occurred.";
      if (msg.toLowerCase().includes("key") || msg.toLowerCase().includes("not found")) {
        setError("API Key Error: Please ensure you have selected a valid, active API key.");
      } else {
        setError(`Processing failed: ${msg}`);
      }
      setInputValue(text);
    } finally {
      setLoading(false);
    }
  };

  const formatTextForWord = (text: string) => {
    const lines = text.split('\n');
    let html = '';
    let tableRows: string[] = [];

    const flushTable = () => {
      if (tableRows.length > 0) {
        const rows = tableRows.map(row => row.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim()));
        const dataRows = rows.filter(row => !row.every(cell => cell.match(/^[:\s-]+$/)));
        if (dataRows.length > 0) {
          html += `<table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; margin: 20px 0; border: 1px solid #e2e8f0; font-family: 'Inter', sans-serif; font-size: 11px;">`;
          html += `<thead style="background-color: #f8fafc;"><tr>`;
          dataRows[0].forEach(cell => {
            html += `<th style="text-align: left; font-weight: 800; border: 1px solid #e2e8f0; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">${cell.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</th>`;
          });
          html += `</tr></thead><tbody>`;
          dataRows.slice(1).forEach(row => {
            html += `<tr>`;
            row.forEach(cell => {
              html += `<td style="border: 1px solid #e2e8f0; color: #334155;">${cell.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</td>`;
            });
            html += `</tr>`;
          });
          html += `</tbody></table>`;
        }
        tableRows = [];
      }
    };

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        tableRows.push(trimmed);
      } else {
        flushTable();
        if (trimmed.startsWith('###')) {
          html += `<h3 style="color: #1e293b; margin-top: 25px; font-family: 'Inter', sans-serif; font-weight: 900; border-left: 4px solid #4f46e5; padding-left: 10px; text-transform: uppercase; font-size: 14px;">${trimmed.replace(/^###\s/, '')}</h3>`;
        } else if (trimmed.startsWith('##')) {
          html += `<h2 style="color: #1e293b; margin-top: 35px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; font-family: 'Inter', sans-serif; font-weight: 900; text-transform: uppercase; font-size: 18px; letter-spacing: 1px;">${trimmed.replace(/^##\s/, '')}</h2>`;
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          html += `<li style="margin-bottom: 8px; color: #334155; font-size: 12px; margin-left: 20px;">${trimmed.substring(2).replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</li>`;
        } else if (trimmed === '') {
          html += `<div style="height: 10px;"></div>`;
        } else {
          html += `<p style="margin-bottom: 12px; color: #334155; line-height: 1.6; font-size: 12px;">${line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</p>`;
        }
      }
    });
    flushTable();
    return html;
  };

  const generateMindMapWordHtml = (node: MindMapNode, level: number = 0): string => {
    const indent = level * 25;
    const isRoot = level === 0;
    const isLevel2 = level === 1;
    
    let style = '';
    if (isRoot) {
      style = 'color: #1e293b; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; border-left: 12px solid #4f46e5; padding-left: 15px;';
    } else if (isLevel2) {
      style = 'color: #1e293b; font-size: 13px; font-weight: 800; text-transform: uppercase; margin-top: 15px; margin-bottom: 10px; background: #f1f5f9; padding: 5px 10px; border-left: 4px solid #4f46e5;';
    } else {
      style = 'color: #475569; font-size: 12px; font-weight: 500; margin-left: 10px; margin-bottom: 5px;';
    }

    let prefix = '';
    if (level === 2) prefix = '• ';
    if (level === 3) prefix = '  - ';
    if (level > 3) prefix = '    ◦ ';

    let html = `<div style="margin-left: ${indent}px;"><p style="${style}">${prefix}${node.text}</p></div>`;
    if (node.children) {
      html += node.children.map(child => generateMindMapWordHtml(child, level + 1)).join('');
    }
    return html;
  };

  const exportToWord = () => {
    if (!activeProject) return;
    
    const projectNameUpper = activeProject.name.toUpperCase();
    const isFr = selectedLanguage === 'fr';
    
    let mindMapHtml = '';
    if (activeProject.mindMapRoot) {
      mindMapHtml = `
        <div style="margin-top: 40px; margin-bottom: 60px;">
          <p style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 3px; margin-bottom: 10px;">${isFr ? 'ARCHITECTE D\'INTELLIGENCE STRUCTURELLE' : 'Structural Intelligence Architect'}</p>
          <div style="padding: 0px;">
            ${generateMindMapWordHtml(activeProject.mindMapRoot)}
          </div>
        </div>
        <br clear="all" style="page-break-before:always" />
      `;
    }

    let content = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${activeProject.name}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Segoe UI', 'Inter', Arial, sans-serif; line-height: 1.5; color: #1e293b; max-width: 800px; margin: auto; padding: 50px; }
        .header-container { margin-bottom: 50px; position: relative; }
        .blue-bar { position: absolute; left: -40px; top: 0; bottom: 0; width: 25px; background-color: #2563eb; }
        .session-report-title { font-size: 32px; font-weight: 900; color: #1e3a8a; line-height: 1.2; text-transform: uppercase; letter-spacing: 1px; margin-left: 10px; }
        .section-label { font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
        .intel-module { margin-bottom: 50px; page-break-inside: avoid; }
        .module-header { background-color: #f8fafc; border-left: 8px solid #2563eb; padding: 15px 20px; margin-bottom: 25px; }
        .module-title { font-size: 20px; font-weight: 900; color: #1e293b; margin: 0; text-transform: uppercase; }
        .source-box { margin-top: 25px; padding: 15px; background-color: #f0fdf4; border-radius: 4px; border: 1px solid #dcfce7; }
        .source-label { font-weight: 900; font-size: 9px; color: #166534; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .source-link { color: #15803d; font-size: 11px; text-decoration: none; display: block; margin-bottom: 4px; }
      </style>
      </head>
      <body>
        <div class="header-container">
          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
            <tr>
              <td style="width: 25px; background-color: #2563eb;">&nbsp;</td>
              <td style="padding-left: 25px;">
                <h1 class="session-report-title">${isFr ? 'RAPPORT DE SESSION' : 'SESSION REPORT'}: ${projectNameUpper}</h1>
              </td>
            </tr>
          </table>
        </div>

        ${mindMapHtml}

        <div class="section-label">${isFr ? 'Modules d\'intelligence détaillés' : 'Detailed Intelligence Modules'}</div>

        ${activeProject.drops.map(drop => `
          <div class="intel-module">
            <div class="module-header">
              <h2 class="module-title">${drop.title || (isFr ? 'Contexte du module' : 'Intel Module Context')}</h2>
            </div>
            <div style="padding: 0 5px;">
              ${formatTextForWord(drop.content)}
            </div>
            ${drop.links && drop.links.length > 0 ? `
              <div class="source-box">
                <div class="source-label">${isFr ? 'Vérification des sources d\'intelligence' : 'Intelligence Sources Verification'}:</div>
                ${drop.links.map(l => `<a href="${l.url}" class="source-link">Source: ${l.title}</a>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}

        <div style="margin-top: 80px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <p style="font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Generated by Brainstorm Trooper AI Workspace Architecture</p>
        </div>
      </body></html>`;
      
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${isFr ? 'RAPPORT' : 'REPORT'}_${activeProject.name.replace(/\s+/g, '_').toUpperCase()}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!user) return <Auth onSignIn={handleSignIn} />;

  const searchDrops = activeProject?.drops.filter(d => d.type === 'search') || [];
  const otherDrops = activeProject?.drops.filter(d => d.type !== 'search') || [];

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-[#0a0f1d]' : 'bg-slate-50'}`}>
      <ProjectSidebar 
        user={user}
        projects={projects}
        folders={projectFolders}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onRemoveProject={removeProject}
        onNewProject={() => {
          setActiveProjectId(null);
          setInputValue('');
          setError(null);
          setActiveResearchId(null);
        }}
        onAddFolder={addProjectFolder}
        onRenameFolder={renameProjectFolder}
        onDeleteFolder={deleteProjectFolder}
        onToggleFolder={toggleProjectFolder}
        onMoveToFolder={moveProjectToFolder}
        onMoveFolderToFolder={moveFolderToFolder}
        onSignOut={handleSignOut}
        isDarkMode={isDarkMode}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        dynamicWidth={sidebarWidth}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          user={user} 
          inputValue={inputValue} 
          setInputValue={setInputValue} 
          onAddDrop={handleQuickDrop} 
          loading={loading}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
        />
        
        <main className="flex-1 flex overflow-hidden relative">
          {!activeProject ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_70%)]" />
              <div className="w-full max-w-3xl text-center space-y-12 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-600/10 rounded-3xl w-fit mx-auto mb-6 border border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
                    <Sparkles className="w-10 h-10 text-indigo-400 animate-pulse" />
                  </div>
                  <h2 className={`text-5xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tighter sm:text-6xl transition-colors`}>
                    {selectedLanguage === 'fr' ? 'Architecturez votre ' : 'Architect your '}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                      {selectedLanguage === 'fr' ? 'flux de pensée.' : 'thought stream.'}
                    </span>
                  </h2>
                  <p className="text-xl text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
                    {selectedLanguage === 'fr' ? 'Le hub d\'intelligence dans l\'en-tête est prêt pour votre première idée.' : 'The intelligence hub in the header is ready for your first drop.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
                <div className={`flex justify-between items-center mb-10 sticky top-0 z-20 ${isDarkMode ? 'bg-[#0a0f1d]/80' : 'bg-slate-50/80'} backdrop-blur-md py-4 transition-colors`}>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-600/10 rounded-xl border border-indigo-500/20">
                      <GitBranch className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} leading-none mb-1 transition-colors`}>{activeProject.name}</h2>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{selectedLanguage === 'fr' ? 'Flux de travail' : 'Workspace Streams'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={exportToWord}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/20 transition-all font-bold text-xs"
                  >
                    <FileDown className="w-4 h-4" />
                    {selectedLanguage === 'fr' ? 'Exporter le rapport' : 'Export Report'}
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold animate-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                {searchDrops.length > 0 && (
                  <ResearchDossierSection 
                    activeId={activeResearchId} 
                    drops={searchDrops} 
                    folders={activeProject.researchFolders || []}
                    onSelectActive={setActiveResearchId}
                    onRemove={removeDrop}
                    onAddFolder={addResearchFolder}
                    onRenameFolder={renameResearchFolder}
                    onDeleteFolder={deleteResearchFolder}
                    onMoveToFolder={moveResearchDropToFolder}
                    isDarkMode={isDarkMode}
                  />
                )}

                <DropBoard drops={otherDrops} onRemove={removeDrop} onStartMindMap={() => {}} isDarkMode={isDarkMode} />
                
                <div className="h-40" />
              </div>

              {isMindMapOpen && !!activeProject?.mindMapRoot && (
                <MindMapPanel 
                  isOpen={true} 
                  onClose={() => setIsMindMapOpen(false)} 
                  rootNode={activeProject?.mindMapRoot || null}
                  onUpdate={(root) => updateActiveProject(p => ({ ...p, mindMapRoot: root }))}
                  onAddSearchDrop={(drop) => addDrop(drop)}
                  isDarkMode={isDarkMode}
                  selectedLanguage={selectedLanguage}
                />
              )}

              <AIChatPanel isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} drops={activeProject?.drops || []} isDarkMode={isDarkMode} />

              <div className="fixed right-6 bottom-8 flex flex-col gap-4 z-50">
                {!isSidebarOpen && (
                  <button onClick={() => setIsSidebarOpen(true)} className="p-4 bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-[0_15px_30px_rgba(79,70,229,0.3)] transition-all hover:scale-110">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </button>
                )}
                {!isMindMapOpen && !!activeProject?.mindMapRoot && (
                   <button onClick={() => setIsMindMapOpen(true)} className="p-4 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 rounded-full text-indigo-400 transition-all shadow-xl">
                    <GitBranch className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
