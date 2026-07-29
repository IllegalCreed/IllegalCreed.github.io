---
layout: doc
outline: [2, 3]
---

# 核心节点与 KSampler 深度

> 基于 comfyanonymous/ComfyUI 官方文档（docs.comfy.org/built-in-nodes）+ GitHub README 编写，对照最新主线版本行为

## 速查

- 内置节点数据流：**MODEL（UNet）/ CLIP / VAE / CONDITIONING / LATENT / IMAGE** 六类核心张量
- txt2img 链：`CheckpointLoaderSimple → CLIPTextEncode×2 → EmptyLatentImage → KSampler → VAEDecode → SaveImage`
- img2img 链：把 `EmptyLatentImage` 换成 `LoadImage → VAEEncode`，`denoise` 降到 0.3-0.7
- KSampler 甜点：`steps=20-30` / `cfg=6-8` / `sampler_name=dpmpp_2m` / `scheduler=karras`
- 采样器选型：**euler** 快稳 / **euler_ancestral** 富变化 / **dpmpp_2m** 高质量高效率（社区默认）/ **dpmpp_sde** 细节丰富但慢
- 调度器选型：**karras** 普遍比 normal 更锐利 / **exponential** 适合少步数 / **simple** 极简稳定 / **sgm_uniform** SGM 模型专用
- API 三件套：**POST /prompt（提交）+ GET /ws（实时进度，绑定 client_id）+ GET /history/{prompt_id}（取产物）**
- `/object_info` 返回所有节点的输入 / 输出 / 参数定义，是程序化构建 workflow 的基础
- Manager：custom_nodes 全生命周期 + Snapshot + 缺失节点自动检测安装
- Registry：publisher + pyproject.toml + SemVer + 版本不可变 + 自动安全扫描
- 反模式：改上游参数全量重跑 / API 不传 client_id / 直接 git clone 节点不走 Manager / cfg>15 想更贴 prompt / img2img 用 denoise=1.0

## 内置节点数据流

ComfyUI 用**强类型连线**约束节点间的数据流向，核心张量类型有六种：

| 张量类型 | 来源节点 | 含义 |
| --- | --- | --- |
| **MODEL** | CheckpointLoaderSimple / model 风格加载器 | 扩散模型本体（UNet / DiT） |
| **CLIP** | CheckpointLoaderSimple / CLIPLoader | 文本编码器权重 |
| **VAE** | CheckpointLoaderSimple / VAELoader | 潜变量 ↔ 像素解码器 |
| **CONDITIONING** | CLIPTextEncode / 各种 conditioning 节点 | 条件向量（正/负提示词、ControlNet 等） |
| **LATENT** | EmptyLatentImage / VAEEncode / KSampler 输出 | 潜变量张量 |
| **IMAGE** | VAEDecode / LoadImage | 像素图像 |

> 连线类型不匹配会被画布拒绝——这是 ComfyUI 防错的核心机制。

## 必会节点全图鉴

### CheckpointLoaderSimple

加载 `.safetensors` / `.ckpt` 权重，**一次性输出 MODEL / CLIP / VAE 三件套**，是文生图入口。

| 输出 | 用途 |
| --- | --- |
| MODEL | 接 KSampler.model |
| CLIP | 接 CLIPTextEncode.clip |
| VAE | 接 VAEDecode.vae |

> 高级用法可用独立的 `UNETLoader` + `CLIPLoader` + `VAELoader` 三件套分别加载（Diffusion models / 旁挂 VAE）。

### CLIPTextEncode（×2，正/负）

把提示词文本经 CLIP 编码为 CONDITIONING：

- **positive**：正向描述要生成的内容
- **negative**：负向描述不要的内容（模糊、低质量、多余肢体等）

| 输入 | 说明 |
| --- | --- |
| `clip` | 来自 CheckpointLoader |
| `text` | 支持**多行** / **加权** `(word:1.2)` / **动态提示词** |

> 两条 CLIPTextEncode 输出分别接 KSampler 的 `positive` 与 `negative`。

### EmptyLatentImage

生成空白潜变量用于 txt2img：

- `width` / `height`：分辨率（注意必须是 8 的倍数）
- `batch_size`：一次出几张

> img2img 用 `LoadImage → VAEEncode` 替代，**不要**把 EmptyLatentImage 与 VAEEncode 同时接进 KSampler。

### KSampler（核心）

参见下文「KSampler 参数对生成质量的影响」。

### VAEDecode / VAEEncode

