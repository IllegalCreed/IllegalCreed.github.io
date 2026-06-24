---
layout: doc
outline: [2, 3]
---

# 数组基础：增删改查与遍历

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 创建优先级：字面量 `[]` > `Array.of(...)` > `Array.from(...)`；少用 `new Array(n)`（单数字参 = 空槽）
- `length` 可写：`arr.length = 2` **截断**到 2 个；`arr.length = 5` 用空槽补齐到 5
- 取值：`arr[i]` 正向、`arr.at(-1)` 负向（末位）；越界返回 `undefined`，不报错
- 末尾增删：`push(...items)` 返回新长度、`pop()` 返回被删元素（都改原数组）
- 头部增删：`unshift(...items)` / `shift()`（改原数组，头部操作需移动全部元素，较慢）
- 任意位置：`splice(start, delCount, ...items)` 改原数组、返回被删元素数组；负 `start` 从末尾算
- 复制片段：`slice(start, end)` 返回新数组、原数组不动；`slice()` 浅拷贝整个数组
- 查找：`indexOf` / `lastIndexOf` 用 `===`（找不到 `NaN`）；`includes` 能找到 `NaN`；只判断有无用 `includes`
- 稀疏数组：连续逗号 `[1, , 3]` 或 `delete arr[1]` 造空槽；`map`/`forEach` **跳过**空槽，`for...of` 当 `undefined`
- 遍历：值用 `for...of`，索引值对用 `entries()`，回调用 `forEach`；拒绝 `for...in`

## 创建数组

```js
// ① 字面量（首选）
const a = [1, 2, 3];
const empty = [];

// ② Array.of —— 把参数逐个当元素，专治单数字坑
const b = Array.of(7); // [7]

// ③ Array.from —— 从「类数组 / 可迭代对象」造数组（详见可迭代协议页）
const c = Array.from("abc"); // ["a", "b", "c"]
const d = Array.from({ length: 3 }, (_, i) => i); // [0, 1, 2]
```

::: warning `new Array(n)` 的歧义
`Array(3)` 创建的是**长度为 3 的空槽数组**（不是 `[3]`），而 `Array(1, 2, 3)` 才是 `[1, 2, 3]`。同一个构造器，「一个数字参数」和「多个参数」语义不同——这正是 `Array.of` 存在的理由。另外 `Array(9.3)` 会抛 `RangeError`（长度必须是非负整数）。
:::

## `length` 不只是只读计数

`length` 始终等于「最大整数索引 + 1」，而且**可写**——写它能截断或扩展数组：

```js
const arr = ["a", "b", "c", "d"];

arr.length = 2;
console.log(arr); // ["a", "b"]（"c"、"d" 被丢弃）

arr.length = 4;
console.log(arr); // ["a", "b", <2 empty items>]（补出 2 个空槽）

arr.length = 0;
console.log(arr); // []（清空数组的一种写法）
```

## 读写元素

```js
const arr = ["甲", "乙", "丙"];

arr[0]; // "甲"
arr[10]; // undefined（越界不报错）
arr.at(-1); // "丙"（at 支持负索引）

arr[1] = "改"; // 改写
arr[5] = "跳"; // 在索引 5 赋值 → 中间 3、4 变成空槽，length 变为 6
```

`at()` 相比 `arr[arr.length - 1]` 更简洁地取末位，是访问负索引的现代写法。

## 增删：认准「头/尾/任意位置」

### 尾部（快）：`push` / `pop`

```js
const stack = [1, 2];
stack.push(3); // 返回新长度 3 → stack = [1, 2, 3]
stack.push(4, 5); // 可一次加多个 → [1, 2, 3, 4, 5]
const last = stack.pop(); // 返回被删的 5 → stack = [1, 2, 3, 4]
```

### 头部（慢）：`unshift` / `shift`

```js
const queue = [2, 3];
queue.unshift(1); // 头部插入 → [1, 2, 3]，返回新长度
const first = queue.shift(); // 删头部 → 返回 1，queue = [2, 3]
```

::: tip 头部操作为什么慢
`unshift` / `shift` 要把后面**所有元素**整体挪位（索引全部 +1 或 -1），是 O(n) 操作。大数组里频繁头插头删，性能远不如尾部的 `push` / `pop`。
:::

### 任意位置：`splice`（瑞士军刀）

`splice(start, deleteCount, ...items)` 能在任意位置删、加、替换，**就地修改原数组**，返回**被删除元素组成的新数组**：

