---
layout: doc
outline: [2, 3]
---

# 参考：数组 API、复杂度与套路速查

> 基于通用数据结构概念 · 核于 2026-07

## 速查

- **定义**：连续内存 + 同类型元素 + 下标随机访问；地址 `base + i × size`。
- **核心复杂度**：访问 `a[i]` **O(1)**；查找无序 O(n)/有序 O(log n)；**插入/删除 O(n)**（中间）；尾部增删 **O(1)**（动态摊还）。
- **静态 vs 动态**：静态容量固定；动态几何扩容（×2 或 ×1.5），单次扩容 O(n) 摊还 O(1)；`capacity` vs `size/length` 两概念。
- **双指针**：对撞（有序两端）/ 快慢（同向压实）/ 分离（两数组合并）—— O(n)。
- **滑动窗口**：`[left,right]` 右扩左缩，求连续子数组的最长/最短/恰好 —— O(n)；依赖窗口状态单调性。
- **前缀和**：`prefix[i]=a[0..i-1]`，`sum(l,r)=prefix[r+1]-prefix[l]` —— 查询 O(1)；二维用容斥。
- **差分数组**：`diff[l]+=v; diff[r+1]-=v` 实现区间加 —— 修改 O(1)；前缀和还原。
- **前缀和+哈希**：`和为 k 的子数组个数`，`count.set(0,1)` 初始化 —— O(n)，支持负数。
- **矩阵**：行主序外层行内层列（缓存友好）；旋转 90° = 转置 + 行翻转；螺旋 = 四边界剥皮。
- **升级路径**：查询与修改交替 → 树状数组（单点改区间查）/ 线段树（区间改区间查）。
- **交互演示**：[数组可视化](https://algo.illegalscreed.cn/docs/array)。

## 一、核心复杂度表

| 操作 | 最好 | 平均 | 最坏 | 说明 |
| --- | --- | --- | --- | --- |
| `a[i]` 访问/按下标改 | O(1) | O(1) | O(1) | 地址公式直接算 |
| 头部插入 | O(n) | O(n) | O(n) | 整体后移 |
| 头部删除 | O(n) | O(n) | O(n) | 整体前移 |
| 尾部插入（动态） | O(1) 摊还 | O(1) 摊还 | O(n)（触发扩容） | 几何扩容 |
| 尾部删除 | O(1) | O(1) | O(1) | — |
| 中间插入/删除 | O(n) | O(n) | O(n) | 搬移后续元素 |
| 查找（无序） | O(1) | O(n) | O(n) | 线性扫描 |
| 查找（有序） | O(1) | O(log n) | O(log n) | 二分 |
| 排序（比较型最优） | — | O(n log n) | O(n log n) | 快排/归并/堆排 |

## 二、各语言动态数组对照

| 语言 | 类型 | 长度属性 | 容量概念 | 扩容因子（典型） |
| --- | --- | --- | --- | --- |
| C++ | `std::vector<T>` | `.size()` | `.capacity()` | ×2(GCC)/×1.5(MSVC) |
| Java | `ArrayList<T>` | `.size()` | 内部 `elementData.length` | ×1.5 |
| JavaScript | `Array` | `.length` | 引擎内部 | ~×1.5~2(V8) |
| Python | `list` | `len()` | 内部 | ~×1.125 |
| Go | `slice` | `len(s)` | `cap(s)` | <1024 ×2，≥1024 ×1.25 |
| Rust | `Vec<T>` | `.len()` | `.capacity()` | ×2 |

## 三、JS Array 高频 API（动态数组视角）

```js
const a = [1, 2, 3];
// 尾部增删 O(1) 摊还
a.push(4);          // [1,2,3,4]，返回新长度
a.pop();            // [1,2,3]，返回 3
// 头部增删 O(n)（整体搬移）
a.unshift(0);       // [0,1,2,3]
a.shift();          // [1,2,3]
// 任意位置增删 O(n)
a.splice(1, 1);     // 删除下标 1 起 1 个
a.splice(1, 0, 9);  // 在下标 1 插入 9
// 查找
a.indexOf(2);       // 2，O(n)
a.includes(2);      // true，O(n)
// 排序（默认字典序！数字要传比较函数）
[10, 2, 1].sort();              // [1, 10, 2] —— 字典序陷阱
[10, 2, 1].sort((x, y) => x - y); // [1, 2, 10] —— 数值序
```

**陷阱**：JS `sort()` 默认按 **UTF-16 字典序**比较（把元素转字符串），所以 `[10,2,1].sort()` 得 `[1,10,2]`——数字排序**必须传比较函数**。

## 四、双指针套路清单

| 套路 | 指针方向 | 适用 | 典型题 |
| --- | --- | --- | --- |
| 对撞 | 相向（left↗ right↙） | 有序数组 | 两数之和、盛水、三数之和 |
| 快慢 | 同向（slow↗ fast↗） | 原地改造 | 移除元素、去重、移动零 |
| 分离 | 双轨（i↗ j↗） | 两有序数组 | 归并、交集 |
| 滑动窗口 | 同向（left↗ right↗） | 连续子数组 | 最长无重复、最小覆盖子串 |

## 五、滑动窗口万能框架

```js
let left = 0, ans = 0;
const window = new Map(); // 或 Set / 计数器，视题而定
for (let right = 0; right < n; right++) {
  // 1. right 进窗口
  window.add(s[right]);
  // 2. 不合法就左缩
  while (!valid(window)) { window.remove(s[left]); left++; }
  // 3. 更新答案（最长在此；最短在 while 内的合法处）
  ans = Math.max(ans, right - left + 1);
}
```

## 六、前缀和与差分速查

```js
// 一维前缀和（n+1 长度，prefix[0]=0）
prefix[0] = 0;
prefix[i] = prefix[i-1] + a[i-1];
sum(l, r) = prefix[r+1] - prefix[l];      // 闭区间 [l,r]

// 二维前缀和（容斥，整体右下移一格）
S[i][j] = a[i-1][j-1] + S[i-1][j] + S[i][j-1] - S[i-1][j-1];
area(r1,c1,r2,c2) = S[r2+1][c2+1] - S[r1][c2+1] - S[r2+1][c1] + S[r1][c1];

// 差分数组（前缀和的逆运算）
diff[l] += v; diff[r+1] -= v;             // 区间 [l,r] 加 v
// 求前缀和还原原数组
a[0] = diff[0]; a[i] = a[i-1] + diff[i];

// 前缀和 + 哈希：和为 k 的子数组个数
const cnt = new Map([[0, 1]]); // 关键初始化
let pre = 0, ans = 0;
for (const x of a) {
  pre += x;
  ans += cnt.get(pre - k) ?? 0;
  cnt.set(pre, (cnt.get(pre) ?? 0) + 1);
}
```

## 七、矩阵操作速查

```js
// 行主序缓存友好遍历
for (let i = 0; i < rows; i++)
  for (let j = 0; j < cols; j++)
    process(m[i][j]);

// 螺旋遍历：四边界剥皮
let [t, b, l, r] = [0, rows-1, 0, cols-1];
while (t <= b && l <= r) {
  for (let j = l; j <= r; j++) visit(m[t][j]); t++;
  for (let i = t; i <= b; i++) visit(m[i][r]); r--;
  if (t <= b) { for (let j = r; j >= l; j--) visit(m[b][j]); b--; }
  if (l <= r) { for (let i = b; i >= t; i--) visit(m[i][l]); l++; }
}

// 顺时针旋转 90°：转置 + 每行翻转（方阵原地）
for (let i = 0; i < n; i++)
  for (let j = i+1; j < n; j++)
    [m[i][j], m[j][i]] = [m[j][i], m[i][j]]; // 转置（仅上三角）
for (const row of m) row.reverse();           // 每行翻转
```

## 八、易错点清单

- **`prefix[0]=0` 整体右移**：否则 `l=0` 查询 `prefix[-1]` 越界——最高频坑。
- **二维查询边界**：是 `S[r1][...]` 不是 `S[r1-1][...]`（整体右下移一格）。
- **差分忘求前缀和**：差分数组本身不是答案。
- **差分 `r+1` 越界**：开 `n+1` 数组或判 `r+1 < n`。
- **前缀和+哈希漏 `cnt.set(0,1)`**：从下标 0 起的合法区间会漏。
- **JS `sort()` 默认字典序**：数字必须传 `(a,b)=>a-b`。
- **滑动窗口遇负数失效**：状态不单调，改用前缀和+哈希。
- **螺旋遍历忘判剩余单行/单列**：下边/左边两步要 `if (t<=b)`/`if (l<=r)`。
- **转置遍历整个矩阵**：只遍历上三角（`j>i`），否则交换两次无效。
- **非方阵不能原地转置**：`m×n` 转置是 `n×m`，要新建。
- **缓存不友好遍历**：行主序矩阵外层遍历列——大矩阵慢几倍。
- **扩容因子与峰值内存**：×2 峰值 ~2 倍元素数；×1.5 峰值 ~1.5 倍。

## 九、进阶方向（链接其他叶）

- **栈/队列**：数组在两端的受限操作 —— 见[栈](../../stack/)、[队列](../../queue/) 叶
- **堆**：完全二叉树映射到数组（下标 `2i+1`/`2i+2`）—— 见[堆](../../../advanced/heap/) 叶
- **哈希表**：开放寻址法用数组做桶 —— 见[哈希表](../../hash-table/) 叶
- **树状数组/线段树**：前缀和的「在线升级版」—— 见[线段树与树状数组](../../../advanced/segment-tree/) 叶
- **字符串**：字符数组 —— 见[字符串匹配](../../../strings/string-matching/) 叶

## 权威链接

- [数组 - 维基百科](https://zh.wikipedia.org/wiki/%E6%95%B0%E7%BB%84)
- [Array Data Structure - GeeksforGeeks](https://www.geeksforgeeks.org/array-data-structure/)
- [Sliding Window - LeetCode 探索](https://leetcode.com/explore/learn/card/array-and-string/)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/array" target="_blank" rel="noopener noreferrer">数组可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/array-slide/" target="_blank">数组</a>
