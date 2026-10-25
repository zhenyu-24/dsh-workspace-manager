# 安装与升级

本插件以 GitHub Release 的 `.tgz` 文件分发，**不发布到 npm registry**。不要假定 `npm install @zhenyu-24/dsh-workspace-manager` 可用。

## 前提与验证边界

- 已安装支持 bundle 插件和 `plugin_manager` 的 DeepSeek Harness (DSH)。
- 已有 Windows / DSH 0.2.1-rc.3 环境测试记录；其他 DSH 版本以及 macOS、Linux 尚未端到端验证。
- 目前没有已确认的 UI 截图。自动化测试和跨平台 CI 不代表界面、系统文件管理器窗口或全部宿主版本已经验证。
- 安装和升级会修改当前 DSH profile，可能引发插件重载；先备份重要数据，并等待活动任务结束。

## 从 Release 安装（推荐）

1. 打开 [GitHub Releases](https://github.com/zhenyu-24/dsh-workspace-manager/releases)，选择版本，例如 `v1.2.0`，下载对应的 `.tgz` 资产，而不是 GitHub 自动生成的源码压缩包。
2. 将 `.tgz` 解压至独立目录。它是 gzip 压缩的 tar 包；使用支持该格式的解压工具，必要时先解出 `.tar` 再解包。找到包含 `package.json` 的 `package` 目录。
3. 在 DSH 对话中请求通过插件管理器安装该目录：

   ```text
   请先用 plugin_manager 列出已安装 bundle，检查是否有旧开发版；
   再通过 plugin_manager install_bundle 安装以下 bundle 目录：
   <解压后的 package 目录绝对路径>
   ```

4. 按管理器返回结果操作。只有返回 `application: applied` 才表示已应用；若返回 `nextStep`，执行其指引，不要把“已安装”当成“已生效”。
5. 刷新现有 DSH 页面，在左侧打开“工作区管理”。不要为了加载插件启动另一个 Web 服务。

Release 包内已含 `dist/host/index.js`、`dist/host/operations.js`、`dist/host/catalog.js` 和 `dist/client/index.js`，用户无需为安装包重新构建。不要手动修改 DSH profile 配置，也不要在 profile 目录运行 npm 命令。

## 从源码安装

需要 Node.js **22.19 或更新版本**及 npm。使用仓库锁文件安装依赖：

```bash
git clone https://github.com/zhenyu-24/dsh-workspace-manager.git
cd dsh-workspace-manager
npm ci
npm run check
```

`npm run check` 会先构建，再运行 Node 测试与包校验。成功后，在 DSH 中通过 `plugin_manager install_bundle` 安装**仓库根目录的绝对路径**，而不是 `src` 或 `dist` 子目录。源文件虽是普通 JavaScript，运行入口仍需要由构建生成。

有关打包和发布，参见[开发与验证](./development.md)。

## 从旧本地开发版迁移

旧包是 `@local/dsh-workspace-enhancer`（本地开发版 1.1.5）；本包是 `@zhenyu-24/dsh-workspace-manager`。插件行 ID 与持久化域保持兼容，但这不是同一个包名，**不会因为发布新版本而自动升级旧包**。

1. 备份重要数据，停止活动任务。
2. 通过 `plugin_manager` 列出已安装 bundle，确认旧包的准确标识。
3. 通过插件管理器移除旧开发包；不要删除其持久化数据。
4. 安装本包，按安装结果指引完成应用并刷新页面。
5. 检查已有工作区和额外源文件夹配置。

**不要同时启用旧包和本包**：它们使用相同工具名、服务名和 HTTP 路由，可能发生冲突。额外源文件夹保存在 DSH 的 `local_workspace_enhancer` storage domain；不要为了迁移清空该域。

## 升级与排错

- 安装新 Release 前核对版本和来源，保留上一版本安装包以便回退。
- 看不到侧栏时先确认安装已应用、未同时启用旧包，再刷新原页面并检查 DSH 返回的错误。
- 遇到版本要求不符时，不要跳过兼容检查；先核对 DSH、Node.js 与包版本。
- 系统目录打开结果中的 `requested: true` 仅表示系统调用已交接，不保证用户已经看见文件管理器窗口。
- 移除工作区只移除注册，不删除磁盘文件或会话日志；额外源文件夹不授予文件访问权限，也不改变主工作目录。
