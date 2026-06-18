---
layout: doc
outline: [2, 3]
---

# Try it out 与 CORS

> 基于 Swagger UI 5.32.6 编写

## 速查

- **Try it out** 是 Swagger UI 的核心卖点：在文档页填参数、点 Execute 真实发请求、看实际状态码 / 响应头 / 响应体
- 全局开关 `tryItOutEnabled` 默认 **false**（需手动点开，或显式设 true 让所有操作默认进入）
- 允许发请求的方法白名单 `supportedSubmitMethods`，默认含 `get/put/post/delete/options/head/patch/trace`
- **CORS 报错的根因＝目标接口服务端没开 CORS**（缺 `Access-Control-Allow-Origin`），要在被调用的后端解决，不是改 Swagger UI
- 跨域带凭据：`withCredentials: true`，且目标服务端须返回 `Access-Control-Allow-Credentials: true`（且 Origin 不能用通配）
- 统一改请求 / 响应：`requestInterceptor`（发出前）/ `responseInterceptor`（收到后）
- OAS 3.0 的 **Cookie 参数在浏览器里实测发不出**（浏览器禁止 JS 设 Cookie 这类禁止头）

## Try it out 是什么

Swagger UI 区别于纯只读文档（如 Redoc 开源版）的核心，在于内置 Try it out：用户为某接口填好路径 / 查询 / 请求体参数与鉴权后，点击 Execute 会**真实发起一次 HTTP 请求**，并在响应区看到实际的状态码、响应头与响应体。读文档与试接口合二为一，这也是「Swagger UI 调试最成熟」这一评价的落点。

```js
SwaggerUIBundle({
  url: "/openapi.json",
  dom_id: "#swagger-ui",
  tryItOutEnabled: true, // 默认 false：所有操作默认进入 Try it out 模式
});
```

## supportedSubmitMethods：发请求的方法白名单

`supportedSubmitMethods` 决定哪些 HTTP 方法的操作会显示 Try it out 按钮、允许真实发请求。默认包含八种：

```js
SwaggerUIBundle({
  // 默认值（全开）
  supportedSubmitMethods: ["get", "put", "post", "delete", "options", "head", "patch", "trace"],
});
```

想让文档「可看但不可误触发」某些危险方法（如 `delete`），从该数组移除即可：

```js
SwaggerUIBundle({
  supportedSubmitMethods: ["get", "head"], // 只允许读类方法发请求
});
```

## CORS：最高频的 Try it out 报错

现象：点 Execute 后控制台报 CORS 错、响应拿不到。根因几乎都是——**目标接口的服务端没开 CORS**。

原理：Try it out 是浏览器里直接 `fetch` 目标接口，受同源策略约束。当文档页域名与目标 API 域名不同，且目标服务端**未返回 `Access-Control-Allow-Origin` 等响应头**时，浏览器会拦截响应并报错。

::: warning 解决方向在被调用的后端，不在 Swagger UI
要让目标服务端对文档页域名返回 CORS 响应头（`Access-Control-Allow-Origin` 等）。升级 Swagger UI、改 `deepLinking`、换 spec 版本都**不解决** CORS——它是浏览器与目标服务端之间的策略。
:::

## 跨域携带凭据：withCredentials

若调试需要带上会话 cookie / HTTP 认证信息，开 `withCredentials`：

```js
SwaggerUIBundle({
  withCredentials: true, // Try it out 跨域请求携带凭据（对应 fetch 的 credentials）
});
```

注意：跨域携带凭据时，目标服务端的 CORS 还必须返回 `Access-Control-Allow-Credentials: true`，且 `Access-Control-Allow-Origin` 不能是通配 `*`（须是具体来源），否则浏览器仍会拦截。

## 请求 / 响应拦截器

一对对称的网络扩展钩子，常用于统一鉴权注入、加签名、日志、响应归一化：

| 钩子 | 介入时机 | 典型用途 |
| --- | --- | --- |
| `requestInterceptor` | 请求**发出前** | 加 header、改 URL、签名 |
| `responseInterceptor` | 收到响应**后、展示前** | 改写 / 检视响应 |

```js
SwaggerUIBundle({
  url: "/openapi.json",
  dom_id: "#swagger-ui",
  requestInterceptor: (req) => {
    req.headers["X-Trace-Id"] = crypto.randomUUID(); // 统一注入请求头
    return req; // 必须返回（可能被修改的）请求对象
  },
  responseInterceptor: (res) => {
    // 这里可检视 / 改写响应
    return res;
  },
});
```

## OAS 3.0 Cookie 参数：浏览器里发不出

OpenAPI 3.0 允许声明 `in: cookie` 的参数，但浏览器对 **Cookie 这类「禁止头（forbidden header）」**有安全限制——JavaScript（fetch / XHR）不能任意设置 `Cookie` 请求头。

::: warning Cookie 参数实测发不出，不是 Swagger UI 的 bug
即便你在 Try it out 里填了 Cookie 参数，浏览器也不会真正把它作为 `Cookie` 头发出去。这是浏览器安全策略所致，与 Swagger UI 版本、flavor 无关，换 OAS 版本也不解决。需要带 cookie 的鉴权场景应改走 header / query，或依赖浏览器已有的同源 cookie 配合 `withCredentials`。
:::

下一步：[OAuth 与对比选型](./oauth-and-comparison.md) · [配置项详解](./configuration.md)
