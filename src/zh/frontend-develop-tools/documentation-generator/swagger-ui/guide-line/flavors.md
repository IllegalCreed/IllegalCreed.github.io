---
layout: doc
outline: [2, 3]
---

# 三种交付形态与初始化

> 基于 Swagger UI 5.32.6 编写

## 速查

- 三个 npm 包同版本 **5.32.6**、Apache-2.0：`swagger-ui` / `swagger-ui-dist` / `swagger-ui-react`
- `swagger-ui`：带打包器项目**官方首选**，按需 import、利于 tree-shaking
- `swagger-ui-dist`：服务端分发的**预构建静态资源**，暴露全局 `SwaggerUIBundle`、`SwaggerUIStandalonePreset`，提供 `absolutePath()` 取资源磁盘路径；**体积更大**
- `swagger-ui-react`：React 组件，peer `react >=16.8 <20`；近 20 个 props **仅 mount 时生效一次**，运行时改值不传播
- 浏览器入口：`SwaggerUIBundle({...})`（等价 `SwaggerUI`）；独立版加 `SwaggerUIStandalonePreset` + `layout: "StandaloneLayout"`
- 挂载点：`dom_id`（选择器）或 `domNode`（元素），二选一必填

## 形态对照

| 维度 | `swagger-ui` | `swagger-ui-dist` | `swagger-ui-react` |
| --- | --- | --- | --- |
| 适用 | 有打包器项目（首选） | 服务端直接分发 | React 应用 |
| 引入 | 按需 `import` | 静态文件 / 全局变量 | `import SwaggerUI from "swagger-ui-react"` |
| 体积 | 小（可摇树） | **更大**（完整预构建） | 取决于 React 打包 |
| 特有 | —— | `absolutePath()`、全局 Bundle / Preset | mount-only props |

## `swagger-ui-dist`：服务端分发

`swagger-ui-dist` 是预构建好的整套资源，专为「后端把文件直接吐给浏览器」设计。它暴露两个全局变量与一个辅助方法：

- 全局 `SwaggerUIBundle`：浏览器侧的初始化入口（等价 `SwaggerUI`）。
- 全局 `SwaggerUIStandalonePreset`：独立完整版布局所需的 preset。
- `absolutePath()`：返回这些静态资源在磁盘上的绝对路径，便于后端挂为静态目录。

```js
// Node 服务端：拿到 dist 资源目录，挂成静态路由
const swaggerUiDistPath = require("swagger-ui-dist").absolutePath();
// 然后把 swaggerUiDistPath 作为静态目录对外提供，再用一段 HTML 调 SwaggerUIBundle
```

::: warning dist 体积更大，别在有打包器的项目里硬塞
有 webpack / Vite 时应改用 `swagger-ui` 包按需引入。`swagger-ui-dist` 是完整预构建产物，直接打进 bundle 会徒增包体。
:::

## `swagger-ui` + 打包器

有打包器的项目按需 import，配合 CSS 一起引入：

```js
import SwaggerUI from "swagger-ui";
import "swagger-ui/dist/swagger-ui.css";

SwaggerUI({
  url: "/openapi.json",
  dom_id: "#swagger-ui",
});
```

## `swagger-ui-react`：React 组件

```tsx
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocs() {
  return <SwaggerUI url="/openapi.json" />;
}
```

两个必须知道的点：

- **peer 依赖**：`react >=16.8 <20`，即兼容 16.8 / 17 / 18 / 19，不保证 React 20。
- **props 多为 mount-only**：组件暴露近 20 个 props（`url`、`spec`、`docExpansion` 等），但绝大多数仅在**首次挂载时读取一次**，运行时再改这些 prop 的值**不会传播**到已渲染实例。

::: warning 运行时切换 url 靠改 prop 通常无效
想在运行时换 spec，常见 workaround 是给组件加 `key`（如 `<SwaggerUI key={url} url={url} />`）强制重新挂载，而不是指望改 prop 生效。
:::

## 独立完整版（StandaloneLayout）

默认 `layout` 是 `'BaseLayout'`（无顶部地址栏）。要带 topbar、可在顶部输入/切换 spec 地址的「独立版」，需两件事配套：

```js
window.ui = SwaggerUIBundle({
  url: "/openapi.json",
  dom_id: "#swagger-ui",
  presets: [
    SwaggerUIBundle.presets.apis,
    SwaggerUIStandalonePreset, // ① 加入注册了 StandaloneLayout 的 preset
  ],
  layout: "StandaloneLayout", // ② 切换布局
});
```

`SwaggerUIStandalonePreset` 是「插件集合」，注册了 `StandaloneLayout` 组件；缺它而只设 `layout: "StandaloneLayout"` 会找不到该布局。

::: tip presets 与 plugins 的关系
`plugins` 是插件数组（可注入 / 覆盖组件、state、actions）；`presets` 是把一组插件打包的集合（如 `SwaggerUIStandalonePreset`、`SwaggerUIBundle.presets.apis`）。preset 即若干 plugin 的捆绑，便于整体引入。
:::

下一步：[配置项详解](./configuration.md) · [Try it out 与 CORS](./tryitout-cors.md)
