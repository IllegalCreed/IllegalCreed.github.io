---
layout: doc
outline: [2, 3]
---

# 接入文档站

> 基于 TypeDoc 0.28.x 编写

## 速查

- **关键认知**：要进 VitePress/Docusaurus，**必须 `typedoc-plugin-markdown`**——默认主题只出 HTML，无法被 Markdown 文档站消费
- VitePress 三件套：`typedoc` + `typedoc-plugin-markdown` + `typedoc-vitepress-theme`
- 流程铁律：**先跑 typedoc 生成 Markdown + `typedoc-sidebar.json`，再 build 文档站**（顺序反了 sidebar 拿不到）
- `typedoc-sidebar.json` 在 VitePress 配置里 `import` 进 `themeConfig.sidebar`
- package.json 脚本串起来：`"docs:build": "npm run docs:api && vitepress build docs"`
- monorepo 用 `entryPointStrategy: packages` + `packageOptions`，每个包独立跑再合并成单一站点
- JSON 输出：`--json <file>`（会覆盖 `outputs`）；`emit` 控制 `docs`/`both`/`none`
- 编程式 API 用 `Application.bootstrapWithPlugins`（**会加载插件**，`bootstrap` 不加载）

## 为什么必须 typedoc-plugin-markdown

TypeDoc 官方默认主题**只出 HTML**。HTML 是一套自带样式、自带导航的独立站点，没法塞进 VitePress/Docusaurus 这种已经有自己主题和路由的 Markdown 文档站。

要把 API 文档融进现有文档站，唯一的桥是 **`typedoc-plugin-markdown`**：它把反射树渲染成 **Markdown 文件**，于是这些文件就能像普通笔记一样被文档站的构建流程接管。

```
TS 源码 ──typedoc──> 反射树 ──typedoc-plugin-markdown──> Markdown 文件
                                                              │
                                              VitePress / Docusaurus build
                                                              │
                                                          最终站点
```

## VitePress 实战（完整流程）

下游笔记最可能用到的就是这条路径。三步走：

**第 1 步 · 安装三件套**

```sh
npm install -D typedoc typedoc-plugin-markdown typedoc-vitepress-theme
```

**第 2 步 · 配置 typedoc.json**

```jsonc
{
  "plugin": ["typedoc-plugin-markdown", "typedoc-vitepress-theme"],
  "entryPoints": ["./src/index.ts"],
  "out": "./docs/api",          // Markdown 输出到 VitePress 的 docs/api
  "docsRoot": "./docs",         // 若从 VitePress 根目录外跑 typedoc，需指明
  "sidebar": {
    "autoConfiguration": true,
    "format": "vitepress",
    "collapsed": true,
    "pretty": false
  }
}
```

**第 3 步 · 在 VitePress 配置里导入自动生成的 sidebar**

生成时会额外吐出 `docs/api/typedoc-sidebar.json`，直接 `import`：

```ts
// docs/.vitepress/config.mts
import typedocSidebar from "../api/typedoc-sidebar.json";

export default {
  themeConfig: {
    nav: [{ text: "API", link: "/api/" }],
    sidebar: [{ text: "API Reference", items: typedocSidebar }],
  },
};
```

::: warning 顺序铁律：先 typedoc，后 vitepress build
`typedoc-sidebar.json` 是 typedoc 跑完才生成的。如果先 `vitepress build`，配置 `import` 会拿到旧的或不存在的 sidebar 文件。所以 package.json 脚本里**必须先跑 typedoc 再 build**：
:::

```jsonc
// package.json scripts
{
  "scripts": {
    "docs:api": "typedoc",
    "docs:build": "npm run docs:api && vitepress build docs"
  }
}
```

## typedoc-plugin-markdown 输出微调

接进文档站后，常需要调整 Markdown 形态以贴合文档站主题：

