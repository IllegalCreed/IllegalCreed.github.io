---
layout: doc
outline: [2, 3]
---

# 参考：队列 API、复杂度与应用速查

> 基于通用数据结构概念 · 核于 2026-07

## 速查

- **定义**：先进先出（FIFO）的受限线性表，队尾入、队头出。
- **核心复杂度**：`enqueue` / `dequeue` / `peek` **全部 O(1)**；不能随机访问中间元素。
- **顺序队列**：数组 + `front`/`rear` 指针；有**假溢出**（`front` 前空间浪费）——用循环队列解决。
- **链式队列**：链表 + 头尾指针；无假溢出、动态扩容，但每节点多一个指针、缓存不友好。
- **循环队列**：下标 `(i+1)%capacity` 取模回绕，判空判满三种方式（牺牲单元/计数器/标志位）。
- **双端队列 deque**：两端都能 push/pop，全 O(1)；兼具栈和队列能力，是单调队列底层容器。
- **单调队列**：值单调的 deque，队头恒是窗口最值——滑动窗口最大值 O(n)。
- **BFS**：队列的灵魂应用，按层扩展，O(V+E)；JS 用 `i++` 模拟出队避免 `shift()` 的 O(n)。
- **优先队列**：按优先级出队，底层堆，入队出队 O(log n)。
- **生产者-消费者**：阻塞队列，满则生产者阻塞、空则消费者阻塞；消息队列是其分布式版。
- **JS 事件循环**：宏任务队列 + 微任务队列，微任务每轮宏任务后全部清空，优先级更高。
- **交互演示**：[队列可视化](https://algo.illegalscreed.cn/docs/queue)。

## 一、核心复杂度表

| 操作 | 最好 | 平均 | 最坏 | 说明 |
| --- | --- | --- | --- | --- |
| `enqueue(x)` 入队 | O(1) | O(1) | O(1) | 队尾写入 |
| `dequeue()` 出队 | O(1) | O(1) | O(1) | 队头移除 |
| `peek()` 查看队头 | O(1) | O(1) | O(1) | 不移除 |
| `isEmpty()` 判空 | O(1) | O(1) | O(1) | — |
| `size()` 元素数 | O(1) | O(1) | O(1) | — |
| 按下标访问 `q[i]` | O(n) | O(n) | O(n) | 不支持，要遍历 |
| 优先队列 enqueue | O(1) | O(log n) | O(log n) | 堆向上调整 |
| 优先队列 dequeue | O(log n) | O(log n) | O(log n) | 堆向下调整 |

## 二、各语言队列对照

| 语言 | 普通队列类型 | 双端队列 | 备注 |
| --- | --- | --- | --- |
| C++ | `std::queue<T>`（默认基于 `deque`） | `std::deque<T>` | `queue` 是容器适配器，底层可换 `deque`/`list` |
| Java | `ArrayDeque` / `LinkedList`（实现 `Queue`） | `ArrayDeque` / `LinkedList`（实现 `Deque`） | `ArrayDeque` 用循环数组，比 `LinkedList` 快，推荐 |
| JavaScript | 无内建（`Array` 的 `push`+`shift`） | 无内建 | **`shift()` 是 O(n) 陷阱**，高频队列自实现或用 `denque` 库 |
| Python | `collections.deque` | `collections.deque` | 双向链表块，`popleft`/`appendleft` 都 O(1) |
| Go | 无内建（用切片或 `container/list`） | `container/list`（双向链表） | 切片 `front++` 模拟出队，或自实现循环队列 |

### JS 数组的 `shift()` 陷阱

```js
const q = [];
q.push(1); q.push(2);    // 入队 O(1)
q.shift();               // 出队 —— O(n)！整体前移
// 大量 shift 会退化成 O(n²)，必须改用循环数组或链表自实现
```

**正确做法**：用 `let i = 0` 配合 `q[i++]` 模拟出队（BFS 常用），或自实现循环队列：

```js
// BFS 中用索引模拟出队，避免 shift() 的 O(n)
const queue = [start];
let head = 0;
while (head < queue.length) {
  const node = queue[head++]; // O(1) "出队"
  // ...处理 node，邻居 push 入队
}
```

## 三、循环队列判空判满速查

| 方式 | 判空 | 判满 | 容量利用率 | 备注 |
| --- | --- | --- | --- | --- |
| 牺牲一个单元 | `front === rear` | `(rear+1)%cap === front` | n-1 / n | 最常用，无额外变量 |
| 计数器 `size` | `size === 0` | `size === cap` | n / n | 直白，容量全用满 |
| 标志位 `tag` | `front===rear && !tag` | `front===rear && tag` | n / n | 少用判断但有状态 |

## 四、循环队列完整实现（牺牲一个单元）

```js
class MyCircularQueue {
  constructor(k) {
    this.data = new Array(k + 1);   // 牺牲 1 单元：开 k+1
    this.capacity = k + 1;
    this.front = 0;                  // 队头下标
    this.rear = 0;                   // 下一个写入位置
  }
  enQueue(x) {
    if (this.isFull()) return false;
    this.data[this.rear] = x;
    this.rear = (this.rear + 1) % this.capacity;
    return true;
  }
  deQueue() {
    if (this.isEmpty()) return false;
    this.front = (this.front + 1) % this.capacity;
    return true;
  }
  Front() { return this.isEmpty() ? -1 : this.data[this.front]; }
  Rear() {
    return this.isEmpty() ? -1 : this.data[(this.rear - 1 + this.capacity) % this.capacity];
  }
  isEmpty() { return this.front === this.rear; }
  isFull()  { return (this.rear + 1) % this.capacity === this.front; }
}
```

## 五、单调队列：滑动窗口最大值

```js
function maxSlidingWindow(nums, k) {
  const res = [];
  const deque = [];                 // 存下标，nums 值单调递减
  for (let i = 0; i < nums.length; i++) {
    // 1. 弹尾：比 nums[i] 小的永远当不了最大值
    while (deque.length && nums[deque[deque.length - 1]] <= nums[i]) deque.pop();
    deque.push(i);
    // 2. 弹头：队头超出窗口
    if (deque[0] <= i - k) deque.shift();
    // 3. 队头即最大值
    if (i >= k - 1) res.push(nums[deque[0]]);
  }
  return res;
} // O(n)，每元素入队出队各一次
```

## 六、BFS 层序遍历框架

```js
function levelOrder(root) {
  if (!root) return [];
  const res = [], queue = [root];
  let head = 0;                     // 索引模拟出队，避免 shift() 的 O(n)
  while (head < queue.length) {
    const level = [], n = queue.length;
    for (let i = head; i < n; i++) {
      const node = queue[head++];
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    res.push(level);
  }
  return res;
}
```

## 七、易错点清单

- **JS `shift()` 是 O(n)**：用 `Array` 模拟队列大量 `shift` 会退化 O(n²)；改用 `head++` 索引或循环数组。
- **循环队列 `rear` 含义不统一**：是「下一个写位置」还是「最后元素位置」必须全局一致；`Rear()` 返回时要算 `rear-1`。
- **取模负数**：`(rear - 1) % cap` 在 `rear == 0` 时 JS 得 `-1`，必须写 `(rear - 1 + cap) % cap`。
- **牺牲一个单元容量记错**：要放 `k` 个元素数组开 `k + 1`，不是 `k`。
- **BFS 标记时机**：必须在**入队时**标记 visited，不是出队时——否则同一节点会被多次入队（OOM/超时）。
- **BFS 按层忘了记录层大小**：`const n = queue.length` 要在 while 开始时取，内层 for 处理恰好一层。
- **假溢出与真溢出混淆**：假溢出是 `front` 前有空却 `rear` 到末尾（循环队列解决）；真溢出是 `size == capacity`（要扩容）。
- **循环队列用计数器判满时忘更新 `size`**：入队 `size++`、出队 `size--` 必须成对。
- **优先队列误用普通队列复杂度**：优先队列出队是 O(log n) 不是 O(1)，Dijkstra 的总复杂度是 O((V+E)log V)。
- **单调队列严格性**：`<=`（弹相等）得严格递减，`<`（留相等）得非严格——两种都对，但影响相同时刻出队顺序。

## 八、进阶方向（链接其他叶）

- **数组**：循环队列的底层载体 —— 见[数组](../../array/) 叶
- **链表**：链式队列的实现 —— 见[链表](../../linked-list/) 叶
- **栈**：队列的 LIFO 镜像（两个栈可实现队列）—— 见[栈](../../stack/) 叶
- **堆**：优先队列的底层 —— 见[堆](../../../advanced/heap/) 叶
- **图遍历**：BFS 的主战场 —— 见[图的 BFS/DFS](../../../graph/dfs-bfs/) 叶

## 权威链接

- [队列 - 维基百科](https://zh.wikipedia.org/wiki/%E9%98%9F%E5%88%97)
- [Queue (abstract data type) - Wikipedia](https://en.wikipedia.org/wiki/Queue_(abstract_data_type))
- [Circular Queue - GeeksforGeeks](https://www.geeksforgeeks.org/circular-queue/)
- [Sliding Window Maximum - LeetCode 239](https://leetcode.com/problems/sliding-window-maximum/)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/queue" target="_blank" rel="noopener noreferrer">队列可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/queue-slide/" target="_blank">队列</a>
