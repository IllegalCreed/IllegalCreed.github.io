---
layout: doc
outline: [2, 3]
---

# Console 与 Sources

> 基于 Chrome 149 稳定版编写

## 速查

- 选中元素引用：`$0`（上一个 `$1`…`$4`）；`$()`=`querySelector`，`$$()`=`querySelectorAll`
- 工具函数：`copy(obj)` 复制到剪贴板、`keys/values(obj)`、`monitorEvents(el)`、`getEventListeners(el)`
- 表格化：`console.table(arr)`；分组 `console.group`；计时 `console.time/timeEnd`
- Live Expression：Console 顶部 `👁` 钉住实时求值的表达式
- 断点：行断点点行号；条件断点 / Logpoint 右键行号；XHR/fetch、Event Listener、异常断点在右栏
- 单步：`F8` 继续 / `F10` 跨过 / `F11` 步入 / `Shift+F11` 步出
- Snippets：Sources → Snippets 存可复用脚本，`Cmd/Ctrl+Enter` 运行
- Local Overrides：Sources → Overrides 持久化覆盖线上 JS/CSS/响应

## Console：不止打印日志

### console API

```js
console.log("普通", obj);
console.warn("警告"); console.error("错误");
console.table([{ a: 1, b: 2 }, { a: 3, b: 4 }]); // 数组/对象表格化
console.group("分组"); console.log("子项"); console.groupEnd();
console.assert(x > 0, "x 必须为正"); // 条件不成立才打印
console.count("点击"); // 计数同名调用
console.time("loop"); /* ... */ console.timeEnd("loop"); // 计时
console.dir(domEl); // 以对象形式展开 DOM（而非 HTML）
console.trace(); // 打印调用栈
```

### 实用工具函数（仅 Console 可用）

| 函数 | 作用 |
| --- | --- |
| `$0` ~ `$4` | 最近选中的元素（`$0`=当前） |
| `$(sel)` / `$$(sel)` | `querySelector` / `querySelectorAll`（返回数组） |
| `$x(path)` | XPath 查询 |
| `copy(obj)` | 把对象 / 字符串复制到系统剪贴板 |
| `keys(o)` / `values(o)` | 取对象键 / 值 |
| `getEventListeners(el)` | 列出元素的事件监听器 |
| `monitorEvents(el, "click")` | 监听并打印元素事件（`unmonitorEvents` 取消） |
| `monitor(fn)` | 函数被调用时打印参数（`unmonitor` 取消） |
| `queryObjects(Ctor)` | 列出某构造器的所有实例（查内存常用） |

### Live Expression

Console 顶部 `👁`（Create live expression）钉住一个表达式，它会**实时持续求值**（如 `document.activeElement`、`performance.now()`），无需反复手敲。

## Sources：断点调试

### 文件导航

左栏三个视图：**Page**（按域名 / 资源树）、**Filesystem**（Workspace 绑定的本地目录）、**Overrides**（本地覆盖）。`Cmd/Ctrl+P` 快速打开文件，`Cmd/Ctrl+Shift+F` 全局搜索所有已加载源码。

### 断点类型

| 类型 | 设置方式 | 用途 |
| --- | --- | --- |
| 行断点 | 点行号 | 执行到该行暂停 |
| 条件断点 | 右键行号 → Add conditional breakpoint | 条件为真才暂停 |
| **Logpoint** | 右键行号 → Add logpoint | 不暂停，只打印——免改源码加 log |
| DOM 断点 | Elements 右键 → Break on | DOM 变动时暂停 |
| XHR / fetch | Sources 右栏 → XHR/fetch Breakpoints | URL 含某串的请求暂停 |
| Event Listener | 右栏 → Event Listener Breakpoints | 某类事件触发时暂停 |
| 异常断点 | 右栏 `⏸` 图标 | 抛异常（含被捕获）时暂停 |

### 单步与作用域

暂停后用控制条：`F8` 继续、`F10` 跨过、`F11` 步入、`Shift+F11` 步出。右栏可看 **Call Stack**（调用栈）、**Scope**（当前作用域变量）、**Watch**（钉住表达式）。对第三方库可右键 **Add script to ignore list**（旧称 Blackbox）跳过其栈帧。

### Snippets：可复用脚本

Sources → **Snippets** 新建脚本，在任意页面 `Cmd/Ctrl+Enter` 运行。适合存常用调试片段（如批量抓数据、注入测试代码）。

### Workspace 与 Local Overrides

- **Workspace**：把本地源码目录拖进 Sources，DevTools 里的改动**直接写回磁盘文件**（配合 source map 调试即改）
- **Local Overrides**：Sources → Overrides 指定文件夹后，可覆盖线上任意 JS / CSS / 甚至网络响应，刷新后仍生效——**无需部署即可验证线上改动**

```text
场景：线上 bug 想验证修复
Overrides → 编辑线上 app.js → 刷新 → 改动持续生效（仅本机）
```

## 下一步

性能与网络分析见 [Network 与 Performance](./network-performance.md)。
