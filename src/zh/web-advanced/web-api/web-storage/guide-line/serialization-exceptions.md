---
layout: doc
outline: [2, 3]
---

# 序列化与异常处理

> 基于 WHATWG HTML 现行标准（Web storage 章）· 核于 2026-07

## 速查

- **只存字符串**：键与值写入时都被强制 `String()` 转换——这是 Web Storage 一切序列化问题的总根源。
- **存对象 = 存 `"[object Object]"`**：`setItem("user", { name: "x" })` 落库的是 `String(对象)` 的结果，数据实质丢失。
- **`setItem(k, undefined)` 是经典事故**：存进去的是字符串 `"undefined"`——之后 `JSON.parse("undefined")` 抛 `SyntaxError`。
- **数字/布尔读回是字符串**：`"1" + 1 === "11"`；参与运算前先 `Number()` / 显式比较。
- **JSON 往返丢形清单**：对象属性值为 `undefined`/函数/`Symbol` → **键被跳过**；数组元素为这三者 → **变 `null`**。
- **`Date` → ISO 字符串**：`parse` 回来是 `string` 不是 `Date`——用 reviver 恢复或干脆存时间戳。
- **`Map`/`Set`/`RegExp`/`Error`/`Blob`/`ArrayBuffer` → `"{}"`**：全部序列化成空对象（`TypedArray` 变索引键对象）——结构化数据保形是 [IndexedDB](/zh/web-advanced/web-api/indexeddb/) 的管辖区。
- **`NaN`/`Infinity` → `null`**；**`BigInt` 与循环引用 → `JSON.stringify` 抛 `TypeError`**。
- **JSON 往返 = 深拷贝**：读回的对象与原对象无引用关系，改它不影响原对象。
- **`getItem` 缺键返回 `null` 不是 `undefined`**；巧的是 `JSON.parse(null)` 不抛错、安静返回 `null`——但这属于侥幸，别依赖。
- **读侧防御双件套**：`?? "兜底 JSON"` 处理缺键 + try-catch 包 `JSON.parse` 处理脏数据（用户手改、旧版本残留）。
- **`setItem` 是唯一常态抛错口**：存储满时**同步抛 `QuotaExceededError`**——**每一个 `setItem` 都必须在 try-catch 里**。
- **判错姿势**：`e instanceof DOMException && e.name === "QuotaExceededError"`（MDN 官方写法）。
- **配额量级**：典型约 5 MiB/源、独立小池——数值口径、两套账本、驱逐规则见[浏览器章配额页](/zh/base/browser/browser-storage/guide-line/quota-eviction)。
- **Safari 历史坑已成历史**：旧版 Safari 隐私模式下 localStorage **配额为 0**、任何 `setItem` 必抛；**现代浏览器统一为"可正常写、关窗即清"**——网上老文章说"隐私模式写不进"描述的是历史行为。
- **`SecurityError` 是另一类**：访问 `window.localStorage` 属性本身就可能抛（禁站点数据、不透明源），与配额无关。
- **特性检测用 MDN 的 `storageAvailable()`**：try 写删一对键，catch 里只有"`QuotaExceededError` 且已有存量数据"才算可用。

## 一、写入即字符串化：String() 的三重伏击

规范规定 Storage 的键与值**都是字符串**：`setItem` 收到任何非字符串入参，都先做一次隐式 `String()` 转换。三个后果按杀伤力排序（均为 Node 22 原生 Web Storage 实测）：

```js
// 伏击一：对象被转成 "[object Object]"，数据实质丢失
localStorage.setItem("user", { name: "Alex" });
localStorage.getItem("user"); // "[object Object]" ——什么都不剩

// 伏击二：undefined 被转成字符串 "undefined"
localStorage.setItem("token", undefined); // 变量意外为 undefined 时最常发生
localStorage.getItem("token");            // "undefined"（字符串！不是 undefined）
JSON.parse(localStorage.getItem("token")); // SyntaxError ——事故在读的时候爆炸

// 伏击三：数字、布尔读回来都是字符串
localStorage.setItem("count", 1);
localStorage.getItem("count") + 1; // "11" ——字符串拼接，不是加法
localStorage.setItem("flag", true);
localStorage.getItem("flag") === true; // false —— "true" !== true
```

伏击二值得单独敲黑板：它往往是**写侧的 bug 在读侧爆炸**——某处 `setItem(k, maybeUndefined)` 没做检查，几天后另一处 `JSON.parse` 抛 `SyntaxError`，栈里完全看不到肇事者。防御在写侧：值可能缺失时**要么不写、要么写 `JSON.stringify` 的结果**（`JSON.stringify(undefined)` 返回 `undefined`，传给 `setItem` 前可显式拦截）。

