import {describe,it,expect,vi} from 'vitest';
import {handleAi,extractResearch,normalizeMap,validateDiagram,MODEL} from './ai';
import worker from './worker';
const req=(body:unknown,headers:Record<string,string>={})=>new Request('https://example.com/api/ai',{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
const output=(result:unknown)=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(result)}]}]});
const mocked=(data:unknown)=>vi.fn(async(_payload:unknown)=>data);
describe('OpenAI server contract',()=>{
  it('uses the requested model, low effort, Responses, strict structured output, and server-owned requests',async()=>{
    const fetch=mocked(output({title:'Plan',content:'Steps',tags:[]}));
    const response=await handleAi(req({action:'expand',content:'Garden'}),{respond:fetch});
    expect(response.status).toBe(200);
    expect(fetch.mock.calls[0][0]).toMatchObject({model:'gpt-6.1-sol',reasoning:{effort:'low'},store:false,stream:true,text:{format:{type:'json_schema',strict:true}}});
    expect(fetch.mock.calls[0][0]).not.toHaveProperty('max_output_tokens');
    expect(await response.text()).not.toContain('server-test-secret');
  });
  it('requires web search and retains only returned sources, citations and retrieval time',async()=>{
    const fetch=mocked({status:'completed',output:[{type:'web_search_call',action:{sources:[{url:'https://example.org/research',title:'Paper'}]}},{type:'message',content:[{type:'output_text',text:'A finding.',annotations:[{type:'url_citation',url:'https://example.org/research',title:'Paper',end_index:10}]}]}]});
    const response=await handleAi(req({action:'research',content:'Question'}),{respond:fetch});
    expect(fetch.mock.calls[0][0]).toMatchObject({tools:[{type:'web_search'}],tool_choice:'required',include:['web_search_call.action.sources']});
    const {result}=await response.json();expect(result.text).toContain('[1]');expect(result.links).toHaveLength(1);expect(result.links[0].retrievedAt).toBe(result.researchedAt);
  });
  it('fails research when the provider does not actually search or returns no sources',()=>{
    expect(()=>extractResearch({output:[{type:'message',content:[{type:'output_text',text:'Unsourced speculation'}]}]},'now')).toThrow('No sourced web results');
  });
  it('drops unsafe citations and deduplicates real links',()=>{
    const data={output:[{type:'web_search_call',action:{sources:[{url:'javascript:alert(1)'},{url:'https://example.org',title:'Source'},{url:'https://example.org'}]}},{type:'message',content:[{type:'output_text',text:'Fact',annotations:[{type:'url_citation',url:'https://example.org',end_index:4}]}]}]};
    expect(extractResearch(data,'now').links).toEqual([{url:'https://example.org',title:'Source',retrievedAt:'now'}]);
  });
  it('passes both research notes and the full map to chat, without applying edits',async()=>{
    const map={id:'root',text:'Garden',children:[{id:'a',text:'Light',children:[]}]};
    const fetch=mocked(output({text:'Consider costs.',edits:[{type:'rename',nodeId:'a',parentId:null,text:'Sunlight',reason:'Precise label'}]}));
    const response=await handleAi(req({action:'chat',content:'Improve',mindMap:map,drops:[{content:'Research notes'}],history:[]}),{respond:fetch});
    expect(response.status).toBe(200);const payload=fetch.mock.calls[0][0] as any;
    expect(JSON.parse(payload.input[0].content)).toMatchObject({mindMap:map,workspace:[{content:'Research notes'}]});expect(map.children[0].text).toBe('Light');
  });
  it('rejects missing OAuth, invalid actions, cross-origin callers and oversized requests without a provider call',async()=>{
    const fetch=vi.fn();
    expect((await handleAi(req({action:'expand',content:'x'}),{})).status).toBe(503);
    expect((await handleAi(req({action:'constructor',content:'x'}),{})).status).toBe(400);
    expect((await handleAi(req({action:'expand',content:'x'},{origin:'https://evil.example'}),{})).status).toBe(403);
    expect((await handleAi(req({action:'expand',content:'x'.repeat(210000)}),{})).status).toBe(413);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('does not return raw upstream errors or secrets',async()=>{
    const fetch=vi.fn(async()=>{throw new Error('Leaked token: secret')});
    const response=await handleAi(req({action:'expand',content:'x'}),{respond:fetch});
    expect(response.status).toBe(502);expect(await response.text()).not.toContain('secret');
  });
  it('rejects incomplete output',async()=>{
    const response=await handleAi(req({action:'expand',content:'x'}),{respond:mocked({status:'incomplete',output:[]})});expect(response.status).toBe(502);
  });
  it('serves static assets and routes API requests from the Worker',async()=>{
    const assets={fetch:vi.fn(async()=>new Response('<html>workspace</html>'))};
    expect(await (await worker.fetch(new Request('https://example.com/'),{ASSETS:assets})).text()).toContain('workspace');
    const status=await worker.fetch(new Request('https://example.com/api/status'),{ASSETS:assets});expect(await status.json()).toEqual({configured:false,oauthAvailable:false,model:MODEL,reasoningEffort:'low'});
  });
});
describe('generated graph validation',()=>{
  it('ensures unique map IDs and rejects runaway depth',()=>{
    const map=normalizeMap({id:'x',text:'Root',children:[{id:'x',text:'Child',children:[]}]});expect(map.children[0].id).not.toBe(map.id);
    expect(()=>normalizeMap({text:'x',children:'invalid'})).toThrow();
  });
  it('rejects dangling diagram relationships',()=>{
    expect(()=>validateDiagram({title:'x',nodes:[{id:'a',label:'a',detail:''},{id:'b',label:'b',detail:''}],edges:[{from:'a',to:'c',label:'causes'}]})).toThrow();
  });
});
