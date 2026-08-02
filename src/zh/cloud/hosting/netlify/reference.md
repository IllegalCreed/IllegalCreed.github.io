---
layout: doc
outline: [2, 3]
---

# 参考：Netlify 能力速查、定价对比与易错点

> 基于 Netlify 官方文档（2025） · 核于 2026-08

## 速查

- **Netlify 定位**：JAMstack 部署平台先驱，Git 触发 + 全球 CDN + 零配置 HTTPS，把部署压缩成 `git push`。
- **JAMstack**：JavaScript + APIs + Markup（预构建静态 + CDN 分发），性能与安全双优。
- **核心能力**：静态托管、部署预览、原子发布、Forms 表单、Identity 认证、A/B 测试、Edge Functions（Deno）、Build Plugins。
- **2025 信用制**：带宽 20 credits/GB、生产部署 15 credits/次、计算 10 credits/GB-时、请求 2 credits/百次、表单 1 credits/次。
- **免费层**：约 100 credits/月，个人项目够用；Personal $9/月含 1000 credits。
- **Edge Functions**：Deno runtime，全球边缘节点，冷启动毫秒级，匹配 URL 路径。
- **部署预览**：每 PR 一个独立预览 URL，协作核心卖点。

## 一、能力栈速查

| 能力 | 说明 | 备注 |
| --- | --- | --- |
| **静态托管** | HTML/CSS/JS/图片托管在全球 CDN | 原子发布，一键回滚 |
| **Git 持续部署** | GitHub/GitLab/Bitbucket，`git push` 触发 | 自动识别框架 |
| **部署预览** | 每个 PR 独立预览 URL | 协作核心卖点 |
| **分支部署** | 每分支独立 URL | 并行特性预览 |
| **Forms** | `data-netlify="true"` 收集表单，无需后端 | 免费层限量 |
| **Identity** | 注册/登录/OAuth/JWT 用户认证 | 开箱即用 |
| **A/B 测试** | 基于分支的流量分流 | 整站级实验 |
| **Edge Functions** | Deno runtime，全球边缘 TypeScript | 冷启动毫秒级 |
| **Serverless Functions** | AWS Lambda，Node/Go/Rust，单区域 | 重逻辑 |
| **重定向/改写** | `netlify.toml` 声明式路由 | 支持 301/302/200 |
| **Build Plugins** | 构建钩子扩展流水线 | 官方+私有插件 |
| **HTTPS** | 自动 Let's Encrypt 签发续期 | 零配置 |
| **自定义域名** | 绑定自有域名 | 自动 DNS/证书 |

## 二、2025 信用制定价

| 资源 | 信用汇率 | 示例 |
| --- | --- | --- |
| 带宽 | 20 credits / GB | 50GB 流量 = 1000 credits |
| 生产部署 | 15 credits / 次 | 月 20 次部署 = 300 credits |
| 计算（Functions/Edge） | 10 credits / GB-时 | 高频调用累积快 |
| Web 请求 | 2 credits / 百次 | 100 万请求 = 20 credits |
| 表单提交 | 1 credits / 次 | 1000 条表单 = 1000 credits |

- **免费层**：约 100 credits/月（个人原型/博客）。
- **Personal**：$9/月，1000 credits（≈ 50GB 带宽）。
- **成本控制**：用 `Cache-Control` 最大化 CDN 缓存、大文件外置到对象存储、Edge Functions 只做轻逻辑。

## 三、Edge Functions vs Serverless Functions

| 维度 | Edge Functions | Serverless Functions |
| --- | --- | --- |
| Runtime | **Deno** | AWS Lambda（Node/Go/Rust） |
| 运行位置 | **全球边缘节点** | 单一区域 |
| 冷启动 | **毫秒级** | 数百毫秒到秒 |
| 适合 | 轻逻辑、全球低延迟、Web API | 重计算、长任务、特定区域 |
| 限制 | 受限于 Deno 沙箱 | 更高内存/时长 |

## 四、与其他平台对比

| 维度 | Netlify | Vercel | Cloudflare Pages | GitHub Pages |
| --- | --- | --- | --- | --- |
| 定位 | JAMstack 先驱 | Next.js 母公司 | 边缘全家桶 | 文档/作品集默认 |
| 计费 | 信用制（2025） | 带宽+函数 | 无限带宽免费层 | 完全免费（公开仓库） |
| 部署预览 | 强（每 PR 一个） | 强 | 有 | 无 |
| Edge Runtime | Deno | V8 Isolates | V8（Workers） | 无 |
| 内置表单 | 有（Forms） | 无 | 无 | 无 |
| 内置认证 | 有（Identity） | 无 | 无 | 无 |

## 五、易错点清单

- **"Netlify 完全免费"**：错。2025 信用制下免费层有限（约 100 credits/月），流量/构建/函数调用都会消耗，超出需付费。
- **"信用制 = 比旧定价便宜"**：不一定。带宽从 100GB 免费缩到等价信用（约 50GB），重度流量站实际成本可能上升。
- **"Edge Functions = Serverless Functions"**：错。Edge 跑全球边缘（Deno，毫秒冷启动，适合轻逻辑）；Serverless 跑单一区域（Lambda，重逻辑）。两者用途不同。
- **"Edge Functions 支持任意 Node 模块"**：错。Edge 基于 Deno，受 Web 标准 API 限制，不能直接 `require('fs')`/`require('express')`，要用 Web 标准（`fetch`/`Request`/`Response`）。
- **"Forms 加 data-netlify 就一定能收到"**：需注意表单要在构建时被 Netlify 解析（HTML 中静态存在），纯 JS 动态生成的表单要额外配置隐藏的"探测表单"。
- **"部署预览和生产环境完全一样"**：大体一致，但预览环境的 Edge Functions/环境变量/插件行为可能与生产略有差异，关键测试仍需在 staging 验证。
- **"A/B 测试能做组件级实验"**：错。Netlify 的 A/B 测试是**分支级**（整站变体），不像 Optimizely 那样做页面内组件级实验。
- **"原子发布 = 不可回滚"**：错。原子发布反而让回滚更简单——一键切回任意历史版本的不可变快照。
- **"信用制下构建不再花钱"**：错。生产部署每次 15 credits，频繁部署仍消耗信用，需规划部署频率。

## 六、进阶方向（链接其他叶）

- [Cloudflare](../cloudflare/) —— 边缘计算全家桶，无限带宽免费层是核心差异
- [GitHub Pages](../github-pages/) —— 文档/作品集的零成本默认选择

## 权威链接

- [Netlify 官方文档](https://docs.netlify.com/)
- [Netlify 定价](https://www.netlify.com/pricing/)
- [Netlify 信用制定价公告](https://www.netlify.com/changelog/netlify-pricing-update-introducing-credit-based-plans/)
- [Edge Functions 文档](https://docs.netlify.com/edge-functions/overview/)
- [Build Plugins 文档](https://docs.netlify.com/integrations/build-plugins/)
- [JAMstack.org](https://jamstack.org/)
- 本站幻灯片：<a href="/SlideStack/netlify-slide/" target="_blank">Netlify</a>
