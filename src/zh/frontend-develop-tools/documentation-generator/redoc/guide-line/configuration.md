---
layout: doc
outline: [2, 3]
---

# 配置项详解

> 基于 Redoc 2.5.3 / @redocly/cli 2.34.0 编写

## 速查

- 配置传递两套命名：HTML 元素属性用 **kebab-case**（`scrollYOffset` → `scroll-y-offset`）；`Redoc.init` / React `options` 用 **camelCase**；嵌套 `theme` 在 HTML 元素上用 **JSON 字符串**
- 常用布尔开关：`disableSearch`（关搜索）、`hideDownloadButtons`（隐藏下载按钮）、`hideSchemaTitles`（隐藏 schema 标题）、`sortRequiredPropsFirst`（必填属性排前）、`onlyRequiredInSamples`（示例只含必填）、`showExtensions`（显示 `x-` 扩展）
- 展开层级：`jsonSamplesExpandLevel`（JSON 样例展开，默认 **2**，可 `"all"`）、`schemasExpansionLevel`（Schemas 区 schema 展开层级）
- 嵌入带固定顶栏的站点：用 `scrollYOffset` 留出顶部偏移，避免锚点跳转被遮挡
- **已废弃旧名别照搬**：`hideDownloadButton`（→ 复数）、`expandResponses`、`nativeScrollbars`、`requiredPropsFirst`（→ `sortRequiredPropsFirst`）、`jsonSampleExpandLevel`（→ `jsonSamplesExpandLevel`）

## 配置怎么传

| 接入方式 | 命名风格 | 嵌套对象（如 theme） |
| --- | --- | --- |
| HTML 自定义元素 | **kebab-case** 属性 | JSON 字符串 |
| `Redoc.init` options | **camelCase** 对象键 | 直接写对象 |
| React `options` | **camelCase** 对象键 | 直接写对象 |

```html
<!-- HTML 元素：kebab-case -->
<redoc spec-url="openapi.yaml" scroll-y-offset="60" disable-search="true"></redoc>
```

```js
// Redoc.init / React：camelCase
{ scrollYOffset: 60, disableSearch: true }
```

## 常用配置项（2.x 现行）

| 配置项 | 作用 |
| --- | --- |
| `disableSearch` | 禁用内置站内搜索框 |
| `hideDownloadButtons` | 隐藏「下载 OpenAPI 规范」按钮（**复数**，旧单数已废弃） |
| `hideSchemaTitles` | 隐藏 schema 的标题，使版面更紧凑 |
| `sortRequiredPropsFirst` | schema 中把必填属性排在可选属性前面 |
| `onlyRequiredInSamples` | 生成示例时只包含必填属性，给出最小载荷 |
| `showExtensions` | 是否展示 `x-` 开头的 vendor extensions（可传布尔或扩展名列表） |
| `scrollYOffset` | 锚点跳转的纵向偏移，配合固定顶栏使用 |
| `jsonSamplesExpandLevel` | 右栏 JSON 样例默认展开层级，默认 `2`，可设 `"all"` |
| `schemasExpansionLevel` | Schemas（模型）区里 schema 默认展开的嵌套层级 |
| `theme.*` | 主题（颜色、字体、间距等），嵌套对象 |

### `jsonSamplesExpandLevel` vs `schemasExpansionLevel`

两者都管「展开多深」，但目标不同，别调错地方：

- `jsonSamplesExpandLevel`：管**右栏 JSON 样例**展开层级（默认 `2`）
- `schemasExpansionLevel`：管 **Schemas 区域里 schema 结构树**展开层级

### `scrollYOffset`：固定顶栏遮挡的解药

把 Redoc 嵌进顶部有 sticky header 的站点时，点接口锚点跳转后标题常被顶栏盖住。给 `scrollYOffset` 一个等于顶栏高度的值（数值 / CSS 选择器 / 返回数值的函数）即可留出空间。

```js
{ scrollYOffset: 60 } // 顶栏高 60px
```

## 已废弃的旧选项名（别照搬）

Redoc 2.x 改了一批选项名，照抄老文档里的旧名通常**不报错但不生效**，是高频坑：

| 旧名（已废弃） | 现行替代 |
| --- | --- |
| `hideDownloadButton` | `hideDownloadButtons`（复数） |
| `requiredPropsFirst` | `sortRequiredPropsFirst` |
| `jsonSampleExpandLevel` | `jsonSamplesExpandLevel` |
| `expandResponses` | （已弃用，见官方现行项） |
| `nativeScrollbars` | （已弃用，见官方现行项） |

::: warning 迁移时逐项核对官方现行表
配置不生效但又没报错时，第一怀疑就是用了废弃旧名。迁移老配置时，对照 [官方文档](https://redocly.com/docs/redoc) 现行选项表逐个核实，别凭记忆。
:::

## theme 主题定制

`theme` 是嵌套对象，可定制主色、字体、排版等。HTML 元素方式要 JSON 字符串，`Redoc.init` / React 直接写对象：

```js
{
  theme: {
    colors: { primary: { main: "#119DA4" } },
    typography: { fontSize: "15px" },
  },
}
```

下一步：[Vendor Extensions](./vendor-extensions.md) · [开源 vs 商业与选型](./open-source-vs-commercial.md)
