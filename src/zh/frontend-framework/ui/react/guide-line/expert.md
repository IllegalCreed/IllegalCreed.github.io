---
layout: doc
outline: [2, 3]
---

# 指南 - 高级

> 基于 React 19.x 编写 —— Compiler / RSC 内部 / Reconciler / 性能优化 / SSR / 测试 / 微前端 / Native / 自定义 Reconciler

## 速查

- **React Compiler**：自动 memoization 编译器，2025 进入 RC，babel 插件 + ESLint 插件配套
- **Fiber Reconciler**：可中断的双 buffer diff 算法，支持 lane 优先级
- **RSC Payload / Flight**：Server Components 的二进制流协议
- **Concurrent Rendering**：可中断渲染 + lane 优先级 + Transition 标记
- **Hydration**：完整 / 部分 / 选择性（Selective Hydration）
- **测试**：Vitest / Jest + Testing Library + Playwright Component / Storybook
- **微前端**：Module Federation v2（Webpack 5） / single-spa / qiankun
- **Native**：React Native 0.77+ New Architecture（Bridgeless + JSI + Fabric + TurboModules）
- **自定义 Reconciler**：react-three-fiber（3D）/ react-pdf（PDF）/ Ink（CLI）

## React Compiler 深入

### 是什么

React Compiler 是 Meta 内部已生产使用 4 年（Instagram / Facebook）、2024 年 10 月开源、2025 年进入 RC 的编译器。**核心能力**：自动 memoization。

```tsx
// 你写
function ProductList({ products, filter }) {
  const visible = products.filter(p => p.tag === filter)
  return <List items={visible} onClick={p => addToCart(p.id)} />
}

// Compiler 编译后（伪代码）
function ProductList({ products, filter }) {
  const $ = useMemoCache(3)
  let visible
  if ($[0] !== products || $[1] !== filter) {
    visible = products.filter(p => p.tag === filter)
    $[0] = products
    $[1] = filter
    $[2] = visible
  } else {
    visible = $[2]
  }
  // onClick 也类似被 memo
  return <List items={visible} onClick={memoizedOnClick} />
}
```

**收益**：

- 自动 memo 计算、对象、函数引用
- 子组件 props 引用稳定 → 不需要手动 `React.memo` / `useMemo` / `useCallback`
- 写代码心智回归到「纯函数」，性能优化由编译器代劳

### 安装

```bash
# Babel 插件
pnpm add -D babel-plugin-react-compiler@latest

# ESLint 插件（检查 Rules of React + Compiler 兼容性）
pnpm add -D eslint-plugin-react-hooks@latest
```

