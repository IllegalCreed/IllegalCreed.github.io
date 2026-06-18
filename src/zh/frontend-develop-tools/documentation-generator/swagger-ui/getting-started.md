---
layout: doc
outline: [2, 3]
---

# 快速上手

> 基于 Swagger UI 5.32.6 编写

## 速查

- Swagger UI **只渲染 spec，不生成 spec**——spec 由后端扫描器（springdoc / swagger-jsdoc）或手写产出
- 区分术语：**OpenAPI** 是规范（旧称 Swagger Specification），**Swagger** 是工具套件，Swagger UI 是其中的「展示」工具
- 三个 flavor（均 **5.32.6**，Apache-2.0）：`swagger-ui`（有打包器项目首选）/ `swagger-ui-dist`（服务端分发静态资源，体积更大）/ `swagger-ui-react`（React 组件）
- 浏览器初始化入口：`SwaggerUIBundle({ ... })`（等价 `SwaggerUI`）；独立完整版再配 `SwaggerUIStandalonePreset`
- 挂载点二选一必填：`dom_id`（选择器字符串）或 `domNode`（DOM 元素）
- 喂 spec：单文档用 `url`；内联对象用 `spec`；多文档下拉用 `urls`——**同传 `spec` 与 `url` 时 `url` 被忽略**
- 支持规范：Swagger 2.0 + OpenAPI 3.0.x / 3.1.x / 3.2.0
- 私有部署先关在线校验：`validatorUrl: "none"`（默认会把 spec 发往公网 validator）

## Swagger UI 不是什么

把 Swagger UI 当成「能从代码自动产出 API 描述」的工具，是最常见的认知错误。三点澄清：

- **不生成 spec**：扫描代码注解、产出 `openapi.json` 的是 springdoc（Java）/ swagger-jsdoc（Node）等扫描器，或人手写；Swagger UI 只消费这份 spec。
- **不是独立软件**：它是内嵌进网页的静态资源（HTML/JS/CSS），跑在浏览器里；虽内置 Try it out 调试，但不是 Postman 那样的独立客户端。
- **不等于 OpenAPI**：OpenAPI 是规范，Swagger UI 是消费该规范的一个工具。文档内容由 spec 决定，Swagger UI 只决定展示与调试方式。

::: tip 一句话定位
spec 决定「文档里有什么」，Swagger UI 决定「这份 spec 怎么展示、怎么调试」。没有上游 spec，Swagger UI 页面就是空的。
:::

## 三种分发形态（flavor）

| 包 | 适用场景 | 关键点 |
| --- | --- | --- |
| `swagger-ui` | 自己有打包器（webpack / Vite）的项目，**官方优先推荐** | 按需 import，利于 tree-shaking |
| `swagger-ui-dist` | 服务端直接分发预构建静态资源 | 含全局 `SwaggerUIBundle` / `SwaggerUIStandalonePreset` 与 `absolutePath()`；**体积更大** |
| `swagger-ui-react` | React 应用内嵌 | peer `react >=16.8 <20`；多数 props **仅 mount 时生效一次** |

::: warning 有打包器仍硬塞 dist 会增大包体
`swagger-ui-dist` 是给「服务端直接吐文件」用的完整预构建产物。已有打包器的项目应用 `swagger-ui` 包按需引入，否则会把整坨资源打进 bundle。
:::

## 最小初始化（浏览器 / dist 形态）

服务端用 `swagger-ui-dist`，浏览器侧用全局 `SwaggerUIBundle` 渲染：

```html
<div id="swagger-ui"></div>
<script src="./swagger-ui-bundle.js"></script>
<script>
  window.ui = SwaggerUIBundle({
    url: "/openapi.json", // 指向你的 spec
    dom_id: "#swagger-ui", // 挂载点（也可用 domNode 传元素）
    deepLinking: true, // 生成锚点，可分享直达某接口的链接（默认 false）
  });
</script>
```

要「独立完整版」（带顶部地址栏的 topbar），把布局换成 `StandaloneLayout` 并加入对应 preset：

```js
window.ui = SwaggerUIBundle({
  url: "/openapi.json",
  dom_id: "#swagger-ui",
  presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
  layout: "StandaloneLayout", // 默认是 BaseLayout（无顶部地址栏）
});
```

## 谁生成 spec、谁渲染

| 角色 | 由谁承担 | 职责 |
| --- | --- | --- |
| **生成 spec** | springdoc / swagger-jsdoc 等扫描器，或手写 | 扫描代码注解或人工编写，产出 `openapi.json` |
| **渲染 spec** | **Swagger UI** | 把 spec 渲染成可交互页面，提供 Try it out 调试 |

分工清晰：生成永远在扫描器侧，渲染永远在 Swagger UI 侧。所以「跑通 Swagger UI 就有完整文档」忽略了上游产 spec 这一步——文档的完整与准确取决于 spec。

## 在项目里采用 Swagger UI

1. **先有 spec**——后端用扫描器产出 `openapi.json`，或手写一份。
2. **选 flavor**——有打包器选 `swagger-ui`；服务端分发选 `swagger-ui-dist`；React 应用选 `swagger-ui-react`。
3. **初始化挂载**——`SwaggerUIBundle({ url, dom_id })`，按需开 `deepLinking` / `tryItOutEnabled` 等。
4. **按需收紧默认**——私有部署设 `validatorUrl: "none"`；隐藏 Models 设 `defaultModelsExpandDepth: -1`；大文档设 `docExpansion: "none"`。

下一步：[配置项详解](./guide-line/configuration.md) · [三种交付形态与初始化](./guide-line/flavors.md) · [Try it out 与 CORS](./guide-line/tryitout-cors.md) · [OAuth 与对比选型](./guide-line/oauth-and-comparison.md) · [速查参考](./reference.md)
