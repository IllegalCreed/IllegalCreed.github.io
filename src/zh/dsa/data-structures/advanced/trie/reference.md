---
layout: doc
outline: [2, 3]
---

# 参考：Trie API、操作与复杂度速查

> 基于通用数据结构概念 · 核于 2026-07

## 速查

- **定义**：多叉树，每条边代表一个字符；从根到节点的路径 = 一个字符串前缀。
- **节点结构**：`children`（子节点映射）+ `isEnd`（完整单词标志）；词频场景加 `count`，自动补全加 `weight`。
- **核心复杂度**：insert / search / startsWith 全部 **O(L)**（L = 单词长度，与词表规模 n 无关）。
- **insert**：逐字符向下，不存在就建节点，末尾置 `isEnd=true`。
- **search**：逐字符向下，走完**必查 `isEnd`**——漏查是把「前缀」误判为「单词」的最高频坑。
- **startsWith**：逐字符向下，走完即 `true`（**不查 `isEnd`**）。
- **delete**：递归向上，只有「`isEnd=false` 且 `children` 空」的节点才能摘。
- **`children` 选型**：小字符集（a-z）→ `Array[26]`（O(1) 下标、缓存友好）；任意/大字符集 → `Map`（通用）。
- **vs 哈希表**：Trie 有**前缀查询**（O(L)）和**字典序遍历**能力，哈希表没有；纯精确查找整词哈希表更快更省。
- **vs BST**：Trie O(L)，BST O(L log n)（每字符比较要 log n）。
- **应用**：自动补全 / 词频统计 / 拼写检查 / IP 路由 LPM / AC 自动机 / 压缩 Trie（Radix Tree）。
- **升级路径**：空间爆炸 → 压缩 Trie（Radix Tree / Patricia）；多模式匹配 → AC 自动机（Trie + fail）。
- **交互演示**：[前缀树可视化](https://algo.illegalscreed.cn/docs/trie)。

## 一、核心复杂度表（与哈希表 / BST 对比）

| 操作 | Trie | 哈希表 | 二叉搜索树（BST） |
| --- | --- | --- | --- |
| 插入单词 | **O(L)** | O(L) | O(L log n) |
| 精确查找单词 | **O(L)** | **O(L)** | O(L log n) |
| 前缀查询 startsWith | **O(L)** ✅ | O(n·L) ❌ | O(n·L) ❌ |
| 列出某前缀所有单词 | **O(L+M)** ✅ | 不支持 ❌ | 不支持 ❌ |
| 字典序遍历 | **O(总字符数)**（天然有序）✅ | O(n·L·log n)（要排序）❌ | O(n·L)（中序） |
| 最长前缀匹配（LPM） | **O(L)** ✅ | 不支持 ❌ | 不支持 ❌ |
| 空间 | O(总字符数)，公共前缀省 | O(n·L) | O(n·L) |

L = 单词长度，n = 词表规模，M = 子树中单词数。

## 二、insert / search / startsWith 代码模板（Map 版）

```js
class TrieNode {
  constructor() { this.children = new Map(); this.isEnd = false; }
}

class Trie {
  constructor() { this.root = new TrieNode(); }

  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch);
    }
    node.isEnd = true;
  }

  search(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) return false;
      node = node.children.get(ch);
    }
    return node.isEnd; // 必查 isEnd
  }

  startsWith(prefix) {
    let node = this.root;
    for (const ch of prefix) {
      if (!node.children.has(ch)) return false;
      node = node.children.get(ch);
    }
    return true; // 不查 isEnd
  }
}
```

## 三、Array[26] 版代码模板（纯小写字母表）

```js
class TrieNode {
  constructor() { this.children = new Array(26).fill(null); this.isEnd = false; }
}

class Trie {
  constructor() { this.root = new TrieNode(); }
  idx(ch) { return ch.charCodeAt(0) - 97; } // 'a' 的 ASCII 是 97

  insert(word) {
    let node = this.root;
    for (const ch of word) {
      const i = this.idx(ch);
      if (!node.children[i]) node.children[i] = new TrieNode();
      node = node.children[i];
    }
    node.isEnd = true;
  }

  search(word) {
    let node = this.root;
    for (const ch of word) {
      const i = this.idx(ch);
      if (!node.children[i]) return false;
      node = node.children[i];
    }
    return node.isEnd;
  }

  startsWith(prefix) {
    let node = this.root;
    for (const ch of prefix) {
      const i = this.idx(ch);
      if (!node.children[i]) return false;
      node = node.children[i];
    }
    return true;
  }
}
```

竞速题（如 LeetCode 208）首选 `Array[26]` 版，O(1) 下标、缓存连续友好。

## 四、节点结构变体清单

| 变体 | 多出的字段 | 用途 |
| --- | --- | --- |
| 基础版 | `isEnd` | 仅标记完整单词 |
| 词频版 | `isEnd` + `count` | 词频统计 |
| 自动补全版 | `isEnd` + `weight` + `topK[]` | 按热度实时补全 |
| AC 自动机版 | `isEnd` + `fail` + `output` | 多模式串匹配 |
| 压缩 Trie | 边存「多字符串」而非单字符 | 省节点（Radix Tree） |
| 位 Trie | `children[2]`（0/1） | IP 路由 LPM、整数异或 |

## 五、应用清单

| 应用 | 核心 | 说明 |
| --- | --- | --- |
| 搜索框自动补全 | startsWith + DFS + 排序 | 节点存 weight/topK 提速 |
| 词频统计 | 节点 count | 整词频率与前缀汇总都 O(L) |
| 拼写检查 | search + 剪枝 DFS 编辑距离 | 比两两比对快 |
| IP 路由最长前缀匹配 | 位 Trie，走到底记最后命中 | 网络路由核心 |
| AC 自动机 | Trie + fail 指针 | 多模式串一次扫描 |
| 压缩 Trie / Radix Tree | 单链压缩 | httprouter、Nginx 路由 |
| 字典序排序 | 按字符 DFS | 无需比较，O(总字符数) |

## 六、易错点清单

- **`search` 漏查 `isEnd`**：最高频坑。插入了 `apple`，`search("app")` 应返回 `false`，但漏查 `isEnd` 会误返回 `true`（把前缀当单词）。
- **`startsWith` 误加 `isEnd` 检查**：前缀本身不必是完整单词，加了会让 `startsWith("app")`（仅插入过 `apple`）误返回 `false`。
- **`delete` 直接摘节点**：会破坏共享前缀的其他单词。必须递归判断「`isEnd=false` 且 `children` 空」才摘。
- **`delete` 不判单词是否存在**：没插入过的单词也去删，可能误删共享前缀——先 `search` 确认。
- **`Array[26]` 忘 `- 'a'` 换下标**：直接用字符 ASCII 当下标会越界（如 `z` 是 122，远超 25）。
- **`Array[26]` 假设了纯小写**：遇到大写、数字、中文就越界——要么转小写，要么改用 `Map`。
- **把根节点当字符节点**：根不存字符，第一个字符查的是 `root.children`，不要在根上判字符。
- **重复插入重复建节点**：insert 时「不存在才建」，已存在应复用——否则前缀共享失效。
- **建树后不释放**：长生命周期服务里 Trie 可能很大，删除单词要物理清理无用节点（递归 delete）。
- **自动补全每次全扫子树**：子树大时慢，应在节点预存 top-K 或配合缓存。
- **LPM 走到断路就返回**：最长前缀匹配要「记住沿途最后一次 `isEnd` 命中」，不能路径一断就返回 null（可能前面有更短的有效前缀）。
- **混淆「节点数」与「字符数」**：空间复杂度是 O(节点数)，公共前缀多则节点数远小于总字符数。

## 七、进阶方向（链接其他叶）

- **字符串匹配**：AC 自动机、KMP——见字符串匹配叶
- **哈希表**：精确查找整词的更简单方案——见[哈希表](../../basic/hash-table/) 叶
- **二叉搜索树**：有序集合的另一种思路——见二叉搜索树叶
- **压缩 Trie / Radix Tree**：后端路由库的实现基础——见字符串/路由相关叶

## 权威链接

- [Trie - 维基百科](https://zh.wikipedia.org/wiki/Trie)
- [Trie (Prefix Tree) - GeeksforGeeks](https://www.geeksforgeeks.org/trie-insert-and-search/)
- [Implement Trie (Prefix Tree) - LeetCode 208](https://leetcode.com/problems/implement-trie-prefix-tree/)
- [Radix tree - Wikipedia](https://en.wikipedia.org/wiki/Radix_tree)
- [Aho-Corasick algorithm - Wikipedia](https://en.wikipedia.org/wiki/Aho%E2%80%93Corasick_algorithm)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/trie" target="_blank" rel="noopener noreferrer">前缀树可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/trie-slide/" target="_blank">前缀树（Trie）</a>
