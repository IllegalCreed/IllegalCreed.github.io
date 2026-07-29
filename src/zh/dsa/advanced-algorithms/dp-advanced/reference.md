---
layout: doc
outline: [2, 3]
---

# 参考：进阶 DP API、模型与识别速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **树形 DP**：状态挂节点 `f[u]`，后序 DFS 从叶到根合并；`fa` 防回父；复杂度 O(n)。
- **树的最大独立集**：`f[u][1]=w[u]+Σf[v][0]`，`f[u][0]=Σmax(f[v][0],f[v][1])`。
- **树的直径**：维护每点最长下行链 + 次长下行链，直径候选 = 两者之和；全局取 max。
- **数位 DP**：逐位 DP + 记忆化，标志 `(pos, limit, ...)`；`limit` 决定本位上界；`limit=true` 沿上界几乎不复用。
- **数位 DP 前缀和**：`count(L,R)=count(R)-count(L-1)`，把区间问题转两个前缀计数。
- **换根 DP**：两遍 DFS——第一遍求 `down[u]`，第二遍用父答案扣除子贡献求 `up[u]`；`ans[u]=down[u]+up[u]`。
- **换根扣除贡献**：父答案减去「u 子树对父的贡献」再传给 u，防重复计算。
- **状压 DP**：位掩码 `mask` 当集合维度；`f[mask][i]`；`mask|(1<<i)` 加入、`mask&(1<<i)` 测试、`mask^(1<<i)` 删除。
- **状压枚举子集**：`for(sub=mask; sub; sub=(sub-1)&mask)`。
- **TSP**：`f[mask][i]`=已访问 `mask`、当前在 `i` 的最短路；`O(2ⁿ·n²)`，n≤20 可行。
- **单调队列优化**：转移是定长滑动区间最值 → 区间查询 O(n) 降 O(1)。
- **斜率优化**：转移写成 `g(j)+h(i)·k(j)` 线性式 → 凸包 + 斜率单调。
- **矩阵快速幂**：线性递推写成矩阵乘法 → O(k³log n) 求第 n 项。
- **模型识别口诀**：树形→树；数位计数→数位；每个根答案→换根；集合小→状压。

## 一、四类进阶 DP 模型对照表

| 模型 | 状态载体 | 计算顺序 | 核心标志 | 典型应用 | 复杂度 |
| --- | --- | --- | --- | --- | --- |
| **树形 DP** | 节点 `f[u]` | 后序 DFS（叶→根） | `fa` 防回父 | 独立集、直径、最长链 | O(n) |
| **数位 DP** | 数位 `f(pos,...)` | 高位→低位 + 记忆化 | `limit` 上界 | 区间内满足数位条件的计数 | O(log R × 状态) |
| **换根 DP** | 节点 `down/up` | 两遍 DFS | 扣除子贡献 | 每个根的子树大小和/最大深度 | O(n) |
| **状压 DP** | 集合 `f[mask][i]` | mask 升序 | 位掩码 | TSP、连通性、哈密顿路 | O(2ⁿ·n²) |

## 二、树形 DP 代码模板（最大独立集）

```js
// f[u][0]=子树最优且 u 不选；f[u][1]=子树最优且 u 选
const f = Array.from({ length: n }, () => [0, 0]);
function dfs(u, fa) {
  f[u][1] = w[u];
  for (const v of adj[u]) {
    if (v === fa) continue;
    dfs(v, u);                              // 后序：先算子
    f[u][0] += Math.max(f[v][0], f[v][1]);  // 不选 u：子可选可不选
    f[u][1] += f[v][0];                     // 选 u：子必不选
  }
}
dfs(0, -1);
const ans = Math.max(f[0][0], f[0][1]);
```

## 三、树形 DP 代码模板（树的直径）

```js
let diameter = 0;
const d = new Array(n).fill(0);           // d[u]=u 向下最长链
function dfs(u, fa) {
  let max1 = 0, max2 = 0;                 // 最长链、次长链
  for (const [v, w] of adj[u]) {
    if (v === fa) continue;
    dfs(v, u);
    const len = d[v] + w;
    if (len > max1) { max2 = max1; max1 = len; }
    else if (len > max2) max2 = len;
  }
  d[u] = max1;
  diameter = Math.max(diameter, max1 + max2);
}
dfs(0, -1);
```

## 四、数位 DP 代码模板（不含 62 的数）

```js
function count(R) {
  const s = String(R).split('').map(Number);
  const memo = new Map();
  function dfs(pos, prev, limit) {
    if (pos === s.length) return 1;            // 填完即一个合法数
    const key = `${pos},${prev},${limit}`;
    if (memo.has(key)) return memo.get(key);
    const up = limit ? s[pos] : 9;             // 本位上界
    let ans = 0;
    for (let dgt = 0; dgt <= up; dgt++) {
      if (prev === 6 && dgt === 2) continue;   // 排除 62
      ans += dfs(pos + 1, dgt, limit && dgt === up);
    }
    memo.set(key, ans);
    return ans;
  }
  return dfs(0, -1, true);
}
// 区间 [L, R] = count(R) - count(L - 1)
```

