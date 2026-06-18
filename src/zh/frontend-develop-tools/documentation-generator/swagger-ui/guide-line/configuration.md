---
layout: doc
outline: [2, 3]
---

# 配置项详解

> 基于 Swagger UI 5.32.6 编写

## 速查

- 喂 spec：`url`（单文档地址）/ `spec`（内联对象）/ `urls`（多文档下拉，配 `urls.primaryName` 指定默认）；`configUrl` 远程下发配置
- **`spec` 与 `url` 同传 → `url` 被忽略**（spec 优先）
- 挂载：`dom_id` 或 `domNode`（二选一必填）
- 展开：`docExpansion` 默认 `"list"`（可 `"full"` / `"none"`）；`defaultModelsExpandDepth` 默认 `1`，**设 `-1` 完全隐藏 Models**
- 交互：`deepLinking` 默认 **false**（开后生成 `#/{tag}/{operationId}` 锚点）；`tryItOutEnabled` 默认 **false**；`filter` 默认 false
- 显示：`displayOperationId`、`displayRequestDuration`、`defaultModelRendering`（`"example"` / `"model"`）、`syntaxHighlight.theme` 默认 `agate`
- 排序：`operationsSorter` / `tagsSorter` 支持 `"alpha"` / `"method"` 或自定义函数
- 校验：`validatorUrl` 默认 `https://validator.swagger.io/validator`，私有部署设 `"none"`
- 授权：`persistAuthorization` 默认 false（刷新保留授权）

## 加载来源：url / spec / urls / configUrl

| 配置 | 作用 | 备注 |
| --- | --- | --- |
| `url` | 指向单份 spec 文件地址 | 最常用 |
| `spec` | 直接内联整份 OpenAPI 对象 | **给了 spec 则 url 被忽略** |
| `urls` | `[{ url, name }]` 数组，渲染顶部文档下拉 | 配 `urls.primaryName` 指定默认选中项 |
| `configUrl` | 指向远程「Swagger UI 配置文件」URL | 后端按环境 / 租户动态下发配置 |

::: warning spec 与 url 同传，url 被静默忽略
想用 `url` 远程拉 spec，就别同时填 `spec`。二者并存时 Swagger UI 优先用内联 `spec`，`url` 完全不生效，且不会报错——是经典踩坑点。
:::

`spec` 内联的典型场景：spec 已在前端运行时拿到（动态构造，或服务端把 spec 内嵌进 HTML 注入全局变量），内联可省一次 HTTP 拉取、避开跨域取 spec 的问题。

## 展开与显示

```js
SwaggerUIBundle({
  url: "/openapi.json",
  dom_id: "#swagger-ui",
  docExpansion: "none", // 默认 "list"；大文档常设 "none" 全折叠提升首屏
  defaultModelsExpandDepth: -1, // 默认 1；-1 完全隐藏底部 Models 区块
  defaultModelRendering: "model", // "example"(示例值) / "model"(结构树)，默认 example
  displayOperationId: true, // 在操作旁显示 operationId（默认 false）
  displayRequestDuration: true, // Try it out 响应区显示请求耗时（默认 false）
});
```

- `docExpansion`：`"list"`（默认，展开到 tag 层）/ `"full"`（连操作详情都展开）/ `"none"`（全折叠）。
- `defaultModelsExpandDepth`：默认 `1`；**`-1` 隐藏整个 Models 区块**。注意它与 `defaultModelExpandDepth`（无 s，控制单个 model 内部展开层级）是两个不同配置。
- `defaultModelRendering`：`"example"` 显示示例数据，`"model"` 显示字段 / 类型结构树。
- `syntaxHighlight.theme`：默认 `agate`；超大响应体下可把 `syntaxHighlight` 整体设 `false` 关闭高亮以提升性能。

## 交互：deepLinking / tryItOutEnabled / filter

| 配置 | 默认 | 开启效果 |
| --- | --- | --- |
| `deepLinking` | **false** | 展开 tag / 操作时地址栏生成 `#/{tag}/{operationId}` 锚点，可分享直达链接、刷新定位 |
| `tryItOutEnabled` | **false** | 所有操作默认进入 Try it out（可填参数、发请求），省一次点击 |
| `filter` | false | 顶部出现过滤框，按 tag 过滤操作；传字符串作初始过滤值 |

::: tip deepLinking 默认是关的
很多人以为锚点天生就有，其实 `deepLinking` 默认 false，需显式开启才会生成可分享的接口锚点。开启后配合 `displayOperationId` 调试更方便。
:::

## 排序：operationsSorter / tagsSorter

两者都支持内置值 `"alpha"`（字母序）与 `"method"`（按 HTTP 方法，仅 `operationsSorter` 有意义），也可传自定义比较函数。默认不排序，按 spec 中出现的原始顺序展示。

```js
SwaggerUIBundle({
  operationsSorter: "alpha", // 或 "method"，或 (a, b) => ...
  tagsSorter: "alpha",
});
```

## 扩展显示：showExtensions / showCommonExtensions

- `showExtensions`：显示 `x-` 前缀的厂商扩展字段（默认 false）。
- `showCommonExtensions`：显示参数上的常见约束扩展，如 `pattern` / `maxLength` / `minLength` / `min` / `max`（默认 false）。

开启后文档能呈现更多约束 / 扩展细节，适合需要把 schema 约束暴露给读者的场景。

## 校验徽章：validatorUrl

`validatorUrl` 默认指向 `https://validator.swagger.io/validator`——页面底部那个「spec 是否合法」徽章会把**整份 spec**（路径、参数、模型结构）发到 swagger.io 的公网校验服务。

::: warning 私有 / 内网部署务必设 "none"
默认外发 spec 既有信息泄露风险，在隔离网络里还会因连不通而报错。私有部署设 `validatorUrl: "none"` 禁用在线校验、移除该徽章。
:::

## 完整示例

```js
window.ui = SwaggerUIBundle({
  url: "/openapi.json",
  dom_id: "#swagger-ui",
  deepLinking: true,
  tryItOutEnabled: true,
  docExpansion: "none",
  defaultModelsExpandDepth: -1,
  operationsSorter: "alpha",
  displayRequestDuration: true,
  validatorUrl: "none", // 私有部署关闭外网校验
  persistAuthorization: true, // 刷新保留授权（落 localStorage）
});
```

下一步：[Try it out 与 CORS](./tryitout-cors.md) · [OAuth 与对比选型](./oauth-and-comparison.md) · [速查参考](../reference.md)
