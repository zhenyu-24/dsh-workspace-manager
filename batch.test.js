import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOperations } from './operations.js';
test('counts exclude archives, batch deduplicates and isolates failures, deletion preserves sessions', async () => {
 const archived=new Set(['b']); const calls=[]; const map=new Map();
 const w={id:'w',title:'Work',path:process.cwd(),sessionIds:['a','b','c'],async setTitle(t){this.title=t;}};
 const registry={list:()=>[w],get:id=>id==='w'?w:undefined,async archiveSession(id){calls.push(id);if(id==='c')throw new Error('active');archived.add(id);},async unarchiveSession(id){archived.delete(id);},async delete(id){calls.push('delete:'+id);return true;}};
 const table={get:k=>map.get(k),put:async(k,v)=>map.set(k,v),delete:async k=>map.delete(k)};
 const op=createOperations(registry,table,undefined,{catalog:async()=>new Map(w.sessionIds.map(id=>[id,{sessionId:id,archived:archived.has(id)}])),renameSession:async(id,title)=>({id,title})});
 assert.equal((await op({action:'list'})).workspaces[0].sessionCount,2);
 const r=await op({action:'archive',targets:[{workspaceId:'w'},{workspaceId:'w',sessionId:'a'}]});
 assert.equal(calls.filter(x=>x==='a').length,1);assert.equal(r.results.filter(r=>!r.ok).length,1);
 assert.equal((await op({action:'list'})).workspaces[0].sessionCount,1);
 const blocked=await op({action:'delete',targets:[{workspaceId:'w',sessionId:'a'}]});assert.equal(blocked.results[0].ok,false);
 assert.deepEqual(await op({action:'rename',workspaceId:'w',sessionId:'a',title:' New '}),{id:'a',title:'New'});
 await assert.rejects(op({action:'rename',workspaceId:'w',sessionId:'outside',title:'New'}),/不属于/);
 await op({action:'unarchive',targets:[{workspaceId:'w'}]});assert.equal(archived.size,0);
 await op({action:'delete',targets:[{workspaceId:'w'}]});assert.ok(calls.includes('delete:w'));assert.equal(w.sessionIds.length,3);
});
