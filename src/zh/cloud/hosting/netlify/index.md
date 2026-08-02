---
layout: doc
---

# Netlify

**Netlify** 是 **JAMstack 架构的先驱平台**——2014 年由 Mathias Biilmann 与 Christian Bach 创立，率先把"**预构建静态站点 + 全球 CDN + Git 触发部署**"这套现代前端部署范式商业化。一个开发者只需 `git push`，Netlify 自动跑构建命令、把产物部署到全球边缘节点、配上 HTTPS 与自定义域名，全程零配置。它把"部署一个网站"从手工配置 Nginx/Apache、买服务器、配 DNS 的高门槛运维工作，压缩成了一条 `git push`——这是前端工程化演进史上的一次范式转移。

Netlify 的全部考点围绕**五大能力栈**展开：①**静态托管与部署**（Git 集成、持续部署、部署预览、原子化发布）——回答"站点怎么上线、怎么迭代"；②**2025 信用制定价（credits）**（统一计费单位，带宽/构建/计算/表单/请求都换算成信用点）——回答"花多少钱、怎么控制成本"；③**内置后端能力**（表单收集、Identity 认证、A/B 测试、重定向）——回答"静态站点怎么有动态能力"；④**Edge Functions（Deno 驱动）**（在边缘节点跑 TypeScript/JavaScript，Deno runtime）——回答"边缘计算怎么用"；⑤**插件生态（Build Plugins）**（构建钩子扩展流水线）——回答"怎么定制构建流程"。本叶是云服务托管章的**开篇**，对比 Vercel/Cloudflare/GitHub Pages，理解 Netlify 的定位与取舍。

## 评价

**优点**

- **零配置开箱即用**：连 GitHub 仓库、选构建命令，一条 `git push` 自动构建 + 部署 + 配 HTTPS + CDN，前端开发者无需懂运维
- **部署预览（Deploy Previews）**：每个 PR 自动生成独立预览 URL，团队可在合并前评审线上效果，是协作利器
- **内置表单 / Identity**：静态站点不用写后端，一行 `data-netlify="true"` 即可收集表单；Identity 提供开箱即用的用户认证
- **Edge Functions（Deno）**：在边缘跑 TypeScript 处理请求、改写响应、A/B 分流，冷启动极快
- **插件生态**：Build Plugins 可在构建前后插入自定义逻辑（生成 sitemap、注入头信息），流水线可编程

**缺点**

- **2025 信用制定价不透明**：带宽、构建、计算、表单、请求都换算成信用点（如带宽 20 credits/GB），成本估算难度上升，重度流量站可能比预期贵
- **免费层收紧**：信用制下免费额度（100GB 带宽等价信用）对中流量站不够用，超出需购买
- **Edge Functions 受限于 Deno**：不像 Cloudflare Workers 那样支持长任务/容器，复杂后端逻辑力不从心
- **不适合纯后端/长驻服务**：定位是前端托管 + 轻量边缘函数，做 API 服务器、WebSocket 长连接不如传统云

## 本叶地图

- [入门](./getting-started) —— Netlify 定位、JAMstack、部署流程、2025 信用制定价、免费层与计费
- [Edge Functions 与内置后端](./guide-line/edge-and-backend) —— Edge Functions（Deno）、表单、Identity、A/B 测试、重定向
- [插件生态与高级部署](./guide-line/plugins-and-deploy) —— Build Plugins、部署预览、原子发布、CI/CD 集成
- [参考](./reference) —— 能力速查、定价对比、易错点、权威链接

## 幻灯片地址

<a href="/SlideStack/netlify-slide/" target="_blank">Netlify</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Netlify" target="_blank" rel="noopener noreferrer">Netlify 测试题</a>
