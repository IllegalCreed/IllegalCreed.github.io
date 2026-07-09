---
layout: doc
---

# Safari Web Inspector

Safari Web Inspector 是 Apple Safari（**WebKit 引擎**）内置的 Web 开发者工具，面板体系与 Chrome / Firefox 类似（Elements / Console / Sources / Network / Timelines / Storage / Audit / Graphics），但它有一个**不可替代的核心价值：调试 iOS / iPadOS 上的 Safari 与 WebView**。iPhone / iPad 上的所有浏览器实质都跑在 WebKit 上，而 iOS Safari 的渲染、字体、GPU 合成、ITP（智能防跟踪）等行为**无法在 Chrome / Firefox 的设备模式中复现**——要真正调试移动端 Web，必须用 Mac 上的 Safari Web Inspector 远程连接真机或模拟器。它也是三大渲染引擎（Blink / Gecko / WebKit）中 WebKit 的唯一调试入口。使用前需在 Safari 设置里启用「开发」菜单。

## 评价

**优点**

- **iOS / iPadOS 调试唯一选择**：Mac Safari 远程连真机 / 模拟器，无可替代
- **WebKit 真实行为**：渲染、字体、ITP、GPU 路径等只能在此还原
- **Timelines 性能分析**：加载与交互的活动时间线（JS / 布局 / 绘制 / 网络）
- **Audit 可自定义**：内置可访问性 / 代码审计，并支持自写审计脚本
- **Graphics / Layers**：Canvas、动画关键帧、图层合成可视化
- **面板熟悉**：Elements / Console / Sources / Storage 与 Chromium 习惯一致

**缺点**

- **仅 Apple 平台**：Web Inspector 只在 macOS 上的 Safari 提供（调 iOS 需 Mac）
- **需启用开发菜单**：默认隐藏，要先在设置里打开
- **无内置 AI**：缺 Chrome 的 AI assistance
- **性能/CSS 工具弱于对手**：不及 Chrome 的 Insights、Firefox 的 Grid/Flex 可视化
- **生态资源少**：教程与社区资源远少于 Chrome

## 文档地址

[Safari 开发者工具](https://developer.apple.com/safari/tools/)

## GitHub地址

[WebKit](https://github.com/WebKit/WebKit)

## 幻灯片地址

<a href="/SlideStack/safari-web-inspector-slide/" target="_blank">Safari Web Inspector</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=safari-web-inspector" target="_blank" rel="noopener noreferrer">Safari Web Inspector 测试题</a>
