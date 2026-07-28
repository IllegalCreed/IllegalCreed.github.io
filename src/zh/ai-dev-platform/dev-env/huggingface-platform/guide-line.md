---
layout: doc
outline: [2, 3]
---

# 进阶指南

> 基于 Hugging Face Hub + Inference Endpoints + Spaces ZeroGPU 编写，参考 [huggingface.co/docs/inference-endpoints](https://huggingface.co/docs/inference-endpoints/index) 与 [huggingface.co/docs/hub/spaces-zerogpu](https://huggingface.co/docs/hub/spaces-zerogpu)

## 速查

- **Inference Endpoints**：付费专用推理实例（CPU / GPU A10g / A100 80GB / H100 / T4），按小时计费
- **Autoscaling**：流量自动扩缩容（最小 0 实例 = 空闲不收费）
- **Custom Container**：自定义 Docker 镜像，支持任意框架（vLLM / TGI / TensorRT-LLM）
- **ZeroGPU Spaces**：动态分配 NVIDIA RTX Pro 6000 Blackwell GPU（48GB / 96GB），按用量计费
- **PRO 订阅**：9 美元/月，40 分钟/天 ZeroGPU、10 个 ZeroGPU Spaces、10 个私有仓库
- **Storage Buckets**：S3-like 对象存储，用于非版本化的大文件（checkpoint、log）
- **Webhooks**：仓库变更触发外部回调（CI / 通知）
- **Datasets Server / Data Studio**：浏览器内查看与查询数据集
- **Pull Requests / Discussions**：协作 review，类似 GitHub
- **Collections**：把相关仓库分组（论文、benchmark、主题）
- **Paper Pages**：arXiv 论文与 Hub 上对应模型 / 数据集关联
- **Jobs**：在 HF 上跑训练 / 评测任务（新功能）

## Inference Endpoints：生产部署

Inference Endpoints 是 HF 的「**Serverless GPU 推理 + 托管专用实例**」服务——把任意 Hub 模型部署成生产级 HTTP API。

### 核心特性

| 特性 | 说明 |
|---|---|
| 完全托管基础设施 | 不需要管 K8s、CUDA 版本、VPN |
| Autoscaling | 流量自动扩容，缩容到 0（空闲不收费） |
| 多硬件 | CPU / NVIDIA T4 / A10g / A100 40GB / A100 80GB / H100 |
| 多区域 | AWS us-east-1 / eu-west-1 / 等 |
| 内置引擎 | vLLM / TGI / Transformers / 自定义 Docker |
| 私有网络 | VPC endpoint / 网关 |
| 与 Hub 无缝集成 | 仓库更新自动同步 |

### 创建一个 Endpoint

UI：[huggingface.co/new-endpoint](https://huggingface.co/new-endpoint)（或 [endpoints.huggingface.co](https://endpoints.huggingface.co)）：

1. **Model**：选 Hub 上的模型（如 `meta-llama/Llama-2-7b-hf`）
2. **Provider / Region**：选 AWS / GCP / Azure 的 region
3. **Instance type**：选硬件（CPU / GPU 型号 + 显存）
4. **Engine**：vLLM（推荐 LLM）/ TGI（旧版 LLM）/ Transformers（通用）/ Custom（自建镜像）
5. **Autoscaling**：min replicas / max replicas
6. **Advanced**：环境变量、安全组、JWT auth、私有网络

或在 Python 里：

```python
from huggingface_hub import HfApi
api = HfApi()

api.create_inference_endpoint(
    name="my-llama",
    repository="meta-llama/Llama-2-7b-hf",
    framework="pytorch",
    accelerator="gpu",
    instance_type="aws/g5.2xlarge",      # A10g
    region="us-east-1",
    type="protected",
)
```

### 调用 Endpoint

部署完成后得到 URL（如 `https://xxx.us-east-1.aws.endpoints.huggingface.cloud`）：

```python
import requests

url = "https://xxx.us-east-1.aws.endpoints.huggingface.cloud"
headers = {"Authorization": "Bearer hf_xxx"}

response = requests.post(
    url,
    headers=headers,
    json={"inputs": "Hello, my name is", "parameters": {"max_new_tokens": 50}}
)
print(response.json())
```

或在 `InferenceClient`：

```python
from huggingface_hub import InferenceClient

client = InferenceClient(model="https://xxx.us-east-1.aws.endpoints.huggingface.cloud", token="hf_xxx")
output = client.text_generation("Hello", max_new_tokens=50)
```

### Autoscaling 与计费

- **min replicas = 0**：完全 serverless，空闲不收费（冷启动约 30 秒）
- **min replicas = 1**：常驻 1 个实例，无冷启动（按 24x7 收费）
- **按秒计费**（最低按分钟），价格参考：

| 硬件 | 价格（USD/小时） |
|---|---|
| CPU small | ~0.06 |
| CPU large | ~0.12 |
| NVIDIA T4 16GB | ~0.6 |
| NVIDIA A10g 24GB | ~1.0 |
| NVIDIA A100 40GB | ~4.0 |
| NVIDIA A100 80GB | ~6.0 |
| NVIDIA H100 80GB | ~10.0 |

实际价格随 region / provider 浮动。

### Custom Container

默认引擎（vLLM / TGI）覆盖大部分场景，自定义需求（TensorRT-LLM / TRT-VLM / 自研推理框架）用 custom container：

```dockerfile
# Dockerfile in your Space or repo
FROM nvidia/cuda:12.2.0-runtime-ubuntu22.04

RUN pip install my_inference_engine

COPY serve.py /
CMD ["python", "/serve.py"]
```

Endpoint 配置里选「Custom image」，指向你的 Dockerfile 仓库。

## Spaces 进阶

### ZeroGPU：免费动态 GPU

ZeroGPU 是 2024 年起 HF 推出的「**GPU 池化**」方案——一个 NVIDIA RTX Pro 6000 Blackwell GPU 集群，多个 Space 共享，调用时动态分配：

| GPU size | 显存 | 配额成本 |
|---|---|---|
| `large`（默认） | 半卡 48GB | 1x |
| `xlarge` | 全卡 96GB | 2x |

每个账户的每日配额（reset 24h 后）：

| 账户类型 | 配额 | 队列优先级 |
|---|---|---|
| 未登录 | 2 分钟 | 低 |
| 免费账户 | 5 分钟 | 中 |
| PRO | 40 分钟（可扩展） | 最高 |
| Team 成员 | 40 分钟 | 最高 |
| Enterprise 成员 | 60 分钟 | 最高 |

超出配额后 PRO / Team / Enterprise 可用预付费 credits（每 10 分钟 1 美元）继续。

### ZeroGPU Space 代码

```python
import spaces
import gradio as gr
from diffusers import DiffusionPipeline
import torch

# 模块级加载（PyTorch CUDA 仿真模式，无真实 GPU）
pipe = DiffusionPipeline.from_pretrained(
    "stabilityai/sdxl-turbo",
    torch_dtype=torch.float16,
).to("cuda")

@spaces.GPU(duration=45)        # 请求 45 秒 GPU 时间
def generate(prompt):
    return pipe(prompt, num_inference_steps=4).images[0]

# xlarge 显存（96GB）
@spaces.GPU(size="xlarge")
def generate_big(prompt):
    return big_pipe(prompt).images[0]

# 动态 duration
def estimate_duration(steps):
    return steps * 1.5

@spaces.GPU(duration=estimate_duration)
def generate_dynamic(prompt, steps):
    return pipe(prompt, num_inference_steps=steps).images[0]

gr.Interface(fn=generate, inputs="text", outputs="image").launch()
```

::: warning ZeroGPU 限制
- 仅支持 **Gradio SDK**（Streamlit / Docker 不行）
- 不支持 `torch.compile`（用 PyTorch ahead-of-time 编译替代）
- PyTorch 版本：2.8.0 - latest
- Python：3.10 / 3.12
- 兼容大部分 transformers / diffusers Spaces
:::

### 持久存储（Persistent Storage）

Space 默认 ephemeral（重启丢文件）。要持久化数据（用户上传、缓存、SQLite）开 Persistent Storage：

```
Space Settings → Persistent Storage → 选大小（20GB / 50GB / ...）
```

挂载到 `/data/`，跨重启保留。价格：约 5 美元/月（20GB）。

### 自定义域名

付费 Space 可绑自定义域名：

```
Space Settings → Domains → Add domain
```

HF 提供 SSL 证书自动续期。

### Space 状态与 Sleep

免费 CPU Space 长时间无访问会 sleep（节省资源）；首次访问冷启动约 30 秒。要常驻可用 PRO + 「Sleep timeout」设为 -1。

## huggingface_hub Python 库

### 仓库操作

```python
from huggingface_hub import (
    HfApi, Repository, snapshot_download,
    create_repo, upload_folder, upload_file,
    list_models, list_datasets, list_spaces,
    model_info, dataset_info,
    create_branch, create_tag, delete_branch,
    create_commit, create_pull_request,
    get_discussion_details, add_comment,
)

api = HfApi()

# 列模型（按过滤条件）
models = api.list_models(
    filter="text-generation",
    sort="downloads",
    direction=-1,
    limit=10,
)
for m in models:
    print(m.id, m.downloads)

# 创建 PR
api.create_pull_request(
    repo_id="user/model",
    title="Update README",
    description="Add usage example",
    token="hf_xxx",
)
```

### `push_to_hub`（库集成）

主流库都集成了 `push_to_hub`：

```python
# transformers Trainer
trainer.push_to_hub()

# transformers 模型 / 分词器
model.push_to_hub("user/my-model")
tokenizer.push_to_hub("user/my-model")

# datasets
ds.push_to_hub("user/my-dataset")

# peft adapter
model.push_to_hub("user/my-lora")
```

一行代码把对象序列化并上传到 Hub。

### Webhooks

仓库变更（push、PR、Discussion）触发外部回调：

```python
api.add_webhook(
    repo_id="user/model",
    url="https://my-server.com/hf-webhook",
    events=["push", "pull_request"],
    token="hf_xxx",
)
```

或 Web UI：仓库 Settings → Webhooks。常见用法：CI 自动重新部署、Slack 通知、训练 pipeline 触发。

## 数据集高级

### Data Studio（浏览器内查看）

[huggingface.co/datasets](https://huggingface.co/datasets) 任意数据集 → 点 "Data" tab，可视化：

- 表格视图（前 100 行）
- 列统计 / 直方图
- SQL 查询（HF 数据集服务端执行）
- 过滤 / 排序 / 切片

### Streaming（流式加载，不下载）

```python
from datasets import load_dataset

ds = load_dataset("HuggingFaceFW/fineweb", split="train", streaming=True)
for example in ds:
    print(example["text"][:80])
    break
```

不下到本地，按需迭代。适合 100GB+ 大数据集。

### 自定义加载脚本（已不推荐）

旧 dataset 用 `.py` 加载脚本，HF 现在推荐用 **parquet + README.md 元数据**：

```
my-dataset/
├── README.md
└── data/
    ├── train-00000.parquet
    └── test-00000.parquet
```

README.md YAML：

```yaml
---
configs:
  - config_name: default
    data_files:
      - split: train
        path: data/train-*
      - split: test
        path: data/test-*
---
```

`load_dataset("user/my-dataset")` 自动识别。

## 企业能力

### PRO / Team / Enterprise 三档

| 能力 | Free | PRO（9 美元/月） | Team（按用户） | Enterprise |
|---|---|---|---|---|
| 私有仓库 | 有限 | 10 | 不限 | 不限 |
| ZeroGPU 配额 | 5 分钟/天 | 40 分钟/天 | 40 分钟/天 | 60 分钟/天 |
| ZeroGPU Spaces | 2 | 10 | 50/成员 | 50/成员 |
| 团队组织 | ✗ | ✗ | ✅ | ✅ |
| SSO | ✗ | ✗ | ✗ | ✅ |
| Audit Logs | ✗ | ✗ | ✗ | ✅ |
| Storage Regions | 默认 | 默认 | 多区域 | 多区域 |
| Resource Groups | ✗ | ✗ | ✗ | ✅ |
| 私有部署 | ✗ | ✗ | ✗ | ✅（HF Enterprise Cloud） |

### Storage Regions

Enterprise / Team 可选数据存储区域（欧盟 / 美国），满足 GDPR 等合规要求。

### Resource Groups

Enterprise 可创建资源组（GPU 配额、Inference Endpoints、Spaces 分组），用于多团队隔离。

### Audit Logs

记录所有敏感操作（谁在何时做了什么）——读 / 写仓库、改设置、删 token 等，导出 SIEM。

## Storage Buckets（新功能）

类似 AWS S3 的对象存储，用于**非版本化**的大文件（训练 checkpoint、log、artifact）：

```
my-bucket/
├── checkpoint-1000.pt
├── checkpoint-2000.pt
└── logs/...
```

- 与 Git 仓库不同：buckets 不追踪历史，是 mutable 存储
- 内容寻址（content-addressable），自动去重
- 与 Xet 同后端
- 价格：~0.1 美元/GB/月

## Jobs（新功能）

在 HF 上跑训练 / 评测任务：

```python
# 简化示例
api.create_job(
    name="fine-tune-bert",
    image="huggingface/transformers-pytorch-gpu:latest",
    command="python train.py --output /data",
    hardware="aws/g5.2xlarge",
    bucket="my-bucket",
)
```

类似 Modal / Replicate 的 serverless GPU 任务，按秒计费。

## 安全最佳实践

1. **细粒度 Token**：用 fine-grained token 限定仓库范围，避免被泄漏后波及所有仓库
2. **GPG 签名 commit**：`api.set_access_token_gpg(...)` 让 commit 可验证身份
3. **Malware 扫描**：HF 自动扫描上传的 Python / pickle 文件，公开仓库尤其注意
4. **Gated Models**：敏感模型设为「gated」，下载需申请 + 审核
5. **私有仓库 + 团队**：企业模型用 Team / Enterprise 私有部署
6. **不要 commit token**：`.env` 加到 `.gitignore`，token 走环境变量
7. **Webhook secret**：外部回调用 secret 验证来源

## 与其他平台对比

| 平台 | 定位 | 与 HF 差异 |
|---|---|---|
| **GitHub** | 代码托管 | HF 是 AI 产物（模型 / 数据 / 应用）托管 |
| **ModelScope（阿里）** | 国内 AI 模型平台 | 国内访问快，但生态规模小；HF 国际主流 |
| **Weight & Biases** | 训练追踪 / 实验管理 | W&B 重实验跟踪，HF 重产物分发 |
| **Kaggle** | 数据竞赛 | Kaggle 重竞赛，HF 重生态协作 |
| **Modal / Replicate** | Serverless GPU 任务 | HF Jobs 是同类，但 HF 还有 Hub / Spaces |
| **Roboflow** | CV 数据集 + 训练 | Roboflow 重 CV 工作流，HF 通用 |
| **Vertex AI / SageMaker** | 企业 ML 平台 | HF Enterprise 是竞品 |

## 性能与配额

### 下载加速

- `pip install hf_transfer` + `HF_HUB_ENABLE_HF_TRANSFER=1`：多线程，速度 3-10x
- 国内用 `HF_ENDPOINT=https://hf-mirror.com` 镜像
- 大模型先看仓库 README 是否有「量化版」（4-bit / 8-bit）减小下载量

### 上传加速

- 用 `hf upload`（自动并行）而非原生 git push
- 大文件用 Xet（仓库自动启用）
- 避免上传 `__pycache__` / `.DS_Store` 等（`.gitignore`）

### Hub 配额

- 免费：私有仓库数量有限（约 5-10 个）
- 公开仓库：无数量限制
- 大文件单仓库：默认 50GB（可申请扩容）
- 推理 API：免费层每分钟几次，PRO 更多

## 常见问题

### Q: 怎么从 ModelScope 迁移到 HF？

A: 大部分模型 ID 一一对应（如 `ZhipuAI/chatglm3-6b`）。下载 ModelScope 模型权重，按 HF 目录结构上传到自己的 HF 仓库，写 Model Card（library_name: transformers）。开源库（如 `modelscope`）已与 HF API 对齐。

### Q: 模型下载到一半失败了？

A: HF 默认断点续传（缓存机制）。重新运行下载命令会从断点继续。也可设 `HF_HUB_DOWNLOAD_TIMEOUT=120` 加长超时。

### Q: Space 访问很慢 / 启动很慢？

A: 几个原因：

- 免费层 CPU 实例启动慢（约 30 秒）+ sleep 后冷启动
- `requirements.txt` 装很多包，每次构建慢
- 模型权重在 Space 里下载慢 → 用 `hf_transfer` 或预下载到 Persistent Storage

### Q: 模型下载到哪？

A: 默认 `~/.cache/huggingface/hub/`，按 `models--user--repo` 结构。改路径用 `HF_HOME` 或 `transformers_cache` 环境变量。

### Q: 私有模型怎么部署到 Inference Endpoint？

A: Endpoint 配置时填私有模型 ID，HF 用你的 token 自动鉴权下载。Endpoint 部署的实例只对该账户可见。
