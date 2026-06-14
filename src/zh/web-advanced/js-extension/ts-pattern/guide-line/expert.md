---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **ts-pattern 5.x**。深入类型层面：`exhaustive` 穷尽性原理与 `NonExhaustiveError`、`P.infer` 模式即类型、`returnType` 与输出推导、`exhaustive` 的运行时兜底、与 Zod 的协作、性能与边界。

## 一、exhaustive 的穷尽性：编译期如何保证

`.exhaustive()` 的机制是：随着每个 `.with` 命中，输入类型被「扣掉」已覆盖的部分；到链尾时，若剩余类型不是 `never`（还有可能值没覆盖），TypeScript 就报错，错误类型形如 `NonExhaustiveError<未覆盖的情况>`：

```ts
import { match } from 'ts-pattern';

type Permission = 'editor' | 'viewer';
type Plan = 'basic' | 'pro';

const fn = (org: Plan, user: Permission) =>
  match([org, user])
    .with(['basic', 'viewer'], () => {})
    .with(['basic', 'editor'], () => {})
    .with(['pro', 'viewer'], () => {})
    // 编译报错 NonExhaustiveError<['pro', 'editor']>：该组合没处理
    .exhaustive();
```

> 推论：一个 `.with` 都不写、输入又非 `never` 时，`.exhaustive()` 同样报错——因为「所有可能都没被覆盖」。这就是它「强制写全分支」的本质。

## 二、exhaustive 的运行时兜底

类型完整时运行期不会有漏网值，但运行时数据可能越界（如来自外部的非法值）。给 `.exhaustive()` 传一个 handler，遇到未覆盖值时改为调用它、**不抛** `NonExhaustiveError`：

```ts
import { match } from 'ts-pattern';

const result = match(value as 'a' | 'b')
  .with('a', () => 'A')
  .with('b', () => 'B')
  .exhaustive((unexpected) => {
    console.warn('意外值：', unexpected);
    return 'default'; // 优雅兜底，同时保留编译期穷尽检查
  });
```

## 三、P.infer：模式即类型的单一来源

用 `as const` 写好模式后，`P.infer` 反推出「可被它匹配的值」的类型，避免模式与类型声明两处重复维护：

```ts
import { P } from 'ts-pattern';

const postPattern = {
  title: P.string,
  content: P.string,
  stars: P.number.between(1, 5).optional(), // 可选字段
  author: {
    firstName: P.string,
    lastName: P.string.optional(),
    followerCount: P.number,
  },
} as const;

type Post = P.infer<typeof postPattern>;
// 等价于：
// type Post = {
//   title: string;
//   content: string;
//   stars?: number;        // .optional() → 可选属性
//   author: { firstName: string; lastName?: string; followerCount: number };
// }
```

> `.optional()` 是 `P.optional` 的链式写法；范围断言（`between`）只约束运行时，类型层面仍是 `number`。

## 四、returnType 与输出推导

默认情况下，整条 match 表达式的输出类型，是所有保留分支 handler 返回类型的**统一/联合**：

```ts
import { match, P } from 'ts-pattern';

const x = match<number>(n)
  .with(0, () => 'zero')   // string
  .with(P.number, () => 1) // number
  .exhaustive();
// x: string | number
```

需要强约束输出形态、或自动推导不够精确时，用 `.returnType<T>()`（放在 `.with` 之前），它要求每个 handler 都返回兼容 `T` 的值：

```ts
const y = match<number>(n)
  .returnType<string>()           // 锁定输出为 string
  .with(0, () => 'zero')
  .with(P.number, () => '其它')   // 若这里返回 number 会编译报错
  .exhaustive();
```

> 另一处类型入口是 `match<Input>(value)`：当字面量被 TS 推得过窄时，显式指定**输入类型**能让 `.with`/`.exhaustive()` 基于目标联合工作。

## 五、与 Zod 协作：入口校验 + 控制流分发

ts-pattern 处理「已知类型的值」，不做运行时 schema 校验。典型分工是「Zod 把关入口，ts-pattern 驱动逻辑」：

```ts
import { z } from 'zod';
import { match, P } from 'ts-pattern';

const Event = z.discriminatedUnion('type', [
  z.object({ type: z.literal('click'), x: z.number(), y: z.number() }),
  z.object({ type: z.literal('key'), code: z.string() }),
]);

function handle(raw: unknown) {
  const event = Event.parse(raw); // 运行时校验 → 得到可信判别联合
  return match(event)             // 对已知类型做穷尽分发
    .with({ type: 'click' }, (e) => `点击 (${e.x},${e.y})`)
    .with({ type: 'key' }, (e) => `按键 ${e.code}`)
    .exhaustive();
}
```

## 六、reducer 迁移：从 switch 到 match

把 `switch (action.type)` 的 reducer 改写为 match，收获自动收窄与穷尽检查：

```ts
import { match } from 'ts-pattern';

type Action =
  | { type: 'add'; amount: number }
  | { type: 'reset' };

const reducer = (state: number, action: Action): number =>
  match(action)
    .with({ type: 'add' }, (a) => state + a.amount) // a.amount 精确可用
    .with({ type: 'reset' }, () => 0)
    .exhaustive(); // 新增 action 类型而漏处理 → 编译报错
```

## 七、性能与边界

| 维度 | 说明 |
|---|---|
| **编译时间** | 官方提示：穷尽检查是可选的，会因更多类型检查带来**略长的编译时间**（超大联合/超深嵌套更明显，仅影响编译期） |
| **运行时体积** | 约 ~2kB、`sideEffects: false`，可 tree-shaking；运行时只做结构/条件比较，无 babel 宏或编译插件 |
| **顺序敏感** | 自上而下短路，`P._`/宽条件务必放最后，否则截胡具体分支 |
| **适用边界** | 简单单值判断 `switch`/`if` 仍合适；ts-pattern 的价值在「复杂结构 + 需要穷尽保证」 |
| **不做校验** | 处理已知类型的值，不验证未知输入——入口校验交给 Zod/Valibot |

## 八、辨析：几组容易混淆的概念

- **`P._` vs `P.any`**：完全等价，`P.any` 是 `P._` 的别名，匹配任意值。
- **`P.optional` vs `P.nullish`**：前者关注「键是否存在」（对象属性场景），后者关注「值是否为 null/undefined」。
- **`P.when`（模式）vs `.when`（链方法）**：前者嵌在 `.with` 模式内部某处，后者是对整个输入加谓词的独立分支。
- **`.exhaustive()` vs `.run()`**：前者带编译期穷尽检查，后者不带（不安全）；`.otherwise()` 用通配兜底放宽穷尽要求。

---

回到 [入门](../getting-started) 复习基本结构，或查 [参考](../reference) 速览全部 `P.*` 模式与链式断言。
