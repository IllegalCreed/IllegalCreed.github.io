---
layout: doc
outline: [2, 3]
---

# 参考：Manacher / Z 函数 API 与复杂度速查

> 基于通用算法概念 · 核于 2026-07

## 速查

- **回文**：子串 `s[l..r]` 满足 `s[i] === s[l+r-i]`；分奇长度（中心一字符）与偶长度（中心两字符间）。
- **最长回文子串**：朴素 O(n²) 中心扩展（`2n-1` 个中心，每个 O(n)）；**Manacher O(n)**。
- **Manacher 预处理**：插 `#` + 首尾哨兵 `^$`，统一奇偶；预处理后所有回文以「一个位置」为中心。
- **p 数组**：`p[i]` = 预处理后以 `i` 为中心的最长回文半径（含中心）；**原串最长回文子串长度 = max(p) - 1**。
- **Manacher 借初值**：`i < R` 时 `p[i] = min(p[2C-i], R-i)`，否则 `1`；`while (t[i+p[i]]===t[i-p[i]]) p[i]++`；`i+p[i]-1>R` 则更新 `C=i, R=i+p[i]-1`。
- **Z 函数**：`z[i] = s` 与 `s[i:]` 的最长公共前缀长度；`z[0]` 约定 `0`。
- **Z-box 借初值**：`i < r` 时 `z[i] = min(z[i-l], r-i)`，否则 `0`；`while (s[z[i]]===s[i+z[i]]) z[i]++`；`i+z[i]>r` 则 `l=i, r=i+z[i]`。
- **O(n) 共性**：Manacher 维护最右回文右端 `R`，Z 函数维护 Z-box 右端 `r`，都单调右移、总推进 ≤ n，扩展比较 ≤ 2n。
- **匹配应用**：`pat + '#' + txt` 求 Z，`z[i]==|pat|` 处匹配；O(n+m)。
- **周期应用**：最小 `p` 使 `z[p]==n-p`（加 `n%p==0` 则完全周期）；`z[i]==n-i` 即 border。
- **易错**：预处理忘哨兵越界；`min` 的 `R-i`/`r-i` 余量漏写；`z[0]` 约定不统一；匹配分隔符在字符集内冲突。

## 一、复杂度速查表

| 算法 | 问题 | 预处理 | 单次求解 | 总复杂度 | 空间 |
| --- | --- | --- | --- | --- | --- |
| 朴素中心扩展 | 最长回文子串 | 无 | O(n²) | O(n²) | O(1) |
| **Manacher** | 最长回文子串 | 插 `#` O(n) | — | **O(n)** | O(n) |
| 朴素 LCP | 构造 Z 数组 | 无 | O(n²) | O(n²) | O(1) |
| **Z 函数** | 构造 Z 数组 | 无 | — | **O(n)** | O(n) |
| Z 函数匹配 | 模式匹配 | 拼接 O(n+m) | — | **O(n+m)** | O(n+m) |
| KMP | 模式匹配 | `next` O(m) | 扫 O(n) | O(n+m) | O(m) |

## 二、Manacher 完整代码（p 数组）

```js
function manacher(s) {
  const t = ['^', '#'];
  for (const ch of s) { t.push(ch); t.push('#'); }
  t.push('$');                      // 预处理：# + 首尾哨兵
  const m = t.length, p = new Array(m).fill(0);
  let C = 0, R = 0;
  for (let i = 1; i < m - 1; i++) {
    p[i] = i < R ? Math.min(p[2 * C - i], R - i) : 1; // 借镜像初值
    while (t[i + p[i]] === t[i - p[i]]) p[i]++;        // 扩展
    if (i + p[i] - 1 > R) { C = i; R = i + p[i] - 1; } // 更新最右
  }
  let maxLen = 0, center = 0;
  for (let i = 1; i < m - 1; i++)
    if (p[i] > maxLen) { maxLen = p[i]; center = i; }
  const start = (center - maxLen) / 2;  // 还原原串下标
  return { len: maxLen - 1, start, str: s.slice(start, start + maxLen - 1) };
}
```

## 三、Z 函数完整代码

```js
function zFunction(s) {
  const n = s.length, z = new Array(n).fill(0);
  let l = 0, r = 0;                        // Z-box [l, r)
  for (let i = 1; i < n; i++) {
    if (i < r) z[i] = Math.min(z[i - l], r - i); // 借镜像初值
    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) z[i]++; // 扩展
    if (i + z[i] > r) { l = i; r = i + z[i]; }   // 更新 Z-box
  }
  return z;                                // z[0] = 0
}
```

