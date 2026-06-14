---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **es-toolkit 1.47+**。本篇把「会装会用」推进到「懂常用函数族与语义」：数组 / 对象 / 函数 / 断言 / 字符串常用函数、tree-shaking 与 `sideEffects`、可变 vs 不可变语义。

## 一、函数分类全景

es-toolkit 主包按领域组织，对应可独立引入的子路径：

| 分类 | 子路径 | 代表函数 |
|---|---|---|
| Array | `es-toolkit/array` | `chunk` `groupBy` `keyBy` `uniq` `difference` `partition` `sortBy` `orderBy` `zip` |
| Object | `es-toolkit/object` | `pick` `omit` `merge` `toMerged` `cloneDeep` `mapValues` `mapKeys` `invert` |
| Function | `es-toolkit/function` | `debounce` `throttle` `once` `memoize` `curry` `partial` `negate` `retry` |
| Predicate | `es-toolkit/predicate` | `isString` `isNumber` `isNil` `isPlainObject` `isEqual` `isPromise` `isDate` |
| Math | `es-toolkit/math` | `sum` `sumBy` `mean` `median` `clamp` `range` `round` `random` |
| String | `es-toolkit/string` | `camelCase` `snakeCase` `kebabCase` `pascalCase` `capitalize` `trim` `words` |
| Promise | `es-toolkit/promise` | `delay` `timeout` `withTimeout` `Mutex` `Semaphore` |
| Util | `es-toolkit/util` | `attempt` `attemptAsync` `invariant` |

## 二、数组常用族

```ts
import { chunk, uniq, groupBy, keyBy, partition, difference, orderBy } from 'es-toolkit';

chunk([1, 2, 3, 4, 5], 2);        // [[1, 2], [3, 4], [5]]
uniq([1, 2, 2, 3, 3]);            // [1, 2, 3]
difference([2, 1], [2, 3]);       // [1]（在 A 不在 B）
partition([1, 2, 3, 4], (x) => x % 2 === 0); // [[2, 4], [1, 3]]
```

**`groupBy` vs `keyBy`** —— 同键处理不同：

```ts
groupBy(users, (u) => u.role); // { admin: [u1, u3], user: [u2] } —— 收成数组
keyBy(users, (u) => u.id);     // { 1: u1, 2: u2 } —— 每键只留一个，同键后者覆盖
```

**排序**：`sortBy` 固定升序；`orderBy` 可为每个键指定方向：

```ts
orderBy(users, [(u) => u.age, (u) => u.name], ['asc', 'desc']); // 先 age 升、再 name 降
```

## 三、对象常用族

```ts
import { pick, omit, mapValues, cloneDeep } from 'es-toolkit';

pick({ a: 1, b: 2, c: 3 }, ['a', 'c']); // { a: 1, c: 3 }
omit({ a: 1, b: 2, c: 3 }, ['b']);      // { a: 1, c: 3 }
mapValues({ a: 1, b: 2 }, (v) => v * 10); // { a: 10, b: 20 }
```

::: warning 主包 pick/omit 只收键数组
主包 `pick`/`omit` 接收**键数组**，不支持可变参数，也**不支持点号深路径**（如 `'a.b.c'`）。深路径与可变参数是 `es-toolkit/compat` 才有的 lodash 兼容能力。
:::

## 四、函数常用族

```ts
import { debounce, throttle, once, memoize } from 'es-toolkit';

// 防抖：连续调用只在最后一次后等 300ms 执行一次
const onSearch = debounce((q: string) => fetchResults(q), 300);

// 节流：固定间隔执行
const onScroll = throttle(() => updateUI(), 200);

// once：无论调用多少次，只执行一次并缓存结果（惰性单例）
const init = once(() => expensiveSetup());

// memoize：按参数缓存（默认以第一个参数为缓存键）
const slowSquare = memoize((n: number) => n * n);
```

> 主包的 `debounce`/`throttle` 用现代化的 **`edges`** 选项控制开头/结尾执行（`{ edges: ['leading'] }`），并支持 `AbortSignal`；lodash 风格的 `{ leading, trailing, maxWait }` 在 compat 里。详见[专家篇](./expert)。

## 五、断言族（类型守卫）

es-toolkit 的 Predicate 多数是**真正的 TypeScript 类型守卫**：

```ts
import { isString, isNil, isPlainObject } from 'es-toolkit';

function handle(x: unknown) {
  if (isString(x)) {
    x.toUpperCase(); // ✅ TS 已把 x 收窄为 string
  }
}

isNil(null);      // true（null 或 undefined）
isNil(undefined); // true
isNil(0);         // false
```

**`isEqual`** 做深度相等比较（不要求同一引用）：

```ts
import { isEqual } from 'es-toolkit';
isEqual([1, [2, 3]], [1, [2, 3]]); // true
```

## 六、字符串命名风格转换

```ts
import { camelCase, snakeCase, kebabCase, pascalCase } from 'es-toolkit';

camelCase('foo_bar_baz');  // 'fooBarBaz'
snakeCase('fooBarBaz');    // 'foo_bar_baz'
kebabCase('fooBarBaz');    // 'foo-bar-baz'
pascalCase('foo_bar');     // 'FooBar'
```

## 七、tree-shaking 与 sideEffects

es-toolkit 的 `package.json` 标了 `"sideEffects": false`，告诉打包器（Vite / Rollup / webpack / esbuild）：本包模块无副作用，**未引用的导出可被安全摇掉**。

```ts
// 即便从主入口导入，最终产物也只含 chunk + 其内部依赖
import { chunk } from 'es-toolkit';
```

这是「体积最多小 97%」的工程基础：现代极简实现 + 摇树友好结构 + 具名导入。

## 八、可变 vs 不可变：必须分辨

部分函数会**原地修改入参**（mutating），在 Redux / React state 等不可变场景会出错：

| 会修改入参（慎用于不可变场景） | 不改入参（不可变安全） |
|---|---|
| `merge`（原地深合并 target） | `toMerged`（返回全新合并结果） |
| `pull` / `remove`（原地删元素） | `difference` / `without`（返回新数组） |
| `fill`（原地填充） | `cloneDeep` 后再改 |

```ts
import { merge, toMerged } from 'es-toolkit';

// ❌ 不可变场景：merge 原地改了 state
merge(state, patch);

// ✅ 返回新对象，state 不被触碰
const next = toMerged(state, patch);
```

---

进入 [指南 · 进阶](./advanced)：从 lodash 迁移三步法、体积 / 性能基准数字、compat 的 `get`/深路径 / 链式、选型决策。