### Vite 配置

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
})
```

### Next.js 配置

```ts
// next.config.ts
export default {
  experimental: {
    reactCompiler: true,
  },
}
```

### Babel 配置（独立用）

```js
// babel.config.js
module.exports = {
  plugins: [
    'babel-plugin-react-compiler',   // 必须在最前面
    // ... 其它插件
  ],
}
```

### 兼容性

| React 版本 | Compiler 支持 | 说明 |
|---|---|---|
| **19+** | ✅ 完整 | 推荐使用 |
| **18** | ✅ 通过 `target: '18'` | 需要 `react-compiler-runtime` package |
| **17** | ✅ 通过 `target: '17'` | 同上 |
| **16 及以下** | ❌ | 不支持 |

React 17/18 配置示例：

```js
// babel.config.js
module.exports = {
  plugins: [
    ['babel-plugin-react-compiler', { target: '18' }],
  ],
}
```

并安装 runtime：

```bash
pnpm add react-compiler-runtime@latest
```

### Rules of React（Compiler 要求）

Compiler 假设你的代码符合 [Rules of React](https://react.dev/reference/rules)：

1. **组件 / Hooks 必须是纯函数**——同样输入 → 同样输出，无副作用
2. **不要在渲染期修改 props / state**——只能用 setter
3. **Effect 之外不要做副作用**——网络、DOM 操作、订阅
4. **Hooks 只在组件 / 其它 Hooks 内调用**
5. **Hooks 调用顺序固定**——不能放条件 / 循环（除了 React 19 `use`）

ESLint `eslint-plugin-react-hooks` 的 recommended 配置会检查这些规则 + 标记「无法被 Compiler 优化的代码」。

### 验证 Compiler 工作

**方法 1：React DevTools**

打开 Components 面板，被 Compiler 优化的组件名右边有「**Memo ✨**」徽章。

**方法 2：编译输出**

```js
// 编译后的文件里搜
import { c as _c } from "react/compiler-runtime"
```

有这一行 = Compiler 在工作。

### 跳过某个组件

在组件函数顶部写指令：

```tsx
function ComplexLegacyComponent() {
  'use no memo'   // 跳过 Compiler 优化
  // ... 老代码
}
```

适用于：

- 老代码不符合 Rules of React（暂时来不及改）
- Compiler 优化反而引发 bug（罕见，遇到请报 issue）

### 配置选项（编译模式）

```js
['babel-plugin-react-compiler', {
  // 编译模式
  compilationMode: 'annotation',   // 仅编译加了 'use memo' 指令的函数（保守）
  // 或 'infer'（自动推断组件 / hook，默认）
  // 或 'all'（编译所有函数）

  // sources：限定要编译的文件
  sources: (filename) => filename.includes('/src/'),

  // target: '17' | '18' | '19'（默认 19）
  target: '19',

  // 高级选项
  runtimeModule: 'react/compiler-runtime',
  panicThreshold: 'critical_errors',
}]
```

### 何时不用 Compiler

- 老项目代码大量违反 Rules of React，修复成本高
- Hot path 已经手动优化到位（Compiler 不会变更差，但收益有限）
- 团队对编译器引入的「不可见优化」有顾虑

## Server Components 内部机制

### RSC Payload

Server Components 输出**不是 HTML**——而是一个序列化的 React 元素树，叫 **RSC Payload** 或 **Flight payload**：

```
// 简化后的 payload（实际是分块流式的）
0:["$","html",null,{
  "children":[
    ["$","head",null,{}],
    ["$","body",null,{
      "children":[
        ["$","h1",null,{"children":"Hello"}],
        ["$","$L1",null,{"props":{"id":"123"}}]   // 引用 Client Component #1
      ]
    }]
  ]
}]
1:I["./Counter.js",["chunk-abc.js"],"Counter"]   // Client Component 模块映射
```

**关键设计**：

- 每个 RSC 节点序列化成 `[type, key, props]` 三元组
- Client Components 序列化成「**模块引用**」——客户端按需加载对应 chunk
- Promises 直接被序列化，客户端 `await` 直到 resolve
- 二进制流式传输，浏览器边接收边渲染

### Flight 协议

Flight = React 内部传输 RSC payload 的协议：

- 基于 HTTP 流（chunked transfer / Web Streams）
- 行式分块（每行一个 chunk）
- 第一个 chunk 是「壳」，后续 chunk 异步流入填充 Suspense

### Streaming HTML + RSC

Next.js 等元框架的渲染流程：

1. **请求到达** → 服务端开始执行 RSC
2. **第一帧 HTML** → 包含 `<head>`、外层结构、Suspense 占位符（loading）
3. **数据 resolve** → 服务端 stream 出对应 Suspense 子树的 HTML + RSC payload
4. **客户端 hydrate** → React 接收 RSC payload，按需加载 Client Component chunk
5. **完成** → 客户端持有完整 RSC payload，能进行下一次导航的客户端导航

### `'use client'` 边界编译

```tsx
// counter.tsx
'use client'
export function Counter() { ... }
```

打包工具看到 `'use client'` 会做两件事：

1. **服务端构建**：把 `Counter` 替换成「客户端引用占位符」`{ $$typeof: Symbol.for('react.client.reference'), filepath, name }`
2. **客户端构建**：把 `Counter` 单独打包成 chunk，URL 写入 manifest

服务端渲染时遇到客户端引用 → 输出 `["$","$L1",null,{...props}]` + manifest 让客户端按需加载。

## Concurrent Rendering 内部

### Fiber 架构

React 16 引入的 Fiber Reconciler 把渲染从「**递归不可中断**」改成「**链表可中断**」：

```
// React 15 Stack Reconciler
function render(element) {
  // 递归渲染所有子节点，main thread 阻塞直到完成
  for (const child of element.children) {
    render(child)
  }
}

