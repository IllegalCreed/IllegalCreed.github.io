---
layout: doc
---

# AI 论文复现 Skills

AI 论文复现 Skills 是一类**方法论/主题技能**——用 AI agent 自动复现（reproduce）AI/ML 科研论文的实验与代码：读懂论文 → 还原依赖与环境 → 写出可运行的训练/评估代码 → 跑实验 → 把指标对齐论文 → 报告差异。它**没有单一官方仓库**，社区以多个开源 agent 项目和一个权威基准为代表：**PaperBench**（OpenAI 提出的论文复现基准，Claude 在该榜排名第一）、**DeepCode**（港大/HKU 开源，PaperBench 得分 84.8%，大幅领先 Claude Code 的 58.7%）、**AutoReproduce**（多 agent 端到端框架，引入 Paper Lineage 追溯复现谱系）、**PaperCoder**（科学代码复现框架，约 51.1%）、以及**paper-replicate-agent**（社区给 Claude Code 的指令模板，定位「研究承包商」）。

## 评价

**优点**

- **把「数天才能复现一篇论文」压缩到小时级**：PaperBench 上即便人类专家也要数天，Claude agent 可在更短时间完成
- **DeepCode 84.8% 首破纪录**：在论文复现代码任务上首次超过剑桥、伯克利等高校的 ML 博士
- **流程已沉淀为共识工作流**：理解 → 环境 → 代码 → 执行 → 对齐 → 报告，六步可复用
- **基准驱动**：PaperBench 让「能不能复现」可量化、可比较，不再是空泛感觉
- **谱系可追溯**：AutoReproduce 的 Paper Lineage 让复现每一步决策都留痕，便于审查与改进

**缺点 / 边界**

- **复现率仍是瓶颈**：即便是 SOTA 的 DeepCode 也只到 84.8%，PaperCoder 约 51.1%，并非「丢论文进去就 100% 出结果」
- **数据可得性是硬约束**：论文用闭源/受限数据时，agent 也无能为力
- **随机性与超参模糊**：种子未公开、关键超参只在附录或干脆没写，是复现差异的主要来源
- **算力门槛仍在**：复现大模型训练成本高昂，agent 写得出代码不代表跑得起
- **生态碎片化**：无单一官方仓，各项目目标与口径不一（基准/框架/指令模板）

## 适用场景

- 想快速读懂一篇 AI/ML 论文并跑通它的核心实验
- 复现他人实验结果，对比自家方法是否真的更优
- 学习 SOTA 方法的代码实现细节（attention、loss、训练循环）
- 评估或对比不同 agent 的论文复现能力（用 PaperBench 做基准）
- 给 Claude Code/Cursor 装上「研究承包商」式的复现工作流

## 边界

- **方法论叶，非单一官方仓**：本叶讲的是「如何用 agent 复现论文」的方法论与生态工具，落地时可任选 DeepCode/AutoReproduce/paper-replicate-agent
- **基准 ≠ 工具**：PaperBench 是评测基准（衡量能力），DeepCode/AutoReproduce 才是可直接拿来跑的 agent
- **复现不是抄袭**：仅用于学习/验证/对比；发布复现代码须遵守原论文与数据集许可
- **不替代研究品味**：agent 能复现，但「该复现哪篇、为什么」仍需研究者判断

## 核心素材

- **PaperBench**：OpenAI 提出的论文复现基准，要求 agent 完成论文理解 → 代码库开发 → 实验执行 → 调试的完整流程；**Claude 在该榜第一**；对人类专家也需数天
- **DeepCode**：港大/HKU 开源论文→代码复现 agent，PaperBench **84.8%**，领先 Claude Code（58.7%）约 26 个百分点；GitHub 8k+ 星
- **AutoReproduce**：多 agent 端到端框架，自动复现论文实验，引入 **Paper Lineage（论文谱系）** 追溯复现过程
- **PaperCoder**：科学代码复现框架，复现率约 **51.1%**（被 DeepCode 显著超越）
- **paper-replicate-agent**：社区给 Claude Code 的指令模板——读论文 → 用提供的数据复现结果 → 输出可重复的 R/Python 代码 + 质量报告

## 内容地图

- [入门](./getting-started) —— 定位（方法论叶）、PaperBench 基准、复现工作流总览
- [指南](./guide-line) —— 复现工作流六步、生态工具深入、难点与反模式
- [参考](./reference) —— 生态工具对比表、PaperBench 指标、工作流清单、链接

## 幻灯片地址

<a href="/SlideStack/ai-paper-reproduction-skills-slide/" target="_blank">AI 论文复现 Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=659" target="_blank" rel="noopener noreferrer">AI 论文复现 Skills 测试题</a>

