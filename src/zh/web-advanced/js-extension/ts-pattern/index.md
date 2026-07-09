---
layout: doc
---

# ts-pattern

::: tip 本篇范围
本篇聚焦 **ts-pattern —— TypeScript 的类型安全模式匹配库**。它与 Zod / Valibot（运行时数据校验）、type-fest（类型工具）同属「让 TypeScript 更好用」的方向，但定位不同：ts-pattern 解决的是「**控制流**」——对已知类型的值做分支选择并收窄类型。版本基线 **ts-pattern 5.x**（5.9.0，`P.array` 变长元组、`P.string`/`P.number` 链式断言、`isMatching`、`P.infer` 等已稳定）。
:::

ts-pattern 由 Gabriel Vergnaud 创建，官方定位是「**The exhaustive Pattern Matching library for TypeScript**」。它把函数式语言里的「模式匹配（pattern matching）」带进 TypeScript：用一条 `match(value).with(pattern, handler).exhaustive()` 表达式，替代层层嵌套的 `if/else` 与 `switch`。核心卖点不是运行性能，而是**类型安全**——每个 `.with` 分支命中后，handler 拿到的值会被**精确收窄**到对应类型；末尾的 `.exhaustive()` 还能在**编译期**检查你是否漏掉了联合类型的某个分支，漏了就直接报类型错误。

它最该被记牢的几条「现状」：**通配符是 `P._`，`P.any` 是它的别名**（二者完全等价，别误以为是两种东西）；**`.exhaustive()` 做编译期穷尽检查**（漏分支编译报错，是高频考点），`.otherwise(handler)` 等价于 `.with(P._, handler).exhaustive()`、用通配兜底放宽穷尽要求，`.run()` 则**不做**穷尽检查、属于不安全执行；**`P.select()` 提取匹配片段**——匿名 select 把选中值作为 handler 第一个参数，命名 `P.select('name')` 把多处选中值汇成对象传入；**`P.when` 接自定义守卫**，写成类型守卫（`x is T`）还能进一步收窄；**匹配自上而下短路**，第一个命中的分支胜出，所以 `P._` 兜底必须放最后。它是个**轻量运行时库**（约 ~2kB、`sideEffects: false`），开箱即用，无需任何 babel 宏或编译插件。

## 评价

**优点**

- **一条表达式替代深层条件**：`match().with().exhaustive()` 把结构、范围、守卫等复杂条件压成单条可读表达式，比 `if/else`/`switch` 更紧凑
- **编译期穷尽性检查**：`.exhaustive()` 在漏掉联合分支时编译报错（`NonExhaustiveError`），新增联合成员时所有未覆盖的 match 立刻飘红——把「漏 case」从运行时 bug 变成编译错误
- **自动类型收窄**：命中某分支后 handler 参数被精确收窄到对应成员，访问不属于该分支的字段会编译报错，无需手动 `as` 断言
- **判别联合的主场**：处理 `{ status: 'loading' } | { status: 'success'; data } | { status: 'error'; error }` 这类状态时优雅自然，配 select/guard 极顺手
- **丰富的模式语言**：`P.string`/`P.number`/`P.boolean`/`P.array`/`P.union`/`P.optional`/`P.when`/`P.select`/`P.instanceOf`/`P.not`/`P.intersection`/`P.record`，还有 `P.string.startsWith`、`P.number.between` 等链式断言
- **数据提取免解构**：`P.select()` 直接从深层结构里挑出值注入 handler，省去手动逐层解构
- **模式即类型来源**：`P.infer<typeof pattern>` 由模式反推数据类型，避免模式与类型声明两处重复维护
- **轻量、零额外工具链**：约 ~2kB 运行时、`sideEffects: false` 可 tree-shaking，标准 TS 工程直接可用，无需编译插件
- **TypeScript 友好**：原生用 TS 编写，类型推导深入，`isMatching` 还能当类型守卫用于 `if`/`filter`

**缺点**

- **编译时间成本**：官方明确穷尽检查是「可选的」，且因更多类型检查工作可能带来略长的编译时间——超大联合、超深嵌套场景尤其明显（影响编译期而非运行时）
- **学习曲线**：`P` 命名空间下模式众多，`P._` 与 `P.any`、`P.optional` 与 `P.nullish`、`.when` 与 `P.when` 等容易混淆，初学需要建立心智模型
- **顺序敏感**：分支自上而下短路，把宽泛模式（`P._`、宽条件 `P.when`）写在前会「截胡」后续具体分支，需自觉把具体模式放前
- **并非银弹**：对简单的单值判断，原生 `switch`/`if` 仍然合适，不必强行替换；它的价值集中在「复杂结构 + 需要穷尽保证」的场景
- **运行时不做 schema 校验**：它处理「已知类型的值」，不验证「未知输入」——那是 Zod/Valibot 的职责，二者互补而非替代
- **类型报错可能晦涩**：复杂模式不匹配时，TypeScript 给出的错误信息有时较长、定位需要经验

## 文档地址

[ts-pattern README](https://github.com/gvergnaud/ts-pattern#readme)

## GitHub 地址

[gvergnaud/ts-pattern](https://github.com/gvergnaud/ts-pattern)

## 幻灯片地址

<a href="/SlideStack/ts-pattern-slide/" target="_blank">ts-pattern</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=ts-pattern" target="_blank" rel="noopener noreferrer">ts-pattern 测试题</a>
