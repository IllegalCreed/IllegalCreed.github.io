---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 huggingface/skills 的 README 与 skills/ 编写。Apache-2.0。

## 速查

- **`hf-cli` 是引导 skill**：从本地 `hf` CLI 生成，所有 Hub 操作（auth/download/upload/buckets/spaces/datasets/jobs/papers/discussions）的 agent 入口
- **Cloud 部署工作流（SageMaker）**：discovery → env setup → iam preflight → serving image → production defaults，由 planner 编排
- **训练在 HF Jobs 上跑**：`huggingface-llm-trainer`（TRL SFT/DPO/GRPO/Unsloth + Trackio 监控）、`vision-trainer`、`trl-training`、`train-sentence-transformers`
- **Spaces 三 SDK**：Gradio（默认 + ZeroGPU）、Docker（任意容器，无 ZeroGPU）、Static（浏览器 ML / 项目页）
- **Dataset Viewer API**：`/is-valid` → `/splits` → `/first-rows` → `/rows`（分页）→ `/search` `/filter` → `/parquet` `/size` `/statistics`
- **本地推理**：`huggingface-local-models`（GGUF + llama.cpp）、`transformers-js`（浏览器）
- **市场只暴露 `hf-cli`**，其余 `hf skills add <name>`

## 类别一：Hub CLI（`hf-cli`）

`hf-cli` 是仓库推荐的**第一个 skill**，所有 HF 工程任务的引导路径。它由本地 `hf` CLI 动态生成（当前 `huggingface_hub v1.23.0`，跑 `hf skills add --force` 可重生成），所以始终覆盖最新命令。

**核心命令族**（节选）：

| 命令族 | 用途 |
| --- | --- |
| `hf auth login/whoami/token/switch/logout/list` | 认证（取代旧 `huggingface-cli login`） |
| `hf download/upload/cp/sync` | 下载、上传、复制、本地↔bucket 同步 |
| `hf buckets create/list/info/cp/sync/move/remove/delete` | HF Buckets（云存储） |
| `hf cache list/prune/rm/verify` | 本地缓存管理 + checksum 校验 |
| `hf datasets card/info/list/parquet/sql/leaderboard` | 数据集元信息、parquet、SQL（DuckDB） |
| `hf spaces search/create/hardware/logs/restart/...` | Spaces 生命周期 |
| `hf jobs ...` / Inference Endpoints | HF Jobs、推理端点 |
| `hf papers ...` / `hf collections ...` / `hf discussions ...` | 论文、collection、Discussion/PR |

> 触发：用户提及 `hf` / `huggingface` / `huggingface-cli` 或任何 HF 生态操作。即使没显式提命令也用。

## 类别二：Cloud / SageMaker 部署（6 件套）

`hf-cloud-*` 6 个 skill 把「部署一个模型到 Amazon SageMaker」拆成可协调的工作流：

```text
hf-cloud-sagemaker-deployment-planner（入口 + 编排）
   │
   ├─ 1. hf-cloud-aws-context-discovery      探测本地 AWS 上下文
   ├─ 2. hf-cloud-python-env-setup            隔离 Python + boto3
   ├─ 3. hf-cloud-sagemaker-iam-preflight     确保 execution role 可用
   ├─ 4. hf-cloud-serving-image-selection     选对 serving 容器 + image URI
   └─ 5. hf-cloud-sagemaker-production-defaults  建带自动伸缩/CloudWatch/tagging 的端点
```

**planner 选 pathway**：

| Pathway | 适用 |
| --- | --- |
| **Real-time endpoint** | 稳态流量、亚秒级延迟、always-on（LLM 默认） |
| **Serverless** | 流量稀疏/突发、容忍冷启动（~10s+）、小模型 |
| **Async inference** | 长推理（>60s）、大 payload、队列友好 |
| **Batch transform** | 离线批量打分 |
| **Bedrock CMI** | Bedrock 兼容 API + 支持的基座 |

**两个脚本化 pathway** 是 real-time 和 async（`deploy_async.py`），其余按需手动。

## 类别三：训练（HF Jobs + TRL）

| skill | 方法 / 适用 |
| --- | --- |
| `huggingface-llm-trainer` | TRL（SFT/DPO/GRPO/Reward Modeling）或 Unsloth；跑在 HF Jobs 云 GPU；自带 GGUF 转换、Trackio 监控 |
| `trl-training` | TRL 训练语言模型（细化方法参考） |
| `huggingface-vision-trainer` | 检测（D-FINE、RT-DETR v2、DETR、YOLOS）、分类（timm：MobileNetV3/MobileViT/ResNet/ViT/DINOv3）、SAM/SAM2 分割 |
| `train-sentence-transformers` | SentenceTransformer（bi-encoder，retrieval/similarity/cluster）、CrossEncoder（reranker）、SparseEncoder（SPLADE） |
| `huggingface-trackio` | 训练实验追踪与可视化 |
| `huggingface-zerogpu` | Gradio Spaces ZeroGPU 上的 GPU 计算 |

