---
layout: doc
outline: [2, 3]
---

# Navigation API 基础：入口、方法与历史栈

> 基于 WHATWG HTML（导航与会话历史）现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **入口**：`window.navigation`（`Navigation` 接口，每窗口一个）；**2026-01 进 Baseline**（Chrome/Edge/Firefox 147/Safari 26.2）；特性检测 `"navigation" in window`。
- **五个导航方法**：`navigate(url, options)` / `reload(options)` / `back()` / `forward()` / `traverseTo(key, options)`——**都返回 `{ committed, finished }` 两个 Promise**。
- **`navigate(url, options)`**：`options` 含 `state`（结构化克隆数据）、`info`（传给 navigate 事件的一次性信息）、`history`（`"auto"`/`"push"`/`"replace"`）。
- **`committed` vs `finished`**：`committed` 在 **URL 变更 + 新 entry 建立**时兑现；`finished` 在 `intercept()` 的 handler 全部完成（等价 `navigatesuccess`）时兑现。
- **`traverseTo(key)`**：跳到 **key** 标识的历史条目；**key 是 UA 生成的、每个历史 slot 唯一且不可变的标识**，前进后退不改变它——存下首页的 key 就能"永远回首页"。
- **key 不存在抛 `InvalidStateError`**：历史栈里没有该 key（如已被清出）时 `traverseTo` 拒绝。
- **`currentEntry`**：当前 `NavigationHistoryEntry`；`navigation.currentEntry.getState()` 读当前 state、`.url`/`.key`/`.index` 随手可得。
- **`entries()`**：返回**当前同源会话历史的完整 entry 数组**——History API 做不到的质变能力。
- **`updateCurrentEntry({ state })`**：**只更新当前 entry 的 state、不导航、不新增历史条目**；用于原地改状态（对标 `replaceState` 只改 state 的场景，但语义更清晰）。
- **`canGoBack` / `canGoForward`**：布尔值，直接问"能不能前进后退"——History API 问不出来。
- **`NavigationHistoryEntry` 字段**：`getState()`（读该 entry 结构化 state）、`url`、`key`（slot 标识，可 `traverseTo`）、`id`（该次 entry 实例唯一 id）、`index`（在 `entries()` 中的位置）、`sameDocument`（是否同文档导航）。
- **`key` vs `id`**：**`key` 认"位置/slot"**（同一 slot 复用则 key 不变，用于 `traverseTo`）；**`id` 认"这一次 entry 实例"**（每次导航新 entry 都换 id，用于精确追踪）。
- **`entry.dispose` 事件**：该 entry 被移出历史栈（如前进后覆盖了后续条目）时触发——可在此清理与该 entry 绑定的资源。
- **相比 History API 四大改进**：① 一个 `navigate` 事件拦所有导航；② `entries()` 读完整历史栈；③ 每 entry 独立 state 可读；④ Promise 化 committed/finished + 事件生命周期。
- **`transition`**：`navigation.transition` 反映进行中的导航（`navigationType`/`from`/`finished`），可做过渡指示。
- **state 仍走结构化克隆**：`navigate({ state })` 的 state 不可克隆抛 `DataCloneError`；与 History 的 state 同源边界一致。
- **不改跨源**：`entries()` 只含同源 entry，`navigate` 的 URL 与安全模型同 History——原生安全边界不变。
- **拦截在下一页**：本页讲"入口/方法/历史栈读写"，`navigate` 事件与 `intercept()` 的完整用法见 [navigate 事件与拦截](./navigate-intercept)。

## 一、window.navigation：新一代入口

Navigation API 通过 `window.navigation`（`Navigation` 接口）访问，每个窗口一个实例：

```js
// 特性检测——2026-01 才进 Baseline，老环境需降级到 History API
if ("navigation" in window) {
  console.log(navigation.currentEntry.url); // 当前条目 URL
  console.log(navigation.entries().length); // 完整历史栈长度
}
```

它把 History API 散落的能力收敛成一套自洽的对象模型：

| 能力 | Navigation API 成员 |
| --- | --- |
| 发起导航 | `navigate` / `reload` / `back` / `forward` / `traverseTo` |
| 读历史栈 | `entries()` / `currentEntry` / `canGoBack` / `canGoForward` |
| 改当前状态 | `updateCurrentEntry({ state })` |
| 拦截导航 | `navigate` 事件 + `event.intercept()`（下一页） |
| 生命周期事件 | `navigatesuccess` / `navigateerror` / `currententrychange` |
| 进行中导航 | `transition` |

