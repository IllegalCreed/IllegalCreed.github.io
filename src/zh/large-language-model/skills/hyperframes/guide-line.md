---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 heygen-com/hyperframes 官方仓库主分支的 README 路由表与 `.claude/skills/` 域 skill 编写。

## 速查

- **路由 `/hyperframes`**：先读，确认 brief + capability map + 分发到创作工作流
- **10 创作工作流**：product-launch-video / faceless-explainer / pr-to-video / embedded-captions / talking-head-recut / motion-graphics / music-to-video / slideshow / general-video / remotion-to-hyperframes
- **8 域 skill**：hyperframes-core（合成契约）/ hyperframes-animation（运行时适配器）/ hyperframes-keyframes（seek-safe）/ hyperframes-creative / media-use（媒体 OS）/ hyperframes-cli / hyperframes-registry / figma
- **合成契约**：`data-*` 时间属性、`class="clip"`、tracks、子合成、变量、框架托管媒体播放、**确定性规则**
- **动画适配器**：GSAP / Lottie / Three.js / Anime.js / CSS / WAAPI / TypeGPU
- **seek-safe**：任意帧可确定性重建，拖动进度不跳；`hyperframes keyframes` 诊断
- **生产循环**：plan → HTML → seek-safe 动画 → media → `lint` → `preview` → `render`

## 路由：/hyperframes 先读

任何创作请求都先经 `/hyperframes`。它不直接干活，而是：确认 brief → 在能力地图里选一个创作工作流 → 按需装该工作流 → 进入具体流程。这层「先确认再动手」避免 agent 拿着模糊需求乱做。

## 10 个创作工作流

| 工作流 | 何时用 |
| --- | --- |
| `/product-launch-video` | 网站营销/发布/推广（URL、brief 或脚本），站点导览/社媒短片，~3min（甜点 30–90s） |
| `/faceless-explainer` | 从任意文本讲解一个主题——无产品/无 URL，视觉全由 LLM 构想 |
| `/pr-to-video` | GitHub PR（URL 或 `owner/repo#N`）→ changelog/功能揭示视频，经 `gh` 读取 |
| `/embedded-captions` | 给已有口播视频加字幕（原素材不动）——逐字轨、嵌入式高潮 |
| `/talking-head-recut` | 给口播/访谈/播客配图形叠层——下三分之一、数据标注、动感标题、画中画 |
| `/motion-graphics` | 短（<10s）无旁白、设计驱动的 motion graphic——动感字、数据命中、logo sting；MP4 或透明 |
| `/music-to-video` | 音乐轨 → beat 同步视频（歌词/幻灯/动感促销），音乐驱动节奏 |
| `/slideshow` | 演示/pitch deck——离散幻灯、片段揭示、分支、热区导航；产物是可导航 deck 而非渲染视频 |
| `/general-video` | 其它一切——更长/多场景、品牌片、标题卡、静态循环；输入与时长无关的兜底 + 陪伴模式 |
| `/remotion-to-hyperframes` | 把已有 Remotion（React）合成源码移植到 HyperFrames HTML——单向迁移，非创作 |

> `/remotion-to-hyperframes` 是与 [Remotion Skills](../remotion-skills/) 的桥：Remotion 走「React 组件 + 帧」，HyperFrames 走「写 HTML」，这个工作流做一次性迁移。

## 8 个域 skill（按需加载）

创作工作流针对这些**原子能力层**去组合，需要哪层就拉哪层：

### hyperframes-core —— 合成契约

视频的「结构层」：`data-*` 时间属性、`class="clip"`、tracks（轨道）、子合成（sub-compositions）、变量、框架托管的媒体播放，以及**确定性（determinism）规则**。这套契约保证同一份 HTML 每次渲染出的每一帧都一致。

### hyperframes-animation —— 运行时适配器

全部动画知识：原子运动规则、场景蓝图、转场，以及运行时适配器——**GSAP / Lottie / Three.js / Anime.js / CSS / WAAPI / TypeGPU**。你可以按需接不同动画引擎，而框架统一它们的时间轴。

### hyperframes-keyframes —— seek-safe 关键帧

跨运行时的**可 seek**关键帧创作：GSAP timeline、CSS keyframes、Anime.js、WAAPI、FLIP、paths、masks、SVG morph/draw、3D depth，外加 `hyperframes keyframes` 对已渲染运动做诊断。seek-safe = 拖到任意帧都能确定性重建那一帧的画面。

### 其它四层

| 域 skill | 覆盖 |
| --- | --- |
| `hyperframes-creative` | 非动画创意方向：`frame.md`/`design.md`、配色、排版、旁白、beat 规划、audio-reactive 视觉、合成模式 |
| `media-use` | 媒体 OS：把任何媒体需求（BGM/SFX/图/图标/logo/配音/调色/LUT）落成本地冻结文件 + ledger 记录，缺则用 TTS/音乐/图像模型生成，转写、加字幕、去背景、跨项目复用；一套共享音频引擎 + manifest 追踪 |
| `hyperframes-cli` | CLI 开发循环 `init`/`lint`/`check`/`snapshot`/`preview`/`render`/`publish`/`doctor`，+ HeyGen 云渲染 `cloud render`、AWS Lambda `lambda deploy`/`render`/`progress` |
| `figma` | 导入 Figma 资产/tokens/组件/storyboard → 重建为运动（帧读作状态而非幻灯）+ Motion 动画 + shaders |

## 生产循环细看

```text
plan（/hyperframes 确认 brief）
  → 写合法 HTML（data-* 时间属性 + class="clip" + tracks）
  → 接 seek-safe 动画（GSAP / 运行时适配器）
  → 加 media（media-use 落地 + ledger）
  → lint → preview → render（本地或云端/Lambda）
```

## motion doctrine：让多场景像「一镜到底」

创作工作流在做动画前会先加载 motion doctrine 这类**运动法则**（网关 skill），核心思想：一段多场景视频应当感觉像**一次连续的运镜**，而不是一叠各自动画的幻灯。它管的是：

- **vector 法则**：Scene A 怎么出，就决定 Scene B 怎么进（同轴、同向、承接动量）
- **Seam Gate**：接缝在构建时被门禁校验，防止「每次剪切处眼睛的动量都死掉」
- **禁 idle wobble**：运动要 PERFORM（表达意图），不是原地「呼吸」式抖动

## 字幕叠层：drop / rail / embed

`embedded-captions` 工作流的叠层法则：每句话是 `drop`（丢弃）、`rail`（逐字轨在前）或 `embed`（稀有的、赢得的高潮，嵌在主体之后）之一；字幕是**叠加在画面之上的 overlay**，绝不是预留的底部条——不要为了「腾地方」把内容上移或留死带。

## 反模式清单

| 反模式 | 后果 | 正解 |
| --- | --- | --- |
| 拿模糊需求直接开做 | 返工 | 先读 `/hyperframes` 确认 brief |
| 动画不可 seek（依赖真实时间/随机） | 拖进度跳变、渲染不一致 | seek-safe + 确定性规则 |
| 每个场景孤立动画 | 剪切处动量断裂 | motion doctrine 的 vector 法则 |
| 为字幕预留底部条 | 画面被压、重心偏 | 字幕作 overlay 叠加，保持满帧 |
| 不带 `--full-depth` 装 | 拿到滞后数小时的旧副本 | 安装始终带 `--full-depth` |

## 下一步

- 需要 19 skill 架构全表 + CLI 命令 + 渲染方式，看 [参考](./reference)。
- 想快速过全貌，看 <a href="/SlideStack/hyperframes-slide/" target="_blank">幻灯片</a>。
