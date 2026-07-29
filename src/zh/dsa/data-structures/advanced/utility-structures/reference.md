---
layout: doc
outline: [2, 3]
---

# 参考：LRU / 跳表 / 布隆过滤器 API 与复杂度速查

> 基于通用数据结构概念 · 核于 2026-07

## 速查

- **LRU 缓存**：哈希表（key→Node）+ 双向链表（虚拟头尾）；`get`/`put` **O(1)**；容量满删尾，访问即移到头。
- **跳表**：多层概率索引链表（p=1/2）；查找/插入/删除**期望 O(log n)**，最坏 O(n)；范围查询 O(log n + m)；空间约 1.33 倍指针。
- **布隆过滤器**：m 位位数组 + k 哈希；插入/查询 **O(k)**；可能误判不漏判；不支持删除（用 Counting BF）。
- **LRU 关键**：必须双向链表（O(1) 删已知节点需前驱）+ 虚拟头尾（边界全无 `if`）。
- **跳表关键**：概率晋升决定层高，期望 O(log n)；redis zset = 跳表 + 哈希表。
- **布隆参数**：`m = -n·ln p / (ln2)²`，`k = (m/n)·ln2`；典型 1% 误判率 ≈ 每元素 9.6 bit + 7 哈希。
- **三者共同**：用一个结构补另一个短板——LRU 拼 哈希+链表；跳表 拼 多层索引+概率；布隆 拼 多哈希+位数组+接受误判。
- **交互演示**：[LRU](https://algo.illegalscreed.cn/docs/lru) · [跳表](https://algo.illegalscreed.cn/docs/skip-list) · [布隆](https://algo.illegalscreed.cn/docs/bloom-filter)。

## 一、三种结构复杂度表

| 操作 | LRU 缓存 | 跳表 | 布隆过滤器 |
| --- | --- | --- | --- |
| 查找 `get`/查询 | **O(1)** | O(log n) 期望 | **O(k)** |
| 插入 `put` | **O(1)** | O(log n) 期望 | **O(k)** |
| 删除 | O(1)（已知节点） | O(log n) 期望 | ❌ 不支持（Counting BF 支持） |
| 范围查询 | ❌ | **O(log n + m)** ✅ | ❌ |
| 最坏情况 | O(1) | O(n)（概率退化） | O(k) |
| 空间 | O(capacity)（哈希 + 链表 ~2-3 倍） | O(n)（~1.33 倍指针） | **O(m)** bit（极省） |
| 确定性 | 确定 | 概率（期望） | 概率（误判） |

**一句话**：LRU 求 O(1) 缓存淘汰；跳表求 O(log n) 有序操作 + 范围查询；布隆求空间最省的概率判重。

## 二、LRU 代码模板（哈希 + 双向链表）

```js
class LRUCache {
  constructor(capacity) {
    this.cap = capacity; this.map = new Map();
    this.head = {}; this.tail = {};        // 虚拟头尾
    this.head.next = this.tail; this.tail.prev = this.head;
  }
  get(key) {
    if (!this.map.has(key)) return -1;
    const n = this.map.get(key);
    this._remove(n); this._addToHead(n);   // 命中即移到头
    return n.val;
  }
  put(key, val) {
    if (this.map.has(key)) {               // 已存在：更新 + 移头
      const n = this.map.get(key); n.val = val;
      this._remove(n); this._addToHead(n); return;
    }
    const n = { key, val };
    this.map.set(key, n); this._addToHead(n);
    if (this.map.size > this.cap) {        // 超容删尾
      const lru = this.tail.prev; this._remove(lru);
      this.map.delete(lru.key);
    }
  }
  _remove(n) { n.prev.next = n.next; n.next.prev = n.prev; }
  _addToHead(n) {
    n.prev = this.head; n.next = this.head.next;
    this.head.next.prev = n; this.head.next = n;
  }
}
```

**要点**：`_remove`/`_addToHead` 全无 `if` 判空——虚拟头尾节点的威力；`get`/`put` 均 O(1)。

## 三、跳表代码骨架

```js
const MAXL = 16, P = 0.5;
class SkipNode { constructor(k, v, lv) {
  this.k = k; this.v = v; this.next = new Array(lv).fill(null); } }
class SkipList {
  constructor() { this.head = new SkipNode(-Infinity, null, MAXL); this.level = 1; }
  randLevel() { let lv = 1;
    while (Math.random() < P && lv < MAXL) lv++; return lv; }   // 概率晋升
  find(k) { let cur = this.head;
    for (let i = this.level - 1; i >= 0; i--) {                  // 高层下探
      while (cur.next[i] && cur.next[i].k < k) cur = cur.next[i]; }
    cur = cur.next[0];
    return cur && cur.k === k ? cur.v : null; }
  insert(k, v) {
    const update = new Array(MAXL); let cur = this.head;
    for (let i = this.level - 1; i >= 0; i--) {
      while (cur.next[i] && cur.next[i].k < k) cur = cur.next[i];
      update[i] = cur; }                                         // 记每层前驱
    const lv = this.randLevel();
    if (lv > this.level) { for (let i = this.level; i < lv; i++) update[i] = this.head; this.level = lv; }
    const node = new SkipNode(k, v, lv);
    for (let i = 0; i < lv; i++) { node.next[i] = update[i].next[i]; update[i].next[i] = node; } }
}
```

**要点**：`randLevel` 概率晋升；`find` 从最高层向右走、走不动下一层；`insert` 记每层前驱 `update[i]` 后逐层插链表节点。

## 四、布隆过滤器参数选择速查

| 目标误判率 p | 每元素位数 m/n（bit） | 最优哈希数 k |
| --- | --- | --- |
| 10% | 4.8 | 3.3 |
| 1% | **9.6** | **6.6** |
| 0.1% | 14.4 | 10.0 |
| 0.01% | 19.2 | 13.3 |

公式：`m = -n·ln p / (ln2)²`、`k = (m/n)·ln2`。

**估算口诀**：1% 误判率约「每元素 10 bit + 7 哈希」——1 亿元素只需约 114 MB（哈希表要 ~5 GB）。

```js
// 布隆过滤器骨架
class BloomFilter {
  constructor(n, p) {
    this.m = Math.ceil(-n * Math.log(p) / (Math.log(2) ** 2)); // 位数组大小
    this.k = Math.round((this.m / n) * Math.log(2));            // 哈希数
    this.bits = new Uint8Array(Math.ceil(this.m / 8));
  }
  _hashes(x) { /* 用双重哈希生成 k 个位置：h_i = h1 + i*h2 */
    const h1 = hash1(x), h2 = hash2(x);
    return Array.from({ length: this.k }, (_, i) => (h1 + i * h2) % this.m); }
  add(x) { for (const idx of this._hashes(x)) this.bits[idx >> 3] |= 1 << (idx & 7); }
  has(x) { for (const idx of this._hashes(x))
    if (!(this.bits[idx >> 3] & (1 << (idx & 7)))) return false;   // 有 0 一定不在
    return true; }                                                  // 全 1 可能在
}
```

## 五、易错点清单

- **LRU 用单链表**：删已知节点拿不到前驱，O(n)——必须双向链表。
- **LRU 没加虚拟头尾**：边界（空表/单节点/删头删尾）全是 `if`，易漏——加哨兵。
- **LRU 忘删哈希表项**：删尾节点只删链表不删 `map` 的 key——后续 `get` 还能命中野指针。
- **LRU 顺序扫描退化**：一次性遍历大数据集会逐个淘汰热数据——用 LRU-K / W-TinyLFU 改良。
- **跳表用确定层高**：固定层高或手动平衡就失去跳表意义——必须概率晋升。
- **跳表查找忘从高层起**：从底层起退化为 O(n) 链表查找——从 `level-1` 向下探。
- **跳表插入忘记 `update` 前驱**：摘节点要逐层改 `next`，没记前驱就找不到插入点。
- **跳表当确定 O(log n)**：是**期望** O(log n)，最坏 O(n)（概率退化），不能用于强延迟保证场景。
- **布隆判「在」就当真在**：「可能在」会误判——关键场景要二次确认（查库）。
- **标准布隆删元素**：多位共享，删一个误伤别的——要删除用 Counting BF。
- **布隆 m 太小**：填充率高了误判率飙升——按公式 `m = -n·lnp/(ln2)²` 预估。
- **布隆 k 随便选**：k 太少散列不均、太多位全被填满——用最优 `k=(m/n)·ln2`。
- **哈希函数不够独立**：k 个哈希高度相关会聚簇同几位——用双重哈希 `h_i=h1+i·h2` 生成。

## 六、进阶方向（链接其他叶）

- **LRU 的底层链表**：双向链表是 LRU 的核心组件——见[链表](../../basic/linked-list/) 叶。
- **跳表的底层链表**：多层有序链表——见[链表](../../basic/linked-list/) 叶；跳表是平衡树的替代，对比见[二叉搜索树/平衡树](../binary-tree/) 叶。
- **布隆的底层哈希**：多哈希函数 + 位数组——见[哈希表](../../basic/hash-table/) 叶。
- **缓存淘汰进阶**：LFU、W-TinyLFU（Caffeine）、ARC——LRU 的工程改良版。
- **Count-Min Sketch**：类似布隆的「概率计数」结构，用于频次估计（W-TinyLFU 用它）。

## 权威链接

- [LRU Cache - LeetCode 146](https://leetcode.cn/problems/lru-cache/)
- [Skip List - William Pugh 论文](https://15721.courses.cs.cmu.edu/spring2018/papers/08-oltpindexes1/pugh1990.pdf)
- [Redis zset 为什么用跳表 - antirez](https://news.ycombinator.com/item?id=11614258)
- [Bloom Filter - 维基百科](https://zh.wikipedia.org/wiki/%E5%B8%83%E9%9A%86%E8%BF%87%E6%BB%A4%E5%99%A8)
- [Bloom Filters - Jeffrey Dean](https://en.wikipedia.org/wiki/Bloom_filter)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/lru" target="_blank" rel="noopener noreferrer">LRU</a> · <a href="https://algo.illegalscreed.cn/docs/skip-list" target="_blank" rel="noopener noreferrer">跳表</a> · <a href="https://algo.illegalscreed.cn/docs/bloom-filter" target="_blank" rel="noopener noreferrer">布隆</a>
- 本站幻灯片：<a href="/SlideStack/utility-structures-slide/" target="_blank">工程实用结构</a>
