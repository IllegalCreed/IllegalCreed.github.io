---
layout: doc
outline: [2, 3]
---

# 参考

> Valibot 常用 schema / action / method、Zod 映射与关键数字速查。版本基线 **Valibot 1.4.2**。

## 速查

- 环境：Valibot `1.4.2`，零依赖，ESM / CommonJS 双入口，`sideEffects: false`，分发目标 ES2020
- TypeScript 最低 `5.0.2`；建议开启 `strict`；通配符与具名导入都可被 tree-shake
- 解析：`v.parse` 抛 `ValiError`，`v.safeParse` 返回 `{ typed, success, output, issues }`；常规业务先判断 `success`
- pipeline：`v.pipe(schema, ...items)` 最多接 19 个后续项；action 按顺序执行，异步链使用全套 `Async` API
- 对象：`object` 剔除未知键、`strictObject` 拒绝、`looseObject` 保留、`objectWithRest` 校验其余值
- `forward` 是包装 validation action 的 method；它只转发 issue 路径，实际判断由 `check` / `partialCheck` 等 action 完成
- 类型：`InferInput` / `InferOutput`；默认值、transform、brand、readonly 会让输入输出出现差异
- 体积和性能数字只用于理解取舍；生产选择应同时测 bundle、启动、真实数据校验与框架集成

## 一、安装与导入

| 场景                      | 命令 / 写法                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Node（npm/pnpm/yarn/bun） | `npm install valibot` / `pnpm add valibot` / `yarn add valibot` / `bun add valibot` |
| JSR（Node/Deno/Bun）      | `npx jsr add @valibot/valibot`                                                      |
| 通配符导入（推荐）        | `import * as v from 'valibot'`                                                      |
| 具名导入                  | `import { string, pipe, email } from 'valibot'`                                     |

> 自带 TS 类型；**零运行时依赖**；ESM + CommonJS 双格式；需 TypeScript ≥ 5.0.2 且建议开 `strict`。通配符与具名导入**摇树效果一致**。

## 二、解析与类型（method / 工具类型）

| 用途                                 | 写法                                                               |
| ------------------------------------ | ------------------------------------------------------------------ |
| 解析（失败抛 `ValiError`）           | `v.parse(Schema, data)`                                            |
| 安全解析（返回结果对象）             | `v.safeParse(Schema, data)` → `{ typed, success, output, issues }` |
| 类型守卫（无 issue、不转换、仅同步） | `v.is(Schema, data)`                                               |
| 断言（失败抛错）                     | `v.assert(Schema, data)`                                           |
| 可复用解析函数                       | `v.parser(Schema)` / `v.safeParser(Schema)`                        |
| 异步解析                             | `v.parseAsync` / `v.safeParseAsync`                                |
| 输出类型（常用，≈ `z.infer`）        | `v.InferOutput<typeof Schema>`                                     |
| 输入类型                             | `v.InferInput<typeof Schema>`                                      |
| issue 类型                           | `v.InferIssue<typeof Schema>`                                      |

## 三、常用 schema

| 分类      | 函数                                                                                                                                         |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 基础      | `string` `number` `boolean` `bigint` `date` `symbol` `null`(`null_`) `undefined`(`undefined_`) `any` `unknown` `never` `void`(`void_`) `nan` |
| 复合      | `object` `strictObject` `looseObject` `objectWithRest` `array` `tuple` `record` `map` `set` `blob` `file` `instance`                         |
| 联合/组合 | `union` `variant` `intersect` `literal` `picklist` `enum`(`enum_`) `lazy`                                                                    |
| 包装      | `optional` `nullable` `nullish` `undefinedable` `exactOptional` `nonOptional` `nonNullable` `nonNullish`                                     |

## 四、常用 action（放进 `pipe`）

| 类别       | 函数                                                                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 字符串校验 | `email` `url` `uuid` `regex` `nonEmpty` `minLength` `maxLength` `length` `startsWith` `endsWith` `includes` `ip` `isoDate` `isoTimestamp` |
| 数值校验   | `integer` `minValue` `maxValue` `gtValue` `ltValue` `multipleOf` `finite` `safeInteger`                                                   |
| 自定义校验 | `check` `partialCheck` `rawCheck`                                                                                                         |
| 转换       | `trim` `trimStart` `trimEnd` `toLowerCase` `toUpperCase` `toMinValue` `toMaxValue` `transform` `rawTransform`                             |
| 类型转换   | `toNumber` `toBigint` `toDate` `toBoolean` `parseJson`                                                                                    |
| 类型标注   | `brand` `readonly` `flavor`                                                                                                               |
| 元数据     | `title` `description` `metadata` `examples`                                                                                               |

