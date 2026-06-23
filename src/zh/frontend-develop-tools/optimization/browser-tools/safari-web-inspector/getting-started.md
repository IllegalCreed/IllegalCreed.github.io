---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Safari 26（macOS / iOS 26）编写

## 速查

- 启用：Safari 设置 → 高级 → 勾选「显示网页开发者功能 / 显示开发菜单」
- 打开：`Cmd+Opt+I`，或开发菜单 →「显示网页检查器」
- 选元素：`Cmd+Shift+C`；Console：`Cmd+Opt+C`
- 响应式：开发菜单 →「进入响应式设计模式」（`Cmd+Opt+R`）
- 核心面板：Elements｜Console｜Sources｜Network｜Timelines｜Storage｜Audit｜Graphics
- iOS 调试：iPhone 连 Mac → iPhone 设置开 Web 检查器 → Mac 开发菜单选设备
- Console 选中元素：`$0`；`$()`/`$$()` 同 Chrome

## 启用开发菜单（第一步）

Safari 默认隐藏开发者功能，需先启用：

1. Safari 菜单 → **设置**（`Cmd+,`）
2. 切到 **高级（Advanced）** 标签
3. 勾选底部 **「显示网页开发者功能」**（旧版为「在菜单栏中显示开发菜单」）

启用后菜单栏出现 **开发（Develop）** 菜单，所有调试入口都在这里。

## 打开 Web Inspector

| 操作 | 快捷键 |
| --- | --- |
| 打开网页检查器 | `Cmd+Opt+I` |
| 直达 Console | `Cmd+Opt+C` |
| 选择元素 | `Cmd+Shift+C` |
| 响应式设计模式 | `Cmd+Opt+R` |

也可在网页右键 →「检查元素」打开。

## 面板总览

| 面板 | 用途 | 深入 |
| --- | --- | --- |
| **Elements** | 检查 / 编辑 DOM 与 WebKit 样式 | [Elements 与样式](./guide-line/elements-styles.md) |
| **Console / Sources** | 日志、运行 JS、断点调试 | [Console 与 Sources](./guide-line/console-sources.md) |
| **Network / Timelines** | 请求分析、性能时间线 | [Network 与 Timelines](./guide-line/network-timelines.md) |
| **Storage / Audit / Graphics** | 存储、审计、图形图层 | [Storage 审计与图形](./guide-line/storage-audit-graphics.md) |
| **iOS 远程调试** | 真机 / 模拟器调试（核心） | [iOS 远程调试](./guide-line/ios-remote-debugging.md) |

## 响应式设计模式

开发菜单 →「进入响应式设计模式」（`Cmd+Opt+R`）：

- 预设 Apple 机型（iPhone / iPad）尺寸与 DPR
- 切换方向、User-Agent
- 快速预览不同视口

> 这是桌面 Safari 的**近似模拟**；要测 iOS 真实行为，仍需下面的真机远程调试。

## 为什么 Safari 不可替代

iPhone / iPad 上**所有浏览器都强制使用 WebKit**，且 iOS Safari 的渲染、字体回退、GPU 合成、ITP 隐私策略等**无法在 Chrome / Firefox 复现**。移动端 Web 的真实问题，只能用 Safari Web Inspector 连真机调试——这是它在「浏览器工具」里独立成叶的根本理由。

## 下一步

- [iOS 远程调试](./guide-line/ios-remote-debugging.md)：真机 / 模拟器连接与调试（核心）
- [Elements 与样式](./guide-line/elements-styles.md)：DOM 编辑、WebKit 样式
- [Console 与 Sources](./guide-line/console-sources.md)：日志、断点调试
- [Network 与 Timelines](./guide-line/network-timelines.md)：请求、性能时间线
- [Storage 审计与图形](./guide-line/storage-audit-graphics.md)：存储、Audit、Graphics
