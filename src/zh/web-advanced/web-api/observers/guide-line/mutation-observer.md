---
layout: doc
outline: [2, 3]
---

# MutationObserver：DOM 变化观察

> 基于各 Observer 现行标准（W3C/WHATWG）与浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：`MutationObserver` 异步观察 **DOM 树的变化**——子节点增删、属性改动、文本内容变化都能捕获，取代同步、性能差的已废弃 Mutation Events。
- **构造与配置分离**：`new MutationObserver(callback)` 只传回调；观察什么由 `observe(target, options)` 的 `options` 决定。
- **`observe` 必须至少指定一类**：`childList`/`attributes`/`characterData` 三者**至少给一个 `true`**，否则抛 `TypeError`（"什么都不监控"是非法配置）。
- **`childList`**：观察 `target` 的**直接子节点**增删（配 `subtree` 才含后代）。
- **`attributes`**：观察属性变化；`attributeFilter: ["class","data-x"]` 只看指定属性；`attributeOldValue: true` 记录旧值。
- **`characterData`**：观察文本节点内容变化；`characterDataOldValue: true` 记录旧文本。
- **`subtree`**：把上述观察从"直接子节点"**扩展到所有后代**——大范围观察的开关。
- **隐式默认**：只写 `attributeFilter` 或 `attributeOldValue` 时，`attributes` 自动视为 `true`；只写 `characterDataOldValue` 时 `characterData` 自动视为 `true`。
- **矛盾配置报 `TypeError`**：`attributes: false` 却给了 `attributeOldValue: true`/`attributeFilter`；或 `characterData: false` 却给了 `characterDataOldValue: true`。
- **回调签名**：`(mutationList, observer) => {}`，`mutationList` 是一批 `MutationRecord`；遍历处理。
- **`MutationRecord` 结构**：`type`（`childList`/`attributes`/`characterData`）、`target`、`addedNodes`/`removedNodes`、`previousSibling`/`nextSibling`、`attributeName`/`attributeNamespace`、`oldValue`。
- **微任务批处理**：一个任务里的多次 DOM 改动**合成一批**，在当前任务结束后以**微任务**派发一次回调——不是每改一次回调一次。
- **不为已有内容回调**：`observe` 后**只报此后的变化**，不会回放现有 DOM（与 IO/Resize 的"首帧必回调"相反）。
- **`takeRecords()`**：同步取走**待派发**的记录并清空队列——`disconnect` 前调它捞取最后一批、防丢失。
- **无 `unobserve`**：只能 `disconnect()` 全停；多次 `observe` 是**追加**观察配置，无法单独撤销某一份。
- **头号坑：自触发循环**：回调里改 DOM、改动又落在观察范围内 → 产生新记录 → 再次回调。用 `takeRecords` + 临时 `disconnect`/`observe`，或缩小范围隔离。
- **取代 Mutation Events**：旧的 `DOMNodeInserted` 等 Mutation Events **同步触发、每次变化都打断主线程**、已废弃；MutationObserver 异步批处理、性能好得多。
- **典型场景**：监听第三方脚本/富文本编辑器改 DOM、等待某节点出现（配合 Promise）、给动态插入的元素补初始化、同步影子状态。
- **兼容**：全现代浏览器绿（Baseline widely available，2015-07 起）。

## 一、构造与 observe 的七个 option

`MutationObserver` 把"观察什么"完全交给 `observe` 的第二参数：

```js
const observer = new MutationObserver((mutationList, observer) => {
  for (const record of mutationList) {
    // 处理每条变化……
  }
});

observer.observe(targetNode, {
  childList: true, // 观察直接子节点的增删
  attributes: true, // 观察属性变化
  characterData: true, // 观察文本内容变化
  subtree: true, // 把以上观察扩展到所有后代节点
  attributeOldValue: true, // 属性变化时记录旧值
  attributeFilter: ["class", "data-state"], // 只观察这些属性（省开销）
  characterDataOldValue: true, // 文本变化时记录旧值
});
```

