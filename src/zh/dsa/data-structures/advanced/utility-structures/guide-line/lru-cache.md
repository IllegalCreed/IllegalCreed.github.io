---
layout: doc
outline: [2, 3]
---

# LRU 缓存：哈希表 + 双向链表

> 基于通用算法套路 · 核于 2026-07

## 速查

- **LRU 策略**：容量满时淘汰「最久未被访问」的元素——依据是程序局部性原理（最近访问的近期还会被访问）。
- **两个关键操作**：①访问（`get`）/写入（`put`）时把元素移到「最近」端（队头）；②容量满时淘汰「最久」端（队尾）。
- **为什么用哈希表 + 双向链表**：哈希表 O(1) 定位节点，双向链表 O(1) 移动到头/删尾（已知节点能拿到前驱）——两者各补对方短板，`get`/`put` 全 **O(1)**。
- **为什么必须双向链表**：单链表删除已知节点要 O(n) 找前驱；双向链表 `node.prev.next = node.next` 一行搞定 O(1)。
- **为什么不能只用链表**：单链表找 key 要 O(n)；哈希表让它变 O(1) 定位，再交给链表做 O(1) 重排。
- **虚拟头尾节点（dummy head/tail）**：首尾各加哨兵，真实节点永远夹在中间——**空表、单节点、头尾操作全部统一为「中间操作」**，边界判断（`if (prev)`/`if (next)`）全省。
- **`get(key)` 流程**：哈希表查 key → 没命中返回 -1；命中则把节点移到头、返回 value。
- **`put(key, value)` 流程**：哈希表查 key → 命中则更新 value 并移到头；未命中则新建节点插到头，若超容量则删尾节点 + 哈希表删 key。
- **LRU 的工程地位**：Redis `maxmemory-policy allkeys-lru`、MySQL Buffer Pool（改良版 LRU）、操作系统页置换（CLOCK 是 LRU 近似）、Java `LinkedHashMap`（accessOrder=true 即 LRU）。
- **LRU 的退化**：顺序扫描整个数据集会逐个淘汰热数据（每次访问都把冷数据顶到头）——工程上用 **LRU-K** 或 **LFU** 改良。
- **进阶方向**：LFU（淘汰访问频次最少的）、W-TinyLFU（Caffeine 用，结合 LRU + LFU + Count-Min Sketch）。

## 一、LRU 策略：淘汰「最久没被访问」的

LRU（Least Recently Used）的核心思想是维护一个按「最近访问时间」排序的队列：最近访问的在队头，最久没碰的在队尾。容量满了就从队尾淘汰。它的理论依据是**局部性原理**——被访问过的数据近期很可能再次被访问。

维护这个「最近访问序」需要两个动作：

1. **每次 `get`/`put` 命中某元素，把它从当前位置摘出来移到队头**——表示「刚被用过」。
2. **`put` 时若超容量，删掉队尾元素**——表示「最久没用的，淘汰」。

关键挑战：这两个动作都要 O(1)。链表的「摘出 + 移到头」是 O(1)（改指针），但「按 key 找到那个节点」单链表要 O(n)。这就是为什么要把链表和哈希表组合起来。

## 二、为什么是「哈希表 + 双向链表」

单独看两个结构都有短板：

| 单独用 | 短板 |
| --- | --- |
| 只用哈希表 | O(1) 查找，但**无序**——无法维护「最近访问序」，淘汰谁不知道 |
| 只用双向链表 | O(1) 重排，但**按 key 查找 O(n)**——找到要移动的节点都费劲 |
| 只用单链表 | 重排 O(1) 但**删已知节点要 O(n) 找前驱**——移到头也麻烦 |

组合起来各补短板：

- **哈希表** `Map<key, Node>`：O(1) 把 key 映射到链表节点，解决「找到节点」。
- **双向链表**（每个节点存 `prev`、`next`）：已知节点 O(1) 摘除（`node.prev.next = node.next; node.next.prev = node.prev`），解决「移到头/删尾」。

于是 `get`/`put` 全 O(1)。**为什么必须双向**：单链表删已知节点拿不到前驱，得从头扫一遍 O(n)；双向链表 `node.prev` 直接拿，O(1)。

## 三、虚拟头尾节点：消灭边界判断

LRU 实现里最容易写崩的是**边界**：链表为空时怎么插、只有一个节点时怎么删、删的恰好是头或尾时怎么处理。**虚拟头尾节点（dummy head / dummy tail）**这个技巧把这些情况全部统一：

