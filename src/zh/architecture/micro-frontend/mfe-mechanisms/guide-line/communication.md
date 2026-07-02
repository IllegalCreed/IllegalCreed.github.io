---
layout: doc
outline: [2, 3]
---

# 应用间通信

> 基于微前端 2026 生态 · 核于 2026-07

## 速查

- 第一原则是**少通信**：single-spa 官方立场——UI 状态极少需要跨应用共享，「如果两个微前端间频繁通信，说明它们耦合过度，应考虑合并」；Fowler 同调：通信应**间接、少耦合**
- 五模式按方向与耦合排布：**props 下行**（容器→子应用，含 CustomElement 的 `attributeChangedCallback` 形态）、**CustomEvent 上行**（子→主，冒泡 + 团队前缀命名）、**发布订阅/全局状态**（qiankun `initGlobalState` 型、wujie 去中心化 EventBus）、**URL 即通信**（Fowler 力荐：倒逼忠实建模）、**utility module 直接 import**（single-spa 首选）
- single-spa **明确反对全局 Redux/Mobx**：依赖全局 state 形状或他人 dispatch 的 action，微前端就**无法真正独立部署**——各应用自持状态，共享走导出 API
- `initGlobalState` 型三件套：`onGlobalStateChange(cb, fireImmediately)` 监听 / `setGlobalState` 修改（**只能改第一层属性**）/ `offGlobalStateChange` 卸载时移除
- URL 通信的六个优点（Fowler 原文）：开放标准、页面上任何代码**全局可见**、容量有限**倒逼只传小数据**、面向用户**倒逼忠实建模领域**、声明式而非命令式、强制间接通信互不依赖
- **postMessage** 是跨域 iframe 场景的唯一通道：消息经**结构化克隆**（structured clone）序列化——能传 `Object`/`Array`/`Map`/`Set`/`Date`/`RegExp`/`ArrayBuffer`/`Blob`/`File`；**传不了函数与 DOM 节点**，类实例只剩自有数据属性（**原型链丢失**）
- 发送端安全底线（MDN 原话级）：**发敏感数据必须写精确 `targetOrigin`，绝不用 `*`**——「恶意站点可在你不知情时改掉窗口的 location，从而截获 postMessage 发送的数据」；省略时默认 `"/"`（仅同源）
- 接收端安全底线：**必须校验 `event.origin`**（可再加 `event.source`）——MDN：「不校验 origin 与 source 会造成跨站脚本攻击」；且校验完身份还要**校验消息语法**；不期望收消息就**别挂 `message` 监听**（万无一失的做法）
- `event.origin` 是**发送时刻**的 origin，不保证窗口现在还在那个 origin；回信写 `event.source.postMessage(reply, event.origin)`
- **MessageChannel**：把 `port2` 经 postMessage 转移给对方，后续通信走专用双向管道（不再广播、不再逐条校验 origin）；`transfer` 数组里的可转移对象（`ArrayBuffer`/`MessagePort` 等）**转移后原端不可用**
- 与沙箱路线的勾稽：wujie 子应用 iframe 与主应用**同域**，`window.parent` 直接调用即可，**不需要** postMessage；真正跨域 iframe 集成才必须 postMessage + origin 白名单

## 一、先问要不要通信

通信机制选型之前，先过一道架构闸门。single-spa 官方文档在这件事上的表态罕见地强硬：跨微前端共享 UI 状态的需求**本身就该被怀疑**——「如果你发现两个微前端之间需要频繁共享状态，考虑把它们合并」。Fowler 给的正面标准同样明确：好的微前端架构里应用之间**间接通信、互不知晓**。

这不是洁癖，而是因果链：通信通道一旦建立，两端就有了**共同的协议要维护**——协议变更要两边同步发版，「独立部署」名存实亡。所以五种模式的排序原则是：**能靠路由解决的不建通道，能单向的不双向，能显式契约的不全局广播**。

## 二、五模式逐个过

### 1. props 下行：容器把数据递下去

最朴素也最健康的方向：主应用（容器）在挂载子应用时把数据与回调递进去——Fowler 认可的「React 式 callbacks and data downwards」。生命周期型框架落在 mount props 上（qiankun `registerMicroApps` 的 `props`、single-spa 的 custom props）；**CustomElement 容器型**框架（micro-app 代表）则多一条 Web 标准通道：容器改标签属性/property，子应用侧由 CE 生命周期回调 `attributeChangedCallback` 感知变化（micro-app 的 `data` 属性 + `setData` 即这一形态的封装；CustomElement 标准本体属 Web API 章，待产出）。

