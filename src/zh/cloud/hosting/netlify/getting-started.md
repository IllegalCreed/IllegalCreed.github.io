---
layout: doc
outline: [2, 3]
---

# 入门：Netlify 定位、部署流程与信用制定价

> 基于 Netlify 官方文档（2025） · 核于 2026-08

## 速查

- **Netlify 是什么**：JAMstack 部署平台先驱（2014 创立），把"静态站点 + Git + 全球 CDN + 自动部署"打包成一条 `git push` 的零配置体验，是前端工程化部署的范式标杆。
- **JAMstack**：**J**avaScript（客户端动态）+ **A**PIs（后端服务）+ **M**arkup（预构建静态 HTML）。核心理念是**预渲染 + CDN 分发**，告别运行时渲染，性能与安全双优。
- **部署流程**：连 GitHub/GitLab/Bitbucket → 选分支与构建命令 → `git push` 触发 → Netlify 拉代码、跑构建、上传产物到 CDN → 自动配 HTTPS + 域名。**原子化发布**（新版一次性切流，不留中间态）。
- **部署预览（Deploy Previews）**：每个 Pull Request 自动生成一个独立预览 URL，团队可在合并前评审"真实线上效果"——这是 Netlify 协作的核心卖点。
- **2025 信用制（credits）定价**：2025 年 9 月 4 日起新账号统一改用**信用点计费**，带宽、生产部署、计算、表单、请求都换算成信用点，取代旧的"带宽 + 构建分钟"双线计费。
- **关键信用汇率**：带宽 **20 credits/GB**、生产部署 **15 credits/次**、计算 **10 credits/GB-小时**、Web 请求 **2 credits/百次**、表单提交 **1 credit/次**。
- **免费层**：每月约 **100 credits 免费额度**（≈ 100GB 带宽等价），个人项目够用；超额需升级付费计划（Personal $9/月含 1000 credits）。
- **内置后端**：**表单（Forms）**（一行 `data-netlify="true"` 收集表单，无需后端）、**Identity**（开箱即用的用户认证/注册/登录）、**A/B 测试**（分支测试，零代码切分流量）。
- **Edge Functions**：在**全球边缘节点**运行的 TypeScript/JavaScript 函数，由 **Deno** runtime 驱动，冷启动毫秒级，用于改写请求/响应、A/B 分流、鉴权、个性化。
- **插件（Build Plugins）**：在构建生命周期的特定阶段（onPreBuild/onBuild/onPostBuild）插入自定义脚本，可生成 sitemap、注入 `<head>`、通知 Slack——流水线可编程。
- **适用边界**：**适合**静态站点、JAMstack、SSG（Hugo/Next.js SSG）、营销页、博客、文档站；**不适合**纯后端 API 服务、长驻 WebSocket、重度动态 SSR（虽支持 SSR 但非其强项）。
- **进阶顺序**：[Edge Functions 与内置后端](./guide-line/edge-and-backend) → [插件生态与高级部署](./guide-line/plugins-and-deploy) → [参考](./reference)。

## 一、Netlify 与 JAMstack：前端部署的范式转移

JAMstack 是 Netlify 推广的架构理念，核心是**预构建 + CDN**：

```
传统 LAMP/动态站点：
  浏览器请求 → 服务器跑 PHP/Node → 查数据库 → 拼模板生成 HTML → 返回
  （每次请求都重新渲染，慢、易被攻击、难扩容）

JAMstack：
  构建时（git push 触发）：
    拉代码 → 跑静态站点生成器（Next.js SSG/Hugo/Gatsby）
        → 预渲染出全部静态 HTML/JS/CSS
        → 上传到全球 CDN
  运行时（用户访问）：
    浏览器请求 → 最近的 CDN 边缘节点直接返回静态文件
        → 动态能力靠客户端 JS + 第三方 API（表单/认证/数据库）
```

- **性能**：静态文件直接从离用户最近的边缘节点返回，无服务端渲染延迟，TTFB（首字节时间）极低。
- **安全**：没有运行时服务器、没有数据库直连，攻击面大幅缩小（没有 SQL 注入、没有服务端漏洞）。
- **成本**：静态文件托管在 CDN 极廉价，无需为空闲时的服务器付费。
- **Netlify 的角色**：把上述构建-部署-分发全流程自动化——开发者只需关心代码，部署交给 Netlify。

## 二、部署流程：从 git push 到上线

Netlify 的核心体验是**Git 驱动的持续部署**：

