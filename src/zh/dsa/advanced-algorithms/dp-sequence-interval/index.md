---
layout: doc
---

# 序列与区间动态规划

序列与区间动态规划（**Sequence & Interval DP**）是 DP 三部曲的承上启下之叶——它承接「基础（背包）」的状态/转移心智模型，又为「进阶（树 DP / 数位 DP）」铺路。它处理的是一类**有天然线性或区间结构**的问题：状态不再是一维下标或单一容量，而是落在「**序列的前 i 个元素**」或「**区间的两端 `[i, j]`**」上。一旦想通「状态怎么定义、子问题怎么衔接」，这一叶的套路化程度极高——**LCS（最长公共子序列）**、**LIS（最长递增子序列）**、**编辑距离**、**最长回文子串**、**石子合并**几乎覆盖了面试里所有「字符串/数组上的 DP」高频题。

本叶的核心心智模型只有一句话：**让状态落在「边界」上，让转移在「边界之间」发生**。由此衍生出两大主线：①**序列 DP**（`dp[i]` 表示「前 i 个元素的最优」，一维递推，代表是 LIS、Kadane、最长回文子序列的前身）；②**区间 DP**（`dp[i][j]` 表示「区间 `[i, j]` 的最优」，**按区间长度从小到大枚举**，内部再枚举断点 `k`，代表是最长回文子串、石子合并、戳气球、矩阵连乘）。其中**区间 DP 的枚举顺序**（先小后大）与**断点枚举**是本叶最值钱的两个技巧——理解了它，所有「区间合并 / 区间消除」类问题都能套用同一模板。

## 评价

**优点**

- **套路化程度极高**：状态定义（`dp[i]` 或 `dp[i][j]`）+ 转移方程高度模板化，会一个就会一类（LCS 会了，编辑距离就是改个 min）
- **经典题密集、面试命中率高**：LCS/LIS/编辑距离/最长回文子串是各厂高频题，区间 DP 是竞赛与高级岗的区分度题
- **二分优化优雅**：LIS 的 O(n log n) 二分优化是「数据结构优化 DP」的入门典范，推广到 LIS 变体、耐心排序、俄罗斯套娃信封
- **可扩展性强**：区间 DP 模板稍加改造即可解「区间消除」类（戳气球、合并石头、奇异矩阵），一通百通

**缺点**

- **状态定义强依赖题感**：区间 DP 的新手最难想「为什么是 `dp[i][j]` 表区间」，没有通用算法，靠模型积累
- **空间常偏大**：区间 DP 典型 O(n²) 空间，石子合并还要前缀和辅助；n 上万时需滚动优化（但区间 DP 难压一维）
- **枚举顺序易错**：区间 DP 必须按长度递增枚举，否则子区间还未算出就用了——这是最高频的 bug 源
- **常数大**：区间 DP 多是 O(n³)（三层 for），n=500 就接近 1e8 运算，实战要注意常数

## 本叶地图

- [入门](./getting-started) —— 序列 DP vs 区间 DP 的区分、状态定义技巧、三大经典（LCS/LIS/编辑距离）概览、区间 DP 枚举断点
- [LCS 与 LIS：序列 DP 双壁](./guide-line/lcs-lis) —— LCS 状态转移、LIS 的 O(n²) 与 O(n log n) 二分优化、代码模板
- [编辑距离与区间 DP](./guide-line/edit-distance-interval) —— 编辑距离（增删改 min）、最长回文子串（区间 DP）、石子合并（枚举断点 k）
- [参考](./reference) —— 模型复杂度速查表、LCS/LIS/编辑距离/区间 DP 代码模板、易错点清单

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/lcs" target="_blank" rel="noopener noreferrer">LCS 可视化演示</a> —— 最长公共子序列的状态转移表逐格填充
- <a href="https://algo.illegalscreed.cn/docs/lis" target="_blank" rel="noopener noreferrer">LIS 可视化演示</a> —— 最长递增子序列的 O(n²) 与 O(n log n) 二分优化
- <a href="https://algo.illegalscreed.cn/docs/edit-distance" target="_blank" rel="noopener noreferrer">编辑距离可视化演示</a> —— 增删改三操作的 min 转移
- <a href="https://algo.illegalscreed.cn/docs/stone-merge" target="_blank" rel="noopener noreferrer">石子合并可视化演示</a> —— 区间 DP 枚举断点 k 的合并过程

## 幻灯片地址

<a href="/SlideStack/dp-sequence-interval-slide/" target="_blank">序列与区间动态规划</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E5%BA%8F%E5%88%97%E4%B8%8E%E5%8C%BA%E9%97%B4%E5%8A%A8%E6%80%81%E8%A7%84%E5%88%92" target="_blank" rel="noopener noreferrer">序列与区间动态规划测试题</a>
