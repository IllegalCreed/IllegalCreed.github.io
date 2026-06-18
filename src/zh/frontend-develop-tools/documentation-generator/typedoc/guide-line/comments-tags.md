---
layout: doc
outline: [2, 3]
---

# 注释与标签体系

> 基于 TypeDoc 0.28.x 编写

## 速查

- 注释正文**支持 Markdown**（markdown-it 渲染），围栏代码块用 Shiki 高亮（仅围栏，不认缩进式）
- `commentStyle` 默认 `jsdoc`（只认 `/** */`），可选 `block` / `line` / `triple-slash` / `all`
- 标签分**三类**：**Block 块标签**（`@param` 独占段落）、**Modifier 修饰标签**（`@internal` 纯开关无内容）、**Inline 内联标签**（`{@link}` 嵌在文字里）
- 三类各有白名单可扩展：`blockTags` / `inlineTags` / `modifierTags`
- `@example` 在 **0.28 语义变了**：无围栏时整段当代码；旧版"具名示例（首行当标题）"已移除
- `@module`（可重命名模块）vs `@packageDocumentation`（不能重命名），都须放文件第一个注释块、import 之前
- `{@inheritDoc}` 只复制 summary / `@remarks` / `@param` / `@typeParam` / `@returns`，不复制 `@example`/`@deprecated`
- `jsDocCompatibility`（默认全开）控制 `@example` 无围栏当代码、`@default` 当 `@defaultValue` 别名等宽松兼容
- 含 `@license` 或 `@import` 的注释会被**忽略**（不当声明文档）

## commentStyle 与注释发现

TypeDoc 用自带的极简 parser 抽取 TSDoc/JSDoc 标签，识别代码块（避免把装饰器当注释），再用 markdown-it 渲染正文。

```ts
/**
 * 这段注释 _支持_ [Markdown](https://www.markdownguide.org/)
 */
export class DocumentMe {}
```

`commentStyle` 决定哪些注释被识别（默认 `jsdoc`）：

| 值              | 识别的注释                          |
| --------------- | ----------------------------------- |
| `jsdoc`（默认） | 只认 `/** ... */`（双星开头块注释） |
| `block`         | 所有 `/* ... */` 块注释             |
| `line`          | `// ...` 行注释                     |
| `triple-slash`  | `/// ...`                           |
| `all`           | 以上全要                            |

**注释发现位置**：声明前的注释、父节点上的注释、联合类型各分支前的注释、`export` specifier 上的注释。

::: warning 这些注释会被忽略
含 `@license` 或 `@import` 的注释会被 TypeDoc 忽略，不当作声明的文档。代码高亮只支持围栏代码块，缩进式不行。
:::

## 三类标签的区别（核心考点）

这是 TypeDoc 注释体系最重要的概念。同一个 `@` 标签属于哪一类，决定了它的写法和作用：

| 类别              | 形式                          | 作用                       | 例子                                              |
| ----------------- | ----------------------------- | -------------------------- | ------------------------------------------------- |
| **Block 块标签**  | `@tag` 后跟一段文本，独占段落 | 把文档分节 / 描述某方面    | `@param`、`@returns`、`@remarks`、`@example`、`@typeParam`、`@category` |
| **Modifier 修饰标签** | 纯开关，**无内容**          | 改变反射的处理/可见性/分类 | `@internal`、`@hidden`、`@alpha`、`@beta`、`@readonly`、`@overload` |
| **Inline 内联标签** | `{@tag ...}`，嵌在段落文字里 | 链接 / 继承 / 内容包含     | `{@link}`、`{@inheritDoc}`、`{@label}`、`{@include}` |

三类各有一个可配置白名单（在 JS 配置里扩展数组以加自定义标签）：`blockTags` / `inlineTags` / `modifierTags`。相关的解析控制选项：

