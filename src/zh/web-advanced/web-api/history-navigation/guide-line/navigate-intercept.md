---
layout: doc
outline: [2, 3]
---

# navigate 事件与 intercept：SPA 路由内核

> 基于 WHATWG HTML（导航与会话历史）现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一个事件拦一切**：`navigation.addEventListener("navigate", …)` 捕获**所有同源导航**——点链接、提交表单、`history.go()`、`navigation.navigate()`、地址栏改 hash 等，统一入口。
- **`event.intercept(options)`**：把这次导航转成 SPA 单页导航——浏览器接管**地址栏更新、历史栈维护、滚动、焦点**，你只在 handler 里渲染内容。
- **`intercept` 的两个 handler**：`handler`（**URL 提交后**跑，换内容）、`precommitHandler`（**URL 提交前**跑，可取数/校验/重定向，保留旧内容可见）。
- **`canIntercept`**：能否拦截；为 `false`（跨源、下载等）时调 `intercept()` 抛 `SecurityError`——**拦前必查**。
- **`hashChange`**：本次是否纯 hash 变化；SPA 路由通常 `if (event.hashChange) return;` 放行。
- **`downloadRequest`**：非 `null` 表示是下载链接（`<a download>`）——应放行不拦。
- **`formData`**：非 `null` 表示是表单提交（POST 同源）；可在 handler 里 `fetch` 提交，`focusReset`/`scroll` 设 `"manual"`。
- **`userInitiated`**：是否用户手势触发（点链接 vs JS 调 `navigate`）；`navigationType`：`"push"`/`"replace"`/`"reload"`/`"traverse"`。
- **`event.destination`**：目标条目信息（`url`/`getState()`/`index`/`sameDocument`/`key`/`id`）。
- **`event.info`**：`navigate(url, { info })` 传入的一次性信息（如动画方向）；`event.signal`：随导航取消而 abort 的 `AbortSignal`。
- **`precommitHandler(controller)`**：`controller.redirect(url, { state, history })` 提交前重定向；`controller.addHandler(cb)` 追加提交后 handler；**仅 `cancelable` 的事件可用**，否则 `SecurityError`。
- **`focusReset`**：`"after-transition"`（默认，handler 完成后聚焦 `autofocus` 元素或 `<body>`）/ `"manual"`（自己管焦点）。
- **`scroll`**：`"after-transition"`（默认，push/replace 滚到 fragment 或顶部；traverse/reload 延迟到 handler 完成再恢复）/ `"manual"`（自己控，配 `event.scroll()` 提前触发）。
- **完成事件**：handler 全成功 → `navigatesuccess` + `finished` 兑现；任一失败 → `navigateerror` + `finished` 拒绝。
- **`signal` 取消**：新导航打断旧导航时 `event.signal` abort——把它透传给 `fetch(url, { signal: event.signal })`，旧请求自动取消。
- **重定向用 precommit**：未登录拦截跳登录页，用 `precommitHandler` 的 `redirect()`（提交前改目标），比 handler 里再导航更干净。
- **别拦不该拦的**：跨源、下载、`canIntercept` 为假、纯 hash（按需）——先 `return` 放行，再拦真正的应用内路由。
- **框架关系**：这套"一个事件 + intercept"正是路由库梦寐以求的内核，框架正逐步在内部采用；业务里仍多用框架路由 API（见 [迁移与模式](./migration-patterns)）。

## 一、navigate 事件：所有导航的统一入口

History API 时代做 SPA 路由，你得"全局监听 `click` → `preventDefault` → 手动 `pushState` → 手动渲染"，还拦不住表单提交、`history.go()`、地址栏操作。Navigation API 用**一个 `navigate` 事件**收敛了这一切：

```js
navigation.addEventListener("navigate", (event) => {
  // 这里能收到：点链接、提交表单、history.go()、navigation.navigate()、
  // 地址栏改 hash……几乎所有同源导航
});
```

事件对象 `NavigateEvent` 携带判断这次导航"是什么"的全部信息，先据此决定**拦还是放**，再用 `intercept()` 接管。

## 二、拦截前必查的几个属性

不是所有导航都该被 SPA 拦截（跨源、下载、外链等要放行）。标准的守卫写法：

```js
navigation.addEventListener("navigate", (event) => {
  // ① 不能拦的（跨源、非同文档等）直接放行——否则 intercept() 抛 SecurityError
  if (!event.canIntercept) return;
  // ② 纯 hash 变化：SPA 通常交给锚点行为，不当路由处理
  if (event.hashChange) return;
  // ③ 下载链接（<a download>）：放行给浏览器下载
  if (event.downloadRequest !== null) return;

  // 走到这里，才是要接管的应用内导航
  const url = new URL(event.destination.url);
  event.intercept({
    async handler() {
      render(await loadView(url.pathname));
    },
  });
});
```

