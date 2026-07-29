---
layout: doc
outline: [2, 3]
---

# 经典回溯问题

> 基于通用算法套路 · 核于 2026-07

## 速查

- **N 皇后**：在 N×N 棋盘放 N 个互不攻击的皇后——**逐行放置**（每行一个），用三个集合（列、主对角线 `row-col`、副对角线 `row+col`）O(1) 查冲突，到叶记录棋盘。
- **数独求解**：填 9×9 数独——逐格扫描，遇空格「试 1~9 + 检查行/列/3×3 宫合法」，合法就填并递归，全填满即解；只求一解可在找到时 `return true` 提前退出。
- **单词搜索**：在网格里找单词——从每个匹配首字母的格子出发 DFS（上下左右四方向），用「标记已访问（临时改格子或 visited 数组）+ 回溯撤销」防止重走。
- **分割问题**：把串切成满足条件的段（回文分割、IP 还原）——用 `start` 索引枚举每段起点，递归处理剩余子串。
- **组合总和**：选若干数（可重复）凑目标和——`start` + 排序剪枝（超 target 就 break）。
- **剪枝实战**：N 皇后的对角线哈希、组合总和的排序 break、单词搜索的提前长度/边界判断，都能把搜索量砍掉一半以上。
- **通用套路**：所有题都是「**for 选择 { 做选择; dfs; 撤销 }**」——N 皇后选列、数独选数字、单词搜索选方向、分割选断点。
- **进阶顺序**：[参考](../reference) —— 模板速查、复杂度、易错点。

## 一、N 皇后：约束满足的经典

**问题**：在 N×N 棋盘上放 N 个皇后，使任意两个不同行、不同列、不同对角线。返回所有摆法。

**思路**：因为皇后不能同行，**逐行放置**（每行恰好一个），第 `row` 行枚举每列 `col`，检查 `col` 和两条对角线是否已被占用——这是排列树（每行从可用列里挑一个）。

```js
function solveNQueens(n) {
  const res = [];
  const cols = new Set();           // 已占用的列
  const diag1 = new Set();          // 主对角线：row - col
  const diag2 = new Set();          // 副对角线：row + col
  const queens = Array(n).fill(-1); // queens[row] = col

  const dfs = (row) => {
    if (row === n) { res.push(buildBoard(queens)); return; } // 叶子：摆完 n 行
    for (let col = 0; col < n; col++) {
      if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col))
        continue;                   // 剪枝：列或对角线冲突，跳过
      queens[row] = col; cols.add(col); diag1.add(row - col); diag2.add(row + col); // 做
      dfs(row + 1);                                                                  // 递
      queens[row] = -1; cols.delete(col); diag1.delete(row - col); diag2.delete(row + col); // 撤
    }
  };
  dfs(0);
  return res;
}
```

- **对角线的妙算**：主对角线上所有格子 `row - col` 相同（如 `(0,0)/(1,1)/(2,2)` 都是 0），副对角线 `row + col` 相同（如 `(0,2)/(1,1)/(2,0)` 都是 2）——用两个 Set 即可 O(1) 查冲突，不用扫整条对角线。
- **复杂度**：最坏 O(n!)（第 1 行 n 选、第 2 行约 n−1 选……），剪枝后实际远小。N=8 约 92 解，N≤15 可接受。

## 二、数独求解：回溯求一个解

**问题**：填完一个 9×9 数独（每行/列/3×3 宫含 1~9 各一次）。

**思路**：逐格扫描，遇到空格就「试 1~9，合法就填并递归，全填满即解」。因为**只求一个解**，找到后 `return true` 提前退出整条递归链。

```js
function solveSudoku(board) {
  const valid = (r, c, ch) => {
    for (let i = 0; i < 9; i++) {
      if (board[r][i] === ch || board[i][c] === ch) return false; // 行/列
    }
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;  // 3×3 宫左上角
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        if (board[br + i][bc + j] === ch) return false;
    return true;
  };
  const dfs = () => {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        if (board[r][c] !== '.') continue;     // 已填，跳过
        for (let ch = '1'; ch <= '9'; ch++) {
          if (!valid(r, c, ch)) continue;       // 剪枝：不合法跳过
          board[r][c] = ch;                      // 做
          if (dfs()) return true;                // 递：成功就一路 return true
          board[r][c] = '.';                     // 撤
        }
        return false;                            // 1~9 都不行，此格无解，回退
      }
    return true;                                 // 全部填满，成功
  };
  dfs();
}
```

- **为何能求一解即停**：`dfs()` 返回布尔，一旦底层 `return true`，每层都 `return true` 一路传上去，省掉剩余搜索。
- **优化**：每次选「**候选最少的空格**」先填（约束传播思想），能大幅剪枝——这是高级数独求解器（Dancing Links）的雏形。

