---
layout: doc
---

# React Use

**一套庞大的 React Hooks 工具集合（Collection of essential React Hooks）**——由 **streamich（Vadim Dalecky）** 发起、社区共同维护的 **React 专用** Hooks 库，是 React 生态里**收录 hook 数量最多、覆盖面最广**的工具型 Hook 集合之一（**100+ hooks**）。**npm 包 `react-use`**，**React 专用**、**TypeScript 编写**、**完全 Tree-shakeable**。它的文档形态很有特色：**GitHub README 按"使用场景"把所有 hook 分成六大类** —— **Sensors（传感器：鼠标/滚动/窗口尺寸/地理位置/网络状态…）、UI（音视频/全屏/滑块/点击外部…）、Animations（动画：useRaf / useInterval / useSpring / useTween…）、Side-effects（副作用：异步/防抖节流/本地存储/剪贴板/标题…）、State（状态：useToggle / useList / useMap / useSetState…）、Lifecycles（生命周期：useMount / useUpdateEffect / useDeepCompareEffect…）**，每个 hook 配一份 `docs/*.md` 和在线 Storybook 演示。**最关键的定位认知**：react-use 在「**组合式函数库**」这一象限里，**对标的是 Vue 生态的 VueUse**（同为"广覆盖的浏览器 API + 通用工具型 hook 集合"），而**不是 ahooks**——**react-use 没有 ahooks 那种带轮询/缓存(SWR)/refreshDeps/手动自动模式的重型 `useRequest`**；它的异步只有三件套：**`useAsync`（挂载即自动执行，返回 `{ loading, error, value }`）、`useAsyncFn`（手动调 callback 才发起，返回 `[state, callback]`）、`useAsyncRetry`（多一个 `retry`）**——轻量、只暴露 loading/error/value，**无缓存、无去重、无轮询**。**几个被高频使用的"明星" hook**：`useToggle` / `useBoolean`（布尔切换，返回 `[on, toggle]`）、`useLocalStorage`（响应式本地存储，返回 `[value, setValue, remove]`）、`useDebounce` / `useThrottle`、`useCounter`（带 min/max 钳制）、`useList` / `useMap` / `useSet`（集合状态）、`useSetState`（对象浅合并）、`useInterval`（声明式定时器，`delay=null` 暂停）、`useClickAway`（点击外部）、`useMeasure`（ResizeObserver 测尺寸）、`usePrevious`（上一次值）、`useCopyToClipboard`、`createGlobalState`（无需 Context 的跨组件全局状态）。**典型用户群**：**广大 React 项目**——尤其是需要大量「浏览器交互 + 通用状态/副作用」工具 hook、又不想自己造轮子的团队；偏好「**社区生态、海量现成 hook**」而非「阿里企业级 useRequest 体系」的开发者。

## 评价

**优点**

- **收录数量最多、覆盖面最广**：100+ hook 覆盖传感器 / UI / 动画 / 副作用 / 状态 / 生命周期六大场景，「浏览器交互 + 通用模式」的重复劳动几乎都能找到现成 hook
- **每个 hook 都有独立文档 + Storybook 演示**：边看边试，上手成本低
- **轻量的异步三件套**：`useAsync` / `useAsyncFn` / `useAsyncRetry` 简单直接——挂载自动执行用 `useAsync`、手动触发用 `useAsyncFn`、需重试用 `useAsyncRetry`，**学习成本远低于重型请求库**
- **`createGlobalState` 零依赖全局状态**：一个工厂生成可跨组件共享的状态 hook，**无需 Context / Redux / Zustand**，轻量场景很顺手
- **完全 Tree-shakeable + TypeScript**：按需打包、类型完备
- **声明式定时器/动画**：`useInterval` / `useTimeoutFn` / `useRaf` / `useSpring` / `useTween`——把命令式的 `setInterval` / `requestAnimationFrame` 封装成声明式 hook，`delay=null` 即暂停
- **丰富的集合状态 hook**：`useList` / `useMap` / `useSet` / `useQueue` / `useStateList` / `useStateWithHistory`（带撤销重做）——比裸 `useState` 管理复杂结构方便
- **社区活跃、被广泛采用**：是 React Hooks 库的"老牌选择"，资料多、踩坑案例全

