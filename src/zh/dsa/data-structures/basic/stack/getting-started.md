---
layout: doc
outline: [2, 3]
---

# 入门：后进先出、单端操作 O(1) 与两种实现

> 基于通用数据结构概念 · 核于 2026-07

## 速查

- **定义**：栈是**后进先出（LIFO）**的受限线性表，只允许在**栈顶**一端做插入（`push`）和删除（`pop`），最后压入的最先弹出。
- **核心操作 O(1)**：`push` 入栈、`pop` 出栈、`peek`/`top` 查看栈顶——都只碰栈顶一个元素，不搬移其他元素。
- **顺序栈（数组实现）**：用数组**尾部**当栈顶 + 一个 `top` 指针（指向栈顶下标）；`push` 是 `a[++top]=x`，`pop` 是 `top--`——缓存友好、实现最简。
- **链式栈（链表实现）**：用链表**头结点**当栈顶；`push` 是头插，`pop` 是头删——无容量上限（受内存限制）、无扩容开销。
- **栈溢出（Stack Overflow）**：顺序栈固定容量超容会溢出；更常见的是**函数调用栈溢出**——递归太深/无限递归把固定大小的调用栈撑爆。
- **函数调用栈**：每次函数调用压栈（保存返回地址、参数、局部变量），返回时弹栈——这是递归可用的物理基础，也是递归深度受限的原因。
- **与队列对比**：栈 LIFO（单端）、队列 FIFO（双端：队尾进、队头出）；栈适合「回溯/撤销/嵌套」，队列适合「排队/调度/BFS」。
- **JS 数组当栈**：`push`（尾部追加）+ `pop`（尾部弹出）天然就是栈操作，摊还 O(1)；`peek` 用 `a[a.length-1]`。
- **复杂度**：`push`/`pop`/`peek`/判空 均 **O(1)**；遍历 O(n)；不支持随机访问（要 O(k) 弹出 k 个才能看到第 k 个）。
- **进阶顺序**：[栈的经典应用](./guide-line/classic-applications) → [单调栈](./guide-line/monotonic-stack) → [参考](./reference)。

## 一、LIFO：栈的唯一规则

栈的全部特性都来自一个约束：**只能在一端（栈顶）操作**。这个约束带来三个直接推论：

1. **后进先出**：最后 `push` 的元素一定最先 `pop`——顺序与入栈顺序相反。把 `1,2,3` 依次入栈再全部出栈，得到 `3,2,1`。
2. **操作全部 O(1)**：`push`/`pop`/`peek` 都只动栈顶一个位置，不需要遍历、不需要搬移——这是 LIFO 受限换来的效率。
3. **访问受限**：想看栈顶下方的元素，必须先把上面的弹掉——所以栈不能随机访问，不是「通用容器」，而是为特定语义（回溯、撤销、嵌套）设计的专用结构。

```
入栈 push 1,2,3：       出栈 pop：3 → 2 → 1
   | 3 |  ← 栈顶            | 1 |  ← 栈底
   | 2 |                    |   |
   | 1 |  ← 栈底            |   |
   +---+                    +---+
```

## 二、核心操作与复杂度

| 操作 | 复杂度 | 说明 |
| --- | --- | --- |
| `push(x)` 入栈 | **O(1)** | 写入栈顶位置，`top` 上移 |
| `pop()` 出栈 | **O(1)** | 读出栈顶元素，`top` 下移 |
| `peek()`/`top()` 查看栈顶 | **O(1)** | 只读不删 |
| `isEmpty()` 判空 | **O(1)** | `top === -1` 或 `head === null` |
| `size()` 元素个数 | **O(1)** | 维护计数或 `top+1` |
| 访问第 k 个元素 | O(k) | 必须先弹出 k-1 个 |
| 查找特定值 | O(n) | 要遍历（弹出再压回，或破坏性遍历） |

记住一句话：**「LIFO ⇒ 只动栈顶 ⇒ O(1)」**，所有特性都是这条链的推论。

## 三、顺序栈：数组实现

用数组的**尾部**当栈顶，维护一个 `top` 指针（指向栈顶元素下标，空栈时 `top = -1`）。

```js
class ArrayStack {
  constructor(capacity = 16) {
    this.data = new Array(capacity);
    this.top = -1;            // 空栈：top = -1
  }
  push(x) {
    if (this.top + 1 === this.data.length) this.resize(); // 满则扩容
    this.data[++this.top] = x;  // 先 ++top 再写入
  }
  pop() {
    if (this.top === -1) throw new Error('stack empty');
    return this.data[this.top--]; // 先取出再 --top
  }
  peek() { return this.data[this.top]; }
  isEmpty() { return this.top === -1; }
  size() { return this.top + 1; }
  resize() { this.data = this.data.concat(new Array(this.data.length)); } // ×2
}
```