// React 16+ Fiber Reconciler
// 每个组件 → 一个 Fiber 节点（包含 child / sibling / return 指针）
// 渲染时遍历链表，每个 unit 检查时间片
function workLoop() {
  while (nextUnit && !shouldYield()) {
    nextUnit = performUnitOfWork(nextUnit)
  }
  if (nextUnit) {
    requestIdleCallback(workLoop)   // 让出主线程，下个 frame 继续
  } else {
    commit()   // 全部 unit 完成，进入 commit phase
  }
}
```

**Fiber 节点字段**（简化）：

```ts
interface Fiber {
  type: any                   // 组件函数 / DOM 标签
  key: string | null
  stateNode: any              // 对应 DOM / 组件实例
  child: Fiber | null         // 第一个孩子
  sibling: Fiber | null       // 下一个兄弟
  return: Fiber | null        // 父节点
  pendingProps: any
  memoizedProps: any
  memoizedState: any          // hooks 链表头
  alternate: Fiber | null     // 双 buffer 的另一棵
  lanes: number               // 优先级位图
  flags: number               // 副作用标记
}
```

### 双 buffer（current / workInProgress）

```
current 树（屏幕上显示的）
   ↓
   alternate 指针
   ↓
workInProgress 树（正在构建的）
```

渲染：在 workInProgress 树上 diff，完成后 commit；commit 时把 alternate 切到 current。

### Lane 优先级

React 18 引入「Lane Model」给更新分优先级：

| Lane | 优先级 | 来源 |
|---|---|---|
| `SyncLane` | 最高 | 同步代码（点击、输入） |
| `InputContinuousLane` | 高 | hover / drag |
| `DefaultLane` | 中 | 常规更新 |
| `TransitionLane` | 低 | `useTransition` / `startTransition` |
| `IdleLane` | 最低 | offscreen render |

**Lane 行为**：

- 高优先级插队（如点击进入时打断 transition 渲染）
- 同优先级 batched（同一 tick 内 setState 合并一次渲染）
- React 调度器（Scheduler）独立 lib，可换实现

### 渲染暂停 + 恢复

```
开始渲染（Default Lane）
  → 渲染到一半，用户点击（Sync Lane）
  → 暂停当前 Default 渲染
  → 处理 Sync Lane（立即响应）
  → 重新开始 Default Lane 渲染（之前的废弃）
```

这就是为什么 React **要求渲染纯函数**——可能被打断和重跑。

## Reconciler 内部（双 buffer diff）

### Diff 算法

```
1. 同层 diff（不跨层移动节点）
2. 同类型组件：复用，更新 props
3. 不同类型组件：销毁旧的，挂载新的
4. 列表 diff：基于 key 匹配，无 key 用 index
```

伪代码（reconcileChildren）：

```ts
function reconcileChildren(returnFiber, currentChildren, newChildren) {
  // 用 key 建 map
  const existingChildren = new Map<string, Fiber>()
  for (let child = currentChildren; child; child = child.sibling) {
    existingChildren.set(child.key ?? child.index.toString(), child)
  }

  // 遍历新孩子
  let prev = null
  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i]
    const key = newChild.key ?? i.toString()
    const existing = existingChildren.get(key)

    if (existing && existing.type === newChild.type) {
      // 复用：更新 props
      const reused = useFiber(existing, newChild.props)
      existingChildren.delete(key)
      // 链接到链表
    } else {
      // 新建
      const fiber = createFiberFromElement(newChild)
      fiber.flags |= Placement
    }
  }

  // 剩下的 existingChildren 是要删除的
  for (const remaining of existingChildren.values()) {
    remaining.flags |= Deletion
  }
}
```

### Commit Phase

Render phase 可中断；commit phase **不可中断**，分三步：

1. **Before Mutation**：拿快照（`getSnapshotBeforeUpdate`）、调度 effect
2. **Mutation**：实际 DOM 操作（增删改）、调用 cleanup
3. **Layout**：`componentDidMount` / `componentDidUpdate` / `useLayoutEffect` 同步执行

`useEffect` 在 commit 之后异步调度（不阻塞绘制）。

## 性能优化深入

### React Profiler

代码中嵌 Profiler：

```tsx
import { Profiler } from 'react'

<Profiler
  id="App"
  onRender={(id, phase, actualDuration, baseDuration, startTime, commitTime) => {
    console.log({ id, phase, actualDuration, baseDuration })
  }}
>
  <App />
