---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Google Search Central（developers.google.com/search/docs）+ sitemaps.org + web.dev + llmstxt.org 官方文档编写，对照 2026-03 ~ 2026-04 最新页面

## 速查

- Google 处理 JS 页面三阶段：**crawl（抓取初始 HTML）→ render（WRS 用 evergreen Chromium 执行 JS）→ index（纳入索引）**
- WRS 渲染队列可能延迟**数秒到数久**；**非 200 状态码可能直接跳过渲染**
- 让爬虫拿到完整 HTML 的优先级：**SSR / SSG / prerender > 动态渲染（workaround，非推荐）> 纯 CSR**
- robots.txt **只管 crawl**（Disallow / Allow），不管 indexing；`Noindex` 指令 Google **自 2019 年起不再支持**
- 控制 indexing 用 `<meta name="robots" content="noindex">` 或 `X-Robots-Tag` HTTP 头
- 重定向可靠性梯度：**server-side 301/308（永久，传 canonical） > meta refresh（0s=永久）> JS location > crypto**
- hreflang：必须**双向链接 + 含自身 + x-default 兜底**；语言码 ISO 639-1 在前（`be` = 白俄罗斯语，非比利时）
- URL：用**连字符**分词（非下划线）、**大小写敏感**（`/Apple` ≠ `/apple`）、用 **History API** 而非 fragment 路由
- 移动优先索引：移动版即索引来源，内容 / meta / 结构化数据 / 图片 alt 须与桌面版**对等**
- Core Web Vitals（page experience 排名信号）：**LCP ≤ 2.5s / INP ≤ 200ms（2024-03 替代 FID）/ CLS ≤ 0.1**
- sitemap.xml 单文件上限：**50000 URLs / 50MB（未压缩）**，超限用 sitemap index
- SPA 防 soft 404：API 判定不存在时**跳转到服务端真实 404**，或**动态注入 `<meta name=robots content=noindex>`**
- AI 时代补充：**`/llms.txt`** 为 LLM 爬虫提供 Markdown 站点概览（约 v1.7.0，新兴提案，补充而非替代 robots/sitemap）

## 技术 SEO 是什么

技术 SEO 是让搜索引擎与 AI 爬虫能正确**发现、渲染、索引、理解**页面结构的技术性配置。它不写关键词、不优化内容，而是修路架桥：

- **能不能进得来**：robots.txt / 防止服务器宕机 / 合理的抓取速度
- **能不能看得见**：SSR / SSG / prerender / 防止 JS 渲染失败 / 不依赖用户交互加载主要内容
- **能不能读得懂**：canonical / hreflang / URL 规范 / 结构化数据
- **能不能收得下**：sitemap / 重定向链 / 防止 soft 404 / 移动优先对等

> 技术 SEO 决定「能不能进索引」，是所有内容 / 外链优化的前置条件。技术不过关，再好的内容也收不进来。

## Google 处理 JavaScript 页面三阶段

Google 处理依赖 JS 的页面分三步：

### 1. Crawl（抓取）

Googlebot 用 HTTP 抓取页面的**初始 HTML**（不执行 JS）。

- 沿着 `<a href>` 链接发现新 URL（**JS 注入的链接也可被发现，但需遵循 crawlable links 规范**）
- 读取 robots.txt 决定是否允许抓取
- 初始 HTML 已含核心内容（SSR / SSG / prerender） → 直接进入索引流程
- 初始 HTML 不含核心内容（CSR） → 进入渲染队列

### 2. Render（渲染）

WRS（Web Rendering Service）使用 **evergreen Chromium** 执行 JS 渲染页面。

- 渲染在**单独的队列**里进行，可能延迟**数秒到数天甚至更久**
- **非 200 状态码的响应可能直接跳过渲染**
- WRS 可能**忽略缓存头**，用过期 JS / CSS 渲染
- 渲染失败 = 内容对 Google 不可见

### 3. Index（索引）

把渲染后的内容纳入索引，参与排名。

> SSR / SSG 让 crawl 阶段就能拿到完整内容，绕开渲染队列延迟——这是「服务器渲染利于 SEO」的根本原因。

## 核心配置速览

| 维度 | 工具 | 关键点 |
| --- | --- | --- |
| **抓取控制** | robots.txt | Disallow / Allow；`Sitemap:` 指令宣告 sitemap 位置；**不支持 `Noindex`** |
| **索引控制** | robots meta / X-Robots-Tag | noindex / nofollow / nosnippet / noarchive / unavailable_after 等 |
| **规范页** | `rel=canonical` | head 内声明；Google 综合约 40 个信号判定 |
| **重定向** | 301 / 308 / 302 / 307 / meta refresh | server-side 最可靠；永久重定向传 canonical |
| **多语言** | hreflang | 双向链接 + 含自身 + x-default；三种等价实现 |
| **URL 结构** | 连字符 / 小写 / History API | 大小写敏感；下划线不分词；fragment 不区分内容 |
| **移动端** | 移动优先索引 | 移动版为索引来源；与桌面版对等 |
| **页面体验** | Core Web Vitals | LCP / INP / CLS 三指标，page experience 排名信号 |
| **站点地图** | sitemap.xml | 单文件 ≤ 50000 URLs / 50MB，超限用 sitemap index |
| **AI 爬虫** | /llms.txt | Markdown 站点概览，补充而非替代 |

## 入门检查清单

新站点做技术 SEO 排查，按以下顺序：

- [ ] robots.txt 可访问、未误封核心路径（用 Search Console 的 robots.txt 测试器）
- [ ] sitemap.xml 已提交到 Search Console，覆盖核心 URL
- [ ] 所有重要页面 HTML 内可见核心内容（view-source 检查，不只看渲染后）
- [ ] 永久迁移用 301 / 308；换域名全站 301
- [ ] 多语言页面有完整 hreflang 双向链接 + x-default
- [ ] URL 统一小写、用连字符、无 fragment 路由
- [ ] 移动版与桌面版内容 / meta / 结构化数据对等
- [ ] SPA 客户端路由防 soft 404
- [ ] Search Console 无 Coverage 错误
- [ ] Core Web Vitals 三指标达 Good

> 这是「能用」的最低门槛。深度优化见 [核心配置详解](./guide-line.md)。

## 下一步

- [核心配置详解](./guide-line.md)：渲染模式 / robots / canonical / 重定向 / hreflang / URL / 移动优先 / CWV 信号 / SPA soft 404 / llms.txt + 反模式
- [参考](./reference.md)：robots 指令表、重定向表、hreflang 实现、CWV 阈值表、官方资源
