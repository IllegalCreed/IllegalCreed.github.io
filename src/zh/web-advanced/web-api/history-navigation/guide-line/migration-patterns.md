---
layout: doc
outline: [2, 3]
---

# 迁移与模式：从 History 到 Navigation

> 基于 WHATWG HTML（导航与会话历史）现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **迁移主线**：`pushState` → `navigate({ history: "push" })`；`replaceState` → `navigate({ history: "replace" })` 或 `updateCurrentEntry`（只改 state）；`popstate` 监听 → `navigate` 事件 + `intercept()`。
- **特性检测**：`if ("navigation" in window) { /* Navigation */ } else { /* History 兜底 */ }`——2026 年的标准渐进增强姿势。
- **渐进增强而非替换**：Navigation API **2026-01 才进 Baseline**（Chrome/Edge/Firefox 147/Safari 26.2），老环境仍需 History API；两条代码路径并存是当前现实。
- **读当前 state**：`history.state` → `navigation.currentEntry.getState()`；**读完整栈**：History 无 → `navigation.entries()`。
- **回到某页**：History 只能 `go(-n)` 数步数（易错）→ Navigation 存 `key` 后 `traverseTo(key)` 直达。
- **能否后退**：History 靠 `try/catch` 或猜 → Navigation 直接读 `canGoBack`/`canGoForward`。
- **`currententrychange` 事件**：当前条目变化（**导航完成后**或 `updateCurrentEntry` 后）触发；`event.navigationType` 为 `"push"`/`"replace"`/`"reload"`/`"traverse"` 或 `null`（updateCurrentEntry）。
- **`navigate` vs `currententrychange`**：`navigate` 在导航**开始/可拦截时**触发（能 `intercept`）；`currententrychange` 在当前条目**已切换后**触发（做同步善后，不能拦）。
- **`entry.dispose`**：某 `NavigationHistoryEntry` 被移出历史栈（如前进覆盖了后续条目）时触发——释放与该条目绑定的缓存/资源。
- **`traverseTo` 断点**：跳转的 key 已被清出历史栈 → 抛 `InvalidStateError`；调用前用 `entries()` 校验 key 是否仍在，或 `try/catch` + 降级 `navigate`。
- **与框架路由的关系**：Vue Router/React Router/TanStack Router 目前仍以自有 API 为主，Navigation API 的红利多在**框架内部**逐步采用；业务代码短期仍写框架路由。
- **框架已在动**：主流路由库正评估/试验用 Navigation API 做内核（更好的拦截、滚动、无障碍）；关注但不必自己替换框架路由。
- **别与框架抢管**：用了框架路由就别再自己 `addEventListener("navigate")` 接管，会与框架的导航逻辑打架——要么全用框架，要么在无框架场景用原生。
- **降级策略**：抽象一个薄路由层，内部 `"navigation" in window` 分流：支持走 Navigation（拦截/滚动/无障碍更好），不支持走 History（`pushState` + `popstate`）。
- **服务端 fallback 不变**：无论 History 还是 Navigation，history 路由都需服务端把未知路径回退 `index.html`（见 [History API 页](./history-api)）。
- **state 边界不变**：两套都走结构化克隆，函数/DOM 存不了；迁移时 state 结构可直接复用。
- **信息一次性 vs 持久**：`navigate({ info })` 一次性（转场提示）、`navigate({ state })` 持久（entry 上）——History 只有持久 state，迁移时把"一次性提示"从 state 拆到 info。
- **测试与埋点**：用 `entry.id` 做"这一次导航"的唯一键做埋点，用 `entry.key` 做"这个位置"的键做缓存——比 History 时代靠 URL 猜稳。

## 一、迁移对照表：History → Navigation

先建立逐一对应关系，迁移时照着换：

