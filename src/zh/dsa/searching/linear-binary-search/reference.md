---
layout: doc
outline: [2, 3]
---

# 参考：二分查找 API、模板与易错速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **线性查找**：顺序扫描 O(n)，**无序也能用**，链表/文件流皆可；最好 O(1)、最坏/平均 O(n)。
- **二分查找**：有序 + 随机访问前提下，每次排除一半，**O(log n)**；最好 O(1)、最坏/平均 O(log n)。
- **二分两前提**：①数据**有序**；②结构**支持随机访问**（数组可，链表不可）——缺一不可。
- **三种区间写法**：`[l,r]`（`while l<=r`，`±1`）/ `[l,r)`（`while l<r`，`r=mid`）/ `(l,r)`（`while l+1<r`，`l=mid,r=mid`）。
- **三种查找目标**：精确命中（返回下标或 -1）/ 左边界 lower_bound（第一个 `>= target`）/ 右边界（最后一个 `<= target`）。
- **`mid` 防溢出**：`l + ((r - l) >> 1)`（向下取整）；求右边界用 `l + ((r - l + 1) >> 1)`（向上取整）。
- **死循环元凶**：`l = mid` 配向下取整（`l+1===r` 时 `mid===l`，`l` 不动）——改向上取整。
- **二分 vs 哈希**：二分 O(log n) 原地 O(1) 空间、适合**静态有序**；哈希 O(1) 但 O(n) 空间、有冲突、适合动态数据。
- **循环不变量心法**：答案必在 `[l,r]` 内——先定区间开闭 → 定退出条件 → 定收缩方式，三者自洽即对。
- **交互演示**：[二分查找可视化](https://algo.illegalscreed.cn/docs/binary-search)、[二分边界可视化](https://algo.illegalscreed.cn/docs/binary-bounds)。

## 一、复杂度表

| 查找方式 | 前提 | 最好 | 平均 | 最坏 | 空间 |
| --- | --- | --- | --- | --- | --- |
| 线性查找 | 无 | O(1) | O(n) | O(n) | O(1) |
| 二分查找（精确） | 有序 + 随机访问 | O(1) | O(log n) | O(log n) | O(1) |
| 二分（左/右边界） | 有序 + 随机访问 | O(log n) | O(log n) | O(log n) | O(1) |
| 哈希表查找 | 可哈希 | O(1) | O(1) | O(n)（冲突） | O(n) |
| 平衡树查找 | 可比较 | O(log n) | O(log n) | O(log n) | O(n) |

## 二、线性查找模板

```js
// 线性查找：返回下标，找不到返回 -1
function linearSearch(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) return i;
  }
  return -1;
}
```

## 三、二分三种区间写法（查找目标值）

```js
// 写法一：左闭右闭 [l, r]
function binarySearchClosed(nums, target) {
  let l = 0, r = nums.length - 1;
  while (l <= r) {
    const mid = l + ((r - l) >> 1);
    if (nums[mid] === target) return mid;
    nums[mid] < target ? (l = mid + 1) : (r = mid - 1);
  }
  return -1;
}

// 写法二：左闭右开 [l, r)
function binarySearchHalfOpen(nums, target) {
  let l = 0, r = nums.length;
  while (l < r) {
    const mid = l + ((r - l) >> 1);
    if (nums[mid] === target) return mid;
    nums[mid] < target ? (l = mid + 1) : (r = mid);
  }
  return -1;
}

// 写法三：左开右开 (l, r)
function binarySearchOpen(nums, target) {
  let l = -1, r = nums.length;
  while (l + 1 < r) {
    const mid = l + ((r - l) >> 1);
    if (nums[mid] === target) return mid;
    nums[mid] < target ? (l = mid) : (r = mid);
  }
  return -1;
}
```

## 四、左边界模板（第一个 `>= target`，lower_bound）

```js
// 左边界：第一个 >= target（左闭右开写法，mid 向下取整）
function lowerBound(nums, target) {
  let l = 0, r = nums.length;
  while (l < r) {
    const mid = l + ((r - l) >> 1);     // 向下取整
    nums[mid] < target ? (l = mid + 1) : (r = mid); // >= target 的 mid 保留
  }
  return l;                              // l === r；全 < target 时返回 n
}
// 判断 target 是否存在：l < nums.length && nums[l] === target
```

## 五、右边界模板（最后一个 `<= target`）

```js
// 右边界：最后一个 <= target（左闭右闭写法，mid 向上取整防死循环）
function upperBoundLast(nums, target) {
  let l = 0, r = nums.length - 1;
  while (l < r) {
    const mid = l + ((r - l + 1) >> 1);  // 向上取整！
    nums[mid] <= target ? (l = mid) : (r = mid - 1); // <= target 的 mid 保留
  }
  return l;                              // 最后一个 <= target
}
// 范围计数：target 出现次数 = upperBoundFirst(>target) - lowerBound(target)
```

## 六、`mid` 防溢出速查

```js
// ❌ 溢出风险：l + r 超整型上限时变负数
const mid = (l + r) / 2;
const mid = (l + r) >> 1;  // 位运算前先转 32 位整型，l+r 超 2^31 仍错

// ✅ 防溢出（r - l 不溢出）
const midFloor = l + ((r - l) >> 1);      // 向下取整（r=mid 场景）
const midCeil  = l + ((r - l + 1) >> 1);  // 向上取整（l=mid 场景，防死循环）
```

## 七、三种区间写法对照表

| 维度 | 左闭右闭 `[l,r]` | 左闭右开 `[l,r)` | 左开右开 `(l,r)` |
| --- | --- | --- | --- |
| 初始 `l`/`r` | `0` / `n-1` | `0` / `n` | `-1` / `n` |
| `while` 条件 | `l <= r` | `l < r` | `l + 1 < r` |
| `a[mid]` 偏小收缩 | `l = mid + 1` | `l = mid + 1` | `l = mid` |
| `a[mid]` 偏大收缩 | `r = mid - 1` | `r = mid` | `r = mid` |
| 空区间判据 | `l > r` | `l === r` | `l + 1 === r` |
| 适合场景 | 精确查找（直观） | 左/右边界（标准库） | 避免边界细节 |

## 八、易错点清单

- **死循环 `l = mid` 配向下取整**：`l+1===r` 时 `mid===l`，`l` 不动——改 `mid` 向上取整 `l+((r-l+1)>>1)`。
- **`mid = (l+r)/2` 溢出**：`l+r` 超整型上限变负数——改 `l+((r-l)>>1)`。
- **闭区间误用 `while (l<r)`**：漏查 `l===r` 那个元素——闭区间用 `l<=r`。
- **半开区间误用 `while (l<=r)`**：`l===r` 时区间已空却进循环——半开用 `l<r`。
- **左边界返回值误当命中下标**：`l` 是「第一个 `>= target`」，target 不存在时 `a[l]` 可能 `> target`——需 `a[l]===target` 判断。
- **右边界忘向上取整**：`l=mid` 配向下取整死循环——求右边界 `mid` 必须向上取整。
- **收缩时该排除却保留**：精确查找里 `a[mid]` 已比过须 `±1` 排除，误写 `r=mid` 会死循环或重复。
- **没判空数组**：`n===0` 时闭区间 `r=-1`，`while(l<=r)` 不进直接返回 -1——确认初始值正确即可。
- **链表上用二分**：链表不支持随机访问，取 `mid` 要 O(n)，二分退化——链表只能线性查找。
- **无序数组上用二分**：无序不满足「排除一半」的正确性，结果错——先排序或用线性/哈希。
- **返回值越界未处理**：左边界可能返回 `n`（全 `< target`），右边界可能返回 `-1`（全 `> target`）——调用方要判越界。
- **二分答案忘判单调性**：「二分答案」类题要求判定函数对答案有单调性，否则不能二分。

## 九、二分 vs 哈希表 vs 树

| 维度 | 二分查找 | 哈希表 | 平衡树 |
| --- | --- | --- | --- |
| 查找 | O(log n) | **O(1)** | O(log n) |
| 增删 | O(n)（搬移） | **O(1)** | O(log n) |
| 空间 | **O(1)**（原地） | O(n) | O(n) |
| 数据要求 | 有序 + 随机访问 | 可哈希 | 可比较 |
| 范围查询 | **支持**（左/右边界） | 不支持 | 支持（中序） |
| 适合 | 静态有序数据 | 动态精确匹配 | 动态 + 范围查询 |

选型口诀：**「静态有序 → 二分；动态精确匹配 → 哈希表；动态且要范围查询 → 平衡树/跳表」**。

## 权威链接

- [二分查找算法 - 维基百科](https://zh.wikipedia.org/wiki/%E4%BA%8C%E5%88%86%E6%9F%A5%E6%89%BE%E7%AE%97%E6%B3%95)
- [Binary Search - LeetCode 探索](https://leetcode.com/explore/learn/card/binary-search/)
- [Binary Search - GeeksforGeeks](https://www.geeksforgeeks.org/binary-search/)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/binary-search" target="_blank" rel="noopener noreferrer">二分查找可视化演示</a> · <a href="https://algo.illegalscreed.cn/docs/binary-bounds" target="_blank" rel="noopener noreferrer">二分边界可视化</a>
- 本站幻灯片：<a href="/SlideStack/linear-binary-search-slide/" target="_blank">线性查找与二分查找</a>
