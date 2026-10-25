import test from 'node:test';
import assert from 'node:assert/strict';
import { openFolder } from '../src/host/operations.js';
test('Explorer is visible, URI-safe and awaits handoff rather than spawn', async()=>{
  let done;
  const pending=openFolder('D:\\项目,a=b\\some folder',{platform:'win32',run:(command,args,options,callback)=>{
    assert.match(command,/explorer\.exe$/);assert.equal(options.windowsHide,false);assert.equal(options.shell,false);
    assert.match(args[0],/^file:\/\/\/D:\/项目%2Ca%3Db\/some%20folder$/);done=callback;
  }});
  let settled=false;pending.then(()=>settled=true);await Promise.resolve();assert.equal(settled,false);
  done(Object.assign(new Error('handoff'),{code:1}),'','');assert.equal((await pending).requested,true);
  await assert.rejects(openFolder('D:\\test',{platform:'win32',run:(_c,_a,_o,cb)=>cb(Object.assign(new Error('missing'),{code:'ENOENT'}),'','')}),/missing/);
});