## 二、五个导航方法：都返回两个 Promise

Navigation API 最鲜明的现代化，是**每个导航方法都返回一个含两个 Promise 的对象**：

```js
const { committed, finished } = navigation.navigate("/articles/");
await committed; // URL 已变、新历史条目已建立
await finished; // intercept() 的 handler 也全跑完了，内容就绪
```

| 方法 | 作用 | 说明 |
| --- | --- | --- |
| `navigate(url, options?)` | 导航到新 URL、建历史条目 | `options`：`state`/`info`/`history`；见下 |
| `reload(options?)` | 重载当前条目 | `options`：`state`/`info` |
| `back()` | 后退一条 | 无参；`canGoBack` 为假时拒绝 |
| `forward()` | 前进一条 | 无参；`canGoForward` 为假时拒绝 |
| `traverseTo(key, options?)` | 跳到 key 指定的条目 | key 见第四节；`options`：`info` |

### 2.1 navigate 的 options

```js
navigation.navigate("/products/42", {
  // state：与新历史条目绑定的结构化克隆数据，之后 entry.getState() 读取
  state: { productId: 42, from: "list" },
  // info：只传给本次 navigate 事件的一次性信息（不持久化），常用于指示动画方向
  info: { animation: "swipe-left" },
  // history：入栈方式
  history: "push", // "auto"（默认，通常等价 push）| "push" | "replace"
});
```

- **`state`**：持久化在该历史条目上，经 `entry.getState()` 取回；不可结构化克隆抛 `DataCloneError`。
- **`info`**：**不持久化**，只在本次 `navigate` 事件里经 `event.info` 可读——适合"这次用哪个转场动画"这类一次性提示。
- **`history`**：`"push"` 推新条目、`"replace"` 替换当前条目、`"auto"`（默认）通常等价 push（特殊情况下降级 replace）。`"push"` 在 `about:blank` 等特殊文档上会抛 `NotSupportedError`。

### 2.2 committed 与 finished 的分工

```js
async function go() {
  const result = navigation.navigate("/dashboard", { state: { tab: "home" } });

  await result.committed; // ① 地址栏已更新、新 entry 已入栈——可以更新"当前路由"指示
  await result.finished; // ② intercept 的 handler 全部完成——内容真正渲染好
}
```

- **`committed`**：可见 URL 已变更、新 `NavigationHistoryEntry` 已创建时兑现。
- **`finished`**：`intercept()` 中所有 handler 返回的 Promise 都兑现时兑现（等价 `navigatesuccess` 事件）；任一失败则 `finished` 拒绝（等价 `navigateerror`）。

这套双 Promise 让"URL 已切"和"内容已就绪"成为两个可分别 await 的时刻——History API 完全没有的生命周期。

## 三、读完整历史栈：entries 与 currentEntry

这是 Navigation API 相对 History API 的**质变能力**。History 只能读"当前一个" state，Navigation 能读**完整同源历史栈**：

```js
// 遍历完整同源会话历史——每个 entry 的 url/state/key/index 都可读
for (const entry of navigation.entries()) {
  console.log(entry.index, entry.url, entry.getState());
}

// 当前条目
const cur = navigation.currentEntry;
console.log(cur.url, cur.key, cur.index, cur.getState());

// 直接问"能不能前进后退"——History API 问不出来
if (navigation.canGoBack) navigation.back();
```

- **`entries()`**：返回 `NavigationHistoryEntry[]`，**仅含同源条目**（跨源导航与 iframe 不暴露，安全边界与 History 一致）。
- **`currentEntry`**：当前所在条目。
- **`canGoBack` / `canGoForward`**：布尔值，替代 History API 里"back 越界静默无效、无从预判"的窘境。

## 四、traverseTo 与 key：直达任意历史 slot

`traverseTo(key)` 跳到 **key** 标识的历史条目。理解 key 的语义是用好它的前提：

::: tip key 是什么
**`key` 是浏览器（UA）为每个历史"slot"生成的唯一、不可变标识**。它标记的是历史栈里的"**位置/槽位**"，而非"某次导航实例"——用户在这个 slot 上前进后退、甚至重新导航覆盖，只要还是同一个 slot，key 就不变。因此**存下某个 entry 的 key，之后随时能 `traverseTo` 回到它**，这是"永远回首页"按钮的标准实现。
:::