| 目的 | History API | Navigation API |
| --- | --- | --- |
| 推新历史条目（改址不刷页） | `history.pushState(state, "", url)` | `navigation.navigate(url, { state, history: "push" })` |
| 替换当前条目 | `history.replaceState(state, "", url)` | `navigation.navigate(url, { state, history: "replace" })` |
| 只改当前 state、不导航 | `history.replaceState(state, "", location.href)` | `navigation.updateCurrentEntry({ state })` |
| 读当前 state | `history.state` | `navigation.currentEntry.getState()` |
| 读完整历史栈 | **做不到** | `navigation.entries()` |
| 前进 / 后退 | `history.forward()` / `history.back()` | `navigation.forward()` / `navigation.back()` |
| 相对跳转 | `history.go(n)` | （无直接等价，用 `traverseTo(key)` 直达） |
| 回到指定页 | `history.go(-n)`（数步数，易错） | 存 `key` 后 `navigation.traverseTo(key)` |
| 能否前进后退 | 无法可靠预判 | `navigation.canGoForward` / `canGoBack` |
| 监听导航 | `window.onpopstate`（**仅前进后退**） | `navigation` 的 `navigate` 事件（**所有导航**） |
| 拦截导航换内容 | 全局 `click` + `preventDefault` + 手动渲染 | `event.intercept({ handler })` |
| 导航完成回调 | 无（回调式拼凑） | `navigatesuccess` / `navigateerror` + `finished` Promise |
| 接管滚动 | `history.scrollRestoration` | `intercept({ scroll })` |

一个直观的"同一件事、两种写法"对比：

```js
// —— History API：主动导航要"push + 手动渲染"（push 不触发 popstate）——
function navigate(url, state) {
  history.pushState(state, "", url);
  render(url, state); // 必须手动
}
window.addEventListener("popstate", (e) => render(location.pathname, e.state));

// —— Navigation API：一个事件统一响应主动/被动导航 ——
navigation.addEventListener("navigate", (event) => {
  if (!event.canIntercept || event.hashChange) return;
  const url = new URL(event.destination.url);
  event.intercept({ handler: () => render(url.pathname) });
});
// 主动导航只需：navigation.navigate(url, { state })——渲染由上面的事件统一处理
```

注意迁移后**主动导航和被动导航合流成一条路径**（都进 `navigate` 事件的 `intercept`），不再像 History 那样"push 一套、popstate 一套"，这是心智上的最大简化。

## 二、渐进增强：特性检测与降级

Navigation API 2026-01 才进 Baseline，老设备/老浏览器仍需 History API 兜底。标准做法是**特性检测 + 两条代码路径**：

```js
/** 薄路由层：内部按能力分流，对上层暴露统一的 navigate/onChange */
function createRouter(render) {
  if ("navigation" in window) {
    // —— 现代路径：Navigation API（拦截/滚动/无障碍更好）——
    navigation.addEventListener("navigate", (event) => {
      if (!event.canIntercept || event.hashChange || event.downloadRequest) return;
      const url = new URL(event.destination.url);
      event.intercept({ handler: () => render(url.pathname) });
    });
    return { navigate: (url, state) => navigation.navigate(url, { state }) };
  }

  // —— 兜底路径：History API ——
  window.addEventListener("popstate", (e) => render(location.pathname, e.state));
  return {
    navigate(url, state) {
      history.pushState(state, "", url);
      render(url, state); // History 下 push 不触发 popstate，手动渲染
    },
  };
}
```

要点：

- **检测用 `"navigation" in window`**，不要 UA 嗅探。
- **把差异关进一个薄路由层**，业务只调 `router.navigate(...)`，不感知底层是哪套 API。
- **history 路由的服务端 fallback 两套都要**（把未知路径回退 `index.html`），这与用哪套 API 无关。

## 三、currententrychange：当前条目已变的善后

`navigate` 事件是"导航**开始**、可以拦截"的时机；而 `currententrychange` 是"当前条目**已经切换完**"的时机——用来做**不需要拦截、只需同步善后**的事（更新导航高亮、埋点、同步全局状态）：

```js
navigation.addEventListener("currententrychange", (event) => {
  // event.navigationType: "push" | "replace" | "reload" | "traverse" | null
  // 为 null 表示是 updateCurrentEntry 引起的（只改了 state，没真导航）
  console.log("当前条目变为：", navigation.currentEntry.url, event.navigationType);
  highlightActiveNavLink(navigation.currentEntry.url); // 同步导航高亮
  track("route_change", { type: event.navigationType });
});
```

`navigate` 与 `currententrychange` 的分工：

| 事件 | 时机 | 能否拦截 | 典型用途 |
| --- | --- | --- | --- |
| `navigate` | 导航**开始**、提交前 | ✅ `intercept()` | 换内容、鉴权重定向、取消旧请求 |
| `currententrychange` | 当前条目**已切换后** | ❌ 只读 | 导航高亮、埋点、同步全局状态、响应 `updateCurrentEntry` |

## 四、entry.dispose：条目被清出时释放资源

