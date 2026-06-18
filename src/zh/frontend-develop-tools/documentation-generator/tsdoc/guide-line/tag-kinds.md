---
layout: doc
outline: [2, 3]
---

# 标签的三种类型

> 基于 @microsoft/tsdoc 0.16.0 编写

## 速查

- TSDoc 把标签分**三类**，写法和位置都不同：块标签 / 修饰标签 / 内联标签
- **块标签**：独占一行、`@` 起首；其后的文本（含 Markdown、内联标签）都算它的内容，直到下一个块 / 修饰标签。例 `@param` `@remarks` `@returns` `@example`
- **修饰标签**：表达"API 的某种性质"，**内容应为空**；规范化时集中排在注释**末尾**。例 `@public` `@sealed` `@readonly`
- **内联标签**：用 `{ }` 包裹，嵌在描述文本中。标准内联标签**仅 3 个**：`{@link}` `{@inheritDoc}` `{@label}`
- 一眼区分：见 `{}` → 内联；独占一行且带内容 → 块；末尾单独一行、无内容 → 修饰
- 25 个标准标签 = 块 11 + 修饰 11 + 内联 3

## 块标签（Block tags）

官方定义：“Block tags should always appear as the first element on a line.”（块标签始终是一行的第一个元素，规范化后应独占一行。）其后直到下一个块 / 修饰标签之前的所有文本，都属于这个块标签的内容，可包含 Markdown 与内联标签。

```ts
/**
 * 摘要写在最前面，不带任何标签。
 *
 * @remarks
 * 这一整段（含 **Markdown** 和 {@link other} 内联标签）都是 @remarks 的内容，
 * 直到遇到下一个块标签才结束。
 *
 * @param name - 用户名
 * @returns 问候语
 */
```

常见块标签：`@param`、`@typeParam`、`@returns`、`@remarks`、`@privateRemarks`、`@example`、`@throws`、`@deprecated`、`@defaultValue`、`@see`、`@decorator`。

## 修饰标签（Modifier tags）

官方定义：“Modifier tags indicate a special quality of an API. Modifier tags are generally parsed the same as block tags, with the expectation that their tag content is empty.”——修饰标签标记 API 的某种性质，解析方式与块标签类似，但**期望内容为空**；规范化形式下集中出现在注释**底部的一行**。

```ts
/**
 * 冻结的配置对象，禁止子类覆盖。
 *
 * @public @sealed @readonly
 */
```

常见修饰标签：`@public`、`@beta`、`@alpha`、`@experimental`、`@internal`（这 5 个是"发布阶段"标签）、`@readonly`、`@sealed`、`@virtual`、`@override`、`@eventProperty`、`@packageDocumentation`。

::: tip 发布标签是修饰标签
`@public` / `@beta` / `@alpha` / `@internal` 这组"发布标签"属于**修饰标签**，不是块标签——它们只是一个性质标记，不带内容。其"裁剪 / 可见性"效果主要由 API Extractor 落地。
:::

## 内联标签（Inline tags）

官方定义：“Inline tags appear as content elements along with Markdown expressions. Inline tags are always surrounded by `{` and `}` characters.”——内联标签嵌在描述文本里，**始终被 `{` 和 `}` 包裹**。标准内联标签只有 3 个：

| 内联标签 | 作用 |
| --- | --- |
| `{@link}` | 链接到某个 API 声明或 URL |
| `{@inheritDoc}` | 从被引用的 API 复制文档内容（**不含**类型签名） |
| `{@label}` | 给声明打标签，供 `{@link}` 的声明引用语法定位重载等 |

```ts
/**
 * 详见 {@link Button.onClick} 与外部文档 {@link https://example.com | 示例}。
 */
```

## 一眼区分三类

| 特征 | 块标签 | 修饰标签 | 内联标签 |
| --- | --- | --- | --- |
| 是否被 `{}` 包裹 | 否 | 否 | **是** |
| 位置 | 独占一行、行首 | 注释末尾、可多个同行 | 嵌在描述文本中 |
| 是否带内容 | **带**（直到下一个块/修饰标签） | 空 | 带（链接目标等） |
| 例 | `@param` `@remarks` | `@public` `@sealed` | `{@link}` `{@inheritDoc}` |

## 25 个标准标签按类归位

| 类型 | 标签 |
| --- | --- |
| **块标签（11）** | `@decorator` `@defaultValue` `@deprecated` `@example` `@param` `@privateRemarks` `@remarks` `@returns` `@see` `@throws` `@typeParam` |
| **修饰标签（11）** | `@alpha` `@beta` `@eventProperty` `@experimental` `@internal` `@override` `@packageDocumentation` `@public` `@readonly` `@sealed` `@virtual` |
| **内联标签（3）** | `{@inheritDoc}` `{@label}` `{@link}` |

下一步：[三级标准化分组](./standardization.md) · [常用标签详解](./common-tags.md)
