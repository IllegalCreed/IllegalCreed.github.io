---
layout: doc
---

# React

Meta（原 Facebook）开源的声明式 UI 库，把 UI 写成 `f(state) => view` 的纯函数。React 把自己定位为「**Library**」而非「**Framework**」——只负责组件渲染与状态调度，路由、数据获取、SSR、构建都交给生态（Next.js / Remix / Vite / TanStack Router 等）。React 19（2024.12 稳定）引入了 Server Components、Actions、`use` API、ref as prop、文档元数据原生支持等大批面向「全栈 React」的特性；同时配套的 React Compiler 进入 RC 阶段，自动 memoization 让 `useMemo` / `useCallback` 多数情况下不再必要。

## 评价

**优点**

- **心智模型最纯粹**：UI = f(state)，没有指令、没有模板编译器、没有 magic；JSX 就是 JavaScript，组件就是函数，调试栈干净
- **生态体量最大**：UI 库（MUI / Ant Design / Chakra / Mantine / shadcn/ui / Radix）、状态库（Redux Toolkit / Zustand / Jotai / Recoil / Valtio / TanStack Store）、数据库（TanStack Query / SWR / RTK Query / Apollo）每个赛道都有 5-10 个成熟方案
- **元框架繁荣**：Next.js 是事实工业标准；Remix（已并入 React Router v7）、Astro、TanStack Start、Waku、RedwoodJS 各有侧重；Vite + React Router 也能撑住中型项目
- **跨端复用**：React Native / React Native for Web / Expo / Tamagui 让同一套组件覆盖 iOS / Android / Web；react-three-fiber、react-pdf、Ink 让 React 范式延伸到 3D / PDF / CLI
- **招聘市场最大**：全球 React 候选人比 Vue / Angular 多一个数量级，企业招聘相对容易
- **React 19 + Compiler 重大跃迁**：Server Components 让数据获取下沉到服务端，Compiler 自动 memo 把性能心智负担降到接近 Vue / Solid 水平
- **官方文档质量高**：react.dev 2023 重写后是行业标杆，从入门到 Reconciler 内部都有图示讲解

**缺点**

- **学习曲线分裂**：传统 React（Class / Hooks）、React 19 + RSC、React Compiler 三套心智模型并存；新人容易被「我到底该学哪个？」劝退
- **「Library 不是 Framework」反面**：路由 / SSR / 数据获取 / 构建样样要自己选，决策疲劳；新项目第一周可能花在选型上
- **Hooks Rules 心智负担**：依赖数组、闭包陷阱、`useEffect` 误用是新人和高手都会踩的坑；Compiler 之前需要大量手动 memo
- **JSX 编译需链**：必须装 Babel / SWC / esbuild，没有像 Vue / Svelte 那样的「直接放在 HTML 里 import」最小路径
- **运行时无编译优化**：传统 React 把 diff 全留给运行时，与 Vue / Svelte / Solid 的编译时优化路线相比性能上限低（Compiler 部分补齐）
- **RSC 复杂度高**：Server Components / Server Actions / `'use client'` / `'use server'` 边界容易写错；目前几乎只有 Next.js App Router 完整支持
- **TypeScript 类型偶有不直观**：`FC` / `ComponentProps` / `ForwardRefExoticComponent` / 泛型组件这些类型工具需要专门学

## 文档地址

[React](https://react.dev/)

## GitHub 地址

[facebook/react](https://github.com/facebook/react)

## 幻灯片地址

<a href="/SlideStack/react-slide/" target="_blank">React</a>
