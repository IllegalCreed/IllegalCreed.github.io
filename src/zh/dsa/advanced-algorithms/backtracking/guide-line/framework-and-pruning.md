---
layout: doc
outline: [2, 3]
---

# 回溯框架与剪枝优化

> 基于通用算法套路 · 核于 2026-07

## 速查

- **通用模板**：`for (选择 of 选择列表) { 做选择; backtrack(); 撤销选择; }`——所有回溯题都长这样，区别只在「选择列表怎么生成、何时记录答案、剪枝条件」。
- **三要素**：**结束条件**（`path` 满足要求就记录并 return）、**选择列表**（当前还能做哪些合法选择）、**撤销**（递归返回后恢复状态）。
- **全排列（排列树）**：用 `used[i]` 数组标记已用元素，for 遍历所有 `!used[i]` 的元素——**顺序有关**，`[1,2]` 和 `[2,1]` 是两个解。
- **组合/子集（子集树）**：用一个 `start` 索引，for 从 `start` 开始只往后选——**顺序无关**，避免 `[1,2]`/`[2,1]` 重复。
- **`used` vs `start` 的判别**：元素「**是否区分顺序**」决定——区分用 `used`（排列），不区分用 `start`（组合/子集）。这是最高频的模板分水岭。
- **剪枝三招**：①**约束剪枝**（递归前判合法性，如 N 皇后列冲突直接跳过）；②**排序剪枝**（排序后 `continue` 掉明显无解的，如组合总和超 target 跳过）；③**可行性预估**（剩余元素不够/必然超限时提前 return）。
- **剪枝的正确性**：剪枝条件必须是「**这条分支一定无解**」（充分条件），不能误剪有解分支——宁可少剪不可错剪。
- **去重剪枝**：含重复元素时，**先排序**，再 `if (i > 0 && a[i] === a[i-1] && !used[i-1]) continue;`（排列）或 `if (i > start && a[i] === a[i-1]) continue;`（组合），跳过同层重复。
- **复杂度**：子集类 O(2ⁿ)、排列类 O(n!)，剪枝只降常数不降阶——N 大必爆炸。
- **进阶顺序**：[经典回溯问题](./classic-problems) → [参考](../reference)。

## 一、通用回溯模板

所有回溯题都套同一个骨架，背下来后只需改三处（选择列表、结束条件、剪枝）：

```js
function backtrack(状态参数) {
  if (满足结束条件) {            // 1. 结束条件：path 达到要求
    res.push([...path]);         //    记录答案（注意浅拷贝！）
    return;
  }
  for (选择 of 当前选择列表) {    // 2. 遍历所有合法选择
    if (不满足剪枝条件) continue; //    剪枝：跳过注定无解的分支
    做选择;                      //    把选择作用到状态上
    backtrack(新状态);            // 3. 递归进入下一层
    撤销选择;                    // 4. 关键：恢复状态
  }
}
```

**四个高频坑**：

1. **`res.push([...path])` 必须浅拷贝**：直接 `push(path)` 存的是引用，最后 `path` 会被清空，`res` 里全是空数组。
2. **撤销选择必须成对**：`push` 配 `pop`、`used[i]=true` 配 `used[i]=false`，漏一个全错。
3. **结束条件 + return**：记录答案后要 `return`（或继续——看是否还要更长的解，如组合总和）。
4. **剪枝在 `for` 内、做选择前**：判断的是「这个选择值不值得做」，不值得就 `continue` 跳过。

## 二、全排列：排列树 + used 数组

**问题**：给定 `nums`，返回所有不重复的全排列。

排列树的每个节点「从剩余未用元素里选一个」，用 `used` 数组追踪哪些已选：

```js
function permute(nums) {
  const res = [], path = [];
  const used = Array(nums.length).fill(false);
  const dfs = () => {
    if (path.length === nums.length) { res.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;                 // 已用，跳过
      used[i] = true; path.push(nums[i]);    // 做选择
      dfs();                                  // 递归
      path.pop(); used[i] = false;            // 撤销选择
    }
  };
  dfs();
  return res;
}
```

- **为什么用 `used` 不用 `start`**：排列**区分顺序**，`[1,2]` 和 `[2,1]` 都合法，每个位置都要能选任意未用元素，所以 for 从 `0` 开始全扫，靠 `used` 过滤已选。
- **含重复元素的去重**（排列 II）：先排序，再 `if (i > 0 && nums[i] === nums[i-1] && !used[i-1]) continue;`——意思是「同层里，当前元素和前一个相同、且前一个没被用过（说明是同层回退来的）」，跳过避免重复排列。

## 三、组合：子集树 + start 索引

**问题**：从 `1..n` 选 `k` 个数的所有组合。

组合**不区分顺序**（`[1,2]` 和 `[2,1]` 算同一个），用 `start` 限定「只往后选」，从源头杜绝重复：

