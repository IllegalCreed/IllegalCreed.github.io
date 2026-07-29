---
layout: doc
---

# GCD 与扩展欧几里得

GCD（**Greatest Common Divisor**，最大公约数）是数论里最基础、最高频的工具——给定两个整数 `a`、`b`，它们的公约数中最大的那一个记作 `gcd(a, b)`。求它的**辗转相除法**（欧几里得算法）基于一个优雅的递推 `gcd(a, b) = gcd(b, a mod b)`，把问题在 O(log min(a, b)) 步内归约到 `gcd(x, 0) = x`。围绕它还衍生出三个紧密相关的主题：①**最小公倍数 LCM** 由 `lcm(a, b) = a × b / gcd(a, b)` 一行搞定；②**贝祖定理**（Bézout's identity）断言 `ax + by = gcd(a, b)` 一定有整数解 `(x, y)`；③**扩展欧几里得算法**在求 gcd 的同时把这组解 `(x, y)` 递归回代求出。

这「四件套」（GCD / LCM / 贝祖 / 扩欧）是数论算法的地基：**分数化简**（除以 gcd）、**互质判断**（gcd == 1）、**乘法逆元**（扩欧或费马小定理求 `a⁻¹ mod m`）、**线性不定方程** `ax + by = c` 的可解性判定（`gcd(a, b) | c`）、乃至**中国剩余定理**（CRT）都以它为前置。掌握了辗转相除的 O(log) 复杂度来源与扩欧的回代原理，后续模算术、组合取模、RSA 公钥密码都有了根基。

## 评价

**优点**

- **极其高效**：辗转相除法 O(log min(a, b))，即便对 64 位大整数也只需几十步——这是它两千多年来仍是主流算法的原因
- **理论与工程兼顾**：既能纯数学地证明贝祖定理，又能落地成几行的递归代码，是「优雅」的典范
- **可扩展**：同一条递归链路同时产出 gcd 与 `(x, y)` 解，零额外成本得到乘法逆元
- **应用面广**：分数化简、互质、逆元、不定方程、CRT、模意义下的除法转换都依赖它

**缺点**

- **仅适用于整数**：对实数、浮点无定义，且要先处理负号（结果取绝对值）
- **乘法逆元有前提**：`a⁻¹ mod m` 存在当且仅当 `gcd(a, m) == 1`，不满足时无解
- **中间结果易溢出**：`lcm = a × b / gcd` 要先除后乘，或用 `a / gcd × b` 避免乘法溢出
- **回代解不唯一**：扩欧求出的 `(x, y)` 是一组特解，通解要再做参数化

## 本叶地图

- [入门](./getting-started) —— GCD/LCM 定义、辗转相除递推、O(log) 复杂度来源、贝祖定理、扩欧直觉
- [辗转相除与扩展欧几里得](./guide-line/euclidean) —— 递归+迭代辗转相除、扩欧回代求 (x,y)、乘法逆元
- [应用：分数化简、逆元与方程](./guide-line/applications) —— 分数化简、互质判断、线性不定方程可解性、逆元、CRT 引入
- [参考](./reference) —— GCD/LCM/扩欧代码模板、复杂度表、应用清单、易错点

## 交互演示

- <a href="https://algo.illegalscreed.cn/docs/gcd" target="_blank" rel="noopener noreferrer">GCD 可视化演示</a> —— 辗转相除的逐步归约过程
- <a href="https://algo.illegalscreed.cn/docs/ext-gcd" target="_blank" rel="noopener noreferrer">扩展欧几里得可视化演示</a> —— 扩欧回代求 (x, y) 的全过程

## 幻灯片地址

<a href="/SlideStack/gcd-slide/" target="_blank">GCD 与扩展欧几里得</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=GCD%20%E4%B8%8E%E6%89%A9%E5%B1%95%E6%AC%A7%E5%87%A0%E9%87%8C%E5%BE%97" target="_blank" rel="noopener noreferrer">GCD 与扩展欧几里得测试题</a>
