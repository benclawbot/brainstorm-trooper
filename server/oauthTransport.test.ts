import {describe,it,expect,vi,afterEach} from 'vitest';
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
});
