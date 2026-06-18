---
layout: doc
outline: [2, 3]
---

# 内置 API 客户端与 CORS

> 基于 @scalar/api-reference 1.60.0 / @scalar/api-client 3.10.4 编写

## 速查

- Scalar 内置**完整 API 客户端**：可对接口发**真实请求**，远超 Swagger UI 的 Try it out
- 客户端能力：环境变量、请求历史、25+ 语言代码片段，并有独立**桌面 app**
- 客户端核心包 `@scalar/api-client`（约 3.10.4），与渲染包 `@scalar/api-reference`（1.60.0）**版本线独立**，均 MIT
- 跨域：浏览器直连接口受同源策略限制，未开 CORS 时配 `proxyUrl`（默认 `https://proxy.scalar.com`）
- CORS 报错**先查 proxyUrl**；生产**建议自建代理**或让后端直接开放 CORS，别长期依赖公共代理
- 预填凭据用 `authentication`；覆盖目标服务器用 `servers`；定制请求用 `customFetch`（旧 `fetch` 选项已弃用）

## 内置客户端：Scalar 的杀手锏

Scalar 与其他渲染器最大的差异，就是把一个**完整的 API 客户端**直接内嵌进文档。读者无需切到 Postman，就能在文档里：

- 对接口发**真实网络请求**并看到响应
- 用**环境变量**管理 baseURL / token 等
- 查看**请求历史**
- 复制 **25+ 种语言**的请求代码片段（curl、JS fetch、Python、Go…）

这也是它和只读的 Redoc 的根本区别（Redoc 不能发请求），以及相对 Swagger UI 弱版 Try it out 的代际优势。客户端本身由 `@scalar/api-client`（约 3.10.4）提供，还有桌面 app 形态；它与渲染包 `@scalar/api-reference` 版本线独立，但都 MIT 开源、免费。

## 为什么会撞上 CORS

内置客户端是在**浏览器里**直接向被调接口发请求。如果该接口没有对你的文档站点开放 CORS 响应头，浏览器会拦截请求——这不是 Scalar 的 bug，而是浏览器同源策略使然。

::: warning 忘配 proxyUrl 是 CORS 失败的高频原因
症状：内置客户端一发请求就报跨域。**第一步排查 `proxyUrl` 是否正确配置**，其次确认后端是否需要直接开 CORS。
:::

## 用 proxyUrl 绕过 CORS

`proxyUrl` 让客户端的请求先打到一个代理，由代理转发到目标接口，从而绕过浏览器的跨域限制。Scalar 默认指向其托管的公共代理 `https://proxy.scalar.com`：

```ts
createApiReference("#app", {
  url: "/openapi.json",
  proxyUrl: "https://proxy.scalar.com", // 开发期便利，生产建议替换为自建
});
```

## 生产不要长期依赖公共代理

默认 `proxyUrl` 指向 Scalar 托管的公共代理，意味着所有跨域请求会**经第三方转发**：

- 请求（可能含敏感数据）流经外部服务，有外泄隐患
- 可用性受制于公共代理的稳定性
- 不符合很多团队"数据不出域"的合规要求

::: tip 生产做法
自建一个轻量代理（或让后端直接对文档站点开放 CORS），把 `proxyUrl` 指向自己的代理。公共代理仅作开发期便利。
:::

## 配套请求字段

| 字段 | 作用 | 典型场景 |
| --- | --- | --- |
| `authentication` | 预填鉴权凭据 | 打开文档即可带 token 发请求 |
| `servers` | 覆盖 spec 的 servers | 把 prod 地址临时换成本地 mock |
| `customFetch` | 传入自定义 fetch 实现 | 加请求拦截 / 统一改 header |
| `defaultHttpClient` | 默认代码片段语言 | 团队主用 curl 或 fetch |
| `hiddenClients` | 隐藏部分代码片段语言 | 只保留团队关心的语言 |

```ts
createApiReference("#app", {
  url: "/openapi.json",
  servers: [{ url: "http://localhost:3000" }], // 覆盖目标服务器
  authentication: { preferredSecurityScheme: "bearerAuth" }, // 预填凭据
  defaultHttpClient: { targetKey: "shell", clientKey: "curl" },
});
```

## 想做成只读展示

并非所有文档都需要发请求。要把 Scalar 收敛成接近只读：同时设 `hideTestRequestButton` 与 `hideClientButton`，从入口移除发请求路径。这体现 Scalar 既能强交互、也能按需降级。

下一步：[主题与对比选型](./themes-comparison.md) · [配置对象详解](./configuration.md) · [速查参考](../reference.md)
