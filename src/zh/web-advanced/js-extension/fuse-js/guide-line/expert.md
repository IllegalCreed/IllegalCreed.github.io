---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **Fuse.js 7.4.2**。深入原理与工程化：Bitap 与 token score、字段长度归一、预建索引、`FuseWorker`、basic 构建、type-ahead 性能，以及与后端 / 语义搜索的取舍。

## 速查

- 默认模糊搜索基于 Bitap，score 综合字符误差、位置、字段权重与字段长度归一
- token search 仍对每个词做 Bitap，但用语料级 IDF 加权；`tokenMatch: 'all'` 还做记录级覆盖校验
- `ignoreFieldNorm` 只移除字段长度归一；`fieldNormWeight` 与 keys 的字段 `weight` 不是一回事
- `createIndex()` 可把普通索引提前到构建期，运行时用 `parseIndex()` 恢复；keys / getFn 必须一致
- `FuseWorker` 是浏览器 Beta API，会按硬件并行分片并返回 Promise；用完必须 `terminate()`
- Worker 不支持 token search、函数选项、remove / getIndex，也不等同于 Node `worker_threads`
- basic 构建约 7.2 KB gzip，只保留核心模糊搜索；扩展、逻辑与 token search 会明确报不可用
- 输入即搜要复用实例、debounce、限制结果；数据量或权限需求越界时改用后端搜索引擎

## 一、Bitap 算法：模糊匹配怎么实现

Fuse.js 的核心是 **Bitap 算法**（位运算近似匹配），不是逐格动态规划：

1. **编码**：把查询 pattern 编码成位掩码（每个字符一个掩码）。
2. **并行扫描**：用位运算同时检查文本里所有字符位置。
3. **多错误级别**：维护 R0、R1、R2… 多个状态向量。R0 命中错字符时不「死掉」，而是带「一个错误」转入 R1，从而容忍替换/删除/插入。

错误级别越多，能容忍的编辑距离越大，但匹配越宽松——这正是 `threshold` 在背后调节的东西。

## 二、score 由什么构成

最终 score（0 完美 ~ 1 不匹配）不只看编辑距离，还综合：

- **编辑距离**：查询与文本差多少个单字符操作，是基础。
- **位置偏移**：匹配离 `location` 越远、`distance` 越小，惩罚越重（`ignoreLocation` 可移除该因素）。注意 `distance` **越大、位置惩罚越轻**（更宽容偏离）。
- **字段权重**：`keys` 里 `weight` 越大的字段命中，贡献越大。
- **字段长度归一（fieldNorm）**：见下节。

token search 的分数路径不同：每个查询词仍用 Bitap 与字段文本近似匹配，再按 `log(1 + (fieldCount - docFreq + 0.5) / (docFreq + 0.5))` 形式的 **BM25 风格 IDF** 加权。语料里越少见的词权重越高；因此增删数据时倒排统计也必须同步维护。

## 三、字段长度归一：fieldNormWeight / ignoreFieldNorm

同样命中，**较短字段里的命中更突出**（更可能是用户想要的）。这由「字段长度归一」实现：

- `ignoreFieldNorm`（默认 **false**，即**默认启用**归一）：设 true 则 score 不考虑字段长度。
- `fieldNormWeight`（默认 **1**）：调大放大字段长度对分数的影响，调小则削弱。

```js
new Fuse(list, { keys: ["title"], ignoreFieldNorm: true }) // 不因字段长短改变分数
new Fuse(list, { keys: ["title"], fieldNormWeight: 2 }) // 更强调短字段命中
```

> 别把 `fieldNormWeight` 与 `keys` 的 `weight` 混淆：前者调「字段长度归一的影响力」，后者调「某字段相对其它字段的重要性」。

## 四、预建索引：createIndex / parseIndex

大数据集每次 `new Fuse` 都重建索引很浪费。可预建索引并复用：

```js
import Fuse from "fuse.js"

const keys = ["title", "author"]
const index = Fuse.createIndex(keys, list) // 预建一次
const fuse = new Fuse(list, { keys }, index) // 作为第三个参数传入
```

想把建索引开销移到**构建期**：序列化保存，运行时还原：

```js
// 构建期：导出
const serialized = JSON.stringify(Fuse.createIndex(keys, list).toJSON())

// 运行时：还原（用 parseIndex，不是裸 JSON.parse）
const parsed = Fuse.parseIndex(JSON.parse(serialized))
const fuse = new Fuse(list, { keys }, parsed)
```

> 约束：预建索引用的 `keys`/`getFn` 必须与构造 Fuse 时一致。预建后仍可 `add`/`remove` 增量更新（实例方法会维护索引一致性）。

## 五、Web Worker：别卡主线程

普通 `search` 是**同步 CPU 计算**。7.4.2 提供浏览器端 Beta `FuseWorker`，内部按 `navigator.hardwareConcurrency` 分片（最多 8 个 Worker），主线程拿 Promise：

```js
import { FuseWorker } from "fuse.js/worker"

const worker = new FuseWorker(list, { keys: ["title", "body"] }, {
  numWorkers: 4,
})

const hits = await worker.search("fuzzy search", { limit: 20 })
await worker.add(nextDoc)
worker.terminate()
```

它只支持浏览器 Web Worker，不支持 Node `worker_threads`。函数形式的 `sortFn / getFn / tokenize` 无法跨线程传输；token search 因分片后语料统计会失真也被禁用。当前只提供 `search / add / setCollection / terminate`，没有 `remove / getIndex`，结束时务必释放 Worker。

> 仅靠 `async/await` **不能**把同步计算移出主线程——它仍占用主线程。

## 六、type-ahead（输入即搜）性能清单

| 做法 | 说明 |
|---|---|
| **debounce / throttle 输入** | 避免每次按键都全量搜 |
| **复用同一实例 + 预建索引** | 别每次按键 `new Fuse`（最常见反模式） |
| **`{ limit: n }` 限条数** | 减少后续渲染开销 |
| **大数据集改用 FuseWorker** | 把搜索移出主线程；衡量分片与消息传输开销 |
| **数据变用 add/remove** | 增量更新而非整体重建 |

## 七、basic 构建：再减体积

只需要核心模糊搜索时，可从公开子路径引入 basic 构建：

```js
import Fuse from "fuse.js/basic" // 或 fuse.js/min-basic
```

| 构建 | 本地 gzip | 能力 |
|---|---:|---|
| `fuse.js/min` | 约 9.1 KB | 完整功能 |
| `fuse.js/min-basic` | 约 7.2 KB | 核心模糊搜索 |

basic 遇到扩展搜索、逻辑表达式或 token search 会抛出明确的 “not available” 错误；不要只改导入路径却保留这些配置。

## 八、与后端 / 语义搜索取舍

- **Fuse.js 的甜区**：数据集**中小、可一次性入前端内存**（菜单、文档、标签等几百~几万条），要**即时、零延迟、零后端**的容错搜索。
- **何时上后端引擎（Elasticsearch 等）**：上千万文档、复杂聚合、分布式检索、高频海量写入、权限过滤。
- **Fuse vs 语义搜索**：Fuse 是**词法级**模糊匹配（容忍拼写错误，但不懂近义——搜 `car` 不召回 `automobile`）；语义搜索基于**向量嵌入**按含义召回，但需嵌入模型与向量库。二者解决不同问题，常**互补**（如先语义召回再用 Fuse 做关键词精排，或反之）。

---

回到 [入门](../getting-started) 复习用法，或查 [参考](../reference) 速览全部选项与 API。
