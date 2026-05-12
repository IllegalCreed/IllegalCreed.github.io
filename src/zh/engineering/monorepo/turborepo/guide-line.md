---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Turborepo v2.9.x 编写

## 速查

- 仅运行受影响的包：`turbo run build --affected`
- 进阶过滤：`--filter=...[origin/main]` / `--filter=[HEAD^1]`
- 环境变量声明：`globalEnv` / `env` / `passThroughEnv`
- 默认 env 模式：**strict**（v2 起），未声明的变量在任务中**不可见**
- watch 模式：`turbo watch dev`，配合 `interruptible: true`
- 远程缓存：`turbo login` + `turbo link`；签名 `remoteCache.signature: true`
- 部署修剪：`turbo prune <app>`（产出"部分 monorepo"，配合 Docker 用 `--docker`）
- v1 → v2：`pnpm dlx @turbo/codemod migrate`

## 任务配置进阶

### `dependsOn` 全语法

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "deploy": {
      "dependsOn": ["@acme/web#build"]
    },
    "lint": {
      "dependsOn": []
    }
  }
}
```

| 语法            | 含义                                                 |
| --------------- | ---------------------------------------------------- |
| `^build`        | 上游（dependencies 中的内部包）的 `build` 先跑       |
| `build`         | 同一个包的 `build` 先跑（用于本包内串接任务）        |
| `@acme/web#build` | 特定包的特定任务（仅可写在根 `turbo.json`）           |
| `[]`            | 无依赖；可与"上游"完全并行                          |

### Transit Node（并行 + 正确缓存失效）

某些任务（如 `lint` / `check-types`）**不需要上游 build 产物**，但应该在**上游源码变化时**重新跑。直接 `dependsOn: []` 会让缓存失效失灵；`dependsOn: ["^lint"]` 又强制串行。解法是引入一个"过路"任务：

```json
{
  "tasks": {
    "transit": { "dependsOn": ["^transit"] },
    "lint": { "dependsOn": ["transit"] },
    "check-types": { "dependsOn": ["transit"] }
  }
}
```

`transit` 不映射到任何脚本，只在依赖图中起结构作用，使下游任务能"并行执行 + 正确感知上游源码变化"。

### `inputs` / `outputs` / `$TURBO_DEFAULT$`

- **默认 `inputs`**：包内所有 Git 跟踪的文件
- **声明 `inputs`** 后会**完全替换**默认行为；如需在默认基础上追加，使用 `$TURBO_DEFAULT$`：

```json
{
  "tasks": {
    "build": {
      "inputs": ["$TURBO_DEFAULT$", ".env*", "$TURBO_ROOT$/shared.config.ts"],
      "outputs": ["dist/**"]
    }
  }
}
```

- **`$TURBO_ROOT$`**：在 glob 起始位置使用，可让该 glob 相对 repo 根目录而非包目录解析；**推荐用它替代 `../` 这类相对路径**，使跨包引用的输入/输出 glob 行为可预测
- **未声明 `outputs`**：任务不会缓存任何产物（只缓存 log），改完代码再跑时不会"复用产物"

::: tip 常见 `outputs`

- Next.js: `[".next/**", "!.next/cache/**"]`
- Vite / Rollup / tsdown: `["dist/**"]`
- `tsc --noEmit` 开了 `incremental: true`: 缓存 `.tsbuildinfo`，注意把它放在 `outputs` 里

:::

### 环境变量

```json
{
  "globalEnv": ["NODE_ENV"],
  "tasks": {
    "build": {
      "env": ["API_URL", "DATABASE_URL"],
      "passThroughEnv": ["GITHUB_TOKEN"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**"]
    }
  }
}
```

::: tip **`.env` 文件如何参与哈希**

Turborepo **不会**自动加载 `.env` 文件到任务运行时（运行时加载由框架负责），但可以让它的**变化触发缓存失效**：

- 放进 `inputs`（任务级，推荐）：仅影响当前任务，例如 `"inputs": ["$TURBO_DEFAULT$", ".env*"]`
- 放进 `globalDependencies`（全局）：影响**所有**任务哈希，慎用

