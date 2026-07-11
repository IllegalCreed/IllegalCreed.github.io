---
layout: doc
outline: [2, 3]
---

# Request、Response 与 Headers 三对象

> 基于 WHATWG Fetch 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **等价关系**：`fetch(url, options)` 的参数与 `new Request(url, options)` 完全一致——选项可以进 `Request()` 构造器，也可以进 `fetch()`，同名选项**以 `fetch()` 直接传的为准**。
- **二次构造**：`new Request(oldRequest, overrides)` 以旧请求为模板改部分选项——请求模板复用、SW 改写请求的标准姿势。
- **请求体也是流**：带 body 的 `Request` **发送一次就被消费**，再 `fetch(request)` 抛"Body has already been consumed"——复用前先 `request.clone()`。
- **Response 三静态**：`Response.json(data, init)`（造 JSON 响应，自动设 Content-Type）、`Response.error()`（网络错误响应，type 为 `error`）、`Response.redirect(url, status)`——全是 Service Worker/API mock 的刚需。
- **`Response.json()` 静态方法**：2023-09 补齐（Chrome 105 / Firefox 115 / Safari 17），**2026-03 起 Widely available**。
- **`response.ok`**：status 在 **200–299** 才为 `true`；304 之类"不算错也不算 ok"（不在 2xx 内）。
- **`response.type` 五值**：`basic`（同源）/ `cors`（跨域 CORS）/ `opaque`（no-cors 跨域，全读不到）/ `opaqueredirect`（`redirect: "manual"`）/ `error`（`Response.error()` 产物）。
- **body 单次消费**：读过（disturbed）或被 `getReader()` 锁住（locked）的 body 不能再读；`bodyUsed` 置 `true` 后任何读取方法都抛 `TypeError`。
- **`clone()` 必须在读之前**：对 `bodyUsed === true` 的对象调 `clone()` 直接抛 `TypeError`；克隆后两份各自可读一次——SW "一份回页面、一份进缓存"的标准模式。
- **六种读取方法**：`json()` / `text()` / `blob()` / `arrayBuffer()` / `formData()` / `bytes()`——都返回 Promise、都全量读完 body、都消费一次机会。
- **`bytes()`**：返回 `Promise<Uint8Array>`，替代 `arrayBuffer()` 再手包一层的老写法；**Baseline Newly available 2025-01**（Firefox 128 / Safari 18.0 / Chrome 132 补齐），Node 20.16+/22.3+。
- **json() 失败面**：body 不是合法 JSON 时 reject（`SyntaxError`）；空 body 调 `json()` 同样炸——204 No Content 别调它。
- **Headers 输入净化**：名字小写化、值去首尾空白；**遍历时按名字典序排序、同名值合并**为逗号拼接（`getSetCookie()` 是唯一拿多条 `Set-Cookie` 的口子）。
- **Headers 可变性分级（guard）**：自己 `new Headers()` 的随便改；`fetch()` 拿到的响应头**不可变**（`set`/`append`/`delete` 抛 `TypeError`）；`Response()`/`Response.json()` 构造的可改非禁头；no-cors 请求只能碰 CORS-safelisted 头。
- **禁设头**：`Host`、`Origin`、`Cookie`、`Content-Length`、`Sec-*`/`Proxy-*` 前缀等 **Forbidden request headers** 由浏览器接管，脚本设置会被**静默忽略**（不报错）。
- **`Referer` 例外**：不能进 `headers`，但可用独立的 `referrer` 选项定制（空串省略），`referrerPolicy` 控制粒度。
- **Request 同样有六读**：`Request` 与 `Response` 共享 body 混入——`request.json()`/`request.bytes()` 等在 SW 里解析拦截到的请求体常用。

## 一、对象模型总览

Fetch API 把一次 HTTP 对话拆成三个标准对象：

| 对象 | 角色 | 常见来源 |
| --- | --- | --- |
| `Request` | 请求：URL + 方法 + 头 + 体 + 策略选项 | `new Request()`；SW `fetch` 事件的 `event.request` |
| `Response` | 响应：状态 + 头 + 体 + 类型 | `fetch()` 的兑现值；`new Response()`；三个静态工厂 |
| `Headers` | 头集合：净化、遍历、可变性管理 | `request.headers` / `response.headers`；`new Headers()` |