**缺点**

- **没有企业级 `useRequest`**：**这是与 ahooks 最大的差距**——无轮询、无缓存(SWR)、无 `refreshDeps`、无手动/自动模式、无请求防抖节流；需要这些请用 **ahooks**（React）或直接上 **SWR / TanStack Query**（专业服务端状态）
- **React 专用**：Vue 项目用 **VueUse**（react-use 的"对位库"）
- **API 返回形态不统一、易混淆**：`useToggle` 返回 `[on, toggle]`、`useCounter` 返回 `[current, actions]` 元组，但 `useQueue` / `useStateList` 返回的是**对象**（非元组）、`useAsync` 返回对象而 `useAsyncFn` 返回数组——**用前需看清每个 hook 的返回结构**
- **一些"反直觉"的坑**：`useToggle` 的 `toggle` **不能直接当 `onClick` 传**（event 会被当真值写入，使布尔变成对象）；`useMap` 跟踪的是**普通对象而非 ES Map**（无 `has` / `size`）；`useMountedState` 返回的是**函数**（要 `isMounted()` 调用，不是 `isMounted`）
- **部分 hook 依赖/兼容性问题**：`useMeasure` 旧浏览器需 `ResizeObserver` polyfill；`useSpring` 因可选 `rebound` 依赖需**直接 `import useSpring from 'react-use/lib/useSpring'`**；`useBattery` 基于已废弃的 Battery API
- **SSR 注意**：访问 `window` / `localStorage` 的 hook 在服务端会报错，需自行降级
- **维护节奏放缓**：作者后续把精力转向新项目，react-use 迭代不如早期活跃（但仍稳定可用、社区基数大）
- **`useSetState` 仅浅合并**：嵌套对象会被整层覆盖，与原生 `useState` 混用易丢字段

## 文档地址

[react-use README（全量 hook 分类）](https://github.com/streamich/react-use#readme) | [在线 Storybook 演示](https://streamich.github.io/react-use/) | [useAsync](https://github.com/streamich/react-use/blob/master/docs/useAsync.md) | [useLocalStorage](https://github.com/streamich/react-use/blob/master/docs/useLocalStorage.md) | [npm: react-use](https://www.npmjs.com/package/react-use)

## GitHub 地址

[streamich/react-use](https://github.com/streamich/react-use)（主仓库，Unlicense 许可，社区维护）| [streamich（Vadim Dalecky）](https://github.com/streamich)（作者）

## 学习路径

- [入门](./getting-started.md)：`npm i react-use` 安装 / react-use 是什么（**对标 VueUse、而非 ahooks**——无重型 useRequest） / 六大类总览 / 异步三件套 `useAsync` / `useAsyncFn` / `useAsyncRetry`（与 ahooks useRequest 的本质区别） / 基本用法（`[on, toggle]` 元组 + 返回形态不统一的提醒 + 副作用清理） / 第一个 react-use 应用（`useToggle` + `useLocalStorage` + `useAsync` 综合示例） / SSR / TypeScript
- [指南](./guide-line.md)：**State 类**（`useToggle` / `useCounter` / `useList` / `useMap` / `useSet` / `useSetState` / `useStateWithHistory` 撤销重做） / **Side-effects 类**（异步三件套深度 / `useLocalStorage` 序列化 / `useDebounce` 依赖驱动 / `useCopyToClipboard`） / **Sensors 类**（`useMouse` / `useScroll` / `useWindowSize` / `useMeasure` / `useNetworkState` / `useGeolocation`） / **UI & Animations 类**（`useFullscreen` / `useClickAway` / `useInterval` / `useSpring` / `useTween`） / **Lifecycles 类**（`useMount` / `useUpdateEffect` / `useDeepCompareEffect` / `useMountedState`） / **`createGlobalState` 全局状态** / **常见坑**（toggle 不能直传 onClick、useMap 非 ES Map、返回形态不统一、useSpring 直接 import、SSR）
