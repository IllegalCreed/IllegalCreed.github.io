---
layout: doc
---

# GitHub Pages

**GitHub Pages** 是 GitHub 内置的**静态站点托管服务**——只要你的代码在 GitHub 仓库里，就能把仓库的静态文件（HTML/CSS/JS）免费发布成网站，默认域名 `<user>.github.io`，支持自定义域名 + 免费 HTTPS。它是**文档站、个人作品集、开源项目主页的默认选择**：零配置、零成本、与 Git 工作流天然集成，`git push` 即上线。它不求功能强大（不支持服务端运行时、无边缘函数、无表单后端），但求**极简与可靠**——当你只需要"把一堆静态文件挂到网上"，GitHub Pages 是门槛最低的答案。

GitHub Pages 的全部考点围绕**五大主题**展开：①**定位与默认场景**（文档/作品集/项目主页，静态-only）——回答"什么时候用它"；②**GitHub Actions 自动部署**（用 Actions 工作流自动构建 + 推送产物到 Pages 分支）——回答"怎么自动化部署"；③**静态-only 限制**（无服务端、无 PHP/Node 运行时、无数据库，所有动态靠客户端 JS + 第三方 API）——回答"它能做什么、不能做什么"；④**自定义域名与 HTTPS**（绑定自有域名，自动 Let's Encrypt 证书）——回答"怎么用自己的域名"；⑤**`.github.io` 域名与仓库类型**（用户/组织站点 `<user>.github.io` 仓库 vs 项目站点 `<user>.github.io/<repo>`）——回答"URL 结构怎么定"。本叶是云服务托管章的**极简基线**，对比 Netlify/Cloudflare，理解 GitHub Pages 的定位边界。

## 评价

**优点**

- **完全免费**：公开仓库的 Pages 完全免费，无限请求（私有仓库需 GitHub Pro/Team）；零成本门槛
- **零配置 Git 集成**：代码已在 GitHub，开 Pages 即上线，`git push` 自动更新，与 Git 工作流无缝
- **GitHub Actions 自动部署**：用 Actions 工作流自动构建（SSG/打包）+ 部署，全流程可编程
- **自定义域名 + 免费 HTTPS**：绑定自有域名，自动签发续期 Let's Encrypt 证书，全程零配置
- **稳定可靠**：背靠 GitHub 基础设施，可用性高，适合长期托管文档/作品集
- **开源友好**：开源项目文档天然放 Pages（如 VitePress/Docusaurus 生成的文档站），与代码仓库同源

**缺点**

- **静态-only 限制**：无服务端运行时（不能跑 PHP/Node/Python）、无数据库、无边缘函数——所有动态靠客户端 JS + 第三方 API
- **无部署预览**：不像 Netlify/Vercel 那样每个 PR 自动生成预览 URL（需自己用 Actions 配预览）
- **资源限制**：单仓库推荐 ≤ 1GB、每月带宽 100GB、每小时构建 10 次（公开仓库），重度站点会触限
- **构建定制性弱**：原生只托管静态文件，复杂构建要靠 GitHub Actions 自行配置（不如 Netlify/Vercel 开箱即用）
- **无内置后端能力**：无表单收集、无认证服务、无 A/B 测试——这些需接第三方（Formspree/Auth0 等）

## 本叶地图

- [入门](./getting-started) —— GitHub Pages 定位、仓库类型与域名、静态-only 限制、与 Netlify/Cloudflare 对比
- [GitHub Actions 自动部署](./guide-line/actions-deploy) —— Actions 工作流、SSG 构建部署、artifact 与 pages artifact、CI/CD 实践
- [自定义域名与 HTTPS](./guide-line/domain-and-https) —— 自定义域名绑定、HTTPS 自动签发、DNS 配置、`.github.io` 域名结构
- [参考](./reference) —— 能力速查、限制清单、易错点、权威链接

## 幻灯片地址

<a href="/SlideStack/github-pages-slide/" target="_blank">GitHub Pages</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=GitHub%20Pages" target="_blank" rel="noopener noreferrer">GitHub Pages 测试题</a>
