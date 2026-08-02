---
layout: doc
outline: [2, 3]
---

# 参考：GitHub Pages 能力速查、限制与易错点

> 基于 GitHub Pages 官方文档（2025） · 核于 2026-08

## 速查

- **GitHub Pages 定位**：GitHub 内置静态站点托管，文档/作品集/项目主页的默认选择，零成本零配置。
- **默认域名**：`<user>.github.io`（用户站点）/ `<user>.github.io/<repo>`（项目站点）。
- **静态-only**：无服务端运行时、无数据库、无边缘函数——动态靠客户端 JS + 第三方 API。
- **自动部署**：GitHub Actions 工作流（推荐）或 legacy branch 模式。
- **自定义域名 + HTTPS**：apex 配 A 记录，子域名配 CNAME，自动 Let's Encrypt 证书。
- **资源限制**：≤ 1GB 仓库、100GB/月带宽（软）、10 次构建/小时（公开仓库）。
- **计费**：公开仓库完全免费；私有仓库需 Pro/Team。

## 一、能力速查

| 能力 | 说明 | 备注 |
| --- | --- | --- |
| **静态托管** | HTML/CSS/JS/图片托管 | 纯静态，无服务端 |
| **Git 集成** | 代码在 GitHub，开 Pages 即上线 | git push 自动更新 |
| **GitHub Actions 部署** | 工作流构建 SSG + 部署 | 推荐模式 |
| **Legacy branch 部署** | 选源分支 + 目录 | 纯静态，无构建 |
| **自定义域名** | apex + 子域名 | CNAME 文件版本化 |
| **HTTPS** | 自动 Let's Encrypt | Enforce HTTPS 一键 |
| **用户站点** | `<user>.github.io` 仓库 | URL 根路径 |
| **项目站点** | 任意仓库 | URL 带 `/<repo>/` |

## 二、部署模式对比

| 模式 | 触发 | 构建能力 | 适用 |
| --- | --- | --- | --- |
| **Legacy branch** | 选分支 + 目录 | 无（直接部署静态文件） | 手写 HTML、已构建产物 |
| **GitHub Actions** | `git push` 触发工作流 | 全流程可编程（SSG/测试/压缩） | VitePress/Docusaurus/Hugo 等现代文档站 |

## 三、资源限制

| 限制项 | 额度 | 说明 |
| --- | --- | --- |
| 仓库大小 | 推荐 ≤ 1GB | 源码 + artifact |
| 月带宽 | 100GB（软限制） | 超出可能被限，考虑 Netlify/Cloudflare |
| 构建频率 | 10 次/小时（公开仓库） | 频繁 push 会排队 |
| 私有仓库 | 需 Pro/Team/Enterprise | 公开仓库免费 |

## 四、与其他平台对比

| 维度 | GitHub Pages | Netlify | Cloudflare Pages |
| --- | --- | --- | --- |
| 定位 | 极简静态托管 | JAMstack 先驱 | 边缘全家桶 |
| 计费 | 完全免费（公开） | 2025 信用制 | 无限带宽免费 |
| 服务端能力 | **无（静态-only）** | Edge Functions（Deno） | Workers（V8） |
| 部署预览 | 无（需自配） | 每 PR 自动 | 有 |
| 内置表单/认证 | 无 | 有 | 无 |
| 适合 | 文档/作品集/项目主页 | JAMstack/SSG | 全栈边缘 |

## 五、SSG 产物目录与 base 配置

| SSG | 构建命令 | 产物目录 | base（项目站点） |
| --- | --- | --- | --- |
| VitePress | `npm run docs:build` | `docs/.vitepress/dist` | `base: '/<repo>/'` |
| Docusaurus | `npm run build` | `build` | `baseUrl: '/<repo>/'` |
| Hugo | `hugo --minify` | `public` | `baseURL` |
| Next.js SSG | `next build && next export` | `out` | `basePath: '/<repo>'` |
| Astro | `npm run build` | `dist` | `base: '/<repo>'` |

## 六、易错点清单

- **"GitHub Pages 能跑 Node/PHP 服务端"**：错。Pages 是纯静态托管，无服务端运行时，动态只能靠客户端 JS + 第三方 API。
- **"项目站点和用户站点 URL 一样"**：错。用户站点是 `<user>.github.io`（根路径），项目站点是 `<user>.github.io/<repo>/`（带前缀）。
- **"项目站点不用配 base 也能正常显示"**：错。项目站点 URL 带 `/<repo>/` 前缀，SSG 不配 `base` 会导致 CSS/JS 404。
- **"GitHub Pages 有部署预览"**：错。Pages 原生无 PR 预览（不像 Netlify/Vercel），需自己用 Actions 配预览 action。
- **"GitHub Pages 完全无限免费"**：部分错。有软限制（1GB 仓库、100GB/月带宽、10 次构建/小时），重度站点会触限；私有仓库需付费。
- **"apex 域名用 CNAME 配置"**：错。apex 域名不能直接 CNAME（除非 DNS 服务商支持 ALIAS/ANAME），要用 A 记录指向 GitHub Pages IP。
- **"HTTPS 证书要自己买"**：错。GitHub Pages 自动签发 Let's Encrypt 免费证书并自动续期。
- **"CNAME 文件可以放任意目录"**：错。CNAME 文件必须在仓库根目录，内容是单个自定义域名。
- **"换自定义域名后 DNS 立即生效"**：错。DNS 全球传播需几分钟到 48 小时，传播期内可能间歇失败。
- **"Legacy branch 模式能跑 SSG 构建"**：错。Legacy 模式只部署现成静态文件，不能跑构建步骤；要构建必须用 Actions 模式。
- **"GitHub Pages 适合高流量视频站"**：错。100GB/月带宽软限制，高流量视频站会触限，应选 Cloudflare（无限带宽）。

## 七、进阶方向（链接其他叶）

- [Netlify](../netlify/) —— JAMstack 先驱，有部署预览与内置表单/Identity
- [Cloudflare](../cloudflare/) —— 边缘全家桶，无限带宽免费层，适合高流量与全栈

## 权威链接

- [GitHub Pages 官方文档](https://docs.github.com/en/pages)
- [GitHub Pages 快速入门](https://docs.github.com/en/pages/quickstart)
- [GitHub Actions 部署 Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow)
- [自定义域名与 HTTPS](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [GitHub Pages 限制](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#usage-limits)
- 本站幻灯片：<a href="/SlideStack/github-pages-slide/" target="_blank">GitHub Pages</a>
