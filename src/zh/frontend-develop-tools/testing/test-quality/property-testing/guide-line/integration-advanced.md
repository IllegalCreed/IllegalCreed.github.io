---
layout: doc
outline: [2, 3]
---

# 框架集成与进阶

> 基于 fast-check v4.8 编写

## 速查

- **runner-agnostic**：`fc.assert(fc.property(...))` 在 Jest/Vitest/Mocha/AVA/Bun 里裸用即可，适配包只是语法糖
- `@fast-check/vitest`（0.4.1）：`test.prop([arbs])` 位置参 / `test.prop({named})` 命名参
- `@fast-check/jest`（2.2.0）：API 与 vitest 版对称，额外**自动同步 Jest 与 fast-check 的 timeout**
- model-based：`fc.commands` 生成命令序列 + `fc.modelRun` 执行，**对拍 model vs real**，命令实现 `check/run/toString`
- 与 Zod/Valibot：用 `zod-fast-check` 的 `inputOf(schema)` 生成**合法输入** arbitrary，测「校验器不误杀 + 不漏放」
- 桥接库（`zod-fast-check` 等）是**社区库、版本独立于 fast-check core**，需单独核实兼容性

## runner-agnostic：核心不需要任何适配

fast-check 官网原文：

> fast-check can be used within any test runner without any specific integration needed. It works well with Jest, Mocha, Vitest, and others.

也就是说，核心写法 `fc.assert(fc.property(...))` 在 **Jest / Vitest / Mocha / AVA / Jasmine / Bun / node:test** 里**都能直接用，无需任何适配包**：

```ts
import { it } from "vitest"; // 或 jest / mocha……都行
import fc from "fast-check";

it("substring", () => {
  fc.assert(
    fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => (a + b + c).includes(b)),
  );
});
```

适配包（`@fast-check/vitest` / `@fast-check/jest`）只是把这套样板包成 `test.prop` 一行的**语法糖** + 与运行器报告/seed 的深度集成，并非必需。

## @fast-check/vitest（0.4.1）

提供 `test.prop`，两种签名：

```ts
import { test, fc } from "@fast-check/vitest";

// 数组形式：谓词参数按「位置」对应
test.prop([fc.string(), fc.string(), fc.string()])("detects the substring", (a, b, c) => {
  return (a + b + c).includes(b);
});

// 命名记录形式：谓词收一个对象、按 key 解构（更可读）
test.prop({ a: fc.string(), b: fc.string(), c: fc.string() })("detects the substring", ({ a, b, c }) => {
  return (a + b + c).includes(b);
});
```

- `test.prop([...arbs])(name, (a, b, c) => ...)`：**位置参数**。
- `test.prop({named})(name, ({ a, b }) => ...)`：**对象按 key 解构**。
- 支持 vitest 修饰链：`test.prop(...).skip` / `.only` / `.concurrent`；0.4.1 起支持 `test.each`。
- 等价于内部帮你写 `it(name, () => fc.assert(fc.property(...)))`，并把 vitest 的 seed / 报告打通。
- 自定义 run 参数走第三参：`test.prop([...], { numRuns: 10 })(name, ...)`。

> 0.4.x 要求对齐 vitest 4.x 的现代 API（0.4.0 起明确基于 vitest 4.1）；项目里 vitest 版本需匹配。

## @fast-check/jest（2.2.0）

API 与 vitest 版**完全对称**：

```ts
import { test, fc } from "@fast-check/jest";

test.prop([fc.string(), fc.string(), fc.string()])("detects the substring", (a, b, c) => {
  return (a + b + c).includes(b);
});
test.prop({ a: fc.string(), b: fc.string() })("...", ({ a, b }) => (a + b).includes(a));
```

- 同样有数组 / 命名两种 `test.prop` 形式，也提供 `it.prop` 别名。
- 独门好处：**自动同步 Jest 与 fast-check 的 timeout**——无需手动对齐两边超时设置。

