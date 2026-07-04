---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 wujie v2（2026-06 复活） · 核于 2026-07

## 速查

- 核心 API：`startApp`（挂载）/ `preloadApp`（预加载）/ `destroyApp`（销毁）/ `refreshApp`（重建，v2.1）/ `setupApp`（默认配置）/ `clearAssetsCache`（清缓存）/ `bus`（通信）
- 双容器：**JS 在 iframe**（原生 window/history/location、物理隔离），**DOM 在 WebComponent**（shadowRoot、样式隔离），document 代理桥接
- 三模式：**保活 `alive:true`**（不销毁、状态留、秒切）/ **单例**（写生命周期、销毁重建实例）/ **重建**（默认）
- 路由：`sync:true` 劫持 iframe `history` → 子应用路由投影到主应用 query；单向同步；`prefix` 瘦身；v2.0 支持前进后退
- 通信：**`props`**（父传子）/ **`window.parent` 直通**（同域）/ **`bus` EventBus**（去中心化广播）
- 版本：**v1.0.29（2025-07）后沉寂 → 2026-06 v2.0「全新空白同域 iframe 沙箱」复活、连发 4 版**
- 定位：wujie = iframe 物理隔离 + WebComponent 渲染；隔离最强 + Vite 原生友好 + 保活预加载秒开

## 一、核心 API 表

| API | 作用 | 关键参数 / 返回 |
| --- | --- | --- |
| `startApp(options)` | 启动/挂载子应用 | `name`/`url`/`el`（必填）；`sync`/`alive`/`props`/`fiber`/`degrade` 等 + 生命周期钩子；返回销毁函数 |
| `preloadApp(options)` | 预加载 / 预执行 | 同 `startApp` + `exec`（`true` 预执行渲染）；空闲期拉资源 |
| `destroyApp(name)` | 销毁指定子应用 | 传 `name`，销毁其 iframe + WebComponent 实例 |
| `refreshApp(name)` | 全量重建刷新（v2.1.0 新增） | 传 `name`，销毁重建 |
| `setupApp(options)` | 预设默认配置 | 同 `startApp` 配置项 |
| `clearAssetsCache(host?)` | 清资源缓存 | 不传清全部、传 `host` 清指定 |
| `bus` | 去中心化事件总线 | `$emit`/`$on`/`$off`/`$once`/`$onAll`/`$offAll`/`$clear` |

## 二、iframe + WebComponent 分工表

| 关注点 | 归谁 | 说明 |
| --- | --- | --- |
| 子应用 JS 执行 | iframe（同域） | 原生 window，全局/定时器/事件都在 iframe 内 |
| window/history/location | iframe | 各自独立、原生；路由同步靠劫持 iframe history |
| 子应用 DOM 渲染 | WebComponent | shadowRoot 挂载，样式隔离随 Shadow DOM |
| 样式隔离 | WebComponent | Shadow DOM 天然隔离 |
| 降级 | iframe 直渲 | `degrade:true` 时 DOM 也在 iframe，弹窗受限 |

## 三、保活模式对比表

| 模式 | 开启 | 状态 | 适用 |
| --- | --- | --- | --- |
| 重建（默认） | 不设 `alive` | 每次销毁重建 | 简单子应用、内存敏感 |
| 单例 | 写生命周期、不开 `alive` | 实例复用、DOM 重建 | 需生命周期控制 |
| 保活 | `alive: true` | DOM+JS 状态全留、秒切 | 复杂表单、Tab 切换、秒开 |

## 四、路由同步表

| 项 | 行为 |
| --- | --- |
| 开启 | `startApp({ sync: true })` |
| 机制 | 劫持子应用 iframe 的 `history.pushState`/`replaceState`，投影到主应用 URL query |
| 同步方向 | 单向：仅初次实例化从主应用 URL 读回子应用路由 |
| 前进后退 | v2.0 空白同域 iframe 沙箱支持 |
| 瘦身 | `prefix` 把长前缀映射成短 key |

## 五、props / bus 通信表

| 方式 | 方向 | 主应用 | 子应用 |
| --- | --- | --- | --- |
| `props` | 父 → 子 | `startApp({ props })` | `window.$wujie.props` 读 |
| `window` 直通 | 双向 | `iframe.contentWindow` | `window.parent` |
| `bus` | 任意 | `import { bus } from "wujie"` | `window.$wujie.bus` |

## 六、版本时间线表

| 版本 | 时间 | 关键 |
| --- | --- | --- |
| v1.0.0 | 2022-11 | 首个正式版，iframe + WebComponent 路线 |
| v1.0.29 | 2025-07 | v1 线末版，此后约一年沉寂 |
| v2.0.0 | 2026-06 | 全新空白同域 iframe 沙箱、支持前进后退 |
| v2.1.0 | 2026-06 | 新增 `refreshApp`、修 destroy 竞态内存泄漏 |

## 权威链接

- [wujie 官方文档](https://wujie-micro.github.io/doc/) · [API](https://wujie-micro.github.io/doc/api/) · [GitHub](https://github.com/Tencent/wujie)

## 相关页

- [入门](./getting-started) · [iframe JS 沙箱](./iframe-sandbox) · [WebComponent 容器渲染](./wc-rendering) · [路由同步](./route-sync) · [保活与预加载](./keep-alive-preload) · [通信](./communication) · [v2.0 与现状](./v2-status)
- 机制通论：[微前端核心机制](../../mfe-mechanisms/)
