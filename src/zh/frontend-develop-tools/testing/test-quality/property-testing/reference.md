---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 fast-check v4.8 编写

## 速查

- core `fast-check` **4.8.0** / `@fast-check/vitest` **0.4.1** / `@fast-check/jest` **2.2.0**（2026）
- 入口：`fc.assert(fc.property(...arbs, predicate))`；异步 `fc.asyncProperty` + **`await`**
- `numRuns` 默认 **100**；`fc.nat()` 含 0、上界 **2147483647**；`fc.double()` 默认含 `NaN`/`±Infinity`
- **shrinking** 自动收缩最小反例；复现 = `{ seed, path }` 填回 `fc.assert`
- **runner-agnostic**：裸用 `fc.assert` 即可；`test.prop([…])` 位置参 / `test.prop({…})` 命名参
- 完整说明见 [入门](./getting-started.md) / [概念与范式](./guide-line/concepts-paradigm.md) / [Arbitraries 与 API](./guide-line/arbitraries-api.md) / [收缩与复现](./guide-line/shrinking-replay.md) / [框架集成与进阶](./guide-line/integration-advanced.md) / [最佳实践](./guide-line/best-practices.md)

## 版本锚点

| 包 | 版本 | 发布日期 | 说明 |
| ---- | ---- | -------- | ---- |
| `fast-check`（core） | **4.8.0** | 2026-05-11 | dist-tags: latest=4.8.0, legacy=2.15.1 |
| `@fast-check/vitest` | **0.4.1** | 2026-04-28 | 0.4.x 对齐 vitest 4.x；0.4.1 支持 `test.each` |
| `@fast-check/jest` | **2.2.0** | 2026-03-08 | 自动同步 Jest 与 fast-check 的 timeout |
| `@fast-check/ava` | 3.0.1 | 2026-05-11 | AVA 适配 |
| `@fast-check/worker` | 0.6.0 | 2026-03-08 | 把属性跑进 worker thread（隔离 / 真超时） |

> 版本日期以 npm registry 为准（fast-check 4.8.0 = **2026-05-11**）。core 4.x 近期里程碑：4.6.0（`stringMatching` 加 `maxLength`）、4.7.0（`stringMatching` 支持 Unicode property、可逆 `json`）、4.8.0（新增 `chainUntil` 循环式链生成）。

## 常用 arbitraries

| arbitrary | 生成什么 | 备注 |
| --------- | -------- | ---- |
| `fc.integer({min,max})` | 区间整数 | — |
| `fc.nat(max?)` | 非负整数 | **含 0**，默认上界 2147483647 |
| `fc.float()` / `fc.double(opts)` | 浮点数 | **默认含 `NaN`/`±Infinity`**，需 `noNaN`/`noDefaultInfinity` |
| `fc.boolean()` / `fc.bigInt()` | 布尔 / 大整数 | — |
| `fc.string({minLength,maxLength,unit})` | 字符串 | **v4 收编** `fullUnicode/ascii/hexaString` 进 `unit` |
| `fc.constant(v)` | 恒定单值 | — |
| `fc.constantFrom(a,b,…)` | 从给定值选一个 | **首参 = shrink 默认目标** |
| `fc.option(arb,{nil})` | 可能产出 null | — |
| `fc.oneof(a,b,…)` | 多 arbitrary 间选 | 可带 `{arbitrary,weight}` |
| `fc.array(arb,{min,max}Length)` | 数组 | `fc.uniqueArray` 去重 |
| `fc.tuple(a,b,c)` | 定长异构元组 | — |
| `fc.record({…},{requiredKeys})` | 固定键对象 | `fc.dictionary` 键值都生成 |
| `fc.json()` / `fc.anything()` / `fc.date()` | JSON / 任意值 / 日期 | — |

### `fc.string` 的 unit（v4）

| unit | 含义 |
| ---- | ---- |
| `'grapheme-ascii'` | 默认，可打印 ASCII |
| `'grapheme'` | 多码点字素 |
| `'grapheme-composite'` | 组合字素 |
| `'binary'` | 任意码点（除半代理） |
| `'binary-ascii'` | ASCII 码点 |
| 自定义 arbitrary | 如 `fc.string({ unit: fc.constantFrom('a','b') })` |

