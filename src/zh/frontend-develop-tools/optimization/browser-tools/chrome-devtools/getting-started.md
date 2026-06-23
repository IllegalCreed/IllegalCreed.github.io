---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Chrome 149 稳定版编写

## 速查

- 打开：`F12` / `Cmd+Opt+I`(Mac) / `Ctrl+Shift+I`(Win/Linux) / 右键「检查」
- 命令菜单：`Cmd/Ctrl+Shift+P`（运行任意命令、切换面板、改设置——最强入口）
- 选元素：`Cmd/Ctrl+Shift+C`（点选页面元素直接定位到 Elements）
- 设备模式：`Cmd/Ctrl+Shift+M`（响应式 / 移动端模拟）
- 核心面板：Elements｜Console｜Sources｜Network｜Performance｜Memory｜Application
- Console 变量：`$0`=当前选中元素，`$()`=querySelector，`$$()`=querySelectorAll
- AI assistance：元素右键「Ask AI」或面板内对话（Gemini 3，需登录）
- 停靠：右上 `⋮` → Dock side（右 / 下 / 左 / 独立窗口）

## 打开 DevTools

| 方式 | 快捷键 / 操作 |
| --- | --- |
| 打开 / 关闭 | `F12`，或 `Cmd+Opt+I`(Mac) / `Ctrl+Shift+I`(Win/Linux) |
| 检查某元素 | 页面元素右键 →「检查」，或 `Cmd/Ctrl+Shift+C` 后点选 |
| 直达 Console | `Cmd+Opt+J`(Mac) / `Ctrl+Shift+J`(Win/Linux) |
| 命令菜单 | `Cmd/Ctrl+Shift+P` |

> 命令菜单（Command Menu）是 DevTools 的「万能入口」：输入命令名可运行任意操作（如截图整页、切换主题、显示渲染信息），输入 `>` 后接面板名可快速跳转。新手记住这一个快捷键即可。

## 界面布局与停靠

DevTools 顶部是**面板标签栏**，右上角 `⋮` 菜单可调整停靠位置（Dock side）：停靠到右 / 下 / 左，或拆成独立窗口（适合双屏）。底部抽屉（Drawer，`Esc` 切换）可在任意面板下叠加 Console、Rendering、Animations、Coverage、Sensors 等辅助工具。

## 命令菜单（最重要的入口）

```text
Cmd/Ctrl + Shift + P
> Capture full size screenshot   # 整页截图
> Show Rendering                 # 打开渲染调试（重绘高亮、FPS、CSS 媒体仿真）
> Show Coverage                  # 代码覆盖率（找未使用的 CSS/JS）
> Disable JavaScript             # 临时禁用 JS
```

清空输入框后直接输入文件名可跳转源码，输入 `:行号` 可跳到指定行，输入 `?` 查看所有可用前缀。

## 面板总览

| 面板 | 用途 | 深入 |
| --- | --- | --- |
| **Elements** | 检查 / 编辑 DOM 与 CSS、盒模型、Grid/Flex、可访问性 | [Elements 与样式](./guide-line/elements-styles.md) |
| **Console** | 日志、运行 JS、Live Expression、实用工具函数 | [Console 与 Sources](./guide-line/console-sources.md) |
| **Sources** | 源码、断点调试、Snippets、本地覆盖 | [Console 与 Sources](./guide-line/console-sources.md) |
| **Network** | 请求列表、限速、HAR、时序与发起者 | [Network 与 Performance](./guide-line/network-performance.md) |
| **Performance** | 运行时性能录制、火焰图、Core Web Vitals | [Network 与 Performance](./guide-line/network-performance.md) |
| **Memory** | 堆快照、内存分配、查内存泄漏 | [Memory 与 Application](./guide-line/memory-application.md) |
| **Application** | Storage / Cookie / Service Worker / PWA | [Memory 与 Application](./guide-line/memory-application.md) |
| **AI assistance** | Gemini 3 解释样式 / 性能、CSS 代码补全 | [AI 与自动化](./guide-line/ai-assistance.md) |

> 还有 Security（证书 / 混合内容）、Lighthouse（综合审计）、Recorder（录制回放）等面板，按需通过面板栏 `»` 或命令菜单调出。

## 设备模式（Device Mode）

`Cmd/Ctrl+Shift+M` 进入设备工具栏：

- **响应式视口**：拖拽边缘改尺寸，或选预设机型（iPhone / Pixel / iPad…）
- **DPR / 方向**：模拟高分屏像素比、横竖屏切换
- **网络 / CPU 限速**：模拟 3G / 4G、4×/6× CPU 降速，复现弱网弱机体验
- **User-Agent**：自动随设备更新（Chrome 149 起动态更新）

> 设备模式是**近似模拟**，不替代真机；移动端 WebKit 行为仍需 Safari Web Inspector 真机调试。

## 设置与实验功能

`F1` 或命令菜单 `> Settings` 打开设置：可切主题（亮 / 暗 / 跟随系统）、改字号、配置网络限速档位。**Experiments** 标签下有大量实验功能（如新版面板、AI 增强），开启需重载 DevTools。

## 下一步

- [Elements 与样式](./guide-line/elements-styles.md)：DOM 编辑、Styles/Computed、盒模型、Grid/Flex 可视化、对比度
- [Console 与 Sources](./guide-line/console-sources.md)：Console 工具函数、断点体系、Snippets、Local Overrides
- [Network 与 Performance](./guide-line/network-performance.md)：请求分析、限速、Performance 录制、Core Web Vitals
- [Memory 与 Application](./guide-line/memory-application.md)：堆快照查泄漏、Storage / Service Worker / PWA
- [AI 与自动化](./guide-line/ai-assistance.md)：Gemini 3 AI assistance、Recorder、chrome-devtools-mcp