所以存任何结构化数据的标准姿势都是 JSON 往返：

```js
// 写：显式序列化
localStorage.setItem("prefs", JSON.stringify({ theme: "dark", fontSize: 14 }));

// 读：显式反序列化 + 缺键兜底
const prefs = JSON.parse(localStorage.getItem("prefs") ?? "{}");
```

而 JSON 往返本身又有一张丢形清单——下一节。

## 二、JSON 往返的丢形清单

`JSON.stringify` 不是无损快照，每一行都实测验证过：

| 原始值 | stringify 结果 | parse 回来 | 定性 |
| --- | --- | --- | --- |
| `undefined` / 函数 / `Symbol`（对象属性值） | **键被跳过** | 键不存在 | 静默丢 |
| `undefined` / 函数 / `Symbol`（数组元素） | `null` | `null` | 静默变形 |
| `Date` | ISO 8601 字符串 | **字符串**（不是 `Date`） | 丢类型 |
| `Map` / `Set` | `"{}"` | 空对象 | 全丢 |
| `RegExp` / `Error` | `"{}"` | 空对象 | 全丢 |
| `Blob` / `ArrayBuffer` | `"{}"` | 空对象 | 全丢 |
| `NaN` / `Infinity` | `null` | `null` | 静默变形 |
| `BigInt` | **抛 `TypeError`** | —— | 显式炸 |
| 循环引用 | **抛 `TypeError`** | —— | 显式炸 |

三条工程结论：

**其一，`Date` 是最高频的丢形现场。** 存之前是 `Date`，读回来是字符串，下游一调 `getTime()` 就炸。两种恢复姿势：

```js
// 姿势一：reviver ——parse 时按键名恢复 Date
const saved = JSON.stringify({ createdAt: new Date() });
const restored = JSON.parse(saved, (key, value) =>
  key === "createdAt" ? new Date(value) : value,
);
restored.createdAt instanceof Date; // true

// 姿势二（更省心）：一开始就存时间戳数字，读回 Number() 后随用随 new Date()
localStorage.setItem("lastVisit", String(Date.now()));
```

**其二，静默丢比抛错更危险。** `BigInt` 和循环引用会当场 `TypeError`，你立刻知道；而 `undefined` 属性、`Map`、`NaN` 是**无声变形**——写的时候一切正常，几周后读出来的数据结构对不上。凡是往 Storage 里放的对象，形状要保持"纯 JSON"：字符串、数字（有限值）、布尔、`null`、普通对象、数组，其余类型先手动转换。

**其三，需要保形就别硬撑。** `Date`、`Map`、`Blob`、二进制想原样存原样取，那是 IndexedDB 结构化克隆的能力范围（[本批 IndexedDB 叶](/zh/web-advanced/web-api/indexeddb/)；选型对照见[浏览器章](/zh/base/browser/browser-storage/guide-line/storage-overview)）。

顺带一个正面性质：JSON 往返回来的对象是**深拷贝**——与原对象再无引用关系，修改互不影响。拿 Storage 当"简易深拷贝"是段子，但这个性质在状态快照场景确实有用。

## 三、getItem 的 null：三个防御姿势

`getItem` 对不存在的键返回 **`null`**（规范如此，不是 `undefined`）。与 `JSON.parse` 组合时有个微妙点：

```js
JSON.parse(null);        // null ——不抛错！null 被转成字符串 "null" 再解析
JSON.parse(undefined);   // SyntaxError
JSON.parse("undefined"); // SyntaxError ——伏击二存进来的就是它
```

`JSON.parse(localStorage.getItem("missing"))` 碰巧不炸（返回 `null`），但这是**巧合而非设计**——一旦库里躺着 `"undefined"` 或被用户手改过的脏 JSON，照样 `SyntaxError`。完整的读侧防御长这样：

```js
/**
 * 读取并反序列化：缺键、脏数据都安全返回兜底值
 * @param {string} key 键名
 * @param {*} fallback 兜底值
 */
function readJSON(key, fallback = null) {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback; // 姿势一：显式判 null，区分"没存过"
  try {
    return JSON.parse(raw);          // 姿势二：parse 必须裹 try-catch
  } catch {
    localStorage.removeItem(key);    // 姿势三：脏数据顺手清掉，避免反复炸
    return fallback;
  }
}
```

为什么要防"脏数据"：localStorage 对用户是**完全可写的**（DevTools 里随便改），旧版本代码留下的格式残留也很常见——把"库里的值一定是我写的合法 JSON"当成前提，迟早翻车。

