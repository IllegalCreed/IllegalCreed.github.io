---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Chrome 149 稳定版编写

## 速查

- 打开：`F12` / `Cmd+Opt+I` / `Ctrl+Shift+I`；命令菜单 `Cmd/Ctrl+Shift+P`
- 选元素 `Cmd/Ctrl+Shift+C`；设备模式 `Cmd/Ctrl+Shift+M`
- Console：`$0` 选中元素、`$()/$$()`、`copy()`、`monitorEvents()`
- 断点：行 / 条件 / Logpoint / DOM / XHR-fetch / Event / 异常
- 性能：Performance 录制 + Live metrics（LCP/CLS/INP）+ Insights
- 完整说明见 [入门](./getting-started.md) / [Elements 与样式](./guide-line/elements-styles.md) / [Console 与 Sources](./guide-line/console-sources.md) / [Network 与 Performance](./guide-line/network-performance.md) / [Memory 与 Application](./guide-line/memory-application.md) / [AI 与自动化](./guide-line/ai-assistance.md)

## 常用快捷键

| 操作 | Mac | Win/Linux |
| --- | --- | --- |
| 打开 / 关闭 DevTools | `Cmd+Opt+I` | `Ctrl+Shift+I` / `F12` |
| 直达 Console | `Cmd+Opt+J` | `Ctrl+Shift+J` |
| 选择元素 | `Cmd+Shift+C` | `Ctrl+Shift+C` |
| 命令菜单 | `Cmd+Shift+P` | `Ctrl+Shift+P` |
| 设备模式 | `Cmd+Shift+M` | `Ctrl+Shift+M` |
| 全局搜索源码 | `Cmd+Opt+F` | `Ctrl+Shift+F` |
| 打开文件 | `Cmd+P` | `Ctrl+P` |
| 开始 / 停止录制（Perf） | `Cmd+E` | `Ctrl+E` |
| 继续 / 跨过 / 步入 / 步出 | `F8` / `F10` / `F11` / `Shift+F11` | 同 |

## 面板速查

| 面板 | 一句话 |
| --- | --- |
| Elements | DOM 与 CSS 检查 / 编辑、盒模型、Grid/Flex、可访问性 |
| Console | 日志、运行 JS、Live Expression、工具函数 |
| Sources | 源码、断点调试、Snippets、Local Overrides |
| Network | 请求分析、限速、HAR、Initiator、Timing |
| Performance | 运行时性能录制、火焰图、Core Web Vitals |
| Memory | 堆快照、内存分配、Detached elements |
| Application | Storage / Cookie / Service Worker / PWA |
| Security | 证书、混合内容 |
| Lighthouse | 性能 / SEO / 可访问性 / PWA 综合审计 |
| Recorder | 录制用户流程、回放、导出脚本 |
| AI assistance | Gemini 3 解释样式 / 性能、CSS 补全 |

## Console 工具函数

| 函数 | 作用 |
| --- | --- |
| `$0`–`$4` | 最近选中元素 |
| `$(s)` / `$$(s)` | querySelector / querySelectorAll |
| `$x(p)` | XPath 查询 |
| `copy(o)` | 复制到剪贴板 |
| `getEventListeners(el)` | 列出事件监听器 |
| `monitorEvents(el, type)` | 监听并打印元素事件 |
| `monitor(fn)` | 函数调用时打印参数 |
| `queryObjects(Ctor)` | 列出构造器的所有实例 |
| `keys(o)` / `values(o)` | 对象键 / 值 |

## 断点类型

| 类型 | 设置位置 |
| --- | --- |
| 行 / 条件 / Logpoint | 点 / 右键 Sources 行号 |
| DOM 变动 | Elements 右键 → Break on |
| XHR / fetch | Sources 右栏 |
| Event Listener | Sources 右栏 |
| 抛异常（含捕获） | Sources 右栏 `⏸` |

## 内存泄漏排查流程

1. 操作前拍 Heap snapshot A
2. 反复执行可疑操作
3. 操作后拍 snapshot B → Comparison 对比 A
4. 看 Delta 持续增长的对象 → 展开 Retainers 定位引用链
5. DOM 泄漏直接用 Memory → Detached elements

## 官方资源

- 文档：[https://developer.chrome.com/docs/devtools](https://developer.chrome.com/docs/devtools)
- AI assistance：[https://developer.chrome.com/docs/devtools/ai-assistance](https://developer.chrome.com/docs/devtools/ai-assistance)
- chrome-devtools-mcp：[https://github.com/ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- What's New：[https://developer.chrome.com/blog (new-in-devtools)](https://developer.chrome.com/blog)
- GitHub：[https://github.com/ChromeDevTools/devtools-frontend](https://github.com/ChromeDevTools/devtools-frontend)
