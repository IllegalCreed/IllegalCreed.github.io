---
layout: doc
outline: [2, 3]
---

# 常用标签详解

> 基于 @microsoft/tsdoc 0.16.0 编写

## 速查

- `@param` **强制连字符**：`@param 名 - 描述`（官方示例 `@param x - The first input number`），缺连字符严格校验会报错——这是与 JSDoc 最常被挑出的差异
- `@param` / `@typeParam` **不写类型**：类型来自 TS 签名，注释只写描述（区别于 JSDoc 的 `@param {type}`）
- 摘要（summary）= 注释开头第一段；`@remarks` = 详细说明；`@privateRemarks` = **不输出**到公开文档
- `{@inheritDoc}` 复制 summary / `@remarks` / `@param` / `@typeParam` / `@returns；`**从不复制类型签名**
- `{@link 目标 | 文本}`：链接 API 声明或 URL，`|` 后可给显示文本
- 发布标签 `@public` / `@beta` / `@alpha` / `@internal` / `@experimental` 是**修饰标签**，标记 API 成熟度 / 可见性
- 弃用只认 `@deprecated`（块标签，附迁移说明）；继承关系用 `@virtual` / `@override` / `@sealed`

## 参数与返回

### `@param` —— 注意强制连字符

官方 `@param` 页规定：`@param` 后跟"参数名 + 连字符 `-` + 描述"，示例 `@param x - The first input number`。**连字符是 TSDoc 的语法约定**（用于分隔名与描述、便于机读）——而 JSDoc 里这个连字符是可选的、仅为可读性。迁移到严格 TSDoc 时，`eslint-plugin-tsdoc` 最常报的就是"缺连字符"。

```ts
/**
 * @param x - 第一个加数      // ✅ 名后有连字符
 * @param y 第二个加数         // ❌ 缺连字符，tsdoc/syntax 会报
 * @typeParam T - 元素类型     // 泛型参数用 @typeParam
 * @returns 两数之和
 */
```

::: warning TSDoc 的 `@param` 不写 `{类型}`
类型由 TypeScript 签名提供，TSDoc 注释**只写描述**。`@param {number} x` 那种 JSDoc 写法在 TSDoc 里是多余的。
:::

## 摘要、备注与私有备注

| 部分 | 写法 | 输出到公开文档？ |
| --- | --- | --- |
| **摘要（summary）** | 注释开头第一段，不带标签 | 是（核心一句话） |
| `@remarks` | 块标签，写详细说明 / 背景 | 是 |
| `@privateRemarks` | 块标签，写给维护者看的内部备注 | **否**，工具不输出到公开文档 |

```ts
/**
 * 把金额格式化为带货币符号的字符串。   // ← summary
 *
 * @remarks
 * 内部用 `Intl.NumberFormat`，遵循当前 locale。
 *
 * @privateRemarks
 * TODO: 大数精度待重构，别在公开文档里提这句。
 */
```

## `{@inheritDoc}` —— 继承文档但不继承类型

`{@inheritDoc}` 从被引用的 API 复制文档内容：summary、`@remarks`、`@param`、`@typeParam`、`@returns`。**类型签名从不在被复制之列**——类型永远来自当前声明自己的 TS 签名。

```ts
/** {@inheritDoc Animal.move} */
override move(): void {}
```

::: warning 别指望它复制类型
`{@inheritDoc}` 只搬"文字描述"，不搬参数 / 返回的类型。类型由各自的 TS 签名决定。
:::

## `{@link}` —— 声明引用与链接

`{@link}` 链接到某个 API 声明或外部 URL，`|` 后可写显示文本。声明引用（declaration reference）语法可定位包成员、类的实例成员等。

```ts
/**
 * 详见 {@link Button.onClick}（实例成员用 `.`）、
 * {@link my-pkg#helper | 包成员}，以及外链 {@link https://tsdoc.org | 官网}。
 */
```

配套的 `{@label}` 用来给声明打标签，供 `{@link}` 在有重载等情况下精确定位目标。

## 发布标签与可见性（修饰标签）

| 标签 | 含义 |
| --- | --- |
| `@public` | 公开 API |
| `@beta` | 公开但仍在 beta，签名可能变 |
| `@alpha` | 更早期、不稳定 |
| `@experimental` | 实验性 |
| `@internal` | 内部 API，不应对外暴露 |

这些是**修饰标签**，本身只是性质标记。其真正的"裁剪 / 可见性"效果主要由 **API Extractor** 落地（如按发布等级裁出不同的 `.d.ts` 与 API 报告）。

## 继承、弃用与其他

| 标签 | 类型 | 用途 |
| --- | --- | --- |
| `@virtual` | 修饰 | 标记可被子类重写的成员 |
| `@override` | 修饰 | 标记重写了父类 / 接口的成员 |
| `@sealed` | 修饰 | 标记不可被继承 / 重写 |
| `@readonly` | 修饰 | 标记只读成员 |
| `@eventProperty` | 修饰 | 标记返回事件对象、可订阅的属性 |
| `@packageDocumentation` | 修饰 | 放在入口 `.d.ts` 顶部，标记"这段注释描述整个包" |
| `@deprecated` | 块 | 弃用标记，附替代方案 / 迁移说明 |
| `@example` | 块 | 示例代码块，可多个 |
| `@throws` | 块 | 可能抛出的异常 |
| `@defaultValue` | 块 | 记录默认值 |
| `@see` | 块 | 交叉引用 |
| `@decorator` | 块 | 记录被引用的装饰器 |

```ts
/**
 * @deprecated 自 v2 起改用 {@link fetchUser}。
 * @example
 * ```ts
 * format(1234); // "¥12.34"
 * ```
 */
```

下一步：[配置与生态](./config-ecosystem.md) · [速查参考](../reference.md)
