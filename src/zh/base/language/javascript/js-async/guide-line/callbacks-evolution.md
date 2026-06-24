---
layout: doc
outline: [2, 3]
---

# 回调与回调地狱

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **回调（callback）**：把「之后做什么」作为函数传给异步操作，由它在完成时调用——异步的第一代解法
- **错误优先约定（error-first）**：Node 风格回调签名 `(err, data) => {}`，第一个参数恒为错误，无错则为 `null`
- **回调地狱（callback hell）**：多个有依赖的异步操作层层嵌套，代码向右缩进成「金字塔」，难读难维护
- **错误难捕获**：`try`/`catch` **抓不到**异步回调里抛的错——错误在另一个事件循环轮次、另一条栈上发生
- **控制反转（inversion of control）**：你把回调交给第三方，它**何时调、调几次、传什么**全凭它，信任无法保证
- **Zalgo 问题**：同一 API 时而同步、时而异步地触发回调，会引发难以复现的诡异 bug；要么恒异步
- **演进动力**：以上痛点正是 `Promise` 诞生的理由——把控制权**还给调用方**，并提供统一的链式与错误模型

## 回调：异步的第一代解法

在 `Promise` 之前，JavaScript 处理异步只有一招：把「结果就绪后要做的事」写成一个函数，作为参数传给异步 API，由它在合适时机回过头来调用——这就是**回调**。

```js
// setTimeout、事件监听、旧式 XHR……全是回调模式
console.log("发起");
setTimeout(() => {
  console.log("1 秒后由浏览器调用这个回调");
}, 1000);
console.log("继续，不阻塞");
// 输出：发起 → 继续，不阻塞 →（1 秒后）1 秒后由浏览器调用这个回调
```

回调本身没问题，问题出在**组合**——当多个异步操作需要按顺序依赖时。

## 错误优先约定

Node.js 确立了一套广泛沿用的回调约定：回调的**第一个参数永远是错误对象**，成功时为 `null`，后续参数才是数据。

```js
const fs = require("node:fs");

// 签名约定：(err, data) => {}
fs.readFile("/path/data.txt", "utf8", (err, data) => {
  if (err) {
    console.error("读取失败：", err); // 必须每次手动检查
    return; // 别忘了 return，否则会继续往下跑
  }
  console.log("内容：", data);
});
```

这套约定让错误处理有了统一形态，但也意味着**每一层回调都要重复一遍 `if (err)`**，错误处理逻辑散落各处。

## 回调地狱：金字塔噩梦

当下一步依赖上一步的结果时，回调只能往里嵌套。三四层之后，代码就缩进成一座向右倒的「金字塔」，俗称**回调地狱**（callback hell）或「末日金字塔」：

```js
// 登录 → 取用户 → 取订单 → 取订单详情：每一步都依赖上一步
login(user, (err, token) => {
  if (err) return handle(err);
  getUser(token, (err, profile) => {
    if (err) return handle(err);
    getOrders(profile.id, (err, orders) => {
      if (err) return handle(err);
      getOrderDetail(orders[0].id, (err, detail) => {
        if (err) return handle(err); // 错误处理重复了四遍
        console.log(detail); // 真正的业务逻辑被推到最深处
      });
    });
  });
});
```

它的几宗罪：

- **可读性差**：核心逻辑被挤到最深的缩进里，阅读要从外往里再往外；
- **错误处理重复**：每层都得写一遍 `if (err) return`；
- **难以复用与重构**：嵌套的闭包彼此纠缠，抽取函数很别扭；
- **顺序与并发混在一起**：想让其中两步并行执行，代码会更乱。

## try/catch 抓不到异步错误

这是初学者最容易踩的坑：**同步的 `try`/`catch` 无法捕获异步回调里抛出的异常**。

```js
try {
  setTimeout(() => {
    throw new Error("定时器里炸了");
  }, 1000);
} catch (err) {
  // ❌ 永远进不来！1 秒后回调执行时，这个 try 早已出栈结束
  console.error("抓到了吗？", err);
}
```

原因正是上一页的事件循环：`setTimeout` 的回调在**另一个宏任务、另一条全新的调用栈**上执行，那时包着它的 `try` 块早已执行完毕、弹出栈了。错误无处可去，最终变成全局未捕获异常。这也是为什么回调时代只能靠「错误优先参数」而非 `try`/`catch` 传递错误。

## 控制反转：信任危机

回调地狱是「写法」上的痛，**控制反转**（inversion of control）则是更深层的「信任」之痛。

当你把回调交给一个第三方函数（尤其是你没写的库），你其实交出了对这段代码的**控制权**——它什么时候调、调几次、传什么参数，全由对方决定。一个有 bug 或恶意的第三方可能：

```js
// 你期望：成功后回调被调用恰好一次
thirdPartyCheckout(order, function onSuccess(receipt) {
  chargeCreditCard(receipt); // 扣款
  showThankYou();
});

// 但第三方可能……
// - 一次都不调（用户付了钱却没反应）
// - 调用多次（信用卡被重复扣款！）
// - 同步立即调，而非异步（破坏你对执行时序的假设）
// - 把回调吞进 try/catch，让你的异常神秘消失
// - 传错参数、传 undefined
```

你**无法约束**这些行为——这就是控制反转的信任问题。`Promise` 正是为解决它而生：异步操作返回一个 `Promise` **对象**给你，**控制权回到你手里**——由你来 `.then()` 决定后续，且 `Promise` 状态一旦敲定就不可逆、回调至多触发一次，从机制上堵死了「调多次」「调零次」的隐患。

## Zalgo：别让 API 时同步时异步

还有一类隐蔽的回调陷阱：同一个函数，有时同步调用回调、有时异步调用。社区戏称这是「释放 Zalgo」——会引发极难复现的时序 bug。

```js
// ❌ 反面教材：有缓存走同步、没缓存走异步
function getData(key, cb) {
  if (cache[key]) {
    cb(cache[key]); // 同步：调用方下一行还没执行，回调先跑了
  } else {
    fetchRemote(key, (data) => {
      cache[key] = data;
      cb(data); // 异步：下个事件循环轮次才跑
    });
  }
}

// 调用方根本无法确定下面两行的相对顺序
getData("a", (d) => console.log("回调", d));
console.log("之后"); // 命中缓存时它在「回调」之后，未命中时在之前——非确定！
```

正确做法是**让回调恒定异步**——用 `queueMicrotask` 或 `Promise.resolve().then` 把同步分支也推迟到当前栈之后：

```js
function getData(key, cb) {
  if (cache[key]) {
    queueMicrotask(() => cb(cache[key])); // 强制异步，时序统一
  } else {
    fetchRemote(key, (data) => {
      cache[key] = data;
      cb(data);
    });
  }
}
```

`Promise` 在规范层面就保证了「`then` 的回调**永不同步**触发」，等于内建免疫了 Zalgo——这又是一条选择 `Promise` 的理由。

## 小结

回调是异步的起点，但**金字塔嵌套、错误难捕获、控制反转、Zalgo** 四重痛点，让它在复杂场景下难以为继。下一页登场的 `Promise`，用一个「代表未来值」的对象把控制权还给调用方、用链式拉平嵌套、用统一的错误冒泡取代散落的 `if (err)`：[Promise 基础与状态机](./promise-basics)。