## 五、换根 DP 代码模板（每个根的距离之和）

```js
function dfs1(u, fa) {                        // 求 size 和 down
  size[u] = 1;
  for (const [v, w] of adj[u]) {
    if (v === fa) continue;
    dfs1(v, u);
    size[u] += size[v];
    down[u] += down[v] + size[v] * w;
  }
}
function dfs2(u, fa) {                        // 换根求 ans
  for (const [v, w] of adj[u]) {
    if (v === fa) continue;
    ans[v] = ans[u] - size[v] * w + (n - size[v]) * w;
    dfs2(v, u);
  }
}
dfs1(0, -1);
ans[0] = down[0];
dfs2(0, -1);
```

## 六、状压 DP 代码模板（TSP）

```js
const INF = Infinity;
const f = Array.from({ length: 1 << n }, () => new Array(n).fill(INF));
f[1 << 0][0] = 0;                            // 从城市 0 出发
for (let mask = 1; mask < (1 << n); mask++) {
  for (let i = 0; i < n; i++) {
    if (!(mask & (1 << i)) || f[mask][i] === INF) continue;
    for (let j = 0; j < n; j++) {
      if (mask & (1 << j)) continue;          // j 已访问跳过
      const nm = mask | (1 << j);
      f[nm][j] = Math.min(f[nm][j], f[mask][i] + dist[i][j]);
    }
  }
}
// 最短回路 = min over i of f[(1<<n)-1][i] + dist[i][0]
```

## 七、DP 模型识别决策树

```
题目是树上问题吗？
├─ 是 → 求每个节点为根的答案吗？
│       ├─ 是 → 换根 DP（两遍 DFS）
│       └─ 否 → 树形 DP（后序 DFS，f[u]）
└─ 否 → 涉及「区间 [L,R] 内满足数位条件」吗？
        ├─ 是 → 数位 DP（逐位 + limit + 记忆化）
        └─ 否 → 涉及「集合 / 连通性」，且 n ≤ 20 吗？
                ├─ 是 → 状压 DP（位掩码 mask）
                └─ 否 → 回到线性/区间/背包 DP（见基础篇）
```

## 八、易错点清单

- **树形 DP 忘传 `fa`**：遍历邻接表时若不跳过父，会无限递归——必须 `if (v === fa) continue`。
- **树形 DP 状态设计漏维度**：独立集问题若只有单值 `f[u]` 而不带「选/不选」第二维，无法表达父子约束——`f[u][0/1]` 是标配。
- **树的直径只记最长链**：直径是「最长链 + 次长链」（两条不同子树的链），只记一条最长链会漏掉穿过根的路径。
- **数位 DP 忘 `limit` 标志**：不传 `limit` 会把上界 R 之上的数也算进来，答案偏大。
- **数位 DP `limit` 传递写错**：应是 `limit && d === up`（本位也顶到上界时下一位才继续受限），写成 `limit` 或 `d === up` 都错。
- **数位 DP 忘前导零**：若题意关心数的实际位数（如「不含前导零」），需加 `lead` 标志，否则前导零会被当真实位处理。
- **数位 DP 区间忘做差**：`count(L,R)` 必须用 `count(R)-count(L-1)`，直接对区间两端各跑会重复。
- **换根 DP 忘扣除子贡献**：把父的完整答案直接给子，会重复计算子的贡献——必须「父答案减去子这棵树的贡献」。
- **换根 DP 顺序反了**：必须先 `dfs1` 求 down（自底向上），再 `dfs2` 换根（自顶向下）；顺序反了 down 还没求好。
- **状压 DP 起点初始化漏**：TSP 必须 `f[1<<start][start]=0`，否则全 INF。
- **状压 DP 枚举顺序**：`mask` 必须升序枚举（小集合推大集合），且只从「i 在 mask 中」的有效状态转移。
- **状压 DP `n` 过大**：`2ⁿ` 随 n 指数增长，n > 20 基本不可用（2²⁰·20² ≈ 4 亿）。
- **状压位运算优先级**：`mask & (1<<i)` 要加括号，`&` 优先级低于 `<<` 和比较运算符。

## 权威链接

- [树形 DP - OI Wiki](https://oi-wiki.org/dp/tree/)
- [数位 DP - OI Wiki](https://oi-wiki.org/dp/number/)
- [换根 DP - OI Wiki](https://oi-wiki.org/dp/tree/#%E6%8F%9B%E6%A0%B9-dp)
- [状态压缩 DP - OI Wiki](https://oi-wiki.org/dp/state/)
- [DP 优化 - OI Wiki](https://oi-wiki.org/dp/opt/)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/tree-dp" target="_blank" rel="noopener noreferrer">树形 DP 可视化演示</a> · <a href="https://algo.illegalscreed.cn/docs/digit-dp" target="_blank" rel="noopener noreferrer">数位 DP 可视化演示</a> · <a href="https://algo.illegalscreed.cn/docs/reroot-dp" target="_blank" rel="noopener noreferrer">换根 DP 可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/dp-advanced-slide/" target="_blank">进阶动态规划</a>
