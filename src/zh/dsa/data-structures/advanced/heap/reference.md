---
layout: doc
outline: [2, 3]
---

# 参考：堆 API、操作与复杂度速查

> 基于通用数据结构概念 · 核于 2026-07

## 速查

- **定义**：完全二叉树 + 堆序性（父 ≥/≤ 子）；大根堆堆顶最大，小根堆堆顶最小。
- **数组表示**：根在下标 0；父 `(i-1)>>1`、左子 `(i<<1)+1`、右子 `(i<<1)+2`——O(1) 算术运算，无指针。
- **核心复杂度**：取堆顶 **O(1)**；插入 / 删堆顶 **O(log n)**；建堆 **O(n)**（Floyd）；查任意值 **O(n)**。
- **sift up**：插入追加尾部后，与父比较不合法就交换、逐层上浮到根——O(log n)。
- **sift down**：删堆顶尾部补顶后，与较大（大根）/ 较小（小根）子比较下沉——O(log n)。
- **建堆 O(n)**：从最后一个非叶节点 `(n>>1)-1` 自底向下逐个 sift down——叶子层不调整，求和收敛 O(n)。
- **堆 vs BST**：堆取极值 O(1)、查任意值 O(n)、中序无序；BST 取极值 O(log n)、查任意值 O(log n)、中序有序。
- **Top-K**：前 K 大用大小 K 的**小根堆**（堆顶是门槛），O(n log K) 时间 O(K) 空间。
- **优先队列**：入队 push O(log n)、出队 pop O(log n)、查队首 O(1)——堆是标准实现。
- **JS 无原生堆**：手写或用 `heap-js`；Java `PriorityQueue`、C++ `priority_queue`、Python `heapq`。
- **交互演示**：[堆可视化](https://algo.illegalscreed.cn/docs/heap)。

## 一、核心复杂度表

| 操作 | 最好 | 平均 | 最坏 | 说明 |
| --- | --- | --- | --- | --- |
| 取堆顶（peek） | O(1) | O(1) | O(1) | 返回 `heap[0]` |
| 插入（push） | O(1) | O(log n) | O(log n) | 追加 + sift up |
| 删除堆顶（pop） | O(log n) | O(log n) | O(log n) | 尾补顶 + sift down |
| 建堆（buildHeap） | O(n) | O(n) | O(n) | Floyd 自底向下 |
| 删除非堆顶 | O(log n) | O(n) | O(n) | 先 O(n) 定位 |
| 查找任意值 | O(1) | O(n) | O(n) | 中间无序 |
| 合并两堆 | O(n) | O(n) | O(n) | 重建 |

## 二、数组下标映射速查

```
根节点下标：0
下标 i 的父节点：    (i - 1) >> 1   即 Math.floor((i-1)/2)
下标 i 的左子节点：  (i << 1) | 1   即 2*i + 1
下标 i 的右子节点：  (i << 1) + 2   即 2*i + 2
最后一个非叶节点：   (n >> 1) - 1   即 Math.floor(n/2) - 1
```

位运算版本（`>> 1`、`<< 1`）比除法/乘法略快，等价于整除/乘 2。

## 三、sift up 代码模板（大根堆）

```js
// 大根堆 sift up：下标 i 的元素上浮到合法位置
function siftUp(heap, i) {
  while (i > 0) {
    const parent = (i - 1) >> 1;
    if (heap[i] <= heap[parent]) break;   // 父 ≥ 子，满足大根堆
    [heap[i], heap[parent]] = [heap[parent], heap[i]];
    i = parent;
  }
}

// 小根堆只需把 <= 改成 >=：if (heap[i] >= heap[parent]) break;
```

## 四、sift down 代码模板（大根堆）

```js
// 大根堆 sift down：下标 i 的元素下沉到合法位置，n 为有效长度
function siftDown(heap, i, n) {
  while (true) {
    let largest = i;
    const l = 2 * i + 1, r = 2 * i + 2;
    if (l < n && heap[l] > heap[largest]) largest = l;
    if (r < n && heap[r] > heap[largest]) largest = r;
    if (largest === i) break;             // 已是三者最大
    [heap[i], heap[largest]] = [heap[largest], heap[i]];
    i = largest;
  }
}

// 小根堆：找三者最小，> 改 <（let smallest = i; if (... < ...)）
```

## 五、插入 / 删除 / 建堆代码

```js
// 插入：追加尾部 + sift up
function push(heap, x) {
  heap.push(x);
  siftUp(heap, heap.length - 1);
}

// 删除堆顶：保存顶、尾补顶、sift down
function pop(heap) {
  const top = heap[0];
  const last = heap.pop();        // 先取出尾部
  if (heap.length > 0) {
    heap[0] = last;               // 尾部补到堆顶
    siftDown(heap, 0, heap.length);
  }
  return top;
}

// 建堆（Floyd O(n)）：从最后一个非叶节点自底向下 sift down
function buildHeap(heap) {
  const n = heap.length;
  for (let i = (n >> 1) - 1; i >= 0; i--) siftDown(heap, i, n);
}
```

## 六、完整小根堆类（JS 手写模板）

```js
// 可比较的小根堆（默认 a-b，传比较函数可灵活切换大小根）
class MinHeap {
  constructor(cmp = (a, b) => a - b) { this.h = []; this.cmp = cmp; }
  size() { return this.h.length; }
  peek() { return this.h[0]; }
  push(x) {
    this.h.push(x);
    for (let i = this.h.length - 1, p; i > 0; i = p) {
      p = (i - 1) >> 1;
      if (this.cmp(this.h[i], this.h[p]) >= 0) break;
      [this.h[i], this.h[p]] = [this.h[p], this.h[i]];
    }
  }
  pop() {
    const top = this.h[0], last = this.h.pop();
    if (this.h.length > 0) {
      this.h[0] = last;
      const n = this.h.length;
      for (let i = 0; ;) {
        let m = i, l = 2*i+1, r = 2*i+2;
        if (l < n && this.cmp(this.h[l], this.h[m]) < 0) m = l;
        if (r < n && this.cmp(this.h[r], this.h[m]) < 0) m = r;
        if (m === i) break;
        [this.h[i], this.h[m]] = [this.h[m], this.h[i]]; i = m;
      }
    }
    return top;
  }
}
```

## 七、各语言堆实现对照

| 语言 | 类型 / 模块 | 默认序 | 典型 API |
| --- | --- | --- | --- |
| Java | `PriorityQueue<T>` | 小根堆 | `add` / `poll` / `peek` |
| C++ | `std::priority_queue<T>` | 大根堆 | `push` / `pop` / `top` |
| C++ | `std::make_heap` 系列 | 大根堆 | 操作 `vector` 原地 |
| Python | `heapq`（操作 `list`） | 小根堆 | `heappush` / `heappop` / `heapify` |
| Go | `container/heap` | 自定义 | 实现 `heap.Interface` |
| Rust | `std::collections::BinaryHeap` | 大根堆 | `push` / `pop` / `peek` |
| JavaScript | 无原生 | — | 手写或用 `heap-js` |

```python
# Python heapq（小根堆）速查
import heapq
heap = []
heapq.heappush(heap, 3)          # 入堆
heapq.heappush(heap, 1)
heapq.heappop(heap)              # 弹出最小（1）
heapq.heapify(arr)               # 原地建堆 O(n)
# 大根堆技巧：存负值
heapq.heappush(heap, -val)
```

## 八、Top-K 模板（小根堆求前 K 大）

```js
// 求数组前 K 大元素：维护大小 K 的小根堆
function topKLargest(arr, k) {
  const heap = [];
  for (const x of arr) {
    pushMin(heap, x);                 // 入小根堆
    if (heap.length > k) popMin(heap); // 超容弹出最小（堆顶门槛）
  }
  return heap; // 剩下的 K 个即前 K 大
}
// 求前 K 小则用大根堆（堆顶是 K 个里的最大门槛）
```

```python
# Python heapq 的 nlargest / nsmallest 就是堆实现
import heapq
heapq.nlargest(3, arr)   # 前 3 大
heapq.nsmallest(3, arr)  # 前 3 小
```

## 九、堆 vs BST 对照

| 维度 | 堆 | BST（平衡） |
| --- | --- | --- |
| 结构 | 完全二叉树 | 任意形状 |
| 值约束 | 父 ≥/≤ 子（部分序） | 左 < 根 < 右（全序） |
| 取最值 | **O(1)** | O(log n) |
| 查任意值 | O(n) | **O(log n)** |
| 插入/删除 | O(log n) | O(log n) |
| 中序遍历 | 无序 | **有序** |
| 典型用途 | 优先队列、Top-K | 字典、范围查询 |

## 十、易错点清单

- **删堆顶顺序错**：要先 `pop()` 取出尾部，判空，再补顶下沉；直接 `heap[0]=heap[len-1]` 再 `pop()` 会多删一个。
- **建堆从 0 开始 sift down**：应从最后一个非叶节点 `(n>>1)-1` **自底向下**；从根开始会让子树未成堆时 sift down 失效。
- **误以为建堆是 O(n log n)**：Floyd 建堆是 **O(n)**（叶子层不调整，求和收敛）；逐个插入才是 O(n log n)。
- **求前 K 大用大根堆**：错。应**小根堆**（堆顶是 K 个里的最小门槛），大根堆堆顶是最大，无法做门槛淘汰。
- **sift down 与「较小的子」交换**：大根堆应与**较大**子交换（保证父 ≥ 两子），小根堆反之。
- **堆当有序结构遍历**：堆中序遍历**无序**（只保证根极值），要有序输出只能反复 pop（即堆排序）。
- **JS 用 `Array.sort` 当堆**：`sort` 是一次性排序 O(n log n)，无法支持动态插入；堆要靠 sift up/down 维护。
- **混淆堆排序与堆数据结构**：堆排序（反复 pop 堆顶排序）在独立叶讲；本叶只讲堆数据结构本身。
- **下标公式用 1-based**：本叶约定 0-based（根在 0）；若用 1-based 公式变为父 `i/2`、子 `2i`/`2i+1`，别混用。
- **查任意值用二分**：堆中间无序，不能二分，只能 O(n) 线性扫描。
- **Python heapq 当大根堆直接用**：`heapq` 只有小根堆，大根堆要存负值或反转比较。

## 十一、进阶方向（链接其他叶）

- **堆排序**：反复取堆顶实现排序，是排序算法 —— 见堆排序叶（独立）
- **二叉搜索树 / 平衡树**：堆的「全序」对照 —— 见[二叉搜索树](../../basic/...) 叶
- **图算法堆优化**：Dijkstra / Prim 用堆 —— 见图算法叶
- **Top-K / 第 K 大**：堆 + 快速选择 —— 见本叶[工程应用](./guide-line/applications)

## 权威链接

- [堆数据结构 - 维基百科](https://zh.wikipedia.org/wiki/%E5%A0%86%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84)
- [Heap Data Structure - GeeksforGeeks](https://www.geeksforgeeks.org/heap-data-structure/)
- [Build Heap in O(n) - 证明](https://www.geeksforgeeks.org/time-complexity-of-building-a-heap/)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/heap" target="_blank" rel="noopener noreferrer">堆可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/heap-slide/" target="_blank">堆</a>
