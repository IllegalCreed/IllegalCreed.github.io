---
layout: doc
outline: [2, 3]
---

# 往返缓存 bfcache

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- **本质**：bfcache（back/forward cache）是「**整页在内存中的快照，包括 JavaScript 堆**」——离开页面时冻结、后退/前进时整体解冻，JS 从暂停处继续跑。
- **与 HTTP 缓存的区别**：HTTP 缓存只存「响应」，恢复页面仍要重新执行 JS 建 DOM；bfcache 直接恢复**执行状态**，「用 bfcache 恢复的二访永远更快」（web.dev）。
- **支持面**：Firefox / Safari 多年前就有；Chrome 96 起对桌面+移动全量启用；**桌面 1/10、移动 1/5 的导航是前进/后退**——命中收益巨大。
- **判定恢复**：`pageshow` 事件的 **`event.persisted === true`** 表示本页刚从 bfcache 恢复；`pagehide` 的 `persisted === true` 表示浏览器**打算**缓存本页（不保证成功）。
- **Chromium 补充事件**：`freeze` / `resume`（Page Lifecycle API），`resume` 在恢复时先于 `pageshow` 触发；也用于后台标签页冻结场景。
- **冻结期间**：定时器、未决 Promise 等几乎所有队列任务**暂停**，恢复后续跑；这对多标签页共享的 IndexedDB 事务有连带风险。
- **不可进入清单**：`unload` 监听（头号杀手）、`Cache-Control: no-store`（Chrome 已有条件放宽）、打开的 IndexedDB **连接**、进行中的 fetch/XHR、打开的 WebSocket/WebRTC、非空 `window.opener`。
- **CCNS 放宽（Chrome）**：自 116 实验、2025 年 3~4 月全量——`no-store` 页面可进 bfcache，但 **Cookie/授权凭据一变即逐出**，存活时限 **3 分钟**（常规页 10 分钟）。
- **`beforeunload` 不再阻断**（现代浏览器），但应「有未保存更改才挂、保存后立刻摘」。
- **诊断**：`performance.getEntriesByType("navigation")[0].notRestoredReasons`（**NotRestoredReasons API**，Chrome 125+）+ DevTools **Application → Back/forward cache → Run Test**；Lighthouse 10.0 起有专项审计。
- **埋点影响**：PV 会少算（恢复不触发 `load`），要监听 `pageshow(persisted)` 补计；LCP/INP/CLS 口径需按恢复重置。
- **会话终点别用 `unload`**：移动端常不触发且阻断 bfcache——用 `visibilitychange`（转 hidden）/ `pagehide` + `sendBeacon`。

## 一、整页快照：与 HTTP 缓存的本质区别

用户点「后退」时，传统流程是重新走一遍导航：取 HTML（哪怕全部命中 HTTP 缓存）→ 解析 → 执行 JS → 重建页面状态。bfcache 直接跳过这一切——web.dev 的定义：**「整个页面在内存中的快照（包括 JavaScript 堆）」**；离开时页面不销毁而是**冻结**（JS 任务暂停），返回时**解冻**（任务从暂停处恢复），页面瞬时出现。

| 维度 | HTTP 缓存 | bfcache |
| --- | --- | --- |
| 缓存单位 | 单个请求的**响应** | **整页执行状态**（DOM + JS 堆 + 滚动位置…） |
| 恢复成本 | 仍需解析 + 执行 JS 重建页面 | 直接解冻，近乎瞬时 |
| 存储位置 | 磁盘为主（+内存） | **仅内存** |
| 受 HTTP 头控制 | 是（RFC 9111） | 不是传统意义的缓存；仅 `no-store` 历史上有阻断效应 |
| 生效场景 | 任何重复请求 | 仅**前进/后退**（Chrome 中常规页存活上限 10 分钟） |

web.dev 强调：「一次页面加载所需的全部请求都恰好命中 HTTP 缓存的情况非常罕见，因此 **bfcache 恢复的重访问永远比 HTTP 缓存更快**」。

