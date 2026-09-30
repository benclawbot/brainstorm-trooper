import {it,expect,vi} from 'vitest';
import {registerWorkspaceTools} from './webmcp';
it('registers read and stage actions, changes the supplied UI state, rejects invalid input and cleans up',()=>{
 const registered:any[]=[];let input='';let signal:AbortSignal;
 const stop=registerWorkspaceTools({registerTool:(tool,options)=>{registered.push(tool);signal=options!.signal;}},()=>({project:'Topic'}),topic=>{input=topic;});
 expect(registered.map(tool=>tool.name)).toEqual(['read_brainstorm_workspace','stage_brainstorm_topic']);expect(registered[0].annotations.readOnlyHint).toBe(true);
 expect(registered[0].execute({})).toEqual({project:'Topic'});expect(registered[1].execute({topic:' Explore '})).toEqual({status:'staged',topic:'Explore'});expect(input).toBe('Explore');
 expect(()=>registered[1].execute({topic:''})).toThrow();expect(input).toBe('Explore');stop();expect(signal!.aborted).toBe(true);
});
