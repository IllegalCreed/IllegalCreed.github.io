---
layout: doc
outline: [2, 3]
---

# JS 沙箱谱系

> 基于微前端 2026 生态 · 核于 2026-07

## 速查

- JS 沙箱防三类事故：**全局变量污染**（`window.x` 互踩）、**事件监听残留**（卸载后 `addEventListener` 还挂着）、**定时器泄漏**（`setInterval` 无人清理）——卸载组件 ≠ 清理副作用
- **快照沙箱（Snapshot Sandbox）**：激活时给 `window` 拍快照，失活时 diff 出改动、恢复快照并记入 `modifyPropsMap`，再激活时回放——**只能单实例**（大家共用同一个真 `window`，两个应用同时活跃时 diff 无法归因），每次切换要**全量遍历 `window`** 两遍
- **Proxy 沙箱（fakeWindow）**：每个应用一个 fakeWindow + `Proxy`，**写落假对象、读先假后真**——天然**多实例**，卸载即丢弃 fakeWindow，零恢复成本；qiankun `proxySandbox` 是路线代表
- qiankun 沙箱用 **Proxy 代理父页面 `window`** 实现（官方 FAQ 原文）；无 Proxy 的旧环境（IE）自动降级快照沙箱并强制 `singular: true`
- qiankun 还有个过渡态 **legacySandbox**：用 Proxy 记录差异但仍写真 `window`，省去全量遍历、仍是单实例——理解成「Proxy 实现的快照沙箱」
- **with + Proxy**（micro-app 默认）：子应用代码包进 `with(proxyWindow){}`，**作用域链第一站**被换成代理——连不带 `window.` 前缀的全局读写都拦得住；副作用是顶层 `var`/`function` 不再泄漏为全局 → 库找不到时报 `xxx is not defined`
- with 的代价：**每次变量查找都要过一遍 Proxy 的 `has`/`get`**，且 `with` 无法被引擎优化——wujie 文档明确以「规避 `with(proxyWindow){code}` 的性能损耗」作为选 iframe 路线的理由
- **iframe 沙箱**（wujie 路线）：子应用 JS 在**同域 iframe** 中运行，`window`/`history`/`location`/`document` 全部浏览器原生隔离——物理隔离、无查找税；DOM 则渲染在主文档的 WebComponent 容器里，靠代理 iframe 的 document 查询接口缝合
- micro-app 1.0 的**可选 iframe 沙箱**有个同域坑：iframe `src` 必须指向主应用域名，初始化时**有几率把主应用静态资源加载一遍**——解法是 `iframeSrc` 指向空 HTML，或主应用 `head` 最前插 `if (window.parent !== window) window.stop()`
- 所有非 iframe 沙箱都只是**尽力而为的软隔离**：`window.top`、原生构造函数、未被代理的 API 都是逃逸面——防的是意外冲突，不是恶意代码
- **ShadowRealm**（TC39 **Stage 2.7**）：语言层标准沙箱——独立 `globalThis` + 全套内建副本；**callable boundary** 只允许原始值与函数跨界，对象过不去；只作前瞻评估，尚无生产可用的浏览器原生实现

## 一、为什么需要 JS 沙箱

单页应用的心智是「整个 `window` 都是我的」；微前端把多个这样的应用放进同一个页面，`window` 就成了没有门禁的公共黑板。三类典型事故：

```js
// 事故一：全局变量互踩 —— A 写的配置被 B 覆盖
window.__APP_CONFIG__ = { theme: "dark" }; // 子应用 A
window.__APP_CONFIG__ = { theme: "light" }; // 子应用 B 加载后，A 的行为悄悄变了

// 事故二：事件监听残留 —— A 卸载了，监听器还在替它上班
window.addEventListener("resize", recalcLayoutOfAppA); // A 挂载时注册
// A 的 DOM 已被移除，resize 一触发，recalcLayoutOfAppA 对着空容器报错

// 事故三：定时器泄漏 —— 轮询跟着页面活到天荒地老
setInterval(() => fetchDashboardData(), 5000); // A 的轮询，卸载时无人 clearInterval
```

根因是**卸载 DOM ≠ 清理副作用**。框架组件的生命周期只管自己创建的东西，而子应用往 `window`、`document`、定时器队列里写的一切，都活在框架视野之外。沙箱的任务就是给每个子应用一个「看起来是全局、实际被记账」的执行环境：要么**事后恢复**（快照），要么**写时隔离**（Proxy/with），要么**物理分家**（iframe）。

