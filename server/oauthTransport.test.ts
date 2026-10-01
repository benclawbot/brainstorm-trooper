import {describe,it,expect,vi,afterEach} from 'vitest';
import {handleAi} from './ai';
const moduleUrl=new URL('../node_modules/@siwc/local/dist/responses.js',import.meta.url);
const {streamResponse}=await import(moduleUrl.href);
afterEach(()=>vi.unstubAllGlobals());
describe('ChatGPT Responses streaming',()=>{
  it('uses OAuth on the public endpoint and retains completed structured output and sources',async()=>{
    const output={status:'completed',output:[{type:'web_search_call',action:{sources:[{title:'Source',url:'https://example.org'}]}}]};
    const fetch=vi.fn(async()=>new Response(`data: ${JSON.stringify({type:'response.completed',response:output})}\n\n`,{headers:{'content-type':'text/event-stream'}}));
    vi.stubGlobal('fetch',fetch);
    const result=await streamResponse('synthetic-oauth-token',{model:'gpt-6.1-sol',input:[{role:'user',content:'Research'}],responseOptions:{reasoning:{effort:'low'},tools:[{type:'web_search'}],store:true,stream:false}},AbortSignal.timeout(1000));
    const [url,init]=fetch.mock.calls[0] as any;
    expect(url).toBe('https://api.openai.com/v1/responses');
    expect(init.headers.authorization).toBe('Bearer synthetic-oauth-token');
    expect(JSON.parse(init.body)).toMatchObject({store:false,stream:true,reasoning:{effort:'low'},tools:[{type:'web_search'}]});
    expect(result.response).toEqual(output);
  });
  it('rejects interrupted and failed streams',async()=>{
    vi.stubGlobal('fetch',async()=>new Response('data: {"type":"response.output_text.delta","delta":"partial"}\n\n',{headers:{'content-type':'text/event-stream'}}));
    await expect(streamResponse('synthetic',{model:'gpt-6.1-sol',input:'x'},AbortSignal.timeout(1000))).rejects.toMatchObject({code:'stream_interrupted'});
    vi.stubGlobal('fetch',async()=>new Response('data: {"type":"response.failed","response":{"error":{"code":"subscription_sharing_usage_limit_exceeded"}}}\n\n',{headers:{'content-type':'text/event-stream'}}));
    await expect(streamResponse('synthetic',{model:'gpt-6.1-sol',input:'x'},AbortSignal.timeout(1000))).rejects.toMatchObject({code:'subscription_sharing_usage_limit_exceeded'});
  });
  it('retains completed stream items when the final envelope has empty output',async()=>{
    const source={type:'web_search_call',action:{sources:[{title:'Source',url:'https://example.org'}]}};
    const message={type:'message',content:[{type:'output_text',text:'{"title":"Plan","content":"Steps","tags":[]}',annotations:[{type:'url_citation',url:'https://example.org',end_index:5}]}]};
    const events=[{type:'response.output_item.done',output_index:1,item:message},{type:'response.output_item.done',output_index:0,item:source},{type:'response.completed',response:{status:'completed',output:[]}}];
    vi.stubGlobal('fetch',async()=>new Response(events.map(event=>`data: ${JSON.stringify(event)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}}));
    const result=await streamResponse('synthetic',{model:'gpt-6.1-sol',input:'x'},AbortSignal.timeout(1000));
    expect(result.response).toEqual({status:'completed',output:[source,message]});
    const request=new Request('http://127.0.0.1:3002/api/ai',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'expand',content:'coding agents'})});
    const response=await handleAi(request,{respond:async()=>result.response});
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({result:{title:'Plan',content:'Steps',tags:[]}});
  });
});
