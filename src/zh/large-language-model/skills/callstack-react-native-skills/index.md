---
layout: doc
---

# Callstack React Native Skills

Callstack React Native Skills（`callstackincubator/agent-skills`）是 Callstack 官方出品的一组面向 AI 编码 agent 的 React Native 技能集，MIT 开源。Callstack 是 React Native 核心贡献机构，这套技能把它多年的性能优化经验（尤其是《The Ultimate Guide to React Native Optimization》电子书）沉淀成可被 Claude Code / Codex / Cursor / Gemini CLI 等按需调用的 Agent Skills。核心技能 `react-native-best-practices` 覆盖 JS/React、Native（iOS/Android）、Bundling 三大类共 29 篇细分优化指南；此外还有迁移评估（`assess-react-native-migration`）、建库脚手架（`create-react-native-library`）、CI 构建产物（`github-actions`）、升级与 brownfield 迁移等技能。

## 评价

**优点**

- **官方权威**：Callstack 是 React Native 核心贡献者，规则源自《Ultimate Guide to React Native Optimization》电子书与真实项目实战，非泛泛而谈
- **可度量的工作流**：核心技能强制「测量 → 优化 → 再测量 → 验证」（Measure → Optimize → Re-measure → Validate）闭环，禁止无证据地上 memoization
- **按影响力分级**：29 篇指南标注 CRITICAL / HIGH / MEDIUM，agent 先做影响大的（如 FlashList、bundle、16KB 对齐）
- **版本护栏**：明确提醒 FlashList v2 弃用 `estimatedItemSize`、RN 0.79+ 默认非压缩 bundle 等，避免给出过时建议
- **问题 → 技能映射**：「列表卡顿」「启动慢」「内存增长」等症状直接映射到起手的 reference 文件
- **不止性能**：迁移评估（brownfield/greenfield/checkpoint 三路 + ROI）、建库脚手架、GitHub Actions 云构建产物均有专技能
- **跨 agent**：Claude Code `/plugin install`、Codex `$skill-installer`、Cursor/Gemini/OpenCode 都能装

**缺点 / 边界**

- **偏 React Native/Expo**：不是通用前端优化，规则强绑移动端（Hermes、Turbo Modules、R8、TTI 等）
- **需真机/Profiler 验证**：很多技能依赖 `agent-device`、React DevTools、Xcode Instruments、Android Studio Profiler，火焰图/树图分析可能仍需人工
- **审计给输入，取舍靠人**：给出规则命中与优先级，最终改不改仍需工程判断 + 度量佐证
- **迁移评估是只读诊断**：`assess-react-native-migration` 只出决策报告，不执行迁移
- **与 Vercel 生态互补**：Web 端 React/Next.js 优化在 [Vercel Agent Skills](../vercel-agent-skills/)，本叶专注 React Native 原生侧

## 适用场景

- 排查 React Native 卡顿、掉帧、重渲染、启动慢（TTI）、内存泄漏、包体过大
- 写 Turbo Module、原生模块，或评估原生 SDK vs JS polyfill
- 准备 Google Play 上架（Android 16KB 页对齐）、开 R8 收缩包体
- 评估现有原生 App 是否/如何迁移到 React Native（brownfield/greenfield/checkpoint）
- 用 `create-react-native-library` 脚手架建库或本地原生模块
- 搭 GitHub Actions 云构建 iOS 模拟器/Android 模拟器产物

## 边界

- **不是单个技能，是官方技能集**：多个技能各有触发条件，按需激活
- **不是通用前端优化**：强绑 React Native / Expo / Hermes / 原生侧
- **性能建议须有度量**：强调先 profile 再优化，不做无证据的 memoization
- **迁移评估只诊断不执行**：决策阶段与实施阶段分离
- **Web 端 React 优化另有其叶**：见 [Vercel Agent Skills](../vercel-agent-skills/)

## 官方文档

[Callstack 博客：Announcing React Native Best Practices for AI agents](https://www.callstack.com/blog/announcing-react-native-best-practices-for-ai-agents) ｜ [The Ultimate Guide to React Native Optimization](https://www.callstack.com/ebooks/the-ultimate-guide-to-react-native-optimization) ｜ [agentskills.io 规范](https://agentskills.io/specification)

## GitHub 地址

[callstackincubator/agent-skills](https://github.com/callstackincubator/agent-skills)（MIT）

## 内容地图

- [入门](./getting-started) —— 官方定位、`/plugin install` 多 agent 安装、skills 总览、RN 性能优化定位
- [指南](./guide-line) —— react-native-best-practices 三大类（JS/Native/Bundling）逐类讲、迁移评估、建库、github-actions、反模式
- [参考](./reference) —— 技能清单表、29 篇优化要点、安装命令、许可、链接

## 幻灯片地址

<a href="/SlideStack/callstack-react-native-skills-slide/" target="_blank">Callstack React Native Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=616" target="_blank" rel="noopener noreferrer">Callstack React Native Skills 测试题</a>
