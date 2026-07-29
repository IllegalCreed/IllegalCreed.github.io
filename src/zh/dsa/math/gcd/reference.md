---
layout: doc
outline: [2, 3]
---

# 参考：GCD/LCM API、扩欧与应用速查

> 基于通用数论概念 · 核于 2026-07

## 速查

- **gcd**：`gcd(a, b) = gcd(b, a mod b)`，`gcd(a, 0) = |a|`，结果非负；迭代 `while(b) [a,b]=[b,a%b]`。
- **lcm**：`lcm(a, b) = a / gcd(a, b) × b`（先除后乘防溢出）。
- **复杂度**：辗转相除 / 扩欧 O(log min(a, b))；费马小定理求逆元 O(log m)。
- **贝祖定理**：`ax + by = gcd(a, b)` 一定有整数解 `(x, y)`。
- **扩欧递推**：`b==0` 返回 `(g, 1, 0)`；回代 `x = y'`、`y = x' - q×y'`（`q = a div b`）。
- **乘法逆元**：`a⁻¹ mod m` 存在 ⟺ `gcd(a, m) == 1`；扩欧（通用）或费马小定理 `a^(m-2)`（m 质数）。
- **不定方程**：`ax + by = c` 有解 ⟺ `gcd(a, b) | c`。
- **应用清单**：分数化简（除 gcd）、互质判断（gcd==1）、逆元（扩欧）、组合数取模、CRT 合并。
- **易错点**：负数取绝对值、lcm 先除后乘、逆元判 gcd 前提、不定方程忘判 gcd|c。
- **交互演示**：[GCD 可视化](https://algo.illegalscreed.cn/docs/gcd)、[扩欧可视化](https://algo.illegalscreed.cn/docs/ext-gcd)。

## 一、复杂度表

| 操作 | 时间复杂度 | 说明 |
| --- | --- | --- |
| `gcd(a, b)` 辗转相除 | **O(log min(a, b))** | 每两步至少折半；拉梅定理 |
| `lcm(a, b)` | O(log min(a, b)) | 先求 gcd 再一行算 |
| 扩欧 `extgcd(a, b)` | **O(log min(a, b))** | 与 gcd 同阶，回代 O(1) 每层 |
| 乘法逆元（扩欧） | O(log m) | `gcd(a, m)==1` 前提 |
| 乘法逆元（费马小定理） | O(log m) | 要求 m 为质数 |
| 多元素 gcd（k 个数） | O(k log) | `reduce` 逐个归约 |
| 组合数取模预处理 | O(n) | 阶乘 + 阶乘逆元 |

## 二、GCD/LCM 代码模板

```js
// 递归 gcd
function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  return b === 0 ? a : gcd(b, a % b);
}
// 迭代 gcd（工程首选）
function gcdIter(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b !== 0) { [a, b] = [b, a % b]; }
  return a;
}
// lcm（先除后乘防溢出）
function lcm(a, b) {
  const g = gcd(a, b);
  return Math.abs(a / g) * Math.abs(b);
}
// 多元素 gcd / lcm
const gcdAll = (...xs) => xs.reduce((g, x) => gcd(g, x), 0);
const lcmAll = (...xs) => xs.reduce((L, x) => lcm(L, x), 1);
// gcdAll(12, 18, 24) → 6；lcmAll(4, 6, 8) → 24
```

## 三、扩展欧几里得代码模板

```js
// 返回 [g, x, y]，满足 a*x + b*y = g = gcd(a,b)
function extgcd(a, b) {
  if (b === 0) return [Math.abs(a), a >= 0 ? 1 : -1, 0];
  const [g, x1, y1] = extgcd(b, a % b);
  const x = y1;
  const y = x1 - Math.floor(a / b) * y1;
  return [g, x, y];
}
// extgcd(18, 12) → [6, 1, -1]；验证 18*1 + 12*(-1) = 6 ✓
```

### 求乘法逆元

```js
// 通用：扩展欧几里得（不要求 m 质数）
function modInverse(a, m) {
  const [g, x] = extgcd(a, m);
  if (g !== 1) return null;                 // gcd≠1，逆元不存在
  return ((x % m) + m) % m;                  // 规范到 [0, m)
}
// m 为质数时：费马小定理 + 快速幂
function modInverseFermat(a, p) {
  return Number(modPow(BigInt(a), BigInt(p - 2), BigInt(p)));
}
function modPow(base, exp, mod) {
  let res = 1n; base %= mod;
  while (exp > 0n) {
    if (exp & 1n) res = res * base % mod;
    base = base * base % mod;
    exp >>= 1n;
  }
  return res;
}
```

### 解线性不定方程 ax + by = c

```js
function solveLinear(a, b, c) {
  const [g, x0, y0] = extgcd(a, b);
  if (c % g !== 0) return null;              // gcd ∤ c，无整数解
  const k = c / g;
  return { x: x0 * k, y: y0 * k, g };        // 特解；通解 x+t*b/g, y-t*a/g
}
```

## 四、应用清单

| 应用 | 用到的工具 | 一句话 |
| --- | --- | --- |
| 分数化简 | gcd | 分子分母同除 gcd 得既约分数 |
| 互质判断 | gcd | `gcd(a, b) == 1` 即互质 |
| 乘法逆元 | 扩欧 / 费马小定理 | `gcd(a, m)==1` 时存在 |
| 模意义除法 | 逆元 | `a/b ≡ a × b⁻¹ (mod m)` |
| 组合数取模 | 阶乘 + 逆元 | `C(n,k) = n! × (k!·(n-k)!)⁻¹` |
| 不定方程 | 扩欧 + gcd 整除 | `ax+by=c` 有解 ⟺ gcd\|c |
| 中国剩余定理 | 扩欧合并 | 两两互质模的同余方程组 |
| RSA 密钥 | gcd + 扩欧 | 选 e 与 φ(n) 互质，d = e⁻¹ |

## 五、易错点清单

- **负数未取绝对值**：`gcd` 结果必须非负，`gcd(a, b) = gcd(|a|, |b|)`；否则结果可能为负。
- **lcm 直接 a×b/gcd 溢出**：中间 `a×b` 可能爆 32/64 位；写成 `a/g × b`（先除后乘），`a/g` 必整除。
- **gcd(0, 0) 未定义**：约定为 0，但题目几乎不考；`gcd(a, 0) = |a|`。
- **逆元忘判 gcd 前提**：`gcd(a, m) ≠ 1` 时逆元不存在，扩欧返回的 `g` 要检查是否为 1。
- **费马小定理用错场景**：要求 m 是**质数**；m 非质数时只能用扩欧。
- **逆元结果未规范化**：扩欧求出的 `x` 可能为负，要 `((x % m) + m) % m` 落到 `[0, m)`。
- **不定方程忘判 gcd|c**：直接套扩欧而不判 `gcd(a,b) | c`，会得到「假解」。
- **扩欧解当唯一**：`(x, y)` 是一组特解，通解要加 `k × (b/g)` 参数化。
- **大整数用 JS Number 丢精度**：模 1e9+7 以上的运算要用 BigInt；快速幂里 `>>=1` 也要 BigInt。
- **多元素 gcd/lcm 初值错**：gcd 初值 0（`gcd(0, x) = x`）；lcm 初值 1（`lcm(1, x) = x`）。
- **迭代法交换元组顺序错**：`[a, b] = [b, a % b]` 必须同时算（用元组解构），不能分两步。
- **模运算减法出负**：`(a - b) % m` 可能为负，写成 `((a - b) % m + m) % m`。

## 六、进阶方向（链接其他叶）

- **模算术与快速幂**：逆元与组合数取模的基础 —— 见（待建）数论·模算术叶
- **欧拉函数与欧拉定理**：费马小定理的推广 `a^φ(m) ≡ 1 (mod m)` —— 见（待建）数论·欧拉函数叶
- **中国剩余定理**：扩欧合并同余方程组 —— 见（待建）数论·CRT 叶
- **素数筛法**：埃氏筛 / 欧拉筛 —— 见（待建）数论·素数叶
- **组合数学取模**：阶乘逆元、卢卡斯定理 —— 见（待建）数论·组合取模叶

## 权威链接

- [辗转相除法 - 维基百科](https://zh.wikipedia.org/wiki/%E8%BE%97%E8%BD%AC%E7%9B%B8%E9%99%A4%E6%B3%95)
- [扩展欧几里得算法 - 维基百科](https://zh.wikipedia.org/wiki/%E6%89%A9%E5%B1%95%E6%AC%A7%E5%87%A0%E9%87%8C%E5%BE%97%E7%AE%97%E6%B3%95)
- [贝祖等式 - 维基百科](https://zh.wikipedia.org/wiki/%E8%B2%9D%E7%A5%96%E7%AD%89%E5%BC%8F)
- [Euclidean Algorithm - CP-Algorithms](https://cp-algorithms.com/algebra/euclid-algorithm.html)
- [Extended Euclid Algorithm - CP-Algorithms](https://cp-algorithms.com/algebra/extended-euclid-algorithm.html)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/gcd" target="_blank" rel="noopener noreferrer">GCD 可视化演示</a>、<a href="https://algo.illegalscreed.cn/docs/ext-gcd" target="_blank" rel="noopener noreferrer">扩展欧几里得可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/gcd-slide/" target="_blank">GCD 与扩展欧几里得</a>
