---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 heygen-com/hyperframes 官方仓库主分支整理（npm 包 `hyperframes`）。

## 速查

- **装（agent）**：`npx hyperframes skills update` / `npx hyperframes init`
- **装（picker/全/单）**：`npx skills add heygen-com/hyperframes [--full-depth | --all --full-depth | --skill <name> --full-depth]`
- **先读**：`/hyperframes`（路由）
- **CLI 循环**：`init` `lint` `check` `snapshot` `preview` `render` `publish` `doctor`
- **云渲染**：`hyperframes cloud render`（HeyGen）· `hyperframes lambda deploy/render/progress`（AWS）
- **合成契约**：`data-*` 时间属性 · `class="clip"` · tracks · 子合成 · 变量 · 确定性

## 19 skill 架构全表

**1 路由 + 10 创作工作流 + 8 域 skill = 19。**

### 路由（1）

| skill | 作用 |
| --- | --- |
| `/hyperframes` | 任何创作请求先读；capability map + brief 确认 + 分发到创作工作流 |

### 创作工作流（10，按需装）

| skill | 何时用 |
| --- | --- |
| `/product-launch-video` | 网站营销/发布/导览，~3min |
| `/faceless-explainer` | 从文本讲解主题，视觉全 LLM 构想 |
| `/pr-to-video` | GitHub PR → changelog 视频（`gh` 读取） |
| `/embedded-captions` | 给口播视频加字幕（素材不动） |
| `/talking-head-recut` | 口播 + 图形叠层（下三分之一/callout/PiP） |
| `/motion-graphics` | <10s 无旁白设计感动图；MP4 或透明 |
| `/music-to-video` | 音乐轨 → beat 同步视频 |
| `/slideshow` | 可导航幻灯/pitch deck（非渲染视频） |
| `/general-video` | 其它/多场景兜底 + 陪伴模式 |
| `/remotion-to-hyperframes` | Remotion（React）→ HyperFrames HTML 单向迁移 |

### 域 skill（8，按需加载）

| skill | 覆盖 |
| --- | --- |
| `/hyperframes-core` | 合成契约：`data-*` 时间属性、`class="clip"`、tracks、子合成、变量、确定性 |
| `/hyperframes-animation` | 动画：原子规则、场景蓝图、转场、适配器 GSAP/Lottie/Three.js/Anime.js/CSS/WAAPI/TypeGPU |
| `/hyperframes-keyframes` | seek-safe 关键帧：GSAP/CSS/Anime.js/WAAPI/FLIP/paths/masks/SVG morph/3D + 诊断 |
| `/hyperframes-creative` | 创意方向：`frame.md`/`design.md`、配色、排版、旁白、beat、audio-reactive |
| `/media-use` | 媒体 OS：媒体落地 + ledger、TTS/音乐/图像生成、转写、字幕、去背景、复用 |
| `/hyperframes-cli` | CLI 循环 + HeyGen 云渲染 + AWS Lambda 渲染 |
| `/hyperframes-registry` | `hyperframes add` 装/接 registry 区块与组件；编写新 block 贡献上游 |
| `/figma` | 导入 Figma 资产/tokens/组件/storyboard → 重建运动 + Motion + shaders |

## CLI 命令备忘

```bash
# 本地开发循环
npx hyperframes init        # 初始化 / 保持 core set 最新
npx hyperframes lint        # 校验合成
npx hyperframes check       # 检查
npx hyperframes snapshot    # 快照
npx hyperframes preview     # 预览
npx hyperframes render      # 本地渲染
npx hyperframes publish     # 发布
npx hyperframes doctor      # 体检

# 云端渲染
npx hyperframes cloud render                 # HeyGen 托管渲染
npx hyperframes lambda deploy                # 部署 Lambda 渲染栈
npx hyperframes lambda render                # Lambda 渲染
npx hyperframes lambda progress              # 查看进度
```

## 安装四式

```bash
# 1. agent / 非交互（推荐）：正好装 core set
npx hyperframes skills update

# 2. 交互 picker（Core Skills 组，默认不预选）
npx skills add heygen-com/hyperframes --full-depth

# 3. 明确全装 19（跳过 picker）
npx skills add heygen-com/hyperframes --all --full-depth

# 4. 只装一个（裸名，无前导 /）
npx skills add heygen-com/hyperframes --skill motion-graphics --full-depth
```

> `--full-depth` 必带：装当前 `main`；不带走 skills.sh blob 会滞后数小时。非交互无 `--skill` 会装全 19。

## 硬约束（务必记住）

- 任何创作先读 `/hyperframes` 确认 brief。
- 动画必须 **seek-safe + 确定性**：任意帧可重建，禁依赖真实时间/随机。
- 遵守合成契约：`data-*` 时间属性、`class="clip"`、tracks。
- 字幕作 overlay 叠加，不预留底部条。
- 安装始终带 `--full-depth`。

## 许可与生态

- **仓库**：`heygen-com/hyperframes`，npm 包 `hyperframes`，**Apache-2.0**，Node ≥22，HeyGen 官方。
- **生态入口**：hyperframes.heygen.com（introduction/quickstart/showcase/catalog）、hyperframes.dev（Playground）。
- **同类对照**：[Remotion Skills](../remotion-skills/) 走「React 组件 + 帧」；本叶走「写 HTML 渲染视频」，两者可经 `/remotion-to-hyperframes` 迁移。

## 链接

- [HyperFrames 介绍](https://hyperframes.heygen.com/introduction) ｜ [Quickstart](https://hyperframes.heygen.com/quickstart)
- [Playground](https://www.hyperframes.dev/) ｜ [Showcase](https://hyperframes.heygen.com/showcase)
- [heygen-com/hyperframes（GitHub）](https://github.com/heygen-com/hyperframes)

## 下一步

- 回看 [指南](./guide-line) 的路由/域 skill 与 seek-safe 反模式。
- 过一遍 <a href="/SlideStack/hyperframes-slide/" target="_blank">幻灯片</a> 或做 <a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">测试题</a>。
