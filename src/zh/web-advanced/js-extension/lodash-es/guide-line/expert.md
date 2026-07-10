---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **Lodash 4.18.1**。深入 lodash-es 的进阶主题：`_.chain` 的惰性求值与 ESM 取舍、`memoize` 自定义 LRU、`lodash/fp`（不可变 + data-last）、不可变更新方案、ESM↔CJS 互操作排查、防抖节流的单元测试，以及与 es-toolkit 的迁移取舍。

## 速查

- **惰性链条件**：wrapper 链在合适的数组管线中可做 lazy evaluation / shortcut fusion；不是每条链都只遍历一次。
- **体积取舍**：`chain` 依赖 wrapper 方法体系，通常比具名导入 + `flow` 更难摇树；先以实际 bundle 报告判断。
- **memoize 扩展点**：返回函数暴露 `.cache`，全局构造器是 `memoize.Cache`；替换为 LRU 会影响之后创建的所有 memoized 函数。
- **lodash/fp**：核心语义是不可变、自动柯里化、iteratee-first / data-last，并默认限制 iteratee 参数个数。
- **不可变更新**：常规 `set` / `merge` 会修改目标；可用 fp、`cloneDeep` 后修改或 Immer，数组合并规则要单独测试。
- **模块边界**：`lodash-es` 是 ESM，`lodash` 与 `lodash/fp` 来自 CommonJS 包；库模式、SSR 与测试环境要分别验证互操作。
- **计时器测试**：防抖节流使用假定时器，并覆盖首沿、尾沿、`maxWait`、`cancel`、`flush`。
- **迁移策略**：`es-toolkit/compat` 可降低迁移成本，但方法链、realm、修改原型等被官方列为范围外，关键路径仍需回归测试。

## 一、_.chain 的惰性求值与取舍

Lodash 的**显式链** `_.chain(arr).filter().map().take(n).value()` 在满足条件时会启用**惰性求值（lazy evaluation）与 shortcut fusion**：把多次迭代「融合」成一趟遍历，并在 `take` 等场景**提前短路**，对超大数组性能收益显著。

```js
import { chain } from "lodash-es";

// 本地实测：chain 在 lodash-es 里可用
chain([1, 2, 3, 4])
  .filter((n) => n % 2 === 0)
  .map((n) => n * 10)
  .value(); // [20, 40]
```

**取舍**：这套能力绑定 `chain`/wrapper，而 `chain` 会把大量方法挂上 wrapper 原型，**严重不利于 tree-shaking**——打包器难以判断你用了哪些链式方法，往往把一大批都打进产物。

::: tip ESM 下的结论
- **体积敏感（前端 bundle）** → 放弃 `chain`，改用具名导入 + `flow`/`flowRight` 组合。
- **处理超大数据且性能为先** → 才值得用 `chain` 的惰性序列。
- 注意：`chain` 在 lodash-es 里**仍可用**（实测正常），并非废弃——只是与摇树相冲突，需权衡。
:::

## 二、memoize 自定义 LRU 缓存

`memoize` 默认缓存**永不淘汰**（无限增长）、且**只用第一个参数当 key**。要做「带容量上限的 LRU」，有两个扩展点：

```js
import { memoize } from "lodash-es";

const fn = memoize((id) => heavyCompute(id));
fn.cache.constructor.name; // 'MapCache'（实测）
```

```js
// ① 直接操作返回函数的 .cache（实现 get/set/has/delete/clear）
fn.cache.clear(); // 手动清空

// ② 替换全局 Cache 构造器为 LRU 实现（Map-like 即可）
class LRUCache {
  constructor(max = 100) {
    this.max = max;
    this.map = new Map();
  }
  has(k) {
    return this.map.has(k);
  }
  get(k) {
    const v = this.map.get(k);
    this.map.delete(k);
    this.map.set(k, v); // 触为最近使用
    return v;
  }
  set(k, v) {
    if (this.map.size >= this.max) this.map.delete(this.map.keys().next().value);
    this.map.set(k, v);
    return this;
  }
  delete(k) {
    return this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}
memoize.Cache = LRUCache; // 之后所有 memoize 都用 LRU
```

> 多参数函数别忘了配 resolver 生成正确的 key；否则容量再大也会因「首参相同」而误命中。

## 三、lodash/fp：不可变 + 自动柯里化 + data-last

`lodash/fp` 是 Lodash 的函数式变体，把方法包装成 **immutable（不改入参）、auto-curried（自动柯里化）、iteratee-first / data-last（迭代器在前、数据在后）**：

```js
import fp from "lodash/fp";

// 常规：_.map(coll, fn)；fp：fp.map(fn)(coll) —— 数据放最后
const getNames = fp.map("name"); // 先收 iteratee
getNames(users); // 再喂数据，便于 flow 组合

// data-last 让组合更顺：fp.flow 串联无需写 (x)=>...
const pipeline = fp.flow(
  fp.filter((u) => u.age >= 18),
  fp.map("income"),
  fp.sum,
);
pipeline(users);
```

