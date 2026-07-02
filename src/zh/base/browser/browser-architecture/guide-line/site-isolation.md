---
layout: doc
outline: [2, 3]
---

# 站点隔离

> 基于 Chromium 现代架构 · 核于 2026-07

## 速查

- **站点隔离（Site Isolation）**：不同 **site** 的文档**必然**进不同 renderer 进程——无论是本 tab 导航、新开 tab，还是页面里的 iframe
- **site = scheme + 注册域名（eTLD+1）**，忽略子域/端口/路径：`https://foo.example.com:8080` 的 site 是 `https://example.com`；**origin** 则是 scheme + host + port，粒度更细
- 选 site 不选 origin 的原因：兼容改 `document.domain` 跨子域互访的旧页面（该 setter 已被 MDN 标记**弃用**，新代码用 `postMessage`）
- **OOPIF（Out-of-Process iframe）**：跨站 iframe 被拆到独立进程——一个页面 = 多个进程拼合
- 动因三连：**renderer 漏洞常态化**（M69 含 10 个可利用 renderer 漏洞，M70-M73 各 5/13/13/15 个）、**UXSS** 类漏洞、**Spectre/Meltdown**（2018 年公开）——侧信道让「无 Chrome 漏洞也能读本进程任意内存」
- 结论性原则：**同进程 = 同一失陷域**，敏感数据绝不与不可信站点同进程
- **内存代价**：桌面全站点隔离约 **10-13%**（多 tab 场景，Chrome 67 口径）；Android 选择性隔离约 **3-5%**（Chrome 77 口径）
- 铺开时间线：**Chrome 67**（2018）桌面全站点默认开启（Win/Mac/Linux/ChromeOS）；**Chrome 77** Android（≥2GB RAM）隔离「用户登录过的站点」；**Chrome 92** 扩展至 OAuth 登录站点与发 COOP 头的站点，并隔离扩展页；**Chrome 110** 支持 `<webview>`
- 尚不覆盖：**Android WebView**、RAM < 2GB 的 Android 设备
- 副作用清单：跨进程布局不再同步、**unload 不保证执行**（其中 `postMessage` 可能失败）、`--disable-web-security` 调试需连带 `--disable-features=IsolateOrigins,site-per-process`
- 配套数据防线 **CORB**（跨站 HTML/XML/JSON/PDF 不进错误进程，除非 CORS 放行）为尽力而为——机理深挖归浏览器安全叶

## 一、为什么「每 tab 一进程」还不够

多进程架构把**tab 之间**隔开了，但一个 tab 内部呢？页面嵌着跨站 iframe（广告、支付、第三方登录）时，2018 年以前它们与父页面跑在**同一个 renderer 进程**里。三类威胁让这变得不可接受：

1. **renderer 漏洞是常态而非例外**。以 Chromium 自家统计为例：M69 版本内含 10 个「潜在可利用」的 renderer 组件漏洞，M70 到 M73 分别为 5、13、13、15 个——「哪怕 1 字节的缓冲区溢出也可能被做成利用链」。假设「renderer 永不失陷」不现实。
2. **UXSS（Universal Cross-Site Scripting）**：这类漏洞直接绕过 renderer 进程内实施的同源策略，且「相当常见」。
3. **Spectre / Meltdown（2018 年公开）**：CPU 推测执行的侧信道攻击，**不需要 Chrome 有任何漏洞**，就能读取本进程内存的任意内容。软件层面的同源检查在硬件侧信道面前形同虚设。

三条线索汇成一个结论：**进程是唯一靠得住的边界——不可信站点的代码，绝不能与其他站点的数据共享进程**。站点隔离由此而来：用 Chrome 的沙箱进程模型，保证不同站点永远分居不同 renderer。

## 二、site 的定义：为什么不是 origin

隔离的粒度是 **site**，不是前端更熟悉的 origin：

| 概念       | 组成                                        | `https://foo.example.com:8080` 的归属 |
| ---------- | ------------------------------------------- | ------------------------------------- |
| **origin** | scheme + host + port                        | `https://foo.example.com:8080`        |
| **site**   | scheme + 注册域名（**eTLD+1**，含公共后缀） | `https://example.com`                 |

