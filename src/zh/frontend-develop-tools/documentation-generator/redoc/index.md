---
layout: doc
---

# Redoc

Redocly 出品的**开源（MIT）OpenAPI 文档渲染器**——把一份已有的 OpenAPI / Swagger 规范渲染成**响应式三栏只读** API 文档（左导航、中内容、右代码样例），是 Redocly 商业平台的社区版。它的核心特征是**消费 spec、不生成 spec**：你得先有 `openapi.yaml`，Redoc 负责把它「画」成漂亮、结构清晰的参考文档。要「能点着调接口」请看 Swagger UI / Scalar；要「漂亮的只读三栏参考文档」，Redoc 是甜区。

## 评价

**优点**

- 观感出众：响应式三栏 + 菜单滚动同步（scroll-spy），大型 API 文档阅读动线清晰
- 复杂 schema 渲染强：`oneOf` / `anyOf` / `allOf` / `discriminator` 等组合/多态结构都能良好可视化
- 接入方式多：HTML 自定义元素、`Redoc.init` JS API、React `RedocStandalone` 组件、`@redocly/cli build-docs` 出静态 HTML，四条路径任选
- 广覆盖：支持 OpenAPI 3.1 / 3.0 与 Swagger 2.0，遗留文档也能直接渲染
- 可品牌化：`x-logo`（品牌 Logo）、`x-tagGroups`（分组导航）、`x-codeSamples`（多语言示例）等 vendor extension
- 开源 MIT，可自由商用

**缺点**

- 开源版**默认没有 Try-it-out**：不能在文档里直接发请求调接口，交互调用属商业版 / Replay
- 只读定位：要交互调试得换 Swagger UI / Scalar，或上 Redocly 商业产品
- 仍要先有 spec：不帮你从代码生成 OpenAPI，生成那步得靠别的工具或手写
- 配置项有「旧名 → 新名」更替（如 `hideDownloadButton` → `hideDownloadButtons`），照搬老文档易踩坑
- 老的 `redoc-cli` 已弃用停更，须改用 `@redocly/cli`

## 文档地址

[Redoc](https://redocly.com/docs/redoc)

## GitHub地址

[Redoc](https://github.com/Redocly/redoc)

## 幻灯片地址

<a href="/SlideStack/redoc-slide/" target="_blank">Redoc</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=redoc" target="_blank" rel="noopener noreferrer">Redoc 测试题</a>
