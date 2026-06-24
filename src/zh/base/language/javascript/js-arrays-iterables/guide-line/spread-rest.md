---
layout: doc
outline: [2, 3]
---

# 扩展与剩余 `...`

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 同一个 `...`，**两种角色**：扩展（展开已有集合）vs 剩余（把多个收成一个）——看它在哪
- 扩展数组：`[...arr]` 浅拷贝、`[...a, ...b]` 合并、`[0, ...arr, 9]` 插入
- 扩展传参：`fn(...args)` 把数组拆成一个个实参；`Math.max(...nums)` 求数组最值
- 扩展对象（ES2018）：`{ ...obj }` 浅拷贝、`{ ...a, ...b }` 合并（**后者覆盖前者**同名键）
- 「改一个字段」惯用法：`{ ...obj, name: "新" }`——不可变地覆盖 `name`
- 剩余参数：`function f(...args) {}` 把不定实参收成**真数组**（不同于 `arguments`）
- 剩余 + 解构：`const [first, ...rest] = arr`、`const { a, ...others } = obj`，必须最后一项
- **浅拷贝**警告：`...` 只复制一层，嵌套对象/数组仍是**共享引用**
- 扩展只对**可迭代对象**有效（数组/字符串/Set/Map）；对象扩展是单独规则，普通对象也行
- `[...str]` 按**码点**拆字符串（能正确处理 emoji），优于 `str.split("")`

## 一个符号，两种角色

`...` 长得一样，含义却由**位置**决定：

- **扩展（spread）**：在数组字面量 / 函数调用 / 对象字面量里，把一个集合「**摊开**」成多个独立项。
- **剩余（rest）**：在解构模式 / 函数参数里，把多个项「**收拢**」成一个数组或对象。

口诀：**摊开**用在「构造/调用」处，**收拢**用在「接收/解构」处。下面分别看。

## 扩展：把集合摊开

### 数组扩展

```js
const a = [1, 2];
const b = [3, 4];

const copy = [...a]; // [1, 2]（浅拷贝，copy !== a）
const merged = [...a, ...b]; // [1, 2, 3, 4]（合并）
const inserted = [0, ...a, 9]; // [0, 1, 2, 9]（任意位置插入）
const fromStr = [..."abc"]; // ["a", "b", "c"]（字符串可迭代）
```

`[...arr]` 是「复制数组」最常见的写法，和 `arr.slice()`、`Array.from(arr)` 等价（都是浅拷贝）。

### 函数调用时扩展实参

把数组「拆开」逐个传给函数，取代过时的 `Function.prototype.apply`：

```js
const nums = [5, 1, 8, 3];

Math.max(...nums); // 8（等价于 Math.max(5, 1, 8, 3)）

function sum(a, b, c) {
  return a + b + c;
}
sum(...[1, 2, 3]); // 6
```

### 对象扩展（ES2018）

```js
const base = { a: 1, b: 2 };

const clone = { ...base }; // { a: 1, b: 2 }（浅拷贝）
const extended = { ...base, c: 3 }; // { a: 1, b: 2, c: 3 }（添加）

// 合并：同名键「后者覆盖前者」
const merged = { ...base, ...{ b: 99, c: 3 } }; // { a: 1, b: 99, c: 3 }
```

::: tip 不可变更新字段：`{ ...obj, 字段: 新值 }`
React 里更新对象状态的标准写法——复制旧对象、覆盖个别字段、得到全新引用：
```js
setUser((user) => ({ ...user, name: "新名字" })); // 只改 name，其余照旧
```
:::

## 剩余：把多个收成一个

### 剩余参数

函数形参里的 `...` 把「不定数量的实参」收集成一个**真正的数组**：

```js
function sum(...nums) {
  // nums 是真数组，可直接用 reduce
  return nums.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3, 4); // 10

// 可与固定参数搭配，剩余参数必须在最后
function tag(first, ...others) {
  return { first, others };
}
tag("a", "b", "c"); // { first: "a", others: ["b", "c"] }
```

::: warning 剩余参数 vs `arguments`
老式 `arguments` 是个**类数组对象**（有 `length` 但没有 `map`/`reduce`），还在箭头函数里不可用。剩余参数 `...args` 是**真数组**，且语义清晰——新代码一律用剩余参数，别再用 `arguments`。
:::

### 剩余用于解构

这与上一页 [解构赋值](./destructuring) 衔接——剩余在解构里「兜住其余」：

```js
const [first, ...rest] = [1, 2, 3, 4]; // first=1, rest=[2, 3, 4]
const { id, ...others } = { id: 1, x: 2, y: 3 }; // id=1, others={ x: 2, y: 3 }
```

## 同一行里两个角色同时出现

扩展与剩余完全可以在一条语句里各司其职，这也最能体现「位置决定语义」：

```js
function reorder(first, ...rest) {
  // rest 是「剩余」（收）；返回时的 ...rest 是「扩展」（摊）
  return [...rest, first];
}
reorder(1, 2, 3, 4); // [2, 3, 4, 1]
```

## 必须警惕：`...` 是浅拷贝

`...` 只复制**最外层一层**。嵌套的对象/数组仍是**同一个引用**，改副本里的深层数据会连原对象一起改：

```js
const original = { name: "A", tags: ["x", "y"] };
const copy = { ...original };

copy.name = "B"; // ✅ 安全：浅层独立，original.name 仍是 "A"
copy.tags.push("z"); // ⚠️ 危险：tags 是共享引用！
console.log(original.tags); // ["x", "y", "z"] —— 原对象也被改了
```

需要「深拷贝」时，用结构化克隆 `structuredClone(obj)`（现代浏览器与 Node 均内置），别指望 `...` 帮你深复制：

```js
const deep = structuredClone(original); // 真正的深拷贝，互不影响
```

## 一个实用细节：`[...str]` 正确拆 emoji

字符串迭代器按 **Unicode 码点**走，能完整保留代理对（surrogate pair），因此 `[...str]` 拆 emoji 不会把一个表情拆成两半，优于按 UTF-16 码元切分的 `split("")`：

```js
[..."a🙂b"]; // ["a", "🙂", "b"] ✅
"a🙂b".split(""); // ["a", "\ud83d", "\ude42", "b"] ❌（emoji 被拆成两个码元）
```

这同样源于「字符串实现了可迭代协议」——下一页正式讲这套协议。

## 小结

`...` 一个符号两副面孔：在构造/调用处「摊开」（扩展），在接收/解构处「收拢」（剩余）。它让数组复制、合并、传参、不可变更新都变得简洁，但务必记住它是**浅拷贝**，深层数据要用 `structuredClone`。扩展之所以对数组/字符串/`Set`/`Map` 通用，根源是它们都遵循**可迭代协议**——下一页 [可迭代协议与 Iterator Helpers](./iterables-iterator-helpers) 揭开这层抽象，并介绍 ES2025 的惰性迭代器方法。
