---
layout: doc
outline: [2, 3]
---

# 二分查找详解：三种写法与三种边界

> 基于通用算法套路 · 核于 2026-07

## 速查

- **二分的本质**：在**有序 + 随机访问**的前提下，每次比较中点 `mid` 后**确定地排除一半**候选，O(log n)。
- **三种区间写法**（决定 `while` 条件与 `mid` 收缩方式）：
  - **左闭右闭 `[l, r]`**：`while (l <= r)`，收缩 `l = mid + 1` / `r = mid - 1`（mid 已比较过，排除）。
  - **左闭右开 `[l, r)`**：`while (l < r)`，收缩 `l = mid + 1` / `r = mid`（r 是开的，不含 mid）。
  - **左开右开 `(l, r)`**：`while (l + 1 < r)`，收缩 `l = mid` / `r = mid`（两端都开），mid 收缩后不会越界。
- **查找目标值（精确命中）**：`a[mid] === target` 即返回；收缩时**排除 mid**（已确认不是答案），故闭区间用 `mid±1`。
- **查找左边界（第一个 `>= target`，即下界 lower_bound）**：`a[mid] < target` 排除左半 `l = mid + 1`；`a[mid] >= target` 让 `r = mid`（mid 可能是答案，不能排除）。最终 `l` 即左边界。
- **查找右边界（最后一个 `<= target`，即上界 upper_bound 的前驱）**：`a[mid] <= target` 让 `l = mid`（mid 可能是答案）；`a[mid] > target` 排除右半 `r = mid - 1`。注意左/右边界写法用 `mid = l + (r - l + 1) / 2` 防 `l = mid` 死循环。
- **循环不变量（写对二分的心法）**：始终保证「答案若存在，必在 `[l, r]` 内」——每次收缩都让区间变小但不丢答案。
- **`mid` 防溢出**：写 `mid = l + ((r - l) >> 1)`（向下取整），而非 `(l + r) / 2`；查右边界时用向上取整 `l + ((r - l + 1) >> 1)` 防 `l = mid` 卡死。
- **区间定义必须自洽**：`while` 条件 = 「区间非空」的判据；`l`/`r` 收缩 = 「排除已确认非答案的部分，保留可能含答案的部分」——两者都由区间开闭决定。
- **统一心法**：先定区间开闭 → 再定 `while` 条件 → 最后定收缩方式，三者一气呵成、自洽即对。

## 一、循环不变量：写对二分的心法

二分查找写错的根因不是记不住模板，而是**没守住「循环不变量」**。所谓循环不变量，是「**答案若存在，必在当前区间 `[l, r]` 内**」这一断言——它在初始化时成立（答案若存在必在全区间），在每次收缩后仍成立（收缩只排除确认不含答案的部分），在循环结束时仍成立（区间空了说明答案不存在）。

守住循环不变量的关键是**明确区间定义**：

- 区间开闭（`[l,r]` / `[l,r)` / `(l,r)`）决定了「哪些下标是合法候选」。
- `while` 条件 = 「区间非空」的判据（闭区间 `l <= r`，半开半闭 `l < r`，双开 `l+1 < r`）。
- 收缩方式 = 「排除确认非答案的部分，保留可能含答案的部分」——`mid` 是否被排除取决于它是否可能是答案。

只要这三者自洽，二分就一定对。下面三种区间写法，本质是同一个循环不变量的三种表达。

## 二、写法一：左闭右闭 `[l, r]`

最常见的写法。区间是闭的，`l` 和 `r` 都是合法候选下标。

```js
// 左闭右闭 [l, r]：查找目标值
function binarySearch(nums, target) {
  let l = 0, r = nums.length - 1;       // 闭区间，r 含末元素
  while (l <= r) {                       // 区间非空：l <= r（含 l === r 单元素）
    const mid = l + ((r - l) >> 1);      // 向下取整，防溢出
    if (nums[mid] === target) return mid;
    nums[mid] < target ? (l = mid + 1) : (r = mid - 1); // mid 已确认非答案，排除
  }
  return -1;                             // 区间空，不存在
}
```

**为什么是 `while (l <= r)`**：闭区间里 `l === r` 仍是合法的单元素区间（就一个元素 `a[l]`），要继续查；只有 `l > r` 才算「区间空」。

**为什么是 `mid ± 1`**：因为 `a[mid]` 已和 target 比较过、确认不是答案，必须从区间里**彻底排除**（`l = mid+1` 或 `r = mid-1`），否则下次 mid 还是它，死循环。

## 三、写法二：左闭右开 `[l, r)`

很多标准库（如 C++ `std::lower_bound`）用这种写法。区间左闭右开，`l` 是合法候选、`r` 不是（`r` 是「尾后位置」）。

```js
// 左闭右开 [l, r)：查找第一个 >= target（左边界）
function lowerBound(nums, target) {
  let l = 0, r = nums.length;            // r 初始为 length（尾后，不含元素）
  while (l < r) {                        // 区间非空：l < r（l === r 则区间空）
    const mid = l + ((r - l) >> 1);
    nums[mid] < target ? (l = mid + 1) : (r = mid); // a[mid]>=target 时 mid 可能是答案，r=mid 保留它
  }
  return l;                              // l === r，即为左边界（第一个 >= target）
}
```

**为什么是 `while (l < r)`**：右开区间里 `l === r` 表示「区间空」（左闭到右开，但左右相等就没元素了）。

**为什么 `r = mid` 而非 `r = mid - 1`**：`r` 是开的（不含 `a[r]`），而 `a[mid] >= target` 时 `mid` **可能就是答案**（第一个 `>= target`），不能排除，所以让 `r = mid` 把 `mid` 保留在新区间里。而 `a[mid] < target` 时 `mid` 确认小于 target，闭区间端 `l = mid + 1` 排除它。

