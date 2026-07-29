---
layout: doc
outline: [2, 3]
---

# 模运算性质与应用

> 基于通用数论套路 · 核于 2026-07

## 速查

- **模运算可分配性**：加 `(a+b)%p=((a%p)+(b%p))%p`、减 `(a-b)%p=((a%p)-(b%p))%p`、乘 `(a×b)%p=((a%p)×(b%p))%p`、幂 `a^n%p=(a%p)^n%p`——**减法取模后可能为负，要 `+p` 再 `%p` 修正**。
- **除法不分配**：`(a/b)%p ≠ (a%p)/(b%p)`——模意义下除法要用**乘法逆元** `b^(-1)`，把 `a/b mod p` 转成 `a × b^(-1) mod p`。
- **费马小定理**：若 p 为质数且 `gcd(a,p)=1`，则 `a^(p-1) ≡ 1 (mod p)`——**求逆元的核心**：`a^(-1) ≡ a^(p-2) (mod p)`（用快速幂 O(log p) 算）。
- **组合数取模**：`C(n,k) mod p = n! × (k!)^(-1) × ((n-k)!)^(-1) mod p`——把除法用逆元转乘法，配合预处理阶乘 O(1) 查询。
- **大数取模的精度问题**：JS Number 安全整数上限 `2^53-1`，`p×p` 超限会丢精度，必须用 **`BigInt`**（任意精度整数，字面量带 `n`）。
- **模运算恒等**：`(a mod p)` 结果在 `[0, p)`；负数取模语言相关，JS `%` 可能得负值，统一用 `((x%p)+p)%p` 归一化。
- **矩阵快速幂思想**：把快速幂从「数的自乘」推广到「矩阵的自乘」——斐波那契 `F(n)=F(n-1)+F(n-2)` 写成矩阵形式后，用快速幂把 O(n) 递推降到 **O(log n)**。
- **应用全景**：费马逆元 → 组合数取模；矩阵快速幂 → 线性递推加速；RSA 密码学里的大数模幂。
- **易错**：减法取模忘 `+p`；除法直接取模（错，要逆元）；JS Number 超精度未用 BigInt；费马小定理忘了 p 必须是**质数**且 `gcd(a,p)=1`。

## 一、模运算的六大性质

模运算（mod p，p 为正整数）最核心的性质是**加、减、乘（及幂）对取模可分配**，但除法不行。下表是完整清单：

| 运算 | 公式 | 注意 |
| --- | --- | --- |
| 加 | `(a+b) mod p = ((a mod p)+(b mod p)) mod p` | — |
| 减 | `(a-b) mod p = ((a mod p)-(b mod p)) mod p` | 结果可能为负，**`+p` 再 `%p`** |
| 乘 | `(a×b) mod p = ((a mod p)×(b mod p)) mod p` | — |
| 幂 | `a^n mod p = (a mod p)^n mod p` | 快速幂取模版的依据 |
| 除 | ❌ `(a/b) mod p ≠ (a mod p)/(b mod p)` | 需**乘法逆元** |
| 归一 | `((x mod p) + p) mod p` | 把任意 x 统一到 `[0, p)` |

### 减法取模的负数陷阱

JS 的 `%` 是「带符号取模」——`(5 - 7) % 10` 得 `-2` 而非 `8`。在数论里我们要的是非负余数，所以减法取模后必须修正：

```js
// 正确的非负取模减法：(a - b) mod p
function subMod(a, b, p) {
  return ((a % p - b % p) % p + p) % p;  // +p 再 %p 修正负数
}
```

为什么 `+p` 够了？因为 `a%p - b%p` 落在 `(-(p-1), p-1)`，加一个 p 必然变正，再 `%p` 归一到 `[0, p)`。

### 乘法可分配的证明

