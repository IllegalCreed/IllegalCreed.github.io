---
layout: doc
outline: [2, 3]
---

# 主题与对比选型

> 基于 @scalar/api-reference 1.60.0 编写

## 速查

- **11 套内置主题** + `none`：`default` `alternate` `moon` `purple` `solarized` `bluePlanet` `saturn` `kepler` `mars` `deepSpace` `laserwave`
- `theme`（配色）与 `layout`（`modern` / `classic` 版式）是**两个正交维度**；细节再用 `customCss` 精修
- **vs Swagger UI**：Scalar 内置完整客户端 + 现代 UI；Swagger UI 有 Try it out 但较弱、UI 偏老
- **vs Redoc**：Redoc 静态**只读**、无交互；Scalar 可发**真实请求**
- 许可：Scalar **MIT** / Swagger UI **Apache-2.0** / Redoc **MIT**
- 选型口诀：要"现代 UI + 真能调接口"选 **Scalar**；要轻量只读静态文档可选 **Redoc**；已深绑 Swagger 生态可继续 **Swagger UI**

## 11 套内置主题

`theme` 字段从下列预设里 11 选 1，另有 `none`（不套任何 Scalar 主题，配合 `customCss` 完全自定义）：

| 主题 | 主题 | 主题 |
| --- | --- | --- |
| `default` | `alternate` | `moon` |
| `purple` | `solarized` | `bluePlanet` |
| `saturn` | `kepler` | `mars` |
| `deepSpace` | `laserwave` | `none`（自定义） |

```ts
createApiReference("#app", { url: "/openapi.json", theme: "saturn" });
```

::: tip 主题 ≠ 布局 ≠ 明暗
- `theme`：选配色（11 套 + none）
- `layout`：选版式（`modern` 默认 / `classic`）
- `darkMode` / `forceDarkModeState`：管明暗
三者独立组合；要再精修用 `customCss`。
:::

## 现代 UI 的具体载体

Scalar 相对 Swagger UI 的"现代感"不是空话，而是由三件套支撑：

- **11 套配色主题**——一行 `theme` 切换整体观感
- **modern / classic 两种布局**——`layout` 切版式
- **`customCss` 精修**——注入 CSS 改字体 / 间距 / 品牌色细节

叠加对**大文档的渲染性能优化**，接口数量庞大时仍较流畅。

## 三者横向对比

| 维度 | **Scalar** | Swagger UI | Redoc |
| --- | --- | --- | --- |
| 定位 | 渲染 + **内置客户端** | 渲染 + 弱 Try it out | **只读**渲染 |
| 发真实请求 | **能**（完整客户端） | 能但较弱 | **不能** |
| 环境变量 / 历史 | **有** | 基本没有 | 无 |
| 代码片段 | **25+ 语言** | 有限 | 有（只读展示） |
| UI 现代度 | **高**（11 主题 / 2 布局） | 偏老 | 简洁但静态 |
| 许可 | **MIT** | Apache-2.0 | MIT |

## 怎么选

- **要"现代 UI + 真能在文档里调接口"** → 选 **Scalar**。内置客户端 + 环境变量 + 历史，把 Postman 的核心体验搬进文档。
- **只要一份轻量、只读的静态 API 文档** → **Redoc** 足够，无交互负担。
- **项目已深绑 Swagger 生态 / 团队熟悉** → 继续 **Swagger UI** 也行，或用 Scalar 平滑替换其渲染层（spec 仍由原 Swagger 模块生成）。

::: warning 别把 Scalar 当生成器来比
对比的是"渲染 / 交互层"。三者都**消费**已有的 OpenAPI spec，都**不生成** spec——生成始终是上游框架的职责。选型选的是"用哪个渲染、交互体验如何"。
:::

## 开源渲染器 vs 托管平台

最后澄清一个易混点：

- **开源（MIT）**：`@scalar/api-reference`（渲染器）、`@scalar/api-client`（客户端）——免费、可自托管、可商用
- **托管平台（freemium）**：Scalar 的 Registry / Dashboard / SDK 生成等增值服务

内置客户端属于**开源**部分，不需要付费；不要因为存在托管平台就误以为渲染 / 客户端能力收费。

下一步：[速查参考](../reference.md) · [接入方式](./integration.md) · [配置对象详解](./configuration.md)
