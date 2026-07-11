---
layout: doc
outline: [2, 3]
---

# API 与事件全解

> 基于 WHATWG HTML 现行标准（Web storage 章）· 核于 2026-07

## 速查

- **入口**：`window.localStorage` / `window.sessionStorage`，同一个 **Storage 接口**；注意**访问这两个属性本身**就可能抛 `SecurityError`（用户禁站点数据、不透明源等，场景清单见[浏览器章](/zh/base/browser/browser-storage/guide-line/web-storage-model)）。
- **六成员**：`setItem(k, v)` 增改 / `getItem(k)` 读 / `removeItem(k)` 删 / `clear()` 清空 / `key(i)` 按索引取键名 / `length` 键数。
- **读侧不抛错**：`getItem` 缺键返回 **`null`**；`key(i)` 越界返回 `null`；`removeItem` 删不存在的键**静默返回**。
- **setItem 三步语义**（规范原文方向）：键不存在 → 新增；存在且值不同 → 更新；**存在且值相同 → 直接返回**（不算修改、不广播事件）。
- **removeItem 删不存在的键同样是无操作**——没有变化就没有 storage 事件。
- **键值强制字符串化**：`setItem(42, 99)` 实际存的是 `"42" → "99"`；对象变 `"[object Object]"`（细节归[序列化页](./serialization-exceptions)）。
- **遍历正统**：`length` + `key(i)` 循环；**键的顺序由实现决定**（规范只要求键数不变期间保持稳定），别依赖跨浏览器一致。
- **边遍历边删会漏项**：索引随删除前移——先收集键名快照，再逐个删。
- **`Object.keys(localStorage)` 有盲区**：与原型成员同名的键（如 `"setItem"`、`"length"`）**不会被枚举出来**（实测），而 `length` + `key(i)` 数得到——批量操作用后者。
- **属性式访问读写不对称**：`localStorage.setItem = "x"` 这类赋值**确实会写进存储**（命名 setter 语义），但**属性式读回时原型成员优先**——`localStorage.setItem` 依然是那个方法，不是你的值。
- **规范与 MDN 的结论**：属性式（点号/方括号）三种写法虽等效可用，但因原型遮蔽与不可信键名的原型污染式风险，**一律推荐方法式**。
- **storage 事件头号考点**：修改只通知**同源的"其他"文档**——**发起修改的页面自己不触发**。
- **事件五字段**：`key` / `oldValue` / `newValue` / `url`（发起修改的文档地址）/ `storageArea`（哪个 Storage 对象变了）。
- **null 语义矩阵**：新增键 `oldValue` 为 `null`；删除键 `newValue` 为 `null`；**`clear()` 时 `key`、`oldValue`、`newValue` 三者全 `null`**。
- **sessionStorage 的事件只在同页签内传播**（同源 iframe 等）——不同页签的 sessionStorage 是独立副本，**跨页签同步是 localStorage 的专利**。
- **监听挂 `window`**：`window.addEventListener("storage", handler)`；用 `e.storageArea === localStorage` 区分来源。
- **同页也想收到通知**：封装统一写入口，写完手动派发自定义事件（本页给模式）。
- **BroadcastChannel 一句对比**：只想广播消息、不需要顺带持久化状态时，`BroadcastChannel` 语义更对（不必编造键值、同页其他上下文也能收到）；storage 事件的优势是**状态本身已落盘**，新开页签直接读到最新值。

## 一、两个入口，一个接口

`localStorage` 与 `sessionStorage` 都是 `Window` 上的属性，返回的都是 Storage 接口实例——**方法层面零差异**，差异全在生命周期与隔离（见[入门页](../getting-started)对照表，机制见[浏览器章](/zh/base/browser/browser-storage/guide-line/web-storage-model)）。

有一个容易忽略的边界：**访问 `window.localStorage` 这个属性本身就可能抛 `SecurityError`**（用户在浏览器设置里禁了站点数据、代码跑在 `data:` 等不透明源里）。所以严谨的封装连"拿到 storage 对象"这一步都要包进 try-catch——完整防御在[序列化与异常页](./serialization-exceptions)。

