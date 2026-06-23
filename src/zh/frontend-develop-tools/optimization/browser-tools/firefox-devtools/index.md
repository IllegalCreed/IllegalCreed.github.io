---
layout: doc
---

# Firefox Developer Tools

Firefox Developer Tools 是 Mozilla Firefox（Gecko 引擎）内置的一套 **Web 开发者工具**，与 Chrome DevTools 功能大体对齐（Inspector / Console / Debugger / Network / Performance / Memory / Storage），但在 **CSS 调试与可访问性**两大领域提供了业界公认最细致的可视化工具：**Grid Inspector** 与 **Flexbox Inspector** 被许多前端认为是最好的布局调试器，**Fonts Editor** 可精确拖拽可变字体轴值，**Shape Path Editor** 能可视化编辑 `clip-path` / `shape-outside`，**Compatibility** 面板直接标注 CSS 的跨浏览器兼容性，**Accessibility Inspector** 提供原生可访问性树、对比度评级与色觉障碍模拟。作为非 Chromium 的独立引擎（Gecko），它还是验证「跨引擎渲染差异」的重要一站。专业前端通常 Chrome + Firefox 双修：Chrome 强在性能与 AI，Firefox 强在 CSS 与 a11y。

## 评价

**优点**

- **CSS 布局调试最强**：Grid / Flexbox Inspector 可视化叠加业界最佳
- **独家 CSS 工具**：Fonts Editor（可变字体）、Shape Path Editor（`clip-path` 可视化）
- **Compatibility 面板**：直接标注 CSS 属性的跨浏览器支持情况
- **可访问性王牌**：Accessibility Inspector + 对比度评级 + **色觉障碍模拟**
- **Changes 面板**：追踪并导出在 DevTools 里改过的 CSS
- **独立引擎视角**：Gecko 非 Chromium，验证跨引擎渲染差异

**缺点**

- **性能剖析偏弱**：Profiler 不如 Chrome Performance 面板成熟
- **无内置 AI**：缺少 Chrome 的 Gemini AI assistance
- **市占率低**：多数教程/调试技巧以 Chrome 为准，社区资源相对少
- **框架专属调试**：React/Vue 等仍需装对应扩展（与 Chrome 一致）

## 文档地址

[Firefox DevTools 用户文档](https://firefox-source-docs.mozilla.org/devtools-user/)

## GitHub地址

[mozilla-firefox/firefox](https://github.com/mozilla-firefox/firefox)

## 幻灯片地址

<a href="/SlideStack/firefox-devtools-slide/" target="_blank">Firefox Developer Tools</a>
