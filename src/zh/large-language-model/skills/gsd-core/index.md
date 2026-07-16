---
layout: doc
---

# GSD Core

GSD Core（**Git. Ship. Done.**）是一套轻量的**上下文工程 + 规范驱动开发**框架，由社区 open-gsd 治理维护。它专治 **context rot**——AI 上下文窗口被填满后逐渐累积的质量退化：把所有重活（研究、规划、执行）都丢进**全新上下文的子代理**里跑，让你的主会话始终保持精简。每个里程碑重复同一个五步循环：**Discuss → Plan → Execute → Verify → Ship**，一次只走一个 phase。

## 评价

**优点**

- **正面打 context rot**：重活跑 fresh-context 子代理，每个 executor 从干净的 200k token 上下文起步，主会话不被塞爆
- **规范驱动**：每个 phase 先讨论决策、再研究分解、再执行、再验证——不是 vibe coding
- **跨会话记忆**：结构化工件 `STATE.md` / `CONTEXT.md` 跨会话边界存活，接续不丢
- **验证内建**：Verify 步走查已建的东西、诊断并生成修复计划，才宣布 phase 完成——不是「应该没问题」
- **一条命令装**：`npx @opengsd/gsd-core@latest`，向导选运行时 + 全局/本地
- **多运行时**：Claude Code / OpenCode / Antigravity / Kimi / Kilo / Codex / Copilot / Cursor / Windsurf 等
- **34 个 gsd-* 子代理**分工研究、规划、执行、验证

**缺点**

- **必须用 installer**：为跨运行时兼容，**禁止直接拷贝 `agents/`、`commands/` 文件**，否则会坏
- **概念与仪式多**：phase 循环、子代理编排、STATE/CONTEXT 工件，上手有学习曲线
- **重量级**：对一次性小改动偏重，适合有规模的项目
- **治理沿革需了解**：原版 GSD（Get Shit Done）由 TÂCHES 创建，因所有权争议后转为 open-gsd 社区治理续作，选型时留意「GSD Core」指的是 open-gsd 这一支

## 适用场景

- 会话一长质量就下滑（context rot），想把重活隔离进 fresh-context 子代理
- 想要规范驱动、逐 phase 推进、每步验证的可靠工作流，而非放飞的 vibe coding
- 绿地新项目（`/gsd-new-project`）或给已有代码库上手（`/gsd-onboard`）
- 想要跨会话记忆（STATE.md/CONTEXT.md），中断后能接续

## 边界

- **不是「一次性写完」的魔法**：它靠逐 phase + 子代理隔离 + 验证提高可靠性，需要走流程
- **禁止绕过 installer 手拷文件**：跨运行时适配靠 installer 生成，手拷会坏
- **与 gstack/Compound 同为流程系统、侧重不同**：GSD Core 主打 context 工程 + fresh-context 隔离；选型看你最痛的是什么
- **GSD Core = open-gsd 这一支**：避免与原版 GSD 或其它分叉混淆

## 官方文档

[GSD Core 文档站](https://github.com/open-gsd/gsd-core/blob/main/docs/README.md) ｜ [Context engineering](https://github.com/open-gsd/gsd-core/blob/main/docs/explanation/context-engineering.md) ｜ [The phase loop](https://github.com/open-gsd/gsd-core/blob/main/docs/explanation/the-phase-loop.md) ｜ [中文 README](https://github.com/open-gsd/gsd-core/blob/main/README.zh-CN.md)

## GitHub 地址

[open-gsd/gsd-core](https://github.com/open-gsd/gsd-core)（npm `@opengsd/gsd-core`，v1.7.0，MIT）

## 内容地图

- [入门](./getting-started) —— `npx` 安装、`/gsd-new-project`·`/gsd-onboard`、理解 5 步阶段循环
- [指南](./guide-line) —— context rot 与 fresh-context、五步循环拆解、STATE/CONTEXT 工件、为何禁手拷
- [参考](./reference) —— 阶段命令、34 个子代理、跨运行时安装、配置与工件

## 幻灯片地址

<a href="/SlideStack/gsd-core-slide/" target="_blank">GSD Core</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=591" target="_blank" rel="noopener noreferrer">GSD Core 测试题</a>
