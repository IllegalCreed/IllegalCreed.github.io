---
layout: doc
---

# Swagger UI

一套 HTML / JS / CSS 静态资源，把一份 **OpenAPI**（旧称 Swagger）规范文档自动渲染成**可交互**的可视化 API 文档——读者能在页面里直接展开端点、看模型、并用内置的 **Try it out** 真实发起请求。关键认知：它**只渲染 spec，不生成 spec**。生成 spec 的是后端的注解扫描器（如 springdoc、swagger-jsdoc）或手写 YAML/JSON；Swagger UI 只决定「这份描述怎么展示、怎么调试」。OpenAPI 是**规范**本身（formerly the Swagger Specification），Swagger 则是围绕该规范的一整套**工具套件**，Swagger UI 是其中负责「展示」的那一员。

## 评价

**优点**

- 渲染即可交互：内置 Try it out，可在文档页直接填参数、发真实请求、看实际响应，是开源同类里**调试最成熟**的一个
- 生态最通用：作为 Swagger 工具套件成员，后端框架/语言几乎都有对接（springdoc、swagger-jsdoc、swagger-ui-express…），社区资料海量
- 三种分发形态覆盖全场景：`swagger-ui`（带打包器项目）、`swagger-ui-dist`（服务端分发静态资源）、`swagger-ui-react`（React 组件）
- 规范覆盖广：支持 Swagger 2.0 与 OpenAPI 3.0.x / 3.1.x / 3.2.0
- 配置丰富且可深度定制：从展开程度、排序、过滤到请求/响应拦截器、OAuth（含 PKCE）一应俱全；Apache-2.0 可商用

**缺点**

- 单栏布局观感不如 Redoc 三栏只读那么「文档站」，纯阅读型对外发布常被嫌不够精致
- 默认行为有「坑」：`validatorUrl` 默认把 spec 发往公网校验、`deepLinking` 默认关、`spec` 与 `url` 同传时 `url` 被忽略，不读文档容易踩
- 浏览器同源策略的天然约束：Try it out 跨域要目标服务端开 CORS；OAS 3.0 的 Cookie 参数在浏览器里实测发不出
- `swagger-ui-react` 近 20 个 props 多为 mount-only，运行时改值不传播，集成期望与现实易错位

## 文档地址

[Swagger UI](https://swagger.io/tools/swagger-ui/)

## GitHub地址

[Swagger UI](https://github.com/swagger-api/swagger-ui)

## 幻灯片地址

<a href="/SlideStack/swagger-ui-slide/" target="_blank">Swagger UI</a>
