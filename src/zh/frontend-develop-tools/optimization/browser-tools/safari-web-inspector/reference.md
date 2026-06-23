---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Safari 26（macOS / iOS 26）编写

## 速查

- 启用：设置 → 高级 → 显示网页开发者功能 / 开发菜单
- 打开：`Cmd+Opt+I`；Console `Cmd+Opt+C`；选元素 `Cmd+Shift+C`；响应式 `Cmd+Opt+R`
- iOS 真机：iPhone 设置 → Safari → 高级 → 网页检查器；Mac 开发菜单选设备
- WebView 调试需 `webView.isInspectable = true`（iOS 16.4+）
- 面板：Elements / Console / Sources / Network / Timelines / Storage / Audit / Graphics
- 完整说明见 [入门](./getting-started.md) / [iOS 远程调试](./guide-line/ios-remote-debugging.md) / [Elements 与样式](./guide-line/elements-styles.md) / [Console 与 Sources](./guide-line/console-sources.md) / [Network 与 Timelines](./guide-line/network-timelines.md) / [Storage 审计与图形](./guide-line/storage-audit-graphics.md)

## 常用快捷键（macOS）

| 操作 | 快捷键 |
| --- | --- |
| 打开网页检查器 | `Cmd+Opt+I` |
| 直达 Console | `Cmd+Opt+C` |
| 选择元素 | `Cmd+Shift+C` |
| 响应式设计模式 | `Cmd+Opt+R` |

## iOS 真机远程调试步骤

1. iPhone：设置 → Apps → Safari → 高级 → 开「网页检查器」
2. 数据线连 Mac，信任设备
3. Mac Safari 开发菜单 → 选设备 → 选标签页 / Web App
4. 在弹出的 Inspector 里调试，iPhone 页面实时响应

## 面板对照（Safari ↔ Chrome）

| Safari | Chrome |
| --- | --- |
| Elements | Elements |
| Console | Console |
| Sources | Sources |
| Network | Network |
| Timelines | Performance |
| Storage | Application |
| Audit | Lighthouse（部分） |
| Graphics / Layers | Layers / Animations |

## 可调试目标

Safari 标签页 · 主屏 Web App(PWA) · WKWebView（需 `isInspectable`）· SFSafariViewController · Service Worker

## 不可替代价值

- iOS / iPadOS 所有浏览器底层都是 WebKit
- 渲染 / 字体 / GPU 合成 / **ITP 智能防跟踪**只能在此还原
- 三大引擎（Blink / Gecko / WebKit）中 WebKit 的唯一调试入口

## 官方资源

- 开发者工具：[https://developer.apple.com/safari/tools/](https://developer.apple.com/safari/tools/)
- 检查 iOS/iPadOS：[https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios](https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios)
- WebKit：[https://github.com/WebKit/WebKit](https://github.com/WebKit/WebKit)
