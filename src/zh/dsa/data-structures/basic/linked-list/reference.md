---
layout: doc
outline: [2, 3]
---

# 参考：链表 API、复杂度与套路速查

> 基于通用数据结构概念 · 核于 2026-07

## 速查

- **定义**：节点（`val + next`/`prev`）+ 指针链接，分散存储，无连续内存。
- **核心复杂度**：访问 `node(i)` **O(n)**；**头部增删 O(1)**；**已知节点增删 O(1)**（单链表删需前驱，双链表 O(1)）；按值查找 O(n)；**不支持二分**。
- **三种形态**：单链表（`next` 单向）/ 双链表（`prev+next` 双向，删节点 O(1)）/ 循环链表（尾指回头，成环）。
- **反转（迭代）**：`prev/curr/next` 三指针翻转，O(n) O(1)；**反转（递归）**：`head.next.next = head`，O(n) O(n) 栈。
- **环检测（Floyd）**：快慢指针，快走 2 慢走 1，有环必相遇，O(n) O(1)；找入口：相遇后从头再发一指针同速走。
- **找中点**：快慢指针，`fast` 到尾 `slow` 在中点。
- **倒数第 k**：间隔指针，`fast` 先走 k 步再同步；**删倒数第 k**：`fast` 先走 k+1 步 + dummy。
- **合并有序**：`dummy` 哨兵 + 双指针取小接尾，O(n+m) O(1)。
- **相交**：两指针到尾互跳对方 head，对齐长度差后相遇。
- **虚拟头节点（dummy）**：凡可能改 head 的题都该用，统一头节点与中间节点的增删代码。
- **缓存不友好**：节点分散，顺序遍历比数组慢一个数量级（即使大 O 相同）。

## 一、核心复杂度表

| 操作 | 单链表最好 | 单链表平均/最坏 | 双链表 | 说明 |
| --- | --- | --- | --- | --- |
| 访问第 i 个节点 | O(n) | O(n) | O(n) | 从头遍历，不能随机访问 |
| 头部插入 | **O(1)** | **O(1)** | **O(1)** | 改 head 指针 |
| 头部删除 | **O(1)** | **O(1)** | **O(1)** | 改 head 指针 |
| 尾部插入 | O(1)（带尾指针） | O(n)（无尾指针）/ O(1)（有尾） | O(1)（带尾指针） | 无尾指针要 O(n) 找尾 |
| 尾部删除 | O(n) | O(n) | **O(1)**（带尾指针） | 单链表删尾要找前驱 |
| 已知节点后插入 | **O(1)** | **O(1)** | **O(1)** | 改 next |
| 已知节点删除 | O(n)（需找前驱） | O(n) | **O(1)** | 双链表靠 prev 免找前驱 |
| 查找（按值） | O(1)（头即是） | O(n) | O(n) | 线性扫描 |
| 二分查找 | — | 不支持 | 不支持 | 不能随机访问 |

## 二、各语言链表对照

| 语言 | 类型 | 形态 | 按下标访问 | 典型用途 |
| --- | --- | --- | --- | --- |
| C++ | `std::list<T>` | 双向链表 | O(n)（不支持 `[]`） | 频繁中间增删 |
| C++ | `std::forward_list<T>` | 单向链表 | O(n) | 省内存的单链表 |
| Java | `java.util.LinkedList<T>` | 双向链表 | O(n)（`get(i)` 别滥用） | List/Deque 双接口 |
| Python | `collections.deque` | 双向（分块数组） | O(n) | 栈/队列首选 |
| Python | （无原生） | — | — | 手写 `ListNode` 类 |
| JavaScript | （无原生） | — | — | 手写 `ListNode` 类 |
| Go | `container/list` | 双向链表 | O(n) | 标准库链表 |

## 三、JS 手写链表节点与遍历

```js
class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

// 双向链表节点
class DListNode {
  constructor(val, prev = null, next = null) {
    this.val = val;
    this.prev = prev;
    this.next = next;
  }
}

// 遍历单链表
for (let curr = head; curr; curr = curr.next) {
  console.log(curr.val);
}

// 尾插构造 1->2->3
function buildList(arr) {
  const dummy = new ListNode(0);
  let tail = dummy;
  for (const v of arr) {
    tail.next = new ListNode(v);
    tail = tail.next;
  }
  return dummy.next;
}
```

