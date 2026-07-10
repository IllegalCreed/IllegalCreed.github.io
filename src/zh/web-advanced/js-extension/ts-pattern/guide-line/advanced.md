---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **ts-pattern 5.9.0**。把模式匹配用进真实场景：`P.select` 数据提取、带守卫的 `.with`、判别联合 / 状态机、`isMatching` 类型守卫、变长元组、链式断言。

## 速查

- `P.select()` 允许一个匿名提取，handler 第一个参数是选中值、第二个参数是完整且已收窄的输入
- 多处提取必须命名：`P.select("name")`；handler 首参变为 selections 对象
- `P.select(name, subpattern)` 先要求子模式命中，再提取该值；它不是只取值不校验
- `.with(pattern, guard, handler)` 依次做结构匹配和额外谓词判断，适合状态机的合法状态 / 事件组合
- 判别联合配 `.exhaustive()` 能在新增成员后暴露漏处理分支；开放类型则保留 `.otherwise()`
- `isMatching(pattern)` 可柯里化成类型守卫，也可两参直接判断 `unknown`；它只返回布尔，不给 issue 详情
- 变长元组在数组字面量模式中展开 `...P.array(sub)`，可组合固定头尾与任意数量的中间项
- `P.string.*` / `P.number.*` 链式断言影响运行时命中；数值范围通常不会变成更窄的 TypeScript 数字类型

## 一、P.select：从结构里提取值

`P.select()` 让你在匹配的同时挑出深层的值，免去手动解构。**匿名** select 把选中值作为 handler 的第一个参数：

```ts
import { match, P } from "ts-pattern";

type Input = { type: "post"; user: { name: string } };

const author = (input: Input) =>
  match(input)
    .with({ type: "post", user: { name: P.select() } }, (name) => name) // name: string
    .otherwise(() => "anonymous");
```

**命名** select 用于一个分支里提取多处值，汇成一个对象传入：

```ts
match(input)
  .with(
    {
      type: "post",
      user: { name: P.select("name") },
      content: P.select("body"),
    },
    ({ name, body }) => `${name} 写道：${body}`,
  )
  .otherwise(() => "");
```

> 匿名 select 还能拿到第二个参数（完整输入）；命名 select 则统一走「选择对象」。**带子模式**的 `P.select('age', P.number.gt(18))` 会先约束条件、命中后再提取该值。

## 二、带守卫的 .with：结构 + 额外条件

在模式与 handler 之间插入守卫函数，二者皆满足才命中：

```ts
import { match, P } from "ts-pattern";

type State = { status: "loading"; startTime: number };
type Event = { type: "cancel" };

match([state, event] as [State, Event])
  .with(
    [{ status: "loading" }, { type: "cancel" }], // 先按结构匹配元组
    ([s]) => s.startTime + 2000 < Date.now(), // 再用守卫判断是否超时
    () => ({ status: "idle" }),
  )
  .otherwise(() => state);
```

> 数组模式 `[patternA, patternB]` 按位置匹配元组，是状态机里「某状态下收到某事件」的经典写法。

## 三、判别联合与状态机

判别联合（靠 `status`/`type` 这种公共字段区分）是 ts-pattern 的主场。每个分支自动收窄，配 `.exhaustive()` 保证全覆盖：

```ts
import { match, P } from "ts-pattern";

type Data =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: string[] }
  | { status: "error"; error: Error };

const view = (s: Data) =>
  match(s)
    .with({ status: "idle" }, () => "空闲")
    .with({ status: "loading" }, () => "加载中…")
    // 用 select 直接取出 data
    .with(
      { status: "success", data: P.select() },
      (data) => `${data.length} 条`,
    )
    .with({ status: "error" }, (e) => `错误：${e.error.message}`)
    .exhaustive(); // 新增一个 status 而忘了处理 → 编译报错
```

> 这正是相对 `switch` 的最大价值：**新增联合成员时，所有漏处理的 match 立刻编译报错**，把「漏 case」从运行时 bug 变成编译错误。

## 四、isMatching：把模式当类型守卫

`match` 用于选分支取值，`isMatching` 则返回布尔、用于 `if`/`filter` 里收窄类型：

```ts
import { isMatching, P } from "ts-pattern";

// 柯里化：生成可复用的守卫函数
const isBlogPost = isMatching({ type: "blogpost", title: P.string });

if (isBlogPost(value)) {
  // value 被收窄为 { type: 'blogpost'; title: string }
  console.log(value.title);
}

// 两参用法：直接判断
const posts = items.filter((it) => isMatching({ type: "post" }, it));
```

## 五、变长元组

用展开语法把固定元素与 `...P.array(sub)` 组合，匹配「头/尾固定、中间任意多个」的数组：

```ts
import { match, P } from "ts-pattern";

match(tokens)
  .with([P.string, ...P.array()], (t) => t) // 首个是字符串，其后任意
  .with(["print", ...P.array(P.string)], (t) => t) // 'print' 开头，后接任意多个字符串
  .with([...P.array(P.string), "end"], (t) => t) // 以 'end' 结尾
  .with(["start", ...P.array(P.string), "end"], (t) => t) // 首尾固定、中间任意多个字符串
  .otherwise((t) => t);
```

## 六、链式断言：少写 P.when

字符串/数字模式自带断言，常见约束无需手写 `P.when`：

```ts
import { match, P } from "ts-pattern";

match(input)
  .with(P.string.startsWith("http"), () => "URL")
  .with(P.string.regex(/^\d+$/), () => "纯数字串")
  .with(P.number.between(1, 5), () => "1~5 的评分")
  .with(P.number.int().positive(), () => "正整数")
  .otherwise(() => "其它");
```

> 数值断言（`int`/`positive`/`between`…）只影响**运行时**是否命中；TypeScript 没有「正整数」类型，`P.infer` 层面通常仍是 `number`。

---

进入 [指南 · 专家](./expert)：`exhaustive` 穷尽性原理与 `NonExhaustiveError`、`P.infer` 模式即类型、`returnType` 与输出推导、与 Zod 的协作、性能与边界。
