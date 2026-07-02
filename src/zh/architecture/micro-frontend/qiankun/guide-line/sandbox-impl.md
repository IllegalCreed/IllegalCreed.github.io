---
layout: doc
outline: [2, 3]
---

# 沙箱实现

> 基于 qiankun 2.10（3.0 rc 追踪） · 核于 2026-07

## 速查

- 沙箱的**四代通论**（快照 / Proxy / with+Proxy / iframe / ShadowRealm）已在[核心机制·JS 沙箱](../../mfe-mechanisms/guide-line/js-sandbox)讲透——本页只讲 **qiankun 的三个具体沙箱与配置坑**，不重复原理
- qiankun 内置**三沙箱**：**`proxySandbox`**（多实例，Proxy + fakeWindow）、**`legacyProxySandbox`**（单实例，Proxy 记差异仍写真 window）、**`snapshotSandbox`**（快照，无 Proxy 的旧环境降级）
- **自动选择逻辑**：`window.Proxy` 不支持 → `snapshotSandbox`（并强制单实例）；支持 Proxy 且 `singular: true`（路由型默认）→ `legacyProxySandbox`；支持 Proxy 且 `singular: false` → `proxySandbox`（多实例并存）
- **单实例 vs 多实例的沙箱后果**：单实例大家共用「一份被代理的真 window」，多实例每个子应用一个**独立 `fakeWindow`**——想同屏跑多个子应用必须 `singular: false` 走 `proxySandbox`
- qiankun 沙箱的实现内核（FAQ 原文）：**「用 `Proxy` 去代理父页面的 `window`」**——子应用读 `window.Vue` 时先查代理 window 上有没有，**读先假后真、写落假对象**
- **window 事件坑**：<code v-pre>window.onXxx = fn</code> 直接赋值**失效**（被代理拦不到这种赋值语义），必须用 `window.addEventListener('xxx', fn)`——这是 FAQ 明列的高频坑
- qiankun 沙箱**拦得住**：全局变量读写、`window` 上 `addEventListener`/`setTimeout`/`setInterval`（框架劫持并**记账**，卸载时统一清理）、子应用运行期动态 append 的 `<script>`/`<style>`/`<link>`（记账、卸载移除）
- qiankun 沙箱**拦不住**：`window.top`/`window.parent`（指向真实窗口）、原生构造函数、闭包缓存的引用、未被代理的 API——所有非 iframe 沙箱都是**尽力而为的软隔离**，防意外不防恶意
- `sandbox: false` 完全关闭沙箱（子应用直接裸跑在真 window）；`sandbox: true`（默认）开 JS 沙箱 + 默认样式隔离（动态样式表劫持）
- 沙箱只管 **JS 全局**；样式隔离是另一套开关（`strictStyleIsolation`/`experimentalStyleIsolation`），见[样式隔离](./style-isolation)
- 3.0 把沙箱重构成**可插拔独立模块**（`@qiankunjs/sandbox`，TC39 Realms 思路），去掉对 `eval` 的依赖——见[演进与现状](./evolution-status)

## 一、边界：本页讲什么、不讲什么

JS 沙箱要防的三类事故（全局变量污染、事件监听残留、定时器泄漏）、以及四代方案（快照 diff 恢复 / Proxy 写时隔离 / with 改作用域链 / iframe 物理隔离 / ShadowRealm 前瞻）的**原理与取舍**，已经在[核心机制·JS 沙箱谱系](../../mfe-mechanisms/guide-line/js-sandbox)里逐代拆过。那一页是「沙箱为什么这么设计」的通论。

本页只答一个具体问题：**qiankun 这个框架，把这些原理落成了哪三个沙箱、什么时候用哪个、实际拦得住什么**。原理层的推理链（「共用真 window ⇒ 必然单实例」等）不再重复，需要时点回通论页。

## 二、qiankun 的三个沙箱

qiankun 2.x 内置三个沙箱实现，对应通论里的前两代（快照 + Proxy）：

| 沙箱 | 对应通论 | 隔离方式 | 实例数 | 用在何时 |
| --- | --- | --- | --- | --- |
| **`snapshotSandbox`** | 快照沙箱 | 激活拍 window 快照，失活 diff 恢复 | 单实例 | **不支持 `Proxy` 的旧环境**（如 IE）降级用 |
| **`legacyProxySandbox`** | Proxy 沙箱（过渡态） | Proxy 记录差异，但**写操作仍落真 window**、卸载时恢复 | 单实例 | 支持 Proxy 且 `singular: true`（路由型默认） |
| **`proxySandbox`** | Proxy 沙箱 | 每个子应用一个 `fakeWindow`，**写落假对象、读先假后真** | 多实例 | 支持 Proxy 且 `singular: false`（同屏多子应用） |

三者的原理细节（快照为什么只能单实例、Proxy 如何 fakeWindow）见通论页第二、三节。这里的重点是它们的**分工**：`snapshotSandbox` 是兜底（老浏览器），`legacyProxySandbox` 是单实例主力（比快照省掉全量遍历），`proxySandbox` 是多实例主力（真正的每应用一 fakeWindow）。

## 三、自动选择逻辑

你不用手选沙箱——qiankun 按「浏览器能力 + `singular` 配置」自动决定：

```text
window.Proxy 不支持（老 IE）？
  └─ 是 → snapshotSandbox（并强制 singular: true，快照只能单实例）
  └─ 否 → singular 为 true（路由型默认）？
            ├─ 是 → legacyProxySandbox（单实例 Proxy）
            └─ 否 → proxySandbox（多实例 Proxy，每应用一 fakeWindow）
```

推论：

