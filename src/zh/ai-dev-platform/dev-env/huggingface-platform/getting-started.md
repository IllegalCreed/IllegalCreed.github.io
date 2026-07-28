---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Hugging Face Hub（截至 2026 年）编写，参考 [huggingface.co/docs/hub](https://huggingface.co/docs/hub/index)

## 速查

- **入口**：[huggingface.co](https://huggingface.co)，注册账号（免费）
- **三类仓库**：Models（模型权重）/ Datasets（数据集）/ Spaces（应用）
- **Git-based**：每个仓库是 git repo，配合 Xet 存大文件
- **CLI 工具**：`hf auth login` / `hf upload` / `hf download`（`huggingface_hub` 包提供，2025 年起取代旧 `huggingface-cli`）
- **Python 客户端**：`pip install huggingface_hub`，提供 `from_pretrained` / `push_to_hub` / `snapshot_download`
- **加载模型**：`AutoModel.from_pretrained("user/repo")`（依赖 transformers 等库）
- **加载数据集**：`load_dataset("user/repo")`（datasets 库）
- **试推理**：模型页右侧 Inference widget，浏览器内调用
- **部署应用**：[huggingface.co/new-space](https://huggingface.co/new-space)，选 Gradio / Streamlit / Docker
- **Model Card**：仓库 README.md，YAML 元数据 + Markdown 描述
- **Inference API**：免费 serverless 推理（限流）
- **Inference Endpoints**：付费专用实例（CPU / GPU A10g / A100 / H100，按小时计费）
- **免费 ZeroGPU**：动态分配 NVIDIA RTX Pro 6000 Blackwell，5 分钟/天配额（PRO 40 分钟）

## Hub 是 AI 的 GitHub

Hugging Face Hub 与 GitHub 的根本差异在于「**模型 / 数据集 / 应用是 AI 的核心产物**，不只是代码」：

| 维度 | GitHub | Hugging Face Hub |
|---|---|---|
| 主产物 | 源代码 | 模型权重 / 数据集 / 应用 |
| 版本控制 | Git | Git + Xet（大文件） |
| 大文件 | git-lfs（10GB 上限） | Xet（自动分块、去重、CDN） |
| 元数据 | README.md | Model Card（YAML + Markdown） |
| 浏览器内执行 | GitHub Codespaces | Inference widget / Spaces |
| 社交功能 | Star / Fork / PR | Likes / Fork / PR / Discussions |
| License | 标准开源协议 | + AI-specific（如 RAIL） |

**含义**：把 GitHub 的工作流（clone / commit / push / PR / Discussions）几乎原样迁移到 HF；但 HF 额外提供 AI 特有的能力（widget 推理、Model Card 元数据、ZeroGPU 算力）。

## 三类仓库

### Models（模型仓库）

托管预训练模型权重 + 配置：

```
user/my-model/
├── config.json              # 模型架构配置
├── model.safetensors        # 主权重（safetensors 格式，比 pickle 安全）
├── pytorch_model.bin        # 旧 PyTorch 权重（兼容）
├── tokenizer.json           # 分词器
├── tokenizer_config.json
├── special_tokens_map.json
├── README.md                # ← Model Card（关键）
└── .gitattributes           # Xet 跟踪规则
```

访问：`https://huggingface.co/user/my-model`

### Datasets（数据集仓库）

托管训练 / 评测数据：

```
user/my-dataset/
├── README.md                # Dataset Card
├── data/
│   ├── train-00000-of-00001.parquet
│   ├── test-00000-of-00001.parquet
│   └── validation-00000-of-00001.parquet
├── dataset_infos.json
└── my_dataset.py            # 旧的 loading script（已不推荐）
```

推荐用 **parquet** 格式（HF Data Studio 直接可视化 / 流式读取）。

### Spaces（应用仓库）

托管交互式应用（demo / 产品）：

```
user/my-space/
├── app.py                   # Gradio / Streamlit 入口
├── requirements.txt
├── README.md                # Space metadata（SDK、硬件）
└── .gitattributes
```

四种 SDK：Gradio / Streamlit / Docker / 静态 HTML。

## 创建账号与登录

### 注册

[huggingface.co/join](https://huggingface.co/join) 用邮箱注册，免费。也可用 GitHub / Google OAuth。

### 命令行登录

```bash
pip install huggingface_hub
hf auth login              # 输入 token 或浏览器 OAuth
hf auth whoami             # 查看当前用户
```

或在 Python 里：

```python
from huggingface_hub import login
login("hf_xxx")            # 或交互式输入
```

### 创建 Access Token

[huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) → New token：

- **Read**：只读，下载公开模型
- **Write**：读写，上传 / 修改自己的仓库
- **Fine-grained**：限定仓库范围与权限（推荐生产）

## 创建第一个仓库

### Web UI 创建

[huggingface.co/new](https://huggingface.co/new)：

1. Owner：选自己或组织
2. Name：仓库名（如 `my-bert-finetune`）
3. License：选开源协议（MIT / Apache-2.0 / RAIL 等）
4. Public / Private

### CLI 创建

```python
from huggingface_hub import create_repo
create_repo("user/my-model", repo_type="model", private=False)
```

## 上传文件

### 方式 1：Web UI（适合小文件）

仓库页 → Files → Add file → Upload / Create new file。

### 方式 2：`hf upload` CLI（推荐）

```bash
# 上传单文件
hf upload user/my-model model.safetensors

# 上传整个目录
hf upload user/my-model ./my-model-dir

# 上传到 dataset 仓库
hf upload user/my-dataset ./data --repo-type=dataset
```

`hf` CLI 自动处理大文件（Xet），无需额外配置。

### 方式 3：Python `upload_folder`

```python
from huggingface_hub import upload_folder

upload_folder(
    repo_id="user/my-model",
    folder_path="./my-model-dir",
    repo_type="model",
    commit_message="Upload model v1",
)
```

### 方式 4：原生 Git（适合熟悉 git 工作流）

```bash
git clone https://huggingface.co/user/my-model
cd my-model

# 大文件需先装 git-xet
git xet install
git xet track "*.safetensors"

cp /path/to/model.safetensors .
git add .
git commit -m "Add model weights"
git push
```

::: warning 2025 年起用 Xet 替代 git-lfs
旧方式需要 `git-lfs install` + `git lfs track "*.bin"`。新仓库默认用 Xet（HF 自研），更高效（分块去重 + CDN 加速）。老仓库仍兼容 git-lfs。
:::

## 下载模型 / 数据集

### 方式 1：浏览器下载

模型页 → Files → 点文件 → Download。

### 方式 2：`hf download` CLI

```bash
# 下载整个仓库到本地缓存
hf download user/my-model

# 指定本地路径
hf download user/my-model --local-dir ./my-model

# 下载单文件
hf download user/my-model model.safetensors --local-dir ./my-model
```

### 方式 3：Python `snapshot_download`

```python
from huggingface_hub import snapshot_download

# 下载到默认缓存（~/.cache/huggingface/hub/）
path = snapshot_download("user/my-model")

# 指定本地目录
path = snapshot_download(
    "user/my-model",
    local_dir="./my-model",
    revision="main",              # 分支 / tag / commit
    allow_patterns=["*.json", "*.safetensors"],  # 只下这些
)

print(path)  # 本地路径
```

### 方式 4：库内置加载（最常用）

```python
# transformers
from transformers import AutoModel, AutoTokenizer
model = AutoModel.from_pretrained("bert-base-uncased")
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

# datasets
from datasets import load_dataset
ds = load_dataset("imdb", split="train")

# diffusers
from diffusers import StableDiffusionPipeline
pipe = StableDiffusionPipeline.from_pretrained("runwayml/stable-diffusion-v1-5")
```

库会自动调 `snapshot_download`，缓存到 `~/.cache/huggingface/hub/`。

## 加速下载（国内网络）

### `hf_transfer`（Rust 加速）

```bash
pip install hf_transfer
export HF_HUB_ENABLE_HF_TRANSFER=1
```

下载速度提升 3-10 倍（多线程 + Rust 实现）。

### 镜像站（hf-mirror.com）

```bash
export HF_ENDPOINT=https://hf-mirror.com
hf download user/my-model
```

国内镜像站，与官方同步，下载快很多。

## Model Card（模型卡）

每个模型仓库的 `README.md` 渲染成 Model Card——含 YAML 元数据 + Markdown 描述。

### YAML 元数据示例

```yaml
---
language:
  - en
  - zh
license: apache-2.0
library_name: transformers
tags:
  - text-generation
  - llama
  - finetune
datasets:
  - HuggingFaceFW/fineweb
metrics:
  - accuracy
base_model: meta-llama/Llama-2-7b-hf
pipeline_tag: text-generation
widget:
  - text: "Hello, my name is"
    example_title: "Example 1"
model-index:
  - name: my-llama
    results:
      - task:
          type: text-generation
        dataset:
          name: ai2_arc
          type: ai2_arc
        metrics:
          - name: ARC (25-shot)
            type: arc
            value: 64.59
---
```

关键字段：

| 字段 | 用途 |
|---|---|
| `license` | 协议（影响商用） |
| `language` | 支持语言（ISO 639-1） |
| `library_name` | 用哪个库加载（transformers / diffusers / peft 等） |
| `tags` | 自由标签（影响发现） |
| `pipeline_tag` | 任务类型（text-generation / image-classification 等，影响 widget） |
| `datasets` | 训练用数据集 |
| `base_model` | 基模型（fine-tune 关系） |
| `widget` | 浏览器内推理示例输入 |
| `model-index` | 评测结果（结构化） |

### Markdown 描述部分

推荐结构（参考 [Model Card Annotated](https://huggingface.co/docs/hub/model-card-annotated)）：

```markdown
# My LLaMA

## Model Description
...（一段话介绍）

## Intended uses & limitations
...（适用场景 + 已知局限）

## Training Data
...（用了哪些数据）

## Training procedure
...（超参 / 硬件 / 训练时长）

## Evaluation Results
| Benchmark | Score |
|---|---|
| ARC | 64.59 |
| MMLU | 56.3 |

## How to use
\`\`\`python
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained("user/my-llama")
\`\`\`

## Ethical considerations / Bias
...
```

## Inference API（免费试用）

每个公开模型页右侧都有 **Inference widget**：

- 输入示例（自动从 `widget` 元数据生成）
- 点 Compute → 调用 serverless 推理
- 返回结果（文本 / 图片 / 概率）

### 编程调用 Inference API

```python
import requests

API_URL = "https://api-inference.huggingface.co/models/bert-base-uncased"
headers = {"Authorization": "Bearer hf_xxx"}

def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

output = query({"inputs": "Hello, [MASK]."})
```

或在 `huggingface_hub` 里：

```python
from huggingface_hub import InferenceClient

client = InferenceClient(token="hf_xxx")
result = client.text_classification("I love HF")
```

::: tip Inference API 限流
免费 serverless 推理有动态 rate limit（基于账户等级）。免费层每分钟几次调用，PRO 更多。生产场景用 Inference Endpoints。
:::

## 第一个 Space

### 创建

[huggingface.co/new-space](https://huggingface.co/new-space)：

1. Space name：`my-demo`
2. License
3. SDK：选 **Gradio**（最简单）/ Streamlit / Docker / Static
4. Hardware：Free CPU / ZeroGPU / 付费 GPU
5. Create

### Gradio 示例

`app.py`：

```python
import gradio as gr
from transformers import pipeline

pipe = pipeline("text-generation", model="gpt2")

def generate(text):
    return pipe(text, max_new_tokens=50)[0]["generated_text"]

demo = gr.Interface(fn=generate, inputs="text", outputs="text")
demo.launch()
```

`requirements.txt`：

```
gradio==4.*
transformers
torch
```

提交后 Space 自动构建并部署，URL 是 `https://user-my-demo.hf.space`。

### ZeroGPU Space（免费 GPU）

创建 Space 时 Hardware 选 ZeroGPU，然后用 `@spaces.GPU` 装饰器声明 GPU 函数：

```python
import spaces
import gradio as gr
from diffusers import DiffusionPipeline

pipe = DiffusionPipeline.from_pretrained("runwayml/stable-diffusion-v1-5").to("cuda")

@spaces.GPU
def generate(prompt):
    return pipe(prompt).images[0]

gr.Interface(fn=generate, inputs="text", outputs="image").launch()
```

GPU 在调用时动态分配（NVIDIA RTX Pro 6000 Blackwell），调用结束释放。免费账户每天 5 分钟配额。

## 下一步

- 入门到此能跑通：注册 → 装 `hf` CLI → 登录 → 上传模型 / 数据集 → 创建 Space → 浏览器试推理
- 进阶内容（见 `guide-line.md`）：
  - Spaces 高级（自定义 Docker、ZeroGPU 配额管理、持久存储、自定义域名）
  - Inference Endpoints 生产部署（autoscaling、自定义容器、私有网络）
  - `huggingface_hub` Python 库高级用法（PR、Discussions、Webhooks）
  - 企业特性（PRO / Team / Enterprise / SSO / Audit Logs）
  - 与 transformers / diffusers / datasets 深度集成
- 参考（见 `reference.md`）：
  - HF CLI 全部命令
  - Model Card / Dataset Card 元数据完整规范
  - 与 GitHub / ModelScope / W&B 的对比
  - 配额与定价表
