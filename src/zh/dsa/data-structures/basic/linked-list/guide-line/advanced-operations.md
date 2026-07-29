---
layout: doc
outline: [2, 3]
---

# 进阶操作：哨兵、双指针与重排

> 基于通用算法套路 · 核于 2026-07

## 速查

- **虚拟头节点（dummy）**：在真头前加哨兵节点，让「头节点增删」与「中间增删」代码统一，消除空表/头节点特判——凡可能改变 head 的题都该用。
- **删除倒数第 k**：dummy + 快慢间隔指针，`fast` 先走 k+1 步，`slow` 落在待删节点的前驱，`slow.next = slow.next.next` 即删。
- **回文链表**：快慢找中点 → 反转后半段 → 双指针比较前后半段 →（可选）还原。O(n) 时间 O(1) 空间。
- **随机节点（蓄水池）**：水塘抽样，第 i 个节点以 `1/i` 概率替换答案，等概率抽任一节点，O(n) 一次遍历。
- **LRU 双向链表**：双向链表 + 哈希表，`get`/`put` 均 O(1)；链表头表示最近访问，尾部淘汰。
- **链表重排（LeetCode 143）**：找中点 → 反转后半 → 交替合并。
- **旋转链表（LeetCode 61）**：成环 → 走 `n - k % n` 步断开。
- **两两交换节点（LeetCode 24）**：dummy + 每次交换 `prev.next` 后两个。
- **工程实现**：Java `LinkedList`、C++ `std::list` 是双链表；Python `collections.deque` 双向；JS 无原生链表，需手写。
- **铁律**：改指针前先存 next；删节点前先取前驱；用 dummy 消除头节点特判。
- **交互演示**：[链表可视化](https://algo.illegalscreed.cn/docs/link)。

## 一、虚拟头节点（dummy）实战

虚拟头节点是链表工程与面试题里最常用的技巧。核心思想：**在真实头节点前挂一个不存数据的哨兵节点**，所有「可能改变 head」的操作都变成「往 dummy 后面改」，最后返回 `dummy.next`。

### 通用模板

```js
function operate(head) {
  const dummy = new ListNode(0, head);  // 哨兵，next 指向真头
  // ... 对 dummy.next 链做操作（增删节点）...
  return dummy.next;                    // 返回新头（可能已变）
}
```

### 何时必须用 dummy

- **删除节点**（可能删的就是头节点）：如「删除所有等于 val 的节点」「删除倒数第 k」。
- **合并/拼接**（结果链头一开始为空）：如合并两个有序链表。
- **反转区段**（区段含头节点）：如反转 `[m, n]` 区间。
- **头插法**：把节点逐个插到结果链头部。

不用 dummy 时，这些题都要写「若 head 为空则初始化 head」或「若删的是 head 则 head = head.next」等特判，既啰嗦又易错。

## 二、删除倒数第 k 个节点

结合「间隔双指针」与「dummy」，一次遍历删除倒数第 k（LeetCode 19）。

```js
function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let fast = dummy, slow = dummy;
  for (let i = 0; i < n + 1; i++) fast = fast.next;  // fast 先走 n+1 步
  while (fast) {                                      // 同步走，fast 到尾
    slow = slow.next; fast = fast.next;
  }
  slow.next = slow.next.next;                          // slow 落在前驱，删下一个
  return dummy.next;
}
```

- **为什么 `fast` 先走 n+1 步**：要删倒数第 n 个，得让 `slow` 落在它**前驱**（否则没法改 `next`）。`fast` 多走 1 步，正好让 `slow` 落在前驱。
- **为什么要 dummy**：若删的是头节点（链表长 n，删倒数第 n = 删头），无 dummy 时 `slow` 会是 `null` 无法操作；dummy 保证 `slow` 至少指向 dummy。
- **复杂度**：O(n) 一次遍历，O(1) 空间。

## 三、回文链表

判断链表是否回文（LeetCode 234）。思路：找中点 → 反转后半段 → 与前半段逐一比较。O(n) 时间 O(1) 空间。

```js
function isPalindrome(head) {
  // 1. 快慢找中点（让 slow 停在前半尾，偶数长度）
  let slow = head, fast = head;
  while (fast.next && fast.next.next) {
    slow = slow.next; fast = fast.next.next;
  }
  // 2. 反转后半段
  let second = reverse(slow.next);
  // 3. 双指针比较前后半段
  let p1 = head, p2 = second;
  while (p2) {
    if (p1.val !== p2.val) return false;
    p1 = p1.next; p2 = p2.next;
  }
  return true;
}
function reverse(head) {
  let prev = null, curr = head;
  while (curr) { const n = curr.next; curr.next = prev; prev = curr; curr = n; }
  return prev;
}
```

- **为什么反转后半段**：回文要求前后镜像，反转后半段后与原前半段逐位比较即可，无需额外 O(n) 数组。
- **偶数/奇数**：`while (fast.next && fast.next.next)` 让 `slow` 停在前半尾，后半段从 `slow.next` 开始，对奇偶都成立。
- **进阶**：若要求不破坏原链表，最后再把后半段反转回去。

## 四、链表随机节点

给定单链表，等概率随机返回一个节点（LeetCode 382）。链表长度未知，且要求 O(n) 一次遍历、O(1) 空间——用**水塘抽样（Reservoir Sampling）**。

```js
function getRandom(head) {
  let i = 1, ans = null;
  for (let curr = head; curr; curr = curr.next) {
    // 第 i 个节点以 1/i 概率替换当前答案
    if (Math.floor(Math.random() * i) === 0) ans = curr.val;
    i++;
  }
  return ans;
}
```

- **为什么是 1/i**：归纳可证每个节点最终被选中的概率都是 `1/n`。第 i 个被选概率 `1/i`，之后不被替换概率 `∏(j>i)(1 - 1/j)`，相乘恰为 `1/n`。
- **适用**：数据流、未知长度集合的等概率抽样，O(n) 时间 O(1) 空间——优于「先数 n 再随机 [0,n) 再遍历」的两次遍历。

## 五、LRU 缓存中的双向链表

LRU（Least Recently Used）缓存要求 `get`、`put` 都 O(1)（LeetCode 146）。实现 = **双向链表（维护访问顺序）+ 哈希表（O(1) 定位节点）**。

- **双向链表**：表头是最近访问，表尾是最久未用（淘汰对象）。双向是为 O(1) 删除任一节点（哈希表给出节点指针后，靠 `prev`/`next` 直接摘除，无需找前驱）。
- **哈希表**：`key -> 链表节点`，`get` 时 O(1) 拿到节点，再把节点移到表头。
- **两个哨兵节点**（head/tail 空节点）：首尾插入删除都变中间操作，无空表特判。

```js
class LRUCache {
  constructor(capacity) {
    this.cap = capacity;
    this.map = new Map();              // key -> node
    this.head = { next: null, prev: null };  // 哨兵头
    this.tail = { next: null, prev: null };  // 哨兵尾
    this.head.next = this.tail; this.tail.prev = this.head;
  }
  get(key) {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key);
    this.moveToHead(node);             // 访问即提到表头
    return node.val;
  }
  put(key, val) {
    if (this.map.has(key)) {           // 已存在：更新值并提到表头
      const node = this.map.get(key); node.val = val; this.moveToHead(node);
    } else {                            // 不存在：新建插入表头
      const node = { key, val };
      this.map.set(key, node);
      this.addToHead(node);
      if (this.map.size > this.cap) {   // 超容：淘汰表尾
        const removed = this.removeTail();
        this.map.delete(removed.key);
      }
    }
  }
  // 以下是双向链表的节点搬运（addToHead/removeNode/moveToHead/removeTail）
}
```

LRU 是双向链表 + 哈希表配合的经典案例，也是面试高频——务必手写过一遍。

## 六、链表的工程实现

### JavaScript：无原生链表，需手写

JS 没有内建链表类型，标准做法是手写 `ListNode` 类，或用对象字面量 `{ val, next }`。面试题多用裸节点对象。

```js
class ListNode {
  constructor(val, next = null) { this.val = val; this.next = next; }
}
```

### Java：`java.util.LinkedList`（双向链表）

```java
LinkedList<Integer> list = new LinkedList<>();
list.addFirst(1);   // 头插 O(1)
list.addLast(2);    // 尾插 O(1)
list.getFirst();    // 取头 O(1)
list.removeLast();  // 删尾 O(1)
list.get(i);        // 按下标取 O(n)——别当随机访问用！
```

实现是**双向链表**，`List` 接口与 `Deque` 接口都实现。注意 `list.get(i)` 是 O(n)，误用会埋下性能坑。

### C++：`std::list`（双向链表）+ `std::forward_list`（单链表）

```cpp
std::list<int> l{1, 2, 3};
l.push_front(0);          // 头插 O(1)
l.push_back(4);           // 尾插 O(1)
l.insert(it, 5);          // 已知迭代器处插入 O(1)
// 注意：不支持 l[i]，只能用迭代器遍历
```

### Python：`collections.deque`（双向链表/块状数组）

```python
from collections import deque
d = deque([1, 2, 3])
d.appendleft(0)   # 头插 O(1)
d.append(4)       # 尾插 O(1)
d.popleft()       # 头删 O(1)
# deque 实为分块数组，两端 O(1)；做栈/队列首选，勿用 list 做头部增删
```

注意 Python `list` 的 `pop(0)`/`insert(0,x)` 是 O(n)（整体搬移），做队列要用 `deque`。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/link" target="_blank" rel="noopener noreferrer">链表可视化演示</a> —— 虚拟头节点、删除倒数第 k、回文判定的指针过程

## 下一步

进阶操作覆盖了链表面试的主要题型。完整的复杂度表、各语言链表对照、双指针套路清单与易错点汇总，见[参考](../reference)。
