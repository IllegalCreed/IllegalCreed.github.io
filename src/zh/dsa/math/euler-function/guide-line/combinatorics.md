---
layout: doc
outline: [2, 3]
---

# 组合数与逆元

> 基于通用数论套路 · 核于 2026-07

## 速查

- **组合数公式**：`C(n,k) = n! / (k! × (n-k)!)`，边界 `C(n,0)=C(n,n)=1`，对称 `C(n,k)=C(n,n-k)`。
- **杨辉三角递推**：`C(n,k) = C(n-1,k-1) + C(n-1,k)`——O(n²) 建全表，模数任意。
- **O(1) 查询套路**：预处理 `fact[i]=i! mod p` 与 `invfact[i]=(i!)⁻¹ mod p`，则 `C(n,k) = fact[n] × invfact[k] × invfact[n-k] mod p`。
- **逆元来源**：模数质数 → 费马 `invfact` 由 `fact[N]^(p-2)` 倒推 `invfact[i] = invfact[i+1] × (i+1)`。
- **卢卡斯定理**：`C(n,k) mod p = C(n mod p, k mod p) × C(n/p, k/p) mod p`（`p` 质数）——`n,k` 极大、`p` 小时递归化简。
- **乘法逆元定义**：`a⁻¹` 满足 `a × a⁻¹ ≡ 1 (mod m)`，存在当且仅当 `gcd(a,m)=1`。
- **费马求逆**（模数 `p` 质数）：`a⁻¹ ≡ a^(p-2) (mod p)`，配快速幂 `O(log p)`。
- **欧拉求逆**（模数 `m` 任意，需互质）：`a⁻¹ ≡ a^(φ(m)-1) (mod m)`。
- **复杂度**：递推 O(n²)；阶乘+逆元预处理 O(n)、查询 O(1)；卢卡斯 O(log_p n)。
- **易错**：阶乘预处理范围要覆盖最大 `n`；`n ≥ p` 时 `fact[n]≡0` 需卢卡斯；费马逆元仅限质数模。

## 一、组合数公式与递推

组合数 `C(n,k)` 的定义公式是 `n! / (k!(n-k)!)`。直接算阶乘会溢出，且取模下不能做除法——于是有两条主路：**递推**（避除法）与**逆元**（把除法转成乘法）。

### 杨辉三角递推

由「`n` 个里选 `k` 个」=「包含第 `n` 个选 `k-1` 个」+「不包含第 `n` 个选 `k` 个」可得：

```
C(n,k) = C(n-1,k-1) + C(n-1,k)
```

边界 `C(n,0) = C(n,n) = 1`。这正好是杨辉三角（每个数 = 肩上两数之和）。它可以**对任意模数**取模（只有加法，没除法），适合 `n ≤ 几千`、要全表的场景：

```js
// 杨辉三角递推求 C(n,k) mod m：O(n²)
function pascal(N, m) {
  const C = Array.from({ length: N + 1 }, () => new Array(N + 1).fill(0));
  for (let n = 0; n <= N; n++) {
    C[n][0] = C[n][n] = 1;                // 边界
    for (let k = 1; k < n; k++)
      C[n][k] = (C[n-1][k-1] + C[n-1][k]) % m;
  }
  return C;                                // C[n][k] 即答案
}
```

**优点**：模数任意（不必质数）、一次建表多次查；**缺点**：O(n²) 时空，`n` 大（如 1e6）不可行。

## 二、阶乘 + 逆元：O(1) 单点查询

当 `n` 较大（1e6 量级）但模数 `p` 是**质数**时，用阶乘 + 逆元把 `C(n,k)` 拆成三次乘法：

```
C(n,k) ≡ fact[n] × invfact[k] × invfact[n-k] (mod p)
```

其中 `fact[i] = i! mod p`，`invfact[i] = (i!)⁻¹ mod p`。预处理 `O(n)`，之后每次查询 `O(1)`。技巧是**先算 `fact[N]` 的逆元，再倒推**所有 `invfact`：

