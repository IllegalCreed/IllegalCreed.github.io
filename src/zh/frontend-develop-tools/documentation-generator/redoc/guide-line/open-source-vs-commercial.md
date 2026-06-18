---
layout: doc
outline: [2, 3]
---

# 开源 vs 商业与对比选型

> 基于 Redoc 2.5.3 / @redocly/cli 2.34.0 编写

## 速查

- **Redoc**（开源 MIT 库）≠ **Redocly**（公司及其商业产品线 Reunite / Realm / Revel / Reef）
- 开源版 Redoc：**三栏只读**、复杂 schema 渲染强、可品牌化；**默认无 Try-it-out**（交互调用属商业版 / Replay）
- vs **Swagger UI**：Swagger UI **单栏 + 内置 try-it-out**；Redoc 三栏只读、开源版无交互
- vs **Scalar**：Scalar **现代三栏 + 内置 API 客户端**（可发请求）；开源 Redoc 三栏只读
- 选型一句话：**要能点着调接口 → Swagger UI / Scalar；要漂亮只读三栏参考文档 → Redoc**
- 三者都消费 OpenAPI，差异集中在**版面**与**是否内置交互调用**

## 开源 Redoc vs Redocly 商业

| 维度 | Redoc（开源） | Redocly（商业产品） |
| --- | --- | --- |
| 是什么 | MIT 开源的 OpenAPI 渲染库 | 公司及商业平台（Reunite / Realm / Revel / Reef 等） |
| 交互调用 Try-it-out | **默认没有** | 有（如 Replay） |
| 适用 | 只读参考文档 | 完整开发者门户 / 平台能力 |
| 费用 | 免费 | 付费 |

::: warning 库 MIT ≠ 所有能力免费
Redoc 库本身 MIT、可自由商用，但「能在文档里发请求调接口」「完整开发者门户」等属于 Redocly 商业范畴。把开源 Redoc 当成「自带商业平台全部能力」会踩坑。
:::

## Redoc vs Swagger UI vs Scalar

| 工具 | 版面 | 内置交互调用 | 一句话 |
| --- | --- | --- | --- |
| **Redoc** | 三栏 | **开源版无**（商业版有） | 漂亮只读三栏参考文档 |
| **Swagger UI** | 单栏 | **有**（try-it-out） | 可在页面直接调接口调试 |
| **Scalar** | 现代三栏 | **有**（内置 API 客户端） | 现代观感 + 能调接口 |

三者都消费 OpenAPI。Scalar 和 Redoc 都是三栏观感，但 Scalar 把「能调接口」做进了默认体验，这是它与开源 Redoc 的关键分野。

## 怎么选

```text
需要读者在文档里直接发请求调接口吗？
├── 需要 ──► Swagger UI（单栏经典）/ Scalar（现代三栏 + API 客户端）
│           或：坚持 Redoc，则上 Redocly 商业版 / Replay
└── 不需要，只要漂亮的只读参考文档 ──► Redoc（开源 MIT，三栏，schema 渲染强）
```

次级因素再叠加：

- **复杂 schema 多**（`oneOf` / `discriminator` 等）：Redoc 渲染强，是加分项
- **遗留 Swagger 2.0**：Redoc 支持，可直接渲染
- **要品牌化**：Redoc 的 `x-logo` / `x-tagGroups` / `x-codeSamples` 好用
- **许可证**：Redoc 库 MIT，可商用

## 常见坑清单

1. 以为开源 Redoc **自带 Try-it-out**（错，商业版才有）
2. 还在用 **`redoc-cli`**（已弃用，改 `@redocly/cli build-docs`）
3. 照搬**老选项名**（`hideDownloadButton` / `expandResponses` / `nativeScrollbars` / `requiredPropsFirst` / `jsonSampleExpandLevel` 在 2.x 已废弃）
4. **`file://` 直开 HTML** 加载本地 spec 失败（同源策略，需 HTTP server）
5. 把 **Redoc 当 Swagger UI 同类**随意互换（定位不同）
6. HTML 属性误用 **camelCase**（须 kebab-case）
7. 混淆 **Redoc（开源库）与 Redocly（公司 / 商业产品）**

下一步：[速查参考](../reference.md)
