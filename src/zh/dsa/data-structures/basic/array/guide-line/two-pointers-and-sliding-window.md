---
layout: doc
outline: [2, 3]
---

# 双指针与滑动窗口：数组上的 O(n) 套路

> 基于通用算法套路 · 核于 2026-07

## 速查

- **双指针三大类**：
  - **对撞指针（相向）**：`left=0, right=n-1`，向中间逼近——**有序数组**两数之和、回文判定、容器盛水
  - **快慢指针（同向）**：`slow`、`fast` 都从 0 出发，`fast` 先走——去重（保留 k 个）、删除指定值、判断环
  - **分离指针（同向双轨）**：两个数组各一个指针——有序数组合并、交集
- **滑动窗口（本质是快慢指针的特化）**：维护 `[left, right]` 一个窗口，`right` 扩张探索、`left` 收缩合法化——求**满足某条件的连续子数组/子串**的统一框架。
- **滑动窗口万能框架**：右扩 → 更新窗口状态 → **while 窗口不合法：左缩 + 更新状态** → 在合法处更新答案。
- **何时用滑动窗口**：求「连续子数组/子串」的**最长 / 最短 / 恰好 k**，且窗口满足**单调性**（缩 `left` 能让不合法变合法，或扩 `right` 能让合法变不合法）。
- **何时不能直接用**：窗口状态没有单调性（如「和恰好等于 k 的子数组个数」含负数）——退化为**前缀和 + 哈希**。
- **复杂度**：双指针 O(n)（每元素最多被两个指针各碰一次）；滑动窗口 O(n)（`left`、`right` 各单调右移，总移动 ≤ 2n）。
- **经典题映射**：两数之和（有序）= 对撞；移除元素 = 快慢；无重复最长子串 = 滑窗 + 哈希记录上一次位置；最小覆盖子串 = 滑窗 + 计数。
- **易错**：对撞指针要**有序**前提（无序先排序或用哈希）；滑窗「更新答案」的位置因「最长」还是「最短」而不同（最长在 while 后、最短在 while 内）。

## 一、对撞指针：有序数组的两端向中间

适用场景：**有序数组**（或天然双端可比较的结构），从两端 `left=0`、`right=n-1` 向中间逼近，依据当前两元素之和与目标的比较决定移动哪一端。

```js
// 经典：有序数组两数之和等于 target（LeetCode 167）
function twoSumSorted(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left + 1, right + 1]; // 1-based
    sum < target ? left++ : right--;                   // 和小了右移左端，和大了左移右端
  }
  return [];
}
```

- **为什么对**：有序性保证「`sum < target` 时 `left` 右移能让 sum 增大」「`sum > target` 时 `right` 左移能让 sum 减小」，每步都排除一个不可能的端，O(n) 而非 O(n²)。
- **前提是「有序」**：无序数组两数之和用对撞会漏解，应用**哈希表**（O(n) 时间 O(n) 空间）或先排序（但排序会打乱下标）。
- **其他对撞应用**：回文判定（`s[left]===s[right]` 双向逼近）、盛最多水的容器（LeetCode 11，比较高度移动矮的那端）、三数之和（固定一个 + 内层对撞）。

## 二、快慢指针：同向、一前一后

适用场景：**原地改造数组**——`slow` 标记「已处理区边界」，`fast` 扫描全数组，满足条件就把 `fast` 处的值写到 `slow` 位置并推进 `slow`。

```js
// 经典：原地移除所有值为 val 的元素，返回新长度（LeetCode 27）
function removeElement(nums, val) {
  let slow = 0;                       // slow = 下一个写入位置 = 新长度
  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] !== val) {         // fast 遇到要保留的，搬到 slow 处
      nums[slow++] = nums[fast];
    }                                  // 要删除的（等于 val）直接被 fast 跳过
  }
  return slow;
}
```

- **核心思想**：`fast` 遍历所有元素，`slow` 只在「该保留」时前进，相当于把保留元素**压实（compact）**到数组前段。
- **变体**：有序数组去重（保留每个值一次，比较 `nums[fast] !== nums[slow-1]`）；保留每个值 k 次（比较 `nums[fast] !== nums[slow-k]`）；移动零（保留非零到前段，后段填零）。
- **快慢指针判断环**（链表场景）：`slow` 走 1 步、`fast` 走 2 步，若有环必相遇——这是 Floyd 判圈，但属于链表叶，此处点一下。

## 三、分离指针：两个数组各一个

适用场景：**两个有序数组**做归并/求交/求并，`i`、`j` 各指向一个数组，按大小关系推进。

```js
// 有序数组合并（归并排序的 merge 步）
function merge(a, b) {
  const res = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    a[i] <= b[j] ? res.push(a[i++]) : res.push(b[j++]);
  }
  while (i < a.length) res.push(a[i++]); // 收尾
  while (j < b.length) res.push(b[j++]);
  return res;
}
```

同理可求两个有序数组的交集（相等收一份、不等推进小的）、并集等。

## 四、滑动窗口：求连续子数组/子串的统一框架

滑动窗口是**快慢指针的特化**——维护一个连续窗口 `[left, right]`，`right` 负责扩张探索、`left` 负责在「窗口不合法」时收缩。它是求「**满足某条件的连续子数组/子串**的最长 / 最短 / 恰好」的万能套路。

