import path from 'node:path';
import { realpath, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export async function canonicalFolders(primary, folders) {
  if (!Array.isArray(folders) || folders.length > 32) throw new Error('最多添加 32 个源文件夹');
  const result = [await realpath(primary)];
  for (const input of folders) {
    if (typeof input !== 'string' || !path.isAbsolute(input) || input.includes('\0')) throw new Error('源文件夹必须是绝对路径');
    const folder = await realpath(input);
    if (!(await stat(folder)).isDirectory()) throw new Error(`不是文件夹：${input}`);
    if (!result.some(p => process.platform === 'win32' ? p.toLowerCase() === folder.toLowerCase() : p === folder)) result.push(folder);
  }
  return result;
}

export function openFolder(folder, { platform = process.platform, run = execFile } = {}) {
  const command = platform === 'win32' ? path.win32.join(process.env.SystemRoot || 'C:\\Windows', 'explorer.exe') : platform === 'darwin' ? 'open' : 'xdg-open';
  // Explorer has its own comma/equal parsing; a file URI preserves the target.
  const target = platform === 'win32' ? pathToFileURL(folder, { windows: true }).href.replace(/(?:%[89A-F][0-9A-F])+/gi, escaped => decodeURIComponent(escaped)).replaceAll(',', '%2C').replaceAll('=', '%3D') : folder;
  return new Promise((resolve, reject) => {
    run(command, [target], { shell: false, windowsHide: false, timeout: 15000, encoding: 'utf8' }, (error, stdout, stderr) => {
      // Exit 1 is Explorer's normal handoff to the existing desktop process.
      if (error && !(platform === 'win32' && error.code === 1 && !error.killed)) {
        reject(new Error(`无法打开资源管理器：${stderr || error.message}`));
        return;
      }
      resolve({ requested: true, path: folder });
    });
  });
}

export function createOperations(registry, table, opener = openFolder, services = {}) {
  let queue = Promise.resolve();
  const view = (w, catalog) => {
    const sessions = [...w.sessionIds].map(id => catalog?.get(id)).filter(Boolean);
    return { workspaceId: w.id, title: w.title, path: w.path, createdAt: w.createdAt, updatedAt: w.updatedAt, sessionCount: catalog ? sessions.filter(s => !s.archived).length : w.sessionIds.length, folders: table.get(w.id)?.folders ?? [w.path], revision: table.get(w.id)?.revision ?? 0, ...(catalog ? { sessions } : {}) };
  };
  return async function execute(input) {
    if (!input || typeof input !== 'object') throw new Error('请求无效');
    if (input.action === 'list') {
      const catalog = services.catalog ? await services.catalog() : undefined;
      return { workspaces: registry.list().map(w => view(w, catalog)) };
    }
    if (['archive', 'unarchive', 'delete'].includes(input.action)) {
      if (!Array.isArray(input.targets) || !input.targets.length || input.targets.length > 500) throw new Error('请选择 1–500 个项目');
      const targets = [];
      const results = [];
      const seen = new Set();
      for (const target of input.targets) {
        const workspace = target && registry.get(target.workspaceId);
        if (!workspace) { results.push({ target, ok: false, error: '工作区不存在' }); continue; }
        if (input.action === 'delete') {
          if (target.sessionId) { results.push({ target, ok: false, error: '当前 DSH 不支持删除会话，请使用归档' }); continue; }
          if (!seen.has(workspace.id)) { seen.add(workspace.id); targets.push({ workspaceId: workspace.id }); }
        } else {
          const ids = target.sessionId ? [target.sessionId] : [...workspace.sessionIds];
          for (const sessionId of ids) {
            if (!workspace.sessionIds.includes(sessionId)) { results.push({ target, ok: false, error: '会话不属于此工作区' }); continue; }
            if (!seen.has(sessionId)) { seen.add(sessionId); targets.push({ workspaceId: workspace.id, sessionId }); }
          }
        }
      }
      for (const target of targets) {
        try {
          if (input.action === 'delete') { await registry.delete(target.workspaceId); await table.delete(target.workspaceId); }
          else if (input.action === 'archive') await registry.archiveSession(target.sessionId);
          else await registry.unarchiveSession(target.sessionId);
          results.push({ target, ok: true });
        } catch (error) { results.push({ target, ok: false, error: error.message }); }
      }
      return { results };
    }
    const w = registry.get(input.workspaceId);
    if (!w) throw new Error('工作区不存在，请刷新列表');
    if (input.action === 'rename') {
      if (typeof input.title !== 'string' || !input.title.trim() || input.title.trim().length > 120) throw new Error('名称须为 1–120 个字符');
      if (input.sessionId) {
        if (!w.sessionIds.includes(input.sessionId)) throw new Error('会话不属于此工作区');
        if (!services.renameSession) throw new Error('会话重命名不可用');
        return services.renameSession(input.sessionId, input.title.trim());
      }
      await w.setTitle(input.title.trim());
      return view(w);
    }
    if (input.action === 'open') {
      const allowed = view(w).folders;
      const target = input.path ?? w.path;
      if (!allowed.includes(target)) throw new Error('只能打开此工作区已保存的源文件夹');
      if (!(await stat(target)).isDirectory()) throw new Error('文件夹已不存在');
      return opener(await realpath(target));
    }
    if (input.action !== 'save') throw new Error('未知操作');
    const run = queue.then(async () => {
      const current = view(w);
      if (input.revision !== current.revision) throw new Error('工作区已被其它页面更新，请关闭后重新编辑');
      if (typeof input.title !== 'string' || !input.title.trim() || input.title.trim().length > 120) throw new Error('名称须为 1–120 个字符');
      const folders = await canonicalFolders(w.path, input.folders);
      // Persist metadata first; roll back if the host refuses the rename.
      const previous = table.get(w.id);
      await table.put(w.id, { folders, revision: current.revision + 1 });
      try { await w.setTitle(input.title.trim()); }
      catch (error) { if (previous) await table.put(w.id, previous); else await table.delete(w.id); throw error; }
      return view(w);
    });
    queue = run.catch(() => {});
    return run;
  };
}
