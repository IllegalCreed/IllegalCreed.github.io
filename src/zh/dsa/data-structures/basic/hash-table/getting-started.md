---
layout: doc
outline: [2, 3]
---

# 入门：键值映射、哈希函数与平均 O(1)

> 基于通用数据结构概念 · 核于 2026-07

## 速查

- **定义**：哈希表是一种**键值对（key-value）映射**结构，靠**哈希函数**把任意 key 算成一个桶数组下标 `hash(key) % capacity`，把 value 存进对应「桶（bucket）」，从而实现**平均 O(1)** 的查找/插入/删除。
- **两步走**：①`index = hash(key) % capacity` 把 key 映射到下标；②在下标处存取 value。哈希函数是「桥梁」，桶数组是「存储」。
- **核心复杂度**：查找/插入/删除**平均 O(1)**、**最坏 O(n)**（所有 key 冲突到同一桶，退化成链表）；空间换时间是它的本质。
- **冲突必然性（鸽巢原理）**：key 的取值空间远大于桶数，把多于桶数的 key 散列到有限桶里，**必有至少两个 key 落到同一桶**——冲突不可避免，只能「解决」不能「消灭」。
- **负载因子（load factor）**：`load factor = 元素数 / 桶数`，衡量「桶有多满」。超阈值（链地址法通常 0.75）就触发**扩容（rehash）**：桶数组翻倍 + 重新哈希所有元素，把负载因子降回来，保证平均 O(1)。
- **rehash 是摊还 O(1)**：单次 rehash 要搬全部元素是 O(n)，但几何扩容（×2）下连续 n 次插入的总搬移约 2n，摊还每次 O(1)——和动态数组同款摊还分析。
- **与数组/链表的关系**：哈希表底层就是「一个桶数组」——链地址法每个桶挂链表/红黑树，开放寻址法直接在数组里探测空槽。它把数组的 O(1) 随机访问升级成了 O(1) 按 key 访问。
- **典型实现**：Python `dict`（开放寻址）、Java `HashMap`（链地址，链表超 8 转红黑树）、C++ `unordered_map`（链地址）、JS `Object`/`Map`、Go `map`。
- **应用面**：去重（Set）、计数（key→次数）、两数之和（O(n²)→O(n)）、缓存（LRU）、数据库索引、一致性哈希（分布式路由）。
- **进阶顺序**：[冲突解决](./guide-line/collision-resolution) → [哈希函数与应用](./guide-line/hash-functions-and-applications) → [参考](./reference)。

## 一、核心模型：用哈希函数把 key 映射到下标

数组的强项是「按下标 O(1) 访问」，但现实问题里我们要查的是「某个 key」，不是「下标 i」。哈希表的妙处就是用一个**哈希函数**把任意 key（字符串、对象、数字……）算成一个数组下标，于是「按 key 查找」就被翻译成了「按下标访问」，直接拿到数组的 O(1)。

```
key ──hash()──> 整数 hashcode ──% capacity──> 桶下标 index ──> bucket[index] 存 value
```

一个最小哈希表的实现骨架：

```js
class HashTable {
  constructor(capacity = 8) {
    this.buckets = new Array(capacity).fill(null).map(() => []); // 每桶一个链表（链地址法）
    this.size = 0;
  }
  // 核心：key -> 下标
  _index(key) {
    const hash = this._hash(key);          // 1. 把 key 算成一个整数
    return hash % this.buckets.length;     // 2. 压缩到桶数组范围内
  }
  put(key, value) {
    const i = this._index(key);
    const chain = this.buckets[i];
    for (const node of chain) {            // 同一桶里可能有多个 key（冲突）
      if (node.key === key) { node.value = value; return; } // 已存在：覆盖
    }
    chain.push({ key, value });            // 新增
    this.size++;
  }
  get(key) {
    const i = this._index(key);
    for (const node of this.buckets[i]) {  // 在对应桶的链表里找
      if (node.key === key) return node.value;
    }
    return undefined;                      // 没找到
  }
}
```

关键在三步：①`_hash(key)` 把 key 压成一个整数（哈希函数）；②`% capacity` 压缩到桶下标；③在下标处处理「可能多个 key 映射到这」（冲突）。这三步决定了哈希表的性能。

## 二、平均 O(1) 从哪里来

「平均 O(1)」的前提是**哈希函数均匀分布 + 负载因子不太高**。当 key 被均匀地散列到各桶、且每个桶平均只有 O(1) 个元素时，查一个 key 只需：算下标 O(1) + 在桶里（平均常数个元素）找 O(1) = **O(1)**。

| 操作 | 平均 | 最坏 | 说明 |
| --- | --- | --- | --- |
| 查找 `get(key)` | **O(1)** | O(n) | 最坏：所有 key 冲突到一桶，退化成扫链表 |
| 插入 `put(key)` | **O(1)** | O(n) | 平均 O(1)，rehash 那次是 O(n) 摊还 |
| 删除 `delete(key)` | **O(1)** | O(n) | 同查找，先定位再删 |
| 扩容 rehash | — | O(n) | 翻倍桶 + 重新哈希所有元素 |

