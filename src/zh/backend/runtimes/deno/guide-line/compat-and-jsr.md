---
layout: doc
outline: [2, 3]
---

# 兼容与 JSR：Node/npm 互通与现代包注册表

> 基于 Deno 2.x（V8 + Rust）· 核于 2026-08

## 速查

- **兼容是 Deno 2.0 的核心主题**：Deno 1.x 因「不兼容 Node」被诟病生态不足；2.0 大幅强化兼容，约 95% 的 Node 项目可运行，让现有投资不浪费、迁移可渐进。
- **node: 协议开箱即用**：`import { readFile } from 'node:fs'`、`import path from 'node:path'`——Node 内置模块在 Deno 里直接可用，无需 polyfill。
- **npm: 说明符**：`import express from 'npm:express@4.18'` 直接从 npm 拉包，全局缓存（不走项目 node_modules，适合 Deno 原生项目）。
- **package.json 支持**：项目根有 `package.json` 时，Deno 自动进入 npm 兼容模式——识别 `dependencies`、`devDependencies`、`scripts`（`deno task` 跑 scripts），用 `node_modules/` 解析裸模块名。
- **node_modules 支持**：Deno 2.0 起支持本地 `node_modules`（由 `deno install` 创建），此时 Node-API 原生插件也能加载（兼容 .node 文件）。
- **Node-API（N-API）兼容**：2.0 起支持 Node-API v8+ 的原生插件，前提是项目有本地 `node_modules`（因为 .node 文件需从磁盘加载）。
- **JSR 是 TS-first 注册表**：jsr.io，包用 TS 写，发布时自动为 Node 用户生成 `.d.ts` 与 npm 兼容包——一份代码跨 Deno/Node/Bun。
- **deno.json 配置**：替代 package.json 的 Deno 原生配置（tasks/imports/lint/fmt/compilerOptions），与 package.json 可共存。
- **兼容层局限**：约 95% 兼容意味着 5% 不行——某些 Node-API 老插件、依赖幽灵依赖的包、冷门 API 仍可能失败。

## 一、Node 内置模块：node: 协议

Deno 内置了 Node 兼容层，常用 Node 内置模块直接可用：

```ts
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'node:http';
import process from 'node:process';

const data = await readFile(path.join('src', 'app.ts'), 'utf8');
```

- **覆盖范围**：`node:fs`、`node:path`、`node:http`、`node:https`、`node:crypto`、`node:stream`、`node:buffer`、`node:os`、`node:url`、`node:util`、`node:process`、`node:events` 等绝大多数内置模块。
- **全局对象**：`Buffer`、`process`、`__dirname`、`__filename`（CJS 里）等 Node 全局对象在兼容模式下可用。
- **权限仍生效**：即便用 `node:fs`，仍受 Deno 权限沙箱约束——`--allow-read` 未授权则 `readFile` 报 PermissionDenied。这是 Deno 安全模型的一致性。

## 二、npm 包：npm: 说明符与 package.json

Deno 2.0 提供两种用 npm 包的方式，适配不同场景：

```ts
// 方式一：npm: 说明符（Deno 原生项目，无 package.json）
import express from 'npm:express@4.18.2';
import lodash from 'npm:lodash@4';

const app = express();
app.listen(3000);
```

```json
// 方式二：package.json 兼容模式（迁移现有 Node 项目）
{
  "name": "my-app",
  "dependencies": {
    "express": "4.18.2",
    "zod": "3.22.4"
  },
  "scripts": {
    "start": "node app.js",
    "dev": "deno run --watch app.ts"
  }
}
```

- **npm: 说明符**：包缓存到全局（`~/.cache/deno/npm`），多个项目共享，不污染项目目录。适合 Deno 原生项目（用 deno.json）。
- **package.json 模式**：项目根有 package.json 时，Deno 用 `node_modules/` 解析裸模块名（`import express from 'express'`），与 Node 行为一致。`deno install` 创建 node_modules、`deno task start` 跑 scripts。
- **Node-API 原生插件**：仅在 package.json + 本地 node_modules 模式下支持（.node 文件需磁盘加载）。纯 npm: 说明符模式不支持原生插件。
- **版本解析**：遵循 SemVer，`npm:express@4` 取 4.x 最新，`npm:express@4.18.2` 精确。

## 三、JSR 注册表：TS-first 与跨运行时

JSR（jsr.io）是 Deno 2.0 推出的现代包注册表，针对 npm 的痛点重新设计：

```
   开发者用 TypeScript 写包
            │
   deno publish（或 jsr publish）
            │
   ┌────────┴────────┐
   │  JSR 注册表      │  存 TS 源码
   │  （jsr.io）      │
   └────────┬────────┘
            │
   ┌────────┴────────┐
   │  自动转译+生成   │  swc 编译 JS + 生成 .d.ts
   └────────┬────────┘
            │
   ┌────────┴────────┐
   │  跨运行时分发    │
   └────────┬────────┘
       ┌────┼────┐
       ▼    ▼    ▼
    Deno  Node  Bun
```

- **TS-first**：发布的是 TS 源码，不是编译后的 JS。Deno 直接吃 TS，无需额外类型声明。
- **Node 兼容**：JSR 自动为每个包生成一个 npm 兼容版本（编译的 JS + `.d.ts`），Node 用户用 `npx jsr add @scope/pkg` 或 `npm install` 装即可。
- **跨运行时**：一个 JSR 包能同时被 Deno、Node、Bun 使用——消除了「Deno 包 Node 用不了」的割裂，是新包的推荐发布方式。
- **严格模块解析**：JSR 要求显式扩展名、禁止幽灵依赖（与 npm 的扁平化副作用对比），更安全可预测。
- **scoped 包**：所有 JSR 包都是 `@scope/name` 形式（类似 npm 的 scope），命名空间清晰。

## 四、依赖管理：deno.json vs package.json

Deno 项目可用 `deno.json`（推荐）或 `package.json`（兼容），二者可共存：

```json
{
  "name": "my-app",
  "tasks": {
    "dev": "deno run --allow-all --watch main.ts",
    "test": "deno test --allow-all"
  },
  "imports": {
    "@/": "./src/",
    "express": "npm:express@4.18.2",
    "zod": "jsr:@zod/core@3"
  },
  "lint": { "rules": { "tags": ["recommended"] } },
  "fmt": { "indentWidth": 2 },
  "compilerOptions": { "strict": true }
}
```

- **imports 字段**：模块映射（import map），把裸模块名/路径别名映射到实际位置——支持 `npm:`/`jsr:` 说明符与本地路径。
- **tasks**：任务别名（替代 package.json 的 scripts），`deno task dev` 运行。
- **无 dependencies 字段**：deno.json 不像 package.json 列 dependencies——依赖在代码里直接用 `npm:`/`jsr:` 说明符声明，`deno install` 扫描代码生成锁。
- **deno.lock**：锁文件，锁定所有依赖的确切版本与完整性哈希，保证可复现（类似 package-lock.json）。

## 交互演示

本叶无专门可视化。建议实操：把一个简单 Node Express 项目用 Deno 跑——`deno run --allow-net --allow-env --allow-read npm:express@4 server.js`，观察权限提示与兼容表现。

## 下一步

兼容与生态讲完后，下一站进入[安全与 TypeScript](./security-and-typescript)——权限沙箱的完整机制（默认拒绝/授权/拒绝优先级）、原生 TS 执行原理（swc 编译/类型检查）、内置工具链与 OpenTelemetry 可观测性。