适用边界清晰：**父知子**的场景（登录态、主题、语言下发）。局限也天然：只有下行方向，且子应用要跟容器约定 props 形状——契约仍在，只是被限制在挂载点一处。

### 2. CustomEvent 上行:子应用冒泡喊话

子应用要往上报事（「购物车加了一件」），DOM 自带的 `CustomEvent` 是零依赖方案：

```js
// 子应用：从自己的容器节点冒泡上去，detail 携带数据
container.dispatchEvent(
  new CustomEvent("team-checkout:cart-add", {
    detail: { sku: "A-1024", count: 1 },
    bubbles: true, // 冒泡到主应用监听层
  }),
);

// 主应用：在容器外层统一收
document.addEventListener("team-checkout:cart-add", (e) => {
  updateCartBadge(e.detail);
});
```

Fowler 对它的定位：「custom events 让微前端**间接**通信，是把耦合降到最低的好办法」。single-spa 也把 `window.dispatchEvent`/`addEventListener` 列为可选事件机制（与 RxJS Subject 并列）。实践要点一条：**事件名带团队/应用前缀**（`team-checkout:` 型命名空间）——事件名是页面级全局命名空间，不带前缀迟早撞车。局限与 props 对偶：只适合「广播事实」，不适合请求-响应；事件是**发后不管**（fire-and-forget），先发出的事件不会补发给后来的监听者。

### 3. 发布订阅 / 全局状态：框架内置的广播台

把「事件 + 数据快照」封装成状态中心，是框架们的通用答案。qiankun 的 `initGlobalState` 是典型形态：

```js
// 主应用：初始化全局状态，拿到 actions
const actions = initGlobalState({ user: { name: "alice" }, theme: "dark" });

// 任一应用：监听变化（fireImmediately: true 时注册即回放当前值，缓解「先发后订」丢消息）
actions.onGlobalStateChange((state, prev) => applyTheme(state.theme), true);

// 任一应用：修改 —— 注意只能修改第一层属性
actions.setGlobalState({ theme: "light" });

// 子应用卸载时：必须移除监听，否则就是跨应用的内存泄漏
actions.offGlobalStateChange();
```

wujie 的对应物是**去中心化 EventBus**（不依赖主应用中转，任意应用间收发）。这一模式的甜区是「少量、低频、全局关心」的状态：登录态、主题、语言。风险则要背下来：**广播没有 schema**——谁都能发、字段随口约定，规模一大就是「事件满天飞、没人说得清谁在听」；时序问题（先 set 后订阅是否能拿到值，取决于有没有 `fireImmediately` 型回放）；以及卸载不解绑造成的监听泄漏。single-spa 反对全局 Redux/Mobx 的理由在这里同样成立一半——区别在于 `initGlobalState` 型方案只共享**数据**不共享 **store 形状与 reducer 逻辑**，耦合半径小得多，但仍要克制使用。

### 4. URL 即通信：把状态写进地址栏

Fowler 在文章里为「address bar 作为通信机制」列了一串优点，值得全文背诵级引用——URL 结构是**定义良好的开放标准**；对页面上**任何代码全局可见**；**容量有限，倒逼你只传少量数据**；**面向用户，倒逼你的结构忠实地建模领域**（用户能看懂、能收藏、能分享的 URL，往往就是好的领域建模）；**声明式**而非命令式（「我们现在在这里」，而不是「请你做什么」）；**强制微前端间接通信**、互不直接依赖。

```text
https://shop.example.com/order/1024?tab=logistics
        └── 主应用路由：订单域   └── 子应用内状态：当前页签
```

选中的订单 id、激活的页签——这类状态放 URL 而不是全局 store，刷新即恢复、跨应用天然同步（大家都读同一根地址栏）、还免费获得深链接。它的适用边界由自身优点反推：**只适合小而可公开的状态**——放不下大对象，也不该放敏感数据。

### 5. utility module：直接 import 共享模块