| option | 作用 | 备注 |
| --- | --- | --- |
| `childList` | 直接子节点增删 | 配 `subtree` 才含后代 |
| `attributes` | 属性变化 | 写了 `attributeFilter`/`attributeOldValue` 会隐式置 `true` |
| `attributeOldValue` | 在记录里带属性旧值 | 需 `attributes` 为真 |
| `attributeFilter` | 只观察数组内的属性名 | 省开销；需 `attributes` 为真 |
| `characterData` | 文本节点内容变化 | 写了 `characterDataOldValue` 会隐式置 `true` |
| `characterDataOldValue` | 在记录里带文本旧值 | 需 `characterData` 为真 |
| `subtree` | 观察范围扩到所有后代 | 与上面任意组合，放大观察面 |

### 1.1 必填约束与非法配置

`observe` 的 `options` 有两条硬约束，违反直接 `TypeError`：

- **至少给 `childList`/`attributes`/`characterData` 之一为 `true`**——否则"什么都不监控"，非法。
- **不能自相矛盾**：`attributes: false` 却传 `attributeOldValue: true` 或 `attributeFilter`；`characterData: false` 却传 `characterDataOldValue: true`——都会 `TypeError`。

好在有**隐式默认**兜底：只写 `attributeFilter`/`attributeOldValue` 时 `attributes` 自动为 `true`，只写 `characterDataOldValue` 时 `characterData` 自动为 `true`。所以下面这样是合法的：

```js
// 合法：写了 attributeFilter，attributes 隐式为 true
observer.observe(el, { attributeFilter: ["class"] });
```

## 二、MutationRecord：回调拿到什么

每条 `MutationRecord` 描述一次具体变化，字段随 `type` 而异：

| 字段 | 适用 type | 含义 |
| --- | --- | --- |
| `type` | 全部 | `"childList"` / `"attributes"` / `"characterData"` |
| `target` | 全部 | 变化发生的节点（childList 是父节点；attributes/characterData 是该元素/文本节点） |
| `addedNodes` | childList | 新增的节点（`NodeList`） |
| `removedNodes` | childList | 移除的节点（`NodeList`） |
| `previousSibling` | childList | 增删位置的前一个兄弟节点 |
| `nextSibling` | childList | 增删位置的后一个兄弟节点 |
| `attributeName` | attributes | 变化的属性名 |
| `attributeNamespace` | attributes | 属性命名空间（一般为 `null`） |
| `oldValue` | attributes/characterData | 旧值（需开启对应的 `*OldValue`，否则为 `null`） |

```js
const observer = new MutationObserver((mutationList) => {
  for (const record of mutationList) {
    if (record.type === "childList") {
      // 有节点增删
      console.log("新增", record.addedNodes.length, "移除", record.removedNodes.length);
    } else if (record.type === "attributes") {
      // 某属性被改
      console.log(`属性 ${record.attributeName} 变了，旧值：${record.oldValue}`);
    } else if (record.type === "characterData") {
      // 文本内容变了
      console.log("文本旧值：", record.oldValue);
    }
  }
});
```

## 三、微任务批处理与"不回放已有内容"

两条时机机制决定了 MutationObserver 的用法：

- **微任务批处理**：一个任务（比如一段同步脚本）里连续做了 100 次 DOM 改动，MutationObserver **不会回调 100 次**——它把这批变化攒起来，在当前任务结束、控制权交还前，以**一个微任务**派发**一次**回调，`mutationList` 里含全部记录。这正是它比同步的 Mutation Events 高效的根源。
- **不回放已有内容**：`observe` 只报告**此后**的变化，**不会**为调用时已存在的 DOM 结构回调（与 IO/Resize 的"首帧立即回调一次"相反）。要处理"现有 + 未来"的元素，得自己先扫一遍现有 DOM，再交给观察器管未来。

```js
// 处理"现有 + 未来"的懒初始化元素：先手动扫现有，再观察未来
function initWidgets(root) {
  root.querySelectorAll(".widget:not([data-ready])").forEach(setupWidget);
}
initWidgets(document.body); // 1. 先处理已存在的

const observer = new MutationObserver(() => initWidgets(document.body)); // 2. 再管未来新增的
observer.observe(document.body, { childList: true, subtree: true });
```

## 四、takeRecords 与 disconnect

