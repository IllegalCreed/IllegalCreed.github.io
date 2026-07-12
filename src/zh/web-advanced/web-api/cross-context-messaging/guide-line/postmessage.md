---
layout: doc
outline: [2, 3]
---

# window.postMessage：跨源点对点与两条安全铁律

> 基于 WHATWG HTML（跨文档消息 / 通道消息 / 广播频道）现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **定位**：`window.postMessage` 是**跨越同源策略、在两个窗口 / 文档间点对点传消息**的标准方法——`<iframe>`、`window.open` 弹窗、跨源窗口通信的唯一合法通道。
- **签名**：`目标window.postMessage(message, targetOrigin, transfer?)` 或 `postMessage(message, { targetOrigin, transfer })`。
- **`message`**：走**结构化克隆**，对象 / `Date` / `Map` / `Set` / `ArrayBuffer` / `Blob` 直接传；函数、DOM 节点、类方法传不了（`DataCloneError`）。
- **`targetOrigin`（第二参数）**：指定接收方**必须匹配的源**（scheme + host + port 全等）才收得到；省略默认 `"/"`（仅同源）。
- **安全铁律①**：**`targetOrigin` 别用 `*` 传敏感数据**——MDN 原文「A malicious site can change the location of the window without your knowledge, and therefore it can intercept the data sent using postMessage」，恶意站点可改窗口位置截获数据。
- **接收**：`window.addEventListener("message", (event) => {...})`；关键字段 `event.data` / `event.origin` / `event.source` / `event.ports`。
- **安全铁律②（头号安全点）**：**接收端必须先校验 `event.origin`**——`if (event.origin !== 期望源) return;`，非白名单一律丢弃；不想收任何跨站消息就干脆别挂 `message` 监听。
- **`event.origin`**：发消息那一刻发送窗口的源，是**唯一可信的身份依据**。
- **`event.source`**：发送窗口的引用，**用来安全回复**（`event.source.postMessage(...)`）；它是回信地址、**不是身份凭证**，身份看 `origin`。
- **还要校验消息结构**：验完来源仍要验数据形状 / 类型——否则被信任站点的一个 XSS 就顺着消息链传染成你的 XSS。
- **`iframe.contentWindow`**：父 → 子，`iframe.contentWindow.postMessage(data, 子源)`；等 `<iframe>` `load` 后再发。
- **`window.opener`**：`window.open` 打开的弹窗用 `window.opener.postMessage(...)` 回主窗口；主窗口用 `popup.postMessage(...)` 发过去。
- **`transfer`（第三参数）**：Transferable 对象（`ArrayBuffer` / `MessagePort` / `ImageBitmap` 等）**零拷贝移交所有权**，移交后原上下文不可再用。
- **`data:` URL 特例**：目标是 `data:` URL 这类不透明源时，只能用 `targetOrigin = "*"`（它没有确定的源可匹配）。
- **`SharedArrayBuffer` 跨源**：需跨源隔离（`Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`），`Window.crossOriginIsolated` 为 `true` 才行。
- **别回声成环**：父子互发同一 `type` 容易打成死循环——用不同 `type` 或加处理标记。
- **Baseline**：`window.postMessage` 全浏览器 Baseline（十余年），可放心使用。

## 一、它解决什么：同源策略的唯一合法出口

同源策略禁止一个窗口直接读另一个跨源窗口的变量、DOM、`document`。但现实里父页面要与嵌入的第三方 `<iframe>`（支付、登录、地图）通信、要与 `window.open` 出来的 OAuth 弹窗通信——`window.postMessage` 就是这条受控通道：它**允许跨源发送消息，但把安全责任交给发送端（限定收方）和接收端（校验发方）双向把关**。

```js
// 通用形态：拿到目标窗口的引用 → postMessage
otherWindow.postMessage(message, targetOrigin, transfer);
```

- `otherWindow`：目标窗口引用——可能是 `iframe.contentWindow`、`window.open()` 的返回值、`window.opener`、`window.frames[i]`、或 `event.source`。
- `message`：任意可结构化克隆的数据。
- `targetOrigin`：**限定谁能收到**（第二节）。
- `transfer`：可选，要移交所有权的 Transferable 列表（第六节）。

## 二、安全铁律①：发送端 `targetOrigin` 不能用 `*` 传敏感数据

第二参数 `targetOrigin` 指定「接收窗口必须是这个源，消息才投递」。它匹配 scheme + hostname + port，必须精确相等。

