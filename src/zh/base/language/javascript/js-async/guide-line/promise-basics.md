---
layout: doc
outline: [2, 3]
---

# Promise 基础与状态机

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **Promise**：代表异步操作「最终完成或失败」的对象；用 `new Promise((resolve, reject) => {…})` 创建，执行器同步执行
- **三态机**：`pending`（待定）→ `fulfilled`（已兑现，带值）或 `rejected`（已拒绝，带原因）；**一旦敲定（settled）不可逆**，`resolve`/`reject` 多次调用只有第一次有效
- **`then(onF, onR)`**：注册兑现 / 拒绝回调，**返回新 Promise**；两参均可选，回调恒异步（微任务）触发
- **`catch(onR)`**：`then(null, onR)` 的简写，专捕拒绝
- **`finally(onFinally)`**：无论兑现还是拒绝都执行，**不接收值、不改变结果**，常用于清理（关 loading）
- **链式**：`then` 返回新 Promise → 可继续 `.then`，把嵌套拉成直线；handler **返回值**成为下一个 Promise 的兑现值；**返回 Promise 则会被自动展开等待**
- **错误冒泡**：链中任意一步抛错或拒绝，会**跳过后续 `then`**，直奔最近的 `catch`——等价于同步的 `try`/`catch`
- **务必 `return`**：`then` 里发起的 Promise 必须 `return`，否则链不会等它，造成「悬空 Promise」与丢失结果

## 一个对象，三种状态

`Promise` 是一个**对象**，它持有一个异步操作的状态与结果。状态只有三种：

| 状态 | 含义 | 携带 |
| --- | --- | --- |
| `pending` | 待定：操作还没结束 | 无 |
| `fulfilled` | 已兑现：操作成功 | 兑现值（value） |
| `rejected` | 已拒绝：操作失败 | 拒绝原因（reason） |

状态转移是**单向且不可逆**的：`pending` → `fulfilled` 或 `pending` → `rejected`，敲定（settled）之后再也不会变。这条「不可逆」是 `Promise` 比回调可靠的根基——它从机制上保证结果至多产生一次。

```js
// 用构造函数创建 Promise，执行器（executor）会同步立即执行
const p = new Promise((resolve, reject) => {
  // 异步操作完成后，二选一调用：
  const ok = Math.random() > 0.5;
  if (ok) {
    resolve("成功的值"); // pending → fulfilled
  } else {
    reject(new Error("失败的原因")); // pending → rejected
  }
  // 之后再调用 resolve/reject 都无效——状态已敲定
});
```

实际开发中你很少自己 `new Promise`——`fetch`、`fs.promises`、各种 SDK 都已经返回 `Promise`。手写构造函数主要用于**包装老式回调 API**（见 [取消、超时与竞态](./cancellation-timeout) 里的 `Promise.withResolvers`）。

## then / catch / finally

### then(onFulfilled, onRejected)

`then` 给 `Promise` 注册回调，并**返回一个全新的 Promise**（这是链式的关键）：

```js
fetchUser()
  .then(
    (user) => console.log("成功：", user), // onFulfilled
    (err) => console.error("失败：", err), // onRejected（可选）
  );
```

三个要点：

- 两个参数都可选；通常只传第一个，错误交给末尾的 `catch` 统一处理；
- 回调**永不同步执行**——即便 `Promise` 已经敲定，回调也排进微任务队列、等当前同步代码跑完才触发；
- 对同一个 `Promise` 多次 `then`，回调按注册顺序执行。

```js
// 即使 Promise 已 resolved，then 回调也是异步的
Promise.resolve().then(() => console.log("2 微任务"));
console.log("1 同步");
// 输出：1 同步 → 2 微任务
```

### catch(onRejected)

`catch(fn)` 就是 `then(null, fn)` 的语法糖，专门处理拒绝：

```js
doSomething()
  .then((res) => useResult(res))
  .catch((err) => console.error("出错：", err)); // 捕获前面任意一步的错误
```

### finally(onFinally)

无论兑现还是拒绝，`finally` 的回调都会执行。它**不接收任何参数**，也**不改变** `Promise` 的结果（除非自己抛错），最适合做「无论成败都要做」的清理：

```js
showLoading();
fetchData()
  .then((data) => render(data))
  .catch((err) => showError(err))
  .finally(() => hideLoading()); // 成功失败都关掉 loading
```

## 链式：把嵌套拉成直线

回调地狱的解药就在「`then` 返回新 Promise」这个设计上——它让你能一路 `.then()` 下去，把金字塔嵌套拉成一条扁平的链：

```js
// 对比回调地狱版本（见上一页），这里是一条直线
login(user)
  .then((token) => getUser(token)) // 返回 Promise
  .then((profile) => getOrders(profile.id)) // 上一步的兑现值传进来
  .then((orders) => getOrderDetail(orders[0].id))
  .then((detail) => console.log(detail))
  .catch((err) => handle(err)); // 一个 catch 兜住全链
```