eTLD+1 = 「有效顶级域 + 1 级」：`example.com` 是 `com` 下一级；`example.github.io` 因 `github.io` 在公共后缀列表（Public Suffix List）中，本身就是一个 site。子域、端口、路径都不参与 site 判定。

**为什么放弃更细的 origin？** 兼容性：老网页会修改 `document.domain`（如把 `a.example.com` 与 `b.example.com` 都设为 `example.com`）实现跨子域直接互访 DOM。若按 origin 分进程，这类页面会被拆进两个进程而彻底坏掉。于是 Chromium 退一步按 site 隔离——安全边界的粒度，被一个上古 API 拖住了。

> `document.domain` setter 如今已被 MDN 标记为**弃用**（破坏同源模型、招致安全 bug），跨源通信请用 `window.postMessage()`；页面可用 `Origin-Agent-Cluster` 头主动申请按 origin 隔离。

判定练习（scheme 与 eTLD+1 都相同才算同 site）：

| A                              | B                            | 同 origin？ | 同 site？ | 判定依据                     |
| ------------------------------ | ---------------------------- | ----------- | --------- | ---------------------------- |
| `https://a.example.com`        | `https://b.example.com`      | 否          | **是**    | 子域不参与 site 判定         |
| `https://example.com:8080`     | `https://example.com`        | 否          | **是**    | 端口不参与 site 判定         |
| `http://example.com`           | `https://example.com`        | 否          | **否**    | scheme 参与判定              |
| `https://a.github.io`          | `https://b.github.io`        | 否          | **否**    | `github.io` 在公共后缀列表   |

## 三、进程怎么分：OOPIF 与「一页多进程」

站点隔离下的分配规则一句话：**跨站文档永远进不同进程**——不管这次导航发生在当前 tab、新 tab，还是 iframe 里。

iframe 是重头戏。父页面 `https://news.example` 嵌入 `https://ads.example` 的 iframe 时，该 iframe 的文档在**另一个 renderer 进程**中渲染，称为 **OOPIF（Out-of-Process iframe）**。此时「一个页面」在进程视角变成了拼图：

```text
tab: https://news.example
┌──────────────────────────────────────┐
│ 主文档            ← renderer 进程 A     │
│ ┌──────────────┐ ┌─────────────────┐ │
│ │ iframe:      │ │ iframe:          │ │
│ │ ads.example  │ │ pay.example      │ │
│ │ ← 进程 B      │ │ ← 进程 C         │ │
│ └──────────────┘ └─────────────────┘ │
│ （sub.news.example 的 iframe：         │
│   与主文档同 site → 仍在进程 A）         │
└──────────────────────────────────────┘
```

这项改造是 Chromium 多年的大工程：帧树横跨进程后，DevTools、页内查找（find-in-page）、布局、输入路由都得跨进程协作。留意一个行为变化：**整页布局不再是跨进程同步的**——各 iframe 在各自进程里排版。

进程内的数据防线也要跟上：即使进程分开了，攻击者仍可在自己进程里发跨站请求把数据「拉进来」。**CORB（Cross-Origin Read Blocking）**负责拦截——跨站的 HTML/XML/JSON/PDF 响应不会交付给「不该拿到它」的进程，除非服务器用 CORS 明确放行。它是尽力而为的防线，受「资源标错 MIME 也得兼容」掣肘。

## 四、代价与铺开：一场明码标价的交易

进程更多 = 每进程一份基础设施拷贝 + 更多进程管理开销。官方口径的账单与铺开节奏：

| 平台        | 策略                                        | 内存开销        | 版本                     |
| ----------- | ------------------------------------------- | --------------- | ------------------------ |
| 桌面        | **全站点**隔离（Win/Mac/Linux/ChromeOS）    | 约 **10-13%**（多 tab 场景） | **Chrome 67**（2018）默认 |
| Android ≥2GB RAM | **选择性**：只隔离「用户登录过的站点」 | 约 **3-5%**     | **Chrome 77** 起         |
| Android（续） | 追加 OAuth 第三方登录站点、发 `Cross-Origin-Opener-Policy` 头的站点 | —— | **Chrome 92** 起 |
| 桌面（续）  | 隔离扩展页（extensions）                    | ——              | **Chrome 92**            |
| 桌面（续）  | 支持 `<webview>` 标签                       | ——              | **Chrome 110**           |
| 不覆盖      | **Android WebView**、RAM < 2GB 的 Android   | ——              | 尚未支持                 |

