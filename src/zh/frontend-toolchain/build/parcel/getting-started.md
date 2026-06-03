---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Parcel 2.x**（latest 2.16）。涉及 Parcel 1→2 的差异均显式标注。

## 速查

- 安装：`npm install --save-dev parcel`（脚手架：`npm create parcel`）
- **入口是 HTML**：`src/index.html`，用 `<script type="module">` / `<link>` 引用依赖
- 入口声明：`package.json` 的 **`source`** 字段（`"source": "src/index.html"`）
- 开发：`parcel`（= `parcel serve`，默认 `http://localhost:1234`，端口占用自动回退）
- 生产：`parcel build`（默认开启 minify / tree shaking / scope hoisting / content hash）
- 三命令：`serve`（默认 + HTTP server）/ `watch`（仅 HMR 无 HTTP server）/ `build`（单次构建后退出）
- 缓存：`.parcel-cache`（**v1 是 `.cache`**）；底层 JS=**SWC**、CSS=**Lightning CSS**
- ⚠️ **默认不做任何转译**：需在 `package.json` 配 `browserslist` 才降级；**不做 TS 类型检查**，需 `tsc`

## 一、安装与第一个项目

```bash
npm install --save-dev parcel
# 或用脚手架（模板 vanilla / react-client / react-server / react-static）
npm create parcel vanilla my-parcel-app
```

入口是 **HTML**，用 `<script type="module">` 引用 JS（v2 必须是 module，不能是经典 script）：

```html
<!-- src/index.html -->
<!DOCTYPE html>
<html>
  <body>
    <div id="app"></div>
    <script type="module" src="app.ts"></script>
  </body>
</html>
```

`package.json` 用 `source` 声明入口，`scripts` 配开发/生产：

```jsonc
{
  "source": "src/index.html",
  "scripts": {
    "start": "parcel",
    "build": "parcel build"
  }
}
```

> ⚠️ Web 应用**不要保留 `main` 字段**（除非在构建库）——`main` 会被当作库 target，影响输出。

## 二、启动开发

```bash
parcel src/index.html   # = parcel serve，默认 http://localhost:1234
```

- **HMR 默认开启**：改文件自动重建并更新浏览器；CSS 变更无需刷新自动应用；React 用 Fast Refresh、Vue 用内置 HMR。
- 一切结果写入 **`.parcel-cache`**（应 gitignore，不要手动删）。
- 三个命令的区别：

| 命令 | 作用 |
|---|---|
| `parcel` / `parcel serve` | 开发服务器（HTTP + HMR），默认 1234 端口 |
| `parcel watch` | **只起 HMR server，无 HTTP server**（适合库/后端/自定义服务器） |
| `parcel build` | 单次生产构建后退出 |

`module.hot` API 可手动接受热更新：

```ts
if (module.hot) {
  module.hot.dispose((data) => {
    data.state = getState(); // 模块被替换前存状态
  });
  module.hot.accept(() => {
    restore(module.hot.data.state); // 更新后读回
  });
}
```

## 三、生产构建

```bash
parcel build src/index.html   # 默认全套优化，输出到 dist/
```

`parcel build` 自动把 `NODE_ENV` 设为 `production`，并**内联 `process.env.NODE_ENV`** 剥离死分支（`if (process.env.NODE_ENV !== "production") {...}` 被移除）。默认开启的优化：

- **压缩**：JS=SWC、CSS=Lightning CSS、SVG=oxvg、HTML=内置 minifier
- **Tree shaking**：静态分析移除未用代码（ESM + CommonJS 都支持）
- **Scope hoisting**：把多模块拼进单一作用域（**默认仅生产开启**）
- **Content hashing**：文件名含内容哈希，启用长期缓存

> ⚠️ dev 模式**不做**压缩 / scope hoisting，别拿 dev 产物体积评估生产。关掉优化调试用 `--no-optimize`（一次性关全部，不只 minify）。

## 四、默认不转译（最重要的认知）

这是 Parcel 2 与很多工具最不同的一点：**默认不做任何语法降级转译**——源码用什么现代语法，输出就是什么。要兼容旧浏览器，必须在 `package.json` 声明 `browserslist`：

```jsonc
{
  "browserslist": "> 0.5%, last 2 versions, not dead"
}
```

声明 `browserslist` 后，Parcel 才会用 SWC 做 JS 语法降级、用 Lightning CSS 加厂商前缀/降级 CSS，并在目标含不支持 ES module 的浏览器时自动产出 `<script nomodule>` 回退（differential bundling）。

> ⚠️ 从 Parcel 1 迁移要特别注意：**v1 默认带 Babel 转译，v2 默认完全不转译**，不配 `browserslist` 直接迁移可能让旧浏览器报错。

## 五、Parcel 1 → 2 迁移要点

| 项 | Parcel 1 | **Parcel 2** |
|---|---|---|
| npm 包名 | `parcel-bundler` | **`parcel`** |
| 缓存目录 | `.cache` | **`.parcel-cache`**（改 `.gitignore`） |
| 插件机制 | 装进 deps 即自动启用 | **`.parcelrc` 显式配置**（v1 插件全失效） |
| 默认转译 | 带 Babel 转译 | **不转译**，需 `browserslist` |
| 编程式 API | `parcel-bundler` | **`@parcel/core`** |
| CLI | `--out-dir` / `--no-minify` | **`--dist-dir` / `--no-optimize`** |

---

更深入的 targets、语言支持、`.parcelrc` 插件体系见 [指南 · 基础](./guide-line/base)。
