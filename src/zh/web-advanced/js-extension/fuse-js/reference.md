---
layout: doc
outline: [2, 3]
---

# 参考

> Fuse.js **构造方式、全部选项与默认值、实例方法、静态 API、结果结构、扩展/逻辑搜索语法** 速查。版本基线 **Fuse.js 7.4.2**，默认值取自发布包源码 `Config`。

## 速查

- 构造：`new Fuse(list, options, index?)`；查询：`fuse.search(query, { limit })`
- 对象数组用 `keys` 指定字段；权重必须为正数，内部会归一化，数值只表达相对重要性
- `score` 越小越相关；默认不返回，需开 `includeScore`，高亮区间需开 `includeMatches`
- 先调 `threshold`，长文本再看 `ignoreLocation`；默认位置窗口会惩罚远离开头的命中
- 多词检索可开 `useTokenSearch`；`tokenMatch: 'any'` 是 OR，`'all'` 是跨字段 AND
- 扩展搜索需 `useExtendedSearch`；逻辑查询直接传 `$and` / `$or` 表达式对象
- 预建索引用 `createIndex` / `parseIndex`；动态集合用 `add / remove / removeAt / setCollection`
- 浏览器大数据集可用 `FuseWorker` 异步搜索；它不支持 token search、函数选项或 Node worker_threads

## 一、构造与查询

| 写法 | 用途 |
|---|---|
| `new Fuse(list, options?)` | 创建实例（list 为字符串/对象数组） |
| `new Fuse(list, options, index)` | 传入预建索引（第三参） |
| `fuse.search(pattern)` | 查询，返回结果数组 |
| `fuse.search(pattern, { limit })` | 限制返回条数 |
| `fuse.search(expression)` | 逻辑搜索（传 `$and`/`$or` 对象） |

```js
import Fuse from "fuse.js"
const fuse = new Fuse(books, { keys: ["title", "author"] })
fuse.search("jon")
```

## 二、基础选项

| 选项 | 默认 | 说明 |
|---|---|---|
| `keys` | `[]` | 要搜索的字段（对象数组必填；字符串数组不需要） |
| `isCaseSensitive` | `false` | 是否区分大小写 |
| `ignoreDiacritics` | `false` | 是否忽略变音符号（`café`≈`cafe`） |
| `includeScore` | `false` | 结果是否含 `score` |
| `includeMatches` | `false` | 结果是否含 `matches`（高亮区间） |
| `minMatchCharLength` | `1` | 只纳入长度超过该值的匹配片段 |
| `shouldSort` | `true` | 是否按 score 排序 |
| `findAllMatches` | `false` | 完美匹配后是否继续扫完收集全部片段 |

## 三、模糊匹配选项

| 选项 | 默认 | 说明 |
|---|---|---|
| `threshold` | `0.6` | score 上限闸门，**越小越严格**（0=完美，1=匹配一切） |
| `location` | `0` | 期望匹配出现的大致位置 |
| `distance` | `100` | 匹配离 location 多远可接受；越大位置惩罚越轻 |
| `ignoreLocation` | `false` | true 则忽略 location/distance，任意位置可匹配 |

> 默认位置窗口 ≈ `threshold × distance`（`0.6×100=60` 字符）。长文本靠后匹配不上 → 开 `ignoreLocation`。

## 四、高级选项

| 选项 | 默认 | 说明 |
|---|---|---|
| `useExtendedSearch` | `false` | 启用 unix 风格扩展搜索语法 |
| `useTokenSearch` | `false` | 按词检索并使用语料级 IDF 加权（仅完整构建） |
| `tokenize` | Unicode 词元正则 | token search 的分词正则或函数 |
| `tokenMatch` | `"any"` | 多词按任一命中（OR）或 `"all"` 全部命中（AND） |
| `getFn` | 内置取值 | 自定义按路径从对象取值（可做转换） |
| `sortFn` | 内置 | 自定义结果排序（需 `shouldSort: true`） |
| `ignoreFieldNorm` | `false` | true 则 score 忽略字段长度归一 |
| `fieldNormWeight` | `1` | 字段长度归一的影响力（越大越强调短字段命中） |

## 五、keys 三种写法

