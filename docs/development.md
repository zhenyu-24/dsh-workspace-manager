# 开发、验证与发布

## 环境与目录

需要 Node.js **>=22.19.0**、npm 和 Git。CI 使用 Node.js 22，在 Ubuntu 与 Windows 上验证。安装依赖使用已提交的锁文件，不在 DSH profile 目录手工运行包管理器。

```text
src/
  host/
    index.js         # 宿主插件入口
    operations.js    # 工作区与会话业务操作
    catalog.js       # 工作区目录与列表数据
  client/
    index.js         # 侧栏界面入口
dist/
  host/
    index.js
    operations.js
    catalog.js
  client/
    index.js
```

编辑 `src` 中的源文件，不直接修改生成的 `dist`。构建产物路径与源码模块边界对应；包入口使用 `dist`，因此修改源码后必须重新构建。

## 本地检查

```bash
npm ci
npm run check
npm run pack:release
```

- `npm ci`：按锁文件安装依赖。
- `npm run check`：构建、运行 Node 测试、验证包内容与入口。
- `npm run pack:release`：生成可分发的 `artifacts/<name>-<version>.tgz`，其中 npm 会将 scoped 包名规范化为文件名。1.2.0 的文件名为 `zhenyu-24-dsh-workspace-manager-1.2.0.tgz`。

发布前应检查生成包，而不只检查源码。包不应含工作区记录、会话日志、密钥、DSH profile 配置或本机绝对路径等私人数据。项目不向 npm registry 发布；这里使用 npm 的打包工具，不执行 `npm publish`。

现有自动化测试覆盖源目录校验、版本冲突、保存回滚、批量操作去重/归属/部分失败、会话日志保留和系统目录打开的回调/错误处理。测试通过不等同于所有宿主版本或桌面行为已经端到端验证。

## DSH 内手工验证

在独立测试 profile 中通过 `plugin_manager` 安装构建后的仓库根目录，或解压后的 Release `package` 目录。不要同时启用 `@local/dsh-workspace-enhancer` 与本包；迁移步骤见[安装与升级](./installation.md)。

建议记录 DSH 版本、操作系统、安装来源、测试结果和错误信息，并逐项检查：

- 刷新现有 DSH 页面后侧栏是否显示，原工作区列表是否仍可用。
- 搜索、排序、展开、多选，以及工作区与会话重命名。
- 额外源文件夹保存及重新加载、主目录固定和版本冲突反馈。
- 批量归档、活动会话保护、移除工作区后磁盘文件及会话日志保留。
- 在系统文件管理器中打开已保存目录；同时核对返回状态与实际桌面表现。
- 中文和英文界面、错误与空状态。

目前没有已确认的 UI 截图。不要将待验证项目写成已通过，也不要使用示意图冒充真实截图。Windows / DSH 0.2.1-rc.3 有既有测试记录；macOS、Linux 和其他 DSH 版本的 UI 与系统集成仍需单独验证。

## CI

[CI 工作流](../.github/workflows/ci.yml) 在 push 和 pull request 上运行，只授予 `contents: read`，分别在 `ubuntu-latest`、`windows-latest` 使用 Node.js 22 执行：

```bash
npm ci
npm run check
npm run pack:release
```

打包结果作为 CI artifact 保留，方便检查。CI 不安装或启用 DSH 插件，也不证明 UI 已验证。

## GitHub Release

[Release 工作流](../.github/workflows/release.yml) 只在推送 `v*` 标签时触发，发布 job 使用 `contents: write`。准备发布时：

1. 同步包版本、锁文件、更新日志和相关文档；例如包版本 `1.2.0` 对应标签 `v1.2.0`。
2. 先在本地完成上述检查与打包，检查差异和包内容。
3. 经维护者确认后再提交并推送版本标签；本说明本身不代表授权上传。
4. 工作流重新执行 `npm ci`、`npm run check`、`npm run pack:release`，验证标签与包版本一致，再创建 GitHub Release，并以 `CHANGELOG.md` 作为发布说明。

核心发布命令是：

```bash
gh release create "$TAG" artifacts/*.tgz --verify-tag --notes-file CHANGELOG.md
```

工作流不使用 `--clobber`，也不自动更新已有 Release。若同一标签已有 Release，发布会失败而不是覆盖公开资产；检查现有内容后由维护者决定后续动作。`--verify-tag` 确保标签已存在于远端，不能替代版本一致性检查。发布资产为 `.tgz`，不是 npm registry 包。
