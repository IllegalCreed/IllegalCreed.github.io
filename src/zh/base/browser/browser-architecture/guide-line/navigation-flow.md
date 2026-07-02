---
layout: doc
outline: [2, 3]
---

# 一次导航的全流程

> 基于 Chromium 现代架构 · 核于 2026-07

## 速查

- **导航（navigation）**：地址栏输入、点链接、提交表单等引发的页面加载，第一棒由 **browser 进程**执飞
- **Step 1 判定输入**：地址栏是「URL + 搜索框」二合一，**UI 线程**先判定是搜索词还是 URL
- **Step 2 开始导航**：回车 → UI 线程发起网络调用，tab 角落转 **spinner**；网络侧做 **DNS 解析、建 TLS 连接**；遇 **HTTP 301/302** 由网络侧通知 UI 线程重启一轮
- 首字节前的往返账（MDN 口径）：DNS + TCP 三次握手 + TLS 协商可累计约 **8 次往返**；响应首块约 **14KB**（TCP 慢启动）——协议细节见网络章
- **Step 3 读响应**：查 **`Content-Type`**，缺失/错误则 **MIME 嗅探**（「tricky business」）；HTML → 交渲染流程，zip/其他 → 下载管理器
- 同步安全检查：**SafeBrowsing**（恶意站警告页）+ **CORB**（敏感跨站数据不进 renderer）
- **Step 4 找 renderer**：网络请求动辄数百 ms → **Step 2 时已并行预启动 renderer**；跨站重定向时可能弃用重找
- **Step 5 commit navigation**：browser → renderer 发 **IPC** 附**数据流**；renderer 确认后——地址栏、安全指示器、站点设置 UI 更新，**session history** 入册（并落盘供恢复）
- **Step 6 加载完成**：所有 frame 的 **`onload`** 跑完 → renderer 发 IPC → UI 线程**停 spinner**；「完成」≠ 页面不再变（JS 可继续加载）
- commit 之后的解析渲染是 renderer 的戏 → [浏览器渲染原理](../../browser-rendering/)

## 一、导航是 browser 进程的主场

tab 之外的一切归 browser 进程：地址栏、书签、前进/后退按钮，以及网络与文件等特权编排。参与导航的三条线程——**UI 线程**（判定输入、编排流程）、**network 线程**（网络栈；现代 Chromium 已服务化为独立 Network Service，本页沿用「网络线程/网络侧」指代）、**storage 线程**（文件与存储）。导航就是这几位与 renderer 进程之间的一场接力：

```text
你按下回车
   │
   ▼
UI 线程 ──判定──► 网络侧 ──DNS/TLS/请求──► 响应检查（Content-Type/SafeBrowsing/CORB）
   │                                            │
   ├───（并行）预启动 renderer ◄─────数据就绪──────┘
   ▼
commit navigation（IPC + 数据流）──► renderer 解析渲染 ──onload──► 通知 UI 线程停 spinner
```

MDN 把导航定义得很宽：地址栏输入 URL、点击链接、提交表单等都算。目标只有一个——让这段用户盯着白屏或旧页面的时间尽可能短。

## 二、Step 1：这是 URL，还是搜索词

在地址栏输入内容后，第一件事发生在 UI 线程：**判定输入**。现代浏览器的地址栏同时也是搜索框，`example.com` 应当作为 URL 导航，`浏览器 架构 原理` 则要拼成搜索引擎的查询 URL。这套启发式判定（是否含 scheme、是否形如域名、是否有空格……）每次输入都在跑。

## 三、Step 2：开始导航——spinner 转起来

回车之后，UI 线程发起网络调用去取站点内容，同时 tab 角落出现**旋转的 spinner**——注意此刻显示的还是旧页面/空白，真正的页面八字没一撇。

网络侧开始跑网络栈：**DNS 解析**拿 IP、与服务器**建立 TLS 连接**，然后发出请求。这些协议本身不属本叶：DNS 见[DNS 域名系统](/zh/base/network/net-dns/)、TCP 握手见[传输层](/zh/base/network/net-transport/)、TLS 见[HTTPS 与 TLS](/zh/base/network/net-https-tls/)。这里只记一笔 MDN 口径的成本账，感受「首字节前」这段隐形延迟：DNS 查询、TCP 三次握手（SYN / SYN-ACK / ACK）加上 TLS 协商，浏览器在真正发出页面请求前可能已与服务器**往返约 8 次**；响应回来还受 TCP 慢启动限制，**首块约 14KB**。

若服务器回的是 **HTTP 301/302 重定向**，网络侧会通知 UI 线程「要转移」，然后对新 URL 再来一轮请求。

## 四、Step 3：读响应——先验明正身，再过安检

响应数据（payload）开始到达后，网络侧不会闷头转发，先做两类事：

**验明正身**。看响应头 **`Content-Type`** 声明的数据类型；但它可能缺失或干脆是错的，此时进行 **MIME 类型嗅探（MIME type sniffing）**——读开头几个字节猜类型。官方原话称之为「tricky business」，不同浏览器的猜法各不相同。分流由此决定：HTML → 走渲染流程交给 renderer；zip 包或其他文件 → 交给下载管理器。

**过安检**。两道检查同步进行：