```js
// ✅ 明确写死对方的源：即便对方窗口被导航到别处，消息也不会投错
popup.postMessage({ token: SESSION_TOKEN }, "https://secure.example.net");

// ❌ 危险：把敏感数据发给任意源
popup.postMessage({ token: SESSION_TOKEN }, "*");
```

为什么 `*` 危险——MDN 原文（直译保留原义）：

> **Always specify an exact target origin, not `*`, when you use `postMessage` to dispatch data to other windows.** 恶意站点可以在你不知情的情况下改变目标窗口的地址（location），从而截获用 `postMessage` 发送的数据。

也就是说：你以为在跟 `https://secure.example.net` 通信，但那个窗口可能已经被导航到 `https://evil.example`，用 `*` 就等于把 token 直接送给攻击者。**凡是携带敏感信息（令牌、个人数据、密钥）的消息，`targetOrigin` 必须写死对方确切的源。**

例外：目标是 `data:` URL 或 `file:` 这类**不透明源**（opaque origin）时没有确定的源可匹配，只能用 `"*"`——但这种通道本就不该传敏感数据。

## 三、安全铁律②：接收端必须校验 `event.origin`（头号安全点）

接收方给自己的 `window` 挂 `message` 监听。**收到的每一条消息都可能来自任何窗口**——iframe 层级里从顶到底任何一个文档（包括 `http://evil.example`）都能给你发消息。所以：

```js
window.addEventListener("message", (event) => {
  // ⭐ 头号安全点：先验来源，非白名单一律丢弃
  if (event.origin !== "https://trusted.example") return;

  // 再验消息结构 / 类型：别假设 data 一定是你期望的形状
  const msg = event.data;
  if (typeof msg !== "object" || msg === null || msg.type !== "greet") return;

  // 到这里才安全地处理业务
  handleGreet(msg.text);
});
```

MDN 给出的两条准则（直译）：

> **如果你不打算接收其他站点的消息，就不要为 `message` 事件添加任何监听器。** 这是规避安全问题最彻底的办法。
>
> 如果你确实要接收其他站点的消息，**务必用 `origin`（可能还有 `source`）属性验证发送者的身份**。

而且——**验完来源还要验消息本身的语法 / 结构**。MDN 原文：即便验证了身份，仍应始终校验收到消息的语法，否则你所信任的站点上的一个安全漏洞，就可能在你的站点上打开一个跨站脚本（XSS）漏洞。换句话说，把 `event.data` 不加校验地塞进 `innerHTML`、`eval`、`new Function` 等 sink，就是把对方的 XSS 变成自己的 XSS。

## 四、`event.source`：安全回复的回信地址，不是身份凭证

`message` 事件的关键字段：

| 字段 | 含义 |
| --- | --- |
| `event.data` | 对方传来的数据（结构化克隆的副本） |
| `event.origin` | 发消息那一刻发送窗口的**源**——**唯一可信的身份依据** |
| `event.source` | 发送窗口的**引用**（`WindowProxy`），用于**回复** |
| `event.ports` | 随消息转移过来的 `MessagePort` 数组（见 [MessageChannel 页](./message-channel)） |

`event.source` 让「跨源双向通信」不必事先持有对方引用——收到消息后直接回：

```js
window.addEventListener("message", (event) => {
  if (event.origin !== "https://trusted.example") return;

  // 用 event.source 回复，targetOrigin 回填 event.origin：天然打回正确对端
  event.source.postMessage({ type: "ack" }, event.origin);
});
```

**关键区分**：`event.source` 是「往哪回」的回信地址，**不能拿它当身份认证**。判断「这条消息可不可信」永远看 `event.origin`（源不可伪造）；`event.source` 只解决「回给谁」。把 `source` 当身份、跳过 `origin` 校验，是常见的安全误解。

## 五、两种经典拓扑：`<iframe>` 与弹窗

### 5.1 父页面 ↔ `iframe.contentWindow`

父页面通过 `iframe.contentWindow` 拿到子框架窗口引用；子框架通过监听 `message` 收、通过 `event.source`（即父窗口）回：

```js
// 父页面
const iframe = document.querySelector("iframe");
iframe.addEventListener("load", () => {
  // 必须等 load：太早发时子框架还没挂上 message 监听，消息会丢
  iframe.contentWindow.postMessage({ type: "config", theme: "dark" }, "https://widget.example");
});
window.addEventListener("message", (event) => {
  if (event.origin !== "https://widget.example") return;
  console.log("子框架回报：", event.data);
});
```

```js
// 子框架（https://widget.example）
window.addEventListener("message", (event) => {
  if (event.origin !== "https://host.example") return; // 只信任宿主页面
  if (event.data?.type === "config") applyTheme(event.data.theme);
  event.source.postMessage({ type: "config-applied" }, event.origin);
});
```

