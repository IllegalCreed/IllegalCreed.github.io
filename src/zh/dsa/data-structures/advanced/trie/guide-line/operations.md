---
layout: doc
outline: [2, 3]
---

# Trie 的核心操作：插入、查找与前缀搜索

> 基于通用算法套路 · 核于 2026-07

## 速查

- **insert(word)**：从根开始，**逐字符**沿 `children` 向下走，不存在就建新节点；走完最后一个字符后，把当前节点的 `isEnd` 置 `true`——O(L)。
- **search(word)**：**完整单词**查找。逐字符向下走，任一步字符不存在就返回 `false`；走完后**必须**检查 `isEnd`——只有 `isEnd=true` 才算命中，否则只是别单词的前缀——O(L)。
- **startsWith(prefix)**：**前缀搜索**。逐字符向下走，任一步字符不存在就返回 `false`；走完即返回 `true`（**不检查 `isEnd`**，前缀本身不必是完整单词）——O(L)。
- **复杂度统一 O(L)**：L = 单词长度，**与词表规模 n 无关**——三个操作都是「沿字符路径走 L 步」，每步 O(1) 查 `children`。
- **delete(word)**：复杂。先确认单词存在，再**从叶子向根递归**删除：删末尾节点后，若父节点既不是别的单词结尾（`isEnd=false`）又没有其他子节点（`children` 空），才继续往上删——避免破坏共享前缀的其他单词。
- **`search` vs `startsWith` 的唯一差别**：走完路径后是否检查 `isEnd`。漏查 `isEnd` 是最高频坑（把「前缀」误判为「单词存在」）。
- **`children` 两种实现**：①对象/`Map` 版（`children[ch]`，通用）；②数组 `Array[26]` 版（`children[ch - 'a']`，纯小写字母表，O(1) 下标、缓存友好但只适合小字符集）。
- **建树成本**：n 个单词、平均长度 L，建树 O(n·L) 时间、O(n·L) 空间（公共前缀会省一些）。
- **易错**：①`search` 漏查 `isEnd`；②`delete` 直接摘节点（破坏共享前缀）；③`children` 用数组时忘记 `- 'a'` 换下标；④`startsWith` 误加 `isEnd` 检查。

## 一、insert：逐字符向下建节点，末尾置 isEnd

```js
// 通用版：children 用 Map，适配任意字符集
class Trie {
  constructor() {
    this.root = new TrieNode();
  }
  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch);
    }
    node.isEnd = true; // 走完最后一个字符，标记为完整单词
  }
}
class TrieNode {
  constructor() { this.children = new Map(); this.isEnd = false; }
}
```

要点：

- **从根开始**：根不存字符，第一个字符查的是 `root.children`。
- **不存在就建**：`children` 没这个字符就 `new` 一个子节点挂上。
- **末尾置 `isEnd`**：循环结束在「最后一个字符对应的节点」，把它的 `isEnd` 设为 `true`。重复插入同一单词也只置一次，幂等。

## 二、search：完整单词查找，必查 isEnd

```js
search(word) {
  let node = this.root;
  for (const ch of word) {
    if (!node.children.has(ch)) return false; // 路径断了，单词不存在
    node = node.children.get(ch);
  }
  return node.isEnd; // 关键：必须检查 isEnd
}
```

**为什么必须查 `isEnd`**：插入了 `apple`，Trie 里 `app` 节点存在，但 `search("app")` 应返回 `false`（没插入过 `app` 这个单词）。`app` 节点的 `isEnd` 是 `false`，靠它区分「前缀中转点」与「完整单词结尾」。漏查 `isEnd` 是最高频错误。

## 三、startsWith：前缀搜索，不查 isEnd

```js
startsWith(prefix) {
  let node = this.root;
  for (const ch of prefix) {
    if (!node.children.has(ch)) return false;
    node = node.children.get(ch);
  }
  return true; // 走到前缀节点即成功，不查 isEnd
}
```

