---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **Immer 11.1.11**。本篇把「会用 produce」升到「懂机制」：draft/Proxy 工作原理、结构共享、auto-freeze、返回值规则、Map/Set 与类的支持。

## 速查

- `produce` 按需创建 Proxy，终态化时只复制改动路径；未改子树继续共享引用
- auto-freeze 默认递归冻结产出结果；进入结果的外部普通对象/数组也可能被冻住
- 配方中要么修改 draft，要么返回全新状态；两者同时做会抛错
- `return undefined` 表示未替换；真正产出 `undefined` 要 `return nothing`
- Map/Set 先 `enableMapSet()`；Map 的 key 不会被 draft 化
- 自定义类需设置 `[immerable] = true`；Date、DOM Node 等奇异对象应整体替换
- Immer 假设状态是单向树，不支持循环引用或同一对象在树中重复出现

## 一、produce 内部到底发生了什么

跑 `produce(base, recipe)` 时，Immer 大致经历三步：

1. **建代理**：把 `base` 包成一个 Proxy（draft）。你读到的嵌套对象也会被**按需**包成 draft（惰性，碰到才包）。
2. **跑配方**：你在 draft 上的每次写入都被 Proxy 的 trap 拦截并记录「此节点已改」。
3. **终态化（finalize）**：配方结束后，Immer 沿着「被改动的节点」复制出新对象，**未改动的子树直接复用旧引用**，最后（默认）递归冻结结果返回。

> 关键：Immer **不会一上来就深拷贝**。没碰的节点不包代理、不复制；这就是它既轻量又快的原因。

## 二、结构共享：为什么「未变即引用不变」

Immer 只为**改动路径上的节点**造新副本，其余共享。于是变更检测可以靠**引用比较**完成：

```js
const base = { a: { x: 1 }, b: { y: 2 } }
const next = produce(base, draft => {
  draft.a.x = 100 // 只动了 a
})

next !== base        // true：根变了
next.a !== base.a    // true：a 改了，新引用
next.b === base.b    // true：b 没动，共享同一引用！
```

`next.b === base.b` 为真，意味着 React `memo`、Redux `reselect` 等能据此**跳过未变部分的重渲染/重算**。这正是不可变数据的核心收益：**便宜的变更检测 + 便宜的克隆**（未变部分共享内存）。

## 三、auto-freeze：默认深冻结

Immer **默认开启 auto-freeze**：produce 产出的状态树（含新加入结果的普通对象/数组）会被**递归深冻结**：

```js
const next = produce({ a: { x: 1 } }, draft => { draft.a.x = 2 })

next.a.x = 999 // 严格模式下抛错：Cannot assign to read only property
```

- 目的：从根上**防止意外 mutate** 破坏不可变性。
- 范围：递归冻结（深层也冻），但默认不冻非可枚举/非自有/symbol 属性（除非它们在配方里被 draft 过）。
- 副作用提醒：**任何进入产出结果的普通对象/数组都会被冻结**，哪怕它原本没冻——所以配方并非完全无副作用。
- 闭包数据提醒：从配方外直接插入 draft 的对象**不会自动变成 draft**；在配方里继续修改它会修改原对象，应先把它纳入状态再于后续 `produce` 中更新。
- 关闭：`setAutoFreeze(false)`（性能调优见[专家篇](./expert)）。

## 四、返回值规则（务必记牢）

| 写法 | 结果 |
|---|---|
| 改 draft，不 return | ✅ 产出改动后的新状态（最常用） |
| 改 draft，`return draft` | ✅ 同上（return draft 等价于不 return） |
| 不改 draft，`return 新对象` | ✅ 用新对象整体替换状态 |
| `draft = 新对象` | ❌ 无效！只是重指局部变量，改动丢失 |
| 改 draft **且** `return 新对象` | ❌ 抛错：意图冲突 |
| `return undefined` | ⚠️ 被当作「没替换」，不是把状态变 undefined |

要把状态**产出为 `undefined`**，用哨兵值 `nothing`：

```js
import { produce, nothing } from "immer"
produce(state, draft => nothing) // 产出 undefined（而非「未改动」）
```

## 五、Map 与 Set：需先 enableMapSet()

自 v6 起，Map/Set 支持是**可选插件**，必须在应用启动时显式启用：

```js
import { enableMapSet, produce } from "immer"
enableMapSet() // 入口处调用一次

const next = produce(new Map([["a", 1]]), draft => {
  draft.set("b", 2)
  draft.delete("a")
})
```

- 不启用就把 Map/Set 放进状态并 mutate 会**报错**。
- Immer 产出的 Map/Set 在配方外是「人为不可变」的，对其调用 `set`/`clear` 等会抛「已冻结」错误。
- **Map 的 key 永不被 draft 化**：保证 key 始终引用相等，避免语义混乱（只有 value 按需被代理）。

## 六、类（class）：需标记 [immerable]

普通对象/数组默认可 draft，但**自定义类实例默认不可**，要给它打上 `[immerable] = true`：

```js
import { immerable, produce } from "immer"

class Clock {
  [immerable] = true // 标记为可 draft
  constructor(h, m) { this.hour = h; this.minute = m }
  tick() {
    return produce(this, draft => { draft.minute++ })
  }
}

const c1 = new Clock(12, 10)
const c2 = c1.tick()
c2 instanceof Clock // true：draft 保留原型
```

要点：draft 带上原型、只复制**自有属性**；**构造函数不会被调用**；只有「成对的 getter/setter」在 draft 中可写。`Date`/DOM Node/Buffer 等**奇异对象不支持**——`Date` 应「创建新实例替换」而非原地改。

---

进入 [指南 · 进阶](./advanced)：柯里化 producer、current/original、patches（undo/redo）、createDraft/finishDraft、与 React/Redux Toolkit 集成。
