---
layout: doc
outline: [2, 3]
---

# OAuth 与对比选型

> 基于 Swagger UI 5.32.6 编写

## 速查

- OAuth 配置走实例方法 `initOAuth(configObj)`，常在 `onComplete` 里调用
- 关键字段：`clientId`、`scopes`、`scopeSeparator`、`usePkceWithAuthorizationCodeGrant`、`useBasicAuthenticationWithAccessCodeGrant`
- **`clientSecret` 严禁用于生产前端**——浏览器里必然可见＝泄密；公共客户端应开 `usePkceWithAuthorizationCodeGrant`（PKCE）
- 回调地址用 `oauth2RedirectUrl`（通常指向自带的 `oauth2-redirect.html`），须与授权服务器登记一致
- 预填凭据：`preauthorizeApiKey`（预置 API Key）/ `preauthorizeBasic`（预置 Basic 凭据）
- 刷新保留授权：`persistAuthorization` 默认 false（开后落 localStorage）
- 选型：三者（Swagger UI / Redoc / Scalar）**都只渲染不生成**；Swagger UI 调试最成熟（内置 Try it out、单栏）；Redoc 三栏只读、开源版无 try-it-out；Scalar 现代 UI + 更强内置 API 客户端

## initOAuth：配置 OAuth2 流程

初始化得到的实例上有 `initOAuth(configObj)`，用于传入 OAuth2 授权参数。典型写法是在 `onComplete` 回调里调用：

```js
const ui = SwaggerUIBundle({
  url: "/openapi.json",
  dom_id: "#swagger-ui",
  oauth2RedirectUrl: window.location.origin + "/oauth2-redirect.html",
  onComplete: () => {
    ui.initOAuth({
      clientId: "swagger-ui-client",
      scopes: "openid profile",
      scopeSeparator: " ", // 多 scope 分隔符，适配非标准授权服务器
      usePkceWithAuthorizationCodeGrant: true, // 公共客户端开 PKCE
    });
  },
});
```

| 字段 | 作用 |
| --- | --- |
| `clientId` | OAuth 客户端标识 |
| `clientSecret` | 客户端密钥——**严禁生产前端使用**（见下） |
| `scopes` | 要请求的权限范围 |
| `scopeSeparator` | 多个 scope 之间的分隔符（默认空格，可适配用逗号等的服务器） |
| `usePkceWithAuthorizationCodeGrant` | 授权码模式启用 PKCE |
| `useBasicAuthenticationWithAccessCodeGrant` | 换 token 时是否用 HTTP Basic 传 client 凭据 |

## clientSecret 与 PKCE：安全红线

Swagger UI 跑在浏览器里，任何传给 `initOAuth` 的 `clientSecret` 都会出现在前端代码 / 网络里，对任何用户可见——这等于**把 OAuth 客户端密钥公开泄露**。

::: warning 公共客户端用 PKCE，而不是把 secret 放前端
浏览器 / SPA / Swagger UI 都属「公共客户端」（无法保密 secret）。正确做法是设 `usePkceWithAuthorizationCodeGrant: true`，用授权码 + PKCE（Proof Key for Code Exchange，一次性的 code verifier / challenge）完成流程，从而**无需在前端保存任何 client secret**。无论 OAS 2.0 还是 3.x，前端暴露 secret 都不安全。
:::

`useBasicAuthenticationWithAccessCodeGrant` 则控制授权码模式向 token 端点换 token 时，是否用 HTTP Basic 方式传 client 凭据（而非放 body）——用于适配不同授权服务器的要求，是互操作性的细粒度适配项。

## 回调与预授权

- `oauth2RedirectUrl`：OAuth2 授权码流程中授权服务器回跳的重定向地址，通常指向 Swagger UI 自带的 `oauth2-redirect.html`。授权服务器里登记的回调 URL 必须与之**完全一致**，否则授权失败。
- `preauthorizeApiKey(authDefinitionKey, apiKeyValue)`：在 UI 中预先填好某个 API Key 安全方案的值，免去用户手动在 Authorize 弹窗输入。
- `preauthorizeBasic(...)`：预填 HTTP Basic 凭据。
- `persistAuthorization`（默认 false）：开启后用户填的授权持久化到 `localStorage`，刷新页面不丢失；注意凭据落地浏览器存储，公共 / 共享机器上需评估风险。

```js
const ui = SwaggerUIBundle({ /* ... */ });
ui.preauthorizeApiKey("ApiKeyAuth", "demo-key-123"); // 演示 / 内部环境免手动授权
```

## 对比选型：Swagger UI / Redoc / Scalar

三者**共同点**：都只**渲染**已有的 OpenAPI spec，**都不生成** spec（spec 始终来自后端扫描器或手写）。它们竞争的是「渲染体验与调试能力」，不是「生成能力」。

| 工具 | 布局 | 内置调试 | 定位 |
| --- | --- | --- | --- |
| **Swagger UI** | 单栏 | **Try it out（最成熟）** | 可交互的 API 文档 / 控制台，生态最通用 |
| **Redoc** | 三栏只读 | 开源版**无 try-it-out** | 精美只读文档站，适合对外发布阅读 |
| **Scalar** | 现代 UI | **内置功能更强的 API 客户端** | 现代观感 + 接近独立测试工具的调试 |

## 怎么选

- **要内置调试、生态最稳** → Swagger UI（内置 Try it out，后端框架对接最全）。
- **要精美只读对外文档** → Redoc（三栏、观感现代；开源版不带在线发请求）。
- **要现代 UI + 强调试客户端** → Scalar（更现代，内置更强的 API 客户端）。

::: tip 阅读与调试可以组合
常见组合：对外发布用 Redoc（好看、聚焦阅读），内部调试环境挂 Swagger UI（直接发请求验证）。两者消费**同一份 OpenAPI spec**，互不冲突、可并存。理解「谁擅长阅读、谁擅长调试」就能组合选型。
:::

返回：[配置项详解](./configuration.md) · [Try it out 与 CORS](./tryitout-cors.md) · [速查参考](../reference.md)