```
dummy_head ⇄ node ⇄ node ⇄ ... ⇄ node ⇄ dummy_tail
```

首尾各放一个**不存数据的哨兵节点**，所有真实节点永远夹在它们中间。这样一来：

- **「移到头」= 插到 `dummy_head` 之后**：`insertAfter(dummy_head, node)`，不用判空。
- **「删尾」= 删 `dummy_tail.prev`**：`remove(dummy_tail.prev)`，不用判是不是头。
- **摘除任意节点**：`node.prev.next = node.next; node.next.prev = node.prev`——因为 `node.prev` 和 `node.next` 永远存在（不可能是 null，最多是哨兵），**一行搞定，无任何 `if`**。

这是 LRU（乃至所有双向链表题）最该掌握的工程技巧：**加哨兵，边界消失**。

## 四、O(1) 实现：get 与 put

把上面的要素拼起来，就是 LeetCode 146「LRU 缓存」的标准解：

```js
class LRUCache {
  constructor(capacity) {
    this.cap = capacity;
    this.map = new Map();        // key -> Node
    this.head = { val: 0 };      // 虚拟头
    this.tail = { val: 0 };      // 虚拟尾
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key);
    this._remove(node);          // 摘出
    this._addToHead(node);       // 移到头（最近用过）
    return node.val;
  }

  put(key, val) {
    if (this.map.has(key)) {     // 已存在：更新值 + 移到头
      const node = this.map.get(key);
      node.val = val;
      this._remove(node);
      this._addToHead(node);
      return;
    }
    const node = { key, val };   // 不存在：新建插头
    this.map.set(key, node);
    this._addToHead(node);
    if (this.map.size > this.cap) {  // 超容：删尾
      const lru = this.tail.prev;
      this._remove(lru);
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

注意 `_remove` 和 `_addToHead` 里**没有任何 `if` 判空**——这就是虚拟头尾节点的威力。时间复杂度：`get`/`put` 均 O(1)；空间 O(capacity)。

## 五、LRU 的工程应用

LRU 不是面试题专利，它是真实系统的淘汰策略基石：

- **Redis**：`maxmemory-policy allkeys-lru` 或 `volatile-lru`——内存满时按 LRU 淘汰 key（Redis 4.0 起还支持近似 LRU 的随机采样改良版）。
- **MySQL InnoDB Buffer Pool**：缓冲池用改良版 LRU（分 young/old 两区），避免全表扫描一次性冲刷掉热数据——这正是对「顺序扫描退化」的工程改良。
- **操作系统页置换**：早期 Unix 用 LRU 的近似算法 **CLOCK**（给页加访问位，时钟指针扫到访问位为 1 的清零跳过、为 0 的换出）——因为精确 LRU 维护链表开销太大，工程上做近似。
- **Java `LinkedHashMap`**：`new LinkedHashMap<>(cap, 0.75f, true)` 第三个参数 `accessOrder=true` 即开启 LRU 行为——访问/插入都把 entry 移到链表尾，重写 `removeEldestEntry` 即可自动淘汰最老的（链表头）。这是 Java 里实现 LRU 最省事的内置方式。
- **CPU 缓存**：组相联缓存替换（如伪 LRU）也是 LRU 思想的硬件级实现。

## 六、LRU 的退化与改良

纯 LRU 在一个场景下表现很差：**顺序扫描整个数据集**（如一次性遍历一张大表）。每访问一个新元素都把它顶到队头，于是热数据被一个个挤出去——缓存命中率塌方。工程上的改良：

- **LRU-K**：淘汰「第 K 次最近访问最久」的（K=1 退化为 LRU），需要多次访问才「热」起来，抗扫描冲刷。
- **LFU（Least Frequently Used）**：淘汰访问频次最少的——但旧热点难冷却。
- **W-TinyLFU**（Caffeine、Java 高性能缓存库用）：结合 LRU（近期）+ Count-Min Sketch（频次，老数据衰减）+ TinyLFU 准入——综合 LRU 和 LFU 的优点。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/lru" target="_blank" rel="noopener noreferrer">LRU 缓存可视化演示</a> —— 哈希表 + 双向链表的 O(1) 访问与淘汰

## 下一步

LRU 是「哈希 + 链表」拼装的典范；下一篇看另外两种工程高频的「拼装结构」——**跳表**（多层概率索引链表，O(log n) 有序操作）与**布隆过滤器**（位数组 + 多哈希，概率去重），见[跳表与布隆过滤器：概率数据结构](./skip-list-and-bloom)。
