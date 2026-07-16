---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 mattpocock/skills 主分支（提交 `e9fcdf9`，2026-07-14）的 `grill-with-docs`、`domain-modeling` 编写。

## 速查

- **装**：`npx skills@latest add mattpocock/skills`（选 grill-with-docs）或插件 `/plugin install mattpocock-skills@mattpocock`
- **用**：`/grill-with-docs`，然后说出你要做的事
- **本质**：`Run a /grilling session, using the /domain-modeling skill.`——grill-me 的盘问 + domain-modeling 建文档
- **两份产物**：`CONTEXT.md`（术语表，纯 glossary）+ `docs/adr/NNNN-slug.md`（架构决策记录）
- **CONTEXT.md 规则**：只含项目专有术语、每词 1-2 句、`_Avoid_` 列同义词、禁放实现细节
- **ADR 门槛**：难逆 + 无 context 会困惑 + 真实权衡，三条全真才建
- **就地更新**：术语一确定就写、决策一定案就记，不批处理

## 装上 Grill With Docs

```bash
# skills.sh（拷贝、可编辑）
npx skills@latest add mattpocock/skills
# 选 grill-with-docs

# 或 Claude Code 插件（托管、只读、自更新）
/plugin marketplace add mattpocock/skills
/plugin install mattpocock-skills@mattpocock
```

装后 `/setup-matt-pocock-skills` 配一次本仓库（issue tracker、triage 标签、文档位置）。

## 第一次「盘问 + 建文档」

```
> /grill-with-docs
> 我想给课程系统加「章节内课时正式化」的功能
```

它会像 grill-me 一样盘问你，但**额外做四件事**：

1. **挑战术语**——你用的词和 CONTEXT.md 里已有的冲突时，当场指出
2. **锐化模糊语**——「你说 account，指 Customer 还是 User？这是两个东西」
3. **编造边界场景**——用具体场景逼你把概念边界说清
4. **与代码交叉核对**——「你说支持部分取消，但代码里整单取消，哪个对？」

术语一确定，它就**就地**写进 `CONTEXT.md`；遇到值得记的架构决策，就记一条 ADR。

## CONTEXT.md 长什么样

一份真实的术语表（来自 Matt 自己的仓库）：

```markdown
# Matt Pocock Skills

技能集，由 Claude Code 加载。

## Language

**Issue tracker**:
托管仓库 issue 的工具——GitHub Issues、Linear、本地 .scratch/ 约定等。
_Avoid_: backlog manager, backlog backend, issue host

**Issue**:
Issue tracker 里一个被追踪的工作单元——bug、任务、spec。
_Avoid_: ticket（仅在引用外部系统时用）
```

它的威力：把「一个 lesson 被放进文件系统而变得 real」浓缩成「materialization cascade」——**一次省词，session 复 session 地省**。

## 为什么共享语言能降冗长

> 「有了 ubiquitous language，开发者之间的对话和代码的表达，都源自同一个领域模型。」——《领域驱动设计》Eric Evans

agent 被丢进项目、自己猜术语时，会**用 20 个词说清本该 1 个词的事**。一份共享语言文档帮它解码项目黑话：

- **BEFORE**：「有个问题——当课程某章节里的一个课时被变得 real（即在文件系统里有了位置）时……」
- **AFTER**：「materialization cascade 有个问题」

::: tip 这是 Matt 眼中「最酷的技术」
他说：「很难形容这有多强大。它可能是这个仓库里最酷的一招。试试就知道。」共享语言的额外好处：变量/函数/文件命名一致、代码库更好导航、agent 花更少 token 思考。
:::

## 下一步

- [指南](./guide-line) —— domain-modeling 五动作、CONTEXT.md/ADR 格式规则、单/多上下文、与 grill-me 对比
- [参考](./reference) —— SKILL.md 原文、CONTEXT-FORMAT、ADR-FORMAT、ADR 三门槛详解