- **`disconnect()`**：停止一切观察。`MutationObserver` **没有 `unobserve`**——多次 `observe` 是往同一观察器上**追加**配置，无法单独撤销某一份，只能 `disconnect` 全停后按需重开。
- **`takeRecords()`**：**同步**取出当前**待派发**（还没进回调）的记录并清空内部队列。经典用途是 `disconnect` 前捞取最后一批变化，避免它们随断开而丢失：

```js
// 收尾：断开前先把队列里没派发的记录处理掉，防止丢失
const pending = observer.takeRecords(); // 取走并清空待派发队列
if (pending.length) handleRecords(pending);
observer.disconnect();
```

`takeRecords` 也是下一节"打破自触发循环"的关键工具。

## 五、头号坑：观察自身修改导致循环

回调里修改 DOM，而改动又落在**观察范围内**，就会产生**新的**记录、再次触发回调——若逻辑不收敛就是死循环：

```js
// ❌ 反面教材：观察 subtree，回调里又往里加节点 → 新记录 → 再回调
const observer = new MutationObserver((list) => {
  for (const record of list) {
    // 往被观察的容器里插节点，又会被观察到……
    record.target.appendChild(document.createElement("span"));
  }
});
observer.observe(container, { childList: true, subtree: true });
```

三种破解：

```js
// ✅ 破解一：改 DOM 前临时停观察，改完 takeRecords 丢弃自己产生的记录再重开
function safeMutate(observer, target, options, mutate) {
  observer.disconnect(); // 先停，避免观察到自己的改动
  mutate(); // 执行会改 DOM 的操作
  observer.takeRecords(); // 丢弃这批"自己造成的"记录
  observer.observe(target, options); // 重新观察
}
```

- **破解二：缩小观察范围**——只观察真正需要的属性/子树（`attributeFilter`、去掉 `subtree`），让自己的改动落在观察范围**之外**。
- **破解三：加幂等判断**——回调里先判断"是否已是目标状态"，是则不再改（同 ResizeObserver 的期望值思路）。

## 六、取代已废弃的 Mutation Events

MutationObserver 是为取代旧的 **Mutation Events**（`DOMNodeInserted`、`DOMNodeRemoved`、`DOMAttrModified`、`DOMCharacterDataModified` 等）而生：

| 维度 | Mutation Events（已废弃） | `MutationObserver` |
| --- | --- | --- |
| 触发 | **同步**，每次 DOM 变化立刻打断当前脚本 | **异步**，微任务批处理 |
| 性能 | 差：高频变化时反复中断、拖慢主线程 | 好：一批变化合成一次回调 |
| 粒度 | 每个事件一次 | 一次回调带一批 `MutationRecord` |
| 状态 | **已废弃**，不应再用 | 现行标准，Baseline |

结论明确：**任何还在用 `DOMNodeInserted` 之类的老代码都应迁移到 `MutationObserver`**。

## 七、典型场景与小结

常见用武之地：

- **监听第三方/宿主对 DOM 的改动**：富文本编辑器、第三方脚本注入的元素、微前端里别的应用改了共享 DOM。
- **等待某节点出现**：轮询 `querySelector` 的替代——观察到目标节点被插入即 resolve 一个 Promise。
- **给动态元素补初始化**：SPA 或第三方渲染插入的元素，用 subtree 观察 + 增量初始化（见第三节）。

```js
// 用 MutationObserver 实现"等某元素出现"，替代 setInterval 轮询
function waitForElement(selector, root = document.body) {
  return new Promise((resolve) => {
    const existing = root.querySelector(selector);
    if (existing) return resolve(existing); // 已存在直接返回
    const observer = new MutationObserver(() => {
      const el = root.querySelector(selector);
      if (el) {
        observer.disconnect(); // 找到即停
        resolve(el);
      }
    });
    observer.observe(root, { childList: true, subtree: true });
  });
}
```

一句话：**DOM 结构/属性/文本变化就用 `MutationObserver`**——至少给一类观察项、注意微任务批处理与"不回放已有内容"、警惕自触发循环、卸载时 `disconnect`。下一页看观察**性能条目与报告**的 [PerformanceObserver 与 ReportingObserver](./performance-reporting-observer)。
