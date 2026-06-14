---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **Immer 11.x**。深入性能与内核：auto-freeze 权衡、`freeze` 预冻结、批处理、array methods 插件、`setUseStrictShallowCopy` / `setUseStrictIteration`、独立 Immer 实例、单向树假设、与 structuredClone 取舍。

## 一、性能定位：客观看待 Proxy 开销

官方基准：基于 Proxy 的 Immer 比**纯手写 reducer 慢约 2–3 倍**，但实践中通常**可忽略**；而且 Immer 能因「**无改动返回原引用**」**避免不必要的重渲染**，整体有时反而更快。与 Immutable.js 速度相当，却省去了 `toJS()` 来回转换普通对象的成本。

结论：绝大多数场景放心用；只在**超热路径**（极高频、极大数据）才考虑局部弃用 Immer 改手写。

## 二、auto-freeze 与 freeze 预冻结

冻结是深递归的，对**大且未来不变**的数据每次重复冻结是浪费。两种优化：

```js
import { setAutoFreeze, freeze, produce } from "immer"

// 方案 A：对某块大数据预先一次性深冻结，之后 Immer 不再重复递归处理
const frozenBig = freeze(bigData, true) // 第二参 true = 深冻结
const next = produce(state, draft => { draft.big = frozenBig })

// 方案 B：全局关闭自动冻结（牺牲防错换性能，谨慎）
setAutoFreeze(false)
```

> 优先用 `freeze()` **针对性**预冻结，而非一刀切关闭 auto-freeze——后者会丢掉「意外 mutate 防护」。

## 三、批处理：别把 produce 放进循环

每次 `produce` 都要建代理 + 终态化 + 冻结。循环里反复调用会成倍放大开销：

```js
// ❌ N 个元素 = N 次完整终态化
for (const x of items) state = produce(state, d => { d.list.push(x) })

// ✅ 把循环收进一次 produce：一次代理、一次终态化
state = produce(state, d => { for (const x of items) d.list.push(x) })
```

同理，大数组查找改用 `original(draft)` 在未代理的原数组上做，定位 index 后再改 draft，避免逐元素生成 Proxy。

## 四、array methods 插件（v11 新增）

`enableArrayMethods()` 优化数组方法：默认情况下 `filter`/`find`/`slice` 等会为遍历的**每个元素**创建 Proxy（1000 元素 = 1000+ 代理）。启用后回调收到的是 **base 值**，代理只在真正需要时才建：

```js
import { enableArrayMethods, produce } from "immer"
enableArrayMethods() // 约 +2KB

produce(largeState, draft => {
  const hit = draft.items.filter(x => x.value > 10) // 回调收 base 值
  hit[0].value = 999 // ✅ filter 是「子集」方法，返回项是 draft，改之会回写
})
```

语义要点（启用后）：

| 类别 | 方法 | 回调参数 | 返回项 | 改返回项是否回写 |
|---|---|---|---|---|
| 子集 | `filter`/`slice`/`find`/`findLast` | base 值 | **draft** | ✅ 会 |
| 变换 | `concat`/`flat` | base 值 | base 值 | ❌ 不会（需重新赋值） |
| 原语 | `includes`/`some`/`findIndex`… | base 值 | 原语 | 不适用 |
| 变异 | `push`/`splice`/`sort`… | — | 各异 | ✅（改 draft） |
| 未改写 | `map`/`forEach`/`reduce` | **draft** | 标准 | ✅ |

## 五、严格拷贝 / 严格迭代

| API | 作用 | 默认 |
|---|---|---|
| `setUseStrictShallowCopy(mode)` | 浅拷贝时是否严格复制**非可枚举**等属性（`true` 或 `"class_only"`） | `false`（非严格，性能优先） |
| `setUseStrictIteration(bool)` | 迭代时是否覆盖 symbol / 非可枚举属性（v11 默认改为 loose） | `false`（loose，更快） |

- 默认 loose/非严格：只处理普通可枚举自有属性，省检查、更快；代价是不覆盖 symbol / 非可枚举属性。
- 依赖这些属性时再开严格模式。注意开启 strict shallow copy 时，**getter 在「首次 mutation」时求值**，而非 produce 返回时。

## 六、独立 Immer 实例

顶层 `produce`、`setAutoFreeze` 等其实是**一个默认 Immer 单例**上的方法。需要**配置隔离**时用 `new Immer()`：

```js
import { Immer } from "immer"
const myImmer = new Immer({ autoFreeze: false })
const next = myImmer.produce(state, draft => { /* ... */ })
// 改 myImmer 的设置只影响该实例，不污染全局默认实例
```

适合库作者隔离配置，或同进程内并存多套冻结/拷贝策略。

## 七、单向树假设 & 与 structuredClone 取舍

- **单向树**：Immer 假设同一对象不在树中出现两次、无循环引用。违反会出错——图结构应**规范化（normalize）**，用 id 引用替代直接对象引用。
- **何时不用 Immer**：浅层 / 一次性 / 大面积替换的更新，直接 `return` 新对象或 `structuredClone` 可能更简单；状态含 Immer 不支持的 exotic 对象、或需真正深拷贝隔离时，`structuredClone` 更合适。
- **Immer 的甜区**：**深层、局部、频繁**的不可变更新——这正是它 Proxy + 结构共享最划算之处。

## 八、版本演进（截至 2026）

- **v11.0.0**（2025-11）：重写终态化系统（借鉴 Mutative 的 finalization callback 替代递归树遍历，提速），**默认迭代改为 loose iteration**（破坏性变更）。
- **v11.1.0**（2025-12）：新增可选 **array methods 插件**（`enableArrayMethods`），加速数组方法。
- v10 起移除 ES5 回退，**要求 Proxy 环境**。Redux Toolkit 2.x 内置依赖 immer 11.x。

---

回到 [入门](../getting-started) 复习用法，或查 [参考](../reference) 速览 API 与配置。
