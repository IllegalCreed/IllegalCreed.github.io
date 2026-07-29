---
layout: doc
outline: [2, 3]
---

# 矩阵遍历：行主序、螺旋与旋转

> 基于通用算法套路 · 核于 2026-07

## 速查

- **矩阵 = 二维数组**，存储有**行主序（Row-major，C/C++/Java/Python/JS）**和**列主序（Column-major，Fortran/MATLAB/OpenGL）**两种——行主序即 `a[i][j]` 中 `i` 的连续性更强（`a[i][0]`、`a[i][1]` 相邻），遍历应**外层行内层列**才缓存友好。
- **缓存友好遍历原则**：行主序矩阵务必**外层 `i` 行、内层 `j` 列**（`a[i][j]`）顺序访问；反过来外层列内层行会跳着访问缓存行，慢几倍。
- **螺旋矩阵（顺时针）**：维护 `top/bottom/left/right` 四个边界，按「上→右→下→左」循环剥皮，每剥完一边收缩对应边界，直到 `top>bottom || left>right`。
- **矩阵旋转 90°（顺时针）**：**转置 + 每行翻转**（`transpose` 后 `reverse each row`）；逆时针 90° = 转置 + 每列翻转；180° = 整体翻转两次或行列各翻转。
- **矩阵的物理地址（行主序）**：`a[i][j] 地址 = base + (i × 列数 + j) × 元素大小`——所以 `a[i][j]` 与 `a[i][j+1]` 物理相邻，`a[i][列数-1]` 与 `a[i+1][0]` 也相邻。
- **之字形遍历**：奇偶行方向交替（偶数行左→右、奇数行右→左），或用方向变量 `(di, dj)` 在撞墙时翻转。
- **邻接矩阵**：图用 `n×n` 矩阵表示（`a[i][j]=1` 表示有边）——属于「图的表示」叶，此处作为矩阵的应用点一下。
- **复杂度**：所有遍历类操作 O(m×n)；旋转/转置也是 O(m×n)。

## 一、行主序与缓存友好

内存是一维的，二维矩阵必须拍平存放。**行主序**（C 系语言）把每行连续存放：

```
矩阵:        行主序内存（一维）:
1 2 3        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
4 5 6          ↑_______第 0 行_______↑↑_______第 1 行...
7 8 9
...
```

行主序下，`a[i][j]` 的物理地址是 `base + (i × cols + j) × size`——同一行元素物理相邻，跨行（`a[i][cols-1]` → `a[i+1][0]`）也相邻。

**遍历必须外层行、内层列**：

```js
// ✅ 缓存友好：外层 i 行，内层 j 列，顺序访问连续内存
for (let i = 0; i < rows; i++) {
  for (let j = 0; j < cols; j++) {
    process(matrix[i][j]); // a[i][0], a[i][1], ... 连续
  }
}

// ❌ 缓存不友好：外层 j 列，内层 i 行，跳着访问（每次跨一行）
for (let j = 0; j < cols; j++) {
  for (let i = 0; i < rows; i++) {
    process(matrix[i][j]); // a[0][j], a[1][j], ... 跳跃
  }
}
```

CPU 缓存以缓存行（通常 64 字节）为单位加载，连续访问能命中缓存；跳跃访问每次都要从内存重新取，大矩阵时差几倍。这是「大 O 相同但常数差很大」的典型。

> 列主序（Fortran/MATLAB/OpenGL）正好相反——它的列在内存里连续，所以外层列、内层行才缓存友好。混用库时（如 NumPy 默认行主序但支持 `order='F'`）要注意。

## 二、螺旋矩阵：剥洋葱

按顺时针从外到内逐层遍历（LeetCode 54 输出螺旋序、59 生成螺旋矩阵）。核心是维护 `top/bottom/left/right` 四个边界，每剥一圈收缩一格。

```js
// 螺旋遍历输出所有元素（顺时针，LeetCode 54）
function spiralOrder(matrix) {
  const res = [];
  let top = 0, bottom = matrix.length - 1;
  let left = 0, right = matrix[0].length - 1;
  while (top <= bottom && left <= right) {
    for (let j = left; j <= right; j++) res.push(matrix[top][j]);    // 上：左→右
    top++;
    for (let i = top; i <= bottom; i++) res.push(matrix[i][right]);  // 右：上→下
    right--;
    if (top <= bottom) {
      for (let j = right; j >= left; j--) res.push(matrix[bottom][j]); // 下：右→左
      bottom--;
    }
    if (left <= right) {
      for (let i = bottom; i >= top; i--) res.push(matrix[i][left]);   // 左：下→上
      left++;
    }
  }
  return res;
}
```