时序要点：**父页面要等 `<iframe>` 的 `load` 事件再发首条消息**，否则子框架脚本尚未执行、监听未就绪，消息直接丢失。更稳的握手是让子框架先发一条 `ready`，父页面收到 `ready` 再开始发。

### 5.2 主窗口 ↔ `window.open` 弹窗（`window.opener`）

`window.open` 打开的弹窗里，`window.opener` 指回打开它的主窗口；主窗口持有 `window.open()` 的返回值：

```js
// 主窗口
const popup = window.open("https://auth.example/login", "login");
window.addEventListener("message", (event) => {
  if (event.origin !== "https://auth.example") return; // 校验来源
  if (event.data?.type === "auth-result") {
    handleAuth(event.data.token);
    popup.close();
  }
});
```

```js
// 弹窗（https://auth.example）登录完成后回传结果
if (window.opener) {
  // 明确 targetOrigin，绝不用 "*" 传 token
  window.opener.postMessage({ type: "auth-result", token }, "https://host.example");
  // 也可 window.close() 自行关闭
}
```

这正是 OAuth「弹窗登录」的经典骨架：弹窗完成认证后，用 `window.opener.postMessage` 把结果带确切 `targetOrigin` 送回主窗口。

## 六、结构化克隆与 transfer

`message` 参数走**结构化克隆算法**——比 JSON 强得多：

- **能传**：原始值、普通对象、数组、`Date`、`RegExp`、`Map`、`Set`、`ArrayBuffer`、TypedArray、`Blob`、`File`、`ImageBitmap`、`MessagePort` 等。
- **传不了**：**函数**、**DOM 节点**、含方法的类实例（取回变普通对象、方法与原型丢失）——含这些会抛 `DataCloneError`。
- 传递即**深拷贝**：对端拿到的是副本，改它不影响你这边。

大对象深拷贝很贵。**Transferable 对象**（`ArrayBuffer`、`MessagePort`、`ImageBitmap`、`OffscreenCanvas` 等）可用第三参数**移交所有权**（零拷贝）：

```js
const buffer = new ArrayBuffer(64 * 1024 * 1024); // 64 MB
// 第三参数 transfer 列出要移交的对象：几乎零成本
otherWindow.postMessage({ type: "frame", buffer }, "https://render.example", [buffer]);

console.log(buffer.byteLength); // 0：已移交，本上下文里这个 buffer 已失效
```

移交后**原上下文里该对象即失效**（`ArrayBuffer` 变 `byteLength === 0`，port 变 neutered）——这与 [MessageChannel 页](./message-channel)转移 port 是同一套语义。

## 七、`SharedArrayBuffer` 与跨源隔离

要跨上下文共享 `SharedArrayBuffer`（真正共享内存，不是拷贝），页面必须处于**跨源隔离**状态，靠两个响应头开启：

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

运行时用 `Window.crossOriginIsolated`（`true` / `false`）检测是否已隔离。未隔离时 `postMessage` 一个 `SharedArrayBuffer` 会失败。这属于高级并发场景（多线程共享内存），入门通常用不到。

## 八、易错点

- **`targetOrigin` 用 `*` 传敏感数据**：可被截获——写死对方源；只有 `data:` / 不透明源不得已才 `*`，且不传敏感数据。
- **不校验 `event.origin` 就处理**：任何窗口都能给你发消息——第一行就 `if (event.origin !== 期望源) return;`。
- **把 `event.data` 直接进 `innerHTML` / `eval`**：信任站点的 XSS 会传染给你——校验结构 + 转义 / 白名单。
- **拿 `event.source` 当身份**：它只是回信地址——身份永远看 `event.origin`。
- **`<iframe>` 未 `load` 就发消息**：子框架监听未就绪、消息丢失——等 `load` 或让子框架先发 `ready` 握手。
- **父子同 `type` 互发成死循环**：`message` 广播特性下容易回声——用不同 `type` 或加已处理标记。
- **想传函数 / DOM 节点 / 类实例方法**：`DataCloneError`——只传纯数据，对端重建。
- **大 `ArrayBuffer` 靠克隆传**：深拷贝很贵——用第三参数 transfer 零拷贝移交（移交后本地失效）。
- **忘了 `data:` URL 必须 `*`**：不透明源没有可匹配的确定源——这种通道单独处理、不传敏感数据。

下一页：把点对点升级成**私有双向管道**——[MessageChannel 与 MessagePort](./message-channel)。