无论 vitest 还是 jest 适配，`test.prop` 本质都是 `it(name, () => fc.assert(fc.property(arbs, predicate), params))` 的语法糖，随时能等价改写回原生写法。选择原则：想最小依赖 / 跨运行器复用 → 原生 `fc.assert`；想更短、与运行器报告深度集成 → 适配包 `test.prop`。

## model-based testing（有状态系统建模）

对**有状态系统**（栈、播放器、缓存、Pinia store……），逐个属性很难表达。model-based 的思路是：生成一段**命令序列**，在一个「简化 model」和「真实 real」上**同步执行并对拍**，任何一步不一致即失败。

```ts
import fc from "fast-check";

// 每个 command 实现 ICommand：check(model) / run(model, real) / toString()
const allCommands = [
  fc.integer().map((v) => new PushCommand(v)), // 带参命令用 .map 注入参数
  fc.constant(new PopCommand()), // 无参命令用 fc.constant
  fc.constant(new SizeCommand()),
];

fc.assert(
  fc.property(fc.commands(allCommands, { size: "+1" }), (cmds) => {
    const setup = () => ({ model: { num: 0 }, real: new List() });
    fc.modelRun(setup, cmds); // 顺序执行命令；run 内用 expect 校验 real 与 model 一致
  }),
);
```

- **`ICommand` 三方法**：`check(model)`（model 是否允许此命令 = 前置条件）、`run(model, real)`（同时推进 model 并操作 + 校验 real）、`toString()`（错误报告里序列化命令，便于读反例）。
- `fc.commands(commandArbs, { size?, maxCommands? })` 生成命令**序列**；`fc.modelRun(setup, cmds)` 执行（异步系统用 `fc.asyncModelRun`）。
- 带参命令用 **`.map` 注入参数**、无参命令用 **`fc.constant`**。
- **shrinking 同样作用于命令序列**：失败时收缩出「最短的能复现 bug 的命令序列」——这是 model-based 的杀手锏。

> 递归结构（如树）不要直接递归调用 arbitrary（会爆栈），用 `fc.letrec(tie => ...)` + `tie("name")` 绑定相互引用、配合 `oneof` 的 `depthSize` 控制深度。

## 与 Zod / Valibot 校验逻辑结合

前端常写大量 schema 校验。把 schema 转成 arbitrary，就能对**校验器本身**做属性测试——证明它「该过的过、该拒的拒」。fast-check 官方生态列出了与 schema 库的桥接思路，社区也有现成库：

```ts
import fc from "fast-check";
import { ZodFastCheck } from "zod-fast-check";
import { z } from "zod";

const MySchema = z.object({ id: z.number().int(), name: z.string().min(1) });

// inputOf(schema)：由 Zod schema 生成「合法输入」的 arbitrary
const arb = ZodFastCheck().inputOf(MySchema);

fc.assert(
  fc.property(arb, (data) => {
    MySchema.parse(data); // 合法输入不抛 = 校验器不误杀
  }),
);
```

- **`zod-fast-check`**（社区库）：`ZodFastCheck().inputOf(schema)` 生成**合法输入**的 arbitrary；`.override()` 替换难生成的子 schema；refinement 用 filter 实现（命中率低会拖慢）。
- **`@traversable/zod-test`**：`fuzz()` + `seedToValidData()` / `seedToInvalidData()` 同时造**合法**与**非法**数据，验证「该过的过、该拒的拒」。
- 三种用途：① 生成合法输入证明「校验器不误杀」；② 生成边界/非法输入证明「校验器不漏放」；③ 对 `parse∘serialize` 做往返属性。

> ⚠️ 这些桥接库是**社区库、版本独立于 fast-check core**，与具体 Zod 版本（尤其 Zod 4 之后）的兼容性需单独核实；项目里实际用哪个桥、还是手写 arbitrary，先在仓库内确认再下笔。
