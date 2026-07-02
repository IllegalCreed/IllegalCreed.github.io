---
layout: doc
outline: [2, 3]
---

# 配额与驱逐

> 基于 Web 现代标准 · 核于 2026-07

## 速查

- **Storage API（`navigator.storage`，StorageManager）≠ Web Storage API（localStorage）**——名字像，完全两个东西；前者管配额与持久化
- `navigator.storage.estimate()` 返回 `{ usage, quota }`（字节）——都是**估算值**：浏览器为反指纹会刻意模糊，去重/压缩也让物理占用≠逻辑大小
- **共享配额覆盖**：IndexedDB、Cache API、OPFS、WebAssembly 代码缓存；**Web Storage 另立小池（各 ~5 MiB）**；Cookie 完全不在配额体系
- 配额数值（当前 MDN 口径）：**Chrome/Edge 单源 ≤ 磁盘 60%**；**Firefox best-effort = min(磁盘 10%, 每 eTLD+1 组 10 GiB)**，persistent 可到磁盘 50%（上限 8 TiB）；**Safari（macOS 14/iOS 17+）浏览器内单源 ~60%**，旧版 Safari 从 **1 GiB** 起、满了弹窗按 **200 MB** 递增（web.dev）
- **Chrome 无痕模式配额只有 ~5%** 磁盘；开「关窗清数据」设置时约 **300 MB**（web.dev）
- 两种桶模式：**best-effort**（默认，存储压力下可被清、不通知）vs **persistent**（`persist()` 申请成功后，仅用户显式操作才清）
- 申请持久化的裁决方式不同：**Firefox 弹权限窗**问用户；**Chrome/Edge/Safari 不弹窗**，按交互历史自动批/拒
- 驱逐 = 存储压力（磁盘紧张 / 浏览器总占用超上限）触发，按 **LRU 挑最久未用的源，整源清除**（IndexedDB+Cache+OPFS 一锅端，防止半删不一致）；persistent 源被跳过
- **Safari ITP 铁律：7 个 Safari 使用日内无交互 → 清空该站全部脚本可写存储**（IndexedDB/Cache API/SW 注册/localStorage…）；服务端 Set-Cookie 的 Cookie 幸存；**已安装（加主屏）PWA 豁免**；一次交互重置计时
- 超限报错三张脸：Web Storage `setItem` **同步抛** `QuotaExceededError`；IndexedDB 事务 **onabort** 收 `QuotaExceededError`；Cache API 写入 **reject** 同名错误
- DevTools：Chrome「Application → Storage」看用量、可模拟自定义配额

## 一、先分清两个「Storage API」

命名事故现场：

| | Web Storage API | **Storage API** |
| --- | --- | --- |
| 入口 | `window.localStorage` / `sessionStorage` | **`navigator.storage`**（StorageManager） |
| 职责 | 存键值串 | **管配额、持久化、OPFS 入口** |
| 方法 | `getItem`/`setItem`… | `estimate()` / `persist()` / `persisted()` / `getDirectory()` |
| 环境 | 仅 window | window + Worker；需安全上下文（HTTPS） |

Storage API 背后是 WHATWG Storage 标准的统一模型：**每个源一个「站点存储单元」（桶）**，IndexedDB、Cache API、OPFS 等的数据都记在这个桶上，配额按桶算、驱逐按桶清。

## 二、estimate()：查账

```js
// 查询当前源的存储用量与配额（单位：字节）
const { usage, quota } = await navigator.storage.estimate();

console.log(`已用 ${(usage / 1024 / 1024).toFixed(1)} MiB`);
console.log(`配额 ${(quota / 1024 / 1024 / 1024).toFixed(1)} GiB`);
console.log(`占比 ${((usage / quota) * 100).toFixed(2)}%`);
```

两个「估」字要当真：

- **quota 是保守估算**——比设备真实可用空间小，防止写爆磁盘。
- **usage 是模糊值**——浏览器会做混淆（反指纹），且去重/压缩让「你写入的字节数」与「实际占的字节数」对不上。**别拿它做精确账本**，做「快满了该清理了」的阈值判断刚好。

配套的排查入口：Chrome DevTools「Application → Storage」能看分项用量，还能勾选模拟自定义配额来测试超限路径。

## 三、谁在共享配额

| 存储 | 记入共享源配额？ |
| --- | --- |
| IndexedDB | **是** |
| Cache API | **是** |
| OPFS | **是** |
| WebAssembly 代码缓存 | **是** |
| localStorage / sessionStorage | 否——独立小池，各 ~5 MiB/源 |
| Cookie | 否——独立限制（单条 ~4KB），不该拿来存数据 |

所以「配额还剩 40 GB」与「localStorage 满了」可以同时为真——两套账本。

## 四、配额数值：各浏览器现状

以 MDN《Storage quotas and eviction criteria》当前口径为准（web.dev 文章年代更早，个别数字已过时，下表已标注）：

