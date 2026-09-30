export interface WorkspaceToolContext {registerTool:(tool:any,options?:{signal:AbortSignal})=>void|Promise<void>;}
export function registerWorkspaceTools(context: WorkspaceToolContext | undefined, getWorkspace:()=>unknown, stageTopic:(topic:string)=>void) {
  if(!context?.registerTool)return ()=>{};
  const lifecycle=new AbortController();
  const tools=[{
    name:'read_brainstorm_workspace',title:'Read current brainstorming project',description:'Read the currently selected project, including notes, sources and the complete mind map.',
    inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},
    execute(input:unknown){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Expected an empty object.');return getWorkspace();},
  },{
    name:'stage_brainstorm_topic',title:'Prepare an exploration topic',description:'Place a topic in the visible input. This only stages it; it does not call AI or create content. The user can choose research, idea expansion, or a diagram.',
    inputSchema:{type:'object',properties:{topic:{type:'string'}},required:['topic'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute(input:any){if(!input||typeof input.topic!=='string'||!input.topic.trim()||input.topic.length>12000||Object.keys(input).some(key=>key!=='topic'))throw new Error('Provide a topic under 12,000 characters.');const topic=input.topic.trim();stageTopic(topic);return {status:'staged',topic};},
  }];
  for(const tool of tools)try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
  return ()=>lifecycle.abort();
}
