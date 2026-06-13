---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **npm 10.x / 11.x**。本篇把「能装包」用到「会管依赖」：package.json 核心字段、四类依赖、SemVer 与范围、lockfile 与可复现、scripts 生命周期。

## 一、package.json：项目的清单

`package.json` 是项目的元数据清单，描述「这是什么包、需要什么依赖、能跑什么脚本」。最小可用形态：

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build" },
  "dependencies": { "vue": "^3.5.0" },
  "devDependencies": { "vite": "^6.0.0" }
}
```

- **`name` + `version`**：发布到 registry 时必填；不发布的应用也建议写（version 常配 `npm version` 自增）。
- **`type`**：`"module"` 让 `.js` 按 ES Module 解析，否则按 CommonJS。这是 **Node 的开关，npm 自身不用它**。
- **`scripts`**：把常用命令固化成 `npm run <name>`，团队统一入口。
- **`private: true`**：应用与 monorepo 包常加，防止 `npm publish` 误发到公共 registry。

## 二、四类依赖：分清楚才不踩坑

```json
{
  "dependencies": { "axios": "^1.7.0" },
  "devDependencies": { "vitest": "^2.0.0" },
  "peerDependencies": { "react": "^18 || ^19" },
  "optionalDependencies": { "fsevents": "^2.3.0" }
}
```

| 类型 | 语义 | 典型例子 |
|---|---|---|
| `dependencies` | 运行时必需，**会随下游安装传递** | 框架、HTTP 库、工具函数 |
| `devDependencies` | 仅开发/测试/构建期，**下游不装** | 打包器、测试框架、类型定义、lint |
| `peerDependencies` | 与宿主**共享**、由使用方提供 | 插件对 React/Vue 的要求 |
| `optionalDependencies` | 可选，**装失败不阻断** | 平台相关原生加速包 |

::: tip 一个高频判断
你写一个**库**，运行时真正会 `import` 的放 `dependencies`；只在构建/测试用到的放 `devDependencies`；要和使用方共用同一份实例（避免装多份）的放 `peerDependencies`。判断标准是「用户安装我的包后，运行时还需要它吗」。
:::

## 三、SemVer 与版本范围

版本号 `MAJOR.MINOR.PATCH` 的递增规则：

- **MAJOR**：不兼容的破坏性变更（`1.x` → `2.0.0`）
- **MINOR**：向后兼容的新功能（`1.0.0` → `1.1.0`）
- **PATCH**：向后兼容的 bug 修复（`1.0.0` → `1.0.1`）

范围符决定 npm 能自动升到哪个版本：

```jsonc
"react": "^19.0.0"   // >=19.0.0 <20.0.0（锁主版本，默认）
"react": "~19.0.0"   // >=19.0.0 <19.1.0（锁次版本）
"react": "19.0.0"    // 精确锁死
```

::: warning ^ 对 0.x 的特殊行为
`^` 锁的是**最左非零位**，所以 0.x 更保守：
- `^0.2.3` = `>=0.2.3 <0.3.0`（把 minor 当 major 看）
- `^0.0.3` = `>=0.0.3 <0.0.4`（把 patch 当 major 看）

原因：SemVer 视 0.x 为「不稳定、随时可能破坏」的阶段，故 `^` 不放行可能含破坏性变更的版本。这解释了「为什么有些 0.x 依赖明明发了新版，npm 却不帮你升」。
:::

## 四、package-lock.json：可复现的关键

只有 `package.json` 是不够的——`"^19.0.0"` 是个**范围**，不同时间安装可能解析到 19.0.0、19.1.2 等不同版本，导致「在我机器上没问题」。`package-lock.json` 锁定**精确结果**：

```jsonc
// package-lock.json（节选）
"node_modules/axios": {
  "version": "1.7.9",                                 // 精确版本
  "resolved": "https://registry.npmjs.org/axios/-/axios-1.7.9.tgz",  // 来源
  "integrity": "sha512-..."                           // 完整性哈希（防篡改）
}
```

- **`version`**：解析到的确切版本（不再是范围）。
- **`resolved`**：包的下载来源 URL（或 git SHA、本地路径）。
- **`integrity`**：SRI 哈希，安装时比对内容防篡改。

> 规则：**`package-lock.json` 必须提交**。它让团队、CI、部署装出**完全一致**的依赖树。`node_modules` 则永远不提交——可由 `package.json` + lockfile 重建。

## 五、install vs ci：什么时候用哪个

```bash
npm install   # 开发：可更新 lockfile，灵活
npm ci        # CI/部署：冻结、干净、可复现
```

- 本地开发、新增依赖 → `npm install`（会按需更新 lockfile）。
- CI 流水线、生产部署 → `npm ci`：要求 lockfile 存在、先删 `node_modules`、lockfile 与 package.json 不一致即报错、**绝不写 lockfile**。

> 一句话记法：**install 会改 lockfile，ci 只读 lockfile**。要稳定可复现就用 ci。

## 六、scripts 与 pre/post 钩子

```json
{
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "vite build",
    "postbuild": "echo done"
  }
}
```

运行 `npm run build`，npm 自动按 **`prebuild` → `build` → `postbuild`** 执行——这是「pre/post 自动包裹」约定，对**任意**脚本名都生效（也包括 `prestart`/`poststart`、`pretest`/`posttest`）。

> 脚本运行时，`node_modules/.bin` 会被加进 `PATH`，所以能直接写 `vite`、`vitest` 而不必 `./node_modules/.bin/vite`。npm 还注入 `npm_package_*`（如 `npm_package_version`）、`npm_lifecycle_event`（当前脚本名）等环境变量。

---

进入 [指南 · 进阶](./advanced)：peerDependencies 演变与 ERESOLVE、node_modules 扁平化与幽灵依赖、workspaces、overrides、registry 与 .npmrc。