关键判断属性：

| 属性 | 类型 | 含义与用法 |
| --- | --- | --- |
| `canIntercept` | boolean | 能否拦截；`false` 时调 `intercept()` 抛 `SecurityError`。跨源、部分特殊导航为 `false`——**拦前必查** |
| `hashChange` | boolean | 是否纯 fragment 变化；SPA 路由多 `return` 放行 |
| `downloadRequest` | string \| null | 非 `null` 为下载链接（值为下载文件名）——放行 |
| `formData` | `FormData` \| null | 非 `null` 为表单提交——见第五节 |
| `userInitiated` | boolean | 是否用户手势触发（区分点链接与 JS 主动导航） |
| `navigationType` | string | `"push"` / `"replace"` / `"reload"` / `"traverse"` |
| `destination` | object | 目标条目：`url` / `getState()` / `index` / `sameDocument` / `key` / `id` |
| `info` | any | `navigate(url, { info })` 传入的一次性信息（如动画方向） |
| `signal` | `AbortSignal` | 本次导航被取消时 abort——透传给 `fetch` 做取消 |

## 三、intercept：handler 与 precommitHandler

`event.intercept(options)` 是核心。`options` 里两个回调的**时序**是理解全局的钥匙：

```
navigate 事件触发
   │
   ├─ precommitHandler(controller) 运行 ← URL 尚未变、旧内容仍可见；可重定向/取数/校验
   │        （其 Promise 兑现后才提交）
   ▼
【提交 commit】URL 更新、新 entry 入栈、currentEntry 变、committed Promise 兑现
   │
   ├─ handler() 运行 ← URL 已变；渲染新内容
   ▼
handler Promise 兑现 → navigatesuccess + finished 兑现
```

### 3.1 handler：提交后换内容（最常用）

`handler` 在导航**提交之后**运行——此时地址栏已更新、`currentEntry` 已切换。绝大多数 SPA 路由只需要它：

```js
event.intercept({
  async handler() {
    // URL 已经是目标 URL 了，这里只管渲染
    renderPlaceholder(); // 可先渲染骨架屏
    const content = await getArticleContent(url.pathname);
    renderArticlePage(content);
  },
});
```

### 3.2 precommitHandler：提交前介入（取数/校验/重定向）

`precommitHandler` 在导航**提交之前**运行——URL 还没变、旧内容仍在屏幕上。适合"想先把数据取好、保留旧页面可见，等就绪再切 URL 和内容"，或做访问校验与重定向。它接收一个 `NavigationPrecommitController`：

```js
event.intercept({
  async precommitHandler(controller) {
    // URL 尚未改变、旧内容仍可见——先取数据
    const data = await prefetch(url.pathname);
    // controller.redirect() 可在提交前改道；这里不改道，正常提交
    stash(data); // 存起来给 handler 用
  },
  async handler() {
    // 提交后：URL 已变，用 precommit 取好的数据渲染
    render(unstash());
  },
});
```

::: warning precommitHandler 只在可取消的导航上可用
`precommitHandler` 仅当 `event.cancelable === true` 时合法，否则 `intercept()` 抛 `SecurityError`。像 `traverse`（用户前进后退）这类不可取消的导航用不了 precommit——那种场景把逻辑放进 `handler` 即可。
:::

### 3.3 controller.redirect：提交前重定向（鉴权拦截）

`precommitHandler` 的最大价值是**在 URL 提交前改道**——典型是"未登录访问受限页，直接重定向到登录页"，用户地址栏**不会**先闪一下受限 URL：

```js
navigation.addEventListener("navigate", (event) => {
  if (!event.canIntercept) return;
  const url = new URL(event.destination.url);

  if (url.pathname.startsWith("/restricted/") && !userSignedIn) {
    event.intercept({
      async precommitHandler(controller) {
        // 提交前直接改道到登录页——地址栏不会先显示 /restricted/
        controller.redirect("/signin/", {
          state: "signin-redirect",
          history: "push",
        });
        // addHandler：为改道后的 /signin/ 追加一个提交后 handler
        controller.addHandler(() => {
          showMessage("请先登录后再访问该内容。");
        });
      },
    });
  }
});
```

`controller` 两个方法：`redirect(url, { state, history })` 提交前重定向；`addHandler(cb)` 动态追加一个提交后运行的 handler。

## 四、scroll 与 focusReset：无障碍与体验的默认接管

`intercept()` 的 `options` 还能控制导航后的**滚动**与**焦点**——这两件事浏览器默认帮你做对（这也是 Navigation API 相对手搓路由在无障碍上的优势）。

### 4.1 focusReset

