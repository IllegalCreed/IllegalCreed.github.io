---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇讲 **Fuse.js 的核心用法**：安装、`new Fuse(list, options)`、`fuse.search(pattern)`、keys 指定字段、score 的含义、拿分数与高亮。版本基线 **Fuse.js 7.x**。对比对象：精确匹配（`includes`/正则）、后端搜索引擎。

## 速查

- 安装：`npm install fuse.js`（或 `pnpm add fuse.js` / `yarn add fuse.js` / `bun add fuse.js`）
- 引入：`import Fuse from 'fuse.js'`（ESM）/ `const Fuse = require('fuse.js')`（CJS）
- 建实例：`const fuse = new Fuse(list, options)`；查询：`fuse.search(pattern)`
- 对象数组要配 `keys`（搜哪些字段）；纯字符串数组**不需要** keys
- 结果形如 `{ item, refIndex, score?, matches? }`；无匹配返回**空数组 `[]`**
- ⚠️ **score：`0` 完美匹配、`1` 完全不匹配，越小越相关（别讲反）**
- 默认不带分数/区间：要 score 开 `includeScore: true`；要高亮区间开 `includeMatches: true`
- 匹配宽严由 `threshold`（默认 `0.6`，**越小越严格**）控制

## 一、Fuse.js 解决什么问题

精确匹配（`Array.includes`、正则）只能命中**字面完全一致**的内容，用户打错一个字母就什么都搜不到。Fuse.js 做的是**容错的模糊匹配**：把查询与数据做近似比对，按相关度排序返回，能容忍拼写错误。

```js
// 用 includes：打错就没结果
const books = ["Old Man's War", "The Lock Artist"]
books.filter(b => b.includes("jon")) // []
```

```js
import Fuse from "fuse.js"

const fuse = new Fuse(books) // 纯字符串数组，无需 keys
fuse.search("war") // 命中 "Old Man's War"，即便不完整也能模糊匹配
```

## 二、new Fuse(list, options)

`new Fuse(list, options)`：第一个参数是要搜索的数据列表（字符串数组或对象数组），第二个参数是配置项。**必须用 `new`**（Fuse 是 class）。

```js
import Fuse from "fuse.js"

const books = [
  { title: "Old Man's War", author: "John Scalzi" },
  { title: "The Lock Artist", author: "Steve Hamilton" },
]

// 对象数组：用 keys 指定搜索哪些字段
const fuse = new Fuse(books, {
  keys: ["title", "author"],
})

const results = fuse.search("jon") // 容错命中 author: "John Scalzi"
```

## 三、search(pattern) 与结果结构

`fuse.search(pattern)` 返回**结果数组**，每项结构：

```js
// 默认（未开 includeScore / includeMatches）
[{ item: { title: "Old Man's War", author: "John Scalzi" }, refIndex: 0 }]
```

- `item`：命中的原始数据项（回指源对象）。
- `refIndex`：该项在**原始 list** 中的下标（结果会被重排，靠它回溯源数据）。
- 无任何项匹配时返回**空数组 `[]`**（不是 null/undefined，也不抛错）。

## 四、score：越小越匹配

要在结果里拿到数值分数，开 `includeScore: true`：

```js
const fuse = new Fuse(["apple", "banana", "orange"], { includeScore: true })

fuse.search("aple")
// [{ item: "apple", refIndex: 0, score: 0.25 }]
```

::: warning score 的方向（最易踩的坑）
**`score: 0` 是完美匹配，`score: 1` 是完全不匹配——越小越相关。**结果默认按 score 升序排，最相关的在最前。把它理解成「相关度百分比、越大越好」是常见错误。
:::

## 五、includeMatches：拿到高亮区间

要在 UI 上把命中的字符高亮，开 `includeMatches: true`，结果会带 `matches`：

```js
const fuse = new Fuse(books, { keys: ["title"], includeMatches: true })
const [hit] = fuse.search("artist")

hit.matches
// [{ indices: [[4, 9]], value: "The Lock Artist", key: "title" }]
```

- `indices`：命中的 `[start, end]` 闭区间数组（如 `[[4, 9]]`），按区间切片即可包 `<mark>`。
- `value`：被命中的原文；`key`：命中的字段名（多字段时用来定位在哪个字段高亮）。

## 六、对象数组 vs 字符串数组

| 数据形态 | 是否要 keys | 示例 |
|---|---|---|
| 字符串数组 | **不需要** | `new Fuse(["apple", "pear"])` |
| 对象数组 | **需要 keys** | `new Fuse(books, { keys: ["title", "author"] })` |

> 心法：**先想清楚「搜什么数据形态」**——字符串数组直接搜；对象数组必须用 `keys` 告诉 Fuse 在哪些字段里找。

---

掌握基本用法后，进入 [指南 · 基础](./guide-line/base)：keys 进阶（嵌套/数组/加权）、threshold/location/distance 调参、includeMatches 高亮实战。