</Profiler>
```

`actualDuration` = 实际花费时间；`baseDuration` = 不优化情况下的时间。差越大说明 memo 越有效。

### React DevTools Profiler 实战

1. 打开 DevTools → Profiler 面板
2. 点录制按钮
3. 操作页面
4. 停止录制 → 看 flame graph

**关注**：

- **每次 commit 的总时长**：超过 16ms 会丢帧
- **Why did this render**（点击组件查看）：props / state / hooks / parent re-render
- **Ranked View**：按耗时排序找瓶颈

### why-did-you-render

```bash
pnpm add @welldone-software/why-did-you-render
```

```tsx
// wdyr.ts（开发期加载）
import React from 'react'
import whyDidYouRender from '@welldone-software/why-did-you-render'

if (process.env.NODE_ENV === 'development') {
  whyDidYouRender(React, {
    trackAllPureComponents: true,
  })
}

// main.tsx
import './wdyr'
```

控制台会打印每个 React.memo 组件「为什么重渲染」（props 引用 vs 浅比较）。

### 大列表虚拟滚动

10000+ 行的列表必须虚拟化：

**react-window**（[npm](https://www.npmjs.com/package/react-window)）：

```tsx
import { FixedSizeList } from 'react-window'

function ItemRow({ index, style }: ListChildComponentProps) {
  return <div style={style}>Item {index}</div>
}

<FixedSizeList
  height={600}
  itemCount={10000}
  itemSize={35}
  width="100%"
>
  {ItemRow}
</FixedSizeList>
```

**TanStack Virtual**（更强大）：

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualList() {
  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: 10000,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5,
  })

  return (
    <div ref={parentRef} style={{ height: 600, overflow: 'auto' }}>
      <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            Item {virtualRow.index}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 防止不必要重渲染清单

1. **`React.memo`** 包裹纯子组件（Compiler 后多数自动）
2. **状态下移**：把状态放在最需要它的最底层组件
3. **Context 拆分**：高频变化和低频变化的 Context 分开（避免一变全树重渲染）
4. **`useMemo` / `useCallback`** 给 memo 子组件稳定引用
5. **拆分组件**：把频繁变化的部分单独提出来
6. **Zustand 选择器**：`useStore(s => s.field)` 只订阅特定字段

## SSR / SSG / RSC 对比

| 方式 | 数据获取 | 首字节延迟 | SEO | 客户端 JS | 适合 |
|---|---|---|---|---|---|
| **CSR**（SPA） | 客户端 | 快（静态 HTML） | 弱 | 全量 | 后台 / 内部工具 |
| **SSR** | 服务端 / 每次请求 | 慢（等数据） | 强 | 全量 + Hydration | 个性化页面 |
| **SSG** | 构建时 | 极快（CDN 静态） | 强 | 全量 + Hydration | 博客 / 营销页 |
| **ISR** | 构建 + 定期再生 | 极快 | 强 | 全量 + Hydration | 半动态内容 |
| **RSC** | 服务端 + 客户端 | 中（边渲染边发） | 强 | **仅 Client 部分** | 全栈应用（Next.js） |

### Next.js App Router vs Pages Router

| 维度 | Pages Router（老） | App Router（新） |
|---|---|---|
| 路由文件 | `pages/index.tsx` | `app/page.tsx` |
| 默认渲染 | CSR + Hydration | Server Components |
| 数据获取 | `getServerSideProps` / `getStaticProps` | 组件内 `async/await` |
| Layout | `_app.tsx` 全局 | 嵌套 `layout.tsx` |
| 加载状态 | 自己写 | `loading.tsx` 自动 Suspense |
| 错误处理 | 自己写 | `error.tsx` 自动 ErrorBoundary |
| 推荐 | 维护遗留项目 | 新项目首选 |

Next.js 15 完全围绕 App Router + RSC 构建，**新项目用 App Router**。

## Hydration

### 完整 Hydration

```tsx
// 客户端
import { hydrateRoot } from 'react-dom/client'
hydrateRoot(document.getElementById('root')!, <App />)
```

React 接收服务端渲染的 HTML，遍历虚拟 DOM 树绑定事件、初始化 state，**不重新生成 DOM**。

### Hydration Mismatch

```
Warning: Hydration failed because the initial UI does not match what was rendered on the server.
```

常见原因：

- 用 `Math.random()` / `Date.now()` / `new Date()` 生成内容
- 用 `typeof window !== 'undefined'` 判断生成不同内容
- 父组件用 `useEffect` 设 state（cliente only）

**解决**：

```tsx
// 1. useEffect 后端跳过
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null
return <div>{Math.random()}</div>