顺序栈的优点是**缓存友好**（数组连续内存）和**实现最简**；缺点是固定容量实现会**栈溢出**，动态数组实现有**扩容开销**（摊还 O(1)）。

## 四、链式栈：链表实现

用链表的**头结点**当栈顶——`push` 是头插（新节点指向当前头），`pop` 是头删（头改为头的 next）。

```js
class Node { constructor(val) { this.val = val; this.next = null; } }

class LinkedStack {
  constructor() { this.head = null; this.count = 0; }
  push(x) {                  // 头插：O(1)
    const node = new Node(x);
    node.next = this.head;
    this.head = node;
    this.count++;
  }
  pop() {                    // 头删：O(1)
    if (!this.head) throw new Error('stack empty');
    const val = this.head.val;
    this.head = this.head.next;
    this.count--;
    return val;
  }
  peek() { return this.head ? this.head.val : null; }
  isEmpty() { return this.head === null; }
  size() { return this.count; }
}
```

链式栈的优点是**无固定容量上限**（受限于内存，不会栈溢出）、**无扩容开销**；缺点是每节点多一个指针的内存开销，且节点分散缓存不友好。

**怎么选**：日常用顺序栈（数组），简单且缓存友好；元素大小不确定或频繁扩容敏感时用链式栈。

## 五、栈溢出：函数调用栈

栈溢出（Stack Overflow）有两层含义：

1. **顺序栈容量溢出**：固定容量数组实现的栈，`push` 时 `top+1 === capacity` 且不扩容就会越界——工程里少见，因为一般用动态扩容。
2. **函数调用栈溢出（更常见）**：程序运行时有一块**固定大小**的栈内存（如 Linux 默认 8MB）用于函数调用。每次调用压栈（返回地址、参数、局部变量），返回弹栈。**递归太深**或**无限递归**会把这块固定栈撑爆，抛出 StackOverflowError（Java）/ Segmentation fault（C）/ RangeError（JS）。

```js
function inf() { return inf(); }   // 无限递归 → RangeError: Maximum call stack size exceeded
inf();
```

这也是为什么递归要写**终止条件**、深度大时要改**迭代（显式用栈）**——把系统隐式的调用栈换成自己控制的堆上栈，突破固定大小限制。

## 六、函数调用栈：递归的物理基础

函数调用栈是栈最重要的「系统级应用」。每次函数调用，系统在调用栈上压入一个**栈帧（stack frame）**：

```
栈帧内容：局部变量 | 参数 | 返回地址 | 保存的寄存器
调用 f()：push 栈帧
返回：pop 栈帧，跳到返回地址
```

**递归**本质就是：每次递归调用压一个栈帧，最深那次在栈顶，逐层返回时弹栈——所以递归的「回溯」过程天然就是「栈的弹出顺序」。理解这点后：

- 递归的**最大深度** = 调用栈的最大深度，受栈大小限制。
- 任何递归都能改成**迭代 + 显式栈**：自己用一个栈模拟调用栈的压栈/弹栈。
- DFS（深度优先搜索）天然用栈（递归隐式用调用栈，或显式用栈迭代）。

## 七、与队列对比

栈和队列都是「受限的线性表」，但限制方向相反：

| 维度 | 栈（Stack） | 队列（Queue） |
| --- | --- | --- |
| 规则 | **LIFO** 后进先出 | **FIFO** 先进先出 |
| 操作端 | **单端**（栈顶） | **双端**（队尾入、队头出） |
| 核心操作 | push/pop/peek 均 O(1) | enqueue/dequeue 均 O(1) |
| 语义 | 回溯、撤销、嵌套 | 排队、调度、BFS |
| 典型应用 | 函数调用栈、括号匹配、DFS | 任务调度、消息队列、BFS |

**用两个栈可以实现一个队列**（见[经典应用](./guide-line/classic-applications)里的浏览器模型同理）：一个输入栈、一个输出栈，均摊 O(1)——这是面试经典题。

## 八、JS 数组当栈

JavaScript 的 `Array` 天然支持栈操作——`push`（尾部追加）和 `pop`（尾部弹出）就是 `push`/`pop`，摊还 O(1)：

```js
const stack = [];
stack.push(1);              // [1]
stack.push(2);              // [1, 2]
stack.push(3);              // [1, 2, 3]
stack.pop();                // 3（返回弹出值）
stack[stack.length - 1];    // 2（peek，查看栈顶）
stack.length === 0;         // false（判空）
```

日常 JS 里写栈，**直接用数组的 `push`/`pop`** 即可，无需封装。注意：`shift`/`unshift`（头部操作）是 O(n)，**不要**用它们当栈——栈操作必须在尾部。

## 下一步

理解了栈的 LIFO 本质与两种实现后，下一步是栈最高频的应用场景——**括号匹配、表达式求值、函数调用栈**，它们把 LIFO 的「配对」「回溯」语义发挥到极致，见[栈的经典应用](./guide-line/classic-applications)。