`startsWith` 与 `search` 的代码几乎一样，**唯一差别是最后 `return node.isEnd`（search）vs `return true`（startsWith）**——前缀本身不必是完整单词。若要进一步「列出所有以该前缀开头的单词」，从该节点做一次 DFS，收集所有 `isEnd=true` 的路径即可。

## 四、delete：递归判断，别简单摘节点

delete 是 Trie 里最易写错的操作。直接把末尾节点的 `isEnd` 置 `false` 是「逻辑删除」（最安全）；若要「物理删除」释放节点，必须**从叶子向根递归**判断：

```js
// 返回「删除后当前节点是否应被父节点摘除」
_delete(node, word, depth) {
  if (depth === word.length) {
    // 走到目标单词末尾
    if (!node.isEnd) return false;       // 单词根本不存在，无需删
    node.isEnd = false;                  // 先取消单词标记
    return node.children.size === 0;     // 叶子（无其他子）才可摘
  }
  const ch = word[depth];
  if (!node.children.has(ch)) return false; // 没这条路，单词不存在
  const shouldDelete = this._delete(node.children.get(ch), word, depth + 1);
  if (shouldDelete) {
    node.children.delete(ch);            // 摘掉子节点
    return !node.isEnd && node.children.size === 0; // 自己也无用了才继续上传
  }
  return false;
}
delete(word) { this._delete(this.root, word, 0); }
```

**核心逻辑**：一个节点只有同时满足「自己不是别的单词结尾（`isEnd=false`）」**且**「没有其他子节点（`children` 空）」时，才能安全删除——否则会破坏共享前缀的其他单词。删 `apple` 时，`appl` 节点若还有 `apply` 这个子节点，就不能删。

## 五、复杂度：统一 O(L)

| 操作 | 时间 | 空间 | 说明 |
| --- | --- | --- | --- |
| `insert(word)` | O(L) | O(L) 最坏（全新建） | L = 单词长度 |
| `search(word)` | O(L) | O(1) | 只读不建 |
| `startsWith(prefix)` | O(L) | O(1) | 只读不建 |
| `delete(word)` | O(L) | O(1) | 递归深度 L |
| 列出某前缀所有单词 | O(L + M) | O(L) | M = 子树中单词数 |

**关键洞察**：Trie 的操作时间**与词表规模 n 无关**，只与单词长度 L 有关——这是它对比哈希表（查找也 O(L) 但无前缀能力）、BST（O(L log n)）的核心卖点。

## 六、两种 children 实现：Map 通用 vs Array[26] 定长

### Map 版（通用）

```js
class TrieNode {
  constructor() { this.children = new Map(); this.isEnd = false; }
}
// 插入：node.children.set(ch, new TrieNode())
// 查找：node.children.has(ch) / node.children.get(ch)
```

适配任意字符集（Unicode、中文、混合大小写），内存随用随分配。缺点是 `Map` 哈希常数大、缓存不友好，短单词场景比数组版慢。

### Array[26] 版（纯小写字母表）

```js
class TrieNode {
  constructor() {
    this.children = new Array(26).fill(null);
    this.isEnd = false;
  }
}
// 下标转换：idx = ch.charCodeAt(0) - 97  // 'a' 的 ASCII 是 97
// 插入：node.children[idx] = new TrieNode()
// 查找：node.children[idx] !== null
```

`children[idx]` 是 O(1) 直接下标访问、缓存连续友好，竞速题（如 LeetCode 208）首选。但**只适合小字符集**，且 26 个槽里大量是空的，稀疏时比 `Map` 更费空间。大字符集（如全 ASCII 256、Unicode）用数组会爆内存。

选型口诀：**「字符集小且固定（如 a-z）→ Array[26]；字符集大或可变 → Map」**。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/trie" target="_blank" rel="noopener noreferrer">前缀树可视化演示</a> —— Trie 的 insert / search / startsWith 逐字符过程

## 下一步

掌握了 Trie 的三大核心操作后，下一步看它在工程里怎么用——**自动补全、词频统计、IP 路由最长前缀匹配、压缩 Trie**，见[工程应用](./applications)。