> 先划清边界：这里的沙箱防的是**意外冲突**，不是恶意代码。微前端的子应用是自家团队写的，目标是「别互相伤害」；真要跑不可信代码，那是 iframe `sandbox` 属性与进程隔离的领域（见 [iframe 嵌入](/zh/base/language/html/html-media/guide-line/iframe-embedding)与[浏览器安全](/zh/base/browser/browser-security/)）。

## 二、快照沙箱：diff window 的事后恢复

第一代方案思路最朴素——不拦截、不代理，**换应用时把 `window` 恢复原样**：

```js
/** 快照沙箱最小骨架：激活拍快照，失活 diff 恢复 */
class SnapshotSandbox {
  windowSnapshot = {}; // 激活时的 window 快照
  modifyPropsMap = {}; // 本应用对 window 的改动记录

  /** 激活：拍快照，并回放上次的改动（恢复应用自己的现场） */
  active() {
    for (const prop in window) {
      this.windowSnapshot[prop] = window[prop]; // 全量遍历一遍
    }
    Object.keys(this.modifyPropsMap).forEach((p) => {
      window[p] = this.modifyPropsMap[p];
    });
  }

  /** 失活：再遍历一遍，diff 出改动存下来，把 window 恢复成快照 */
  inactive() {
    for (const prop in window) {
      if (window[prop] !== this.windowSnapshot[prop]) {
        this.modifyPropsMap[prop] = window[prop]; // 记下「我改了什么」
        window[prop] = this.windowSnapshot[prop]; // 还给世界一个干净的 window
      }
    }
  }
}
```

两个结构性缺陷都写在代码里：

1. **只能单实例**。运行期大家写的是**同一个真 `window`**，如果 A、B 同时活跃，失活 diff 时根本分不清哪个改动是谁的——「恢复快照」会把还活着的 B 的状态一并抹掉。所以快照沙箱的世界里，**同一时刻只能有一个子应用**。qiankun 在不支持 Proxy 的环境（IE）正是自动降级到这条路，并强制 `singular: true`。
2. **切换成本随 `window` 膨胀**。每次激活/失活都要 `for...in` 全量遍历 `window`（属性数以千计），应用切换越频繁、页面越复杂，这笔遍历税越显眼。

它的历史价值是兼容性：不依赖任何 ES6+ 能力。2026 年还讲它，是因为「diff + 恢复」的思路帮你理解后面所有方案在优化什么。

## 三、Proxy 沙箱：fakeWindow 的写时隔离

ES6 `Proxy` 让「拦截对 `window` 的读写」成为可能，思路从事后恢复升级为**写时隔离**：

```js
/** Proxy 沙箱最小骨架：写落 fakeWindow，读先假后真 */
class ProxySandbox {
  proxy;
  running = false;

  constructor() {
    const fakeWindow = {}; // 本应用的「私有 window」
    this.proxy = new Proxy(fakeWindow, {
      set: (target, prop, value) => {
        if (this.running) target[prop] = value; // 写操作永远落在假对象上
        return true;
      },
      get: (target, prop) => {
        // 读操作：自己改过的读自己的，没改过的透传真 window
        return prop in target ? target[prop] : window[prop];
      },
      has: (target, prop) => prop in target || prop in window,
    });
  }
  active() { this.running = true; }
  inactive() { this.running = false; } // 无需恢复：改动本来就没碰真 window
}
```

对照快照沙箱，两个缺陷同时解决：

- **多实例**：每个应用一个 fakeWindow，写操作互不可见——qiankun `start({ singular: false })` 的多应用并存靠的就是它；
- **零恢复成本**：卸载即丢弃 fakeWindow，不存在遍历与 diff。

qiankun 的 `proxySandbox` 是这条路线的代表（FAQ 原文：「使用 Proxy 去代理父页面的 window 来实现沙箱」）。它还有个中间形态 **legacySandbox**：也用 Proxy，但写操作**仍落在真 `window`** 上、只是同步记录差异用于卸载恢复——省掉了快照的全量遍历，却保留了单实例限制，可以理解为「Proxy 实现的快照沙箱」。

工程上的代价与逃逸面要心里有数：