## 四、QuotaExceededError：唯一常态异常

读侧永不抛错、删除静默——整个 API 唯一会常态抛错的就是 **`setItem`**：存储区满时**同步抛出 `QuotaExceededError`**。所以规矩只有一条，没有例外：

**每一个 `setItem` 都必须在 try-catch 里。**

```js
/**
 * 安全写入：返回是否成功，满时执行一轮清理后重试一次
 */
function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    // MDN 官方判错姿势：确认确实是配额问题（而不是 SecurityError 等）
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      evictReproducible();               // 清理可再生数据（缓存类键）
      try {
        localStorage.setItem(key, value); // 重试一次
        return true;
      } catch {
        return false;                     // 还满：交给调用方降级（内存兜底/IndexedDB）
      }
    }
    return false;
  }
}

/** 示例的清理策略：删掉所有缓存前缀的键（先收集快照再删） */
function evictReproducible() {
  const doomed = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k !== null && k.startsWith("cache:")) doomed.push(k);
  }
  for (const k of doomed) localStorage.removeItem(k);
}
```

处理策略的优先级：**清理可再生数据 → 重试 → 降级**（本次会话用内存 Map 顶着，或把这类数据整体迁去 IndexedDB）。配额到底多大、为什么"localStorage 满了"不等于"这个源没空间了"（两套账本）、驱逐怎么发生——这些机制问题见[浏览器章配额与驱逐](/zh/base/browser/browser-storage/guide-line/quota-eviction)，此处不展开。

另一类要区分的异常是 **`SecurityError`**：它不是"满了"，而是**根本不让你碰**——用户禁用站点数据、代码运行在 `data:` 等不透明源时，访问 `window.localStorage` 属性本身就抛（场景清单见[浏览器章](/zh/base/browser/browser-storage/guide-line/web-storage-model)）。这也是下一节特性检测函数要把 `storage = window[type]` 放进 try 块的原因。

## 五、历史坑 vs 现状：Safari 隐私模式的配额 0

这是一段必须"分历史与现状"来讲的行为，网上大量老文章还停留在历史侧：

| | 行为 |
| --- | --- |
| **历史**（旧版 Safari 隐私模式） | `localStorage` 对象存在、`getItem` 正常，但**配额为 0**——任何 `setItem` 一律抛 `QuotaExceededError`。"隐私模式下 localStorage 写不进"这句老经验说的是它 |
| **现状**（现代浏览器，含 Safari） | 隐私窗口内 localStorage **可正常读写**，只是**会话结束（关闭隐私窗口）即全部清除**——表现如 sessionStorage（退化细节见[浏览器章](/zh/base/browser/browser-storage/guide-line/web-storage-model)） |

这段历史的最大遗产是塑造了 MDN 特性检测函数的形状：光判断 `e.name === "QuotaExceededError"` 不够——旧 Safari 隐私模式抛的也是它，但那时存储**根本不可用**。于是有了"抛配额错 + **库里已有数据**才算可用"的判断，见下一节。

## 六、storageAvailable：把检测一次写对

MDN 官方的可用性检测函数（原样可用，覆盖「全局对象被禁」「隐私模式配额 0」「真满」三类场景）：

```js
/**
 * 检测某类 Web Storage 是否真正可用（MDN 官方实现）
 * @param {"localStorage" | "sessionStorage"} type 存储类型
 */
function storageAvailable(type) {
  let storage;
  try {
    storage = window[type];          // 这一步本身就可能抛 SecurityError
    const x = "__storage_test__";
    storage.setItem(x, x);           // 试写
    storage.removeItem(x);           // 试删（不留垃圾）
    return true;
  } catch (e) {
    return (
      e instanceof DOMException &&
      e.name === "QuotaExceededError" &&
      // 关键判断：只有"抛配额错、但库里确实已有数据"才认定为可用——
      // 真满（可用但没空间）返回 true；旧 Safari 隐私模式（配额 0、库恒空）返回 false
      storage &&
      storage.length !== 0
    );
  }
}

// 用法：入口处检测一次，结果缓存
if (storageAvailable("localStorage")) {
  /* 放心使用 */
} else {
  /* 降级：内存 Map / 关闭持久化功能 */
}
```

读懂 catch 块就读懂了本页：**`SecurityError`（拿不到对象）直接落到 `false`**；**`QuotaExceededError` 还要再看 `length`**——库里有存量说明存储活着只是满了，库里空着还抛配额错就是"配额为 0"的不可用形态。

序列化与异常都能兜住之后，下一步是把这些防御沉淀成可复用的封装：[封装模式与工程实践](./patterns)。
