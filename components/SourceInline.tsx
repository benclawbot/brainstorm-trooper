import React from 'react';
import {ResearchSource} from '../types';
export const safeSourceUrl=(url: string)=>/^https?:\/\//i.test(url)?url:undefined;
export default function SourceInline({text,links=[]}:{text:string;links?:ResearchSource[]}) {
  return <>{text.split(/(\[\d+\]|\*\*.*?\*\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g).map((part,i)=>{
    if(part.startsWith('**')&&part.endsWith('**'))return <strong key={i}>{part.slice(2,-2)}</strong>;
    const markdown=part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if(markdown && !links.some(link => link.url === markdown[2])) return markdown[1];
    if(markdown)return <a key={i} href={markdown[2]} target="_blank" rel="noopener noreferrer" className="source-citation">{markdown[1]}</a>;
    const match=part.match(/^\[(\d+)\]$/);const link=match?links[Number(match[1])-1]:null;
    if(link&&safeSourceUrl(link.url))return <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="source-citation" title={link.title}>{part}</a>;
    return part;
  })}</>;
}
