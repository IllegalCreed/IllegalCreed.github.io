---
layout: doc
outline: [2, 3]
---

# 取消与超时：AbortController 体系

> 基于 WHATWG Fetch 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **基本接线**：`const c = new AbortController()` → `fetch(url, { signal: c.signal })` → `c.abort()`——fetch 的 Promise reject，抛 **`AbortError`**（`DOMException`）。
- **超时一行**：`fetch(url, { signal: AbortSignal.timeout(8000) })`——超时 reject 抛 **`TimeoutError`**（`DOMException`），与用户取消**天然可区分**。
- **组合信号**：`AbortSignal.any([userSignal, AbortSignal.timeout(8000)])`——任一触发即中止，**reason 取第一个触发的源信号**，`err.name` 仍可分流。
- **Baseline**：`AbortSignal.timeout()` **Widely available**；`AbortSignal.any()` **Newly available 2024-03**（Chrome 116 / Firefox 124 / Safari 17.4）。
- **Chrome 旧版坑**：Chrome/Edge **103–123 的 `timeout()` 超时误抛 `AbortError`**（124 起才正确抛 `TimeoutError`）——按 name 分流时对老 Chromium 要有兜底分支。
- **信号一次性**：已 aborted 的 signal 再交给 fetch，**立即 reject**；每次请求配新 controller，别复用旧的。
- **abort 晚到也有效**：fetch 已 fulfill 但 body 还没读完时 `abort()`，**读 body 的 Promise 会以 `AbortError` reject**——取消覆盖整个响应体传输期。
- **自定义 reason**：`c.abort(new Error("用户切换了页签"))`——reason 成为 reject 的错误值；不传则默认 `AbortError` DOMException。
- **`signal.aborted` / `signal.reason`**：同步查询是否已中止/中止原因；**`signal.throwIfAborted()`**——已中止则把 reason 抛出来，封装 API 的第一行标配。
- **abort 事件**：`signal.addEventListener("abort", handler, { once: true })`——给自定义异步任务接取消；`once: true` 顺带解决监听器泄漏。
- **错误四分流**：`AbortError`（用户/上层取消 → 静默收尾）、`TimeoutError`（超时 → 提示或重试）、`TypeError`（网络层 → 可重试）、`!response.ok`（HTTP 层 → 按状态码分治）。
- **取消不等于失败**：`AbortError` 是**预期内流程**（组件卸载、搜索词变更），捕获后应静默返回，别往错误上报系统里灌。
- **竞态治理范式**：搜索建议类场景——发新请求前 `abort()` 旧的，只让最后一次的结果落地。
- **重试三前提**：错误可重试（网络类/5xx/429，**4xx 业务错不重试**）+ 方法幂等（GET/PUT/DELETE 天然幂等，**POST 需幂等键**）+ 次数封顶。
- **退避公式**：指数退避 + 随机抖动 `delay = base * 2 ** attempt + random jitter`，尊重 `Retry-After` 响应头；等待期间也要能被 signal 打断。
- **fetch 无内建重试**：需手写或交给 [ky](/zh/web-advanced/js-extension/ky/)/[ofetch](/zh/web-advanced/js-extension/ofetch/)（内建 retry）；本页给出可移植的手写版。

## 一、AbortController：取消的标准接线

fetch 本身没有 `cancel()` 方法——取消能力被抽成了独立的 **AbortController/AbortSignal** 体系（这也是它能被 Streams、WebSocket 封装、`addEventListener` 等任意 API 复用的原因）：

```js
const controller = new AbortController();

// 接线：signal 交给 fetch
const promise = fetch("/api/big-report", { signal: controller.signal });

// 任何时刻取消：比如用户点了"取消"按钮、组件卸载
cancelButton.addEventListener("click", () => controller.abort());

try {
  const response = await promise;
  console.log("完成", response.status);
} catch (err) {
  if (err.name === "AbortError") {
    console.log("已取消"); // 预期内流程，静默处理
  } else {
    throw err;
  }
}
```

三个语义细节：

1. **一次性**：signal 一旦 aborted 永远是 aborted——把用过的 signal 再传给新 fetch 会**立即 reject**。每轮请求 `new AbortController()`。
2. **覆盖全程**：fetch 已 fulfill、body 还在读（`json()`/流式读取中）时 `abort()`，**读取的 Promise 同样以 `AbortError` reject**——取消管到最后一个字节。
3. **reason 可定制**：`controller.abort(customError)` 的参数会成为 reject 的错误值与 `signal.reason`；不传参默认是 name 为 `AbortError` 的 DOMException。

经典应用——**搜索建议的竞态治理**（只要最后一次的结果）：

