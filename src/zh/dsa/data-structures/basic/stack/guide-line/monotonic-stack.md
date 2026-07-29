---
layout: doc
outline: [2, 3]
---

# 单调栈：下一个更大元素与柱状图

> 基于通用算法套路 · 核于 2026-07

## 速查

- **单调栈本质**：栈内元素保持**单调**（递增或递减），用栈维护「待匹配」的元素，把「找下一个更大/更小」从 O(n²) 降到 **O(n)**——每元素最多入栈出栈各一次。
- **单调递减栈**（栈底到栈顶递减）：用于找「**下一个更大**」元素——当前元素比栈顶大时，栈顶找到了它的「更大元素」，弹出栈顶并记录答案。
- **单调递增栈**（栈底到栈顶递增）：用于找「**下一个更小**」元素——对称地，当前比栈顶小时弹出栈顶。
- **下一个更大元素**（LeetCode 496/503）：模板题，单调递减栈，遍历时弹出所有比当前小的栈顶并记 ans。
- **每日温度**（LeetCode 739）：等价于「下一个更大元素的下标差」，栈里存下标而非值。
- **柱状图最大矩形**（LeetCode 84）：对每根柱子找「左右第一个比它矮的」，宽度即为可扩展范围——单调递增栈一次遍历。
- **接雨水**（LeetCode 42 栈解法）：按行计算，单调递减栈，遇更高柱子弹出中间凹槽并算该层水量。
- **复杂度**：全部 **O(n)** 时间、O(n) 空间——每元素入栈出栈至多各一次。
- **识别信号**：题目要「每个元素的**左/右第一个**满足某条件（更大/更小）的元素」→ 优先想单调栈。

## 一、单调栈原理：为什么是 O(n)

普通做法找每个元素的「下一个更大」要对每个元素往右扫，O(n²)。单调栈的优化思路：**用一个栈维护「还没找到更大元素的元素」**，遍历时一旦遇到更大的，就批量弹出并记录答案。

```
单调递减栈（找「下一个更大」）的核心动作：
遍历当前元素 x：
  while 栈非空 且 x > 栈顶:
    弹出栈顶 t，t 的「下一个更大元素」就是 x
  把 x 入栈（x 也还没找到它的更大元素）
遍历完后，栈里剩下的元素没有「下一个更大元素」（记 -1）
```

**为什么是 O(n)**：每个元素**最多入栈一次、出栈一次**，总操作数 ≤ 2n，均摊 O(1) 每元素。while 循环看似嵌套，但「弹出的元素永不复入」，总弹出次数有上界 n，所以整体 O(n)。

**单调性如何保持**：每次 `x` 入栈前，把所有比 `x` 小的栈顶弹掉（它们都找到了答案），剩下的栈顶 ≥ `x`，所以栈始终**单调递减**（从底到顶不增）。

## 二、下一个更大元素（模板）

LeetCode 496：对 `nums1`（`nums2` 的子集）中每个元素，找它在 `nums2` 中右侧第一个更大的元素。

```js
function nextGreaterElement(nums2) {
  const stack = [], map = new Map();   // map 记录 每个元素 -> 下一个更大
  for (const x of nums2) {
    while (stack.length && x > stack[stack.length - 1]) {
      map.set(stack.pop(), x);          // 栈顶的「下一个更大」是 x
    }
    stack.push(x);
  }
  while (stack.length) map.set(stack.pop(), -1); // 栈里剩余无更大元素
  return map;
}
```

- **栈存什么**：这里存**值**（因为要 map 查询）；若要返回**下标差**（如每日温度），栈存**下标**。
- **弹栈时机**：当前 `x` 比栈顶大时，栈顶正好找到了它的「下一个更大」——弹出并记录。
- **入栈时机**：弹完所有比 `x` 小的栈顶后，`x` 入栈——此时栈顶 ≥ `x`，保持单调递减。

## 三、每日温度：存下标

LeetCode 739：对每天温度，找下一个更暖和的天数间隔（下标差）。与模板的唯一区别：**栈存下标**，答案记 `i - stackTop`。

```js
function dailyTemperatures(temps) {
  const n = temps.length;
  const ans = new Array(n).fill(0);
  const stack = [];                      // 存下标
  for (let i = 0; i < n; i++) {
    while (stack.length && temps[i] > temps[stack[stack.length - 1]]) {
      const top = stack.pop();
      ans[top] = i - top;                // 下一个更暖和的间隔 = 下标差
    }
    stack.push(i);
  }
  return ans;                            // 栈里剩余 ans 已是 0（无更暖天）
}
```