1. **连接仓库**：在 Netlify 后台授权并选择 GitHub/GitLab/Bitbucket 仓库。
2. **配置构建**：指定构建命令（如 `npm run build`）与发布目录（如 `dist`/`public`）。Netlify 会自动识别常见框架（Next.js/Vite/Hugo）的默认配置。
3. **触发部署**：每次 `git push` 到生产分支（如 `main`），Netlify 自动拉取代码、在它的构建容器里执行构建命令、把产物上传到全球 CDN。
4. **原子发布**：新版本**一次性**切流到生产——不会出现"一半用户看到新版、一半看到旧版"的中间态。出问题可一键回滚到任意历史版本。
5. **HTTPS 与域名**：自动签发并续期 Let's Encrypt 证书，绑定自定义域名全程零配置。

- **部署预览（Deploy Previews）**：每个 Pull Request 会额外触发一次部署，生成一个**独立的预览 URL**（如 `deploy-preview-42--yoursite.netlify.app`），团队、设计师、产品可在合并前直接访问评审——这是 Netlify 协作的核心卖点，也是相对 GitHub Pages 的一大优势。
- **分支部署**：每个分支都有独立 URL（`<branch>--<site>.netlify.app`），方便做特性分支的并行预览。

## 三、2025 信用制（credits）定价

2025 年 9 月 4 日，Netlify 对新账号推出**信用制（credit-based）定价**，统一计费单位，取代旧的"带宽 + 构建分钟"双线模型：

| 资源 | 信用汇率 | 说明 |
| --- | --- | --- |
| **带宽（Bandwidth）** | 20 credits / GB | 用户访问站点消耗的下行流量 |
| **生产部署（Production builds）** | 15 credits / 次 | 生产分支的每次构建（不再单算构建分钟） |
| **计算（Compute）** | 10 credits / GB-小时 | Functions / Edge Functions 实际运行消耗 |
| **Web 请求（Requests）** | 2 credits / 百次 | 站点的 HTTP 请求总量 |
| **表单提交（Form submissions）** | 1 credit / 次 | Forms 功能收集的每条表单 |

- **核心变化**：旧的"免费 100GB 带宽 + 300 构建分钟"被统一的信用额度替代。**Personal 计划 $9/月含 1000 credits**，约等价 50GB 带宽 + 若干构建/函数调用。
- **优点**：账单单一变量，不再需要分别盯带宽和构建两条线。
- **缺点**：成本**可预测性下降**——重度流量站（如视频/大图站）可能发现 1000 credits 主要被带宽吃掉（50GB 就耗尽），需要更精细的预算规划。
- **免费层**：仍提供有限的免费额度（约 100 credits/月），适合个人项目与原型验证。

## 四、免费层与计费策略

理解免费层的边界，才能避免意外账单：

- **免费额度**：每月约 100 credits（覆盖少量带宽、构建、函数调用），单项目个人博客/作品集足够。
- **静态资源**：纯静态站点的 HTML/CSS/JS/图片托管本身极廉价，主要成本来自**带宽**（用户访问）。
- **Edge Functions**：每次调用消耗计算 credits，高频调用（如每个请求都跑边缘函数）会快速累积成本。
- **表单**：免费层限制表单提交条数，超出需升级——营销活动收集大量表单时要留意。
- **控制成本技巧**：①用 CDN 缓存头（`Cache-Control`）最大化边缘缓存，减少回源；②大文件放对象存储（如 R2/S3）而非 Netlify；③Edge Functions 只做轻逻辑，重活下放。

## 五、Netlify vs Vercel vs Cloudflare vs GitHub Pages

| 维度 | Netlify | Vercel | Cloudflare Pages | GitHub Pages |
| --- | --- | --- | --- | --- |
| 定位 | JAMstack 先驱 | Next.js 母公司 | 边缘计算全家桶 | 文档/作品集默认 |
| 计费 | 2025 信用制 | 带宽 + 函数 | 无限带宽免费层 | 完全免费（限公开仓库） |
| Edge Runtime | Deno | V8 Isolates + Edge | V8（Workers） | 无 |
| 部署预览 | 强（每 PR 一个） | 强 | 有 | 无 |
| 适合 | JAMstack、SSG | Next.js 应用 | 全栈边缘 | 文档/个人站 |

- **选 Netlify 的理由**：JAMstack 老牌、部署预览体验好、内置表单/Identity 省事、插件生态成熟。
- **选 Vercel 的理由**：用 Next.js、要最佳 SSR/ISR 支持、DX（开发体验）顶级。
- **选 Cloudflare 的理由**：要无限带宽免费层、要全栈边缘（Workers/R2/D1）、成本敏感。
- **选 GitHub Pages 的理由**：纯文档/作品集、只想用 GitHub、零成本。

## 下一步

理解了 Netlify 的定位与部署流程后，下一步深入它的两大进阶能力——[Edge Functions 与内置后端](./guide-line/edge-and-backend)（边缘计算、表单、Identity、A/B 测试）与[插件生态与高级部署](./guide-line/plugins-and-deploy)（Build Plugins、原子发布、CI 集成）。
