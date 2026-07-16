---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 mattpocock/skills 主分支（提交 `e9fcdf9`，2026-07-14）的 `grill-me` 与 `grilling` 技能编写。

## 速查

- **装（可编辑）**：`npx skills@latest add mattpocock/skills`，勾选 `grill-me`
- **装（托管插件）**：`/plugin marketplace add mattpocock/skills` + `/plugin install mattpocock-skills@mattpocock`
- **用**：在 agent 里输入 `/grill-me`，然后说出你要做的事
- **本质**：`grill-me` 是薄封装，正文只有「Run a `/grilling` session」——真正逻辑在 `grilling` 引擎
- **五条规则**：不留情面盘问 → 沿决策树逐分支 → 一次一个问题、每问给推荐答案 → 事实自查、决策问你 → 共识前不动手
- **仅手动触发**：`disable-model-invocation: true`，agent 不会自动启动
- **何时用**：每次做改动之前，尤其需求略模糊 / 改动有多种做法时

## 装上 Grill Me

两种安装哲学，任选：

```bash
# ① skills.sh 安装器——把技能拷进你的项目，可 hack 改成自己的
npx skills@latest add mattpocock/skills
# 勾选 grill-me（及你想要的其它技能）

# ② Claude Code 插件——托管、只读、随作者更新
/plugin marketplace add mattpocock/skills
/plugin install mattpocock-skills@mattpocock
```

> 拷贝版（`npx skills`）适合想改造它的人；插件版适合「只想让它开箱即用、跟着更新」的人。

## 第一次盘问

```
> /grill-me
> 我想给 quiz 应用加一个「答题历史导出」功能
```

接下来 agent 会：

1. **不留情面地盘问**——沿决策树逐个分支走
2. **一次只问一个问题**，并给出它的**推荐答案**
3. **能查的自己查**（比如翻代码确认现状），只把**决策**抛给你
4. **达成共识前不动手**——不会盘问到一半就开始写代码

一次典型的问答节奏：

```
Agent: 导出范围是「当前用户自己」还是「全体」？
       （推荐：先做当前用户，最小可用）
You:   当前用户
Agent: 导出格式 CSV 还是 JSON？（推荐：CSV，Excel 友好）
You:   CSV
Agent: 大数据量时是否要流式，避免内存爆？（推荐：是，>1万行时流式）
...
```

::: tip 一次一个问题是刻意的
grilling 引擎明确写着「一次问多个问题令人困惑」（Asking multiple questions at once is bewildering）。逐个决策推进，让你能专注想清楚每一个分支。
:::

## 为什么要「被盘问」

> 「没有人确切知道自己想要什么。」——《程序员修炼之道》

AI 时代最常见的失败：你以为 agent 懂你要什么，等它做完才发现完全跑偏。你和 agent 之间有一道**沟通鸿沟**。Grill Me 的修法就是——让 agent 反过来盘问你，在动工前把这道鸿沟填平。

Matt Pocock 说这是他**最受欢迎**的技能，建议**每次要做改动时都用**。

## 什么时候可以跳过

需求本就在过去对话里说清楚了，可以不用 grill-me 直接做。它治的是「不确定 / 说不清」的场景；已经明确的事再盘问就是多余。

## 下一步

- [指南](./guide-line) —— grilling 引擎五条规则拆解、user/model-invoked、治的四大失败模式、与 brainstorming 对比
- [参考](./reference) —— 完整规则原文、相关技能链、Grill With Docs 升级路径
