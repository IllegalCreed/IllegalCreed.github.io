---
layout: doc
outline: [2, 3]
---

# 参考：非比较排序 API、复杂度与选型速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **下限定理**：比较排序最坏比较次数 ≥ `⌈log₂(n!)⌉ ≈ n log n`（决策树证明），`Ω(n log n)` 是硬下限；非比较排序绕开比较故不受此限。
- **三种算法复杂度**：计数 **O(n + k)** 空间 O(n + k) 稳定；桶期望 **O(n)** 最坏 O(n²) 空间 O(n + m) 稳定看桶内；基数 **O(d · (n + b))** 空间 O(n + b) 稳定。
- **三者前提**：计数要 `k = O(n)`；桶要分布均匀；基数要可按位分解且 `d` 不大。
- **计数三步**：频次 `count[v]++` → 前缀和 `count[i]+=count[i-1]` → 倒序放 `out[--count[v]] = x`（倒序保稳定）。
- **桶三步**：分桶 `⌊(x-min)/range×m⌋` → 桶内插排 → 按桶号拼接。
- **基数 LSD**：`for exp=1; max/exp>0; exp*=10` 每趟用基数 `b` 的稳定计数排序。
- **稳定性**：计数倒序放稳定；基数每趟稳定故整体稳定；桶看桶内。**基数必须稳定**，否则高位打乱低位。
- **负数**：计数统一减 `min` 偏移到 `[0,k)`；基数负数分组处理或改计数偏移法。
- **选型三问**：整数+值域小→计数；浮点+均匀→桶；固定位数→基数；都不满足→比较排序。
- **交互演示**：[计数排序](https://algo.illegalscreed.cn/docs/counting-sort)、[桶排序](https://algo.illegalscreed.cn/docs/bucket-sort)、[基数排序](https://algo.illegalscreed.cn/docs/radix-sort)。

## 一、复杂度对比表

| 算法 | 最好 | 平均 | 最坏 | 空间 | 稳定 | 前提 |
| --- | --- | --- | --- | --- | --- | --- |
| 计数排序 | O(n+k) | O(n+k) | O(n+k) | O(n+k) | ✅ | 值域 `k=O(n)` |
| 桶排序 | O(n+k) | O(n+k) | O(n²) | O(n+m) | 看桶内 | 分布均匀 |
| 基数排序 | O(d(n+b)) | O(d(n+b)) | O(d(n+b)) | O(n+b) | ✅ | 可按位分解、`d` 小 |
| （参考）快排 | O(n log n) | O(n log n) | O(n²) | O(log n) | ❌ | 仅需可比较 |
| （参考）归并 | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ | 仅需可比较 |
| （参考）堆排 | O(n log n) | O(n log n) | O(n log n) | O(1) | ❌ | 仅需可比较 |

> 桶排序的 `k` 指桶数 `m`；均匀分布下平均 O(n + m)，`m = Θ(n)` 时即 O(n)。

## 二、代码模板

### 计数排序（支持负数，稳定）

```js
function countingSort(a) {
  if (!a.length) return [];
  const min = Math.min(...a), max = Math.max(...a);
  const k = max - min + 1, count = new Array(k).fill(0);
  for (const x of a) count[x - min]++;                 // ① 频次
  for (let i = 1; i < k; i++) count[i] += count[i - 1]; // ② 前缀和 → 末尾下标+1
  const out = new Array(a.length);
  for (let i = a.length - 1; i >= 0; i--)              // ③ 倒序放（稳定）
    out[--count[a[i] - min]] = a[i];
  return out;
}
```

### 桶排序（`[0,1)` 浮点，桶内插排）

```js
function bucketSort(a, m = a.length) {
  if (!a.length) return [];
  const buckets = Array.from({ length: m }, () => []);
  for (const x of a) {
    let i = Math.floor(x * m);
    if (i === m) i = m - 1;                            // x==1 边界
    buckets[i].push(x);
  }
  for (const b of buckets) insertSort(b);
  return buckets.flat();
}
```

### 基数排序（非负整数，LSD 十进制，稳定）

```js
function radixSort(a) {
  if (!a.length) return a;
  const max = Math.max(...a);
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10)
    countingByDigit(a, exp);                           // 每位一趟稳定计数排序
  return a;
}
function countingByDigit(a, exp) {
  const count = new Array(10).fill(0);
  const out = new Array(a.length);
  for (const x of a) count[Math.floor(x / exp) % 10]++;
  for (let i = 1; i < 10; i++) count[i] += count[i - 1];
  for (let i = a.length - 1; i >= 0; i--)              // 倒序放，稳定
    out[--count[Math.floor(a[i] / exp) % 10]] = a[i];
  for (let i = 0; i < a.length; i++) a[i] = out[i];
}
```

## 三、选型决策树

```
待排序数据
  │
  ├─ 是整数且值域 k = O(n)？ ──── 是 ──→ 计数排序 O(n+k)
  │     （年龄/分数/ASCII/小枚举）
  │
  ├─ 是浮点 / 连续值域且分布均匀？ ── 是 ──→ 桶排序 期望 O(n)
  │     （[0,1) 均匀浮点、均匀散布大范围值）
  │
  ├─ 可按位分解且位数 d 小？ ────── 是 ──→ 基数排序 O(d·(n+b))
  │     （手机号/身份证/定长字符串/日期）
  │
  └─ 都不满足 / 任意可比较对象 ──────→ 比较排序 O(n log n)
        （快排/归并/堆排/Timsort）
```

口诀：**「值域小整数 → 计数；均匀浮点 → 桶；固定位数 → 基数；其余 → 比较」**。

## 四、与比较排序对比

| 维度 | 非比较排序（计数/桶/基数） | 比较排序（快排/归并/堆排） |
| --- | --- | --- |
| 时间下限 | 可达 O(n)（前提满足） | `Ω(n log n)` 硬下限 |
| 数据类型 | 整数 / 可拆位 / 可映射整数（受限） | 任意可比较对象（通用） |
| 前提 | 值域 / 分布 / 位数（苛刻） | 仅需「小于」定义 |
| 空间 | O(n+k) / O(n+m) / O(n+b)（较大） | O(1)（堆排）/ O(log n)（快排） |
| 通用性 | 特定场景加速器 | 通用主力 |
| 库默认 | 否（仅作子例程 / 特定实现） | 是（Timsort / 内省排序 / 双轴快排） |

一句话：**非比较排序用「前提 + 空间」换「线性时间」**，比较排序用「`O(n log n)`」换「通用与低空间」。工程默认比较排序，非比较排序只在确定满足前提时才登场。

## 五、易错点清单

- **计数排序 `k ≫ n` 时强用**：值域大（如 32 位整数）时频次数组空间爆炸——必须先判 `k = O(n)`。
- **计数排序前缀和后忘倒序放**：顺序放会失去稳定性；正确是 `for i = n-1 → 0` 配 `--count[v]`。
- **计数排序 `count[v]` 含义搞错**：前缀和后 `count[v]` 是「值 ≤ v 的个数」= 末尾下标+1，放时先 `--` 再用。
- **桶排序假设均匀却遇倾斜**：分布不均全挤一个桶，退化到桶内最坏 O(n²)——用前先估分布。
- **桶排序桶内用不稳定排序却宣称稳定**：桶间有序，桶内决定整体稳定性。
- **基数排序某趟不稳定**：高位打乱低位次序，结果错误——内部必用稳定计数排序。
- **基数排序位数 `d` 误当常数**：大整数 `d` 大时 O(d·n) 可能不如 O(n log n)。
- **基数排序对浮点强用**：浮点位模式与大小非单调（IEEE754 符号/阶码），需特殊处理或改用。
- **负数未偏移**：计数排序忘减 `min`，负值当下标越界；基数排序负数需分组或改计数偏移法。
- **把非比较排序当通用替代**：数据不满足前提时强行使用，比比较排序更慢甚至不可用。
- **混淆 LSD 与 MSD**：LSD 从低位到高位迭代、适合定长；MSD 从高位递归分桶、适合变长字符串字典序。

## 六、进阶方向（链接其他叶）

- **比较排序**：决策树下限的另一面——快排、归并、堆排的具体实现，见 [简单排序](../simple-sort/)、[归并排序](../merge-sort/)、[快速排序](../quick-sort/)、[堆排序](../heap-sort/)。
- **稳定性与多关键字排序**：基数排序是「多关键字排序」的特例——先按次要键排，再按主键稳定排。
- **后缀数组**：基数排序是后缀数组构造（SA-IS、DC3）的子例程——见字符串相关章节。
- **外排序 / 桶式分片**：桶思想在分布式负载均衡、一致性哈希中的外延。

## 权威链接

- [Counting Sort - GeeksforGeeks](https://www.geeksforgeeks.org/counting-sort/)
- [Bucket Sort - GeeksforGeeks](https://www.geeksforgeeks.org/bucket-sort-2/)
- [Radix Sort - GeeksforGeeks](https://www.geeksforgeeks.org/radix-sort/)
- [Sorting lower bound（决策树证明）- 维基百科](https://en.wikipedia.org/wiki/Comparison_sort#Lower_bound)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/counting-sort" target="_blank" rel="noopener noreferrer">计数排序可视化演示</a>、<a href="https://algo.illegalscreed.cn/docs/bucket-sort" target="_blank" rel="noopener noreferrer">桶排序可视化演示</a>、<a href="https://algo.illegalscreed.cn/docs/radix-sort" target="_blank" rel="noopener noreferrer">基数排序可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/non-comparison-sort-slide/" target="_blank">非比较排序</a>
