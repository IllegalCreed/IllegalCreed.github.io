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
- 自定义基准/HEAD：通过环境变量 `TURBO_SCM_BASE` / `TURBO_SCM_HEAD`，例如 `TURBO_SCM_BASE=origin/develop turbo run build --affected`
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

## 缓存深入

### Cache Hash 计算

Turborepo 把以下输入合并成一个 SHA256 hash 决定缓存 key：

1. **任务源码**：`inputs` 匹配的文件内容
2. **任务依赖产物**：`dependsOn` 中上游任务的 outputs（递归）
3. **环境变量**：`env` / `globalEnv` 中声明的变量当前值
4. **任务配置本身**：`turbo.json` 中该任务的字段（dependsOn / outputs / env 列表等）
5. **Turborepo 版本**：升级 Turborepo 版本可能让全部 hash 失效
6. **包管理器锁文件**：`pnpm-lock.yaml` / `package-lock.json` 内容

```bash
# 查看任务的 hash 与 inputs
turbo run build --dry-run=json | jq '.tasks[0] | {hash, inputs}'
```

`inputs` 数组列出影响 hash 的所有文件 + 环境变量。**调试「为何缓存不命中」** 时对比两次 dry-run 的 inputs 差异。

### 本地缓存位置

```
node_modules/.cache/turbo/  ← v2 起的默认位置
```

旧版本在 `.turbo/cache/`。每个 hash 对应一个目录：

```
node_modules/.cache/turbo/
├── 5f3a1c.../  ← 一次 build 的产物快照
│   ├── outputs.tar.zst
│   └── meta.json   ← stdout/stderr / exit code / 时间戳
└── ...
```

恢复 cache 时 turborepo 解包 tar.zst 到包目录，再 replay log 到 terminal。

### Cache 调试命令

```bash
# 1. 干跑不实际执行，看任务图与 hash
turbo run build --dry-run

# 2. 跑但不缓存（强制 MISS）
turbo run build --no-cache

# 3. 跑并显示详细缓存信息
turbo run build --summarize

# 4. 只用本地缓存，不读云端
turbo run build --no-remote-cache

# 5. 清理本地缓存
rm -rf node_modules/.cache/turbo
```

### 缓存命中率监控

CI 中加：

```bash
turbo run build --summarize=.turbo-summary.json
```

输出 JSON 含 `cacheStatus`（`HIT` / `MISS` / `SKIPPED`）。结合 datadog / grafana 监控团队级缓存命中率，<70% 说明 input 配置不准（误失效太多）。

## 任务图可视化

```bash
turbo run build --graph
```

生成 GraphViz `.dot` 文件 + PNG（需装 graphviz）：

```bash
turbo run build --graph=graph.html  # 输出 HTML 可视化
turbo run build --graph=graph.png   # 输出 PNG
```

排查「任务为什么 X 先于 Y」「为什么这条 deps 链太长」时用。

## 动态过滤策略

```bash
# 1. 包名通配
turbo run build --filter="@acme/*"

# 2. 包含某包的依赖图（上游）
turbo run build --filter="...@acme/web"

# 3. 包含某包的反向依赖（下游）
turbo run build --filter="@acme/ui..."

# 4. 仅这个包（不含依赖图）
turbo run build --filter="@acme/web"

# 5. 否定（排除）
turbo run build --filter="!@acme/internal-tool"

# 6. 路径匹配
turbo run build --filter="./apps/*"

# 7. 与 git 结合：相对 main 改动的包
turbo run build --filter="...[origin/main]"

# 8. 与 git 结合：上一次 commit 改动
turbo run build --filter="...[HEAD~1]"
```

`...` 三个点的方向：

- `pkg...` 该包 + 所有 dependents（向下游）
- `...pkg` 该包 + 所有 dependencies（向上游）
- `pkg` 仅该包
- `[git-ref]` git-ref 起点的变更包

### `--filter` vs `--affected`

| 维度       | `--filter`                              | `--affected`                                 |
| ---------- | --------------------------------------- | -------------------------------------------- |
| 控制粒度   | 精确（包名/路径/git ref）              | 自动（与 main 对比）                        |
| 用途       | 本地按需跑某包 / 排除大包               | CI 默认                                      |
| 上游变更   | 需显式 `...pkg`                         | 自动包含                                     |
| Shallow clone | 不支持（需完整 history）             | 容错性更强                                   |

CI 推荐 `--affected`，本地 `--filter` 灵活。