### 万能框架（背下来）

```js
function slidingWindow(s) {
  const window = /* 维护窗口状态的数据结构 */;
  let left = 0, ans = /* 初始值 */;
  for (let right = 0; right < s.length; right++) {
    // 1. right 进窗口：把 s[right] 加入 window，更新窗口状态
    window.add(s[right]);

    // 2. while 窗口不合法：左缩 + 同步更新状态
    while (windowNotValid(window)) {
      window.remove(s[left]);
      left++;
    }

    // 3. 此时窗口合法，更新答案（求最短在这里更新）
    ans = Math.min(ans, right - left + 1); // 最短：合法时取
  }
  return ans;
}
```

**关键：更新答案的位置因目标而异**——
- 求**最短**合法窗口：在 while 收缩后（窗口刚变合法）更新，越短越优。
- 求**最长**合法窗口：在 while **之前**（窗口还合法）更新，或在每轮 right 扩张后更新——此时 `left` 只在「不合法」时缩，保证窗口只增不减，长度单调递增。

### 经典：无重复字符的最长子串（LeetCode 3）

求不含重复字符的最长子串长度——窗口要满足「窗口内无重复」，用哈希表记录每个字符最近一次出现的位置。

```js
function lengthOfLongestSubstring(s) {
  const lastSeen = new Map();           // char -> 上次出现的下标
  let left = 0, maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (lastSeen.has(ch) && lastSeen.get(ch) >= left) {
      left = lastSeen.get(ch) + 1;      // 重复字符在窗口内：直接把 left 跳过去重字符之后
    }
    lastSeen.set(ch, right);
    maxLen = Math.max(maxLen, right - left + 1); // 最长：每轮 right 扩张后更新
  }
  return maxLen;
}
```

这里有个优化：窗口「不合法」的判定是「`s[right]` 已在窗口内」，由于字符唯一，可以直接把 `left` 一步跳到 `重复字符 + 1`（而不是 while 一步步缩），因为中间那些位置开头的窗口都不可能更长。

### 经典：最小覆盖子串（LeetCode 76）

求 `s` 中覆盖 `t` 所有字符的最短子串——窗口要满足「包含 `t` 的所有字符（含重复）」，用计数哈希 + `need`/`have` 计数器。

```js
function minWindow(s, t) {
  const need = new Map();               // t 中每个字符的需求量
  for (const ch of t) need.set(ch, (need.get(ch) ?? 0) + 1);
  let have = 0;                         // 已满足的字符种类数
  const window = new Map();
  let left = 0, start = 0, minLen = Infinity;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    window.set(ch, (window.get(ch) ?? 0) + 1);
    if (need.has(ch) && window.get(ch) === need.get(ch)) have++; // 该字符刚好够

    while (have === need.size) {        // 窗口合法（所有需求满足）
      if (right - left + 1 < minLen) {  // 最短：合法时更新
        minLen = right - left + 1;
        start = left;
      }
      // 左缩
      const out = s[left];
      window.set(out, window.get(out) - 1);
      if (need.has(out) && window.get(out) < need.get(out)) have--; // 该字符不够了
      left++;
    }
  }
  return minLen === Infinity ? "" : s.slice(start, start + minLen);
}
```

## 五、何时不能用滑动窗口

滑动窗口的**正确性依赖窗口状态的单调性**：缩 `left` 一定让窗口「更合法」（或扩 `right` 一定让窗口「更不合法」）。一旦破坏单调性就不能直接用：

- **「和恰好等于 k 的子数组个数」（数组含负数）**：缩 `left` 可能让和增大（负数移出）也可能减小，窗口状态不单调——此时改用**前缀和 + 哈希**（见下一节）。
- **「最长无重复」改成「恰好 k 种字符」**：要看具体约束是否单调。

判断技巧：**如果「窗口扩张」和「窗口收缩」对合法性的影响方向相反且确定**（扩张让约束更紧、收缩让约束更松），就能用滑窗；否则考虑前缀和、单调队列、DP 等。

## 六、双指针 vs 滑动窗口 vs 前缀和

| 场景 | 首选 | 复杂度 |
| --- | --- | --- |
| 有序数组两数之和 | 对撞指针 | O(n) |
| 无序数组两数之和 | 哈希表 | O(n) |
| 原地移除/去重 | 快慢指针 | O(n) |
| 有序数组归并/交集 | 分离指针 | O(n+m) |
| 最长/最短合法连续子数组（单调） | 滑动窗口 | O(n) |
| 区间和（多次查询） | 前缀和 | 预处理 O(n)，查询 O(1) |
| 和为 k 的子数组个数（含负数） | 前缀和 + 哈希 | O(n) |
| 滑动窗口最大值 | 单调队列 | O(n) |

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/binary-search" target="_blank" rel="noopener noreferrer">二分查找可视化演示</a> —— 对撞指针思想的同源（有序区间上折半）

## 下一步

双指针/滑窗解决「连续子数组的状态问题」，而**前缀和**解决「连续子数组的求和问题」——把区间求和从 O(n) 降到 O(1)，见[前缀和与差分](./prefix-sum-and-difference)。