## 二、事件模型：怎么知道页面被冻结/恢复了

bfcache 恢复**不触发** `load`、不重新执行脚本——感知它要靠页面生命周期事件：

```js
// pageshow：初次加载（load 之后）和每次从 bfcache 恢复时都会触发
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    // persisted 为 true ⇒ 本页刚从 bfcache 解冻
    // 典型动作：补记一次 PV、刷新有时效性的数据（登录态 / 购物车 / token）
    console.log("从 bfcache 恢复");
  }
});

// pagehide：页面卸载或将被放入 bfcache 时触发
window.addEventListener("pagehide", (event) => {
  if (event.persisted) {
    // 浏览器「打算」把页面放进 bfcache——但不保证最终成功
  } else {
    // 本页不会进入 bfcache，将被正常卸载
  }
});
```

Chromium 系还派发 Page Lifecycle API 的 **`freeze` / `resume`**：进/出 bfcache 时触发，也覆盖「后台标签页为省 CPU 被冻结」的场景；`resume` 在 bfcache 恢复时**先于 `pageshow`** 触发。

**冻结期间的行为**：浏览器会暂停未决的定时器、Promise——「几乎所有 JavaScript 任务队列中的排队任务」——恢复时续跑。唯一要警惕的连带效应：若被暂停的任务属于某个 **IndexedDB 事务**，而同源其他标签页正访问同一个库，可能互相影响（这也是打开着 IndexedDB 连接的页面不给进 bfcache 的原因之一）；页面在 bfcache 里收到 **BroadcastChannel** 消息也会被逐出。

## 三、不可进入条件清单

浏览器只把「冻结后能安全复活」的页面放进 bfcache。工程上最常踩的阻断项：

| 阻断项 | 行为 | 对策 |
| --- | --- | --- |
| **`unload` 监听器** | 桌面 Chrome/Firefox：页面**直接失格**；移动端 Chrome 与 Safari：会尝试缓存，但 `unload` 永远不执行 | web.dev 原话「**永远不要用 `unload`**」；用 `pagehide` 替代；再加 `Permissions-Policy: unload=()` 防第三方脚本/扩展偷偷挂 |
| **`Cache-Control: no-store`** | 历史上一律阻断；**Chrome 自 116 实验、2025 年 3~4 月全量放宽**：可进入，但 Cookie 或其他授权凭据变化即逐出；页面内 fetch/XHR 响应若也带 `no-store` 即逐出；存活时限压到 **3 分钟**（常规 10 分钟） | 只给真正敏感的页面配 `no-store`；普通动态页用 `no-cache` 即可两全 |
| **打开的 IndexedDB 连接** | 阻断 | 空闲时关闭连接，`pagehide` 里主动 `db.close()` |
| **进行中的 fetch() / XHR** | 阻断 | 导航离开前的请求要么完成要么中止（`AbortController`） |
| **打开的 WebSocket / WebRTC 连接** | 阻断 | `pagehide` 里关闭，`pageshow(persisted)` 里重连 |
| **非空 `window.opener`** | 不能安全放入 bfcache | 链接用 `rel="noopener"`（现代浏览器 `target="_blank"` 已默认）；依赖 `window.postMessage()` 控制弹窗的场景，开窗者与被开窗者都进不了 bfcache |
| `beforeunload` 监听 | **现代浏览器已不阻断**，但事件本身不可靠 | 「有未保存更改时才 `addEventListener`，保存完立刻 `removeEventListener`」 |

## 四、诊断：NotRestoredReasons 与 DevTools

### 4.1 NotRestoredReasons API（Chrome 125+，实验性）

线上真实用户为什么没命中 bfcache？导航条目上直接给出原因：

```js
// 从导航性能条目读取「未从 bfcache 恢复的原因」
const [nav] = performance.getEntriesByType("navigation");
console.log(nav.notRestoredReasons);
// 形如：{ url: "…", reasons: [{ reason: "unload-listener" }],
//        children: [...同源 iframe 逐个列出...] }
```

