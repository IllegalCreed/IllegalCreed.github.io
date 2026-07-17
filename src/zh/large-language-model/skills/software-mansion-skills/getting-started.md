---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 `software-mansion-labs/skills` 官方仓库（2026-07 主分支）的 README 与 `skills/` 目录编写。

## 速查

- **是什么**：Software Mansion 官方的一组「生产级 React Native 范式」，打包成 **Claude Code 插件**；作者即 Reanimated / Gesture Handler / Skia 绑定 / Fishjam / Radon IDE 团队
- **装（插件，推荐）**：`/plugin marketplace add software-mansion-labs/skills` → `/plugin install skills@swmansion` → `/reload-plugins`
- **更新**：`/plugin marketplace update swmansion`；**npx 方式**：`npx skills add software-mansion-labs/skills`
- **skills 清单**：`react-native-best-practices`（含 8 子主题）· `fishjam`（实时音视频）· `detour`（deferred deep linking）· `radon-mcp`（Radon IDE 调试）· `rnrepo`（预构建产物提速）· `expo-horizon`（迁移到 Meta Quest）· `typegpu`（WebGPU）
- **8 个子主题**：animations · gestures · svg · on-device-ai · rich-text · multithreading · audio · jsi
- **加载模型**：顶层 `SKILL.md` = 目录，reference 文件**按需加载**，省 context
- **追新架构 + Reanimated 4**：`runOnJS` 已删除 → 用 `scheduleOnRN`（来自 `react-native-worklets`）
- **触发条件**：working directory 的 `package.json` 含 `react-native` / `expo` / `expo-router` 依赖即适用
- **许可**：README + 多个 SKILL.md 标 MIT，仓库根**无独立 LICENSE 文件**（自行核实）

## 官方定位：作者本人的范式

Software Mansion 是一家 **2012 年**成立的软件代理商，也是 **Core React Native Contributors**。React Native 生态里最常用的一批库——**Reanimated**（动画）、**React Native Gesture Handler**（手势）、**React Native Screens**（导航原生化）、**React Native Skia** 绑定（2D 图形）、**react-native-worklets**（多线程）、**Fishjam**（WebRTC）、**Radon IDE**（IDE）——都出自他们之手。

所以这套 skills 的价值在于「**一手**」：范式不是从博客二手总结的，而是这些库的**维护者本人**写下的生产经验，且**追当前版本**。README 明确写着「Optimized for Claude models and tested with Claude Code」——它是为 Claude 优化、用 Claude Code 测过的。

## 安装

### 作为插件（推荐）

在 Claude Code 里添加 Software Mansion marketplace 并安装插件：

```text
/plugin marketplace add software-mansion-labs/skills
/plugin install skills@swmansion
/reload-plugins
```

装完 skills 立即可用。之后用 `/plugin marketplace update swmansion` 拉取最新版。

### 通过 npx（跨 agent）

也可用开放的 [`skills` CLI](https://www.npmjs.com/package/skills) 安装（可进 Claude Code / Cursor / Codex 等）：

```bash
npx skills add software-mansion-labs/skills
```

## skills 总览

| Skill | 覆盖 | 何时用 |
| --- | --- | --- |
| `react-native-best-practices` | 8 个子主题（见下） | RN/Expo 项目里写、审、调**任何**代码——顶层 skill，最常用 |
| `fishjam` | 实时视频 / 音频 / 一对多直播（hosted WebRTC） | 建实时音视频、直播、AI 语音 agent |
| `detour` | deferred deep linking（open-source SDK） | 加深链、从 Branch / AppsFlyer 迁移 |
| `radon-mcp` | Radon IDE 的 MCP 工具最佳实践 | 用 Radon IDE 看截图 / 日志 / 组件树 / 网络、调试 RN 应用 |
| `rnrepo` | 预构建库产物，原生构建提速最高约 2× | 原生构建慢、CI 构建慢（beta，仅新架构） |
| `expo-horizon` | 把 Expo SDK 应用迁移到 Meta Quest | 加 Meta Quest / Horizon OS 支持 |
| `typegpu` | TypeGPU / WebGPU 类型化管线 | 跨 CPU/GPU 边界写 shader、计算管线 |

### react-native-best-practices 的 8 个子主题

`react-native-best-practices` 是**顶层 skill**，本身只是一张目录表，把任务路由到 `references/` 下的子主题：

| 子主题 | 库 | 覆盖要点 |
| --- | --- | --- |
| **animations** | Reanimated 4 / Skia / WebGPU | CSS 过渡 / CSS 动画 / shared value 动画 / canvas 动画 / GPU shader 动画 / layout 动画 / 120fps |
| **gestures** | Gesture Handler | tap / pan / pinch / rotation / swipe / long press / fling / hover / drag，v2 builder 与 v3 hook API |
| **svg** | React Native SVG | 矢量图、图标、图表、插画 |
| **on-device-ai** | React Native ExecuTorch | 端侧 LLM / 视觉 / OCR / 分割 / 语音 STT·TTS·VAD / embeddings |
| **rich-text** | react-native-enriched | 富文本编辑器、Markdown 渲染、mentions、表格、LaTeX |
| **multithreading** | react-native-worklets | UI / Worker / RN 三种 runtime，`scheduleOnUI` / `scheduleOnRN` / `scheduleOnRuntime` |
| **audio** | react-native-audio-api | 播放 / 录音 / 音效 / 实时分析可视化 / audio worklet |
| **jsi** | C++ JSI | `HostObject` / `HostFunction` / `NativeState` / 零拷贝 `ArrayBuffer` / TurboModules vs Nitro |

## Reanimated 4 一览

animations 子主题明确面向 **Reanimated 4**，有一条贯穿始终的**关键规则**：

> **绝不再用 `runOnJS`**——它在 Reanimated 4 已被移除。改用 `react-native-worklets` 的 **`scheduleOnRN(fn, ...args)`**。这条规则适用于**所有** worklet 上下文：滚动处理器、手势回调、`useAnimatedReaction`、`useFrameCallback` 等。

Reanimated 4 带来的还有：

- **CSS 风格动画**：可用 CSS transitions / CSS animations 的写法做动画，而不只是 shared value + `useAnimatedStyle`
- **多种动画路径**：从简单的 CSS 过渡，到 shared value 动画，到 Skia canvas 动画，再到 GPU shader 动画——按复杂度选型（详见[指南](./guide-line)）
- **120fps**：新架构下可开启高刷，配合性能调优（feature flags、worklet 闭包优化）

## 下一步

- [指南](./guide-line) —— 各子主题深入（动画多方式 / 手势 v2·v3 / 音频 / on-device AI / 多线程 / JSI）、fishjam / detour / radon-mcp / rnrepo / expo-horizon、反模式
- [参考](./reference) —— skills 清单表、动画方式对照、安装、Reanimated 4、许可、链接
