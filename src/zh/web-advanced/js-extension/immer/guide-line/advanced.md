---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **Immer 11.x**。把 Immer 用进真实项目：柯里化 producer、`current`/`original`、patches（undo/redo / 增量同步）、`createDraft`/`finishDraft`、与 React / Redux Toolkit 集成。

## 一、柯里化 producer：复用配方

当 `produce` 的**第一个参数是函数**时，它不立即执行，而是返回一个**可复用的生产者函数**：

```js
// produce(recipe) => (state, ...args) => nextState
const toggleTodo = produce((draft, id) => {
  const t = draft.find(t => t.id === id)
  t.done = !t.done
})

const next = toggleTodo(baseState, "id-1") // 之后随时传状态
```

配方的额外参数（`id`）会成为返回函数的额外参数。这与 reducer、React `setState` 函数式更新天然契合。

## 二、current 与 original：审视 draft

在配方**内部**，两者取的「时点」不同：

```js
import { current, original, produce } from "immer"

produce({ x: 0, users: [{ name: "Richie" }] }, draft => {
  draft.x++
  original(draft).x          // 0  —— 改动前的原值
  current(draft).x           // 1  —— 当前改动后的「普通快照」
  original(draft.users) === baseState.users // true —— 取回原始引用做身份比较
})
```

- `original(draft)`：返回**基础状态**里对应的**原始对象**，常用于严格相等比较（如树中定位节点）。
- `current(draft)`：返回 draft **当前状态**的一份**普通对象快照**（非 Proxy、未冻结），常用于**调试打印**中间态。`current` 偏贵，少用。

> 为什么不能直接 `draft.users === base.users`？因为 draft 是 Proxy，与原对象不 `===`。要比身份，先 `original()`。

## 三、patches：undo/redo 与增量同步

补丁是可选插件，**先 `enablePatches()`**。`produceWithPatches` 返回三元组：

```js
import { enablePatches, produceWithPatches, applyPatches } from "immer"
enablePatches()

const [next, patches, inversePatches] = produceWithPatches(
  { age: 33 },
  draft => { draft.age++ }
)
// patches:        [{ op: "replace", path: ["age"], value: 34 }]
// inversePatches: [{ op: "replace", path: ["age"], value: 33 }]
```

- `applyPatches(state, patches)`：把补丁**重放**到某状态，产出新状态。
- 配合 `inversePatches` 即可**撤销/重做**；通过 WebSocket 只传补丁即可**跨端增量同步**；也可用于调试回放。
- 补丁是**类 RFC-6902** 的 JSON Patch，但 **`path` 是数组**（如 `["users", 3, "name"]`），与标准的斜杠字符串不同，互通需转换。
- 注意：Immer **不保证补丁是最小集**，需要时自行压缩。

`produce` 的**第三个参数**也是 patch 监听器（与上等价的另一途径）：

```js
produce(base, draft => { draft.age++ }, (patches, inverse) => {
  changes.push(...patches)
})
```

## 四、createDraft / finishDraft：脱离配方的 draft

低级 API，主要给**库作者**或**跨时间更新**用：

```js
import { createDraft, finishDraft } from "immer"

const draft = createDraft(base) // 创建可长期持有的 draft
draft.user.name = "Bob"         // 随时改
const next = finishDraft(draft) // 终态化产出新状态
```

约束：**不能用 `finishDraft` 去终态化一个由 `produce` 产生的 draft**（会破坏 produce 的作用域）。`finishDraft` 第二参也可传 patchListener。官方建议**应用代码优先用 `produce`**（更不易错）。

## 五、异步：先取数据，再 draft

Immer 核心**不支持异步配方**——所有异步工作必须在配方返回**之前**完成；把 draft 泄漏到 `await` 之后再改是**反模式**（异步期间的更新会被「丢失」）。正确姿势：

```js
// ✅ 先 fetch，后 produce
const data = await fetchData()
const next = produce(state, draft => { draft.data = data })

// ❌ 反模式：在 draft 上 await 后继续改
```

## 六、与 React / Redux Toolkit 集成

**React**：柯里化 produce 喂给 setState，或用 `use-immer`：

```js
import { useImmer } from "use-immer"
const [state, setState] = useImmer(initial)
setState(draft => { draft.count++ })
```

`useReducer` 也能与 Immer 组合：用 `produce` 包住 reducer，即可在 action 处理里直接 mutate。

**Redux Toolkit**：RTK **内置 Immer**，`createSlice` / `createReducer` 的 case reducer 内部就用 `produce` 包裹，因此可直接 mutate：

```js
import { createSlice } from "@reduxjs/toolkit"

const slice = createSlice({
  name: "counter",
  initialState: { value: 0, list: [] },
  reducers: {
    inc(state) { state.value++ },              // 直接 mutate！
    add(state, action) { state.list.push(action.payload) },
  },
})
```

> RTK 2.x 内置依赖 immer 11.x，无需你单独安装或配置 Immer。

---

进入 [指南 · 专家](./expert)：auto-freeze 性能权衡、`freeze` 预冻结、array methods 插件、`setUseStrictShallowCopy`/`setUseStrictIteration`、独立 Immer 实例、与 structuredClone 取舍。
