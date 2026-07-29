---
layout: doc
outline: [2, 3]
---

# 参考：快速幂 API、模运算与应用速查

> 基于通用数论概念 · 核于 2026-07

## 速查

- **快速幂**：`a^n` 由指数二进制分解降到 **O(log n)** 乘法；递归 `pow(a,n)=pow(a,n/2)²×(n奇?a:1)`，迭代 `while(n){if(n&1)r*=b;b*=b;n/=2;}`。
- **取模版**：每步 `%p`，由 `(a×b)%p=((a%p)×(b%p))%p` 保证正确——把中间值压在 `[0,p)`，防溢出。
- **模运算性质**：加/减/乘/幂可分配；减法取模可能为负要 `+p` 再 `%p`；**除法不分配，需逆元**。
- **费马小定理**：p 质数且 `gcd(a,p)=1` 时 `a^(p-1)≡1 mod p`，逆元 `a^(-1)≡a^(p-2) mod p`（快速幂 O(log p)）。
- **组合数取模**：`C(n,k) mod p = fact[n]×invFact[k]×invFact[n-k] mod p`，预处理阶乘与逆元阶乘 O(1) 查询。
- **BigInt**：`p×p > 2^53` 时（如 `p=10^9+7`）必须用 BigInt（字面量 `n` 后缀，不可与 Number 混算，除法整除）。
- **矩阵快速幂**：把快速幂推广到矩阵乘法；斐波那契 `F(n)` 写成矩阵幂 `M^(n-1)` 后 **O(log n)**；关键是构造转移矩阵。
- **易错**：减法忘 `+p`；除法直接取模（错）；Number 超精度未用 BigInt；迭代版先自平方再判位（顺序错）；费马小定理忘 p 为质数。
- **交互演示**：[快速幂可视化](https://algo.illegalscreed.cn/docs/fastpower)。

## 一、模运算性质表

| 运算 | 公式 | 注意 |
| --- | --- | --- |
| 加 | `(a+b) mod p = ((a mod p)+(b mod p)) mod p` | — |
| 减 | `(a-b) mod p = ((a mod p)-(b mod p)) mod p` | **结果为负要 `+p` 再 `%p`** |
| 乘 | `(a×b) mod p = ((a mod p)×(b mod p)) mod p` | 边算边取模的依据 |
| 幂 | `a^n mod p = (a mod p)^n mod p` | 快速幂取模版 |
| 除 | ❌ `(a/b) mod p ≠ (a mod p)/(b mod p)` | 需**乘法逆元** |
| 归一 | `((x mod p)+p) mod p` | 负数归一到 `[0,p)` |

记忆口诀：**「加、减、乘、幂都能边算边取模；减法可能负要 +p；除法不行要逆元。」**

## 二、快速幂代码模板

### 朴素快速幂（不取模，演示用）

```js
// a^n，O(log n)——不取模，中间值会爆炸，仅用于 n 很小的演示
function pow(a, n) {
  let res = 1, base = a;
  while (n > 0) {
    if (n & 1) res *= base;          // 二进制位为 1：累乘
    base *= base;                    // 底数自平方
    n = Math.floor(n / 2);           // 指数右移
  }
  return res;
}
```

### 迭代取模版（最常用）

```js
// a^n mod p，O(log n)
function powMod(a, n, p) {
  let res = 1, base = a % p;         // base 先取模
  while (n > 0) {
    if (n & 1) res = (res * base) % p; // 累乘 + 取模
    base = (base * base) % p;          // 自平方 + 取模
    n = Math.floor(n / 2);
  }
  return res;
}
```

### 递归取模版

```js
// a^n mod p，递归写法
function powModRec(a, n, p) {
  if (n === 0) return 1 % p;
  const half = powModRec(a, Math.floor(n / 2), p);
  const sq = (half * half) % p;      // 平方后取模
  return n % 2 === 0 ? sq : (sq * (a % p)) % p;
}
```

### BigInt 取模版（p 大时必须）

```js
// a^n mod p，BigInt 版，杜绝精度丢失
function powModBig(a, n, p) {
  a = BigInt(a); n = BigInt(n); p = BigInt(p);
  let res = 1n, base = a % p;
  while (n > 0n) {
    if (n & 1n) res = (res * base) % p;
    base = (base * base) % p;
    n >>= 1n;                        // BigInt 可位运算
  }
  return res;
}
```

## 三、费马小定理求逆元

```js
// 模质数 p 下 a 的乘法逆元：a^(-1) ≡ a^(p-2) mod p
function inv(a, p) {
  return powMod(a, p - 2, p);        // 复用迭代取模快速幂
}
// 验证：(a × inv(a,p)) mod p === 1
```

前提：p 是质数，且 `gcd(a, p) = 1`（即 p 不整除 a）。若 p 非质数，需用扩展欧几里得算法求逆元（本叶不展开）。

## 四、组合数取模（预处理阶乘 + 逆元）

```js
// 预处理 fact[] 和 invFact[]，O(1) 查 C(n,k) mod p（p 质数）
function initComb(n, p) {
  const fact = new Array(n + 1), invFact = new Array(n + 1);
  fact[0] = 1;
  for (let i = 1; i <= n; i++) fact[i] = fact[i-1] * i % p;
  invFact[n] = powMod(fact[n], p - 2, p);               // 费马逆元
  for (let i = n - 1; i >= 0; i--)
    invFact[i] = invFact[i+1] * (i+1) % p;              // 倒推
  return { fact, invFact };
}
const comb = (n, k, p, {fact, invFact}) =>
  k < 0 || k > n ? 0 : fact[n] * invFact[k] % p * invFact[n-k] % p;
```

## 五、矩阵快速幂（斐波那契 O(log n)）

```js
// 2×2 矩阵乘法（取模）
function matMul(A, B, p) {
  const C = [[0,0],[0,0]];
  for (let i = 0; i < 2; i++)
    for (let k = 0; k < 2; k++) {
      const s = A[i][k];
      for (let j = 0; j < 2; j++) C[i][j] = (C[i][j] + s * B[k][j]) % p;
    }
  return C;
}
// F(n) mod p，O(log n)
function fibMod(n, p) {
  if (n === 0) return 0;
  let res = [[1,0],[0,1]], base = [[1,1],[1,0]], m = n - 1;
  while (m > 0) {                   // 套用快速幂框架
    if (m & 1) res = matMul(res, base, p);
    base = matMul(base, base, p);
    m = Math.floor(m / 2);
  }
  return res[0][0] % p;
}
```

## 六、易错点清单

- **减法取模得负数**：`(a-b)%p` 在 JS 里可能为负，必须 `((a-b)%p+p)%p` 修正到 `[0,p)`。
- **除法直接取模**：`(a/b)%p ≠ (a%p)/(b%p)`——模意义下除法要转乘法逆元（费马 `a^(p-2)`）。
- **JS Number 精度**：`p×p > 2^53`（如 `p=10^9+7`）时 `(base×base)` 丢精度，必须用 BigInt。
- **迭代版顺序错**：必须**先判 `n&1` 累乘，再 `base*=base` 自平方**；反了会多乘一次。
- **n 右移用 `>>`**：JS 的 `>>` 对 `n > 2^32` 会截断出错，用 `n = Math.floor(n/2)` 更安全；BigInt 版用 `>>= 1n`。
- **`n=0` 边界**：`a^0=1`，返回 `1 % p`（`p=1` 时应为 0，`1%1=0` 自然处理）。
- **base 未预取模**：循环外忘了 `base = a % p`，若 `a ≥ p` 会算大数。
- **费马小定理前提**：p 必须是**质数**且 `gcd(a,p)=1`；p 非质数时 `a^(p-2)` 不是逆元，要用扩展欧几里得。
- **逆元不存在**：`gcd(a,p)≠1` 时 a 在模 p 下无逆元（如 `a=2, p=4`）。
- **矩阵快速幂构造错**：转移矩阵 M 要让 `[F(n),F(n-1)]ᵀ = M×[F(n-1),F(n-2)]ᵀ`，行列顺序写反会全错。
- **`0^0` 约定**：组合数学里 `0^0 = 1`，快速幂 `n=0` 直接返回 1 即可。
- **BigInt 与 Number 混算**：`1n + 1` 抛 TypeError，全 BigInt 或全 Number，边界处显式转换。

## 权威链接

- [快速幂 - 维基百科](https://zh.wikipedia.org/wiki/%E5%B9%82%E6%B1%82%E6%A8%A1)
- [Exponentiation by squaring - Wikipedia](https://en.wikipedia.org/wiki/Exponentiation_by_squaring)
- [模运算 - 维基百科](https://zh.wikipedia.org/wiki/%E6%A8%A1%E7%AE%97%E6%95%B0)
- [费马小定理 - 维基百科](https://zh.wikipedia.org/wiki/%E8%B4%B9%E9%A9%AC%E5%B0%8F%E5%AE%9A%E7%90%86)
- [Modular Exponentiation - GeeksforGeeks](https://www.geeksforgeeks.org/modular-exponentiation-power-in-modular-arithmetic/)
- [矩阵快速幂 - OI Wiki](https://oi-wiki.org/math/linear-algebra/matrix/)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/fastpower" target="_blank" rel="noopener noreferrer">快速幂可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/fast-power-slide/" target="_blank">快速幂与模运算</a>
