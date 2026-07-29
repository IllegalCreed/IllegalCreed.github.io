---
layout: doc
---

# 快速排序

快速排序（**Quicksort**）是实际工程中**最快的通用比较排序算法**——由 Tony Hoare 于 1959 年提出，至今仍是 C++ `std::sort`、Java `Arrays.sort`（基本类型）、V8 `Array.prototype.sort`（大数组分支）等主流排序实现的骨架。它的核心思想极其朴素：**分治**——从数组里挑一个元素做**基准（pivot）**，把所有比 pivot 小的扔到它左边、比它大的扔到它右边（这一步叫**分区 partition**），然后对左右两个子区间**递归**重复。pivot 就此落到最终位置，递归 `log n` 层后整个数组有序。

快排的全部考点都源于一个数学事实：**分区策略 + pivot 选择 ⇒ 平均 O(n log n) 最坏 O(n²)**。由此衍生出三大主题：①**分区算法**（Lomuto 单指针简单、Hoare 双指针交换少、三路分区解决大量重复元素）；②**pivot 选择与最坏情况规避**（随机化、三数取中、Introsort 兜底）；③**工程实现**（小数组切到插入排序优化常数、尾递归优化控栈深、Dual-pivot 快排 Java/V8 实际在用、与归并/堆排的对比）。它是**原地、不稳定**的比较排序，但**常数小、缓存友好**，所以在大多数输入上跑得比理论更优的归并排序还快——理解这一点是理解「为什么 O(n log n) 还能分快慢」的关键。

## 评价

**优点**

- **平均 O(n log n)、常数因子最小**：内层循环极简（比较 + 交换，无额外分配），实测速度通常是归并/堆排的 1.5~2 倍——这是快排「实际最快」的根本原因
- **原地排序（in-place）**：只需 O(log n) 的递归栈空间（优化后），不需要归并排序那样 O(n) 的辅助数组
- **缓存友好（cache-friendly）**：分区是顺序扫描连续内存段，命中 CPU 缓存行，分支预测友好——比堆排（跨层跳跃破坏缓存）快得多
- **工程可裁剪性强**：可叠加小数组切插入、三数取中、三路分区、尾递归、Introsort 等多种优化，适应不同输入

**缺点**

- **最坏 O(n²)**：当输入有序/逆序且 pivot 总取首元素时，每次分区极度不平衡，退化为冒泡——必须靠**随机化/三数取中/Introsort**规避
- **不稳定**：分区时的交换会打乱相等元素的相对顺序（相同值的元素可能被跨段换位），需要稳定排序的场景（多关键字排序）要用归并或 Timsort
- **递归栈深度**：最坏退化时递归深度 O(n)，可能栈溢出——靠**尾递归优化**（对较短子段递归、较长子段迭代）把栈深压到 O(log n)

## 本叶地图

- [入门](./getting-started) —— 快排核心思想（选 pivot 分区递归）、分治三步、为何平均 O(n log n)、最坏 O(n²) 退化原因、为何实际最快（常数小/原地/缓存友好）
- [分区策略](./guide-line/partition) —— Lomuto 单指针、Hoare 双指针、三路快排（荷兰国旗）、随机化/三数取中规避最坏、代码实现
- [工程实践](./guide-line/engineering) —— 小数组切插入排序、尾递归优化、Dual-pivot 快排（Java/V8）、Introsort（C++ std::sort）、快排 vs 归并
- [参考](./reference) —— 复杂度表、Lomuto/Hoare/三路代码模板、优化清单、与归并/堆排对比、易错点

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/quick-sort" target="_blank" rel="noopener noreferrer">快速排序可视化演示</a> —— pivot 选择与分区的全过程
- <a href="https://algo.illegalscreed.cn/docs/three-way-quick" target="_blank" rel="noopener noreferrer">三路快排可视化</a> —— 大量重复元素的三分区
- <a href="https://algo.illegalscreed.cn/docs/dual-pivot-quick" target="_blank" rel="noopener noreferrer">Dual-pivot 快排可视化</a> —— 双基准分区

## 幻灯片地址

<a href="/SlideStack/quick-sort-slide/" target="_blank">快速排序</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E5%BF%AB%E9%80%9F%E6%8E%92%E5%BA%8F" target="_blank" rel="noopener noreferrer">快速排序测试题</a>
