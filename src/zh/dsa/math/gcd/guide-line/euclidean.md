---
layout: doc
outline: [2, 3]
---

# 辗转相除与扩展欧几里得

> 基于通用数论套路 · 核于 2026-07

## 速查

- **辗转相除递推**：`gcd(a, b) = gcd(b, a mod b)`，递归到 `b == 0` 返回 `a`——O(log min(a, b))。
- **迭代写法**：`while (b) [a, b] = [b, a % b]; return a;`——避免递归栈，常数更小。
- **扩欧递推**：求 `ax + by = gcd(a, b)` 的解；递归到 `b==0` 返回 `(x=1, y=0)`，回代时 `x = y'`、`y = x' - q×y'`（`q = a div b`）。
- **为何能求**：子问题 `b×x' + (a mod b)×y' = g` 的解 `(x', y')` 代入 `a mod b = a - q×b`，整理出本层 `(x, y)`，O(1) 回代。
- **乘法逆元**：`a⁻¹ mod m` 存在 ⟺ `gcd(a, m) == 1`；用扩欧求 `ax + my = 1` 的 `x`，取 `x mod m` 即逆元。
- **费马小定理（替代）**：当 `m` 为质数时 `a⁻¹ ≡ a^(m-2) (mod m)`，用快速幂求——比扩欧快但要求 m 质数。
- **解的存在性**：`ax + by = c` 有整数解 ⟺ `gcd(a, b) | c`（贝祖定理推论）。
- **通解**：特解 `(x₀, y₀)`，通解 `x = x₀ + k×b/g`、`y = y₀ - k×a/g`（`g = gcd(a,b)`）。
- **复杂度**：扩欧与求 gcd 同阶，O(log min(a, b))；快速幂求逆元 O(log m)。
- **负数处理**：gcd 取绝对值；逆元结果 `((x % m) + m) % m` 保证落在 `[0, m)`。
- **易错**：逆元前提 `gcd(a,m)==1` 易漏判；`lcm` 先除后乘防溢出；扩欧解不唯一要取模规范化。

## 一、辗转相除法：递归与迭代

辗转相除的核心递推是 `gcd(a, b) = gcd(b, a mod b)`，递归到 `b == 0` 时返回 `a`。两种写法：

```js
// 递归版：最贴近定义，直观
function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  return b === 0 ? a : gcd(b, a % b);
}

// 迭代版：避免函数调用栈，常数更小，工程首选
function gcdIter(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b !== 0) { [a, b] = [b, a % b]; }
  return a;
}
```

两者完全等价，迭代版在求大整数 gcd 或高频调用时更稳。多元素 gcd 用归约：`gcd(a, b, c) = gcd(gcd(a, b), c)`，可用 `reduce` 一行算：

```js
const gcdAll = (...xs) => xs.reduce((g, x) => gcd(g, x), 0);
```

## 二、扩展欧几里得：在求 gcd 的同时求 (x, y)

**扩展欧几里得算法**（Extended Euclidean algorithm）在递归求 gcd 的同时，把满足贝祖等式 `a × x + b × y = gcd(a, b)` 的一组整数解 `(x, y)` 回代算出来。

### 为何能求：回代原理

设本层是 `gcd(a, b)`，递归调用 `gcd(b, a mod b)` 得到 `g` 和子问题的解 `(x', y')`，即 `b × x' + (a mod b) × y' = g`。把 `a mod b = a - q × b`（其中 `q = ⌊a / b⌋`）代入：

```
g = b × x' + (a - q×b) × y'
  = a × y' + b × (x' - q × y')
```

对照本层 `a × x + b × y = g`，得到本层解：

```
x = y'
y = x' - q × y'        （q = ⌊a / b⌋）
```

递归到 `b == 0` 时，`gcd(a, 0) = a`，对应 `a × 1 + 0 × 0 = a`，即 `x = 1, y = 0`。从这条基础情况一层层回代，就能得到最初调用层的 `(x, y)`。

### 代码（递归回代）

```js
// 返回 [g, x, y]，满足 a*x + b*y = g = gcd(a,b)
function extgcd(a, b) {
  if (b === 0) return [a, 1, 0];           // 基础情况：a*1 + 0*0 = a
  const [g, x1, y1] = extgcd(b, a % b);    // 子问题解 (x1, y1)
  const x = y1;                            // 本层 x = 子层 y'
  const y = x1 - Math.floor(a / b) * y1;   // 本层 y = 子层 x' - q*y'
  return [g, x, y];
}
```

### 手算验证：extgcd(18, 12)

