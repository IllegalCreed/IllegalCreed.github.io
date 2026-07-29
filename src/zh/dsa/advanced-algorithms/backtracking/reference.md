---
layout: doc
outline: [2, 3]
---

# 参考：回溯 API、模板与问题速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **定义**：解空间树上做 DFS + 失败撤销选择；本质「有组织 + 可剪枝的暴力枚举」。
- **三步**：**选择 → 递归 → 撤销**；模板 `for 选择 { 做选择; backtrack(); 撤销选择; }`。
- **解空间树**：**子集树**（每层选/不选，2ⁿ 叶，用 `start`）；**排列树**（每层从剩余选，n! 叶，用 `used`）。
- **全排列**：`used[i]` 数组，for 从 `0` 全扫——区分顺序。
- **组合/子集**：`start` 索引，for 从 `start` 往后扫——不区分顺序，天然去重。
- **N 皇后**：逐行放，三个 Set 查列/主对角线(`row-col`)/副对角线(`row+col`)冲突。
- **数独**：逐格扫，试 1~9 查行/列/3×3 宫；只求一解用 `return true` 提前退出。
- **单词搜索**：网格 DFS 四方向，临时改格子标记已访问 + 撤销。
- **剪枝**：约束剪枝（递归前判合法）、排序剪枝（升序后 `break`）、可行性预估（剩余不够就 `return`）。
- **去重**：先排序，排列 `!used[i-1]`、组合 `i > start` 时跳过同层相同元素。
- **复杂度**：子集类 **O(2ⁿ)**、排列类 **O(n!)**，均指数级；空间 O(n)（栈深 + 状态）。
- **回溯 vs DP**：回溯求所有解（枚举方案），DP 求最优值/计数（记忆化去重）；能 DP 别回溯，需列方案只能回溯。
- **交互演示**：[N 皇后](https://algo.illegalscreed.cn/docs/n-queens) · [子集](https://algo.illegalscreed.cn/docs/subsets) · [全排列](https://algo.illegalscreed.cn/docs/permutations) · [数独](https://algo.illegalscreed.cn/docs/sudoku)。

## 一、通用回溯模板

```js
function backtrack(状态) {
  if (满足结束条件) {            // 叶子（或每个节点，视题而定）
    res.push([...path]);         // 浅拷贝！否则最后全空
    return;
  }
  for (选择 of 选择列表) {
    if (不满足剪枝条件) continue; // 剪枝：注定无解就跳过
    做选择;                      // path.push / used[i]=true / 画 Q
    backtrack(新状态);            // 递归
    撤销选择;                    // path.pop / used[i]=false / 擦 Q（缺一不可）
  }
}
```

**四要素**：结束条件、选择列表、做选择、撤销选择。**最高频坑**：`res.push([...path])` 不浅拷贝、撤销漏写。

## 二、排列 / 组合 / 子集模板

```js
// 全排列（排列树，used 数组）
function permute(nums) {
  const res = [], path = [], used = Array(nums.length).fill(false);
  const dfs = () => {
    if (path.length === nums.length) { res.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      if (i > 0 && nums[i] === nums[i-1] && !used[i-1]) continue; // 去重（需先排序）
      used[i] = true; path.push(nums[i]);
      dfs();
      path.pop(); used[i] = false;
    }
  };
  dfs(); return res;
}

// 组合（子集树，start 索引）
function combine(n, k) {
  const res = [], path = [];
  const dfs = (start) => {
    if (path.length === k) { res.push([...path]); return; }
    for (let i = start; i <= n; i++) {
      path.push(i); dfs(i + 1); path.pop();
    }
  };
  dfs(1); return res;
}

// 子集（每个节点都记录，无固定长度）
function subsets(nums) {
  const res = [], path = [];
  const dfs = (start) => {
    res.push([...path]);                       // 每个节点都收
    for (let i = start; i < nums.length; i++) {
      if (i > start && nums[i] === nums[i-1]) continue; // 去重（需先排序）
      path.push(nums[i]); dfs(i + 1); path.pop();
    }
  };
  dfs(0); return res;
}
```

## 三、N 皇后 / 数独模板

```js
// N 皇后：逐行放，三个 Set 查冲突
function solveNQueens(n) {
  const res = [], queens = Array(n).fill(-1);
  const cols = new Set(), d1 = new Set(), d2 = new Set();
  const dfs = (row) => {
    if (row === n) { res.push(buildBoard(queens)); return; }
    for (let col = 0; col < n; col++) {
      if (cols.has(col) || d1.has(row-col) || d2.has(row+col)) continue;
      queens[row] = col; cols.add(col); d1.add(row-col); d2.add(row+col);
      dfs(row + 1);
      queens[row] = -1; cols.delete(col); d1.delete(row-col); d2.delete(row+col);
    }
  };
  dfs(0); return res;
}

// 数独：逐格试 1~9，求一解用 return true
function solveSudoku(board) {
  const valid = (r, c, ch) => {
    for (let i = 0; i < 9; i++)
      if (board[r][i] === ch || board[i][c] === ch) return false;
    const br = (r/3|0)*3, bc = (c/3|0)*3;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
      if (board[br+i][bc+j] === ch) return false;
    return true;
  };
  const dfs = () => {
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      if (board[r][c] !== '.') continue;
      for (let ch = '1'; ch <= '9'; ch++) {
        if (!valid(r, c, ch)) continue;
        board[r][c] = ch;
        if (dfs()) return true;
        board[r][c] = '.';
      }
      return false;
    }
    return true;
  };
  dfs();
}
```

## 四、剪枝技巧速查

| 招式 | 写法 | 适用 |
| --- | --- | --- |
| **约束剪枝** | `if (冲突) continue;` | N 皇后对角线、单词搜索边界 |
| **排序剪枝** | 排序后 `if (超限) break;` | 组合总和、子集和 |
| **可行性预估** | `if (剩余不够) return;` | 组合数不够 k、剩余凑不齐 |
| **去重剪枝** | 排序后跳同层相同元素 | 排列 II、子集 II、组合总和 II |
| **方向剪枝** | 只走有意义方向 | 单词搜索四方向 |

## 五、复杂度速查

| 问题 | 解空间 | 时间 | 空间 |
| --- | --- | --- | --- |
| 子集 | 2ⁿ 叶 | **O(2ⁿ)** | O(n) |
| 全排列 | n! 叶 | **O(n!)** | O(n) |
| 组合 C(n,k) | C(n,k) 叶 | O(C(n,k)·k) | O(k) |
| N 皇后 | 约束剪枝后 | O(n!)（实际远小） | O(n) |
| 数独 | 9^空格数 | 最坏指数级 | O(空格数) |
| 单词搜索 | 4^L 起点 | O(m·n·4^L) | O(L) |

**记忆**：**子集类指数 2ⁿ，排列类阶乘 n!**——都是爆炸级，N 大就要换 DP 或启发式。

## 六、易错点清单

- **`res.push([...path])` 不浅拷贝**：直接 push 引用，最后 `path` 清空，`res` 全空数组——最高频坑。
- **撤销选择漏写**：`push` 没 `pop`、`used=true` 没设回 `false`、画了 Q 没擦——状态污染全错。
- **结束条件忘 `return`**：记录答案后不 return，会继续往下递归（若不需要更长解的话）。
- **`used` vs `start` 用反**：排列（区分顺序）该用 `used` 却用 `start`，会漏掉 `[2,1]` 这类解；反之会重复。
- **去重忘先排序**：`a[i] === a[i-1]` 的去重依赖相邻相同，**不排序就失效**。
- **去重条件写错**：排列是 `!used[i-1]`（同层回退标志），组合是 `i > start`——写反会漏解或重复。
- **剪枝误剪**：剪枝条件必须是「一定无解」的充分条件，写成「可能无解」会漏合法解——宁可少剪。
- **组合总和用 `continue` 而非 `break`**：升序后超限该 `break`（后续更大全超限），用 `continue` 会多扫。
- **单词搜索忘恢复格子**：临时改成 `#` 后没改回，后续路径全被错误标记已访问。
- **N 皇后对角线算错**：主对角线是 `row-col`（可负，Set 照样能用），副是 `row+col`——别混。
- **数独求一解不提前退出**：不加 `return true` 传递，会搜完全部解才停，白白浪费。
- **递归深栈溢出**：N 很大时递归深 O(n)，可能爆栈，需改迭代或手动栈。

## 七、回溯 vs DP 决策表

| 问题特征 | 选回溯 | 选 DP |
| --- | --- | --- |
| 求所有具体方案 | ✅ | ❌（只给值不给方案） |
| 求最优值/方案数 | ❌（指数级） | ✅（多项式级） |
| 子问题大量重叠 | ❌（不去重，慢） | ✅（记忆化去重） |
| 解结构无法简洁描述 | ✅（如数独） | ❌ |
| 需要枚举排列/组合方案 | ✅ | — |

**口诀**：**「问个数/最值 → DP；列方案/求一个解 → 回溯」**。

## 权威链接

- [回溯算法 - 维基百科](https://zh.wikipedia.org/wiki/%E5%9B%9E%E6%BA%AF%E6%B3%95)
- [Backtracking - GeeksforGeeks](https://www.geeksforgeeks.org/backtracking-algorithms/)
- [回溯算法入门 - labuladong](https://labuladong.online/algo/essential-technique/backtrack-framework/)
- [Permutations - LeetCode](https://leetcode.com/problems/permutations/)
- [N-Queens - LeetCode](https://leetcode.com/problems/n-queens/)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/n-queens" target="_blank" rel="noopener noreferrer">N 皇后可视化演示</a> · <a href="https://algo.illegalscreed.cn/docs/subsets" target="_blank" rel="noopener noreferrer">子集可视化演示</a> · <a href="https://algo.illegalscreed.cn/docs/permutations" target="_blank" rel="noopener noreferrer">全排列可视化演示</a> · <a href="https://algo.illegalscreed.cn/docs/sudoku" target="_blank" rel="noopener noreferrer">数独可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/backtracking-slide/" target="_blank">回溯算法</a>