- **透传细节繁琐**：`window.location`、`document`、`addEventListener` 这类读到的原生对象/方法，直接返回会有 `this` 指向（Illegal invocation）问题，实现里要逐一 `bind`；这也是自研沙箱最容易踩的坑。
- **副作用仍需专项收集**：Proxy 只管属性读写，`window.addEventListener` / `setInterval` 是**方法调用**——框架要额外劫持这些 API、记账、卸载时统一清理（qiankun 对 window 事件的处理也因此有约束：FAQ 建议用 `addEventListener` 而非 `window.onXxx` 直接赋值，后者受代理限制可能不生效）。
- **逃逸面**：`window.top` / `window.parent` 指向真实窗口、原生构造函数与闭包缓存的引用都不经过代理——软隔离防不了故意逃逸。

## 四、with + Proxy：把作用域链第一站换掉

Proxy 沙箱有个盲区：子应用代码里**不带 `window.` 前缀**的全局访问。`var x = 1` 在脚本顶层执行时直接进真 `window`，`Proxy` 根本没机会拦截。第三代思路是在执行子应用代码前包一层 `with`：

```js
// 框架把子应用代码包装成这样再执行（micro-app 默认沙箱的机制骨架）
const wrapped = new Function("proxyWindow", `
  with (proxyWindow) {   // 作用域链的第一站被换成代理对象
    ${appCode}           // 子应用代码里的 name、location、document……
  }                      // 全部先问 proxyWindow（触发 Proxy 的 has/get）
`);
wrapped(sandbox.proxy);
```

`with` 把 `proxyWindow` 插到作用域链最前端，于是**一切自由变量查找都先经过 Proxy 的 `has` 拦截**——这是纯 Proxy 方案做不到的彻底。micro-app 的默认沙箱走的正是这条路（Proxy 拦截 `window`/`document` 操作 + 作用域链隔离顶层变量）。

彻底是有价签的：

- **性能税**：`with` 块内每次变量查找都要跑一遍 `has`/`get` 陷阱，而且 `with` 本身让作用域静态分析失效、无法被引擎优化——wujie 文档把「规避 `with(proxyWindow){code}` 带来的性能损耗」列为选择 iframe 路线的直接理由。
- **语义副作用**：顶层 `var xxx` / `function xxx(){}` 被 with 作用域吃掉，**不再泄漏为全局变量**。老式「往全局挂名字」的库会在沙箱里报 `xxx is not defined`——micro-app 文档给出的三种解法（构建产物 `library.type: 'window'`、改写为 `window.xxx =`、插件 loader 批量替换）本质都是「把隐式全局改成显式全局」。
- **严格模式互斥**：`with` 在严格模式下是语法错误，执行器必须维持非严格语境，与 ESM（天然严格模式）互斥——这也是 with 沙箱路线在 ESM 时代吃力的原因之一（详见 [HTML entry 与资源加载](./html-entry-loading)）。

## 五、iframe 沙箱：物理隔离路线

前三代都是在**同一个 JS 执行环境里模拟边界**；第四代干脆不模拟——把子应用的 JS 放进 iframe 里跑，隔离由浏览器原生保证：

- **wujie 的拆法**：子应用 JS 运行在一个**与主应用同域的 iframe** 中——`window`、`history`、`location` 原生独立，全局污染、事件残留、路由冲突从根上不存在，也没有 with/Proxy 的查找税；同域保证了主子应用可以直接互相调用（`window.parent` 直通）。而**DOM 不在 iframe 里渲染**——子应用的视图渲染进主文档的 WebComponent 容器，框架代理 iframe 内 `document` 的查询/插入接口（`querySelector`、`appendChild`……）指向容器，让「JS 在 iframe、DOM 在主文档」无缝缝合，弹窗也因此不需要特殊改造。路由同步则靠劫持 iframe 的 `history.pushState/replaceState` 把子应用 URL 写进主应用 query 参数（细节见 [wujie 叶](../../wujie/)）。
- **micro-app 1.0 的可选 iframe 模式**：默认仍是 with 沙箱，iframe 沙箱作为「with 跑不了就切换」的备选。它有个一手文档明说的坑：**iframe 的 `src` 必须指向主应用域名**（为了同域通信），于是沙箱初始化时**有几率把主应用的静态资源加载一遍**。官方两个解法——推荐给 `iframeSrc` 配一个主应用域下的**空 HTML**（多层嵌套时中间层也要指向最外层的空页）；或在主应用 `head` 最前面插 `if (window.parent !== window) { window.stop() }`（残留缺点：network 面板仍会出现 canceled 请求，已发出的 JS 请求撤不回来）。

