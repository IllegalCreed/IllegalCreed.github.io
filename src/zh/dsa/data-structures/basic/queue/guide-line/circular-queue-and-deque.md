---
layout: doc
outline: [2, 3]
---

# 循环队列与双端队列：取模与双端操作

> 基于通用算法套路 · 核于 2026-07

## 速查

- **循环队列**：把数组视为首尾相接的环，下标推进用 `(i + 1) % capacity`——`rear` 到末尾绕回头部，复用 `front` 前的空间，**彻底解决假溢出**。
- **为何需要**：顺序队列（数组 + 头指针）出队后 `front` 前空间无法复用，会「有空却判满」（假溢出）；循环队列让 `rear` 绕回，零空间浪费（除判满策略）。
- **判空判满三种方式**：①**牺牲一个单元**——`rear==front` 空、`(rear+1)%capacity==front` 满（最常用，无额外变量，代价是一个空槽位）；②**计数器 `size`**——`size==0` 空、`size==capacity` 满（直白，容量用满）；③**标志位 `tag`**——记录最后一次是入还是出（少用判断但有状态）。
- **设计循环队列（LeetCode 622）**：固定 `capacity` 数组 + `front`/`rear` 指针，`enQueue`/`deQueue`/`Front`/`Rear`/`isEmpty`/`isFull` 六个方法——注意 `rear` 表示「下一个写入位置」，`Rear()` 要返回 `(rear-1+capacity) % capacity`。
- **双端队列（deque）**：两端都能 push/pop 的队列，四个操作全 O(1)——兼具栈和队列能力，是单调队列的底层容器。
- **单调队列（Monotonic Queue）**：维护一个「下标递增、对应值单调递减（或递增）」的 deque，队头恒是窗口最值——把「滑动窗口最大值」从 O(nk) 降到 **O(n)**（每个元素最多入队出队各一次）。
- **滑动窗口最大值（LeetCode 239）**：右扩右端进队（弹掉比它小的，保持递减）、左缩左端出队（队头下标超出窗口就弹）——队头即当前窗口最大值的下标。
- **复杂度**：循环队列 / deque 四个端操作 O(1)；单调队列每元素均摊 O(1)，整体 O(n)。
- **易错**：`rear` 的含义（下一个写位置 vs 最后一个元素位置）必须约定一致；取模运算注意负数（`(rear-1+capacity)%capacity`）；单调队列入队时「严格」还是「非严格」单调（有重复值时是否弹出相等元素）。

## 一、循环队列：取模的核心思想

回顾假溢出：顺序队列出队后 `front` 后移，`front` 前的空间成为「逻辑空洞」，`rear` 到了数组末尾就会越界，哪怕 `size < capacity`。循环队列的解法是让下标**取模回绕**：

```js
// 下标推进永远用取模，数组逻辑上首尾相接
rear = (rear + 1) % capacity;   // 写入后尾指针推进
front = (front + 1) % capacity; // 出队后头指针推进
```

这样 `rear` 走到 `capacity-1` 后，下一个位置不是 `capacity`（越界），而是绕回 `0`。整个数组形成一个环，`front` 前的空间被自然复用，假溢出消除。

### 几何直观

```
普通数组（线性）: [0][1][2][3][4]   rear 到 4 再 ++ 就越界

循环队列（环状）:     0
                   /     \
                  4       1
                   \     /
                    3 - 2
        rear 从 4 再 ++ 取模 = 0，绕回起点
```

## 二、判空判满的三种方式

环状结构带来一个微妙问题：**`front == rear` 既可能是空队列，也可能是满队列**（`rear` 追上了 `front`）。必须用额外手段区分，常见三种：

### 方式一：牺牲一个单元（最常用）

约定队列满时 `rear` 停在 `front` 的前一个位置，即**留一个空槽位不用**：

```js
isEmpty() { return this.front === this.rear; }
isFull()  { return (this.rear + 1) % this.capacity === this.front; }
```

- 容量为 `n` 的数组最多放 `n - 1` 个元素。
- 优点：无额外状态变量，逻辑最干净；缺点：浪费一个槽位。
- 这是最经典、面试默认的实现方式。

### 方式二：计数器 `size`

显式维护元素个数 `size`，直接用它判空判满：

```js
isEmpty() { return this.size === 0; }
isFull()  { return this.size === this.capacity; }
```

- 容量全用满（不浪费槽位）；代价是多维护一个 `int`（可忽略）。
- 直白易理解，工程代码常用。

### 方式三：标志位 `tag`

用一个布尔 `tag` 记录「最后一次操作是入队（true）还是出队（false）」：

```js
isEmpty() { return this.front === this.rear && !this.tag; }
isFull()  { return this.front === this.rear && this.tag; }
```

- 容量用满，无 `size` 计数器；但引入了状态，入队出队都要更新 `tag`，容易写错。
- 实际工程少用，但作为「三种方式」的知识点要能说出。

**选型建议**：日常首选「牺牲一个单元」（无状态、最经典）；需要满容量时用「计数器」；「标志位」了解即可。

## 三、设计循环队列（LeetCode 622）

完整实现（采用「牺牲一个单元」策略），约定 `rear` 为**下一个写入位置**：

```js
class MyCircularQueue {
  constructor(k) {
    // 牺牲 1 个单元：要放 k 个元素，数组开 k+1
    this.data = new Array(k + 1);
    this.capacity = k + 1;
    this.front = 0;          // 队头下标
    this.rear = 0;           // 下一个写入位置
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
  Front() {
    return this.isEmpty() ? -1 : this.data[this.front];
  }
  Rear() {
    // rear 是"下一个写位置"，最后一个元素在 rear-1（取模回绕）
    return this.isEmpty() ? -1 : this.data[(this.rear - 1 + this.capacity) % this.capacity];
  }
  isEmpty() { return this.front === this.rear; }
  isFull()  { return (this.rear + 1) % this.capacity === this.front; }
}
```

