---
layout: doc
outline: [2, 3]
---

# 参考：二叉树 API、遍历与复杂度速查

> 基于通用数据结构概念 · 核于 2026-07

## 速查

- **定义**：二叉树 = 根 + 左子树 + 右子树（递归定义，空树合法）；BST 加约束「左 < 根 < 右」。
- **核心复杂度**：查找/插入/删除 **O(h)**；遍历（四种）**O(n)**；空间：DFS 栈 O(h)、层序队列 O(w)、Morris O(1)。
- **链式存储**：`{val, left, right}` 节点，通用二叉树标准存储；数组存储：节点 `i` 的左孩子 `2i+1`、右孩子 `2i+2`、父 `(i-1)>>1`，仅适合完全/满二叉树。
- **四种遍历**：前序（根左右）、中序（左根右）、后序（左右根）DFS + 层序 BFS；前/中/后序递归写法只差「处理根」的位置。
- **迭代写法**：前序（栈：压右再压左）；中序（栈 + 一路向左）；后序（前序镜像反转）；层序（队列逐层）。
- **BST 中序得升序**：验证 BST、找第 k 小、BST 转有序数组都靠它。
- **BST 删除三情况**：叶子直接删 / 单子顶替 / 双子用中序后继替换再删后继。
- **平衡树**：AVL（高度差 ≤ 1，查找最快、增删旋转多）、红黑树（弱平衡，增删最多 2/3 次旋转，工业标准）。
- **退化风险**：BST 按有序序列插入退化为单链表 O(n)，故实际用平衡树。
- **升级路径**：完全二叉树 + 数组 → 堆；BST + 平衡 → 红黑树/AVL；区间树 → 线段树/树状数组。
- **交互演示**：[二叉树可视化](https://algo.illegalscreed.cn/docs/tree)。

## 一、核心复杂度表

| 操作 | 普通二叉树 | BST（平衡） | BST（退化为链表） | 说明 |
| --- | --- | --- | --- | --- |
| 查找指定值 | O(n) | **O(log n)** | O(n) | BST 沿树下行二分 |
| 插入 | O(1)（已知位置） | **O(log n)** | O(n) | BST 找空位再挂 |
| 删除 | O(1)（已知位置） | **O(log n)** | O(n) | 双子节点要找后继 |
| 遍历（前/中/后/层序） | **O(n)** | **O(n)** | **O(n)** | 每节点访问一次 |
| 求高度/深度 | O(n) | O(n) | O(n) | 后序自底向上 |
| 空间（DFS 栈） | O(h) | O(log n) | O(n) | h 为树高 |
| 空间（层序队列） | O(w) | O(n) | O(1) | w 为最大宽度 |
| 空间（Morris） | **O(1)** | **O(1)** | **O(1)** | 线索化，临时改树 |

## 二、节点定义与链式/数组存储

```js
// 链式存储（通用）
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// 数组存储（完全/满二叉树，根在下标 0）
// 节点 i 的左孩子 2i+1，右孩子 2i+2，父 (i-1)>>1
const tree = [1, 2, 3, 4, 5, null, 6]; // null 表示空洞
const leftChild = (i) => 2 * i + 1;
const rightChild = (i) => 2 * i + 2;
const parent = (i) => (i - 1) >> 1;
```

## 三、四种遍历代码模板

```js
// 前序（根左右）递归
function preorder(root, res = []) {
  if (!root) return res;
  res.push(root.val);
  preorder(root.left, res);
  preorder(root.right, res);
  return res;
}

// 前序迭代（栈：压右再压左）
function preorderIter(root) {
  if (!root) return [];
  const res = [], stack = [root];
  while (stack.length) {
    const n = stack.pop();
    res.push(n.val);
    if (n.right) stack.push(n.right);
    if (n.left) stack.push(n.left);
  }
  return res;
}

// 中序迭代（栈 + 一路向左）—— BST 得升序
function inorderIter(root) {
  const res = [], stack = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) { stack.push(cur); cur = cur.left; }
    cur = stack.pop();
    res.push(cur.val);
    cur = cur.right;
  }
  return res;
}

// 后序迭代（前序镜像「根右左」再反转）
function postorderIter(root) {
  if (!root) return [];
  const res = [], stack = [root];
  while (stack.length) {
    const n = stack.pop();
    res.push(n.val);
    if (n.left) stack.push(n.left);
    if (n.right) stack.push(n.right);
  }
  return res.reverse();
}

// 层序（BFS，队列逐层）
function levelOrder(root) {
  if (!root) return [];
  const res = [], queue = [root];
  while (queue.length) {
    const size = queue.length, level = [];
    for (let i = 0; i < size; i++) {
      const n = queue.shift();
      level.push(n.val);
      if (n.left) queue.push(n.left);
      if (n.right) queue.push(n.right);
    }
    res.push(level);
  }
  return res;
}
```

## 四、Morris 中序（O(1) 空间）

```js
function morrisInorder(root) {
  const res = [];
  let cur = root;
  while (cur) {
    if (!cur.left) {              // 无左子：访问，转右
      res.push(cur.val);
      cur = cur.right;
    } else {
      let prev = cur.left;        // 找前驱（左子树最右）
      while (prev.right && prev.right !== cur) prev = prev.right;
      if (!prev.right) {          // 建线索，转左
        prev.right = cur;
        cur = cur.left;
      } else {                    // 删线索，访问，转右
        prev.right = null;
        res.push(cur.val);
        cur = cur.right;
      }
    }
  }
  return res;
}
```

## 五、BST 操作模板

```js
// 查找（迭代，沿树下行二分）
function search(root, target) {
  let cur = root;
  while (cur) {
    if (target === cur.val) return cur;
    cur = target < cur.val ? cur.left : cur.right;
  }
  return null;
}

// 插入（递归，找到空位再挂）
function insert(root, val) {
  if (!root) return new TreeNode(val);
  if (val < root.val) root.left = insert(root.left, val);
  else if (val > root.val) root.right = insert(root.right, val);
  return root;
}

// 删除（三情况：叶子/单子/双子-后继）
function deleteNode(root, key) {
  if (!root) return null;
  if (key < root.val) root.left = deleteNode(root.left, key);
  else if (key > root.val) root.right = deleteNode(root.right, key);
  else {
    if (!root.left) return root.right;     // 无左子：右子顶替
    if (!root.right) return root.left;     // 无右子：左子顶替
    let succ = root.right;                  // 双子：找中序后继
    while (succ.left) succ = succ.left;
    root.val = succ.val;
    root.right = deleteNode(root.right, succ.val);
  }
  return root;
}

// 验证 BST（中序严格递增）
function isValidBST(root) {
  let prev = -Infinity;
  function inorder(node) {
    if (!node) return true;
    if (!inorder(node.left)) return false;
    if (node.val <= prev) return false;    // 中序位置比较前驱
    prev = node.val;
    return inorder(node.right);
  }
  return inorder(root);
}

// 前序 + 中序还原树
function buildTree(preorder, inorder) {
  const map = new Map();
  inorder.forEach((v, i) => map.set(v, i));
  let preIdx = 0;
  function build(left, right) {
    if (left > right) return null;
    const rootVal = preorder[preIdx++];
    const mid = map.get(rootVal);
    const node = new TreeNode(rootVal);
    node.left = build(left, mid - 1);
    node.right = build(mid + 1, right);
    return node;
  }
  return build(0, inorder.length - 1);
}
```

## 六、平衡树对比

| 维度 | AVL 树 | 红黑树 |
| --- | --- | --- |
| 平衡条件 | 左右子树高度差 ≤ 1 | 五条性质（无连续红、黑高相同） |
| 树高 | 较矮（查找快） | 较高（≤ 2 倍最短路径） |
| 查找复杂度 | **O(log n)**（常数小） | O(log n)（常数大） |
| 插入旋转次数 | 最多 1 次（双旋算 2） | 最多 2 次 |
| 删除旋转次数 | **最坏 O(log n) 次** | **最多 3 次** |
| 适合场景 | 查找密集（读多写少） | 增删频繁（读写均衡） |
| 工业应用 | 部分数据库索引 | C++ `map`/`set`、Java `TreeMap`、Linux CFS、epoll |
| 语言容器 | — | Java `TreeMap`/`TreeSet`（`ConcurrentHashMap` 用红黑+CAS） |

## 七、易错点清单

- **深度 vs 高度方向**：深度「自顶向下」从根累加（递归往下传参），高度「自底向上」从叶累加（递归返回合）——别搞反。
- **前序迭代压栈顺序**：想弹出「先左」就必须「先压右后压左」——最易写反。
- **层序忘记记录本层大小**：`levelSize = queue.length` 必须在每层循环开始时记录，否则 `queue.shift` 后大小变了。
- **BST 删除双子节点**：必须用**中序后继**（右子树最小）替换再删后继，不能直接拿右子树顶替（会丢左子树）。
- **验证 BST 不能只比左右孩子**：`node.left.val < node.val` 不够，必须保证**整个左子树**都小于根——要用中序遍历或传递合法上下界。
- **BST 退化为链表**：按有序序列插入会退化，朴素 BST 实际工程不用，必须配平衡。
- **Morris 遍历要恢复指针**：第二次访问时要 `prev.right = null` 删线索，否则树被永久改坏。
- **数组存储只适合完全二叉树**：普通树有空洞，退化单链表要 2^h 大小数组。
- **前序 + 后序不能唯一还原**：单孩子节点无法区分左右，除非是满二叉树。
- **满/完全/完美混淆**：满 = 非叶必双子；完全 = 层序紧凑左对齐；完美 = 每层都满。

## 八、进阶方向（链接其他叶）

- **堆**：完全二叉树 + 数组存储 + 堆性质 —— 见[堆](../heap/) 叶
- **哈夫曼树**：带权路径最短的二叉树，用于数据压缩 —— 见相关叶
- **字典树（Trie）**：多叉前缀树，用于字符串检索 —— 见相关叶
- **线段树/树状数组**：基于完全二叉树的区间操作结构 —— 见相关叶
- **平衡树实现细节**：AVL 旋转、红黑树增删 —— 属于高级叶

## 权威链接

- [二叉树 - 维基百科](https://zh.wikipedia.org/wiki/%E4%BA%8C%E5%8F%89%E6%A0%91)
- [二叉搜索树 - 维基百科](https://zh.wikipedia.org/wiki/%E4%BA%8C%E5%85%83%E6%90%9C%E5%B0%8B%E6%A8%B9)
- [红黑树 - 维基百科](https://zh.wikipedia.org/wiki/%E7%BA%A2%E9%BB%91%E6%A0%91)
- [Binary Tree - GeeksforGeeks](https://www.geeksforgeeks.org/binary-tree-data-structure/)
- [Tree Traversal - LeetCode 探索](https://leetcode.com/explore/learn/card/data-structure-tree/)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/tree" target="_blank" rel="noopener noreferrer">二叉树可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/binary-tree-slide/" target="_blank">二叉树与二叉搜索树</a>