## 四、写法三：左开右开 `(l, r)`

较少见但很优雅，两端都开，`l` 和 `r` 都不是候选，候选在 `(l, r)` 内部。

```js
// 左开右开 (l, r)：查找目标值
function binarySearchOpen(nums, target) {
  let l = -1, r = nums.length;           // 两端都开：l 初始 -1，r 初始 length
  while (l + 1 < r) {                    // 区间非空：(l, r) 内至少有一个整数
    const mid = l + ((r - l) >> 1);
    if (nums[mid] === target) return mid;
    nums[mid] < target ? (l = mid) : (r = mid); // 两端都开，mid 直接赋给 l/r
  }
  return -1;
}
```

**为什么是 `while (l + 1 < r)`**：两端开时，`(l, r)` 内有元素当且仅当 `l + 1 < r`（中间至少夹一个整数）；`l + 1 === r` 则区间空。

**为什么 `l = mid` / `r = mid` 都安全**：因为两端都开，`l` 和 `r` 本就不是候选，把 `mid` 赋给它们不会让 `mid` 重复参与比较，也不会死循环（`l + 1 < r` 保证 `mid` 严格落在 `(l, r)` 内）。

## 五、三种写法对照

| 维度 | 左闭右闭 `[l,r]` | 左闭右开 `[l,r)` | 左开右开 `(l,r)` |
| --- | --- | --- | --- |
| 初始 | `r = n-1` | `r = n` | `l = -1, r = n` |
| `while` | `l <= r` | `l < r` | `l + 1 < r` |
| 收缩 | `l=mid+1`/`r=mid-1` | `l=mid+1`/`r=mid` | `l=mid`/`r=mid` |
| 空区间判据 | `l > r` | `l === r` | `l + 1 === r` |
| 适合 | 精确查找（直观） | 左/右边界（标准库风格） | 避免边界细节（简洁） |

记忆要点：**`while` 条件 = 区间非空判据；收缩时「mid 可能是答案就保留（赋给开端），确认非答案就排除（±1）」**。

## 六、查找目标值：精确命中

见上文写法一（左闭右闭）。要点是 `a[mid] === target` 时直接 `return mid`；`a[mid]` 与 target 不等时，**mid 已确认不是答案**，必须 `±1` 排除。返回 `-1` 表示不存在。

## 七、查找左边界：第一个 `>= target`

左边界（lower_bound）返回**第一个 `>= target` 的下标**——即使 target 不存在，也返回它「应该插入的位置」。这是「二分求插入点」的标准语义。

```js
// 左边界：第一个 >= target（左闭右开写法）
function lowerBound(nums, target) {
  let l = 0, r = nums.length;
  while (l < r) {
    const mid = l + ((r - l) >> 1);     // 向下取整
    nums[mid] < target ? (l = mid + 1) : (r = mid); // >= target 的 mid 保留
  }
  return l;                              // l === r，第一个 >= target 的位置
}
```

- **收缩逻辑**：`a[mid] < target` 时 mid 及左半都太小，排除（`l = mid + 1`）；`a[mid] >= target` 时 mid 可能是第一个 `>= target`，保留（`r = mid`）。
- **返回值含义**：`l`（等于 `r`）是第一个 `>= target` 的下标。若所有元素都 `< target`，返回 `n`（越界，表示插末尾）。
- **判断 target 是否存在**：`l < n && nums[l] === target` 则存在且 `l` 是首次出现位置。

## 八、查找右边界：最后一个 `<= target`

右边界（upper_bound 的前驱）返回**最后一个 `<= target` 的下标**。注意：求右边界时 `mid` 要**向上取整**，否则 `l = mid` 会死循环。

```js
// 右边界：最后一个 <= target（左闭右闭写法 + 向上取整 mid）
function upperBoundLast(nums, target) {
  let l = 0, r = nums.length - 1;
  while (l < r) {
    const mid = l + ((r - l + 1) >> 1);  // 向上取整！防 l = mid 死循环
    nums[mid] <= target ? (l = mid) : (r = mid - 1); // <= target 的 mid 保留
  }
  return l;                              // 最后一个 <= target 的位置
}
```

- **为什么向上取整**：若 `mid = l + ((r-l) >> 1)`（向下取整），当 `l + 1 === r` 时 `mid === l`，而 `a[mid] <= target` 让 `l = mid = l`——`l` 没动，死循环。向上取整让此时 `mid === r`，`l = mid` 能前进。
- **收缩逻辑**：`a[mid] <= target` 时 mid 可能是最后一个 `<= target`，保留（`l = mid`）；`a[mid] > target` 时 mid 及右半都太大，排除（`r = mid - 1`）。
- **返回值含义**：`l` 是最后一个 `<= target` 的下标。若所有元素都 `> target`，返回 `0` 的前驱（需视初始值判断）。

> 三种边界的统一规律：**「mid 可能是答案就保留（赋给开/不排除），确认不是答案就排除（±1）」**——左边界保留 `>=` 的 mid，右边界保留 `<=` 的 mid，目标值命中即返回。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/binary-search" target="_blank" rel="noopener noreferrer">二分查找可视化演示</a> —— 折半过程与区间收缩
- <a href="https://algo.illegalscreed.cn/docs/binary-bounds" target="_blank" rel="noopener noreferrer">二分边界可视化</a> —— 三种区间写法对照

## 下一步

掌握了三种区间写法与三种边界后，下一步是攻克二分的**易错点**——死循环、`mid` 溢出、退出条件、返回值含义，见[边界与坑](./pitfalls)。
