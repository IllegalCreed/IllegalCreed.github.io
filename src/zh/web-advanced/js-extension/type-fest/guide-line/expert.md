---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **type-fest 5.8.0**。深入原理与权衡：`Simplify` 的两大用途、标称类型 `Tagged`（及 `Opaque` 废弃）、`UnionToIntersection`、`EmptyObject` 陷阱、按路径访问（`Get`/`Paths`）、与同类库的取舍、编译期性能。纯类型，推荐 `import type` 引入。

## 速查

- `Simplify<T>` 摊平映射结果并可把可声明合并的 interface 映射成封闭对象类型
- `Tagged<Base, Name, Meta?>` 支持多标签与元数据；tagged 值可赋给 base，反向需显式构造或断言
- `Opaque` / `UnwrapOpaque` 仍导出但已 deprecated；迁移到 `Tagged` / `UnwrapTagged`
- `UnionToIntersection<U>` 把联合成员合并成交叉，复杂联合可能增加类型实例化成本
- `{}` 不是空对象类型；严格空对象用 `EmptyObject`
- `Paths<T>` 生成路径联合，`Get<T, P>` 取路径类型；深大对象上使用前应观察编辑器性能
- type-fest 没有运行时代码，但 5.8.0 仍要求 Node.js ≥20、TypeScript ≥5.9、ESM 与 strict

## 一、Simplify 的两大用途与原理

`Simplify<T> = {[K in keyof T]: T[K]} & {}`。看似什么都没做，实则有两大用途：

**① 摊平交叉、改善悬浮提示**：包住 `A & B` 后，编辑器悬浮显示成合并好的单个对象，而不是 `A & B & …` 一长串。

**② 把 interface 密封成 type**：TS 中 **interface 可被声明合并「再次打开」**追加属性，所以编译器不敢断定一个 interface 满足 `Record<string, unknown>` 这类带索引签名的约束。而 **type 是密封的**。`Simplify<SomeInterface>` 等价转成 type，从而通过：

```ts
import type { Simplify } from 'type-fest';

interface SomeInterface { foo: number; bar?: string }
function fn(o: Record<string, unknown>): void {}

const v: SomeInterface = { foo: 1 };
// fn(v);                          // ❌ interface 可再开，缺索引签名
fn(v as Simplify<SomeInterface>);  // ✅ 转成密封的 type 即可
```

> 深层版 `SimplifyDeep` 递归摊平嵌套对象。

## 二、标称类型 Tagged：原理与可赋值规则

`Tagged<Type, TagName, TagMetadata = never> = Type & Tag<TagName, TagMetadata>`。标签基于一个虚拟的 `unique symbol`，**仅存在于类型层面**，运行时没有任何字段。

关键认知——**底层类型未被隐藏**（这与某些语言里「完全不透明」的 opaque 不同）：

```ts
import type { Tagged } from 'type-fest';

type AccountNumber = Tagged<number, 'AccountNumber'>;

const acc = 2 as AccountNumber;
const x = acc + 2;        // ✅ tagged 值可当 number 用（单向：tagged → number 自由）
// const y: AccountNumber = 2; // ❌ 反向需断言（number → tagged 不可隐式）
```

`Tagged` 相比已废弃的 `Opaque` 多两项能力：**① 多标签**（对同一类型多次应用 `Tagged` 叠加）；**② 每标签可带元数据**（`TagMetadata`，用 `GetTagMetadata` 取出）。可赋值规则：A 可赋给 B 当且仅当——底层可赋值、A 含 B 的全部标签、且各标签元数据可赋值。

```ts
type Url = Tagged<string, 'URL'>;
type CacheKey = Tagged<Url, 'CacheKey'>; // 叠加第二个标签
```

::: warning Opaque 的坑（为何改用 Tagged）
`Opaque` 已 **deprecated**。它只支持单 token，且**不传 token 时不同名类型无法区分**——`type A = Opaque<string>; type B = Opaque<string>` 二者底层都是 `string & {__opaque__: unknown}`，可互相赋值，形同虚设。必须显式传不同 token 才区分。`Tagged` 强制要求给 tag 名，从根上避免这个坑。还原用 `UnwrapTagged`（旧名 `UnwrapOpaque`）。
:::

