---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **Fuse.js 7.4.2**。把 Fuse.js 用进真实项目：`ignoreLocation` 与位置调参、token search、扩展搜索语法、逻辑搜索、动态增删数据与其它常用选项。

## 速查

- 长文本任意位置检索优先试 `ignoreLocation: true`，结果过宽再收紧 `threshold`
- `useTokenSearch: true` 把多词查询逐词模糊匹配，并按语料中的稀有程度加权
- `tokenMatch: 'any'` 是 OR；`'all'` 要求每个查询词在记录任意字段中都命中
- 默认 tokenizer 支持 Unicode 字母 / 数字；中文分词可通过确定性的 `tokenize` 函数接入 `Intl.Segmenter`
- token search 仅完整构建可用，不能与当前 `FuseWorker` 或 `Fuse.match()` 共用
- `useExtendedSearch` 开启 `= / ' / ! / ^ / $` 操作符；空格是 AND，`|` 分隔 OR 组
- 逻辑查询用 `$and / $or`；键名含点号时用 `$path` 数组与 `$val`
- 集合变化用 `add / remove / removeAt / setCollection`，不要直接改原数组绕过索引

## 一、ignoreLocation：让匹配可在任意位置

默认带位置约束（`location`/`distance`），长文本里靠后的词常匹配不到。最直接的修复是设 `ignoreLocation: true`（默认 false）：忽略位置，匹配可出现在文本任何地方。

```js
const text = ["Fuse.js is a lightweight fuzzy-search library, with zero dependencies"]

new Fuse(text).search("zero") // 默认：可能搜不到（"zero" 在第 62 字符）
new Fuse(text, { ignoreLocation: true }).search("zero") // ✅ 命中
```

> 经验：做**整词/子串**匹配、不在意位置时，开 `ignoreLocation` 往往比反复调 `location`/`distance` 省心。

## 二、最该先动的两个调参旋钮

绝大多数「搜得太宽 / 太窄 / 位置不对」都靠这两组解决：

| 症状 | 调整 |
|---|---|
| 结果太多、太杂 | 调小 `threshold`（如 0.3） |
| 该匹配的没匹配上 | 调大 `threshold`，或开 `ignoreLocation` |
| 长文本里靠后的词搜不到 | `ignoreLocation: true`（或加大 `distance`） |
| 高亮里混入一两字符噪声 | 调大 `minMatchCharLength`（默认 1） |

## 三、token search：真正按多词检索

默认 Fuse 把整段查询当一个模糊 pattern。7.4.2 的 token search 会把查询与字段拆成词元，对每个词做模糊匹配，并以语料级 IDF 提高稀有词权重：

```js
const fuse = new Fuse(docs, {
  keys: ["title", "body"],
  useTokenSearch: true,
  tokenMatch: "all", // 每个查询词都要在该记录的任意字段中命中
})

fuse.search("javascript worker")
```

| `tokenMatch` | 语义 | 适合 |
|---|---|---|
| `"any"`（默认） | 任一词命中即可，OR | 召回、联想 |
| `"all"` | 每个词都要命中，跨字段也算，AND | 筛选、逐词收窄 |

默认 tokenizer 使用 Unicode 感知的字母 / 标记 / 数字规则。对没有空格词界的语言，可传确定性的分词函数；建索引和查询时会使用同一函数：

```js
const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" })
const tokenize = text => [...segmenter.segment(text)]
  .filter(part => part.isWordLike)
  .map(part => part.segment)

const fuse = new Fuse(docs, { keys: ["title"], useTokenSearch: true, tokenize })
```

> token search 依赖整份语料的词频统计，只在完整构建中提供；当前 `FuseWorker`、basic 构建与一次性 `Fuse.match()` 都不支持它。

## 四、扩展搜索语法（unix 风格操作符）

先开 `useExtendedSearch: true`（默认 false），查询串即可使用操作符做精细控制：

| 写法 | 含义 |
|---|---|
| `jscript` | 模糊匹配（无操作符） |
| `=scheme` | 精确相等（整项 === 该词） |
| `'python` | 包含匹配（精确含该子串） |
| `!ruby` | 反向：不包含该词（排除） |
| `^java` | 前缀：以该词开头 |
| `!^erlang` | 反前缀：不以该词开头 |
| `.js$` | 后缀：以该词结尾 |
| `!.go$` | 反后缀：不以该词结尾 |

**组合规则**：空格 = **AND**（都要满足），竖线 `|` = **OR**（任一组满足）。

```js
const fuse = new Fuse(list, { useExtendedSearch: true, keys: ["title"] })

// (含 "Man" 且 含 "Old") 或 (以 "Artist" 结尾)
fuse.search("'Man 'Old | Artist$")
```

## 五、逻辑搜索（$and / $or）

除字符串外，`search` 还能收一个**逻辑查询对象**，用 `$and` / `$or` 组合多字段条件：

```js
// 同时满足：author 模糊匹配 abc 且 title 模糊匹配 xyz
fuse.search({
  $and: [{ author: "abc" }, { title: "xyz" }],
})

// 任一满足
fuse.search({
  $or: [{ author: "abc" }, { author: "def" }],
})
```

键名含**字面点号**时，用 `$path`（路径数组）+ `$val`（匹配值）精确指定字段：

```js
fuse.search({
  $and: [
    { $path: ["author", "first.name"], $val: "jon" },
    { $path: ["author", "last.name"], $val: "scazi" },
  ],
})
```

> 开 `useExtendedSearch` 后，逻辑表达式里的字符串值同样按扩展语法解析，可在逻辑查询里嵌入 `'`/`!`/`^`/`$`。

## 六、动态数据：增删条目

数据运行时会变？用**实例方法**更新集合（会同步维护内部索引，无需 new 新实例）：

```js
fuse.add(newDoc) // 新增一条
fuse.remove(doc => doc.id === "x") // 按谓词删（返回被删的项）
fuse.removeAt(2) // 按下标删
fuse.setCollection(newList) // 整体替换集合
```

> 改某一条：先 `removeAt` 再 `add`（没有 `update`）。**切勿**对实例外的数据直接 `push` / `splice` 后期待索引自动同步；token search 的倒排统计也由这些实例方法一并维护。

## 七、其它常用选项与默认值

| 选项 | 默认 | 作用 |
|---|---|---|
| `isCaseSensitive` | `false` | 是否区分大小写（默认不区分） |
| `ignoreDiacritics` | `false` | 是否忽略变音符号（`café` 视同 `cafe`） |
| `shouldSort` | `true` | 是否按 score 排序结果 |
| `findAllMatches` | `false` | 完美匹配后是否继续扫完、收集全部片段 |
| `minMatchCharLength` | `1` | 只纳入长度超过该值的匹配片段 |

```js
const fuse = new Fuse(books, {
  keys: ["title"],
  ignoreLocation: true,
  ignoreDiacritics: true, // 多语言文本更友好
  minMatchCharLength: 2, // 过滤单字符噪声
})
```

---

进入 [指南 · 专家](./expert)：Bitap 算法与 score 公式、字段长度归一、预建索引（createIndex/parseIndex）、Web Worker、basic 构建、与后端/语义搜索取舍。
