import React, {useId} from 'react';
import { Diagram } from '../types';

export default function RelationshipDiagram({diagram}: {diagram: Diagram}) {
  const marker=useId().replace(/:/g,'');
  const positions=new Map(diagram.nodes.map((node,i)=>[node.id,{x:i%2?375:35,y:35+Math.floor(i/2)*165}]));
  const height=Math.ceil(diagram.nodes.length/2)*165+10;
  return <figure className="relationship-diagram">
    <figcaption>{diagram.title}</figcaption>
    <svg viewBox={`0 0 690 ${height}`} role="img" aria-label={diagram.title}>
      <defs><marker id={marker} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#a995ff"/></marker></defs>
      {diagram.edges.map((edge,i)=>{
        const a=positions.get(edge.from),b=positions.get(edge.to);if(!a||!b)return null;
        const horizontal=a.y===b.y;
        const x1=horizontal?(a.x<b.x?a.x+260:a.x):a.x+130;
        const x2=horizontal?(a.x<b.x?b.x:b.x+260):b.x+130;
        const y1=horizontal?a.y+50:a.y<b.y?a.y+105:a.y;
        const y2=horizontal?b.y+50:a.y<b.y?b.y:b.y+105;
        return <g key={i}><path d={`M${x1},${y1} L${x2},${y2}`} stroke="#a995ff" strokeWidth="2" opacity=".65" markerEnd={`url(#${marker})`}/><title>{`${edge.from} ${edge.label} ${edge.to}`}</title></g>;
      })}
      {diagram.nodes.map(node=>{const p=positions.get(node.id)!;return <g key={node.id}>
        <rect x={p.x} y={p.y} width="260" height="105" rx="16" fill="var(--surface-raised)" stroke="var(--border-color)"/>
        <foreignObject x={p.x+14} y={p.y+12} width="232" height="86"><div className="diagram-node"><strong>{node.label}</strong><span>{node.detail}</span></div></foreignObject>
      </g>})}
    </svg>
    <ul className="diagram-relationships">{diagram.edges.map((edge,i)=><li key={i}><strong>{diagram.nodes.find(n=>n.id===edge.from)?.label}</strong><span>{edge.label}</span><strong>{diagram.nodes.find(n=>n.id===edge.to)?.label}</strong></li>)}</ul>
  </figure>;
}