// 2. suppressHydrationWarning（仅文本节点）
<time suppressHydrationWarning>{new Date().toString()}</time>
```

### Selective Hydration（选择性水合）

React 18+ 支持：

- HTML 流式输出
- 客户端按 Suspense 边界分批 hydrate
- 用户优先交互的部分优先 hydrate（点击未 hydrate 的组件，React 提升其优先级）

### Partial Hydration（部分水合 / Islands）

只 hydrate「需要交互」的部分，纯静态部分不下载 JS。代表：

- **Astro**：Islands 架构鼻祖
- **Qwik**：Resumability（无需 hydration）

React 本身不直接支持 Islands，但通过 RSC + `'use client'` 可以达到类似效果——纯 Server Component 不进客户端 bundle。

## Edge Runtime

### Vercel Edge

```ts
// app/api/hello/route.ts
export const runtime = 'edge'

export async function GET() {
  return new Response('Hello from edge!')
}
```

Edge Runtime 限制：

- 不支持 Node.js API（fs / net / Buffer）
- 限定 Web Standards（fetch / Request / Response / Streams）
- 启动极快（10ms vs Node 100ms）
- 全球分布（CDN 节点）

### Cloudflare Workers + React

```ts
// 在 Cloudflare Workers 上跑 React SSR
import { renderToReadableStream } from 'react-dom/server'

export default {
  async fetch(request: Request) {
    const stream = await renderToReadableStream(<App />)
    return new Response(stream, { headers: { 'content-type': 'text/html' } })
  },
}
```

## 测试

### Vitest + Testing Library

```bash
pnpm add -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

```ts
// vite.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    globals: true,
  },
})
```

```ts
// test-setup.ts
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => cleanup())
```

```tsx
// Counter.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Counter } from './Counter'

describe('Counter', () => {
  it('increments on click', async () => {
    const user = userEvent.setup()
    render(<Counter />)

    expect(screen.getByText('0')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /increment/i }))
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
```

### Testing Library 查询规则

| 优先级 | 方法 | 用途 |
|---|---|---|
| 1 | `getByRole` | 无障碍角色（推荐） |
| 2 | `getByLabelText` | 表单标签 |
| 3 | `getByPlaceholderText` | placeholder |
| 4 | `getByText` | 文本内容 |
| 5 | `getByDisplayValue` | input 当前值 |
| 6 | `getByAltText` | img alt |
| 7 | `getByTitle` | title 属性 |
| 兜底 | `getByTestId` | `data-testid`（最后选择） |

变体：

- `getBy*`：找不到抛错
- `queryBy*`：找不到返回 null（测试「不存在」用这个）
- `findBy*`：异步等待出现（返回 Promise）

### Mocking

```tsx
import { vi } from 'vitest'

// Mock 模块
vi.mock('./api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ name: 'Alice' }),
}))

// Mock 单个函数
const spy = vi.spyOn(window, 'alert').mockImplementation(() => {})
expect(spy).toHaveBeenCalledWith('hello')

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: 'mock' }),
})
```

### Playwright Component Testing

```bash
pnpm create playwright --ct
```

```tsx
import { test, expect } from '@playwright/experimental-ct-react'
import { Counter } from './Counter'

test('counter increments', async ({ mount }) => {
  const component = await mount(<Counter />)
  await expect(component).toContainText('0')
  await component.locator('button').click()
  await expect(component).toContainText('1')
})
```

真浏览器跑组件，比 jsdom 更接近真实。

### Storybook

```bash
pnpm dlx storybook@latest init
```

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'UI/Button',
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: { variant: 'primary', children: 'Click me' },
}

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
}
```

## 微前端

### Module Federation v2（Webpack 5 / Rspack）

```js
// remote app webpack.config.js
new ModuleFederationPlugin({
  name: 'remote',
  filename: 'remoteEntry.js',
  exposes: {
    './Button': './src/Button',
  },
  shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
})

// host app
new ModuleFederationPlugin({
  name: 'host',
  remotes: {
    remote: 'remote@http://localhost:3001/remoteEntry.js',
  },
  shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
})
```

```tsx
// host 中使用
const RemoteButton = lazy(() => import('remote/Button'))

