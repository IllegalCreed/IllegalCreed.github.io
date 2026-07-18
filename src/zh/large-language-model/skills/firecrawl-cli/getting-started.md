---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 firecrawl/firecrawl-claude-plugin 的 README 与 skills/ 编写（firecrawl cli v1.8+）。

## 速查

- **定位**：Firecrawl 官方 Claude Code Plugin——把 `firecrawl` CLI 装进 Claude Code / Codex / Gemini CLI，提供 live web data
- **源仓**：`firecrawl/firecrawl-claude-plugin`（**不是主仓 `firecrawl/firecrawl`**，也不是 `firecrawl/cli`，但两者强相关）
- **装 plugin**：Claude Code 里 `/plugin` 搜 `firecrawl`；CLI 全局装 `npm install -g firecrawl-cli`
- **登录**：`firecrawl login --browser` 或 `firecrawl login --api-key "fc-..."`，或 `export FIRECRAWL_API_KEY=fc-...`
- **验证**：`firecrawl --status` 看认证、并发额度（Concurrency 0/100）、剩余 Credits
- **10 skill**：`scrape` 取内容 · `crawl` 爬整站 · `search` 搜网 · `map` 发现 URL · `parse` 解析本地文件 · `agent` AI 抽 JSON · `cli` 总入口 · `download` 下载 · `interact` 交互 · `monitor` 监控
- **心智模型**：search → scrape → map → crawl → monitor → interact（递进升级，先用便宜的）
- **输出落盘**：默认 `-o .firecrawl/xxx.md`，加 `.firecrawl/` 到 `.gitignore`
- **许可**：AGPL-3.0

## 定位

Firecrawl CLI 是 Firecrawl 官方的命令行客户端，调度 Firecrawl 云的 live web data 能力。`firecrawl-claude-plugin` 是 Firecrawl 官方发布的 Claude Code Plugin——把 CLI 包装成 10 个 skill，AI agent 在对话里就能用自然语言触发。三个仓库的分工：

| 仓库 | 角色 |
| --- | --- |
| `firecrawl/firecrawl` | Firecrawl **服务端主体**（API server、worker、self-host 自托管用） |
| `firecrawl/cli` | Firecrawl **CLI 二进制源码**（`npm install -g firecrawl-cli`） |
| `firecrawl/firecrawl-claude-plugin` | **Claude Code Plugin 仓**（本叶的主角，含 10 个 skill 的 SKILL.md） |

跨 agent 可用：Claude Code、Codex、Gemini CLI 等支持 skills/plugin 生态的 agent 都能加载。

## 安装

### 1. 装 Plugin（Claude Code）

在 Claude Code 里运行：

```text
/plugin
```

搜索 `firecrawl` 并选择安装。装好后 10 个 skill 自动可用——agent 检测到匹配任务时触发。

### 2. 装 CLI（全局）

```bash
npm install -g firecrawl-cli
```

### 3. 认证

三种方式任选：

```bash
# 浏览器 OAuth 登录
firecrawl login --browser

# 直接用 API key（在 https://firecrawl.dev/app/api-keys 免费申请）
firecrawl login --api-key "fc-YOUR-API-KEY"

# 或把 key 放到环境变量（写进 ~/.zshrc 或 ~/.bashrc 持久化）
export FIRECRAWL_API_KEY=fc-YOUR-API-KEY
```

### 4. 验证

```bash
firecrawl --status
```

预期输出：

```text
🔥 firecrawl cli v1.8.0

● Authenticated via FIRECRAWL_API_KEY
Concurrency: 0/100 jobs (parallel scrape limit)
Credits: 500,000 remaining
```

- **Concurrency**：最大并行作业数（并行 scrape 上限）
- **Credits**：剩余 API 信用额度，每个操作消耗

> 免 API key 时仍可走 keyless free tier（限速）。agent 优先尝试认证账号，无 key 才降级。

### 5. 小冒烟测试

```bash
mkdir -p .firecrawl
firecrawl scrape "https://firecrawl.dev" -o .firecrawl/install-check.md
```

成功即说明 CLI、认证、网络通路、写盘全链路 OK。

## 10 个 Skill 总览

| Skill | 一句话 | 何时用 |
| --- | --- | --- |
| `firecrawl-cli` | CLI 总入口、工作流编排 | 选哪个 skill、信用管理、并行化 |
| `firecrawl-search` | Web 搜索（可一并抓全文） | 没具体 URL，先找页面 |
| `firecrawl-scrape` | 抓单个 URL 的 clean markdown | 有 URL，取内容（含 JS 渲染） |
| `firecrawl-map` | 发现站内全部 URL | 在大站点里找特定子页 |
| `firecrawl-crawl` | 批量爬整站或站段 | 需要很多页（如全部 `/docs/`） |
| `firecrawl-agent` | AI 自主抽取结构化 JSON | 复杂多页站点、给 schema |
| `firecrawl-parse` | 把本地文件转 markdown | PDF/DOCX/XLSX/HTML 在磁盘上（不是 URL） |
| `firecrawl-download` | 把整站存本地文件 | 离线参考、批量归档（实验特性，map + scrape 组合） |
| `firecrawl-interact` | 浏览器会话交互 | 需点击/填表/翻页/登录，scrape 失败时 |
| `firecrawl-monitor` | 监控页面变化并告警 | 持续观察价格/招聘/博客，cron 替代品 |

## 心智模型：scrape / crawl / search / map 怎么选

四个最易混的命令——记住「输入 + 输出 + 单价」三轴：

| 命令 | 输入 | 输出 | 单价 | 典型场景 |
| --- | --- | --- | --- | --- |
| `search` | 查询词 | URL 列表（可选全文） | 2 credits + scrape | 不知道有哪些页面 |
| `scrape` | 1 个 URL | 1 篇 markdown | ~1 credit | 已经知道 URL |
| `map` | 1 个站点根 URL | URL 列表 | 较低 | 找站内某个具体子页 |
| `crawl` | 1 个站点根 URL | 多篇 markdown | 按页计费 | 要整段文档（如全部 /docs） |

> 经验法则：**先 search / map 这种便宜的「找 URL」，再 scrape 单页，最后才 crawl 整站**。crawl 一发可能扣几千 credits，先 `firecrawl credit-usage`。

## 第一个工作流：研究一个新主题

```bash
# 1. 搜网找资料源
firecrawl search "react server components 2026" \
  --scrape --limit 3 \
  -o .firecrawl/rsc-research.json --json

# 2. 提取 URL 后增量读
jq -r '.data.web[].url' .firecrawl/rsc-research.json
grep -n "use server" .firecrawl/rsc-research.json
```

`--scrape` 在搜索时一并把结果页全文抓回来——**不要再对结果 URL 单独 scrape**（会重复扣费）。

## 下一步

- [指南](./guide-line) —— 10 skill 逐讲、live web data 工作流、反模式、信用管理
- [参考](./reference) —— 10 skill 选项全表、安装命令、CLI 命令、许可与链接
