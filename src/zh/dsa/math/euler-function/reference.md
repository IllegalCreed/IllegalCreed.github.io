---
layout: doc
outline: [2, 3]
---

# 参考：欧拉函数/组合数 API 与复杂度速查

> 基于通用数论概念 · 核于 2026-07

## 速查

- **φ(n) 公式**：`n = Π pi^ai ⇒ φ(n) = n × Π(1-1/pi)`；质数 `φ(p)=p-1`；质数幂 `φ(p^k)=p^(k-1)(p-1)`。
- **φ 单值**：`O(√n)` 质因数分解，每因子 `φ = φ/p×(p-1)`（先除后乘）。
- **φ 筛法**：埃氏筛初始化 `phi[i]=i`，质数 `p` 遍历倍数 `m` 执行 `phi[m]=phi[m]/p×(p-1)`，`O(n log log n)`。
- **欧拉定理**：`gcd(a,n)=1 ⇒ a^φ(n)≡1(mod n)`；扩展形式 `a^e≡a^(e mod φ(n)+φ(n))(mod n)`（`e≥φ(n)`）。
- **费马小定理**：质数 `p` 时 `a^(p-1)≡1(mod p)`——欧拉的特例。
- **组合数公式**：`C(n,k)=n!/(k!(n-k)!)`；递推 `C(n,k)=C(n-1,k-1)+C(n-1,k)`。
- **阶乘+逆元**：`C(n,k)=fact[n]×invfact[k]×invfact[n-k] mod p`——预处理 `O(n)`，查询 `O(1)`。
- **卢卡斯**：`C(n,k) mod p = C(n mod p,k mod p)×C(⌊n/p⌋,⌊k/p⌋) mod p`（`p` 质数）。
- **乘法逆元**：费马 `a^(p-2)`（模质数）/ 欧拉 `a^(φ(m)-1)`（任意模，需互质）/ 线性递推 `inv[i]=-(p/i)×inv[p%i]`。
- **易错**：先除后乘；费马逆元限质数；`n≥p` 时 `fact[n]≡0` 用卢卡斯；大乘法用 BigInt 防溢出。

## 一、复杂度表

| 操作 | 复杂度 | 说明 |
| --- | --- | --- |
| 单值 `φ(n)` | **O(√n)** | 试除质因数分解 |
| 筛法 `φ(1..n)` | **O(n log log n)** | 埃氏筛 |
| 快速幂 `a^e mod m` | **O(log e)** | 反复平方 |
| 降幂（需 `gcd=1`） | O(log φ(n)) | 先 `e mod φ(n)` 再快速幂 |
| 组合数递推（建表） | **O(n²)** | 杨辉三角，模数任意 |
| 阶乘+逆元预处理 | **O(n)** | 含线性求逆元 |
| 阶乘+逆元查询 `C(n,k)` | **O(1)** | 三次乘法 |
| 卢卡斯 `C(n,k) mod p` | **O(log_p n)** | 递归拆 p 进制 |
| 费马/欧拉单点逆元 | O(log p) / O(√m + log φ(m)) | 费马纯快速幂；欧拉需先算 φ |

## 二、φ 计算代码

```js
// 单值欧拉函数 O(√n)
function phi(n) {
  let res = n;
  for (let p = 2; p * p <= n; p++) {
    if (n % p === 0) {
      while (n % p === 0) n = n / p;
      res = res / p * (p - 1);           // 先除后乘
    }
  }
  if (n > 1) res = res / n * (n - 1);
  return res;
}

// 埃氏筛求 phi[1..N] O(n log log n)
function sievePhi(N) {
  const phi = Array.from({ length: N + 1 }, (_, i) => i);
  for (let p = 2; p <= N; p++) {
    if (phi[p] === p)                     // p 是质数
      for (let m = p; m <= N; m += p)
        phi[m] = phi[m] / p * (p - 1);
  }
  return phi;
}
```

## 三、快速幂与降幂

```js
// 快速幂 a^e mod m（BigInt 防 a*b 溢出）
function powmod(a, e, m) {
  [a, e, m] = [BigInt(a), BigInt(e), BigInt(m)];
  let res = 1n, base = ((a % m) + m) % m;
  while (e > 0n) {
    if (e & 1n) res = res * base % m;
    base = base * base % m;
    e >>= 1n;
  }
  return Number(res);
}
// 降幂：gcd(a,n)=1 时 a^e ≡ a^(e mod φ(n))
// gcd(a,n)≠1 且 e≥φ(n) 时 a^e ≡ a^(e mod φ(n) + φ(n))
```

## 四、组合数递推代码

```js
// 杨辉三角递推 C(n,k) mod m：O(n²)，模数任意
function pascal(N, m) {
  const C = Array.from({ length: N + 1 }, () => new Array(N + 1).fill(0));
  for (let n = 0; n <= N; n++) {
    C[n][0] = C[n][n] = 1;
    for (let k = 1; k < n; k++)
      C[n][k] = (C[n-1][k-1] + C[n-1][k]) % m;
  }
  return C;
}
```

