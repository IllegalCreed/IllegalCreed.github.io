---
layout: doc
outline: [2, 3]
---

# 指南

> 本篇深入 Preact 的核心 API、Hooks、与 React 的差异、`preact/compat` 兼容层、`@preact/signals` 与工具链，并汇总常见坑。基于 v10.x。

## 核心 API

| API | 说明 |
|---|---|
| `h(type, props, ...children)` | JSX 编译目标（`createElement` 别名）；children 可为标量/VDOM/嵌套数组 |
| `render(vdom, container[, replaceNode])` | 渲染 VDOM 到容器；`replaceNode` 参数 **将在 v11 移除** |
| `hydrate(vdom, container)` | SSR 水合——跳过大部分 diff 仅挂事件，复用预渲染 HTML |
| `Component` | 类组件基类，`render(props, state)` 返回 VDOM/数组/null |
| `Fragment` | 不渲染 DOM 元素的容器组件 |
| `cloneElement(vnode, props, ...children)` | 浅拷贝 VDOM 元素 |
| `createContext(initial)` / `createRef(initial)` / `toChildArray(children)` | 上下文 / 稳定 ref / 扁平化 children |

```jsx
// 类组件：props/state 作参数传入（区别于 React 的 this.props/this.state）
class Profile extends Component {
  render({ name }, { age }) { return <p>{name} - {age}</p> }
}
```

## Hooks（来自 preact/hooks）

> ⚠️ Hooks **不在核心 `preact`**——必须从 **`preact/hooks`** 导入（从 `preact` 导 `useState` 会失败）。

`useState` / `useReducer` / `useEffect` / `useLayoutEffect` / `useRef` / `useImperativeHandle` / `useMemo` / `useCallback` / `useContext` / `useId` / **`useErrorBoundary`**（Preact 特有，`const [error, reset] = useErrorBoundary(cb?)`）。

签名与 React 一致，如 `useEffect(() => { return () => cleanup() }, [deps])`、`setState(c => c + 1)` 函数式更新。

## 与 React 的差异详解

| 差异 | Preact | React |
|---|---|---|
| **事件系统** | **原生 `addEventListener`，无合成事件** | 合成事件系统 |
| 表单事件 | **`onInput`** | `onChange`（实为 input 事件） |
| 双击 | `onDblClick` | `onDoubleClick` |
| Portal 事件冒泡 | **不穿过 Portal 冒泡** | 穿过 Portal 冒泡 |
| class 属性 | **`class` 和 `className` 都支持** | 只 `className` |
| SVG 属性 | **kebab-case 原样写**（`stroke-width`） | camelCase（`strokeWidth`） |
| 类组件 render | **`render(props, state)`** 参数 | `this.props` / `this.state` |
| Context | **默认全传**，无需 `contextTypes` | 需配置 |

> `preact/compat` 会把这些差异**归一化为 100% React 兼容**——用 React 库时它处理掉差异。

## preact/compat 生态兼容

通过把 React 入口别名到 `preact/compat`，**无改动运行 React 库**：

```ts
// Vite —— 官方 preset 自动配
import preact from '@preact/preset-vite'
export default { plugins: [preact()] }
```

```js
// webpack / Jest —— 手动别名，⚠️ 具体键在前、宽泛键在后
resolve: {
  alias: {
    'react/jsx-runtime': 'preact/compat/jsx-runtime',
    'react-dom/test-utils': 'preact/test-utils',
    react: 'preact/compat',
    'react-dom': 'preact/compat',
  },
}
```

`preact/compat` 导出：`Children` / `forwardRef` / `memo` / `createPortal` / `Suspense` / `lazy` / `version` / `render` / `hydrate` / `unmountComponentAtNode` 等。

### 调试

- `import 'preact/debug'`：开发期警告 + DevTools 钩子——**必须是整个应用的第一个 import**
- `import 'preact/devtools'`：更轻，仅连接 Preact DevTools（生产可用）
- Preact DevTools 浏览器扩展

## @preact/signals（细粒度响应式状态）

```jsx
import { signal, computed, effect, batch } from '@preact/signals'

const count = signal(0)              // .value 读写
const double = computed(() => count.value * 2) // 派生只读信号，惰性
effect(() => console.log(count.value))         // 依赖变化即重跑，返回 dispose
count.value++                        // 触发更新
batch(() => { count.value++; count.value++ }) // 合并多次写入，effect 只跑一次
```

### JSX 里直接用 signal（关键）

```jsx
const count = signal(0)
function App() {
  // 直接用 count（无需 .value）—— 自动订阅，且只更新这个文本节点，跳过组件级重渲染
  return <p>Value: {count}</p>
}
```

- 组件内：`useSignal(initial)` / `useComputed(fn)` / `useSignalEffect(fn)`
- 三个包：`@preact/signals`（Preact 绑定）/ `@preact/signals-core`（框架无关核心）/ `@preact/signals-react`（React 版）
- `.peek()` / `untracked(fn)`：读值但**不建立订阅**

> **vs `useState`**：`useState` 每次变化**重渲染整个组件**；signal 在 JSX 直接使用时**只更新真正用到它的节点**，跳过组件 diff——更细粒度、更快。

## 工具链

| 工具 | 说明 |
|---|---|
| `npm init preact`（create-preact） | 现代脚手架（TS/路由/ESLint 选项）；`preact-cli` 是旧方案 |
| `@preact/preset-vite` | Vite 预设，自动配 compat 别名 + JSX |
| `preact-render-to-string` | SSR：`renderToString(<App />)` 生成 HTML |
| Deno **Fresh** | 基于 Preact 的全栈框架 |

## 常见坑

- **Hooks 不在核心**：从 `preact` 导 `useState` 失败，必须 `preact/hooks`
- **表单用 `onInput` 不是 `onChange`**：纯 Preact 里 `onChange` 是真 change 语义；别以为 `onChange` = input
- **`preact/compat` 别名顺序**：具体键（`react-dom/test-utils`、`react/jsx-runtime`）放在宽泛的 `react`/`react-dom` **之前**
- **SVG 用 kebab-case**：`stroke-width` 而非 `strokeWidth`（直接粘 SVG 很方便，但从 React 迁移要改）
- **类组件 render 取参数**：`render(props, state)` 而非 `this.props`/`this.state`
- **事件不穿 Portal 冒泡**：与 React 不同
- **`render()` 的 `replaceNode` 将在 v11 移除**
- **`preact/debug` 须首位导入**：否则部分警告失效
- **不是 100% React**：直接迁 React 代码要么改差异、要么上 `preact/compat`
- **signal 在 JSX 外需 `.value`**：JSX 里直接用 signal 自动解包+订阅；JS 逻辑里读写要 `.value`