| 浏览器 | best-effort（默认） | persistent | 备注 |
| --- | --- | --- | --- |
| **Chrome / Edge（Chromium）** | 单源 ≤ **磁盘总量 60%** | 同 60% | 浏览器整体占用上限 ~80%；**无痕 ~5%**、「关窗清数据」设置下 ~**300 MB**（web.dev） |
| **Firefox** | **min(磁盘 10%, 10 GiB)**，其中 10 GiB 是**每 eTLD+1 组**上限 | **磁盘 50%**（上限 8 TiB），不受组限 | 组限意味着同站多子域共享 10 GiB |
| **Safari（macOS 14 / iOS 17+）** | 浏览器内单源 ~**60%**；嵌入 WKWebView 的 App 内 ~**15%** | 同左 | 浏览器整体 80% / App 内 20%；跨源 iframe 约为父配额 1/10；加主屏的 Web App 享浏览器配额 |
| **Safari（旧版）** | 起步 **1 GiB**，用满弹窗向用户要，按 **200 MB** 递增（web.dev） | — | 「Safari 约 1GB 起递增提示」这条经验来自这里 |

三个易错点：

- **配额按「源」算**：scheme+host+port 任一不同就是另一个源、另一份配额；只有 Firefox 的组限额外按 **eTLD+1**（站点）聚合。
- **无痕模式配额骤减**（Chrome ~5%）且关窗全清——离线功能在无痕下按不可用设计。
- 数字会随版本调整，**判断逻辑写代码时永远以 `estimate()` 运行时结果为准**，表格数字只用于建立量级直觉。

## 五、两种桶：best-effort vs persistent

WHATWG 模型里每个源的桶有两种模式：

- **best-effort**（默认）：浏览器尽力保留；存储压力来了**不打招呼直接清**。
- **persistent**：`navigator.storage.persist()` 申请成功后，LRU 驱逐**跳过**该源；「清缓存/清最近历史」也不动它，只有用户显式针对性操作才清。

```js
// 申请持久化 + 查询当前状态
const persisted = await navigator.storage.persisted(); // 当前是否已持久
if (!persisted) {
  const granted = await navigator.storage.persist(); // 申请（可能被拒）
  console.log(granted ? "已获持久承诺" : "仍是 best-effort，可能被驱逐");
}
```

批不批的裁决方式各家不同：**Firefox 弹出权限提示**交给用户；**Chrome/Edge/Safari 不弹窗**，根据交互历史（是否常用、是否加书签/装 PWA 等信号）自动决定。所以 `persist()` 返回 `false` 不是 bug，是拒签——代码必须兼容「永远拿不到持久承诺」的路径。

## 六、驱逐：数据怎么消失的

### 6.1 通用规则：LRU 整源清除

触发条件是**存储压力**：设备磁盘吃紧，或浏览器总占用触到自身上限（如 Chrome/Safari 的 80%）。此时浏览器按 **LRU** 找出**最久未使用**的 best-effort 源，把它的数据**整源删除**——IndexedDB、Cache API、OPFS 一起走，不做部分删除，因为半删会给应用留下无法自愈的不一致状态。persistent 源被跳过。

### 6.2 Safari ITP：7 天铁律

Safari 在通用规则之外多一条**主动**清除：开启反跨站追踪（默认开启）时，**用户连续 7 个「Safari 使用日」未与站点交互，该站全部脚本可写存储被清空**——IndexedDB、Cache API、Service Worker 注册、localStorage 全在内。要点：

- **服务端 `Set-Cookie` 下发的 Cookie 不在清除之列**（这是「登录态活着、离线数据没了」的成因）。
- 用户的一次点击/触摸等交互即可**重置 7 天计时**。
- **加到主屏幕的已安装 PWA 豁免**。

工程对策：面向 Safari 用户的应用，把本地存储当**缓存**而非**唯一副本**——关键数据必须有服务端源头，本地丢了能重建；或引导用户安装 PWA。

### 6.3 超限时的三张错误脸

驱逐之外，**写入超限**是另一条失败路径，三类存储报错方式不同：

| 存储 | 超限表现 |
| --- | --- |
| Web Storage | `setItem` **同步抛** `QuotaExceededError` |
| IndexedDB | 事务中止，**`onabort`** 回调收到 `QuotaExceededError` |
| Cache API | 写入 Promise **reject** `QuotaExceededError` |

统一处理思路：捕获 → 清理可再生数据（旧缓存先删）→ 重试；不可再生数据提示用户。

## 小结

- `navigator.storage`（Storage API）是配额与持久化的总入口，与 localStorage 的 Web Storage API 只是重名亲戚。
- 两套账本：IndexedDB/Cache/OPFS/wasm 缓存共享源级大配额；Web Storage 独立 ~5 MiB；Cookie 不在体系内。
- 量级直觉：Chrome 单源 60% 磁盘、Firefox min(10%, 10 GiB/站点组)、新 Safari ~60%、旧 Safari 1 GiB 起弹窗递增；无痕骤减且关窗全清——运行时判断永远用 `estimate()`。
- best-effort 默认可被 LRU 整源驱逐；`persist()` 换承诺但可能被拒（Firefox 问用户，Chromium/Safari 自动裁决）。
- Safari ITP 7 天无交互清空脚本可写存储（服务端 Cookie 幸存、已装 PWA 豁免）——本地数据只能当缓存设计。
- 配额按源隔离之后，还有一层按顶级站点的切分——[存储分区与 Storage Buckets](./partitioning-buckets)。
