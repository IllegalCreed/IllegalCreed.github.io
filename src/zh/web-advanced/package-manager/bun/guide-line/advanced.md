---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **Bun 1.2+**。把 Bun 包管理器用进真实项目：`--filter` 跨工作区、catalog 版本目录、私有 registry/`.npmrc`、overrides/resolutions、`--production`/`--frozen-lockfile` 实战、CI。

## 一、`--filter`：跨工作区跑脚本

monorepo 里最常用的能力。`--filter` 支持按**包名 / glob / 路径**筛选：

```bash
# 在所有工作区并行跑 dev（带可视化终端 UI）
bun run --filter '*' dev

# 只在名字匹配 pkg* 的包跑 build
bun run --filter 'pkg*' build

# 按路径筛选
bun run --filter './packages/**' test

# 排除某个包
bun run --filter '*' --filter '!pkg-c' build
```

::: tip 拓扑序构建
对构建脚本，Bun 会做**拓扑排序**——被依赖的包先构建，再构建依赖它的包。配 `--if-present` 可跳过没有该脚本的工作区。
:::

`--filter` 也用于安装与查询：

```bash
bun install --filter './packages/pkg-a'   # 只为该工作区装依赖
bun outdated --filter 'pkg-*'             # 只看这些工作区的可升级项
```

## 二、catalog：集中管理版本

monorepo 里多个子包都依赖 `react`，逐个写版本容易漂移。Bun 支持 **catalog / catalogs**（思路同 pnpm）：

```jsonc
// 根 package.json
{
  "workspaces": {
    "packages": ["packages/*"],
    "catalog": {
      "react": "^19.0.0",
      "react-dom": "^19.0.0"
    },
    "catalogs": {
      "build": { "vite": "^7.0.0" }
    }
  }
}
```

子包用 `catalog:` 协议引用：

```jsonc
// packages/app/package.json
{
  "dependencies": {
    "react": "catalog:",          // 用默认 catalog 的版本
    "vite": "catalog:build"       // 用名为 build 的 catalog
  }
}
```

> 收益：版本**一处定义、多处复用**，升级只改根目录一处。从 pnpm 迁移时，`pnpm-workspace.yaml` 里的 catalog 会被自动迁进根 `package.json`。

## 三、overrides / resolutions：钉死元依赖

要强制某个**依赖的依赖**（metadependency）用特定版本（修漏洞 / 解冲突）：

```jsonc
// package.json —— 兼容 npm 的 overrides
{
  "overrides": { "semver": "~7.6.0" }
}
```

Bun 同时兼容 Yarn 的 `resolutions` 字段。注意：`overrides` 管的是**传递依赖**版本，与 catalog（管工作区共享的**直接**依赖版本）是两个维度。

## 四、私有 registry 与 .npmrc

Bun 兼容读取 `.npmrc`，也可在 `bunfig.toml` 配置。让 `@myorg` 作用域走公司源并带 token：

```toml
# bunfig.toml
[install]
registry = "https://registry.npmjs.org"   # 默认源

[install.scopes]
myorg = { token = "$npm_token", url = "https://registry.myorg.com/" }
```

或用既有的 `.npmrc`（无需改写）：

```ini
# .npmrc
@myorg:registry=https://registry.myorg.com/
//registry.myorg.com/:_authToken=${NPM_TOKEN}
```

> 也可用环境变量 `BUN_CONFIG_REGISTRY` 临时覆盖默认源；命令行 `--registry` 优先级最高，会盖过 `.npmrc`/`bunfig.toml`/环境变量。

## 五、生产安装与可复现

```bash
# 生产部署：不装 dev/optional 依赖
bun install --production

# 更细粒度按类型排除
bun install --omit=dev --omit=peer --omit=optional

# 可复现：严格按 bun.lock 装精确版本，不一致即报错
bun install --frozen-lockfile
```

也可写进配置：

```toml
[install]
production = true
frozenLockfile = true
```

## 六、CI 实战

```yaml
# .github/workflows/ci.yml
name: ci
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun ci                 # = install --frozen-lockfile，锁文件不一致即失败
      - run: bun run --filter '*' build
```

要点：

- **必须提交 `bun.lock`**，否则 `bun ci` 无依据。
- `bun ci` 对位 `npm ci`，保证 CI 与本地装的是同一套版本。
- CI 缓存 `~/.bun/install/cache` 可进一步加速。

## 七、从 npm / pnpm / yarn 迁移

Bun 会在 `bun.lock` **缺失**时自动迁移锁文件：

| 来源 | 行为 |
|---|---|
| `package-lock.json`（npm） | 自动迁移为 `bun.lock` |
| `yarn.lock`（v1） | 自动迁移为 `bun.lock` |
| `pnpm-lock.yaml`（需 v7+） | 自动迁移，并把 `pnpm-workspace.yaml` 的 packages/catalog 迁进根 `package.json` |

```bash
bun install        # 检测到旧锁文件且无 bun.lock → 自动迁移，原文件保留
bun pm migrate     # 只迁移锁文件、不安装
```

> 迁移会**尽量保留**原锁定的版本与依赖关系，不会全部升到最新。核对无误后即可删除旧锁文件。

---

进入 [指南 · 专家](./expert)：`bun.lock` 文本化原理与 `bun.lockb` 升级、isolated 内部结构、`minimumReleaseAge` 供应链防护、`bun patch`、跨平台锁文件。