```js
// 预处理 fact / invfact，模数 p 为质数
let fact, invfact, inv;
function buildFact(N, p) {
  fact = new Array(N + 1); invfact = new Array(N + 1); inv = new Array(N + 1);
  fact[0] = 1;
  for (let i = 1; i <= N; i++) fact[i] = Number(BigInt(fact[i-1]) * BigInt(i) % BigInt(p));
  inv[1] = 1;
  for (let i = 2; i <= N; i++) inv[i] = Number((BigInt(p) - BigInt(p) / BigInt(i)) * BigInt(inv[p % i]) % BigInt(p));
  invfact[0] = 1;
  for (let i = 1; i <= N; i++) invfact[i] = Number(BigInt(invfact[i-1]) * BigInt(inv[i]) % BigInt(p));
}
function C(n, k, p) {                       // O(1) 查询
  if (k < 0 || k > n) return 0;
  return Number(BigInt(fact[n]) * BigInt(invfact[k]) % BigInt(p) * BigInt(invfact[n-k]) % BigInt(p));
}
```

`inv[i]` 用线性递推 `inv[i] = -(p/i) × inv[p mod i] mod p` 一次性算全，比每个都做 `p-2` 次快速幂省一个 log。

## 三、卢卡斯定理：n, k 极大、p 小

当 `n, k` 极大（如 1e18）但模数 `p` 小（如 1e5）且为质数时，直接预处理阶乘到 `n` 不现实。**卢卡斯定理**把问题递归拆小：

```
C(n, k) mod p = C(n mod p, k mod p) × C(⌊n/p⌋, ⌊k/p⌋) mod p
```

即「把 `n, k` 按 `p` 进制拆位，对应位的组合数相乘」。每段的 `n mod p, k mod p` 都 `< p`，可预处理 `0..p-1` 的阶乘表 `O(1)` 查询，递归深度 `O(log_p n)`：

```js
// 卢卡斯定理求 C(n,k) mod p（p 质数）
function lucas(n, k, p) {
  if (k < 0 || k > n) return 0;
  let res = 1n;
  let N = BigInt(n), K = BigInt(k), P = BigInt(p);
  while (N > 0n || K > 0n) {               // 按 p 进制逐位
    const ni = Number(N % P), ki = Number(K % P);
    if (ki > ni) return 0;                 // 该位 C(ni,ki)=0 则整体 0
    res = res * BigInt(Csmall(ni, ki, p)) % P;  // Csmall 用 0..p-1 阶乘表
    N /= P; K /= P;
  }
  return Number(res);
}
```

**前提**：`p` 必须是**质数**。模数非质数时卢卡斯失效，要用更复杂的扩展卢卡斯（exLucas）。

## 四、乘法逆元：费马 vs 欧拉

模算术里「除以 `a`」=`乘 a⁻¹`，逆元 `a⁻¹` 满足 `a × a⁻¹ ≡ 1 (mod m)`，存在当且仅当 `gcd(a,m) = 1`。两条主路：

| 方法 | 适用模数 | 公式 | 来源 |
| --- | --- | --- | --- |
| **费马** | 质数 `p` | `a⁻¹ ≡ a^(p-2) (mod p)` | 费马小定理 `a^(p-1)≡1` |
| **欧拉** | 任意 `m`（需互质） | `a⁻¹ ≡ a^(φ(m)-1) (mod m)` | 欧拉定理 `a^φ(m)≡1` |

```js
// 费马求逆：模数 p 质数，a⁻¹ = a^(p-2) mod p
function invFermat(a, p) {
  return powmod(a, p - 2, p);              // 复用欧拉节的快速幂
}
// 欧拉求逆：模数 m 任意（需 gcd(a,m)=1），a⁻¹ = a^(φ(m)-1) mod m
function invEuler(a, m) {
  return powmod(a, phi(m) - 1, m);         // phi() 见欧拉函数节
}
```

实战中：**模数是质数 → 费马**（最常见，代码短）；**模数是合数（如 1e9+7 是质数，但有的题给合数）→ 欧拉或扩欧**。两者都必须先确认 `gcd(a,m)=1`，否则无逆元、除法无意义。

## 五、三种打法选型

| 场景 | 方法 | 预处理 | 单次查询 | 备注 |
| --- | --- | --- | --- | --- |
| `n ≤ 几千`，模数任意 | 杨辉递推 | O(n²) | O(1) | 模数不必质数 |
| `n ≤ 1e6`，模数质数 | 阶乘+逆元 | O(n) | **O(1)** | 最常用 |
| `n ≤ 1e18`，模数 `p` 小且质数 | 卢卡斯 | O(p) | O(log_p n) | 拆 p 进制 |
| 模数合数、`n` 大 | 扩展卢卡斯 | — | — | 分解模数质因子幂 |

## 下一步

三种组合数打法 + 两种逆元求法都掌握后，可以在[参考](../reference)里查阅完整代码模板、复杂度表与易错点清单。