`fetch()` 与 `Request()` 构造器**签名完全一致**，因此下面两种写法等价：

```js
// 写法一：选项直接给 fetch
const res1 = await fetch("https://api.example.com/post", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "张三" }),
});

// 写法二：先造 Request，再交给 fetch —— 请求成为可传递的值
const request = new Request("https://api.example.com/post", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "张三" }),
});
const res2 = await fetch(request);
```

`Request` 对象的价值在"请求是值"：可以存进 Cache API 当键、在 SW 里改写转发、当模板派生变体。两处同时传选项时，**`fetch(request, options)` 里直接传的选项覆盖 Request 上的同名配置**。

## 二、Request：构造、派生与"请求体也是流"

### 二次构造：以旧请求为模板

```js
const template = new Request("https://api.example.com/post", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user: "a" }),
});

// 以 template 为底，只换 body —— 其余配置全部继承
const variant = new Request(template, {
  body: JSON.stringify({ user: "b" }),
});
```

Service Worker 里"改头换面再转发"就是这个模式：`fetch(new Request(event.request, { headers: patched }))`。

### 请求体只能发一次

请求体和响应体一样是流——**发送这个动作就是在读流**：

```js
const request = new Request("https://api.example.com/post", {
  method: "POST",
  body: JSON.stringify({ n: 1 }),
});

await fetch(request);        // 第一次：正常
await fetch(request);        // 第二次：抛 TypeError（Body has already been consumed）
```

要重复发送，**克隆要赶在第一次发送前**：

```js
const req1 = new Request(url, { method: "POST", body: payload });
const req2 = req1.clone(); // 必须在 fetch(req1) 之前

await fetch(req1);
await fetch(req2); // 各自消费各自的 body，互不影响
```

无 body 的 GET 请求不存在这个问题，可以放心复用同一个 `Request`。

### Request 关键属性

`method`、`url`、`headers`、`mode`、`credentials`、`cache`、`redirect`、`referrer`、`referrerPolicy`、`integrity`、`keepalive`、`signal`、`destination`（该请求要的资源类型，SW 分流常用），以及与 Response 共享的 `body`/`bodyUsed` 和六种读取方法——SW 里 `await event.request.clone().json()` 解析拦截到的提交数据是标准操作。

## 三、Response：属性、类型与三个静态工厂

### 实例属性

| 属性 | 说明 |
| --- | --- |
| `status` / `statusText` | 状态码 / 状态消息（HTTP/2 下 statusText 常为空串） |
| `ok` | `status` 在 **200–299** 时 `true`——判成败用它，别手比 `=== 200` |
| `headers` | `Headers` 对象（fetch 拿到的为**不可变**） |
| `url` | 最终 URL（经历重定向后是**落点**地址） |
| `redirected` | 是否经历过重定向——防开放重定向时配合 `url` 检查 |
| `type` | 响应类别，见下表 |
| `body` / `bodyUsed` | `ReadableStream` / 是否已被消费 |

### type 五值

| type | 场景 | 能读到什么 |
| --- | --- | --- |
| `basic` | 同源请求 | 除 `Set-Cookie` 等禁读头外的头 + body |
| `cors` | 跨域 CORS 成功 | 仅 **CORS-safelisted 响应头**（或 `Access-Control-Expose-Headers` 放行的）+ body |
| `opaque` | `mode: "no-cors"` 的跨域请求 | **什么都读不到**：status 恒 `0`、headers 空、body `null`，详见[请求模式页](./cors-credentials-cache) |
| `opaqueredirect` | `redirect: "manual"` 遇到重定向 | 同样几乎全滤掉，status 为 `0` |
| `error` | `Response.error()` 构造 | 网络错误的对象化表示 |

跨域响应连头都只给白名单这点常被忽略：想在前端读自定义响应头（如 `X-Request-Id`），服务端必须加 `Access-Control-Expose-Headers: X-Request-Id`。