两者**二选一**，不要重复声明。

:::

| 字段             | 行为                                                   |
| ---------------- | ------------------------------------------------------ |
| `env`            | 进入任务 hash，且任务能读到                            |
| `globalEnv`      | 影响所有任务 hash，且所有任务能读到                    |
| `passThroughEnv` | 任务能读到，**但不进入 hash**（典型：CI token）        |
| `inputs` + `.env*` | 让 `.env` 文件内容变更也能触发缓存失效               |

支持通配符：`"MY_API_*"`。框架前缀（如 `NEXT_PUBLIC_*` / `VITE_*` / `REACT_APP_*`）会被 framework inference 自动包含。

::: warning **Strict 模式（v2 默认）**

未在 `env` 中声明的变量在任务里**不可见**。这是 v2 最常踩坑的破坏性变更之一，CI 上排错时优先检查。

:::

### Package Configurations（包级 `turbo.json`）

当某个包需要不同于全局的任务配置，应在**包内**放一份 `turbo.json` 而不是污染根配置：

```json
// packages/web/turbo.json
{
  "extends": ["//"],
  "tasks": {
    "test": {
      "outputs": ["coverage/**"]
    },
    "build": {
      "env": ["NEXT_PUBLIC_FOO"]
    }
  }
}
```

要点：

- 若需要继承根配置，**`extends` 数组必须以 `"//"` 起始**；当前只支持继承根，**不能继承其他包的配置**
- 标量字段（`cache` / `persistent` / `outputLogs`）继承后被覆盖
- 数组字段（`dependsOn` / `env` / `inputs` / `outputs` / `passThroughEnv` / `with` 共 6 个）默认**整体替换**；要"追加"用 `$TURBO_EXTENDS$`，且**它必须是数组首元素**：

```json
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "env": ["$TURBO_EXTENDS$", "NEXT_PUBLIC_FOO"]
    }
  }
}
```

- 包级 `turbo.json` **不能覆盖** `globalEnv` / `globalDependencies`
- `pkg#task` 写法（如 `"@acme/web#build"`）**只能写在根 `turbo.json`**，两种用法：① 作为 root tasks 的 key 给特定包做差异化配置；② 在 `dependsOn` 中指向特定包的特定任务

## `--affected`：CI 必杀技

```bash
turbo run build test --affected
```

- 默认等价于 `--filter=...[main...HEAD]`，即与 `main` 分支对比，仅跑变更包及其 dependents
- 自定义对比基准：`--affected --affected-base=origin/develop`
- 老式 `--filter=...[origin/main]` 也可用；`--affected` 经验上在 shallow clone / 缺少 base 时处理更友好

## Remote Cache

```bash
turbo login                     # 默认连 Vercel Remote Cache
turbo link                      # 把当前 monorepo 关联到团队
turbo run build                 # 第一次：MISS，上传到云
rm -rf .turbo/cache && turbo run build  # 仍 hit（来自云端）
```

CI 中通过环境变量启用：

```bash
TURBO_TOKEN=...
TURBO_TEAM=your-team-slug
```

### 自托管

```bash
turbo login --manual            # 指定自定义 API URL、team、token
```

可选签名验证：

```json
// turbo.json
{
  "remoteCache": {
    "signature": true
  }
}
```

需要在 `TURBO_REMOTE_CACHE_SIGNATURE_KEY` 中提供 HMAC-SHA256 密钥。文档另列举了若干**社区（非官方）实现**：`brunojppb/turbo-cache-server`、`ducktors/turborepo-remote-cache`、`Tapico/tapico-turborepo-remote-cache` 等 —— 部署前建议自行评估活跃度与安全性。

## Watch 模式

```bash
turbo watch dev
```

- 监听代码变化，按依赖图重跑任务
- `persistent: true` 的任务（如 dev server）**不会**被重跑；要在依赖变化时重启，需要 `interruptible: true`
- 默认按"包级"判断变化；若想细到任务级，开启 `futureFlags.watchUsingTaskInputs`（`futureFlags.*` 仍是预览开关，未来版本可能调整）

典型组合：