## 组合子

| 组合子 | 作用 | 提示 |
| ------ | ---- | ---- |
| `.map(fn)` | 把生成值映射成另一种 | **构造合法输入首选**，不丢样本 |
| `.filter(p)` | 只保留满足条件的值 | **慎用**，过滤太狠 → 慢 / 告警 |
| `.chain(fn)` | 用上一值动态决定下一个 arbitrary | 依赖生成 |
| `.noShrink()` | 禁止参与收缩 | **反模式**，破坏最小反例 |
| `fc.pre(cond)` | 谓词体内前置条件 | 丢弃过多会告警 |

## run 参数

| 参数 | 默认 | 作用 |
| ---- | ---- | ---- |
| `numRuns` | **100** | 每属性跑多少组输入 |
| `seed` | 随机 | 固定后整轮可复现；失败回填 |
| `path` | — | 配合 `seed` 直达收缩后反例 |
| `endOnFailure` | `false` | `true` = **跳过 shrinking**，首个失败即停 |
| `verbose` | `0`（None） | 详细度 0/1/2 |
| `examples` | `[]` | 先跑手写示例再跑生成值（钉回归） |
| `timeout` | — | 单个异步谓词超时（ms） |
| `interruptAfterTimeLimit` | — | 到时限停止启动新 run |
| `ignoreEqualValues` | `false` | 忽略重复输入 |

## 命令 / API 速查

```ts
import fc from "fast-check"; // core 4.8.0

// 同步属性
fc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => a + b === b + a));
// 异步属性（必须 await）
await fc.assert(fc.asyncProperty(fc.nat(), async (n) => (await f(n)) != null));

// 复现失败：把报告里的 { seed, path } 原样填回
fc.assert(prop, { seed: -1819918769, path: "0:...:3" });

// 适配包（语法糖，runner-agnostic 核心不需要它）
import { test, fc } from "@fast-check/vitest"; // 0.4.1（jest 同理 2.2.0）
test.prop([fc.string()])("name", (s) => /* */ true); // 数组：位置参数
test.prop({ s: fc.string() })("name", ({ s }) => true); // 命名：对象解构

// model-based
const cmds = fc.commands([fc.integer().map((v) => new Push(v)), fc.constant(new Pop())]);
fc.assert(fc.property(cmds, (c) => fc.modelRun(() => ({ model, real }), c)));

// 递归结构（别直接递归调用 arbitrary）
const { tree } = fc.letrec((tie) => ({
  tree: fc.oneof(fc.record({ v: fc.nat() }), fc.record({ l: tie("tree"), r: tie("tree") })),
}));
```

## 官方资源

- fast-check 官方文档：[https://fast-check.dev/](https://fast-check.dev/)
- 第一个属性测试（property 定义）：[https://fast-check.dev/docs/tutorials/quick-start/our-first-property-based-test/](https://fast-check.dev/docs/tutorials/quick-start/our-first-property-based-test/)
- 读测试报告（seed/path/Counterexample/Shrunk）：[https://fast-check.dev/docs/tutorials/quick-start/read-test-reports/](https://fast-check.dev/docs/tutorials/quick-start/read-test-reports/)
- arbitraries 总览：[https://fast-check.dev/docs/core-blocks/arbitraries/](https://fast-check.dev/docs/core-blocks/arbitraries/)
- runners / Parameters（run 参数）：[https://fast-check.dev/docs/core-blocks/runners/](https://fast-check.dev/docs/core-blocks/runners/)
- model-based testing：[https://fast-check.dev/docs/advanced/model-based-testing/](https://fast-check.dev/docs/advanced/model-based-testing/)
- 生态（vitest/jest/ava/worker、schema 桥接）：[https://fast-check.dev/docs/ecosystem/](https://fast-check.dev/docs/ecosystem/)
- GitHub：[https://github.com/dubzzz/fast-check](https://github.com/dubzzz/fast-check)
- npm（权威版本/日期）：[https://www.npmjs.com/package/fast-check](https://www.npmjs.com/package/fast-check)