## 二、六个成员逐个说透

### 2.1 读：getItem / key / length

| 成员 | 签名 | 返回 | 边界行为 |
| --- | --- | --- | --- |
| `getItem(key)` | 键名（字符串） | 值字符串或 **`null`** | 缺键返回 `null` 而**不是 `undefined`**，也不抛错 |
| `key(index)` | 索引（数字） | 键名字符串或 `null` | 越界返回 `null`；**顺序由实现决定** |
| `length` | 只读属性 | 键值对个数 | 包含所有键——连与原型成员同名的键也数（见 3.3） |

`getItem` 返回 `null` 这件事值得较真：`null` 是"没有这个键"的规范信号，判断存在性要与 `null` 显式比较——**不要用 falsy 判断**，否则存过 `""` 或 `"0"` 的键会被误判成不存在：

```js
// 错：存过空字符串的键被误判为"没存过"
if (!localStorage.getItem("draft")) {
  /* ... */
}

// 对：与 null 显式比较，"存过空串"与"没存过"分得清
if (localStorage.getItem("draft") === null) {
  /* 确实没存过 */
}
```

### 2.2 写：setItem / removeItem / clear

| 成员 | 签名 | 返回 | 关键语义 |
| --- | --- | --- | --- |
| `setItem(key, value)` | 键、值（都强制转字符串） | `undefined` | 满时**同步抛 `QuotaExceededError`**；**值相同则无操作** |
| `removeItem(key)` | 键名 | `undefined` | 键不存在则无操作，不抛错 |
| `clear()` | 无参 | `undefined` | 清空**当前源在该存储区**的全部键值对 |

两条规范级细节，直接决定 storage 事件什么时候发：

- `setItem` 的完整语义是三步：键不存在 → 新增；存在且值**不同** → 更新；存在且值**相同** → **直接返回**。最后一种情况没有发生任何修改，因此**不会广播 storage 事件**——"重复写同一个值刷不出事件"不是 bug。
- `removeItem` 删一个不存在的键同理：无修改、无事件。

还要记住 `clear()` 的杀伤范围是**整个源的整个存储区**——页面上跑着的第三方 `script` 与你共用同一个 localStorage（它写的就是宿主源的存储），一把 `clear()` 会把别人的键也清掉。工程上应当**只删自己前缀下的键**（[模式页](./patterns)给实现）。

### 2.3 遍历与批量删除

规范给的枚举原语只有 `length` + `key(i)`：

```js
// 正统遍历：length + key(i)
for (let i = 0; i < localStorage.length; i++) {
  const k = localStorage.key(i);
  console.log(k, "=", localStorage.getItem(k));
}
```

两个陷阱：

**陷阱一：键的顺序由实现决定。** 规范只保证"键数不变期间顺序稳定"，不同浏览器（甚至同一浏览器的不同会话）顺序可以不同——凡是依赖"第 0 个键是谁"的代码都是错的。

**陷阱二：边遍历边删会漏项。** 删除会让后面的键索引前移，`i++` 就跳过了一个。正确姿势是**先收集快照再删**：

```js
// 错：边遍历边删，索引错位导致漏删
// 对：第一轮只收集键名，第二轮再删除
const doomed = [];
for (let i = 0; i < localStorage.length; i++) {
  const k = localStorage.key(i);
  if (k !== null && k.startsWith("cache:")) doomed.push(k);
}
for (const k of doomed) localStorage.removeItem(k);
```

`Object.keys(localStorage)` 也能列键（Storage 支持命名属性枚举），日常够用，但有一个实测盲区——见下一节。

## 三、属性式访问：能用，但读写不对称

### 3.1 三种等效写法

MDN 明确列出三种写法都能存：