移动端的取舍很有代表性：内存吃紧，就只为「值得保护的站点」（用户输入过密码/登录过）开隔离——把 10-13% 的全量账单砍到 3-5%。站点可以用 COOP 头**主动**把自己列入被隔离名单。

需要手动干预时（企业策略 `SitePerProcess` / `IsolateOrigins`，flag `chrome://flags#enable-site-per-process`、`#isolate-origins`、实验性的 `#strict-origin-isolation`，命令行 `--isolate-origins=https://foo.example.com,https://[*.]corp.example.com`）可按需加严；`--disable-site-isolation-trials` 仅供测试环境。

### 4.1 亲手验证隔离在工作

- **Chrome 任务管理器**：打开一个嵌跨站 iframe 的页面，列表里会出现独立的「子框架: https://ads.example」行，有自己的进程 ID 与内存计数；同 site 的 iframe 则不会单列。
- **`chrome://process-internals`**：首页显示当前隔离模式（如 Site Per Process），Frame Trees 一栏能看到每个 frame → 进程的映射，OOPIF 一目了然。
- **对照实验**：用 `--disable-site-isolation-trials` 启动一个测试用 Chrome 再看任务管理器——子框架行消失，跨站 iframe 缩回父页进程。

## 五、对前端工程师的实际影响

- **iframe 多的页面内存显著更高**：每个跨站 iframe 都是独立进程。嵌大量第三方内容（广告位、小组件）的页面，内存账单按进程数累加。
- **unload 系列更不可靠**：站点隔离下 unload handler **不保证执行**，在 unload 里 `postMessage` 可能失败——统计上报早就该改用 `visibilitychange` + `sendBeacon`。
- **`document.domain` 别再碰**：它既是弃用 API，也是隔离粒度停留在 site 的历史包袱；跨源通信一律 `postMessage`。
- **OOPIF 对你的代码透明**：父页与跨站 iframe 间的 `postMessage` 照常工作——只是底下从「进程内传递」悄悄变成了真·跨进程 IPC，由浏览器代为路由。
- **本地调试的坑**：`--disable-web-security` 关掉的只是 renderer 内的同源检查，进程边界还在——需要连带 `--disable-features=IsolateOrigins,site-per-process` 才能让跨站文档同进程。
- **防侧信道要靠头部自觉**：`Cross-Origin-Opener-Policy`、`Cross-Origin-Resource-Policy`、`Sec-Fetch-*` 让服务器/页面主动声明隔离意愿（Post-Spectre 开发建议）。
- **强力 API 以隔离为门票**：`SharedArrayBuffer`、高精度计时等 Spectre 敏感能力，要求页面先用 COOP+COEP 达成**跨源隔离**（`self.crossOriginIsolated === true`）才开放——站点隔离世界观的应用层延伸。
- **发 COOP 头还有隐性收益**：Android 上它是「值得隔离」的信号之一（Chrome 92 起），等于给自己的站点买了进程级保镖。

本页只讲进程模型这一层；沙箱实现、CORB 判定细节与 Spectre 攻防机理，深挖见[浏览器安全](../../browser-security/)。

## 小结

站点隔离把进程边界从「每 tab」细化到「每 site」：site 取 scheme + eTLD+1（向 `document.domain` 的历史妥协），跨站文档与 iframe（OOPIF）一律分进程。动因是 renderer 漏洞常态化与 Spectre/Meltdown——同进程即同一失陷域，软件检查挡不住硬件侧信道。代价明码标价：桌面全量隔离约 10-13% 内存（Chrome 67 默认），Android 只隔离登录类站点、约 3-5%（Chrome 77 起，2GB RAM 门槛）。对前端，它解释了 iframe 多为何费内存、unload 为何愈发不可靠，也提醒我们用 COOP/CORP 头主动声明隔离。下一页回到主线，看一次导航如何在这些进程间流转：[一次导航的全流程](./navigation-flow)。
