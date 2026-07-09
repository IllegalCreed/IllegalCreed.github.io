---
layout: doc
---

# Lovable

**「vibe coding」（氛围编程）赛道的标杆 AI 全栈应用生成器**：用自然语言对话（也可上传截图 / 设计稿 / 文档）即可生成、迭代并部署**真实代码**的全栈 Web 应用。官方把它定义为「a full-stack AI development platform for building, iterating on, and deploying web applications using natural language, with real code, security, and enterprise governance」——主打「非技术用户也能造软件」，同时保留代码所有权与企业级治理。生成产物默认是 React + Vite + TypeScript + Tailwind + shadcn/ui 前端，搭配 Supabase / Lovable Cloud 后端；首页主标语 **"Build something Lovable"**，副标 "Create apps and websites by chatting with AI"。2025 年成立，约 8 个月达 $100M ARR，2025-12 完成 $330M B 轮、估值 **$6.6B**。

## 评价

**优点**

- **自然语言 → 全栈 app**：对话即生成可运行、可部署的真实代码（不是静态原型），上传截图 / Figma 设计稿也能起步，门槛极低
- **可视化点选编辑**：预览区直接点选元素用自然语言改、行内改文字（Edit Text Inline）原地编辑——非技术用户友好的差异化卖点
- **Lovable Cloud 全栈后端**：内建数据库 / 认证 / 存储 / Edge Functions / AI 五件套（Supabase 基座），默认开启、零外部配置，开箱即生产可用
- **Lovable AI 免自带 key**：在生成的 app 里直接用内建模型（默认 Gemini，后扩 GPT）做聊天 / 摘要 / 生图 / 语义搜索，无需申请 API key
- **GitHub 双向同步 + 代码所有权**：Lovable 里的改动同步到 GitHub，推到活跃分支的改动也同步回 Lovable，可克隆到本地用自己 IDE 改、脱离平台独立部署
- **发布前强制安全扫描**：内置 pre-publish 安全扫描 + 敏感数据扫描 + RLS 检查清单，帮新手兜底常见的密钥泄露 / 越权读数据
- **60+ 集成连接器**：Supabase / Stripe / GitHub / GitLab / Resend 等均有官方专页，覆盖支付、邮件、数仓、CRM、电商、通信

**缺点**

- **闭源 SaaS**：平台本身不开源、不能私有部署（但生成的代码归用户、可导出）
- **可视化编辑边界易踩坑**：只有「行内改文字」每天 100 次内免费；**点选改样式、涂画标注都按 credit 计**（别误以为可视化编辑全免费）
- **credit 烧得快**：复杂消息单条最高约 2 credit，免费档每月仅 30 credit，大型迭代很快见底
- **默认域名无法移除**：`*.lovable.app` 项目 URL 目前不可移除；自定义域名仅付费档
- **模型清单 / 定价 / 额度变动频繁**：一切金额与模型以官方页面实时为准
- **仍需懂安全**：工具兜底不等于免责，发布前开发者仍须核对 RLS 与密钥位置（密钥必须经 Edge Function，不能进前端代码）

## 文档地址

[Lovable Docs](https://docs.lovable.dev/)

## GitHub 地址

Lovable 平台本身为闭源 SaaS，无官方开源仓库（请勿引用第三方镜像）；详见 [Lovable Docs](https://docs.lovable.dev/)。不过 Lovable 支持把生成的代码**双向同步到用户自己的 GitHub / GitLab 仓库**，代码所有权归用户，可克隆到本地独立开发与部署。

## 幻灯片地址

<a href="/SlideStack/lovable-slide/" target="_blank">Lovable</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=lovable" target="_blank" rel="noopener noreferrer">Lovable 测试题</a>