### 三个静态工厂

```js
// 1. Response.json()：一行造 JSON 响应（自动 Content-Type: application/json）
//    SW mock 接口、测试桩、边缘函数返回 JSON 的标准姿势
const mock = Response.json({ code: 0, data: [] }, { status: 200 });

// 2. Response.error()：网络错误响应（type: "error", status: 0）
//    SW 缓存兜底失败时"如实上报网络失败"，而不是编造一个 500
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((hit) => hit ?? fetch(event.request).catch(() => Response.error())),
  );
});

// 3. Response.redirect(url, status = 302)：构造重定向响应
const go = Response.redirect("https://example.com/login", 302);
```

`new Response(body, { status, statusText, headers })` 则是通用构造器——把任意字符串/Blob/流包装成响应，配合 SW/Cache API 使用。

## 四、body 单次消费：bodyUsed、锁定与 clone()

body 流有两个"不可再读"状态（MDN 口径）：

- **locked（锁定）**：`response.body.getReader()` 附加了读取器，其他消费方进不来；
- **disturbed（已消费）**：任何读取方法动过它，`bodyUsed` 置 `true`。

```js
const response = await fetch(url);

const a = await response.json(); // 第一次：OK，bodyUsed 变 true
const b = await response.json(); // 第二次：抛 TypeError
```

需要读两次（典型：SW 一份回页面一份进缓存），**先克隆再读**：

```js
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    const cache = await caches.open("v1");
    // clone 必须发生在任何一方读 body 之前
    cache.put(request, networkResponse.clone());
  }
  return networkResponse; // 原件回给页面，克隆件进缓存
}
```

两条铁律：

1. **`clone()` 时机**：对 `bodyUsed === true` 的对象调 `clone()` 本身就抛 `TypeError`——克隆永远赶在读取前；
2. **克隆不是免费的**：两份流的数据要各自缓冲，一方读得慢会让内存里积压另一方的数据，海量大响应别无脑克隆。

## 五、六种 body 读取方法

| 方法 | 解析为 | 典型场景 | 备注 |
| --- | --- | --- | --- |
| `json()` | 任意 JS 值 | API 响应 | body 非法 JSON 或为空时 reject |
| `text()` | `string` | HTML/纯文本/手动 `JSON.parse` | 始终按 UTF-8 解码 |
| `blob()` | `Blob` | 图片/文件下载 + `URL.createObjectURL()` | 带 MIME type |
| `arrayBuffer()` | `ArrayBuffer` | 音频解码、二进制协议 | 再包 TypedArray 才能操作 |
| `bytes()` | `Uint8Array` | 直接要字节数组（文件签名、二进制解析） | **2025-01 Baseline**，替代 arrayBuffer 手包 |
| `formData()` | `FormData` | 主要在 **SW 里解析拦截的表单提交** | 页面侧少用 |

```js
// bytes()：读文件头识别真实类型（比 arrayBuffer 少包一层）
const response = await fetch("/upload/unknown-file");
const bytes = await response.bytes(); // Uint8Array
const isPNG = [0x89, 0x50, 0x4e, 0x47].every((b, i) => bytes[i] === b);
```

共同特征：全部**异步**、全部**全量**读完才兑现（要边到边处理去[流式页](./streaming-keepalive)的 `response.body`）、全部**消费**唯一一次读取机会、格式不符时 reject。

## 六、Headers：净化、遍历与可变性

### 构造与基本操作

```js
const headers = new Headers({ "Content-Type": "application/json" });
// 也接受二维数组：new Headers([["Content-Type", "application/json"]])

headers.append("X-Tag", "a");  // 追加（同名头累加值）
headers.append("X-Tag", "b");
headers.set("X-Tag", "c");     // 覆盖（同名头全部替换为一条）
headers.get("x-tag");          // "c" —— 名字大小写不敏感
headers.has("X-Tag");          // true
headers.delete("X-Tag");
```