## 三、单词搜索：网格 DFS + 回溯

**问题**：在 m×n 网格中判断是否存在某单词路径（上下左右相邻，同一格子不能用两次）。

**思路**：从每个匹配首字母的格子出发 DFS，用「临时把格子改成特殊字符」标记已访问，递归返回后改回来——这是回溯的撤销选择在网格上的应用。

```js
function exist(board, word) {
  const m = board.length, n = board[0].length;
  const dfs = (i, j, k) => {
    if (k === word.length) return true;         // 匹配完
    if (i < 0 || i >= m || j < 0 || j >= n || board[i][j] !== word[k])
      return false;                              // 越界或不匹配
    const tmp = board[i][j];
    board[i][j] = '#';                           // 做：标记已访问
    const found = dfs(i+1, j, k+1) || dfs(i-1, j, k+1)
               || dfs(i, j+1, k+1) || dfs(i, j-1, k+1); // 四方向递归
    board[i][j] = tmp;                           // 撤：恢复
    return found;
  };
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      if (dfs(i, j, 0)) return true;
  return false;
}
```

- **撤销选择**：把格子临时改成 `#` 等价于「设 visited」，递归返回后改回 `tmp`——这一步不能漏，否则后续路径会被错误标记为已访问。
- **剪枝**：若 `word` 中某字母在网格里根本不够数，直接 `return false`（可行性预估）。

## 四、分割问题：回文分割

**问题**：把字符串切成若干段，使每段都是回文，返回所有切法。

**思路**：用 `start` 索引枚举「**第一段在哪断**」——`s[start..i]` 是回文就切下来，递归处理 `s[i+1..]`，是子集树思想。

```js
function partition(s) {
  const res = [], path = [];
  const isPal = (l, r) => { while (l < r) { if (s[l++] !== s[r--]) return false; } return true; };
  const dfs = (start) => {
    if (start === s.length) { res.push([...path]); return; } // 切完整串
    for (let i = start; i < s.length; i++) {
      if (!isPal(start, i)) continue;            // 剪枝：非回文的断点跳过
      path.push(s.slice(start, i + 1));           // 做：切下回文段
      dfs(i + 1);                                 // 递：处理剩余
      path.pop();                                 // 撤
    }
  };
  dfs(0);
  return res;
}
```

- **剪枝**：`isPal` 判断是 O(n)，可用**预处理动态规划表**（`dp[l][r]` 表示 `s[l..r]` 是否回文）降到 O(1)，整体从 O(n·2ⁿ) 优化常数。
- **同类**：复原 IP 地址（每段 0~255、总 4 段）、单词拆分方案枚举。

## 五、组合总和：剪枝实战

**问题**：从 `candidates`（无重复）选若干数（可重复用）凑 `target`，返回所有方案。

排序 + 超限 `break` 的剪枝能把搜索量砍掉一半以上（详见[回溯框架与剪枝优化](./framework-and-pruning)的剪枝节）：

```js
function combinationSum(candidates, target) {
  candidates.sort((a, b) => a - b);          // 排序是剪枝前提
  const res = [], path = [];
  const dfs = (start, sum) => {
    if (sum === target) { res.push([...path]); return; }
    for (let i = start; i < candidates.length; i++) {
      if (sum + candidates[i] > target) break; // 升序后后续更大，break 整个 for
      path.push(candidates[i]);
      dfs(i, sum + candidates[i]);             // i 不是 i+1：可重复选
      path.pop();
    }
  };
  dfs(0, 0);
  return res;
}
```

- **去重变体**（每个数只能用一次）：`dfs(i + 1)`，且先排序 + `if (i > start && c[i] === c[i-1]) continue;` 跳过同层重复。

## 六、剪枝实战总结

| 问题 | 剪枝手段 | 效果 |
| --- | --- | --- |
| N 皇后 | 对角线 Set O(1) 查冲突 | 避免扫整条对角线 |
| 组合总和 | 排序后 `sum+x>target` 就 `break` | 砍掉整棵超限子树 |
| 单词搜索 | 字母频次预估、首字母才出发 | 跳过无解起点 |
| 回文分割 | 预处理 DP 表把 isPal 降到 O(1) | 整体常数减半 |
| 子集/子序列 | `i > start && a[i] === a[i-1]` 跳同层 | 去掉重复子集 |

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/n-queens" target="_blank" rel="noopener noreferrer">N 皇后可视化演示</a> —— 逐行放置、列与对角线冲突剪枝
- <a href="https://algo.illegalscreed.cn/docs/sudoku" target="_blank" rel="noopener noreferrer">数独可视化演示</a> —— 约束满足的回溯求解

## 下一步

经典问题过完后，把所有模板、复杂度、易错点集中速查，见[参考](../reference)。