## 五、阶乘+逆元 O(1) 查询

```js
// 预处理 fact/invfact，模数 p 质数，O(n)
let fact, invfact, inv;
function buildFact(N, p) {
  fact = new Array(N + 1); invfact = new Array(N + 1); inv = new Array(N + 1);
  fact[0] = 1;
  for (let i = 1; i <= N; i++) fact[i] = Number(BigInt(fact[i-1]) * BigInt(i) % BigInt(p));
  inv[1] = 1;                            // 线性求逆元
  for (let i = 2; i <= N; i++)
    inv[i] = Number((BigInt(p) - BigInt(p) / BigInt(i)) * BigInt(inv[p % i]) % BigInt(p));
  invfact[0] = 1;
  for (let i = 1; i <= N; i++) invfact[i] = Number(BigInt(invfact[i-1]) * BigInt(inv[i]) % BigInt(p));
}
function C(n, k, p) {                     // O(1) 查询
  if (k < 0 || k > n) return 0;
  return Number(BigInt(fact[n]) * BigInt(invfact[k]) % BigInt(p) * BigInt(invfact[n-k]) % BigInt(p));
}
```

## 六、卢卡斯定理代码

```js
// 卢卡斯 C(n,k) mod p（p 质数），需先 buildFact(p-1, p)
function lucas(n, k, p) {
  if (k < 0 || k > n) return 0;
  let res = 1n, N = BigInt(n), K = BigInt(k), P = BigInt(p);
  while (N > 0n || K > 0n) {
    const ni = Number(N % P), ki = Number(K % P);
    if (ki > ni) return 0;
    res = res * BigInt(C(ni, ki, p)) % P; // 每段 < p，用阶乘表
    N /= P; K /= P;
  }
  return Number(res);
}
```

## 七、乘法逆元代码

```js
// 费马逆元（模数 p 质数）
const invFermat = (a, p) => powmod(a, p - 2, p);
// 欧拉逆元（模数 m 任意，需 gcd(a,m)=1）
const invEuler = (a, m) => powmod(a, phi(m) - 1, m);
// 线性递推逆元（预处理 1..N 模 p 质数）
function buildInv(N, p) {
  const inv = new Array(N + 1); inv[1] = 1;
  for (let i = 2; i <= N; i++)
    inv[i] = Number((BigInt(p) - BigInt(p) / BigInt(i)) * BigInt(inv[p % i]) % BigInt(p));
  return inv;
}
```

## 八、易错点清单

- **φ 先除后乘**：`res = res/p × (p-1)`，不能 `res × (p-1) / p`（中间可能除不尽）。
- **筛法初始化 `phi[i]=i`**：不是 0，否则倍数更新无意义。
- **费马逆元限质数模**：模数是合数时 `a^(p-2)` 不等于逆元，改用欧拉或扩欧。
- **逆元存在前提**：`gcd(a, m) = 1`，否则无逆元，「除法」在模意义下无定义。
- **降幂要看 gcd**：`gcd(a,n)≠1` 不能直接 `e mod φ(n)`，用扩展欧拉定理。
- **阶乘预处理范围**：必须覆盖查询的最大 `n`，否则 `fact[n]` 未定义。
- **n ≥ p 时阶乘变 0**：`p | n!` 使 `fact[n] ≡ 0 (mod p)`，阶乘+逆元法失效，改用卢卡斯。
- **卢卡斯限质数模**：模数合数时卢卡斯不成立，需扩展卢卡斯。
- **大乘法溢出**：模算术里 `a × b mod m` 当 `a, b` 接近 `m` 时超 64 位，用 BigInt 或 `__int128`。
- **C(n,k) 边界**：`k<0` 或 `k>n` 返回 0，别忘判断。

## 九、进阶方向（链接其他叶）

- **快速幂**：欧拉定理降幂的执行单元 —— 见[快速幂](../fast-power/) 叶
- **GCD 与扩展欧几里得**：逆元的另一条路（扩欧求 `ax≡1`）—— 见[GCD](../gcd/) 叶
- **中国剩余定理**：模数互质时合并同余方程 —— 进阶数论

## 权威链接

- [欧拉函数 - 维基百科](https://zh.wikipedia.org/wiki/%E6%AC%A7%E6%8B%89%E5%87%BD%E6%95%B0)
- [欧拉定理 (数论) - 维基百科](https://zh.wikipedia.org/wiki/%E6%AC%A7%E6%8B%89%E5%AE%9A%E7%90%86_(%E6%95%B0%E8%AE%BA))
- [组合数 - 维基百科](https://zh.wikipedia.org/wiki/%E7%BB%84%E5%90%88%E6%95%B0)
- [Lucas' Theorem - CP-Algorithms](https://cp-algorithms.com/combinatorics/binomial-coefficients.html)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/phi" target="_blank" rel="noopener noreferrer">欧拉函数可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/euler-function-slide/" target="_blank">欧拉函数与组合数</a>