single-spa 官方的**首选**（文档称 cross microfrontend imports）：把共享逻辑做成一个独立构建、独立部署的 **in-browser module**（utility module），其他应用像用 npm 包一样 `import` 它：

```js
// @org/api 模块（独立部署的 utility module）导出带缓存的用户信息获取
import { getLoggedInUser, authenticatedFetch } from "@org/api";

const user = await getLoggedInUser(); // 多应用调用共享同一份缓存，避免重复请求
```

这一模式的通信是**显式函数契约**：类型可查、可版本化、可单测——五模式里唯一有真实 API 边界的。single-spa 同时给出反面清单：核心团队「**caution against** redux、mobx 及其他全局状态管理库」——一旦各应用依赖全局 store 的形状、或依赖其他应用 dispatch 的 action，它们就**不能真正独立部署**了；正确姿势是**各应用自持状态**，跨应用共享的只有 utility module 导出的函数与数据缓存。落地依赖模块加载基建（import maps 或 MF，见[依赖共享三路线](./dependency-sharing)）。

## 三、postMessage 深讲：跨浏览上下文的正门

前五种模式都活在**同一个 JS 上下文**里。一旦子应用跑在 iframe（尤其跨域 iframe）中，同上下文假设失效，浏览器给的唯一正门是 [`window.postMessage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)。这个 API 的每个参数都有安全含义，值得逐项过。

### 消息能带什么：结构化克隆

消息经**结构化克隆算法**（structured clone）序列化，能力比 JSON 大一圈：`Object`/`Array`/`Map`/`Set`/`Date`/`RegExp`/`ArrayBuffer`/`TypedArray`/`Blob`/`File` 都能过。三样过不去的要记牢：**函数**（想传能力就传 MessagePort）、**DOM 节点**、`Symbol`；类实例能过但**原型链丢失**——到对面只剩自有数据属性，`instanceof` 判定全部失效。所以跨 iframe 协议一律按**纯数据 + 类型字段**设计（`{ type: "cart:add", payload: {…} }`）。

### 发送端：targetOrigin 不是可选项

```js
// 发送端：第二个参数写死预期接收方的精确 origin
iframe.contentWindow.postMessage(
  { type: "auth:token", payload: token },
  "https://sub.example.com", // 若窗口已被导航到别的源，消息直接不投递
);
```

MDN 的安全告诫接近原话级：**给其他窗口发数据时，永远指定精确的 targetOrigin，不要用 `*`**——「恶意站点可以在你不知情的情况下改变窗口的 location，从而**截获**用 postMessage 发送的数据」。省略该参数时默认值是 `"/"`（仅投递给同源窗口）；`"*"` 唯一合理的场景是接收方是 `data:` URL 这类 opaque origin（没法精确匹配）——而那本身就该触发你重新审视方案。

### 接收端：origin 校验的标准写法

```js
// 接收端：白名单校验 origin → 校验消息语法 → 才处理
const TRUSTED_ORIGINS = new Set(["https://main.example.com"]);

window.addEventListener("message", (event) => {
  if (!TRUSTED_ORIGINS.has(event.origin)) return; // ① 身份：不在白名单直接丢弃
  const { type, payload } = event.data ?? {};
  if (typeof type !== "string") return;           // ② 语法：schema 不对也丢弃
  handlers[type]?.(payload);                       // ③ 按类型分发，绝不 eval 消息内容
});
```

MDN 把利害说得很重：「**不校验 `origin`（以及可能的 `source`）就是在给跨站脚本攻击开门**」——任何窗口都可以往你这儿投消息，页面里嵌的第三方 iframe 也不例外。三条纪律：**不期望收消息就不要挂 `message` 监听器**（MDN 称之为万无一失的做法）；期望收，就用 `event.origin`（必要时加 `event.source`）做**白名单**校验；身份过了还要**校验消息语法**——否则你信任的那一方有洞，就会顺着通道变成你的洞（origin 概念与更多攻防见[浏览器安全](/zh/base/browser/browser-security/)）。两个细节：`event.origin` 是**发送时刻**的 origin，不保证对方窗口现在还在那个源上；回信的标准姿势是 `event.source.postMessage(reply, event.origin)`——拿发来的 origin 当回信的 targetOrigin。

### 升级形态：MessageChannel 专线

广播 + 逐条校验的模式在高频通信下既啰嗦又易错，`MessageChannel` 提供专线方案：

```js
// 主应用：建通道，port2 作为「话筒」转移给 iframe
const { port1, port2 } = new MessageChannel();
iframe.contentWindow.postMessage({ type: "init" }, "https://sub.example.com", [port2]);
port1.onmessage = (e) => console.log("子应用说：", e.data);

// 子应用：从首条消息里接住 port，此后走专线对讲
window.addEventListener("message", (event) => {
  if (event.origin !== "https://main.example.com") return; // 首次握手仍要校验
  const [port] = event.ports;
  port.postMessage("ready"); // 专线通信：不再广播、不再逐条对 origin
});
```

`transfer` 数组（第三个参数）里的对象走**所有权转移**而非拷贝——`MessagePort`、`ArrayBuffer` 等转移后**原端立即不可用**（大数据零拷贝的关键）。握手一次校验 origin，之后通道两端点对点，协议清爽得多。同源多标签页广播则另有 `BroadcastChannel`，不在跨源话题内。

### 与沙箱路线的勾稽

postMessage 与 [iframe 沙箱路线](./js-sandbox)的关系常被想当然。事实是：**wujie 恰恰不靠 postMessage**——它的子应用 iframe 与主应用**同域**，`window.parent` 拿到的就是主应用真 window，函数直接调用、对象直接引用（wujie 三层通信：props、`window.parent` 直通、EventBus），根本不需要序列化。postMessage 真正的主场是**跨域 iframe 集成**：嵌第三方应用、跨公司协作、遗留系统乐高——那里同域假设不成立，结构化克隆 + origin 白名单是唯一安全走法（iframe 嵌入属性与加固见 [iframe 嵌入](/zh/base/language/html/html-media/guide-line/iframe-embedding)与[浏览器安全](/zh/base/browser/browser-security/)）。

## 四、选型判据

| 模式 | 方向 | 耦合物 | 跨域 iframe | 甜区 | 典型坏法 |
| --- | --- | --- | --- | --- | --- |
| props 下行 | 主→子 | props 形状契约 | 否 | 登录态/主题/回调下发 | 契约膨胀成「万能 props 袋」 |
| CustomEvent 上行 | 子→主 | 事件名 + detail 结构 | 否 | 子应用广播领域事实 | 无前缀撞名、拿事件做请求-响应 |
| 发布订阅/全局状态 | 多↔多 | 状态字段的隐式约定 | 否 | 少量全局共享态 | 事件满天飞、卸载不解绑 |
| URL 即通信 | 多↔多 | 路由结构（公开契约） | 是（地址栏共享） | 页面级状态、深链接 | 敏感数据进 URL、塞大对象 |
| utility module | 调用方→模块 | 显式导出 API | 否 | 共享逻辑/请求缓存 | 演化成事实上的全局 store |
| postMessage | 双向 | 消息 schema + origin 白名单 | **是（唯一正门）** | 跨域 iframe 集成 | `targetOrigin: "*"`、不校验 origin |

判读顺序建议：先试 **URL**（要传的是不是页面级状态？）→ 再看方向（单向下发用 **props**、单向上报用 **CustomEvent**）→ 共享逻辑抽 **utility module** → 全局态才动用**发布订阅**并克制字段 → 跨域 iframe 别无选择，**postMessage** 按安全写法来。

## 小结

通信机制的谱系一头连着架构（少通信、间接通信、能合并就别拆），一头连着 Web 平台的安全模型。同上下文五模式各守一个方向：props 管下行、CustomEvent 管上行、发布订阅管全局态（`initGlobalState` 型三件套 + 卸载解绑）、URL 管页面级状态（Fowler 六优点，本质是拿开放标准当总线）、utility module 管共享逻辑（single-spa 首选，同时点名反对全局 Redux）。跨域 iframe 则是 postMessage 的主场——结构化克隆定了「能传什么」（无函数、无 DOM、原型丢失），`targetOrigin` 与 `origin` 白名单定了「安全怎么写」，MessageChannel 把广播升级成专线。而 wujie 的同域 iframe 设计提醒我们：通信方案永远是沙箱路线的下游——先定隔离模型，再选通信通道。应用会说话了，下一个问题是别让它们各背一份 React：[依赖共享三路线](./dependency-sharing)。
