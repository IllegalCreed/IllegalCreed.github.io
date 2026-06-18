---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 @microsoft/tsdoc 0.16.0 / @microsoft/tsdoc-config 0.18.1 / eslint-plugin-tsdoc 0.5.2 编写

## 速查

- TSDoc 是**注释标准 / 规范**，不生成文档；出文档的是 TypeDoc、API Extractor
- 标签三类：**块**（独占行带内容）/ **修饰**（末尾、空内容）/ **内联**（`{}` 包裹）
- 标准化三档：**Core**（必备）/ **Extended**（可选、实现须合规）/ **Discretionary**（可选、语义因实现而异）
- `@param 名 - 描述`：**连字符强制**；类型来自 TS 签名，注释不写 `{type}`
- 内联标签仅 3 个：`{@link}` `{@inheritDoc}`（不含类型）`{@label}`
- 配置 `tsdoc.json`（`$schema`/`extends`/`tagDefinitions`/`supportForTags`），由 `@microsoft/tsdoc-config` 加载
- 版本：`@microsoft/tsdoc` **0.16.0**、`tsdoc-config` **0.18.1**、`eslint-plugin-tsdoc` **0.5.2**（均 0.x，未发布 1.0）

## 全标签速查（按种类）

| 种类 | 标签 | 用途 |
| --- | --- | --- |
| **块** | `@param` | 参数；名后**强制连字符** `@param 名 - 描述` |
| 块 | `@typeParam` | 泛型类型参数 |
| 块 | `@returns` | 返回值描述 |
| 块 | `@remarks` | 详细说明（摘要之外的展开） |
| 块 | `@privateRemarks` | 内部备注，**不输出**到公开文档 |
| 块 | `@example` | 示例代码块，可多个 |
| 块 | `@throws` | 可能抛出的异常 |
| 块 | `@deprecated` | 弃用标记 + 迁移说明 |
| 块 | `@defaultValue` | 默认值 |
| 块 | `@see` | 交叉引用 |
| 块 | `@decorator` | 记录被引用的装饰器 |
| **修饰** | `@public` `@beta` `@alpha` `@experimental` `@internal` | 发布等级 / 可见性（裁剪由 API Extractor 落地） |
| 修饰 | `@readonly` | 只读成员 |
| 修饰 | `@sealed` | 不可继承 / 重写 |
| 修饰 | `@virtual` | 可被子类重写 |
| 修饰 | `@override` | 重写了父类 / 接口成员 |
| 修饰 | `@eventProperty` | 可订阅的事件属性 |
| 修饰 | `@packageDocumentation` | 放入口 `.d.ts` 顶部，描述整个包 |
| **内联** | `{@link 目标 \| 文本}` | 链接 API 声明或 URL |
| 内联 | `{@inheritDoc 目标}` | 继承文档内容，**不含类型签名** |
| 内联 | `{@label}` | 给声明打标签，供 `{@link}` 定位 |

> 共 25 个标准标签：块 11 + 修饰 11 + 内联 3。某标签的标准化分组（Core/Extended/Discretionary）以官方页 / 源码为准。

## TSDoc vs JSDoc 关键差异

| 维度 | JSDoc | TSDoc |
| --- | --- | --- |
| 定位 | 注释约定 + 文档生成器（出 HTML） | 注释**标准 / 规范**（不生成） |
| 类型 | 写进注释 `@param {type} 名` | 来自 TS 签名，注释**不写类型** |
| `@param` 连字符 | 可选（仅可读性） | **强制** `@param 名 - 描述` |
| 返回值 | `@returns` / `@return` 等价别名 | 标准是 `@returns` |
| 标签种类 | 块 / 内联 | **块 / 修饰 / 内联（三类）** |
| 标准化 | 无分级 | Core / Extended / Discretionary 三档 |
| 配置 | `jsdoc.json` | `tsdoc.json`（`tagDefinitions` / `extends`） |
| CI 校验 | `eslint-plugin-jsdoc` | `eslint-plugin-tsdoc`（`tsdoc/syntax`） |

## `tsdoc.json` 字段速查

| 字段 | 作用 |
| --- | --- |
| `$schema` | 指向官方 JSON Schema，供编辑器校验 / 补全 |
| `extends` | 继承其它 `tsdoc.json`（配置复用，适合 monorepo） |
| `tagDefinitions` | 自定义标签数组，每项含 `tagName` + `syntaxKind`(`block`/`modifier`/`inline`) |
| `supportForTags` | "标签名 → 布尔"，启用 / 禁用已定义标签 |

## 版本与生态

| 包 | 版本 | 角色 |
| --- | --- | --- |
| `@microsoft/tsdoc` | 0.16.0 | 参考解析器（注释 → AST / `DocNode`） |
| `@microsoft/tsdoc-config` | 0.18.1 | 加载 `tsdoc.json`、应用自定义标签 |
| `eslint-plugin-tsdoc` | 0.5.2 | `tsdoc/syntax` 规则做注释合规门禁 |

> 三包均为 0.x，TSDoc 规范**尚未发布 1.0**，仍在演进（形式文法、RFC 流程在路线图上）。

## 文档与 GitHub 链接

- 官方文档：[https://tsdoc.org/](https://tsdoc.org/)
- GitHub 仓库：[https://github.com/microsoft/tsdoc](https://github.com/microsoft/tsdoc)
- 在线 Playground：[https://tsdoc.org/play/](https://tsdoc.org/play/)

返回：[标签三类](./guide-line/tag-kinds.md) · [标准化分组](./guide-line/standardization.md) · [常用标签](./guide-line/common-tags.md) · [配置与生态](./guide-line/config-ecosystem.md)
