---
layout: doc
outline: [2, 3]
---

# 定位、URL 与其他

> 基于各 Web API 现行标准（W3C/WHATWG）与浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **定位入口**：`navigator.geolocation`（安全上下文、需授权），仅主线程。
- **取一次**：`getCurrentPosition(success, error?, options?)`——单次定位。
- **持续追踪**：`watchPosition(success, error?, options?)` → 返回 `watchId`（数字）；变化时反复回调。
- **停止追踪**：`clearWatch(watchId)`——用完必停，否则持续耗电。
- **成功对象**：`GeolocationPosition { coords, timestamp }`；`coords` 有 `latitude`/`longitude`/`accuracy`（必有）、`altitude`/`altitudeAccuracy`/`heading`/`speed`（可为 `null`）。
- **错误码**：`GeolocationPositionError.code`——`1` PERMISSION_DENIED、`2` POSITION_UNAVAILABLE、`3` TIMEOUT。
- **定位选项**：`enableHighAccuracy`（布尔，默认 false，开 GPS 更准更耗电更慢）、`timeout`（ms，默认 `Infinity`）、`maximumAge`（ms，默认 0，允许用多旧的缓存位置）。
- **定位权限**：Permissions 名 `"geolocation"`；`query` 可查三态、`onchange` 可监听。
- **URLPattern**：`new URLPattern(input, baseURL?)`，`input` 可为**模式串**或**分量对象**（protocol/hostname/pathname/search…）。
- **匹配**：`pattern.test(url, baseURL?)` → 布尔；`pattern.exec(url, baseURL?)` → 匹配结果（或 `null`）。
- **命名分组**：`:id` 命名分组，取值经 `result.pathname.groups.id`；另有 `*` 通配、`(\\d+)` 正则组、`?`/`+`/`*` 修饰、`{}` 分组。
- **URLPattern Baseline**：**2025-09-15 转为 Baseline Newly available**——Chrome 95 / Firefox 142 / **Safari 26**（注意：**不是** Safari 16.4）；可用 [polyfill](https://github.com/kenchris/urlpattern-polyfill) 兜旧环境。
- **Battery**：`navigator.getBattery()` → `Promise<BatteryManager>`（`charging`/`level`/`chargingTime`/`dischargingTime` + 事件）；**Firefox 已移除、Safari 从未实现、仅 Chromium**，因指纹隐私收缩，**新项目别用**。
- **Network Information**：`navigator.connection`（`effectiveType`=slow-2g/2g/3g/4g、`downlink`、`rtt`、`saveData`、`type` + `change`）；**Chromium 独占的非标准**，`saveData`（省流量偏好）是相对最该关注的信号。
- **Vibration**：`navigator.vibrate(pattern)`——数字或数组（震/停交替）；`vibrate(0)`/`vibrate([])` 取消；需用户激活，**仅移动、桌面与 iOS Safari 不支持**。
- **共性**：全部走[入门四地基](../getting-started)——HTTPS、（部分）用户激活、（部分）Permissions、特性检测降级。

## 一、Geolocation：取地理位置

[Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)（`navigator.geolocation`）提供设备定位，需**安全上下文**且**用户授权**。三个方法：单次 `getCurrentPosition`、持续 `watchPosition`、停止 `clearWatch`。

### 1.1 单次定位

```js
/** 取一次当前位置 */
function locateOnce() {
  if (!("geolocation" in navigator)) return; // 特性检测

  navigator.geolocation.getCurrentPosition(
    (position) => {
      // 成功：GeolocationPosition
      const { latitude, longitude, accuracy } = position.coords;
      console.log(`纬度 ${latitude}, 经度 ${longitude}, 精度 ±${accuracy}m`);
      console.log("采集时刻：", new Date(position.timestamp));
    },
    (error) => {
      // 失败：GeolocationPositionError，按 code 分流
      switch (error.code) {
        case error.PERMISSION_DENIED: // 1
          console.warn("用户拒绝了定位授权");
          break;
        case error.POSITION_UNAVAILABLE: // 2
          console.warn("定位信息不可用（无 GPS/网络定位失败）");
          break;
        case error.TIMEOUT: // 3
          console.warn("定位超时");
          break;
      }
    },
    {
      enableHighAccuracy: true, // 开高精度（GPS）：更准，但更慢更耗电
      timeout: 10000, // 最多等 10s
      maximumAge: 0, // 不接受缓存位置，强制取新
    },
  );
}
```

**`coords` 字段**：`latitude`/`longitude`/`accuracy`（三者必有，`accuracy` 单位米）；`altitude`/`altitudeAccuracy`/`heading`（航向 0–360°）/`speed`（m/s）在无对应传感器时为 `null`。

**`PositionOptions`**：

| 选项 | 默认 | 含义 |
| --- | --- | --- |
| `enableHighAccuracy` | `false` | 开则尽量用 GPS：更准，但更慢、更耗电 |
| `timeout` | `Infinity` | 等待位置的最长毫秒数，超时走 `TIMEOUT` |
| `maximumAge` | `0` | 可接受的缓存位置最大「年龄」ms；设大可秒回但可能偏旧 |

### 1.2 持续追踪与停止

```js
/** 持续追踪位置（如实时导航），记得用完 clearWatch */
let watchId = null;

function startTracking() {
  watchId = navigator.geolocation.watchPosition(
    (pos) => updateMap(pos.coords.latitude, pos.coords.longitude),
    (err) => console.warn("追踪失败：", err.message),
    { enableHighAccuracy: true, maximumAge: 2000 },
  );
}

function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId); // 必停，否则持续耗电耗流量
    watchId = null;
  }
}
```

### 1.3 权限与降级

- **Permissions 查询**：名字 `"geolocation"`，可 `navigator.permissions.query({ name: "geolocation" })` **先查后用**，`denied` 时别再触发弹窗、直接引导去设置或走降级（手动输入城市等）。
- **权限策略** `geolocation`（iframe 内需 `allow="geolocation"`）。
- **地域提示**：中国大陆基于 WiFi 的定位可能不可用/不准，实际项目常改用本地服务商（百度/高德/腾讯）的 JS 定位 SDK。

```js
/** 先查权限再决定要不要弹窗 */
async function smartLocate() {
  try {
    const s = await navigator.permissions.query({ name: "geolocation" });
    if (s.state === "denied") return showManualCityInput(); // 已拒，别弹
  } catch {
    /* 个别浏览器不支持查该名字，忽略，直接尝试 */
  }
  locateOnce(); // prompt/granted：调用触发（或直接用）授权
}
```

## 二、URLPattern：声明式 URL 匹配

[URL Pattern API](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API) 用一套**声明式模式语法**匹配 URL 并**抽取命名分组**，把手写正则的路由判断替换成可读的模式。它和 Express/Next.js 路由、[path-to-regexp](https://github.com/pillarjs/path-to-regexp) 同源，非常适合**前端路由、Service Worker 请求分流**。

### 2.1 构造、test 与 exec

```js
// 既可传「模式串 + baseURL」，也可传「分量对象」
const route = new URLPattern({ pathname: "/users/:id/posts/:postId" });

// test：只问匹不匹配，返回布尔
route.test("https://example.com/users/42/posts/7"); // true
route.test("https://example.com/about"); // false

// exec：匹配则返回结构化结果（分量 + 命名分组），否则 null
const result = route.exec("https://example.com/users/42/posts/7");
result.pathname.groups.id; // "42"   ← 命名分组从这里取
result.pathname.groups.postId; // "7"
result.pathname.input; // "/users/42/posts/7"
```

`exec` 的返回对象按 **URL 分量**分层（`protocol`/`username`/`password`/`hostname`/`port`/`pathname`/`search`/`hash`），每个分量有 `.input` 与 `.groups`，命名分组的值就在对应分量的 `groups` 里。

### 2.2 模式语法

| 语法 | 含义 | 示例 |
| --- | --- | --- |
| 固定文本 | 精确匹配 | `/books` |
| `:name` | 命名分组（抽取值） | `/books/:id` |
| `*` | 通配（贪婪，零或多字符） | `/static/*` |
| `(正则)` | 正则组 | `/books/:id(\\d+)`（id 仅限数字） |
| `?` / `+` / `*` | 修饰：可选 / 一或多 / 零或多 | `/books/:id?` |
| `{...}` | 非捕获分组（配修饰用） | `/books{/}?`（可选尾斜杠） |

```js
// 路由表 + 分发（前端路由的典型骨架）
const routes = [
  { pattern: new URLPattern({ pathname: "/" }), name: "home" },
  { pattern: new URLPattern({ pathname: "/books/:id(\\d+)" }), name: "book" },
  { pattern: new URLPattern({ pathname: "/search{/}?" }), name: "search" },
];

function resolve(url) {
  for (const r of routes) {
    const m = r.pattern.exec(url);
    if (m) return { name: r.name, params: m.pathname.groups };
  }
  return { name: "404", params: {} };
}

resolve("https://x.com/books/123"); // { name: "book", params: { id: "123" } }
```

支持 `ignoreCase: true` 选项做大小写不敏感匹配；`URLPattern` 在 **Web Worker 中也可用**（适合在 SW 里做 fetch 分流）。

### 2.3 Baseline 状态与降级

- **URLPattern 于 2025-09-15 转为 [Baseline](https://developer.mozilla.org/en-US/docs/Glossary/Baseline/Compatibility) Newly available**——即最后一个主流浏览器补齐支持的日期。
- 各浏览器起点：**Chrome 95**（2021-10-19，早就有）、**Firefox 142**（2025-08-19）、**Safari 26**（2025-09-15）。
- **注意易混点**：URLPattern 的 Safari 支持是 **Safari 26**，**不是 Safari 16.4**（Safari 16.4 那批新增的是 Screen Wake Lock 等，不含 URLPattern）。
- **旧环境降级**：需要兼容 2025 年前的浏览器时，用官方 [urlpattern-polyfill](https://github.com/kenchris/urlpattern-polyfill)，或退回手写正则。

```js
// 特性检测 + polyfill 兜底
if (!("URLPattern" in globalThis)) {
  // await import("urlpattern-polyfill"); // 打补丁后再用
}
```

## 三、其他三个边角 API（知道就好）

这三个体量更小、且**都处于隐私收缩或半支持状态**，了解其现状即可，别在生产里当默认可用。

### 3.1 Battery Status：正在被抛弃

[Battery Status API](https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API) 读电量状态：

```js
if ("getBattery" in navigator) {
  const battery = await navigator.getBattery(); // Promise<BatteryManager>
  console.log(`电量 ${battery.level * 100}%，充电中：${battery.charging}`);
  battery.addEventListener("levelchange", () => {
    /* 电量变化 */
  });
}
```

`BatteryManager`：`charging`（是否充电）、`level`（0–1）、`chargingTime`、`dischargingTime` + `chargingchange`/`levelchange` 等事件。**现状：Firefox 已移除、Safari 从未实现、仅 Chromium 保留**，因**指纹追踪隐私风险**整体处于淘汰态势——**新项目不要依赖它**。

### 3.2 Network Information：Chromium 独占的非标准

[Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)（`navigator.connection`）报告网络质量：

```js
const conn = navigator.connection; // 仅 Chromium 有
if (conn) {
  console.log(conn.effectiveType); // "slow-2g" | "2g" | "3g" | "4g"
  if (conn.saveData) disablePreload(); // 用户开了「省流量」→ 别预加载大资源
  conn.addEventListener("change", () => console.log("网络变化：", conn.effectiveType));
}
```

属性：`effectiveType`、`downlink`（Mbps 估计）、`rtt`（往返时延 ms）、`saveData`（省流量偏好，布尔）、`type`。**现状：Chromium 独占的非标准/实验特性，Firefox 与 Safari 均不支持**，也有隐私顾虑。其中 **`saveData` 是相对最值得读的信号**（尊重用户省流量意愿），但同样要 `if (conn)` 探测后用。

### 3.3 Vibration：移动端震动反馈

[Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)（`navigator.vibrate`）让移动设备震动：

```js
navigator.vibrate(200); // 震 200ms
navigator.vibrate([200, 100, 200]); // 震200 → 停100 → 震200（数组=震/停交替）
navigator.vibrate(0); // 取消（等价 vibrate([])）
```

参数是**单个数字**（毫秒）或**数字数组**（震动/暂停交替）。需**用户激活**、**仅移动端有震动硬件时生效**；**桌面浏览器与 iOS Safari 不支持**（调用静默无效果）。用作轻量触觉反馈时务必把它当「锦上添花」，不能作为关键交互的唯一反馈。