- **存下标的好处**：能算「距离」（下标差），也能通过下标回查值。
- **循环数组版**（LeetCode 503）：把数组拼接遍历两遍（或用 `i % n` 取模），处理「首尾相连」的下一个更大。

## 四、柱状图最大矩形

LeetCode 84：柱状图中每根柱子宽 1，求能勾勒出的最大矩形面积。对每根柱子 `i`，若知道它**左侧第一个比它矮的** `left[i]` 和**右侧第一个比它矮的** `right[i]`，则以 `i` 为高的最大矩形宽 = `right[i] - left[i] - 1`，面积 = `高 × 宽`。

```js
function largestRectangleArea(heights) {
  const n = heights.length;
  const stack = [];                      // 单调递增栈（找第一个更矮的）
  let maxArea = 0;
  for (let i = 0; i <= n; i++) {         // i 走到 n（哨兵：高度 0，强制清栈）
    const h = i === n ? 0 : heights[i];
    while (stack.length && h < heights[stack[stack.length - 1]]) {
      const height = heights[stack.pop()];                  // 以弹出柱为高
      const left = stack.length ? stack[stack.length-1] : -1; // 左侧第一个更矮
      maxArea = Math.max(maxArea, height * (i - left - 1));   // 宽 = i - left - 1
    }
    stack.push(i);
  }
  return maxArea;
}
```

- **用单调递增栈**（找「更矮」）：当前柱 `i` 比栈顶矮时，栈顶柱的**右侧第一个更矮**就是 `i`；**左侧第一个更矮**就是弹出栈顶后的新栈顶。
- **哨兵技巧**：让 `i` 走到 `n`（取高度 0），强制把栈里所有柱子弹出结算——避免遍历结束后再单独清栈。
- **宽的计算**：`i - left - 1`，其中 `left` 是新栈顶（左侧更矮柱下标），`i` 是当前（右侧更矮柱下标）。

## 五、接雨水（栈解法）

LeetCode 42：给定柱高，求能接多少雨水。单调栈按「层」计算——遇更高柱子时，弹出中间凹槽，算该层的水量。

```js
function trap(height) {
  const stack = [];                      // 单调递减栈，存下标
  let water = 0;
  for (let i = 0; i < height.length; i++) {
    while (stack.length && height[i] > height[stack[stack.length - 1]]) {
      const bottom = stack.pop();        // 凹槽底部
      if (stack.length === 0) break;     // 左边没柱子，接不住
      const left = stack[stack.length - 1];
      const w = i - left - 1;            // 凹槽宽度
      const h = Math.min(height[left], height[i]) - height[bottom]; // 有效高度
      water += w * h;
    }
    stack.push(i);
  }
  return water;
}
```

- **按层计算**：弹出的是「凹槽底部」，左右两个柱子（新栈顶 `left` 和当前 `i`）夹住这一层水，高度 = `min(left,i) - bottom`。
- **弹完 break**：左边没柱子（栈空）时这个底部接不住水，直接 break。
- **三种解法**：接雨水有「双指针」「动态规划（左右最大值）」「单调栈」三种 O(n) 解法，栈解法思路最通用（扩展到二维「接雨水 II」也用优先队列/栈思想）。

## 六、单调栈的识别信号

遇到以下特征优先想单调栈：

- 「每个元素的**左/右第一个更大**」→ 单调递减栈。
- 「每个元素的**左/右第一个更小**」→ 单调递增栈。
- 「求最大/最小的**矩形/区间**，且边界由『第一个更矮/更高』决定」→ 单调栈。
- 题目里出现「下一个」「最近的」「比它大/小」等字眼，且暴力是 O(n²) → 单调栈优化到 O(n)。

**易错点**：①栈存「值」还是「下标」要分清（求距离存下标）；②递增还是递减别搞反（找更大用递减，找更小用递增）；③遍历结束别忘了清栈处理剩余元素（或用哨兵统一）。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/stack" target="_blank" rel="noopener noreferrer">栈可视化演示</a> —— 单调栈维护过程与柱状图最大矩形

## 下一步

单调栈是栈最高阶的用法。回到[参考](../reference)速查所有栈的 API、复杂度、套路与易错点，或继续探索依赖栈的[队列](../../queue/)、[堆](../../../advanced/heap/) 等数据结构。
