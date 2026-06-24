---
layout: doc
outline: [2, 3]
---

# Map / Set 与弱引用

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- `Map`：键可为**任意值**（含对象）、保持**插入顺序**、有 `size`、可直接 `for...of`，无原型键污染
- `Map` 方法：`set` / `get` / `has` / `delete` / `clear` / `size` / `keys()` / `values()` / `entries()` / `forEach`
- `Map` vs 对象：键非字符串、需频繁增删、要计 size、要保序 → 用 `Map`；固定结构/要 JSON → 用对象
- `Set`：唯一值集合，自动去重；`add` / `has` / `delete` / `clear` / `size`，可迭代
- 一行去重：`[...new Set(arr)]`；判存在 O(1)，比数组 `includes` 快
- `Set` 集合运算（2024 起广泛可用）：`union` / `intersection` / `difference` / `symmetricDifference` / `isSubsetOf` / `isSupersetOf` / `isDisjointFrom`
- 相等语义：`Map`/`Set` 用 **SameValueZero**——`NaN` 等于自身（能去重），`+0` 与 `-0` 视为相等
- `WeakMap`：键**必须是对象**、**弱引用**（无其他引用时键值会被 GC）、不可枚举、无 `size` / `clear`
- `WeakSet`：弱引用的对象集合，不可枚举；用于「标记对象」而不阻止回收
- `WeakRef` / `FinalizationRegistry`（ES2021）：手动持有弱引用 / 注册回收回调；高级且慎用
- 分组（ES2024）：`Object.groupBy(items, fn)` → 普通对象；`Map.groupBy(items, fn)` → `Map`（键可为对象）

## `Map`：比对象更称职的键值集合

普通对象长期被当字典用，但它有几处先天不足：键只能是字符串或 `Symbol`、没有 `size`、迭代顺序有历史包袱、还可能和原型上的键（如 `toString`）冲突。`Map` 为「键值集合」量身打造，补齐了这些：

```js
const m = new Map();

// 键可以是任意值——包括对象、函数、NaN
const objKey = { id: 1 };
m.set("name", "Ada"); // 字符串键
m.set(objKey, "用对象当键"); // 对象键（普通对象做不到）
m.set(NaN, "甚至 NaN 也行");

m.get(objKey); // "用对象当键"
m.has("name"); // true
m.size; // 3（直接有 size，不用手数）
m.delete("name"); // true

// 直接可迭代，且保证插入顺序
for (const [k, v] of m) {
  console.log(k, v);
}

// 从 [key, value] 数组构造
const m2 = new Map([
  ["a", 1],
  ["b", 2],
]);
```

### `Map` vs 对象怎么选

| 维度 | `Map` | 普通对象 |
| --- | --- | --- |
| 键类型 | 任意值（对象、`NaN`…） | 仅字符串 / `Symbol` |
| 大小 | `.size` 直接拿 | 需 `Object.keys(o).length` |
| 顺序 | 保证插入顺序 | 整数键会被重排 |
| 迭代 | 自身可 `for...of` | 需 `Object.entries` 等 |
| 原型污染 | 无 | 有（`toString` 等键风险） |
| 频繁增删 | 优化好 | 一般 |
| JSON / 字面量 | 不能直接 `JSON.stringify` | 原生支持 |

经验：**键不是字符串、需要频繁增删、要 size 或保序** → `Map`；**结构固定、要序列化成 JSON、要用对象字面量写出来** → 普通对象。

## `Set`：唯一值集合

`Set` 存放**不重复**的值，自动去重，判断「是否存在」是 O(1)：

```js
const s = new Set();
s.add(1);
s.add("hi");
s.add(1); // 重复，被忽略
s.size; // 2

s.has("hi"); // true
s.delete(1); // true

// 最常见用途：数组去重（一行）
const arr = [1, 2, 2, 3, 3, 3];
[...new Set(arr)]; // [1, 2, 3]

// Set 与数组互转
Array.from(s); // Set → 数组
new Set([1, 2, 3]); // 数组 → Set
```

相比数组，`Set` 删值用 `delete(value)` 而非 `splice(indexOf(...), 1)`、查存在更快、还能正确处理 `NaN`（数组 `indexOf(NaN)` 永远返回 -1，而 `set.has(NaN)` 正常）。

### 集合运算方法（2024 起广泛可用）

`Set` 新增了一整套数学集合运算，2024 年陆续在主流浏览器落地（Baseline 新近可用），让交并差不再手写循环：

```js
const a = new Set([1, 2, 3]);
const b = new Set([2, 3, 4]);

a.union(b); // Set {1, 2, 3, 4}（并集）
a.intersection(b); // Set {2, 3}（交集）
a.difference(b); // Set {1}（差集：a 有 b 没有）
a.symmetricDifference(b); // Set {1, 4}（对称差：只在一边）

a.isSubsetOf(b); // false（a 是不是 b 的子集）
a.isSupersetOf(new Set([1, 2])); // true（a 是不是超集）
a.isDisjointFrom(new Set([9])); // true（是否毫无交集）
```

::: tip 兼容性提醒
集合运算方法属于较新特性，2024 年起在新版 Chrome / Firefox / Safari 可用。面向老环境时可降级为手写循环或工具库，或先做特性检测 `typeof set.union === "function"`。
:::

