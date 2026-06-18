---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Swagger UI 5.32.6 编写

## 速查

- Swagger UI＝把 OpenAPI 规范渲染成可交互文档的静态资源，**只渲染不生成**；OpenAPI＝规范，Swagger＝工具套件
- 三 flavor（均 **5.32.6**，Apache-2.0）：`swagger-ui` / `swagger-ui-dist`（含 `absolutePath()`、全局 Bundle/Preset）/ `swagger-ui-react`（peer `react >=16.8 <20`，props mount-only）
- 入口 `SwaggerUIBundle({...})`；独立版 `SwaggerUIStandalonePreset` + `layout: "StandaloneLayout"`
- 喂 spec：`url` / `spec` / `urls`（+`primaryName`）；**spec 与 url 同传则 url 被忽略**
- 默认值要记牢：`deepLinking` false、`tryItOutEnabled` false、`docExpansion` "list"、`defaultModelsExpandDepth` 1（-1 隐藏 Models）、`syntaxHighlight.theme` agate、`validatorUrl` 公网 validator、`persistAuthorization` false
- 支持规范：Swagger 2.0 + OAS 3.0.x / 3.1.x / 3.2.0

## 配置项速查

| 配置 | 默认 | 作用 |
| --- | --- | --- |
| `dom_id` / `domNode` | —— | 挂载点，二选一**必填** |
| `url` | —— | 单份 spec 地址 |
| `spec` | —— | 内联 spec 对象（**给了则 url 被忽略**） |
| `urls` | —— | 多文档下拉数组；`urls.primaryName` 指定默认 |
| `configUrl` | —— | 远程下发 Swagger UI 配置 |
| `layout` | `"BaseLayout"` | 布局；独立版用 `"StandaloneLayout"` |
| `deepLinking` | `false` | 开后生成 `#/{tag}/{operationId}` 锚点 |
| `docExpansion` | `"list"` | `"full"` / `"none"` |
| `defaultModelsExpandDepth` | `1` | **`-1` 隐藏 Models 区块** |
| `defaultModelRendering` | `"example"` | `"example"` 示例值 / `"model"` 结构树 |
| `tryItOutEnabled` | `false` | 所有操作默认进入 Try it out |
| `filter` | `false` | 顶部过滤框，按 tag 过滤 |
| `displayOperationId` | `false` | 显示 operationId |
| `displayRequestDuration` | `false` | 显示请求耗时 |
| `operationsSorter` / `tagsSorter` | —— | `"alpha"` / `"method"` 或函数 |
| `syntaxHighlight.theme` | `"agate"` | 高亮主题；`syntaxHighlight: false` 关高亮 |
| `showExtensions` / `showCommonExtensions` | `false` | 显示 `x-` 扩展 / 参数常见约束 |
| `validatorUrl` | `https://validator.swagger.io/validator` | 设 `"none"` 禁用在线校验 |
| `withCredentials` | `false` | 跨域请求带凭据 |
| `persistAuthorization` | `false` | 刷新保留授权（落 localStorage） |
| `requestInterceptor` / `responseInterceptor` | —— | 请求发出前 / 收到响应后介入 |
| `supportedSubmitMethods` | `get/put/post/delete/options/head/patch/trace` | 允许 Try it out 的方法白名单 |
| `oauth2RedirectUrl` | —— | OAuth2 回调地址 |

## 实例方法

| 方法 | 作用 |
| --- | --- |
| `initOAuth(configObj)` | 配置 OAuth2（`clientId` / `scopes` / `usePkceWithAuthorizationCodeGrant` 等） |
| `preauthorizeApiKey(key, value)` | 预填某 API Key 安全方案的值 |
| `preauthorizeBasic(...)` | 预填 HTTP Basic 凭据 |

## OAuth 配置字段速查

| 字段 | 作用 |
| --- | --- |
| `clientId` | 客户端标识 |
| `clientSecret` | 客户端密钥——**严禁生产前端**（必然暴露） |
| `scopes` | 请求的权限范围 |
| `scopeSeparator` | 多 scope 分隔符（默认空格） |
| `usePkceWithAuthorizationCodeGrant` | 授权码模式启用 PKCE（公共客户端推荐） |
| `useBasicAuthenticationWithAccessCodeGrant` | 换 token 时用 HTTP Basic 传 client 凭据 |

## 三种渲染器对比

| 维度 | Swagger UI | Redoc | Scalar |
| --- | --- | --- | --- |
| 是否生成 spec | 否 | 否 | 否 |
| 布局 | 单栏 | 三栏只读 | 现代 UI |
| 内置调试 | **Try it out（最成熟）** | 开源版无 | 更强的 API 客户端 |
| 适合 | 可交互文档 / 调试、生态最通用 | 精美只读对外发布 | 现代观感 + 强调试 |

## 常见坑速查

| 坑 | 真相 |
| --- | --- |
| 以为它生成文档 | 只渲染 spec，生成靠后端扫描器 / 手写 |
| 混淆 OpenAPI 与 Swagger | OpenAPI＝规范，Swagger＝工具套件 |
| Try it out 报 CORS | 目标接口服务端没开 CORS，去后端加响应头 |
| `clientSecret` 配生产 | 前端必然暴露＝泄密，改用 PKCE |
| 运行时改 react props 不生效 | props 多为 mount-only，用 `key` 强制重挂载 |
| 有打包器仍用 dist | dist 体积更大，有打包器用 `swagger-ui` 包 |
| spec 与 url 同传 | url 被忽略，spec 优先 |
| OAS 3.0 Cookie 参数 | 浏览器禁止头，Try it out 发不出 |
| validator 默认联网 | 私有部署设 `validatorUrl: "none"` |
| deepLinking 默认关 | 要锚点须显式开 |

## 版本与许可

| 包 | 版本 | 说明 |
| --- | --- | --- |
| `swagger-ui` | 5.32.6 | 带打包器项目首选 |
| `swagger-ui-dist` | 5.32.6 | 服务端分发静态资源 |
| `swagger-ui-react` | 5.32.6 | React 组件（peer `react >=16.8 <20`） |

> 三包同为 5.32.6（2026-05-12 发布），均 Apache-2.0。支持 Swagger 2.0 + OpenAPI 3.0.x / 3.1.x / 3.2.0。

## 文档与链接

- 官方产品页：[https://swagger.io/tools/swagger-ui/](https://swagger.io/tools/swagger-ui/)
- 配置文档：[https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/)
- GitHub 仓库：[https://github.com/swagger-api/swagger-ui](https://github.com/swagger-api/swagger-ui)
- 官方 Demo（Petstore）：[https://petstore.swagger.io/](https://petstore.swagger.io/)

返回：[三种交付形态](./guide-line/flavors.md) · [配置项详解](./guide-line/configuration.md) · [Try it out 与 CORS](./guide-line/tryitout-cors.md) · [OAuth 与对比选型](./guide-line/oauth-and-comparison.md)
