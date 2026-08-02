---
layout: doc
outline: [2, 3]
---

# GitHub Actions 自动部署：工作流、SSG 构建与 CI/CD

> 基于 GitHub Pages 官方文档（2025） · 核于 2026-08

## 速查

- **GitHub Actions**：GitHub 内置的 CI/CD 服务，在 `git push` 等事件触发时跑工作流（workflow），用于自动构建、测试、部署——Pages 部署的核心引擎。
- **Pages 部署两种模式**：①**legacy branch 模式**（选源分支 + 目录，GitHub 自动部署，仅限纯静态）；②**Actions 模式**（推荐，用自定义工作流构建 SSG + 部署，灵活可控）。
- **工作流触发**：`on: push` 到 `main`/`master` 分支，或 `workflow_dispatch` 手动触发，或 PR 触发预览。
- **核心 actions**：`actions/configure-pages`（配置 Pages）、`actions/upload-pages-artifact`（上传产物 artifact）、`actions/deploy-pages`（部署到 Pages）。
- **权限**：工作流需 `permissions: pages: write, id-token: write, contents: read`，部署作业用 `environment: github-pages`。
- **SSG 构建部署**：在工作流里 `npm install` + `npm run build`（VitePress/Docusaurus/Next.js SSG/Hugo），产物目录（如 `.vitepress/dist`）上传为 artifact 再部署。
- **artifact**：构建产物的打包单元，`upload-pages-artifact` 把指定目录打成 Pages 兼容的 artifact（`github-pages` 名称），`deploy-pages` 拉取部署。
- **并发控制**：`concurrency` 字段确保同一时间只有一个部署，取消旧的中断部署。
- **缓存依赖**：`actions/cache` 或 `setup-node` 的 `cache: 'npm'` 缓存 node_modules，加速二次构建。
- **预览部署**：用 `actions/deploy-pages` 的 preview 能力或第三方 action 给 PR 生成预览 URL（弥补 Pages 原生无预览的短板）。

## 一、Actions 模式 vs Legacy Branch 模式

GitHub Pages 部署有两种模式：

```
Legacy Branch 模式（简单）：
  Settings → Pages → Source: Deploy from a branch
  → 选分支（main）+ 目录（/ 或 /docs）
  → GitHub 自动把静态文件部署到 Pages
  → 限制：只能部署纯静态文件，不能跑构建步骤

Actions 模式（推荐，灵活）：
  Settings → Pages → Source: GitHub Actions
  → 在仓库放 .github/workflows/deploy.yml
  → 工作流：checkout → install → build（SSG）→ upload-artifact → deploy
  → 可插入测试、Lint、压缩、缓存等任意步骤
```

- **何时用 Legacy**：仓库里就是纯静态 HTML/CSS/JS（手写或已构建好的产物），无需构建步骤。
- **何时用 Actions**：用 SSG（VitePress/Docusaurus/Hugo/Next.js SSG），需要在部署前跑构建——这是现代文档站/项目主页的主流模式。

## 二、一个完整的 VitePress 部署工作流

以 VitePress（Vue 驱动的文档站点生成器）为例，标准工作流：

```yaml
# .github/workflows/deploy.yml
name: Deploy VitePress to GitHub Pages

on:
  push:
    branches: [main]          # push 到 main 触发
  workflow_dispatch:           # 允许手动触发

permissions:
  contents: read
  pages: write                 # 部署 Pages 所需
  id-token: write              # 部署 Pages 所需（OIDC）

concurrency:
  group: pages
  cancel-in-progress: false    # 同一时间只一个部署

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm           # 缓存 npm 依赖
      - run: npm ci            # 安装依赖
      - run: npm run docs:build   # 构建 VitePress
      - uses: actions/configure-pages@v5    # 配置 Pages
      - uses: actions/upload-pages-artifact@v3   # 上传产物
        with:
          path: docs/.vitepress/dist   # VitePress 产物目录

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: github-pages          # Pages 部署环境
    steps:
      - uses: actions/deploy-pages@v4   # 部署
```

