---
layout: doc
---

# 入门

## 安装

```sh
pnpm add vue
pnpm add -D vitepress
```

### 初始化

```sh
pnpm vitepress init
```

### 配置文件

`.vitepress/config.js`

## 启动

```sh
pnpm run docs:dev
```

## 路由

采用基于文件结构的路由

### 根目录及源目录

```
.                          # 项目根目录
├─ .vitepress              # 配置目录
└─ src                     # 源目录
   ├─ getting-started.md
   └─ index.md
```

如果根目录随项目放在 `.doc` 中，脚本需要修改 `vitepress dev docs`
配置文件可修改元目录 `srcDir: 'src'`

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
[Link to pure.html](/pure.html){target="\_self"}
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

解决文件结果复杂导致的路由过长问题，不重要，略过。

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
  paths: () => [
    { params: { pkg: "foo", version: "1.0.0" } },
    { params: { pkg: "foo", version: "2.0.0" } },
    { params: { pkg: "bar", version: "1.0.0" } },
    { params: { pkg: "bar", version: "2.0.0" } },
  ],
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

### public 根目录

当网站部署在非域名根路由时，需要配置 `public` 根目录。默认是 `/`

```js
export default {
  base: "/repo/",
};
```

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
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # 如果未启用 lastUpdated，则不需要
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9
      # - uses: oven-sh/setup-bun@v1 # 如果使用 Bun，请取消注释
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm # 或 pnpm / yarn
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Install dependencies
        run: pnpm install # 或 pnpm install / yarn install / bun install
      - name: Build with VitePress
        run: pnpm docs:build # 或 pnpm docs:build / yarn docs:build / bun run docs:build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .vitepress/dist

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