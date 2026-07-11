---
layout: doc
outline: [2, 3]
---

# 封装模式与工程实践

> 基于 WHATWG HTML 现行标准（Web storage 章）· 核于 2026-07

## 速查

- **裸用三痛点**：处处手写 JSON 往返、处处重复 try-catch、天生没有 TTL/命名空间/类型约束——超过一个模块在用就该封装。
- **TTL 信封模式**：值包成 `{ v: 值, e: 过期时间戳 }` 再序列化；**读时惰性过期**——过期即删并当作不存在。
- **过期清理是惰性的**：Web Storage 没有原生过期，只有"下次读到才删"；写满触发 `QuotaExceededError` 时可全量扫一轮过期键腾位。
- **命名空间前缀**：键名统一 `应用:模块:键`（如 `myapp:auth:lastUser`）——同源多应用/多模块共存不打架，批量清理只清自己。
- **前缀批量清理**：先用 `length` + `key(i)` 收集键名快照、再删——**边遍历边删会因索引前移漏项**；绝不裸 `clear()`（会把同源其他脚本的键一锅端）。
- **TypeScript 泛型包装**：用一张 Schema 接口（键名 → 值类型映射）约束 get/set——键名拼错、值类型不符都在**编译期**报。
- **版本迁移**：专设 `schema-version` 键 + 逐版本迁移函数链；迁移必须**幂等**（重跑无害）。
- **同步阻塞对策一**：启动时一次读入内存，之后**读走内存、写透（write-through）回存储**——把同步开销压到每会话常数次。
- **同步阻塞对策二**：高频写（编辑器草稿、滚动位置）用**防抖/节流**合并落盘，别每次键入都 `setItem`。
- **别塞巨型单键 JSON**：小改动 = 整串重序列化 + 重解析；拆成多个键按需读写（量化口径见[浏览器章](/zh/base/browser/browser-storage/guide-line/storage-overview)）。
- **SSR 守卫**：服务端没有 `window`——所有访问前置 `typeof window === "undefined"` 检查，且**模块顶层不碰 storage**（import 即执行，服务端直接炸）。
- **框架时机**：Vue 在 `onMounted`、React 在 `useEffect` 之后再读 storage——既避开 SSR，又避免服务端 HTML 与客户端首帧不一致（水合错位）。
- **写失败降级**：封装层内置内存 `Map` 兜底——配额满/被禁时本会话功能不塌，只丢持久化。
- **同页通知**：统一写入口顺手派发自定义事件，补上"storage 事件不通知自己"的缺口（模式见 [API 页](./api-and-events)）。
- **升级 IndexedDB 的信号**：单值几十 KB 以上或总量逼近 MiB 级、要保形（`Date`/`Map`/二进制）、要索引查询、要进 Worker、高频写卡主线程——满足任何一条就迁 [IndexedDB](/zh/web-advanced/web-api/indexeddb/)。
- **别重复造轮子**：VueUse `useStorage`、usehooks-ts `useLocalStorage` 等就是"序列化 + 事件同步 + SSR 守卫"这套路数的成品，生产可直接用——本页价值在讲透它们内部在做什么。

## 一、为什么裸用撑不过三个模块

裸的 `localStorage` 用在一个地方很清爽，用在第三个模块时问题全部浮现：

- **序列化重复**：每个调用点各写一遍 `JSON.stringify` / `JSON.parse` / try-catch，姿势还不统一（有的忘了 catch，有的忘了判 `null`）；
- **键名打架**：`"user"`、`"cache"` 这类裸键迟早撞车——同源的老代码、第三方脚本、微前端子应用共用同一个 localStorage；
- **没有生命周期**：Web Storage 原生没有过期概念，"缓存三天"这种需求裸 API 表达不了。

所以工程共识是：**业务代码不直接碰 `localStorage`，一律经过一层薄封装**。下面五节就是这层封装的五个标准件——TTL、前缀、类型、迁移、守卫，最后给出"什么时候这层封装也救不了、该升级 IndexedDB"的判断清单。

## 二、带 TTL 的过期封装

思路：把值装进带过期时间戳的"信封"再落盘，**读的时候检查是否过期**——过期即删、当作不存在（惰性删除）：

```js
/**
 * 带过期时间地写入：值包进信封 { v, e } 再序列化
 * @param {string} key 键名
 * @param {unknown} value 任意可 JSON 序列化的值
 * @param {number} ttlMs 存活毫秒数
 * @returns {boolean} 是否写入成功（配额满等异常返回 false）
 */
function setWithTTL(key, value, ttlMs) {
  const envelope = {
    v: value,              // 真实值
    e: Date.now() + ttlMs, // 过期时间戳（毫秒）
  };
  try {
    localStorage.setItem(key, JSON.stringify(envelope));
    return true;
  } catch {
    return false; // 典型是 QuotaExceededError：满了写不进
  }
}

/**
 * 读取：过期即视为不存在，并顺手删除（惰性清理）
 * @returns {unknown} 值；不存在/已过期/数据损坏都返回 null
 */
function getWithTTL(key) {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  try {
    const envelope = JSON.parse(raw);
    if (typeof envelope?.e === "number" && Date.now() > envelope.e) {
      localStorage.removeItem(key); // 已过期：删掉，别让尸体占配额
      return null;
    }
    return envelope.v;
  } catch {
    return null; // 不是本封装写的格式（或已损坏）：按不存在处理
  }
}

// 用法：接口结果缓存 10 分钟
setWithTTL("cache:user-list", userList, 10 * 60 * 1000);
const cached = getWithTTL("cache:user-list"); // 过期自动返回 null → 走网络
```