iframe 路线的固有成本也要摆上桌：每个子应用一个 iframe 实例（内存、初始化开销）；JS 与 DOM 分属两个环境，跨环境对象（如 `event.target` 归属、`instanceof` 判定）依赖框架的代理层兜底——这些正是 wujie 用大量代理代码换来的「使用时无感」。

## 六、四代路线对比

| 维度 | 快照沙箱 | Proxy 沙箱 | with + Proxy | iframe 沙箱 |
| --- | --- | --- | --- | --- |
| **隔离原理** | 事后 diff 恢复 | 写时隔离（fakeWindow） | 作用域链 + 写时隔离 | 浏览器原生物理隔离 |
| **多实例** | 不支持（共用真 window） | 支持 | 支持 | 支持（一 iframe 一世界） |
| **隔离强度** | 弱（运行期真污染，切换才清理） | 中（前缀访问可拦，隐式全局漏拦） | 较强（自由变量也拦截） | 强（连 `history`/`location` 都独立） |
| **性能特征** | 切换时全量遍历 window ×2 | 读写过一层 Proxy 陷阱 | 每次变量查找都过 `has`/`get`，`with` 不可优化 | 无查找税；换 iframe 实例与代理层成本 |
| **兼容性** | 最好（无 ES6 依赖） | 需 Proxy（无法 polyfill） | 需 Proxy，且与严格模式/ESM 互斥 | 需 WebComponent（wujie 容器） |
| **路线代表** | qiankun 降级态 | qiankun `proxySandbox` | micro-app 默认沙箱 | wujie；micro-app 可选模式 |
| **典型坏法** | 双实例互吞状态 | `this` 指向、事件残留需专项处理 | `xxx is not defined`、性能劣化 | src 同域坑、跨环境对象判定 |

选型直觉：**单应用切换 + 老浏览器**→快照；**多应用并存 + 主流浏览器**→Proxy；**要拦隐式全局、接受性能税**→with + Proxy；**隔离优先 / Vite・ESM 子应用**→iframe 路线。

## 七、前瞻：ShadowRealm（TC39 Stage 2.7）

上面四代全是「用现有能力凑出来的沙箱」。TC39 的 **ShadowRealm** 提案则想把沙箱做成语言标准：每个 `ShadowRealm` 是一个**独立的全局环境**——自己的 `globalThis`、自己的一整套内建对象副本（`Object.prototype` 都与外界不同源）：

```js
const realm = new ShadowRealm();
realm.evaluate(`globalThis.leaked = 1`); // 污染只发生在 realm 自己的 globalThis 上
const doSum = await realm.importValue("./calc.js", "doSum"); // 跨界导入一个函数
doSum(1, 2); // 3 —— 函数被自动包装（wrapped function）后可调用
```

对微前端最关键的设计是 **callable boundary**：跨越 realm 边界的值**只允许原始值（primitive）与可调用对象（函数）**，函数会被包装转发，普通对象一律过不去。这意味着「把 `window.appState` 对象直接递给子应用」这类共享模式在 ShadowRealm 里根本不成立——隔离是真隔离，通信必须走显式的函数协议。同步执行、无 DOM、共享引擎，比 iframe 轻、比 Worker 即时。

现状必须写准：提案处于 **Stage 2.7**（champions 包括 Agoric/Salesforce 等一线沙箱实践者），规范与宿主集成仍在推进，**目前没有可用于生产的浏览器原生实现**。对微前端的正确姿势是「关注，不排期」——它解决的是 JS 全局隔离，DOM/CSS 隔离依然要靠本叶其他机制。

## 小结

JS 沙箱的四代演进是一条「隔离彻底度」与「实现成本」的权衡曲线：快照沙箱用最低的兼容性门槛换来单实例与遍历税；Proxy 沙箱靠 fakeWindow 实现多实例与零恢复成本，但拦不住隐式全局；with + Proxy 把作用域链第一站换掉、连自由变量都拦截，代价是每次查找的性能税与 ESM 互斥；iframe 沙箱交给浏览器做物理隔离，换来 wujie 式「JS 与 DOM 分家」的代理工程。记住三条推理链：**共用真 window ⇒ 必然单实例**；**with 改作用域链 ⇒ 必然有查找税与严格模式冲突**；**iframe src 指向主域 ⇒ 必然有误加载主应用资源的窗口期**。沙箱只管 JS，样式的战场在下一页：[CSS 隔离](./css-isolation)。
