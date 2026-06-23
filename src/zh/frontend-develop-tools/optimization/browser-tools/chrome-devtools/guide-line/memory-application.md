---
layout: doc
outline: [2, 3]
---

# Memory 与 Application

> 基于 Chrome 149 稳定版编写

## 速查

- 内存泄漏三步：操作前后各拍 **Heap snapshot** → Comparison 对比 → 看增长的对象
- 查 DOM 泄漏：Memory → **Detached elements** profiling，列出已脱离文档却被 JS 引用的节点
- 找谁引用：快照里选对象看 **Retainers**（引用链）定位泄漏源
- Application：左栏管 Local/Session Storage、IndexedDB、Cookies、Cache Storage
- Service Worker：Application → Service Workers 看注册 / 更新 / 注销，可 Offline / skipWaiting
- PWA：Application → Manifest 检查图标 / 安装条件
- 清空：Application → Storage → **Clear site data** 一键清所有存储

## Memory 面板：查内存泄漏

JS 内存泄漏（监听器没解绑、闭包持有大对象、detached DOM）会让页面越用越卡。Memory 面板提供三种剖析：

| 类型 | 用途 |
| --- | --- |
| **Heap snapshot** | 拍某一刻堆内存快照，看对象分布与引用 |
| **Allocation instrumentation on timeline** | 时间线上记录分配，蓝条 = 新分配、灰条 = 已回收 |
| **Allocation sampling** | 低开销采样，定位高频分配的函数 |

### 对比法定位泄漏

```text
1. 拍快照 A（操作前）
2. 执行可疑操作 N 次（如反复开关弹窗）
3. 拍快照 B（操作后）
4. 选 B，下拉切到 Comparison（对比 A）
5. 看 # Delta 为正且持续增长的构造器 → 疑似泄漏
6. 展开看 Retainers（引用链）→ 找到谁还在引用它
```

### Detached elements

Memory 新增 **Detached elements** profiling type：专门列出**已从 DOM 树移除、但仍被 JavaScript 引用**的节点（最常见的内存泄漏）。比手动翻快照更直接。

> Edge DevTools 曾有独立的 Detached Elements 工具，2025-03 已移除并合并到 Memory 面板的此功能。

## Application 面板：存储与 PWA

### 存储

- **Local / Session Storage**：键值表，可直接增删改
- **IndexedDB**：数据库 / 对象仓库 / 记录浏览
- **Cookies**：查看 / 编辑 / 删除，含 `HttpOnly`、`Secure`、`SameSite` 标志
- **Cache Storage**：Service Worker 缓存的资源
- **Clear site data**：Storage 概览页一键清空所有存储（调试缓存问题必备）

### Service Worker 与 PWA

- **Service Workers**：查看注册状态、强制 **Update / Unregister**、勾 **Offline** 模拟离线、**Update on reload** 调试更新逻辑
- **Manifest**：检查 PWA 清单（名称、图标、`display`、安装条件），直接触发安装
- **Background services**：录制 Push、Background Sync、Notifications 等后台事件

### WebMCP 调试（Chrome 149 实验）

Application 面板新增实验性 **WebMCP 调试工具**：可检查页面暴露的客户端工具（client-side tools）及其 schema、手动执行工具、跟踪调用事件——服务于「网页向 AI agent 暴露能力」这一新范式。

## 下一步

AI assistance 与自动化见 [AI 与自动化](./ai-assistance.md)。
