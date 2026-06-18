---
layout: doc
---

# bolt.new

由 **StackBlitz** 出品的 AI 全栈应用生成器：用自然语言对话（chat 式 vibe coding）把想法直接变成可运行、可一键部署的网站 / Web 应用 / 移动应用。它建在 **WebContainers**（StackBlitz 发明、能在浏览器内原生跑 Node.js 的技术）之上，因此预览是浏览器里的真实运行环境而非静态渲染框；AI agent 直接掌控文件系统、包管理器、终端与浏览器 console。默认走 Claude 系模型并由平台自动路由，受众明确覆盖大量非编码者（产品、创业者、市场、设计、学生）。其开源版本是 MIT 许可、可换模型、可自托管的 **bolt.diy**。

## 评价

**优点**

- **浏览器内"真环境"**：基于 WebContainers，可 `npm install`、跑 Node server、开终端，无需本地搭环境
- **prompt → 全栈 app**：聊天即生成，支持 diff、回滚、可视化版本历史（Version History）
- **Bolt Cloud 一体化**：托管 + 自定义域名 + Supabase 驱动的后端（数据库 / 鉴权 / 存储 / Edge Functions），把 demo 直接推到生产
- **多框架自由**：React / Next / Vue / Svelte / Astro 等不挑框架，还能经 Expo 出移动端
- **导入能力强**：可从 Figma / GitHub / Google Stitch 导入，企业可带入自有设计系统
- **MCP 支持**：可连接 MCP server 扩展能力
- **有开源版**：bolt.diy（MIT）可自托管、可换 19+ 模型

**缺点**

- **token 烧得快**：消耗主要来自"同步整个项目文件"，项目越大每条消息越贵，Free 每日额度容易触顶
- **后端选型有坑**：Supabase 集成目前仅支持 Vite、不支持 Next.js；从 Bolt Database 切到 Supabase 后期需额外步骤
- **不是传统 IDE**：浏览器内环境不等于本地 VS Code，复杂逻辑 / 大重构仍需懂代码并人审
- **计费常变**：token 套餐 / 额度时常调整，金额需以官方 pricing 为准
- **后端较新**：Bolt Cloud 后端 2025 下半年才 GA，最佳实践仍在沉淀

## 文档地址

[bolt.new](https://bolt.new/)

## GitHub 地址

[stackblitz/bolt.new](https://github.com/stackblitz/bolt.new)（商业版主仓）/ [bolt.diy](https://github.com/stackblitz-labs/bolt.diy)（MIT 开源版）

## 幻灯片地址

<a href="/SlideStack/bolt-new-slide/" target="_blank">bolt.new</a>
