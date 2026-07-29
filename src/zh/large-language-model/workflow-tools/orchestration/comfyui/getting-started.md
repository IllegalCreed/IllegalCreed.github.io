---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 comfyanonymous/ComfyUI 官方文档（docs.comfy.org）+ GitHub README 编写，对照最新主线版本行为

## 速查

- 定位：**节点式（graph）AI 生成工作流编排工具**，GPL-3.0，本地自托管优先；图像 / 视频 / 音频 / 3D 全模态
- 最小 txt2img 工作流：**CheckpointLoaderSimple → CLIPTextEncode（正/负）→ EmptyLatentImage → KSampler → VAEDecode → SaveImage**
- KSampler 关键参数：`seed`（噪声起点，0 – 18446744073709551615）、`steps`（默认 20，常用 15-30）、`cfg`（默认 8.0，甜点 6-8）、`sampler_name`（euler / dpmpp_2m / euler_ancestral / dpmpp_sde）、`scheduler`（normal / karras / exponential / simple）、`denoise`（1.0=txt2img，<1.0=img2img）
- denoise 一句话：**1.0 = 全重生（txt2img），0.X = 部分保留原图（img2img / refine）**
- 安装方式：**Desktop（Win/macOS，最易）/ comfy-cli / Windows Portable / git clone + PyTorch / Docker / Comfy Cloud**
- CLI 关键参数：`--cpu` / `--preview-method auto|taesd` / `--disable-api-nodes` / `--tls-keyfile` / `--tls-certfile` / `--enable-counselor-ui` / `--disable-manager-ui`
- 智能显存管理：最低 **1GB VRAM** 也能跑 SDXL/Flux；**别频繁 reload 打断调度**
- 工作流复现：JSON 存档 + PNG/WebP/FLAC 元数据嵌入；拖回画布即恢复
- 与 A1111 边界：A1111 表单式 UI（新手友好）；ComfyUI 节点图（复杂管线强）
- 与 Diffusers 边界：Diffusers 是 Python 代码 API；ComfyUI 是可视化 + 节点封装

## ComfyUI 是什么

ComfyUI 是 comfyanonymous 维护的开源（GPL-3.0）AI 生成工作流编排工具，核心由三部分构成：

- **可视化节点图**：用户在画布上把「Checkpoint 加载、CLIP 编码、采样、VAE 解码、保存」等节点用带类型约束的连线接起来，形成 DAG（有向无环图）
- **异步队列**：执行时按拓扑顺序跑节点，且**只重算变化节点上游的子图**——改最末端的 seed 不会让上游 Checkpoint / CLIP 重算
- **智能内存管理**：自动在 GPU / CPU 间 offload 模型，最低 1GB VRAM 也能跑大模型，无需手动 reload

> ComfyUI 不是只跑 Stable Diffusion — 视频（SVD / Mochi / LTX / Hunyuan / Wan）、音频（Stable Audio / ACE Step）、3D（Hunyuan3D 2.0）都已原生支持。

## 最小 txt2img 工作流

入门第一步是把下面这 6 个节点连起来：

```
CheckpointLoaderSimple
   ├─ MODEL  ───────────┐
   ├─ CLIP ─┬─ CLIPTextEncode (positive) ──┐
   │        └─ CLIPTextEncode (negative) ──┤
   └─ VAE ─────────────────────────────────┤
                                            ↓
EmptyLatentImage (LATENT) ──────────→ KSampler ─→ VAEDecode ─→ SaveImage
```

| 节点 | 作用 | 关键参数 |
| --- | --- | --- |
| **CheckpointLoaderSimple** | 加载 `.safetensors` / `.ckpt` 模型权重，输出 MODEL / CLIP / VAE 三件套 | `ckpt_name` 选模型文件 |
| **CLIPTextEncode**（×2） | 把文本提示词经 CLIP 编码为 CONDITIONING；两条支路分别是 positive / negative | `text` 写 prompt（支持多行 / 加权 `(word:1.2)`） |
| **EmptyLatentImage** | 生成空白潜变量，文生图起点 | `width` / `height` / `batch_size` |
| **KSampler** | 核心去噪采样节点 | `seed` / `steps` / `cfg` / `sampler_name` / `scheduler` / `denoise` |
| **VAEDecode** | LATENT → IMAGE | 接 CheckpointLoader 输出的 VAE |
| **SaveImage** | 保存到 `output/`，PNG 嵌入工作流元数据 | `filename_prefix` |

> img2img 把 `EmptyLatentImage` 换成 `LoadImage → VAEEncode`，并把 KSampler 的 `denoise` 降到 0.3-0.7。

