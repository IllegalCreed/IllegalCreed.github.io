---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 open-gsd/gsd-core v1.7.0（提交 `1bb7240`，2026-07-16）的 README 与 docs 编写。

## 速查

- **装**：`npx @opengsd/gsd-core@latest`（向导选运行时 + 全局/本地）
- **⚠️ 禁直接拷** `agents/`、`commands/` 文件——跨运行时兼容必须走 installer
- **起项目**：`/gsd-new-project`（绿地）、`/gsd-onboard`（已有代码库）
- **五步阶段循环**：Discuss → Plan → Execute → Verify → Ship（每 milestone 逐 phase）
- **治的病**：context rot——上下文填满致质量退化
- **手段**：重活跑 fresh-context 子代理（executor 各起干净 200k），主会话保持精简
- **跨会话记忆**：STATE.md / CONTEXT.md 存活于会话边界
- **多运行时**：Claude Code / OpenCode / Antigravity / Kimi / Kilo / Codex / Copilot / Cursor / Windsurf

## 安装

一条命令，向导会问你的运行时和全局/本地：

```bash
npx @opengsd/gsd-core@latest
```

::: warning 必须用 installer，别手拷文件
installer 是跨运行时兼容所必需的——**不要直接从 `agents/` 或 `commands/` 拷文件**。不同运行时的适配由 installer 生成，手拷会坏。没 Node.js 或用别的运行时？见官方「Install on your runtime」。
:::

装完起步：

```bash
/gsd-new-project   # 绿地新项目
/gsd-onboard       # 给已有代码库上手
```

## 五步阶段循环

每个里程碑重复同一个五步循环，**一次只走一个 phase**：

| 步 | 名 | 做什么 |
| --- | --- | --- |
| 1 | **Discuss** | 在任何东西被规划前，捕获实现决策 |
| 2 | **Plan** | 研究、分解，并验证计划**装得下一个全新上下文窗口** |
| 3 | **Execute** | 并行波次跑计划；每个 executor 从干净的 200k token 上下文起步 |
| 4 | **Verify** | 走查已建的东西；宣布完成前诊断并修复 |
| 5 | **Ship** | 建 PR、归档该 phase、进入下一个 |

> 关键设计：Plan 步会验证计划**装得下一个 fresh context**——如果装不下，就得再拆。这保证 Execute 的每个子代理都在干净、充裕的上下文里干活。

## 它治的病：context rot

> 多数 AI 编码配置在规模上失败，因为：上下文膨胀悄悄拉低输出质量、会话之间没有共享记忆、没有东西验证代码真的能跑。

GSD Core 三管齐下解决：

- **重活跑 fresh 子代理**——研究、规划、执行都在全新上下文里，主会话不被塞爆
- **结构化工件跨会话存活**——`STATE.md`、`CONTEXT.md` 挺过会话边界，接续不丢
- **Verify 步走查已建的东西**——诊断并生成修复计划，才宣布 phase 完成

一句话：**Claude Code is powerful. GSD Core makes it reliable.**

## 治理沿革（选型须知）

「GSD」（Get Shit Done）原版由 TÂCHES（Lex Christopherson）创建。因项目所有权/信任方面的争议，GSD 现由 **open-gsd** 社区治理继续开发，原作者不再参与。本页所讲的 **GSD Core** 指的就是 open-gsd 这一支（npm `@opengsd/gsd-core`）。选型时留意别与原版或其它分叉混淆——这也是「唯一正确官方源」核验的一部分。

## 下一步

- [指南](./guide-line) —— context rot 原理、五步循环深入、STATE/CONTEXT 工件、为何禁手拷
- [参考](./reference) —— 命令、34 个子代理、跨运行时安装、配置
