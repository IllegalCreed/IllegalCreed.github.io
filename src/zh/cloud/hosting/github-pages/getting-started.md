---
layout: doc
outline: [2, 3]
---

# 入门：GitHub Pages 定位、仓库类型与静态限制

> 基于 GitHub Pages 官方文档（2025） · 核于 2026-08

## 速查

- **GitHub Pages 是什么**：GitHub 内置的**静态站点托管服务**，把仓库的静态文件（HTML/CSS/JS）免费发布成网站，默认域名 `<user>.github.io`，支持自定义域名 + 免费 HTTPS。
- **默认场景**：**文档站、个人作品集、开源项目主页**——零成本、零配置、与 Git 工作流天然集成，`git push` 即上线。
- **两类站点**：①**用户/组织站点**——仓库名 `<user>.github.io`，URL 为 `https://<user>.github.io/`；②**项目站点**——任意仓库，URL 为 `https://<user>.github.io/<repo>/`。
- **静态-only 限制**：**无服务端运行时**（不能跑 PHP/Node/Python）、**无数据库**、**无边缘函数**——所有动态靠客户端 JS + 第三方 API。这是它与 Netlify/Cloudflare 的根本边界。
- **GitHub Actions 自动部署**：用 Actions 工作流自动构建（SSG 打包、压缩、生成）+ 推送产物到 Pages，全流程可编程，支持 VitePress/Docusaurus/Next.js SSG/Hugo 等。
- **自定义域名 + HTTPS**：绑定自有域名，自动签发续期 Let's Encrypt 证书，支持 apex 域名（`example.com`）与子域名（`www.example.com`）。
- **免费 + 公开仓库**：公开仓库的 Pages 完全免费；私有仓库需 GitHub Pro/Team/Enterprise。
- **资源限制**：单仓库推荐 ≤ 1GB、每月带宽 100GB（软限制）、每小时构建 10 次（公开仓库）。
- **无部署预览**：不像 Netlify/Vercel 每个自动 PR 生成预览 URL（需自己用 Actions 配预览 artifact）。
- **无内置后端**：无表单收集（接 Formspree）、无认证（接 Auth0）、无 A/B 测试——靠第三方。
- **进阶顺序**：[GitHub Actions 自动部署](./guide-line/actions-deploy) → [自定义域名与 HTTPS](./guide-line/domain-and-https) → [参考](./reference)。

## 一、GitHub Pages：极简的静态托管

GitHub Pages 的核心价值是**极简与可靠**——当你只需要"把一堆静态文件挂到网上"，它是门槛最低的答案：

```
开发者工作流：
  仓库里放静态文件（HTML/CSS/JS，或 SSG 生成的产物）
    → 在仓库 Settings → Pages 开启
    → 选源分支（如 main）与目录（如 /docs 或 /）
    → GitHub 自动构建 + 部署到全球 CDN
    → 访问 https://<user>.github.io/<repo>/
    → 后续 git push 自动更新
```

- **零成本**：公开仓库完全免费，适合个人作品集、开源文档、博客。
- **Git 原生**：代码已在 GitHub，开 Pages 即上线，部署与版本控制同源——这是它的独特优势。
- **稳定可靠**：背靠 GitHub 基础设施，适合长期托管，不用担心小服务商跑路。
- **定位边界**：它不求功能强大（无服务端、无边缘函数、无表单），但求极简可靠——是托管静态文档/作品集的基线选择。

## 二、两类站点与域名结构

GitHub Pages 有两类站点，URL 结构不同：

| 类型 | 仓库名 | URL | 用途 |
| --- | --- | --- | --- |
| **用户/组织站点** | `<user>.github.io` | `https://<user>.github.io/` | 个人主页、组织官网 |
| **项目站点** | 任意仓库 | `https://<user>.github.io/<repo>/` | 项目主页、文档 |

