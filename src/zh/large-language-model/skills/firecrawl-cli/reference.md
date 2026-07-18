---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 firecrawl/firecrawl-claude-plugin README 与 skills/ 编写。

## 速查

- **装 plugin**：Claude Code 里 `/plugin` 搜 `firecrawl`
- **装 CLI**：`npm install -g firecrawl-cli`
- **认证**：`firecrawl login --browser` / `firecrawl login --api-key "fc-..."` / `export FIRECRAWL_API_KEY=fc-...`
- **验证**：`firecrawl --status`（看 Concurrency、Credits）
- **10 skill**：cli / search / scrape / map / crawl / agent / parse / download / interact / monitor
- **许可**：AGPL-3.0
- **关键源**：`firecrawl/firecrawl-claude-plugin`（plugin/skill） · `firecrawl/cli`（CLI 二进制） · `firecrawl/firecrawl`（服务端）

## 10 Skill 清单

| Skill | 命令 | 一句话 | 关键选项 |
| --- | --- | --- | --- |
| `firecrawl-cli` | 多 | 总入口、工作流编排、信用管理 | `firecrawl --status` / `credit-usage` |
| `firecrawl-search` | `firecrawl search` | Web 搜索，可选抓全文 | `--limit` `--sources web,news,images` `--categories github,research,pdf` `--tbs qdr:d` `--scrape` `--json` |
| `firecrawl-scrape` | `firecrawl scrape` | 取单 URL 内容（含 JS） | `-f markdown,links,screenshot,html,json` `-Q` `--only-main-content` `--wait-for` `--include-tags/--exclude-tags` `--redact-pii` |
| `firecrawl-map` | `firecrawl map` | 站内 URL 发现 | `--limit` `--search` `--sitemap include\|skip\|only` `--include-subdomains` `--json` |
| `firecrawl-crawl` | `firecrawl crawl` | 批量爬站段 | `--wait` `--progress` `--limit` `--max-depth` `--include-paths` `--exclude-paths` `--delay` `--max-concurrency` |
| `firecrawl-agent` | `firecrawl agent` | AI 抽 JSON（2–5 分钟） | `--urls` `--model spark-1-mini\|spark-1-pro` `--schema` `--schema-file` `--max-credits` `--wait` |
| `firecrawl-parse` | `firecrawl parse` | 本地文件转 markdown | `-S` `-Q` `-f markdown\|html\|summary` `--timeout` `--timing` |
| `firecrawl-download` | `firecrawl download` | 整站存本地（实验） | `--screenshot` `--format` `--limit` `--include-paths` `--exclude-paths` `--only-main-content` `-y` |
| `firecrawl-interact` | `firecrawl interact` | 浏览器会话交互 | `--prompt` `--code` `--language bash\|python\|node` `--timeout` `--scrape-id` |
| `firecrawl-monitor` | `firecrawl monitor` | 定时巡检 + 告警 | `create\|list\|get\|update\|delete\|run\|checks\|check`；`--page` `--scrape-urls` `--crawl-url` `--queries` `--goal` `--schedule` `--cron` `--email` `--webhook-url` `--webhook-events` `--state` |

## CLI 命令一览

```bash
# 全局
firecrawl --status               # 看认证/并发/credits
firecrawl --help                 # 顶层帮助
firecrawl <command> --help       # 子命令帮助
firecrawl credit-usage           # 查信用余额
firecrawl login --browser        # OAuth 登录
firecrawl login --api-key "fc-..."  # API key 登录

# 10 大子命令
firecrawl search "<query>" [opts]
firecrawl scrape "<url>" [url...] [opts]
firecrawl map "<url>" [opts]
firecrawl crawl "<url>" [opts]
firecrawl agent "<prompt>" [opts]
firecrawl parse <file> [opts]
firecrawl download <url> [opts]
firecrawl interact --prompt "..." | --code "..."
firecrawl monitor <subcommand> [opts]
firecrawl feedback <endpoint> <jobId>      # 端点级反馈
firecrawl search-feedback <searchId>       # search 反馈（退 1 credit）
```

## 环境变量

