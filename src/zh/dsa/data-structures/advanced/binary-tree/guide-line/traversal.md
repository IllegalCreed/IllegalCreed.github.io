---
layout: doc
outline: [2, 3]
---

# 遍历：前序、中序、后序与层序

> 基于通用算法套路 · 核于 2026-07

## 速查

- **四种遍历**：前序（**根**左右）、中序（左**根**右）、后序（左右**根**）是深度优先 DFS；层序（逐层从左到右）是广度优先 BFS——**根的访问时机**决定前/中/后。
- **递归写法**：`traverse(node)` 里按序处理「根 → 递归左 → 递归右」，把根的处理放在递归前/中/后就分别得到前/中/后序——代码差异只在「处理根」那一行的位置。
- **迭代写法**：用**栈**模拟递归——前序最直观（栈：弹根→压右→压左）；中序一路向左压栈到底再弹出处理；后序可用「前序的镜像（根右左）再反转」或双标记法。
- **层序（BFS）**：用**队列**，每层处理一整层（弹出时把左右孩子入队）——求层信息（最深层、之字形层序、右视图）都要「逐层」而非「逐节点」。
- **复杂度**：四种遍历都是 **O(n) 时间**（每节点访问一次）；DFS 递归/迭代栈空间 O(h)（h 为树高，最坏 O(n)），层序队列空间 O(w)（w 为最大宽度，完美树 O(n)）。
- **BST 中序得升序**：BST 的中序遍历天然产生升序序列——这是「一边增删一边有序」的结构基础，也用于验证 BST、找第 k 小、中序转有序数组。
- **Morris 遍历**：用**线索化**（临时改右指针指回前驱）实现 O(1) 空间中序/前序，代价是会临时修改树（遍历完恢复），用于空间敏感场景。
- **前序 + 中序还原树**：前序定根（第一个），中序定左右子树范围（根左边是左子树、右边是右子树），递归重建——后序+中序同理（后序定根是最后一个）。
- **易错**：迭代前序「压栈先右后左」（才能弹出先左）；层序「逐层」要内层 while 记录本层大小；Morris 要恢复指针别留残线索。
- **进阶**：遍历是基础，BST 操作与平衡见[BST 与平衡树](./bst-and-balance)。

## 一、四种遍历：根的访问时机

给定一棵二叉树，**前/中/后序**都是 DFS，区别只在于「**根节点**相对其左右子树的访问时机」：

```
        1
       / \
      2   3
     / \   \
    4   5   6

前序（根左右）：1 2 4 5 3 6
中序（左根右）：4 2 5 1 3 6
后序（左右根）：4 5 2 6 3 1
层序（逐层）：   1 | 2 3 | 4 5 6
```

记忆口诀：**「根」的位置就是遍历名**——前序根在前，中序根在中，后序根在后。左右子树的相对顺序始终是「先左后右」。

## 二、递归写法

递归最直观——`traverse(node)` 里按序处理「根 → 递归左 → 递归右」，三者的排列顺序就是前/中/后序。

```js
const preorder = [];   // 前/中/后序结果
const inorder = [];
const postorder = [];

function dfs(root) {
  if (root === null) return;
  // —— 前序位置（根）——
  preorder.push(root.val);
  dfs(root.left);
  // —— 中序位置（根）——
  inorder.push(root.val);
  dfs(root.right);
  // —— 后序位置（根）——
  postorder.push(root.val);
}
```

- **前序位置**：进入节点**之前**（刚到达节点时）处理——常用于「自顶向下」传递信息（如求路径、复制树）。
- **中序位置**：左子树处理完、右子树处理之前——BST 中序得升序，常用于「有序性」问题。
- **后序位置**：左右子树都处理完之后——常用于「自底向上」汇总信息（如求高度、子树和、判断平衡）。

**复杂度**：时间 O(n)，每节点访问一次；递归栈空间 O(h)，h 为树高（平衡树 O(log n)，退化单链表 O(n)）。

## 三、迭代写法：用栈模拟递归

递归本质是系统调用栈，迭代就是**自己用栈**模拟。三种序里前序最直观，后序可由前序变形。

### 前序迭代（栈）

```js
function preorderIter(root) {
  if (!root) return [];
  const res = [], stack = [root];
  while (stack.length) {
    const node = stack.pop();        // 弹出根
    res.push(node.val);
    if (node.right) stack.push(node.right); // 先压右
    if (node.left) stack.push(node.left);   // 再压左（弹出时先左）
  }
  return res; // 1 2 4 5 3 6
}
```

**关键**：栈是后进先出，想「先访问左」就必须「先压右后压左」——这是最容易写反的地方。

### 中序迭代（栈 + 一路向左）

```js
function inorderIter(root) {
  const res = [], stack = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) {                    // 一路向左压栈到底
      stack.push(cur);
      cur = cur.left;
    }
    cur = stack.pop();               // 弹出最左节点（中序第一个）
    res.push(cur.val);
    cur = cur.right;                 // 转向右子树（右子树为空则下次弹出父）
  }
  return res; // 4 2 5 1 3 6
}
```