**最坏 O(n) 何时发生**：①哈希函数设计差，key 都挤到少数桶；②负载因子过高（桶太满，链表变长）；③恶意构造的 key（哈希碰撞攻击，如针对早期 Java/PHP 的 DoS）。工程上用「好哈希函数 + 适时 rehash + 链表转红黑树」把最坏情况压下去。

## 三、冲突必然性：鸽巢原理

哈希表绕不开一个问题：**冲突（collision）**——两个不同的 key 算出了同一个桶下标。

> **鸽巢原理（Pigeonhole Principle）**：把 n+1 只鸽子放进 n 个鸽巢，必有至少一个鸽巢里有 ≥2 只鸽子。

哈希表里「鸽子」是所有可能的 key（无限/极大），「鸽巢」是有限的桶（capacity 个）。key 的取值空间远大于桶数，所以**只要存入的元素数 ≥ 桶数，冲突就必然发生**。这意味着：

1. **冲突不能消灭，只能解决**：链地址法把同桶的 key 串成链表/红黑树；开放寻址法在数组里另找空槽。
2. **好哈希函数只能「减少」冲突，不能「消除」**：均匀分布让冲突稀疏（每桶平均 1 个），但仍存在。
3. **负载因子是冲突的「温度计」**：负载因子越高，桶越满，冲突越频繁——所以要在超阈值时 rehash 降温。

冲突解决策略是哈希表设计的核心，详见[冲突解决：链地址法与开放寻址法](./guide-line/collision-resolution)。

## 四、负载因子与 rehash

**负载因子（load factor）** 衡量「桶有多满」：

```
load factor = 元素数 (size) / 桶数 (capacity)
```

负载因子 = 0.75 意味着平均每桶 0.75 个元素。负载因子越高，冲突越频繁，操作越慢；负载因子越低，桶越空旷，内存越浪费。这是个时空权衡，主流实现取 **0.75** 左右（Java `HashMap` 默认 0.75，是「低冲突」与「内存」的折中经验值）。

当负载因子超过阈值时，触发 **rehash（扩容）**：

```js
// rehash 伪代码
function rehash(table) {
  const oldBuckets = table.buckets;
  table.buckets = new Array(oldBuckets.length * 2); // 桶数组翻倍
  table.size = 0;
  for (const chain of oldBuckets) {
    for (const node of chain) {
      table.put(node.key, node.value);  // 重新哈希（下标变了，因为 capacity 变了）
    }
  }
}
```

**为什么 rehash 要重新哈希所有元素**：下标是 `hash(key) % capacity`，capacity 变了，每个 key 的新下标都可能变，不能简单拷贝，必须全部重算 `put` 一遍。

**rehash 的摊还 O(1)**：和动态数组几何扩容同款分析——连续 n 次插入触发的 rehash 搬移次数是几何级数 `1+2+4+...≈2n`，摊到 n 次每次 O(1)。注意**单次 rehash 是 O(n)**，对延迟敏感场景（实时系统）可能造成卡顿，工程上有「渐进式 rehash」（Redis dict 边操作边搬）等优化。

## 五、与数组、链表的关系

哈希表不是凭空出现的，它的底层就是数组 + 链表（或红黑树）的组合：

- **桶数组（bucket array）**：一个普通数组，下标就是哈希值取模的结果。这是「随机访问」的物理基础。
- **链地址法**：每个桶挂一个链表（Java `HashMap`）或红黑树（链表过长时），把冲突的 key 串起来。
- **开放寻址法**：不用链表，冲突时在桶数组里另找空槽（线性/二次探测），全程只用一个数组。

所以理解哈希表，先要吃透数组（O(1) 访问）和链表（O(1) 增删）——哈希表用哈希函数把它们组合成「按 key 的 O(1) 映射」。

| 维度 | 数组 | 链表 | 哈希表 |
| --- | --- | --- | --- |
| 按下标访问 | **O(1)** ✅ | O(n) ❌ | —（按下标无意义） |
| 按 key 访问 | O(n)（线性扫） | O(n) | **平均 O(1)** ✅ |
| 插入/删除（按 key） | O(n) | O(1)（已知节点） | **平均 O(1)** ✅ |
| 有序/范围查询 | 支持（排序后） | 不支持 | 不支持 ❌ |
| 内存 | 仅数据 | 每节点多指针 | 桶数组 + 空槽（有浪费） |

选型口诀：**「按 key 等值查找且不在乎顺序 → 哈希表；要按下标或有序/范围查询 → 数组/有序表；频繁按已知节点增删 → 链表」**。

## 下一步

理解了哈希表的平均 O(1) 与冲突必然性后，下一步直面最核心的设计决策——**冲突怎么解决**：链地址法把冲突 key 串成链表/红黑树，开放寻址法在数组里探测空槽，见[冲突解决：链地址法与开放寻址法](./guide-line/collision-resolution)。
