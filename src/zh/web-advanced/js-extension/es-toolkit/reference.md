---
layout: doc
outline: [2, 3]
---

# 参考

> es-toolkit 常用函数、子路径、compat 差异与关键数字速查。版本基线 **es-toolkit 1.47+**（当前最新 1.47.1）。

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

`array`、`function`、`math`、`object`、`predicate`、`promise`、`string`、`util`、`map`、`set`、`error`、`compat`。

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
| `memoize(fn, opts)` | 按参数缓存（默认首参为键，可 `getCacheKey`） |
| `curry` / `curryRight` / `partial` | 柯里化 / 偏应用 |
| `negate` / `identity` / `noop` | 取反 / 恒等 / 空函数 |
| `retry` | 失败重试 |

## 六、Predicate / Math / String / Promise 常用

| 分类 | 代表函数 |
|---|---|
| Predicate | `isString` `isNumber` `isNil` `isNotNil` `isPlainObject` `isEqual`/`isEqualWith` `isPromise` `isDate` `isFunction`（多数是类型守卫） |
| Math | `sum` `sumBy` `mean` `median` `clamp` `round` `random` `range` `inRange` |
| String | `camelCase` `snakeCase` `kebabCase` `pascalCase` `capitalize` `trim` `words` `escape` |
| Promise | `delay(ms)` `timeout(ms)` `withTimeout(p, ms)` `Mutex` `Semaphore` `TimeoutError` |
| Util | `attempt(fn)` `attemptAsync(fn)` `invariant(cond, msg)` |

## 七、主包 vs es-toolkit/compat

| 维度 | 主包 `es-toolkit` | `es-toolkit/compat` |
|---|---|---|
| 定位 | 现代核心集 | Lodash 1:1 兼容 |
| `pick`/`omit` | 仅键数组 | 可变参数 + 点号深路径 |
| `get`/`set` | 无（用可选链替代） | 有 |
| 链式 `_(x).f().value()` | 无 | 有 |
| `debounce` 选项 | `edges` + `signal` | `leading`/`trailing`/`maxWait` |
| 隐式类型转换 | 无（严格） | 有（对齐 lodash） |
| 体积 / 速度 | 最小 / 最快 | 略大 / 略慢（仍优于 lodash） |
| 适用 | 新项目、追求最优 | 迁移既有 lodash 代码 |
| 兼容里程碑 | — | 100% 兼容 since v1.39.3 |
| 明确不支持 | — | `sortedUniq` `sortedUniqBy` `mixin` `noConflict` `runInContext` |

## 八、关键数字（官方）

| 指标 | 数字 | 来源 / 口径 |
|---|---|---|
| 体积缩减 | 最多约 **97%** | esbuild 测打包字节，es-toolkit@1.43.0 vs lodash-es@4.17.21 |
| 单函数极小 | `difference` 90B / `sample` 94B / `pick` 132B | 同上 |
| 运行时提速 | 平均约 **2×**（`omit` 11.8×、`pick` 3.43×） | M1 Max 基准 vs lodash-es@4.17.21 |
| 测试覆盖 | **100%** | 官方 |
| 运行环境 | Node 18+ / Deno / Bun / 浏览器 | 官方 |
| 依赖 | **零运行时依赖** | package.json |

## 九、迁移三步法（速记）

```text
1. import 'lodash'/'lodash-es' → 'es-toolkit/compat'（零行为变化）
2. 逐模块清理 lodash 式写法
3. 不依赖怪癖的调用切到主包 'es-toolkit'（拿最优体积/性能）
```

---

命令查完，进 [指南 · 基础](./guide-line/base) 理解函数族，或 [指南 · 进阶](./guide-line/advanced) 看迁移与基准。