## Monorepo 结构模式

### 标准布局

```
my-monorepo/
├── apps/
│   ├── web/                # Next.js 站点
│   ├── admin/              # 管理后台
│   └── mobile/             # React Native
├── packages/
│   ├── ui/                 # 共享组件库
│   ├── utils/              # 工具函数
│   ├── tsconfig/           # 共享 tsconfig
│   └── eslint-config/      # 共享 ESLint 配置
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

### packages 内部约定

| 类型             | 命名               | 典型 outputs              |
| ---------------- | ------------------ | ------------------------- |
| UI 组件库         | `@acme/ui`         | `dist/**`                |
| 工具函数          | `@acme/utils`      | `dist/**`                |
| 共享 TS 类型      | `@acme/types`      | `dist/**.d.ts`           |
| 共享 ESLint 配置  | `@acme/eslint-config` | -（无构建）             |
| 共享 tsconfig    | `@acme/tsconfig`   | -（仅 JSON 文件）        |
| 业务 SDK         | `@acme/sdk`        | `dist/**`                |

### apps 内部约定

- 每个 app 独立 `package.json`、可有不同 framework
- app 之间不直接 import 对方代码（违反单向依赖）
- 通过 `packages/*` 共享代码

## 与 pnpm Workspaces 集成

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "!**/test/**"
```

### Workspace Protocol

包内引用同 monorepo 中的其它包：

```json
// apps/web/package.json
{
  "dependencies": {
    "@acme/ui": "workspace:*",
    "@acme/utils": "workspace:^"
  }
}
```

`workspace:*` 在 publish 时由 pnpm 自动替换为版本号。

### 配合 Turborepo

Turborepo 读取 workspace 配置识别包关系：

```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"], // ^ 即 workspace dependencies
      "outputs": ["dist/**"]
    }
  }
}
```

`^build` 自动解析为「当前包的 `dependencies` / `devDependencies` 中 workspace: 引用的包的 build」。

## Workspaces 与 turborepo 的对比

| 维度            | pnpm Workspaces           | Turborepo                              |
| --------------- | ------------------------- | -------------------------------------- |
| 角色            | 包管理（依赖图）          | 任务编排（执行图）                    |
| 关注点          | install / publish / link  | build / test / lint 调度 + 缓存       |
| 配置文件        | `pnpm-workspace.yaml`     | `turbo.json`                           |
| 依赖            | -                         | 依赖 workspace 工具（pnpm/yarn/npm）  |

**配合使用**：pnpm 管包，turbo 跑任务。等价于 yarn workspaces + Lerna / nx 中的 nx。

## 与 Nx 对比

| 维度          | Turborepo                   | Nx                                    |
| ------------- | --------------------------- | ------------------------------------- |
| 焦点          | 任务调度 + 缓存             | 任务调度 + 缓存 + 项目生成 + 插件生态 |
| 配置          | `turbo.json` 极简           | `nx.json` + `project.json` 较复杂    |
| 学习曲线      | 低                          | 中（plugins/generators 很多）        |
| 项目生成器    | 无                          | 强（`nx generate`）                  |
| 框架感知      | 弱（依赖 framework infer）  | 强（每框架专用插件）                  |
| 远程缓存      | Vercel / 自托管             | Nx Cloud（云服务）                   |
| 适合          | Next.js + monorepo 简单结构 | 复杂企业级 monorepo（多框架混用）    |

选择建议：

- **Next.js / React + 中小 monorepo**：Turborepo（生态契合，配置简洁）
- **Angular / 多框架 / 企业级 30+ 包**：Nx（生态更完善）
- **已有 Lerna 项目**：迁 Turborepo（Lerna 已不活跃）

## 高级：自定义 Cache Provider

Turborepo 不支持插件自定义 cache provider，但可以**镜像 Vercel Remote Cache 协议**实现：

- 文件存储：S3 / MinIO / R2 / Azure Blob
- 协议：HTTP API 兼容 Vercel Remote Cache

社区方案：

| 项目                            | Stack             | 状态     |
| ------------------------------- | ----------------- | -------- |
| `ducktors/turborepo-remote-cache` | Node.js + S3 / GCS | 活跃 |
| `Tapico/tapico-turborepo-remote-cache` | Bun + various | 中等 |
| `brunojppb/turbo-cache-server`  | Node.js + S3      | 活跃     |

部署示例（ducktors）：

```bash
docker run -p 3000:3000 \
  -e STORAGE_PROVIDER=s3 \
  -e STORAGE_PATH=my-turbo-cache \
  -e S3_ACCESS_KEY=... \
  -e TURBO_TOKEN=team-token-here \
  ducktors/turborepo-remote-cache
```

客户端配置：

```bash
turbo login --manual --api=https://your-cache-server.com --token=team-token-here
```

或：

```bash
TURBO_API=https://your-cache-server.com
TURBO_TOKEN=team-token-here
turbo run build
```

::: warning 自托管的安全考量

- HMAC 签名（`remoteCache.signature: true`）防恶意 cache 注入
- TLS 必须，避免 cache 被中间人篡改
- token 轮换机制（避免 token 泄露后无法回收）
- 监控异常上传（突然 GB 级 cache 可能是问题）

:::

## 性能调优

### 并行度

```bash
turbo run build --concurrency=10   # 默认 10
turbo run build --concurrency=50%  # 按 CPU 核心比例
```

CI runner 内存有限时调低（如 4 核 8GB 用 4 而非 10）防 OOM。

### Task 拆分粒度

**过粗**：单个 `build` 包含 lint + test + compile —— 改一行 lint 触发整个流程重跑。

**过细**：拆 100 个微任务 —— 调度开销可能大于任务本身。

经验值：

- 单包内 2-5 个任务（build / test / lint / typecheck）
- 任务运行 1s 以下不值得单独缓存

### 大输出文件

任务输出 >100MB 时缓存上传/下载慢。优化：

1. 排除不必要的产物（`!dist/**/*.map` 排 sourcemap）
2. 启用 `cache: false`（如 dev 任务）
3. 分两段 build：`build:lib`（缓存）+ `build:bundle`（不缓存，依赖 build:lib）

## 故障排查清单

| 现象                        | 排查方向                                              |
| --------------------------- | ----------------------------------------------------- |
| 改代码后缓存仍 HIT          | `inputs` 漏了文件 / 配置不准                          |
| 改代码后总 MISS            | `inputs` 太宽 / 未删除 generated 文件                |
| CI 上比本地慢很多           | 是否启用 remote cache / CI runner CPU 慢            |
| `--affected` 总跑全量      | `fetch-depth` 不够 / `TURBO_SCM_BASE` 错             |
| 任务并发 race condition     | `outputs` 重叠 / 共享文件未声明 dependsOn            |
| OOM                         | `--concurrency` 太高 / 单任务内存泄漏                |
| `pkg#task` 配置不生效       | 写到了包级 turbo.json（必须根级）                    |
| `extends` 后字段被覆盖       | 数组字段用 `$TURBO_EXTENDS$` 追加而非覆盖           |
| env 改动未触发重跑           | strict 模式下未在 `env` 列表声明                     |
| watch 不重启 dev server     | 未设 `interruptible: true`                           |

