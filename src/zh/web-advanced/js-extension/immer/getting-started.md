---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇讲 **Immer 的核心用法**：安装、`produce` 与 draft、改对象/数组、返回新状态、配合 React。版本基线 **Immer 11.x**。对比对象：手写不可变更新、`structuredClone`。

## 速查

- 安装：`npm install immer`（或 `pnpm add immer` / `yarn add immer` / `bun add immer`）
- 核心：`const next = produce(base, draft => { /* 直接改 draft */ })`
- draft 是 base 的 **Proxy**；配方结束后 Immer 只复制改动节点（结构共享）
- 改对象：`draft.a.b = 1`、`delete draft.k`；改数组：`draft.list.push(x)`、`splice`…
- 整体替换状态：**直接 `return 新对象`**（前提：没同时改 draft）
- 默认 **auto-freeze**：产出结果被深冻结，越界 mutate 会报错
- 核心约 **3KB gzipped**；Map/Set、patches 需各自显式启用
- ⚠️ `draft = newObj`（重新赋值）**无效**；不能「既改 draft 又 return 新值」

## 一、Immer 解决什么问题

不可变更新的本质是「**绝不改原对象，总是造改过的副本**」。手写时要逐层浅拷贝改动路径上的每一层：

```js
// 不用 Immer：更新第 2 个 todo 的 done，并新增一个 todo
const nextState = baseState.slice() // 浅拷贝数组
nextState[1] = { ...nextState[1], done: true } // 浅拷贝该元素再改
nextState.push({ title: "Tweet about it" })
```

层级一深就极其啰嗦，且漏拷一层就会意外共享、埋下 bug。Immer 把这套样板代码全部消除：

```js
import { produce } from "immer"

const nextState = produce(baseState, draft => {
  draft[1].done = true
  draft.push({ title: "Tweet about it" })
})
// baseState 不变；nextState 是结构共享的新状态
```

## 二、produce 与 draft

`produce(baseState, recipe)`：第一个参数是基础状态，第二个是**配方（recipe）**函数，Immer 给它传入 `draft`。

- `draft` 是 `baseState` 的 **Proxy 代理**：读取时按需把子对象也包成 draft，写入时记录「这里改了」。
- 配方**通常不需要 return**——Immer 自动返回 draft 终态化后的新状态。
- **未发生任何改动时**，`produce` 原样返回传入的 `baseState`（同一引用），便于跳过重渲染。

```js
const base = { user: { name: "Ann", age: 30 }, tags: ["a"] }

const next = produce(base, draft => {
  draft.user.age++        // 深层赋值
  draft.tags.push("b")    // 数组追加
})

console.log(base.user.age) // 30（原状态不变）
console.log(next.user.age) // 31
console.log(next.tags === base.tags) // false（改过，新引用）
console.log(next.user === base.user) // false
```

## 三、改对象与数组：用原生 API

```js
produce(state, draft => {
  // 对象
  draft.profile.name = "Bob"      // 赋值
  draft.profile.token = undefined // 注意：这是设为 undefined，键还在
  delete draft.profile.token      // 删除键用 delete

  // 数组
  draft.list.push(item)           // 末尾追加
  draft.list.unshift(item)        // 头部插入
  draft.list.splice(2, 1)         // 删除 index=2 的一个元素
  draft.list[0].done = true       // 按索引改元素
  draft.list = draft.list.filter(x => x.active) // 过滤后重新赋值
})
```

> 核心心法：**像平时写可变代码一样写**，Immer 负责把它变成不可变更新。

## 四、返回全新状态

需要「整体替换」状态时，**直接 `return` 新值**即可——但**前提是你没同时 mutate draft**：

```js
const reducer = produce((draft, action) => {
  switch (action.type) {
    case "rename":
      draft.user.name = action.name // OK：改 draft
      return                         // 等价于 return draft
    case "load":
      return action.payload          // OK：返回全新状态（且没改 draft）
  }
})
```

::: warning 两个最常见的坑
① `draft = { ...draft, done: true }` **无效**——重新给局部变量赋值，Immer 看不到。要么改 draft，要么 `return` 新对象。
② **不能「既改 draft 又 return 新值」**，会抛错（意图冲突）。二选一。
:::

## 五、配合 React useState

借助柯里化 `produce`（第一个参数传函数），可直接喂给 `setState`：

```js
import { produce } from "immer"

const [todos, setTodos] = useState(initial)

// produce(recipe) 返回 (state) => nextState，正好匹配函数式更新
const toggle = id =>
  setTodos(
    produce(draft => {
      const t = draft.find(t => t.id === id)
      t.done = !t.done
    })
  )
```

嫌每次包 `produce` 啰嗦？用 `use-immer` 的 `useImmer`，它把 `produce` 自动包好：

```js
import { useImmer } from "use-immer"
const [todos, setTodos] = useImmer(initial)
setTodos(draft => { draft.push(newTodo) }) // 直接给个 recipe
```

---

掌握基本用法后，进入 [指南 · 基础](./guide-line/base)：draft/Proxy 工作原理、结构共享、auto-freeze、Map/Set 与类的支持。
