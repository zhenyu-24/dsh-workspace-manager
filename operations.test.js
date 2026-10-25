import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createOperations } from './operations.js';

test('workspace source operations validate, persist, deduplicate and reject stale writes', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wse-test-'));
  try {
    const extra = path.join(root, 'extra'); await mkdir(extra);
    const values = new Map();
    const table = { get: k => values.get(k), put: async (k,v) => values.set(k,v), delete: async k => values.delete(k) };
    let rejectRename = false;
    const w = { id: 'one', path: root, title: 'Before', sessionIds: ['a','b'], async setTitle(title) { if(rejectRename) throw new Error('rename failed'); this.title = title; } };
    const op = createOperations({ list: () => [w], get: id => id === w.id ? w : undefined }, table, async folder => ({ opened:true,path:folder }));
    assert.equal((await op({ action:'list' })).workspaces[0].sessionCount,2);
    const saved = await op({ action:'save',workspaceId:'one',title:'After',folders:[root,extra,extra],revision:0 });
    assert.equal(saved.folders.length,2); assert.equal(saved.revision,1); assert.equal(saved.title,'After');
    await assert.rejects(op({ action:'save',workspaceId:'one',title:'Stale',folders:[],revision:0 }), /更新/);
    await assert.rejects(op({ action:'save',workspaceId:'one',title:'Bad',folders:['relative'],revision:1 }), /绝对路径/);
    await assert.rejects(op({ action:'open',workspaceId:'one',path:os.tmpdir() }), /只能打开/);
    assert.equal((await op({ action:'open',workspaceId:'one',path:saved.folders[1] })).opened,true);
    rejectRename = true;
    await assert.rejects(op({ action:'save',workspaceId:'one',title:'Fails',folders:[],revision:1 }), /rename failed/);
    assert.equal((await op({action:'list'})).workspaces[0].revision,1);
    await assert.rejects(op({action:'save',workspaceId:'missing'}), /不存在/);
  } finally { await rm(root, {recursive:true,force:true}); }
});
