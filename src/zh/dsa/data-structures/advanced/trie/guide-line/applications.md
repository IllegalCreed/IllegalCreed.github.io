---
layout: doc
outline: [2, 3]
---

# Trie 的工程应用：自动补全、词频与路由

> 基于通用算法套路 · 核于 2026-07

## 速查

- **搜索框自动补全**：用户敲 `app`，系统要秒出 `apple`/`apply`/`application`——`startsWith("app")` 定位到前缀子树，DFS 收集 `isEnd=true` 的单词（按词频/热度排序），这就是 Trie 的经典战场。
- **词频统计**：节点里多存一个 `count` 字段，`insert` 时每经过一个单词末尾就 `count++`；「某单词出现几次」查到末尾节点读 `count`，「某前缀下所有词的总次数」对该子树求和——都是 O(L) 或 O(L+M)。
- **拼写检查 / 词典**：把整本词典建成 Trie，待查词 `search` 看是否命中；做「编辑距离为 1 的建议」时沿 Trie 剪枝搜索（比朴素两两比对快得多）。
- **IP 路由最长前缀匹配（LPM）**：路由表把网段前缀（如 `192.168.0.0/16`）建进 Trie（按二进制位），数据包目的 IP 沿 Trie 走，**能走多深走多深**，最后命中的 `isEnd` 节点就是最长匹配的路由——这是 Trie 的「位 Trie」变种。
- **AC 自动机**：**多模式串匹配**的底座。在 Trie 上加 `fail` 指针（类似 KMP 的 next 数组），一次扫描文本就能同时匹配所有模式串——Trie 是它的骨架，深入内容见字符串算法叶。
- **压缩 Trie / Radix Tree（基数树）**：把「单链路径」（只有单分支的连续节点）压缩成一个「存多字符」的节点，大幅省空间。Linux 内核 radix tree、Go 的 `httprouter`、Nginx 路由都用它。
- **核心优势回顾**：**前缀查询是 Trie 独有优势**——哈希表只能精确查整词，BST 要中序扫，唯独 Trie 能 O(L) 定位到前缀子树。
- **何时用 Trie**：①要前缀查询/自动补全；②要字典序遍历；③要最长前缀匹配（IP 路由）；④模式串匹配（AC 自动机）。否则哈希表更简单。
- **何时别用**：字符集大且公共前缀少（如全 Unicode 用户 ID）——空间爆炸，用哈希表或压缩 Trie。
- **性能要点**：自动补全要「按热度排序」，常在节点存 `topK` 子列表或配合优先队列预计算，避免每次 DFS 全扫子树。

## 一、搜索框自动补全：Trie 的经典战场

用户在搜索框敲 `app`，系统要**实时**返回最可能的几个补全词（`apple`/`application`/`apply`）。用 Trie 实现：

1. **建索引**：把历史搜索词（或词典）建进 Trie，每个单词末尾节点存一个 `weight`（热度/词频）。
2. **定位前缀子树**：用户敲 `app` 时 `startsWith("app")` O(L) 走到 `app` 节点。
3. **收集候选**：从该节点 DFS，收集子树里所有 `isEnd=true` 的单词及其 `weight`。
4. **排序输出**：按 `weight` 降序取 top-K。

```js
// 节点扩展：存 weight（词频/热度）
class TrieNode {
  constructor() { this.children = new Map(); this.isEnd = false; this.weight = 0; }
}
// 自动补全：返回以 prefix 开头的 top-k 单词
autocomplete(prefix, k) {
  let node = this.root;
  for (const ch of prefix) {                    // 1. 定位前缀子树
    if (!node.children.has(ch)) return [];
    node = node.children.get(ch);
  }
  const res = [];
  const dfs = (cur, path) => {                   // 2. DFS 收集候选
    if (cur.isEnd) res.push({ word: path, w: cur.weight });
    for (const [ch, nxt] of cur.children) dfs(nxt, path + ch);
  };
  dfs(node, prefix);
  return res.sort((a, b) => b.w - a.w).slice(0, k); // 3. 按热度取 top-k
}
```

**工程优化**：子树大时每次 DFS 太慢，常在每个节点预存「当前子树的 top-K 列表」（写入时维护），查询时 O(L) 直接读——用空间换实时性。

## 二、词频统计：节点存 count

把一批文本里的单词统计词频，Trie 天然合适：

- **节点扩展**：多一个 `count` 字段，`insert` 时走到末尾节点 `count++`。
- **查单词频率**：`search` 到末尾节点读 `count`，O(L)。
- **查前缀总频率**：`startsWith` 定位到前缀节点，对该子树所有 `isEnd` 节点的 `count` 求和，O(L+M)。

```js
class TrieNode {
  constructor() { this.children = new Map(); this.isEnd = false; this.count = 0; }
}
insert(word) {
  let node = this.root;
  for (const ch of word) {
    if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
    node = node.children.get(ch);
  }
  node.isEnd = true;
  node.count++; // 每次插入该单词，词频 +1
}
// 查 word 出现次数
countWord(word) {
  let node = this.root;
  for (const ch of word) {
    if (!node.children.has(ch)) return 0;
    node = node.children.get(ch);
  }
  return node.isEnd ? node.count : 0;
}
```

