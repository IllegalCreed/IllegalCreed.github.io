---
layout: doc
---

# 入门

> 基于 VitePress v1.6.4 编写

## 前置条件

- **Node.js v20+**（官方明确要求 v20 或更高版本）
- 命令行环境（最好是 macOS/Linux，或 Windows 上的 WSL）

## 安装

```sh
pnpm add -D vitepress
```

::: tip 是否需要 `vue` 依赖

VitePress 自带 Vue 3，**默认无需单独装 vue**。仅当你需要在 Markdown 中显式使用 Vue 3 组件 / 组合式 API（自定义主题、扩展），或获得完整 TS 类型提示时，才推荐 `pnpm add vue`。

:::

### 初始化

```sh
pnpm dlx vitepress init
```

会启动 setup wizard，依次问你站点目录（默认 `./docs`）、站点标题、描述、主题，然后生成基础文件。

### 配置文件

默认位于 `<root>/.vitepress/config.[ext]`，支持 `.js` / `.ts` / `.mjs` / `.mts` 四种扩展名。**VitePress 是 ESM-only**：若用 `.js`，`package.json` 需要加 `"type": "module"`，或者直接用 `.mjs` / `.mts` 避开这个限制。

## 启动

```sh
pnpm run docs:dev        # 默认 http://localhost:5173
pnpm run docs:build
pnpm run docs:preview    # 默认 http://localhost:4173
```

## 路由

采用基于文件结构的路由

### 默认目录结构

setup wizard 默认生成的结构（站点根为 `docs/`）：

```
.
├─ docs                    # 站点根目录（VitePress root）
│  ├─ .vitepress
│  │  └─ config.js         # 站点配置
│  ├─ index.md
│  └─ getting-started.md
└─ package.json
```

启动脚本对应 `vitepress dev docs`、`vitepress build docs`、`vitepress preview docs`。

如果想把 markdown 文件放到 root 下的子目录（不影响 `.vitepress/`），在配置里设置 `srcDir: 'src'` 即可。

### 页面跳转

- 省略扩展名
- 相对路径和绝对路径均可
- 绝对路径以源目录为根

```md
[Getting Started](./getting-started)
[Getting Started](/getting-started)
```

### 跳转非 VitePress 页面

```md
[Link to pure.html](/pure.html){target="_self"}
```

### 文件夹默认页面

路径指向文件夹会自动加载其中的 index.md 文件

```
.
├─ getting-started
│  └─ index.md
├─ installation
│  └─ index.md
└─ index.md
```

### 路由重写

解决文件结构复杂导致的路由过长问题，通过 `rewrites` 配置项把文件路径映射成更短的 URL。例如 `'packages/:pkg/index.md': ':pkg/index.md'`。详见官方 Routing 文档。

## 动态路由

页面名称可以包含参数，形如：

```
.
└─ packages
   ├─ [pkg].md         # 路由模板
   └─ [pkg].paths.js   # 路由路径加载器

# 多参数
.
└─ packages
   ├─ [pkg]-[version].md
   └─ [pkg]-[version].paths.js
```

`\*.paths.js` 被称为路径加载器，也可以是 `ts`。

```js
export default {
  paths() {
    return [
      { params: { pkg: "foo", version: "1.0.0" } },
      { params: { pkg: "foo", version: "2.0.0" } },
      { params: { pkg: "bar", version: "1.0.0" } },
      { params: { pkg: "bar", version: "2.0.0" } },
    ];
  },
};
```

### 动态生成路径

可以从本地或远程读取参数

```js
export default {
  async paths() {
    const pkgs = await (await fetch("https://my-api.com/packages")).json();

    return pkgs.map((pkg) => {
      return {
        params: {
          pkg: pkg.name,
          version: pkg.version,
        },
      };
    });
  },
};
```

### 页面中访问参数

```md
- package name: {{ $params.pkg }}
- version: {{ $params.version }}
```

```html
<script setup>
  import { useData } from "vitepress";

  // params 是一个 Vue ref
  const { params } = useData();

  console.log(params.value);
</script>
```

### 动态生成内容

使用`content`属性

```js
export default {
  async paths() {
    const posts = await (await fetch("https://my-cms.com/blog-posts")).json();

    return posts.map((post) => {
      return {
        params: { id: post.id },
        content: post.content, // 原始 Markdown 或 HTML
      };
    });
  },
};
```

在对应 `md` 文件中使用特殊语法呈现内容

```md
<!-- @content -->
```

## 部署

### 构建

```sh
pnpm docs:build
```

### 预览

```sh
pnpm docs:preview
```

指定端口

```json
{
  "scripts": {
    "docs:preview": "vitepress preview docs --port 8080"
  }
}
```

### Base URL（部署子路径）

当网站部署在非域名根路由时（如 GitHub Pages 的 `username.github.io/repo/`），需要配置 `base`，默认是 `/`：

```js
export default {
  base: "/repo/",
};
```

::: warning 区分 `base` 与 `public/`

`base` 是**站点 URL 前缀**（配置项）；`public/` 是**静态资源目录**（约定的文件夹）。VitePress 会把 `public/icon.png` 拷到构建产物根目录，引用时写 `/icon.png`，`base` 会自动应用，**不需要手动加前缀**。

:::

### GitHub Pages 部署

- 在项目的 .github/workflows 目录中创建一个名为 deploy.yml 的文件

```yml
# 构建 VitePress 站点并将其部署到 GitHub Pages 的示例工作流程
#
name: Deploy VitePress site to Pages

on:
  # 在针对 `main` 分支的推送上运行。如果你
  # 使用 `master` 分支作为默认分支，请将其更改为 `master`
  push:
    branches: [main]

  # 允许你从 Actions 选项卡手动运行此工作流程
  workflow_dispatch:

# 设置 GITHUB_TOKEN 的权限，以允许部署到 GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# 只允许同时进行一次部署，跳过正在运行和最新队列之间的运行队列
# 但是，不要取消正在进行的运行，因为我们希望允许这些生产部署完成
concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  # 构建工作
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v5
        with:
          fetch-depth: 0 # 如果未启用 lastUpdated，则不需要
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
      - name: Setup Node
        uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: pnpm
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Install dependencies
        run: pnpm install
      - name: Build with VitePress
        run: pnpm docs:build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  # 部署工作
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4

```

- 在存储库设置中的“Pages”菜单项下，选择“Build and deployment > Source > GitHub Actions”

- 提交代码，等待工作流处理完成