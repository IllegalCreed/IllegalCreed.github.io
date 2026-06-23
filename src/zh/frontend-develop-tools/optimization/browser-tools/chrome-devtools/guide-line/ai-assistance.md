---
layout: doc
outline: [2, 3]
---

# AI 与自动化

> 基于 Chrome 149 稳定版编写

## 速查

- AI assistance：元素 / 网络 / 性能右键「Ask AI」，Gemini 3 自然语言解释与建议
- 能力：解释样式为何不生效、分析性能（接入 Lighthouse 数据）、CSS 代码补全
- Widget：AI 回答内嵌 Core Web Vitals / LCP 分解等卡片，可 Reveal 跳源
- 复制到编码代理：把 AI 对话作为 prompt 复制给 Claude / Codex 等
- chrome-devtools-mcp：让 AI 编码代理驱动**真实 Chrome** 做调试 / 性能 / 截图
- Recorder：录制用户流程 → 回放 / 测性能 / 导出 Puppeteer / Playwright 脚本
- 需登录 Google 账号且联网；企业策略可能禁用 AI 功能

## AI assistance（Gemini 3）

Chrome DevTools 内置的 AI 助手，2026 年最大看点。在 Elements / Network / Sources / Performance 面板右键选「Ask AI」，或直接在 AI assistance 面板对话：

- **解释样式**：选中元素问「为什么这个元素没有居中」，结合实际 CSS 给诊断
- **分析性能**：Chrome 149 起 AI 可访问 **Lighthouse 与性能洞察数据**，对整页做全局分析并给针对性建议
- **解释网络请求**：解读某请求为何慢 / 失败
- **内嵌 Widget**：回答里直接渲染 Core Web Vitals、LCP 元素、LCP 分解、Bottom-up 线程活动等卡片（而非纯文本），每个卡片有 **Reveal** 链接跳到 DevTools 对应来源
- **CSS 代码补全**：Styles 面板用 Gemini 补全复杂 CSS（渐变、阴影、网格）
- **复制到编码代理**：把整段 AI 对话作为提示词复制，喂给外部 AI 编码助手继续修

> AI assistance 基于 Gemini 3，需登录 Google 账号并联网；输出仅供参考，关键结论仍需人工核验。企业 / 受管设备可能被策略禁用。

## chrome-devtools-mcp：DevTools for Agents

`chrome-devtools-mcp` 是官方 **MCP（Model Context Protocol）服务器**，把 DevTools / CDP 能力暴露给 AI 编码代理（如 Claude Code、Codex、Gemini CLI）：

- 让 agent **驱动真实 Chrome**：导航、点击、填表、读取 DOM / 控制台 / 网络
- 做**性能录制**、截图、运行 Lighthouse，把结果回传给 agent 分析
- Chrome 149 配套的 MCP / CLI 已到 v1.1.1，支持自定义第三方工具、WebMCP 调试、自定义 HTTP 头仿真

```bash
# 作为 MCP server 提供给编码代理（示意）
npx chrome-devtools-mcp@latest
```

> 这是「浏览器调试」从人工操作走向 **AI agent 自动化**的关键基础设施：agent 不再只读代码，而能真正「打开页面看效果」。本仓库的内容生产即用类似的浏览器 MCP 做端到端验证。

## Recorder：录制与回放

**Recorder** 面板把一段用户操作录成可回放的流程：

- **录制**：开始后在页面正常操作，自动记录点击 / 输入 / 导航为步骤
- **回放**：一键重放，可调速；**Measure performance** 把回放与 Performance 录制结合
- **导出**：输出为 **Puppeteer / Puppeteer (Lighthouse) / Playwright Test / JSON** 脚本——把手动流程一键变自动化测试的起点
- **编辑**：可手改步骤、加断言 / 等待

> Recorder 是「探索性手动操作」与「自动化 E2E 脚本」之间的桥梁，适合快速沉淀回归用例。

## Lighthouse 面板（带过）

DevTools 内置 **Lighthouse** 面板可一键生成性能 / 可访问性 / 最佳实践 / SEO / PWA 评分报告。其深入用法（指标口径、CI 集成、与 Bundle 分析配合）归「前端优化 · 性能评估」章，本页只提示它的入口位置。

## 小结

Chrome DevTools 在 2026 年已从「人用的调试面板」演进为「人 + AI agent 共用的浏览器后端」：AI assistance 降低排错门槛，chrome-devtools-mcp 让自动化代理直接驱动浏览器，Recorder 把手动操作沉淀为脚本。掌握这三者，是把 DevTools 用到 2026 水准的关键。
