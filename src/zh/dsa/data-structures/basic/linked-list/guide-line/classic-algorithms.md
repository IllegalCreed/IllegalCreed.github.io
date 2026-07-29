---
layout: doc
outline: [2, 3]
---

# 链表经典算法：反转、环检测、合并

> 基于通用算法套路 · 核于 2026-07

## 速查

- **反转链表（迭代）**：三指针 `prev/curr/next`，每轮 `next=curr.next; curr.next=prev; prev=curr; curr=next`，O(n) O(1)。
- **反转链表（递归）**：`reverse(head)` 反转头之后的链表，再把 `head` 接到 `head.next` 之后；递归栈 O(n)。
- **环检测（Floyd 快慢）**：`slow` 走 1 步、`fast` 走 2 步，若有环必在环内相遇；无环则 `fast` 先到 `null`。O(n) O(1)。
- **找中点（快慢）**：`slow` 走 1 步、`fast` 走 2 步，`fast` 到尾时 `slow` 在中点（偶数长度在前半尾）。
- **倒数第 k 个（间隔指针）**：`fast` 先走 k 步，再 `slow`、`fast` 同步走，`fast` 到尾时 `slow` 指向倒数第 k。
- **合并两个有序链表**：`dummy` 哨兵 + 双指针，每次取较小者接到结果链，O(n+m) O(1)。
- **相交链表**：两指针分别从两 head 出发，到尾就跳到另一条 head，相遇点即交点（对齐了长度差）。
- **复杂度**：以上全是 O(n) 时间；除递归反转外都是 O(1) 空间。
- **铁律**：改指针前**先存 next**（`const nxt = curr.next`），否则丢链再也找不回。
- **交互演示**：[链表可视化](https://algo.illegalscreed.cn/docs/link)。

## 一、反转链表

反转链表是链表题的「Hello World」——把 `1->2->3->null` 变成 `3->2->1->null`。有迭代和递归两种写法，都要会。

### 迭代：三指针翻转

```js
// 反转单链表，返回新头（LeetCode 206）
function reverseList(head) {
  let prev = null, curr = head;
  while (curr) {
    const next = curr.next;  // 1. 先存 next，否则改完就丢了
    curr.next = prev;        // 2. 掉转指针：curr 指向前一个
    prev = curr;             // 3. prev 前进
    curr = next;             // 4. curr 前进
  }
  return prev;               // 循环结束时 curr=null，prev 是新头
}
```

- **核心**：每轮把 `curr.next` 掉头指向 `prev`，然后整体右移一格。`prev` 初始为 `null`（原头反转后该指向 null）。
- **铁律**：第一步必须 `const next = curr.next`，否则执行 `curr.next = prev` 后原 `curr.next` 就丢了，无法继续遍历。
- **复杂度**：O(n) 时间，O(1) 空间——这是迭代相对于递归的优势。

### 递归：自底向上接回

```js
// 递归反转（LeetCode 206）
function reverseList(head) {
  if (!head || !head.next) return head;      // base：空或单节点直接返回
  const newHead = reverseList(head.next);    // 反转头之后的部分
  head.next.next = head;                     // head.next 现在是新尾，让它指回 head
  head.next = null;                          // head 现在是新尾，next 置空
  return newHead;                            // newHead 始终是反转后的头
}
```

- **理解**：递归到底，从尾部开始「把每个节点的 next 反过来指回自己」。`head.next.next = head` 是把「head 的下一个节点」的指针回指 head。
- **代价**：递归深度 O(n)，链表很长时栈溢出——所以工程上优先用迭代，递归用于理解或题目要求。

## 二、环检测（Floyd 快慢指针）

判断链表是否有环（LeetCode 141），找环的入口（LeetCode 142）。经典做法是 Floyd 龟兔赛跑。

```js
// 判断是否有环（LeetCode 141）
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;       // 慢指针走 1 步
    fast = fast.next.next;  // 快指针走 2 步
    if (slow === fast) return true;  // 相遇 ⇒ 有环
  }
  return false;             // fast 到 null ⇒ 无环
}
```

- **为什么有环必相遇**：进入环后，快慢指针都在环上转。每一步快指针比慢指针多走 1 步，相当于在环上「追」慢指针，距离每轮缩短 1，必然追上（相遇）。
- **为什么无环不会误判**：无环时 `fast` 一定先到 `null`，循环正常退出。
- **复杂度**：O(n) 时间，O(1) 空间——比用哈希表记录访问节点（O(n) 空间）更优。

### 找环的入口（LeetCode 142）

```js
function detectCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next; fast = fast.next.next;
    if (slow === fast) {              // 相遇
      let p = head;
      while (p !== slow) {            // 一个从头、一个从相遇点，同速走
        p = p.next; slow = slow.next;
      }
      return p;                        // 再次相遇点即环入口
    }
  }
  return null;
}
```

数学结论：**从头节点走 a 步到环入口，与从相遇点走 a 步，会在环入口相遇**（a 是头到入口的距离）。证明要点是 `慢指针在环内走的距离 = 头到入口距离 mod 环长`。

## 三、找链表中点（快慢指针）

```js
// 找中点：fast 走 2 步，slow 走 1 步（LeetCode 876）
function middleNode(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;  // 奇数长度 slow 在正中；偶数长度 slow 在后半第一个
}
```

- **奇数长度**（如 5 个）：`fast` 停在尾，`slow` 停在正中（第 3 个）。
- **偶数长度**（如 4 个）：`fast` 停在倒数第二个的 next（null），`slow` 停在后半第一个（第 3 个）。
- **用途**：归并排序链表（先找中点再合并）、回文判定（找中点后反转后半段比较）。
- **若要偶数取前半最后一个**：把 `while` 条件改成 `while (fast.next && fast.next.next)`。

## 四、倒数第 k 个节点（间隔双指针）

```js
// 返回倒数第 k 个节点（LeetCode 19 同源，剑指 22）
function kthFromEnd(head, k) {
  let fast = head, slow = head;
  for (let i = 0; i < k; i++) fast = fast.next;  // fast 先走 k 步
  while (fast) {                                  // 再同步走
    slow = slow.next; fast = fast.next;
  }
  return slow;                                    // fast 到尾时 slow 在倒数第 k
}
```

- **原理**：`fast` 先走 k 步，相当于和 `slow` 拉开 k 的间隔；之后同步走，`fast` 到尾时 `slow` 距尾 k 步，即倒数第 k。
- **配合 dummy 删除倒数第 k**：见[进阶操作](./advanced-operations)。
- **复杂度**：一次遍历 O(n)，O(1) 空间——比「先数长度 n 再走 n-k 步」更优雅（两次遍历合一）。

## 五、合并两个有序链表

```js
// 合并两个升序链表（LeetCode 21）
function mergeTwoLists(l1, l2) {
  const dummy = new ListNode(-1);   // 哨兵，统一头节点处理
  let tail = dummy;
  while (l1 && l2) {
    if (l1.val <= l2.val) { tail.next = l1; l1 = l1.next; }
    else { tail.next = l2; l2 = l2.next; }
    tail = tail.next;
  }
  tail.next = l1 || l2;              // 接上剩余
  return dummy.next;                 // 哨兵的下一个是真头
}
```

- **dummy 的作用**：避免「结果链为空时要初始化 head」和「后续追加」两套逻辑，统一成「往 tail 后接」。
- **复杂度**：O(n+m) 时间，O(1) 空间（只用常数指针，复用原节点）。
- **进阶**：合并 k 个有序链表（LeetCode 23）用小顶堆每次取最小节点，O(N log k)。

## 六、相交链表

两个单链表在某个节点合并为同一条后续（共享尾部），找这个交点（LeetCode 160）。

```js
function getIntersectionNode(headA, headB) {
  let a = headA, b = headB;
  // a 走完 A 链就跳到 B 链头，b 走完 B 链就跳到 A 链头
  while (a !== b) {
    a = a ? a.next : headB;   // a 到 null 跳到 headB
    b = b ? b.next : headA;   // b 到 null 跳到 headA
  }
  return a;  // 相遇点即交点（都走完 aLen+bLen 后对齐）
}
```

- **原理**：`a` 走完 `A` 跳到 `B`、`b` 走完 `B` 跳到 `A`，两者都走 `aLen + bLen` 步。因为共享尾部，走相同总步数后必然在交点（或同时到 null 表示不相交）——本质是**消除了长度差**。
- **复杂度**：O(m+n) 时间，O(1) 空间。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/link" target="_blank" rel="noopener noreferrer">链表可视化演示</a> —— 反转、环检测、合并的指针变化过程

## 下一步

经典算法解决「单次操作」问题，而**进阶操作**解决「带边界、带状态」的链表问题——虚拟头节点、删除倒数第 k、回文判定、LRU 双向链表，见[进阶操作](./advanced-operations)。
