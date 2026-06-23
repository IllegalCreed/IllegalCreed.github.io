---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Firefox 140+ 稳定版编写

## 速查

- 打开：`F12` / `Cmd+Opt+I` / `Ctrl+Shift+I`；Console `Cmd+Opt+K` / `Ctrl+Shift+K`
- 选元素 `Cmd/Ctrl+Shift+C`；响应式 `Cmd+Opt+M` / `Ctrl+Shift+M`
- CSS 利器：Grid/Flex Inspector、Fonts、Shape Path、Changes、Compatibility
- a11y：Accessibility 面板（树 / 对比度 / 色觉模拟）
- Network：Edit and Resend、Block URL
- 完整说明见 [入门](./getting-started.md) / [Inspector 与布局](./guide-line/inspector-grid-flex.md) / [字体形状与兼容](./guide-line/fonts-shapes-compat.md) / [可访问性检查](./guide-line/accessibility.md) / [Console 与 Debugger](./guide-line/console-debugger.md) / [网络存储与响应式](./guide-line/network-storage.md)

## 常用快捷键

| 操作 | Mac | Win/Linux |
| --- | --- | --- |
| 打开 / 关闭 | `Cmd+Opt+I` | `F12` / `Ctrl+Shift+I` |
| Console | `Cmd+Opt+K` | `Ctrl+Shift+K` |
| 选择元素 | `Cmd+Shift+C` | `Ctrl+Shift+C` |
| 响应式设计模式 | `Cmd+Opt+M` | `Ctrl+Shift+M` |
| 继续 / 跨过 / 步入 / 步出 | `F8` / `F10` / `F11` / `Shift+F11` | 同 |

## Firefox 独家 / 领先功能

| 功能 | 位置 | 用途 |
| --- | --- | --- |
| Grid Inspector | Inspector → `grid` 徽章 | 网格线编号 / 轨道 / 区域可视化 |
| Flexbox Inspector | Inspector → `flex` 徽章 | flex item 尺寸图解 |
| Fonts Editor | Inspector → Fonts | 可变字体轴值滑块 |
| Shape Path Editor | Rules → 形状图标 | `clip-path` / `shape-outside` 可视化 |
| Changes | Inspector → Changes | 追踪并导出 CSS 改动 |
| Compatibility | Inspector → Compatibility | CSS 跨浏览器兼容标注 |
| Accessibility | Accessibility 面板 | a11y 树 / 对比度 / 色觉模拟 |
| Edit and Resend | Network 右键 | 改请求参数后重发 |

## 面板对照（Firefox ↔ Chrome）

| Firefox | Chrome |
| --- | --- |
| Inspector | Elements |
| Console | Console |
| Debugger | Sources |
| Network | Network |
| Performance | Performance |
| Memory | Memory |
| Storage | Application |
| Accessibility | Elements → Accessibility |

## 色觉障碍模拟

Protanopia（红色盲）/ Deuteranopia（绿色盲）/ Tritanopia（蓝色盲）/ Achromatopsia（全色盲）/ Contrast loss（对比度损失）

## 官方资源

- 用户文档：[https://firefox-source-docs.mozilla.org/devtools-user/](https://firefox-source-docs.mozilla.org/devtools-user/)
- Grid Inspector：[examine_grid_layouts](https://firefox-source-docs.mozilla.org/devtools-user/page_inspector/how_to/examine_grid_layouts/index.html)
- Accessibility Inspector：[MDN Accessibility inspector](https://developer.mozilla.org/en-US/docs/Tools/Accessibility_inspector)
- Developer Edition：[https://www.firefox.com/en-US/channel/desktop/developer/](https://www.firefox.com/en-US/channel/desktop/developer/)