| 选项                    | 作用                                                         |
| ----------------------- | ------------------------------------------------------------ |
| `cascadedModifierTags`  | 会**级联传给所有子反射**的修饰标签（典型 `@alpha`/`@beta`/`@experimental`） |
| `excludeTags`           | 解析时直接丢掉的标签（如清理 apiDoc 的 `@apidefine`）        |
| `notRenderedTags`       | 标签**保留但不渲染**（给插件读元数据用）。0.28 起 `@group`/`@category` 不再"剥离"反射，改用此项跳过渲染 |

::: tip jsDocCompatibility —— 宽松的 JSDoc 兼容（默认全开）
对象选项，四个开关分别控制：`exampleTag`（`@example` 无围栏时整段当代码）、`defaultTag`（`@default` 当 `@defaultValue` 别名）、`inheritDocTag`（`@inheritDoc` 宽松解析）、`ignoreUnescapedBraces`（忽略未转义大括号的告警）。可整体或逐项关：`--jsDocCompatibility false` / `--jsDocCompatibility.defaultTag false`。
:::

## 常用块标签

| 标签           | 别名         | 用途                                      |
| -------------- | ------------ | ----------------------------------------- |
| `@param`       |              | 描述参数（`@param name - 描述`，破折号可选） |
| `@returns`     | `@return`    | 描述返回值                                |
| `@typeParam`   | `@template`  | 描述泛型类型参数（`@template` 是 JSDoc 别名） |
| `@remarks`     |              | 摘要之外的补充详述                        |
| `@example`     |              | 用法示例（见下文 0.28 语义）              |
| `@defaultValue`| `@default`   | 属性/变量默认值                           |
| `@see`         |              | 交叉引用相关项                            |
| `@deprecated`  |              | 标记废弃（可写替代方案）                  |
| `@throws`      |              | 描述抛出的异常                            |
| `@category` / `@group` |      | 自定义分类 / 分组（见[主题与插件](./themes-plugins.md)） |
| `@module`      |              | 标记文件级注释并可重命名模块              |

一段覆盖多数块标签的富注释：

```ts
/**
 * 合并两个对象，后者覆盖前者的同名键。
 *
 * @remarks
 * 浅合并，仅处理一层；嵌套对象按引用替换。
 *
 * @typeParam T - 目标对象类型
 * @typeParam U - 源对象类型
 * @param target - 被合并的目标对象
 * @param source - 覆盖用的源对象
 * @returns 合并后的新对象（`T & U`）
 *
 * @example
 * ```ts
 * merge({ a: 1 }, { b: 2 }); // => { a: 1, b: 2 }
 * ```
 *
 * @category Utilities
 * @see {@link deepMerge | 深合并版本}
 * @deprecated 请改用 {@link deepMerge}
 */
export function merge<T extends object, U extends object>(target: T, source: U): T & U {
  return { ...target, ...source };
}
```

## @example 的 0.28 语义（必考）

`@example` 在 0.28 行为有变，是高频版本差异点：

- **无围栏代码块时**：TypeDoc 把**整段内容当作代码**（非严格 TSDoc，但 VSCode 也这么认，提升 JSDoc 兼容）。
- **有围栏代码块时**：围栏外文字当普通文档，仅围栏内当代码。
- 受 `jsDocCompatibility.exampleTag` 控制。

```ts
/**
 * 取 `n` 的阶乘。
 *
 * @example
 * // 没有代码块时，TypeDoc 把整段当代码
 * factorial(1)
 *
 * @example
 * 有代码块时，围栏外的这行被当作普通文字。
 * ```ts
 * factorial(1)
 * ```
 */
export function factorial(n: number): number;
```

::: warning 旧版"具名示例"已移除
旧版（≤0.27）支持 `@example 标题` 这种"具名示例"，第一行当 caption；**0.28 已移除**这套语义。从老项目升级会发现示例标题变成了代码注释——按新规则改写或补上围栏。
:::

## 修饰标签与可见性

修饰标签是纯开关，无内容，主要用于控制可见性与归类：

