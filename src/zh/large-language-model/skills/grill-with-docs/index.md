---
layout: doc
---

# Grill With Docs

Grill With Docs 是 [Grill Me](../grill-me/) 的**工程升级版**：同样在动工前不留情面地盘问你的设计，但**边盘问边为项目建共享语言**——就地更新 `CONTEXT.md`（术语表 / ubiquitous language）和 ADR（架构决策记录）。Matt Pocock 称它「可能是这个仓库里最酷的技术」。它治的是 AI 编码的第二个失败模式：**agent 太啰嗦**——因为没有共享语言，agent 只能用 20 个词说清本该 1 个词的事。

## 评价

**优点**

- **一箭双雕**：一次盘问既对齐了需求，又沉淀了项目术语表和关键决策——文档不是额外负担，是访谈的副产物
- **共享语言降冗长**：给「lesson 被 materialize」这类概念一个精确术语，agent 之后用 1 个词代替一长串解释，省 thinking token
- **命名一致 + 代码好导航**：变量/函数/文件都用共享语言命名，agent 在代码库里更好找路
- **就地更新、不批处理**：术语一确定就写进 CONTEXT.md，决策一定案就记 ADR，趁热打铁不遗漏
- **ADR 稀疏而精**：只在「难逆 + 无 context 会困惑 + 真实权衡」三条全真时才建 ADR，不堆无用记录
- **复用 grilling 引擎**：盘问纪律和 grill-me 完全一致，额外挂 `domain-modeling` 引擎建文档

**缺点**

- **需要维护文档**：CONTEXT.md 会随项目演进，需持续修订（虽然由 agent 就地维护）
- **对一次性小改动过重**：只改一行、不涉及新术语时，用 grill-me 更轻
- **价值随时间累积**：单次收益不如「session 复 session」明显——第一次建库时最花功夫
- **英文技能**：SKILL.md 为英文（agent 可用中文与你对话，CONTEXT.md 可中文书写）

## 适用场景

- **新项目起步**——趁早建立 ubiquitous language，让后续每个 session 都受益
- 项目里术语混乱（同一概念多个叫法）、想统一措辞
- 有「难逆 + 需背景 + 真权衡」的架构决策，想留下 ADR 供未来自己/团队理解
- 想让 agent 少啰嗦、命名更一致、更省 token——尤其长期维护的代码库

## 边界

- **不是纯文档生成器**：它先盘问对齐，文档是访谈过程的结晶，不是脱离对话凭空生成
- **CONTEXT.md 只是术语表**：纯术语表，禁放实现细节、spec、scratch pad——「it is a glossary and nothing else」
- **不写代码**：和 grill-me 一样只到「共识 + 文档」，实现交给 `/implement`
- **ADR 不是什么都记**：三条门槛全过才记，易逆/不惊讶/无权衡的决策不建

## 官方文档

[Skills For Real Engineers · README](https://github.com/mattpocock/skills#readme) ｜ [grill-with-docs/SKILL.md](https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md) ｜ [domain-modeling 引擎](https://github.com/mattpocock/skills/blob/main/skills/engineering/domain-modeling/SKILL.md)

## GitHub 地址

[mattpocock/skills](https://github.com/mattpocock/skills)（engineering/grill-with-docs）

## 内容地图

- [入门](./getting-started) —— 装上、`/grill-with-docs` 跑一次「盘问 + 建文档」，看 CONTEXT.md 长什么样
- [指南](./guide-line) —— domain-modeling 引擎五动作、CONTEXT.md 与 ADR 格式、治「冗长」的原理、与 grill-me 之别
- [参考](./reference) —— SKILL.md 原文、CONTEXT-FORMAT / ADR-FORMAT、单/多上下文、真实样例

## 幻灯片地址

<a href="/SlideStack/grill-with-docs-slide/" target="_blank">Grill With Docs</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Grill With Docs 测试题</a>

> 测试题链接待生产库分类导入、获得真实数字叶节点 ID 后回填。
