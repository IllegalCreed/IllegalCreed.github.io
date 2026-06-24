---
layout: doc
outline: [2, 3]
---

# 变更 vs 不变更方法

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 八个**变更方法**（改原数组）：`push` / `pop` / `shift` / `unshift` / `splice` / `sort` / `reverse` / `fill`（外加 `copyWithin`）
- 变更方法多返回「新长度」或「被删元素」，**不返回新数组**——`const x = arr.sort()` 拿到的还是同一个 `arr`
- **ES2023** 四个不可变孪生（Baseline 广泛可用）：`toSorted` / `toReversed` / `toSpliced` / `with`，返回新数组、原数组不动
- `arr.with(i, v)`：返回「第 `i` 项换成 `v`」的新数组，是不可变版的 `arr[i] = v`
- **ES2023** 反向查找：`findLast` / `findLastIndex`，从末尾向前找，省去先 `reverse` 的麻烦
- 老写法等价：不可变排序以前要 `[...arr].sort()`，如今一句 `arr.toSorted()`
- React/Vue 状态：**永远别对 state 数组用变更方法**——用 `toSorted`/`with`/`filter`/`map` 产生新引用才会触发更新
- `sort` 默认按**字符串**比较：`[2, 10].sort()` 得 `[10, 2]`；数字排序必须传比较器 `(a, b) => a - b`
- `sort` / `toSorted` 是**稳定排序**（相等元素保持原相对顺序，ES2019 起规范保证）
- 不可变方法对**稀疏数组**会把空槽视为 `undefined`（与 `map` 保留空槽不同）

## 那条分水岭：哪些方法改原数组

数组方法分两大阵营。**变更方法**就地修改调用它的数组；**不变更（复制）方法**返回一个新数组、原数组原封不动。记住这九个会改原数组的，剩下的基本都是返回新值的：

| 变更方法 | 作用 | 返回值 |
| --- | --- | --- |
| `push(...items)` | 尾部添加 | 新长度 |
| `pop()` | 尾部删除 | 被删元素 |
| `unshift(...items)` | 头部添加 | 新长度 |
| `shift()` | 头部删除 | 被删元素 |
| `splice(start, n, ...items)` | 任意位置增删改 | 被删元素数组 |
| `sort(compareFn)` | 就地排序 | **同一个数组的引用** |
| `reverse()` | 就地反转 | **同一个数组的引用** |
| `fill(value, start, end)` | 区间填充同一个值 | **同一个数组的引用** |
| `copyWithin(target, start, end)` | 区间内部复制 | **同一个数组的引用** |

::: warning 最隐蔽的坑：`sort` / `reverse` 返回的是原数组本身
```js
const a = [3, 1, 2];
const b = a.sort(); // 看起来像「拿到排序结果」
b.push(99); // 但 b 就是 a！
console.log(a); // [1, 2, 3, 99] —— a 也被改了
console.log(a === b); // true
```
误以为 `b` 是副本，结果改 `b` 把 `a` 一起改了——这是「状态被意外篡改」的经典来源。
:::

## `sort` 的两个必知细节

```js
// ① 默认按「字符串」排序，数字会排错
[2, 10, 1].sort(); // [1, 10, 2] ❌（"10" < "2" 因为逐字符比）

// 数字排序必须传比较器
[2, 10, 1].sort((a, b) => a - b); // [1, 2, 10] ✅ 升序
[2, 10, 1].sort((a, b) => b - a); // [10, 2, 1] 降序
```

比较器返回值的含义：**负数** → `a` 排前面；**正数** → `a` 排后面；**0** → 保持相对顺序。

```js
// ② 排序是稳定的（ES2019 起规范保证）
// 相等的元素（这里按 age 比，name 不同）保持原有先后
const people = [
  { name: "A", age: 20 },
  { name: "B", age: 18 },
  { name: "C", age: 20 },
];
people.sort((x, y) => x.age - y.age);
// 结果中 A 仍在 C 前面（它们 age 相等，保持原序）
```

## ES2023：每个变更方法的「不可变孪生」