- **SafeBrowsing**：域名或响应数据命中已知恶意站点库 → 直接展示警告页，导航到此为止；
- **CORB（Cross-Origin Read Blocking）**：确保敏感的跨站数据（HTML/XML/JSON 等）不会被送进不该拿到它的 renderer 进程——站点隔离的数据侧防线（背景见[站点隔离](./site-isolation)，机理深挖归[浏览器安全](../../browser-security/)）。

## 五、Step 4：找 renderer——其实早就备好了

检查通过、网络侧确信「该导航过去」，便通知 UI 线程：数据齐了。UI 线程去找一个 **renderer 进程**来渲染页面。

这里有个关键优化：网络请求动辄几百毫秒，干等太浪费。所以 **UI 线程早在 Step 2 发起网络请求的同时，就已并行预启动了一个 renderer**——数据一到，renderer 立即可用，两段耗时重叠掉：

```text
串行想象：  [───网络请求 300ms───][─renderer 启动 100ms─][commit...]
实际编排：  [───网络请求 300ms───][commit...]
            [renderer 启动 100ms]      ▲
            （并行预启动，早已就绪）─────┘
```

变数是重定向：若跳去了另一个站点（站点隔离要求跨站换进程），预启动的进程用不上，得另起一个——预热白做，这也是**跨站重定向比同站重定向更贵**的原因之一。

## 六、Step 5：commit navigation——一手交数据，一手改门牌

数据与 renderer 双双就绪，browser 进程向 renderer 进程发送 **IPC：commit navigation（提交导航）**，随附**数据流**让 renderer 持续接收 HTML。renderer 回执确认后，导航正式「已提交」——browser 进程这边立刻换门牌：

- **地址栏更新**：URL、**安全指示器**（锁标）、站点设置 UI 全部反映新站点；
- **会话历史（session history）更新**：本 tab 的前进/后退栈入册新条目；为支持关闭后恢复，会话历史还会**写入磁盘**（storage 线程的地盘）。

从这一刻起，tab 的内容主导权移交 renderer，进入**文档加载**阶段。

## 七、Step 6：加载完成——spinner 何时停

renderer 接管后解析 HTML、加载子资源、渲染页面（整条管线见[浏览器渲染原理](../../browser-rendering/)）。当页面**所有 frame** 的 **`onload`** 事件执行完毕，renderer 向 browser 进程发送 IPC；UI 线程收到后**停掉 spinner**。

官方在「完成」上打了引号：客户端 JS 完全可以在这之后继续拉数据、改视图——「spinner 停了」只意味着初始加载告一段落，不等于页面不再变化。对前端的暗示：把 `onload` 当「页面就绪」的唯一信号并不可靠，度量真实体验要看 LCP/INP 这类以用户为中心的指标。

## 八、全景时序：一图串起六步

```text
 UI 线程        网络侧              renderer                浏览器界面
    │              │                   │                      │
 ①判定输入         │                   │                  （旧页/空白）
 ②发起导航 ───────►│ DNS→TCP→TLS→请求  │                   spinner 转起
    ├─②'并行预启动──┼──────────────────►│（启动待命）            │
    │              │ ③响应：MIME 分流    │                      │
    │              │   SafeBrowsing/CORB│                      │
 ④数据就绪 ◄───────┘                   │                      │
 ⑤commit（IPC+数据流）────────────────►│ 确认接管           地址栏/锁标/
    │                                  │ 解析·渲染…         session history 更新
    │◄────────⑥所有 frame onload 完─────┘                   spinner 停止
```

## 九、对前端工程师的实际影响

- **白屏 ≠ 你的代码慢**：spinner 转起来到首字节之间，是判定、DNS、TCP、TLS、重定向、安检的天下——`dns-prefetch`/`preconnect`、砍重定向链，都是在优化这段「前端代码尚未登场」的时间。
- **重定向格外贵**：每跳一次重来一轮请求，跨站跳还可能作废预启动的 renderer。
- **`Content-Type` 要写对**：写错触发 MIME 嗅探，行为因浏览器而异；该 `text/html` 的回成 `application/octet-stream`，用户会收到一个下载框。
- **地址栏更新时机**：URL 与锁标在 **commit** 时才变——「回车后地址栏没变」说明导航还没走到 Step 5。
- **spinner ≠ 加载进度条**：它从 Step 2 转到 Step 6，覆盖的是「网络 + 安检 + 渲染到 onload」的总时长；SPA 内部路由切换不触发导航，spinner 根本不会动。
- **同 URL 不同结局**：同一个链接，服务器把 `Content-Disposition: attachment` 或非 HTML 的 `Content-Type` 一改，Step 3 就把它分流去下载管理器——「点了链接却弹下载」多半是响应头的事，不是前端代码的事。

## 小结

一次导航是 browser 进程主导的六步接力：UI 线程判定「URL 还是搜索词」；网络侧 DNS/TLS 取响应（首字节前可累计约 8 次往返）；对响应验 `Content-Type`（必要时 MIME 嗅探）并过 SafeBrowsing、CORB 安检；与此同时 renderer 已并行预启动；commit navigation 的 IPC 把数据流交给 renderer，地址栏与会话历史随之更新；最后所有 frame 的 onload 跑完，renderer 通知 browser 停下 spinner。看懂每一步的归属，就知道白屏时间该找谁算账。下一页处理更微妙的情形——从一个页面跳向另一个页面时的交接：[导航交接与复用](./navigation-handoff)。