`(a×b) mod p = ((a mod p)×(b mod p)) mod p` 的证明：设 `a = q₁p + r₁`、`b = q₂p + r₂`（`r₁,r₂ ∈ [0,p)`），则 `a×b = q₁q₂p² + (q₁r₂+q₂r₁)p + r₁r₂`，前两项都是 p 的倍数，所以 `(a×b) mod p = (r₁r₂) mod p = ((a mod p)×(b mod p)) mod p`。这是「边算边取模」正确性的根基。

## 二、除法不分配：为什么需要逆元

模运算对除法**不**可分配：

```
(10 / 3) mod 7 = 3 mod 7 = 3
但 (10 mod 7) / (3 mod 7) = 3 / 3 = 1   ❌ 不等于 3
```

原因是模意义下「除法」根本不是普通除法——我们定义 `a / b mod p` 为 `a × b^(-1) mod p`，其中 `b^(-1)` 是 b 在模 p 下的**乘法逆元**（满足 `b × b^(-1) ≡ 1 (mod p)`）。把除法转成「乘以逆元」，就能套用乘法的可分配性。

逆元的存在条件：`gcd(b, p) = 1`（b 与 p 互质）。当 p 是质数且 `b ≠ 0 mod p` 时，必然满足，且可用**费马小定理**快速求出。

## 三、费马小定理：求逆元的利器

**费马小定理（Fermat's Little Theorem）**：若 p 为质数，且 `gcd(a, p) = 1`（即 p 不整除 a），则：

```
a^(p-1) ≡ 1 (mod p)
```

两边同乘 `a^(-1)` 得 `a^(p-2) ≡ a^(-1) (mod p)`。所以**在模质数 p 下，a 的乘法逆元就是 `a^(p-2) mod p`**——直接用快速幂算，O(log p)：

```js
// 费马小定理求逆元：a^(-1) mod p（p 为质数）
function inv(a, p) {
  return powMod(a, p - 2, p);   // 复用取模版快速幂
}
// 验证：inv(a, p) 满足 a × inv(a,p) ≡ 1 (mod p)
```

### 例子：求 3 在模 7 下的逆元

p = 7 是质数，`3^(-1) ≡ 3^(7-2) = 3^5 mod 7`。算 `3^5 = 243`，`243 mod 7 = 5`（因为 `7×34=238`，`243-238=5`）。验证：`3 × 5 = 15 mod 7 = 1` ✅。所以模 7 下 3 的逆元是 5。

### 组合数取模：逆元的典型应用

`C(n, k) = n! / (k! × (n-k)!)`，在模质数 p 下求值时，把每个阶乘的「倒数」用逆元表示：

```
C(n,k) mod p = fact[n] × inv(fact[k]) × inv(fact[n-k]) mod p
```

预处理 `fact[i] = i! mod p` 和 `invFact[i] = (i!)^(-1) mod p`（用费马逆元 O(log p) 算 `invFact[n]`，再倒推 `invFact[i-1] = invFact[i] × i mod p`），就能 O(1) 回答任意组合数查询。

```js
// 预处理阶乘与逆元阶乘，O(1) 查 C(n,k) mod p
function init(n, p) {
  const fact = new Array(n + 1), invFact = new Array(n + 1);
  fact[0] = 1;
  for (let i = 1; i <= n; i++) fact[i] = fact[i-1] * i % p;
  invFact[n] = powMod(fact[n], p - 2, p);           // 费马逆元
  for (let i = n - 1; i >= 0; i--) invFact[i] = invFact[i+1] * (i+1) % p; // 倒推
  return { fact, invFact };
}
const C = (n, k, p, {fact, invFact}) =>
  k < 0 || k > n ? 0 : fact[n] * invFact[k] % p * invFact[n-k] % p;
```

## 四、大数取模：JS 的精度问题与 BigInt

JS 的 `Number` 是 IEEE 754 双精度浮点，**安全整数上限是 `2^53 - 1 ≈ 9×10^15`**。常见的模数如 `p = 10^9+7`，则 `p × p ≈ 10^18 > 2^53`——`(base × base) % p` 里的乘法会丢精度，结果是错的且**不报错**。

### 什么时候必须用 BigInt

