---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 firecrawl/firecrawl-claude-plugin 的 README 与 skills/ 编写。

## 速查

- **CLI 工作流递进**：search → scrape → map → crawl → monitor → interact（先用便宜的）
- **scrape**：取单 URL 内容（含 JS 渲染 SPA），`--only-main-content` 去导航栏
- **crawl**：批量爬站段，`--include-paths /docs` 限定范围，**总加 `--wait`**
- **search**：Web 搜索，`--scrape` 一并抓全文（**别再二次 scrape 结果 URL**）
- **map**：发现站内 URL，`map --search` 找特定子页 → scrape 那个 URL
- **parse**：**本地文件**（PDF/DOCX/XLSX）转 markdown，**不是 URL**（URL 用 scrape）
- **agent**：AI 自主导航多页站点抽结构化 JSON，耗时 2–5 分钟，`--max-credits` 设上限
- **interact**：仅当 scrape 失败时用——浏览器会话点击/填表/翻页/登录
- **monitor**：定时巡检 + webhook/email 告警，**别再做重复 scrape**
- **download**：整站存本地（实验特性，map + scrape 组合）
- **信用**：scrape ~1 / search 2 / agent 多；`firecrawl credit-usage` 看余额

## firecrawl-cli：总入口与工作流编排

CLI skill 不是具体抓取，而是**编排决策**——告诉 agent 在 10 个 skill 里怎么选。其核心是一张「需求 → 命令」对照表，源自 SKILL.md：

| 需求 | 命令 |
| --- | --- |
| 找某主题的页面 | `search`（没具体 URL） |
| 取某 URL 内容 | `scrape`（有 URL） |
| 找站内子页 | `map` |
| 批量站段 | `crawl` |
| AI 结构化抽取 | `agent` |
| 与页面交互 | `scrape` + `interact` |
| 整站存本地 | `download` |
| 解析本地文件 | `parse` |
| 监控变化 | `monitor` |

编排原则：**先用便宜命令试**——search/map 找 URL、scrape 单页、再 crawl 整站、最后才 interact（浏览器开销大）。

## firecrawl-scrape：取单页内容

最常用的 skill。给一个 URL，返回 clean markdown。自动处理 JS 渲染、反爬、代理轮换。

```bash
# 基础抓取
firecrawl scrape "https://example.com/page" -o .firecrawl/page.md

# 只取主体内容（去 nav/footer/sidebar）
firecrawl scrape "<url>" --only-main-content -o .firecrawl/page.md

# 等 JS 渲染
firecrawl scrape "<url>" --wait-for 3000 -o .firecrawl/page.md

# 多 URL 并发（每个写 .firecrawl/）
firecrawl scrape https://a.com https://b.com https://c.com

# markdown + 链接一起出（多格式时输出 JSON）
firecrawl scrape "<url>" --format markdown,links -o .firecrawl/page.json

# 提一个具体问题（+5 credits）
firecrawl scrape "https://example.com/pricing" --query "What is the enterprise plan price?"
```

**选项要点**：`-f/--format`（markdown/html/rawHtml/links/screenshot/json）、`-Q/--query`（5 credits）、`--only-main-content`（去外壳）、`--wait-for <ms>`、`--include-tags/--exclude-tags`、`--redact-pii`。

> **优先普通 scrape，慎用 `--query`**。抓到文件后用 `grep`/`head` 自己读，比每次都 `--query` 省钱。

## firecrawl-crawl：批量爬站段

`crawl` 跟随链接爬多页，受深度/数量约束。**总加 `--wait`** 否则只返回 job ID（异步轮询）。

```bash
# 爬文档段
firecrawl crawl "<url>" --include-paths /docs --limit 50 --wait \
  -o .firecrawl/crawl.json

# 全站爬，限深度
firecrawl crawl "<url>" --max-depth 3 --wait --progress \
  -o .firecrawl/crawl.json

# 查异步任务状态
firecrawl crawl <job-id>
```

**关键选项**：`--wait`（同步等结果）、`--progress`、`--limit`、`--max-depth`、`--include-paths`（限定路径，**强烈推荐**避免爬全站）、`--exclude-paths`、`--delay`、`--max-concurrency`。

> crawl 按页扣费，跑前 `firecrawl credit-usage` 看余额。

## firecrawl-search：Web 搜索

Web 搜索，可一并抓全文。第一步搜索时首选。

```bash
# 基础搜索
firecrawl search "react hooks best practices" -o .firecrawl/result.json --json

# 搜并抓全文（别再二次 scrape 结果 URL）
firecrawl search "react hooks" --scrape -o .firecrawl/scraped.json --json

# 搜最近一天新闻
firecrawl search "AI agent framework" --sources news --tbs qdr:d \
  -o .firecrawl/news.json --json
```

