import {describe,it,expect,vi} from 'vitest';
import {credentialEncryption,createLocalOAuth} from './localOAuth';
const client=vi.hoisted(()=>({getSession:vi.fn(async()=>({status:'disconnected',sharing:false})),signIn:vi.fn(async()=>({})),cancelSignIn:vi.fn(),disconnect:vi.fn(async()=>{}),streamResponse:vi.fn(async(_options:unknown)=>({text:'',response:{status:'completed',output:[{type:'message',content:[{type:'output_text',text:'{"title":"Plan","content":"Steps","tags":[]}'}]}]}}))}));
vi.mock('@siwc/local',()=>({createChatGPT:()=>client}));
const request=(path:string,method='GET',body?:unknown,origin='http://127.0.0.1:3002')=>new Request(`http://127.0.0.1:3002${path}`,{method,headers:{origin,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
describe('local ChatGPT OAuth',()=>{
  it('encrypts with Windows DPAPI and decrypts in a new process',()=>{
    if(process.platform!=='win32')return;
    const ciphertext=credentialEncryption.encrypt('synthetic-credential');
    expect(Buffer.from(ciphertext).toString()).not.toContain('synthetic-credential');
    expect(credentialEncryption.decrypt(ciphertext)).toBe('synthetic-credential');
  });
  it('reports permission accurately, starts sign-in only on a same-origin POST, and keeps tokens out of requests',async()=>{
    const handle=createLocalOAuth();
    const status=await (await handle(request('/api/status'))).json();
    expect(status.configured).toBe(false);expect(status.session).toEqual({status:'disconnected',sharing:false});
    expect((await handle(request('/api/auth/start','GET'))).status).toBe(405);
    expect((await handle(request('/api/auth/start','POST',undefined,'https://other.example'))).status).toBe(403);
    expect(client.signIn).not.toHaveBeenCalled();
    const response=await handle(request('/api/ai','POST',{action:'expand',content:'Garden'}));
    expect(response.status).toBe(200);
    expect(client.streamResponse.mock.calls[0][0]).toMatchObject({model:'gpt-6.1-sol',responseOptions:{reasoning:{effort:'low'},text:{format:{type:'json_schema',strict:true}}}});
    const options=client.streamResponse.mock.calls[0][0] as any;
    expect(options.responseOptions).not.toHaveProperty('max_output_tokens');
    expect(options).not.toHaveProperty('accessToken');
  });
});
