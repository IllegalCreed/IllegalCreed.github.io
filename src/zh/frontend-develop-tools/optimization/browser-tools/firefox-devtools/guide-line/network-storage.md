---
layout: doc
outline: [2, 3]
---

# 网络存储与响应式

> 基于 Firefox 140+ 稳定版编写

## 速查

- Network：请求列表 + Headers/Cookies/Request/Response/Timing；限速下拉
- **Edit and Resend**：右键请求改参数后重发（调接口利器）
- 阻止请求：右键 Block URL 模拟资源加载失败
- Storage：Cookies / Local / Session / IndexedDB / Cache / Service Workers / Extension
- Performance：Firefox Profiler，调用树 + 火焰图 + 可分享在线分析
- 响应式：`Cmd+Opt+M` / `Ctrl+Shift+M`，机型 / 限速 / 触摸模拟

## Network 面板

请求分析与 Chrome 大体一致，几处实用差异：

| 标签 | 内容 |
| --- | --- |
| Headers | 请求 / 响应头、状态码 |
| Cookies | 该请求相关 Cookie |
| Request / Response | 发送参数 / 返回内容 |
| Timing | 各阶段耗时 |

- **Edit and Resend**：右键请求 → Edit and Resend，可改 URL / 头 / 体后重新发送——调试接口、试不同参数极方便
- **Block**：右键 Block URL，模拟某资源加载失败（测容错）
- **限速**：顶部下拉模拟弱网；HAR 可导入 / 导出

> Edit and Resend 让你不写代码就能反复试同一接口的不同入参。

## Storage 面板

对应 Chrome 的 Application，集中管理客户端存储：

- **Cookies**：查看 / 编辑 / 删除，含 `SameSite` / `Secure` / `HttpOnly`
- **Local / Session Storage**：键值表，可改
- **IndexedDB**：数据库浏览
- **Cache Storage**：Service Worker 缓存
- **Service Workers** / **Extension Storage**

## Performance（Firefox Profiler）

Firefox 的性能分析基于 **Firefox Profiler**：

- 录制后看调用树（Call Tree）、火焰图（Flame Graph）、栈图（Stack Chart）
- 可生成**可分享的在线 profile 链接**，便于协作排查
- 适合分析 JS 执行热点

> Firefox Profiler 在 JS 剖析上够用，但综合性能体验（Core Web Vitals、Insights 建议）不如 Chrome Performance 面板，性能优化主力仍推荐 Chrome。

## Memory 面板

拍堆快照（Heap snapshot），按类型聚合、看支配树（Dominators）与保留大小，定位内存占用与泄漏。流程与 Chrome 类似。

## 响应式设计模式

`Cmd+Opt+M` / `Ctrl+Shift+M`：选机型 / 自定义尺寸、DPR、方向，模拟网络限速与触摸事件，截图视口。是**近似模拟**，iOS WebKit 真机仍需 Safari Web Inspector。

## 小结

Firefox DevTools 的不可替代价值在 **CSS 布局（Grid/Flex）+ 可访问性 + 跨引擎（Gecko）视角**；通用调试（Console/Debugger/Network/Storage）与 Chrome 对等。专业前端把它与 Chrome 配合使用，各取所长。
