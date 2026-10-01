import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createChatGPT } from '@siwc/local';
import { MODEL, REASONING_EFFORT, handleAi } from './ai';

export const credentialEncryption = {
  id: 'windows-dpapi-current-user-v1',
  isAvailable: () => process.platform === 'win32',
  encrypt: (value: string) => protect(Buffer.from(value), 'Protect'),
  decrypt: (value: Uint8Array) => protect(Buffer.from(value), 'Unprotect').toString('utf8'),
};
function protect(value: Buffer, operation: 'Protect' | 'Unprotect'): Buffer {
  // DPAPI binds stored credentials to this Windows user; secrets travel only through pipes.
  const script = `Add-Type -AssemblyName System.Security; $data=[Convert]::FromBase64String([Console]::In.ReadToEnd()); [Convert]::ToBase64String([Security.Cryptography.ProtectedData]::${operation}($data,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))`;
  try {
    const result=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{input:value.toString('base64'),encoding:'utf8',windowsHide:true,timeout:15000,stdio:['pipe','pipe','pipe']});
    return Buffer.from(result.trim(),'base64');
  } catch { throw new Error('Windows could not protect or read the saved ChatGPT connection.'); }
}

export function createLocalOAuth(storageDir=path.resolve('.brainstorm-auth')) {
  const client=createChatGPT({appName:'Brainstorm Trooper',appId:'brainstorm-trooper',redirectPort:0,storageDir,credentialEncryption,sendHostId:true});
  return async (request: Request): Promise<Response> => {
    const url=new URL(request.url);
    const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
    if(!['127.0.0.1','localhost'].includes(url.hostname))return json({error:'Use the app on this computer.'},403);
    if(request.method==='POST' && request.headers.get('origin')!==url.origin)return json({error:'Cross-origin requests are not allowed.'},403);
    if(url.pathname==='/api/status'){
      const session=await client.getSession();
      return json({configured:session.status==='connected'&&session.sharing,oauthAvailable:credentialEncryption.isAvailable(),model:MODEL,reasoningEffort:REASONING_EFFORT,session});
    }
    if(url.pathname.startsWith('/api/auth/')){
      if(request.method!=='POST')return json({error:'Use POST.'},405);
      if(!credentialEncryption.isAvailable())return json({error:'Local ChatGPT sign-in currently requires Windows.'},503);
      try {
        if(url.pathname==='/api/auth/start'){
          if((await client.getSession()).status==='connecting')return json({error:'Finish or cancel the current sign-in first.'},409);
          void client.signIn({reconsent:true}).catch(()=>{}); // The SDK publishes safe errors to /api/status.
          return json({started:true},202);
        }
        if(url.pathname==='/api/auth/cancel'){client.cancelSignIn();return json({cancelled:true});}
        if(url.pathname==='/api/auth/disconnect'){await client.disconnect();return json({disconnected:true});}
        return json({error:'Not found.'},404);
      } catch{return json({error:'The ChatGPT connection could not be changed. Check its status and try again.'},502);}
    }
    return handleAi(request,{respond:async payload=>{
      const {model,input,instructions,store:_store,stream:_stream,...responseOptions}=payload;
      const result=await client.streamResponse({model,input,instructions,responseOptions,signal:AbortSignal.timeout(150000)});
      if(!result.response)throw new Error('The response was incomplete. Try again.');
      return result.response;
    }});
  };
}
