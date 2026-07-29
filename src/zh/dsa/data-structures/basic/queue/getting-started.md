---
layout: doc
outline: [2, 3]
---

# 入门：FIFO、入队出队与循环队列

> 基于通用数据结构概念 · 核于 2026-07

## 速查

- **定义**：队列是**先进先出（FIFO）**的受限线性表——只能在**队尾（rear）入队 `enqueue`**、**队头（front）出队 `dequeue`**，保证「先来先服务」。
- **核心复杂度**：`enqueue` / `dequeue` / `peek`（查看队头）**全部 O(1)**——这是队列区别于数组（头删 O(n)）的核⼼优势。
- **顺序队列（数组实现）**：用数组 + `front` 头指针 + `rear` 尾指针；入队 `a[rear++] = x`，出队 `front++`。问题：`front` 后移后前面的空间浪费，会「有空却判满」——**假溢出**。
- **链式队列（链表实现）**：用带**头尾两个指针**的单链表；入队 `tail.next = node; tail = node`，出队 `head = head.next`。优势：天然动态扩容、无假溢出；代价：每节点多一个指针。
- **循环队列**：把数组视为**首尾相接的环**，下标用 `(i + 1) % capacity` 推进——`rear` 走到末尾绕回头部，复用 `front` 前的空间，彻底解决假溢出。
- **判空判满三种方式**：①**牺牲一个单元**（`(rear+1) % capacity == front` 判满，`rear == front` 判空，最常用）；②**计数器 `size`**（`size == 0` 空、`size == capacity` 满）；③**标志位 `tag`**（记录最后一次是入还是出）。
- **双端队列（deque）**：两端都能入队出队的队列——兼具栈和队列的能力，`push/pop` 与 `shift/unshift` 都 O(1)（底层循环数组或块状链表）。
- **队列 vs 栈**：队列 **FIFO**（一头进一头出）、栈 **LIFO**（同端进出）；队列用双指针（front/rear），栈只需一个栈顶指针。
- **假溢出 vs 真溢出**：真溢出是容量真满了（`size == capacity`）；假溢出是 `front` 前有空却 `rear` 到了末尾——循环队列把假溢出消除，真溢出靠扩容。
- **工程实现取舍**：固定大小 / 高性能场景用循环数组（零分配）；大小不确定 / 频繁增删用链式（无上限但每节点多指针）；既要两端 O(1) 又要随机访问用 `deque`。
- **JS 数组的坑**：JS 没有内建队列类型，用 `Array` 的 `push` + `shift` 模拟，但 **`shift()` 是 O(n)**（整体搬移）——高频队列必须用循环数组或链表自实现，或用库（`denque`）。
- **进阶顺序**：[循环队列与双端队列](./guide-line/circular-queue-and-deque) → [队列的工程应用](./guide-line/applications) → [参考](./reference)。

## 一、FIFO：队列的核心语义

队列的「先进先出」是一种**受限**——它刻意牺牲了「任意位置操作」的能力，换取两端操作的高效与公平。这种限制带来的语义是「按到达顺序处理」，这正是大量现实与算法场景的天然需求：

```
入队 enqueue    → [ A, B, C, D ] →    出队 dequeue
     rear                              front
   （队尾）                            （队头）
```

- 先入队的 `A` 一定先出队——这就是 FIFO。
- 任何时候只能看/动两端：入队在 rear、出队在 front，**中间元素碰不到**（这是与数组/链表的核心差异）。
- 这套语义天然匹配「先到先服务」的任务调度、BFS 的「按层扩展」、缓冲区的「按序消费」。

## 二、核心操作与复杂度

| 操作 | 描述 | 复杂度 |
| --- | --- | --- |
| `enqueue(x)` | 在队尾 rear 插入 x | **O(1)** |
| `dequeue()` | 移除并返回队头 front 元素 | **O(1)** |
| `peek()` / `front()` | 查看队头元素（不移除） | **O(1)** |
| `isEmpty()` | 判空 | O(1) |
| `size()` | 元素个数 | O(1) |

记住一句话：**队列两端操作全 O(1)，但代价是不能随机访问中间元素**——它是「只关心两端顺序」场景的最优解。

## 三、顺序队列：数组 + 头指针

最朴素的实现是用一个数组，维护 `front`（队头下标）和 `rear`（队尾下标，或下一个写入位置）：

```js
class ArrayQueue {
  constructor(capacity) {
    this.data = new Array(capacity);
    this.front = 0;   // 队头下标
    this.rear = 0;    // 下一个写入位置
    this.size = 0;
  }
  enqueue(x) {
    if (this.size === this.data.length) throw new Error('full');
    this.data[this.rear] = x;
    this.rear++;            // 尾指针后移
    this.size++;
  }
  dequeue() {
    if (this.size === 0) throw new Error('empty');
    const x = this.data[this.front];
    this.front++;           // 头指针后移（元素逻辑出队）
    this.size--;
    return x;
  }
}
```

