---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 remotion-dev/skills 官方仓库（npm 包 `@remotion/skills`）整理。

## 速查

- **装**：`npx skills add remotion-dev/skills`
- **建**：`npx create-video@latest --yes --blank --no-tailwind my-video`
- **预览**：`npx remotion studio --no-open`
- **渲染**：`npx remotion render` / `npx remotion still`
- **核心 API**：`useCurrentFrame()` · `interpolate()` · `Sequence` · `Easing.bezier()`/`Easing.spring()` · `Interactive.Div` · `staticFile()` · `<Player>` · `Caption`(`@remotion/captions`)

## 子技能全表

| 子技能 | 作用 | 关键点 |
| --- | --- | --- |
| `remotion-best-practices` | 总入口 / 路由 | 按任务分发到下列子技能 |
| `remotion-create` | 新建项目 | `create-video` 脚手架、`remotion studio` 预览 |
| `remotion-markup` | 写 React Markup | 帧驱动动画、可交互、资源规范（规矩最多） |
| `remotion-interactivity` | Studio 可编辑 | `Interactive.Div`+`name`，写回代码 |
| `remotion-render` | 渲染 | `render`/`still`、透明视频 |
| `remotion-captions` | 字幕 | JSON + `Caption` 类型、转写/显示/导入 SRT |
| `remotion-saas` | SaaS / 应用 | `<Player>`、Lambda/Vercel/Cloudflare/Express、客户端渲染 |
| `remotion-docs` | 查文档 | 查最新 Remotion API 与文档 |
| `mediabunny` | 浏览器多媒体 | 裁剪/取时长/取尺寸/元数据 |

## 核心 API 备忘

| API | 用途 | 备注 |
| --- | --- | --- |
| `useCurrentFrame()` | 取当前帧号 | 一切动画的基准 |
| `interpolate(frame, [i], [o], opts)` | 帧号 → 属性值 | 优先于 `spring()`；配 `extrapolateLeft/Right: "clamp"` |
| `Easing.bezier(...)` | 自定义时间曲线 | 跳跃/过冲 |
| `Easing.spring()` | 弹簧动画 | 需要弹性时 |
| `Sequence` | 时间轴分段 | 给 `name` 便于 Studio 编辑 |
| `Interactive.Div` | 可交互元素 | `<div>` 的可编辑版，配 `name` |
| `staticFile()` | 引用 `public/` 资源 | 别写死路径 |
| `<Player>` | 网页内嵌播放 | SaaS 场景 |
| `Caption` | 字幕类型 | `@remotion/captions`：text/startMs/endMs/timestampMs/confidence |

## 常用命令

```bash
# 安装技能
npx skills add remotion-dev/skills

# 新建视频项目（空白、无 Tailwind）
npx create-video@latest --yes --blank --no-tailwind my-video

# 启动 Studio 预览（长驻，打印 URL）
npx remotion studio --no-open

# 渲染视频 / 静帧
npx remotion render
npx remotion still
```

## 硬约束（务必记住）

- 动画只能 `useCurrentFrame()` + `interpolate()` 表达。
- **CSS `transition`/`animation`、Tailwind 动画类禁止**——逐帧渲染不生效。
- `interpolate()` 内联在 `style`；优先 `scale`/`translate`/`rotate`，避免 `transform` 字符串。
- 资源放 `public/`，用 `staticFile()` 引用。
- 字幕统一走 JSON + `Caption` 类型。

## 许可与生态

- **技能仓库**：`remotion-dev/skills`，npm 包 `@remotion/skills`，仓库内未见独立 LICENSE 文件（作为内部包发布）。
- **Remotion 框架**：对个人与小团队免费，对较大公司为商业授权——商用前请核对 [Remotion 官网许可条款](https://www.remotion.dev/docs/license)。
- **同类对照**：[HyperFrames](../hyperframes/) 走「写 HTML 渲染视频」路线；本叶走「React 组件 + 帧」路线。

## 链接

- [Remotion AI / Skills 文档](https://www.remotion.dev/docs/ai/skills)
- [Remotion 官网](https://www.remotion.dev/) ｜ [文档首页](https://www.remotion.dev/docs/)
- [remotion-dev/skills（GitHub）](https://github.com/remotion-dev/skills)
- [mediabunny.dev/llms.txt](https://mediabunny.dev/llms.txt)

## 下一步

- 回看 [指南](./guide-line) 的帧驱动铁律与反模式清单。
- 过一遍 <a href="/SlideStack/remotion-skills-slide/" target="_blank">幻灯片</a> 或做 <a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">测试题</a>。
