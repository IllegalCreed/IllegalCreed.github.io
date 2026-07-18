---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 huggingface/skills README 与 skills/ 编写。Apache-2.0。

## 速查

- **源**：`huggingface/skills`，Apache-2.0；遵 agentskills.io；Hugging Face 官方
- **25 skill**（见下表）；引导 skill = `hf-cli`（从本地 CLI 生成）
- **市场入口**：`.claude-plugin/marketplace.json` 与 `.cursor-plugin/marketplace.json` 仅暴露 `hf-cli`；其余用 `hf skills add <name>` 或动态发现
- **客户端**：Claude Code / Codex / Gemini CLI / Cursor
- **每 skill**：`SKILL.md`（必）+ 可选 `scripts/` + 可选 `references/`
- **CLI 安装**：`curl -LsSf https://hf.co/cli/install.sh | bash -s`

## 25 skill 全表

| skill | 类别 | 用途 |
| --- | --- | --- |
| `hf-cli` | Hub CLI | 所有 `hf` 命令：auth/download/upload/buckets/spaces/datasets/jobs/papers/discussions/collections |
| `hf-cloud-aws-context-discovery` | Cloud | 探测本地 AWS 上下文（profile/region/account/identity） |
| `hf-cloud-python-env-setup` | Cloud | 为 SageMaker/AWS 起隔离 Python 环境 + 当前版本 boto3 |
| `hf-cloud-sagemaker-deployment-planner` | Cloud | SageMaker 部署入口 + pathway 选择 + 编排 |
| `hf-cloud-sagemaker-iam-preflight` | Cloud | 部署/训练前确保 execution role 可用 |
| `hf-cloud-sagemaker-production-defaults` | Cloud | 建带自动伸缩 + CloudWatch + tagging 的 real-time/async 端点 |
| `hf-cloud-serving-image-selection` | Cloud | 选 serving 容器 + 当前 image URI |
| `hf-mem` | 工具 | 估算 Safetensors/GGUF 推理显存 |
| `huggingface-best` | 模型选型 | 按任务/benchmark 找最好模型 |
| `huggingface-community-evals` | 评测 | inspect-ai / lighteval 本地评测 |
| `huggingface-datasets` | 数据 | Dataset Viewer API（splits/rows/search/filter/parquet/size/statistics） |
| `huggingface-gradio` | UI | 用 Python 建 Gradio Web UI/Demo |
| `huggingface-llm-trainer` | 训练 | TRL（SFT/DPO/GRPO/RM）或 Unsloth + HF Jobs |
| `huggingface-local-models` | 本地推理 | llama.cpp + GGUF（CPU/Metal/CUDA/ROCm） |
| `huggingface-lora-space-builder` | Spaces | 给指定 LoRA 建并发布 Gradio Demo |
| `huggingface-paper-publisher` | 论文 | 在 Hub 发布/管理研究论文 |
| `huggingface-papers` | 论文 | 读 HF 论文页 + 论文 API 结构化元数据 |
| `huggingface-spaces` | Spaces | 建/部署/维护 Spaces（Gradio/Docker/Static/ZeroGPU） |
| `huggingface-tool-builder` | 工具 | 用 HF API 数据建工具/脚本 |
| `huggingface-trackio` | 训练 | 训练实验追踪与可视化 |
| `huggingface-vision-trainer` | 训练 | 视觉：检测/分类/SAM 分割，HF Jobs 云 GPU |
| `huggingface-zerogpu` | 计算 | Gradio Spaces ZeroGPU GPU 计算 |
| `train-sentence-transformers` | 训练 | SentenceTransformer/CrossEncoder/SparseEncoder |
| `transformers-js` | 本地推理 | JS/TS 中跑 SOTA ML 模型 |
| `trl-training` | 训练 | TRL 训练 transformer 语言模型 |

## 安装（按客户端）

### Claude Code

```text
/plugin marketplace add huggingface/skills
/plugin install hf-cli@huggingface/skills
```

装其它 skill：

```bash
hf skills add <skill-name>
```

### Codex

把 `skills/<name>` 复制或 symlink 到 `$REPO_ROOT/.agents/skills` 或 `$HOME/.agents/skills`；Codex 按 Agent Skills 标准自动发现。fallback 用 [`agentsmd/AGENTS.md`](https://github.com/huggingface/skills/blob/main/agentsmd/AGENTS.md)。

### Gemini CLI

```bash
gemini extensions install . --consent
# 或
gemini extensions install https://github.com/huggingface/skills.git --consent
```

仓库根 `gemini-extension.json` 已配好。

### Cursor

仓库含 `.cursor-plugin/plugin.json` + `.mcp.json`（含 HF MCP server URL），从仓库 URL 或本地 checkout 走 Cursor 插件流程。

## 目录结构

```text
huggingface/skills/
├── skills/
│   ├── hf-cli/SKILL.md                      # 引导 skill（动态生成）
│   ├── hf-cloud-*/SKILL.md                  # 6 个 SageMaker 部署件
│   ├── huggingface-llm-trainer/SKILL.md
│   ├── huggingface-spaces/SKILL.md
│   └── ... (25 skill)
├── agentsmd/AGENTS.md                       # 不支持 skills 时的指令包兜底
├── .claude-plugin/marketplace.json          # 仅暴露 hf-cli
├── .cursor-plugin/plugin.json
├── .mcp.json                                # HF MCP server URL
├── gemini-extension.json
└── scripts/publish.sh                       # 重新生成 + 校验所有元数据
```

每 skill：`SKILL.md`（agent 指令）+ 可选 `scripts/`（自动化辅助）+ 可选 `references/`（支撑文档）。

## 市场与发现策略

- **`.claude-plugin/marketplace.json` 与 `.cursor-plugin/marketplace.json` 故意只暴露 `hf-cli`**——让安装时清单聚焦核心 Hub 操作
- **`.claude-plugin/marketplace-internal.json`** 是完整 skill 清单，发布时上传到 Hub bucket 作为 `marketplace.json`，供 `hf skills list/add/update` 看到全部 skill
- **Skills-over-MCP** 正在标准化：通过 MCP 资源动态发现并消费 skill

## 贡献新 skill

1. 复制现有 skill 文件夹（如 `huggingface-datasets/`）并改名
2. 编辑 `SKILL.md` frontmatter（name + description）
3. 加/改支撑脚本与文档
4. **默认不要**把新 skill 加到 `.claude-plugin/marketplace.json`（市场只暴露 `hf-cli`）
5. 跑 `./scripts/publish.sh` 重新生成并校验所有生成元数据
6. 在 agent 里重装/重载 skill bundle

## 资源链接

- 仓库：[huggingface/skills](https://github.com/huggingface/skills)
- HF CLI 文档：[huggingface.co/docs/hub/agents-cli](https://huggingface.co/docs/hub/agents-cli)
- 标准格式：[agentskills.io](https://agentskills.io/home)
- Cursor Marketplace：[cursor.com/marketplace/huggingface](https://cursor.com/marketplace/huggingface)
- Codex Plugins：[developers.openai.com/codex/plugins](https://developers.openai.com/codex/plugins)
- 相关叶：[Vercel Agent Skills](../vercel-agent-skills/) · [Skills CLI 与 find-skills](../skills-cli-find-skills/) · [Antfu Skills](../antfu-skills/)