| 变量 | 必需 | 说明 |
| --- | --- | --- |
| `FIRECRAWL_API_KEY` | 是（未 `firecrawl login` 时） | API key，可从 [firecrawl.dev/app/api-keys](https://firecrawl.dev/app/api-keys) 免费申请 |
| `FIRECRAWL_API_URL` | 否 | 自托管 API 端点 |
| `FIRECRAWL_NO_SEARCH_FEEDBACK` | 否 | 设 `1` 跳过所有 search 反馈调用 |
| `FIRECRAWL_NO_ENDPOINT_FEEDBACK` | 否 | 设 `1` 跳过所有端点反馈调用 |

## 输出落盘约定

```text
.firecrawl/
├── search-{query}.json           # search 结果
├── search-{query}-scraped.json   # search --scrape 结果
├── {site}-{path}.md              # scrape 单页
├── crawl.json                    # crawl 批量
├── pricing.json                  # agent 抽取
└── credits.json                  # credit-usage
```

- **总用 `-o`** 写入文件，避免上下文膨胀
- **加 `.firecrawl/` 到 `.gitignore`**
- **总给 URL 加引号**——shell 会解析 `?` 和 `&`
- 单格式输出原始内容；多格式（如 `markdown,links`）输出 JSON
- 大文件用 `wc -l` + `head -50` + `grep`/`jq` 增量读

## 安装命令（完整）

```bash
# 1. Claude Code Plugin
# 在 Claude Code 里运行 /plugin，搜 firecrawl，选装

# 2. CLI
npm install -g firecrawl-cli

# 3. 认证（任选）
firecrawl login --browser
firecrawl login --api-key "fc-YOUR-API-KEY"
export FIRECRAWL_API_KEY=fc-YOUR-API-KEY

# 4. 验证
firecrawl --status

# 5. 冒烟
mkdir -p .firecrawl
firecrawl scrape "https://firecrawl.dev" -o .firecrawl/install-check.md
```

## 目录结构

```text
firecrawl-claude-plugin/
├── README.md
├── commands/
│   └── skill-gen.md
└── skills/
    ├── firecrawl-cli/SKILL.md         # 总入口
    ├── firecrawl-search/SKILL.md      # Web 搜索
    ├── firecrawl-scrape/SKILL.md      # 单页抓取
    ├── firecrawl-map/SKILL.md         # URL 发现
    ├── firecrawl-crawl/SKILL.md       # 批量爬取
    ├── firecrawl-agent/SKILL.md       # AI 结构化抽取
    ├── firecrawl-parse/SKILL.md       # 本地文件解析
    ├── firecrawl-download/SKILL.md    # 整站下载
    ├── firecrawl-interact/SKILL.md    # 浏览器交互
    └── firecrawl-monitor/SKILL.md     # 变化监控
```

每个 skill：`SKILL.md`（frontmatter `name` / `description` / `allowed-tools`，agent 据此触发）。

## 工作流对照（cli SKILL.md）

| 需求 | 命令 | 何时 |
| --- | --- | --- |
| 找某主题的页面 | `search` | 没具体 URL |
| 取某 URL 内容 | `scrape` | 有 URL |
| 找站内子页 | `map` | 在大站点里定位 |
| 批量站段 | `crawl` | 要多页（如全部 /docs） |
| AI 结构化抽取 | `agent` | 复杂多页站点 |
| 页面交互 | `scrape` + `interact` | 需点击/表单/登录/翻页 |
| 整站存本地 | `download` | 离线参考 |
| 解析本地文件 | `parse` | PDF/DOCX/XLSX/HTML 在磁盘 |
| 监控变化 | `monitor` | 持续观察 |

## scrape vs crawl vs search vs map vs parse

| 命令 | 输入 | 输出 | 适用 |
| --- | --- | --- | --- |
| `search` | 查询词 | URL 列表 + 全文（可选） | 找资料源 |
| `scrape` | URL | 单页 markdown | 已知 URL |
| `map` | 站点根 URL | URL 列表 | 找站内子页 |
| `crawl` | 站点根 URL | 多页 markdown | 整段文档 |
| `parse` | **本地文件路径** | markdown | PDF/DOCX 在磁盘（不是 URL） |

## 资源链接

- Plugin 仓：[firecrawl/firecrawl-claude-plugin](https://github.com/firecrawl/firecrawl-claude-plugin)
- CLI 仓：[firecrawl/cli](https://github.com/firecrawl/cli)
- 服务端主体：[firecrawl/firecrawl](https://github.com/firecrawl/firecrawl)
- 文档：[docs.firecrawl.dev](https://docs.firecrawl.dev)
- API 参考：[docs.firecrawl.dev/api-reference](https://docs.firecrawl.dev/api-reference)
- 免费 API key：[firecrawl.dev/app/api-keys](https://firecrawl.dev/app/api-keys)
- Discord：[discord.gg/gSmWdAkdwd](https://discord.gg/gSmWdAkdwd)
- 相关叶：[Vercel Agent Skills](../vercel-agent-skills/) · [Antfu Skills](../antfu-skills/) · [Skills CLI 与 find-skills](../skills-cli-find-skills/)
