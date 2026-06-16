---
layout: doc
outline: [2, 3]
---

# 规则、共享配置与插件

> 基于 Stylelint v17.13.0 编写

## 速查

- 规则两大类：**避免错误**（deprecated/duplicate/empty/invalid/unknown）+ **强制约定**（allowed-list/case/max-min/notation/pattern/quotes）
- 100+ 规则默认全关；靠共享配置起步
- 共享配置：`stylelint-config-recommended`（只防错）⊂ `stylelint-config-standard`（再加约定）；SCSS 用 `-scss` 后缀版
- 风格规则：15 起废弃、**16 起移除**（76 条），格式化交给 Prettier；想要可装第三方 `@stylistic/stylelint-plugin`
- 插件：`stylelint-scss`（SCSS 规则）、`stylelint-order`（属性排序）、`stylelint-declaration-strict-value`（值白名单）等，用 `plugins` 引入 + `rules` 开启
- 自定义语法：`postcss-scss` / `postcss-less` / `postcss-html`（Vue/HTML）/ `postcss-styled-syntax`（CSS-in-JS）
- 命名约定：`selector-class-pattern` / `custom-property-pattern` 等 `*-pattern` 规则用正则约束

## 规则的两大类别

Stylelint 把 100+ 规则分为两大类：

### 避免错误（Avoid errors）

防止真实的 CSS 问题，子类与代表规则：

| 子类      | 含义               | 代表规则                                   |
| --------- | ------------------ | ------------------------------------------ |
| deprecated | 禁用过时特性       | `at-rule-no-deprecated`                    |
| duplicate | 防止重复声明       | `declaration-block-no-duplicate-properties` |
| empty     | 标记空块/空注释     | `block-no-empty`                           |
| invalid   | 捕获非法语法       | `color-no-invalid-hex`                     |
| unknown   | 拒绝未知属性/值     | `property-no-unknown`                      |

### 强制约定（Enforce conventions）

确保一致性与代码风格（非排版格式）：

| 子类         | 含义                       | 代表规则                  |
| ------------ | -------------------------- | ------------------------- |
| allowed-list | 控制允许的选择器/属性/函数 | `unit-allowed-list`       |
| case         | 大小写一致                 | `function-name-case`      |
| max & min    | 复杂度/特异性限制          | `selector-max-id`         |
| notation     | 标准化多种写法             | `alpha-value-notation`    |
| pattern      | 命名约定                   | `selector-class-pattern`  |
| quotes       | 要求/禁止引号              | `font-family-name-quotes` |

## 风格规则的去向（重要）

> 这是理解 Stylelint 当下定位的关键。

Stylelint **15.0.0 废弃了 76 条风格类（stylistic）规则**——这些规则强制空白、缩进等排版，是在 Prettier 之类格式化器普及前诞生的。废弃理由是：linter 与格式化器是互补工具，排版交给 Prettier 更合适，Stylelint 应专注“避错 + 非格式约定”。

这些规则在 15.x 仍可用但会**告警**，并在 **16.0.0 被彻底移除**。

::: tip 由此带来的两个结论
1. `stylelint-config-prettier`（用于关闭与 Prettier 冲突的格式规则）**不再需要**——既然格式规则已移除，就没有冲突可关。
2. 若仍想用 Stylelint 强制部分风格，可改装第三方的 `@stylistic/stylelint-plugin`（社区接管了这些规则）。
:::

## 共享配置（shared configs）

共享配置是预先打包好的一组规则，用 `extends` 引入：

| 配置                              | 内容                                   |
| --------------------------------- | -------------------------------------- |
| `stylelint-config-recommended`    | 只开“避免错误”类规则，最克制           |
| `stylelint-config-standard`       | 在 recommended 基础上再加约定类规则     |
| `stylelint-config-standard-scss`  | standard + SCSS 语法与 SCSS 专属规则    |
| `stylelint-config-recommended-vue` | Vue SFC 场景（含 `postcss-html`）       |
| `stylelint-config-recess-order`   | 按 RECESS 风格的属性排序                |

```json
{ "extends": ["stylelint-config-standard"] }
```

`standard` 通常 extends 了 `recommended`，约打开一半内置规则。

## 插件（plugins）

插件提供核心之外的规则。常用：

| 插件                                | 用途                               |
| ----------------------------------- | ---------------------------------- |
| `stylelint-scss`                    | 大量 SCSS 专属规则（`scss/...`）   |
| `stylelint-order`                   | 属性/声明排序（`order/...`）       |
| `stylelint-declaration-strict-value` | 强制特定属性取自变量/白名单值      |
| `stylelint-selector-bem-pattern`    | 强制 BEM 选择器约定                |
| `stylelint-use-logical`             | 推荐逻辑属性（如 `inline-size`）   |

引入并开启：

```json
{
  "plugins": ["stylelint-order"],
  "rules": { "order/properties-alphabetical-order": true }
}
```

## 自定义语法（custom syntaxes）

Stylelint 14 起不再内置 CSS 类语言的解析，需 `customSyntax` 指定 PostCSS 语法：

| 语法                    | 适用                          |
| ----------------------- | ----------------------------- |
| `postcss-scss`          | SCSS                          |
| `postcss-less`          | Less                          |
| `postcss-sass`          | 缩进式 Sass                   |
| `postcss-html`          | HTML / Vue / Svelte 的 `<style>` |
| `postcss-styled-syntax` | styled-components 等 CSS-in-JS |

实务中通常直接 extends 已打包语法的共享配置（如 `stylelint-config-standard-scss`、`stylelint-config-recommended-vue`），或用 [overrides](./configuration.md#overrides-分文件覆盖) 按文件类型设置。

## 命名约定示例

强制类名为 kebab-case：

```json
{
  "rules": {
    "selector-class-pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*$"
  }
}
```

同系列还有 `custom-property-pattern`（CSS 变量）、`keyframes-name-pattern` 等。
