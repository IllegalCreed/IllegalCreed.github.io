---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 heygen-com/hyperframes 官方仓库主分支的 README 与 `.claude/skills/` 编写。

## 速查

- **装（agent/非交互）**：`npx hyperframes skills update`（正好装 core set）或 `npx hyperframes init`（保持 core set 最新）
- **装（交互 picker）**：`npx skills add heygen-com/hyperframes --full-depth`（Core Skills 组，默认不预选）
- **全装 19**：`npx skills add heygen-com/hyperframes --all --full-depth`；**单装**：`... --skill <name> --full-depth`
- **`--full-depth` 必带**：装当前 `main`；不带则走 skills.sh blob，滞后数小时（拿到旧副本）
- **先读路由**：`/hyperframes`——任何「做/改/动画/渲染视频」请求先读它，它确认 brief 并分发
- **19 skill**：1 路由 + 10 创作工作流 + 8 域 skill（core/animation/keyframes/creative/media-use/cli/registry/figma）
- **生产循环**：plan → 写合法 HTML → 接 seek-safe 动画 → 加 media → `lint` → `preview` → `render`
- **要求**：Node ≥22，Apache-2.0，HeyGen 官方

## 安装

HyperFrames 装进 Claude Code / Cursor / Gemini CLI / Codex 等支持 skills 的 agent。默认只装精简的 **core set**，创作工作流由路由**按需**安装：

```bash
# agent / 非交互推荐：正好装 core set
npx hyperframes skills update

# 保持 core set 最新（含路由、hyperframes-* 域 skill、media-use）
npx hyperframes init
```

其它安装方式：

```bash
# 交互 picker（Core Skills 组，默认不预选）
npx skills add heygen-com/hyperframes --full-depth

# 明确全装 19 个（跳过 picker）
npx skills add heygen-com/hyperframes --all --full-depth

# 只装一个（裸名，无前导 /）
npx skills add heygen-com/hyperframes --skill motion-graphics --full-depth
```

::: warning 务必带 --full-depth
`--full-depth` 会克隆当前 `main`。不带它时，`skills add` 会去取 skills.sh 注册表 blob，那份**滞后数小时**，你会拿到某个 skill 的旧副本。此外，picker 是交互专用——**非交互/agent 运行且没带 `--skill` 会一次装全 19 个**。
:::

## 先读路由：/hyperframes

任何「make / create / edit / animate / render 一个视频、动画或 motion graphic」的请求，agent 都应**先读 `/hyperframes`**。它是：

- **capability map**：域 skill 的能力地图
- **意图确认层**：把每个创作 brief 先跟你确认清楚
- **意图路由**：把请求分发到具体的创作工作流（产品发布视频 / 无脸讲解 / PR 变更视频 / 幻灯片……）

创作工作流是**按需**装的：路由在进入某个工作流前，会先跑 `npx hyperframes skills update <workflow>` 把它拉下来。

## 一分钟理解生产循环

技能教给 agent 的是一套固定的 **HyperFrames 生产循环**：

1. **plan**：`/hyperframes` 确认要做什么样的视频
2. **写合法 HTML**：视频就是标准 HTML + `data-*` 时间属性 + `class="clip"`
3. **接 seek-safe 动画**：用 GSAP / 运行时适配器接入可拖动进度不跳变的动画
4. **加 media**：背景视频、音乐、图标等（`media-use` 域 skill 负责）
5. **lint → preview → render**：`hyperframes lint`/`preview`/`render` 本地闭环，也可云端渲染

试一个 prompt：

```text
Using /hyperframes, create a 10-second product intro with a
fade-in title, a background video, and subtle background music.
```

下一页起进入路由、创作工作流与各域 skill 的深入规范。
