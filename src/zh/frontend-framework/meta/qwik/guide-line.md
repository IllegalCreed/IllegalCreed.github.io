---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Qwik 1.x（`@builder.io/qwik` / `@builder.io/qwik-city`）—— Resumability 原理 / Lazy Loading / Signals 全集 / Tasks / Server Functions / Loaders / Actions / Middleware / Adapter / Image / 常见踩坑

## Resumability：Qwik 的核心革命

### 传统 Hydration 的问题

传统 SSR + Hydration 框架（React / Vue / Solid / Svelte）的启动流程：

```
1. 服务器渲染 HTML，发送到浏览器
2. 浏览器渲染 HTML（静态可见，但不可交互）
3. 下载整个应用的 JS bundle（含所有组件代码）
4. 执行 JS，重新创建组件树
5. 把内存中的组件树「附着」到已渲染 HTML（hydration）
6. 此时事件 listener 才生效，应用真正可交互
```

**核心问题**：

- 步骤 3-5 必须**重新做一次服务器已经做过的工作**——把 HTML 信息重建到内存
- 步骤 3 的 JS 下载量随着应用复杂度**线性增长**——大型应用首屏 JS 可达数百 KB
- 步骤 4-5 占用浏览器主线程——大型应用可能卡顿数秒

Misko Hevery（Angular 原作者、Qwik 创始人）的论断：「**Hydration is pure overhead**」（[原文](https://www.builder.io/blog/hydration-is-pure-overhead)）。

### Resumability 的工作原理

Qwik 的做法完全不同：

```
1. 服务器渲染时，把执行状态序列化到 HTML
   - 事件 listener：<button on:click="./chunk.js#handler">
   - 组件树边界：<!--qv--> 标记
   - 应用状态：<script type="qwik/json">{...}</script>
2. 浏览器接收 HTML，直接显示（无需任何 JS）
3. 加载 Qwikloader（~1KB 全局事件监听器）
4. 用户交互发生 → Qwikloader 解析 on:* 属性 → fetch 对应 chunk → 执行处理函数
```

**核心收益**：

- 首屏可交互前**几乎不下载任何 JS**（仅 ~1KB Qwikloader）
- 应用复杂度**不影响**初始 JS 量——大型应用与小型应用启动速度一致
- 用户没点的按钮**永远不下载对应代码**——真正的按需加载

### HTML 中的序列化标记

打开任何 Qwik 应用的 HTML 源码，你会看到：

```html
<button on:click="./q-abc123.js#App_component_button_onclick" q:id="0">
  Click me
</button>

<!-- 组件边界标记 -->
<!--qv q:s q:sref=0 q:key=...-->
<div>Child content</div>
<!--/qv-->

<!-- 应用状态序列化 -->
<script type="qwik/json">
  {
    "refs": { "0": "..." },
    "ctx": { "..." },
    "objs": [ ... ]
  }
</script>

<!-- Qwikloader（~1KB） -->
<script id="qwikloader">!function(){...}()</script>
```

**关键标记**：

| 标记 | 含义 |
|---|---|
| `on:click="./chunk.js#symbol"` | 事件处理器（URL 形式：模块路径 + 导出名） |
| `q:id="N"` | 组件实例 ID（关联状态序列化） |
| `<!--qv-->` / `<!--/qv-->` | 组件虚拟边界（用于条件 / 列表渲染重建） |
| `q:slot="name"` | 命名 slot 投影 |
| `q:sref="N"` | slot 引用 |
| `<script type="qwik/json">` | 序列化的应用状态（含 signals / stores / refs） |

### 序列化的局限

不是所有值都能被序列化——以下情况会出错：

| 类型 | 可序列化吗 | 备注 |
|---|---|---|
| 字符串 / 数字 / boolean | **是** | 直接 JSON |
| undefined / null | **是** | |
| 普通对象 / 数组 | **是** | 递归序列化 |
| Date | **是** | ISO 字符串 |
| URL | **是** | toString |
| Map / Set | **是** | Qwik 自定义协议 |
| RegExp | **是** | |
| BigInt | **是** | |
| Promise | **是**（已 resolved） | 未 resolve 的 promise 会等待 |
| Signal / Store | **是** | Qwik 内置 |
| DOM Element 引用 | **是** | 通过 `q:id` 重建 |
| 循环引用 | **是** | 用 ref 系统 |
| **class 实例** | **❌ 不可** | 除非实现 toJSON |
| **function** | **❌ 不可** | 必须用 QRL（即 `$`） |
| **Stream / Iterator** | **❌ 不可** | |
| **第三方库实例**（Monaco / Three.js / 等） | **❌ 不可** | 用 `noSerialize()` |

### `noSerialize()` 用法

第三方库实例不能跨 SSR 序列化——用 `noSerialize` 标记，SSR 后 client 端重新初始化：

```tsx
import {
  component$,
  noSerialize,
  useStore,
  useVisibleTask$,
  type NoSerialize,
} from '@builder.io/qwik'
import * as monaco from 'monaco-editor'

export const MonacoEditor = component$(() => {
  const store = useStore<{
    instance: NoSerialize<monaco.editor.IStandaloneCodeEditor> | undefined
  }>({
    instance: undefined,
  })

  useVisibleTask$(() => {
    const editor = monaco.editor.create(document.getElementById('editor')!, {
      value: 'console.log("Hello")',
      language: 'javascript',
    })
    // 标记为不可序列化——浏览器侧持有，不会尝试序列化到 HTML
    store.instance = noSerialize(editor)
  })

  return <div id="editor" />
})
```

**核心约束**：

- `noSerialize` 包装的值在 SSR 时变为 `undefined`
- Client 端 resume 后，需要**手动重新初始化**（通常在 `useVisibleTask$` 中）
- 用 `NoSerialize<T>` 类型标注，TypeScript 强制 `T | undefined`

## Lazy Loading：`$` 边界与代码拆分

### `$` 的工作原理

```tsx
// 源代码
export const Button = component$((props: { label: string }) => {
  const count = useSignal(0)
  return (
    <button onClick$={() => count.value++}>
      {props.label}: {count.value}
    </button>
  )
})
```

Optimizer 编译后产生**3 个独立 chunk**：

1. **`button.tsx`（主 chunk）**：
   ```js
   export const Button = componentQrl(
     qrl(() => import('./button_component_abc.js'), 'Button_component')
   )
   ```

2. **`button_component_abc.js`（组件 render chunk）**：
   ```js
   export const Button_component = (props) => {
     const count = useSignal(0)
     return _jsx('button', {
       onClick$: qrl(() => import('./button_onclick_def.js'), 'Button_onclick', [count]),
       children: [props.label, ': ', count.value],
     })
   }
   ```

3. **`button_onclick_def.js`（点击处理 chunk）**：
   ```js
   export const Button_onclick = () => {
     const [count] = useLexicalScope()
     count.value++
   }
   ```

**收益**：

- 组件代码（render 逻辑）只在**组件渲染**时下载
- 点击处理代码只在**用户点击**时下载
- 闭包变量（如 `count` signal）通过 `useLexicalScope()` 从序列化状态恢复

### QRL：Qwik Runtime Location

QRL 是 Qwik 对「lazy reference」的抽象：

```ts
type QRL<T> = {
  // 异步解析到真实函数
  resolve(): Promise<T>
  // 调用：自动 resolve 再执行
  (...args): Promise<ReturnType<T>>
  // chunk 路径 + 导出名 + 捕获的闭包
}
```

显式创建 QRL：

```tsx
import { $, component$ } from '@builder.io/qwik'

// 创建 QRL（lazy 函数）
const handleClick = $(() => {
  console.log('clicked')
})

export default component$(() => {
  return <button onClick$={handleClick}>Click</button>
})
```

**注意**：把已经是 QRL 的函数赋值给 `onClick$` 时**不用再加 `$`**。但内联函数必须用 `$`：

```tsx
// 内联函数：必须用 onClick$={...}（$ 后缀触发自动 QRL 包装）
<button onClick$={() => console.log('a')}>A</button>

// 已经是 QRL：直接赋值
const handler = $(() => console.log('b'))
<button onClick$={handler}>B</button>

// 注意区别：onClick$（属性带 $）与 $()（函数包装）
```

### `implicit$FirstArg`：自定义 `$` API

如果你写库，希望提供「带 `$` 后缀」的 API：

```ts
import { implicit$FirstArg, type QRL } from '@builder.io/qwik'

// 核心实现：接受 QRL
export function onScrollQrl(fnQrl: QRL<(e: Event) => void>) {
  document.addEventListener('scroll', async (e) => {
    const fn = await fnQrl.resolve()
    fn(e)
  })
}

// 用户友好 API：自动把第一个参数包装成 QRL
export const onScroll$ = implicit$FirstArg(onScrollQrl)

// 用户用法：
onScroll$((e) => console.log('scrolling'))
// ↑ 等价于 onScrollQrl($((e) => console.log('scrolling')))
```

## Signals：细粒度响应式

### 基础用法

```tsx
import { component$, useSignal } from '@builder.io/qwik'

export default component$(() => {
  // 类型自动推断：Signal<number>
  const count = useSignal(0)
  // 显式类型
  const name = useSignal<string>('Qwik')
  const user = useSignal<User | null>(null)

  return (
    <>
      <p>{count.value}</p>
      <button onClick$={() => count.value++}>+1</button>
    </>
  )
})
```

### Signal 跨组件传递

```tsx
import { component$, useSignal, type Signal } from '@builder.io/qwik'

// 子组件接受 Signal 类型的 prop
const Display = component$<{ value: Signal<number> }>(({ value }) => {
  // 这个组件只追踪 value.value
  // 当父组件其他 state 变化时，本组件不重渲染
  return <p>Value: {value.value}</p>
})

export default component$(() => {
  const count = useSignal(0)
  const other = useSignal('hello')

  return (
    <>
      {/* 把 signal 本身传过去（不是 .value） */}
      <Display value={count} />

      <button onClick$={() => count.value++}>+1</button>
      <button onClick$={() => (other.value = other.value + '!')}>change other</button>
    </>
  )
})
```

> **细粒度的精髓**：当 `other` 变化时，**Display 组件不会重渲染**——因为它只订阅了 `count` signal。这是 Qwik 区别于 React（整树 reconcile）的核心。

### 最佳实践：传 value 而非 signal

如果子组件**只读不写**，传 value 而非 signal：

```tsx
// ❌ 不必要：子组件不修改 signal
<Display signal={count} />

// ✅ 推荐：只读时传 value
<Display value={count.value} />
```

这样子组件签名更简单，复用性更高。

### Stores 深响应

```tsx
import { component$, useStore } from '@builder.io/qwik'

export default component$(() => {
  const state = useStore({
    user: { name: 'Qwik', email: 'q@example.com' },
    todos: [{ id: 1, text: 'Learn', done: false }],
    meta: { theme: 'dark' },
  })

  return (
    <>
      {/* 直接修改嵌套属性会触发响应 */}
      <input
        value={state.user.name}
        onInput$={(_, el) => (state.user.name = el.value)}
      />

      {/* 数组操作 */}
      <ul>
        {state.todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange$={() => (todo.done = !todo.done)}
            />
            {todo.text}
          </li>
        ))}
      </ul>
      <button
        onClick$={() => state.todos.push({ id: Date.now(), text: 'New', done: false })}
      >
        Add
      </button>

      {/* 切换主题 */}
      <button onClick$={() => (state.meta.theme = state.meta.theme === 'dark' ? 'light' : 'dark')}>
        Theme: {state.meta.theme}
      </button>
    </>
  )
})
```

### Store 选项：`deep: false`

对超大对象关闭深响应（性能优化）：

```tsx
const shallowState = useStore(
  {
    largeData: { /* 嵌套很深的对象 */ },
    surfaceProps: 'reactive',
  },
  { deep: false }  // 只追踪顶层属性
)

// surfaceProps 改变会响应
shallowState.surfaceProps = 'new'

// largeData 内部改变**不会响应**（顶层赋值才会）
shallowState.largeData.someDeepProp = 1  // ❌ 不触发

// 要触发：整体替换
shallowState.largeData = { ...shallowState.largeData, someDeepProp: 1 }  // ✅
```

### Store 中的方法

Store 中放函数需要用 `$` 包装（因为函数不可序列化）：

```tsx
import { component$, useStore, $, type QRL } from '@builder.io/qwik'

type CountStore = {
  count: number
  increment: QRL<(this: CountStore) => void>
  decrement: QRL<(this: CountStore) => void>
}

export default component$(() => {
  const state = useStore<CountStore>({
    count: 0,
    // 注意：用 function 而非箭头（需要 this 绑定）
    increment: $(function (this: CountStore) {
      this.count++
    }),
    decrement: $(function (this: CountStore) {
      this.count--
    }),
  })

  return (
    <>
      <p>{state.count}</p>
      <button onClick$={() => state.increment()}>+1</button>
      <button onClick$={() => state.decrement()}>-1</button>
    </>
  )
})
```

> **必须用 function 而非箭头函数**——箭头函数没有自己的 `this`，无法绑定到 store 实例。

### `useComputed$`：派生值

```tsx
import { component$, useComputed$, useSignal } from '@builder.io/qwik'

export default component$(() => {
  const firstName = useSignal('Albert')
  const lastName = useSignal('Einstein')

  // 自动追踪依赖
  const fullName = useComputed$(() => {
    return `${firstName.value} ${lastName.value}`
  })

  const initials = useComputed$(() => {
    return `${firstName.value[0]}.${lastName.value[0]}.`
  })

  return (
    <>
      <input bind:value={firstName} />
      <input bind:value={lastName} />
      <p>Full: {fullName.value}</p>
      <p>Initials: {initials.value}</p>
    </>
  )
})
```

**核心点**：

- `useComputed$` 是**同步**的——必须返回非 Promise 值
- 自动追踪函数体内访问的 signal/store
- 返回 `Signal<T>`——用 `.value` 读
- 异步用 `useResource$`

## Tasks：副作用与生命周期

### `useTask$`：渲染前任务

```tsx
import { component$, useSignal, useTask$ } from '@builder.io/qwik'

export default component$(() => {
  const userId = useSignal(1)
  const userData = useSignal<User | null>(null)

  /**
   * 任务：渲染前执行
   * - 服务器 + 浏览器都会执行（默认）
   * - 阻塞渲染直到 await 完成
   * - track 的 signal 变化会重跑任务
   */
  useTask$(async ({ track, cleanup }) => {
    // 追踪 userId
    const id = track(() => userId.value)

    const res = await fetch(`/api/users/${id}`)
    userData.value = await res.json()

    cleanup(() => {
      // 任务重跑前 / 组件卸载前调用
      console.log('Cleanup for user', id)
    })
  })

  return (
    <>
      <button onClick$={() => userId.value++}>Next User</button>
      <p>{userData.value?.name}</p>
    </>
  )
})
```

**core 概念**：

- **首次执行**：组件挂载时（SSR + client 各一次，因为 hydration-less，client 实际不会自动重跑——见下方说明）
- **追踪后重跑**：`track()` 包装的 signal 变化时
- **cleanup**：重跑前 / 卸载前
- **阻塞渲染**：`await` 期间 SSR 会等待

### 仅服务器执行

```tsx
import { component$, useSignal, useTask$ } from '@builder.io/qwik'
import { isServer } from '@builder.io/qwik'

export default component$(() => {
  const data = useSignal<string>('')

  useTask$(({ track }) => {
    track(() => /* 触发依赖 */ undefined)

    if (isServer) {
      // 只在服务器执行
      data.value = 'from server'
      return
    }
    // 客户端逻辑
    data.value = 'from client'
  })

  return <p>{data.value}</p>
})
```

### `track()` 多种用法

```tsx
useTask$(({ track }) => {
  // 1. 追踪整个 signal（变化时重跑）
  const value = track(() => mySignal.value)

  // 2. 追踪 store 的某个属性
  const name = track(() => store.user.name)

  // 3. 追踪派生值
  const ratio = track(() => store.count / store.total)

  // 4. 同时追踪多个
  track(() => signal1.value)
  track(() => signal2.value)
})
```

### `useVisibleTask$`：客户端可见时任务

```tsx
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'

export default component$(() => {
  const time = useSignal('')

  /**
   * Visible Task：
   * - 仅浏览器执行
   * - 组件首次「可见」时执行（IntersectionObserver）
   * - 不阻塞渲染
   * - ⚠️ Qwik 官方明确：「最后手段」
   */
  useVisibleTask$(({ cleanup }) => {
    const id = setInterval(() => {
      time.value = new Date().toLocaleTimeString()
    }, 1000)
    cleanup(() => clearInterval(id))
  })

  return <p>{time.value || 'loading...'}</p>
})
```

### `useVisibleTask$` 策略选项

```tsx
useVisibleTask$(
  ({ cleanup }) => {
    // ...
  },
  {
    strategy: 'intersection-observer',  // 默认：可见时执行
    // 或 'document-ready'：DOM ready 时执行
    // 或 'document-idle'：requestIdleCallback 时执行
  }
)
```

### `useVisibleTask$` 的反模式警告

> **官方明确警告**：「`useVisibleTask$` 在客户端 eagerly 执行——这违背 Resumability 的初衷。仅在没有其他选择时使用。」

何时**不能避免** `useVisibleTask$`：

- DOM 操作（必须在浏览器）：如 chart.js / d3 初始化、scroll listener
- 第三方库初始化：Monaco / Three.js / Mapbox / Stripe Elements
- 浏览器 API：`window.matchMedia` / `IntersectionObserver` / `localStorage`

何时**应该避免**：

- 数据加载 → 用 `routeLoader$` 或 `useResource$`
- 简单的响应式副作用 → 用 `useTask$` + `isServer` 守卫

```tsx
// ✅ 推荐：useTask$ + isServer 守卫
useTask$(({ track }) => {
  track(() => userId.value)
  if (isServer) return
  // 客户端逻辑
})

// ❌ 不推荐：除非必须 visible 才执行
useVisibleTask$(() => {
  // 此处代码强制 eager 加载
})
```

### `useResource$`：异步数据 + 状态

```tsx
import { component$, useResource$, useSignal, Resource } from '@builder.io/qwik'

export default component$(() => {
  const postId = useSignal(1)

  /**
   * 异步资源：
   * - 自动暴露 pending / resolved / rejected 三态
   * - 支持 cleanup（如 AbortController）
   * - track 的依赖变化会重跑
   */
  const post = useResource$<Post>(async ({ track, cleanup }) => {
    const id = track(() => postId.value)

    const controller = new AbortController()
    cleanup(() => controller.abort())

    const res = await fetch(`/api/posts/${id}`, {
      signal: controller.signal,
    })
    if (!res.ok) throw new Error('Failed')
    return await res.json()
  })

  return (
    <>
      <button onClick$={() => postId.value++}>Next</button>

      <Resource
        value={post}
        onPending={() => <p>Loading...</p>}
        onRejected={(err) => <p>Error: {err.message}</p>}
        onResolved={(post) => (
          <article>
            <h2>{post.title}</h2>
            <p>{post.body}</p>
          </article>
        )}
      />
    </>
  )
})
```

**`useResource$` vs `routeLoader$`**：

| 维度 | useResource$ | routeLoader$ |
|---|---|---|
| 触发时机 | 组件内部 signal 变化 | 路由导航 |
| 数据来源 | 任意 fetch / API | 服务器 only |
| 重跑机制 | track 的依赖变化 | 每次导航 |
| 客户端可用 | **是**（也能在浏览器跑） | **否**（仅服务器） |
| 适用 | 组件内交互式数据 | 页面级初始数据 |

## Server Functions：服务器交互三件套

Qwik City 提供三种调用服务器的方式，覆盖不同场景：

| API | 触发 | 数据流向 | 适用场景 |
|---|---|---|---|
| `routeLoader$` | 路由导航 | 服务器 → 组件 | 页面初始数据（GET-like） |
| `routeAction$` | 显式触发（表单 / submit） | 客户端 → 服务器 → 客户端 | 数据修改（POST-like） |
| `server$` | 客户端代码主动调用 | 客户端 → 服务器 → 客户端 | RPC 风格 / 任意时机 |

### `routeLoader$` 进阶

```tsx
// src/routes/products/[id]/index.tsx
import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'

export const useProduct = routeLoader$(async (requestEvent) => {
  const { params, cookie, request, env, url } = requestEvent

  // 访问 cookie
  const session = cookie.get('session')?.value

  // 读环境变量
  const apiKey = env.get('API_KEY')

  // 设置响应 header
  requestEvent.headers.set('cache-control', 'max-age=60')

  // 调用数据库 / API
  const res = await fetch(`https://api.example.com/products/${params.id}`, {
    headers: { 'X-Session': session ?? '', 'X-Key': apiKey ?? '' },
  })

  if (!res.ok) {
    // 返回结构化错误（不抛异常）
    return requestEvent.fail(404, { errorMessage: 'Not found' })
  }

  return await res.json()
})

