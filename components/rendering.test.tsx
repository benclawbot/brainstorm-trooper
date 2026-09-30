import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect} from 'vitest';
import SourceInline from './SourceInline';
import RelationshipDiagram from './RelationshipDiagram';
it('renders citation numbers as clickable returned sources and suppresses unreturned URLs',()=>{
 const html=renderToStaticMarkup(<SourceInline text="Fact [1]. [Invented](https://invented.example)" links={[{title:'Evidence',url:'https://source.example'}]}/>);
 expect(html).toContain('href="https://source.example"');expect(html).not.toContain('href="https://invented.example"');
});
it('renders escaped diagram nodes and labelled relationships in an accessible figure',()=>{
 const html=renderToStaticMarkup(<RelationshipDiagram diagram={{title:'Cause and effect',nodes:[{id:'a',label:'<script>',detail:'Cause'},{id:'b',label:'Result',detail:'Effect'}],edges:[{from:'a',to:'b',label:'enables'}]}}/>);
 expect(html).toContain('role="img"');expect(html).toContain('&lt;script&gt;');expect(html).not.toContain('<script>');expect(html).toContain('enables');
});
