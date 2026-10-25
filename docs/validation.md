# 1.2.0 本地验收记录

日期：2026-10-25。环境：Windows，DSH 0.2.1-rc.3。

## 已完成

- 干净依赖安装后执行 npm run check：构建、5 项 Node 测试及导出校验通过。
- npm run pack:release：校验实际 tarball 的必需文件及禁止目录，生成 SHA256SUMS.txt。
- 将真实 .tgz 解压到独立目录，通过 DSH plugin_manager 安装该目录，而不是源码目录。
- 安装结果 application=applied、warnings=[]。包管理器提示本地链接 peerDependencies 风险，但本机 Host 激活与业务调用正常；其他机器仍需由插件管理器正确解析 zod ^4。
- 移除旧 @local/dsh-workspace-enhancer 注册，不删除持久化数据，安装 @zhenyu-24/dsh-workspace-manager 1.2.0。
- 活跃 Host Config 目录确认新包及原插件行 ID。
- 真实 workspace_manager list 成功返回现有工作区、会话和源目录版本，旧存储可读。
- 真实 workspace_manager open 返回 requested=true，确认系统调用交接。
- Client Slot 检查确认 sidebar.panellist 中 workspace-enhancer 入口 active。

## 尚未验证

- 未取得可控制的已登录 GUI，未记录真实截图；Slot 活跃不能证明屏幕渲染、明暗主题或点击交互完全正确。
- Explorer 交接成功不等于已目视确认窗口出现。
- 没有在真实用户数据上执行归档、删除或重命名等破坏/修改性验收，相关路径由自动测试覆盖。
- macOS/Linux 的完整 DSH 安装与桌面交互未验证。跨平台 CI 只能验证脚本和测试，不等于宿主兼容认证。

## 发布门槛

本地检查通过后才推送；GitHub CI 的 Ubuntu/Windows 检查通过后再创建版本标签，由 Release workflow 构建与上传。工作流失败时不把本地结果当作远端通过。
