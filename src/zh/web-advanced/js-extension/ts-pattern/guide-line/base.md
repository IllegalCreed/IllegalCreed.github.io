---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **ts-pattern 5.x**。本篇把「会写 match」用到「懂模式语言」：集合模式（`P.array`/`P.set`/`P.record`）、组合模式（`P.union`/`P.not`/`P.optional`）、守卫 `P.when`，以及类型收窄的基本机制。

## 一、匹配是怎么进行的

跑 `match(value).with(...).with(...).exhaustive()` 时：

1. 从 `match(value)` 拿到输入；
2. 自上而下尝试每个 `.with(pattern, handler)`——**第一个**匹配成功的分支胜出（短路，后续不再尝试）；
3. 执行该分支的 handler，其返回值成为整条表达式的返回值；
4. 末尾 `.exhaustive()` 在编译期检查：输入类型的所有可能是否都被覆盖。

> 关键：**匹配短路 + 顺序敏感**。把更具体的模式写在前、更宽泛的（`P._`、宽条件 `P.when`）写在后，否则宽模式会「截胡」具体分支。

## 二、对象模式与类型收窄

对象模式是结构性的：只校验你列出的键，输入可带额外属性。命中后 handler 参数被收窄：

```ts
import { match, P } from 'ts-pattern';

type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number };

const area = (s: Shape) =>
  match(s)
    .with({ kind: 'circle' }, (c) => Math.PI * c.radius ** 2)  // c: circle 成员
    .with({ kind: 'rect' }, (r) => r.width * r.height)         // r: rect 成员
    .exhaustive();
```

> 在 circle 分支里访问 `c.width` 会编译报错——这正是类型收窄带来的安全：你只能访问当前分支确实拥有的字段。

## 三、集合模式

```ts
import { match, P } from 'ts-pattern';

match(input)
  // 数组：每个元素都满足子模式
  .with(P.array(P.number), (nums) => `数字数组(${nums.length})`)
  // 对象数组
  .with(P.array({ id: P.number }), (rows) => `共 ${rows.length} 行`)
  // 字典：所有键为 string、值为 number
  .with(P.record(P.string, P.number), (scores) => '分数表')
  // Set
  .with(P.set(P.string), () => '字符串集合')
  .otherwise(() => '其它');
```

- `P.array(sub)` 逐元素校验子模式，不限长度（含空数组）；省略 `sub` 则不约束元素。
- `P.record(keySub, valSub)` 面向「动态键的字典」，区别于「固定字段的对象模式」。

## 四、组合模式：union / not / intersection

```ts
import { match, P } from 'ts-pattern';

match(input)
  // 或：命中任一即可
  .with({ type: P.union('user', 'org') }, (x) => x.name)
  // 否定：非布尔值
  .with(P.not(P.boolean), (v) => v)
  // 与：既是 A 实例又有 foo === 'bar'
  .with(P.intersection(P.instanceOf(A), { foo: 'bar' }), (a) => a.foo)
  .otherwise(() => null);
```

- `P.union(...)` 是逻辑或，子模式可为字面量或其它 `P.*`。
- `P.intersection(...)` 是逻辑与，命中后类型取交集，常用于「类身份 + 额外结构约束」。
- `P.not(sub)` 匹配「不满足 sub」的值，配合 exhaustive 能优雅地「先排除一类，再处理其余」。

## 五、可选属性：P.optional

`P.optional` 只在**对象属性**位置有意义——标记某键可缺失，存在则须满足子模式：

```ts
import { match, P } from 'ts-pattern';

const f = (input: { key?: string }) =>
  match(input)
    .with({ key: P.optional(P.string) }, (a) => a.key) // a.key: string | undefined
    .exhaustive();
```

::: warning P.optional ≠ P.nullish
`P.optional` 关注「**键是否存在**」（缺失也命中）；`P.nullish` 关注「**值是否为 null/undefined**」。二者语义不同，别混用。
:::

## 六、守卫：P.when

结构和字面量表达不了的条件（如「大于 5」「长度为偶数」），用 `P.when(predicate)`：

```ts
import { match, P } from 'ts-pattern';

const emoji = (input: { score: number }) =>
  match(input)
    .with({ score: P.when((n) => n >= 90) }, () => '🏆')
    .with({ score: P.when((n) => n < 60) }, () => '😞')
    .otherwise(() => '🙂');
```

谓词返回 `true` 才命中。若写成**类型守卫**（返回 `x is T`），命中分支里还会进一步收窄类型：

```ts
.with({ score: P.when((n): n is 100 => n === 100) }, () => '满分') // n 收窄为字面量 100
```

> 区分两个 when：`P.when` 是**嵌在模式内部**的模式；`.when(predicate, handler)` 是 **match 链上的方法**，对整个输入加条件作为独立分支。

---

进入 [指南 · 进阶](./advanced)：`P.select` 数据提取、带守卫的 `.with`、判别联合与状态机、`isMatching` 类型守卫、变长元组。
