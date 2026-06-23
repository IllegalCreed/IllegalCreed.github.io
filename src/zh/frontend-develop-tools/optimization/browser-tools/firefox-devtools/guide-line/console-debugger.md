---
layout: doc
outline: [2, 3]
---

# Console 与 Debugger

> 基于 Firefox 140+ 稳定版编写

## 速查

- Console：`Cmd+Opt+K` / `Ctrl+Shift+K`；`$0` 选中元素，`$()`/`$$()` 同 Chrome
- 多行编辑：Console 左侧编辑器模式，写多行代码再运行
- Debugger：源码树 + 断点 + Call Stack / Scopes / Watch
- 断点：点行号；右键加条件断点 / Logpoint；右栏 DOM / Event / XHR 断点
- 单步：`F8` 继续 / `F10` 跨过 / `F11` 步入 / `Shift+F11` 步出
- Pretty print：`{ }` 按钮格式化压缩代码
- 黑盒：右键源文件 Blackbox 跳过第三方栈帧

## Web Console

Firefox 的 Console 与 Chrome 高度一致：

- **工具函数**：`$0`（选中元素）、`$(sel)` / `$$(sel)`、`$x(xpath)`、`copy(obj)`、`clear()`
- **多行编辑器模式**：Console 可切到左右分栏，左侧像编辑器写多行代码、`Cmd/Ctrl+Enter` 运行，适合调试较长片段
- **过滤**：按 Errors / Warnings / Logs / Info / Debug 及 Network / CSS 消息过滤
- **console API**：`console.table` / `group` / `time` / `count` / `dir` 等通用

```js
// 多行编辑器里写：
const items = $$(".item");
console.table(items.map((el) => ({ text: el.textContent })));
```

## Debugger（断点调试）

Firefox 的 **Debugger** 对应 Chrome 的 Sources：

### 源码与断点

- 左栏按来源组织文件，`Cmd/Ctrl+P` 快速打开
- **断点类型**：行断点、条件断点、Logpoint（右键行号）；右栏的 DOM Mutation、Event Listener、XHR 断点
- **Pretty print**：底部 `{ }` 按钮把压缩代码格式化，便于调试线上 bundle

### 单步与作用域

- 控制条：`F8` 继续、`F10` 跨过、`F11` 步入、`Shift+F11` 步出
- 右栏：**Call Stack**（调用栈）、**Scopes**（作用域变量）、**Watch expressions**（监视表达式）
- **Blackbox（黑盒）**：右键第三方源文件，单步时跳过其栈帧
- **Outline**：函数大纲，快速跳转文件内的函数定义

> 断点体系与 Chrome 基本对等；日常调试在两家浏览器间几乎无切换成本。

## 下一步

网络、存储与性能见 [网络存储与响应式](./network-storage.md)。
