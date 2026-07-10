---
layout: doc
outline: [2, 3]
---

# 参考

> `lodash-es` 常用方法、关键 API 形态、变异性与原生平替速查。版本基线 **Lodash 4.18.1**。冷门方法见[官方文档](https://lodash.com/docs)。

## 速查

- **版本与格式**：`lodash-es@4.18.1` 是 Lodash 的 ESM 发行形态，包元数据含 `"type": "module"` 与 `"sideEffects": false`；`lodash@4.18.1` 仍以 CommonJS 主入口发布。
- **推荐导入**：应用代码优先从 `lodash-es` 具名导入；原生 ESM 子路径需带 `.js`，如 `lodash-es/cloneDeep.js`。
- **类型包**：`lodash-es` 不内置 TypeScript 声明，安装 `@types/lodash-es`；后者复用 `@types/lodash`。
- **高风险 API**：`set`、`unset`、`update`、`merge`、`assign`、`defaults` 以及 `pull` / `remove` 会修改入参。
- **函数控制**：`debounce` 支持 `leading` / `trailing` / `maxWait` 与 `cancel` / `flush`；`memoize` 默认只用首参作 key。
- **原生替代**：数组常规操作、静态可选路径、原始值去重与纯数据深拷贝优先评估原生 API。
- **wrapper 边界**：`chain` 可用且可能惰性求值，但通常扩大 bundle；体积敏感处优先具名函数组合。
- **官方入口**：[API 文档](https://lodash.com/docs/) ｜ [4.18.1 Changelog](https://github.com/lodash/lodash/wiki/Changelog)

## 一、方法分类总览

Lodash 官方按以下 category 组织方法（注意：**没有** Promise/异步分类）：

| 分类 | 代表方法 |
|---|---|
| Array | `chunk`、`compact`、`difference`、`flatten`、`flattenDeep`、`uniq`、`uniqBy`、`pull`、`zip` |
| Collection | `map`、`filter`、`find`、`reduce`、`groupBy`、`keyBy`、`sortBy`、`orderBy`、`countBy`、`every`、`some` |
| Function | `debounce`、`throttle`、`memoize`、`once`、`curry`、`partial`、`bind`、`after`、`before` |
| Lang | `cloneDeep`、`cloneDeepWith`、`isEqual`、`isEmpty`、`isNil`、`isArray`、`isObject`、`toArray` |
| Math | `add`、`max`、`min`、`mean`、`sum`、`sumBy` |
| Number | `clamp`、`inRange`、`random` |
| Object | `get`、`set`、`has`、`pick`、`omit`、`merge`、`mergeWith`、`defaults`、`defaultsDeep`、`keys`、`values` |
| Seq | `chain`、`value`（链式相关） |
| String | `camelCase`、`kebabCase`、`capitalize`、`trim`、`escape`、`template` |
| Util | `identity`、`constant`、`noop`、`range`、`times`、`uniqueId` |

## 二、按需引入写法

```js
// ✅ 推荐：具名导入（tree-shaking）
import { debounce, cloneDeep, get } from "lodash-es";

// ✅ 子路径直达（更显式）
import cloneDeep from "lodash-es/cloneDeep.js";

// ⚠️ 避免：整体导入 CJS lodash（无法像 ESM 那样可靠摇树）
import _ from "lodash";

// ⚠️ 新代码不建议：per-method 包会重复内联内部依赖，版本管理也更分散
// import debounce from 'lodash.debounce'
```

## 三、高频方法 API 形态

| 方法 | 签名 | 要点 |
|---|---|---|
| `cloneDeep` | `cloneDeep(value)` | 递归深拷贝；保留函数（按引用）、处理循环引用 |
| `cloneDeepWith` | `cloneDeepWith(value, customizer)` | customizer 返回非 undefined 则接管该节点克隆 |
| `isEqual` | `isEqual(a, b)` | SameValueZero 深比较；`isEqual(NaN,NaN)===true` |
| `get` | `get(obj, path, [default])` | path 支持 `'a[0].b'` 或 `['a',0,'b']`；中途为空返回 default |
| `set` | `set(obj, path, value)` | ⚠️ 变异 obj；自动创建缺失中间结构 |
| `merge` | `merge(dest, ...sources)` | ⚠️ 变异 dest；递归深合并（数组按索引合并） |
| `defaults` | `defaults(obj, ...sources)` | ⚠️ 变异 obj；只补缺失值（浅） |
| `defaultsDeep` | `defaultsDeep(obj, ...sources)` | ⚠️ 变异 obj；只补缺失值（深） |
| `pick` / `omit` | `pick(obj, paths)` / `omit(obj, paths)` | 返回新对象（白/黑名单） |
| `groupBy` | `groupBy(coll, iteratee)` | 每个 key → 数组 |
| `keyBy` | `keyBy(coll, iteratee)` | 每个 key → 单值（保留最后一个） |
| `orderBy` | `orderBy(coll, iteratees, orders)` | 多键 + 各自 `'asc'`/`'desc'` |
| `uniqBy` | `uniqBy(array, iteratee)` | 按 iteratee 判定值去重 |
| `chunk` | `chunk(array, [size=1])` | 切成长度 size 的小数组 |
| `debounce` | `debounce(fn, [wait=0], [opts])` | opts: `leading`/`trailing`/`maxWait`；返回带 `cancel`/`flush` |
| `throttle` | `throttle(fn, [wait=0], [opts])` | 每周期最多一次；默认首尾都触发 |
| `memoize` | `memoize(fn, [resolver])` | ⚠️ 默认只用首参当 key；缓存永不淘汰；`.cache` 可操作 |
| `curry` | `curry(fn, [arity])` | 分批传参；支持占位符 `_` |
| `flow` / `flowRight` | `flow([fns])` / `flowRight([fns])` | 左→右 / 右→左组合 |

## 四、变异性速查（是否修改入参）

| 会变异入参 ⚠️ | 返回新值 ✅ |
|---|---|
| `set`、`unset`、`update` | `get`、`has` |
| `merge`、`mergeWith` | `cloneDeep`、`clone` |
| `assign`、`assignIn` | `pick`、`omit` |
| `defaults`、`defaultsDeep` | `mapValues`、`mapKeys` |
| `pull`、`remove`、`fill`、`reverse` | `filter`、`map`、`uniq`、`flatten` |

> 不可变更新（Redux/React state）请用 `lodash/fp` 的不可变版本、`cloneDeep` 后再改、或 immer。

## 五、原生平替对照

| 需求 | Lodash | 原生（ES2023+） | 建议 |
|---|---|---|---|
| 映射/过滤/查找 | `map`/`filter`/`find` | `Array.prototype.*` | 用原生 |
| 扁平化 | `flatten`/`flattenDeep` | `flat()`/`flat(Infinity)` | 用原生 |
| 去重（原始值） | `uniq` | `[...new Set(arr)]` | 用原生 |
| 静态路径取值 | `get` | `?.` + `??` | 用原生 |
| 深拷贝（纯数据） | `cloneDeep` | `structuredClone` | 看是否含函数 |
| 深合并 / 深比较 | `merge` / `isEqual` | — | 用 Lodash |
| 防抖 / 节流 | `debounce` / `throttle` | — | 用 Lodash |
| 动态路径取值/设值 | `get` / `set` | — | 用 Lodash |

## 六、TypeScript 与生态

```bash
pnpm add lodash-es
pnpm add -D @types/lodash-es   # lodash-es 不内置类型，依赖 @types/lodash
```

| 库 | 模块格式 | 自带 TS 类型 | 定位 |
|---|---|---|---|
| `lodash` | CJS（不可摇树） | 否（需 @types/lodash） | 经典、最广泛 |
| `lodash-es` | ESM（可摇树） | 否（需 @types/lodash-es） | Lodash 的 ESM 形态 |
| `lodash/fp` | — | 否 | 不可变 + 柯里化 + data-last |
| `es-toolkit` | ESM | **是（原生）** | 更小更快的现代替代，含 `compat` 层 |

---

速查完毕，回 [指南 · 基础](./guide-line/base) 理解机制，或 [指南 · 进阶](./guide-line/advanced) 看 debounce/memoize/flow 实战。
