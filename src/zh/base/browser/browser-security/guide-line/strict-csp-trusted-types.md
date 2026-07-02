---
layout: doc
outline: [2, 3]
---

# 防注入三件套

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- 三件套分工：**strict CSP** 管「什么脚本能执行」、**Trusted Types** 管「什么字符串能进 DOM XSS sink」、**SRI** 管「拿到的文件是不是没被篡改」——三层互不替代
- **域名白名单 CSP 易被绕过**：研究《CSP Is Dead, Long Live CSP!》证明多数白名单会不经意放进不安全域名；且极难维护——只接一个 Google Analytics 就可能要放行 **187 个 Google 域名**
- **strict CSP 配方**：`script-src 'nonce-…'`（或 hash）**+ `'strict-dynamic'` + `object-src 'none'` + `base-uri 'none'`**——不写任何域名白名单
- **`'strict-dynamic'`**：信任传递——被 nonce/hash 放行的脚本，其动态 `createElement("script")` 创建的后代脚本自动放行；专治第三方脚本链
- **Trusted Types**：CSP 加 **`require-trusted-types-for 'script'`** 后，往 `innerHTML`/`eval`/`script.src` 等 **DOM XSS sink** 塞裸字符串直接抛 `TypeError`，只收 `TrustedHTML`/`TrustedScript`/`TrustedScriptURL` 对象
- 策略工厂：**`trustedTypes.createPolicy(name, { createHTML/createScript/createScriptURL })`**；名为 **`default`** 的策略自动兜住存量裸字符串赋值；`trusted-types` 指令可锁定允许的策略名
- **Baseline 2026-02 Newly available**：自 2026 年 2 月起 Trusted Types 已在各主流浏览器最新版可用——「只有 Chrome 支持」是旧认知，可上生产（老版本浏览器配 tinyfill 兜底）
- **tinyfill 一行**：`if (typeof trustedTypes === "undefined") trustedTypes = { createPolicy: (n, rules) => rules };`——不支持的浏览器里策略退化为普通净化函数，代码同构运行
- **SRI**：`<script>`/`<link rel="stylesheet|preload|modulepreload">` 带 **`integrity="sha384-…"`**，浏览器下载后比对哈希，不匹配**按网络错误拒绝加载**；防的是 CDN 被黑/被篡改（供应链攻击）
- SRI 跨域资源**必须配 `crossorigin="anonymous"`**（走 CORS）：no-cors 模式下 integrity 一律失败——防止攻击者用「猜哈希 + 看加载成败」探测跨源资源内容
- 哈希生成：`cat FILE.js | openssl dgst -sha384 -binary | openssl base64 -A`；多算法并列时浏览器只用**最强**的一组；同算法多值任一匹配即过（可同时放行多版本）
- 新配套：**`Integrity-Policy: blocked-destinations=(script)`** 响应头可强制「所有脚本必须带 integrity」，配 `Integrity-Policy-Report-Only` 灰度

## 一、白名单 CSP 的失败：为什么要 strict

直觉的 CSP 写法是列域名白名单：

```http
Content-Security-Policy: script-src 'self' https://cdn.example.com https://analytics.example.com
```

实践证明这条路**几乎必然失守**，MDN 直接引用了 Google 的研究《CSP Is Dead, Long Live CSP!》：

1. **白名单里总混进不安全域名**。任一被放行的域上存在 JSONP 端点、Angular 旧版运行时或可上传文件的路径，攻击者就能借道执行任意代码——你信任的是整个域，而不是某个文件。
2. **维护成本失控**。第三方脚本自己还会拉脚本，域名列表越滚越大——研究给出的例子：完整放行 Google Analytics 相关链路要 **187 个 Google 域名**。
3. **列表会腐烂**。第三方换 CDN、加新域，白名单要么拦坏功能、要么越放越宽。

**strict CSP** 的答案是放弃「按来源信任」，改为「按凭据信任」：

```http
# nonce 版（动态渲染站点）——注意四件套齐全
Content-Security-Policy:
  script-src 'nonce-{每次响应随机}' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';

# hash 版（静态站点）
Content-Security-Policy:
  script-src 'sha256-{脚本哈希}' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';
```

