---
layout: doc
outline: [2, 3]
---

# 快速上手

> 基于 Redoc 2.5.3 / @redocly/cli 2.34.0 编写

## 速查

- Redoc **消费已有 OpenAPI 规范、渲染成三栏只读文档**——它不生成 spec，先有 `openapi.yaml` 才能渲染
- 四种接入：**HTML 元素** `<redoc spec-url='...'>` + standalone 脚本 / **`Redoc.init`** JS API / **React** `<RedocStandalone>` / **CLI** `@redocly/cli build-docs`
- CLI 出静态文档：`npx @redocly/cli build-docs apis/openapi.yaml`，默认产物 **`redoc-static.html`**，`-o` 改名
- 旧 **`redoc-cli` 已弃用停更**（2023-03，0.13.21）：`build` → `redocly build-docs`、`bundle` → `redocly bundle`
- 开源版**默认无 Try-it-out**：要在线调接口选 Swagger UI / Scalar，或上 Redocly 商业版
- 本地预览别 `file://` 直开：本地 spec 受同源策略限制，须起 **HTTP server**（如 `npx serve`）
- 支持 **OpenAPI 3.1 / 3.0 / Swagger 2.0**；许可证 **MIT**

## Redoc 不是什么

把 Redoc 当成「能扫码生成 OpenAPI 的全栈工具」是最常见的认知错误。三点澄清：

- **不生成 spec**：Redoc 只渲染你写好的 OpenAPI / Swagger；从代码生成 spec 是 swagger-jsdoc、NestJS Swagger 模块、tsoa 等的事
- **开源版不带 Try-it-out**：默认是只读文档，能点着发请求的交互能力在商业版 / Replay
- **不等于 Swagger UI**：两者都吃 OpenAPI，但 Redoc 三栏只读、Swagger UI 单栏带调试，定位不同

::: tip 一句话定位
Redoc =「把 OpenAPI 渲染成漂亮只读三栏参考文档」的开源渲染器。要交互调用 → Swagger UI / Scalar；要漂亮只读 → Redoc。
:::

## 四种接入方式

### 1. HTML 自定义元素（最快嵌入）

```html
<!DOCTYPE html>
<html>
  <body>
    <redoc spec-url="https://redocly.github.io/redoc/openapi.yaml"></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  </body>
</html>
```

`spec-url` 指向你的 OpenAPI 文件，standalone 脚本负责把 `<redoc>` 元素渲染成三栏文档。生产环境建议把 `latest` 换成固定版本号。

### 2. `Redoc.init` JS API（命令式挂载）

```js
Redoc.init(
  "https://redocly.github.io/redoc/openapi.yaml", // spec 或其 URL
  { scrollYOffset: 50 }, // options 配置对象
  document.getElementById("redoc-container"), // 挂载的 DOM 元素
  () => console.log("渲染完成") // 回调
);
```

签名是 `Redoc.init(specOrSpecUrl, options, element, callback)`，适合非 React、需手动控制挂载时机的页面。

### 3. React 组件 `RedocStandalone`

```tsx
import { RedocStandalone } from "redoc";

export default function ApiDocs() {
  return (
    <RedocStandalone
      specUrl="https://redocly.github.io/redoc/openapi.yaml"
      options={{ scrollYOffset: 50, hideDownloadButtons: true }}
    />
  );
}
```

注意 `options` 是普通 JS 对象（camelCase 键名），不是 HTML 元素那种 kebab-case 字符串。

### 4. CLI 出静态文档（CI 友好）

```bash
# 默认输出自包含的 redoc-static.html
npx @redocly/cli build-docs apis/openapi.yaml

# 用 -o 改名 / 改路径
npx @redocly/cli build-docs apis/openapi.yaml -o dist/api.html
```

::: warning 别再用 redoc-cli
独立的 `redoc-cli`（0.13.21）已于 2023-03 弃用停更，能力并入 `@redocly/cli`。迁移：`redoc-cli build` → `redocly build-docs`、`redoc-cli bundle` → `redocly bundle`。
:::

## 本地预览的同源策略坑

直接 `file://` 双击打开含 Redoc 的 HTML、再让它去 `fetch` 本地 spec，通常会被浏览器同源策略 / CORS 拦下导致加载失败。正确做法是起一个本地 HTTP server：

```bash
npx serve .          # 或 python -m http.server
```

再通过 `http://localhost:...` 访问页面与 spec。

下一步：[四种接入详解](./guide-line/integration.md) · [配置项详解](./guide-line/configuration.md) · [Vendor Extensions](./guide-line/vendor-extensions.md) · [开源 vs 商业与选型](./guide-line/open-source-vs-commercial.md)