<Suspense fallback="Loading remote..."><RemoteButton /></Suspense>
```

**Module Federation v2**（独立 lib）支持 Vite + Rspack：

```bash
pnpm add @module-federation/vite
```

### single-spa / qiankun

老牌微前端方案（基于 iframe / web component 边界）：

- **single-spa**：每个子应用注册生命周期（bootstrap / mount / unmount）
- **qiankun**：阿里出品，基于 single-spa，沙箱隔离更强

新项目首选 Module Federation；老项目已用 qiankun 维持。

## React Native

### Web 与 Native 共享代码

```
project/
├── src/
│   ├── shared/          # 共享业务逻辑
│   │   ├── hooks/
│   │   ├── api/
│   │   └── store/
│   ├── web/             # Web 组件
│   │   └── components/
│   └── native/          # Native 组件
│       └── components/
├── apps/
│   ├── web/             # Vite + React
│   └── native/          # Expo + React Native
```

**`.web.tsx` / `.native.tsx`** 自动平台扩展名（Metro 解析）：

```tsx
// Button.tsx              ← 默认（共享）
// Button.web.tsx          ← Web 专属
// Button.native.tsx       ← Native 专属
```

### Expo（最推荐 Native 路径）

```bash
pnpm create expo my-app
cd my-app && pnpm start
```

Expo SDK 52+ 默认支持 React Native 0.77+ 的 New Architecture（Bridgeless + JSI + Fabric + TurboModules）。

**Expo 文件路由**（`expo-router`）：

```
app/
├── _layout.tsx        # Root Layout
├── index.tsx          # /
├── (tabs)/
│   ├── _layout.tsx    # Tab navigator
│   ├── home.tsx       # /home
│   └── profile.tsx    # /profile
└── [user]/
    └── index.tsx      # /:user
```

API 与 Next.js App Router 高度相似。

### React Native 与 React 19

React Native 0.78+（2025 Q2）开始原生支持 React 19。在此之前用 0.76 + React 18.3。

## React 18 → 19 迁移

### 自动迁移工具

```bash
# 通用 codemod
npx codemod@latest react/19/migration-recipe

# 单独的 codemod
npx codemod@latest react/19/replace-act-import          # act 从 react-dom/test-utils 改到 react
npx codemod@latest react/19/replace-use-form-state      # useFormState → useActionState
npx codemod@latest react/19/migrate-from-forward-ref    # forwardRef → ref prop
npx codemod@latest react/19/replace-context-provider    # <Ctx.Provider> → <Ctx>
```

### 主要 Breaking Changes

| 变化 | 旧 | 新 | 影响 |
|---|---|---|---|
| ref 传递 | `forwardRef` | 直接 `ref` prop | 大量改动，有 codemod |
| Context Provider | `<Ctx.Provider>` | `<Ctx>` | 兼容，旧的会废弃 |
| `useFormState` | `react-dom` | `useActionState` from `react` | 改导入位置 + 名字 |
| 字符串 ref | `<div ref="myRef" />` | 不支持 | 早就废弃了 |
| `propTypes` / `defaultProps` | 函数组件支持 | 不支持（class 还行） | 全用 TS / 默认参数替代 |
| `act` 导入 | `react-dom/test-utils` | `react` | 改导入路径 |
| `renderToString` | 同步 | 推荐 `prerender` / `prerenderToNodeStream` | SSG 改用新 API |

### Hydration 错误改进

React 19 把 hydration mismatch 错误整合成单条消息，附带 diff：

```
Hydration failed because the server rendered HTML didn't match the client.
- Server: <div>Hello</div>
+ Client: <span>Hello</span>
```

之前是连续多条警告，难以定位。

### Asset Loading 改进

React 19 原生支持 `<title>` / `<meta>` / `<link rel="stylesheet">` / `<script async>` 在组件树任意位置：

```tsx
function BlogPost({ post }: Props) {
  return (
    <article>
      <title>{post.title}</title>
      <meta name="description" content={post.summary} />
      <link rel="stylesheet" href="/blog.css" precedence="default" />
      <h1>{post.title}</h1>
      {post.body}
    </article>
  )
}
```

- React 自动 hoist 到 `<head>`
- Stylesheet 自动去重 + 按 `precedence` 排序
- SSR / RSC 兼容

## 错误诊断

### React Error Decoder

生产构建抛错时给的 `Minified React error #418`，去 [react.dev/errors/418](https://react.dev/errors/418) 看完整消息。