| 选项                   | 作用                                                |
| ---------------------- | --------------------------------------------------- |
| `hideBreadcrumbs`      | 去面包屑（VitePress 自带导航，常去掉）              |
| `hidePageHeader`       | 去页头                                              |
| `entryFileName`        | 入口 Markdown 文件名（默认 `README.md`，VitePress 常改成 `index.md`） |
| `useCodeBlocks`        | 是否用代码块渲染签名                                |
| `parametersFormat`     | 参数渲染格式（`list` / `table`）                    |
| `propertiesFormat`     | 属性渲染格式                                        |
| `enumMembersFormat`    | 枚举成员渲染格式                                    |

配 `typedoc-plugin-frontmatter` 还能给每页 Markdown 加 frontmatter（如设 `layout`、`title`），与 VitePress 的页面元数据机制对接。

## Docusaurus

Docusaurus 走 `docusaurus-plugin-typedoc`（1.4.2）+ `typedoc-plugin-markdown`，在 `docusaurus.config` 的 plugins 里挂载，把 API Markdown 注入 Docusaurus 的 `docs/` 目录：

```js
// docusaurus.config.js
module.exports = {
  plugins: [
    [
      "docusaurus-plugin-typedoc",
      {
        entryPoints: ["../src/index.ts"],
        tsconfig: "../tsconfig.json",
      },
    ],
  ],
};
```

::: tip 本质一样
无论 VitePress 还是 Docusaurus，底层都靠 `typedoc-plugin-markdown` 出 Markdown，区别只是"谁来 build"和"sidebar 怎么注入"。认准这一点就不会被两套配置绕晕。
:::

## monorepo 接入

monorepo 用 `entryPointStrategy: packages`，每个子包独立跑一遍 TypeDoc 再合并成单一输出：

```jsonc
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPointStrategy": "packages",
  "entryPoints": ["packages/*"],
  "name": "My Monorepo",
  "packageOptions": { "entryPoints": ["src/index.ts"], "excludeInternal": true }
}
```

`packageOptions` 仅在 `packages` 策略时生效，里面的路径**相对各包目录**解释。注意 **子包里的插件不会被加载**——插件只在顶层配置加载。

## JSON 输出与编程式 API

除了 HTML/Markdown，TypeDoc 还能输出**结构化 JSON 反射数据**，喂给自定义工具：

```bash
# 同时出 JSON（注意会覆盖 outputs 里的 json 设置）
npx typedoc --entryPoints src/index.ts --json docs/api.json
```

- `--json <file>`（或 `json` option）：输出全部反射数据为 JSON，`pretty`（默认 `true`）美化。
- `emit`：`docs`（默认，只出文档不出 JS）/ `both` / `none`。
- JSON 结构由 `JSONOutput.ProjectReflection` 接口定义；插件可注册 `Serializer` 加自定义属性。

编程式生成（Node）：

```js
import * as td from "typedoc";

// bootstrapWithPlugins 会加载插件；Application.bootstrap 不加载插件
const app = await td.Application.bootstrapWithPlugins({
  entryPoints: ["src/index.ts"], // 接受 glob，路径分隔符别用反斜杠！
});

const project = await app.convert();   // 出错时可能是 undefined
if (project) {
  await app.generateDocs(project, "docs");             // 生成 HTML
  await app.generateJson(project, "docs/api.json");    // 生成 JSON
}
```

::: tip typedoc/browser —— 浏览器端反序列化（0.28 新增）
0.28 新增 `typedoc/browser` 入口，可在浏览器里把序列化的 JSON 反序列化还原成模型分析：`new Deserializer(...).reviveProject("API Docs", projectJson, { ... })`，配合 `setTranslations`（有 en/ja/ko/zh）。适合做自定义的在线 API 浏览器。
:::

下一步：[主题与插件](./themes-plugins.md) · [配置详解](./configuration.md) · [注释与标签体系](./comments-tags.md) · [速查参考](../reference.md)
