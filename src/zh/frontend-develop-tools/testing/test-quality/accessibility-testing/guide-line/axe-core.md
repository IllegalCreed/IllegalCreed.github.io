---
layout: doc
outline: [2, 3]
---

# axe-core 引擎

> 基于 axe-core 4.12.1 编写

## 速查

- **原理**：客户端 JS 引擎，对**渲染后 DOM**（非源码）跑规则；每条 rule 用 CSS selector 选元素，跑 **any（≥1 过）/ all（全过）/ none（全失败）** 三组 checks；**跳 `display:none` / 失活区**减少误报；遍历嵌套 iframe + 开放 shadow DOM
- **tags 是 OR（并集）过滤**：要 A + AA 必须 `['wcag2a','wcag2aa']` **都列**；`experimental` 默认禁用
- **impact 四级（低→高）**：**minor < moderate < serious < critical**；规则 impact = 其失败检查中最高，通过结果 impact 为 `null`
- **`axe.run()` 返回 4 数组**：`violations`（确定失败）/ `passes`（通过）/ **`incomplete`（需人工复核）** / **`inapplicable`（无匹配元素）**
- ⚠️ **纠偏**：axe-core **库本身默认会跑 best-practice**；默认排除的是 `experimental` + 9 条显式 `enabled:false`。「默认不含 best-practice」只对**包装工具**和老 2.x/3.x 成立
- **run() 返 Promise**，默认 context = 整个 document

## 工作原理

axe-core 是 Deque 开源的**客户端 JavaScript 规则引擎**，它对**实时渲染后的 DOM**（不是源码）运行检查，因此能反映组件真实渲染的结果。每条规则的执行逻辑：

1. 用 **CSS selector** 选出该规则适用的元素；
2. 对每个元素跑三组 **checks**：
   - **any**：列表中**至少一个通过**即算过；
   - **all**：列表中**全部通过**才算过；
   - **none**：列表中**全部失败**才算过（即「不应出现的情况都没出现」）；
3. **只评估渲染内容**（含视觉隐藏但仍在无障碍树里的元素），**跳过 `display:none` 与失活区域**以减少误报；
4. 自动**遍历嵌套 iframe 与开放（open）shadow DOM**。

## tags：按标签过滤跑哪些规则

每条规则带一组 **tags**——**恰好一个「版本 + 级别」标签**（或 `best-practice`）、对应的 **SC 号**、以及 **cat.\*** 分类标签：

| 标签 | 含义 |
| ---- | ---- |
| `wcag2a` / `wcag2aa` / `wcag2aaa` | WCAG 2.0 各级 |
| `wcag21a` / `wcag21aa` | WCAG 2.1 新增各级 |
| `wcag22aa` | WCAG 2.2 新增 AA |
| `best-practice` | 非 WCAG 但业界公认的最佳实践 |
| `wcag111`（SC 号） | 对应具体成功准则 |
| `ACT` / `section508` / `EN-301-549` | 其它合规体系 |
| `experimental` | **实验性规则，默认禁用** |
| `cat.aria` / `cat.color` / `cat.forms` / `cat.keyboard` / `cat.semantics` / `cat.structure` | 按问题类别分组 |

::: warning 标签是 OR（并集）过滤
`runOnly.values` 里的标签取**并集**——`['wcag2aa']` **不包含** `wcag2a`。要同时检查 A 和 AA 必须 `['wcag2a','wcag2aa']` **两个都列**。只列一个标签以为覆盖了 A+AA 是常见错误。
:::

## impact：违规严重程度四级

每个违规带一个 **impact**，从低到高：

| impact | 等级 | 示例规则 |
| ------ | ---- | -------- |
| `minor` | 轻微 | `empty-heading`（空标题） |
| `moderate` | 中等 | `region`、`heading-order`（标题层级跳级） |
| `serious` | 严重 | `aria-hidden-focus`（聚焦元素被 aria-hidden） |
| `critical` | 致命 | `button-name`、`aria-required-attr`、`aria-roles` |

规则上报的 impact = 其**失败检查中最高**的那个；**通过结果的 impact 为 `null`**。CI 门禁通常按 `critical` / `serious` 设硬门禁，详见 [Vue 实战与最佳实践](./best-practices.md)。

## axe.run() 的返回结构

`axe.run()` 返回 **Promise**（也接受 `(err, results)` 回调），默认 context 是整个 `document`。返回对象核心是**四个数组**：

```js
const r = await axe.run(document);
// {
//   url, timestamp, testEngine, testEnvironment,
//   violations[],    // 确定失败
//   passes[],        // 通过
//   incomplete[],    // ⚠️ 需人工复核
//   inapplicable[],  // 无匹配元素，规则未运行
// }
```

| 数组 | 含义 | 易混点 |
| ---- | ---- | ------ |
| `violations` | 确定失败的规则 | 断言通常用 `violations.toEqual([])` |
| `passes` | 检查通过的规则 | — |
| `incomplete` | **「needs review」**：有匹配元素但**无法判定**（技术限制 / JS 错），**需人工复核** | **有元素、不确定**，**不能当通过** |
| `inapplicable` | 页面上**无匹配元素**，规则根本没运行 | **无元素**，也不是「通过」 |

::: warning incomplete ≠ inapplicable ≠ passes
最容易混的三态：**`incomplete`（有元素、判不了）≠ `inapplicable`（没元素、没跑）≠ `passes`（有元素、过了）**。把 `incomplete` 当通过会漏掉真问题，把 `inapplicable` 当通过则毫无意义。
:::

每个违规节点的形状：

```js
{
  id, impact /* null 或四级 */, tags: [], description, help, helpUrl,
  nodes: [
    {
      html,        // 违规元素的 HTML
      target: [],  // CSS selector，嵌套数组表示 iframe / shadow 层级
      failureSummary, // 失败原因摘要
      any: [], all: [], none: [], // 各组 checks 的结果
    }
  ]
}
```

> `target` 是**嵌套数组**时表示元素在 iframe / shadow DOM 的层级路径（外层定位 iframe，内层定位 iframe 内元素）。

## 运行方式

```js
// 浏览器内（或 jsdom）
import axe from "axe-core";

// 默认 context = 整个 document，返回 Promise
const results = await axe.run(document);

// 只跑指定标签（A + AA 都列，OR 过滤）
const r = await axe.run(document, {
  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
});
```

Node 环境本身没有 DOM，需要 **jsdom**，或经 `@axe-core/playwright` / `cypress-axe` 等在真浏览器里注入运行（见 [端到端接入](./e2e.md)）。

## ⚠️ 纠偏：库默认会跑 best-practice

这是高频误区。**axe-core 库本身默认会跑 `best-practice` 规则**——根据官方 `doc/API.md`，默认会跑**除 `experimental` 外的所有规则**，而 `best-practice` 规则**并未**设置 `enabled: false`。

默认**排除**的只有：

- **`experimental` 标签**的规则；
- **9 条显式 `enabled: false`** 的规则：AAA 的 `color-contrast-enhanced` / `identical-links-same-purpose` / `meta-refresh-no-exceptions`；已弃用的 `aria-roledescription` / `audio-caption` / `duplicate-id` / `duplicate-id-active` / `landmark-complementary-is-top-level`；以及 `target-size`。

> **「默认不含 best-practice」只对两种情况成立**：① 某些**包装工具**（如 `@axe-core/cli` 的某些预设）会显式只跑 WCAG 标签；② 老的 axe 2.x / 3.x。**直接用 axe-core 库时，`best-practice` 是默认开启的**——如果只想要 WCAG 结果，需用 `runOnly` 显式指定 WCAG 标签。
