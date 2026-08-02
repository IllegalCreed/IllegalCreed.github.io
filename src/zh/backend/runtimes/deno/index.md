---
layout: doc
---

# Deno

**Deno** 是由 Node.js 之父 **Ryan Dahl** 于 2018 年发起、2020 年正式发布的**现代 JavaScript/TypeScript 运行时**——它是对 Node.js 设计遗憾的「反思重写」。Ryan Dahl 在 2018 年那场著名演讲《关于 Node.js 我后悔的 10 件事》里列出了 Node 的安全缺陷（默认全权限）、模块系统的历史包袱（CJS/ESM 分裂）、构建工具链的碎片化等问题，Deno 正是为解决这些而生。Deno 的核心设计是：**默认安全**（权限沙箱，无显式授权不能读写文件/联网/起子进程）、**原生 TypeScript**（无需 ts-node/tsx，直接 `deno run app.ts`）、**标准库内置**（`Deno.*` 全局 API，减少外部依赖）。Deno 2.x（2024）是其「走向主流」的关键版本——大幅强化了 **Node/npm 兼容**（约 95%，支持 `package.json`、`node_modules`、npm 包直接 import）、推出了 TypeScript-first 的 **JSR 注册表**（跨 Deno/Node/Bun 共享包），并内置了 **OpenTelemetry** 可观测性。理解 Deno，关键是理解它如何用「安全 + TS + 兼容」三张牌，在 Node.js 的生态护城河里撕开一道口子。

Deno 的全部考点围绕**现代运行时设计**展开：①**安全模型**（默认拒绝的权限沙箱，`--allow-*` 显式授权，与 Node 默认允许形成对比）——回答"如何防依赖越权"；②**兼容性**（Deno 2.x 的 Node/npm 兼容约 95%，原生支持 `package.json`/`node_modules`/npm 包）——回答"能不能跑现有 Node 项目"；③**JSR 注册表**（TypeScript-first、跨运行时的现代包注册表，对比 npm 的设计改进）——回答"包怎么分享"；④**原生 TS 与工具链**（无需配置直接跑 TS、内置格式化/lint/测试/打包、OpenTelemetry）——回答"开发体验如何"。本叶与 [Node.js](../nodejs/)、[Bun](../bun/) 构成后端运行时三角，Deno 是其中「安全与现代化」的代表。

## 评价

**优点**

- **默认安全**：权限沙箱让第三方依赖无法越权读文件/联网/起子进程，从源头缓解供应链攻击（Node 的痛点）
- **原生 TypeScript**：无需 ts-node/tsx/swc 配置，`deno run app.ts` 直接跑 TS，开发体验丝滑
- **现代化工具链内置**：格式化（`deno fmt`）、Lint（`deno lint`）、测试（`deno test`）、打包（`deno compile`/`deno bundle`）一体，减少碎片化配置
- **Deno 2.x 兼容性好**：约 95% 的 Node API 兼容，原生支持 `package.json` 与 npm 包，现有 Node 项目可渐进迁移
- **JSR 注册表**：TypeScript-first、自动生成类型声明、跨 Deno/Node/Bun，解决了 npm 的一些历史包袱

**缺点**

- **生态规模仍不及 npm**：虽能通过兼容层用 npm 包，但 JSR 原生包数量远少于 npm（300 万+），冷门库可能缺失
- **兼容层性能与边界**：约 95% 兼容意味着 5% 不兼容（Node-API 原生插件、冷门 API、依赖幽灵依赖的包可能出问题）
- **学习曲线**：权限模型对 Node 老用户是思维转变（默认拒绝 vs 默认允许），迁移需调整心智模型
- **市场份额仍小**：Node.js 仍是后端 JS 事实标准，Deno 在生产部署的招人、运维生态上仍处追赶期

## 本叶地图

- [入门](./getting-started) —— Deno 定位、2.x 兼容性、权限沙箱安全模型、原生 TS、JSR 注册表、OpenTelemetry、工具链概览
- [兼容与 JSR](./guide-line/compat-and-jsr) —— Deno 2.x 的 Node/npm 兼容（package.json/node_modules/Node-API）、JSR 注册表的设计（TS-first/跨运行时/对比 npm）、依赖管理
- [安全与 TypeScript](./guide-line/security-and-typescript) —— 权限沙箱机制（默认拒绝/--allow-* 授权/--deny-*）、原生 TS 执行原理（内置编译/无配置/类型检查）、内置工具链与 OpenTelemetry
- [参考](./reference) —— Deno 版本特性速查、权限标志清单、`Deno.*` API、Node 兼容矩阵、易错点

## 幻灯片地址

<a href="/SlideStack/deno-slide/" target="_blank">Deno</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Deno" target="_blank" rel="noopener noreferrer">Deno 测试题</a>
