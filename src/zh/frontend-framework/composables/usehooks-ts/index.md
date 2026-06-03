---
layout: doc
---

# usehooks-ts

**一个 TypeScript-first 的精简 React Hooks 库（A React hooks library, ready to use, written in Typescript）**——由 **Julien Caron（juliencrn）** 维护，**刻意保持小而专注**：**当前 v3.1.1（33 个 hook）**，**100% TypeScript 编写**、**SSR 友好**、**完全 Tree-shakeable（v3 起整包改为纯 ESM）**，每个 hook 独立单文件、文档站 [usehooks-ts.com](https://usehooks-ts.com/) 上**可直接复制源码**。**核心定位认知**：usehooks-ts 在「组合式函数库」里是「**最克制、类型最干净的那一档**」——**比 react-use（大而全 100+）和 ahooks（企业级、含 useRequest）都小得多、更聚焦**，**完全没有数据请求 hook**（v3 已移除 `useFetch`，更没有 ahooks 那种轮询/缓存/SWR 的 `useRequest`）；它专注「**布尔/计数/存储/媒体查询/暗色模式/事件监听/防抖/定时器**」这类**高频、轻量、类型完备**的基础 hook。**v3 重大变更（迁移时务必注意）**：原 `useDebounce` **拆成** `useDebounceValue`（防抖值）+ `useDebounceCallback`（防抖函数）；**移除**了 `useFetch` / `useSsr` / `useImageOnLoad` / `useElementSize` / `useIsFirstRender` / `useUpdateEffect`；整包改为 **ESM-only**；v3.1.0 给 `useLocalStorage` / `useSessionStorage` 的返回元组**新增第三个元素 `removeValue`**。**一个最容易踩的坑——返回形态「对象 vs 元组」不统一**：`useBoolean` / `useCounter` / `useDarkMode` / `useTernaryDarkMode` 返回**对象**（按 key 解构，如 `{ value, setTrue, setFalse, toggle }`），而 `useToggle`（`[value, toggle, setValue]`）/ `useLocalStorage`（`[value, setValue, removeValue]`）/ `useStep` / `useCopyToClipboard`（`[copiedText, copy]`）/ `useMap` / `useCountdown` / `useDebounceValue` 返回**元组**，`useReadLocalStorage` / `useHover` / `useMediaQuery` 直接返回**裸值**——**用前必须看清每个 hook 的返回结构**。**33 个 hook 一览**：`useBoolean` / `useToggle` / `useCounter` / `useStep` / `useMap`（状态）、`useLocalStorage` / `useSessionStorage` / `useReadLocalStorage` / `useCopyToClipboard`（存储/剪贴板）、`useDarkMode` / `useTernaryDarkMode` / `useMediaQuery`（主题/媒体）、`useEventListener` / `useOnClickOutside` / `useClickAnyWhere` / `useHover` / `useScrollLock` / `useIntersectionObserver` / `useResizeObserver` / `useWindowSize` / `useScreen` / `useDocumentTitle`（DOM/布局）、`useInterval` / `useTimeout` / `useCountdown` / `useDebounceValue` / `useDebounceCallback` / `useEventCallback`（定时/防抖）、`useIsomorphicLayoutEffect` / `useUnmount` / `useIsMounted` / `useIsClient` / `useScript`（生命周期/工具）。**典型用户群**：**追求「类型干净、依赖极少、按需引入、看得懂源码」的 React 项目**——不需要 react-use 那么多 hook、也不需要 ahooks 的请求体系，只想要一套**靠谱的基础 hook**。

## 评价

**优点**

- **TypeScript-first、类型最干净**：100% TS 编写，签名清晰，是「类型体验最好」的一档 hooks 库
- **刻意精简、聚焦**：仅 33 个高频 hook，没有冗余——心智负担小，每个 hook 都"能用得上"
- **单文件、可复制**：每个 hook 独立单文件、文档站可直接复制源码——**甚至可以不装包，直接拷进项目**
- **SSR 友好**：`useLocalStorage` / `useWindowSize` / `useMediaQuery` / `useScreen` 等都提供 `initializeWithValue: false` 选项规避 hydration 不一致
- **完全 Tree-shakeable**：v3 起纯 ESM，按需打包
- **`useLocalStorage` 跨标签同步**：通过自定义 `local-storage` 事件，多标签/多组件自动同步
- **依赖极少、迭代克制**：不追求大而全，稳定可靠；React 16.8 ~ 19 全支持（v3.1.1 加了 React 19）
- **文档站体验好**：每个 hook 有说明 + 在线示例 + 源码

**缺点**

- **完全没有数据请求 hook**：v3 移除了 `useFetch`，更没有 ahooks 式 `useRequest`（轮询/缓存/SWR）——**请求管理需自己搭或上 SWR / TanStack Query**
- **hook 数量远少于 react-use**：很多 react-use / ahooks 有的 hook（如复杂集合操作、传感器、动画）这里没有——需要广覆盖请用 react-use
- **返回形态「对象 vs 元组」不统一**：**最大的坑**——`useBoolean` 返回对象、`useToggle` 返回元组且顺序是 `[value, toggle, setValue]`（`toggle` 在 `setValue` 前），混用极易出错
- **v3 破坏性变更多**：`useDebounce` 拆分、多个 hook 被移除、ESM-only——**从 v2 升级需改不少代码**（按旧签名写的会直接报错）
- **`useMap` 用法特殊**：返回的是真实 `Map` 但 `set` / `clear` / `delete` 被 `Omit` 隐藏，**必须通过返回的 actions 改、不能 `map.set()`**
- **ESM-only 可能影响老构建链**：纯 ESM 包在某些老 CommonJS / Jest 配置下需额外处理
- **vs react-use / ahooks**：胜在"小而精、类型好"，输在"覆盖面"——选型看你要「克制」还是「全能」

## 文档地址

[usehooks-ts 官网](https://usehooks-ts.com/) | [全部 Hook 列表](https://usehooks-ts.com/introduction) | [useLocalStorage](https://usehooks-ts.com/react-hook/use-local-storage) | [useBoolean](https://usehooks-ts.com/react-hook/use-boolean) | [npm: usehooks-ts](https://www.npmjs.com/package/usehooks-ts)

## GitHub 地址

[juliencrn/usehooks-ts](https://github.com/juliencrn/usehooks-ts)（主仓库，MIT 许可）| [Julien Caron（juliencrn）](https://github.com/juliencrn)（作者）

## 学习路径

- [入门](./getting-started.md)：`npm i usehooks-ts` 安装 / usehooks-ts 是什么（与 react-use / ahooks 的区别——最克制、无请求 hook） / **v3 重大变更**（`useDebounce` 拆分、移除清单、ESM-only） / **返回形态「对象 vs 元组」陷阱** / 基本用法（`useBoolean` 对象 vs `useToggle` 元组 vs `useLocalStorage` 元组） / 第一个 usehooks-ts 应用（`useBoolean` + `useLocalStorage` + `useDarkMode` 综合示例） / SSR（`initializeWithValue`） / TypeScript
- [指南](./guide-line.md)：**状态类**（`useBoolean` / `useToggle` / `useCounter` / `useStep` / `useMap`） / **存储与剪贴板**（`useLocalStorage` 跨标签同步 + `removeValue` / `useReadLocalStorage` / `useCopyToClipboard`） / **主题与媒体**（`useDarkMode` / `useTernaryDarkMode` / `useMediaQuery`） / **DOM 与布局**（`useEventListener` / `useOnClickOutside` / `useResizeObserver` / `useIntersectionObserver` / `useScrollLock` / `useWindowSize`） / **定时与防抖**（`useInterval` / `useTimeout` / `useCountdown` / `useDebounceValue` / `useDebounceCallback`） / **生命周期工具**（`useIsClient` / `useIsMounted` / `useScript` / `useIsomorphicLayoutEffect`） / **常见坑**（对象 vs 元组、useToggle 顺序、useMap 必须用 actions、v3 移除清单、ESM-only）
