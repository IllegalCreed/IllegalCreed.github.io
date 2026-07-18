---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 remotion-dev/skills 官方仓库（npm 包 `@remotion/skills`）的 `skills/` 目录编写。

## 速查

- **装**：`npx skills add remotion-dev/skills`（Claude Code / Cursor / Codex 等）
- **总入口**：`remotion-best-practices`——按任务路由到子技能，agent 只加载相关部分
- **子技能**：`remotion-create`（建项目）·`remotion-markup`（写 Markup）·`remotion-interactivity`（Studio 可编辑）·`remotion-render`（渲染）·`remotion-captions`（字幕）·`remotion-saas`（`<Player>`/Lambda）·`remotion-docs`（查文档）·`mediabunny`（浏览器多媒体）
- **建项目**：`npx create-video@latest --yes --blank --no-tailwind my-video`
- **预览**：`npx remotion studio --no-open`（长驻进程，打印预览 URL）
- **渲染**：`npx remotion render`（视频）· `npx remotion still`（静帧）
- **铁律**：动画=`useCurrentFrame()`+`interpolate()`；**CSS transition/animation、Tailwind 动画类禁止用**（逐帧渲染不生效）
- **资源**：放 `public/`，用 `staticFile()` 引用

## 安装

```bash
npx skills add remotion-dev/skills
```

装后技能自动可用——agent 检测到 Remotion 相关任务时，先加载总入口 `remotion-best-practices`，再按需分发到子技能。

## 总入口：remotion-best-practices

它本身不含大段规则，而是一张「路由表」，根据当前任务把 agent 导向正确的子技能：

| 任务 | 加载的子技能 |
| --- | --- |
| 还没有项目、要新建 | `remotion-create` |
| 写 React Markup（动画/布局） | `remotion-markup` |
| 想在 Studio 里可视化编辑并写回代码 | `remotion-interactivity` |
| 浏览器里裁剪/取元数据等多媒体 | `mediabunny` |
| 进阶渲染（透明视频、静帧） | `remotion-render` |
| 处理字幕 | `remotion-captions` |
| 做 SaaS / 自动化 / 应用 | `remotion-saas` |
| 查最新 Remotion API 文档 | `remotion-docs` |

## 建项目到预览（remotion-create）

### 1. 脚手架

```bash
npx create-video@latest --yes --blank --no-tailwind my-video
cd my-video
npm i
```

`my-video` 换成合适的项目名。若已有项目则跳过这步。

### 2. 设计视频

保留脚手架，往里加 React Markup，遵循 [Markup 规范](./guide-line#markup-规范帧驱动)（帧驱动动画、视频优先布局、文字尺寸规则）。

### 3. 启动预览

```bash
npx remotion studio --no-open
```

这会启动一个长驻进程，并打印预览用的服务器 URL——在 Remotion Studio 里边写边看。

## 一分钟理解「帧驱动」

常规前端用 CSS `transition`/`animation` 或 `setTimeout` 让东西「随时间动」；Remotion 逐帧离线渲染，**没有真实时间轴**——第 30 帧就是第 30 帧。所以动画必须表达成「当前帧 → 属性值」的函数：

```tsx
import { useCurrentFrame, interpolate } from "remotion";

const frame = useCurrentFrame();
// 第 0→60 帧，opacity 从 0 渐变到 1
const opacity = interpolate(frame, [0, 60], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

记住这条，就能避开 agent 写 Remotion 时最常见的错误。下一页起进入各子技能的深入规范。