## KSampler 速查

KSampler 是 ComfyUI 的核心节点，参数决定生成质量：

| 参数 | 含义 | 典型值 |
| --- | --- | --- |
| `seed` | 随机种子（噪声起点） | 0 – 18446744073709551615 |
| `control_after_generate` | 跑完后怎么改 seed | `fixed` / `random` / `increment` / `decrement` |
| `steps` | 去噪步数 | 15-30（太少欠采样、太多浪费） |
| `cfg` | Classifier-Free Guidance 强度 | **6-8**（>15 易失真） |
| `sampler_name` | 采样器 | `euler` / `euler_ancestral` / `dpmpp_2m` / `dpmpp_sde` / `ddim` |
| `scheduler` | 步长调度 | `normal` / `karras` / `exponential` / `simple` / `sgm_uniform` |
| `denoise` | 重生强度 | **1.0 = txt2img，<1.0 = img2img / refine** |

> `control_after_generate=fixed` + 固定 seed 是可复现工作流的基础；批量出图用 `random` / `increment`。

## 安装方式

| 方式 | 命令 / 入口 | 适用 |
| --- | --- | --- |
| **Desktop** | [官方下载](https://docs.comfy.org/get_started/local_install) | Win/macOS 新手首选，自带 Python/PyTorch |
| **comfy-cli** | `pip install comfy-cli && comfy install` | 跨平台、可脚本化 |
| **Windows Portable** | GitHub Release 解压即用 | NVIDIA/AMD/Intel，免装环境 |
| **手动 git clone** | `git clone https://github.com/comfyanonymous/ComfyUI` + PyTorch + `pip install -r requirements.txt` | 完全可控，老玩家 |
| **Docker** | 官方镜像 / 自写 Dockerfile | 服务端部署首选 |
| **Comfy Cloud** | [comfy.org/cloud](https://www.comfy.org/cloud) | 无本地 GPU 时的官方云 |

> 入门选 Desktop 或 comfy-cli；线上服务用 Docker；纯小白出图也可看 Comfy Cloud。

## 关键 CLI 参数

| 参数 | 作用 |
| --- | --- |
| `--cpu` | 强制 CPU 模式（无 GPU 时） |
| `--preview-method auto\|taesd` | 潜变量预览方式 |
| `--disable-api-nodes` | 关掉付费外部模型（GPT-Image-1 / Flux Pro / Nano Banana 等 API Nodes） |
| `--tls-keyfile` / `--tls-certfile` | 启用 HTTPS |
| `--front-end-version` | 切换前端版本 |
| `--enable-manager` / `--enable-counselor-ui` / `--disable-manager-ui` | Manager 启停与 UI 形态 |

> `--disable-api-nodes` 是一刀切开关：开了就只剩本地模型路径，所有付费外部模型节点失效。

## 工作流复现机制

ComfyUI 的可复现性建立在三套机制上：

- **JSON 存档**：完整的节点图序列化（API 格式与 UI 格式两份），是正式生产存档
- **PNG/WebP/FLAC 元数据嵌入**：把 JSON 工作流嵌入图像文件元数据；拖回画布即恢复节点图
- **ComfyUI-Manager Snapshot**：保存当前所有 custom_nodes 的版本组合，可整体回滚

> 正式生产应 **JSON + PNG 双存**：PNG 元数据跨平台压缩 / 二次编辑易丢，单存 PNG 不够。

## 与同类的边界

### vs AUTOMATIC1111 (A1111) WebUI

| 维度 | A1111 | ComfyUI |
| --- | --- | --- |
| UI 形态 | Gradio **表单** | 节点**图** |
| 上手 | 新手快 | 学习曲线陡 |
| 复杂管线 | 弱 | 极强 |
| 工作流复现 | txt2img 参数 | 整张节点图 |
| 适用 | 纯小白快速出图 | 生产 / 批量 / 高级控图 |

### vs Diffusers 库

| 维度 | Diffusers | ComfyUI |
| --- | --- | --- |
| 形态 | HuggingFace Python 库 | 可视化 + 节点封装 |
| 灵活性 | 最高（代码级 API） | 受节点能力约束（可写自定义节点扩展） |
| 上手 | 需写代码 | 拖拽即用 |
| 互斥吗 | 否（不少 custom_nodes 内部用 Diffusers） | — |

## 下一步

- [核心节点与 KSampler 深度](./guide-line.md)：内置节点全图鉴、KSampler 参数对生成质量的影响、API 集成三件套、Manager / Registry 治理、反模式
- [参考](./reference.md)：完整节点参数表、采样器/调度器对照、API 端点速查、官方资源