```js
keys: [
  "title", // 顶层字段
  "author.firstName", // 嵌套：点号路径
  ["author", "first.name"], // 嵌套：数组路径（键名含字面点号时必用）
  ["tags", "value"], // 数组内对象字段
  { name: "title", weight: 0.7 }, // 加权（未指定 weight 默认 1）
]
```

## 六、实例方法

| 方法 | 用途 |
|---|---|
| `search(pattern, opts?)` | 查询；返回结果数组（无匹配为 `[]`） |
| `add(doc)` | 新增一条并更新索引 |
| `remove(predicate)` | 按谓词删除，返回被删项数组 |
| `removeAt(idx)` | 按下标删除，返回被删项 |
| `setCollection(docs, index?)` | 整体替换集合 |
| `getIndex()` | 取内部索引对象 |

## 七、静态 API

| 成员 | 用途 |
|---|---|
| `Fuse.createIndex(keys, list)` | 预建索引（传给 `new Fuse` 第三参） |
| `Fuse.parseIndex(json)` | 把序列化的索引还原为索引对象 |
| `index.toJSON()` | 序列化索引（配合 parseIndex） |
| `Fuse.match(pattern, text, options?)` | 单文本一次性匹配；不支持 token search |
| `Fuse.use(...plugins)` | 注册自定义搜索插件 |
| `Fuse.version` | 版本号 |

## 八、结果结构

```js
{
  item,        // 命中的原始数据项
  refIndex,    // 在原始 list 中的下标
  score,       // 0 完美 ~ 1 不匹配（需 includeScore）
  matches: [   // 需 includeMatches
    {
      indices, // 命中的 [start,end] 闭区间数组，如 [[4,9]]
      value,   // 被命中的原文
      key,     // 命中的字段名（多字段时）
    },
  ],
}
```

> ⚠️ `score`：**0 最匹配、1 最不匹配，越小越相关**。`indices` 是**闭区间**，切片取到 `end + 1`。

## 九、扩展搜索语法（需 useExtendedSearch）

| 写法 | 含义 |
|---|---|
| `jscript` | 模糊匹配 |
| `=scheme` | 精确相等 |
| `'python` | 包含匹配 |
| `!ruby` | 不包含（排除） |
| `^java` / `!^java` | 前缀 / 反前缀 |
| `.js$` / `!.js$` | 后缀 / 反后缀 |
| 空格 / `\|` | AND（都满足）/ OR（任一组满足） |

## 十、逻辑搜索

```js
fuse.search({ $and: [{ author: "abc" }, { title: "xyz" }] })
fuse.search({ $or: [{ author: "abc" }, { author: "def" }] })
// 键名含字面点号：
fuse.search({ $and: [{ $path: ["author", "first.name"], $val: "jon" }] })
```

## 十一、构建产物

| 导入 | 本地 gzip | 能力 |
|---|---:|---|
| `fuse.js` / `fuse.js/min` | 约 9.1 KB | 完整功能，含扩展 / 逻辑 / token search |
| `fuse.js/basic` / `fuse.js/min-basic` | 约 7.2 KB | 核心模糊搜索；扩展、逻辑、token search 不可用 |
| `fuse.js/worker` | 约 2.4 KB | `FuseWorker` 主线程控制器；另加载 worker script |

## 十二、FuseWorker（浏览器 Beta）

```js
import { FuseWorker } from "fuse.js/worker"

const worker = new FuseWorker(books, { keys: ["title", "author"] })
const hits = await worker.search("jon", { limit: 10 })
await worker.add(newBook)
await worker.setCollection(nextBooks)
worker.terminate()
```

- 仅使用浏览器 Web Worker，不支持 Node `worker_threads`；`search / add / setCollection` 都是异步 API。
- 函数无法经 `postMessage` 传输，因此不支持函数形式的 `sortFn`、`getFn`、`tokenize`。
- token search 依赖全语料统计，当前不能与分片 Worker 共用；实例也没有 `remove / removeAt / getIndex`。
- 自动 URL 解析失败时，通过 `workerOptions.workerUrl` 传入打包器从 `fuse.js/worker-script` 解析出的脚本 URL；结束时必须 `terminate()`。

---

API 查完，回 [指南 · 基础](./guide-line/base) 看 keys 与调参，或 [指南 · 专家](./guide-line/expert) 看 token search、算法与工程化。