## 四、双指针套路清单（链表）

| 套路 | 指针配合 | 解决问题 | 复杂度 |
| --- | --- | --- | --- |
| 快慢指针（同速比） | fast 走 2 步、slow 走 1 步 | 判环（Floyd）、找中点 | O(n) |
| 间隔指针 | fast 先走 k 步再同步 | 倒数第 k、删倒数第 k | O(n) |
| 对齐指针 | 互换头跳转 | 相交链表找交点 | O(m+n) |
| 反转指针 | prev/curr/next 翻转 | 反转整条/区段 | O(n) |
| 合并指针 | 两链各一指针取小 | 合并有序链表 | O(n+m) |

## 五、经典算法速查代码

```js
// 反转链表（迭代，O(n) O(1)）
function reverse(head) {
  let prev = null, curr = head;
  while (curr) { const n = curr.next; curr.next = prev; prev = curr; curr = n; }
  return prev;
}

// Floyd 判环（O(n) O(1)）
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next; fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}

// 找中点（快慢）
function middle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  return slow;
}

// 合并两个有序链表（dummy 哨兵，O(n+m) O(1)）
function merge(a, b) {
  const dummy = new ListNode(-1); let t = dummy;
  while (a && b) { if (a.val <= b.val) { t.next = a; a = a.next; } else { t.next = b; b = b.next; } t = t.next; }
  t.next = a || b;
  return dummy.next;
}
```

## 六、易错点清单

- **改 next 前不存原值**：`curr.next = prev` 后原 `curr.next` 丢失，无法继续遍历——**铁律：先存 next**。
- **删节点没取前驱**：单链表删 `node` 要先找到它的前驱才能改前驱的 `next`；双链表靠 `prev` 免此步。
- **删除倒数第 k 的 n+1 步**：要删倒数第 n，`fast` 需先走 `n+1` 步让 `slow` 落前驱，少走 1 步会删错节点。
- **忘用 dummy**：删头节点时无 dummy 会让 `slow` 是 `null`，操作 `slow.next` 直接报错。
- **循环链表遍历条件错**：用 `curr.next === null` 判结束会死循环（循环链表无 null），应用 `curr === head` 或哨兵。
- **快慢指针初始都设 head**：判环时 `slow = fast = head` 必须同起点，否则可能漏判。
- **找中点偶数长度**：`while (fast && fast.next)` 返回后半第一个；要前半最后一个用 `while (fast.next && fast.next.next)`。
- **递归反转栈溢出**：链表很长时递归 O(n) 深度会爆栈，工程上用迭代。
- **误用 `LinkedList.get(i)` 当 O(1)**：Java/C++ 链表按下标访问是 O(n)，别当数组用。
- **相交链表不相交会死循环**：标准写法 `a = a ? a.next : headB`，不相交时两指针最终都到 `null` 同时退出，不会死循环。
- **指针赋值顺序错**：`node.next = prev; prev = node;` 必须先改 next 再推进 prev，顺序反了会断链。
- **双链表忘维护 prev**：插入/删除节点时既要改 `next` 也要改对方的 `prev`，漏一个就断双向。

## 七、进阶方向（链接其他叶）

- **栈/队列**：链表在两端的受限操作 —— 见[栈](../stack/)、[队列](../queue/) 叶
- **哈希表**：链地址法用链表做桶 —— 见[哈希表](../hash-table/) 叶
- **树**：链表是「退化成一条链的二叉树」 —— 见[二叉树](../../tree/) 叶
- **LRU/LFU 缓存**：双向链表 + 哈希表 —— 见[设计题](../../design/lru-cache/) 叶
- **图**：邻接表用链表存每个顶点的邻接点 —— 见[图的表示](../../graph/) 叶

## 权威链接

- [链表 - 维基百科](https://zh.wikipedia.org/wiki/%E9%93%BE%E8%A1%A8)
- [Linked List Data Structure - GeeksforGeeks](https://www.geeksforgeeks.org/data-structures/linked-list/)
- [Floyd's Cycle Detection - 算法图解](https://leetcode.com/problems/linked-list-cycle/)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/link" target="_blank" rel="noopener noreferrer">链表可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/linked-list-slide/" target="_blank">链表</a>
