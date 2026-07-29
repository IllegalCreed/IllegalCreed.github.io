---
layout: doc
outline: [2, 3]
---

# 参考：归并排序 API、复杂度与应用速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **定义**：分治算法——对半切成两段各自排序，再用 O(n) merge 合并成一个有序整体。
- **复杂度**：最好 = 平均 = 最坏 = **O(n log n)**（递归树高 log₂ n，每层合并 n）；空间 **O(n)**（辅助数组）+ O(log n) 栈。
- **稳定**：**是**——merge 比较 `a[i] <= a[j]` 取左半（相等也取左半），保证相等元素相对次序不变。
- **递归式**：`T(n) = 2·T(n/2) + O(n)`，主定理情况二 → O(n log n)。
- **两种写法**：自顶向下（递归 `sort(l,r)`，直观）；自底向上（步长 1→2→4→…，迭代，省栈）。
- **merge**：双指针取小（相等取左半），扫完一段整体拷贝另一段剩余；单次 O(m)（段长和）。
- **逆序对**：merge 时取右段 `a[j]` 则 `count += mid - i + 1`（左段剩余都 > a[j]）；O(n log n)。
- **外排序**：数据分块内排序落盘 → 多路归并（最小堆 O(n log k)）；归并顺序 I/O 对磁盘/磁带友好。
- **Timsort**：归并 + 插入排序，识别 run、短 run 用插入、自适应合并；Python/Java 对象默认，最好 O(n)。
- **链表归并**：快慢指针找中点、改指针合并，**O(1) 额外空间**，是链表排序最优解。
- **与快排/堆排**：归并赢稳定+最坏可控，快排赢原地+常数小，堆排赢原地+O(1)空间但不稳。
- **交互演示**：[归并排序可视化](https://algo.illegalscreed.cn/docs/merge-sort)。

## 一、复杂度表

| 维度 | 归并排序 |
| --- | --- |
| 最好时间 | **O(n log n)**（标准；优化后有序输入可降到 O(n)） |
| 平均时间 | **O(n log n)** |
| 最坏时间 | **O(n log n)** |
| 辅助空间 | **O(n)**（临时数组） |
| 递归栈 | O(log n)（自顶向下） |
| 稳定性 | **稳定** ✅ |
| 原地 | **否** ❌ |
| 递归式 | `T(n) = 2·T(n/2) + O(n)` |

**一句话**：归并排序是「**三态一致 O(n log n)、稳定、O(n) 辅助空间**」的排序——稳定和最坏可控是它的招牌，O(n) 空间是它的代价。

## 二、自顶向下递归模板

```js
function mergeSort(a) {
  const tmp = new Array(a.length);        // 全局复用
  sort(a, 0, a.length - 1, tmp);
  return a;
}

function sort(a, l, r, tmp) {
  if (l >= r) return;                     // 递归基：长度 ≤ 1
  const mid = (l + r) >> 1;
  sort(a, l, mid, tmp);                   // 排左半
  sort(a, mid + 1, r, tmp);               // 排右半
  merge(a, l, mid, r, tmp);               // 合并
}
```

## 三、自底向上迭代模板

```js
function mergeSortBU(a) {
  const n = a.length, tmp = new Array(n);
  for (let width = 1; width < n; width <<= 1) {     // 步长 1→2→4→…
    for (let i = 0; i < n; i += 2 * width) {
      const mid = i + width - 1;
      const r = Math.min(i + 2 * width - 1, n - 1); // 夹紧右边界
      if (mid < n - 1) merge(a, i, mid, r, tmp);    // 有右段才合并
    }
  }
  return a;
}
```

## 四、merge 模板（双指针取小）

```js
function merge(a, l, mid, r, tmp) {
  for (let k = l; k <= r; k++) tmp[k] = a[k];   // 1. 拷到临时区
  let i = l, j = mid + 1, k = l;
  while (i <= mid && j <= r) {                   // 2. 双指针取小
    if (tmp[i] <= tmp[j]) a[k++] = tmp[i++];     // ★ <= 取左半 → 稳定
    else                  a[k++] = tmp[j++];
  }
  while (i <= mid) a[k++] = tmp[i++];            // 3. 左半剩余
  while (j <= r)   a[k++] = tmp[j++];            // 4. 右半剩余
}
```

**关键点**：①先拷到 tmp 避免自覆盖；②`<=` 取左半保证稳定；③单次 merge O(r-l+1)。

## 五、逆序对计数模板

```js
let count = 0;
function mergeCount(a, l, mid, r, tmp) {
  for (let k = l; k <= r; k++) tmp[k] = a[k];
  let i = l, j = mid + 1, k = l;
  while (i <= mid && j <= r) {
    if (tmp[i] <= tmp[j]) a[k++] = tmp[i++];
    else { a[k++] = tmp[j++]; count += mid - i + 1; } // ★ 逆序对 += 左段剩余
  }
  while (i <= mid) a[k++] = tmp[i++];
  while (j <= r)   a[k++] = tmp[j++];
}
// 用法：sort 阶段调用 mergeCount，结束后 count 即总逆序对数。
```

## 六、k 路归并模板（最小堆）

```js
function mergeKSorted(arrays) {                 // k 个有序数组/链表
  const h = new MinHeap((x, y) => x.val - y.val);
  for (let i = 0; i < arrays.length; i++)
    if (arrays[i].length) h.push({ val: arrays[i][0], k: i, idx: 0 });
  const res = [];
  while (h.size()) {
    const { val, k, idx } = h.pop();
    res.push(val);
    if (idx + 1 < arrays[k].length)
      h.push({ val: arrays[k][idx + 1], k, idx: idx + 1 });
  }
  return res;
} // 时间 O(n log k)
```

## 七、链表归并排序模板

```js
function sortList(head) {
  if (!head || !head.next) return head;
  let slow = head, fast = head.next;            // 快慢指针找中点
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  const right = slow.next; slow.next = null;    // 断开
  return mergeList(sortList(head), sortList(right));
}
function mergeList(a, b) {
  const dummy = { next: null }; let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) { tail.next = a; a = a.next; } // 稳定：相等取 a
    else              { tail.next = b; b = b.next; }
    tail = tail.next;
  }
  tail.next = a || b;
  return dummy.next;
} // O(1) 额外空间
```

## 八、与各排序对比

| 算法 | 平均 | 最坏 | 空间 | 稳定 | 原地 | 典型用途 |
| --- | --- | --- | --- | --- | --- | --- |
| **归并** | O(n log n) | **O(n log n)** | O(n) | **是** | 否 | 稳定排序/外排序/链表 |
| 快排 | O(n log n) | O(n²) | O(log n) | 否 | 是 | 库默认（求快） |
| 堆排 | O(n log n) | O(n log n) | O(1) | 否 | 是 | 原地+最坏可控 |
| Timsort | O(n log n) | O(n log n) | O(n) | 是 | 否 | Python/Java 实际用 |
| 插入 | O(n²) | O(n²) | O(1) | 是 | 是 | 小数组/几乎有序 |

## 九、易错点清单

- **merge 忘先拷 tmp**：直接在原数组双指针合并会自覆盖（左段未读元素被右段写覆盖）——必须先拷到 tmp 再合并。
- **稳定性写成 `<`**：`if (tmp[j] < tmp[i]) 取右段` 会把右段相等元素提前取走，破坏稳定；应写 `<=` 取左半。
- **自底向上右边界越界**：最后一段长度不足 width，`r` 必须 `min(i+2*width-1, n-1)` 夹紧。
- **自底向上漏判「无右段」**：`mid >= n-1` 时左段已是末尾，无右段可并，应跳过 merge。
- **逆序对统计方向反**：是「取右段时累加左段剩余 `mid-i+1`」，不是取左段时。
- **tmp 反复 new**：每次 merge 新建数组会拖慢且空间失控，应全局开一个长度 n 的 tmp 复用。
- **`(l+r)>>1` 对负数**：位运算向下取整对非负没问题；若可能负数用 `Math.floor((l+r)/2)`。
- **递归基漏 `l === r`**：写成 `l > r` 漏掉单元素段，会无限递归（栈溢出）。
- **链表归并忘断开**：`slow.next = null` 不写，两半仍相连导致递归不终止。
- **k 路归并用排序而非堆**：每次线性找 k 路最小是 O(k)，总 O(nk)；用最小堆降到 O(n log k)。
- **把归并当原地**：归并**不是**原地，面试被问「原地 O(n log n) 稳定排序」答归并是错的（那是矛盾的，原地+稳定+O(n log n) 严格意义上难同时满足）。
- **已有序优化误当标准**：`a[mid] <= a[mid+1]` 跳过合并是工程优化，标准归并的三态仍是 O(n log n)。

## 十、进阶方向（链接其他叶）

- **快速排序**：原地但不稳定、最坏 O(n²)——与归并互为对照，见[快速排序](../quick-sort/) 叶
- **堆排序**：原地 O(1) 空间但不稳定——排序三件套的另一极，见[堆排序](../heap-sort/) 叶
- **分治策略**：归并是分治的典范，递归式分析见[分治与递归](../../algorithms/divide-and-conquer/) 叶
- **链表**：链表归并排序是链表上的最优排序，见[链表](../../data-structures/basic/linked-list/) 叶
- **堆**：k 路归并的最小堆基础，见[堆](../../data-structures/advanced/heap/) 叶

## 权威链接

- [归并排序 - 维基百科](https://zh.wikipedia.org/wiki/%E5%BD%92%E5%B9%B6%E6%8E%92%E5%BA%8F)
- [Merge Sort - GeeksforGeeks](https://www.geeksforgeeks.org/merge-sort/)
- [Timsort - Wikipedia](https://en.wikipedia.org/wiki/Timsort)
- [剑指 Offer 51. 数组中的逆序对 - LeetCode](https://leetcode.cn/problems/shu-zu-zhong-de-ni-xu-dui-lcof/)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/merge-sort" target="_blank" rel="noopener noreferrer">归并排序可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/merge-sort-slide/" target="_blank">归并排序</a>