| 标签                                   | 作用                                          |
| -------------------------------------- | --------------------------------------------- |
| `@internal`                            | 标记内部 API，配 `excludeInternal` 过滤       |
| `@hidden` / `@ignore`                  | **直接**从文档移除该反射（无需开关）          |
| `@alpha` / `@beta` / `@experimental`   | 成熟度标记（常配 `cascadedModifierTags` 级联）|
| `@public` / `@private` / `@protected`  | 覆盖 TS 可见性判定                            |
| `@class` / `@interface` / `@enum` / `@namespace` / `@function` | **强制**把声明按指定 kind 归类 |
| `@event` / `@eventProperty`            | 等价于 `@group Events`                         |
| `@overload`                            | 标记函数重载                                  |
| `@primaryExport`（0.28 新增）          | 控制导出转换顺序，指定主导出                  |

```ts
/**
 * 内部辅助，不对外暴露。
 * @internal
 */
export function _helper(): void {}

/**
 * 实验性 API，可能随时变动。
 * @beta
 */
export function newFeature(): void {}
```

## @module vs @packageDocumentation

两者都把注释标记为**文件级**（而非紧随其后的声明），都**必须放在文件第一个注释块、import 之前**。

| 标签                    | 能否重命名模块 | 来源       |
| ----------------------- | -------------- | ---------- |
| `@module`               | **能**（`@module my-module`） | TypeDoc    |
| `@packageDocumentation` | 不能           | TSDoc 标准 |

```ts
// file1.ts —— 重命名模块
/**
 * file1.ts 的文档注释
 * @module my-module
 */
import * as lib from "lib";
```

::: warning 不加这俩标签的后果
文件顶部紧贴 import 的注释会被当成"那条 import 的文档"，而非文件级文档。想写文件级说明，必须用 `@module` 或 `@packageDocumentation` 并放在最前。
:::

## 内联标签：链接与继承

### {@link} 与声明引用

三种写法：

```ts
/** 类似 {@link random}，但范围是 [0, 100) */
export function rand(): number;

export class Data {
  /** {@link Data.prop | 实例成员}（TSDoc 风格，竖线自定义文字） */
  prop = 0;
}
```

1. `{@link Foo.Bar}` —— 链接到 `Foo.Bar`，显示文字为 `Bar`。
2. `{@link Foo.Bar | 点这里}` —— TSDoc 风格自定义文字（**竖线**）。
3. `{@link Foo.Bar 点这里}` —— 非 TSDoc 风格自定义文字（**空格**）。

`{@linkcode}` 把链接文字渲染为**等宽字体**，`{@linkplain}` 为普通字体。声明引用语法（不走 TS 解析时）：`Data.prop`（静态/实例成员）、`Data#member`（仅声明引用支持的实例成员写法）、`Merged:namespace`（命名空间限定）、`module!Export`（模块限定），配合 `{@label X}` 引用具体重载。

::: tip useTsLinkResolution（默认 true）
默认用 **TS 自己的符号解析**（行为对齐 VSCode）；失败或关掉时回退到声明引用解析。`preserveLinkText`（默认 true）保留原始链接文字而非只显示目标名。
:::

### {@inheritDoc} 与 {@label}

按 TSDoc，`{@inheritDoc}` **只复制**：summary、`@remarks`、`@param`、`@typeParam`、`@returns`。**不复制**其他标签/段落（`@example`、`@deprecated` 不继承）。

```ts
/** Some documentation */
export class SomeClass {}

/** {@inheritDoc SomeClass} */
export interface SomeUnrelatedClass {}
```

TypeDoc 同时支持带花括号 `{@inheritDoc Ref}`（指定来源）和**裸写 `@inheritDoc`**（不带 ref 时自动从**父反射**继承，如重写方法继承基类方法的文档）。`{@label NAME}` 给重载/声明打标签，便于被 `{@link}` 精确引用。0.28 还新增了 `{@include path}` / `{@includeCode path}`，把外部文件内容/代码段内联进注释。

下一步：[配置详解](./configuration.md) · [主题与插件](./themes-plugins.md) · [接入文档站](./docs-site.md) · [速查参考](../reference.md)