## 相等语义：SameValueZero

`Map` 的键和 `Set` 的值用 **SameValueZero** 算法判重，它和 `===` 几乎一样，但有两处不同：`NaN` **等于自身**（所以能被去重），而 `+0` 和 `-0` 被视为**相等**：

```js
new Set([NaN, NaN]).size; // 1（NaN 被去重了，=== 做不到）
new Set([0, -0]).size; // 1（+0 与 -0 视为同一个）

// 但对象按引用判等（内容相同的两个对象算不同）
new Set([{ x: 1 }, { x: 1 }]).size; // 2（不同引用）
```

## 弱引用：`WeakMap` 与 `WeakSet`

普通 `Map` / `Set` 对它持有的键/值是**强引用**——只要还在集合里，垃圾回收器就不会回收它们，容易造成内存泄漏。`WeakMap` / `WeakSet` 反其道而行：对键/值是**弱引用**，一旦外部再无其他引用，即使还「在」集合里，也会被 GC 回收。

### `WeakMap`

```js
const wm = new WeakMap();

let obj = { id: 1 };
wm.set(obj, "关联数据"); // 键必须是对象（或非注册 Symbol）
wm.get(obj); // "关联数据"

obj = null; // 解除唯一外部引用后……
// wm 里那一项会在某次 GC 时被自动清除（无需手动 delete）
```

`WeakMap` 的限制都源于「键随时可能消失」这一本质：

- 键**必须是对象**（或非注册 Symbol），不能是字符串/数字；
- **不可枚举**——没有 `keys()` / `values()` / `forEach`（因为成员随时变，遍历无意义）；
- **没有 `size`、没有 `clear`**；
- 只有 `set` / `get` / `has` / `delete`。

典型用途：给对象挂**私有数据**（外部拿不到、对象销毁即清）、**元数据**（不污染对象本身）、**缓存**（被缓存对象消失后缓存自动失效）：

```js
// 用 WeakMap 给 DOM 节点挂私有状态，节点移除后自动清理，不漏内存
const nodeState = new WeakMap();
function markVisited(node) {
  nodeState.set(node, { visitedAt: Date.now() });
}
```

::: tip 类的私有数据：优先用 `#` 字段
WeakMap 曾是模拟「类私有属性」的经典手法，但现代 JS 已有真正的私有字段语法（`class` 内的 `#field`，见对象与原型继承叶）。新代码做类私有数据优先用 `#`，WeakMap 更多用于「给第三方/无法改造的对象挂外部数据」。
:::

### `WeakSet`

```js
const ws = new WeakSet();
let el = document.createElement("div");
ws.add(el); // 只能加对象
ws.has(el); // true
el = null; // 无其他引用后，自动从 ws 中消失
```

`WeakSet` 同样不可枚举、无 `size`、无 `clear`，只有 `add` / `has` / `delete`。用途是「**标记**一批对象」而不阻止它们被回收——例如记录「哪些对象已处理过」「哪些节点已绑定监听」。

## `WeakRef` 与 `FinalizationRegistry`（进阶）

ES2021 引入了两个更底层的弱引用工具，供构建缓存、池等高级场景：

- `WeakRef`：手动持有一个对象的弱引用，用 `.deref()` 取回（可能已被回收返回 `undefined`）；
- `FinalizationRegistry`：注册「某对象被回收后执行的清理回调」。

```js
const ref = new WeakRef(someBigObject);
// 用时取回，可能已被 GC
const obj = ref.deref(); // someBigObject 或 undefined
```

::: warning 慎用
GC 的时机由引擎决定、不可预测，这两者的回调**不保证一定执行、也不保证及时**。MDN 明确建议「除非万不得已，不要依赖它们」——绝大多数业务代码用不到。

此外，**注册过的全局 Symbol（`Symbol.for(...)`）不能**作为 `WeakMap` 键、`WeakSet` 成员或 `WeakRef` 目标，因为它们本身不会被回收。
:::

## 分组：`Object.groupBy` / `Map.groupBy`（ES2024）

把数组按某规则分桶是高频需求，ES2024 给了两个内建静态方法：

```js
const items = [
  { type: "水果", name: "苹果" },
  { type: "蔬菜", name: "白菜" },
  { type: "水果", name: "香蕉" },
];

// 返回普通对象（键被转成字符串）
Object.groupBy(items, (it) => it.type);
// { 水果: [{...苹果}, {...香蕉}], 蔬菜: [{...白菜}] }

// 返回 Map（键可为任意值，包括对象）
Map.groupBy(items, (it) => it.type);
// Map { "水果" => [...], "蔬菜" => [...] }
```

需要用对象当分组键时用 `Map.groupBy`，否则 `Object.groupBy` 更顺手。

## 小结

`Map` 是比对象更称职的键值集合（任意键、有序、有 size），`Set` 一行去重且支持完整集合运算。它们的弱引用版 `WeakMap` / `WeakSet` 不阻止垃圾回收、不可枚举，专门用于给对象挂私有数据/元数据/标记而不泄漏内存。`WeakRef` 与 `FinalizationRegistry` 是慎用的进阶工具。下一页进入序列化与唯一标识：[JSON 与 Symbol](./json-symbol)。
