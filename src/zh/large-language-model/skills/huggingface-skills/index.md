---
layout: doc
---

# Hugging Face Skills

Hugging Face Skills（`huggingface/skills`）是 Hugging Face 官方出品的 AI/ML 工程技能集，遵循 [agentskills.io](https://agentskills.io/home) 开放格式，**Apache-2.0** 开源。它把 HF 全生态的工程实践打包成可按需调用的技能——从「让 agent 学会每一条 `hf` 命令」（`hf-cli`，Hub 操作引导路径），到「在 SageMaker 上部署一个模型」（`hf-cloud-sagemaker-deployment-planner` 等 6 个 AWS/SageMaker skill），再到「用 TRL 在云 GPU 上微调」（`huggingface-llm-trainer`）、「在 Spaces 上跑 Gradio Demo」（`huggingface-spaces`）、「查 Dataset Viewer」（`huggingface-datasets`）。仓库目前有 **25 个 skill**，覆盖 Hub 操作、训练、部署、数据集、Spaces、Gradio、论文、本地推理、评测等几乎全栈场景。不是通用 prompt，而是 HF 工程团队沉淀的、有明确触发条件与分类的工程规范。

## 评价

**优点**

- **官方沉淀**：来自 Hugging Face 官方（非社区），覆盖 HF Hub / Spaces / Jobs / Datasets 等一手工程实践
- **`hf-cli` 是引导路径**：从本地已安装 CLI 生成，教 agent 所有 `hf` 子命令（auth/download/upload/buckets/spaces/datasets/jobs/papers/discussions），始终保持最新
- **覆盖全栈**：训练（TRL/Unsloth/Sentence-Transformers/Vision Trainer/Trackio）、部署（Spaces/SageMaker 6 件套）、数据集（Viewer API）、本地推理（llama.cpp/GGUF/transformers.js）、评测（community-evals）、论文（papers/paper-publisher）
- **AWS/SageMaker 工作流编排**：`hf-cloud-*` 6 个 skill 把 SageMaker 部署拆成 discovery → env → iam → image → planner → production-defaults 的工作流，技能之间互相协调
- **跨 agent**：Claude Code（plugin marketplace）/ Codex（`.agents/skills`）/ Gemini CLI（gemini-extension.json）/ Cursor 都能用
- **MCP / CLI 双通道**：通过 `hf skills add <name>` 装新 skill，或经 MCP/CLI 集成动态发现

**缺点 / 边界**

- **HF 生态绑定**：技能围绕 HF Hub/Spaces/Jobs，非 HF 路径（如自建模型库、自训 cluster）收益有限
- **`hf-cli` 需先装 CLI**：从本地 `hf` CLI 生成指令，未装则 fallback 到 `agentsmd/AGENTS.md`
- **Cloud skill 偏 AWS/SageMaker**：6 件套聚焦 SageMaker，暂未覆盖 GCP/Vertex、Azure ML
- **市场入口仅 `hf-cli`**：`.claude-plugin/marketplace.json` 只暴露 `hf-cli`，其余 skill 须 `hf skills add` 安装
- **与 Vercel/通用 Skills 分工**：部署/前端规范类见 [Vercel Agent Skills](../vercel-agent-skills/)，本叶专注 HF/ML 工程链路

## 适用场景

- 让 agent 学会操作 HF Hub（上传模型/数据集、launch Spaces、跑 Jobs、管 Buckets、读论文）
- 在 Hugging Face Jobs / 云 GPU 上微调或预训练（TRL SFT/DPO/GRPO、Sentence-Transformers、Vision Trainer）
- 部署模型到 Amazon SageMaker（real-time / async / serverless）或 HF Spaces（Gradio/Docker/Static/ZeroGPU）
- 查询 HF Dataset Viewer、做社区评测、把模型导成 GGUF 本地推理
- 给编码 agent 装 HF 工程规范（Claude Code / Codex / Cursor / Gemini CLI）

## 边界

- **不是单个技能，是官方技能集**：25 个 skill 各有触发条件，按需激活
- **市场入口聚焦**：`hf-cli` 是引导 skill，其余用 `hf skills add <name>` 装
- **AWS 部署强相关**：`hf-cloud-*` 围绕 SageMaker，其他云未覆盖
- **训练依赖云 GPU**：TRL 系列跑在 Hugging Face Jobs 基础设施上

## 官方文档

[Hugging Face Skills README](https://github.com/huggingface/skills#readme) ｜ [hf CLI 文档](https://huggingface.co/docs/hub/agents-cli) ｜ [Agentskills.io 标准格式](https://agentskills.io/home)

## GitHub 地址

[huggingface/skills](https://github.com/huggingface/skills)（Apache-2.0）

## 内容地图

- [入门](./getting-started) —— 各客户端安装（Claude Code / Codex / Gemini CLI / Cursor）、`hf skills add` 装 skill、25 个 skill 速览
- [指南](./guide-line) —— 按类讲（Hub CLI / SageMaker 部署 / 训练 / 数据集 / Spaces / Gradio / 论文 / 本地推理 / 评测）+ 工作流 + 反模式
- [参考](./reference) —— 25 skill 全表 + 安装 + 许可 + 链接

## 幻灯片地址

<a href="/SlideStack/huggingface-skills-slide/" target="_blank">Hugging Face Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=656" target="_blank" rel="noopener noreferrer">Hugging Face Skills 测试题</a>

