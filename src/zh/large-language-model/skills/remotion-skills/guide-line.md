---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 remotion-dev/skills 官方仓库的 `skills/remotion-*` 与 `skills/mediabunny` 子技能编写。

## 速查

- **Markup 铁律**：`useCurrentFrame()`+`interpolate()` 表达动画；**优先 `interpolate()` 而非 `spring()`**；`Easing.bezier()` 自定义时间曲线，`Easing.spring()` 要弹簧感
- **禁止**：CSS `transition`/`animation`、Tailwind 动画类——逐帧渲染下**不会正确渲染**
- **可交互**：该在 Studio 编辑的元素用 `Interactive.Div`（`<div>`→`<Interactive.Div>`），给 `name` prop；`interpolate()` 保持内联在 `style`
- **CSS 写法**：优先 `scale`/`translate`/`rotate` 单属性，别用 `transform` 字符串（Studio 更难编辑）
- **资源**：放 `public/`，用 `staticFile()` 引用
- **渲染**：`npx remotion render`（视频）·`npx remotion still`（静帧）·透明视频另有说明
- **字幕**：JSON + `@remotion/captions` 的 `Caption` 类型（text/startMs/endMs/timestampMs/confidence）
- **SaaS**：`<Player>` 网页内嵌、Lambda/Vercel/Cloudflare/Express 渲染、客户端渲染、模板
- **mediabunny**：浏览器里裁剪/取时长/取尺寸等多媒体处理

## Markup 规范（帧驱动）

`remotion-markup` 是最核心的子技能，规矩最多：

### 动画一律用 useCurrentFrame + interpolate

```tsx
import { useCurrentFrame, Easing, interpolate, Interactive } from "remotion";

export const FadeIn = () => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div
      name="Title"
      style={{
        opacity: interpolate(frame, [0, 60], [0, 1], {
          extrapolateRight: "clamp",
          extrapolateLeft: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      Hello World!
    </Interactive.Div>
  );
};
```

- **优先 `interpolate()` 而非 `spring()`**——更直观、更好编辑；要弹簧/过冲效果时才用 `Easing.spring()` 或 `Easing.bezier()` 自定义。
- **`interpolate()` 内联在 `style`**：别提取成 `const scale = ...` 再拼进 `transform` 字符串，那会隐藏关键帧、让 Studio 难以编辑。

### 优先单属性变换

```tsx
// 👍 可编辑的关键帧 + 变换简写
style={{
  scale: interpolate(frame, [0, 100], [0, 1]),
  translate: interpolate(frame, [0, 100], ["0px 0px", "100px 100px"]),
  rotate: interpolate(frame, [0, 100], ["20deg", "90deg"]),
}}

// 👎 隐藏值 + transform 字符串，Studio 里更难编辑
const scale = interpolate(frame, [0, 100], [0, 1]);
style={{ transform: `scale(${scale})` }}
```

### 明令禁止

- **CSS `transition` / `animation` 被禁止**——逐帧渲染下不会正确渲染。
- **Tailwind 动画类名被禁止**——同理不会正确渲染。
- 资源放 `public/` 根目录，用 `staticFile()` 引用，别写死路径。

## 可交互（remotion-interactivity）

通过把 Markup 结构组织好，用户可以在 Remotion Studio 的 Visual Mode 里可视化地改动，并**写回代码**：

- 该交互的 HTML 元素用 `Interactive`：`<div>` → `<Interactive.Div>`；给 `Interactive`/`Solid`/`Sequence` 设描述性 `name`（如 `name="Hero title"`）。
- 若组件主要由视频/音频片段构成，按「视频编辑」规范组织 Markup，使片段在时间轴上可交互编辑。
- 权威规范见官方 [Interactivity best practices](https://www.remotion.dev/docs/studio/interactivity-best-practices) 与 [Make a component interactive](https://www.remotion.dev/docs/studio/make-component-interactive)。

## 渲染（remotion-render）

```bash
npx remotion render     # 渲染视频，选项见官网 cli/render
npx remotion still      # 渲染单帧静图，选项见官网 cli/still
```

- **透明视频**：需要带透明通道输出时，按 `transparent-videos` 规范渲染。
- 简单渲染直接上面两条；更复杂的编码/并发/云端渲染看 SaaS 子技能与官网 CLI 文档。

## 字幕（remotion-captions）

所有字幕以 **JSON** 处理，统一用 `@remotion/captions` 的 `Caption` 类型：

```ts
import type { Caption } from "@remotion/captions";

type Caption = {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number | null;
  confidence: number | null;
};
```

三条路径分别有专门说明：**生成**（转写音视频文件）、**显示**（把字幕渲染进视频）、**导入**（从 `.srt` 文件读入）。

## SaaS / 应用（remotion-saas）

做 Remotion 驱动的 SaaS、自动化或应用时用它，覆盖：

- **`<Player>`**：把 Remotion 组件当播放器嵌进网页
- **云端渲染**：Lambda、Vercel、Cloudflare、通过 Express.js 服务端渲染
- **客户端渲染**：浏览器内渲染
- **模板**：为对应场景选合适的 SaaS 起步模板

## mediabunny：浏览器多媒体

`mediabunny` 是处理浏览器内音视频的库（能力总览见 [mediabunny.dev/llms.txt](https://mediabunny.dev/llms.txt)）：

- 取音频时长、取视频尺寸、取视频时长
- 裁剪、裁边、读元数据等常见多媒体任务

## 反模式清单

| 反模式 | 后果 | 正解 |
| --- | --- | --- |
| CSS `transition`/`animation` 做动画 | 渲染不出来 | `useCurrentFrame()`+`interpolate()` |
| Tailwind 动画类（`animate-*`） | 渲染不出来 | 帧驱动动画 |
| `setTimeout`/真实时间控制节奏 | 逐帧渲染无真实时间 | 用帧号定位 |
| 把 `interpolate` 提出来拼 `transform` 字符串 | Studio 难编辑 | 内联在 `style`、用 `scale`/`translate`/`rotate` |
| 资源写死绝对路径 | 渲染/打包找不到 | 放 `public/` + `staticFile()` |

## 下一步

- 需要子技能全表 + 核心 API 速查，看 [参考](./reference)。
- 想快速过一遍全貌，看 <a href="/SlideStack/remotion-skills-slide/" target="_blank">幻灯片</a>。
