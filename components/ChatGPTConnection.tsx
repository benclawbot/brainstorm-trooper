import React, {useEffect,useState} from 'react';
import {Language} from '../types';

type Status={configured:boolean;oauthAvailable:boolean;session?:{status:string;sharing:boolean;identity?:{name?:string;email?:string};error?:{message:string}}};
export default function ChatGPTConnection({lang}:{lang:Language}){
  const [status,setStatus]=useState<Status|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const fr=lang==='fr';
  const refresh=async()=>{const response=await fetch('/api/status');if(!response.ok)throw new Error('Connection status unavailable.');setStatus(await response.json());};
  useEffect(()=>{void refresh().catch(()=>setError(fr?'Connexion indisponible. Recharge la page.':'Connection unavailable. Reload the page.'));},[]);
  const connecting=status?.session?.status==='connecting';
  useEffect(()=>{if(!connecting)return;const timer=setInterval(()=>void refresh().catch(()=>{}),2000);return()=>clearInterval(timer);},[connecting]);
  const change=async(action:string)=>{
    setBusy(true);setError('');
    try{const response=await fetch(`/api/auth/${action}`,{method:'POST'});if(!response.ok){const data=await response.json();throw new Error(data.error);}await refresh();}
    catch(e){setError(e instanceof Error?e.message:'Connection failed.');}
    finally{setBusy(false);}
  };
  if(!status)return error?<div role="alert" className="connection-status">{error}</div>:null;
  if(!status.oauthAvailable)return <div role="status" className="connection-status">{fr?'Pour utiliser ton abonnement ChatGPT, lance la version locale sur ton PC. L’IA de ce Site attend l’approbation de l’intégration hébergée.':'Use the local app on your PC to connect your ChatGPT plan. AI on this Site is awaiting hosted integration approval.'} <a href="https://github.com/benclawbot/brainstorm-trooper#local-chatgpt-connection" target="_blank" rel="noreferrer" className="underline">{fr?'Ouvrir la version locale':'Open local setup'}</a></div>;
  return <div className="connection-status flex flex-wrap items-center gap-3">
    <span role="status">{connecting?(fr?'Termine la connexion dans ton navigateur.':'Finish connecting in your browser.'):status.configured?`${status.session?.identity?.name||'ChatGPT'} · ${fr?'Abonnement connecté':'Plan connected'}`:status.session?.status==='connected'?(fr?'Autorise l’utilisation de ton abonnement pour activer l’IA.':'Allow ChatGPT plan usage to enable AI.'):(fr?'Connecte ton abonnement ChatGPT pour activer l’IA.':'Connect your ChatGPT plan to enable AI.')}</span>
    <button className="proposal-secondary" disabled={busy} onClick={()=>void change(connecting?'cancel':status.configured?'disconnect':'start')}>{connecting?(fr?'Annuler':'Cancel'):status.configured?(fr?'Déconnecter':'Disconnect'):'Continue with ChatGPT'}</button>
    {status.configured&&<a href="https://chatgpt.com/settings/usage" target="_blank" rel="noreferrer" className="underline">{fr?'Gérer l’utilisation':'Manage usage'}</a>}
    {(error||status.session?.error?.message)&&<span role="alert">{error||status.session?.error?.message}</span>}
  </div>;
}