```
extgcd(18, 12):
  extgcd(12, 6):
    extgcd(6, 0) → [6, 1, 0]            // 基础
    q = 12/6 = 2; x = 0; y = 1 - 2*0 = 1  → [6, 0, 1]
  q = 18/12 = 1; x = 1; y = 0 - 1*1 = -1  → [6, 1, -1]
```

返回 `[6, 1, -1]`，验证 `18 × 1 + 12 × (-1) = 6`，正确。

### 解不唯一：通解

若 `(x₀, y₀)` 是 `ax + by = g`（`g = gcd(a,b)`）的一组特解，则通解：

```
x = x₀ + k × (b / g)
y = y₀ - k × (a / g)        k 为任意整数
```

这是因为 `a × (k×b/g) + b × (-k×a/g) = 0`，加上零解不改变等式。

## 三、求乘法逆元：扩欧 vs 费马小定理

`a` 在模 `m` 下的**乘法逆元** `a⁻¹` 满足 `a × a⁻¹ ≡ 1 (mod m)`。它存在的**充要条件**是 `gcd(a, m) == 1`（即 `a` 与 `m` 互质）。求逆元有两条主路：

### 方法一：扩展欧几里得（通用）

求 `a × x + m × y = gcd(a, m)`，若 `gcd(a, m) == 1` 则 `a × x ≡ 1 (mod m)`，`x mod m` 就是逆元：

```js
function modInverse(a, m) {
  const [g, x] = extgcd(a, m);
  if (g !== 1) return null;                       // gcd≠1，逆元不存在
  return ((x % m) + m) % m;                        // 规范到 [0, m)
}
```

优点：**不要求 m 是质数**，只要 `gcd(a, m) == 1` 即可，是最通用的逆元求法。

### 方法二：费马小定理（m 为质数时）

当 `m` 是**质数**且 `gcd(a, m) == 1`（即 `a` 不被 m 整除）时，费马小定理给出 `a^(m-1) ≡ 1 (mod m)`，所以：

```
a⁻¹ ≡ a^(m-2) (mod m)
```

用**快速幂**求，复杂度 O(log m)：

```js
function modInverseFermat(a, p) {  // p 为质数
  return modPow(a, p - 2, p);
}
function modPow(base, exp, mod) {
  let res = 1n; base = BigInt(base) % BigInt(mod); exp = BigInt(exp);
  const m = BigInt(mod);
  while (exp > 0n) {
    if (exp & 1n) res = res * base % m;
    base = base * base % m;
    exp >>= 1n;
  }
  return Number(res);
}
```

选用规则：**m 是质数（如 1e9+7）→ 费马小定理 + 快速幂（更简洁）**；**m 不一定是质数或 a、m 不一定互质的通用场景 → 扩欧**。

### 为何逆元等价于「模意义下的除法」

在模 `m` 下，`a / b` 没有直接定义（模运算只定义加、减、乘）。但若 `b` 有逆元 `b⁻¹`，则定义 `a / b ≡ a × b⁻¹ (mod m)`——把除法转成乘逆元。这就是组合数取模 `(a choose b) mod p` 用「预处理阶乘 + 阶乘逆元」算的理论基础。

## 四、线性不定方程 ax + by = c 的解

**贝祖定理推论**：`ax + by = c` 有整数解 ⟺ `gcd(a, b) | c`（`c` 能被 gcd 整除）。

求解步骤：①算 `g = gcd(a, b)`；②若 `g ∤ c` 则无解；③否则用扩欧求 `ax + by = g` 的特解 `(x₀, y₀)`；④两边乘 `c/g` 得到 `ax + by = c` 的特解 `(x₀ × c/g, y₀ × c/g)`；⑤通解在此基础上参数化。

```js
function solveLinear(a, b, c) {
  const [g, x0, y0] = extgcd(a, b);
  if (c % g !== 0) return null;                    // 无整数解
  const k = c / g;
  return { x: x0 * k, y: y0 * k, g };              // 一组特解
}
```

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/gcd" target="_blank" rel="noopener noreferrer">GCD 可视化演示</a> —— 辗转相除的逐步归约过程
- <a href="https://algo.illegalscreed.cn/docs/ext-gcd" target="_blank" rel="noopener noreferrer">扩展欧几里得可视化演示</a> —— 扩欧回代求 (x, y) 的全过程

## 下一步

掌握了扩欧与逆元后，下一步看 GCD/LCM 在工程里的具体应用——分数化简、互质判断、不定方程可解性与中国剩余定理引入，见[应用：分数化简、逆元与方程](./applications)。
