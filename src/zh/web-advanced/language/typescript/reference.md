---
layout: doc
outline: [2, 3]
---

# 参考：TypeScript 速查与对照表

> 基于 TypeScript 6.0 · 核于 2026-07

## 速查

- **定位**：JS 超集 + 静态类型 + 编译期检查；类型**运行时擦除**。当前稳定版 **6.0**（`latest` 6.0.3），7.0 为 Go 原生重写。
- **结构化类型**：按形状兼容；对象字面量有**多余属性检查**（freshness）。
- **特殊类型**：`any`（放行）/`unknown`（安全顶层，先收窄）/`never`（空集底类型）/`void`（无返回）。
- **组合类型**：联合 `A | B` / 交叉 `A & B` / 字面量 `'a' | 1` / 元组 `[string, number]`。
- **类型运算符**：`keyof` / 类型位置 `typeof` / 索引访问 `T[K]` / 条件 `T extends U ? X : Y` / `infer` / 映射 `{ [K in keyof T]: ... }` / 模板字面量。
- **窄化**：`typeof`（⚠️`null`→`object`）/真值/相等/`in`/`instanceof`/类型谓词 `x is T`/断言函数 `asserts x is T`/可辨识联合 + `never` 穷尽。
- **`interface` 独有**声明合并；**`type` 独有**联合/元组/条件/映射命名。
- **`as const`** 收窄为只读字面量；**`satisfies`（4.9）** 校验且保留精确推断。
- **strict 家族**：`noImplicitAny`/`strictNullChecks`/`strictFunctionTypes` 等；新项目全开。
- **枚举取舍**：`enum` > 慎用 `const enum`（`isolatedModules` 冲突） > 优先 `as const` 对象。

## 一、类型速查

| 类别 | 写法 | 说明 |
| --- | --- | --- |
| 原始 | `string` `number` `boolean` `bigint` `symbol` | 一律小写 |
| 空值 | `null` `undefined` `void` | `void` = 无返回值 |
| 顶/底 | `unknown` `any` `never` | `unknown` 安全、`never` 空集 |
| 对象 | `{ x: number; y?: string }` | `?` 可选、`readonly` 只读 |
| 数组 | `number[]` / `Array<number>` | 两者等价 |
| 元组 | `[string, number]` | 定长、逐位置定类型 |
| 联合 | `A` \| `B` | 「或」，用前需收窄 |
| 交叉 | `A & B` | 「与」，合并对象 |
| 字面量 | `'left'` \| `'right'`，`200` \| `404` | 精确取值 |
| 函数 | `(a: number) => string` | 箭头写法 |

## 二、类型运算符速查

| 运算符 | 示例 | 结果/用途 |
| --- | --- | --- |
| `keyof` | `keyof {a;b}` | `"a"` \| `"b"`（键联合） |
| `typeof`（类型位） | `typeof config` | 取值的静态类型 |
| 索引访问 | `User["name"]` | 属性类型 |
| 值联合 | `T[keyof T]` | 所有值类型的联合 |
| 数组元素 | `T[number]` | 数组/元组元素类型 |
| 条件 | `T extends U ? X : Y` | 类型级三元 |
| `infer` | `T extends Array<infer E> ? E : T` | 捕获内部类型 |
| 映射 | `{ [K in keyof T]: T[K] }` | 遍历键造类型 |
| 修饰符 | `-readonly` `-?` | 增删只读/可选 |
| 键重映射 | `` `[K in keyof T as `...`]` `` | 改键名/过滤 |
| 模板字面量 | `` `/${Lang}/${Kind}` `` | 类型级字符串 |

## 三、内置工具类型清单

| 工具类型 | 参数 | 作用 |
| --- | --- | --- |
| `Partial<T>` | 1 | 全部属性变可选 |
| `Required<T>` | 1 | 全部属性变必填 |
| `Readonly<T>` | 1 | 全部属性变只读 |
| `Record<K, V>` | 2 | 构造键 K 值 V 的对象 |
| `Pick<T, K>` | 2 | 保留键 K（白名单） |
| `Omit<T, K>` | 2 | 排除键 K（黑名单） |
| `Exclude<U, M>` | 2 | 联合中剔除可赋给 M 的成员 |
| `Extract<U, M>` | 2 | 联合中提取可赋给 M 的成员 |
| `NonNullable<T>` | 1 | 去 `null` / `undefined` |
| `Parameters<T>` | 1 | 函数参数元组 |
| `ConstructorParameters<T>` | 1 | 构造参数元组 |
| `ReturnType<T>` | 1 | 函数返回类型 |
| `InstanceType<T>` | 1 | 构造函数实例类型 |
| `Awaited<T>` | 1 | 递归解包 `Promise` |
| `NoInfer<T>` | 1 | 阻断该处类型推断 |
| `Uppercase/Lowercase` | 1 | 字符串字面量大小写 |
| `Capitalize/Uncapitalize` | 1 | 首字母大小写 |

## 四、窄化守卫速查