| 节点 | 数据流 | 用途 |
| --- | --- | --- |
| **VAEDecode** | LATENT → IMAGE | 把 KSampler 输出的 LATENT 解码成可保存的图像 |
| **VAEEncode** | IMAGE → LATENT | img2img 起点，把输入图像编码进潜空间 |

> VAE 来源不影响 KSampler：可来自 CheckpointLoader，也可来自独立的 `VAELoader`（高画质 VAE 如 `vae-ft-mse-840000`）。

### SaveImage / PreviewImage

| 节点 | 行为 |
| --- | --- |
| **SaveImage** | 保存到 `output/`，PNG 嵌入完整工作流元数据（可拖回复现） |
| **PreviewImage** | 仅临时预览不落盘 |

> 正式生产**同时存 JSON**：PNG 元数据跨平台压缩 / 二次编辑易丢。

## KSampler 参数对生成质量的影响

### seed（种子）

决定噪声起点：**同 seed 同参数必出同图**。开发期固定便于复现；批量出图用 `control_after_generate` 控制变化：

| 取值 | 行为 |
| --- | --- |
| `fixed` | 每次 seed 不变（完全复现） |
| `random` | 每次随机（最大变化） |
| `increment` | +1（轻微变化） |
| `decrement` | -1 |

### steps（步数）

| 步数 | 表现 |
| --- | --- |
| < 15 | 欠采样（细节不足、模糊） |
| **15-30** | 大多数模型甜点 |
| > 40 | 边际收益递减、浪费时间 |

> SDXL Turbo / Flux Schnel 等少步数模型可降到 4-8 步。

### cfg（Classifier-Free Guidance）

| 区间 | 表现 |
| --- | --- |
| 1-4 | 创意强，但偏离 prompt |
| **6-8** | 大多数模型甜点 |
| 10-15 | 偏向 prompt，开始失真 |
| **>15** | 色彩失真、伪影、过饱和（**反模式**） |

> 贴合度不够应靠改写 prompt 或加 LoRA，而非盲目加 cfg。

### sampler_name（采样器）

| 采样器 | 特性 | 适用 |
| --- | --- | --- |
| `euler` | 快、稳、收敛 | 调试、批量出图 |
| `euler_ancestral` | 引入随机性 | 变化感强、艺术性 |
| `dpmpp_2m` | **高质量高效率**（社区默认） | 大多数生产场景 |
| `dpmpp_sde` | 细节丰富但慢 | 最终出图、写实 |
| `ddim` | 老牌稳定、可复现 | 经典复刻 |

### scheduler（调度器）

| 调度器 | 特性 |
| --- | --- |
| `normal` | 默认线性 |
| **`karras`** | 普遍更锐利（社区推荐） |
| `exponential` | 少步数友好 |
| `simple` | 极简稳定 |
| `sgm_uniform` | SGM 模型专用 |

> 经典组合：`dpmpp_2m` + `karras` 是 SDXL 时代的社区默认。

### denoise（重生强度）

| 取值 | 用途 |
| --- | --- |
| **1.0** | txt2img，完全重画 |
| 0.5-0.7 | img2img 经典区，保留结构改风格 |
| 0.3-0.5 | 轻修图、refine |
| < 0.3 | 极轻微调整 |

> img2img 用 denoise=1.0 = 完全抛弃原图重画，**反模式**。

## img2img 工作流

img2img 的核心区别：用输入图像编码进潜空间，并降低 denoise：

```
LoadImage ──→ VAEEncode ──→ LATENT ──→ KSampler (denoise=0.5) ──→ VAEDecode ──→ SaveImage
```

**典型 denoise 区间**：

- 0.7-0.9：风格强烈转换（保留构图，换画法）
- 0.4-0.7：经典 img2img（保留结构 + 改细节）
- 0.1-0.4：细节修复 / upscale 前的细化

> img2img 也要写好正/负 prompt，否则 KSampler 不知道往哪个方向改。

## API 集成三件套

ComfyUI 是**程序化集成友好**的工具，核心模式：

### 1. POST /prompt — 提交工作流入队

```bash
curl -X POST http://localhost:8188/prompt \
  -H "Content-Type: application/json" \
  -d '{"client_id": "abc-123", "prompt": { "节点图 JSON" }}'
```

响应：

- 成功：`{ "prompt_id": "...", "number": <队列位置> }`
- 失败：`{ "error": "...", "node_errors": { ... } }`

### 2. GET /ws — WebSocket 实时进度

绑定 `client_id` 收事件：

| 事件类型 | 含义 |
| --- | --- |
| `status` | 队列状态变化 |
| `execution_start` | 开始执行 |
| `execution_cached` | 缓存节点跳过 |
| `executing` | 节点执行中（含 node id） |
| `progress` | 单节点内进度（steps / value / max） |
| `executed` | 节点完成（含输出 image 名） |

