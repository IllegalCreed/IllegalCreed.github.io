---
layout: doc
outline: [2, 3]
---

# iOS 远程调试

> 基于 Safari 26（macOS / iOS 26）编写

## 速查

- 真机：iPhone 设置 → Apps → Safari → 高级 → 开「网页检查器」
- 连接：数据线连 Mac → Mac Safari 开发菜单 → 选设备 → 选标签页
- 模拟器：Xcode Simulator 运行 → Mac Safari 开发菜单出现 Simulator
- 可调试：Safari 标签页、主屏 Web App(PWA)、WKWebView、App 内 WebView
- WebView 调试需 App 设 `isInspectable = true`（iOS 16.4+）
- 唯一性：iOS 所有浏览器都跑 WebKit，真实行为只能在此还原

这是 Safari Web Inspector **不可替代的核心能力**——调试 iPhone / iPad 上的真实 WebKit。

## 真机调试步骤

### 1. iPhone / iPad 端开启

设置 → Apps → **Safari** → 最底部 **高级（Advanced）** → 打开 **网页检查器（Web Inspector）**。

### 2. Mac 端连接

1. 用数据线把 iPhone 连到 Mac（首次需信任设备）
2. Mac 上打开 Safari，确保已启用开发菜单
3. **开发（Develop）** 菜单中出现你的设备名
4. 展开设备 → 选择要调试的标签页 / Web App
5. 弹出 Web Inspector 窗口，操作与桌面调试完全一致

> 在 Mac 的 Inspector 里选元素 / 改样式 / 看 Console，iPhone 上的页面**实时响应**——真机所见即所调。

## 模拟器调试

无真机时可用 **Xcode iOS Simulator**：

- 在 Simulator 里用 Safari 打开页面
- Mac Safari 的开发菜单会出现 **Simulator** 项
- 选择对应标签页即可调试

> 模拟器跑的也是 WebKit，比 Chrome 设备模式更接近真机；但触摸、性能、相机等硬件相关行为仍以真机为准。

## 可调试的目标

| 目标 | 说明 |
| --- | --- |
| Safari 标签页 | iOS Safari 打开的网页 |
| 主屏 Web App | 添加到主屏幕的 PWA |
| WKWebView | 原生 App 内嵌的网页（需开启可检查） |
| SFSafariViewController | App 内的 Safari 视图 |
| Service Worker | 后台 SW 脚本 |

## 调试原生 App 里的 WebView

iOS 16.4 / macOS 13.3 起，调试 App 内嵌 WKWebView 需在原生代码中显式开启：

```swift
// Swift：让 WebView 可被 Web Inspector 检查
if #available(iOS 16.4, *) {
  webView.isInspectable = true
}
```

> 未设 `isInspectable` 的 WebView 不会出现在开发菜单里——这是排查「连了真机却看不到页面」的常见原因。

## 为什么不能用 Chrome 设备模式替代

- iOS 上**所有浏览器**（含 iOS 版 Chrome）底层都是 **WebKit**
- WebKit 的渲染、字体回退、`-webkit-` 行为、GPU 合成、**ITP 智能防跟踪**等无法在 Blink / Gecko 复现
- 移动端兼容性 bug（尤其只在 iOS Safari 出现的）只能用真机 Web Inspector 定位

## Windows / Linux 怎么办

官方远程调试**需要 Mac**。非 Mac 环境可借助第三方方案（如 `ios-webkit-debug-proxy`、云真机平台 BrowserStack / LambdaTest）间接调试，但体验与功能不及原生 Mac + Safari。

## 下一步

桌面端面板用法见 [Elements 与样式](./elements-styles.md)。