- **四步一圈**：上边左→右、右边上→下、下边右→左、左边下→上，每完成一边收缩对应边界。
- **最后两步要判 `top<=bottom` / `left<=right`**：当只剩一行或一列时，下边和左边会重复遍历——必须加判断避免重复（这是最易错点）。
- **生成螺旋矩阵（LeetCode 59）**：把 `res.push` 换成「按顺序填 `1,2,3,...`」即可，框架完全相同。

## 三、矩阵旋转：转置 + 翻转

**顺时针旋转 90° 的标准做法 = 先转置、再每行翻转**：

```
原矩阵      转置(transpose)    每行翻转(reverse row) = 顺时针90°
1 2 3       1 4 7              7 4 1
4 5 6  -->  2 5 8        -->   8 5 2
7 8 9       3 6 9              9 6 3
```

```js
// 顺时针旋转 90°（原地，LeetCode 48）
function rotate(matrix) {
  const n = matrix.length;
  // 1. 转置：沿主对角线交换 matrix[i][j] <-> matrix[j][i]
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
  }
  // 2. 每行翻转
  for (const row of matrix) row.reverse();
}
```

- **转置注意只遍历上三角**（`j` 从 `i+1` 起），否则交换两次等于没换。
- **其他旋转**：逆时针 90° = 转置 + 每列翻转（或转置 + 每行翻转后整体再旋转）；180° = 整体上下翻转 + 左右翻转（或每行翻转 + 上下翻转）。
- **记忆口诀**：顺时针 90 = 转置 + 行翻转；理解来源——转置让主对角线对称，行翻转让列变成反向，合起来正是「先沿对角线、再沿竖中线」两次镜像 = 旋转 90°。

## 四、之字形遍历

偶数行从左到右、奇数行从右到左（或反过来）：

```js
function zigzag(matrix) {
  const res = [];
  for (let i = 0; i < matrix.length; i++) {
    if (i % 2 === 0) {
      for (let j = 0; j < matrix[i].length; j++) res.push(matrix[i][j]); // 偶数行左→右
    } else {
      for (let j = matrix[i].length - 1; j >= 0; j--) res.push(matrix[i][j]); // 奇数行右→左
    }
  }
  return res;
}
```

## 五、常见题型速览

| 题型 | 核心技巧 |
| --- | --- |
| 螺旋遍历/生成 | 四边界剥皮 |
| 旋转 90°/180°/270° | 转置 + 翻转 |
| 矩阵转置 | `a[i][j] ↔ a[j][i]`（遍历上三角） |
| 之字形遍历 | 奇偶行反向 |
| 矩阵置零（行列标记，LeetCode 73） | 用首行首列做标记 + 两个标志位 |
| 岛屿数量（LeetCode 200） | DFS/BFS 感染（见[图遍历](../../../graph/dfs-bfs/) 叶） |
| 矩阵搜索（行列递增，LeetCode 240） | 从右上角起，小则左移大则下移（对撞变体） |

## 六、易错点

- **螺旋遍历忘判剩余单行/单列**：下边和左边那两步必须 `if (top<=bottom)` / `if (left<=right)`，否则剩一行时会反向再遍历一遍。
- **转置遍历整个矩阵**：会交换两次回到原样——只遍历上三角（`j > i`）。
- **非方阵的转置**：`m×n` 矩阵转置是 `n×m`，不能原地（要新建数组）；只有方阵能原地转置。
- **缓存不友好遍历**：行主序矩阵外层遍历列——大矩阵性能差几倍。
- **坐标混淆 `(i,j)` 还是 `(row,col)`**：统一约定 `i=行`、`j=列`，`matrix[i][j]` 中 `i` 在外层。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/maze" target="_blank" rel="noopener noreferrer">迷宫可视化演示</a> —— 二维网格上的 DFS/BFS（矩阵遍历 + 方向数组）

## 下一步

数组叶到此完成。下一站进入下一个基本数据结构——[链表](../../linked-list/)，体会「O(1) 增删 vs O(1) 访问」的镜像差异。
