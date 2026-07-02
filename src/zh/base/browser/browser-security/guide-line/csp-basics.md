---
layout: doc
outline: [2, 3]
---

# CSP 基础

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- **CSP（Content Security Policy）**：站点通过 **`Content-Security-Policy` 响应头**（或 `<meta http-equiv>`）告诉浏览器「什么代码能跑、什么资源能加载」，主防 **XSS**，兼防点击劫持（`frame-ancestors`）与混合内容（`upgrade-insecure-requests`）
- 指令分四类：**fetch**（`default-src`/`script-src`/`img-src`/`connect-src`……管资源加载）、**document**（`base-uri`/`sandbox`/`require-trusted-types-for` 管文档自身）、**navigation**（`form-action`/`frame-ancestors` 管去向与被嵌）、**reporting**（`report-uri` 遗留 → `report-to` 现行）
- **`default-src` 是所有 fetch 指令的回退**——没单独写的资源类型都按它执行；写策略先定 `default-src 'self'` 再逐类放宽
- 源表达式：**`'none'`**（全禁，不能与其他值混用）、**`'self'`**（同源）、**host**（`example.com`、`*.example.org`）、**scheme**（`https:`、`data:`）、**`'nonce-…'`**、**`'sha256-…'`**
- **CSP 一旦下发，默认禁掉全部内联脚本**：inline `<script>`、`onclick=` 等内联事件处理器、`javascript:` URL 全部失效——这是接入 CSP 页面最常「坏」的地方
- 放行内联的正道是 **nonce**（每次响应随机生成、模板注入）或 **hash**（`sha256/384/512`，适合静态内容；外部脚本需配 `integrity`），而不是 `'unsafe-inline'`
- **`'unsafe-inline'`** 放行所有内联 = 注入点直接可执行，基本抵消 CSP；**`'unsafe-eval'`** 放行 `eval()`/`Function()`/字符串版 `setTimeout`
- 有 nonce/hash 时现代浏览器会**忽略同指令里的 `'unsafe-inline'`**——可作旧浏览器兜底共存
- **`Content-Security-Policy-Report-Only`**：只上报不拦截，先观测再收紧的标准上线路径；**只能走响应头**，meta 不支持
- 报告换代：**`report-uri`（已废弃）** POST `application/csp-report` → **`report-to`** 配合 **`Reporting-Endpoints`** 头走 Reporting API；过渡期两者可并写
- **meta 下发的限制**：`frame-ancestors`、`sandbox`、`report-uri`、`report-to` 在 `<meta>` 里**不生效**——涉及嵌入控制与上报的策略必须走响应头
- 排查入口：DevTools **Console** 逐条打印违规（含被拦 URL 与命中指令）；违规报告字段看 `effectiveDirective`/`blockedURL`/`sample`

## 一、威胁模型：CSP 到底防什么

XSS 的本质是**攻击者的代码混进了你的页面**——一旦执行，它与你的第一方代码同权：读改 DOM、翻 `localStorage`、带着用户 Cookie 发请求。注入的载体无非几类：指向恶意源的 `<script src>`、内联 `<script>` 代码块、内联事件处理器（`onerror=…`）、`javascript:` URL、以及 `eval()` 这类把字符串当代码执行的 API。

CSP 的思路不是识别恶意代码（做不到），而是**收窄「代码能从哪来、以什么形态执行」**：只允许指定来源的外部脚本、默认禁掉所有内联与 `eval`。注入点即使存在，注入的代码也**跑不起来**。攻击手法本身（payload 构造、过滤绕过）归安全章（待产出）；本页只管防御怎么配。

> 定位要摆正：CSP 是**纵深防御**（defense in depth）的一层，不是输入过滤/输出转义的替代品——MDN 原话是它「减少注入攻击的危害」，第一道防线永远是别让注入发生。

## 二、下发通道：响应头为主，meta 为辅

```http
# 推荐：响应头下发——注意应该对所有响应设置，而非只有 HTML 主文档
Content-Security-Policy: default-src 'self'; img-src 'self' example.com
```

```html
<!-- 备选：meta 标签——适合无法控制服务器响应头的纯静态托管 -->
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; img-src 'self' example.com" />
```

meta 通道是残血版，四个指令在 meta 里**不生效**：`frame-ancestors`、`sandbox`、`report-uri`、`report-to`；`Content-Security-Policy-Report-Only` 也没有 meta 形式。换句话说：**防点击劫持和收违规报告，必须能改响应头**。