**选项**：`--limit`、`--sources <web,images,news>`、`--categories <github,research,pdf>`、`--tbs <qdr:h|d|w|m|y>`（时间过滤）、`--location`、`--country`、`--scrape`、`--scrape-formats`。

**search-feedback 机制**：search 2 credits/call，**用完结果**后调 `firecrawl search-feedback <id>` 可退 1 credit（每日上限 100），首个 `--missing-content` 字段最有价值。`FIRECRAWL_NO_SEARCH_FEEDBACK=1` 静默。

## firecrawl-map：站内 URL 发现

`map` 列出站点所有 URL；`map --search` 在大站点里按关键词找子页。

```bash
# 找特定子页（推荐心智）
firecrawl map "<url>" --search "authentication" -o .firecrawl/filtered.txt

# 列全部 URL
firecrawl map "<url>" --limit 500 --json -o .firecrawl/urls.json
```

**经典模式**：`map --search "auth"` 找到 `/docs/api/authentication` → `scrape` 那个 URL。这比 crawl 整站便宜得多。

**选项**：`--limit`、`--search`、`--sitemap <include|skip|only>`、`--include-subdomains`、`--json`。

## firecrawl-parse：本地文件解析

**只处理本地文件路径**（不是 URL）。支持 PDF / DOCX / DOC / ODT / RTF / XLSX / XLS / HTML/HTM/XHTML。

```bash
# 文件转 markdown
firecrawl parse ./paper.pdf -o .firecrawl/paper.md

# AI 摘要
firecrawl parse ./paper.pdf -S -o .firecrawl/paper-summary.md

# 提问
firecrawl parse ./paper.pdf -Q "What are the main conclusions?" \
  -o .firecrawl/paper-qa.md
```

**要点**：**总加 `-o`**（解析结果可能几百 KB，撑爆上下文）；路径有空格要引号；单文件 50 MB 上限；PDF 约 1 credit/页，HTML 1 credit 扁平。

## firecrawl-agent：AI 结构化抽取

`agent` 自主导航多页站点，按 schema 抽 JSON。耗时 2–5 分钟。

```bash
# 抽取定价档
firecrawl agent "extract all pricing tiers" --wait \
  -o .firecrawl/pricing.json

# 给 JSON schema
firecrawl agent "extract products" \
  --schema '{"type":"object","properties":{"name":{"type":"string"},"price":{"type":"number"}}}' \
  --wait -o .firecrawl/products.json

# 限定起始页
firecrawl agent "get feature list" --urls "<url>" --wait \
  -o .firecrawl/features.json
```

**关键选项**：`--urls`（起始 URL）、`--model <spark-1-mini|spark-1-pro>`、`--schema`/`--schema-file`、`--max-credits`（**必设上限**）、`--wait`。

> 单页结构化优先 `scrape`；agent 比 scrape 贵且慢，专为多页复杂站点设计。

## firecrawl-interact：浏览器会话交互

仅当 scrape 失败时使用——内容藏在交互后（点击、表单、登录、翻页、无限滚动）。

```bash
# 1. 先 scrape（scrape ID 自动保存）
firecrawl scrape "<url>"

# 2. 自然语言驱动
firecrawl interact --prompt "Click the login button"
firecrawl interact --prompt "Fill the email field with test@example.com"

# 3. 或代码精确控制
firecrawl interact --code "agent-browser click @e5" --language bash

# 4. 用完关掉会话
firecrawl interact stop
```

**选项**：`--prompt`、`--code`、`--language <bash|python|node>`、`--timeout`（默认 30，上限 300 秒）、`--scrape-id`。

> **interact 不是 web search 的替代**——找资料用 `search`；interact 专做页内交互。

## firecrawl-download：整站存本地

**实验特性**：map + scrape 组合，把整站存成嵌套目录。**总加 `-y`** 跳过确认。

```bash
# 交互向导
firecrawl download https://docs.example.com

# 带截图 + 限页数
firecrawl download https://docs.example.com --screenshot --limit 20 -y

# 多格式（每页多个文件：index.md + links.txt + screenshot.png）
firecrawl download https://docs.example.com \
  --format markdown,links --screenshot --limit 20 -y

# 过滤路径
firecrawl download https://docs.example.com --include-paths "/features,/sdks" -y
firecrawl download https://docs.example.com --exclude-paths "/zh,/ja,/fr" -y
```

## firecrawl-monitor：变化监控

定时巡检页面变化，AI judge 过滤噪声，webhook/email 告警。**替代 cron + scrape + diff 脚本**。

```bash
# 单页监控
firecrawl monitor create --name "Blog" \
  --schedule "every 5 minutes" \
  --goal "Alert when a new blog post is published." \
  --page https://example.com/blog \
  --email alerts@example.com

# 多页监控
firecrawl monitor create --name "Product pages" \
  --schedule "every 5 minutes" \
  --goal "Alert when pricing, docs, or changelog content changes." \
  --scrape-urls https://example.com/pricing,https://example.com/docs

# webhook 通知
firecrawl monitor create --name "Docs webhook" \
  --schedule "every 5 minutes" \
  --goal "Alert when docs content changes." \
  --page https://example.com/docs \
  --webhook-url https://example.com/webhook \
  --webhook-events monitor.page,monitor.check.completed
```

