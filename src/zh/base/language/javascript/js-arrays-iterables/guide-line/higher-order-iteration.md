---
layout: doc
outline: [2, 3]
---

# 高阶遍历方法

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 回调统一签名：`(element, index, array)` —— 第二参索引、第三参原数组，常只用第一参
- `map(fn)`：一对一变形，返回**等长**新数组；回调必须 `return`，忘了 return 全是 `undefined`
- `filter(fn)`：回调返回真值则保留，得到**子集**新数组；无匹配返回 `[]`
- `reduce(fn, init)`：折叠成单值，回调 `(acc, cur) => 新acc`；**空数组无初始值会抛错**，务必给 `init`
- `reduceRight(fn, init)`：同 `reduce` 但从右往左
- `find(fn)` / `findIndex(fn)`：返回首个匹配的**元素** / **索引**（找不到 `undefined` / `-1`）
- `some(fn)`：任一匹配即 `true`（短路）；`every(fn)`：全部匹配才 `true`（短路）
- `flat(depth=1)`：拍平嵌套数组；`flatMap(fn)` = `map` 后 `flat(1)`，常用于「一个变多个」
- 以上方法**都不改原数组**（`map`/`filter`/`flat`/`flatMap` 返回新数组）
- 链式管道：`arr.filter(...).map(...).reduce(...)`，声明式、可读，替代手写 `for`

## 高阶方法的共同形态

它们都接收一个**回调函数**，并对每个元素调用它。回调的完整签名是三个参数：

```js
arr.map((element, index, array) => {
  // element：当前元素
  // index：当前下标
  // array：被遍历的数组本身（少用）
});
```

绝大多数时候只用到 `element`，偶尔用 `index`。下面逐个拆解。

## `map`：一对一变形

`map` 对每个元素执行回调，把**返回值**收集成一个**等长**的新数组：

```js
const nums = [1, 2, 3];

const squared = nums.map((n) => n * n); // [1, 4, 9]
const labels = nums.map((n) => `第 ${n} 项`); // ["第 1 项", "第 2 项", "第 3 项"]

// 带索引
const withIndex = nums.map((n, i) => `${i}:${n}`); // ["0:1", "1:2", "2:3"]
```

::: warning 最常见的 `map` 错误：忘了 return
箭头函数加了花括号 `{}` 就需要显式 `return`，否则每个元素都映射成 `undefined`：
```js
[1, 2].map((n) => {
  n * 2;
}); // [undefined, undefined] ❌（没 return）
[1, 2].map((n) => {
  return n * 2;
}); // [2, 4] ✅
[1, 2].map((n) => n * 2); // [2, 4] ✅（无花括号，隐式返回）
```
:::

## `filter`：按条件筛选

回调返回**真值**则保留该元素，得到一个**子集**新数组：

```js
const nums = [1, 2, 3, 4, 5, 6];

const evens = nums.filter((n) => n % 2 === 0); // [2, 4, 6]
const big = nums.filter((n) => n > 10); // []（无匹配返回空数组）

// 过滤对象数组
const users = [
  { name: "A", active: true },
  { name: "B", active: false },
];
const actives = users.filter((u) => u.active); // [{ name: "A", active: true }]
```

`filter` 配合 `Boolean` 还能一键剔除假值：

```js
[0, 1, "", "a", null, 2].filter(Boolean); // [1, "a", 2]
```

## `reduce`：折叠成一个值

`reduce` 是最强大也最易写错的一个。它把数组「折叠」成单个结果，回调 `(accumulator, current) => 新accumulator`，第二参是**初始值**：

```js
const nums = [1, 2, 3, 4];

// 求和
const sum = nums.reduce((acc, n) => acc + n, 0); // 10

// 求最大值
const max = nums.reduce((acc, n) => Math.max(acc, n), -Infinity); // 4

// 数组 → 对象（按某字段建索引）
const list = [
  { id: "a", v: 1 },
  { id: "b", v: 2 },
];
const byId = list.reduce((acc, item) => {
  acc[item.id] = item;
  return acc; // ← reduce 里务必返回累加器
}, {}); // { a: {...}, b: {...} }
```