要点是认清**惰性**的含义：没被再次读到的过期键会一直躺在库里占配额。两个补救时机——应用启动时全量扫一轮过期键；或在 `setItem` 抛 `QuotaExceededError` 时把清理过期键当作第一轮腾位手段（配合[序列化页](./serialization-exceptions)的 `safeSet` 重试模式）。

## 三、命名空间前缀与批量清理

键名统一加前缀是最便宜的秩序：`应用:模块:键` 三段式足够用——

```js
const PREFIX = "myapp:";

/** 只清理本应用前缀下的键：先收集快照，再删除 */
function clearNamespace(subPrefix = "") {
  const target = PREFIX + subPrefix; // 如 "myapp:cache:" 只清缓存段
  const doomed = [];
  // 边遍历边删会让索引前移、跳过条目——必须先收集完整快照
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key !== null && key.startsWith(target)) doomed.push(key);
  }
  for (const key of doomed) localStorage.removeItem(key);
}

clearNamespace();         // 清掉 myapp: 下所有键——不伤同源其他脚本的数据
clearNamespace("cache:"); // 只清 myapp:cache: 段
```

两条纪律：**绝不裸调 `clear()`**（同源的第三方脚本、其他子应用与你共用同一个 localStorage，一把清空是事故）；**批量枚举用 `length` + `key(i)` 而不是 `Object.keys`**（后者数不到与原型成员同名的键，见 [API 页实测](./api-and-events)）。

## 四、类型安全的泛型包装（TypeScript）

裸 Storage 的键是任意字符串、值是任意字符串——两个"任意"在 TS 项目里都该被收编。思路：**用一张 Schema 接口把"键名 → 值类型"的映射声明出来**，get/set 全部走泛型约束：

```ts
// 1. 声明本应用全部存储键及其值类型——这张表就是"存储的类型契约"
interface StorageSchema {
  "app:theme": "light" | "dark";
  "app:fontSize": number;
  "app:recentSearches": string[];
}

/** 类型安全的 Storage 包装：键名与值类型都在编译期约束 */
class TypedStorage<Schema extends Record<string, unknown>> {
  /**
   * @param storage 注入 localStorage 或 sessionStorage（也便于测试时注入内存实现）
   */
  constructor(private storage: Storage) {}

  /** 读取：缺键、反序列化失败都返回 null */
  get<K extends keyof Schema & string>(key: K): Schema[K] | null {
    const raw = this.storage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as Schema[K];
    } catch {
      return null; // 脏数据按不存在处理
    }
  }

  /** 写入：返回是否成功——配额满返回 false 而不是抛出 */
  set<K extends keyof Schema & string>(key: K, value: Schema[K]): boolean {
    try {
      this.storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  /** 删除指定键 */
  remove<K extends keyof Schema & string>(key: K): void {
    this.storage.removeItem(key);
  }
}

const store = new TypedStorage<StorageSchema>(localStorage);

store.set("app:fontSize", 14);          // OK
store.get("app:theme");                 // 类型自动推导为 "light" | "dark" | null
// store.set("app:fontSize", "14");     // ← 编译期报错：string 不能赋给 number
// store.get("app:themo");              // ← 编译期报错：键名拼写错误
```

这层包装顺手解决了三件事：键名拼错在编译期暴露、值的 JSON 往返被收口到一处、`Storage` 通过构造函数注入（单测时传一个内存实现即可，不必 mock 全局）。

## 五、版本迁移

存储会活得比代码久：用户半年后回访，库里躺着的还是旧版数据结构。方案与数据库迁移同构——**专设版本号键 + 逐版本迁移函数链**：

```js
const VERSION_KEY = "myapp:schema-version";
const CURRENT_VERSION = 3;

/** 每个函数负责从版本 n 迁到 n+1；必须幂等（重跑无害） */
const migrations = {
  1: () => {
    // v1 → v2：主题键改名并加前缀
    const theme = localStorage.getItem("theme");
    if (theme !== null) {
      localStorage.setItem("myapp:theme", theme);
      localStorage.removeItem("theme");
    }
  },
  2: () => {
    // v2 → v3：字号从枚举字符串改为数字
    const size = localStorage.getItem("myapp:fontSize");
    if (size === "large") localStorage.setItem("myapp:fontSize", "18");
    if (size === "small") localStorage.setItem("myapp:fontSize", "12");
  },
};

/** 应用启动时调用：把存储结构逐级升到当前版本 */
function migrateStorage() {
  let version = Number(localStorage.getItem(VERSION_KEY) ?? "1");
  while (version < CURRENT_VERSION) {
    migrations[version]?.(); // 缺失的版本段视为无操作
    version += 1;
  }
  try {
    localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
  } catch {
    /* 版本号写失败不致命：迁移函数幂等，下次启动重跑即可 */
  }
}
```

