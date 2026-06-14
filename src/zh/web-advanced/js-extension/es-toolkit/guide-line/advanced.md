---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **es-toolkit 1.47+**。把 es-toolkit 用进真实项目：从 lodash 迁移三步法、官方体积 / 性能基准（一手数字）、`es-toolkit/compat` 的深路径 / `get` / 链式、选型决策。

## 一、从 lodash 迁移：官方三步法

官方推荐**渐进式**迁移，而非一次性改写：

```ts
// 第 1 步：把 import 路径整体改成 es-toolkit/compat（行为 1:1，几乎零风险）
import { chunk, debounce, get, cloneDeep } from 'es-toolkit/compat';

// 第 2 步：随时间逐步清理调用点，去掉对 lodash 怪癖的依赖

// 第 3 步：把不依赖怪癖的调用切到主包，拿到最优体积与性能
import { chunk, debounce, cloneDeep } from 'es-toolkit';
```

| 步骤 | 动作 | 风险 |
|---|---|---|
| ① | `lodash`/`lodash-es` → `es-toolkit/compat` | 极低（compat 过 lodash 测试套件） |
| ② | 按模块清理 lodash 式写法 | 渐进可控 |
| ③ | 逐步切到主包 `es-toolkit` | 需核对签名差异 |

> 为什么不直接全切主包？主包签名更严格（不支持深路径、隐式转换等），大项目一次性切风险高。**先 compat 保功能，再逐步切主包**是最稳路径。

## 二、体积基准（官方一手数字）

官方 bundle-size 页用 **esbuild** 测量打包字节（es-toolkit@1.43.0 vs lodash-es@4.17.21）。选 **lodash-es**（ESM 版）对比是因为只有 ESM 能被摇树，这样比同口径且对 lodash 最有利：

| 函数 | es-toolkit | lodash-es | 缩减 |
|---|---:|---:|---:|
| `sample` | 94 B | 4,817 B | -98.0% |
| `difference` | 90 B | 7,958 B | -98.9% |
| `pick` | 132 B | 9,520 B | -98.6% |
| `zip` | 221 B | 3,961 B | -94.4% |
| `debounce` | 531 B | 2,873 B | -81.5% |
| `throttle` | 855 B | 3,111 B | -72.5% |
| `sum` | 93 B | 698 B | -86.7% |

> 官方总括：体积「最多小约 97%」，部分函数小至不足 100 字节。

## 三、性能基准（官方一手数字）

官方 performance 页在 **MacBook Pro 14"（M1 Max, 2021）** 上对比 es-toolkit vs lodash-es（数值为每段时间内执行次数，越高越快）：

| 函数 | es-toolkit | lodash-es | 提速 |
|---|---:|---:|---:|
| `omit` | 4,767,360 | 403,624 | **11.8×** |
| `pick` | 9,121,839 | 2,663,072 | 3.43× |
| `differenceWith` | 9,291,897 | 4,275,222 | 2.17× |
| `intersection` | 9,999,571 | 4,630,316 | 2.15× |
| `difference` | 10,436,101 | 5,155,631 | 2.02× |
| `unionBy` | 6,435,983 | 3,794,899 | 1.69× |
| `union` | 5,059,209 | 4,771,400 | 1.06× |
| `groupBy` | 5,000,235 | 5,206,286 | 0.96× |

::: tip 正确理解「平均约 2×」
「平均约 2×」是**总体概括**，不是每个函数都恰好快 2 倍：`omit` 约 11.8×，而 `union` 约 1.06×、`groupBy` 约 0.96×（接近持平甚至略低）。**性能敏感处应看具体函数基准，不要套用「一律 2×」。**
:::

## 四、es-toolkit/compat 的专属能力

主包为类型安全有意舍弃的 lodash 特性，都在 compat 里：

### 1. 深路径 pick / omit（点号 + 可变参数）

```ts
import { omit, pick } from 'es-toolkit/compat';

const obj = { a: 1, b: 2, c: 3, d: { e: 4, f: 5 } };
omit(obj, 'a', ['b', 'c'], 'd.f'); // { d: { e: 4 } }
pick(obj, ['a'], 'd.e');           // { a: 1, d: { e: 4 } }
```

### 2. get / set（字符串路径访问）—— compat 专属

```ts
import { get } from 'es-toolkit/compat';
get(obj, 'd.e', 'default'); // 4

// 主包无 get：现代写法用原生可选链
obj?.d?.e ?? 'default';     // 4（类型安全、零依赖）
```

### 3. 链式调用 —— compat 专属

```ts
import _ from 'es-toolkit/compat';
_([1, 2, 3, 4]).chunk(2).value(); // [[1, 2], [3, 4]]
```

> 主包**有意不提供链式**（链式不利摇树与类型推导），推荐用具名函数组合或原生数组方法替代。

### 4. lodash 风格的 debounce 选项

```ts
import { debounce } from 'es-toolkit/compat';
debounce(fn, 300, { leading: true, trailing: false, maxWait: 1000 }); // lodash 风格
```

## 五、compat 的代价

官方明确：compat「**slightly larger and slightly slower than es-toolkit**」——为 1:1 复刻 lodash 行为（隐式转换、多参数形态、边界处理）背负额外逻辑，所以**比主包略大、略慢，但仍比 lodash 本身更小更快**。这正是「先迁 compat、再切主包」的动机。

## 六、选型决策

```text
项目已大量用 lodash？
├─ 是 → 先全局换 es-toolkit/compat（零行为变化）→ 再按模块渐进切主包
└─ 否（新项目 / 无 lodash 包袱）→ 直接用主包 es-toolkit

需要 lodash 的深路径 get/set、隐式转换、链式？
├─ 是 → 用 es-toolkit/compat
└─ 否 → 用主包 es-toolkit（最小、最快、类型最好）
```

> 官方原话：「If your project does not already use Lodash, please use es-toolkit instead.」——compat 只为迁移而生。

---

进入 [指南 · 专家](./expert)：compat 兼容边界（哪些不支持）、`Mutex`/`Semaphore` 并发原语、`AbortSignal` 集成、ESM/CJS 双格式内部、从 compat 切主包的逐点核对清单。
