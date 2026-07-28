---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Hugging Face Hub + Inference Endpoints + Spaces 编写，参考 [huggingface.co/docs/hub](https://huggingface.co/docs/hub/index)、[huggingface.co/docs/hub/model-cards](https://huggingface.co/docs/hub/model-cards)、[huggingface.co/docs/hub/spaces-zerogpu](https://huggingface.co/docs/hub/spaces-zerogpu)

## 速查

- **入口**：[huggingface.co](https://huggingface.co)
- **三类仓库**：Models / Datasets / Spaces
- **后端**：Git + Xet（2025 年起取代 git-lfs）
- **CLI**：`hf`（pip install huggingface_hub 提供）
- **Python 客户端**：`from huggingface_hub import HfApi`
- **加载**：`from_pretrained("user/repo")` / `load_dataset("user/repo")`
- **上传**：`hf upload` / `upload_folder` / `push_to_hub`
- **缓存**：`~/.cache/huggingface/hub/`
- **国内加速**：`HF_ENDPOINT=https://hf-mirror.com` + `HF_HUB_ENABLE_HF_TRANSFER=1`
- **Inference API**：免费 serverless 推理（限流）
- **Inference Endpoints**：付费专用实例（按小时计费）
- **ZeroGPU**：免费动态 GPU（NVIDIA RTX Pro 6000 Blackwell）
- **PRO**：9 美元/月，40 分钟/天 ZeroGPU、10 个私有仓库
- **Enterprise**：SSO + Audit Logs + Storage Regions + Resource Groups

## `hf` CLI 完整命令

```bash
# 鉴权
hf auth login                    # 浏览器 OAuth 或 token
hf auth logout
hf auth whoami

# 上传 / 下载
hf upload user/repo ./local-dir [--repo-type=model|dataset|space]
hf upload user/repo file.safetensors
hf download user/repo [--local-dir=./path] [--revision=main]
hf download user/repo file.json --repo-type=dataset

# 仓库管理
hf repo create user/new-model [--type=model]
hf repo delete user/model
hf repo list --type=model
hf repo info user/model
hf repo mv user/old user/new     # 重命名

# 分支 / 标签
hf branch create user/model my-branch
hf branch delete user/model my-branch
hf tag create user/model v1.0
hf tag list user/model

# 文件操作
hf file upload user/repo local.txt remote.txt
hf file download user/repo remote.txt

# Inference
hf inference endpoints list
hf inference endpoints create --name xxx --model user/repo --type protected

# Space 操作
hf space create user/my-space --sdk=gradio
hf space pause user/my-space
hf space restart user/my-space
hf space hardware user/my-space --type=a10g

# Token 管理
hf auth token                   # 显示当前 token

# 缓存管理
hf cache scan                   # 列出缓存
hf cache delete model_id        # 删除某仓库缓存

# 其他
hf jobs list
hf jobs create --name xxx --image yyy --command zzz
hf jobs logs xxx
```

::: tip 旧 `huggingface-cli` 已废弃
2025 年起 HF 用 `hf` 替代旧 `huggingface-cli`，命令更短、统一。旧命令仍兼容但建议迁移。
:::

## Model Card 元数据完整规范

### 完整 YAML 示例

```yaml
---
# 基础
language:
  - en
  - zh
license: apache-2.0
license_name: my-custom-license     # 当 license: other 时用
license_link: https://...           # 自定义 license URL
library_name: transformers
tags:
  - text-generation
  - llama
  - finetune
  - custom-tag

# 任务
pipeline_tag: text-generation
inference: true                     # 是否启用 widget 推理

# 关系
base_model: meta-llama/Llama-2-7b-hf
base_model_relation: finetune       # adapter / merge / quantized / finetune
new_version: user/my-model-v2

# 数据集
datasets:
  - HuggingFaceFW/fineweb
  - user/my-dataset

# 评测结果
model-index:
  - name: my-llama
    results:
      - task:
          type: text-generation
          name: Text Generation
        dataset:
          name: AI2 ARC
          type: ai2_arc
          config: ARC-Challenge
          split: test
        metrics:
          - type: accuracy
            name: ARC (25-shot)
            value: 64.59
            verified: true        # 自动验证标记
        source:
          name: Open LLM Leaderboard
          url: https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard

# 浏览器内推理 widget
widget:
  - text: "Hello, my name is"
    example_title: "Example 1"
    group: "Group A"
  - text: "Translate to French: Hello"
    example_title: "Translation"

# CO2 排放
co2_eq_emissions:
  emissions: 250
  source: "https://..."
  training_type: "pretraining"
  geographical_location: "Iceland"
  hardware_used: "NVIDIA A100"
---
```

### `pipeline_tag` 合法值

常用（部分）：

- `text-classification` / `token-classification`
- `text-generation` / `text2text-generation`
- `question-answering` / `summarization` / `translation`
- `fill-mask` / `zero-shot-classification`
- `image-classification` / `object-detection` / `image-segmentation`
- `text-to-image` / `image-to-image`
- `automatic-speech-recognition` / `text-to-speech`
- `feature-extraction` / `sentence-similarity`

完整列表见 [huggingface.co/models](https://huggingface.co/models) 左侧 filter。

### `library_name` 合法值

`transformers` / `diffusers` / `peft` / `tokenizers` / `sentence-transformers` / `keras` / `tf-keras` / `pytorch` / `safetensors` / `onnx` / `fairseq` / `speechbrain` / `espnet` / `asteroid` / `allennlp` / `spacy` / `stanza` / `fasttext` / `flair` / `k2` / `mindspore` / `paddlenlp` / `adaptable` / `nemo` / `coreml` / `mlagents` / `timm` / `keras-nlp` / `scikit-learn` / `tensorflow` / `mlcube` / `tensorrt` / `openvino` / `mlx` / `axolotl` 等。

## Spaces 配置

### SDK 类型

| SDK | 文件入口 | 适合 |
|---|---|---|
| Gradio | `app.py` | ML demo、表单交互（最推荐） |
| Streamlit | `app.py` | 数据 dashboard |
| Docker | `Dockerfile` | 任意后端、自定义框架 |
| Static | `index.html` | 纯前端页面 |

### Hardware 选项

| Hardware | 价格 | 用途 |
|---|---|---|
| Free CPU | 免费 | 静态 / 轻量应用 |
| ZeroGPU（动态 GPU） | 免费配额 + credits | ML 推理（按用量计费） |
| A10G Small（持久 GPU） | ~1 美元/小时 | 7B 模型推理 |
| A10G Large | ~2 美元/小时 | |
| A100 Small（持久） | ~4 美元/小时 | 70B 模型推理 |
| A100 Large | ~8 美元/小时 | |

### Space YAML metadata

`README.md` 头部：

```yaml
---
title: My Demo
emoji: 🚀
colorFrom: blue
colorTo: red
sdk: gradio
sdk_version: "4.44.0"
app_file: app.py
pinned: false
license: apache-2.0
short_description: A short description
tags:
  - text-generation
---
```

字段：

- `title`：Space 名
- `emoji`：封面图标
- `colorFrom` / `colorTo`：封面渐变（blue / red / green / yellow / purple / pink / indigo）
- `sdk`：gradio / streamlit / docker / static
- `sdk_version`：SDK 版本
- `app_file`：入口文件
- `pinned`：是否固定到个人主页
- `license`：开源协议
- `short_description`：简短描述
- `tags`：标签

## Inference Endpoints 选项

### 硬件

| 类型 | 显存 | 适合 |
|---|---|---|
| CPU small / large | 16 / 32 GB RAM | 推理小模型（BERT） |
| NVIDIA T4 | 16GB | 7B 量化推理 |
| NVIDIA A10g | 24GB | 7B FP16 / 13B 量化 |
| NVIDIA A100 40GB | 40GB | 13B / 33B |
| NVIDIA A100 80GB | 80GB | 70B |
| NVIDIA H100 80GB | 80GB | 70B 高吞吐、低延迟 |
| NVIDIA L4 | 24GB | 性价比推理 |

### Engine

| Engine | 适合 | 特性 |
|---|---|---|
| **vLLM** | LLM 推理 | PagedAttention、连续批处理、推理快 |
| **TGI** | LLM 推理（旧） | HF 自研，已被 vLLM 替代 |
| **Transformers** | 通用 / 自定义 | 直接调 transformers 库，灵活但慢 |
| **Custom** | 任意 | 自定义 Docker 镜像 |

### Task 类型

- protected：私有 endpoint（需 token）
- public：公开 endpoint（任何人都可调）

## ZeroGPU 配额与扩展

| 账户类型 | 包含每日配额 | 队列优先级 |
|---|---|---|
| 未登录 | 2 分钟 | 低 |
| 免费账户 | 5 分钟 | 中 |
| PRO | 40 分钟（可扩展） | 最高 |
| Team 成员 | 40 分钟 | 最高 |
| Enterprise 成员 | 60 分钟 | 最高 |

超出配额后用预付费 credits（1 美元 = 10 分钟 GPU 时间）继续。`xlarge` GPU（96GB）消耗 2 倍配额。

## Subscription Plans 对比

| 能力 | Free | PRO（9 美元/月） | Team（按用户） | Enterprise |
|---|---|---|---|---|
| 私有仓库数量 | ~10（动态） | 10 | 不限 | 不限 |
| ZeroGPU 配额 | 5 分钟/天 | 40 分钟/天 | 40 分钟/天 | 60 分钟/天 |
| ZeroGPU Spaces | 2 | 10 | 50/成员 | 50/成员 |
| 团队组织 | ✗ | ✗ | ✅ | ✅ |
| SSO | ✗ | ✗ | ✗ | ✅ |
| Audit Logs | ✗ | ✗ | ✗ | ✅ |
| Storage Regions | 默认（美国） | 默认 | 多区域 | 多区域 |
| Resource Groups | ✗ | ✗ | ✗ | ✅ |
| 优先支持 | ✗ | ✗ | ✅ | ✅ |
| 自定义条款 | ✗ | ✗ | ✗ | ✅ |
| 数据合规（GDPR/HIPAA） | ✗ | ✗ | 部分 | ✅ |

## 常用环境变量

| 变量 | 用途 |
|---|---|
| `HF_TOKEN` / `HUGGING_FACE_HUB_TOKEN` | 鉴权 token |
| `HF_HOME` | 缓存根目录（默认 `~/.cache/huggingface`） |
| `HF_HUB_CACHE` | 仅 Hub 仓库缓存 |
| `HF_DATASETS_CACHE` | 仅 datasets 缓存 |
| `HF_ENDPOINT` | 端点 URL（如 `https://hf-mirror.com`） |
| `HF_HUB_ENABLE_HF_TRANSFER` | 启用 hf_transfer 加速 |
| `HF_HUB_DOWNLOAD_TIMEOUT` | 下载超时（秒） |
| `HF_HUB_DISABLE_PROGRESS_BARS` | 关进度条 |
| `HF_HUB_OFFLINE` | 离线模式（仅读缓存） |
| `TRANSFORMERS_OFFLINE` | transformers 离线模式 |
| `HF_XET_CACHE` | Xet 缓存路径 |

## 与其他平台对比

| 维度 | HF Hub | GitHub | ModelScope | W&B | Kaggle |
|---|---|---|---|---|---|
| 主产物 | 模型 / 数据 / 应用 | 源代码 | 模型 / 数据 | 实验追踪 | 数据竞赛 |
| 大文件 | Xet（无上限） | git-lfs（10GB 限） | 私有 OSS | 不托管 | 不托管 |
| 元数据 | Model Card | README | Model Card | Experiment | Dataset |
| 浏览器内推理 | ✅ Inference widget | ✗ | ✅ | ✗ | ✗ |
| 应用托管 | ✅ Spaces | ✅ Pages | ✅ Studio | ✗ | ✗ |
| 国内访问 | 慢（需镜像） | 慢 | 快 | 快 | 慢 |
| 适合 | AI 协作 | 代码协作 | 国内 AI | 训练追踪 | 数据竞赛 |
| 定价 | 免费 + PRO + Enterprise | 免费 + Team | 免费 | 免费 + 付费 | 免费 |

## 安全清单

1. **Fine-grained Token**：限定仓库范围
2. **GPG 签名 commit**：`huggingface_hub` 支持
3. **Gated Models**：敏感模型需申请 + 审核
4. **私有仓库 + 团队**：企业敏感模型
5. **Malware 扫描**：HF 自动扫公开仓库
6. **不要 commit token**：`.env` 加 `.gitignore`
7. **Webhook secret**：验证回调来源
8. **审计日志**：Enterprise 记录敏感操作
9. **数据合规**：Enterprise 选 Storage Regions
10. **Token 轮换**：定期撤销 + 重新生成

## 常见问题

### Q: HF 平台与 HF Transformers 库什么关系？

A: **平台是协作平台（Hub / Spaces / Endpoints），库是 Python API（pipeline / AutoModel / Trainer）**。两者互补——库帮你训练 / 推理，平台帮你分享 / 部署。本叶讲平台层，Transformers 叶讲库 API。

### Q: 怎么从 git-lfs 迁移到 Xet？

A: 新仓库自动用 Xet。老仓库在 Settings 里可启用 Xet 迁移。Xet 自动分块 + 去重，比 git-lfs 高效（小文件 git，大文件 Xet）。

### Q: Spaces 免费层会 sleep 吗？

A: 会。免费 CPU Space 长时间无访问会 sleep（约 48 小时），首次访问冷启动约 30 秒。PRO 用户可设「Sleep timeout = -1」常驻。

### Q: 模型下载到一半空间不够怎么办？

A: 改缓存路径：`export HF_HOME=/path/to/large/disk`。或用 streaming：`load_dataset(streaming=True)` 不下载。

### Q: 怎么把模型从 Hugging Face 迁移到本地自建？

A: 三步：

1. `hf download user/model --local-dir=./local`
2. 本地用 `transformers` 加载本地路径：`from_pretrained("./local")`
3. 自建推理服务（vLLM / TGI 自部署）

### Q: Hub 上模型权重安全吗？

A: HF 自动扫描公开仓库的恶意代码 / pickle 反序列化攻击。`safetensors` 格式（HF 主推）比 pickle 安全——不可执行任意代码。下载陌生模型优先选 `safetensors` 而非 `.bin`。
