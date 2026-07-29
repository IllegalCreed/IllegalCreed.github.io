---
layout: doc
outline: [2, 3]
---

# 参考：素数筛 API、复杂度与应用速查

> 基于通用数论概念 · 核于 2026-07

## 速查

- **素数定义**：大于 1 且只能被 1 和自身整除的自然数；2 是最小素数、唯一偶素数；**1 不是素数**。
- **试除法**：判 `n` 素性，试除 `2..√n`——**O(√n)**；因子成对，较小者必 `≤ √n`。
- **埃氏筛**：素数 `p` 筛 `p` 的倍数，外层到 `√n`、内层从 `p²`——**O(n log log n)**，常数小，通用首选。
- **线性筛 / 欧拉筛**：每合数只被最小质因子筛，`i % p === 0` 时 `break`——**严格 O(n)**，常数大，适合超大 n 或积性函数筛。
- **预处理素数表**：筛一次得 `isPrime`（O(1) 素性查询）+ `primes`（O(1) 取第 k 个素数）。
- **最小质因子表 spf**：线性筛顺便记录，用于 **O(log n) 质因数分解**（反复除最小质因子）。
- **复杂度阶梯**：单判 O(√n) < 埃氏 O(n log log n) < 线性 O(n)；空间均 O(n)。
- **优化**：从 `p²` 起筛省一半；只筛奇数空间减半；位压缩空间 /8；分段筛空间降到 O(√n + B)。
- **应用**：素数表查询、质因数分解、欧拉函数 / 莫比乌斯函数筛法、区间素数计数。
- **易错**：`1` 不是素数（初始化 `isPrime[0]=isPrime[1]=false`）；内层起点是 `2p`/`p²` 不是 `p`；线性筛漏 `break` 会退化；`p*p` 大 n 时防溢出。
- **选型**：`n ≤ 10⁷` 埃氏筛更快；需严格线性 / spf / 积性函数用线性筛；超内存用分段筛。
- **交互演示**：[埃氏筛可视化](https://algo.illegalscreed.cn/docs/sieve-of-eratosthenes)、[线性筛可视化](https://algo.illegalscreed.cn/docs/linear-sieve)。

## 一、复杂度对照表

| 算法 | 用途 | 时间 | 空间 | 说明 |
| --- | --- | --- | --- | --- |
| 试除法 | 判单个数 `n` 素性 | **O(√n)** | O(1) | 试除 `2..√n`，因子成对 |
| 埃氏筛 | 求 `[1,n]` 全部素数 | **O(n log log n)** | O(n) | 素数筛倍数，有重复 |
| 线性筛 | 求 `[1,n]` 全部素数 | **O(n)** | O(n) + O(n/ln n) | 最小质因子筛一次，严格线性 |
| spf 分解 | 质因数分解单个数 | **O(log n)** | O(n)（预处理） | 基于 spf 表反复除 |
| 分段筛 | 超大区间筛素数 | O(n log log n) | **O(√n + B)** | 分段用 `[2,√n]` 素数筛 |

## 二、试除法判定模板

```js
// 判定 n 是否为素数，O(√n)
function isPrime(n) {
  if (n < 2) return false;            // 0、1、负数不是素数
  if (n % 2 === 0) return n === 2;    // 单独处理 2，其余偶数是合数
  for (let i = 3; i * i <= n; i += 2) // 只试除奇数到 √n
    if (n % i === 0) return false;
  return true;
}
// isPrime(1) → false；isPrime(2) → true；isPrime(97) → true
```

## 三、埃氏筛模板

```js
// 求 [1,n] 全部素数，O(n log log n)
function eratosthenes(n) {
  const isPrime = new Array(n + 1).fill(true);
  isPrime[0] = isPrime[1] = false;          // 1 不是素数
  for (let p = 2; p * p <= n; p++)          // 外层只需到 √n
    if (isPrime[p])
      for (let k = p * p; k <= n; k += p)   // 从 p² 起筛（优化）
        isPrime[k] = false;
  return isPrime;                            // isPrime[i]===true 即 i 是素数
}
// 收集素数列表
const primes = [];
for (let i = 2; i <= n; i++) if (isPrime[i]) primes.push(i);
```

## 四、线性筛 / 欧拉筛模板

```js
// 求 [1,n] 全部素数，严格 O(n)
function linearSieve(n) {
  const isPrime = new Array(n + 1).fill(true);
  const primes = [];
  isPrime[0] = isPrime[1] = false;
  for (let i = 2; i <= n; i++) {
    if (isPrime[i]) primes.push(i);         // i 是素数入表
    for (let j = 0; j < primes.length; j++) {
      const p = primes[j];
      if (p * i > n) break;                 // 超出范围
      isPrime[p * i] = false;               // 筛掉 i × p
      if (i % p === 0) break;               // 关键：只被最小质因子筛
    }
  }
  return primes;                             // primes 即升序素数列表
}
```

## 五、最小质因子表 spf 与质因数分解

```js
// 建 spf 表（线性筛改造），O(n)
function buildSpf(n) {
  const spf = new Array(n + 1).fill(0);
  const primes = [];
  for (let i = 2; i <= n; i++) {
    if (spf[i] === 0) { spf[i] = i; primes.push(i); }
    for (const p of primes) {
      if (p > spf[i] || p * i > n) break;
      spf[p * i] = p;                       // p*i 的最小质因子是 p
    }
  }
  return spf;
}

// O(log n) 质因数分解
function factorize(x, spf) {
  const res = [];
  while (x > 1) {
    const p = spf[x]; let c = 0;
    while (x % p === 0) { x /= p; c++; }
    res.push([p, c]);                       // [素因子, 指数]
  }
  return res;                                // factorize(60) => [[2,2],[3,1],[5,1]]
}
```

## 六、应用清单

- **素性查询**：预处理 `isPrime` 后，`isPrime[x]` O(1) 判断「x 是素数吗」。
- **第 k 个素数 / 区间素数计数**：`primes[k-1]` O(1) 取；`[l, r]` 内素数个数用前缀和或 `upper_bound` 二分。
- **质因数分解**：基于 spf 表 O(log n) 分解，支撑最大公约数、最小公倍数、约数个数等。
- **欧拉函数 φ**：线性筛中递推 `φ[i]`（≤n 且与 n 互素的个数），利用最小质因子。
- **莫比乌斯函数 μ**：线性筛中递推，用于莫比乌斯反演。
- **判定素数对 / 哥德巴赫猜想验证**：用素数表枚举验证。
- **哈希模数选取**：从素数表选大素数（如 `998244353`、`10⁹+7`）做哈希 / NTT 模数。

## 七、易错点清单

- **1 不是素数**：忘初始化 `isPrime[0]=isPrime[1]=false` 会把 1 当素数——最高频坑。
- **内层起点写成 `p`**：`p` 自己是素数不能删，起点必须是 `2p`（朴素）或 `p²`（优化）。
- **线性筛漏 `break`**：`if (i % p === 0) break` 是正确性关键，漏写会重复筛且复杂度退化。
- **线性筛外层不到 n**：线性筛外层必须到 `n`（每个 `i` 都要参与筛），与埃氏筛「外层到 √n」不同，别混淆。
- **`p * p` 溢出**：`n` 接近 `10⁹` 时 `p*p` 可能超 32 位整数，C++ 要 `long long` 或用 `p <= n / p` 判断。
- **数组大小开成 n 而非 n+1**：`[1,n]` 需 `n+1` 长度，开成 `n` 会漏掉 `n` 或越界。
- **只筛奇数忘了单独处理 2**：2 是唯一的偶素数，压缩后要单独加入结果。
- **分段筛忘先筛 `[2,√n]`**：分段筛必须先用普通筛得到 `[2,√n]` 的素数，再用它们筛每段。
- **混用 isPrime 与 primes**：`isPrime` 是布尔标记数组、`primes` 是素数列表，别在收集素数时用错。
- **大 n 内存爆炸**：`n = 10⁹` 的布尔数组约 1GB，必须用位压缩或分段筛。

## 八、埃氏筛 vs 线性筛选型表

| 维度 | 埃氏筛 | 线性筛 |
| --- | --- | --- |
| 复杂度 | O(n log log n) | **O(n)** |
| 实际速度（n=10⁷） | ~30ms（更快） | ~60ms |
| 重复标记 | 有 | 无 |
| 外层范围 | 到 √n | 到 n |
| 关键判断 | 无 | `i % p === 0` break |
| 额外空间 | 无 | 素数表 O(n/ln n) |
| 顺便求 spf / φ / μ | 不便 | **天然支持** |
| 推荐场景 | 通用、n ≤ 10⁷ | 严格线性 / 积性函数筛 |

## 权威链接

- [素数 - 维基百科](https://zh.wikipedia.org/wiki/%E7%B4%A0%E6%95%B0)
- [埃拉托斯特尼筛法 - 维基百科](https://zh.wikipedia.org/wiki/%E5%9F%83%E6%8B%89%E6%89%98%E6%96%AF%E7%89%B9%E5%B0%BC%E7%AD%9B%E6%B3%95)
- [Sieve of Eratosthenes - CP-Algorithms](https://cp-algorithms.com/algebra/sieve-of-eratosthenes.html)
- [Linear Sieve - CP-Algorithms](https://cp-algorithms.com/algebra/prime-sieve-linear.html)
- [Prime Number - GeeksforGeeks](https://www.geeksforgeeks.org/prime-numbers/)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/sieve-of-eratosthenes" target="_blank" rel="noopener noreferrer">埃氏筛可视化演示</a>、<a href="https://algo.illegalscreed.cn/docs/linear-sieve" target="_blank" rel="noopener noreferrer">线性筛可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/prime-sieve-slide/" target="_blank">素数筛</a>