::: warning 不给初始值 + 空数组 = 抛错
```js
[].reduce((a, b) => a + b); // ❌ TypeError: Reduce of empty array with no initial value
[].reduce((a, b) => a + b, 0); // ✅ 返回 0
```
省略初始值时，`reduce` 拿**第一个元素**当初值、从第二个元素开始迭代；数组为空就无初值可用，于是报错。**养成总是传初始值的习惯**——既避免空数组崩溃，也让累加器类型明确。
:::

`reduceRight` 与 `reduce` 完全一致，只是从最后一个元素往前折叠（处理顺序相关的场景才需要它）。

## `find` / `findIndex`：定位单个元素

```js
const users = [
  { id: 1, name: "张三" },
  { id: 2, name: "李四" },
];

users.find((u) => u.id === 2); // { id: 2, name: "李四" }（首个匹配的元素）
users.find((u) => u.id === 9); // undefined（没找到）

users.findIndex((u) => u.id === 2); // 1（首个匹配的索引）
users.findIndex((u) => u.id === 9); // -1（没找到）
```

`find` 与 `filter` 的区别：`find` 找到第一个就停、返回**单个元素**；`filter` 跑完全程、返回**数组**。要「最后一个匹配」用上一页的 `findLast` / `findLastIndex`。

## `some` / `every`：存在性与全称判断

```js
const nums = [1, 2, 3, 4];

nums.some((n) => n > 3); // true（存在 >3 的）—— 找到一个就短路返回
nums.every((n) => n > 0); // true（全都 >0）—— 遇到第一个 false 就短路
nums.every((n) => n > 2); // false（1、2 不满足）
```

两者都**短路**：`some` 一旦遇到真值立刻返回 `true`，`every` 一旦遇到假值立刻返回 `false`，不会跑完整个数组。

## `flat` / `flatMap`：拍平与「一变多」

```js
// flat：把嵌套数组拍平，默认拍一层
[1, [2, 3], [4, [5]]].flat(); // [1, 2, 3, 4, [5]]
[1, [2, [3, [4]]]].flat(2); // [1, 2, 3, [4]]（拍两层）
[1, [2, [3]]].flat(Infinity); // [1, 2, 3]（全部拍平）

// flatMap：先 map 再 flat(1)，适合「一个元素产出多个」
const sentences = ["hello world", "foo bar"];
sentences.flatMap((s) => s.split(" ")); // ["hello", "world", "foo", "bar"]

// 用 flatMap 同时实现「映射 + 过滤」（返回 [] 即丢弃）
[1, 2, 3, 4].flatMap((n) => (n % 2 === 0 ? [n * 10] : [])); // [20, 40]
```

## 链式管道：声明式数据处理

这些方法都返回新数组（`reduce` 例外，返回累加结果），因此能**链式**串起来，形成一条清晰的「数据流水线」，替代命令式的 `for` 循环：

```js
const orders = [
  { user: "A", amount: 100, paid: true },
  { user: "B", amount: 200, paid: false },
  { user: "A", amount: 300, paid: true },
];

// 已付款订单的总金额
const total = orders
  .filter((o) => o.paid) // 先筛：[A100, A300]
  .map((o) => o.amount) // 再取金额：[100, 300]
  .reduce((sum, x) => sum + x, 0); // 再求和：400
```

::: tip 可读性 vs 性能
链式写法每一环都生成中间数组。日常数据量下这点开销可忽略，**优先选可读性**。只有在超大数组或性能热点处，才考虑合并步骤、改用一次 `reduce` 或普通循环——或用下一节会讲的 **Iterator Helpers** 做惰性、无中间数组的链式处理。
:::

## 小结

`map`（变形）、`filter`（筛选）、`reduce`（聚合）是函数式数据处理的三大支柱，配合 `find`/`some`/`every`/`flatMap` 覆盖了绝大多数遍历需求，且全都不改原数组。下一页转向另一组让代码更简洁的语法——[解构赋值](./destructuring)，把「从数组/对象取值」写成一行。