```js
const arr = ["a", "b", "c", "d", "e"];

// 删除：从索引 1 起删 2 个
const removed = arr.splice(1, 2); // removed = ["b", "c"]，arr = ["a", "d", "e"]

// 插入：从索引 1 起删 0 个、插入两项
arr.splice(1, 0, "X", "Y"); // arr = ["a", "X", "Y", "d", "e"]

// 替换：删 1 个、补 1 个
arr.splice(0, 1, "首"); // arr = ["首", "X", "Y", "d", "e"]

// 负索引：从末尾数
arr.splice(-1, 1); // 删最后一个
```

记忆口诀：第一参「从哪开始」、第二参「删几个」、其余「要插什么」。

## 复制片段：`slice`（注意和 `splice` 区分）

`slice(start, end)` 返回**新数组**（含 `start`、不含 `end`），**不改原数组**——名字只差一个字母，行为却完全相反：

```js
const arr = [1, 2, 3, 4, 5];

arr.slice(1, 3); // [2, 3]（原数组不变）
arr.slice(2); // [3, 4, 5]（省略 end 取到末尾）
arr.slice(-2); // [4, 5]（负索引）
arr.slice(); // [1, 2, 3, 4, 5]（不传参 = 浅拷贝整个数组）
```

| 方法 | 改原数组 | 返回 |
| --- | --- | --- |
| `splice` | ✅ 是 | 被删除的元素数组 |
| `slice` | ❌ 否 | 截取出的新数组 |

## 查找元素：`indexOf` vs `includes`

```js
const arr = [1, 2, 3, NaN];

arr.indexOf(2); // 1（首次出现的索引）
arr.lastIndexOf(2); // 1（最后一次出现）
arr.indexOf(9); // -1（没找到）

arr.includes(3); // true（只问「有没有」，返回布尔）

// 关键差异：NaN
arr.indexOf(NaN); // -1 ❌（indexOf 用 === 比较，NaN !== NaN）
arr.includes(NaN); // true ✅（includes 用 SameValueZero，能识别 NaN）
```

判断「在不在」用 `includes`（更语义化，且能正确处理 `NaN`）；要拿位置才用 `indexOf`。

## 稀疏数组与空槽

「空槽」（empty slot）和值为 `undefined` 的格子**不是一回事**：

```js
const sparse = [1, , 3]; // 索引 1 是空槽
sparse[1]; // undefined（读取时表现为 undefined）

// 但遍历方法对待空槽不一致：
sparse.forEach((v) => console.log(v)); // 只打印 1、3（跳过空槽）
sparse.map((v) => v * 2); // [2, <empty>, 6]（保留空槽）

for (const v of sparse) console.log(v); // 1、undefined、3（当成 undefined）
```

| 行为 | `map`/`filter`/`forEach`/`reduce` | `for...of`/扩展/`find`/`entries` |
| --- | --- | --- |
| 对待空槽 | **跳过** | 当作 `undefined` |

实践中尽量别造稀疏数组（避免 `delete arr[i]`、避免 `arr.length = 大值`）；要「空位」就显式填 `undefined` 或 `null`。

## 遍历的三种主流方式

```js
const arr = ["红", "绿", "蓝"];

// ① 经典 for —— 需要索引、需要中途 break 时
for (let i = 0; i < arr.length; i++) {
  console.log(arr[i]);
}

// ② for...of —— 只要值，最简洁
for (const color of arr) {
  console.log(color);
}

// ③ entries() —— 同时要索引和值
for (const [i, color] of arr.entries()) {
  console.log(`${i}: ${color}`);
}

// ④ forEach —— 回调式（注意：无法 break，只能跑完）
arr.forEach((color, i) => console.log(i, color));
```

::: warning 永远不要用 `for...in` 遍历数组
`for...in` 遍历的是**可枚举属性键**（字符串形式），不仅会带上数组自定义的属性，顺序也不保证。它是为普通对象设计的，用在数组上是常见 bug 源。
:::

## 小结

数组的「增删改查」核心就两条：一是**头/尾/任意位置**对应不同方法与性能（尾快头慢、`splice` 万能）；二是 `slice`（拷贝、不改原）和 `splice`（就地改）一字之差却相反。下一页把「改原数组」这条线系统讲清——[变更 vs 不变更方法](./mutating-vs-immutable)，以及 ES2023 如何让不可变更新变得优雅。
