---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 comfyanonymous/ComfyUI 官方文档（docs.comfy.org）+ GitHub README 编写，对照最新主线版本行为

## 速查

- 定位：**节点式 AI 生成工作流编排**（GPL-3.0），本地自托管优先
- 核心张量类型：**MODEL / CLIP / VAE / CONDITIONING / LATENT / IMAGE**
- txt2img 链：`CheckpointLoaderSimple → CLIPTextEncode×2 → EmptyLatentImage → KSampler → VAEDecode → SaveImage`
- KSampler 甜点：`steps=20-30` / `cfg=6-8` / `dpmpp_2m+karras` / `denoise=1.0(txt2img) / 0.3-0.7(img2img)`
- API 三件套：`POST /prompt` + `GET /ws（client_id 绑定）` + `GET /history/{prompt_id}`
- 其他端点：`/object_info` / `/queue` / `/interrupt` / `/free` / `/view`
- Manager：custom_nodes 全生命周期 + Snapshot 复现 + 缺失节点检测
- Registry：publisher + pyproject.toml + SemVer + 版本不可变 + 安全扫描
- 工作流复现：JSON 存档 + PNG/WebP/FLAC 元数据嵌入
- 最低显存：1GB VRAM（Smart memory management 自动 offload）
- 许可证：GPL-3.0（商用需注意衍生作品须 GPL 兼容）
- 完整说明见 [入门](./getting-started.md) / [核心节点与 KSampler 深度](./guide-line.md)

## 内置节点参数表

### CheckpointLoaderSimple

| 参数 | 说明 |
| --- | --- |
| `ckpt_name` | 模型文件名（`.safetensors` / `.ckpt`，位于 `models/checkpoints/`） |

| 输出 | 接到 |
| --- | --- |
| `MODEL` | KSampler.model |
| `CLIP` | CLIPTextEncode.clip |
| `VAE` | VAEDecode.vae / VAEEncode.vae |

### CLIPTextEncode

| 参数 | 说明 |
| --- | --- |
| `text` | 提示词（支持多行 / 加权 `(word:1.2)` / 动态提示词） |
| `clip` | 来自 CheckpointLoader 或独立 CLIPLoader |

| 输出 | 接到 |
| --- | --- |
| `CONDITIONING` | KSampler.positive 或 KSampler.negative |

### EmptyLatentImage

| 参数 | 典型值 |
| --- | --- |
| `width` | 512 / 1024（SDXL 时代） |
| `height` | 512 / 1024 |
| `batch_size` | 1-4 |

> 宽高需为 8 的倍数；SDXL 推荐 1024×1024 或 832×1216 等比例。

### KSampler

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `model` | MODEL | 来自 Checkpoint / UNETLoader |
| `positive` | CONDITIONING | 正向提示词 |
| `negative` | CONDITIONING | 负向提示词 |
| `latent_image` | LATENT | 来自 EmptyLatentImage / VAEEncode |
| `seed` | int | 0 – 18446744073709551615 |
| `control_after_generate` | enum | `fixed` / `random` / `increment` / `decrement` |
| `steps` | int | 默认 20，常用 15-30 |
| `cfg` | float | 默认 8.0，甜点 6-8 |
| `sampler_name` | enum | 见下表 |
| `scheduler` | enum | 见下表 |
| `denoise` | float | 0.0-1.0，1.0=txt2img |

### VAEDecode / VAEEncode

| 节点 | 输入 → 输出 | 典型来源 |
| --- | --- | --- |
| `VAEDecode` | LATENT + VAE → IMAGE | KSampler 输出 → 可保存图 |
| `VAEEncode` | IMAGE + VAE → LATENT | img2img 起点 |

### SaveImage / PreviewImage

| 节点 | 行为 |
| --- | --- |
| `SaveImage` | 落盘到 `output/` + PNG 元数据嵌入工作流 |
| `PreviewImage` | 仅临时预览不落盘 |

## 采样器对照

| 采样器 | 速度 | 质量 | 变化性 | 适用 |
| --- | --- | --- | --- | --- |
| `euler` | 快 | 稳 | 低 | 调试、批量 |
| `euler_ancestral` | 中 | 中 | 高 | 艺术性、富变化 |
| `dpmpp_2m` | **中** | **高** | 中 | **社区默认** |
| `dpmpp_sde` | 慢 | 高（细节丰富） | 中 | 最终出图、写实 |
| `ddim` | 中 | 稳定 | 低 | 老牌复刻 |
| `lms` | 中 | 中 | 中 | 早期主流 |
| `heun` | 中慢 | 高 | 低 | 高质量要求 |

## 调度器对照

| 调度器 | 噪声曲线 | 适用 |
| --- | --- | --- |
| `normal` | 线性 | 默认 |
| `karras` | 后段更细 | **普遍更锐利，社区推荐** |
| `exponential` | 指数衰减 | 少步数友好 |
| `simple` | 简单线性 | 极简稳定 |
| `sgm_uniform` | SGM 模型 | SD3 / Flux 等新架构 |
| `beta` | beta 分布 | 实验 |

## API 端点完整表

