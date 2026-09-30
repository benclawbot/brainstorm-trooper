import React, {useState, useRef, useEffect} from 'react';
import {X,Send,Bot,Sparkles,Loader2,Check,Undo2} from 'lucide-react';
import {ChatMessage,Drop,Language,MindMapNode,MapEdit} from '../types';
import {chatWithWorkspace} from '../services/openaiService';
import {applyMapEdits} from '../services/mapOperations';
interface Props {isOpen:boolean;onClose:()=>void;drops:Drop[];isDarkMode:boolean;mindMap:MindMapNode|null;onApplyMap:(root:MindMapNode)=>void;lang:Language;}
export default function AIChatPanel({isOpen,onClose,drops,isDarkMode,mindMap,onApplyMap,lang}:Props) {
  const fr=lang==='fr';
  const [messages,setMessages]=useState<ChatMessage[]>([]);
  const [input,setInput]=useState('');const [isTyping,setIsTyping]=useState(false);const [error,setError]=useState('');
  const [proposal,setProposal]=useState<{edits:MapEdit[];base:string;before:MindMapNode;after:MindMapNode}|null>(null);
  const [undo,setUndo]=useState<{before:MindMapNode;after:string}|null>(null);
  const [preview,setPreview]=useState(false);const scroll=useRef<HTMLDivElement>(null);
  useEffect(()=>{scroll.current?.scrollTo({top:scroll.current.scrollHeight});},[messages,isTyping,proposal]);
  const findLabel=(id:string,node=mindMap):string=>{if(!node)return id;if(node.id===id)return node.text;for(const child of node.children){const label=findLabel(id,child);if(label!==id)return label;}return id;};
  const send=async()=>{
    if(!input.trim()||isTyping)return;
    const question=input;const base=JSON.stringify(mindMap);setInput('');setError('');setProposal(null);setUndo(null);setPreview(false);
    setMessages(prev=>[...prev,{id:crypto.randomUUID(),role:'user',text:question,timestamp:Date.now()}]);setIsTyping(true);
    try {
      const response=await chatWithWorkspace(question,messages,drops,mindMap,lang);
      setMessages(prev=>[...prev,{id:crypto.randomUUID(),role:'assistant',text:response.text,timestamp:Date.now()}]);
      if(response.edits.length&&mindMap)setProposal({edits:response.edits,base,before:mindMap,after:applyMapEdits(mindMap,response.edits)});
    }catch(err){setError(err instanceof Error?err.message:'Request failed.');setInput(question);}finally{setIsTyping(false);}
  };
  const apply=()=>{
    if(!proposal)return;
    if(JSON.stringify(mindMap)!==proposal.base){setError(fr?'La carte a changé. Demandez une nouvelle proposition.':'The map changed. Ask for a fresh proposal.');return;}
    onApplyMap(proposal.after);setUndo({before:proposal.before,after:JSON.stringify(proposal.after)});setProposal(null);setPreview(false);
  };
  const undoEdit=()=>{
    if(!undo)return;
    if(JSON.stringify(mindMap)!==undo.after){setError(fr?'La carte a changé depuis. Annulation indisponible.':'The map changed since this edit. Undo is unavailable.');return;}
    onApplyMap(undo.before);setUndo(null);
  };
  if(!isOpen)return null;
  return <aside role="dialog" aria-label={fr?'Assistant du projet':'Project assistant'} className={`fixed top-0 right-0 h-full w-full sm:w-[440px] z-[60] border-l flex flex-col shadow-2xl ${isDarkMode?'bg-[#0b1019] border-white/10 text-slate-100':'bg-white border-slate-200 text-slate-900'}`}>
    <div className="p-5 border-b border-slate-500/20 flex items-center gap-3"><Bot className="text-indigo-400"/><div className="flex-1"><h2 className="font-bold">{fr?'Assistant du projet':'Project assistant'}</h2><p className="text-sm text-slate-400">GPT-6.1 Sol · {fr?'Notes + carte mentale':'Notes + mind map'}</p></div><button aria-label="Close assistant" onClick={onClose}><X/></button></div>
    <div ref={scroll} className="flex-1 overflow-auto p-5 space-y-5">
      {!messages.length&&<p className="text-base leading-relaxed text-slate-400">{fr?'Posez une question sur le projet ou demandez une modification de la carte. Vous pourrez la vérifier avant de l’appliquer.':'Ask about your project or request a map edit. You can review changes before applying them.'}</p>}
      {messages.map(msg=><div key={msg.id} className={`p-4 rounded-2xl ${msg.role==='user'?'bg-indigo-600 text-white ml-7':'bg-slate-500/10 mr-3'}`}><span className="flex gap-2 items-center text-sm mb-2 opacity-70"><Sparkles size={14}/>{msg.role==='user'?(fr?'Vous':'You'):'Assistant'}</span><p className="whitespace-pre-wrap text-base leading-relaxed">{msg.text}</p></div>)}
      {isTyping&&<Loader2 className="animate-spin text-indigo-400" aria-label="Thinking"/>}
      {proposal&&<section className="proposal-panel"><h3>{fr?'Modifications proposées':'Proposed map changes'}</h3><ol>{proposal.edits.map((edit,i)=><li key={i}><strong>{edit.type} · {edit.type==='add'?findLabel(edit.parentId||''):findLabel(edit.nodeId)}</strong>{edit.text&&<p>{edit.text}</p>}{edit.type==='move'&&<p>{fr?'Vers':'To'}: {findLabel(edit.parentId||'')}</p>}<p className="text-slate-400">{edit.reason}</p></li>)}</ol>
        <button className="proposal-secondary" onClick={()=>setPreview(!preview)}>{preview?(fr?'Masquer l’aperçu':'Hide preview'):(fr?'Voir la carte proposée':'Preview resulting map')}</button>
        {preview&&<div className="map-preview"><MapPreview node={proposal.after}/></div>}
        <div className="flex gap-3 mt-4"><button onClick={apply} className="proposal-primary"><Check size={16}/>{fr?'Appliquer':'Apply changes'}</button><button className="proposal-secondary" onClick={()=>{setProposal(null);setPreview(false);}}>{fr?'Ignorer':'Dismiss'}</button></div>
      </section>}
      {undo&&<button className="proposal-secondary" onClick={undoEdit}><Undo2 size={16}/>{fr?'Annuler les changements':'Undo map changes'}</button>}
      {error&&<p role="alert" className="text-red-400 text-base">{error}</p>}
    </div>
    <form className="p-5 border-t border-slate-500/20 flex gap-2" onSubmit={e=>{e.preventDefault();send();}}><input aria-label="Message" value={input} onChange={e=>setInput(e.target.value)} className="min-w-0 flex-1 bg-slate-500/10 border border-slate-500/20 rounded-xl p-3 text-base" placeholder={fr?'Creuse cette contradiction…':'Find an overlooked angle…'}/><button aria-label="Send message" disabled={isTyping||!input.trim()} className="p-3 rounded-xl bg-indigo-600 text-white disabled:opacity-40"><Send size={20}/></button></form>
  </aside>;
}
function MapPreview({node}:{node:MindMapNode}){return <ul><li>{node.text}{node.children.map(child=><MapPreview key={child.id} node={child}/>)}</li></ul>}
