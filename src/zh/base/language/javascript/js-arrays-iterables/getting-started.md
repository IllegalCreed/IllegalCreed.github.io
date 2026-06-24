---
layout: doc
outline: [2, 3]
---

# 入门

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 创建：字面量 `[1, 2, 3]` 优先；`Array.of(7)` 得 `[7]`，而 `Array(7)` 得长度 7 的**空槽**数组（坑）
- 读写：`arr[0]` 正向、`arr.at(-1)` 取末位；`arr.length = 2` 会**截断**，`length` 变大会补空槽
- 遍历：`for...of`（值）/ `arr.entries()`（`[索引, 值]`）/ `forEach`；**别用 `for...in`**（会枚举到原型属性）
- 分水岭：**变更方法**（`push`/`pop`/`shift`/`unshift`/`splice`/`sort`/`reverse`/`fill`）改原数组；其余多返回新数组
- 不可变孪生（**ES2023**，Baseline 广泛可用）：`toSorted` / `toReversed` / `toSpliced` / `with`，原数组不动
- 变换三件套：`map`（一对一变形）、`filter`（筛选）、`reduce`（聚合成一个值）
- 解构：`const [a, b] = arr`、`const { x, y } = obj`，支持默认值 `= 1`、重命名 `x: foo`、剩余 `...rest`
- 扩展 `...`：展开复制 `[...arr]` / 合并 `[...a, ...b]`（**浅拷贝**）；剩余收集 `(...args) => {}`
- 协议：实现了 `Symbol.iterator` 的对象（数组/字符串/`Map`/`Set`）才能用 `for...of`、`...`、数组解构
- 类数组转真数组：`Array.from(nodeList)` 或 `[...nodeList]`；异步源用 `Array.fromAsync`（**ES2024**）

## 数组从一个字面量开始

```js
// 字面量：最常用、最直观
const fruits = ["苹果", "香蕉", "橙子"];

console.log(fruits.length); // 3
console.log(fruits[0]); // "苹果"
console.log(fruits.at(-1)); // "橙子"（at 支持负索引，从末尾数）
```

数组是「以整数为键、带 `length` 的特殊对象」。索引从 `0` 开始，`length` 永远比最大索引大 1。详见 [数组基础](./guide-line/array-basics)。

::: warning `Array(n)` 单数字参数的坑
`Array(3)` 不是 `[3]`，而是一个**长度为 3 的空槽数组** `[<3 empty items>]`；想造单元素数组用 `Array.of(3)` 或直接 `[3]`。
:::

## 增删改查：先认清「会不会改原数组」

这是整个数组体系**最重要的一条线**。一部分方法**就地修改**调用它的数组，另一部分**返回新数组、原数组不动**：

```js
const arr = [3, 1, 2];

// —— 变更方法（mutating）：改原数组 ——
arr.push(4); // 末尾加 → arr 变成 [3, 1, 2, 4]
arr.pop(); // 末尾删 → 返回 4，arr 回到 [3, 1, 2]
arr.sort(); // 就地排序 → arr 本身被重排

// —— 不变更方法（copying）：返回新数组 ——
const sorted = arr.toSorted((a, b) => a - b); // [1, 2, 3]，arr 不变（ES2023）
const sliced = arr.slice(0, 2); // 复制前两个，arr 不变
```

为什么这条线如此关键？在 React / Vue 里，「直接 `sort` 了 state 数组却发现视图不刷新」几乎都是踩在变更方法上。**ES2023** 给每个变更方法都配了不可变孪生版，让「想要新数组」时不必再手写 `[...arr].sort()`。完整对照见 [变更 vs 不变更方法](./guide-line/mutating-vs-immutable)。

## 遍历：三种主流写法

```js
const list = ["a", "b", "c"];

// ① for...of —— 直接拿到「值」，最常用
for (const item of list) {
  console.log(item); // "a" "b" "c"
}

// ② entries() —— 同时要「索引 + 值」
for (const [i, item] of list.entries()) {
  console.log(i, item); // 0 "a" / 1 "b" / 2 "c"
}

// ③ forEach —— 回调式，回调签名 (元素, 索引, 数组)
list.forEach((item, i) => console.log(i, item));
```

::: tip 别用 `for...in` 遍历数组
`for...in` 遍历的是「可枚举属性名」（字符串键），会连原型上的属性一起枚举，且顺序不保证。遍历数组值请用 `for...of`。
:::

## 声明式变换：map / filter / reduce

与其手写 `for` 循环改造数组，现代 JavaScript 更偏好**声明式**的高阶方法：

```js
const nums = [1, 2, 3, 4, 5];

// map：一对一变形，得到等长新数组
const doubled = nums.map((n) => n * 2); // [2, 4, 6, 8, 10]

// filter：按条件筛选，得到子集
const evens = nums.filter((n) => n % 2 === 0); // [2, 4]

// reduce：把整个数组「折叠」成一个值（这里求和）
const sum = nums.reduce((acc, n) => acc + n, 0); // 15

// 链式管道：先筛后变形再聚合
const result = nums
  .filter((n) => n % 2 === 1) // [1, 3, 5]
  .map((n) => n * 10) // [10, 30, 50]
  .reduce((a, b) => a + b, 0); // 90
```

这三个方法都**不改原数组**。细节与 `flatMap` / `find` 见 [高阶遍历方法](./guide-line/higher-order-iteration)。

## 解构与扩展：取值、复制、合并写成一行

```js
// 解构：从数组/对象里「拆」出值
const [first, second] = [10, 20]; // first=10, second=20
const { name, age } = { name: "张三", age: 18 }; // 按属性名取

// 扩展 ...：展开一个可迭代对象
const merged = [...[1, 2], ...[3, 4]]; // [1, 2, 3, 4]
const copy = [...merged]; // 浅拷贝一份

// 剩余 ...：把「剩下的」收集起来
const [head, ...tail] = [1, 2, 3, 4]; // head=1, tail=[2, 3, 4]
```

详见 [解构赋值](./guide-line/destructuring) 与 [扩展与剩余 `...`](./guide-line/spread-rest)。

## 数组背后的抽象：可迭代协议

为什么 `for...of`、`...`、`[a, b] = ...` 不只对数组有效，对字符串、`Map`、`Set`、`NodeList` 也有效？因为它们都实现了 **可迭代协议**——一个名为 `Symbol.iterator` 的方法。换句话说，数组只是「可迭代对象」里最常见的一种：

```js
// 字符串、Map 都是可迭代的，所以都能用这套语法
const [a, b] = "hi"; // a="h", b="i"
const chars = [..."abc"]; // ["a", "b", "c"]
```

理解这一层，才算从「会用数组」升级到「理解 JS 的迭代体系」。详见 [可迭代协议与 Iterator Helpers](./guide-line/iterables-iterator-helpers)。

## 下一步

按本叶地图依次深入，建议从 [数组基础](./guide-line/array-basics) 起步，把增删改查与遍历打牢，再进入决定数据是否被意外篡改的 [变更 vs 不变更方法](./guide-line/mutating-vs-immutable)。
