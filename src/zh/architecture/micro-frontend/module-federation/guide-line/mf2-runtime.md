---
layout: doc
outline: [2, 3]
---

# MF 2.0 运行时化

> 基于 Module Federation 2.0（v2.6 2026-06） · 核于 2026-07

## 速查

- **MF 2.0 = 运行时化重构**：2024-04-26 由**字节跳动 Web Infra + Zack Jackson + 社区**从 webpack 5 的模块共享能力 **fork 出来、做成独立项目**（module-federation.io）。
- 核心动作一句话：**「原本内嵌在 webpack 里的运行时能力，被抽取成一个独立 SDK」**——从此 MF **不再是 webpack 编译期专属**。
- **Runtime SDK**：`@module-federation/runtime`（`@module-federation/enhanced/runtime` 为增强入口），可**不依赖任何构建工具**「动态注册和加载 remote 与 shared 模块」。
- **纯运行时四件套**：`createInstance({ name, remotes })` 建实例 → `loadRemote('remote/expose')` 加载模块 → `registerRemotes([...])` **动态注册** remote → `preloadRemote([...])` 预加载。
- **`registerRemotes` 是升维关键**：remote 列表可在**运行时**才确定（来自接口/配置中心），实现灰度、A/B、动态上下线——「哪些微前端在线、用哪个版本」从**构建期决策**变成**运行期决策**。
- **mf-manifest.json 协议**：2.0 新增的**结构化清单**，携带 `remoteEntry`/`shared`/`exposes`/`remotes`/`chunks`/`type`，是版本管理、类型同步、预加载、DevTools 的公共数据源。
- **运行时插件系统**（Runtime Plugin System）：一组**生命周期钩子**（`beforeInit`/`beforeRequest`/`afterResolve`/`onLoad`/`errorLoadRemote` 等），可插拔地干预模块解析与加载——重试、鉴权、降级、监控都靠它。
- **构建插件仍在，但退居「织入器」**：webpack/Rspack 插件负责编译期把 `import` 改写成运行时调用、生成 manifest；真正干活的是底层那个**与构建工具无关的 runtime**。
- **两种用法并存**：构建插件用法（`import("shop/Button")` 由插件改写）与纯运行时用法（手动 `createInstance`）**共享同一个 runtime 内核**，可混用。
- **意义**：MF 从「一个 webpack 打包特性」升维成「**一个独立的微前端运行时**」——这是它 2026 年能横跨 webpack/Rspack/Vite/Rollup/Metro 的技术前提。
- 配置侧（插件怎么配 `exposes`/`remotes`）见[构建工具章 · webpack 深入](/zh/frontend-toolchain/build/webpack/guide-line/expert)；本页讲**运行时 SDK 与协议**这一架构层。

## 一、2.0 是一次「从 webpack 里搬出来」

要理解 MF 2.0，先看它**从哪来**。MF 1.0 是 webpack 5 内置的一个特性——`ModuleFederationPlugin` 把模块共享能力**编译进** webpack 的模块系统，你享受 MF 的前提是「你在用 webpack」。