### 后序迭代（前序镜像 + 反转）

后序「左右根」反转后是「根右左」，恰好是「前序改成先压左后压右」的镜像——所以先按「根右左」遍历，再把结果反转。

```js
function postorderIter(root) {
  if (!root) return [];
  const res = [], stack = [root];
  while (stack.length) {
    const node = stack.pop();
    res.push(node.val);              // 按「根右左」收集
    if (node.left) stack.push(node.left);   // 先压左
    if (node.right) stack.push(node.right); // 再压右（弹出时先右）
  }
  return res.reverse();              // 反转得「左右根」: 4 5 2 6 3 1
}
```

## 四、层序遍历（BFS）：用队列

层序是**广度优先**——逐层从左到右访问，用**队列**（先进先出）。逐层处理时要在内层 while 记录「本层节点数」，才能区分层。

```js
function levelOrder(root) {
  if (!root) return [];
  const res = [], queue = [root];
  while (queue.length) {
    const levelSize = queue.length;      // 关键：记录本层节点数
    const level = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();        // 出队
      level.push(node.val);
      if (node.left) queue.push(node.left);   // 左右孩子入队
      if (node.right) queue.push(node.right);
    }
    res.push(level);                     // res = [[1],[2,3],[4,5,6]]
  }
  return res;
}
```

- **逐层 vs 逐节点**：若只要求「层序序列」不分层，可不记 `levelSize`；但求「最深层」「之字形」「右视图」「层平均值」都要逐层，必须记 `levelSize`。
- **复杂度**：时间 O(n)；队列空间 O(w)，w 为最大宽度（完美树最后一层 w = n/2）。

### 经典变体

- **之字形层序**（LeetCode 103）：偶数层（从 0 计）反转 `level`。
- **二叉树右视图**（LeetCode 199）：每层最后一个节点（`i === levelSize - 1`）。
- **最小深度**（LeetCode 111）：BFS 遇到第一个叶子就返回当前层数——比 DFS 快（提前终止）。

## 五、Morris 遍历：O(1) 空间

Morris 遍历用**线索化**（临时把节点的空右指针指回中序前驱）实现 O(1) 空间中序/前序，代价是遍历中会临时修改树结构（遍历完恢复）。

```js
function morrisInorder(root) {
  const res = [];
  let cur = root;
  while (cur) {
    if (cur.left === null) {             // 无左子：访问当前，转向右
      res.push(cur.val);
      cur = cur.right;
    } else {
      let prev = cur.left;               // 找中序前驱（左子树最右节点）
      while (prev.right && prev.right !== cur) prev = prev.right;
      if (prev.right === null) {         // 第一次到：建线索，转左
        prev.right = cur;
        cur = cur.left;
      } else {                           // 第二次到：删线索，访问，转右
        prev.right = null;
        res.push(cur.val);
        cur = cur.right;
      }
    }
  }
  return res;
}
```

- **空间 O(1)**：不用栈也不用递归，常量额外空间——这是核心价值。
- **代价**：每个有左子的节点会被访问两次（建线索一次、删线索一次），但总访问仍 O(n)；且遍历中树被临时修改，**多线程/并发场景要谨慎**。

## 六、前序 + 中序还原二叉树

给定**前序**和**中序**遍历序列，能唯一还原原二叉树（假设值唯一）。原理：前序第一个是根，中序里根的位置把序列分成左子树和右子树两段，递归处理。

```js
function buildTree(preorder, inorder) {
  const map = new Map();                 // 值 → 中序下标，O(1) 定位根
  inorder.forEach((v, i) => map.set(v, i));
  let preIdx = 0;
  function build(left, right) {
    if (left > right) return null;
    const rootVal = preorder[preIdx++];  // 前序定根
    const root = new TreeNode(rootVal);
    const mid = map.get(rootVal);        // 中序定左右子树范围
    root.left = build(left, mid - 1);    // 中序 [left, mid-1] 是左子树
    root.right = build(mid + 1, right);  // 中序 [mid+1, right] 是右子树
    return root;
  }
  return build(0, inorder.length - 1);
}
```

- **为什么前序 + 中序够**：前序定「谁是根」，中序定「根的左右子树各包含哪些节点」——两者结合能唯一确定每个子树的根和边界。
- **后序 + 中序同理**：后序最后一个是根（而非第一个），其余逻辑相同。
- **前序 + 后序不行**：无法唯一还原（当某节点只有一个孩子时，无法区分该孩子是左还是右），除非是满二叉树。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/tree" target="_blank" rel="noopener noreferrer">二叉树可视化演示</a> —— 四种遍历的逐步执行过程

## 下一步

遍历是二叉树所有操作的基础。当二叉树加上**有序约束**（左<根<右），就得到 BST——它的查找/插入/删除都走一条从根到叶的路径 O(h)，但会面临「退化为链表」的问题，见[BST 与平衡树](./bst-and-balance)。