- **老浏览器无 Proxy** → 只能快照沙箱 + 强制单实例，这也是「快照只能单实例」在 qiankun 里的落地。
- **默认路由型接入** → `singular: true` → `legacyProxySandbox`：单实例、用 Proxy 记差异，切换应用时恢复真 window。
- **要同屏多子应用** → 必须 `start({ singular: false })` → `proxySandbox`：每个子应用独立 `fakeWindow`，写操作互不可见。想清楚这条因果——**没开 `singular: false` 就别指望两个子应用同时正常并存**。

`singular` 与单/多实例的路由语义见[核心 API·singular](./core-api)。

## 四、window 代理细节与高频坑

qiankun 沙箱的内核，FAQ 说得很直白：**「用 `Proxy` 去代理父页面的 `window`」**。子应用代码里访问 `window.Vue`，实际访问的是**被 qiankun 代理过的 window**——Proxy 会先查代理对象（`fakeWindow` 或差异记录）上有没有这个属性，**读先假后真、写落假对象**（`proxySandbox`）或写真 window 并记差异（`legacyProxySandbox`）。

由此带来一个**必须知道的高频坑**——直接给 window 的 `onXxx` 赋值会失效：

```js
// ❌ 坑：直接赋值 window.onXxx —— 被代理拦不住这种赋值语义，实际不生效
window.onresize = () => recalcLayout();

// ✅ 正解：用 addEventListener —— qiankun 劫持并记账，卸载时自动清理
window.addEventListener("resize", () => recalcLayout());
```

原因（FAQ 原文）：子应用访问的 window 是 qiankun 代理后的对象，**直接往它身上加 `onXxx` 事件处理器是无效的**，改用 `addEventListener` 即可。深层是 `onXxx` 属性赋值与 `addEventListener` 方法调用在代理层的处理不同——前者是属性 set（落假对象、真 window 上没挂上），后者是被框架专门劫持记账的方法调用。

## 五、qiankun 沙箱拦得住什么、拦不住什么

沙箱不是万能的。qiankun 明确劫持并接管一批 API，另一批则透出去。心里要有这张清单：

**拦得住（接管 + 卸载清理）**：

| 类别 | qiankun 怎么处理 |
| --- | --- |
| **全局变量读写** | Proxy 代理 window：`proxySandbox` 写落 fakeWindow、卸载丢弃；`legacyProxySandbox` 写真 window、卸载恢复 |
| **window 事件** | 劫持 `addEventListener`/`removeEventListener`，记账子应用注册的监听，**卸载时统一移除**（残留监听不再对空容器报错） |
| **定时器** | 劫持 `setTimeout`/`setInterval`，记账，**卸载时统一 clear**（轮询不再活到天荒地老） |
| **动态样式/脚本** | 劫持 `appendChild`/`insertBefore`，记账子应用运行期插入的 `<style>`/`<link>`/`<script>`，**卸载移除、再挂载重建** |

**拦不住（软隔离的逃逸面）**：

- **`window.top` / `window.parent`**：指向真实顶层窗口，不经代理——子应用能顺着它摸到真 window。
- **原生构造函数与原型**：`Object`、`Array`、`Element.prototype` 等是共享的，改原型会全局生效。
- **闭包缓存的引用**：库在加载时把某个原生对象存进闭包，之后不再走 window 访问，代理插不进去。
- **未被专门处理的 API**：沙箱只重点接管了上面几类，边角 API 可能透传。

一句话定性（与通论一致）：**qiankun 的非 iframe 沙箱是「尽力而为的软隔离」，防的是自家子应用间的意外冲突，不是恶意代码**。真要物理隔离（连 `history`/`location` 都独立），那是 iframe 路线（[wujie](../../wujie/)）的领域——见通论页第五节。

## 六、sandbox 开关与 3.0 走向

`start` 的 `sandbox` 项控制沙箱：

```js
start({ sandbox: true }); // 默认：开 JS 沙箱 + 默认样式隔离（动态样式表劫持）
start({ sandbox: false }); // 完全关闭：子应用裸跑真 window（仅用于确知无冲突时）
start({ sandbox: { strictStyleIsolation: true } }); // JS 沙箱 + Shadow DOM 样式隔离
start({ sandbox: { experimentalStyleIsolation: true } }); // JS 沙箱 + 运行时属性改写
```

注意 `sandbox` 的对象形态里，`strictStyleIsolation`/`experimentalStyleIsolation` 管的是**样式**，与 JS 沙箱是两件事（样式隔离详见[样式隔离](./style-isolation)）。

3.0 的一个核心动作是把沙箱抽成**独立可插拔模块**（`@qiankunjs/sandbox`），对齐 TC39 Realms 的心智、去掉对 `eval` 的依赖，让隔离逻辑可替换——这也是 3.0 三年重构的一部分，详见[演进与现状](./evolution-status)。

## 小结

qiankun 把 JS 沙箱的通论落成了三个具体实现：`snapshotSandbox`（老浏览器兜底，单实例）、`legacyProxySandbox`（`singular: true` 默认，单实例 Proxy）、`proxySandbox`（`singular: false`，多实例 fakeWindow），按「有无 Proxy + singular」自动选。内核是「用 Proxy 代理父页面 window」，读先假后真；实战最扎手的坑是 <code v-pre>window.onXxx</code> 赋值失效、必须改 `addEventListener`。它劫持并卸载清理全局变量/事件/定时器/动态样式，但 `window.top`、原生构造函数、闭包引用是它的逃逸面——软隔离而非物理隔离。JS 沙箱之外，样式是另一套开关与另一堆坑：下一页[样式隔离](./style-isolation)。