2024-04-26，官方发布 [MF 2.0 公告](https://module-federation.io/blog/announcement.html)：由**字节跳动 Web Infra 团队、MF 作者 Zack Jackson、社区贡献者**共同，把 MF 从 webpack 里**fork 出来、重设计为独立项目**（新家 module-federation.io、`@module-federation/*` 系列包）。公告里这句话是全部变化的总纲：

> **「原本内嵌在 Webpack 里的运行时能力，已被抽取出来形成一个独立的 SDK。」**

一句话的架构后果：**MF 的「联邦加载 + 版本协商」不再需要 webpack 参与**。webpack（以及 Rspack）的插件从此只干一件**编译期**的事——把源码里的 `import("shop/Button")` 改写成对 runtime 的调用、并产出 manifest；**运行期真正加载模块、协商 shared 的，是那个独立 runtime**。这就是「运行时化」的实质。

## 二、Runtime SDK：脱离构建工具

运行时化的落点是 **Runtime SDK**——`@module-federation/runtime`（多数示例用增强入口 `@module-federation/enhanced/runtime`）。它可以在**没有任何构建插件**的纯运行时环境里，「动态注册和加载 remote 与 shared 模块」。最小用法四步：

```ts
// 纯运行时：不需要 webpack/Rspack 的 MF 插件也能联邦
import { createInstance } from "@module-federation/enhanced/runtime";

// ① 建一个联邦实例，声明自己是谁、初始有哪些 remote
const mf = createInstance({
  name: "mf_host", // 本宿主名
  remotes: [
    {
      name: "shop", // remote 名
      entry: "http://cdn.example.com/shop/mf-manifest.json", // 指向 remote 的结构化清单
    },
  ],
});

// ② 运行时加载 remote 暴露的模块（等价于「跨应用 import」）
const { add } = await mf.loadRemote<{ add: (a: number, b: number) => number }>("shop/util");
add(1, 2);
```

关键在于 `entry` 指向的是一张**清单**（mf-manifest.json）而非一大包代码——`loadRemote` 先读清单、再按需拉 `shop/util` 对应的 chunk。这套流程**完全活在运行时**，webpack 不在场。构建插件用法（直接写 `import("shop/util")` 交给插件改写）只是这套 runtime 的**编译期糖衣**，底层是同一个内核。

## 三、registerRemotes：把「哪些 remote」变成运行期决策

`createInstance` 的 `remotes` 是初始列表，但 remote **不必在启动时就定死**——`registerRemotes` 可以在**运行时**追加/动态注册，这是 2.0 相对 1.0 最重要的能力跃迁：

```ts
import { createInstance } from "@module-federation/enhanced/runtime";

// 初始为空，remote 列表运行时才确定
const mf = createInstance({ name: "mf_host", remotes: [] });

// 从服务端/配置中心拿到「当前该加载哪些 remote、哪个版本」后再注册
const list = await fetch("/api/active-microfrontends").then((r) => r.json());
mf.registerRemotes(
  list.map((m) => ({
    name: m.name,
    entry: m.manifestUrl, // 版本/灰度由服务端决定，前端不重构
  })),
);

// 之后按需加载
const Page = await mf.loadRemote(`${list[0].name}/Page`);
```

架构意义：**「哪些微前端在线、各用哪个版本」从构建期决策变成运行期决策**。由此解锁的能力——**灰度发布**（给部分用户注册新版 remote）、**A/B 实验**（按分流注册不同 remote）、**动态上下线**（配置中心一改，前端无需发版）——在 1.0 的「remotes 编译期写死」模型里是做不到的。这也是[联邦概念](./federation-concepts)里「运行时组合」得以成立的实现基础。

## 四、mf-manifest.json：联邦的公共协议

运行时化需要一份**机器可读的联邦契约**，这就是 **mf-manifest.json**（2.0 新增）。它比裸 `remoteEntry.js` 多带结构化元信息：

```jsonc
// mf-manifest.json（示意，真实字段更多）：一个 remote 的「自我描述」
{
  "name": "shop",
  "metaData": { "type": "app", "remoteEntry": { "name": "remoteEntry.js" } },
  "exposes": [{ "id": "shop:Button", "name": "Button", "path": "./Button" }], // 我导出了什么
  "shared": [{ "name": "react", "version": "18.3.1", "singleton": true }], // 我共享哪些依赖及版本
  "remotes": [], // 我又依赖哪些别的 remote
  "types": { "path": "@mf-types.zip" }, // 类型联邦的类型包地址
}
```

这张清单是 2.0 生态的**公共数据源**——正因为版本、导出、类型都被**结构化**地写了下来，才使这些能力成为可能：

- **版本管理与治理巡检**：`shared` 里的版本可被 CI 采集做跨 remote 一致性检查（见 [shared 版本治理](./shared-governance)）。
- **类型联邦**：`types` 指向类型包，host 拉过来获得 remote 模块的 TS 类型。
- **预加载**：清单里的 chunk 信息让 `preloadRemote` 能精准预取。
- **DevTools**：Chrome 插件读清单可视化整张联邦依赖图。

这些能力统一在 [MF 2.0 生态](./mf2-ecosystem) 展开。

## 五、运行时插件机制：可插拔的加载生命周期

MF 2.0 把「模块加载」拆成一串**生命周期钩子**，开放成 **Runtime Plugin System**——你可以写运行时插件，在加载的各阶段插入逻辑：

```ts
import { createInstance } from "@module-federation/enhanced/runtime";

const mf = createInstance({
  name: "mf_host",
  remotes: [{ name: "shop", entry: "http://cdn.example.com/shop/mf-manifest.json" }],
  plugins: [
    // 一个运行时插件 = 一组钩子
    {
      name: "resilience-plugin",
      // remote 加载失败时兜底：返回降级模块，避免整页崩
      errorLoadRemote(args) {
        console.warn(`[MF] remote ${args.id} 加载失败，降级`);
        return { default: () => null };
      },
      // 请求 remoteEntry 前可改写 URL（如按环境切 CDN、加鉴权参数）
      beforeRequest(args) {
        return args;
      },
    },
  ],
});
```

常见钩子（名称随版本演进，以官方为准）：`beforeInit` / `beforeRequest` / `afterResolve` / `onLoad` / `errorLoadRemote` 等。它把**重试、鉴权、按环境切源、降级兜底、埋点监控**这些横切关注点，从「散落在业务里」收敛成「可复用的运行时插件」。这套插件机制正是 [MF 2.0 生态](./mf2-ecosystem) 里 retry、预加载、DevTools 等能力的统一底座——它们本质都是官方或社区写的运行时插件。

## 小结

MF 2.0 的一切从「把运行时能力从 webpack 里搬出来做成独立 SDK」这一句开始。搬出来之后：`@module-federation/runtime` 让联邦**脱离构建工具**在纯运行时可用；`registerRemotes` 把「哪些 remote、哪个版本」升维成**运行期决策**（灰度/A-B/动态上下线）；**mf-manifest.json** 成为承载版本、类型、chunk 的**结构化公共协议**；**运行时插件系统**把加载生命周期开放成可插拔的钩子。构建插件没消失，但退成了「编译期织入器」，真正的主角是那个与构建工具无关的 runtime——这正是 MF 能在 2026 横跨五六种打包器的技术前提。这套运行时内核之上长出的一整圈工具，是下一页：[MF 2.0 生态](./mf2-ecosystem)。
