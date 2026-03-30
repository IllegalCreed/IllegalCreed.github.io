---
layout: doc
---

# Husky

超快的现代原生 `git` 钩子，在提交或推送时自动检查提交消息、代码并运行测试。

## 评价

**优点**

- 超轻量，仅 2 kB（gzip），零依赖，执行速度约 1ms
- 利用 Git 原生 `core.hooksPath` 特性，无需侵入 `.git/hooks`
- 跨平台支持（macOS / Linux / Windows），兼容 Git GUI 工具
- 配置极简，`init` 一条命令即可完成全部设置

**缺点**

- Windows 上偶发权限和文件编码问题（脚本必须 UTF-8）
- `init` 命令会直接覆盖 `prepare` 脚本，而非合并或交给用户选择
- Yarn 不支持 `prepare`，需要额外改用 `postinstall`

## 文档地址

[Husky](https://typicode.github.io/husky/)

## GitHub地址

[Husky](https://github.com/typicode/husky/)

## 幻灯片地址

<a href="/SlideStack/husky-slide/" target="_blank">Husky</a>