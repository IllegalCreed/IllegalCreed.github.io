---
layout: doc
outline: [2, 3]
---

# 入门

> 方法论叶，以 PaperBench 基准 + DeepCode / AutoReproduce / paper-replicate-agent 生态为代表（无单一官方仓）。下文以这些开源项目与基准的公开介绍为准。

## 速查

- **定位**：方法论/主题叶——用 AI agent 自动复现 AI/ML 论文的实验与代码；无单一官方仓
- **代表生态**：PaperBench（OpenAI 基准，Claude 第一）· DeepCode（港大，84.8%）· AutoReproduce（Paper Lineage）· PaperCoder（51.1%）· paper-replicate-agent（Claude Code 指令模板）
- **PaperBench**：要求 agent 完成论文理解 → 代码库开发 → 实验执行 → 调试全流程；人类专家需数天
- **DeepCode vs Claude**：84.8% vs 58.7%，DeepCode 领先约 26 个百分点
- **复现工作流六步**：理解 → 环境 → 代码 → 执行 → 对齐 → 报告
- **典型使用**：选论文 + 数据 → 让 agent 走六步 → 输出可重复代码 + 差异报告
- **难点**：数据可得性、随机种子、未公开超参、算力、模糊描述

## 这个「Skills」是什么

**不是某个具体的官方仓库，是一类方法论技能**——给 AI 编码 agent 一套「把论文复现出来」的工作流与指令。落地形式有三类：

1. **基准（衡量能力）**：PaperBench——OpenAI 提出的论文复现基准，要求 agent 完成论文理解 → 代码库开发 → 实验执行 → 调试全流程，输出可对标的复现质量分
2. **agent 框架（直接跑）**：DeepCode、AutoReproduce、PaperCoder——开箱即用的多 agent 系统，输入论文输出代码与实验脚本
3. **指令模板（装进现有 agent）**：paper-replicate-agent——给 Claude Code 一段明确指令，把它变成「研究承包商」

「方法论叶」的含义：核心是**复现工作流本身**（理解/环境/代码/执行/对齐/报告），工具任选其一即可落地。

## PaperBench：权威基准

PaperBench 由 OpenAI 提出，用于评估 agent 的 ML 论文复现能力。它要求 agent：

- **完整复现**一篇 ICML/NeurIPS/ICLR 级别论文（不是答选择题）
- 走完**论文理解 → 代码库开发 → 实验执行 → 调试**全流程
- 输出与原论文指标对齐的实验结果

关键事实：

- **人类专家完成一篇也要数天**——基准难度真实
- **Claude 在该榜排名第一**——在通用 agent 里复现能力领先
- **DeepCode 84.8%**——目前公开 SOTA，领先 Claude Code（58.7%）约 26 个百分点
- **PaperCoder 约 51.1%**——被 DeepCode 显著超越

> PaperBench 的意义：让「能不能复现论文」从主观感觉变成可量化、可比较的分数。

## 复现工作流总览（六步共识）

无论用哪个工具，论文复现的工作流是趋同的：

| 步骤 | 做什么 | 难点 |
| --- | --- | --- |
| 1 理解 | 读论文，抽方法/数据/指标/超参 | 模糊描述、缺关键超参 |
| 2 环境 | 还原依赖、Python/CUDA 版本 | 论文不写版本，环境坑多 |
| 3 代码 | 实现模型、数据加载、训练/评估循环 | 论文伪代码与实现有差距 |
| 4 执行 | 跑实验，log 指标 | 算力、训练时间、随机性 |
| 5 对齐 | 对比 agent 结果与论文指标 | 误差容许范围无共识 |
| 6 报告 | 写差异分析、记录未公开超参猜测 | 难追溯每步决策 |

AutoReproduce 的 **Paper Lineage（论文谱系）** 就是把这六步的每一步决策都留痕，便于事后审查与改进。

## 怎么开始用

最简单的三条路：

```text
路线 A：装 paper-replicate-agent 指令到 Claude Code
        ↓
  给它论文 PDF + 数据，让它输出 R/Python 代码 + 质量报告

路线 B：跑 DeepCode（港大，PaperBench 84.8%）
        ↓
  输入论文，端到端输出复现代码与实验脚本

路线 C：用 AutoReproduce 多 agent 框架
        ↓
  适合需要 Paper Lineage 追溯、要审计每步决策的场景
```

如果只是想**衡量自己 agent 的复现能力**，直接去跑 PaperBench 基准即可。

## 下一步

- [指南](./guide-line) —— 六步工作流深入、生态工具对比、五大难点与反模式
- [参考](./reference) —— 工具对比表、PaperBench 指标、复现清单、链接
