---
layout: doc
---

# ComfyUI

ComfyUI 是 comfyanonymous 维护的**节点式（graph / flowchart）AI 生成工作流编排工具**，GPL-3.0 开源，定位「可视化节点图 + 异步队列 + 智能显存管理」三位一体。一个工作流由若干节点（Checkpoint 加载、CLIP 编码、KSampler 采样、VAE 解码、SaveImage 等节点）通过连线（数据类型强约束）拼接而成；运行时异步队列只重算变化节点上游的子图，缓存复用让参数扫描成本极低。原生支持极其庞大的模型族——图像（SD1.x / SD2.x / SDXL / SDXL Turbo / SD3 / SD3.5 / Flux / Flux 2 / Pixart / HunyuanDiT / Qwen Image）、视频（Stable Video Diffusion / Mochi / LTX-Video / Hunyuan Video / Wan 2.1+2.2）、音频（Stable Audio / ACE Step）、3D（Hunyuan3D 2.0）。生态层面有 **ComfyUI-Manager**（custom_nodes 全生命周期 + Snapshot 复现 + 缺失节点自动检测安装）与 **ComfyUI Registry**（registry.comfy.org 提供全局唯一名 + SemVer + 不可变版本 + 安全扫描）两套机制。API 体系是 **POST /prompt（提交）+ GET /ws（WebSocket 实时进度，绑定 client_id）+ GET /history/{prompt_id}（取产物）** 三件套，外加 /object_info /queue /interrupt /free 等管理端点，使其可被程序化集成进任意生产管线。最低 1GB VRAM 也能跑大模型（自动 GPU/CPU offload），Desktop 应用、comfy-cli、Docker、Comfy Cloud 都可作部署形态。

## 评价

**优点**

- **节点图天然适合复杂管线**：多模型组合、ControlNet、LoRA 链、IPAdapter、上采样、refine 全部靠节点连线表达，比表单式 UI 强得多
- **异步队列缓存复用**：改一个最末端参数不会让上游 Checkpoint / CLIP 重算；批量出图成本远低于脚本式调用
- **智能显存管理**：最低 1GB VRAM 也能跑 SDXL / Flux，自动 GPU/CPU offload，无需手动 reload
- **可复现性强**：工作流可嵌入 PNG/WebP/FLAC 元数据，拖回画布即恢复；JSON 是正式存档
- **生态丰富**：ComfyUI-Manager + Registry 让 custom_nodes 有版本治理；6000+ commits、122k+ stars 持续迭代
- **程序化集成友好**：REST /prompt + WebSocket /ws + /object_info 全套 API，可被任意后端编排
- **多模态覆盖**：图像 / 视频 / 音频 / 3D 一套节点图全包

**缺点**

- **学习曲线陡**：节点图思维对纯小白不友好，CKPT / CLIP / VAE / Sampler / Scheduler 等概念需先建立
- **节点冲突风险**：custom_nodes 多了会撞节点名 / 撞依赖（torch / xformers 版本），Snapshot 是必备
- **Registry 安全扫描非 100%**：自动检测 pip wheel / 系统调用，但恶意节点风险依然存在
- **实时生成依赖 WebSocket**：REST 一次性请求无法收进度，集成方需维护长连接
- **PNG 元数据并非万能**：跨平台压缩 / 二次编辑易丢，正式生产仍需 JSON 双存
- **--disable-api-nodes 一刀切**：开了就只剩本地模型路径，外部付费大模型（GPT-Image-1 / Flux Pro / Nano Banana）全失效

## 文档地址

- [ComfyUI 官方文档（docs.comfy.org）](https://docs.comfy.org/)
- [ComfyUI GitHub 仓库](https://github.com/comfyanonymous/ComfyUI)
- [KSampler 节点官方文档](https://docs.comfy.org/built-in-nodes/KSampler)
- [Server 通信路由（API Routes）](https://docs.comfy.org/development/comfyui-server/comms_routes)
- [ComfyUI Registry](https://registry.comfy.org/)
- [Manager 文档](https://docs.comfy.org/manager/)

## GitHub地址

[comfyanonymous/ComfyUI](https://github.com/comfyanonymous/ComfyUI)

## 幻灯片地址

<a href="/SlideStack/comfyui-slide/" target="_blank">ComfyUI</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">ComfyUI 测试题</a>