## 四、应用清单

| 应用 | 用法 | 关键判定 |
| --- | --- | --- |
| 最长回文子串 | Manacher 求 `max(p)` | 长度 = `max(p) - 1` |
| 回文计数 | Manacher 的 `p[i]` | 以 `i` 为中心的回文数 = `p[i] / 2`（向下取整，预处理后） |
| 字符串匹配 | `pat + '#' + txt` 求 Z | `z[i] === |pat|` 处匹配 |
| 最小周期 | Z 函数找最小 `p` | `z[p] === n - p`（完全周期加 `n % p === 0`） |
| 后缀与前缀（border） | Z 函数 | `z[i] === n - i` |
| 重复子串判定 | Z 函数 | 存在 `p` 使 `z[p] === n - p` 且 `n % p === 0` |

## 五、易错点清单

- **预处理忘首尾哨兵 `^$`**：`while (t[i+p[i]]===t[i-p[i]])` 会越界——哨兵保证两端比较必失败而停止。
- **分隔符与字符集冲突**：Manacher 的 `#`、匹配的 `#` 必须不在原字符集内，否则会「假匹配」。
- **`min(p[2C-i], R-i)` 漏 `R-i`**：超过 `R` 的部分不保证对称，必须用余量封顶，否则误判回文半径。
- **`min(z[i-l], r-i)` 漏 `r-i`**：同理，超过 Z-box 的部分要老老实实扩展。
- **`z[0]` 约定不统一**：本站按 `0`；若按 `n` 则循环里要跳过 `i=0` 或特判，跨题库注意。
- **还原原串长度忘 `-1`**：`max(p) - 1` 才是原串最长回文长度，`max(p)` 是预处理后半径。
- **还原原串起始下标错**：`(center - maxLen) / 2`，是 `center - maxLen`（左端）再除 2，不是 `center / 2`。
- **Z-box 更新条件写反**：是 `i + z[i] > r`（严格更右才更新），写成 `>=` 会让 `l` 不必要地变动（不影响正确性但浪费）。
- **匹配应用忘 `#` 分隔**：直接 `pat + txt` 会让模式跨边界匹配，必须加分隔符。
- **周期判定把「弱周期」当「完全周期」**：`z[p] === n - p` 只是弱周期（如 `abcab` 对 `p=3`），完全周期还要 `n % p === 0`。
- **空串 / 单字符边界**：`n === 0` 时 Z 数组为空；`n === 1` 时 Manacher `maxLen = 1`（单字符自身回文）。

## 六、Manacher 与 Z 函数对照

| 维度 | Manacher | Z 函数 |
| --- | --- | --- |
| 解决问题 | 最长回文子串 | 前缀匹配 / 周期 / border |
| 数组含义 | `p[i]` 回文半径（含中心） | `z[i]` 与后缀的 LCP |
| 预处理 | 插 `#` + 哨兵 | 无（匹配应用拼接 `pat#txt`） |
| 加速结构 | 最右回文 `[L,R]`，借 `p[2C-i]` | Z-box `[l,r)`，借 `z[i-l]` |
| 借初值公式 | `min(p[2C-i], R-i)` | `min(z[i-l], r-i)` |
| 单调右端点 | `R`（回文右端） | `r`（Z-box 右端） |
| 复杂度 | O(n) | O(n) |

两者共享「单调右端点 + 镜像借用 + 摊还」的线性算法模板，理解一个就能类比另一个。

## 权威链接

- [Manacher's algorithm - cp-algorithms](https://cp-algorithms.com/string/manacher.html)
- [Z-function - cp-algorithms](https://cp-algorithms.com/string/z-function.html)
- [最长回文子串 - LeetCode 5](https://leetcode.cn/problems/longest-palindromic-substring/)
- 交互演示：<a href="https://algo.illegalscreed.cn/docs/manacher" target="_blank" rel="noopener noreferrer">Manacher 可视化演示</a>、<a href="https://algo.illegalscreed.cn/docs/z-function" target="_blank" rel="noopener noreferrer">Z 函数可视化演示</a>
- 本站幻灯片：<a href="/SlideStack/palindrome-z-function-slide/" target="_blank">回文与 Z 函数</a>