长期以来，想要「排序但不动原数组」只能手写 `[...arr].sort()` 这种「先复制再变更」的两步操作。**ES2023** 一次性补齐了不可变版本，已 **Baseline 广泛可用**：

| 变更方法（改原） | ES2023 不变更孪生（返回新数组） |
| --- | --- |
| `sort()` | **`toSorted()`** |
| `reverse()` | **`toReversed()`** |
| `splice()` | **`toSpliced()`** |
| `arr[i] = v`（直接赋值改原） | **`with(i, v)`** |

```js
const arr = [3, 1, 2];

const sorted = arr.toSorted((a, b) => a - b); // [1, 2, 3]
console.log(arr); // [3, 1, 2] —— 原数组纹丝不动 ✅

const reversed = arr.toReversed(); // [2, 1, 3]
const spliced = arr.toSpliced(1, 1, 99); // [3, 99, 2]（删索引 1 的 1 个、插 99）
console.log(arr); // 仍是 [3, 1, 2]
```

### `with(index, value)`：不可变的单点替换

`arr[i] = v` 会改原数组；`with` 返回一个「第 `i` 项被替换」的新数组：

```js
const arr = ["a", "b", "c"];

const next = arr.with(1, "改"); // ["a", "改", "c"]
console.log(arr); // ["a", "b", "c"]（原数组不变）✅

// with 也支持负索引
arr.with(-1, "尾"); // ["a", "b", "尾"]
```

这正是 React 里「更新数组中某一项」的理想写法：

```js
// React 状态更新：把第 i 项替换为新对象，得到全新数组引用
setItems((items) => items.with(i, { ...items[i], done: true }));
```

## ES2023：从末尾查找 `findLast` / `findLastIndex`

`find` / `findIndex` 从头往后找第一个匹配；**ES2023** 的 `findLast` / `findLastIndex` 从**末尾往前**找，免去「先 `reverse` 再 `find`」的别扭：

```js
const nums = [1, 2, 3, 4, 5, 6];

nums.find((n) => n % 2 === 0); // 2（第一个偶数）
nums.findLast((n) => n % 2 === 0); // 6（最后一个偶数）✅

nums.findIndex((n) => n > 3); // 3（第一个 >3 的索引）
nums.findLastIndex((n) => n > 3); // 5（最后一个 >3 的索引）✅
```

它们同样**不改原数组**，回调签名与 `find` 一致：`(元素, 索引, 数组)`。

## 为什么这在框架里至关重要

React、Vue（以及任何靠「引用是否变化」判断更新的库）都依赖**新引用**来侦测状态变化。对 state 数组用变更方法，引用没变，框架认为「什么都没发生」：

```js
// ❌ 错：sort 就地改，引用不变，React 不重渲染
state.list.sort((a, b) => a - b);
setList(state.list);

// ✅ 对：toSorted 产生新数组，引用变了，触发更新
setList(state.list.toSorted((a, b) => a - b));

// 其它产生新数组的常用方式
setList((list) => [...list, newItem]); // 追加
setList((list) => list.filter((x) => x.id !== id)); // 删除
setList((list) => list.map((x) => (x.id === id ? next : x))); // 更新某项
```

::: tip 心智模型
把数组状态当成**不可变**的：不要去改它，而要**基于它生成一个新的**。`toSorted` / `toReversed` / `toSpliced` / `with` / `map` / `filter` / 扩展 `...` 都是「生成新数组」的工具，配合得当就再也不会踩「改了原数组」的坑。
:::

## 小结

记住九个变更方法（`push`/`pop`/`shift`/`unshift`/`splice`/`sort`/`reverse`/`fill`/`copyWithin`），其余多返回新数组；最隐蔽的是 `sort`/`reverse` 返回的是原数组本身。ES2023 的 `toSorted`/`toReversed`/`toSpliced`/`with` 与 `findLast`/`findLastIndex` 让不可变操作成为一等公民。下一页深入返回新数组的主力——[高阶遍历方法](./higher-order-iteration) `map`/`filter`/`reduce`。
