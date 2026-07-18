---
layout: doc
---

# Remotion Skills

Remotion Skills（`remotion-dev/skills`，npm 包 `@remotion/skills`）是 Remotion 官方出品的一组 AI 编码 agent 技能集，把「用 React 写视频」的正确姿势教给 Claude Code / Cursor / Codex 等 agent。Remotion 用 React 组件 + 帧驱动动画来编程式生成视频（MP4/WebM/GIF/静帧），而 agent 若不懂它的规矩，最容易犯的错就是把 CSS `transition`/`animation` 当动画用——那在逐帧渲染下根本不生效。这套技能以一个总入口 `remotion-best-practices` 为路由，按任务分发到建项目、写 Markup、做交互、渲染、字幕、SaaS、查文档等子技能，核心是把「动画必须由 `useCurrentFrame()` + `interpolate()` 表达」这条铁律，连同一整套可交互、可渲染的工程规范，喂给 agent。

## 评价

**优点**

- **官方沉淀**：来自 Remotion 团队，把「帧驱动」这套与常规前端相反的心智模型讲清楚
- **总入口路由**：`remotion-best-practices` 按任务分发到子技能，agent 只按需加载相关部分
- **一条铁律贯穿**：动画=`useCurrentFrame()`+`interpolate()`，**CSS transition/animation 与 Tailwind 动画类被明令禁止**（逐帧渲染下不生效）
- **可交互优先**：`Interactive.Div` + `name` prop 让元素在 Remotion Studio 可视化编辑并写回代码
- **全链路覆盖**：建项目（`create-video`）→ 写 Markup → 渲染（`remotion render`/`still`）→ 字幕（`@remotion/captions`）→ SaaS（`<Player>`/Lambda）
- **跨 agent**：`npx skills add remotion-dev/skills` 装进 Claude Code / Cursor / Codex 等

**缺点 / 边界**

- **强绑 Remotion**：只服务 Remotion 这一编程式视频框架，不通用于其它视频方案
- **心智门槛**：帧驱动、`interpolate` 区间、`Sequence` 时间轴对不熟 Remotion 的人有学习曲线
- **许可需留意**：Remotion 框架本身对较大团队/公司是商业授权（个人与小团队免费），用于商业前须核对官网许可条款
- **与 HyperFrames/纯 HTML 方案分工**：本叶是「React 组件 + 帧」路线，[HyperFrames](../hyperframes/) 是「写 HTML 渲染视频」路线，取向不同

## 适用场景

- 让 agent 用 Remotion 从零建视频项目（`create-video` 脚手架 + Studio 预览）
- 写 Remotion React Markup 想照官方规范（帧驱动动画、可交互、资源引用）
- 批量/程序化生成视频（数据可视化、字幕视频、changelog 视频、社媒模板）
- 渲染进阶（透明视频、静帧）、字幕处理（转写/显示/导入 SRT）、做 Remotion SaaS

## 边界

- **不是单个技能，是官方技能集**：以 `remotion-best-practices` 为路由，按需加载子技能
- **动画只能帧驱动**：CSS transition/animation、Tailwind 动画类会「渲染不出来」，这是硬约束
- **服务 Remotion 一个框架**：不覆盖 FFmpeg 脚本、剪辑软件等非 Remotion 路径
- **许可属框架层**：技能仓库本身无独立 LICENSE 文件，商用授权看 Remotion 官网

## 官方文档

[Remotion AI / Skills 文档](https://www.remotion.dev/docs/ai/skills) ｜ [Remotion 官网](https://www.remotion.dev/) ｜ [Remotion 文档首页](https://www.remotion.dev/docs/)

## GitHub 地址

[remotion-dev/skills](https://github.com/remotion-dev/skills)（npm 包 `@remotion/skills`）

## 内容地图

- [入门](./getting-started) —— `npx skills add` 安装、总入口 + 子技能速览、建项目到预览
- [指南](./guide-line) —— 帧驱动动画铁律、Markup 规范、可交互、渲染、字幕、SaaS、反模式
- [参考](./reference) —— 子技能全表 + 核心 API（useCurrentFrame/interpolate/Sequence/staticFile）+ 命令 + 链接

## 幻灯片地址

<a href="/SlideStack/remotion-skills-slide/" target="_blank">Remotion Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=645" target="_blank" rel="noopener noreferrer">Remotion Skills 测试题</a>

