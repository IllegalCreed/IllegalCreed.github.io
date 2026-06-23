---
layout: doc
outline: [2, 3]
---

# Console 与 Sources

> 基于 Safari 26（macOS / iOS 26）编写

## 速查

- Console：`$0` 选中元素，`$()`/`$$()` 同 Chrome；console API 通用
- 运行环境：调真机时 Console 直接在 **iOS 页面上下文**执行 JS
- Sources：源码树 + 断点 + Call Stack / Scope / Watch
- 断点：点行号；右键加条件断点；事件 / 异常断点
- 单步：继续 / 跨过 / 步入 / 步出（控制条按钮）
- Pretty print：格式化压缩代码便于调试

## Console

Safari 的 Console 与 Chrome 用法基本一致：

- **工具函数**：`$0`（当前选中元素）、`$(sel)` / `$$(sel)`、`$x(xpath)`、`copy(obj)`
- **console API**：`log` / `warn` / `error` / `table` / `group` / `time` / `count` / `dir` / `assert`
- **过滤与设置**：按级别过滤、保留日志、显示时间戳

```js
console.table([{ name: "a", v: 1 }, { name: "b", v: 2 }]);
const links = $$("a").map((a) => a.href);
```

> **远程调试时**，Console 直接在 iPhone 当前页面的上下文执行——可在 Mac 上敲命令操作 iOS 页面，排查移动端专属问题。

## Sources（断点调试）

Safari 的 Sources 提供完整的 JavaScript 调试器：

### 断点与单步

- **行断点**：点行号；**条件断点**：右键行号加条件
- **事件断点 / 异常断点**：特定事件或抛异常时暂停
- **单步控制**：继续、跨过（step over）、步入（step into）、步出（step out）
- **Call Stack / Scope / Watch**：调用栈、作用域变量、监视表达式

### Pretty print

底部格式化按钮把压缩代码展开为可读形式，便于在线上 bundle 里设断点调试。

### 资源浏览

左栏按来源组织所有脚本、样式、图片等资源，可搜索、跳转。

## 与桌面调试的一致性

无论调试桌面 Safari 还是远程 iOS 页面，Console / Sources 的操作完全一致——**学一次，桌面与移动端通用**。这降低了移动端调试的上手成本：难点不在工具，而在「连上真机」这一步（见 [iOS 远程调试](./ios-remote-debugging.md)）。

## 下一步

网络与性能分析见 [Network 与 Timelines](./network-timelines.md)。