**幂等是硬要求**：版本号写失败、迁移中途用户关页，下次启动都会重跑部分迁移——每个迁移函数都要做到"已迁过再跑一遍不出错"。数据不值钱时也有奢侈解法：结构对不上直接清掉重建（毕竟这里只该放丢了能重建的数据）。

## 六、性能：同步 API 的正确姿势

Web Storage 每次读写都**同步阻塞主线程**（量化口径与"该不该继续用"的选型见[浏览器章](/zh/base/browser/browser-storage/guide-line/storage-overview)）。留在 Web Storage 里的数据，两个姿势把开销压到最低：

**姿势一：读走内存，写透回存储。** 启动时一次性读入内存 Map，之后读操作全走内存、写操作先改内存再同步落盘：

```js
const PREFIX = "myapp:";
const cache = new Map();

/** 启动时调用：把本应用前缀下的键一次性读入内存 */
function initCache() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key !== null && key.startsWith(PREFIX)) {
      cache.set(key, localStorage.getItem(key));
    }
  }
}

/** 读：纯内存，零同步 IO */
function read(key) {
  return cache.get(PREFIX + key) ?? null;
}

/** 写：内存先行（本会话立即可见），写透持久化（失败不影响会话内功能） */
function write(key, value) {
  cache.set(PREFIX + key, value);
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    /* 满了/被禁：内存兜底，本会话功能不塌，只丢持久化 */
  }
}
```

这段代码同时演示了**写失败降级**：`setItem` 炸了也只是丢持久化，会话内一切照常——封装层兜住，业务代码不感知。

**姿势二：高频写合并落盘。** 编辑器草稿、滚动位置这类每秒变多次的状态，防抖后再写：

```js
/** 高频状态：停止变化 300ms 后才真正落盘，中间的中间态全部合并 */
let timer = null;
function saveDraftDebounced(text) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      localStorage.setItem("myapp:editor-draft", text);
    } catch {
      /* 草稿写失败值得提示用户，避免静默丢稿 */
    }
  }, 300);
}
```

反面姿势也点一下：**别把所有状态塞成一个巨型 JSON 键**——任何小改动都要整串 `JSON.stringify` 重写、读侧整串重 `parse`，拆成多个键按需读写才符合它"小键值"的定位。

## 七、SSR 与框架时机守卫

`localStorage` 只存在于浏览器 `window` 上——SSR（Nuxt/Next 等）的服务端阶段没有它，**模块顶层的一句 `localStorage.getItem` 就能让服务端渲染直接抛错**。两层守卫：

```js
/**
 * 环境守卫版读取：服务端返回兜底值；浏览器端再防 SecurityError
 */
function safeGet(key, fallback = null) {
  if (typeof window === "undefined") return fallback; // SSR 阶段：没有 window
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback; // 禁站点数据/不透明源等场景抛 SecurityError
  }
}
```

时机上，框架代码要等**挂载后**再碰 storage——不只是防炸，更是防**水合错位**：服务端渲染的 HTML 里不可能包含用户本地的 storage 值，客户端首帧若直接按 storage 渲染，会与服务端产物对不上。

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";

// 首帧用默认值渲染（与服务端产物一致），挂载后再从 storage 恢复
const theme = ref<"light" | "dark">("light");

onMounted(() => {
  // onMounted 只在浏览器执行：天然的 SSR 守卫 + 水合安全时机
  const saved = localStorage.getItem("myapp:theme");
  if (saved === "dark" || saved === "light") theme.value = saved;
});
</script>
```

React 里同一件事发生在 `useEffect`。这也是 VueUse `useStorage`、usehooks-ts `useLocalStorage` 内部都做了 SSR 分支的原因——**用现成 hook 时这层守卫已经带上**，自己裸写才需要操心。

## 八、何时升级 IndexedDB

这层封装能解决舒适性问题，解决不了先天限制。出现以下任何一条信号，说明数据已经长出了 Web Storage 的尺码，该迁 [IndexedDB](/zh/web-advanced/web-api/indexeddb/)：

| 信号 | 为什么 Web Storage 顶不住 |
| --- | --- |
| 单值几十 KB 以上、总量逼近 MiB 级 | 同步读写 + JSON 往返的主线程开销开始可感知；约 5 MiB 天花板在望 |
| 需要保形存储（`Date`/`Map`/`Blob`/二进制） | JSON 丢形清单躲不开；IndexedDB 结构化克隆原样存取 |
| 需要按字段查询、排序、分页 | 键值模型只能全量取回自己过滤；IndexedDB 有索引与游标 |
| Worker / Service Worker 里要访问 | Web Storage 在 Worker 中不存在 |
| 写入频率高到防抖也救不了 | 异步事务不阻塞主线程 |

选型的完整对照（六机制五维大表）见[浏览器章存储全景](/zh/base/browser/browser-storage/guide-line/storage-overview)。最后一页把全叶的表格与易错点集中归档：[参考](../reference)。