fp 还**默认 cap iteratee 参数**（通常只传一个），规避经典坑：

```js
import { map } from "lodash-es";
map(["6", "8", "10"], parseInt); // [6, NaN, 2] ⚠️ index 被当成 radix
fp.map(parseInt)(["6", "8", "10"]); // [6, 8, 10] ✅ fp 默认只传一个参数
```

> 注意：`lodash-es` 对应的是**常规** lodash 的 ESM 形态；fp 风格是另一套入口（`lodash/fp`）。

## 四、不可变更新：别直接用 set / merge

常规 `_.set` / `_.merge` 会**变异原对象**，违反 Redux/React 的不可变要求。三种正确做法：

```js
// ① lodash/fp 的不可变版本：返回新对象，不改原值
import fp from "lodash/fp";
const next = fp.set("user.name", "Tom", state); // state 不变

// ② 先 cloneDeep 再改（代价：整树拷贝）
import { cloneDeep, set } from "lodash-es";
const next2 = set(cloneDeep(state), "user.name", "Tom");

// ③ 工程主流：immer 的 produce（看似可变、实则不可变）
import { produce } from "immer";
const next3 = produce(state, (d) => {
  d.user.name = "Tom";
});
```

> `merge` 的数组合并也有坑：`merge({a:[1,2,3]},{a:[4]})` → `{a:[4,2,3]}`（按索引合并，实测如此），不是 `[4]` 也不是拼接。要「源数组整体替换」用 `mergeWith` 传 customizer：`(o,s)=>Array.isArray(s)?s:undefined`。

## 五、ESM ↔ CJS 互操作排查

`lodash-es` 是**纯 ESM**。被卷入互操作链路时易报「Named export not found」：

| 现象 | 可能根因 | 处理 |
|---|---|---|
| `require('lodash-es')` 失败 | 用 CJS 加载纯 ESM | 改用 `import`；或在该处用 `lodash`（CJS） |
| Vite SSR 报找不到具名导出 | `ssr.noExternal` 未含 lodash-es | 配 `ssr.noExternal: ['lodash-es']` |
| 预构建解析异常 | `optimizeDeps` 未正确处理 | 配 `optimizeDeps.include: ['lodash-es']` |
| 库模式产物互操作问题 | 外部化/格式配置不当 | 检查 `build.rollupOptions.external` 与 `output.format` |

> 根因方向是**模块格式与互操作配置**，而非 lodash-es 缺少导出（它导出完整）。确认加载方用的是 `import` 而非 `require` 往往是第一步。

## 六、防抖 / 节流的单元测试

`debounce`/`throttle` 依赖时间与计时器，测试要用**假定时器**而非真实等待：

```js
import { vi, test, expect } from "vitest";
import { debounce } from "lodash-es";

test("debounce 只在静默后触发一次", () => {
  vi.useFakeTimers();
  const spy = vi.fn();
  const d = debounce(spy, 300);
  d();
  d();
  d(); // 连续调用
  vi.advanceTimersByTime(299);
  expect(spy).not.toBeCalled(); // 还没到点
  vi.advanceTimersByTime(1);
  expect(spy).toBeCalledTimes(1); // 300ms 后触发一次
  vi.useRealTimers();
});
```

> Jest 同理：`jest.useFakeTimers()` + `jest.advanceTimersByTime(ms)`。手动推进时间使断言**确定、快、不 flaky**；配合 `.flush()`/`.cancel()` 还能测边缘行为。lodash 取「现在」用 `Date.now`/`_.now`，必要时还需 mock 时间源。

## 七、与 es-toolkit 的迁移取舍

`es-toolkit` 是现代 TS 优先工具库，主打**更小、更快、原生 TypeScript 类型**，大量函数对位 lodash，并提供 `es-toolkit/compat` 迁移层。

- **迁移动机**：减小 bundle、获得原生类型与更活跃的维护。
- **兼容口径**：官方称 compat 自 v1.39.3 起通过 Lodash 测试套件，但同时把方法链、跨 realm、修改内建原型及部分特化函数列为设计范围外；不要把里程碑理解成所有历史行为都无条件等价。
- **风险控制**：迁移需**逐一核对并补测试**，尤其是依赖隐式转换、冷门方法或 wrapper 链的代码。
- **务实策略**：新项目可优先评估 es-toolkit（自带类型、体积更优）；存量 lodash-es 项目按需、分批迁移，用 `compat` 平滑过渡，关键路径加测试守护。

---

回到 [入门](../getting-started) 复习按需引入，或查 [参考](../reference) 速览常用方法与 API 形态。