出队 `front++` 不搬移数据（O(1)），但留下了致命问题——**假溢出**。

### 假溢出（False Overflow）

设想容量为 5 的队列，依次入队 A B C D，再出队 A B（`front` 走到 2），再入队 E：

```
[ -, -, C, D, E ]   front=2, rear=5, size=3
容量 5，size=3 明明有空（下标 0、1），但 rear=5 已到末尾——再 enqueue 就报"满了"！
```

这就是假溢出：**物理上没满（`size < capacity`），逻辑上下标却越界**。解决之道就是把数组「首尾相接」变成循环队列。

## 四、链式队列：链表 + 头尾指针

用带**头指针 `head` 和尾指针 `tail`** 的单链表实现队列，入队在 tail 后接节点，出队把 head 后移：

```js
class LinkedQueue {
  constructor() { this.head = this.tail = null; this.size = 0; }
  enqueue(x) {
    const node = { val: x, next: null };
    if (this.tail) this.tail.next = node; else this.head = node;
    this.tail = node;
    this.size++;
  }
  dequeue() {
    if (!this.head) throw new Error('empty');
    const x = this.head.val;
    this.head = this.head.next;     // 头指针后移，旧节点被 GC
    if (!this.head) this.tail = null; // 队列空了，尾指针也清空
    this.size--;
    return x;
  }
}
```

- **优势**：天然动态扩容（无上限）、无假溢出（`front` 前的节点直接被 GC，不存在「下标越界」概念）。
- **代价**：每个节点多存一个 `next` 指针（内存开销）、节点分散导致缓存不友好（顺序访问比数组慢）。

## 五、循环队列：取模解决假溢出

把数组视为**首尾相接的环**——`rear` 走到末尾就绕回 0，下标推进用 `(i + 1) % capacity`。这样 `front` 前的空间被自然复用，假溢出消除。

```
容量 5 的循环队列，size=3 时可能长这样（rear 绕回了头部）：

     rear
      ↓
[ E, -, -, C, D ]
        ↑
       front

enqueue(E) 写在 rear=0 位置，然后 rear = (0+1) % 5 = 1
```

### 判空判满的三种方式

循环队列最微妙之处是**判空判满**——因为环状结构下 `front == rear` 既可能是空也可能是满，需要额外手段区分：

| 方式 | 判空 | 判满 | 说明 |
| --- | --- | --- | --- |
| **牺牲一个单元**（最常用） | `rear == front` | `(rear+1) % capacity == front` | 容量 n 的数组最多放 n-1 个元素；最经典，无额外变量 |
| **计数器 `size`** | `size == 0` | `size == capacity` | 直白，容量全用满；多维护一个 int |
| **标志位 `tag`** | `rear == front && !tag` | `rear == front && tag` | `tag` 记录最后一次是入(1)还是出(0)；少用一个判断但有状态 |

日常首选「牺牲一个单元」——它不引入额外状态变量，逻辑最干净（代价仅是一个空槽位）。详细实现见[循环队列与双端队列](./guide-line/circular-queue-and-deque)。

## 六、双端队列 deque

**双端队列（Double-Ended Queue, deque）**两端都能入队出队——兼具栈（一端进出）和队列（一端进一端出）的能力：

```
push  → [ A, B, C ] ← push
pop   ←             →  pop   （两端都能 push / pop）
```

- 四个核心操作 `pushFront / pushBack / popFront / popBack` 全 O(1)。
- 底层实现：**循环数组**（固定容量、缓存友好）或**块状链表**（动态扩容、C++ `std::deque` 用分块连续存储兼顾两者）。
- 应用：既能当栈又能当队列、**单调队列的底层容器**（滑动窗口最大值）、工作窃取调度。
- 各语言：C++ `std::deque`、Java `ArrayDeque` / `LinkedList`（实现 `Deque` 接口）、Python `collections.deque`（双向链表块，`popleft` O(1)）、JS 无内建（需自实现或用库）。

## 七、队列 vs 栈

| 维度 | 队列 | 栈 |
| --- | --- | --- |
| 顺序 | **FIFO**（先进先出） | **LIFO**（后进先出） |
| 操作端 | 两端（rear 入 / front 出） | 单端（栈顶入且出） |
| 指针 | `front` + `rear` 双指针 | 单个 `top` 栈顶指针 |
| 典型应用 | BFS、任务调度、缓冲 | DFS（函数调用栈）、括号匹配、撤销 |
| 复杂度 | 两端操作 O(1) | 栈顶操作 O(1) |

两者都是「受限线性表」，只是限制方式不同：队列限制在两端各取一个方向，栈限制在同一端进出。**「队列是横着走的栈、栈是竖着走的队列」**——选型看「先进先出」还是「后进先出」。

## 下一步

理解了 FIFO、入队出队与循环队列的取模后，下一步深入循环队列的**判空判满细节**与**单调队列**这一高频套路——它把「滑动窗口最值」从 O(nk) 降到 O(n)，见[循环队列与双端队列](./guide-line/circular-queue-and-deque)。
