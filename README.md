# DSH 工作区管理 · Workspace Manager

[![CI](https://github.com/zhenyu-24/dsh-workspace-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/zhenyu-24/dsh-workspace-manager/actions/workflows/ci.yml) [![Release](https://img.shields.io/github/v/release/zhenyu-24/dsh-workspace-manager)](https://github.com/zhenyu-24/dsh-workspace-manager/releases) [![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

> 工作区与会话集中管理，额外源目录清晰可控。安装包包含可运行的 dist，无需用户自行构建。

[安装与迁移](./docs/installation.md) · [开发指南](./docs/development.md) · [验收记录](./docs/validation.md) · [更新记录](./CHANGELOG.md)

## 工程结构

```text
src/host/          宿主入口、业务操作、会话目录
src/client/        原生 JavaScript / React 界面
tests/             业务与集成测试
scripts/           构建、导出校验和打包检查
docs/              安装、开发及本地验收记录
.github/workflows/ 跨平台检查和标签发行
dist/              本地生成；随安装包分发，不提交源码仓库
```

截图尚未收录：仅接受实际运行界面截图，不使用模拟界面冒充验证。

DeepSeek Harness (DSH) 的独立侧栏插件，管理工作区、会话和额外源文件夹，不替换原工作区列表。

## 功能

- 工作区 → 会话树形列表，支持多选和展开。
- 按名称和路径搜索，点击表头按名称、路径、未归档会话数及时间排序。
- 工作区重命名、编辑源文件夹、在系统文件管理器打开目录。
- 会话打开、重命名、归档；批量归档及移除工作区。
- 主目录固定，使用“添加文件夹”选择额外源目录。
- 失败反馈、保存版本冲突检测，以及活动会话归档保护。
- UI 与 Agent 工具 `workspace_manager` 复用相同业务逻辑。
- 原创 SVG 图标及中英文界面元信息。

## 安装

前提：已安装支持 bundle 插件的 DSH，并可使用插件管理器。已在 **Windows / DSH 0.2.1-rc.3** 环境测试；其他版本、macOS 和 Linux 尚未端到端验证。目录打开代码为其他系统提供 `open` / `xdg-open` 分支，但不代表已实测。

### 方法一：Release 安装包

1. 从 [Releases](https://github.com/zhenyu-24/dsh-workspace-manager/releases) 下载 `.tgz`。
2. 解压，找到包含 `package.json` 的 `package` 目录。
3. 在 DSH 对话中请求安装该目录作为 bundle，例如：

```text
请通过 plugin_manager install_bundle 安装此插件目录：
<解压后的 package 目录绝对路径>
```

4. 确认安装返回 `application: applied`。刷新原 DSH 页面，打开左侧“工作区管理”。

### 方法二：源码安装

```bash
git clone https://github.com/zhenyu-24/dsh-workspace-manager.git
cd dsh-workspace-manager
npm ci
npm run check
```

再通过 DSH 的 `plugin_manager install_bundle` 安装此仓库的绝对路径。不要手工编辑 profile 的配置文件。源码采用普通 JavaScript；`npm run check` 会将源码复制到 dist 并校验，不需要额外打包器。

本仓库尚未发布到 npm，不能假定 `npm install @zhenyu-24/dsh-workspace-manager` 可用。

## 从本地开发版迁移

本项目来自本地包 `@local/dsh-workspace-enhancer` 1.1.5。发布包名为 `@zhenyu-24/dsh-workspace-manager`，保留插件行 ID 和持久化域以便延续配置。

**不要同时启用旧包和本包**：工具名、服务名及 HTTP 路由相同，可能冲突。先通过 DSH 插件管理器移除旧开发包，再安装本包；不要删除持久化数据。升级前备份重要数据，并避免在活动任务进行时重载。当前正在使用的本地开发插件不会因本仓库发布而自动升级。

## 数据与安全边界

- 移除工作区只移除注册，不删除磁盘文件或会话日志。
- 不提供永久删除会话；归档由 DSH 原生业务执行，运行中的会话可能拒绝归档。
- UI 不提供恢复归档按钮；工具保留 `unarchive` 能力，使用时遵守 DSH 约束。
- 未归档计数排除子代理会话，包含未命名的普通会话；可能受 DSH 当前目录索引影响。
- 源文件夹保存在 DSH `storageDomain` 的 `local_workspace_enhancer` 域，而不是浏览器 localStorage。
- 额外文件夹是提供给 AI 的参考上下文，**不授予额外文件访问权限，不改变主工作目录**。
- 只能打开已保存的工作区目录。Windows 使用无 shell 的可见 Explorer 调用；返回 `requested: true` 表示系统调用交接，不保证桌面窗口已被用户看到。
- 本发布包不包含作者的工作区记录、聊天日志、密钥或 DSH profile 配置。

## 开发与验证

Node.js >=22.19，依赖 `zod` ^4。建议在独立仓库中安装依赖，不在 DSH profile 中手工运行包管理器。

```bash
npm ci
npm run check
npm run pack:release
```

测试覆盖源目录校验、版本冲突、保存回滚、批量去重/归属/部分失败、会话日志保留及 Explorer 回调/错误处理。测试通过不等同所有宿主版本或桌面可见性端到端验证通过。

## License

[MIT](./LICENSE) © 2026 zhenyu-24。图标为本项目原创 SVG；第三方依赖遵循各自许可证。
