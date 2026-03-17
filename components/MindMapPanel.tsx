
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ChevronRight, Edit3, Loader2, Download, ChevronDown, ChevronUp, GitBranch, Globe, X, Layers } from 'lucide-react';
import { MindMapNode, Drop, Language } from '../types';
import { suggestSubBranches, researchIdea } from '../services/geminiService';

interface MindMapPanelProps {
  isOpen: boolean;
  onClose: () => void;
  rootNode: MindMapNode | null;
  onUpdate: (root: MindMapNode) => void;
  onAddSearchDrop: (drop: Drop) => void;
  isDarkMode: boolean;
  selectedLanguage: Language;
}

const NodeComponent: React.FC<{
  node: MindMapNode;
  onAdd: (parentId: string) => void;
  onExpand: (nodeId: string, text: string) => void;
  onDelete: (nodeId: string) => void;
  onEdit: (nodeId: string, text: string) => void;
  onToggleCollapse: (nodeId: string) => void;
  onResearch: (text: string) => Promise<void>;
  level: number;
  isDarkMode: boolean;
}> = ({ node, onAdd, onExpand, onDelete, onEdit, onToggleCollapse, onResearch, level, isDarkMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.text);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isResearching, setIsResearching] = useState(false);

  useEffect(() => {
    setEditText(node.text);
  }, [node.text]);

  const handleExpand = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); 
    if (isExpanding || isEditing || isResearching) return;
    setIsExpanding(true);
    await onExpand(node.id, node.text);
    setIsExpanding(false);
  };

  const handleResearchAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isResearching || isEditing) return;
    setIsResearching(true);
    await onResearch(node.text);
    setIsResearching(false);
  };

  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCollapse(node.id);
  };

  const hasChildren = node.children.length > 0;
  const isCollapsed = node.isCollapsed ?? (level > 0);

  return (
    <div className={`ml-6 border-l pl-4 py-2 relative ${level === 0 ? 'ml-0 border-l-0' : isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
      <div className="flex items-start gap-3 group">
        {hasChildren && (
          <button 
            onClick={toggleCollapse}
            className={`absolute -left-[1.35rem] top-6 -translate-y-1/2 w-6 h-6 border rounded-full flex items-center justify-center transition-all z-10 shadow-lg ${
              isDarkMode ? 'bg-[#1a1f2e] border-white/10 text-slate-400 hover:text-white hover:border-indigo-500/50' : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-500'
            }`}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}

        <div 
          onClick={() => handleExpand()}
          className={`px-5 py-3 rounded-2xl transition-all cursor-pointer shadow-xl relative overflow-hidden flex flex-col ${
            level === 0 
              ? 'bg-indigo-600 ring-4 ring-indigo-500/20' 
              : `glass border hover:border-indigo-500/30 ${isDarkMode ? 'border-white/5 hover:bg-white/10' : 'border-slate-200 hover:bg-white'}`
          } min-w-[200px] max-w-sm active:scale-[0.98]`}
        >
          {(isExpanding || isResearching) && (
            <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center z-10">
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            </div>
          )}
          
          {isEditing ? (
            <textarea
              autoFocus
              className={`bg-transparent text-sm outline-none w-full font-bold resize-none min-h-[40px] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onClick={(e) => e.stopPropagation()} 
              onBlur={() => {
                onEdit(node.id, editText);
                setIsEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  onEdit(node.id, editText);
                  setIsEditing(false);
                }
              }}
            />
          ) : (
            <div className="flex items-start justify-between gap-4">
              <span className={`text-sm font-bold leading-relaxed whitespace-pre-wrap break-words flex-1 ${level === 0 ? 'text-white' : isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                {node.text}
              </span>
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                {hasChildren && (
                   <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${isDarkMode ? 'text-slate-300 bg-black/40 border-white/5' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                     {node.children.length}
                   </span>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
                  className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-1 mt-1">
          <button 
            onClick={handleResearchAction}
            disabled={isResearching}
            className={`p-2 rounded-xl border transition-all ${
              isResearching 
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                : `${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400' : 'bg-white border-slate-200 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600'}`
            }`}
            title="Deep Research this point"
          >
            {isResearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onAdd(node.id); 
            }} 
            className={`p-2 rounded-xl transition-all border ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/10' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
            title="Add Branch"
          >
            <Plus className="w-4 h-4" />
          </button>
          {level > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(node.id); }} 
              className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 transition-all border border-red-500/20"
              title="Delete Branch"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="mt-3 animate-in fade-in slide-in-from-left-2 duration-300">
          {node.children.map((child) => (
            <NodeComponent 
              key={child.id} 
              node={child} 
              onAdd={onAdd} 
              onExpand={onExpand}
              onDelete={onDelete}
              onEdit={onEdit}
              onToggleCollapse={onToggleCollapse}
              onResearch={onResearch}
              level={level + 1}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MindMapPanel: React.FC<MindMapPanelProps> = ({ isOpen, onClose, rootNode, onUpdate, onAddSearchDrop, isDarkMode, selectedLanguage }) => {
  const [expansionLevel, setExpansionLevel] = useState(1);
  const [isAutoExpanding, setIsAutoExpanding] = useState(false);
  const rootNodeRef = useRef(rootNode);

  // Keep ref in sync for async callbacks
  useEffect(() => {
    rootNodeRef.current = rootNode;
  }, [rootNode]);

  if (!rootNode) return null;

  const escapeXml = (unsafe: string) => {
    return unsafe.replace(/[<>&"']/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&apos;';
        default: return c;
      }
    });
  };

  const nodeToFreeMindXml = (node: MindMapNode): string => {
    const escapedText = escapeXml(node.text);
    const childrenXml = node.children.length > 0 
      ? node.children.map(nodeToFreeMindXml).join('') 
      : '';
    
    return `<node TEXT="${escapedText}">${childrenXml}</node>`;
  };

  const updateNodeInTree = (root: MindMapNode, id: string, updater: (node: MindMapNode) => MindMapNode): MindMapNode => {
    if (root.id === id) return updater(root);
    return {
      ...root,
      children: root.children.map(child => updateNodeInTree(child, id, updater))
    };
  };

  const handleAdd = (parentId: string) => {
    const newNode: MindMapNode = {
      id: Math.random().toString(36).substr(2, 9),
      text: 'New Branch',
      children: [],
      parentId,
      isCollapsed: false
    };
    onUpdate(updateNodeInTree(rootNode, parentId, (node) => ({
      ...node,
      isCollapsed: false,
      children: [...node.children, newNode]
    })));
  };

  const handleDelete = (nodeId: string) => {
    const removeNodeFromList = (nodes: MindMapNode[]): MindMapNode[] => {
      return nodes.filter(n => n.id !== nodeId).map(n => ({
        ...n,
        children: removeNodeFromList(n.children)
      }));
    };
    onUpdate({
      ...rootNode,
      children: removeNodeFromList(rootNode.children)
    });
  };

  const handleEdit = (nodeId: string, text: string) => {
    onUpdate(updateNodeInTree(rootNode, nodeId, (node) => ({ ...node, text })));
  };

  const handleToggleCollapse = (nodeId: string) => {
    onUpdate(updateNodeInTree(rootNode, nodeId, (node) => ({ 
      ...node, 
      isCollapsed: !(node.isCollapsed ?? false) 
    })));
  };

  const handleAIExpand = async (nodeId: string, text: string) => {
    const suggestions = await suggestSubBranches(text, [rootNodeRef.current?.text || ''], selectedLanguage);
    if (suggestions.length > 0) {
      const newNodes: MindMapNode[] = suggestions.map((s: string) => ({
        id: Math.random().toString(36).substr(2, 9),
        text: s,
        children: [],
        parentId: nodeId,
        isCollapsed: false
      }));
      
      onUpdate(updateNodeInTree(rootNodeRef.current!, nodeId, (node) => ({
        ...node,
        isCollapsed: false,
        children: [...node.children, ...newNodes]
      })));
    }
  };

  const handleNodeResearch = async (text: string) => {
    try {
      const research = await researchIdea(text, selectedLanguage);
      const newDrop: Drop = {
        id: Date.now().toString(),
        type: 'search',
        title: text,
        content: research.text,
        links: research.links,
        tags: ['Architect Discovery', text.split(' ')[0]],
        createdAt: Date.now()
      };
      onAddSearchDrop(newDrop);
    } catch (error) {
      console.error("Research failed for node", error);
    }
  };

  const updateAllNodesAtLevel = (node: MindMapNode, currentLevel: number, targetLevel: number, collapse: boolean): MindMapNode => {
    let shouldCollapse = node.isCollapsed;
    if (currentLevel === targetLevel) {
      shouldCollapse = collapse;
    }
    if (!collapse && currentLevel < targetLevel) {
      shouldCollapse = false;
    }
    return {
      ...node,
      isCollapsed: shouldCollapse,
      children: node.children.map(child => updateAllNodesAtLevel(child, currentLevel + 1, targetLevel, collapse))
    };
  };

  const findFrontierLeaves = (node: MindMapNode, currentLevel: number, targetLevel: number): MindMapNode[] => {
    if (currentLevel === targetLevel) {
      return node.children.length === 0 ? [node] : [];
    }
    return node.children.flatMap(child => findFrontierLeaves(child, currentLevel + 1, targetLevel));
  };

  const handleGlobalExpand = async () => {
    if (isAutoExpanding) return;
    const nextLevel = expansionLevel + 1;
    
    // Step 1: Update UI expansion state
    const revealedTree = updateAllNodesAtLevel(rootNode, 0, nextLevel - 1, false);
    onUpdate(revealedTree);
    setExpansionLevel(nextLevel);

    // Step 2: Detect leaves at the current edge that need AI generation
    const frontierNodes = findFrontierLeaves(revealedTree, 0, nextLevel - 1);
    
    if (frontierNodes.length > 0) {
      setIsAutoExpanding(true);
      try {
        // We process generation for each frontier node.
        // To avoid multiple serial onUpdate calls, we'll accumulate the changes locally and push once.
        let currentTreeState = revealedTree;
        
        for (let i = 0; i < frontierNodes.length; i++) {
          const fNode = frontierNodes[i];
          const suggestions = await suggestSubBranches(fNode.text, [rootNode.text], selectedLanguage);
          
          if (suggestions.length > 0) {
            const newNodes: MindMapNode[] = suggestions.map((s: string) => ({
              id: Math.random().toString(36).substr(2, 9),
              text: s,
              children: [],
              parentId: fNode.id,
              isCollapsed: false
            }));
            
            currentTreeState = updateNodeInTree(currentTreeState, fNode.id, (node) => ({
              ...node,
              isCollapsed: false,
              children: [...node.children, ...newNodes]
            }));
            
            // Incremental update for visual feedback
            onUpdate(currentTreeState);
          }
          // Slight stagger to respect potential API limits
          await new Promise(r => setTimeout(r, 150));
        }
      } catch (e) {
        console.error("Auto expansion failed", e);
      } finally {
        setIsAutoExpanding(false);
      }
    }
  };

  const handleGlobalCollapse = () => {
    if (expansionLevel <= 0) return;
    const nextLevel = expansionLevel - 1;
    setExpansionLevel(nextLevel);
    onUpdate(updateAllNodesAtLevel(rootNode, 0, nextLevel, true));
  };

  const exportMindMap = () => {
    try {
      const mmContent = `<?xml version="1.0" encoding="UTF-8"?>
<map version="1.0.1">
${nodeToFreeMindXml(rootNode)}
</map>`;
      const blob = new Blob([mmContent], { type: 'application/x-freemind' });
      const url = URL.createObjectURL(blob);
      const fileName = `${rootNode.text.substring(0, 20).replace(/\s+/g, '_')}.mm`;
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export .mm", error);
    }
  };

  return (
    <aside 
      className={`w-[45%] border-l flex flex-col transition-colors duration-300 z-10 ${isDarkMode ? 'bg-[#0d111d] border-white/5 shadow-[-40px_0_80px_rgba(0,0,0,0.4)]' : 'bg-white border-slate-200 shadow-[-20px_0_40px_rgba(0,0,0,0.05)]'}`}
    >
      <div className={`p-6 border-b flex items-center justify-between transition-colors ${isDarkMode ? 'border-white/5 bg-black/40' : 'border-slate-100 bg-slate-50/50'}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className={`text-lg font-black leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Idea Architect</h2>
            <div className="flex items-center gap-2">
              <Layers className="w-3 h-3 text-slate-500" />
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Level {expansionLevel}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center border rounded-xl overflow-hidden p-0.5 mr-2 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
            <button 
              onClick={handleGlobalCollapse}
              className={`p-2.5 rounded-lg transition-all ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-indigo-600 hover:bg-white'}`}
              title="Collapse 1 level"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div className={`w-px h-4 mx-0.5 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
            <button 
              onClick={handleGlobalExpand}
              disabled={isAutoExpanding}
              className={`p-2.5 rounded-lg transition-all ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-indigo-600 hover:bg-white'} ${isAutoExpanding ? 'animate-pulse opacity-50' : ''}`}
              title="Expand & Analyse Depth"
            >
              {isAutoExpanding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <button 
            onClick={exportMindMap}
            className={`p-3 transition-all rounded-xl flex items-center gap-2 group border ${isDarkMode ? 'text-slate-400 hover:text-indigo-400 bg-white/5 hover:bg-indigo-500/10 border-white/5' : 'text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border-slate-200'}`}
            title="Export to .mm (FreeMind)"
          >
            <Download className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:group-hover:inline">Export .mm</span>
          </button>
          <button 
            onClick={onClose}
            className={`p-3 transition-all rounded-xl border ${isDarkMode ? 'text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 border-white/5' : 'text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border-slate-200'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-auto p-10 custom-scrollbar ${isDarkMode ? 'bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,0.03),transparent_50%)]' : 'bg-white'}`}>
        <div className="min-w-max pb-32">
          <NodeComponent 
            node={rootNode} 
            onAdd={handleAdd} 
            onExpand={handleAIExpand}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onToggleCollapse={handleToggleCollapse}
            onResearch={handleNodeResearch}
            level={0}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      <div className={`p-5 border-t text-center ${isDarkMode ? 'border-white/5 bg-black/60' : 'border-slate-100 bg-slate-50/50'}`}>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          {isAutoExpanding ? 'Intelligence analysis in progress...' : 'Structural depth context sync active'}
        </p>
      </div>
    </aside>
  );
};

export default MindMapPanel;
