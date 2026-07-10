---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **es-toolkit 1.49.0**。把 es-toolkit 用进真实项目：从 lodash 迁移三步法、官方体积 / 性能基准（一手数字）、`es-toolkit/compat` 的深路径 / `get` 与兼容范围、选型决策。

## 速查

- **迁移顺序**：先盘点 wrapper 链与范围外函数，再把普通函数导入切到 compat，跑回归后逐模块切主包。
- **兼容口径**：compat 自 v1.39.3 起通过 Lodash 测试套件；方法链、跨 realm、修改内建原型与部分特化行为仍明确在范围外。
- **体积基准**：官方当前表仍是 es-toolkit 1.43.0 对 lodash-es 4.17.21，使用 esbuild 0.28.0；它不是 1.49.0 的本项目实测。
- **性能基准**：官方当前表是 es-toolkit 1.43.0 对 lodash 4.17.21，环境为 i5-13400F / Node 24.11.1 / win32 x64。
- **别平均化**：当前表中 `pick` 约 3.9×、`omit` 约 3.3×，但 `union` 约 0.7×、`groupBy` 约 0.9×；热点应单测。
- **深路径能力**：compat 提供 `get` / `set` 及 Lodash 风格 `pick` / `omit`；主包偏向键数组与类型安全签名。
- **链式边界**：compat 默认导出可调用且挂有静态方法，但调用本身只是返回原值，**不会创建 Lodash wrapper**。
- **选型原则**：新项目直接主包；存量项目用 compat 过渡，不能把主包的体积 / 性能数字直接套给 compat。

## 一、从 lodash 迁移：三阶段落地法

官方推荐**渐进式**迁移，而非一次性改写：

```ts
// 第 1 步：先确认没有 wrapper 链等范围外用法，再切兼容导入并跑测试
import { chunk, debounce, get, cloneDeep } from 'es-toolkit/compat';

// 第 2 步：随时间逐步清理调用点，去掉对 lodash 怪癖的依赖

// 第 3 步：把不依赖怪癖的调用切到主包，拿到最优体积与性能
import { chunk, debounce, cloneDeep } from 'es-toolkit';
```

| 步骤 | 动作 | 风险 |
|---|---|---|
| ① | 盘点 wrapper 链 / 范围外 API，再切 `es-toolkit/compat` | 较低，但必须跑现有测试 |
| ② | 按模块清理 lodash 式写法 | 渐进可控 |
| ③ | 逐步切到主包 `es-toolkit` | 需核对签名差异 |

> 为什么不直接全切主包？主包签名更严格（不支持深路径与 Lodash 的多形态签名），大项目一次性切风险高。**先用 compat 缩小改造面，再逐步切主包**通常更可控，但方法链等范围外代码要在第一步之前改写。

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

官方当前 performance 页的口径是 **13th Gen Intel Core i5-13400F / Node 24.11.1 / win32 x64**，对比 **es-toolkit 1.43.0 与 lodash 4.17.21**。数值为单位时间执行次数，越高越快：

| 函数 | es-toolkit | lodash | 提速 |
|---|---:|---:|---:|
| `omit` | 4,706,415 | 1,417,299 | **3.3×** |
| `pick` | 10,746,586 | 2,789,742 | **3.9×** |
| `differenceWith` | 18,522,078 | 5,651,942 | **3.3×** |
| `intersectionWith` | 16,926,995 | 4,958,866 | **3.4×** |
| `difference` | 12,202,488 | 6,828,896 | 1.8× |
| `intersection` | 11,263,848 | 5,819,145 | 1.9× |
| `unionBy` | 5,052,919 | 5,307,449 | 1.0× |
| `union` | 4,664,881 | 6,287,776 | **0.7×** |
| `groupBy` | 6,039,742 | 6,797,503 | **0.9×** |

::: tip 正确理解「平均约 2×」
「平均约 2×」是**总体概括**，不是每个函数都恰好快 2 倍：当前样本里 `pick` / `omit` 明显更快，`union` / `groupBy` 则低于 lodash。**性能敏感处应按目标运行时和真实数据复测，不要套用「一律 2×」。**
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

### 3. 默认导出不是 Lodash wrapper

```ts
import _ from 'es-toolkit/compat';

_.chunk([1, 2, 3, 4], 2); // ✅ 默认函数对象挂有 compat 静态方法
_([1, 2, 3, 4]);          // 只返回原数组，不会得到 .chunk().value() wrapper
```

> 官方把 `_(arr).map(...).filter(...)` 方法链明确列为 compat 范围外。本地 1.49.0 也没有导出 `chain` / `value` / `mixin`；迁移前应改成具名函数组合或原生数组方法。新代码仍建议具名导入，不依赖默认导出的可调用兼容外形。

### 4. lodash 风格的 debounce 选项

```ts
import { debounce } from 'es-toolkit/compat';
debounce(fn, 300, { leading: true, trailing: false, maxWait: 1000 }); // lodash 风格
```

## 五、compat 的代价

官方明确：compat「**slightly larger and slightly slower than es-toolkit**」——为复刻 Lodash 的多参数形态与边界处理背负额外逻辑，所以**比主包略大、略慢**。官方 bundle / performance 明细测的是主包，不能据此断言某个 compat 调用一定比 Lodash 更小或更快；迁移项目应看自己的构建报告与基准。

## 六、选型决策

```text
项目已大量用 lodash？
├─ 是 → 先盘点范围外 API，再换 es-toolkit/compat 并跑回归 → 按模块切主包
└─ 否（新项目 / 无 lodash 包袱）→ 直接用主包 es-toolkit

需要 Lodash 的深路径 get/set 或多形态签名？
├─ 是 → 用 es-toolkit/compat 过渡，并核对官方范围外清单
└─ 否 → 用主包 es-toolkit（包内体积 / 性能最优、类型更严格）
```

> 官方原话：「If your project does not already use Lodash, please use es-toolkit instead.」——compat 只为迁移而生。

---

进入 [指南 · 专家](./expert)：compat 兼容边界（哪些不支持）、`Mutex`/`Semaphore` 并发原语、`AbortSignal` 集成、ESM/CJS 双格式内部、从 compat 切主包的逐点核对清单。
