---
layout: doc
---

# Fuse.js

::: tip 本篇范围
本篇聚焦 **Fuse.js —— 零依赖、纯前端可用的轻量「模糊搜索」库**。它与「精确匹配（`includes` / 正则）」「后端搜索引擎（Elasticsearch 等）」「语义搜索（向量嵌入）」同属「应用内搜索」选型方向，本篇在取舍与对比时一笔带过另几者。版本基线 **Fuse.js 7.4.2**（TypeScript 编写、零运行时依赖、ESM/CJS 双产物）。
:::

Fuse.js 让你把一份数据数组「喂」给 `new Fuse(list, options)`，随后用 `fuse.search(pattern)` 做**容错的模糊匹配**：即使查询词有拼写错误（把 `John` 打成 `jon`），也能按相关度返回结果。核心是 **Bitap 算法**——把查询编码成位掩码、用位运算并行扫描所有字符位置，并维护多个「错误级别」（R0、R1…）来容忍插入/删除/替换。整个过程**完全在内存中完成**，不需要后端、不需要搜索服务器、不需要外部索引服务。

它**不引入任何新数据结构**：进出都是普通数组/对象；结果以 `{ item, refIndex, score, matches }` 回指源数据。最常用的配置是 `keys`（支持点号路径、数组路径与字段加权）。匹配宽严由 `threshold`（默认 0.6，**越小越严格**）控制；相关度 `score` 则是 **`0` 最匹配、`1` 最不匹配，越小越相关**。7.4.2 还加入按词拆分、使用语料统计加权的 token search，以及浏览器端异步 `FuseWorker`；本地发布包测得完整 / basic 压缩构建约 9.1 / 7.2 KB（gzip）。

## 评价

**优点**

- **零依赖 + 纯前端**：一个文件即可用，无需后端/搜索服务，离线可用、即时零延迟
- **开箱即用的容错**：基于编辑距离的模糊匹配，能容忍拼写错误与近似输入
- **不改数据形态**：用普通数组/对象，结果用 `item` / `refIndex` 回指源数据，无需转换
- **字段级表达力**：`keys` 支持点号路径、数组路径、`{ name, weight }` 加权，覆盖嵌套与多字段
- **高亮友好**：`includeMatches` 返回命中区间（`indices` / `value` / `key`），便于做搜索高亮
- **可调可控**：`threshold` / `location` / `distance` / `ignoreLocation` / `minMatchCharLength` 精细控制宽严与位置
- **进阶能力齐全**：扩展 / 逻辑 / token search、预建索引，以及官方浏览器 `FuseWorker`

**缺点**

- **只懂「字形」不懂「语义」**：词法级模糊匹配，搜 `car` 不会因近义召回 `automobile`（那是语义搜索的活）
- **位置默认有约束**：默认 `location=0` / `distance=100`，长文本里靠后的词易匹配不上，需 `ignoreLocation` 或调 `distance`
- **数据需全量入内存**：适合中小数据集；上千万文档、复杂聚合、分布式检索应交给后端引擎
- **核心搜索同步占 CPU**：大数据集每次按键全量搜会卡 UI，需 debounce、复用索引或改用异步 `FuseWorker`
- **score 方向反直觉**：`0` 才是最匹配，新手极易理解反
- **过松会噪声多**：`threshold` 偏大或不加位置约束时，弱相关结果会混进来，需调参

## 文档地址

[Fuse.js 官方文档](https://www.fusejs.io/)

## GitHub 地址

[krisk/Fuse](https://github.com/krisk/Fuse)

## 幻灯片地址

<a href="/SlideStack/fuse-js-slide/" target="_blank">Fuse.js</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=fuse-js" target="_blank" rel="noopener noreferrer">Fuse.js 测试题</a>
