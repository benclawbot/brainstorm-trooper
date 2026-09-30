import {readFileSync,readdirSync,statSync} from 'node:fs';
import assert from 'node:assert/strict';
const walk=dir=>readdirSync(dir).flatMap(name=>{const path=`${dir}/${name}`;return statSync(path).isDirectory()?walk(path):[path];});
const clientFiles=walk('dist/client');
for(const file of clientFiles.filter(file=>/\.(js|html)$/.test(file))){
 const contents=readFileSync(file,'utf8');
 assert(!/MINIMAX_API_KEY|process\.env\.OPENAI_API_KEY|api\.minimax\.io|api\.openai\.com\/v1\/responses/.test(contents),`Server configuration leaked into ${file}`);
 if(process.env.BRAINSTORM_SECRET_PROBE)assert(!contents.includes(process.env.BRAINSTORM_SECRET_PROBE),`Build probe leaked into ${file}`);
}
const worker=await import('../dist/server/index.js');
assert.equal(typeof worker.default?.fetch,'function','Worker must expose fetch');
const response=await worker.default.fetch(new Request('https://example.test/api/status'),{});
assert.deepEqual(await response.json(),{configured:false,model:'gpt-6.1-sol',reasoningEffort:'low'});
assert.deepEqual(JSON.parse(readFileSync('dist/.openai/hosting.json','utf8')),JSON.parse(readFileSync('.openai/hosting.json','utf8')));
console.log('Build verified: Worker entrypoint, hosting identity, and client credential isolation.');
