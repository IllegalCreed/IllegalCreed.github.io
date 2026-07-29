---
layout: doc
outline: [2, 3]
---

# 应用：分数化简、逆元与方程

> 基于通用数论套路 · 核于 2026-07

## 速查

- **分数化简**：`a/b` 化最简分数，分子分母同除 `gcd(a, b)`——这是 gcd 最直观的应用。
- **互质判断**：`gcd(a, b) == 1` 即互质——既约分数、逆元存在性、RSA 密钥生成都依赖它。
- **线性不定方程可解性**：`ax + by = c` 有整数解 ⟺ `gcd(a, b) | c`（贝祖定理推论）。
- **乘法逆元**：`a⁻¹ mod m` 存在 ⟺ `gcd(a, m) == 1`；用扩欧求（通用）或费马小定理（m 质数）。
- **模意义除法**：`a / b ≡ a × b⁻¹ (mod m)`——组合数取模、模方程求解的基础。
- **既约分数计数**：用 gcd 约分后去重，统计区间内既约真分数个数（法里数列）。
- **中国剩余定理（CRT）引入**：解同余方程组 `x ≡ rᵢ (mod mᵢ)`，两两模互质时用扩欧合并。
- **RSA 公钥密码**：选 `e` 使 `gcd(e, φ(n)) == 1`，再用扩欧求 `d = e⁻¹ mod φ(n)`——gcd 是 RSA 的基石。
- **化简复杂度**：分数化简 O(log min(a,b))；互质判断同；不定方程求解同扩欧 O(log)。
- **易错**：分数约分先取绝对值；逆元判 `gcd` 前提；不定方程忘判 `gcd|c` 就无脑求解。

## 一、分数化简：gcd 最直观的应用

把分数 `a/b` 化成**既约分数**（分子分母互质），只需分子分母同除 `gcd(a, b)`：

```js
function simplify(numer, denom) {
  const g = gcd(numer, denom);        // 注意 gcd 取绝对值
  let n = numer / g, d = denom / g;
  if (d < 0) { n = -n; d = -d; }       // 规范：分母为正
  return [n, d];
}
// simplify(6, 4) → [3, 2]
// simplify(-6, 4) → [-3, 2]
// simplify(6, -4) → [-3, 2]
```

化简后 `gcd(|n|, d) == 1`，分母规范化为正数。这是处理分数四则运算、显示、比较相等的第一步。

### 既约分数去重

统计「分母 ≤ N 的既约真分数个数」（法里数列 Farry sequence）时，对每个 `(a, b)` 用 `gcd(a, b) == 1` 过滤——遍历 `b` 从 2 到 N，`a` 从 1 到 b-1，计数 `gcd(a, b) == 1` 的对。总数 `≈ 3N²/π²`。

## 二、互质判断：gcd(a, b) == 1

两个整数 `a`、`b` **互质（coprime）**定义为 `gcd(a, b) == 1`，即没有大于 1 的公约数。互质是数论里极重要的关系，它是很多「存在性」的前提：

- **逆元存在性**：`a⁻¹ mod m` 存在 ⟺ `gcd(a, m) == 1`。
- **既约分数**：`a/b` 既约 ⟺ `gcd(|a|, |b|) == 1`。
- **欧拉函数**：`φ(n)` = 1 到 n 中与 n 互质的个数。
- **RSA**：选公钥 `e` 与 `φ(n)` 互质。

```js
const isCoprime = (a, b) => gcd(a, b) === 1;
// isCoprime(8, 9) → true
// isCoprime(8, 12) → false（gcd=4）
```

## 三、线性不定方程 ax + by = c：可解性判定

给定整数 `a`、`b`、`c`，问 `ax + by = c` 是否有整数解 `(x, y)`，以及怎么求。这是贝祖定理的直接推论：

**定理**：`ax + by = c` 有整数解 ⟺ `gcd(a, b) | c`（`c` 能被 `gcd(a, b)` 整除）。

- **必要性**：若有解 `(x, y)`，则 `ax + by` 是 `gcd(a, b)` 的倍数（因为 `gcd | a` 且 `gcd | b`），所以 `gcd | c`。
- **充分性**：若 `gcd(a, b) | c`，设 `g = gcd(a, b)`，`c = k × g`。由贝祖定理，`ax₀ + by₀ = g` 有解，两边乘 `k` 得 `a(kx₀) + b(ky₀) = c`。

### 求解流程