> **client_id 必须与 /prompt 提交时一致**，否则收不到本客户端的进度，甚至收到别人的事件。

### 3. GET /history/{prompt_id} — 取最终产物

```bash
curl http://localhost:8188/history/<prompt_id>
# 输出含 images 列表，再用 GET /view?filename=...&subfolder=... 拉图
```

### 其他管理端点

| 端点 | 作用 |
| --- | --- |
| `GET /object_info` 与 `/object_info/{node_class}` | 所有节点的输入 / 输出 / 参数定义 |
| `GET /queue` | 看当前队列 |
| `POST /queue` | 清队列（`{"delete": ["all"]}` / `["queue"]` / `["history"]`） |
| `POST /interrupt` | 中断当前执行的节点 |
| `POST /free` | 卸载模型释放显存（`{"unload_models": true, "free_memory": true}`） |
| `GET /view` | 取生成的图像（按 filename + subfolder + type） |

> `/object_info` 是**程序化构建 workflow 的基础**：动态拼接节点图前必须读它，否则会写出参数名错误的 prompt。

## ComfyUI-Manager

第三方（已收录官方文档）扩展，在 `custom_nodes/` 之上提供全生命周期治理：

| 能力 | 说明 |
| --- | --- |
| **节点安装 / 更新 / 禁用 / 删除** | UI 化管理，无需手敲 git |
| **模型下载** | 直达常见模型源（HF / Civitai） |
| **Snapshot 保存与恢复** | 记录所有 custom_nodes 的版本组合，可整体回滚 |
| **缺失节点自动检测安装** | 拖入 workflow JSON 时自动识别缺哪个 |

CLI 标志：

- `--enable-manager`（默认开）
- `--enable-counselor-ui`（新 UI）
- `--enable-manager-legacy-ui`（旧 UI）
- `--disable-manager-ui`（关 UI 但保留后端能力）

> 直接 git clone 到 `custom_nodes/` 不走 Manager 缺版本治理、缺缺失节点检测，**能用 Manager 就用 Manager**。

## ComfyUI Registry

[registry.comfy.org](https://registry.comfy.org/) 是公共自定义节点集合，是 Manager 的数据源：

| 机制 | 说明 |
| --- | --- |
| **publisher** | 开发者注册身份（必填） |
| **pyproject.toml** | 写 publisher 标识（必填） |
| **SemVer** | 语义化版本（major.minor.patch） |
| **版本不可变** | 已发布版本不能改，必须发新版 |
| **可 deprecate** | 标记弃用但不删除 |
| **自动安全扫描** | 检测 pip wheel / 系统调用等恶意行为（**非 100% 拦截**） |

> 发布自定义节点走 Registry = 给节点全局唯一名 + SemVer + 不可变版本 + 安全扫描，让他人可精确锁定版本复现。

## 反模式（避坑）

- **改上游参数让全图重算**：把要扫的参数放最末端（如 KSampler 之后再分叉），否则改 seed/checkpoint 这类上游节点会让下游全部失效
- **API 集成不用 client_id 或用错**：/ws 与 /prompt 通过 client_id 绑定会话；不传或乱传 → 收不到进度 / 收到别人事件 / /history 关联错
- **直接 git clone 节点到 custom_nodes/ 不走 Manager**：缺版本治理、缺缺失节点检测；与他人协作时复现性差
- **把 cfg 调到 15+ 想「更贴 prompt」**：过高反而损质量（色彩失真、伪影、过饱和）；应在 6-8 区间，靠 prompt 改写或 LoRA 解决贴合度
- **img2img 用 denoise=1.0**：等于完全抛弃原图重画，img2img 失去意义；典型应 0.3-0.7
- **发布节点不写 publisher / 不走 Registry**：节点名可能冲突，他人无法精确锁定版本，缺安全扫描
- **用 `--disable-api-nodes` 后又抱怨没外部模型**：开了它就只剩本地模型路径，GPT-Image-1 / Flux Pro / Nano Banana 等 API Nodes 全失效
- **工作流只存 PNG 元数据不存 JSON**：PNG 元数据跨平台压缩 / 二次编辑易丢；正式生产应 JSON + PNG 双存
- **频繁手动 reload 大模型**：打断 Smart memory management 的调度策略，反而更慢
- **忽视 node 缺失提示**：拖入 workflow JSON 时如果有节点没装，应通过 Manager 安装而非跳过

## 下一步

- [参考](./reference.md)：完整节点参数表、采样器/调度器对照、API 端点速查、官方资源