经验法则：**`p × p` 超过 `2^53` 就必须用 BigInt**。常见模数与判断：

- `p ≤ 3037000499`（约 3×10⁹）：`p×p < 2^53`，Number 安全。
- `p = 10^9+7`（约 10⁹）：`p×p ≈ 10^18 > 2^53`，**必须 BigInt**。
- `p = 998244353`（NTT 常用）：同理必须 BigInt。

### BigInt 版取模快速幂

```js
// BigInt 版取模快速幂：a^n mod p，杜绝精度丢失
function powModBig(a, n, p) {
  a = BigInt(a); n = BigInt(n); p = BigInt(p); // 转 BigInt
  let res = 1n, base = a % p;
  while (n > 0n) {
    if (n & 1n) res = (res * base) % p;
    base = (base * base) % p;
    n >>= 1n;
  }
  return res;
}
```

BigInt 注意事项：①不能与 Number 混算（`1n + 1` 抛错）；②除法是整除（无小数）；③运算比 Number 慢，按需使用。

## 五、矩阵快速幂：把思想推广到矩阵

快速幂的本质是「**满足结合律的自乘**」。矩阵乘法满足结合律，所以可以把快速幂从「数的自乘」推广到「矩阵的自乘」——这就是**矩阵快速幂**，用来把**线性递推**从 O(n) 加速到 O(log n)。

### 经典：斐波那契数列 O(log n)

斐波那契 `F(n) = F(n-1) + F(n-2)`，写成矩阵形式：

```
| F(n)   |   | 1  1 |   | F(n-1) |
| F(n-1) | = | 1  0 | × | F(n-2) |

即 [F(n), F(n-1)]ᵀ = M × [F(n-1), F(n-2)]ᵀ，其中 M = [[1,1],[1,0]]
递推 n 步：[F(n), F(n-1)]ᵀ = M^(n-1) × [F(1), F(0)]ᵀ
```

于是 `F(n)` 就是对 2×2 矩阵 M 求 `M^(n-1)` 再乘初始向量——用快速幂算矩阵幂，每次矩阵乘法 O(2³)=O(1)，总共 O(log n) 次矩阵乘法，整体 **O(log n)**。

```js
// 矩阵快速幂求 F(n) mod p
function matMul(A, B, p) {                // 2×2 矩阵乘法（取模）
  const C = [[0,0],[0,0]];
  for (let i = 0; i < 2; i++)
    for (let k = 0; k < 2; k++) {
      const s = A[i][k];
      for (let j = 0; j < 2; j++) C[i][j] = (C[i][j] + s * B[k][j]) % p;
    }
  return C;
}
function fib(n, p) {                       // 返回 F(n) mod p
  if (n === 0) return 0;
  let res = [[1,0],[0,1]];                 // 单位矩阵
  let base = [[1,1],[1,0]];
  let m = n - 1;
  while (m > 0) {                          // 标准快速幂框架
    if (m & 1) res = matMul(res, base, p); // 矩阵乘法代替数的乘法
    base = matMul(base, base, p);
    m = Math.floor(m / 2);
  }
  return res[0][0] % p;                    // F(n) = (M^(n-1))[0][0]
}
```

矩阵快速幂的关键是**构造转移矩阵 M**：把递推关系写成 `[状态] = M × [上一状态]` 的形式。一旦构造好 M，剩下就是套用快速幂模板（只是把「数乘」换成「矩阵乘」）。

### 适用范围

任何**常系数线性递推**（如 `f(n) = c₁f(n-1) + c₂f(n-2) + ...`）都能用矩阵快速幂加速到 O(k³ log n)（k 是递推阶数）。这是快速幂思想最有力的推广之一。

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/fastpower" target="_blank" rel="noopener noreferrer">快速幂可视化演示</a> —— 矩阵快速幂的逐次自平方过程

## 下一步

掌握了模运算性质、费马逆元与矩阵快速幂后，下一步是完整的**代码模板速查**与易错点清单，见[参考](../reference)。
