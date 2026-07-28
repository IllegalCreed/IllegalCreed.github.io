---
layout: doc
outline: [2, 3]
---

# 进阶指南

> 基于 Google Colab（含 Pro / Pro+ / Pay As You Go + Colab AI）编写，参考 [research.google.com/colaboratory](https://research.google.com/colaboratory/) 与 [colab.research.google.com](https://colab.research.google.com/)

## 速查

- **TPU 运行时**：Runtime → Change runtime type → TPU；免费 TPU v2（8 核心）
- **训练框架**：PyTorch / TensorFlow / JAX 三套都支持；TPU 推荐 JAX / PyTorch-XLA
- **混合精度**：`torch.cuda.amp.autocast()` 或 `tf.keras.mixed_precision.set_global_policy('mixed_float16')`
- **Hugging Face 集成**：`transformers` / `diffusers` / `peft` / `accelerate` 开箱可用
- **LoRA 微调**：`peft` + `bitsandbytes` 8/4-bit 量化，T4 跑 7B 模型
- **Stable Diffusion**：`diffusers` + `xformers`，T4 跑 SDXL-turbo 流畅
- **持久化 Checkpoint**：每 N 步存到 Drive，避免 12 小时墙丢了训练
- **后台执行**：Pro+ / Pay As You Go 才支持，关浏览器也跑
- **Data Science Agent**：Colab AI 的自动化数据分析（Gemini 驱动）
- **代码片段**：左侧「Code snippets」面板，预置常见模式（绘图、训练循环、调 API）
- **Colab Pro A100**：40GB 显存，比 T4 快约 3-5 倍
- **Vertex AI Workbench**：企业版 Colab，更稳定但付费

## GPU 训练实战

### 验证 GPU 与显存

```python
!nvidia-smi
# Wed Jan 15 10:00:00 2026
# +-----------------------------------------------------------------------------+
# | NVIDIA-SMI 535.x       Driver Version: 535.x       CUDA Version: 12.2       |
# |-------------------------------+----------------------+----------------------+
# | GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
# |   0  Tesla T4            Off  | 00000000:00:04.0 Off |                    0 |
# |  0%   35C    P8     9W /  70W |    874MiB / 15360MiB |      0%      Default |
# +-------------------------------+----------------------+----------------------+
```

```python
import torch
print(torch.cuda.is_available())          # True
print(torch.cuda.get_device_name(0))       # 'Tesla T4'
print(torch.cuda.get_device_properties(0)) # _CudaDeviceProperties(name='Tesla T4', major=7, minor=5, total_memory=15360MB)
```

### 混合精度训练

T4 支持 Tensor Core FP16，混合精度可提速 1.5-2 倍、显存减半：

```python
# PyTorch
from torch.cuda.amp import autocast, GradScaler

scaler = GradScaler()
for inputs, targets in dataloader:
    optimizer.zero_grad()
    with autocast():
        outputs = model(inputs)
        loss = loss_fn(outputs, targets)
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```

```python
# TensorFlow
from tensorflow.keras.mixed_precision import set_global_policy
set_global_policy('mixed_float16')
```

### 显存管理

T4 只有 16GB，跑大模型容易 OOM：

```python
# 释放显存
import gc, torch
gc.collect()
torch.cuda.empty_cache()

# 监控显存
print(torch.cuda.memory_allocated() / 1024**3, 'GB allocated')
print(torch.cuda.memory_reserved() / 1024**3, 'GB reserved')
```

## 大模型微调（Hugging Face + PEFT）

T4 跑 7B 模型需要 4-bit 量化：

```python
!pip install -q transformers peft accelerate bitsandatasets

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

model_id = "meta-llama/Llama-2-7b-hf"

# 4-bit 量化
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
)

model = AutoModelForCausalLM.from_pretrained(
    model_id,
    quantization_config=bnb_config,
    device_map="auto",
)
model = prepare_model_for_kbit_training(model)

# 加 LoRA
lora_config = LoraConfig(
    r=8, lora_alpha=16, lora_dropout=0.05,
    target_modules=["q_proj", "v_proj"],
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# trainable params: 4M || all params: 3.5B || trainable%: 0.1%
```

之后用 `Trainer` / `SFTTrainer` 训练，T4 跑约 0.5 it/s。

## Stable Diffusion 推理

```python
!pip install -q diffusers transformers accelerate xformers

from diffusers import StableDiffusionPipeline
import torch

pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16,
).to("cuda")

pipe.enable_xformers_memory_efficient_attention()  # 节省显存

image = pipe("a cat astronaut on mars").images[0]
image.save("/content/drive/MyDrive/cat.png")
```

## TPU 训练（JAX）

TPU 配额虽少但免费，跑 JAX 模型飞快：

```python
import jax
print(jax.devices())  # [TpuDevice(id=0, process_index=0, process_id=0), ... 8 cores]

import jax.numpy as jnp
from jax import grad, jit

@jit
def train_step(params, x, y):
    # ... JAX 训练逻辑
    pass
```

PyTorch 在 TPU 上需要 `torch_xla`：

```python
!pip install torch-xla
import torch_xla.core.xla_model as xm
device = xm.xla_device()
model = model.to(device)
```

## 持久化 Checkpoint

避免 12 小时墙丢了训练：

```python
import os
CKPT_DIR = '/content/drive/MyDrive/checkpoints/'
os.makedirs(CKPT_DIR, exist_ok=True)

# 训练循环里每 N 步存
if step % 500 == 0:
    torch.save({
        'step': step,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'loss': loss.item(),
    }, os.path.join(CKPT_DIR, f'step-{step}.pt'))

# 重启后恢复
ckpt = torch.load(os.path.join(CKPT_DIR, 'step-1000.pt'))
model.load_state_dict(ckpt['model_state_dict'])
optimizer.load_state_dict(ckpt['optimizer_state_dict'])
```

::: tip 用 `accelerate` 自动管理
Hugging Face `accelerate` 库封装了 checkpoint / resume / 多卡逻辑，配合 `TrainingArguments(save_steps=500, output_dir=...)` 一键搞定。
:::

## 后台执行（Pro+ / Pay As You Go）

免费层关浏览器会断；Pro+ / Pay As You Go 支持后台执行：

- 训练 / 推理在 Google 后台跑，关闭浏览器 / 断网都不影响
- 进度在 Drive 上的 `.ipynb` 输出里持久化
- 仍受 24 小时上限

```
Runtime → Change runtime type → Background execution: Enabled（仅付费层）
```

## Colab AI 深度用

### 自然语言生成代码

右侧 Gemini 图标打开聊天框：

```
输入："用 PyTorch 写一个 CIFAR-10 的 ResNet 训练循环，混合精度，每 5 epoch 存一次 checkpoint 到 /content/ckpts/"
→ Gemini 生成完整代码 cell
```

### 选中代码解释 / 修复

- 选中代码 → 右键 → 「Explain selection」→ 自然语言说明
- cell 报错 → 「Explain error」/「Get fix」→ 给修正建议

### Data Science Agent

更高级的 Agent 模式：

```
描述："分析 /content/sales.csv，找出 Top 10 销量商品，画柱状图，导出 PNG 到 Drive"
→ Agent 自动生成 + 执行整套 cell 流水线
```

## 大文件传输优化

### Drive vs GCS vs Hugging Face Datasets

| 方案 | 速度 | 用途 |
|---|---|---|
| Google Drive | 慢（对象存储 + 单文件 HTTP） | 小文件、notebook 自身 |
| Google Cloud Storage | 快（gsutil 并发） | 大数据集 |
| Hugging Face Datasets | 快（CDN + streaming） | 公开 NLP/CV 数据 |
| Kaggle Datasets | 中等 | Kaggle 平台数据 |

### streaming 加载数据集（避免下载）

```python
from datasets import load_dataset
ds = load_dataset('imdb', split='train', streaming=True)
for example in ds:
    print(example['text'][:80])
    break
```

不下载到本地，按需迭代，适合 T4 16GB 显存场景。

### 解压到本地磁盘

```python
!unzip -q /content/drive/MyDrive/data.zip -d /content/data/
# 在 /content/data/ 里操作比直接在 Drive 上快 10 倍
```

## Colab 命令行 / 隐藏功能

### `google.colab` 内置库

```python
from google.colab import (
    drive,         # Drive 挂载
    files,         # 文件上传 / 下载
    auth,          # GCP 鉴权
    output,        # 控制 cell 输出
)

# 上传文件
uploaded = files.upload()      # 弹文件选择
for name, content in uploaded.items():
    with open(name, 'wb') as f:
        f.write(content)

# 下载文件
files.download('/content/result.csv')

# 自定义 JS / HTML 注入
output.eval_js('alert("hi")')
```

### 显示 HTML / JS

```python
from IPython.display import HTML
HTML('<h1 style="color:red">Hi</h1>')
```

### 自定义输出（前端调用）

```python
from google.colab import output

# 注册 Python 函数让 JS 调
@output.register_callback('greet')
def greet(name):
    return f'Hello, {name}!'

# HTML 里调用
output.eval_js('''
  (async () => {
    const r = await google.colab.kernel.invokeFunction('greet', ['Alice']);
    console.log(r.data['text/plain']);
  })()
''')
```

## 与本地工具集成

### Colab 命令行（`colab-cli`）

```bash
pip install colab-cli
colab-cli push my_notebook.ipynb   # 推到 Drive
colab-cli pull my_notebook.ipynb   # 从 Drive 拉
```

### VS Code Colab 扩展

社区扩展 `colab-connector` / `colabcode`：在 VS Code 里直接调 Colab 后端跑 cell，体验类似 GitHub Codespaces。

## 长任务调度方案

Colab 单次最长 24 小时，超长任务怎么办？

| 方案 | 适用 |
|---|---|
| **Checkpoint + Restart** | 每 N 步存 Drive，VM 销毁后从头恢复 |
| **多个 Colab 串联** | 一个 notebook 跑完写文件，下一个接力 |
| **Vertex AI Workbench** | 企业版 Colab，无 24h 限制，按 GCP 计费 |
| **迁到云端 GPU 主机** | AWS / Lambda Cloud / RunPod + JupyterHub |

## 安全与合规

- **敏感数据**：避免上传到 Drive / Colab VM；用 GCS + IAM 权限 + 私有 endpoint
- **API Key**：不要写硬编码；存 Drive 上的 `.env` 文件，或用 Google Secret Manager
- **私有仓库**：clone 用 `https://TOKEN@github.com/...`，token 不要写到 cell 输出
- **日志脱敏**：Colab 输出会持久化到 Drive，注意 PII 泄漏

```python
# 从 Drive 读 .env
!pip install python-dotenv
from dotenv import load_dotenv
load_dotenv('/content/drive/MyDrive/.env')
import os
api_key = os.getenv('OPENAI_API_KEY')
```

## 与本地 / 云 GPU 的取舍

| 场景 | 推荐 |
|---|---|
| 学生学 ML、跑公开 Demo | **Colab 免费层**（T4 够用） |
| 个人研究者跑论文复现 | **Colab Pro**（A100 可申请） |
| 训练 7B-13B 模型（数天） | **Lambda Cloud / RunPod / Vast.ai**（租 A100/H100 按小时） |
| 企业级 MLOps | **Vertex AI / SageMaker**（持久化 + 调度） |
| 团队协作教学 | **JupyterHub**（自建） |
| 移动端 / iPad 临时跑 | **Colab（Web 即用）** |
