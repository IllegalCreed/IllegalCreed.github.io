---
layout: doc
outline: [2, 3]
---

# 快速上手

> 基于 @microsoft/tsdoc 0.16.0 / @microsoft/tsdoc-config 0.18.1 / eslint-plugin-tsdoc 0.5.2 编写

## 速查

- TSDoc 是**规范**不是命令行工具——**没有 `tsdoc build` 这种"生成文档"的步骤**
- 想要文档站 / API 报告，用消费方：**TypeDoc**（HTML 站）、**API Extractor**（API 报告 + `.d.ts` rollup）
- 解析注释用参考解析器 `@microsoft/tsdoc`，输出 AST / `DocNode` 给工具用，不直接给人看
- 自定义标签：根目录放 `tsdoc.json`，由 `@microsoft/tsdoc-config` 加载
- CI 校验注释合规：装 `eslint-plugin-tsdoc`，开 `tsdoc/syntax` 规则
- VS Code **无需任何插件**即对 doc 注释有悬浮提示（TS 语言服务消费注释）
- 三个包都还在 0.x：`@microsoft/tsdoc` **0.16.0** / `tsdoc-config` **0.18.1** / `eslint-plugin-tsdoc` **0.5.2**

## TSDoc 不是什么

把 TSDoc 当文档生成器，是最常见的认知错误。三点澄清：

- **不产出文档**：出 HTML 文档站的是 TypeDoc，出 API 报告的是 API Extractor；TSDoc 只定义注释语法
- **不是 `tsc` 的子命令**：它是独立的开源标准 + 一个 npm 解析器，与 TypeScript 编译器解耦
- **不替代 `.d.ts`**：`.d.ts` 是类型声明文件，TSDoc 管的是"注释里的描述文字怎么写"，两回事

::: tip 一句话定位
TSDoc = "怎么写注释"的标准；TypeDoc / API Extractor = "拿这份注释去产出文档 / 报告"的工具。规范 ↔ 实现，不是互相替代。
:::

## 谁在消费 TSDoc

| 消费方 | 它拿 TSDoc 注释做什么 |
| --- | --- |
| **TypeDoc** | 读注释 + TS 类型 → 生成可浏览的 HTML 文档站 |
| **API Extractor**（微软） | TSDoc 标准的主要推动者 / 参考实现；产出 API 报告、`.d.ts` rollup、破坏性变更门禁 |
| **eslint-plugin-tsdoc** | 在 ESLint 里校验注释是否符合 TSDoc 语法（`tsdoc/syntax` 规则） |
| **VS Code / TS 语言服务** | 悬浮提示、智能感知里渲染 doc 注释——**无需装插件** |

## 在项目里采用 TSDoc

1. **按规范写注释**——掌握[标签三类](./guide-line/tag-kinds.md)与[常用标签](./guide-line/common-tags.md)的写法
2. **选消费方产出文档**——应用 / 库通用文档站选 TypeDoc；库作者要 API 报告 + 破坏性变更门禁选 API Extractor
3. **（可选）自定义标签**——根目录加 [`tsdoc.json`](./guide-line/config-ecosystem.md)，用 `@microsoft/tsdoc-config` 加载
4. **（可选）CI 门禁**——装 `eslint-plugin-tsdoc`，在 ESLint 配置开 `tsdoc/syntax` 规则

```ts
/**
 * 计算两数之和。
 *
 * @remarks
 * 这里写详细说明，`@remarks` 之后到下一个块标签前都算它的内容。
 *
 * @param x - 第一个加数（注意 TSDoc 要求参数名后带连字符 `-`）
 * @param y - 第二个加数
 * @returns x 与 y 的和
 *
 * @public
 */
export function add(x: number, y: number): number {
  return x + y;
}
```

## 参考解析器 `@microsoft/tsdoc`

- 官方称它是 “professional quality parser”，供工具构建者使用。
- 输出的是注释的 AST（`DocNode` 节点树），**给程序消费**，不是给人阅读的文档。
- 普通项目一般不直接用它——除非你要自己写"消费 TSDoc 注释"的工具。要在项目里做合规校验，用上层的 `eslint-plugin-tsdoc` 即可。

下一步：[标签的三种类型](./guide-line/tag-kinds.md) · [三级标准化分组](./guide-line/standardization.md) · [常用标签详解](./guide-line/common-tags.md)
