---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 huggingface/skills 主分支（2026-07，Apache-2.0）的 README 与 skills/ 编写。

## 速查

- **官方源**：`huggingface/skills`，Apache-2.0；遵 [agentskills.io](https://agentskills.io/home) 格式
- **引导 skill = `hf-cli`**：从本地 `hf` CLI 生成，教 agent 所有 `hf` 命令（auth/download/upload/buckets/spaces/datasets/jobs/papers）
- **装 CLI**：`curl -LsSf https://hf.co/cli/install.sh | bash -s`；登录 `hf auth login`
- **Claude Code**：`/plugin marketplace add huggingface/skills` → `/plugin install hf-cli@huggingface/skills`
- **装其它 skill**：`hf skills add <skill-name>`（marketplace 默认只暴露 `hf-cli`）
- **客户端支持**：Claude Code / Codex（`.agents/skills`）/ Gemini CLI（gemini-extension.json）/ Cursor（plugin manifest）
- **25 skill 分类**：Hub CLI（1）· Cloud/AWS（6）· 训练（6：llm/vision/sentence/trl/trackio/zerogpu）· 数据（2）· Spaces/Gradio（3）· 本地推理（2）· 论文（2）· 工具/评测（3）

## 它是什么

Hugging Face Skills 是一组 **AI/ML 工程技能**，每个技能是一个自包含文件夹：`SKILL.md`（YAML frontmatter 的 name/description + agent 指令）+ 可选 `scripts/`（自动化脚本）+ 可选 `references/`（支撑文档）。技能装好后，编码 agent 会在任务匹配时自动加载并按 `SKILL.md` 行事。

`hf-cli` 是仓库推荐的**第一个 skill**——它由你本地安装的 `hf` CLI 动态生成，因此总是覆盖最新的 Hub 命令（download/upload/auth/buckets/spaces/datasets/jobs/papers/discussions/collections/inference endpoints）。

## 安装

### 1. 先装 hf CLI

```bash
curl -LsSf https://hf.co/cli/install.sh | bash -s
hf auth login   # 打印 URL + 一次性 code，浏览器完成 OAuth；或传 --token
hf auth whoami  # 验证当前账号
```

### 2. 按客户端装 skill 集

#### Claude Code

```text
/plugin marketplace add huggingface/skills
/plugin install hf-cli@huggingface/skills
```

之后用 `hf skills add <skill-name>` 安装仓库里其它 skill。

#### Codex

把需要的 skill 从仓库 `skills/` 复制或 symlink 到 Codex 的 `.agents/skills`（仓库级 `$REPO_ROOT/.agents/skills` 或用户级 `$HOME/.agents/skills`），Codex 会按 Agent Skills 标准自动发现。

#### Gemini CLI

仓库根目录有 `gemini-extension.json`：

```bash
gemini extensions install . --consent
# 或从 GitHub
gemini extensions install https://github.com/huggingface/skills.git --consent
```

#### Cursor

仓库含 `.cursor-plugin/plugin.json` 和 `.mcp.json`（已配 HF MCP server URL），从仓库 URL 或本地 checkout 用 Cursor 的插件流程安装。

> **agent 不支持 skills？** 直接用仓库的 [`agentsmd/AGENTS.md`](https://github.com/huggingface/skills/blob/main/agentsmd/AGENTS.md) 作为指令包兜底。

## 25 skill 速览

| 类别 | skill | 一句话 |
| --- | --- | --- |
| **Hub CLI（引导）** | `hf-cli` | 所有 `hf` 命令：auth/download/upload/buckets/spaces/datasets/jobs/papers |
| **Cloud / AWS** | `hf-cloud-aws-context-discovery` | 探测本地 AWS 上下文（profile/region/account/identity） |
|  | `hf-cloud-python-env-setup` | 给 SageMaker/AWS 起隔离 Python 环境（版本 + boto3） |
|  | `hf-cloud-sagemaker-deployment-planner` | SageMaker 部署的入口/编排 skill |
|  | `hf-cloud-sagemaker-iam-preflight` | 部署/训练前确保 SageMaker execution role 可用 |
|  | `hf-cloud-sagemaker-production-defaults` | 建带自动伸缩 + CloudWatch + tagging 的端点 |
|  | `hf-cloud-serving-image-selection` | 选对的 serving 容器 + 当前 image URI |
| **训练** | `huggingface-llm-trainer` | TRL（SFT/DPO/GRPO/RM）或 Unsloth 在 HF Jobs 上训 |
|  | `huggingface-vision-trainer` | 视觉模型：检测（D-FINE/RT-DETR/DETR/YOLOS）、分类（timm）、SAM/SAM2 |
|  | `train-sentence-transformers` | SentenceTransformer/CrossEncoder/SparseEncoder |
|  | `trl-training` | TRL 训练 transformer 语言模型（细化） |
|  | `huggingface-trackio` | 训练实验追踪与可视化 |
|  | `huggingface-zerogpu` | ZeroGPU + Gradio Spaces 上的 GPU 计算 |
| **数据集** | `huggingface-datasets` | Dataset Viewer API：splits/rows/search/filter/parquet/size/statistics |
|  | `huggingface-community-evals` | 用 inspect-ai / lighteval 在本地硬件跑评测 |
| **Spaces / Gradio** | `huggingface-spaces` | 建/部署/维护 Spaces（Gradio/Docker/Static/ZeroGPU） |
|  | `huggingface-gradio` | 用 Python 建 Gradio Web UI 和 Demo |
|  | `huggingface-lora-space-builder` | 给指定 LoRA 建并发布 Gradio Demo |
| **本地推理** | `huggingface-local-models` | 选模型用 llama.cpp + GGUF 在 CPU/Metal/CUDA/ROCm 跑 |
|  | `transformers-js` | 在 JavaScript/TypeScript 里跑 SOTA ML 模型 |
| **论文 / 工具** | `huggingface-papers` | 查/读 HF 论文页（作者、关联模型/数据集/Spaces、repo） |
|  | `huggingface-paper-publisher` | 在 Hub 上发布和管理研究论文 |
|  | `huggingface-tool-builder` | 用 HF API 数据建工具/脚本 |
|  | `huggingface-best` | 找任务下最好/最推荐的模型、按 benchmark 比较 |
|  | `hf-mem` | 估算 Safetensors / GGUF 推理所需显存 |

## 用 skill 的两种方式

1. **任务匹配自动激活**：装好后，agent 看到「Deploy a model to SageMaker」「Fine-tune a 70B model」就会自动加载对应 `SKILL.md`
2. **显式提及**：在对话里直接点名，例如「Use the HF LLM trainer skill to estimate GPU memory for a 70B run」

## 下一步

- [指南](./guide-line) —— 按类讲深入（CLI / Cloud 部署 / 训练 / 数据集 / Spaces / 论文 / 本地推理 / 评测）+ 工作流 + 反模式
- [参考](./reference) —— 25 skill 全表 + 触发场景 + 安装、许可、链接