```js
localStorage.colorSetting = "#a4509b";        // 点号
localStorage["colorSetting"] = "#a4509b";     // 方括号
localStorage.setItem("colorSetting", "#a4509b"); // 方法式（官方推荐）
```

同时 MDN 给出的官方建议是：**始终使用方法式**。原因不是风格洁癖，而是下面两个实打实的坑。

### 3.2 原型遮蔽：读写各走各路

Storage 对象带"命名 setter"：**任何属性赋值都会真的写进存储**——包括键名撞上原型成员的：

```js
// 赋值走命名 setter：确实写进了存储
localStorage.setItem = "hello";
localStorage.getItem("setItem"); // "hello" ——数据在库里

// 但属性式"读"时原型成员优先：读回的是方法，不是你的值
typeof localStorage.setItem; // "function"
```

写进得去、读不回来——**读写不对称**。键名是写死的字面量时你或许能躲开，但键名来自变量、用户输入、服务端下发时，谁也保证不了它不叫 `"length"`、`"key"`、`"clear"`。这也引出更阴的一层：**不可信键名走属性式赋值，就是把外部输入直接当对象属性名用**（`"__proto__"` 之类），属于原型污染式的风险面。方法式 `setItem`/`getItem` 把键名永远当**数据**处理，天然免疫这一整类问题。

### 3.3 枚举盲区：Object.keys 数不到被遮蔽的键

上面那个 `"setItem"` 键还有后续（Node 22 原生 Web Storage 实测，浏览器同为 WebIDL 语义）：

```js
localStorage.clear();
localStorage.setItem("setItem", "hello"); // 与原型方法同名的键
localStorage.setItem("theme", "dark");

localStorage.length;         // 2 —— length 数得到
Object.keys(localStorage);   // ["theme"] —— 与原型成员同名的键被隐藏！
localStorage.key(0);         // 两个键都能通过 key(i) 枚举到
```

原因：命名属性的可见性规则规定，**原型链上已有同名成员时，命名属性不暴露**——`Object.keys` 自然看不见它。结论：**批量操作（导出、清理、迁移）一律用 `length` + `key(i)`**，`Object.keys` 只当调试便利。

## 四、storage 事件全解

### 4.1 触发规则：谁收到、谁收不到

storage 事件是 Web Storage 自带的变更广播，规则一句话：**存储被某文档修改时，事件发给同源的"其他"文档——发起修改的文档自己不触发**。这是本 API 的头号考点，也是最常见的调试困惑（"我 setItem 之后自己的 listener 怎么不跑？"——设计如此）。

什么操作会触发：真正**发生了修改**的 `setItem` / `removeItem` / `clear()`。结合上一节的无操作语义：写相同的值、删不存在的键，都因为"没有修改"而**不触发**。

事件挂在 `window` 上监听：

```js
window.addEventListener("storage", (e) => {
  // e.storageArea 指向被修改的那个 Storage 对象，可用来区分来源
  if (e.storageArea !== localStorage) return; // 只关心 localStorage 的变化
  console.log(`键 ${e.key} 从 ${e.oldValue} 变为 ${e.newValue}，来自 ${e.url}`);
});
```

### 4.2 五字段与 null 语义矩阵

`StorageEvent` 在 `Event` 基础上加五个只读字段：

| 字段 | 含义 |
| --- | --- |
| `key` | 变动的键名；**`clear()` 触发时为 `null`** |
| `oldValue` | 变动前的值；**新增键时为 `null`** |
| `newValue` | 变动后的值；**删除键时为 `null`** |
| `url` | 发起修改的**文档地址**（谁改的） |
| `storageArea` | 被修改的 Storage 对象（localStorage 还是 sessionStorage） |

`null` 的组合本身就是"发生了什么"的编码，这张矩阵值得背下来：