- **关键步骤**：checkout 代码 → setup-node（带缓存）→ `npm ci` 装依赖 → 构建命令（SSG）→ configure-pages → upload-pages-artifact（产物目录）→ deploy-pages。
- **permissions**：必须给 `pages: write` + `id-token: write`，否则部署无权限。
- **environment: github-pages**：deploy 作业必须用这个固定环境名，GitHub 据此路由部署。

## 三、artifact：构建产物的打包

`actions/upload-pages-artifact` 是把构建产物上传为 Pages 兼容 artifact 的标准 action：

- **作用**：把指定目录（如 `.vitepress/dist`、`dist`、`public`）打包成名为 `github-pages` 的 artifact，供 deploy 步骤拉取部署。
- **约束**：artifact 必须是静态文件（HTML/CSS/JS/图片），不能含服务端代码；推荐大小 ≤ 1GB、文件数 ≤ 1000。
- **路径**：`path` 参数指向 SSG 的产物目录——不同 SSG 产物目录不同（VitePress `.vitepress/dist`、Docusaurus `build`、Hugo `public`、Next.js SSG `out`）。
- **多作业传递**：build 作业上传 artifact，deploy 作业（`needs: build`）隐式拉取同一 artifact 部署。

## 四、不同 SSG 的构建配置

| SSG | 构建命令 | 产物目录 | base 配置（项目站点） |
| --- | --- | --- | --- |
| **VitePress** | `npm run docs:build` | `docs/.vitepress/dist` | `base: '/<repo>/'` |
| **Docusaurus** | `npm run build` | `build` | `baseUrl: '/<repo>/'` |
| **Hugo** | `hugo --minify` | `public` | `baseURL` + `--baseURL` |
| **Next.js SSG** | `npm run build && next export` | `out` | `basePath: '/<repo>'` |
| **Astro** | `npm run build` | `dist` | `base: '/<repo>'` |

- **base 路径**：项目站点 URL 有 `/<repo>/` 前缀，SSG 必须配置 `base`/`baseUrl` 让资源路径正确，否则 CSS/JS 404。
- **用户站点**：URL 无前缀（`<user>.github.io`），`base` 设为 `/`。

## 五、CI/CD 进阶：测试、预览、通知

Actions 工作流可插入任意步骤，实现完整 CI/CD：

- **测试门禁**：在 build 前加 `npm test`/`npm run lint`，失败则阻断部署——保证不把坏代码上线。
- **预览部署**：用 `rossjordan/pr-preview-action` 等第三方 action 给 PR 生成预览 URL，弥补 Pages 原生无预览的短板。
- **缓存优化**：`setup-node` 的 `cache: 'npm'` 缓存 `~/.npm`，二次构建跳过依赖安装。
- **构建通知**：部署成功/失败用 `slackapi/slack-github-action` 发 Slack 通知。
- **定时重建**：用 `on: schedule` (cron) 定期重建（如内容从 CMS 拉的站点，定时刷新静态产物）。

## 六、资源限制与对策

GitHub Pages 对 Actions 部署有软限制，理解才能避免踩坑：

- **存储**：单仓库推荐 ≤ 1GB（artifact + 源码），超出可能被限制。
- **带宽**：每月 100GB（软限制），高流量站可能触限——超出考虑 Netlify/Cloudflare（无限带宽）。
- **构建频率**：每小时 10 次构建（公开仓库），频繁 push 会排队——合并提交减少构建次数。
- **私有仓库**：需 GitHub Pro/Team/Enterprise 才能用 Pages。

## 下一步

掌握 Actions 自动部署后，下一站进入[自定义域名与 HTTPS](./domain-and-https)——如何绑定自有域名、配置 DNS、启用免费 HTTPS。
