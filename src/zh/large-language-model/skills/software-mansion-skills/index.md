---
layout: doc
---

# Software Mansion Skills

Software Mansion Skills（`software-mansion-labs/skills`）是 Software Mansion **官方**出品的一组「生产级 React Native 开发范式」，打包成 [Claude Code 插件](https://code.claude.com/docs/en/plugins)。Software Mansion 是 **Reanimated、React Native Gesture Handler、React Native Screens、React Native Skia 绑定、Fishjam、Radon IDE** 的作者——一家 2012 年起的软件代理商，也是 Core React Native Contributors。README 自述「Production-ready patterns for React Native development, packaged as a Claude Code plugin. Maintained by Software Mansion. Optimized for Claude models」。装上插件后，你的 AI 编码 agent 就能拿到动画、手势、on-device AI、音频、实时视频等 React Native 特性的**最新一手范式**——不是泛泛的 prompt，而是这些库的**作者本人**沉淀的、按主题分层加载的工程规范。

## 评价

**优点**

- **官方一手**：范式来自 Reanimated / Gesture Handler / Skia / Worklets 等库的**作者本人**，非二手总结，且追当前版本（如 animations 追 Reanimated 4）
- **一个 skill 覆盖八大主题**：`react-native-best-practices` 内含 animations / gestures / svg / on-device-ai / rich-text / multithreading / audio / jsi 八个 references，外加 `fishjam` / `detour` / `radon-mcp` / `rnrepo` / `expo-horizon` / `typegpu` 六个独立 skill
- **渐进式加载省 context**：顶层 `SKILL.md` 只是目录（table of contents），reference 文件**按需加载**，让上下文窗口聚焦当前任务
- **追新架构**：全部面向 New Architecture（Fabric）；animations 明确追 **Reanimated 4**（`runOnJS` 已删除 → 改用 `scheduleOnRN`）
- **为 Claude 优化**：README 明说 "Optimized for Claude models and tested with Claude Code"
- **装一条命令**：`/plugin marketplace add software-mansion-labs/skills` → `install`，或 `npx skills add`

**缺点 / 边界**

- **强绑 React Native / Expo**：不是通用 agent 技能，只在 RN/Expo 项目里有意义（package.json 含 `react-native`/`expo` 才触发）
- **部分 skill 绑自家云 / 商业产品**：`fishjam`（hosted WebRTC 平台）、`detour`（deferred deep linking 平台）、`rnrepo`（beta，需注册服务）
- **多处要求 New Architecture**：`on-device-ai`（ExecuTorch）、`rnrepo` 都不支持老架构；Expo Go 多不支持，需 dev build
- **许可需自行核实**：README 与多个 `SKILL.md` frontmatter 标注 **MIT**，但仓库根目录**暂无独立 `LICENSE` 文件**——引用/分发前建议自行确认

## 适用场景

- 在 RN/Expo 项目里让 Claude Code 写**动画 / 手势 / 音频 / on-device AI**，想要作者本人的官方范式
- 建**实时音视频 / 直播**（fishjam）、**deferred deep linking**（detour）、迁移到 **Meta Quest**（expo-horizon）
- 用 **Radon IDE** 的 MCP 工具调试 RN 应用（radon-mcp）、想**缩短原生构建时间**（rnrepo，最高约 2×）
- 写 **C++ JSI 原生模块**、TurboModules / Nitro Modules 想要正确的内存与线程范式（jsi）

## 边界

- **不是单个技能，是官方技能集**：`react-native-best-practices`（含 8 个子主题）+ `fishjam` / `detour` / `radon-mcp` / `rnrepo` / `expo-horizon` / `typegpu`，各有触发条件、按需激活
- **强绑 RN/Expo + New Architecture**：Web / 后端通用技能不在其列
- **商业 / beta 成分**：fishjam、detour 绑自家云；rnrepo 处于 beta
- **同组邻叶**：「移动与跨端」组还有 [Expo Skills](../expo-skills/)（Expo 官方）、[Callstack React Native Skills](../callstack-react-native-skills/)（Callstack，另一 RN 代理商）、Flutter Agent Plugins——它们与本叶互补，选型时对照

## 官方文档

[software-mansion-labs/skills README](https://github.com/software-mansion-labs/skills) ｜ [Software Mansion 官网](https://swmansion.com/) ｜ [Reanimated 文档](https://docs.swmansion.com/react-native-reanimated/) ｜ [Fishjam](https://fishjam.io)

## GitHub 地址

[software-mansion-labs/skills](https://github.com/software-mansion-labs/skills)（README 与多个 SKILL.md 标 MIT，仓库根无独立 LICENSE 文件）

## 内容地图

- [入门](./getting-started) —— 官方定位、`/plugin marketplace add` 安装、skills 总览、Reanimated 4 一览
- [指南](./guide-line) —— react-native-best-practices 各子主题（动画多方式 / 手势 / 音频 / on-device AI / 多线程 / JSI / SVG）、fishjam / detour / radon-mcp / rnrepo / expo-horizon、反模式
- [参考](./reference) —— skills 清单表、动画方式对照、安装、Reanimated 4、许可、链接

## 幻灯片地址

<a href="/SlideStack/software-mansion-skills-slide/" target="_blank">Software Mansion Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=617" target="_blank" rel="noopener noreferrer">Software Mansion Skills 测试题</a>
