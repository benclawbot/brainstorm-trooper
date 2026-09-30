import {describe,it,expect} from 'vitest';
import {applyMapEdits} from './mapOperations';
import {MapEdit} from '../types';
const root=()=>({id:'root',text:'Topic',children:[{id:'a',text:'First',children:[{id:'c',text:'Child',children:[]}]},{id:'b',text:'Second',children:[]}]});
const edit=(type:MapEdit['type'],nodeId:string,parentId:string|null=null,text:string|null=null):MapEdit=>({type,nodeId,parentId,text,reason:'Example'});
describe('reviewed map edits',()=>{
  it('stages add, rename and move without modifying the original tree',()=>{
    const original=root();const after=applyMapEdits(original,[edit('rename','a',null,'Renamed'),edit('move','c','b'),edit('add','','a','New branch')]);
    expect(original).toEqual(root());expect(after.children[0].text).toBe('Renamed');expect(after.children[1].children[0].id).toBe('c');expect(after.children[0].children[0].text).toBe('New branch');
  });
  it('rejects cycles, missing nodes, and root removal',()=>{
    expect(()=>applyMapEdits(root(),[edit('move','a','c')])).toThrow('descendants');
    expect(()=>applyMapEdits(root(),[edit('rename','gone',null,'x')])).toThrow('no longer');
    expect(()=>applyMapEdits(root(),[edit('remove','root')])).toThrow('root');
  });
  it('applies removals only to a cloned result and keeps the original intact on a later failure',()=>{
    const original=root();expect(applyMapEdits(original,[edit('remove','a')]).children).toHaveLength(1);expect(original.children).toHaveLength(2);
    expect(()=>applyMapEdits(original,[edit('remove','a'),edit('rename','a',null,'x')])).toThrow();expect(original).toEqual(root());
  });
});