```js
let controller = null;

async function suggest(keyword) {
  controller?.abort();               // 干掉在途的旧请求
  controller = new AbortController();

  try {
    const res = await fetch(`/api/suggest?q=${encodeURIComponent(keyword)}`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    render(await res.json());        // 能走到这里的必然是最新一次
  } catch (err) {
    if (err.name !== "AbortError") throw err; // 被新请求顶掉是正常流程
  }
}
```

## 二、AbortSignal.timeout()：超时的官方答案

fetch 没有 `timeout` 选项，官方补丁是静态工厂 `AbortSignal.timeout(ms)`——返回一个到点自动中止的信号：

```js
try {
  const res = await fetch("/api/slow", { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
} catch (err) {
  if (err.name === "TimeoutError") {
    console.error("8 秒没等到，提示用户重试");
  } else if (err.name === "AbortError") {
    console.log("被上层取消");
  } else {
    throw err; // TypeError 等网络错误
  }
}
```

它比老手写模式（`setTimeout` + `controller.abort()`）好在两点：

1. **错误可区分**：超时抛 `TimeoutError`，用户取消抛 `AbortError`——手写模式两者都是 `AbortError`，没法对"超时该提示重试、取消该闭嘴"做不同处理（手写要区分只能自定义 abort reason）；
2. **免清理**：不用自己 `clearTimeout`，没有定时器泄漏。

注意超时计时**覆盖整个响应期**：连接建立、头到达、body 传输全算——大文件下载配 `timeout()` 时要按"总时长"而不是"首字节时长"来估。

::: warning 旧 Chromium 兼容注
Chrome/Edge **103–123** 的实现有偏差：超时抛的是 `AbortError` 而非 `TimeoutError`（BCD 标注 partial，124 起修正）。要兼容这段老版本，`AbortError` 分支里别把"取消"当成唯一可能。
:::

## 三、AbortSignal.any()：组合信号

真实场景往往同时要"用户能取消"和"超时兜底"——一个 fetch 只收一个 signal，**`AbortSignal.any(signals)`** 把多个信号并成一个（任一触发即中止），语义对标 `Promise.race`：

```js
const controller = new AbortController(); // 用户侧取消

try {
  const res = await fetch("/api/report", {
    // 任一先触发即中止本次请求
    signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
} catch (err) {
  if (err.name === "AbortError") {
    // controller.abort() 触发的
  } else if (err.name === "TimeoutError") {
    // timeout 信号触发的
  } else {
    throw err;
  }
}
```

关键语义：**组合信号的 `reason` 取第一个触发的源信号的 reason**——所以 `TimeoutError`/`AbortError` 的分流在组合后依然成立。层层传递的场景（组件树逐层往下传 signal，每层可以再加自己的超时）尤其顺手：

```js
// 每层封装都能"叠加"自己的中止条件，而不破坏上游的
async function fetchWithLayerTimeout(url, { signal, timeout = 5000 } = {}) {
  const merged = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(timeout)])
    : AbortSignal.timeout(timeout);
  return fetch(url, { signal: merged });
}
```

`AbortSignal.any()` 为 **Baseline Newly available 2024-03**（Chrome 116 / Firefox 124 / Safari 17.4）；不能用它兜底的老环境，退化写法是手动给多个源信号挂 abort 监听转发到一个新 controller。

## 四、错误分类处理：一张完整分流样板

把[入门页](../getting-started)的三层错误面加上取消维度，得到 fetch 错误处理的完整分流：

```js
/**
 * fetch 错误分类处理的标准样板
 * 返回 JSON；把所有失败面归类为可决策的错误类型
 */
async function fetchJSON(url, { signal, timeout = 8000, ...options } = {}) {
  const merged = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(timeout)])
    : AbortSignal.timeout(timeout);

  let response;
  try {
    response = await fetch(url, { ...options, signal: merged });
  } catch (err) {
    switch (err.name) {
      case "AbortError":   // 上层取消：预期内，原样上抛由调用方静默
        throw err;
      case "TimeoutError": // 超时：可提示、可重试
        throw Object.assign(new Error(`请求超时（${timeout}ms）`), { retryable: true });
      default:             // TypeError：断网/DNS/CORS/非法 URL —— 网络层
        throw Object.assign(new Error(`网络错误：${err.message}`), { retryable: true });
    }
  }

  if (!response.ok) {
    // HTTP 层：5xx/429 标记可重试，4xx 是业务错误不重试
    const retryable = response.status >= 500 || response.status === 429;
    throw Object.assign(new Error(`HTTP ${response.status}`), {
      retryable,
      status: response.status,
    });
  }

  return response.json(); // 解析层错误（SyntaxError）留给调用方
}
```

分流原则一句话：**`AbortError` 静默、`TimeoutError`/`TypeError`/5xx 可重试、4xx 找业务、解析错找后端**。

## 五、把取消能力传给自定义 API

