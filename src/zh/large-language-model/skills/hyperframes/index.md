---
layout: doc
---

# HyperFrames

HyperFrames（`heygen-com/hyperframes`，npm 包 `hyperframes`）是 HeyGen 官方出品的一组 AI 编码 agent 技能集，一句话概括就是它的标语——**「Write HTML. Render video. Built for agents.」**（写 HTML，渲染成视频，为 agent 而生）。它把「让 agent 用 HTML + 可 seek 的动画生成视频」的整套生产规范打包成 19 个按需加载的 skill：所有请求先读路由 `/hyperframes`，由它确认创作意图并分发到「产品发布视频、无脸讲解、PR 变更视频、字幕、幻灯片……」等创作工作流，再由工作流去组合 `hyperframes-core`（合成契约）、`hyperframes-animation`（运行时适配器）、`hyperframes-keyframes`（seek-safe 关键帧）等底层域 skill。核心心智是：视频是一段**确定性、可拖动进度**的合成，而不是一堆各自为政的动画切片。

## 评价

**优点**

- **官方出品**：来自 HeyGen（AI 视频公司），Apache-2.0，Node ≥22，社区活跃（★35.9k）
- **HTML 即视频**：写标准 HTML + `data-*` 时间属性即可产出视频，前端技能直接迁移，无需学专有 DSL
- **路由架构**：`/hyperframes` 先确认 brief 再分发，19 个 skill 按需加载，agent 只拉当前需要的层
- **seek-safe 是第一原则**：动画在任意帧都可确定性重建，拖动进度不跳变——这是逐帧渲染正确的根基
- **运行时适配器丰富**：动画层支持 GSAP / Lottie / Three.js / Anime.js / CSS / WAAPI / TypeGPU
- **全链路 CLI + 云渲染**：`init`/`lint`/`preview`/`render` 本地循环 + HeyGen 云渲染 + AWS Lambda 渲染
- **能从 Remotion 迁移**：`/remotion-to-hyperframes` 把已有 Remotion（React）合成一次性移植到 HyperFrames HTML

**缺点 / 边界**

- **心智与规范偏重**：motion doctrine（连续感/vector 法则/seam gate）等规范信息量大，上手需读文档
- **强绑框架合成契约**：`class="clip"`、tracks、子合成等是 HyperFrames 特定契约，非通用 HTML
- **面向 agent 工作流**：最佳体验是在支持 skills 的 agent 里用路由驱动，纯手工 CLI 也可但非重点
- **与 Remotion 取向不同**：本叶是「写 HTML 渲染视频」，[Remotion Skills](../remotion-skills/) 是「React 组件 + 帧」，按栈选择

## 适用场景

- 让 agent 从 URL / brief / 脚本生成产品发布视频、社媒短片、站点导览
- 从任意文本做无脸讲解视频、把 GitHub PR 变成 changelog 视频
- 给已有口播视频加字幕/图形叠层、做 <10s 的设计感 motion graphic、beat 同步的音乐视频
- 做可导航的幻灯片/pitch deck；把已有 Remotion 合成迁移到 HTML

## 边界

- **不是单个技能，是官方技能集**：19 skill，路由 `/hyperframes` 先读、按需加载
- **seek-safe/确定性是硬约束**：动画必须在任意帧可重建，否则渲染会出错
- **合成契约需遵守**：`data-*` 时间属性、`class="clip"`、tracks 是框架规定
- **许可属框架层**：Apache-2.0，商用友好；云渲染依赖 HeyGen/AWS Lambda 服务

## 官方文档

[HyperFrames 介绍](https://hyperframes.heygen.com/introduction) ｜ [Quickstart](https://hyperframes.heygen.com/quickstart) ｜ [Playground](https://www.hyperframes.dev/) ｜ [Showcase](https://hyperframes.heygen.com/showcase)

## GitHub 地址

[heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)（Apache-2.0，npm 包 `hyperframes`）

## 内容地图

- [入门](./getting-started) —— 安装（`--full-depth` 必带、agent 用 `skills update`）、路由 + core set、生产循环
- [指南](./guide-line) —— 路由 `/hyperframes`、10 创作工作流、8 域 skill、生产循环、seek-safe 与反模式
- [参考](./reference) —— 19 skill 架构全表 + CLI 命令 + 云/Lambda 渲染 + 安装 4 式 + 链接

## 幻灯片地址

<a href="/SlideStack/hyperframes-slide/" target="_blank">HyperFrames</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=646" target="_blank" rel="noopener noreferrer">HyperFrames 测试题</a>

