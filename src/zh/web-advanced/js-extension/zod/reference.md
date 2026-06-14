---
layout: doc
outline: [2, 3]
---

# 参考

> Zod **4** 常用 schema、校验方法、转换与错误处理 API 速查。标注 ⚠️ 处为 v3 → v4 变化点。导入统一假定 `import * as z from "zod"`。

## 一、原语与字面量

| API | 说明 |
|---|---|
| `z.string()` `z.number()` `z.boolean()` | 字符串 / 数字 / 布尔 |
| `z.bigint()` `z.date()` `z.symbol()` | 大整数 / 日期对象 / Symbol |
| `z.null()` `z.undefined()` `z.nan()` | null / undefined / NaN |
| `z.any()` `z.unknown()` `z.never()` `z.void()` | 任意 / 未知 / 无 / void |
| `z.literal("tuna")` | 字面量（v4 也支持 `z.literal(["a","b"])`） |
| `z.int()` `z.int32()` | 安全整数 / int32（⚠️ v4 仅安全整数） |

## 二、字符串格式（v4 顶层函数）

⚠️ v4 把格式校验提升为顶层函数，链式 `z.string().email()` 已弃用：

| API | 校验 |
|---|---|
| `z.email()` | 邮箱（可传 `{ pattern: z.regexes.html5Email }` 等） |
| `z.url()` `z.httpUrl()` | URL（可限定 `protocol`/`hostname`） |
| `z.uuid()` `z.uuidv4()` `z.guid()` | UUID / 指定版本 / 宽松 GUID |
| `z.ipv4()` `z.ipv6()` `z.cidrv4()` `z.cidrv6()` | IP / CIDR（⚠️ v4 拆分，`.ip()`/`.cidr()` 已移除） |
| `z.emoji()` `z.nanoid()` `z.cuid2()` `z.ulid()` | 各类 ID / emoji |
| `z.base64()` `z.jwt()` `z.e164()` | base64 / JWT / E.164 电话 |
| `z.iso.date()` `z.iso.time()` `z.iso.datetime()` | ISO 日期/时间字符串 |

## 三、字符串校验与转换（链式）

| 校验 | 转换 |
|---|---|
| `.min(n)` `.max(n)` `.length(n)` | `.trim()` |
| `.regex(/.../)` | `.toLowerCase()` `.toUpperCase()` |
| `.startsWith(s)` `.endsWith(s)` `.includes(s)` | `.normalize()` |
| `.uppercase()` `.lowercase()` | — |

## 四、数字校验

| API | 含义 |
|---|---|
| `.gt(n)` `.gte(n)`（别名 `.min`） | 大于 / 大于等于 |
| `.lt(n)` `.lte(n)`（别名 `.max`） | 小于 / 小于等于 |
| `.int()` | 整数（⚠️ v4 仅安全整数，且拒绝 Infinity） |
| `.positive()` `.nonnegative()` | `>0` / `>=0` |
| `.negative()` `.nonpositive()` | `<0` / `<=0` |
| `.multipleOf(n)`（别名 `.step`） | 倍数 |

## 五、复合类型

```ts
z.object({ name: z.string(), age: z.number() }); // 对象（默认剥离多余键）
z.strictObject({ ... });   // 多余键报错（⚠️ 取代 .strict()）
z.looseObject({ ... });    // 保留多余键（⚠️ 取代 .passthrough()）
z.array(z.string());                 // 数组（.min/.max/.length/.nonempty）
z.tuple([z.string(), z.number()]);   // 元组（定长异构）
z.union([z.string(), z.number()]);   // 联合（链式 .or()）
z.discriminatedUnion("status", [...]); // 判别联合
z.intersection(A, B);                // 交叉（对象优先用 A.extend）
z.enum(["a", "b", "c"]);             // 枚举（⚠️ v4 重载支持 TS enum，z.nativeEnum 已弃用）
z.record(z.string(), z.number());    // ⚠️ v4 必须两参
z.partialRecord(keyEnum, valueSchema); // 允许枚举键缺失
z.map(z.string(), z.number());       // Map
z.set(z.number());                   // Set（.min/.max/.size）
z.instanceof(URL);                   // 类实例
z.custom<T>((v) => ...);             // 自定义判定
```

