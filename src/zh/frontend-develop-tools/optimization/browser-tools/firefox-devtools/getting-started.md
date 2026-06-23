---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Firefox 140+ 稳定版 / Developer Edition 编写

## 速查

- 打开：`F12` / `Cmd+Opt+I`(Mac) / `Ctrl+Shift+I`(Win/Linux)
- 选元素：`Cmd/Ctrl+Shift+C`；响应式设计模式：`Cmd+Opt+M` / `Ctrl+Shift+M`
- 核心面板：Inspector｜Console｜Debugger｜Network｜Performance｜Memory｜Storage｜Accessibility
- CSS 利器：Inspector 里 Grid / Flex 徽章叠加；Fonts / Shape Path / Changes / Compatibility 标签
- 可访问性：Accessibility 面板看 a11y 树、对比度、色觉障碍模拟
- Console 选中元素：`$0`；`$()`/`$$()` 同 Chrome
- Developer Edition：实验功能默认开 + 暗色主题，适合前端
- 取色器：Inspector 工具栏 Eyedropper 吸取页面任意颜色

## 打开 DevTools

| 操作 | 快捷键 |
| --- | --- |
| 打开 / 关闭 | `F12`，或 `Cmd+Opt+I`(Mac) / `Ctrl+Shift+I`(Win/Linux) |
| 选择元素 | `Cmd/Ctrl+Shift+C` |
| 直达 Console | `Cmd+Opt+K`(Mac) / `Ctrl+Shift+K`(Win/Linux) |
| 响应式设计模式 | `Cmd+Opt+M` / `Ctrl+Shift+M` |

## 面板总览

| 面板 | 用途 | 深入 |
| --- | --- | --- |
| **Inspector** | 检查 / 编辑 HTML/CSS、Grid/Flex 可视化 | [Inspector 与布局](./guide-line/inspector-grid-flex.md) |
| **Inspector 子工具** | Fonts / Shape Path / Changes / Compatibility | [字体形状与兼容](./guide-line/fonts-shapes-compat.md) |
| **Accessibility** | a11y 树、对比度、色觉障碍模拟 | [可访问性检查](./guide-line/accessibility.md) |
| **Console** | 日志、运行 JS、工具函数 | [Console 与 Debugger](./guide-line/console-debugger.md) |
| **Debugger** | 源码、断点调试 | [Console 与 Debugger](./guide-line/console-debugger.md) |
| **Network / Storage** | 请求分析 / 存储管理 | [网络存储与响应式](./guide-line/network-storage.md) |
| **Performance / Memory** | 性能 Profiler / 内存快照 | [网络存储与响应式](./guide-line/network-storage.md) |

## Inspector：CSS 调试的主场

Firefox 的 Inspector 对应 Chrome 的 Elements，但 CSS 工具更丰富：

- **Rules**：实时编辑 CSS（同 Chrome Styles）
- **Layout**：Grid / Flexbox 可视化叠加管理、盒模型
- **Computed**：最终计算值
- **Changes**：追踪所有 CSS 改动，可复制导出
- **Compatibility**：标注当前 CSS 的跨浏览器兼容性
- **Fonts**：可变字体轴值可视化调整

## Developer Edition

**Firefox Developer Edition** 是面向开发者的独立通道：

- 实验性 DevTools 功能**默认开启**
- 默认暗色主题
- 与稳定版同源——普通 Firefox 手动开启相同功能即可

> 不必非用 Developer Edition；普通 Firefox 的 DevTools 完全够用，只是部分实验功能需手动开。

## 响应式设计模式

`Cmd+Opt+M` / `Ctrl+Shift+M` 进入响应式设计模式：

- 选预设机型或自定义尺寸、DPR、方向
- 模拟网络限速、触摸事件
- 截图当前视口

> 与 Chrome 设备模式一样是**近似模拟**；移动端真机仍需 Safari Web Inspector（iOS）。

## 下一步

- [Inspector 与布局](./guide-line/inspector-grid-flex.md)：Rules、Grid Inspector、Flexbox Inspector
- [字体形状与兼容](./guide-line/fonts-shapes-compat.md)：Fonts Editor、Shape Path Editor、Changes、Compatibility
- [可访问性检查](./guide-line/accessibility.md)：a11y 树、对比度评级、色觉障碍模拟
- [Console 与 Debugger](./guide-line/console-debugger.md)：Web Console、断点调试
- [网络存储与响应式](./guide-line/network-storage.md)：Network、Storage、Performance、响应式设计模式