```js
function solveLinear(a, b, c) {
  const [g, x0, y0] = extgcd(a, b);              // ax0 + by0 = g
  if (c % g !== 0) return null;                   // 无解
  const k = c / g;
  const x = x0 * k, y = y0 * k;                   // 一组特解
  // 通解：x + t*(b/g), y - t*(a/g)，t 任意整数
  return { x, y, g };
}
// solveLinear(6, 9, 3): gcd(6,9)=3, 3|3 有解
//   extgcd(6,9) → [3, -1, 1] (6*-1 + 9*1 = 3)
//   k=1 → 特解 (x=-1, y=1)；验证 6*-1+9*1=3 ✓
```

### 经典：青蛙跳台阶 / Ax+B 问题

「两数凑某值」类问题（如用 3 元和 5 元邮票凑出 N 元）就是不定方程 `3x + 5y = N` 有非负整数解的判定。先用 `gcd(3,5)=1 | N` 判有解，再求特解并调整到非负。

## 四、乘法逆元的工程应用

### 组合数取模：C(n, k) mod p

`C(n, k) = n! / (k! × (n-k)!)`，模质数 `p` 下把除法转成乘逆元：

```js
// 预处理阶乘与阶乘逆元，O(n) 预处理 O(1) 查询
const p = 1e9 + 7, MAX = 1e5;
const fact = Array(MAX + 1).fill(1n), invFact = Array(MAX + 1).fill(1n);
for (let i = 1n; i <= BigInt(MAX); i++) fact[i] = fact[i-1n] * i % BigInt(p);
invFact[MAX] = modPow(fact[MAX], p - 2, p);       // 费马小定理求逆元
for (let i = BigInt(MAX) - 1n; i >= 0n; i--) invFact[i] = invFact[i+1n] * (i+1n) % BigInt(p);
const C = (n, k) => k < 0 || k > n ? 0n : fact[n] * invFact[k] % BigInt(p) * invFact[n-k] % BigInt(p);
```

### 解模方程 ax ≡ b (mod m)

`ax ≡ b (mod m)` 等价于 `ax + my = b`，是不定方程。有解 ⟺ `gcd(a, m) | b`。若 `gcd(a, m) == 1`，`x ≡ b × a⁻¹ (mod m)`，直接乘逆元。

## 五、中国剩余定理（CRT）：扩欧合并同余

**中国剩余定理**：给定两两互质的模 `m₁, m₂, ..., mₖ` 和余数 `r₁, r₂, ..., rₖ`，同余方程组

```
x ≡ r₁ (mod m₁)
x ≡ r₂ (mod m₂)
...
```

在模 `M = m₁ × m₂ × ... × mₖ` 下有**唯一解**。求解靠「两两合并」——合并两个同余式：

```
x ≡ r₁ (mod m₁)
x ≡ r₂ (mod m₂)      其中 gcd(m₁, m₂) == 1
```

设 `M = m₁ × m₂`，`t₁ = m₂ × (m₂⁻¹ mod m₁)`、`t₂ = m₁ × (m₁⁻¹ mod m₂)`（逆元用扩欧求），则解为 `x ≡ r₁ × t₁ + r₂ × t₂ (mod M)`。这把「解 k 个方程」归约为「反复解二元、求逆元」——而求逆元正是扩欧的拿手好戏。

```js
function crt2(r1, m1, r2, m2) {           // 合并两个同余，要求 gcd(m1,m2)==1
  const [g, p] = extgcd(m1, m2);          // m1*p + m2*q = 1，p = m1⁻¹ mod m2
  const inv1 = ((p % m2) + m2) % m2;       // m1 在 mod m2 的逆
  const M = m1 * m2;
  const x = ((((r1 % M) * (m2 % M)) % M) * (modInverse(m2, m1)) +
             ((r2 % M) * (m1 % M)) % M * inv1) % M;
  return [x, M];                          // 返回 (x mod M, M)
}
```

（非互质模要用更一般的「扩展 CRT」，每次合并时算 `gcd(m₁, m₂)` 判可解性——仍是扩欧的延伸。）

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/gcd" target="_blank" rel="noopener noreferrer">GCD 可视化演示</a> —— 分数化简与互质判断的底层
- <a href="https://algo.illegalscreed.cn/docs/ext-gcd" target="_blank" rel="noopener noreferrer">扩展欧几里得可视化演示</a> —— 逆元与方程求解的回代过程

## 下一步

掌握了 GCD/LCM/扩欧的全部应用后，回头查代码模板、复杂度表与易错点，见[参考](../reference)。
