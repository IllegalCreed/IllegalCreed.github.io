---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **ts-pattern 5.9.0**。深入类型层面：`exhaustive` 穷尽性原理与 `NonExhaustiveError`、`P.infer` 模式即类型、`returnType` 与输出推导、`exhaustive` 的运行时兜底、与 Zod 的协作、性能与边界。

## 速查

- `.exhaustive()` 只有在剩余输入类型收窄为 `never` 时可调用；漏项会形成 `NonExhaustiveError<Remaining>` 类型错误
- `.exhaustive(handler)` 保留编译期穷尽检查，并为运行时越界值提供兜底；无 handler 时越界会抛错
- `P.infer<typeof pattern>` 从模式推类型，范围谓词只影响运行时，通常仍推成 `number` / `string`
- `.returnType<T>()` 必须放在分支之前，用来约束所有 handler；默认输出是各分支返回值的联合
- `.narrow()` 会深度扣除已处理模式后再继续匹配；顶层联合成员本来就会自动排除
- `isMatching` 能校验并收窄 `unknown`，但只给布尔结果；需要 issue、转换或默认值时先用 schema 库
- Zod / Valibot 负责入口解析，ts-pattern 负责可信判别联合的穷尽控制流，二者职责可以组合
- 类型级模式越大，TypeScript 检查成本越高；简单单值分支继续使用原生 `switch` / `if`

## 一、exhaustive 的穷尽性：编译期如何保证

`.exhaustive()` 的机制是：随着每个 `.with` 命中，输入类型被「扣掉」已覆盖的部分；到链尾时，若剩余类型不是 `never`（还有可能值没覆盖），TypeScript 就报错，错误类型形如 `NonExhaustiveError<未覆盖的情况>`：

```ts
import { match } from "ts-pattern";

type Permission = "editor" | "viewer";
type Plan = "basic" | "pro";

const fn = (org: Plan, user: Permission) =>
  match([org, user])
    .with(["basic", "viewer"], () => {})
    .with(["basic", "editor"], () => {})
    .with(["pro", "viewer"], () => {})
    // 编译报错 NonExhaustiveError<['pro', 'editor']>：该组合没处理
    .exhaustive();
```

> 推论：一个 `.with` 都不写、输入又非 `never` 时，`.exhaustive()` 同样报错——因为「所有可能都没被覆盖」。这就是它「强制写全分支」的本质。

## 二、exhaustive 的运行时兜底

类型完整时运行期不会有漏网值，但运行时数据可能越界（如来自外部的非法值）。给 `.exhaustive()` 传一个 handler，遇到未覆盖值时改为调用它、**不抛** `NonExhaustiveError`：

```ts
import { match } from "ts-pattern";

const result = match(value as "a" | "b")
  .with("a", () => "A")
  .with("b", () => "B")
  .exhaustive((unexpected) => {
    console.warn("意外值：", unexpected);
    return "default"; // 优雅兜底，同时保留编译期穷尽检查
  });
```

## 三、P.infer：模式即类型的单一来源

用 `as const` 写好模式后，`P.infer` 反推出「可被它匹配的值」的类型，避免模式与类型声明两处重复维护：

```ts
import { P } from "ts-pattern";

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
import { match, P } from "ts-pattern";

const x = match<number>(n)
  .with(0, () => "zero") // string
  .with(P.number, () => 1) // number
  .exhaustive();
// x: string | number
```

需要强约束输出形态、或自动推导不够精确时，用 `.returnType<T>()`（放在 `.with` 之前），它要求每个 handler 都返回兼容 `T` 的值：

```ts
const y = match<number>(n)
  .returnType<string>() // 锁定输出为 string
  .with(0, () => "zero")
  .with(P.number, () => "其它") // 若这里返回 number 会编译报错
  .exhaustive();
```

> 另一处类型入口是 `match<Input>(value)`：当字面量被 TS 推得过窄时，显式指定**输入类型**能让 `.with`/`.exhaustive()` 基于目标联合工作。

### narrow：深度排除已处理情况

顶层联合成员会随着 `.with()` 自动排除；输入是「属性联合的笛卡尔组合」时，可在若干分支后调用 `.narrow()`，让后续 handler 只看到尚未处理的组合：

```ts
type Input = { color: "red" | "blue"; size: "small" | "large" };

match(input)
  .with({ color: "red", size: "small" }, () => "done")
  .with({ color: "blue", size: "large" }, () => "done")
  .narrow()
  .otherwise((rest) => rest);
// rest: { color: 'red'; size: 'large' } | { color: 'blue'; size: 'small' }
```

## 五、与 Zod 协作：入口校验 + 控制流分发

ts-pattern 的 `isMatching` 能对未知值做布尔式结构守卫，但不提供结构化错误、转换与默认值。复杂入口的典型分工仍是「Zod 把关入口，ts-pattern 驱动逻辑」：

```ts
import { z } from "zod";
import { match, P } from "ts-pattern";

const Event = z.discriminatedUnion("type", [
  z.object({ type: z.literal("click"), x: z.number(), y: z.number() }),
  z.object({ type: z.literal("key"), code: z.string() }),
]);

function handle(raw: unknown) {
  const event = Event.parse(raw); // 运行时校验 → 得到可信判别联合
  return match(event) // 对已知类型做穷尽分发
    .with({ type: "click" }, (e) => `点击 (${e.x},${e.y})`)
    .with({ type: "key" }, (e) => `按键 ${e.code}`)
    .exhaustive();
}
```

## 六、reducer 迁移：从 switch 到 match

把 `switch (action.type)` 的 reducer 改写为 match，收获自动收窄与穷尽检查：

```ts
import { match } from "ts-pattern";

type Action = { type: "add"; amount: number } | { type: "reset" };

const reducer = (state: number, action: Action): number =>
  match(action)
    .with({ type: "add" }, (a) => state + a.amount) // a.amount 精确可用
    .with({ type: "reset" }, () => 0)
    .exhaustive(); // 新增 action 类型而漏处理 → 编译报错
```

## 七、性能与边界

| 维度           | 说明                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| **编译时间**   | 官方提示：穷尽检查是可选的，会因更多类型检查带来**略长的编译时间**（超大联合/超深嵌套更明显，仅影响编译期） |
| **运行时体积** | 约 ~2kB、`sideEffects: false`，可 tree-shaking；运行时只做结构/条件比较，无 babel 宏或编译插件              |
| **顺序敏感**   | 自上而下短路，`P._`/宽条件务必放最后，否则截胡具体分支                                                      |
| **适用边界**   | 简单单值判断 `switch`/`if` 仍合适；ts-pattern 的价值在「复杂结构 + 需要穷尽保证」                           |
| **校验边界**   | `isMatching` 可布尔式校验未知输入；需要 issue、转换、默认值和协议治理时交给 Zod/Valibot                     |

## 八、辨析：几组容易混淆的概念

- **`P._` vs `P.any`**：完全等价，`P.any` 是 `P._` 的别名，匹配任意值。
- **`P.optional` vs `P.nullish`**：前者关注「键是否存在」（对象属性场景），后者关注「值是否为 null/undefined」。
- **`P.when`（模式）vs `.when`（链方法）**：前者嵌在 `.with` 模式内部某处，后者是对整个输入加谓词的独立分支。
- **`.exhaustive()` vs `.run()`**：前者带编译期穷尽检查，后者不带（不安全）；`.otherwise()` 用通配兜底放宽穷尽要求。

---

回到 [入门](../getting-started) 复习基本结构，或查 [参考](../reference) 速览全部 `P.*` 模式与链式断言。
