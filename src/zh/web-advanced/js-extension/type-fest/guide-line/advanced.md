---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **type-fest 4.x**。把 type-fest 用进真实场景：字符串类型族（大小写/切分/替换/对象键批量转换）、JSON 类型族（`Jsonify`/`JsonValue`）、异步（`Promisable`/`AsyncReturnType`）、按值条件筛选键。纯类型，`import type` 引入。

## 一、字符串：单个字面量的大小写变换

type-fest 能在**类型层面**把字符串字面量转成各种命名风格，且保留**精确字面量**（不退化成 `string`）：

```ts
import type { CamelCase, SnakeCase, KebabCase, PascalCase } from 'type-fest';

type A = CamelCase<'foo-bar'>;   //=> 'fooBar'
type B = SnakeCase<'fooBar'>;    //=> 'foo_bar'
type C = KebabCase<'fooBar'>;    //=> 'foo-bar'
type D = PascalCase<'foo_bar'>;  //=> 'FooBar'
```

典型用途：把命令行 kebab 参数、数据库 snake_case 列名，在类型上转成 JS 习惯的命名。默认不在数字处断词（`SnakeCase<'p2pNetwork'>` → `'p2p_network'`），可用 `{ splitOnNumbers: true }` 改变。

## 二、字符串：切分与替换

```ts
import type { Split, Replace, Join } from 'type-fest';

type Parts = Split<'a,b,c', ','>;
//=> ['a', 'b', 'c']  （元组，保留每段字面量）

type Path = Join<['user', 'name'], '.'>;
//=> 'user.name'

type T1 = Replace<'hello ??', '?', '❓'>;
//=> 'hello ❓?'        默认只替换第一处

type T2 = Replace<'10:42:00', ':', '-', { all: true }>;
//=> '10-42-00'        带 {all:true} 全部替换
```

`Split` 常用于给 `String.prototype.split` 标注更精确的返回类型，从而保留每段的字面量信息。

## 三、字符串：对象键批量转换

把上面的单字符串变换「升级」到整个对象的**键**——常见于前后端命名风格转换：

```ts
import type { CamelCasedPropertiesDeep, SnakeCasedProperties } from 'type-fest';

// 后端 snake_case 嵌套响应 → 前端 camelCase（递归）
interface ApiUser {
  user_id: number;
  full_name: string;
  address: { zip_code: string };
}
type FrontUser = CamelCasedPropertiesDeep<ApiUser>;
//=> { userId: number; fullName: string; address: { zipCode: string } }

// 只转第一层用不带 Deep 的版本
type T = SnakeCasedProperties<{ isHappy: boolean }>;
//=> { is_happy: boolean }
```

| 变换 | 单字符串 | 对象键（浅） | 对象键（深） |
|---|---|---|---|
| 驼峰 | `CamelCase` | `CamelCasedProperties` | `CamelCasedPropertiesDeep` |
| 蛇形 | `SnakeCase` | `SnakeCasedProperties` | `SnakeCasedPropertiesDeep` |

## 四、JSON：JsonValue 与 Jsonify

`JsonValue` 精确刻画「合法 JSON 值」：

```ts
import type { JsonValue } from 'type-fest';
// JsonValue = (string | number | boolean | null) | JsonObject | JsonArray
// 刻意不含 undefined / function / symbol / Date
```

`Jsonify<T>` 把一个类型转成「经过 `JSON.parse(JSON.stringify(x))` 后」的精确类型——处理 `.toJSON()`（如 `Date` → string）、剔除不可序列化值、把 `interface` 转成可结构比较的 `type`：

```ts
import type { Jsonify } from 'type-fest';

interface Post { id: number; createdAt: Date; render: () => string }
type Wire = Jsonify<Post>;
//=> { id: number; createdAt: string }   Date 变 string，函数被剔除
```

用途：标注「序列化后通过网络传输再 parse 回来」的精确响应类型，避免把 `Date`、方法误当成还在。

## 五、异步：Promisable 与 AsyncReturnType

`Promisable<T> = T | PromiseLike<T>`——表达「回调可同步返回值或返回其 Promise」：

```ts
import type { Promisable } from 'type-fest';

async function logger(get: () => Promisable<string>) {
  console.log(await get());
}
logger(() => 'foo');                 // ✅ 同步
logger(() => Promise.resolve('bar')); // ✅ 异步
```

`AsyncReturnType<F>` 取异步函数解析后的返回类型（解包它返回的 `Promise`）：

```ts
import type { AsyncReturnType } from 'type-fest';

async function fetchUser() { return { id: 1, name: 'Ada' }; }
type User = AsyncReturnType<typeof fetchUser>;
//=> { id: number; name: string }  等价 Awaited<ReturnType<typeof fetchUser>>
```

## 六、按值条件筛选键：Conditional 家族

内置 `Pick`/`Omit` 只能按**键名**选取。要按「值的类型」筛选，用 Conditional 家族：

```ts
import type { ConditionalPick, ConditionalKeys } from 'type-fest';

interface Model { id: number; name: string; tag: string; active: boolean }

type StringFields = ConditionalPick<Model, string>;
//=> { name: string; tag: string }

type StringKeys = ConditionalKeys<Model, string>;
//=> 'name' | 'tag'
```

常用于「只保留所有方法字段」「只保留 string 字段」这类按值类型的子集提取。

## 七、Schema：为每个字段配一份元信息

`Schema<T, V>` 生成与 T **同构**的深层类型，把所有**叶子值**替换成 V——适合表单校验配置、字段级设置：

```ts
import type { Schema } from 'type-fest';

interface User { id: string; name: { first: string; last: string } }

type UserMask = Schema<User, 'show' | 'hide' | 'mask'>;
const mask: UserMask = {
  id: 'show',
  name: { first: 'show', last: 'mask' }, // 嵌套结构一致，叶子全是这三选一
};
```

---

进入 [指南 · 专家](./expert)：`Simplify` 的两大用途与原理、标称类型 `Tagged` 深入、`UnionToIntersection`、`EmptyObject` 陷阱、与同类库取舍、编译性能。
