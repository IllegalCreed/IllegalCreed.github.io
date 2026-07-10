---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **Fuse.js 7.4.2**。本篇把「会用 search」升到「会配 keys、会调参」：keys 三种写法（嵌套点号路径 / 数组路径 / `{ name, weight }` 加权）、threshold/location/distance 的含义与默认值、includeMatches 高亮、限制条数。

## 速查

- 字符串数组无需 `keys`；对象数组用字符串路径、数组路径或 `{ name, weight }` 指定字段
- 键名本身含 `.` 时必须用数组路径；数组内对象同样可沿路径提取多个值
- `weight` 必须大于 0，最终按总和归一化；关心的是字段之间的相对比例
- `threshold` 默认 `0.6`，越小越严格；返回条数由 `search(query, { limit })` 控制
- `location=0` / `distance=100` 默认偏好文本开头，长文本靠后命中可能被位置惩罚
- `ignoreLocation: true` 会忽略 location / distance，但不会关闭编辑距离或 threshold
- `includeMatches` 返回闭区间 `[start, end]`；渲染高亮时让框架转义原文，不要直接拼 `innerHTML`
- `includeScore` 才返回分数；`0` 最相关，排序默认从小到大

## 一、keys：指定搜索哪些字段

对象数组必须用 `keys`。它有三种写法，按需混用：

```js
const fuse = new Fuse(books, {
  keys: [
    "title", // ① 顶层字段
    "author.firstName", // ② 嵌套字段：点号路径
    { name: "tags", weight: 2 }, // ③ 加权字段
  ],
})
```

- **顶层字段**：直接写字段名字符串。
- **嵌套字段**：用**点号路径** `"author.firstName"`，Fuse 逐层取值。
- **加权字段**：写成 `{ name, weight }` 对象（见第三节）。

## 二、嵌套与数组路径

点号路径适合普通嵌套；但当**键名本身含字面点号**（键就叫 `"first.name"`），点号会被误拆，要改用**数组路径**：

```js
const fuse = new Fuse(data, {
  keys: [
    ["author", "firstName"], // 等价于 "author.firstName"
    ["author", "first.name"], // 键名含字面点号：必须用数组路径
  ],
})
```

数组里**每个元素是一整层键名**，其中的点号不会再被拆分。搜数组里对象的字段（如 `tags: [{ value }]`）也用数组路径：

```js
// data: [{ tags: [{ value: "js" }, { value: "ts" }] }]
const fuse = new Fuse(data, { keys: [["tags", "value"]] })
fuse.search("js") // 命中含该 tag 的项；Fuse 会遍历数组元素取 value 匹配
```

## 三、字段加权（weight）

让某些字段命中比别的更重要——keys 元素写成 `{ name, weight }`：

```js
const fuse = new Fuse(books, {
  keys: [
    { name: "title", weight: 0.7 }, // 标题更重要
    { name: "author", weight: 0.3 },
  ],
})
```

- `weight` 越大，该字段命中对最终相关度的贡献越大；值必须大于 0。
- 未指定时权重为 1，所有权重会按总和归一化，因此 `7:3` 与 `0.7:0.3` 表达同一相对关系。

## 四、threshold：控制匹配宽严

`threshold` 默认 **0.6**，范围 0.0~1.0，是一个 **score 上限闸门**：score 高于 threshold 的结果被丢弃。

| threshold | 效果 |
|---|---|
| `0.0` | 只接受完美匹配（最严格） |
| `0.3` | 较严格，结果少而精 |
| `0.6`（默认） | 偏宽松 |
| `1.0` | 放行最弱匹配，通常噪声很多 |

::: tip 记忆口诀
**threshold 越小越严格**（只放行很相近的），越大越宽松。它不是「返回条数」，限制条数用 `limit`（见第七节）。
:::

## 五、location 与 distance：位置约束

默认情况下，匹配并非「文本任意位置都算」：

- `location`（默认 **0**）：期望匹配大致出现在文本的哪个位置（0 = 开头）。
- `distance`（默认 **100**）：实际匹配位置离 `location` 多远还能接受。

二者与 threshold 共同决定窗口：粗略地说 `threshold × distance` 是离 `location` 的最大可接受偏移（默认 `0.6 × 100 = 60` 字符）。**所以在长文本里、目标词出现在靠后位置时，常常匹配不上**——下一篇讲怎么用 `ignoreLocation` 解决。

```js
// 默认窗口下，"zero" 出现在第 62 字符，落在 60 字符窗口外 → 搜不到
const text = ["Fuse.js is a lightweight fuzzy-search library, with zero dependencies"]
new Fuse(text).search("zero") // 可能为空
```

## 六、includeMatches：做搜索高亮

开 `includeMatches: true`，对结果的 `matches` 逐项按 `indices` 切成文本片段，再交给 UI 框架渲染：

```js
function splitMatches(value, indices) {
  const parts = []
  let last = 0
  for (const [start, end] of indices) {
    if (start > last) parts.push({ text: value.slice(last, start), matched: false })
    parts.push({ text: value.slice(start, end + 1), matched: true })
    last = end + 1
  }
  if (last < value.length) parts.push({ text: value.slice(last), matched: false })
  return parts
}
```

> `indices` 是**闭区间** `[start, end]`，切片取到 `end + 1`。让 Vue / React 根据 `matched` 渲染 `<mark>` 与普通文本，可自动转义原值；不要把数据拼成 HTML 后直接注入 DOM。

## 七、限制返回条数：search 的第二参

限制条数用 `search` 的**第二个参数** `{ limit }`，而不是构造选项：

```js
fuse.search("jon", { limit: 10 }) // 只返回前 10 条（已按 score 排序）
```

---

进入 [指南 · 进阶](./advanced)：ignoreLocation 与位置调参、扩展搜索语法（`'`/`!`/`^`/`$`）、逻辑搜索（`$and`/`$or`）、动态增删数据（add/remove）。