配错怎么坏：CSP 是「白名单」语义，头一旦下发，没列进的资源类型按 `default-src` 兜底；连 `default-src` 都没写的指令族则**不受限**。最典型事故是只写了 `script-src` 却忘了 `object-src`/`base-uri`，或把策略只加在 HTML 上、忘了 Worker 脚本的响应。

## 三、指令体系：四类 + 杂项

| 类别 | 指令 | 管什么 |
| --- | --- | --- |
| **fetch 指令** | `default-src`（回退）、`script-src`（及细分 `script-src-elem`/`script-src-attr`）、`style-src`（及 `-elem`/`-attr`）、`img-src`、`font-src`、`connect-src`（fetch/XHR/WebSocket）、`media-src`、`object-src`、`frame-src`、`worker-src`、`manifest-src`、`fenced-frame-src`；`child-src` 已废弃（由 `frame-src`+`worker-src` 接替） | 每类资源允许从哪加载 |
| **document 指令** | `base-uri`、`sandbox`、`require-trusted-types-for`（配套 `trusted-types`） | 文档自身的属性与能力 |
| **navigation 指令** | `form-action`（表单能提交到哪）、`frame-ancestors`（谁能嵌我） | 文档的去向与被嵌关系 |
| **reporting 指令** | `report-uri`（遗留）、`report-to`（现行） | 违规往哪报 |
| 杂项 | `upgrade-insecure-requests`、`block-all-mixed-content`（已废弃） | 混合内容处置，见[安全上下文与混合内容](./secure-contexts-mixed-content) |

三个高价值但常被漏配的指令：

- **`object-src 'none'`**：`<object>`/`<embed>` 是历史注入重灾区，现代页面直接关死。
- **`base-uri 'none'`**：阻止注入 `<base>` 标签把页面所有相对 URL 劫持到攻击者域名。
- **`form-action`**：限制表单提交目标，防注入表单钓鱼收集凭据。

`frame-ancestors` 的展开（DENY/SAMEORIGIN 对照、与 X-Frame-Options 的换代）见 [iframe sandbox 与点击劫持](./iframe-sandbox-clickjacking)；`require-trusted-types-for` 见[防注入三件套](./strict-csp-trusted-types)。

## 四、源表达式：值怎么写

```http
Content-Security-Policy: object-src 'none'
# 'none'：该类资源全禁；不能与其他值同列

Content-Security-Policy: img-src 'self'
# 'self'：仅同源（同 scheme + host + port）

Content-Security-Policy: img-src 'self' *.example.org example.com
# host 表达式：具体域名或通配子域；多值是「或」关系

Content-Security-Policy: img-src https: data:
# scheme 表达式：按协议放行——https: 任意 HTTPS 源；data: 放行 data URL（img 常见，script 千万别）
```

注意关键字要**带单引号**（`'self'`、`'none'`）；不带引号的 `self` 会被当成名为 self 的主机名——经典配错，症状是同源资源莫名被拦、Console 大片违规。

## 五、nonce 与 hash：放行内联的正道

CSP 生效后内联脚本默认全灭。两条白名单机制精确放行：

### 5.1 nonce：动态页面首选

服务器**每次响应**生成不可预测的随机值，同时写进头与标签——攻击者注入的脚本拿不到本次 nonce，自然不执行：

```js
// Express 示例：每次响应生成新 nonce
app.get("/", (req, res) => {
  const nonce = crypto.randomUUID(); // 关键：每响应一次、不可预测
  res.setHeader("Content-Security-Policy", `script-src 'nonce-${nonce}'`);
  // 模板里把 nonce 注入 script 标签
  res.send(`
    <script nonce="${nonce}" src="/main.js"></script>
    <script nonce="${nonce}">console.log("内联也放行");</script>
  `);
});
```

### 5.2 hash：静态页面首选

对脚本**内容**算 SHA-256/384/512，写进策略；内容不变哈希不变，头可以是静态的：

```http
Content-Security-Policy: script-src 'sha256-ex2O7MWOzfczthhKm6azheryNVoERSFrPrdvxRtP8DI='
```

```html
<!-- 内联脚本：内容哈希匹配即执行 -->
<script>console.log("hello!");</script>
<!-- 外部脚本走 hash 时，标签必须带 integrity 且值与策略一致 -->
<script src="./main.js" integrity="sha256-ex2O7MWOzfczthhKm6azheryNVoERSFrPrdvxRtP8DI="></script>
```