这是 MDN 与 web.dev 共同的官方推荐配方。`'strict-dynamic'` 是让它能落地的关键：现代第三方脚本（统计、广告、客服挂件）普遍会再动态注入脚本，没有信任传递就会大面积拦坏。它的语义是——**被 nonce/hash 认证过的脚本，其通过 `document.createElement("script")` 动态创建的脚本自动获得信任**，并可继续传递。代价要心里有数：如果被信任的脚本存在「拿页面可注入数据当 src 建 script」的坏习惯，信任链会被借用；此外 `'strict-dynamic'` 生效时浏览器会忽略同指令的域名与 `'self'`，方便与老浏览器写兼容策略。

> nonce/hash 的语法与生成细节在上一页 [CSP 基础](./csp-basics)已讲；本页只补 strict 配方的组装逻辑。

## 二、Trusted Types：把 DOM XSS sink 关进闸门

strict CSP 挡住了「注入的脚本标签」，但 **DOM 型 XSS** 不需要新标签：第一方代码自己把攻击者可控的字符串塞进危险 API 就够了——`el.innerHTML = location.hash.slice(1)` 即是完整漏洞。这类危险 API 统称**注入 sink（injection sink）**，分三族：

| Sink 族 | 代表 API | 收的类型 |
| --- | --- | --- |
| HTML 注入 | `innerHTML`、`outerHTML`、`insertAdjacentHTML()`、`document.write()`、`iframe.srcdoc`、`DOMParser.parseFromString()`、`setHTMLUnsafe()` | `TrustedHTML` |
| 脚本执行 | `eval()`、`new Function()`、`script.text/textContent`、字符串版 `setTimeout`/`setInterval` | `TrustedScript` |
| 脚本地址 | `script.src`、`new Worker(url)`、`importScripts()`、`serviceWorker.register()` | `TrustedScriptURL` |

Trusted Types 的机制：CSP 声明后，这些 sink **拒收裸字符串**，只收经策略工厂盖章的对象：

```http
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types my-policy
# require-trusted-types-for 'script'：sink 只收 Trusted 类型，裸字符串抛 TypeError
# trusted-types my-policy：只允许创建名为 my-policy 的策略（防攻击者自建放水策略）
```

```js
// 建策略：把净化逻辑集中到唯一入口（此处接 DOMPurify）
const policy = trustedTypes.createPolicy("my-policy", {
  createHTML: (input) => DOMPurify.sanitize(input), // 净化后返回，工厂产出 TrustedHTML
});

el.innerHTML = policy.createHTML(userInput); // 通过：收到 TrustedHTML
el.innerHTML = userInput; // 强制模式下：TypeError，Console 与违规报告同时记录
```

两件迁移利器：

- **default 策略**：创建名为 `"default"` 的策略后，所有存量的裸字符串赋值会自动路由给它——先在 `createHTML` 里「净化 + console 记账」，边跑边改，而不是一开闸全站报错。若 default 策略返回 `null`/`undefined`，赋值抛 `TypeError`。
- **Report-Only 灰度**：`Content-Security-Policy-Report-Only: require-trusted-types-for 'script'` 先只收违规报告，把所有裸字符串 sink 调用点摸排干净再强制。

### 2.1 兼容性：旧认知该更新了

Trusted Types 长期被记成「Chrome 系独占」，这在 2026 年已不成立：MDN 标注其为 **Baseline 2026 Newly available——自 2026 年 2 月起在各主流浏览器最新版本全部可用**（并且可在 Web Worker 里用）。「Newly available」意味着老版本浏览器仍在存量中，所以官方给了 **tinyfill**：

```js
// tinyfill：不支持 Trusted Types 的浏览器里，createPolicy 退化为「返回规则对象本身」
if (typeof trustedTypes === "undefined")
  trustedTypes = { createPolicy: (n, rules) => rules };

// 之后同一套代码两头跑：
// 支持的浏览器 → 返回 TrustedHTML 对象，CSP 强制生效
// 不支持的浏览器 → policy.createHTML 就是普通净化函数，返回净化后的字符串
```

## 三、SRI：CDN 脚本的完整性校验

