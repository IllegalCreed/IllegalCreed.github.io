---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Redoc 2.5.3 / @redocly/cli 2.34.0 编写

## 速查

- Redoc =**消费 OpenAPI、渲染成三栏只读文档**的开源（MIT）渲染器；**不生成 spec**
- 四种接入：HTML 元素 / `Redoc.init` / React `RedocStandalone` / `@redocly/cli build-docs`
- CLI：`npx @redocly/cli build-docs apis/openapi.yaml` → 默认 `redoc-static.html`，`-o` 改名；旧 `redoc-cli` 已弃用
- 配置命名：HTML 属性 **kebab-case**、`Redoc.init`/React **camelCase**、嵌套 `theme` 在 HTML 上用 **JSON 字符串**
- 开源版**默认无 Try-it-out**；要交互调接口选 Swagger UI / Scalar，或上 Redocly 商业版
- vendor extension：`x-tagGroups`（分组）/ `x-logo`（Logo）/ `x-codeSamples`（多语言示例）
- 支持 **OpenAPI 3.1 / 3.0 / Swagger 2.0**；版本 redoc **2.5.3**、`@redocly/cli` **2.34.0**

## 四种接入速查

| 方式 | 关键写法 | 配置命名 |
| --- | --- | --- |
| HTML 元素 | `<redoc spec-url='...'>` + `redoc.standalone.js` | kebab-case 属性 |
| `Redoc.init` | `Redoc.init(specOrSpecUrl, options, element, callback)` | camelCase 对象 |
| React | `import { RedocStandalone } from 'redoc'`；`<RedocStandalone specUrl=... options=… />` | camelCase 对象 |
| CLI | `npx @redocly/cli build-docs apis/openapi.yaml`（默认 `redoc-static.html`，`-o` 改名） | — |

## 常用配置项速查（2.x 现行）

| 配置项 | 作用 |
| --- | --- |
| `disableSearch` | 禁用站内搜索 |
| `hideDownloadButtons` | 隐藏下载 spec 按钮（复数） |
| `hideSchemaTitles` | 隐藏 schema 标题 |
| `sortRequiredPropsFirst` | 必填属性排前 |
| `onlyRequiredInSamples` | 示例只含必填属性 |
| `showExtensions` | 显示 `x-` 扩展字段 |
| `scrollYOffset` | 锚点跳转纵向偏移（配合固定顶栏） |
| `jsonSamplesExpandLevel` | JSON 样例展开层级，默认 `2`，可 `"all"` |
| `schemasExpansionLevel` | Schemas 区 schema 展开层级 |
| `theme.*` | 主题（颜色 / 字体 / 间距），嵌套对象 |

## 已废弃旧选项名对照

| 旧名（已废弃） | 现行替代 |
| --- | --- |
| `hideDownloadButton` | `hideDownloadButtons` |
| `requiredPropsFirst` | `sortRequiredPropsFirst` |
| `jsonSampleExpandLevel` | `jsonSamplesExpandLevel` |
| `expandResponses` | （已弃用） |
| `nativeScrollbars` | （已弃用） |

## Vendor Extensions 速查

| 扩展 | 位置 | 作用 |
| --- | --- | --- |
| `x-tagGroups` | 顶层 | 多 tag 归并成分组导航 |
| `x-logo` | `info` 下 | 文档展示品牌 Logo |
| `x-codeSamples` | operation 下 | 多语言请求示例代码 |

## Redoc vs Swagger UI vs Scalar

| 工具 | 版面 | 内置交互调用 | 选它的理由 |
| --- | --- | --- | --- |
| **Redoc** | 三栏 | 开源版无（商业版有） | 漂亮只读三栏参考文档 |
| **Swagger UI** | 单栏 | 有（try-it-out） | 页面里直接调接口调试 |
| **Scalar** | 现代三栏 | 有（API 客户端） | 现代观感 + 能调接口 |

> 选型一句话：要能点着调接口 → Swagger UI / Scalar；要漂亮只读三栏参考文档 → Redoc。

## CLI 迁移对照

| 旧（已弃用 redoc-cli） | 新（@redocly/cli） |
| --- | --- |
| `redoc-cli build` | `redocly build-docs` |
| `redoc-cli bundle` | `redocly bundle` |

## 版本与生态

| 项 | 版本 | 说明 |
| --- | --- | --- |
| `redoc` | **2.5.3** | 稳定线（2026-05-29），另有 next `3.0.0-rc.0` |
| `@redocly/cli` | **2.34.0** | 现行 CLI，含 `build-docs` / `bundle` 等 |
| `redoc-cli` | 0.13.21 | **已弃用停更**（2023-03），迁到 `@redocly/cli` |

> 许可证 MIT；支持 OpenAPI 3.1 / 3.0 / Swagger 2.0。

## 文档与 GitHub 链接

- 产品页：[https://redocly.com/redoc](https://redocly.com/redoc)
- 官方文档：[https://redocly.com/docs/redoc](https://redocly.com/docs/redoc)
- GitHub 仓库：[https://github.com/Redocly/redoc](https://github.com/Redocly/redoc)
- 在线 Demo：[https://redocly.github.io/redoc/](https://redocly.github.io/redoc/)

返回：[四种接入](./guide-line/integration.md) · [配置项](./guide-line/configuration.md) · [Vendor Extensions](./guide-line/vendor-extensions.md) · [开源 vs 商业](./guide-line/open-source-vs-commercial.md)