| 对比 | nonce | hash |
| --- | --- | --- |
| 适用 | 服务端动态渲染 | 纯静态页 / 构建期可算哈希 |
| 要求 | 每响应重新生成、模板注入 | 脚本内容一变就得重算 |
| 内联/外部 | 都支持 | 都支持（外部需 `integrity`） |

## 六、unsafe-inline 与 unsafe-eval：为什么危险

**`'unsafe-inline'`** 一次性放行三类内联载体——inline `<script>`、内联事件处理器、`javascript:` URL。而这三类恰是 XSS 注入的主战场：攻击者注入 `<img onerror=…>` 就直接执行。MDN 的评语是它「抵消了 CSP 的大部分意义」。历史包袱页面的过渡法：**同指令并写 nonce/hash + `'unsafe-inline'`**——支持 nonce 的现代浏览器会忽略 `'unsafe-inline'`，老浏览器按它兜底。

**`'unsafe-eval'`** 放行 `eval()`、`new Function()`、字符串参数版 `setTimeout`/`setInterval`——把任意字符串变代码的入口。与 `'unsafe-inline'` 不同，它**不会**被 nonce/hash 的存在关掉；某些依赖运行时求值的老库（模板引擎、旧版打包产物）会逼你开它，正解是升级依赖而不是开洞。

改造抓手：内联事件处理器改 `addEventListener`；`javascript:` URL 改按钮 + 监听；`eval` 场景多半能用 `JSON.parse` 或查表替代。

## 七、Report-Only 与违规报告：先观测，再收紧

### 7.1 Report-Only 模式

```http
# 只上报不拦截——策略试运行
Content-Security-Policy-Report-Only: default-src 'self'; report-to csp-endpoint

# 正式执行 + 继续上报
Content-Security-Policy: default-src 'self'; report-to csp-endpoint
```

标准上线路径：**先挂 Report-Only 收集真实流量违规 → 按报告修配置/改代码 → 换正式头**。两头可同时下发（一严一宽做灰度）。再强调一次：Report-Only 只能走响应头。

### 7.2 report-uri（遗留）→ report-to（现行）

| | `report-uri`（废弃） | `report-to`（现行） |
| --- | --- | --- |
| 端点声明 | 直接写 URL | 由 **`Reporting-Endpoints`** 响应头定义具名端点 |
| 传输 | POST `application/csp-report` | Reporting API 批量 POST `application/reports+json` |
| 兼容 | 老浏览器广泛支持 | 现代浏览器 |

```http
# 现代写法：先声明端点，再在 CSP 里引用；过渡期可 report-uri 与 report-to 并写（支持 report-to 的浏览器忽略前者）
Reporting-Endpoints: csp-endpoint="https://example.com/csp-reports"
Content-Security-Policy: default-src 'self'; report-uri /csp-reports; report-to csp-endpoint
```

报告 JSON 的关键字段（`type: "csp-violation"`）：**`blockedURL`**（被拦资源，内联为 `"inline"`）、**`effectiveDirective`**（命中的指令，如 `script-src-elem`）、**`originalPolicy`**（完整策略）、**`sourceFile`/`lineNumber`**（违规位置）、**`sample`**（被拦内容前 40 字符，便于判断是攻击还是自己人）、**`disposition`**（`enforce` 或 `report`）。

### 7.3 DevTools 怎么看

- **Console**：每条违规一行红字，格式固定——「Refused to load/execute … because it violates the following Content Security Policy directive: …」，直接给出被拦 URL 与命中指令。
- **Network**：被 CSP 拦下的请求显示 `(blocked:csp)`；上报请求可在过滤器输入 `csp-reports` 看 payload。
- 页面里也能编程订阅：监听 `securitypolicyviolation` 事件可拿到与报告同构的字段。

## 小结

CSP 用一行响应头声明「代码从哪来、以什么形态执行」：指令分 fetch/document/navigation/reporting 四类，`default-src` 兜底；源表达式从 `'none'`/`'self'` 到 host/scheme 再到 nonce/hash 逐级精确。核心纪律是**别用 `'unsafe-inline'`/`'unsafe-eval'` 换省事**——nonce（动态页）与 hash（静态页）才是放行内联的正道。上线永远走 Report-Only → 修 → 强制的路径，报告端点用 `Reporting-Endpoints` + `report-to`（`report-uri` 仅作兼容兜底）。但只有域名白名单的 CSP 仍可能被绕过——为什么、以及 nonce/hash 之上还要叠什么，下一页[防注入三件套](./strict-csp-trusted-types)展开。
