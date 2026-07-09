---
layout: doc
---

# Chrome DevTools

Chrome DevTools 是内置于 Google Chrome（及所有 Chromium 内核浏览器）的一套**官方 Web 开发者工具集**，直接通过 **CDP（Chrome DevTools Protocol）**与浏览器内核通信。它把 DOM/CSS 检查、JavaScript 断点调试、网络分析、运行时性能剖析、内存快照、存储与 PWA 管理、设备模拟、Lighthouse 审计等能力集成在一块面板里，是前端开发与性能优化的「主操作台」。2026 年最大的演进是深度集成 **Gemini 3 的 AI assistance**（解释样式、剖析性能、CSS 代码补全）与面向 AI 编码代理的 **chrome-devtools-mcp**，让 DevTools 从「人用的工具」延伸为「AI agent 可调用的浏览器后端」。作为市占率最高浏览器的内置工具，它是事实上的行业基准，绝大多数调试技巧与教程都以它为准。

## 评价

**优点**

- **功能最全、生态基准**：面板覆盖调试全链路，是其他浏览器 DevTools 对标的标准
- **性能剖析强**：Performance 面板火焰图 + Core Web Vitals + Performance Insights 业界领先
- **AI 深度集成（2026）**：Gemini 3 驱动的 AI assistance、CSS 代码补全、性能洞察自然语言问答
- **Lighthouse 内置**：性能 / SEO / 可访问性 / PWA 审计开箱即用
- **面向 AI agent**：chrome-devtools-mcp 让编码代理可驱动真实浏览器调试
- **跨 Chromium 通用**：Edge / Brave / Opera 等共享同一套工具与协议

**缺点**

- **偏 Chromium 视角**：CSS Grid / Flexbox 可视化、可访问性树不如 Firefox 细致
- **性能开销**：录制 Performance / 堆快照对大页面有明显内存与 CPU 占用
- **AI 功能需联网与账号**：AI assistance 依赖 Google 账号与网络，离线不可用
- **信息密度高**：面板与配置极多，新手上手曲线偏陡

## 文档地址

[Chrome DevTools 文档](https://developer.chrome.com/docs/devtools)

## GitHub地址

[devtools-frontend](https://github.com/ChromeDevTools/devtools-frontend)

## 幻灯片地址

<a href="/SlideStack/chrome-devtools-slide/" target="_blank">Chrome DevTools</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=chrome-devtools" target="_blank" rel="noopener noreferrer">Chrome DevTools 测试题</a>
