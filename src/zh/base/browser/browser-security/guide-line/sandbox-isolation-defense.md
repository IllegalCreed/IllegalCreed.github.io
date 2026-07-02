---
layout: doc
outline: [2, 3]
---

# 沙箱与隔离防御

> 基于 Chromium 安全架构 · 核于 2026-07

## 速查

- 本页的威胁模型比 XSS 更狠一层：**假设 renderer 进程已被完全攻破**（渲染引擎 0day、UXSS），防线还能守住什么
- **渲染器沙箱（renderer sandbox）**：renderer 进程被 OS 级沙箱剥夺直接系统调用权——**读写任意文件、访问设备一律不行**，所有特权操作必须经 IPC 请求 browser 进程代办
- 四层防御纵深：**① renderer 内的 Web 安全检查**（同源策略等）→ **② 站点隔离**（不同 site 必分进程）→ **③ OS 沙箱**（断本地资源）→ **④ browser 进程终审**（校验 renderer 请求、发现越权直接终止进程）
- **Spectre（2018）**：CPU 推测执行侧信道，**不需要浏览器有任何 bug** 就能读取**本进程**任意内存——软件层的同源检查在它面前失效，唯一可靠边界是**进程**
- 浏览器对 Spectre 的三板斧：**站点隔离**（敏感数据根本不进攻击者进程）、**降低计时器精度**（侧信道要靠高精度计时测缓存命中）、**高危能力上锁**（`SharedArrayBuffer` 等只对跨源隔离页面开放，见[网络章 · COOP/COEP](/zh/base/network/net-cors/guide-line/samesite-coop-coep)）
- **CORB（Cross-Origin Read Blocking）**：进程隔离的配套数据防线——跨站的 **HTML/XML/JSON（及 PDF 等）**响应不交付给发起请求的渲染进程，除非服务器经 CORS 明确放行
- CORB 是**尽力而为**：受「MIME 标错也要兼容」掣肘（如标成 HTML 的 JS 文件）；标准化的继任者是 **ORB（Opaque Response Blocking）**——思路反转为「默认拦下无法证明是合法子资源的不透明响应」，已进入 Fetch 标准
- browser 进程掌握「哪个进程属于哪个 site」，据此**限制 Cookie、保存的密码等站点数据只发给对应进程**——失陷 renderer 冒领他站数据会被拒绝甚至击杀
- 站点隔离的**进程模型本体**（site 粒度、OOPIF、内存代价、验证方法）在兄弟叶[浏览器架构 · 站点隔离](../../browser-architecture/guide-line/site-isolation)，本页只讲防御视角
- 前端能做的配合：`Cross-Origin-Resource-Policy` / `Cross-Origin-Opener-Policy` 声明隔离意愿（归网络章）、服务端检查 **`Sec-Fetch-*`**（见[能力与元数据防护](./permissions-policy-fetch-metadata)）
- 局限清单：隔离粒度是 **site 而非 origin**、Android WebView 与低内存安卓未覆盖、CORB 有兼容性豁免——纵深防御不承诺单层完美

## 一、威胁模型：当「防止被攻破」不再够用

前两页的机制都预设「渲染引擎还听你的」。本页换一个更悲观、也更真实的前提——**renderer 迟早会被攻破**：

- **渲染引擎漏洞是常态**。解析 HTML/CSS/JS/字体/图片的代码量巨大，Chromium 自家统计显示每个版本都存在个位数到两位数的「潜在可利用」renderer 漏洞。
- **UXSS（Universal XSS）**：绕过 renderer 内同源策略实施的漏洞类别，历史上「相当常见」——不用攻破进程，只要骗过检查。
- **Spectre/Meltdown（2018 公开）**：下探到硬件层——CPU 推测执行的侧信道让代码**无需任何浏览器漏洞**就能读取本进程内存的任意内容。

第三条是分水岭：同源策略是 renderer 进程**内**的软件检查，而 Spectre 读内存根本不走检查。Chromium 安全文档的结论——**唯一靠得住的边界是进程**；防御目标从「不被攻破」降级为更可达成的「**被攻破的进程里没有值得偷的东西，也干不成坏事**」。

## 二、渲染器沙箱：断掉通向系统的手脚

第一件事是限制失陷进程**对本机**的伤害。renderer 进程在启动时就被套上 OS 级沙箱：

- **没有直接系统调用权**：不能任意打开文件、访问设备、建原始网络连接。Chromium 文档的表述——沙箱「防止失陷的 renderer 进程访问任意本地资源（如文件、设备）」。
- **一切特权操作走代理**：读文件、发网络请求都要通过 IPC 向 browser 进程（或 Network Service）**提交申请**，由特权进程校验后代办。
- 对前端的可见后果：网页里「任意读用户磁盘」这类能力从架构上不存在；文件访问全部经 `<input type="file">`、拖放、File System API 等**用户显式授权**的窄门进入。

沙箱管住了「向下」（本机），管不住「向内」——同进程内存里已有的数据，Spectre 照读。所以需要下一层。

## 三、四层纵深：每层假设上一层失守

Chromium 把防线叠成四层，次序讲究——**越往下，信任的代码越少**：

