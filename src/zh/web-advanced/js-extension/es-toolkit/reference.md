---
layout: doc
outline: [2, 3]
---

# 参考

> es-toolkit 常用函数、子路径、compat 差异与关键数字速查。版本基线 **es-toolkit 1.49.0**。

## 速查

- **安装边界**：Node 18+ 用 `pnpm add es-toolkit`；Deno 从 JSR 安装 `@es-toolkit/es-toolkit`；包内置类型且零运行时依赖。
- **导出格式**：主入口与领域子路径都有 ESM / CJS 条件导出，`sideEffects: false`；优先具名导入。
- **主包定位**：严格现代签名；`pick` / `omit` 只收键数组，`memoize` 按单参数设计，debounce / throttle 用 `{ edges, signal }`。
- **compat 定位**：用于存量 Lodash 函数迁移，提供深路径与多形态签名；不支持 wrapper 方法链。
- **Promise API**：`timeout(ms, { signal? })`；`withTimeout(() => promise, ms, { signal? })`；`Mutex` / `Semaphore` 必须在 `finally` 释放。
- **兼容边界**：v1.39.3 起通过 Lodash 测试套件，但跨 realm、修改原型、部分隐式转换与特化函数仍在范围外。
- **基准口径**：bundle 表是 1.43.0 vs lodash-es 4.17.21；performance 表是 1.43.0 vs lodash 4.17.21，不能当作 1.49.0 项目实测。
- **官方入口**：[Usage](https://es-toolkit.dev/usage.html) ｜ [Compat](https://es-toolkit.dev/compat/intro.html) ｜ [Reference](https://es-toolkit.dev/intro.html)

## 一、安装与导入

| 场景 | 命令 / 写法 |
|---|---|
| Node（npm/pnpm/yarn/bun） | `npm install es-toolkit` / `pnpm add` / `yarn add` / `bun add` |
| Deno（JSR） | `deno add jsr:@es-toolkit/es-toolkit` |
| 具名导入（推荐） | `import { sum } from 'es-toolkit'` |
| 子路径导入 | `import { debounce } from 'es-toolkit/function'` |
| 兼容层（迁移用） | `import { get } from 'es-toolkit/compat'` |
| 浏览器 UMD（CDN） | 全局 `_`，如 `_.chunk(arr, 3)` |

> es-toolkit **自带 TS 类型**，无需 `@types`；**零运行时依赖**；ESM + CommonJS 双格式。

## 二、子路径一览

`array`、`function`、`math`、`object`、`predicate`、`promise`、`string`、`util`、`map`、`set`、`error`、`fp`、`server`、`compat`。

## 三、Array 常用函数

| 函数 | 作用 |
|---|---|
| `chunk(arr, size)` | 按 size 切成二维数组 |
| `uniq` / `uniqBy` / `uniqWith` | 去重（原值 / 按键 / 自定义） |
| `difference` / `intersection` / `union` | 差集 / 交集 / 并集（均有 `By`/`With` 变体） |
| `groupBy(arr, fn)` | 按键分组成 `{ 键: [元素...] }` |
| `keyBy(arr, fn)` | 按键索引，每键留一个（后者覆盖） |
| `partition(arr, pred)` | 分两组 `[满足[], 不满足[]]` |
| `sortBy` / `orderBy` | 排序（固定升序 / 可指定方向） |
| `zip` / `zipObject` / `unzip` | 配对 / 配成对象 / 解配对 |
| `sample` / `sampleSize` / `shuffle` | 随机取一个 / 取 n 个 / 打乱 |
| `take` / `drop` / `head` / `last` | 取头部 / 去头部 / 首元素 / 末元素 |

## 四、Object 常用函数

| 函数 | 作用 |
|---|---|
| `pick(obj, keys[])` | 挑选指定键（主包只收键数组） |
| `omit(obj, keys[])` | 剔除指定键 |
| `merge(target, src)` | 深合并，**原地修改 target** |
| `toMerged(target, src)` | 深合并，**返回新对象**（不可变安全） |
| `clone` / `cloneDeep` / `cloneDeepWith` | 浅拷贝 / 深拷贝 / 自定义深拷贝 |
| `mapValues` / `mapKeys` | 映射值 / 映射键 |
| `invert` | 键值互换 |
| `findKey` / `flattenObject` | 找键 / 扁平化嵌套对象 |

## 五、Function 常用函数

| 函数 | 作用 |
|---|---|
| `debounce(fn, ms, opts)` | 防抖（主包 `{ edges, signal }`；带 `cancel`/`flush`） |
| `throttle(fn, ms, opts)` | 节流（同上，`edges` 默认 `['leading','trailing']`） |
| `once(fn)` | 只执行一次并缓存结果 |
| `memoize(fn, opts)` | 单参数缓存（默认参数本身为键；对象按引用，可配 `getCacheKey`） |
| `curry` / `curryRight` / `partial` | 柯里化 / 偏应用 |
| `negate` / `identity` / `noop` | 取反 / 恒等 / 空函数 |
| `retry` | 失败重试 |

## 六、Predicate / Math / String / Promise 常用

| 分类 | 代表函数 |
|---|---|
| Predicate | `isString` `isNumber` `isNil` `isNotNil` `isPlainObject` `isEqual`/`isEqualWith` `isPromise` `isDate` `isFunction`（多数是类型守卫） |
| Math | `sum` `sumBy` `mean` `median` `clamp` `round` `random` `range` `inRange` |
| String | `camelCase` `snakeCase` `kebabCase` `pascalCase` `capitalize` `trim` `words` `escape` |
| Promise | `delay(ms)` `timeout(ms)` `withTimeout(() => promise, ms)` `Mutex` `Semaphore` `TimeoutError` |
| Util | `attempt(fn)` `await attemptAsync(asyncFn)` `invariant(cond, msg)` |

## 七、主包 vs es-toolkit/compat

| 维度 | 主包 `es-toolkit` | `es-toolkit/compat` |
|---|---|---|
| 定位 | 现代核心集 | Lodash 渐进迁移兼容层 |
| `pick`/`omit` | 仅键数组 | 可变参数 + 点号深路径 |
| `get`/`set` | 无（用可选链替代） | 有 |
| 链式 `_(x).f().value()` | 无 | **无（官方范围外）** |
| `debounce` 选项 | `edges` + `signal` | `leading`/`trailing`/`maxWait` |
| 隐式类型转换 | 无（严格） | 不应依赖；部分被官方列为范围外 |
| 体积 / 速度 | 包内最小 / 最快 | 比主包略大 / 略慢；需项目实测 |
| 适用 | 新项目、追求最优 | 迁移既有 lodash 代码 |
| 兼容里程碑 | — | 100% 兼容 since v1.39.3 |
| 明确范围外 | — | wrapper 链、跨 realm、修改原型；另无 `sortedUniq` `sortedUniqBy` `mixin` `noConflict` `runInContext` |

## 八、关键数字（官方）

| 指标 | 数字 | 来源 / 口径 |
|---|---|---|
| 体积缩减 | 最多约 **97%** | esbuild 测打包字节，es-toolkit@1.43.0 vs lodash-es@4.17.21 |
| 单函数极小 | `difference` 90B / `sample` 94B / `pick` 132B | 同上 |
| 运行时提速 | 官方总括平均约 **2×**；当前表 `pick` 3.9×、`omit` 3.3×、`union` 0.7× | i5-13400F / Node 24.11.1，es-toolkit@1.43.0 vs lodash@4.17.21 |
| 测试覆盖 | **100%** | 官方 |
| 运行环境 | Node 18+ / Deno / Bun / 浏览器 | 官方 |
| 依赖 | **零运行时依赖** | package.json |

## 九、迁移三步法（速记）

```text
1. 先盘点 wrapper 链、范围外函数与隐式转换依赖
2. 普通函数导入切到 'es-toolkit/compat'，运行回归与 bundle 检查
3. 不依赖怪癖的调用切到主包 'es-toolkit'（拿最优体积/性能）
```

---

命令查完，进 [指南 · 基础](./guide-line/base) 理解函数族，或 [指南 · 进阶](./guide-line/advanced) 看迁移与基准。