### 执行类

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/prompt` | POST | 提交工作流入队，body: `{client_id, prompt}` |
| `/prompt` | GET | 取当前队列 |
| `/interrupt` | POST | 中断当前节点 |
| `/queue` | GET | 看队列 |
| `/queue` | POST | 清队列，body: `{delete: ["all"\|"queue"\|"history"]}` |
| `/free` | POST | 卸载模型 / 释放显存，body: `{unload_models, free_memory}` |
| `/history` | GET | 全部历史 |
| `/history/{prompt_id}` | GET | 单次执行历史 + 产物 |
| `/history/{prompt_id}` | POST | 删除单条历史 |

### 信息查询类

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/object_info` | GET | 所有节点定义（输入 / 输出 / 参数） |
| `/object_info/{node_class}` | GET | 单节点定义 |
| `/system_stats` | GET | 系统 / 显存状态 |
| `/view` | GET | 取图像，query: `filename` / `subfolder` / `type` / `preview` |
| `/upload/image` | POST | 上传图像 |
| `/ws` | GET（WebSocket） | 实时进度，绑定 client_id |

### WebSocket 事件类型

| 事件 | 含义 |
| --- | --- |
| `status` | 队列状态变化 |
| `execution_start` | 整个 prompt 开始执行 |
| `execution_cached` | 节点命中缓存跳过 |
| `executing` | 节点执行中（含 node id；null = 结束） |
| `progress` | 单节点内进度（`value` / `max` / `prompt_id`） |
| `executed` | 节点完成（含输出数据） |
| `execution_error` | 执行异常（含异常详情） |

## 支持的模型族

| 模态 | 模型族 |
| --- | --- |
| **图像** | SD1.x / SD2.x / SDXL / SDXL Turbo / Stable Cascade / SD3 / SD3.5 / Pixart Alpha & Sigma / AuraFlow / HunyuanDiT / Flux / Flux 2 / Lumina / HiDream / Qwen Image / Z Image / Ernie Image |
| **图像编辑** | Omnigen 2 / Flux Kontext / HiDream E1.1 / Qwen Image Edit |
| **视频** | Stable Video Diffusion / Mochi / LTX-Video / Hunyuan Video（含 v1.5）/ Wan 2.1 / Wan 2.2 |
| **音频** | Stable Audio / ACE Step |
| **3D** | Hunyuan3D 2.0 |

## CLI 参数完整表

| 参数 | 作用 |
| --- | --- |
| `--cpu` | 强制 CPU 模式 |
| `--preview-method auto\|taesd\|latent2rgb\|etc` | 潜变量预览方式 |
| `--disable-api-nodes` | 关掉付费外部模型 API Nodes |
| `--tls-keyfile` / `--tls-certfile` | 启用 HTTPS |
| `--front-end-version` | 切换前端版本 |
| `--enable-manager` / `--disable-manager` | Manager 启停 |
| `--enable-counselor-ui` / `--enable-manager-legacy-ui` / `--disable-manager-ui` | Manager UI 形态 |
| `--listen 0.0.0.0` | 允许外部访问 |
| `--port 8188` | 监听端口 |
| `--extra-model-paths-config` | 加载额外模型路径配置 |

## 安装方式速查

| 方式 | 命令 / 入口 | 适用 |
| --- | --- | --- |
| **Desktop** | [官方下载](https://docs.comfy.org/get_started/local_install) | Win/macOS 新手首选 |
| **comfy-cli** | `pip install comfy-cli && comfy install` | 跨平台、可脚本化 |
| **Windows Portable** | GitHub Release | NVIDIA/AMD/Intel 免装环境 |
| **手动 git clone** | `git clone https://github.com/comfyanonymous/ComfyUI` + PyTorch + requirements.txt | 完全可控 |
| **Docker** | 官方镜像 / 自写 Dockerfile | 服务端部署首选 |
| **Comfy Cloud** | [comfy.org/cloud](https://www.comfy.org/cloud) | 无本地 GPU |

## 与同类工具对比

| 维度 | ComfyUI | AUTOMATIC1111 | Diffusers |
| --- | --- | --- | --- |
| 形态 | 节点图 UI | Gradio 表单 UI | Python 库 |
| 上手 | 陡 | 易 | 需写代码 |
| 复杂管线 | 极强 | 弱 | 最强（代码级） |
| 工作流复现 | 整张节点图 | txt2img 参数 | 脚本本身 |
| 多模态 | 图像/视频/音频/3D | 主要图像 | 取决于模型 |
| 适用 | 生产 / 批量 / 高级控图 | 纯小白快速出图 | 集成进自家代码 |

## 版本与运行环境

| 项 | 取值 |
| --- | --- |
| 当前主线 | 持续高速迭代，**每周一发布** |
| GitHub | 122k+ stars / 14.5k+ forks / 5600+ commits |
| 许可证 | GPL-3.0 |
| 部署形态 | Desktop / comfy-cli / Docker / Portable / Comfy Cloud |
| 最低 VRAM | 1GB（Smart memory management） |
| 默认端口 | 8188 |

## 官方资源

- 官方文档：[https://docs.comfy.org/](https://docs.comfy.org/)
- GitHub：[https://github.com/comfyanonymous/ComfyUI](https://github.com/comfyanonymous/ComfyUI)
- KSampler 文档：[https://docs.comfy.org/built-in-nodes/KSampler](https://docs.comfy.org/built-in-nodes/KSampler)
- API Routes：[https://docs.comfy.org/development/comfyui-server/comms_routes](https://docs.comfy.org/development/comfyui-server/comms_routes)
- WebSocket 示例：[script_examples/websockets_api_example.py](https://github.com/comfyanonymous/ComfyUI/blob/master/script_examples/websockets_api_example.py)
- Registry：[https://registry.comfy.org/](https://registry.comfy.org/)
- Manager 文档：[https://docs.comfy.org/manager/](https://docs.comfy.org/manager/)
- Publishing 节点：[https://docs.comfy.org/registry/publishing](https://docs.comfy.org/registry/publishing)