相比哈希表「整词做键」，Trie 还能顺带回答「某前缀下所有词的统计」，这是哈希表做不到的。

## 三、IP 路由最长前缀匹配：位 Trie

路由器转发数据包时，要按「目的 IP」在路由表里找**最长匹配的网段**。如路由表有 `10.0.0.0/8`、`10.1.0.0/16`、`10.1.2.0/24`，目的 IP `10.1.2.3` 应命中最长的 `/24` 那条。

用 Trie 实现——把 IP 地址按**二进制位**（0/1）展开成 32 层的「位 Trie」：

- **建表**：每个网段前缀（前 N 位）从根开始按位插入，末尾节点置 `isEnd` 并存路由信息。
- **查表**：目的 IP 按位沿 Trie 走，**能走多深走多深**，**最后一次**遇到 `isEnd=true` 的节点就是最长匹配。

```js
// 简化：以 IPv4 的 32 位为例
lookup(ipBits /* 长度 32 的 0/1 数组 */) {
  let node = this.root;
  let matchedRoute = null;
  for (const bit of ipBits) {
    if (!node.children.has(bit)) break; // 路径断了
    node = node.children.get(bit);
    if (node.isEnd) matchedRoute = node.route; // 记住最后一次命中（即最长）
  }
  return matchedRoute; // 最长前缀匹配的路由
}
```

**为什么 Trie 适合 LPM**：所有前缀在 Trie 里是**前缀共享**的结构，沿一条路径走到底的过程中，「遇到的每个 `isEnd`」恰好按前缀长度递增排列，最后那个就是最长——天然支持 LPM。哈希表做不到（无法高效表达「前缀包含」关系）。

## 四、AC 自动机：多模式串匹配的底座

要在文本 `text` 里**一次性**找多个模式串（如敏感词库 10000 个词）是否出现。朴素做法是每个模式串跑一遍 KMP，O(模式数 × 文本长)。**AC 自动机**把它降到 O(文本长 + 匹配总数)：

1. **建 Trie**：把所有模式串插入 Trie。
2. **加 `fail` 指针**：类似 KMP 的 next 数组，指向「当前匹配失败时回退到的最长真后缀节点」，用 BFS 构建。
3. **扫描文本**：沿 Trie 走，失败就沿 `fail` 跳，途中遇到 `isEnd` 即命中一个模式串。

**Trie 是 AC 自动机的骨架**——`fail` 指针都建立在 Trie 节点之上。AC 自动机的深入内容（`fail` 构建、输出链）见字符串算法叶，这里只点明「Trie 是它的底座」。

## 五、压缩 Trie / Radix Tree：压缩单链路径

普通 Trie 的痛点是「**单链路径费节点**」——插入 `romane`、`romanus`、`romulus` 后，公共前缀 `rom` 之后还各有长串，产生很多「只有一个子节点」的中转节点。**压缩 Trie（Radix Tree / 基数树 / Patricia Trie）**把这种单链路径压缩成一个「存多字符」的节点：

```
普通 Trie:           压缩 Trie (Radix Tree):
  r                    r
  ├ o                  ├ om- (单链压缩)
  │ ├ m                │   ├ ane (romane)
  │   ├ a              │   ├ an-us (romanus)
  │   │ ├ n ...        │   └ ul-us (romulus)
  │   │   ├ e (romane)
  ...
```

- **优点**：节点数大幅减少，省内存、减少指针跳转次数，缓存更友好。
- **代价**：插入/删除要在「边」上做分裂与合并，实现更复杂。
- **工程应用**：Linux 内核的 `radix tree`（页缓存索引）、Go 的 `httprouter`（路由匹配）、Nginx 的 location 路由、Java 的 `ConcurrentSkipListMap` 邻居——后端路由库多用它做「静态路由表的高效前缀匹配」。

## 六、应用选型清单

| 场景 | 用 Trie 吗 | 变体 / 备注 |
| --- | --- | --- |
| 搜索框自动补全 | ✅ 经典 | 节点存 weight/top-K |
| 词频统计 | ✅ | 节点存 count |
| 拼写检查 | ✅ | 沿 Trie 剪枝搜索编辑距离 |
| IP 路由 LPM | ✅ | 位 Trie |
| 多模式串匹配 | ✅ | AC 自动机（Trie + fail） |
| 静态路由表匹配 | ✅ | 压缩 Trie / Radix Tree |
| 精确查整词（无前缀需求） | ❌ | 哈希表更快更简单 |
| 全 Unicode 用户 ID 去重 | ❌ | 字符集大、前缀分散，空间爆炸 |

一句话：**「只要问题里有『前缀』或『模式串集合』的味道，第一反应就该是 Trie」**。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/trie" target="_blank" rel="noopener noreferrer">前缀树可视化演示</a> —— Trie 在自动补全/前缀匹配场景的演示

## 下一步

应用讲完了，最后过一遍**API、复杂度速查、代码模板与易错点**——形成可直接查的手册，见[参考](../reference)。