## 与 Docker 集成最佳实践

### 多阶段构建

```dockerfile
# 阶段 1: 修剪
FROM node:22-alpine AS pruner
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm dlx turbo prune @acme/web --docker

# 阶段 2: 安装依赖（命中 layer cache）
FROM node:22-alpine AS installer
WORKDIR /app
RUN corepack enable
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# 阶段 3: 构建
FROM installer AS builder
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@acme/web

# 阶段 4: 运行
FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

### CI 镜像加速

GitHub Actions 中用 `docker/build-push-action` + buildx cache：

```yaml
- uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: my-repo/web:${{ github.sha }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
    build-args: |
      TURBO_TOKEN=${{ secrets.TURBO_TOKEN }}
      TURBO_TEAM=${{ vars.TURBO_TEAM }}
```

`turbo prune` 输出的 `json/` 目录变化少 → Docker layer cache 命中率高 → `pnpm install` 极少跑。

## 版本里程碑

| 版本    | 时间    | 主要变化                                                          |
| ------- | ------- | ----------------------------------------------------------------- |
| v1.0    | 2022    | 首个稳定版，`pipeline` 字段                                       |
| v1.10   | 2023    | `signature` 远程缓存签名                                          |
| v2.0    | 2024    | Rust 重写完成；`pipeline` → `tasks`；strict env 模式             |
| v2.1    | 2024    | `$TURBO_DEFAULT$` / `$TURBO_ROOT$` 占位符                        |
| v2.5    | 2025    | `--affected` 引入；Watch 模式增强                                |
| v2.9    | 2025    | Package Configurations `extends`；`$TURBO_EXTENDS$`              |
