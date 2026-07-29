---
layout: doc
outline: [2, 3]
---

# 参考：栈 API、复杂度与应用速查

> 基于通用数据结构概念 · 核于 2026-07

## 速查

- **定义**：LIFO（后进先出）受限线性表，只允许在**栈顶**一端 push/pop。
- **核心复杂度**：`push`/`pop`/`peek`/判空 均 **O(1)**；访问第 k 个 O(k)；不支持随机访问。
- **两种实现**：顺序栈（数组尾部 + `top` 指针，缓存友好）；链式栈（链表头插/头删，无容量上限）。
- **栈溢出**：固定容量数组超容溢出；更常见是**函数调用栈溢出**（递归太深撑爆固定栈内存）。
- **括号匹配**：左括号入栈、右括号弹栈检查配对 —— O(n)。
- **后缀求值**：数字入栈、运算符弹两 operand 算完压回 —— O(n)。
- **中缀转后缀**：调度场算法，弹「优先级 ≥ 当前」的运算符 —— O(n)。
- **单调栈**：栈内单调（找更大用递减、找更小用递增），每元素入出各一次 —— **O(n)**。
- **柱状图最大矩形**：单调递增栈，对每柱找左右第一个更矮 —— O(n)。
- **交互演示**：[栈可视化](https://algo.illegalscreed.cn/docs/stack)。

## 一、核心复杂度表

| 操作 | 复杂度 | 说明 |
| --- | --- | --- |
| `push(x)` 入栈 | **O(1)** | 写栈顶，`top` 上移 |
| `pop()` 出栈 | **O(1)** | 读栈顶，`top` 下移 |
| `peek()`/`top()` | **O(1)** | 只读栈顶不删 |
| `isEmpty()` 判空 | **O(1)** | `top === -1` |
| `size()` 元素数 | **O(1)** | `top + 1` |
| 访问第 k 个 | O(k) | 要先弹 k-1 个 |
| 查找特定值 | O(n) | 遍历（破坏性或借辅助栈） |

## 二、各语言栈对照

| 语言 | 栈类型 | 核心操作 | 说明 |
| --- | --- | --- | --- |
| C++ | `std::stack<T>` | `push`/`pop`/`top`/`empty` | 适配器（默认基于 `deque`），无随机访问 |
| Java | `Stack<T>`（已过时）/ `ArrayDeque<T>` | `push`/`pop`/`peek` | 官方推荐 `ArrayDeque` 代替 `Stack`（后者继承 Vector 加锁慢） |
| JavaScript | `Array` | `push`/`pop`/`arr[len-1]` | 数组尾部天然当栈，摊还 O(1) |
| Python | `list` | `append`/`pop`/`[-1]` | 列表尾部当栈，摊还 O(1) |
| Go | `[]T`（切片）+ `len` | `append`/`s[len-1]`/`s[:len-1]` | 切片尾部当栈 |

**Java 选型**：`ArrayDeque` 比 `Stack` 快（无同步开销、无继承 Vector 的历史包袱），日常用 `Deque<Integer> stack = new ArrayDeque<>();`。

## 三、JS 栈操作速查

```js
const stack = [];
stack.push(1);              // 入栈：[1]，返回新长度
stack.push(2, 3);           // 可批量：[1,2,3]
stack.pop();                // 出栈：返回 3，栈变 [1,2]
stack[stack.length - 1];    // peek：查看栈顶 2（不删除）
stack.length === 0;         // 判空
stack.length;               // size：元素个数
// ⚠️ 不要用 shift/unshift（头部操作 O(n)）当栈，栈操作必须在尾部
```

## 四、单调栈套路清单

| 问题类型 | 栈的单调性 | 栈存内容 | 典型题 |
| --- | --- | --- | --- |
| 下一个更大元素 | **递减**（底到顶递减） | 值或下标 | LeetCode 496/503 |
| 下一个更小元素 | **递增** | 值或下标 | 股票跨度 |
| 每日温度（距离） | 递减 | **下标**（算下标差） | LeetCode 739 |
| 柱状图最大矩形 | **递增**（找更矮） | 下标 + 哨兵 | LeetCode 84 |
| 接雨水（栈解法） | 递减 | 下标 | LeetCode 42 |

**选递增还是递减**：找「更大/更高」用递减栈（当前更大时弹出栈顶结算）；找「更小/更矮」用递增栈（当前更小时弹出栈顶结算）。

## 五、单调栈万能模板

```js
// 找每个元素的「下一个更大」（单调递减栈）
function nextGreater(nums) {
  const n = nums.length;
  const ans = new Array(n).fill(-1);
  const stack = [];                    // 存下标
  for (let i = 0; i < n; i++) {
    while (stack.length && nums[i] > nums[stack[stack.length - 1]]) {
      ans[stack.pop()] = nums[i];      // 栈顶的「下一个更大」是 nums[i]
    }
    stack.push(i);
  }
  return ans;                          // 栈里剩余的 ans 已是 -1
}
```

## 六、经典应用速查

```js
// 括号匹配
function isValid(s) {
  const pair = { ')': '(', ']': '[', '}': '{' }, stack = [];
  for (const ch of s) {
    if ('([{'.includes(ch)) stack.push(ch);
    else if (stack.pop() !== pair[ch]) return false;
  }
  return stack.length === 0;
}

// 后缀表达式求值
function evalRPN(tokens) {
  const s = [];
  for (const t of tokens) {
    if ('+-*/'.includes(t)) {
      const b = s.pop(), a = s.pop();
      s.push(t === '+' ? a+b : t==='-' ? a-b : t==='*' ? a*b : Math.trunc(a/b));
    } else s.push(+t);
  }
  return s.pop();
}

// 两栈实现队列（均摊 O(1)）
class MyQueue {
  constructor() { this.in = []; this.out = []; }
  push(x) { this.in.push(x); }
  peek() {
    if (!this.out.length) while (this.in.length) this.out.push(this.in.pop());
    return this.out[this.out.length - 1];
  }
  pop() { this.peek(); return this.out.pop(); }
}
```

## 七、易错点清单

- **栈操作端搞错**：JS 数组当栈必须用 `push`/`pop`（尾部 O(1)），用 `shift`/`unshift`（头部）是 O(n)。
- **弹栈顺序**：后缀求值二元运算符先弹的是右操作数 `b`，后弹的是左操作数 `a`——`a-b` 不能写成 `b-a`。
- **括号匹配漏末尾判空**：遍历完还要 `stack.length === 0`，否则 `(()` 这种左括号多余会误判合法。
- **递归无终止条件**：导致无限递归 → 函数调用栈溢出（StackOverflowError / RangeError）。
- **单调栈存值还是存下标**：要求「距离/下标差」时存下标（如每日温度）；只要求「值」可存值。
- **单调栈方向搞反**：找「更大」用递减栈，找「更小」用递增栈——记反会全错。
- **柱状图矩形忘哨兵**：遍历结束后栈里可能还有元素未结算，用 `i===n` 取高度 0 的哨兵强制清栈。
- **接雨水弹完忘判栈空**：弹出底部后若栈空（左边没柱子）该层接不住水，要 break。
- **两栈队列忘均摊分析**：倒栈是 O(n) 但均摊 O(1)，不要误以为整体退化。
- **Java 用过时的 `Stack`**：应用 `ArrayDeque`，`Stack` 继承 Vector 加锁慢。

## 八、进阶方向（链接其他叶）

- **队列**：FIFO 对应物，双栈可实现队列 —— 见[队列](../../queue/) 叶
- **堆**：用数组实现优先队列（完全二叉树） —— 见[堆](../../../advanced/heap/) 叶
- **图 DFS**：深度优先搜索显式/隐式用栈 —— 见[图的遍历](../../../graph/graph-traversal/) 叶
- **树遍历**：前/中/后序的递归（调用栈）与迭代（显式栈） —— 见[二叉树遍历](../../../tree/binary-tree-traversal/) 叶

## 权威链接

- [栈 - 维基百科](https://zh.wikipedia.org/wiki/%E5%A0%86%E6%A0%88)
- [Stack Data Structure - GeeksforGeeks](https://www.geeksforgeeks.org/stack-data-structure/)
- [单调栈 - LeetCode 探索](https://leetcode.com/studyplan/monotonic-stack/)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/stack" target="_blank" rel="noopener noreferrer">栈可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/stack-slide/" target="_blank">栈</a>
