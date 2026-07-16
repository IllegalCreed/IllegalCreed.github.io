---
layout: doc
---

# Grill Me

Grill Me 是 Matt Pocock「Skills For Real Engineers」里最受欢迎的技能之一：一个**用户触发**的技能，让 agent 在你动工之前**不留情面地盘问**你的计划或设计——沿决策树逐个分支走，一次一个问题、每问附上推荐答案，直到你和 agent 达成真正的共识才开始干。它治的是 AI 编码最常见的失败模式：**「agent 没做出我想要的」**（misalignment）。

## 评价

**优点**

- **对齐先于编码**：在写第一行代码前逼出「你到底要什么」，把返工消灭在动工前
- **一次一个问题**：不像一股脑抛十个问题让你懵，逐个决策推进、每问给推荐答案，认知负担低
- **事实自查、决策留人**：能从环境（文件系统、工具）查到的事实它自己查，只把**决策**抛给你
- **极简可组合**：正文只有一句「Run a `/grilling` session」——真正逻辑在可复用的 `grilling` 引擎里，小、易改、可 hack
- **共识门禁**：达成共识前它不动手（`Do not act until I confirm`）——避免它猜着往下做
- **任何模型可用**：不绑定特定模型，基于工程通识而非某家能力

**缺点**

- **需要你在场对话**：它靠一问一答推进，不是「甩需求就走」的异步流程，快节奏时略慢
- **对已明确的需求略显啰嗦**：需求本就清楚时，盘问会有点多余（此时可直接跳过）
- **只对齐，不建文档**：它只做访谈达成共识，不沉淀术语表/ADR——要文档产物用它的升级版 [Grill With Docs](../grill-with-docs/)
- **英文技能**：SKILL.md 为英文（但 agent 可用中文与你对话）

## 适用场景

- **每次要做一个改动之前**——Matt 的建议就是「每次都用」，尤其是需求略模糊、或改动有多种做法时
- 你脑子里有个想法但说不太清，想让 agent 帮你**把它问清楚**
- 非代码场景的方案对齐（写作、决策、规划）——Grill Me 定位在「productivity」，通用而非只针对代码
- 想在写计划/spec 之前先把决策树里的分支和依赖理顺

## 边界

- **不是自动触发**：`disable-model-invocation: true`，只能你手动 `/grill-me`，agent 不会自作主张启动
- **不写代码、不出方案文档**：它的产出是「共识」，不是实现，也不是 spec（要 spec 用 `/to-spec`，要文档用 grill-with-docs）
- **对齐工具，不是流程框架**：与 GSD/BMAD/Spec-Kit「接管整个流程」不同，它只做一件事——盘问对齐，小而可组合
- **决策仍是你的**：它逼问、给推荐，但每个决策的拍板权在你，不替你做主

## 官方文档

[Skills For Real Engineers · README](https://github.com/mattpocock/skills#readme) ｜ [grill-me/SKILL.md](https://github.com/mattpocock/skills/blob/main/skills/productivity/grill-me/SKILL.md) ｜ [grilling 引擎](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md)

## GitHub 地址

[mattpocock/skills](https://github.com/mattpocock/skills)（productivity/grill-me）

## 内容地图

- [入门](./getting-started) —— 装上、`/grill-me` 跑第一次盘问，理解「一问一答 + 共识门禁」
- [指南](./guide-line) —— grilling 引擎五条规则、user/model-invoked 之别、治的四大失败模式、反模式
- [参考](./reference) —— 完整规则、安装两法、相关技能（grill-with-docs / to-spec / implement）、与 Superpowers brainstorming 对比

## 幻灯片地址

<a href="/SlideStack/grill-me-slide/" target="_blank">Grill Me</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=587" target="_blank" rel="noopener noreferrer">Grill Me 测试题</a>