```js
// 应用启动：记下首屏条目的 key
const homeKey = navigation.currentEntry.key;

// 用户在应用里逛了很多页之后……
homeButton.addEventListener("click", () => {
  // 直达首屏 slot——无论中间隔了多少条历史
  navigation.traverseTo(homeKey);
});
```

- **key 不存在则拒绝**：若历史栈里已无该 key 对应的条目（例如被前进操作覆盖清出），`traverseTo` 抛 `InvalidStateError`。
- **只在同源栈内有效**：key 只对当前同源会话历史有意义。

## 五、NavigationHistoryEntry：一个条目的全部信息

`entries()`、`currentEntry`、`navigate` 事件的 `event.destination` 里拿到的都是 `NavigationHistoryEntry`。它的字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `getState()` | 方法 | 读该条目绑定的**结构化克隆 state**（对标 `history.state`，但**任意条目都能读**） |
| `url` | string | 该条目的 URL |
| `key` | string | **slot 标识**——同一位置复用则不变，用于 `traverseTo`（见第四节） |
| `id` | string | **该 entry 实例的唯一 id**——每次导航产生新 entry 就换新 id，用于精确追踪 |
| `index` | number | 该条目在 `entries()` 数组中的位置（当前之前为更早历史） |
| `sameDocument` | boolean | 该条目是否为**同文档导航**（SPA 内 vs 真正跨文档加载） |
| `dispose` 事件 | event | 该条目被移出历史栈时触发（见 [迁移与模式](./migration-patterns)） |

### 5.1 key 与 id 的区别（易混）

```js
const entry = navigation.currentEntry;
console.log(entry.key); // slot 标识：认"位置"，reload/traverse 回来仍相同
console.log(entry.id); // 实例标识：认"这一次"，每次新导航都不同
```

- **`key` 认位置**：用来做"回到这个位置"（`traverseTo(key)`）。
- **`id` 认实例**：用来判断"这是不是同一次导航产生的那条 entry"，做精确的缓存键或埋点。

一句话：**要"回去"用 key，要"认出这一次"用 id**。

## 六、updateCurrentEntry：只改 state 不导航

想更新当前条目的 state、又不想产生任何导航（不新增历史、不触发内容切换），用 `updateCurrentEntry`：

```js
// 用户展开了侧栏——把这个 UI 状态记进当前历史条目，但不导航
navigation.updateCurrentEntry({
  state: { ...navigation.currentEntry.getState(), sidebarOpen: true },
});
```

它对标 History API 里"`replaceState(newState, "", location.href)` 只为改 state"的用法，但语义更聚焦：**只改当前 entry 的 state，URL 不变、不导航、不入栈**。注意它会触发 `currententrychange` 事件（`navigationType` 为 `null`），不会触发 `navigate` 事件（因为没有导航发生）——这个区别在 [迁移与模式](./migration-patterns) 展开。

## 七、相比 History API 的四大改进（对照收束）

把 [History API 页](./history-api) 末尾的"四宗罪"逐条对上 Navigation API 的解法：

| History API 缺口 | Navigation API 解法 |
| --- | --- |
| ① 读不到完整历史栈 | **`entries()`** 返回完整同源栈，每条 `url`/`getState()`/`key`/`index` 可读 |
| ② 改不了非当前 entry | 任意条目 `getState()` 可读；当前条目 `updateCurrentEntry` 精确改 |
| ③ `popstate` 不因 push/replace 触发 | **一个 `navigate` 事件**统一响应所有导航，配 `currententrychange` 追踪当前条目变化 |
| ④ 感知不到所有导航来源 | `navigate` 事件捕获**点链接/表单提交/`go`/`navigate()`** 等所有同源导航，`intercept()` 一处接管 |

外加两项 History API 完全没有的现代化：**Promise 化的 committed/finished 生命周期**，以及 `canGoBack`/`canGoForward` 的可预判导航能力。

下一页进入 Navigation API 的核心——`navigate` 事件与 `intercept()`：如何用一个事件、一次拦截，实现完整的 SPA 客户端路由。见 [navigate 事件与拦截](./navigate-intercept)。