```js
function combine(n, k) {
  const res = [], path = [];
  const dfs = (start) => {
    if (path.length === k) { res.push([...path]); return; }
    for (let i = start; i <= n; i++) {        // 从 start 往后选
      path.push(i);                            // 做选择（无需 used）
      dfs(i + 1);                              // 递归：下一个起点是 i+1
      path.pop();                              // 撤销选择
    }
  };
  dfs(1);
  return res;
}
```

- **为什么 `start` 能去重**：规定「**后选的下标必须大于先选的**」，那么 `[1,2]` 会出现（选了 1 再选 2），但 `[2,1]` 永远不会出现（选了 2 后只能选 ≥3），天然只产生一种顺序。
- **组合总和**（元素可重复用）：把 `dfs(i + 1)` 改成 `dfs(i)`（同一元素可再选）；不可重复用就是 `dfs(i + 1)`。

## 四、子集：子集树的「选/不选」

**问题**：返回 `nums` 的所有子集（幂集）。

子集无需固定长度，**每个节点都是答案**（不只是叶子）：

```js
function subsets(nums) {
  const res = [], path = [];
  const dfs = (start) => {
    res.push([...path]);                       // 每个节点都记录（包括空集）
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      dfs(i + 1);
      path.pop();
    }
  };
  dfs(0);
  return res;
}
```

- **没有结束条件的 `return`**：因为每个节点都要收，靠「`for` 自然走完（`start` 越界）」终止递归。
- **含重复元素的去重**（子集 II）：先排序，再 `if (i > start && nums[i] === nums[i-1]) continue;`——同层里跳过与前一个相同的元素。

## 五、三模板对比

| 模板 | 树类型 | 去重手段 | 记录答案时机 | 典型题 |
| --- | --- | --- | --- | --- |
| **全排列** | 排列树 | `used[i]` 数组 | `path.length === n`（叶子） | 全排列、字母大小写全排列 |
| **组合** | 子集树 | `start` 索引（只往后选） | `path.length === k`（叶子） | 组合、组合总和 |
| **子集** | 子集树 | `start` 索引 | **每个节点**都记录 | 子集、幂集、递增子序列 |

**记忆口诀**：**排列用 `used`（全扫），组合子集用 `start`（往后扫）**。

## 六、剪枝：把无解分支提前砍掉

剪枝是回溯从「能跑」到「跑得快」的关键。核心思路：**在递归前判断「这条分支一定无解」，直接 `continue`/`return` 跳过整棵子树**。

### 剪枝三招

```js
// 1. 约束剪枝：递归前判合法性
for (const col of 所有列) {
  if (冲突(row, col)) continue;   // 列/对角线冲突 → 跳过（N 皇后）
  // ...
}

// 2. 排序剪枝：排序后跳过明显无解的（组合总和）
nums.sort((a, b) => a - b);
for (let i = start; i < nums.length; i++) {
  if (sum + nums[i] > target) break;  // 升序后，后续更大，直接 break 整个 for
  // ...
}

// 3. 可行性预估：剩余不够 / 必然超限
if (path.length + (n - start) < k) return; // 剩余元素不够凑够 k 个，return
```

### 剪枝的正确性原则

剪枝条件必须是「**这条分支一定无解**」的**充分条件**——即「满足条件 ⇒ 一定无解」，这样剪掉才安全。**宁可少剪不可错剪**：如果条件只是「可能无解」就剪，会漏掉合法解。验证方法是问自己：「被剪掉的子树里，**理论上还有没有可能存在合法解**？如果没有，剪得对。」

### 经典：组合总和的剪枝

```js
function combinationSum(candidates, target) {
  candidates.sort((a, b) => a - b);          // 排序是剪枝前提
  const res = [], path = [];
  const dfs = (start, sum) => {
    if (sum === target) { res.push([...path]); return; }
    for (let i = start; i < candidates.length; i++) {
      if (sum + candidates[i] > target) break; // 剪枝：升序，后续更大，break
      path.push(candidates[i]);
      dfs(i, sum + candidates[i]);             // i 不是 i+1：可重复选
      path.pop();
    }
  };
  dfs(0, 0);
  return res;
}
```

排序后，`sum + candidates[i] > target` 时，**后面的元素更大**，加进去也必然超 target，所以 `break` 跳过整个 for（不是 `continue`）——这把组合总和的搜索量砍掉一大半。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/permutations" target="_blank" rel="noopener noreferrer">全排列可视化演示</a> —— 排列树上的 used 数组分支控制
- <a href="https://algo.illegalscreed.cn/docs/subsets" target="_blank" rel="noopener noreferrer">子集可视化演示</a> —— 子集树上的「选/不选」搜索

## 下一步

掌握了模板与剪枝后，把它们用到 N 皇后、数独、单词搜索等经典问题上，见[经典回溯问题](./classic-problems)。