**两个高频坑**：
1. **`rear` 的含义**：是「下一个写入位置」还是「最后一个元素位置」？两种约定都行，但必须全局一致——本实现用「下一个写入位置」，所以 `Rear()` 要返回 `rear-1`（取模回绕）。
2. **取模负数**：`(rear - 1)` 在 `rear == 0` 时是 `-1`，`-1 % capacity` 在 JS 里是 `-1`（不是 `capacity-1`），必须写成 `(rear - 1 + capacity) % capacity`。

## 四、双端队列 deque

**双端队列（deque, Double-Ended Queue）**两端都能 push/pop，四个操作全 O(1)：

```js
// 循环数组实现 deque（骨架）
class MyDeque {
  constructor(capacity) {
    this.data = new Array(capacity);
    this.capacity = capacity;
    this.front = 0;
    this.rear = 0;
    this.size = 0;
  }
  pushBack(x) { /* 写 data[rear], rear=(rear+1)%cap, size++ */ }
  pushFront(x){ /* front=(front-1+cap)%cap, 写 data[front], size++ */ }
  popFront()  { /* 取 data[front], front=(front+1)%cap, size-- */ }
  popBack()   { /* rear=(rear-1+cap)%cap, 取 data[rear], size-- */ }
}
```

- **兼具栈和队列**：只用一端就是栈；rear 进 front 出就是队列。
- **底层实现**：固定容量用循环数组（零分配、缓存友好）；动态扩容用块状链表（C++ `std::deque` 是分块连续存储，兼顾随机访问与两端 O(1)）。
- **应用**：既能当栈又能当队列、**单调队列的底层容器**、工作窃取调度、回文判定（首尾双端比较）。

## 五、单调队列：滑动窗口最大值

**单调队列**是用 deque 维护一个「下标递增、对应值单调」的序列，使**队头恒是当前窗口的最值**。它能把「滑动窗口最值」从暴力 O(nk) 降到 **O(n)**。

### 题目（LeetCode 239）

给定数组 `nums` 和窗口大小 `k`，窗口从左端滑动到右端，返回每个窗口的最大值。

### 暴力 → 单调队列

- **暴力**：每个窗口扫一遍找最大，O(nk)（k 接近 n 时退化 O(n²)）。
- **单调队列**：维护一个**值单调递减**的 deque（存下标），队头恒是当前窗口最大值的下标。每个元素最多入队、出队各一次，整体 O(n)。

### 完整实现

```js
function maxSlidingWindow(nums, k) {
  const res = [];
  const deque = [];           // 存下标，对应 nums 值单调递减
  for (let i = 0; i < nums.length; i++) {
    // 1. 右扩：弹掉队尾所有比 nums[i] 小的（它们永远不可能再当最大值）
    while (deque.length && nums[deque[deque.length - 1]] <= nums[i]) {
      deque.pop();
    }
    deque.push(i);
    // 2. 左缩：队头下标超出窗口 [i-k+1, i] 就弹出
    if (deque[0] <= i - k) {
      deque.shift();
    }
    // 3. 窗口形成后（i >= k-1），队头即当前窗口最大值
    if (i >= k - 1) {
      res.push(nums[deque[0]]);
    }
  }
  return res;
}
```

### 为什么正确

- **入队弹尾**：新来的 `nums[i]` 比队尾大，队尾那些比它小的元素**永远不可能再成为任何未来窗口的最大值**（`nums[i]` 既更大又更晚离开窗口），直接弹出，保持 deque 值单调递减。
- **出队弹头**：队头下标若已落在窗口左边界之外（`deque[0] <= i - k`），它已离开当前窗口，必须弹出。
- **队头即最值**：经过上述两步，deque 的队头下标对应的值就是当前窗口 `[i-k+1, i]` 内最大的。
- **严格 vs 非严格**：用 `<=`（弹出相等的）得到**严格递减**（窗口内相等值只保留最右一个）；用 `<` 得到非严格递减（保留所有相等值）——两种都对，影响的是相同时刻出队顺序。

### 复杂度

每元素至多入队一次、出队（弹尾或弹头）一次，总操作 ≤ 2n，**整体 O(n)**，远优于暴力 O(nk)。

## 六、单调队列的扩展应用

单调队列不止用于「窗口最大值」，凡是「**滑动窗口 + 最值/计数**」类问题都能套用：

| 问题 | 单调性 | 队头含义 |
| --- | --- | --- |
| 滑动窗口最大值（239） | 值递减 | 窗口最大值下标 |
| 滑动窗口最小值 | 值递增 | 窗口最小值下标 |
| 绝对差不超过限制的最长子数组（1438） | 同时维护 max 队 + min 队 | 窗口 max-min ≤ limit |
| 跳跃游戏 IV 等状态 DP 优化 | 值递减 | 窗口内 DP 转移最大值 |

口诀：**「窗口内问最值 → 单调队列，O(n) 解决」**。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/queue" target="_blank" rel="noopener noreferrer">队列可视化演示</a> —— 循环队列的取模回绕与单调队列的窗口滑动

## 下一步

理解了循环队列与单调队列后，下一步看队列在工程中的核心应用——**BFS 层序遍历**（队列的灵魂应用）、**任务调度**与**生产者-消费者**，见[队列的工程应用](./guide-line/applications)。
