---
layout: doc
outline: [2, 3]
---

# 栈的经典应用：括号匹配、表达式求值、单调栈

> 基于通用算法套路 · 核于 2026-07

## 速查

- **括号匹配**：遇左括号入栈，遇右括号弹栈顶左括号检查是否配对；末尾栈空才合法——O(n)。
- **后缀表达式（逆波兰）求值**：遇数字入栈，遇运算符弹两个 operand 算完压回——无需括号、无需优先级，O(n)。
- **中缀转后缀（调度场算法）**：数字直接输出；运算符先弹出栈中**优先级 ≥ 当前**的再入栈；遇左括号入栈，遇右括号弹到左括号。
- **函数调用栈与递归**：每次调用压栈帧（参数/局部变量/返回地址），返回弹栈——递归的回溯天然是栈弹出顺序，任何递归可改迭代+显式栈。
- **浏览器前进后退**：两个栈（后退栈、前进栈），后退时当前页压前进栈、后退栈弹出；前进反之。
- **撤销操作（undo）**：每次操作压栈，撤销即弹出并反向执行——redo 用第二个栈。
- **统一思想**：栈适合「最近相关性」——括号配最近的、表达式算最近的操作数、撤销撤最近的一步——都是 LIFO 的体现。
- **复杂度**：括号匹配 O(n)、后缀求值 O(n)、中缀转后缀 O(n)、浏览器/撤销每次操作 O(1)。

## 一、括号匹配：栈的「最近配对」语义

判断字符串中的括号是否合法配对（`()`、`[]`、`{}`）。核心：遇左括号入栈，遇右括号弹栈顶检查是否是对应的左括号。

```js
// LeetCode 20 有效的括号
function isValid(s) {
  const pair = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const ch of s) {
    if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);   // 左括号入栈
    else {                                                         // 右括号
      if (stack.pop() !== pair[ch]) return false;                  // 栈顶左括号必须配对
    }
  }
  return stack.length === 0;                                       // 末尾栈空才合法
}
```

- **为什么用栈**：括号匹配的本质是「**最近的左括号要先和当前右括号配对**」——这正是 LIFO。嵌套越深的左括号越晚被匹配，与栈的弹出顺序一致。
- **两类不合法**：①右括号与栈顶左括号不匹配（`(]`）；②末尾栈非空（有左括号没被匹配，如`(()`）。
- **不含括号套嵌的简化**：若只有一种括号 `()`，可用计数器（左+1 右-1，过程中不出现负数且末尾为 0）代替栈；多种括号必须用栈。

## 二、后缀表达式（逆波兰）求值

后缀表达式（Reverse Polish Notation，RPN）把运算符放在操作数**后面**，如 `3 4 +` 表示 `3+4`。它的好处是**无需括号、无需考虑优先级**——从左到右扫一遍即可算出结果。

```js
// LeetCode 150 逆波兰表达式求值
function evalRPN(tokens) {
  const stack = [];
  for (const t of tokens) {
    if (t === '+' || t === '-' || t === '*' || t === '/') {
      const b = stack.pop();          // 第二操作数（后弹出）
      const a = stack.pop();          // 第一操作数（先弹出）
      stack.push(apply(a, b, t));     // 算完压回
    } else {
      stack.push(Number(t));          // 数字入栈
    }
  }
  return stack.pop();                 // 栈中唯一元素即结果
}
function apply(a, b, op) {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '*') return a * b;
  return Math.trunc(a / b);           // 除法向 0 取整
}
```

- **弹栈顺序**：二元运算符 `op`，先弹的是 `b`（右操作数），后弹的是 `a`（左操作数）——顺序不能反（减法、除法有顺序）。
- **为什么用栈**：运算符总是作用于**最近入栈的两个操作数**——LIFO 保证弹出的正是「最近的、待算的」操作数。
- **时间复杂度 O(n)**：每个 token 处理一次，每个元素最多入栈出栈各一次。

## 三、中缀转后缀：调度场算法（Shunting Yard）

人类习惯的中缀表达式（`3 + 4 * 2`）有优先级和括号，要转成后缀才能用上面的方法求值。Dijkstra 的**调度场算法**用栈处理优先级：

```js
// 中缀转后缀
function infixToPostfix(s) {
  const prec = { '+': 1, '-': 1, '*': 2, '/': 2 };
  const out = [], stack = [];
  for (const t of tokens(s)) {
    if (/\d/.test(t)) out.push(t);                       // 数字直接输出
    else if (t === '(') stack.push(t);                   // 左括号入栈
    else if (t === ')') {                                // 右括号：弹到左括号
      while (stack[stack.length - 1] !== '(') out.push(stack.pop());
      stack.pop();                                       // 丢弃左括号
    } else {                                             // 运算符
      while (stack.length && stack[stack.length-1] !== '('
             && prec[stack[stack.length-1]] >= prec[t]) out.push(stack.pop());
      stack.push(t);
    }
  }
  while (stack.length) out.push(stack.pop());            // 剩余全弹出
  return out;
}
```