- **用户站点**：必须创建名为 `<user>.github.io` 的仓库（如 `zhangxu.github.io`），其 `main` 分支根目录（或 `/docs`）的内容发布到 `https://<user>.github.io/`。每个用户/组织只能有一个用户站点。
- **项目站点**：任意仓库都可开 Pages，发布到 `https://<user>.github.io/<repo>/`——注意 URL 有 `/<repo>/` 前缀，影响相对路径（SSG 通常要配 `base` 选项，如 VitePress 的 `base: '/<repo>/'`）。
- **自定义域名覆盖**：绑定自定义域名后，两类站点都通过自定义域名访问，URL 前缀差异被隐藏。

## 三、静态-only 限制：根本边界

GitHub Pages 是**纯静态托管**，这是它与 Netlify/Cloudflare 的根本边界：

- **无服务端运行时**：不能跑 PHP/Node/Python/Ruby——所有逻辑要么构建时生成（SSG），要么运行时在浏览器跑（客户端 JS）。
- **无数据库**：没有内置数据库连接，需要数据要么构建时写死（SSG 从 API 拉数据生成静态页），要么运行时客户端 fetch 第三方 API。
- **无边缘函数**：不像 Cloudflare Workers/Netlify Edge Functions 能在边缘跑代码——Pages 没有服务端计算。
- **动态能力的替代方案**：表单用 Formspree/Netlify Forms（跨域）；认证用 Auth0/Clerk；评论用 Disqus/Giscus；搜索用 Algolia——靠客户端 JS + 第三方 API 拼动态。

## 四、GitHub Actions 自动部署

虽然 Pages 原生只托管静态文件，但配合 **GitHub Actions** 可实现复杂的自动构建部署：

- **工作流触发**：`git push` 到生产分支触发 Actions 工作流。
- **构建步骤**：在 Actions 里跑 SSG（VitePress/Docusaurus/Hugo/Next.js SSG）生成静态产物，或跑打包（Vite/Webpack）。
- **部署步骤**：用 `actions/upload-pages-artifact` + `actions/deploy-pages` 把产物部署到 Pages。
- **优势**：全流程可编程——可插入测试、Lint、压缩、缓存、通知等步骤，比 Netlify/Vercel 的开箱即用更灵活但需自行配置。

## 五、自定义域名与 HTTPS

- **自定义域名**：在仓库 Settings → Pages 添加自定义域名，支持 apex（`example.com`）与子域名（`www.example.com`）。
- **HTTPS**：绑定域名后自动签发 Let's Encrypt 证书，开启 HTTPS 只需勾选 Enforce HTTPS——全程零配置。
- **DNS 配置**：apex 域名配 A 记录指向 GitHub Pages IP；子域名配 CNAME 指向 `<user>.github.io`。
- **CNAME 文件**：在仓库根目录放 `CNAME` 文件（内容为自定义域名）让配置随仓库版本化。

## 六、与 Netlify / Cloudflare 对比

| 维度 | GitHub Pages | Netlify | Cloudflare Pages |
| --- | --- | --- | --- |
| 定位 | 极简静态托管 | JAMstack 先驱 | 边缘全家桶 |
| 计费 | 完全免费（公开仓库） | 2025 信用制 | 无限带宽免费层 |
| 服务端能力 | **无（静态-only）** | Edge Functions（Deno） | Workers（V8） |
| 部署预览 | 无（需自配） | 每 PR 自动 | 有 |
| 内置表单/认证 | 无（接第三方） | 有 | 无 |
| 自动部署 | GitHub Actions | Git 触发开箱即用 | Git 触发开箱即用 |
| 适合 | 文档/作品集/项目主页 | JAMstack/SSG 站点 | 全栈边缘应用 |

- **选 GitHub Pages 的理由**：纯文档/作品集、零成本、已在 GitHub、极简可靠。
- **选 Netlify 的理由**：JAMstack 老牌、部署预览、内置表单/Identity、插件生态。
- **选 Cloudflare 的理由**：无限带宽、全栈边缘（Workers/R2/D1）、成本敏感。

## 下一步

理解了 GitHub Pages 的定位与限制后，下一步深入两大实践——[GitHub Actions 自动部署](./guide-line/actions-deploy)（工作流配置、SSG 构建部署、CI/CD）与[自定义域名与 HTTPS](./guide-line/domain-and-https)（域名绑定、DNS、证书）。
