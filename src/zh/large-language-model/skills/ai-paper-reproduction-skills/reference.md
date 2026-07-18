---
layout: doc
outline: [2, 3]
---

# 参考

> 方法论叶，以 PaperBench 基准 + DeepCode / AutoReproduce / paper-replicate-agent 生态为代表（无单一官方仓）。

## 速查

- **生态五件套**：PaperBench（基准）· DeepCode（84.8%）· AutoReproduce（Paper Lineage）· PaperCoder（51.1%）· paper-replicate-agent（Claude Code 指令）
- **PaperBench SOTA**：DeepCode 84.8% > Claude Code 58.7% > PaperCoder 51.1%
- **六步工作流**：理解 → 环境 → 代码 → 执行 → 对齐 → 报告
- **五大难点**：数据 · 种子 · 超参 · 算力 · 模糊描述
- **Claude 在 PaperBench 第一**：通用 agent 里最强

## 生态工具对比表

| 工具 | 类型 | PaperBench | 特点 | 适用 |
| --- | --- | --- | --- | --- |
| **PaperBench** | 评测基准 | — | OpenAI 出，论文理解→代码→实验→调试全流程 | 衡量 agent 复现能力 |
| **DeepCode** | agent 框架 | **84.8%** | 港大开源，GitHub 8k+ 星，超剑桥/伯克利博士 | 直接拿来端到端复现 |
| **AutoReproduce** | 多 agent 框架 | — | Paper Lineage 追溯复现谱系 | 需审计/可追溯的复现 |
| **PaperCoder** | 复现框架 | ~51.1% | 偏科学代码生成 | 对比基线 |
| **paper-replicate-agent** | 指令模板 | — | Claude Code 当「研究承包商」 | 给现有 agent 装复现流 |

## PaperBench 指标对比

```text
DeepCode        84.8%   ← SOTA（港大）
Claude Code     58.7%   ← 通用 agent 强基线
PaperCoder      51.1%   ← 对比基线
```

- DeepCode 领先 Claude Code 约 **26 个百分点**
- 人类专家完成一篇 PaperBench 论文需**数天**
- Claude 在 PaperBench **通用 agent 榜第一**

## 复现工作流清单

```text
[ ] 1 理解
    [ ] 抽出方法（架构/loss/forward）
    [ ] 列数据集、预处理、批大小
    [ ] 确认对比指标
    [ ] 挖尽超参（正文+附录+代码+issue）

[ ] 2 环境
    [ ] 锁 Python/CUDA/PyTorch 版本
    [ ] 写 requirements.txt / environment.yml
    [ ] （可选）Dockerfile 固化

[ ] 3 代码
    [ ] 模型定义
    [ ] 数据加载（Dataset/DataLoader）
    [ ] 训练循环
    [ ] 评估循环
    [ ] checkpoint 保存

[ ] 4 执行
    [ ] 固定随机种子
    [ ] 跑训练，log 每 epoch 指标
    [ ] 多 seed 平均（至少 3 次）

[ ] 5 对齐
    [ ] 列表对比论文 vs 复现指标
    [ ] 标注差异方向（+/-）
    [ ] 判定容差是否可接受

[ ] 6 报告
    [ ] 复现了哪些表/图
    [ ] 差异原因分析
    [ ] 未公开超参的处理
    [ ] 可重复执行的命令
```

## Paper Lineage（AutoReproduce 概念）

**论文谱系**——把复现过程中每个决策都留痕：

- 为什么选这个超参（猜测依据）
- 为什么跳过某步（数据缺失？算力不足？）
- 哪些代码来自论文官方、哪些是自己补的
- 每次实验的种子、配置、结果

用途：事后审计、复现报告、改进复现流程。

## paper-replicate-agent 指令要点

把它当「研究承包商」用，要点：

- 明确角色：规划方案、编写脚本、验证输出、记录差异
- 输入：论文 PDF + 提供的数据
- 输出：可重复的 R/Python 代码 + 质量报告
- 关键约束：诚实记录差异，不假装「完美复现」

## 五大难点速记

| 难点 | 一句话 |
| --- | --- |
| 数据可得性 | 闭源/受限数据，agent 无能为力 |
| 随机种子 | 未公开，同代码差 1-2 点 |
| 未公开超参 | 正文不写，附录/issue 挖 |
| 算力 | 大模型复现成本高 |
| 模糊描述 | 归一化/初始化/激活略过 |

## 反模式（避免）

- 跳过环境固化——「我机器能跑」不等于可复现
- 只跑一次——单次结果被随机性误导
- 对齐容差拍脑袋——没标准就扯皮
- 不写差异报告——「差不多」不叫完成
- 把基准当工具——PaperBench 衡量能力，不是 agent

## 资源链接

- PaperBench：搜索 `OpenAI PaperBench`（论文复现基准）
- DeepCode：搜索 `HKU DeepCode paper reproduction`（港大开源，84.8%）
- AutoReproduce：搜索 `AutoReproduce paper lineage`
- PaperCoder：搜索 `PaperCoder scientific code reproduction`
- paper-replicate-agent：社区 Claude Code 指令模板
- 相关叶：[Claude Code Skills](../claude-code-skills/) · [入门](./getting-started) · [指南](./guide-line)
