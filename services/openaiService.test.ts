import {it,expect,vi} from 'vitest';
import {OpenAIService} from './openaiService';
it('calls only the same-origin API with no credential and forwards both map and notes',async()=>{
 const mock=vi.fn(async()=>Response.json({result:{text:'Hello',edits:[]}}));
 const service=new OpenAIService(mock);const map={id:'r',text:'Topic',children:[]};
 await service.chatWithWorkspace('Next?',[],[],map);
 const [url,init]=mock.mock.calls[0] as unknown as [string,RequestInit];expect(url).toBe('/api/ai');expect(init.headers).toEqual({'Content-Type':'application/json'});expect(JSON.parse(String(init.body)).mindMap).toEqual(map);
});
it('binds browser fetch correctly and surfaces server errors',async()=>{
 const mock=vi.fn(function(this:unknown){expect(this).toBe(globalThis);return Promise.resolve(Response.json({error:'AI is not connected yet.'},{status:503}));});
 await expect(new OpenAIService(mock).researchIdea('Topic')).rejects.toThrow('AI is not connected');
});
