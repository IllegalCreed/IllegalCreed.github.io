---
layout: doc
---

# Windsurf

原 Codeium 出品的 **AI 原生代码编辑器**，以 Cascade agent 的高自主性著称。

::: tip 品牌沿革
2026-06 起 Windsurf 被 Cognition AI 收购后更名 **Devin Desktop**，官方文档迁至 `docs.devin.ai/desktop`；功能与术语基本延续，下文仍以「Windsurf」称呼。
:::

## 评价

### 优点

- **Cascade** agent 高自主：读文件 → 定位所有调用点 → 改动 → 跑测试，仅在歧义处求确认
- **Tab** 自研模型：Supercomplete 可同时建议删除与新增、Tab to Jump / Tab to Import
- **实时感知**（real-time awareness）你在编辑器/终端的操作，自动纳入上下文
- VS Code fork，可导入 VS Code / Cursor 的设置与扩展（Open VSX）
- 2026 AI 编辑器第二梯队（Stack Overflow 约 5%、百万级用户）

### 缺点

- 品牌与政策变动频繁（Codeium → Windsurf → 2026-06 更名 Devin Desktop）
- 扩展走 **Open VSX**，依赖微软专有 API 的扩展不可用；Devin Desktop 进一步收紧扩展安装
- 闭源、按 credits / quota 计费，计费模式多次变动（flow actions → credits → quota）

## 文档地址

[Windsurf / Devin Desktop](https://docs.devin.ai/desktop/)

## GitHub地址

[Windsurf](https://github.com/Exafunction)（编辑器闭源，此为母公司 Exafunction/Codeium 的 GitHub）

## 幻灯片地址

<a href="/SlideStack/windsurf-slide/" target="_blank">Windsurf</a>
