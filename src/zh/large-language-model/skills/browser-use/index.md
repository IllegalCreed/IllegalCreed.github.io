---
layout: doc
---

# Browser Use

Browser Use（`browser-use/browser-use`）是官方 Python AI agent 浏览器自动化库，MIT 开源，GitHub ★105k。它让 LLM agent 像人一样自主操作浏览器——打开页面、点击按钮、填写表单、抓取数据，完成开放式 web 任务。你用自然语言描述任务（「帮我把简历投到这个招聘网站」「比较这三款笔记本并给我价格表」），它把任务拆解成浏览器动作并执行。已是 agent 浏览器自动化事实标准之一，在 [Odysseys](https://odysseysbench.com/leaderboard) 200 长程 web 任务基准上以 87.4% 平均分排名第一，领先 OpenAI/Anthropic/Google/Microsoft 的 computer-use agent。

## 评价

**优点**

- **官方 Python、生态完备**：`uv add browser-use` 一行装好，`Agent(task=..., llm=...)` 即跑；配套 6 个 skills（核心/cloud/open-source/qa/remote-browser/x402）覆盖从本地 CLI 到云端托管、QA 测试、远程浏览器、x402 加密付费
- **LLM 驱动、模型自由**：可接 ChatBrowserUse（官方优化模型）、OpenAI/Anthropic/Google，或本地 Ollama；`ChatBrowserUse('openai/gpt-5.5')` 单 key 即可走多家
- **开放式任务、非脚本**：不是固定 DSL/选择器脚本——agent 看页面、推理下一步、执行；页面改版不破
- **云 vs 开源双形态**：开源版（免费、本机、深度可控）；云版（更强 agent、代理轮换、自动过验证码、1000+ 集成、持久文件系统与记忆）
- **事实标准**：★105k + Odysseys #1，agent 浏览器层的默认选择之一

**缺点 / 边界**

- **依赖 LLM 成本与速度**：每步都要 LLM 推理；任务长则 token/费用累加，需要选对模型
- **本地 Chrome 调试麻烦**：本地模式要走 `chrome://inspect/#remote-debugging`、CDP，首次连接要人点「Allow」
- **生产扩展需要云**：并发多 agent 跑本地 Chrome 会争焦点/标签，要做规模化得上 Browser Use Cloud
- **CAPTCHA 与登录墙**：开源版不自动过验证码、遇登录要停下问人；这类场景要靠云的 stealth 浏览器
- **不是 Playwright 替代**：它是 LLM agent 层，做不了精确的固定脚本自动化（那是 Playwright/Puppeteer 的活）

## 适用场景

- 一次性 web 任务交给 agent 做（上传视频到 YouTube、对比商品、填招聘表）
- 可重复的代码化自动化（爬虫、监控、QA、把 agent 嵌进自己产品）
- 多 agent 并发、需要 stealth 与代理轮换（用 Cloud）
- 用 LLM 给本地 /localhost 做端到端 QA（`qa` skill 给 1–5 评分）

## 边界

- **LLM agent 层，非脚本库**：做开放任务，不适合固定选择器脚本
- **登录墙**：开源版默认停下问人；用云 stealth 浏览器或登录态 profile 解决
- **生产规模化**：本地 Chrome 单实例，扩展要云
- **成本敏感**：每步 LLM 推理，选模型要看性价比（官方推荐 `bu-*` 最快最省最准）

## 官方文档

[Browser Use 文档（开源）](https://docs.browser-use.com/open-source/introduction) ｜ [Cloud 文档](https://docs.cloud.browser-use.com) ｜ [Benchmark（100 真实任务）](https://github.com/browser-use/benchmark) ｜ [Odysseys 排行](https://odysseysbench.com/leaderboard)

## GitHub 地址

[browser-use/browser-use](https://github.com/browser-use/browser-use)（MIT）

## 内容地图

- [入门](./getting-started) —— 安装、6 个 skills 总览、CLI vs Python 库、Agent 心智
- [指南](./guide-line) —— 6 个 skills 深入、LLM 驱动浏览器、反模式与边界
- [参考](./reference) —— skills 清单、安装、许可、关键链接

## 幻灯片地址

<a href="/SlideStack/browser-use-slide/" target="_blank">Browser Use</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=650" target="_blank" rel="noopener noreferrer">Browser Use 测试题</a>