前两件管「执行什么」，SRI（Subresource Integrity）管**「拿到的文件对不对」**。威胁模型是供应链攻击：你从 CDN 挂脚本，CDN 被攻破后文件被替换——你的 CSP 白名单/nonce 照常放行它，因为「来源」没变，变的是内容。

```html
<!-- integrity：算法前缀-base64 哈希；跨域必须 crossorigin，否则整体失败 -->
<script
  src="https://cdn.example.com/lib.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"></script>
```

规则清单：

- **适用元素**：`<script>` 与 `<link>`（`rel` 为 `stylesheet`/`preload`/`modulepreload`）。
- **算法**：`sha256`/`sha384`/`sha512`。可空格分隔写多个：**混用算法时浏览器只取最强算法那组**；同算法多值**任一匹配即通过**——借此可同时放行资源的多个合法版本。
- **失败行为**：哈希不匹配 = **拒绝加载并按网络错误处理**——页面少了这个脚本该怎么坏就怎么坏，所以要有监控。
- **跨域必须走 CORS**：CDN 需返回 `Access-Control-Allow-Origin`，标签必须写 `crossorigin="anonymous"`。原因不是形式主义：若允许 no-cors 请求做完整性比对，攻击者可以「填一个猜测哈希 + 监听 error 事件」来探测跨源资源内容是否等于某个值——所以 **no-cors + integrity 一律直接失败**。

```bash
# 生成哈希（与 srihash.org 等价）
cat lib.js | openssl dgst -sha384 -binary | openssl base64 -A
```

治理升级：单靠标签属性无法保证「每个脚本都记得写 integrity」。新的 **`Integrity-Policy`** 响应头把它变成强制项：

```http
# 强制：无 integrity（或 no-cors）的脚本请求直接拦下，并向端点上报
Integrity-Policy: blocked-destinations=(script), endpoints=(integrity-endpoint)
# 灰度：只报不拦
Integrity-Policy-Report-Only: blocked-destinations=(script), endpoints=(integrity-endpoint)
```

注意 SRI 的适用边界：它适合**版本固定**的第三方资源；对「始终最新」的滚动 URL（如 `/latest/lib.js`）天然冲突——内容一变哈希即碎。这种依赖要么锁版本，要么退回 strict CSP + 自托管。

## 四、三件套怎么协同

| 攻击场景 | 谁来挡 | 怎么挡 |
| --- | --- | --- |
| 注入 `<script src=//evil>` / 内联脚本 | strict CSP | 无 nonce/hash → 不执行 |
| 第一方代码把脏字符串塞进 `innerHTML` | Trusted Types | sink 拒收裸字符串，逼流量过净化策略 |
| CDN 被黑替换 lib.js | SRI | 哈希不匹配 → 网络错误拒载 |
| 被信任脚本再拉脚本 | strict CSP 的 `'strict-dynamic'` | 信任显式传递，无需白名单 |
| 漏写 integrity 的脚本混上线 | Integrity-Policy | 头级强制 + 上报 |

部署顺序建议：**Report-Only 版 strict CSP → 强制 → Trusted Types Report-Only → default 策略过渡 → 强制 → 版本固定的第三方资源补 SRI / Integrity-Policy**。每一步都有独立收益，不必等全套就绪。

## 小结

白名单 CSP 输在「信任整个域」：JSONP/旧框架端点让白名单形同虚设，维护上还会滚出 187 个域的荒诞账单。strict CSP 用 nonce/hash + `'strict-dynamic'` + `object-src 'none'` + `base-uri 'none'` 回答「什么脚本能执行」；Trusted Types（**Baseline 2026-02，已全浏览器可用**）用 `require-trusted-types-for 'script'` + 策略工厂回答「什么字符串能进 sink」，tinyfill 一行兜住存量浏览器；SRI 用 `integrity` 哈希 + 强制 CORS 回答「文件有没有被换」，`Integrity-Policy` 再把它变成头级纪律。三层各管一段，叠满才算把注入面收干净。执行环境这层若被整个攻破怎么办？下一页[沙箱与隔离防御](./sandbox-isolation-defense)往下看一层。
