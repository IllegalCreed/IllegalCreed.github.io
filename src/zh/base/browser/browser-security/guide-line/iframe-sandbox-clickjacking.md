---
layout: doc
outline: [2, 3]
---

# iframe sandbox 与点击劫持

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- 嵌入的安全是**双向**的：`sandbox` 属性管「**我嵌的第三方**能干什么」；`frame-ancestors`/`X-Frame-Options` 管「**谁能把我**装进 iframe」（防点击劫持）
- **空 `sandbox` 最严格**：全部限制生效——不能跑脚本、不能提交表单、不能弹窗、不能导航顶层、不能开模态框，且内容被视为**不透明源（opaque origin）**，永远同源失败、无 Cookie/存储
- token 是**白名单**语义：写一个放开一项——`allow-scripts`（跑脚本）、`allow-same-origin`（保留真实源）、`allow-forms`（提交表单）、`allow-popups`（`window.open`/`target="_blank"`）、`allow-modals`、`allow-downloads`、`allow-top-navigation(-by-user-activation)` 等
- **逃逸警告**：对**同源**内容同时给 `allow-scripts` + `allow-same-origin`——内嵌文档可以**直接移除自己的 sandbox 属性**，沙箱等于没设；不可信内容必须放在**独立源**上
- **沙箱会遗传**：sandbox iframe 里开的弹窗/新标签**继承全部沙箱限制**（新页面表单会静默失效）；确需放行用 `allow-popups-to-escape-sandbox`
- 无 `allow-same-origin` 时的坑：内容源永远视为跨源——localStorage/Cookie/同源 API 全部不可用，很多第三方挂件因此「白屏但不报错」
- **CSP `sandbox` 指令**：同一套限制的响应头版（`Content-Security-Policy: sandbox allow-scripts`），由资源自己声明「请沙箱我」；**meta 里不生效**
- 点击劫持一句话：攻击者把你的页面透明叠在诱饵 UI 上骗点击（手法细节归安全章，待产出）——防御就是**控制谁能嵌你**
- **`X-Frame-Options` 是遗留头**：只有 `DENY`/`SAMEORIGIN` 两值；`ALLOW-FROM` 已废——现代浏览器遇到它会**整头忽略**（等于裸奔）；**meta 写法无效**
- **换代到 CSP `frame-ancestors`**：`'none'`（≈DENY）/`'self'`（≈SAMEORIGIN）/**来源列表**（XFO 做不到的能力）；CSP2 规定两者并存时 **frame-ancestors 优先**
- `SAMEORIGIN`/`'self'` 校验的是**整条祖先链**都同源，不止直接父级
- 默认值要记牢：**不发任何头 = 任何人都能嵌你**——后台、登录页、支付页必须显式声明

## 一、sandbox 属性：给嵌入内容关笼子

`<iframe>` 默认继承一整套 Web 能力：跑脚本、弹窗、提交表单、导航你的顶层窗口。嵌第三方内容（广告、评论挂件、用户自定义页面）时这就是攻击面。`sandbox` 属性把模型反转为**默认全禁、按 token 白名单放行**：

```html
<!-- 最严格：全部限制生效，适合展示完全不可信的静态内容 -->
<iframe sandbox src="https://untrusted.example/page.html"></iframe>

<!-- 常见配方：允许跑脚本与提交表单，但仍是不透明源、不能动顶层 -->
<iframe sandbox="allow-scripts allow-forms" src="https://widget.example/embed"></iframe>
```

空 `sandbox` 下的内嵌文档：脚本不执行、表单提交静默失败、`window.open` 静默失败、`alert()/confirm()/print()` 无效、不能锁定指针/方向、不能触发下载、不能导航 `_top`——并且**源被替换为不透明源**：同源判定永远失败，Cookie、`localStorage`、`indexedDB` 与需要源的 API 全部不可用。

## 二、token 全谱

| Token | 放行什么 |
| --- | --- |
| `allow-scripts` | 执行脚本（但不含弹窗能力） |
| `allow-same-origin` | 保留真实源——不给则视为不透明源，永远同源失败、无存储/Cookie |
| `allow-forms` | 表单提交（不给时表单能显示、能填，提交无效） |
| `allow-popups` | `window.open()`、`target="_blank"`（不给则静默失败） |
| `allow-popups-to-escape-sandbox` | 弹出的新窗口**不继承**沙箱限制（第三方广告点击跳转的标配） |
| `allow-modals` | `alert()`/`confirm()`/`prompt()`/`print()`、`<dialog>`、接收 `beforeunload` |
| `allow-downloads` | 经 `download` 属性或导航触发的文件下载 |
| `allow-top-navigation` | 导航顶层窗口（`_top`）——把用户整页带走的能力，慎给 |
| `allow-top-navigation-by-user-activation` | 同上，但**仅限用户手势触发**——防脚本自动劫持跳转 |
| `allow-top-navigation-to-custom-protocols` | 顶层导航到非 http 自定义协议（`allow-popups`/`allow-top-navigation` 会连带激活） |
| `allow-orientation-lock` | 锁定屏幕方向 |
| `allow-pointer-lock` | Pointer Lock API |
| `allow-presentation` | 发起演示会话（Presentation API） |
| `allow-storage-access-by-user-activation` | 经 Storage Access API 申请非分区 Cookie 访问 |

> 摄像头、麦克风、全屏、支付这类**强能力**不归 sandbox 管——那是 `allow` 属性（Permissions Policy）的辖区，两者叠加使用，见[能力与元数据防护](./permissions-policy-fetch-metadata)。

## 三、三个必须背下来的坑

**坑一：`allow-scripts` + `allow-same-origin` 的同源逃逸。** MDN 的原警告：当内嵌文档与宿主**同源**时，同时给这两个 token 会让内嵌文档「**移除自己的 sandbox 属性**——安全性与完全不用 sandbox 无异」。逻辑链：`allow-same-origin` 使它与父页同源 → 可访问父页 DOM → 找到自己的 `<iframe>` 节点 → `removeAttribute("sandbox")` → 重新加载后自由身。结论：**沙箱只对「独立源上的内容」才有意义**；不可信内容永远放独立域名（哪怕是子域），别与主站同源。

**坑二：沙箱遗传给弹窗。** 从沙箱 iframe 里打开的新标签/弹窗**继承同一套限制**。典型事故：广告 iframe 没给 `allow-popups-to-escape-sandbox`，用户点广告在新标签打开落地页——落地页表单全部静默失效。要么补 token，要么接受受限。

**坑三：不透明源的静默白屏。** 忘给 `allow-same-origin` 时，内容加载正常、界面正常，但一切依赖源的能力（Cookie 登录态、localStorage、带凭证请求）失效——第三方挂件表现为「白屏/加载圈但 Console 干净」。排查入口：DevTools → **Application → Frames** 选中该 frame，能看到生效的沙箱标志位。

## 四、CSP sandbox 指令：资源给自己上沙箱

同一套限制还有响应头形态——由**被嵌方或资源自己**声明：

```http
# 该文档以沙箱方式渲染：只放行脚本，其余全禁
Content-Security-Policy: sandbox allow-scripts
```

典型用途：用户上传内容（HTML 附件预览、富文本渲染服务）的响应统一加 `sandbox`，即使有人直接打开资源 URL，它也在沙箱里跑——这补上了属性方案的盲区：**`sandbox` 属性只在「被 iframe 嵌着」时有效，用户新开标签直接访问就没了笼子**。注意：该指令在 `<meta>` 里不生效（见 [CSP 基础](./csp-basics)），也不能用于 Report-Only 头。

## 五、点击劫持防护：从 X-Frame-Options 到 frame-ancestors

点击劫持（clickjacking）一句话：攻击者把你的页面装进**透明 iframe** 叠在诱饵界面上，用户以为在点抽奖按钮，实际点的是你页面里的「转账/授权/关注」（利用手法与变体归安全章，待产出）。防御的本质与 sandbox 相反——**控制谁能把我嵌走**，靠响应头：

### 5.1 X-Frame-Options（遗留）

```http
X-Frame-Options: DENY        # 任何页面都不得嵌入本文档（同源也不行）
X-Frame-Options: SAMEORIGIN  # 仅当整条祖先链全部同源时可嵌
```

三个硬知识：**`ALLOW-FROM` 已废**——现代浏览器遇到含它的头会**完全忽略整个头**，写了等于没防护，需要来源白名单必须换 CSP；**meta 写法无效**——`<meta http-equiv="X-Frame-Options">` 不被执行，只认响应头；`SAMEORIGIN` 校验**所有祖先** frame 而非只看直接父级。

### 5.2 CSP frame-ancestors（现行）

```http
Content-Security-Policy: frame-ancestors 'none'        # ≈ DENY
Content-Security-Policy: frame-ancestors 'self'        # ≈ SAMEORIGIN
# XFO 做不到的：指定可信嵌入方列表
Content-Security-Policy: frame-ancestors 'self' https://partner1.example https://partner2.example
```

对照与迁移：

| | X-Frame-Options | CSP frame-ancestors |
| --- | --- | --- |
| 全禁 | `DENY` | `'none'` |
| 仅同源 | `SAMEORIGIN` | `'self'` |
| 指定来源列表 | 不支持（ALLOW-FROM 已废） | 支持，多来源 + scheme/通配 |
| meta 下发 | 无效 | 同样无效（该指令仅响应头） |
| 并存时 | —— | **CSP2 规定 frame-ancestors 优先、XFO 应被忽略** |

部署建议：新配置直接上 `frame-ancestors`，同时保留一条 `X-Frame-Options: DENY`（或 `SAMEORIGIN`）给极老客户端兜底——两者语义要对齐，别一严一宽。Nginx 参考：

```nginx
# 登录/后台等敏感页面：禁止一切嵌入
add_header Content-Security-Policy "frame-ancestors 'none'" always;
add_header X-Frame-Options DENY always;
```

配错怎么坏：**自己的页面在自己的 iframe 里白屏**是最常见症状（把 `'none'` 发给了需要内嵌的页面）；DevTools Console 会打出「Refused to frame '…' because an ancestor violates the following Content Security Policy directive: frame-ancestors …」。反过来，**什么头都不发 = 任何人都能嵌你**——对后台系统与营销页要分别想清楚。

最后一笔：嵌第三方还有个现代变体 **`credentialless` iframe**——以无凭证的临时上下文加载对方，换取在 COEP 页面里嵌「没发 COEP 的第三方」的资格，属于跨源隔离的配套，细节见[网络章 · SameSite 与跨源隔离](/zh/base/network/net-cors/guide-line/samesite-coop-coep)。

## 小结

嵌入安全两个方向各配一把锁：向内，`sandbox` 把 iframe 反转为「默认全禁 + token 白名单」，空值最严格、内容降为不透明源；牢记三坑——同源内容给满 `allow-scripts`+`allow-same-origin` 等于自拆沙箱、弹窗继承限制、缺 `allow-same-origin` 的静默白屏；CSP `sandbox` 指令则让资源自己入笼，补上「直接访问无沙箱」的盲区。向外，防点击劫持靠「控制谁能嵌我」：`X-Frame-Options` 只剩 DENY/SAMEORIGIN 的遗留价值（ALLOW-FROM 会让整头被忽略），现行方案是 `frame-ancestors 'none'/'self'/来源列表`，两头并存时 CSP 优先——而**什么都不发就是对全网开放嵌入**。下一页从嵌入关系转向运行土壤：哪些 API 只肯在安全的上下文里开张——[安全上下文与混合内容](./secure-contexts-mixed-content)。
