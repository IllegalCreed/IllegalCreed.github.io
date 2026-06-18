---
layout: doc
outline: [2, 3]
---

# 四种接入方式详解

> 基于 Redoc 2.5.3 / @redocly/cli 2.34.0 编写

## 速查

- **HTML 元素**：`<redoc spec-url='...'>` + `redoc.standalone.js`；配置走 **kebab-case** HTML 属性
- **`Redoc.init`**：签名 `Redoc.init(specOrSpecUrl, options, element, callback)`，命令式挂载到指定 DOM
- **React**：`import { RedocStandalone } from 'redoc'`，渲染 `<RedocStandalone specUrl=... options=… />`，`options` 用 **camelCase 对象**
- **CLI**：`npx @redocly/cli build-docs apis/openapi.yaml`，默认产物 `redoc-static.html`，`-o` 改名
- 选型：快速嵌静态页 → HTML 元素；手动控时机 → `Redoc.init`；React/Next 应用 → 组件；CI 出静态文档 → CLI
- 旧 `redoc-cli` 已弃用：`build`→`redocly build-docs`、`bundle`→`redocly bundle`

## 1. HTML 自定义元素

最快把 Redoc 嵌进任意静态页面的方式：放一个 `<redoc>` 元素并指向 spec，再引入 standalone 脚本。

```html
<redoc spec-url="https://redocly.github.io/redoc/openapi.yaml"></redoc>
<script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
```

standalone 脚本是自包含的（已打包好运行时），无需另外引 React。生产环境把 `latest` 换成固定版本号，避免无意升级带来样式 / 行为变化。

### 配置用 kebab-case 属性

HTML 元素方式下，配置项落在 HTML 属性上，**必须写成 kebab-case**：JS 里的 `scrollYOffset` 在元素上是 `scroll-y-offset`。

```html
<redoc
  spec-url="openapi.yaml"
  scroll-y-offset="50"
  hide-download-buttons="true"
></redoc>
```

::: warning 别在 HTML 属性上用 camelCase
把 `scrollYOffset` 直接当 HTML 属性写是典型坑——不生效。HTML 属性一律 kebab-case，只有 `Redoc.init` / React 的 `options` 对象才用 camelCase。
:::

### 嵌套 theme 用 JSON 字符串

标量配置可直接平铺成 kebab-case 属性，但像 `theme` 这种嵌套对象无法逐键平铺，做法是序列化成 JSON 字符串：

```html
<redoc
  spec-url="openapi.yaml"
  theme='{"colors":{"primary":{"main":"#119DA4"}}}'
></redoc>
```

## 2. `Redoc.init` JS API

命令式渲染，适合非 React、需要自己控制何时挂载的场景。

```js
Redoc.init(
  "openapi.yaml", // ① spec 对象或其 URL
  { jsonSamplesExpandLevel: "all" }, // ② options 配置对象
  document.getElementById("redoc"), // ③ 挂载的目标 DOM 容器
  (err) => { if (!err) console.log("done"); } // ④ 渲染完成回调
);
```

四个参数依次是 **spec/URL、options、挂载元素、回调**。第三个参数是「文档要渲染进去的容器」，别和第一个 spec 参数搞混。

## 3. React 组件 `RedocStandalone`

把 Redoc 嵌进 React / Next.js 应用的官方方式。

```tsx
import { RedocStandalone } from "redoc";

<RedocStandalone
  specUrl="openapi.yaml"
  options={{
    scrollYOffset: 50,
    hideDownloadButtons: true,
    theme: { colors: { primary: { main: "#119DA4" } } },
  }}
/>;
```

`options` 是一个普通 JS 对象，键名用 **camelCase**，嵌套对象直接写对象字面量（不像 HTML 元素要 JSON 字符串）。也支持传 `spec`（直接给对象）替代 `specUrl`。

## 4. CLI `build-docs` 出静态文档

把现成 spec 一键构建成可部署的单文件 HTML，最适合 CI。

```bash
# 默认输出当前目录的 redoc-static.html（自包含单文件）
npx @redocly/cli build-docs apis/openapi.yaml

# -o 自定义输出文件名 / 路径
npx @redocly/cli build-docs apis/openapi.yaml -o dist/api.html
```

记住「默认 `redoc-static.html`，`-o` 改输出」这一对，就不会构建完找不到产物。

::: tip redoc-cli 迁移对照
| 旧（已弃用） | 新（现行 @redocly/cli） |
| --- | --- |
| `redoc-cli build` | `redocly build-docs` |
| `redoc-cli bundle` | `redocly bundle`（合并 spec，≠ 出文档） |
:::

## 四种方式怎么选

| 场景 | 推荐方式 |
| --- | --- |
| 往任意静态页面快速嵌一个文档 | HTML 自定义元素 |
| 非 React、要手动控制挂载时机 | `Redoc.init` |
| React / Next.js 应用内嵌 | `RedocStandalone` 组件 |
| CI 里把 spec 产出可部署静态 HTML | `@redocly/cli build-docs` |

下一步：[配置项详解](./configuration.md) · [Vendor Extensions](./vendor-extensions.md)