| 层 | 机制 | 假设 | 失守时的下一层 |
| --- | --- | --- | --- |
| ① | renderer 内 Web 安全检查（同源策略、CSP 执行……） | 渲染引擎无 bug | UXSS/引擎漏洞 → ② |
| ② | **站点隔离**：不同 site 必进不同 renderer 进程 | 进程边界可靠 | 数据「被拉进」本进程 → ③ 的 CORB 与 ④ |
| ③ | **OS 沙箱**：进程无本地资源访问权 | —— | 失陷进程伤不到本机 |
| ④ | **browser 进程终审**：校验 renderer 的每个特权请求 | browser 进程自身可信 | 检测到越权 → **终止该 renderer** |

第 ④ 层值得展开：browser 进程知道每个 renderer 进程**属于哪个 site**，于是可以按进程发放数据——

- 某 site 的 **Cookie、保存的密码**等敏感数据，只交给该 site 的进程；
- 失陷 renderer 通过 IPC 冒领其他站点数据时，browser 进程的安全检查能**识破并直接杀掉这个进程**（Chromium 原话：安全检查「可以检测并终止行为异常的 renderer」）。

这套账在兄弟叶[站点隔离](../../browser-architecture/guide-line/site-isolation)里已算过成本（桌面全量隔离约 10-13% 内存、Chrome 67 起默认）；本页记住它的防御语义即可：**同进程 = 同一失陷域，跨 site 数据绝不同进程**。

## 四、Spectre：侧信道与浏览器的应对

Spectre 的机制细节归体系结构，前端只需要三个事实：

1. **读的是「本进程」内存**——所以把敏感数据挡在进程之外（站点隔离）是治本。
2. **攻击要靠高精度计时**——通过测量缓存命中/未命中的纳秒级时差来「读」内存。浏览器因此在 2018 年后**统一降低了计时器精度**并加入抖动。
3. **高危能力被上锁**——`SharedArrayBuffer` 本质是「自带高精度计时器的共享内存」，Spectre 披露后被各浏览器紧急下架；如今要用它（以及恢复高精度计时），页面必须先用 COOP + COEP 达成**跨源隔离**（`self.crossOriginIsolated === true`）——用「主动声明隔离」换回强能力。头的语义与配置见[网络章 · SameSite 与跨源隔离](/zh/base/network/net-cors/guide-line/samesite-coop-coep)，此处不重讲。

## 五、CORB/ORB：别让数据走进敌营

站点隔离分开了进程，但有个缺口：失陷 renderer 可以**自己发起**跨站子资源请求——`<img src="https://bank.example/api/balance.json">`。图片解码当然失败，但在没有防护的世界里，**响应字节已经进入进程内存**，Spectre 接手就能读。

**CORB（Cross-Origin Read Blocking）**堵的就是这条路。Chromium 文档的表述：**跨站数据（如 HTML、XML、JSON、PDF 文件）不会交付给网页所在进程，除非服务器声明允许**（CORS 放行）。判定要点：

- 保护对象是「**只该被同站读取的数据型响应**」——HTML/XML/JSON 几乎不可能是合法的 `<img>`/`<script>` 子资源；
- 命中时响应体被替换为空，渲染进程**从未见过那些字节**；DevTools 里资源显示为空响应；
- 服务器配合手段：把 MIME 标对、加 `X-Content-Type-Options: nosniff`、用 `Cross-Origin-Resource-Policy` 显式声明资源归属（头细节归网络章）。

CORB 的局限 Chromium 自己写得很直白：它是**尽力而为（best effort）**——Web 上大量资源 MIME 标错（JS 文件标成 `text/html` 之类），为不拦坏正常网站只能网开一面。标准化的继任者 **ORB（Opaque Response Blocking）** 把思路反转：不再「拦截已知敏感类型」，而是**默认拦下所有无法证明是图片/媒体/脚本等合法子资源的不透明响应**——白名单代替黑名单，已写入 Fetch 标准并被各引擎逐步落地。

## 六、前端工程师的行动清单

这层防御大多由浏览器出厂自带，但有四件事在你手里：

- **给数据型接口标准 MIME + `nosniff`**：让 CORB/ORB 能可靠识别你的 JSON，不给嗅探豁免留空间。
- **发 `Cross-Origin-Resource-Policy`**：显式声明「本资源只许同源/同站使用」，比依赖 CORB 推断更硬（配置见网络章）。
- **需要 `SharedArrayBuffer`/高精度计时/WASM 多线程时**，按 COOP+COEP 把页面做成跨源隔离——这是能力的入场券。
- **服务端用 `Sec-Fetch-*` 识别跨站请求**并直接拒绝——浏览器把请求来源如实告诉你了，别浪费，见[能力与元数据防护](./permissions-policy-fetch-metadata)。

## 小结

本页把威胁模型推到最坏：renderer 必然会被攻破（引擎漏洞、UXSS），Spectre 甚至不需要漏洞就能读本进程内存。应对是四层纵深——renderer 内检查、站点隔离、OS 沙箱、browser 进程终审——核心信条「**唯一可靠的边界是进程**」：沙箱断掉失陷进程伤害本机的手脚，站点隔离保证敌营里没有他站数据，CORB/ORB 拦住「主动把数据拉进敌营」的旁门（并向白名单式的 ORB 演进），browser 进程按 site 发放 Cookie/密码并击杀越权进程。前端的配合动作：MIME 标对 + `nosniff`、发 CORP、需要强能力时做跨源隔离。进程这层看完，回到页面内的嵌入关系——iframe 怎么关笼子、自己怎么不被别人装进笼子：[iframe sandbox 与点击劫持](./iframe-sandbox-clickjacking)。