相比字面量对象，`Headers` 会做**输入净化**：名字统一小写、值去首尾空白、非法头名直接抛 `TypeError`。`append` 与 `set` 的差异只对可多值的头有意义（如 `Accept`），设 Token 这类单值头用 `set` 更稳。

### 遍历规则

`Headers` 可直接 `for...of`（等价 `entries()`），还有 `keys()`/`values()`/`forEach()`。三条遍历时的隐藏规则：

1. 名字全部**小写**呈现；
2. 按名**字典序**排序（不是插入序）；
3. **同名头的值合并**为一条（逗号拼接）。

`Set-Cookie` 是合并规则下的受害者——多条 cookie 拼一起没法解析，所以有了专用的 **`headers.getSetCookie()`**（返回字符串数组，2023-09 补齐、2026-03 起 Widely available）；且浏览器侧 `fetch()` 响应本就读不到 `Set-Cookie`（禁读头），这个方法主要服务 Node/边缘运行时。

### 可变性分级（guard）

`Headers` 对象带一个内部 guard，决定 `set()`/`append()`/`delete()` 是否被放行：

| 来源 | 可变性 |
| --- | --- |
| `new Headers()` 自建 | 随便改 |
| `Request.headers`（普通模式） | 可改**非禁设头**（Forbidden request headers 静默忽略） |
| `Request.headers`（`mode: "no-cors"`） | 只能改 **CORS-safelisted 请求头**（且 `Range` 也不行） |
| `fetch()` 响应 / `Response.error()` / `Response.redirect()` 的 headers | **immutable**：任何修改抛 `TypeError` |
| `new Response()` / `Response.json()` 构造的 headers | 可改非禁响应头 |

所以"给 fetch 拿到的响应补个头"这种事做不到——正确做法是**用旧响应的 body 重造一个 Response**：

```js
// SW 里给响应追加头的标准姿势：重建而非修改
const patched = new Response(original.body, {
  status: original.status,
  statusText: original.statusText,
  headers: new Headers([...original.headers, ["X-Cache", "HIT"]]),
});
```

### 禁设头

`Host`、`Origin`、`Cookie`、`Referer`、`Content-Length`、`Connection`、`Sec-*`/`Proxy-*` 前缀等 **Forbidden request headers** 由浏览器全权接管——脚本里 `headers.set("Cookie", ...)` 不报错但**静默无效**，这是安全模型的一部分（防伪造来源/防走私）。`Referer` 有正门：`referrer` 选项（传空串则整个省略该头）。

## 七、易错点

- **404 之后照样 `await response.json()`**：忘了查 `ok`，把错误页 HTML 当 JSON 解析，得到一个莫名其妙的 `SyntaxError`——永远先 `ok` 后读 body。
- **同一个带 body 的 Request 发两次**：第二次抛 TypeError——发送就是消费，先 `clone()`。
- **读完才想起要 clone**：`clone()` 对 `bodyUsed` 的对象直接抛错——克隆必须是第一动作。
- **204 响应调 `json()`**：空 body 解析必炸——先判 `response.status === 204` 或 `Content-Length: 0` 再决定读不读。
- **手设 FormData 的 Content-Type**：boundary 丢失，服务端收到无法解析的 multipart——让浏览器自动生成。
- **跨域读不到自定义响应头**：type 为 `cors` 的响应只暴露白名单头——服务端补 `Access-Control-Expose-Headers`。
- **想改 fetch 响应的 headers**：immutable，抛 TypeError——用 `new Response(old.body, {...})` 重建。
- **`headers.set("Cookie", ...)` 无效还不报错**：禁设头静默忽略——凭据走 `credentials` 选项，见[请求模式页](./cors-credentials-cache)。
- **依赖 Headers 的插入顺序**：遍历是字典序 + 小写 + 合并——别拿头顺序做协议。
- **`bytes()` 兼容旧浏览器**：2025-01 才 Baseline，要兜老版本用 `new Uint8Array(await res.arrayBuffer())` 等价替代。

三对象的静态结构讲完了，下一页解决动态面——请求怎么取消、怎么加超时、错误怎么分类重试：[取消与超时](./abort-timeout)。