| 操作 | `key` | `oldValue` | `newValue` |
| --- | --- | --- | --- |
| `setItem`（新增键） | 键名 | **`null`** | 新值 |
| `setItem`（更新值） | 键名 | 旧值 | 新值 |
| `setItem`（值相同） | —— 不触发事件 —— | | |
| `removeItem`（键存在） | 键名 | 旧值 | **`null`** |
| `removeItem`（键不存在） | —— 不触发事件 —— | | |
| `clear()` | **`null`** | **`null`** | **`null`** |

工程上的直接推论：**`e.newValue === null` 就是"这个键被删了"的信号**，多页签登出同步靠它；**`e.key === null` 就是"整个存储区被清空"**，要按最坏情况处理。

### 4.3 sessionStorage 的事件传播范围

sessionStorage 也会触发 storage 事件，但别指望它跨页签：**不同页签的 sessionStorage 是相互独立的副本**，改这份不可能通知那份。它的事件只在**同一页签内**的同源文档之间传播——典型是页面与它的同源 iframe：

- 页面改 sessionStorage → 同页签内的同源 iframe 收到事件（反之亦然）；
- 页面改 sessionStorage → **其他页签永远收不到**（哪怕同源）。

所以"跨页签同步"这件事是 **localStorage 的专利**；sessionStorage 的事件只服务"同页签多文档"这种小场景。

## 五、跨页签通信实战

### 5.1 主题同步：一处修改，处处生效

```js
// —— 页签 A：用户切换主题 ——
function switchTheme(next) {
  document.documentElement.dataset.theme = next; // 本页自己立即生效（事件不发给自己）
  try {
    localStorage.setItem("app:theme", next);     // 落盘，同时触发其他页签的 storage 事件
  } catch {
    /* 存储满/被禁：本页已生效，跨页签同步降级为无 */
  }
}

// —— 所有页签的公共代码：监听并跟随 ——
window.addEventListener("storage", (e) => {
  if (e.storageArea !== localStorage) return;
  if (e.key === "app:theme" && e.newValue !== null) {
    document.documentElement.dataset.theme = e.newValue; // 其他页签即时换肤
  }
});
```

注意第一行：因为事件不发给发起页，**发起页必须自己先应用变更**，监听器只服务"别的页签"。

### 5.2 多页签登出：删一个键，全端下线

```js
// —— 任意页签执行登出 ——
function logout() {
  localStorage.removeItem("session:alive"); // 删除动作会广播给其他页签
  location.href = "/login";
}

// —— 所有页签的公共代码 ——
window.addEventListener("storage", (e) => {
  if (e.storageArea !== localStorage) return;
  // newValue 为 null 表示键被删除 → 别的页签登出了，本页跟随
  if (e.key === "session:alive" && e.newValue === null) {
    location.href = "/login";
  }
  // key 为 null 表示 clear()：整区被清，同样按登出处理
  if (e.key === null) {
    location.href = "/login";
  }
});
```

### 5.3 同页也想收到通知怎么办

storage 事件的"不通知自己"是规范行为，绕不开，但可以**在封装层补一枪**——统一写入口，写完手动派发自定义事件，同页监听者听自定义事件、跨页监听者听原生事件：

```js
/** 统一写入口：落盘 + 通知本页（跨页签由原生 storage 事件负责） */
function setAndNotify(key, value) {
  localStorage.setItem(key, value);
  // 用自定义事件名，避免与原生 storage 事件混淆
  window.dispatchEvent(
    new CustomEvent("local-storage-change", { detail: { key, value } }),
  );
}
```

VueUse 的 `useStorage`、各家 React hook 的同页响应式，本质都是这个模式。

### 5.4 与 BroadcastChannel 的一句话对比

如果你只是想**广播一条消息**而不需要真的存下什么，`BroadcastChannel` 语义更对——不必编造键值、不占存储、发起上下文之外的同源上下文都能收到；storage 事件的不可替代处在于**消息即状态**：值已经落盘，之后新开的页签不用等广播、直接 `getItem` 就是最新值。

下一页处理"只存字符串"带来的全部麻烦：[序列化与异常处理](./serialization-exceptions)。