封装自己的异步操作（轮询、分片上传、IndexedDB 批处理）时，接受 `signal` 参数是标准姿势——两件事：**进门先查、过程中监听**：

```js
/**
 * 可取消的轮询：演示 signal 的标准消费方式
 */
function poll(url, { interval = 2000, signal } = {}) {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted(); // ① 进门先查：已中止直接抛 reason

    const timer = setInterval(async () => {
      const res = await fetch(url, { signal }); // signal 继续下传给 fetch
      if (res.ok) {
        cleanup();
        resolve(await res.json());
      }
    }, interval);

    const onAbort = () => {
      cleanup();
      reject(signal.reason); // ③ 以 reason 拒绝，错误语义与 fetch 一致
    };
    // ② 过程中监听；once 保证触发后监听器可回收
    signal?.addEventListener("abort", onAbort, { once: true });

    function cleanup() {
      clearInterval(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  });
}
```

这套约定（`throwIfAborted` + `abort` 事件 + 以 `signal.reason` reject）让你的 API 与 fetch 在取消语义上完全同构——上层一个 `AbortSignal.any()` 就能统一治理。

## 六、重试模式与幂等考量

重试不是"失败就再来"，先过三道闸：

1. **错误可重试吗**——网络层 `TypeError`、`TimeoutError`、HTTP 5xx/429 值得重试；**4xx（参数错/未授权/不存在）重多少次都是错**；`AbortError` 更不该重试（用户都取消了）。
2. **方法幂等吗**——GET/HEAD/PUT/DELETE 语义幂等，重试安全；**POST 不幂等**：网络超时时请求可能已到达服务端（只是响应没回来），盲目重试会重复下单/重复扣款——工程解法是**幂等键**（客户端生成唯一 `Idempotency-Key` 头，服务端按键去重）。
3. **有节制吗**——次数封顶 + **指数退避** + **随机抖动**（防止雪崩后所有客户端同一节拍重试，打出"重试风暴"）；服务器给了 `Retry-After` 就尊重它。

```js
/**
 * 带指数退避 + 抖动的重试封装（基于上文 fetchJSON 的 retryable 标记）
 */
async function fetchJSONWithRetry(url, options = {}, { retries = 3, base = 500 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetchJSON(url, options);
    } catch (err) {
      // 不可重试的错误、或次数用尽：原样抛出
      if (!err.retryable || attempt >= retries) throw err;

      // 指数退避 + 全抖动：500ms、1s、2s… 基础上乘 0~1 随机数
      const delay = base * 2 ** attempt * (0.5 + Math.random() * 0.5);
      await sleep(delay, options.signal); // 等待期间也可被取消
    }
  }
}

/** 可被 signal 打断的 sleep —— 等待期不失去取消能力 */
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
```

两个易漏细节都在代码里：**退避等待期间也要能被取消**（否则"取消"按钮在重试间隙失灵）；重试用的 timeout 信号必须**每轮新建**（`AbortSignal.timeout()` 触发过就废了，放循环外只有第一轮有超时）。不想手维护这套逻辑，[ky](/zh/web-advanced/js-extension/ky/)/[ofetch](/zh/web-advanced/js-extension/ofetch/) 都内建了 retry + 退避。

## 七、易错点

- **复用已 aborted 的 signal**：新请求立即 reject——每轮请求配新 controller / 新 `timeout()` 信号（重试循环里尤其要注意）。
- **把 `AbortError` 当故障上报**：取消是预期内流程，灌进错误监控全是噪声——按 name 过滤。
- **手写 setTimeout+abort 还想区分超时**：两者都抛 `AbortError` 分不开——要么 `AbortSignal.timeout()`，要么自定义 abort reason。
- **只兼容 `TimeoutError` 忘了老 Chromium**：Chrome 103–123 超时抛 `AbortError`——低版本存量用户多的产品要双兜底。
- **fulfill 之后就以为安全了**：body 读取期仍会被 abort 打断（`AbortError`）——流式读取的 catch 不能省。
- **组件卸载不取消在途请求**：回调操作已销毁的状态（React 旧版警告 setState on unmounted）——卸载钩子里 `controller.abort()`。
- **4xx 也重试**：业务错误重一万次也是错，还给服务端加压——只重试网络类与 5xx/429。
- **POST 无幂等键就重试**：超时 ≠ 服务端没收到，重复提交事故高发区——幂等键或改造接口。
- **退避无抖动**：故障恢复瞬间所有客户端同节拍打回来，二次雪崩——退避量乘随机因子。
- **自定义 API 收了 signal 却不消费**：调用方以为能取消实际取消不掉——`throwIfAborted` + `abort` 监听 + 下传给内部 fetch，一个都别省。

取消与超时是"单次请求的动态治理"，下一页转向"请求的策略面"——跨域模式、凭据与缓存怎么用选项声明：[请求模式三件套](./cors-credentials-cache)。
