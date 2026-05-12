---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Turborepo v2.9.x 编写

## 速查

- 脚手架：`pnpm dlx create-turbo@latest`
- 安装：`pnpm add -Dw turbo`（已有项目，根目录安装）
- 配置文件：`turbo.json`（v2 已用 `tasks` 取代 v1 的 `pipeline`）
- 运行任务：`pnpm turbo run build`
- 只跑受影响包：`pnpm turbo run build --affected`
- 仅跑某些包：`--filter=@acme/web`、`--filter=./apps/*`、`--filter=...ui`、`--filter=web...`
- 关闭缓存：任务级 `"cache": false`；CLI 强制重跑用 `--force`；按端禁用用 `--cache=local:,remote:`（空字符串=禁用该端，`rw` / `r` / 空三选一）
- 本地缓存目录：`.turbo/cache`（可通过 `cacheDir` 自定义）

## 安装

新仓库直接用脚手架：

```bash
pnpm dlx create-turbo@latest
```

已有 monorepo 在根目录安装：

```bash
pnpm add -Dw turbo
```

::: tip 双重安装策略

官方推荐"全局 + 项目级"组合：

- **全局**：方便日常 `turbo build`、`turbo gen`、`turbo bin` 等命令
- **项目级**：在 `package.json` 中固定版本，确保团队和 CI 使用同一版本

CI 中若读取了全局 turbo，应同步在仓库内固定版本，避免全局版本漂移。

:::

## 仓库结构

Turborepo 期望一个标准 workspace 结构：

```
my-monorepo/
├── apps/                  # 应用（Next.js、Vite、CLI 等）
│   ├── web/
│   └── api/
├── packages/              # 内部包（组件库、工具库、配置）
│   ├── ui/
│   └── utils/
├── package.json           # 根：private + scripts + devDeps + packageManager
├── pnpm-workspace.yaml    # pnpm 用（npm/yarn/bun 用 package.json 的 workspaces 字段）
└── turbo.json             # Turborepo 配置入口
```

::: warning **不支持递归型 workspace glob**

`apps/**`、`packages/**` 这类**递归 glob** 容易产生包嵌套包（"父包里又有 `package.json`"）的歧义场景，官方明确不支持。需要分组时可以并列写多个**单层** glob，如 `packages/*` + `packages/group/*`，只要中间路径里没有 `package.json` 就 OK。

:::

## 第一个 `turbo.json`

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

字段含义：

- **`tasks.<name>`**：声明一个可被 `turbo run <name>` 调用的任务，前提是各包 `package.json` 的 `scripts` 中有同名脚本
- **`dependsOn: ["^build"]`**：上游依赖包（在 `dependencies` 中声明的内部包）的 `build` 先跑完
- **`dependsOn: ["build"]`**（无 `^`）：同一个包内的 `build` 先跑完
- **`outputs`**：任务产生的文件路径，会被缓存；未声明则**不缓存任何文件**
- **`persistent: true`**：标记为长期运行任务（如 `dev` server），不会被 turbo 当作"等待完成"
- **`cache: false`**：禁用缓存（dev / watch 类任务必须）

## 第一个任务

在各包 `package.json` 中写脚本：

```json
// apps/web/package.json
{
  "scripts": {
    "build": "next build",
    "lint": "eslint .",
    "test": "vitest"
  }
}
```

根 `package.json` 只做"委派"，不要直接拼任务：

```json
// 根 package.json
{
  "scripts": {
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "dev": "turbo run dev"
  }
}
```

::: danger **不要在根 `package.json` 写任务实现**

像 `"build": "cd apps/web && next build && cd ../api && tsc"` 这种写法会**完全绕过 Turborepo**，丧失并行 + 缓存。永远让根脚本只调 `turbo run`。

:::

## 运行任务

```bash
# 跑所有包的 build
pnpm turbo run build

# 仅跑某个包
pnpm turbo run build --filter=@acme/web

# 跑 web 及其所有 dependencies
pnpm turbo run build --filter=web...

# 跑 ui 及所有依赖 ui 的包（dependents）
pnpm turbo run build --filter=...ui

# 仅跑本分支变更影响到的包
pnpm turbo run build --affected
```

::: tip **`turbo` 与 `turbo run` 的区别**

- 两者等价，`turbo build` 是 `turbo run build` 的简写
- 终端临时命令用简写更顺手；**写入 `package.json` 脚本和 CI 配置时建议显式使用 `turbo run`**，避免任务名与未来新增子命令冲突的风险

:::

## 缓存初体验

```bash
pnpm turbo run build       # 第一次：FULL CACHE MISS
pnpm turbo run build       # 第二次：FULL TURBO（直接复用缓存）
```

清缓存验证：

```bash
rm -rf .turbo/cache
pnpm turbo run build       # 再次 MISS，证明刚才确实命中了
```

缓存键由两部分哈希组成：

| 哈希 | 输入                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------- |
| 全局 | task 定义、根 lockfile、根 `package.json` 的 `engines` 字段（v2 起）、`globalDependencies`、`globalEnv`、行为相关 flags（如 `--env-mode`） |
| 包级 | 包配置、包级源码（受 `inputs` 控制）、`package.json`、声明的 `env` 变量、依赖包的输出哈希      |

任一项变化即 MISS。任务日志会被捕获并在缓存命中时回放，所以"看到的输出"始终一致。

## 与包管理器配合

Turborepo 自己**不安装依赖**，需要依赖包管理器的 workspace 能力：

- **pnpm**：根目录 `pnpm-workspace.yaml` 声明 `packages: [apps/*, packages/*]`
- **npm / yarn / bun**：根 `package.json` 加 `"workspaces": ["apps/*", "packages/*"]`

包之间用 `workspace:*` (pnpm/yarn/bun) 或本地 path 引用：

```json
// apps/web/package.json
{
  "dependencies": {
    "@acme/ui": "workspace:*",
    "@acme/utils": "workspace:*"
  }
}
```

只有声明了 workspace 依赖，`dependsOn: ["^build"]` 才能识别出"该先 build 谁"。

::: warning **prebuild / postbuild 反模式**

如果某个 app 用 `"prebuild": "cd ../../packages/ui && pnpm build"` 手工触发上游构建，说明：

1. 应该把 `@acme/ui` 加到 `dependencies` 里
2. 让 `dependsOn: ["^build"]` 接管编排
3. 删掉 `prebuild`

否则缓存与并行都会失效。

:::