export default component$(() => {
  const product = useProduct()

  if ('errorMessage' in product.value) {
    return <div class="error">{product.value.errorMessage}</div>
  }

  return <h1>{product.value.name}</h1>
})
```

### Loader 之间依赖

```tsx
export const useUser = routeLoader$(async ({ cookie }) => {
  return await db.users.fromSession(cookie.get('session')?.value)
})

// 复用 useUser 的数据
export const useUserPosts = routeLoader$(async (ev) => {
  // resolveValue 等待 useUser 完成并获取其结果
  const user = await ev.resolveValue(useUser)
  if (!user) return []
  return await db.posts.byUserId(user.id)
})
```

### `routeAction$` 进阶

#### Zod 校验

```tsx
import { routeAction$, zod$, z, Form } from '@builder.io/qwik-city'

export const useSignup = routeAction$(
  async (data, { fail, cookie, redirect }) => {
    // data 类型从 zod schema 自动推断
    const existing = await db.users.findByEmail(data.email)
    if (existing) {
      return fail(409, {
        message: 'Email already used',
      })
    }

    const user = await db.users.create(data)
    cookie.set('session', user.token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    // 重定向（throw 写法）
    throw redirect(303, '/dashboard')
  },
  zod$({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
  })
)

export default component$(() => {
  const action = useSignup()

  return (
    <Form action={action}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      <input name="name" />

      {action.value?.failed && (
        <p class="error">{action.value.message}</p>
      )}

      <button type="submit" disabled={action.isRunning}>
        {action.isRunning ? 'Creating...' : 'Sign up'}
      </button>
    </Form>
  )
})
```

#### 程序化触发

```tsx
const action = useLikeAction()

// 不通过表单
<button onClick$={async () => {
  const result = await action.submit({ postId: 123 })
  if (result.value.failed) {
    alert(result.value.message)
  }
}}>
  Like
</button>
```

#### 上传文件

```tsx
export const useUploadAction = routeAction$(async (data, { request }) => {
  // data 已包含 file 字段（File 类型）
  const file = data.file as File

  // 或访问原始 FormData
  const formData = await request.formData()
  const blob = formData.get('file') as Blob

  // 处理文件...
  await s3.upload(blob)

  return { success: true }
})

// HTML 表单（注意 enctype）
<Form action={action} enctype="multipart/form-data">
  <input type="file" name="file" />
  <button type="submit">Upload</button>
</Form>
```

#### `globalAction$` vs `routeAction$`

```tsx
// 仅在路由 index.tsx 中定义（作用域单路由）
export const useRouteAction = routeAction$(...)

// 可在任意文件定义、任意路由复用
// src/lib/actions.ts
export const useGlobalLikeAction = globalAction$(async (data) => {
  await db.likes.add(data)
  return { ok: true }
})

// 任意组件中使用
import { useGlobalLikeAction } from '~/lib/actions'

export default component$(() => {
  const action = useGlobalLikeAction()
  return <button onClick$={() => action.submit({ id: 1 })}>Like</button>
})
```

### `server$`：RPC 风格

```tsx
import { component$, $, useSignal } from '@builder.io/qwik'
import { server$ } from '@builder.io/qwik-city'

/**
 * server$ 包装的函数：
 * - 服务器端：直接执行
 * - 客户端：变成对应的 HTTP 请求（自动 fetch 路由）
 * - 与 routeAction$ 区别：可在任意时机调用，不绑定表单
 */
export const greet = server$(function (name: string, age: number) {
  // this = RequestEvent（注意：必须用 function 而非箭头）
  console.log('Server received:', name, age)
  console.log('IP:', this.headers.get('x-forwarded-for'))

  return {
    greeting: `Hello ${name}, you are ${age}!`,
    serverTime: new Date().toISOString(),
  }
})

export default component$(() => {
  const name = useSignal('')
  const result = useSignal<string | null>(null)

  return (
    <>
      <input bind:value={name} />
      <button
        onClick$={async () => {
          const data = await greet(name.value, 30)
          result.value = data.greeting
        }}
      >
        Greet
      </button>
      <p>{result.value}</p>
    </>
  )
})
```

#### `server$` 流式响应（异步生成器）

```tsx
import { server$ } from '@builder.io/qwik-city'

// 服务器流式返回数据
export const streamLogs = server$(async function* () {
  for (let i = 0; i < 10; i++) {
    yield `Log entry ${i}`
    await new Promise((r) => setTimeout(r, 500))
  }
})

// 客户端：用 for await 消费
export default component$(() => {
  const logs = useSignal<string[]>([])

  return (
    <>
      <button
        onClick$={async () => {
          logs.value = []
          const stream = await streamLogs()
          for await (const entry of stream) {
            logs.value = [...logs.value, entry]
          }
        }}
      >
        Start streaming
      </button>
      <ul>
        {logs.value.map((log, i) => (
          <li key={i}>{log}</li>
        ))}
      </ul>
    </>
  )
})
```

#### `server$` 常见陷阱

```tsx
// ❌ 错误：onClick$ 内部直接调用 server$ 的返回函数
<button onClick$={() => server$(() => 'hi')()}>Click</button>

// ✅ 正确：用 $ 包装，避免 server$ 被序列化
<button onClick$={$(async () => {
  const result = await myServerFunc()
  console.log(result)
})}>Click</button>
```

```tsx
// ⚠️ middleware 不会为 server$ 请求运行（除非定义在 plugin.ts）
// src/routes/layout.tsx 的 onRequest 不会被 server$ 触发
// 要全局中间件，用 src/plugin@*.ts
```

## Middleware：请求拦截

### 在 layout 中定义

```tsx
// src/routes/layout.tsx
import { component$, Slot } from '@builder.io/qwik'
import type { RequestHandler } from '@builder.io/qwik-city'

export const onRequest: RequestHandler = async ({
  next,
  url,
  cookie,
  redirect,
  sharedMap,
}) => {
  // 在 next() 之前：所有请求都执行
  console.log('Request:', url.pathname)

  // 鉴权
  const session = cookie.get('session')?.value
  if (!session && url.pathname.startsWith('/admin')) {
    throw redirect(303, '/login')
  }

  // 用 sharedMap 传递数据给后续 loader / 组件
  if (session) {
    const user = await db.users.fromSession(session)
    sharedMap.set('user', user)
  }

  // 执行下一个中间件 / 路由处理器
  await next()

  // next() 之后：在响应返回前执行
  console.log('Response sent')
}

export default component$(() => {
  return <Slot />
})
```

### HTTP 方法特定 middleware

```ts
// src/routes/api/posts/index.ts
import type { RequestHandler } from '@builder.io/qwik-city'

// 仅 GET /api/posts
export const onGet: RequestHandler = async ({ json }) => {
  const posts = await db.posts.list()
  json(200, posts)
}

// 仅 POST /api/posts
export const onPost: RequestHandler = async ({ parseBody, json, error }) => {
  const data = await parseBody()
  if (!data) {
    throw error(400, 'Bad Request')
  }
  const post = await db.posts.create(data)
  json(201, post)
}

// 所有方法
export const onRequest: RequestHandler = async ({ next, headers }) => {
  headers.set('X-Powered-By', 'Qwik')
  await next()
}
```

### 全局 plugin middleware

`src/plugin@auth.ts`（命名约定：`plugin@*.ts`）会在**所有请求**前执行，包括 `server$`：

```ts
// src/plugin@auth.ts
import type { RequestHandler } from '@builder.io/qwik-city'

export const onRequest: RequestHandler = async ({ headers, sharedMap }) => {
  headers.set('X-Server-Timing', String(Date.now()))
  sharedMap.set('startTime', Date.now())
}
```

> **重要**：layout.tsx 中的 onRequest 不会拦截 `server$` 调用——要全局拦截必须用 `plugin@*.ts`。

### `sharedMap`：请求作用域

```tsx
// layout.tsx
export const onRequest: RequestHandler = async ({ sharedMap, cookie }) => {
  const user = await loadUser(cookie)
  sharedMap.set('user', user)
}

// 任意 loader / action / server$
export const useDashboardData = routeLoader$(async ({ sharedMap }) => {
  const user = sharedMap.get('user')
  return { user, stats: await db.stats.forUser(user.id) }
})
```

## Adapter：多端部署

每个 adapter 由两部分组成：

1. **Vite 构建配置**：`adapters/{name}/vite.config.ts`——继承基础 Vite 配置
2. **服务端入口**：`src/entry.{name}.tsx`——把 Qwik 的请求处理接入到目标运行时

### Vercel Edge

```bash
pnpm run qwik add vercel-edge
```

生成：

```ts
// adapters/vercel-edge/vite.config.ts
import { defineConfig } from 'vite'
import { vercelEdgeAdapter } from '@builder.io/qwik-city/adapters/vercel-edge/vite'

export default defineConfig({
  build: {
    ssr: true,
  },
  plugins: [
    vercelEdgeAdapter({
      ssg: {
        include: ['/'],
        origin: 'https://example.com',
      },
    }),
    /* qwikCity / qwikVite */
  ],
})
```

```ts
// src/entry.vercel-edge.tsx
import { createQwikCity } from '@builder.io/qwik-city/middleware/vercel-edge'
import qwikCityPlan from '@qwik-city-plan'
import render from './entry.ssr'

export default createQwikCity({ render, qwikCityPlan })
```

部署：连接 Vercel 仓库即可，自动用 `build` 脚本。

### Cloudflare Workers

```bash
pnpm run qwik add cloudflare-pages
```

```ts
// src/entry.cloudflare-pages.tsx
import { createQwikCity } from '@builder.io/qwik-city/middleware/cloudflare-pages'
import qwikCityPlan from '@qwik-city-plan'
import render from './entry.ssr'

export default createQwikCity({ render, qwikCityPlan })
```

```bash
# 部署
pnpm run build
npx wrangler pages deploy ./dist
```

### Node Express

```bash
pnpm run qwik add express
```

```ts
// server/entry.express.ts
import { createQwikCity } from '@builder.io/qwik-city/middleware/node'
import express from 'express'
import { join } from 'node:path'
import qwikCityPlan from '@qwik-city-plan'
import render from './entry.ssr'

const { router, notFound } = createQwikCity({
  render,
  qwikCityPlan,
  origin: process.env.ORIGIN ?? 'http://localhost:3000',
})

const app = express()
app.use('/build', express.static(join(__dirname, 'build')))
app.use(express.static(join(__dirname, 'assets')))
app.use(router)
app.use(notFound)

const port = process.env.PORT ?? 3000
app.listen(port, () => console.log(`Server: http://localhost:${port}`))
```

部署：

```bash
pnpm run build
node server/entry.express.js
```

### Static SSG

```bash
pnpm run qwik add static
```

```ts
// adapters/static/vite.config.ts
import { defineConfig } from 'vite'
import { staticAdapter } from '@builder.io/qwik-city/adapters/static/vite'

export default defineConfig({
  build: { ssr: true },
  plugins: [
    staticAdapter({
      origin: 'https://example.com',
    }),
  ],
})
```

生成纯静态 HTML：

```bash
pnpm run build
# dist/ 目录可部署到任何静态托管（GitHub Pages / Netlify / S3）
```

### 适配器完整列表

| Adapter | 类型 | 包路径 |
|---|---|---|
| Vercel Edge | Edge | `@builder.io/qwik-city/middleware/vercel-edge` |
| Cloudflare Pages | Edge | `@builder.io/qwik-city/middleware/cloudflare-pages` |
| Netlify Edge | Edge | `@builder.io/qwik-city/middleware/netlify-edge` |
| Azure SWA | Cloud | `@builder.io/qwik-city/middleware/azure-swa` |
| AWS Lambda | Serverless | `@builder.io/qwik-city/middleware/aws-lambda` |
| Node Express | Server | `@builder.io/qwik-city/middleware/node` |
| Node Fastify | Server | `@builder.io/qwik-city/middleware/node` |
| Deno | Runtime | `@builder.io/qwik-city/middleware/deno` |
| Bun | Runtime | `@builder.io/qwik-city/middleware/bun` |
| Firebase | Cloud | `@builder.io/qwik-city/middleware/firebase` |
| Google Cloud Run | Cloud | （继承 Node） |
| Static SSG | 静态 | `@builder.io/qwik-city/middleware/request-handler` |

## Image Optimization

### 内置 vite-imagetools（推荐本地图片）

```tsx
// 注意 ?w=24&h=24&jsx 这种查询参数
import Logo from '~/media/logo.png?w=200&h=200&jsx'

export default component$(() => {
  return <Logo />
})
```

构建后自动：

- 生成多分辨率（200 / 400 / 600 / 800 / 1200px）的 WebP
- 设置 `width` / `height` 防止 CLS
- 默认 `loading="lazy"` + `decoding="async"`

```tsx
// 自定义参数
import HeroImage from '~/media/hero.jpg?format=webp&quality=85&w=1920&jsx'

// SVG（保持矢量）
import IconArrow from '~/media/arrow.svg?jsx'
```

### `@unpic/qwik`（推荐 CDN 图片）

```bash
pnpm add @unpic/qwik
```

```tsx
import { Image } from '@unpic/qwik'

export default component$(() => {
  return (
    <Image
      src="https://cdn.shopify.com/.../sample.jpg"
      layout="constrained"
      width={800}
      height={600}
      alt="Product"
      priority  // 首屏图片预加载
    />
  )
})
```

`@unpic/qwik` 支持的 CDN：Cloudinary / Cloudflare / Bunny / Vercel / Imgix / Shopify / Contentful / Storyblok / Sanity 等。

### `qwik-image`（自定义 loader）

```tsx
import { Image, useImageProvider, type ImageTransformerProps } from 'qwik-image'
import { $ } from '@builder.io/qwik'

export const ImageWrapper = component$(() => {
  const imageTransformer$ = $((props: ImageTransformerProps) => {
    return `https://my-cdn.com/${props.src}?w=${props.width}&h=${props.height}&fm=webp`
  })

  useImageProvider({
    resolutions: [400, 800, 1200, 1600],
    imageTransformer$,
  })

  return (
    <Image
      src="img/hero.jpg"
      layout="constrained"
      width={1600}
      height={900}
      alt="Hero"
    />
  )
})
```

## 样式系统

### 全局 CSS

```tsx
// src/root.tsx
import './global.css'  // 直接导入即可
```

### 组件作用域：`useStyles$`

```tsx
import { component$, useStyles$ } from '@builder.io/qwik'
import styles from './card.css?inline'  // 注意 ?inline

export const Card = component$(() => {
  useStyles$(styles)  // 注册样式（首次渲染时注入）

  return (
    <div class="card">
      <h2 class="card__title">Title</h2>
    </div>
  )
})
```

```css
/* card.css */
.card {
  padding: 1rem;
  border: 1px solid #ccc;
}
.card__title {
  font-size: 1.25rem;
}
```

> `useStyles$` 不做隔离——只是把样式声明注册到 head，class 仍然全局共享。BEM 命名避免冲突。

### Scoped CSS：`useStylesScoped$`

```tsx
import { component$, useStylesScoped$ } from '@builder.io/qwik'

export const Card = component$(() => {
  useStylesScoped$(`
    .card {
      padding: 1rem;
      border: 1px solid #ccc;
    }
    .title {
      color: blue;
    }

    /* 用 :global() 穿透到子组件 */
    > :global(.external-class) {
      color: red;
    }
  `)

  return (
    <div class="card">
      <h2 class="title">Scoped Title</h2>
    </div>
  )
})
```

`useStylesScoped$` 自动给所有 selector 加上唯一前缀（用 emoji 作选择器后缀），实现 CSS 隔离。

### CSS Modules

开箱即用（Vite 原生支持）：

```css
/* card.module.css */
.card {
  padding: 1rem;
}
.title {
  color: blue;
}
```

```tsx
import styles from './card.module.css'

export const Card = component$(() => {
  return (
    <div class={styles.card}>
      <h2 class={styles.title}>Title</h2>
    </div>
  )
})
```

### Tailwind CSS

```bash
pnpm run qwik add tailwind
```

会自动配置 Tailwind 4 + Vite plugin：

```css
/* src/global.css */
@import "tailwindcss";
```

```tsx
<div class="flex items-center gap-2 p-4 rounded-lg bg-blue-500 text-white">
  Hello
</div>
```

### Styled Vanilla Extract（CSS-in-JS 零运行时）

```bash
pnpm run qwik add styled-vanilla-extract
```

```ts
// card.css.ts
import { style } from 'styled-vanilla-extract/qwik'

export const cardClass = style({
  padding: '1rem',
  border: '1px solid #ccc',
})
```

```tsx
import { cardClass } from './card.css'

export const Card = component$(() => {
  return <div class={cardClass}>Card</div>
})
```

或 styled-components 风格：

```ts
import { styled } from 'styled-vanilla-extract/qwik'

export const Card = styled.div`
  padding: 1rem;
  border: 1px solid #ccc;
`
```

## Slots：内容投影

### 默认 slot

```tsx
import { component$, Slot } from '@builder.io/qwik'

const Modal = component$(() => {
  return (
    <div class="modal">
      <Slot />
    </div>
  )
})

export default component$(() => {
  return (
    <Modal>
      <p>This goes into the slot</p>
    </Modal>
  )
})
```

### 命名 slot

```tsx
const Card = component$(() => {
  return (
    <section class="card">
      <header>
        <Slot name="title" />
      </header>
      <div class="content">
        <Slot />  {/* 默认 */}
      </div>
      <footer>
        <Slot name="footer" />
      </footer>
    </section>
  )
})

export default component$(() => {
  return (
    <Card>
      {/* q:slot 指定目标 slot */}
      <h1 q:slot="title">Hello</h1>
      <p>Default slot content</p>
      <span q:slot="footer">© 2026</span>
      <a q:slot="footer" href="/">Home</a>  {/* 同 slot 多个元素自动合并 */}
    </Card>
  )
})
```

### 声明式 slot 设计

> **Qwik 的 slot 是声明式而非命令式**——即使父组件 re-render，子组件的 slot 内容也不会重新执行。这是 Resumability 架构的必然——子组件可以独立于父组件渲染。

```tsx
const Collapsible = component$(() => {
  const open = useSignal(true)
  return (
    <div>
      <button onClick$={() => (open.value = !open.value)}>
        Toggle
      </button>
      {/* slot 内容会被 SSR 渲染并隐藏在 <q:template> 中
          打开时移入 DOM，关闭时移回 template
          内容不重新执行 */}
      {open.value && <Slot />}
    </div>
  )
})
```

## Context API

避免 prop drilling：

```tsx
// src/context.ts
import { type Signal, createContextId } from '@builder.io/qwik'

export interface ThemeContext {
  mode: Signal<'light' | 'dark'>
}

export const themeContextId = createContextId<ThemeContext>('app.theme')
```

```tsx
// 顶层提供
import { component$, useContextProvider, useSignal } from '@builder.io/qwik'
import { themeContextId } from '~/context'

export default component$(() => {
  const mode = useSignal<'light' | 'dark'>('light')
  useContextProvider(themeContextId, { mode })

  return <Slot />
})
```

```tsx
// 深层消费
import { component$, useContext } from '@builder.io/qwik'
import { themeContextId } from '~/context'

export const ThemeButton = component$(() => {
  const { mode } = useContext(themeContextId)

  return (
    <button onClick$={() => (mode.value = mode.value === 'light' ? 'dark' : 'light')}>
      Current: {mode.value}
    </button>
  )
})
```

## 事件处理

### 基础事件

```tsx
import { component$, useSignal, $ } from '@builder.io/qwik'

export default component$(() => {
  const count = useSignal(0)

  // 内联
  return (
    <>
      <button onClick$={() => count.value++}>+1</button>
      <input
        onChange$={(event, el) => {
          // event 是 DOM 事件
          // el 是 currentTarget（推荐用 el 而非 event.currentTarget）
          console.log(el.value)
        }}
      />
    </>
  )
})
```

### 多个 handler

```tsx
// 数组形式按顺序执行
<button
  onClick$={[
    $(() => console.log('first')),
    $(() => console.log('second')),
    handleClick,  // 已经是 QRL
  ]}
>
  Click
</button>
```

### preventDefault / stopPropagation

```tsx
// 声明式（推荐）：在属性层声明
<a
  href="/foo"
  preventdefault:click
  stoppropagation:click
  onClick$={() => console.log('handled')}
>
  Link
</a>
```

> 注意：Qwik 事件是**异步**的，所以 `event.preventDefault()` 在 handler 内调用**不一定生效**。要用属性层的 `preventdefault:click` 或 `sync$()`（见下）。

### `sync$()`：同步执行

```tsx
import { component$, useSignal, sync$, $ } from '@builder.io/qwik'

export default component$(() => {
  return (
    <a
      href="https://google.com"
      onClick$={[
        // 同步部分：执行 preventDefault（无法访问组件 state）
        sync$((e: MouseEvent) => {
          e.preventDefault()
        }),
        // 异步部分：访问 state、调用其他函数
        $(() => {
          console.log('Prevented and handled')
        }),
      ]}
    >
      Click
    </a>
  )
})
```

> **`sync$` 的限制**：不能访问组件 state、不能调用其他函数、函数体会被序列化到 HTML（影响 size）。

### document / window 事件

```tsx
// 声明式（推荐）
<div
  document:onScroll$={() => console.log('scrolling')}
  window:onResize$={() => console.log('resized')}
>
  ...
</div>

// 编程式（自定义 hook）
import { useOnDocument, useOnWindow, $ } from '@builder.io/qwik'

function useMousePosition() {
  const pos = useStore({ x: 0, y: 0 })
  useOnDocument(
    'mousemove',
    $((e: MouseEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
    })
  )
  return pos
}
```

### 自定义事件 props

```tsx
import { component$, type QRL } from '@builder.io/qwik'

interface ButtonProps {
  onTripleClick$: QRL<() => void>  // QRL 类型表明这是个 $ 函数
}

const FancyButton = component$<ButtonProps>(({ onTripleClick$ }) => {
  return <button onClick$={() => onTripleClick$()}>Click 3 times</button>
})

// 使用
<FancyButton onTripleClick$={() => alert('Triple!')} />
```

## 常见踩坑

### 1. 闭包变量必须是 `const`

```tsx
// ❌ 错误：let
component$(() => {
  let foo = 'bar'
  return <button onClick$={() => alert(foo)}>Click</button>
  // 报错：Optimizer 无法序列化 let 变量
})

// ✅ 用 const
component$(() => {
  const foo = 'bar'
  return <button onClick$={() => alert(foo)}>Click</button>
})

// ✅ 或 用 signal
component$(() => {
  const foo = useSignal('bar')
  return <button onClick$={() => alert(foo.value)}>Click</button>
})
```

### 2. 闭包变量必须可序列化

```tsx
// ❌ 不可序列化 class 实例
component$(() => {
  const date = new MyCustomClass()
  return <button onClick$={() => console.log(date)}>Click</button>
})

// ✅ 用 noSerialize（要求 useStore + 重新初始化）
component$(() => {
  const store = useStore<{ obj: NoSerialize<MyClass> | undefined }>({ obj: undefined })
  useVisibleTask$(() => {
    store.obj = noSerialize(new MyClass())
  })
  return <button onClick$={() => store.obj?.doSomething()}>Click</button>
})
```

### 3. 不要忘记 `$` 后缀

```tsx
// ❌ 错误：缺 $
<button onClick={() => count.value++}>+1</button>
// 报错：JSX 不认识 onClick 属性（Qwik 用 onClick$）

// ✅ 加 $
<button onClick$={() => count.value++}>+1</button>
```

### 4. 不要在 `component$` 外用 hooks

```tsx
// ❌ 错误：顶层
const count = useSignal(0)  // 报错

// ❌ 错误：if 内
component$(() => {
  if (cond) {
    useTask$(() => {})  // 报错
  }
})

// ❌ 错误：onClick 内
<button onClick$={() => useSignal(0)}>  // 报错

// ✅ 正确：component$ 顶层
component$(() => {
  const count = useSignal(0)
  const data = useStore({})
  useTask$(() => {})
  return <button onClick$={() => count.value++}>+1</button>
})

// ✅ 自定义 hook 内（hook 在 component$ 顶层调用）
function useMyHook() {
  return useSignal(0)
}
component$(() => {
  const x = useMyHook()  // 顶层调用
})
```

### 5. `useResource$` 不要忘记 `track`

```tsx
// ❌ 没追踪 → 不会响应
const data = useResource$(async () => {
  const id = userId.value  // 直接读，没追踪
  return await fetch(`/api/${id}`)
})

// ✅ track 让 signal 变化重跑
const data = useResource$(async ({ track }) => {
  const id = track(() => userId.value)
  return await fetch(`/api/${id}`)
})
```

### 6. Signal vs Store 选择

```tsx
// ❌ Store 用于单值（浪费）
const count = useStore({ value: 0 })  // 不推荐

// ✅ 单值用 Signal
const count = useSignal(0)

// ❌ Signal 用于对象（顶层赋值才响应）
const user = useSignal({ name: 'Bob' })
user.value.name = 'Alice'  // 不触发响应！要 user.value = {...user.value, name: 'Alice'}

// ✅ 对象用 Store
const user = useStore({ name: 'Bob' })
user.name = 'Alice'  // 触发响应
```

### 7. 跨组件传 store 用 context

```tsx
// ❌ 不能把 store 通过 props 传（store 不是 signal）
<Child myStore={state} />  // 错误：props 必须可序列化

// ✅ 用 context 传
useContextProvider(MyStoreId, state)
// 子组件：
const state = useContext(MyStoreId)
```

### 8. server$ 必须用 function 而非箭头

```tsx
// ❌ 箭头函数：无法 this 绑定 RequestEvent
export const myFunc = server$(() => {
  this.cookie.get(...)  // 错误：this 是 undefined
})

// ✅ 用 function 关键字
export const myFunc = server$(function () {
  this.cookie.get(...)  // 正确
})
```

### 9. 不要混淆 `routeAction$` 和 `server$`

| 场景 | 推荐 |
|---|---|
| 表单提交（含无 JS 场景） | `routeAction$` + `<Form>` |
| 按钮点击触发后端逻辑 | `server$` 或 `action.submit()` |
| 类型安全的 RPC | `server$` |
| 数据校验（zod） | `routeAction$ + zod$` |
| 跨路由复用 | `globalAction$` 或 `server$` |

### 10. `useVisibleTask$` 是反模式

```tsx
// ❌ 不必要的 visible task
useVisibleTask$(() => {
  console.log('mounted')  // 这破坏了 Resumability
})

// ✅ 改用 useTask$ + isServer 守卫
useTask$(({ track }) => {
  track(() => signal.value)
  if (isServer) return
  // client only
})

// 只有以下情况才用 useVisibleTask$:
// - 必须操作 DOM（Chart.js / Three.js / Monaco 等）
// - 浏览器 API（IntersectionObserver / matchMedia）
// - 不依赖 signal 的纯客户端初始化
```

## Resumability vs Hydration 深度对比

### 启动时序对比

**React + Hydration**：

```
0ms    服务器 HTML 到达
0-50ms 浏览器渲染 HTML（可见）
50ms   开始下载 main.js（约 100KB）
200ms  main.js 下载完成 + parse
300ms  React.hydrateRoot() 开始
500ms  Hydration 完成 → 可交互
```

**Qwik + Resumability**：

```
0ms    服务器 HTML 到达
0-50ms 浏览器渲染 HTML（可见 + 可点击）
50ms   下载 Qwikloader（~1KB）
60ms   Qwikloader 就绪 → 完全可交互
```

> **TTI（Time to Interactive）差距**：大型 React 应用可达 500ms+，Qwik 应用稳定在 60-100ms。

### 应用复杂度 vs JS Size

```
React App:
├── 简单 (10 组件)  → 200 KB JS
├── 中等 (100 组件) → 800 KB JS
└── 大型 (1000 组件) → 3 MB JS

Qwik App:
├── 简单 (10 组件)   → 1 KB JS（启动）
├── 中等 (100 组件)  → 1 KB JS（启动）
└── 大型 (1000 组件) → 1 KB JS（启动）
```

> 应用复杂度**几乎不影响**首屏 JS——只有用户交互的部分才下载对应代码。

### Lighthouse 性能对比（典型场景）

| 指标 | React SSR + Hydration | Qwik Resumable |
|---|---|---|
| FCP（First Contentful Paint） | 1.2s | 0.8s |
| LCP（Largest Contentful Paint） | 2.5s | 1.5s |
| TTI（Time to Interactive） | 3.5s | 0.9s |
| TBT（Total Blocking Time） | 1500ms | 0ms |
| 首屏 JS | 250 KB | 1 KB |

### 适用场景对比

| 场景 | 推荐 |
|---|---|
| 内容站 / 博客 / 营销页 | **Qwik / Astro**（极致 TTI） |
| 电商（产品页、结算页） | **Qwik / Next.js** |
| 复杂 SPA（仪表盘、IDE） | React / Vue / Solid |
| 实时应用（聊天 / 协作） | React / Vue / Solid |
| 完全静态站点 | Astro（首选）/ Qwik SSG |
| 团队已有 React 生态 | Next.js / Remix |
| 团队愿意学新心智模型 | Qwik |

## Qwik 2.0 迁移提示

Qwik 2.0 正在开发中，主要变化：

- 包名：`@builder.io/qwik` → `@qwik.dev/core`
- Qwik + Qwik City 合并到 `@qwik.dev/router`
- 内部使用「v2 Optimizer」（性能更好）
- 新 API：`useTask$` 可能更名为 `useEffect$`（待定）

> 目前生产推荐 1.x（稳定）。2.0 发布后官方会提供 codemod 工具。