## 六、可选 / 可空 / 默认 / 兜底

| API | 作用 |
|---|---|
| `.optional()` / `z.optional(s)` | 允许 `undefined` |
| `.nullable()` / `z.nullable(s)` | 允许 `null` |
| `.nullish()` | 允许 `null` 与 `undefined` |
| `.default(v)` | ⚠️ v4：`undefined` 时短路填充，`v` 须匹配输出类型 |
| `.prefault(v)` | 默认值先过解析（v3 `.default()` 旧行为） |
| `.catch(v)` | 校验失败时回退到 `v` |
| `.readonly()` | 类型只读 + 运行时 `Object.freeze` |
| `.brand<"X">()` | 名义类型标记（编译期） |

## 七、对象派生方法

```ts
Schema.shape;                    // 取各字段 schema
Schema.keyof();                  // 键名枚举
Schema.extend({ ... });          // 增字段（⚠️ 取代弃用的 .merge）
Schema.pick({ name: true });     // 只保留
Schema.omit({ id: true });       // 排除
Schema.partial();                // 全部转可选（可传参指定字段）
Schema.required();               // 全部转必填
Schema.catchall(z.string());     // 未声明键的值 schema
```

## 八、校验、转换与组合

| API | 作用 |
|---|---|
| `.refine(fn, { error, path })` | 自定义布尔校验（产生单个 issue，支持 async） |
| `.superRefine((v, ctx) => ...)` | 多 issue / 自定义 code（`ctx.addIssue`） |
| `.transform((v, ctx) => ...)` | 校验后转换；失败用 `ctx.issues.push` + `return z.NEVER` |
| `z.preprocess(fn, schema)` | 校验**前**预处理 |
| `.pipe(next)` | 串联：前一段输出作为后一段输入 |
| `z.coerce.number()` 等 | 强制转换后校验（⚠️ v4 输入为 `unknown`） |
| `z.stringbool()` | "true"/"1"/"yes" → boolean |

## 九、类型推导

| API | 含义 |
|---|---|
| `z.infer<typeof S>` | 输出类型（= `z.output`） |
| `z.input<typeof S>` | 输入类型（有 transform/coerce/default 时与输出不同） |
| `z.output<typeof S>` | 输出类型 |

## 十、错误处理（⚠️ v4 顶层函数）

| API | 作用 |
|---|---|
| `error.issues` | 错误数组（每项 `code`/`path`/`message`，⚠️ `error.errors` 已移除） |
| `z.treeifyError(error)` | 嵌套错误树（取代 `error.format()`） |
| `z.flattenError(error)` | `{ formErrors, fieldErrors }`（取代 `error.flatten()`） |
| `z.prettifyError(error)` | 人类可读多行字符串 |
| `z.config({ customError })` | 全局错误映射（⚠️ 取代 `z.setErrorMap`） |
| `z.config(z.locales.en())` | 加载内置语言包 |

## 十一、元数据与 JSON Schema（v4 内置）

| API | 作用 |
|---|---|
| `.meta({ id, title, description })` | 登记元数据进 `z.globalRegistry`（返回新 schema） |
| `.describe("...")` | 仅设 description 的简写 |
| `z.registry<Meta>()` | 自定义注册表 |
| `z.toJSONSchema(schema, opts)` | 转 JSON Schema（`target`/`io`/`unrepresentable`/`override`） |

---

命令查完，进 [指南 · 基础](./guide-line/base) 理解构件，或 [指南 · 进阶](./guide-line/advanced) 看 refine / transform / pipe / 生态实战。