- **核心规则**：运算符入栈前，先把栈中**优先级 ≥ 自己**的弹出（保证高优先级先输出）；左括号在栈里「保护」其后的低优先级运算符不被提前弹出。
- **为何 `>=` 而非 `>`**：同优先级左结合（`3-4-5` 应算成 `(3-4)-5`），所以同优先级也要弹出栈顶的先输出。
- **两步求值**：中缀 → 后缀（调度场）→ 求值（RPN），全程 O(n)。

## 四、函数调用栈与递归的栈本质

函数调用栈是栈最底层的应用。理解它就能理解递归为什么能工作、为什么会栈溢出、怎么把递归改成迭代。

```js
// 递归求阶乘：每次调用压一个栈帧
function fact(n) {
  if (n <= 1) return 1;     // 终止条件（基线）
  return n * fact(n - 1);   // 递归：压栈
}
// fact(3) 的调用栈演化：
// 调用 fact(3) → fact(2) → fact(1)
// 栈（自顶向下）：[fact(1)] [fact(2)] [fact(3)]
// fact(1) 返回 1，弹栈 → fact(2) 算 2*1=2，弹栈 → fact(3) 算 3*2=6
```

- **递归 = 隐式用调用栈**：「递」是压栈（深入），「归」是弹栈（回溯）。递归写法天然利用了系统的调用栈。
- **任何递归都能改迭代 + 显式栈**：自己维护一个栈，把「函数调用」变成「压入状态」，把「返回」变成「弹出状态」——突破固定调用栈大小限制（递归太深会栈溢出）。
- **DFS 与栈**：深度优先搜索天然用栈——递归 DFS 隐式用调用栈，迭代 DFS 显式用一个栈存「待访问节点」。

## 五、浏览器前进后退：双栈模型

浏览器的前进/后退功能是栈的经典应用——用**两个栈**：一个存「后退可用」的页面（back 栈），一个存「前进可用」的页面（forward 栈）。

```
当前页：当前显示的 URL（不在任何栈中）
后退：当前页 push 进 forward 栈，back 栈弹出成为新当前页
前进：当前页 push 进 back 栈，forward 栈弹出成为新当前页
访问新页：当前页 push 进 back 栈，清空 forward 栈（前进历史失效）
```

- **后退栈**：每访问一个新页面，把前一个压入 back 栈；点后退就从 back 栈弹出。
- **前进栈**：后退时当前页压入 forward 栈；点前进就从 forward 栈弹出。
- **访问新页清空 forward 栈**：因为「分叉」了，之前的前进历史作废——这是设计上的关键细节。
- **撤销（undo）/重做（redo）**同理：undo 栈 + redo 栈，撤销压 redo、重做压 undo。

## 六、用两个栈实现队列

经典面试题：用两个栈实现一个 FIFO 队列。思路——一个**输入栈**（`in`）负责入队，一个**输出栈**（`out`）负责出队；`out` 空时把 `in` 全部倒入 `out`（顺序反转两次变回原序）。

```js
class MyQueue {
  constructor() { this.in = []; this.out = []; }
  push(x) { this.in.push(x); }                 // 入队：压入栈
  pop() { this.peek(); return this.out.pop(); } // 出队：从输出栈
  peek() {                                      // 倒栈（摊还 O(1)）
    if (this.out.length === 0)
      while (this.in.length) this.out.push(this.in.pop());
    return this.out[this.out.length - 1];
  }
  empty() { return this.in.length === 0 && this.out.length === 0; }
}
```

- **均摊 O(1)**：每个元素最多被压入 `in` 一次、倒入 `out` 一次、从 `out` 弹出一次——总共 3 次操作摊到 n 次入队，均摊 O(1)。
- **顺序反转两次**：栈 `in` 是 LIFO，倒入 `out` 反转一次，`out` 出栈又反转一次，两次反转回到 FIFO 原序——这是「栈模拟队列」的核心技巧。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/stack" target="_blank" rel="noopener noreferrer">栈可视化演示</a> —— 括号匹配与表达式求值的栈演化过程

## 下一步

掌握了栈的配对、求值、回溯应用后，下一步是栈最进阶的用法——**单调栈**，它专门解决「找下一个更大/更小元素」类问题，把暴力 O(n²) 降到 O(n)，见[单调栈](./monotonic-stack)。
