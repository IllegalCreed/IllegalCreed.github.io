---
layout: doc
outline: [2, 3]
---

# 参考：哈希表 API、复杂度与实现速查

> 基于通用数据结构概念 · 核于 2026-07

## 速查

- **定义**：键值对映射，`index = hash(key) % capacity`，平均 O(1) 查/插/删；底层是桶数组。
- **核心复杂度**：查找/插入/删除**平均 O(1)**、**最坏 O(n)**（全冲突退化链表）；rehash 单次 O(n)、摊还 O(1)。
- **冲突必然性**：鸽巢原理——key 多于桶数必有冲突，只能解决不能消灭。
- **链地址法**：每桶挂链表/红黑树；Java HashMap 链表 ≥8 转红黑树，退化 ≤6 还原。
- **开放寻址法**：线性探测（聚集）、二次探测（+i²）、双重哈希（+i×h2）；负载因子必须 <1；删除用墓碑。
- **负载因子**：`元素数 / 桶数`；Java 0.75、Python ~0.66、C++ 1.0；超阈值 rehash（桶 ×2 + 重新哈希）。
- **好哈希函数**：确定性 + 均匀分布 + 高效 + 雪崩效应；除留余数（m 取素数）/乘法（A≈0.618）/字符串（base 31）。
- **一致性哈希**：节点和 key 映射到环，顺时针找归属节点，扩容只迁移相邻区间 key。
- **两数之和**：边遍历边存 `值→下标`，查 `target - 当前`，O(n²)→O(n)，空间换时间典范。
- **JS Object vs Map**：做哈希表优先 `Map`（任意类型 key、保插入序、`.size` O(1)、无原型污染）。
- **交互演示**：[哈希表可视化](https://algo.illegalscreed.cn/docs/hash)。

## 一、核心复杂度表

| 操作 | 最好 | 平均 | 最坏 | 说明 |
| --- | --- | --- | --- | --- |
| `get(key)` 查找 | O(1) | **O(1)** | O(n) | 全冲突退化扫链表 |
| `put(key)` 插入 | O(1) | **O(1)** | O(n) | rehash 那次 O(n)，摊还 O(1) |
| `delete(key)` 删除 | O(1) | **O(1)** | O(n) | 先定位再删，同查找 |
| 扩容 rehash | — | — | O(n) | 桶 ×2 + 重新哈希所有元素 |
| 遍历（所有 key） | O(n) | O(n) | O(n) | 无序，不能范围查询 |

**注意**：最坏 O(n) 在「哈希函数差 / 负载因子过高 / 恶意碰撞攻击」时发生；工程上用好哈希 + rehash + 链表转红黑树把最坏压到 O(log n)。

## 二、各语言哈希表实现对照

| 语言 | 类型 | 冲突解决 | 默认负载因子 | key 类型 |
| --- | --- | --- | --- | --- |
| JavaScript | `Object` / `Map` | 链地址（V8） | 引擎内部 | Object: 字符串/Symbol；Map: 任意 |
| Python | `dict` / `set` | 开放寻址（伪随机） | ~0.66 | 可哈希对象（`__hash__`） |
| Java | `HashMap` / `HashSet` | 链地址 + 红黑树（≥8） | **0.75** | 正确实现 `equals/hashCode` 的对象 |
| Java | `Hashtable` | 链地址（线程安全） | 0.75 | 同上（已过时，用 `ConcurrentHashMap`） |
| C++ | `unordered_map` / `unordered_set` | 链地址 | 1.0（max_load_factor） | 可哈希（`std::hash`） |
| Go | `map` | 链地址（桶内 8 槽数组 + 溢出桶） | ~6.5 | 可比较类型 |
| Rust | `HashMap` / `HashSet` | 开放寻址（Robin Hood） | 0.875 | `Hash + Eq` |

## 三、冲突解决策略对比

| 策略 | 思路 | 负载因子上限 | 删除 | 缓存 | 代表实现 |
| --- | --- | --- | --- | --- | --- |
| 链地址法 | 每桶挂链表/红黑树 | 可 >1 | 直接摘节点 | 差（链表分散） | Java HashMap、C++ unordered_map |
| 线性探测 | `+1, +2, +3,...` | <1 | 墓碑标记 | 好 | 旧版 Python（已换） |
| 二次探测 | `+1², +2²,...` | <1 | 墓碑标记 | 好 | — |
| 双重哈希 | `+i×h2(key)` | <1 | 墓碑标记 | 好 | — |
| 伪随机探测 | 依 key 生成探测序列 | <1 | 墓碑标记 | 好 | Python dict |

## 四、Java HashMap 红黑树转换规则（面试高频）

| 条件 | 动作 | 原因 |
| --- | --- | --- |
| 桶内链表长度 **≥ 8** 且桶数组容量 **≥ 64** | 链表 → 红黑树 | 查找 O(n) → O(log n)，防碰撞攻击 |
| 桶内链表长度 **≥ 8** 但桶数组容量 **< 64** | 触发 rehash（不转树） | 小容量优先扩容让 key 重新散列 |
| 红黑树节点数 **≤ 6**（扩容/删除后） | 红黑树 → 链表 | 节点少时链表常数更小 |

阈值 8 的依据是泊松分布：负载因子 0.75 且哈希均匀时，单桶 8 节点的概率约 `6×10⁻⁸`，几乎只在攻击/劣质哈希下发生。

## 五、负载因子与 rehash

```js
// 通用 rehash 框架
function rehash(table) {
  const old = table.buckets;
  table.buckets = new Array(old.length * 2);  // 桶翻倍
  table.size = 0;
  for (const chain of old) {                  // 链地址法
    for (const node of chain ?? []) {
      table.put(node.key, node.value);        // 重新哈希（capacity 变了，下标变）
    }
  }
}

// 触发时机：put 后检查
if (table.size / table.buckets.length > table.loadFactor) {
  rehash(table);
}
```

| 实现 | 负载因子阈值 | 桶扩容倍数 | 特殊机制 |
| --- | --- | --- | --- |
| Java `HashMap` | 0.75 | ×2 | 容量始终 2 的幂 |
| Python `dict` | ~0.66（2/3） | ×2~×4 | 用 `used*3` 与 `mask+1` 比较 |
| C++ `unordered_map` | 1.0 | ×2（取素数） | `max_load_factor` 可调 |
| Go `map` | ~6.5 | 渐进式 | 边操作边搬，避免单次卡顿 |

## 六、JS Map 高频 API（哈希表视角）

```js
const m = new Map();
// 增删改查 平均 O(1)
m.set('k', 'v');          // 插入/覆盖
m.get('k');               // 'v'，不存在返回 undefined
m.has('k');               // true / false
m.delete('k');            // 删除，返回是否成功
m.size;                   // 元素数 O(1)
// 迭代（保插入序）
for (const [k, v] of m) { /* ... */ }
m.keys(); m.values(); m.entries();
// 批量
new Map([['a',1], ['b',2]]); // 从键值对数组构造
```

**陷阱**：`Map` 用**引用相等**判断对象 key——两个字面量 `{x:1}` 是不同对象，互不覆盖。要用对象做 key 必须持有同一引用。

## 七、经典应用速查

```js
// 1. 去重（Set）
const seen = new Set();
for (const x of arr) seen.add(x);  // seen.size = 去重后元素数

// 2. 计数（Map）
const cnt = new Map();
for (const x of arr) cnt.set(x, (cnt.get(x) ?? 0) + 1);

// 3. 两数之和（O(n²) → O(n)）
function twoSum(nums, target) {
  const m = new Map();
  for (let i = 0; i < nums.length; i++) {
    if (m.has(target - nums[i])) return [m.get(target - nums[i]), i];
    m.set(nums[i], i);
  }
  return [];
}

// 4. 前缀和 + 哈希：和为 k 的子数组个数（含负数）
const cnt = new Map([[0, 1]]);   // 关键初始化
let pre = 0, ans = 0;
for (const x of nums) {
  pre += x;
  ans += cnt.get(pre - k) ?? 0;
  cnt.set(pre, (cnt.get(pre) ?? 0) + 1);
}
```

## 八、易错点清单

- **混淆平均与最坏**：哈希表是**平均** O(1)，**最坏** O(n)——面试时别说「哈希表 O(1) 查找」而不带「平均」前提。
- **开放寻址负载因子必须 <1**：桶满了无处探测，链地址法才能 >1。
- **rehash 要重新哈希所有元素**：`capacity` 变了下标全变，不能简单拷贝。
- **开放寻址删除不能直接清空**：会断探测链，必须用墓碑标记。
- **除留余数法 m 必须取素数**：取 2 的幂会丢高位信息，产生聚集。
- **JS Object 的数字 key 被转字符串**：`o[1]` 和 `o["1"]` 是同一个 key，做哈希表会出错——用 `Map`。
- **Map 用引用相等判对象 key**：两个 `{x:1}` 字面量不互相覆盖。
- **Java HashMap 转树要同时满足「链表≥8 且桶≥64」**：小容量时只扩容不转树。
- **两数之和哈希法要「边查边存」**：先存全再查会用到同元素自己（除非要求下标不同且值相同）。
- **一致性哈希要加虚拟节点**：节点少时环上分布不均，负载失衡。
- **哈希表无序**：不能范围查询、不能取最值——要有序用红黑树（`TreeMap`）/跳表。
- **Python dict 是开放寻址不是链地址**：别套用 Java 的红黑树逻辑。

## 九、进阶方向（链接其他叶）

- **数组**：桶数组的物理基础（O(1) 随机访问）——见[数组](../array/) 叶
- **链表**：链地址法的桶挂链表、LRU 的双向链表——见[链表](../linked-list/) 叶
- **树**：链地址法的链表转红黑树、有序哈希表（TreeMap）——见[二叉搜索树](../../tree/) 叶
- **跳表**：有序 + O(log n) 查找的替代方案（Redis zset）——见[跳表](../../../advanced/skip-list/) 叶
- **堆**：LRU/LFU 缓存与优先队列——见[堆](../../../advanced/heap/) 叶

## 权威链接

- [哈希表 - 维基百科](https://zh.wikipedia.org/wiki/%E5%93%88%E5%B8%8C%E8%A1%A8)
- [Hash table - Wikipedia](https://en.wikipedia.org/wiki/Hash_table)
- [Hash Table Data Structure - GeeksforGeeks](https://www.geeksforgeeks.org/hash-table-data-structure/)
- [Java HashMap 源码 - OpenJDK](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/HashMap.java)
- [Consistent Hashing - 论文](https://www.akamai.com/site/en/documents/research-paper/consistent-hashing-and-random-trees-distributed-caching-protocols-for-relieving-hot-spots-on-the-world-wide-web-technical-publication.pdf)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/hash" target="_blank" rel="noopener noreferrer">哈希表可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/hash-table-slide/" target="_blank">哈希表</a>