每个 `NavigationHistoryEntry` 在**被移出历史栈**时触发 `dispose` 事件。最常见的触发场景：用户在历史中间的某条上**又发起了新的 push 导航**，会把它后面的所有条目清出栈（经典的"分叉即截断"）。若你为某些条目缓存了资源（预取的数据、离屏渲染的视图），可借 `dispose` 释放：

```js
// 为某个历史条目关联缓存，并在它被清出时释放
function attachCache(entry, cache) {
  entry.addEventListener("dispose", () => {
    cache.delete(entry.key); // 条目已不可达，回收其缓存
    console.log("条目被清出历史栈：", entry.url);
  });
}

// 例如导航提交后为当前条目建缓存
navigation.addEventListener("navigatesuccess", () => {
  const entry = navigation.currentEntry;
  attachCache(entry, viewCache);
});
```

这是 History API 完全没有的能力——它连"某个历史条目被清出了"这个事件都感知不到。

## 五、traverseTo 断点：key 可能已失效

`traverseTo(key)` 很强，但要处理"**key 已被清出历史栈**"的断点——比如你存了某条目的 key，之后用户的导航把它清出了，再 `traverseTo` 会抛 `InvalidStateError`：

```js
/** 安全地回到某个历史条目：key 失效则降级为普通导航 */
function safeTraverse(key, fallbackUrl) {
  // 先看该 key 是否还在完整历史栈里
  const stillThere = navigation.entries().some((e) => e.key === key);
  if (stillThere) {
    navigation.traverseTo(key);
  } else {
    // 已被清出——降级：直接导航到等价 URL
    navigation.navigate(fallbackUrl, { history: "replace" });
  }
}
```

要么如上用 `entries()` 预校验，要么 `try/catch` 兜 `InvalidStateError` 后降级 `navigate`。"回首页"按钮尤其要这么写——用户历史被清是常态。

## 六、与框架路由的关系：谁在用、你该怎么站位

这是本叶必须讲清的**边界**：

- **框架路由目前仍以自有 API 为主**。你在业务里写的还是 Vue Router 的 `<RouterView>` + 路由表、React Router 的 `<Routes>`、TanStack Router 的类型安全路由树——它们对上层暴露声明式路由，对下层封装底层 API。
- **Navigation API 的红利多在框架内部**。主流路由库正逐步评估/采用 Navigation API 做内核，以获得更好的导航拦截、滚动恢复与无障碍——但这对业务代码基本透明，你升级路由库版本即可受益，不需要自己改。
- **别与框架抢管理权**。用了框架路由，就**不要**再自己 `navigation.addEventListener("navigate", …)` 去 `intercept`——那会和框架的导航流程打架（双方都想接管同一次导航）。要么完全交给框架，要么**只在没有框架路由的场景**（原生小应用、微前端壳、特定内嵌页）直接用原生 API。
- **本叶的定位**：帮你**读懂路由库底层在做什么**——排查"刷新 404""前进后退状态丢失""滚动没恢复""快速切页竞态"这类问题时，你能定位到 `pushState`/`popstate`/`intercept`/`signal` 这些原生机制。具体某个路由库怎么配置，见[框架路由章](/zh/frontend-framework/router/)与[元框架章](/zh/frontend-framework/meta/)。

## 七、迁移检查清单

落地一次 History → Navigation 迁移（或新项目选型）时逐条过：

- [ ] `"navigation" in window` 特性检测就位，History API 降级路径可用。
- [ ] `pushState`/`replaceState` 调用点已映射到 `navigate({ history })` 或 `updateCurrentEntry`。
- [ ] 原 `popstate` 逻辑迁到 `navigate` 事件 + `intercept()`；不再"push 后手动渲染"（Navigation 下统一由事件处理）。
- [ ] `intercept()` 前的守卫齐全：`canIntercept`、`hashChange`、`downloadRequest`。
- [ ] 异步 handler 透传 `event.signal`，快速切页不再竞态。
- [ ] 鉴权重定向改用 `precommitHandler` + `controller.redirect`，地址栏不闪受限 URL。
- [ ] "回某页"按钮改用 `traverseTo(key)`，并处理 key 失效降级。
- [ ] `currententrychange` 里同步导航高亮/埋点。
- [ ] 需要资源回收的条目挂了 `entry.dispose`。
- [ ] history 路由的**服务端 fallback 到 index.html** 已配（两套 API 都需要）。
- [ ] 若用框架路由，未与框架抢 `navigate` 管理权。

下一页是全叶的速查汇总——[参考](../reference)：方法/事件速查、字段表、对比表、浏览器支持矩阵、易错点清单与资源链接。
