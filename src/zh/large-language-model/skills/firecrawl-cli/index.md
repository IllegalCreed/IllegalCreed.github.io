---
layout: doc
---

# Firecrawl CLI

Firecrawl CLI 是 [Firecrawl](https://firecrawl.dev) 官方出品的命令行工具，把「live web data」——网页抓取、整站爬取、Web 搜索、站点地图发现、PDF/DOCX 解析、AI 结构化抽取、页面交互、变化监控——做成一组 `firecrawl <command>` 子命令，并在 [firecrawl/firecrawl-claude-plugin](https://github.com/firecrawl/firecrawl-claude-plugin) 仓库里被打包成 **Firecrawl 官方 Claude Code Plugin**：装上 plugin，Claude Code（以及 Codex、Gemini CLI 等兼容 skills 的 agent）就能直接通过自然语言触发 10 个 firecrawl skill，输出落盘到 `.firecrawl/` 目录、保持上下文窗口干净。注意 **plugin 源仓是 `firecrawl-claude-plugin`，不是 `firecrawl/firecrawl` 主仓**——后者是 Firecrawl 服务端主体，前者是面向 AI agent 的 plugin/skill 分发仓库。

## 评价

**优点**

- **官方 Claude Code Plugin**：Firecrawl 是 Claude Code 官方 plugin 生态成员，`/plugin install firecrawl` 即装即用，跨 Claude Code / Codex / Gemini CLI
- **live web data 全家桶**：scrape / crawl / search / map / parse / agent / interact / download / monitor / cli 一条龙，覆盖 URL 抓取到整站爬取到 Web 搜索到结构化 AI 抽取
- **10 skill 分工清晰**：每个 skill 一个 `SKILL.md`，触发词、何时用、何时不用、选项表都明确，避免越权触发（如 interact 不该做 web search）
- **输出落盘保上下文**：默认写 `.firecrawl/`，配合 `grep`/`head`/`jq` 增量读，几十万字页面也不撑爆 context window
- **LLM 友好输出**：默认输出 clean markdown（自动 JS 渲染、反爬、代理轮换），多格式时给 JSON
- **agent / monitor 高阶能力**：`firecrawl agent` 自主导航多页站点抽 JSON、`firecrawl monitor` 定时巡检并 webhook/email 告警
- **免登录降级可用**：没 API key 时 keyless free tier 仍可限速使用，避免硬阻塞

**缺点 / 边界**

- **信用额度制**：每个操作消耗 credits，scrape / search / agent 单价不同，大批量 crawl 前需 `firecrawl credit-usage` 评估
- **AGPL-3.0 许可**：plugin 本体 AGPL-3.0，企业引入需评估传染性条款
- **skill 边界靠 agent 判断**：10 skill 描述重叠度高（如 search vs map vs scrape），需读 SKILL.md description 才能精准匹配
- **interact 仅作最后手段**：交互式浏览器会话开销大，官方明确推荐「先 scrape，scrape 失败再 interact」
- **search-feedback 默认开启**：每次 search 后会自动发反馈（可退 1 credit），团队可用 `FIRECRAWL_NO_SEARCH_FEEDBACK=1` 静默
- **monitor 不支持零数据保留团队**：零数据保留（zero-data-retention）团队无法使用 monitor

## 适用场景

- 让 Claude Code / Codex / Gemini CLI 在对话里搜网、抓页、爬文档站、做深度研究
- 已知 URL 抓内容（scrape）、未知 URL 先搜再抓（search + scrape）、整站批量提取（crawl）
- 在大站点里找特定子页（map --search）、把整站存本地离线参考（download）
- 把本地 PDF/DOCX/XLSX 转 clean markdown（parse）
- AI 结构化抽取多页站点数据为 JSON（agent + schema）
- 监控价格页 / 招聘页 / 博客 / 状态页变化并告警（monitor）

## 边界

- **Firecrawl CLI 是客户端工具**：核心抓取/搜索发生在 Firecrawl 云（也可自托管 `FIRECRAWL_API_URL`），CLI 负责调度与落盘
- **plugin 仓 ≠ 主仓**：plugin 源在 `firecrawl/firecrawl-claude-plugin`；Firecrawl 服务端主体在 `firecrawl/firecrawl`；CLI 二进制在 `firecrawl/cli`
- **10 skill 各有触发词**：不在 description 命中范围内（本地文件、git、部署、代码编辑）不会触发
- **不替代 WebFetch**：WebFetch 是 LLM 内建简单抓取；Firecrawl 处理 JS 渲染、反爬、批量、结构化，能力更强但消耗 credits
- **不替代专用数据库/索引**：Firecrawl 是「live」web data，结果随源站变化

## 官方文档

[Firecrawl 文档](https://docs.firecrawl.dev) ｜ [API 参考](https://docs.firecrawl.dev/api-reference) ｜ [Firecrawl CLI 仓库](https://github.com/firecrawl/cli) ｜ [Claude Plugin 仓库](https://github.com/firecrawl/firecrawl-claude-plugin)

## GitHub 地址

[firecrawl/firecrawl-claude-plugin](https://github.com/firecrawl/firecrawl-claude-plugin)（AGPL-3.0）｜ [firecrawl/cli](https://github.com/firecrawl/cli)

## 内容地图

- [入门](./getting-started) —— 定位（官方 Claude Code plugin / live web data / 源仓 firecrawl-claude-plugin）、安装（plugin + 全局 CLI + 登录）、10 skill 总览、scrape / crawl / search / map 心智模型
- [指南](./guide-line) —— 10 skill 逐讲、live web data 工作流（search → scrape → map → crawl → monitor → interact）、反模式与信用管理
- [参考](./reference) —— 10 skill 清单 + 选项、安装命令、CLI 命令表、许可、资源链接

## 幻灯片地址

<a href="/SlideStack/firecrawl-cli-slide/" target="_blank">Firecrawl CLI</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=651" target="_blank" rel="noopener noreferrer">Firecrawl CLI 测试题</a>