| 取值 | 行为 |
| --- | --- |
| `"after-transition"`（默认） | handler 完成后，浏览器聚焦到第一个带 `autofocus` 的元素，否则聚焦 `<body>`——屏幕阅读器能感知"页面变了" |
| `"manual"` | 关闭自动焦点重置，你自己 `element.focus()` |

### 4.2 scroll

| 取值 | 行为 |
| --- | --- |
| `"after-transition"`（默认） | **push/replace**：滚到 URL 中的 fragment 或页面顶部；**traverse/reload**：浏览器**延迟**滚动恢复到 handler 的 Promise 兑现后（内容渲染好才恢复位置，Promise 拒绝或用户中途滚动则不恢复） |
| `"manual"` | 关闭自动滚动，你自己控；可用 `event.scroll()` 在 handler 中**提前**触发滚动 |

```js
event.intercept({
  scroll: "manual",
  async handler() {
    render(await loadView(url.pathname));
    // 内容就位后手动滚动（例如滚到锚点或保存的位置）
    event.scroll();
  },
});
```

对比 History API 时代要自己读写 `scrollRestoration`、手动 `scrollTo`、还常滚错时机——Navigation API 把"traverse 时延迟到内容就绪再恢复滚动"这个最难做对的点直接代管了。

## 五、表单提交：formData 一并接管

`navigate` 事件也捕获**同源表单提交**，`event.formData` 非 `null` 即是。可以在 handler 里用 `fetch` 提交，因为 DOM 不换视图，通常关掉 focus/scroll 重置：

```js
navigation.addEventListener("navigate", (event) => {
  if (event.formData && event.canIntercept) {
    event.intercept({
      focusReset: "manual", // 不换视图，别乱动焦点
      scroll: "manual", // 不换视图，别乱滚
      async handler() {
        await fetch(event.destination.url, {
          method: "POST",
          body: event.formData,
          signal: event.signal, // 导航被取消则请求一起取消
        });
        // 可选：提交成功后再 navigation.navigate(...) 去结果页
      },
    });
  }
});
```

## 六、完成事件与 signal 取消

### 6.1 navigatesuccess / navigateerror

```js
navigation.addEventListener("navigatesuccess", () => {
  hideSpinner(); // 所有 intercept handler 成功、finished 兑现
});
navigation.addEventListener("navigateerror", (event) => {
  showError(event.message); // 有 handler 失败、finished 拒绝
});
```

- `navigatesuccess`：本次导航的所有 `intercept()` handler 的 Promise 都兑现后触发，对应 `navigate()` 返回的 `finished` 兑现。
- `navigateerror`：任一 handler 拒绝时触发，`finished` 拒绝；`event.message`/`event.error` 携带原因。

### 6.2 signal：导航被打断即取消

`event.signal` 是随本次导航生命周期的 `AbortSignal`——当**新导航打断旧导航**（用户快速点了另一个链接）时，旧导航的 `signal` 会 abort。把它透传给一切异步操作，就能自动取消陈旧请求：

```js
event.intercept({
  async handler() {
    // 新导航一来，这个 fetch 会因 signal abort 而自动取消，避免竞态
    const res = await fetch(`/api${url.pathname}`, { signal: event.signal });
    render(await res.json());
  },
});
```

这解决了 History API 时代 SPA 路由的经典竞态——快速切页时旧请求晚回来把新页面内容覆盖掉。Navigation API 用 `signal` 把它标准化了。

## 七、一个完整的 SPA 路由骨架

把上述拼起来，一个可运行的最小 SPA 路由内核：

```js
// 只在支持时启用；不支持降级到 History API（见迁移页）
if ("navigation" in window) {
  navigation.addEventListener("navigate", (event) => {
    // 放行不该拦的
    if (!event.canIntercept) return;
    if (event.hashChange || event.downloadRequest !== null) return;

    const url = new URL(event.destination.url);

    // 鉴权：受限区未登录 → 提交前改道登录页
    if (url.pathname.startsWith("/app/") && !isSignedIn()) {
      event.intercept({
        async precommitHandler(controller) {
          controller.redirect("/login/", { history: "replace" });
        },
      });
      return;
    }

    // 常规路由：提交后渲染，signal 防竞态
    event.intercept({
      async handler() {
        renderSkeleton(url.pathname);
        const view = await loadView(url.pathname, { signal: event.signal });
        render(view);
      },
    });
  });

  // 全局加载指示
  navigation.addEventListener("navigatesuccess", hideSpinner);
  navigation.addEventListener("navigateerror", (e) => showError(e.message));
}
```

这份代码没有一处 `pushState`、没有一处 `preventDefault`、没有全局 `click` 监听——浏览器把地址栏、历史栈、滚动、焦点全代管了。这正是"我们一直想要的路由器"。

下一页讲**如何从 History API 迁移过来、如何与框架路由共存、如何优雅降级**——见 [迁移与模式](./migration-patterns)。