### 常见 Error 速查

| Error # | 含义 |
|---|---|
| **#185** | Maximum update depth exceeded（无限 setState 循环） |
| **#188** | render is not a function（导出错误） |
| **#310** | Rendered fewer hooks than expected（hook 调用顺序变了） |
| **#321** | useState / useReducer 初始值返回非法 |
| **#418** | Hydration mismatch |
| **#419** | useEffect 内 setState 导致无限循环 |
| **#422** | Object as child（直接渲染对象） |
| **#423** | Maximum update depth in Suspense |

### Profiler 实战

```tsx
import { Profiler } from 'react'

function App() {
  return (
    <Profiler id="app" onRender={onRender}>
      <Routes />
    </Profiler>
  )
}

function onRender(
  id: string,
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  if (actualDuration > 16) {
    console.warn('Slow render:', { id, actualDuration })
    // 发到性能监控
    analytics.track('slow_render', { id, duration: actualDuration })
  }
}
```

## 自定义 Reconciler

### `react-reconciler` 包

React 把 Reconciler 抽成独立包，允许 host 平台自定义：

```ts
import Reconciler from 'react-reconciler'

const hostConfig: Reconciler.HostConfig<...> = {
  createInstance(type, props) {
    // 你的「DOM 创建」逻辑
    return new MyNode(type, props)
  },
  appendChild(parent, child) {
    parent.append(child)
  },
  removeChild(parent, child) {
    parent.remove(child)
  },
  // ... 几十个钩子
}

const reconciler = Reconciler(hostConfig)

export function render(element, container) {
  const root = reconciler.createContainer(container, 0, null, false, false, '', () => {}, null)
  reconciler.updateContainer(element, root, null, null)
}
```

### react-three-fiber（3D）

把 Three.js 场景图渲染成 React 组件：

```tsx
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'

function Box() {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.x += 0.01
  })
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}

<Canvas>
  <ambientLight />
  <pointLight position={[10, 10, 10]} />
  <Box />
</Canvas>
```

### react-pdf（PDF）

```tsx
import { Document, Page, Text, View } from '@react-pdf/renderer'

const MyDocument = () => (
  <Document>
    <Page size="A4">
      <View>
        <Text>Hello World</Text>
      </View>
    </Page>
  </Document>
)
```

### Ink（CLI 终端 UI）

```tsx
import { render, Text, Box } from 'ink'

const App = () => (
  <Box flexDirection="column">
    <Text color="green">Hello</Text>
    <Text color="cyan">World</Text>
  </Box>
)

render(<App />)
```

CLI 工具用 React 组件写界面，热重载、Hook、Context 都能用。

## Web Components 集成

React 19 完整支持 Custom Elements：

```tsx
// 自定义元素
class MyButton extends HTMLElement { ... }
customElements.define('my-button', MyButton)

// React 中使用（TypeScript 需要扩展类型）
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'my-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        label?: string
      }
    }
  }
}

function App() {
  return <my-button label="Click me" onclick={...} />
}
```

**React 19 改进**：

- 自动把非原生 HTML 属性当 property 设（之前是 attribute）
- 区分 primitive 和非 primitive prop 处理
- 支持自定义事件（dispatchEvent）

## 速查清单（高级完成后做到）

- [ ] 装上 React Compiler，懂 DevTools 的 Memo 徽章
- [ ] 懂 Rules of React 五条 + ESLint 配套
- [ ] 懂 RSC payload / Flight 协议、Server Components 内部
- [ ] 懂 Fiber 双 buffer、Lane 优先级、可中断渲染
- [ ] 懂 commit phase 三阶段（before mutation / mutation / layout）
- [ ] 能用 Profiler / why-did-you-render 找性能瓶颈
- [ ] 大列表能用 react-window / TanStack Virtual
- [ ] 写过 Vitest + Testing Library 单元测试 + Playwright 组件测试 + Storybook
- [ ] 懂 Hydration 完整 / Selective / Partial 三种模式
- [ ] 懂 React 18 → 19 迁移要点（forwardRef / useFormState / context provider）
- [ ] 至少了解 React Native + Expo 路径
- [ ] 至少看过一个自定义 Reconciler（r3f / react-pdf / Ink）的用法

下一章 `other.md` 讲跨端 / 集成 / 生态对比等其它话题。