**子命令**：`create | list | get | update | delete | run | checks | check`。

**核心概念**：

- **目标类型**：`--page`（单页）/ `--scrape-urls a,b,c`（多页）/ `--crawl-url`（整站）/ `--queries`+`--goal`（web 搜索监控）
- **状态码**：每页标 `same`/`new`/`changed`/`removed`/`error`
- **JSON 模式**：在 `scrapeOptions.formats` 加 `changeTracking` + JSON schema，得到字段级 diff（如 `plans[0].price: "$19/mo" → "$24/mo"`），直接接到 Slack/CI
- **`--goal` 写法**：以 `Alert when ...` 开头，明确范围（top N / 价格 / 角色类型 / 主题），不要瞎加排除项（judge 已默认过滤 whitespace/格式/会话 ID/cache buster）

**坑**：

- `--state`（不是 `--status`）设 active/paused
- `--page-status`（不是 `--status`）过滤 check 结果——避开与全局 `--status` 冲突
- 最小间隔 5 分钟
- 零数据保留团队不可用

## live web data 工作流：递进升级

官方 SKILL.md 的核心心智模型，是「先用便宜的命令试， escalate 到贵的」：

```text
1. search       ── 没具体 URL，先搜
2. scrape       ── 有 URL，直接抓
3. map + scrape ── 站太大，先 map --search 找子页再 scrape
4. crawl        ── 需要站段（全部 /docs/）
5. monitor      ── 需要持续观察（替代重复 scrape）
6. interact     ── scrape 失败、需点击/登录/翻页
```

> 这条递进链是**省钱核心**——search/map 是 URL 发现，单次便宜；scrape 取 1 页内容；crawl/interact 才是大头。盲目从 crawl 开始可能浪费大量 credits。

## 反模式：哪些不要做

- **二次 scrape search 结果**：`search --scrape` 已抓全文，别再 scrape 那些 URL
- **interact 做 web search**：官方明确禁止——用 `search`
- **不写 `-o`**：默认打到 stdout 会撑爆上下文，**总用 `-o .firecrawl/xxx.md`**
- **URL 不加引号**：shell 会把 `?` 和 `&` 当特殊字符，**总用引号** `"https://...?a=1&b=2"`
- **一次读整个输出文件**：用 `wc -l` + `head -50` + `grep` 增量读，别 `cat`
- **重复 scrape 同一页**：先查 `.firecrawl/` 是否已有数据
- **crawl 不设 `--include-paths`**：会爬整站，credits 黑洞
- **crawl 不加 `--wait`**：返回 job ID 异步轮询，需立即用结果时漏读
- **每次都 `--query` scrape**：贵 5 credits，先抓文件再 `grep` 自己读
- **goal 里塞业务规则**：除非用户明说，否则不臆造阈值/排除项
- **零数据保留团队用 monitor**：不支持
- **agent 不设 `--max-credits`**：可能跑飞

## 信用管理

```bash
# 看余额
firecrawl credit-usage
firecrawl credit-usage --json --pretty -o .firecrawl/credits.json
```

**单价参考**：

- `scrape`：约 1 credit/页（`--query` 额外 +5）
- `search`：2 credits/call（用完发 feedback 退 1）
- `crawl`：按页计费，跟 `--limit` 强相关
- `parse`：PDF 约 1 credit/页，HTML 1 credit 扁平
- `agent`：最贵，按导航页数计，**总设 `--max-credits`**
- `monitor`：按 check 计费

**并行化**：`firecrawl --status` 看 Concurrency 上限（如 0/100），用 `&` + `wait` 并发跑 scrape。

## 与相邻叶的边界

- **`firecrawl-build` skills**：把 Firecrawl **集成进应用**（加 `FIRECRAWL_API_KEY`、调 REST 端点）用 build skills，**不**用 CLI skill
- **`firecrawl-workflows` skills**：产出 Firecrawl 驱动的交付物（研究简报、SEO 审计、QA 报告、lead list、知识库）用 workflows skills，CLI skill 是底层工具
- **WebFetch（LLM 内建）**：简单抓取用 WebFetch，复杂（JS 渲染、反爬、批量、结构化）用 Firecrawl

## 下一步

- [参考](./reference) —— 10 skill 选项全表、安装命令、CLI 命令、许可与链接
- 上游：[Firecrawl 文档](https://docs.firecrawl.dev) ｜ [firecrawl/firecrawl-claude-plugin](https://github.com/firecrawl/firecrawl-claude-plugin)