- 结构：`url` / `src` / `id` / `name`（iframe 归属信息）、`reasons`（原因数组）、`children`（子 iframe 递归）。
- 常见 reason 值：`unload-listener`、`websocket`、`fetch`、`lock`、`response-cache-control-no-store`、`broadcastchannel-message`；**跨域 iframe 的具体原因会被折叠为 `masked`**（防跨域信息泄露）。
- 兼容性：Chrome 125 起支持，仍标实验性（Firefox/Safari 未实现）；老式的 `PerformanceNavigation.type === TYPE_BACK_FORWARD` 只能算命中率、给不出原因，已不推荐。

### 4.2 DevTools 与 Lighthouse

- **DevTools**：Application 面板 → **Back/forward cache** → **Run Test**——DevTools 会自动「导航离开再返回」，报告能否恢复；失败时列出原因，标 *Actionable* 的是开发者可修的。
- **Lighthouse 10.0 起**内置 bfcache 审计项，机制相同。

## 五、对统计埋点与 SPA 的影响

### 5.1 埋点与性能口径

- **PV 少算**：bfcache 恢复不触发 `load`，传统「load 时上报 PV」会漏掉这批访问——且 Firefox/Safari 用户「你多半早就在少算了」（web.dev）。补法：`pageshow` 里 `persisted === true` 时补报一次。
- **bfcache 命中率**：用「back_forward 导航数」与「其中 bfcache 恢复数」两个计数相除，监控退化。
- **Core Web Vitals 口径**：bfcache 恢复不算传统「页面加载」，数据集中快速加载变少，**分布反而显得变慢**——但用户体验实际变好了。按 web.dev 建议：恢复后 **LCP 用 `pageshow` 时间戳到下一帧绘制的差值**、**INP/CLS 归零重计**。
- **会话终点信号**：`unload` 在移动端（页签切后台后被杀）经常根本不触发，挂它还阻断 bfcache——**最后的可靠时机是 `visibilitychange` 变 `hidden` / `pagehide`**，配 `navigator.sendBeacon()` 发送，比 `unload` 可靠得多。

### 5.2 SPA

- 站内路由切换是同一文档内的行为，**与 bfcache 无关**；bfcache 作用于**整页导航**——例如用户从你的 SPA 跳去第三方支付页再按后退回来。
- 恢复时 **JS 堆原样回来**：Pinia/Redux 状态、定时器、组件树都停在离开那一刻——好处是零成本还原，坏处是**时效性数据全是旧的**。在 `pageshow(persisted)` 里统一做「回魂检查」：登录态是否过期、余额/库存/购物车是否要拉新、被 `pagehide` 断开的 WebSocket 重连。
- 反过来记住：**用户以为的「重新打开」可能根本没重新初始化**——启动逻辑里不能假设「每次可见必然刚跑过 init」。

## 小结

- bfcache 是**整页内存快照（含 JS 堆）**：离开冻结、返回解冻，与「只存响应」的 HTTP 缓存是两个维度；桌面 1/10、移动 1/5 的导航吃得到它。
- 感知靠 `pageshow`/`pagehide` 的 **`persisted`**（Chromium 另有 `freeze`/`resume`）；冻结期任务暂停、恢复续跑。
- 阻断清单背下来：**unload 监听、no-store（Chrome 已条件放宽 + 3 分钟时限 + Cookie 变化逐出）、打开的 IndexedDB 连接、在途 fetch、WebSocket/WebRTC、window.opener**；诊断用 **NotRestoredReasons（Chrome 125+）** 与 DevTools Back/forward cache 测试。
- 埋点要为它改口径：`pageshow(persisted)` 补 PV、LCP/INP/CLS 重置；会话终点用 `visibilitychange`/`pagehide` + `sendBeacon`，永远别再写 `unload`。