## 五、对象 / 派生 / pipeline method

| 用途                   | 写法                                                                |
| ---------------------- | ------------------------------------------------------------------- |
| 取子集（≈ Pick）       | `v.pick(Schema, ['a', 'b'])`                                        |
| 去键（≈ Omit）         | `v.omit(Schema, ['a'])`                                             |
| 全部可选（≈ Partial）  | `v.partial(Schema)`                                                 |
| 全部必填（≈ Required） | `v.required(Schema)`                                                |
| 键名联合               | `v.keyof(Schema)`                                                   |
| 拆包装取内层 schema    | `v.unwrap(Schema)`                                                  |
| 兜底值（≈ catch）      | `v.fallback(Schema, value)`                                         |
| 取默认值               | `v.getDefault(Schema)` / `v.getDefaults(Schema)`                    |
| 取兜底值               | `v.getFallback(Schema)` / `v.getFallbacks(Schema)`                  |
| 转发 issue 路径        | `v.forward(validationAction, path)`                                 |
| issue 分组/汇总        | `v.flatten(issues)` / `v.summarize(issues)` / `v.getDotPath(issue)` |

## 六、Zod → Valibot 映射

| Zod                                          | Valibot                                         |
| -------------------------------------------- | ----------------------------------------------- |
| `z.string().email().min(5)`                  | `v.pipe(v.string(), v.email(), v.minLength(5))` |
| `Schema.parse/safeParse(x)`                  | `v.parse/safeParse(Schema, x)`                  |
| `z.infer` / `z.input`                        | `v.InferOutput` / `v.InferInput`                |
| `.optional()` / `.nullable()` / `.nullish()` | `v.optional()` / `v.nullable()` / `v.nullish()` |
| `z.enum([...])`                              | `v.picklist([...])`                             |
| `z.nativeEnum(E)`                            | `v.enum(E)`                                     |
| `z.or` / `z.and`                             | `v.union` / `v.intersect`                       |
| `.refine()`                                  | `v.check()` / `v.forward(v.partialCheck(...))`  |
| `.transform()`                               | `v.transform()`（在 pipe 内）                   |
| `.catch()`                                   | `v.fallback()`                                  |
| `.strict()` / `.passthrough()`               | `v.strictObject()` / `v.looseObject()`          |
| `z.discriminatedUnion('t', [...])`           | `v.variant('t', [...])`                         |
| `z.lazy()`                                   | `v.lazy()`                                      |
| 自动迁移                                     | `npx @valibot/zod-to-valibot`                   |

## 七、异步约定

| 同步                    | 异步                                   |
| ----------------------- | -------------------------------------- |
| `pipe` `object` `array` | `pipeAsync` `objectAsync` `arrayAsync` |
| `check` `transform`     | `checkAsync` `transformAsync`          |
| `parse` `safeParse`     | `parseAsync` `safeParseAsync`          |

> 规则：异步函数只能嵌在异步函数里；同步可嵌在异步里。能同步就同步。

## 八、关键数字与事实

| 项               | 值                                                           |
| ---------------- | ------------------------------------------------------------ |
| 当前核验版本     | 1.4.2                                                        |
| bundle 起步      | < 700 字节                                                   |
| 对比标准 Zod     | 约小 90%（官方登录表单 schema 示例）                         |
| 对比 Zod Mini    | 约小 73%                                                     |
| 运行时速度       | 官方口径：约 Zod v3 的 2 倍、接近 Zod v4，慢于 Typia/TypeBox |
| 运行时依赖       | 0                                                            |
| 产物格式         | ESM + CommonJS，`sideEffects: false`                         |
| `pipe` 上限      | schema 后最多再接 19 个 schema/action                        |
| `safeParse` 返回 | `{ typed, success, output, issues }` 三态联合                |

## 相关链接

- [官方文档](https://valibot.dev)
- [GitHub](https://github.com/fabian-hiller/valibot)
- [从 Zod 迁移](https://valibot.dev/guides/migrate-from-zod/)
- <a href="/SlideStack/valibot-slide/" target="_blank">配套幻灯片</a>
