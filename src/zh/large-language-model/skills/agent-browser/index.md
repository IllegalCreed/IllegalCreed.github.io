---
layout: doc
---

# Agent Browser

Agent Browser（`vercel-labs/agent-browser`）是 Vercel Labs 官方出品的浏览器自动化 CLI，**面向 AI 编码 agent** 设计。底层基于 **Chrome DevTools Protocol（CDP）**，用原生 Rust daemon 驱动 Chrome/Chromium——不依赖 Playwright 或 Puppeteer、不需要常驻 Node.js。它把 web 上的 navigate / snapshot / fill / click / extract / screenshot 等全谱系交互，封装成 agent 用得起来的 `@eN` ref + 命令式调用，跨 Claude Code、Cursor、Codex、OpenCode、Gemini CLI、Copilot、Windsurf、Goose 等主流 agent。一行 `npm i -g agent-browser` 装好，对话里说「open example.com」它就开始干活。

## 评价

**优点**

- **CDP 直驱、Rust daemon**：跳过 Node/Playwright 包裹层，命令冷启动快；daemon 跨命令复用，连续交互如同一个会话
- **snapshot + `@eN` ref 心智**：把页面元素编号成 `@e1 @e2 …`，agent 不用解析原始 HTML，单次快照约 200–400 tokens，最适合 LLM
- **自然语言 + 命令双轨**：`chat "<指令>"` 走 AI 翻译成命令链；也可直接 `open / click @e1 / fill @e2 "..."` 精确控制
- **多 skill 自适应**：主 skill（`agent-browser`）+ 域 skill（`core` / `electron` / `slack` / `dogfood` / `vercel-sandbox` / `agentcore`）覆盖桌面应用、Slack 自动化、QA、云浏览器等场景
- **真实浏览器栈**：原生 Chrome、可复用 Chrome profile、IndexedDB/service worker 都在；React DevTools 钩子、Web Vitals、video 录制一应俱全
- **可观测 + 可插拔**：4848 端口的本地 dashboard 实时看 viewport 和命令流；plugin 协议支持 credential / browser provider / launch mutator / 自定义命令
- **安全开关全 opt-in**：auth vault（凭据加密、LLM 看不见密码）、`--allowed-domains`（导航白名单 + WebRTC 收口）、`--content-boundaries`（输出隔离防注入）、`--max-output`、`--confirm-actions`

**缺点 / 边界**

- **平台驱动假设**：默认走 Chrome for Testing，移动端只能 iOS Simulator（需 macOS + Xcode + Appium），Android 无官方 provider
- **WebGPU 截图有上游限制**：headless Chrome 在 Windows/Linux 抓 WebGPU 画面会黑，需 `--headed` + 桌面/Xvfb
- **skill 是「发现桩」**：`.claude/skills/agent-browser/SKILL.md` 是 7 行的瘦桩，真正的指令要 `agent-browser skills get core` 在线拉取——离线环境得自己缓存
- **命令面巨大**：core / network / state / debug / tabs / react / mobile / all 八个 profile 几百条命令，新人需要先抓主循环（open → snapshot → click @eN）
- **不是无头浏览器产品本身**：它驱动 Chrome，不是替代 Puppeteer/Playwright 的库，主要服务 agent 工作流

## 适用场景

- agent 需要「真打开一个网页、看到东西、点按钮、抓数据、截图」——而非 HTTP fetch
- 跨 agent 工具链统一浏览器层（Claude Code / Cursor / Codex 共用一套 skill）
- 自动化 Electron 桌面应用（VS Code / Slack / Discord / Figma / Notion / Spotify）
- 把浏览器跑进 Vercel Sandbox microVM 或 AWS Bedrock AgentCore 云浏览器
- 做探索式测试 / dogfood / bug hunt / React 性能溯源（react tree + Web Vitals）

## 边界

- **不是浏览器引擎，是 agent 控制层**：底层仍是 Chrome（或 Lightpanda/Safari/iOS）
- **不替代 E2E 测试框架**：适合 agent 即兴驱动，Cypress/Playwright Test 仍是回归套件
- **桌面自动化 ≠ 通用 RPA**：Electron 走 CDP，原生应用（无 CDP 端点）不覆盖
- **凭据安全靠用户落实**：vault 加密但密钥本地、state 文件默认明文，需自行 `AGENT_BROWSER_ENCRYPTION_KEY`

## 官方文档

[agent-browser.dev](https://agent-browser.dev) ｜ [skills.sh · vercel-labs/agent-browser](https://skills.sh/vercel-labs/agent-browser) ｜ [Vercel Labs](https://vercel.com/labs)

## GitHub 地址

[vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser)（Apache-2.0）

## 内容地图

- [入门](./getting-started) —— 定位、安装、多 skill 总览、CDP 心智模型
- [指南](./guide-line) —— skills 体系、snapshot+ref 工作流、自然语言 `chat`、CDP 优势、反模式
- [参考](./reference) —— skill 清单、安装矩阵、命令分类、许可、链接

## 幻灯片地址

<a href="/SlideStack/agent-browser-slide/" target="_blank">Agent Browser</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=648" target="_blank" rel="noopener noreferrer">Agent Browser 测试题</a>