**llm-trainer 关键指令**：

- **始终用 `hf_jobs()` MCP 工具** 提交，不要用 bash `trl-jobs`
- **每个训练脚本都加 Trackio** 监控
- **提交后给 job ID + 监控 URL + 预计时长**
- **Unsloth 适用**：显存吃紧（省 ~60% VRAM）、要速度（~2x）、>13B 大模型、VLM

## 类别四：数据集（Viewer + 评测）

`huggingface-datasets` 执行**只读** Dataset Viewer API：

```text
https://datasets-server.huggingface.co
1. /is-valid?dataset=ns/repo              ← 校验可用
2. /splits?dataset=ns/repo                ← 解析 config + split
3. /first-rows?...&config=&split=         ← 预览
4. /rows?...&offset=0&length=100          ← 分页（length≤100）
5. /search 或 /filter                     ← 文本匹配 / 行谓词
6. /parquet /size /statistics             ← parquet 分片、总量、列统计
```

> 分页看响应里的 `num_rows_total` / `num_rows_per_page` / `partial`；gated/private 数据集需 `Authorization: Bearer <HF_TOKEN>`。

`huggingface-community-evals` 用 `inspect-ai` 和 `lighteval` 在**本地硬件**上跑 Hub 模型评测。

## 类别五：Spaces + Gradio

`huggingface-spaces` 是 Spaces 全生命周期 skill。Space 是个 git repo，三种 SDK：

| SDK | 适用 |
| --- | --- |
| **Gradio** | 大多数 Space；Python、快速迭代、支持 ZeroGPU |
| **Docker** | 非 Python 技术栈或预置模板（Streamlit/Argilla/Shiny）；**不支持 ZeroGPU** |
| **Static** | 浏览器 ML（transformers.js / WebGPU / WASM / onnxruntime-web）、项目页 |

**硬件档位**：`cpu-basic`（2 vCPU/16GB）、`zero-a10g`（ZeroGPU，RTX PRO 6000 Blackwell；large=48GB/xlarge=96GB；需 PRO/Team/Enterprise）、dedicated GPU（T4/L4/A10G/L40S/A100/H200，按小时计费，需 `canPay=True`）。Static 免费。

**默认选择**：公开 ML Demo → Gradio + ZeroGPU；非 PyTorch 主路径推理 → dedicated GPU；CPU 小模型/API 代理 → `cpu-basic`；浏览器 ML → Static。

## 类别六：论文 / 工具 / 本地推理 / 评测

- **`huggingface-papers`**：读 HF 论文页 markdown + 论文 API 结构化元数据（作者、关联 models/datasets/Spaces、Github repo、project page）
- **`huggingface-paper-publisher`**：在 Hub 上发布和管理研究论文
- **`huggingface-tool-builder`**：当任务需要 HF API 数据时建工具/脚本
- **`huggingface-best`**：找任务下最好/最推荐模型，按 benchmark 比较
- **`hf-mem`**：估算 Safetensors/GGUF 推理所需显存
- **`huggingface-local-models`**：选模型用 `llama.cpp` + GGUF 在 CPU/Metal/CUDA/ROCm 跑
- **`transformers-js`**：在 JS/TS 里跑 SOTA ML 模型

## 反模式

- **绕开 `hf_jobs()`**：`huggingface-llm-trainer` 明确要求用 `hf_jobs()` MCP 工具，**不要**直接 bash 跑 `trl-jobs`
- **直接用旧 `huggingface-cli`**：已被 `hf` 取代，所有 auth 命令在 `hf auth` 下
- **marketplace 装非 `hf-cli` skill**：市场只暴露 `hf-cli`，其它 skill 用 `hf skills add`
- **ZeroGPU 上跑非 PyTorch 主路径推理**：hijack 只 patch torch；要么切 dedicated GPU，要么把非 torch 部分包在 `@spaces.GPU` 内
- **没查 quota 就推荐 SageMaker 实例**：GPU 配额默认常为 0，先查再推
- **不给 gated/private 数据集加 token**：Dataset Viewer 调用会失败

## 触发机制

每个 skill 的 `SKILL.md` frontmatter `description` 写明「Use when…」，agent 据此判断。例如 `hf-cli` 在用户提到 `hf` / `huggingface` / `huggingface-cli` / HF 生态任何操作时触发；`hf-cloud-sagemaker-deployment-planner` 在「deploy / host / serve a model on SageMaker / AWS」类话术时触发。也可在对话里显式点名。

## 与相邻叶的边界

- **Vercel / 通用 agent skills** 在 [Vercel Agent Skills](../vercel-agent-skills/) 叶，本叶专注 HF/ML 工程链路
- **Agentskills.io 格式标准** 由多个官方技能集共用，HF Skills 是其中一个实现

## 下一步

- [参考](./reference) —— 25 skill 全表 + 触发场景 + 安装、许可、链接
- 上游：[huggingface/skills](https://github.com/huggingface/skills) · [HF Hub agents-cli 文档](https://huggingface.co/docs/hub/agents-cli)
