import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { handleAi } from './server/ai';

export default defineConfig(({mode}) => {
  const env=loadEnv(mode, '.', '');
  return {
    server:{port:3002,strictPort:true,host:'0.0.0.0',allowedHosts:['terminal.local']},
    plugins:[react(), {
      name:'server-side-openai',
      configureServer(server) {
        server.middlewares.use(async (req,res,next) => {
          if(!req.url?.startsWith('/api/'))return next();
          try {
            const origin=`http://${req.headers.host}`;
            const headers = new Headers();
            for(const [name,value] of Object.entries(req.headers)) if(value)headers.set(name,Array.isArray(value)?value.join(','):value);
            const chunks:Buffer[]=[];let size=0;
            for await(const chunk of req){size+=chunk.length;if(size>200000){res.statusCode=413;res.end(JSON.stringify({error:'The workspace is too large.'}));return;}chunks.push(chunk);}
            const request=new Request(new URL(req.url,origin),{method:req.method,headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})});
            const response=await handleAi(request,{OPENAI_API_KEY:env.OPENAI_API_KEY||process.env.OPENAI_API_KEY});
            res.statusCode=response.status;
            response.headers.forEach((value,key)=>res.setHeader(key,value));
            res.end(await response.text());
          }catch{res.statusCode=500;res.end(JSON.stringify({error:'The local AI server could not process this request.'}));}
        });
      },
    }],
    resolve:{alias:{'@':path.resolve(import.meta.dirname,'.')}},
    build:{outDir:'dist/client'},
  };
});