## 三、UnionToIntersection：联合转交叉

利用「函数参数位置上的联合会变成交叉」这一逆变特性，把联合合并成「全都有」的交叉：

```ts
import type { UnionToIntersection } from 'type-fest';

type U = { a(): void } | { b(arg: string): void } | { c: boolean };
type I = UnionToIntersection<U>;
//=> { a(): void; b(arg: string): void; c: boolean }
```

常用于把一组对象类型合并成同时拥有全部成员的形态。它也是许多更复杂类型的内部基石。

## 四、EmptyObject：弥补 {} 的陷阱

`{}` 在 TS 里表示「除 null/undefined 外的任何值」——`42`、`[]`、`{a:1}` 都能赋给它，**根本不能表示空对象**。`EmptyObject`（基于内部 `unique symbol`：`{[emptyObjectSymbol]?: never}`）才是严格空对象：

```ts
import type { EmptyObject } from 'type-fest';

const ok: EmptyObject = {};      // ✅ 只有真正的 {} 才行
// const a: EmptyObject = 42;    // ❌
// const b: EmptyObject = [];    // ❌
// const c: EmptyObject = {a:1}; // ❌
```

> 文档指出 `Record<string, never>`、`Record<never, never>` 等替代写法都不奏效，所以才需要这个专门类型。

## 五、按路径访问：Get 与 Paths

`Get<T, Path>` 按点路径（含数组下标）取深层属性类型；`Paths<T>` 生成所有可达路径的联合。二者搭档可做出**类型安全 + 带补全**的「按路径访问」API：

```ts
import type { Get, Paths } from 'type-fest';

interface State { user: { profile: { name: string } }; items: number[] }

type Name = Get<State, 'user.profile.name'>;  //=> string
type AllPaths = Paths<State>;                 //=> 'user' | 'user.profile' | 'user.profile.name' | 'items' | ...

declare function read<P extends Paths<State>>(path: P): Get<State, P>;
read('user.profile.name'); // 返回 string，且 path 有自动补全
```

## 六、与同类库取舍 & 编译性能

**与同类库**：`ts-toolbelt`、`utility-types` 等同属补充内置工具的**纯类型库**，定位相近、功能有重叠。选型按 **API 覆盖 / 维护活跃度 / 文档质量 / 团队习惯** 综合判断，通常**择一为主**避免概念重复。type-fest 以维护活跃、用例文档完善、单一职责的 essential 类型见长。

**编译性能**：type-fest 零运行时，对运行时与 bundle 体积**零影响**。代价主要在**编译期**——极复杂的递归类型（深层变换、长路径推导、`UnionToTuple` 等）会增加 `tsc`/编辑器的类型实例化负担。同时，5.8.0 的 Node、TypeScript、ESM 和 strict 要求仍会约束工具链。实践建议：

| 手段 | 说明 |
|---|---|
| 按需引入 | 只 `import type` 用到的类型，别整包习惯性引一堆 |
| 慎用超深递归 | 对超大/深层对象用 `Get`/`Paths`/`*Deep` 时留意编译耗时 |
| 优先内置 | 内置 `Partial`/`Pick` 能搞定的简单变换不必引依赖 |
| 关注废弃 | 跟进 `Opaque`→`Tagged` 这类迁移，避免用到已废弃类型 |

## 七、辨析：type-fest ≠ 运行时校验库

最后强调本系列贯穿的边界：

- **type-fest**（本篇）：纯**编译期类型**——深层变换、标称类型、字符串/JSON 类型变换……编译后零代码。
- **zod / valibot**：**运行时校验**——检查用户输入是否合法（邮箱、范围…），会生成运行时代码。

二者是两个维度，常**配合**使用：用 zod 在边界校验数据，用 type-fest 在内部做精细的类型变换。把这条记牢，就不会指望 type-fest 去「校验数据」，也不会用 zod 去做纯类型的深层变换。

---

回到 [入门](../getting-started) 复习核心心智，或查 [参考](../reference) 速览全部常用类型。