| 守卫 | 示例 | 备注 |
| --- | --- | --- |
| `typeof` | `typeof x === "number"` | ⚠️ `typeof null === "object"` |
| 真值 | `if (x)` | 排除 `0`/`""`/`0n`/`NaN`/`null`/`undefined` |
| 相等 | `x != null` | 一次排除 `null` + `undefined` |
| `in` | `"swim" in animal` | 按属性存在收窄 |
| `instanceof` | `x instanceof Date` | 按原型链收窄 |
| 类型谓词 | `p is Fish` | 自定义可复用守卫 |
| 断言函数 | `asserts x is string` | 通过后此后收窄 |
| 可辨识联合 | `switch (s.kind)` | 字面量判别属性 |
| 穷尽 | `const _c: never = s` | 漏分支编译报错 |

## 五、interface vs type

| 维度 | `interface` | `type` |
| --- | --- | --- |
| 对象形状 | ✅ | ✅ |
| 声明合并 | ✅ | ❌ 同名报错 |
| 扩展 | `extends` | 交叉 `&` |
| 联合 | ❌ | ✅ |
| 元组/原始别名 | ❌ | ✅ |
| 条件/映射/模板类型 | ❌ | ✅ |

> 经验：对象公开形状、需 `extends`/合并 → `interface`；联合/元组/条件/映射 → `type`。

## 六、tsconfig 关键项对照

| 选项 | 常用值 | 说明 |
| --- | --- | --- |
| `strict` | `true` | 严格家族总闸，新项目必开 |
| `target` | `es2022` / `esnext` | 产物语法级别 |
| `lib` | `["es2023","dom"]` | 内置 API 类型 |
| `module` | `esnext` / `nodenext` / `node20` | 产物模块格式 |
| `moduleResolution` | `bundler` / `nodenext` | 解析策略（打包器 → `bundler`） |
| `paths` | `{"@/*":["src/*"]}` | 别名，运行时需配套 |
| `esModuleInterop` | `true`（6.0 恒开） | CJS 默认导入互操作 |
| `noUncheckedIndexedAccess` | `true`（推荐） | 索引访问带 `undefined` |
| `verbatimModuleSyntax` | `true`（推荐） | 精确控制 import 擦除 |

## 七、枚举取舍对照

| 方案 | 运行时对象 | 反向映射 | 主要坑 | 建议 |
| --- | --- | --- | --- | --- |
| `enum`（数字） | 有 | 有 | 运行时体积 | 需要运行时枚举对象时用 |
| `enum`（字符串） | 有 | 无 | — | 调试友好，可用 |
| `const enum` | 无（内联） | — | 与 `isolatedModules` 冲突、跨包版本坑 | 谨慎/禁用 |
| `as const` 对象 | 有（普通对象） | 手写 | — | **优先推荐** |

## 八、常见错误对照

| 现象 | 根因 | 解法 |
| --- | --- | --- |
| `对象可能为 null` | 开了 `strictNullChecks` | 先判空/可选链，别乱用 `!` |
| 多余属性报错 | 对象字面量 freshness | 检查拼写，或先赋给变量 |
| `Type 'string' is not assignable to '"GET"'` | 字面量被拓宽 | 用 `as const` / `satisfies` |
| 联合类型属性访问报错 | 未收窄 | `typeof`/`in`/可辨识联合 |
| `Cannot find module '@/x'` | `paths` 只改类型 | 配打包器别名/`tsconfig-paths` |
| `const enum` 转译报错 | 与 `isolatedModules` 冲突 | 改普通 `enum` 或 `as const` 对象 |
| 装饰器不生效 | 未开对应模式 | 旧版开 `experimentalDecorators` |
| 运行时类型没校验 | 类型被擦除 | 用 Zod/Valibot 做运行时校验 |

## 九、版本要点（6.0 / 7.0）

- **6.0（当前稳定，`latest` 6.0.3）**：过渡版。默认 `strict:true` / `module:esnext` / `target` 当年 ES / `types:[]`；弃用 `es5`、`amd/umd/system`、`moduleResolution node10`/`classic`、`outFile`、`baseUrl`；`esModuleInterop` 等恒开；`"ignoreDeprecations":"6.0"` 可缓冲。
- **7.0**：Go 原生重写（tsgo / Project Corsa），并行类型检查、数量级提速；移除 6.0 中弃用的选项。
- **里程碑回顾**：`as const`（3.4）、可选链/空值合并（3.7）、模板字面量类型（4.1）、键重映射（4.1）、`satisfies`（4.9）、标准装饰器/`const` 类型参数（5.0）、`using`/显式资源管理（5.2）、`--module node20`/`import defer`（5.9）。

## 十、权威链接

- [TypeScript 官网](https://www.typescriptlang.org/) ｜ [Playground](https://www.typescriptlang.org/play)
- [Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) —— 官方权威教程
- [TSConfig Reference](https://www.typescriptlang.org/tsconfig/) —— 全部编译选项
- [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html) —— 内置工具类型
- [Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/) —— 各版本变化
- [microsoft/TypeScript](https://github.com/microsoft/TypeScript) —— 源码与 issue
- [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) —— `@types/*` 类型仓库
- [type-challenges](https://github.com/type-challenges/type-challenges) —— 类型体操练习
- [MDN: JavaScript](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript) —— TS 的底座
