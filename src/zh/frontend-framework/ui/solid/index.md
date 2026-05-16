---
layout: doc
---

# Solid

Ryan Carniato 创建并维护的声明式 JavaScript UI 库，以「**细粒度响应式（Signals）+ 编译时优化 + JSX**」三件套为核心。与 React 共享 JSX 语法但**响应式机制完全不同**——React 每次状态变化重跑整个组件函数，Solid 的组件**只运行一次**用于「建立响应式图」，之后只有真正访问了变化信号的 DOM 节点会更新；这种「精准更新粒度」让 Solid 在不依赖 Compiler 的前提下达到接近手写原生 JS 的性能。Solid 1.9（2024.9）打磨了 hydration、TypeScript 与 SSR；2.0 仍在 `@solidjs/signals` 分支孵化，未进入稳定版。

## 评价

**优点**

- **性能业界顶级**：JS Framework Benchmark 长期稳居前三，仅次于 Inferno / 手写 vanilla；首屏 + 交互 + 内存占用全面领先 React / Vue
- **心智模型纯粹**：组件 = 一次性运行的工厂函数；逻辑 = signals + effects；没有 Hooks Rules、依赖数组、闭包陷阱、StrictMode 双调用这些 React 噪声
- **JSX 直觉与 React 一致**：React 经验直接迁移过来，TSX、Fragment、条件渲染、ref 都熟悉；只是「思维要切换为细粒度响应式」
- **细粒度更新**：状态变化只重跑订阅了该信号的 effect / DOM 操作；不需要 `React.memo` / `useMemo` / `useCallback` 这些 Compiler 出现前的手动优化
- **TypeScript 一流**：Signal / Resource / Store 都有完整泛型推导；JSX 比 React 类型更严格（事件、属性匹配更准）
- **SolidStart 与 React 元框架对齐**：文件路由 + Server Functions + `use server` / `use client` directives + 多 adapter（Vercel / Netlify / Cloudflare / Node / Bun），范式与 Next.js / Remix 高度相似
- **Bundle 体积小**：Hello World 约 6-8 KB（gzip），生产应用通常比 React 小 30-50%
- **可与原生平台集成**：[solid-native](https://github.com/solidjs-community/solid-primitives) / [Solid Pixi](https://github.com/Shadowsith/solid-pixi)，但远不如 React Native 成熟

**缺点**

- **生态规模小**：UI 库选择有限（[Kobalte](https://kobalte.dev/) / [Hope UI](https://hope-ui.com/) / [solid-headless](https://github.com/lxsmnsyc/solid-headless) / [@suid](https://suid.io/)），数量级远低于 React；企业级后台组件库尤其缺
- **招聘市场小**：候选人数量、岗位数量、培训资源都比 React / Vue 少一个数量级；商业项目押注前要评估招聘风险
- **「响应式心智模型」需要重新学**：从 React 来的人会本能踩坑——signal 不是 React state，组件**只跑一次**；不会有「重渲染」概念
- **解构 props 失去响应性**：`const { count } = props` 之后 `count` 是死值；必须 `props.count` 或 `splitProps`
- **2.0 仍在孵化**：`@solidjs/signals` 实验分支在重写响应式核心，业界对生产稳定版的等待已有 1+ 年
- **SolidStart 部分能力仍 polishing**：相比 Next.js 15 的 RSC / 缓存层 / Partial Prerendering，SolidStart 在 edge case 处理上仍偶有 issue
- **第三方库往往要 wrap**：现有 React 组件库不能直接复用，需要专门的 Solid 版本或用 web-component 桥接

## 文档地址

[SolidJS](https://www.solidjs.com/) | [docs.solidjs.com](https://docs.solidjs.com/) | [SolidStart](https://docs.solidjs.com/solid-start)

## GitHub 地址

[solidjs/solid](https://github.com/solidjs/solid)

## 幻灯片地址

<a href="/SlideStack/solid-slide/" target="_blank">Solid</a>