### 返回值如何在链上流动

`then` 回调的**返回值**决定下一个 `Promise` 的兑现值，有两种情况：

```js
Promise.resolve(5)
  .then((x) => x * 2) // 返回普通值 10 → 下个 Promise 兑现为 10
  .then((x) => x + 3) // 收到 10，返回 13
  .then((x) => console.log(x)); // 13
```

如果回调**返回一个 Promise**，链会**自动等它敲定**，再把它的兑现值往下传（这叫「展开 / 同化」）：

```js
Promise.resolve("/api/user")
  .then((url) => fetch(url)) // 返回 Promise<Response>
  .then((res) => res.json()) // 链等 fetch 完成后才把 Response 传进来
  .then((data) => console.log(data));
```

### 必须 return，否则链不等它

最常见的链式 bug 是**忘了 `return`**——没返回的 Promise 成了「悬空 Promise」，链不会等它，下一步拿到 `undefined`：

```js
// ❌ 漏了 return：链不等 fetch，listOfIngredients 还是空的
doSomething()
  .then((url) => {
    fetch(url).then((res) => res.json()).then((d) => listOfIngredients.push(d));
  })
  .then(() => console.log(listOfIngredients)); // []！上面的 fetch 还没回来

// ✅ 加上 return：链等内部 Promise 敲定后再继续
doSomething()
  .then((url) => {
    return fetch(url).then((res) => res.json()).then((d) => listOfIngredients.push(d));
  })
  .then(() => console.log(listOfIngredients)); // 拿到数据
```

口诀：**在 `then` 里发起的每个 Promise，都要 `return`**（用 `async`/`await` 能从根本上避免这个坑，见下一节链接）。

## 错误冒泡：跳过 then 直奔 catch

`Promise` 链的错误处理优雅在于：**任意一步抛出异常或返回拒绝的 Promise，都会跳过其后所有 `then`，直接落到最近的 `catch`**——和同步 `try`/`catch` 的行为一一对应。

```js
// Promise 链
doSomething()
  .then((result) => doStep2(result)) // 若这里抛错…
  .then((r2) => doStep3(r2)) // …这步被跳过
  .then((r3) => doStep4(r3)) // …这步也被跳过
  .catch((err) => console.error(err)); // 直接到这

// 等价的同步代码
try {
  const result = doSomethingSync();
  const r2 = doStep2Sync(result); // 抛错
  const r3 = doStep3Sync(r2); // 跳过
  const r4 = doStep4Sync(r3); // 跳过
} catch (err) {
  console.error(err); // 直达
}
```

一个 `catch` 放在链尾，就能兜住链上**任何一环**的错误，这远胜回调时代每层重复的 `if (err) return`。

### catch 之后链可以继续

`catch` 同样返回新 Promise——如果它没有再抛错，链会**恢复为兑现状态**继续往下走，这可用于「错误降级」：

```js
fetchFromCDN()
  .catch(() => fetchFromBackup()) // CDN 失败就退而求其次，链继续
  .then((data) => render(data)) // 无论走 CDN 还是备份，都到这
  .catch((err) => showError(err)); // 两个源都挂了才到这
```

### 局部 catch：嵌套实现作用域化错误处理

绝大多数时候用扁平链 + 末尾单 `catch`。但若某一步「失败了也无所谓、想就地吞掉、不影响主流程」，可以**故意嵌套**一小段、给它单独的 `catch`：

```js
doCritical()
  .then((result) =>
    doOptional(result) // 可选步骤
      .then((opt) => doExtraNice(opt))
      .catch(() => {}), // 只吞掉可选步骤的错，主链不受影响
  )
  .then(() => moreCritical())
  .catch((err) => console.error("关键步骤失败：", err)); // 关键错误仍会被捕获
```

内层 `catch` 只负责它那段嵌套链，捕获不到 `doCritical()` 的错误——后者仍由外层 `catch` 兜底。

## 未处理的拒绝（unhandledrejection）

如果一个被拒绝的 `Promise` 始终没有 `catch`，宿主会发出全局警告，便于发现「漏接的错误」：

```js
// 浏览器
window.addEventListener("unhandledrejection", (event) => {
  console.error("未处理的拒绝：", event.reason);
  // event.preventDefault(); // 阻止默认的控制台报错
});

// Node.js
process.on("unhandledRejection", (reason, promise) => {
  console.error("未处理的拒绝：", reason);
});
```

养成「每条链都以 `catch` 收尾」的习惯，能避免错误被静默吞掉。

## 小结

`Promise` 用**不可逆的三态机**保证结果至多一次，用**链式**拉平嵌套，用**错误冒泡**取代散落的 `if (err)`——回调时代的四宗罪一次性解决。但单个 `Promise` 只管一件异步事；当你要**同时**处理一批异步、或在它们之间「赛跑」时，需要组合器：下一页 [Promise 组合器](./promise-combinators)。