```json
// 根 turbo.json
{
  "tasks": {
    "dev": {
      "dependsOn": ["^dev"],
      "cache": false,
      "persistent": false
    }
  }
}

// apps/web/turbo.json
{
  "extends": ["//"],
  "tasks": {
    "dev": {
      "persistent": true,
      "interruptible": true
    }
  }
}
```

包提供"一次性"的 `dev`（如 `tsc` 重新生成类型），app 提供长期运行的 dev server，整体由 `turbo watch dev` 编排。

## CI 实践

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0           # --affected 需要历史
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run build test lint --affected
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ vars.TURBO_TEAM }}
```

要点：

- **始终用 `turbo run <task>`**，不要在 CI yml 中写 `turbo build`
- `--affected` 配合 `fetch-depth: 0` 才能正确判断基准
- 在仓库 `package.json` 中固定 turbo 主版本，避免全局 `turbo` 漂移

## 部署修剪：`turbo prune`

为某个 app 生成只含必要包的"部分 monorepo"：

```bash
turbo prune @acme/web --docker
```

`--docker` 模式输出：

```
out/
├── json/                  # 仅 package.json（用于 docker COPY 后跑 install，命中 layer 缓存）
├── full/                  # 完整源码
└── pnpm-lock.yaml         # 修剪过的 lockfile
```

典型 Dockerfile：

```dockerfile
FROM node:22 AS pruner
WORKDIR /app
COPY . .
RUN pnpm dlx turbo prune @acme/web --docker

FROM node:22 AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@acme/web

FROM node:22-slim AS runner
COPY --from=installer /app/apps/web/.next /app/apps/web/.next
# ...
```

## v1 → v2 升级要点

```bash
pnpm dlx @turbo/codemod migrate
# 也可显式指定目标版本：pnpm dlx @turbo/codemod migrate 2.0.0
```

不带版本参数时命令会**交互式询问**目标版本。会自动处理：

1. **`pipeline` 改名 `tasks`**：schema URL 升级到 `schema.v2.json`
2. **Strict 模式成为默认**：未在 `env` / `globalEnv` 中声明的变量在任务里不可见
3. **根目录被所有包隐式依赖**：根改动会影响所有任务 hash
4. **`--ignore` 移除**：改用 `--filter` 否定模式（如 `--filter=!web`）
5. **`--scope` 已完全移除**（v1.2 起 deprecated，v2 删除）：用 `--filter` 替代
6. **`--filter` 不再推断 package 命名空间**，无匹配时直接报错
7. **`--only` 行为改变**：现在限制任务依赖图，而非包依赖图
8. **根 `package.json` 的 `packageManager` 字段成为必填**
9. **根 `package.json` 的 `engines` 字段进入哈希计算**

迁移后建议同步做的事：

- 根 `package.json` 加 `"packageManager": "pnpm@x.y.z"` 字段
- 升级 `eslint-config-turbo`
- 把 CI 与 `package.json` 中的 `turbo` 简写改成 `turbo run`

## 常见反模式速查

| 反模式                                                | 正确做法                                       |
| ----------------------------------------------------- | ---------------------------------------------- |
| 根 `package.json` 直接拼任务（`cd app && build`）     | 一律 `turbo run xxx` 委派                      |
| `prebuild` 手工 build 上游包                          | 加 workspace 依赖 + `dependsOn: ["^build"]`    |
| 一个 root `.env` 共享给所有包                         | 每个需要的包各自放 `.env`，用 `globalEnv` 显式 |
| 用 `../` 引用其他包源文件                             | 用 `$TURBO_ROOT$` 或正经的 workspace 依赖      |
| `--parallel` 强行并行                                 | 用 Transit Node 重写 `dependsOn`               |
| 大量 `pkg#task` 写在根 `turbo.json`                   | 移到 Package Configurations                    |
| 在 CI yml 写 `turbo build`                            | 改为 `turbo run build`                         |
| 任务产物文件，没声明 `outputs`                        | 补 `outputs: ["dist/**"]` 等                   |
| `env` 缺失关键变量导致缓存命中错产物                  | 把所有影响产物的变量加进 `env` / `globalEnv`   |
