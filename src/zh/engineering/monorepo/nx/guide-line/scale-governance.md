---
layout: doc
outline: [2, 3]
---

# 规模化与治理

> 基于 Nx（20/21.x）· 核于 2026-07

## 速查

- **`nx affected -t test`**：按 Git 变更算出最小项目集再等价 `run-many`；会分析**改动性质**（如只改 `package.json` 里 Next.js 版本，则只重测相关 app）
- **指定范围**：`--base=origin/main --head=HEAD`、`--files=...`；默认基线 `defaultBase`（`nx.json`，默认 `main`）
- **module boundaries**：`@nx/enforce-module-boundaries` ESLint 规则 + 项目 `tags` + `depConstraints`
- **约束写法**：`sourceTag` + `onlyDependOnLibsWithTags`；**无 tag 的项目不能依赖任何项目**
- **tag 格式**：`*`（全部）、精确串、正则 `/^scope.*/`、glob `scope:*`
- **公共 API**：每个项目用 `index.ts` 暴露；跨项目深引用内部文件会被 lint 拦下
- **`nx release`**：三段式 **versioning → changelog → publishing**；强烈建议先 `--dry-run`，**首次**加 `--first-release`
- **release 配置**在 `nx.json` 的 `release`：`projects`、`projectsRelationship`（`fixed`/`independent`）、`releaseTagPattern`、`version`、`changelog`、`git`
- **约定式提交**：`release.version.conventionalCommits: true` 自动定版
- **Nx 21 release 破坏性变更**：版本逻辑重写（VersionActions），`generatorOptions` 上提到顶层、`packageRoot`→`manifestRootsToUpdate`；可临时 `release.version.useLegacyVersioning: true`（v22 移除）
- **`nx migrate latest`**：升级依赖 + 生成 `migrations.json`；再 `nx migrate --run-migrations` 跑代码/配置迁移
- **保持同版本**：`nx` 与 `@nx/*` 必须同版本；加插件用 `nx add`

## affected：只做必要的工作

仓库一大，「每次全量重测」就太慢。`nx affected` 通过代码变更分析，得到「本次改动可能影响的最小项目集」，再对该集合执行 `run-many`。

工作原理：`nx affected -t test` 会看 PR 改了哪些文件、**改动的性质**，据此算出受影响项目。例如改了 `lib`，Nx 发现 `app1`/`app2` 依赖它，就等价于 `nx run-many -t test -p app1 app2 lib`；而如果只是在 `package.json` 里改了 Next.js 版本，Nx 知道 `app2` 不受影响，就只重测 `app1`。

指定比较范围：

```bash
# 默认相对 defaultBase（通常 main）
nx affected -t lint test build

# 显式指定 base/head（CI 中常见）
nx affected -t test --base=origin/main --head=HEAD

# 指定「假设这些文件变了」
nx affected -t build --files=libs/ui/src/index.ts
```

`defaultBase` 在 `nx.json` 里设置（默认 `main`）。CI 中，`affected` + 远程缓存 + 分布式三者叠加才是压低 CI 时间的关键，见 [Nx Cloud 与分布式 CI](./nx-cloud.md)。

## module boundaries：架构约束落地

项目一多，若彼此可随意依赖，仓库很快失控。Nx 用**代码分析 + 声明式约束**保证项目只能依赖别人的**公共 API**，并限制「谁能依赖谁」。

**公共 API**：每个项目在 `index.ts`（或 `index.js`）暴露对外接口。别的项目若深引用某项目内部文件，`@nx/enforce-module-boundaries` 规则会在 lint 时报错。

安装依赖：

```bash
nx add @nx/eslint-plugin @nx/devkit
```

**第一步：给项目打 tag**（写在 `project.json` 或 `package.json` 的 `nx.tags`）：

```json
{
  "name": "client",
  "nx": {
    "tags": ["scope:client"]
  }
}
```

**第二步：在根 ESLint 配置里写约束**（flat config 用 `@nx/enforce-module-boundaries` 规则的 `depConstraints`）：

```js
// eslint.config.mjs
import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          allow: [],
          depConstraints: [
            { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
            { sourceTag: 'scope:admin', onlyDependOnLibsWithTags: ['scope:shared', 'scope:admin'] },
            { sourceTag: 'scope:client', onlyDependOnLibsWithTags: ['scope:shared', 'scope:client'] },
            { sourceTag: 'type:app', onlyDependOnLibsWithTags: ['type:feature', 'type:ui', 'type:util'] },
            { sourceTag: 'type:feature', onlyDependOnLibsWithTags: ['type:ui', 'type:util'] },
            { sourceTag: 'type:util', onlyDependOnLibsWithTags: ['type:util'] }
          ]
        }
      ]
    }
  }
];
```

于是 `scope:client` 只能依赖 `scope:client`/`scope:shared`，与 `scope:admin` 互不可依赖；常见做法是**双维度打 tag**（`scope:*` 管归属、`type:*` 管层次）。

**tag 格式**：

- `*`：允许全部（`{ "sourceTag": "*", "onlyDependOnLibsWithTags": ["*"] }`）
- 精确串：如 `scope:client` 只能依赖 `scope:util`
- 正则：`"/^scope.*/"`
- glob：`"scope:*"`（只支持基本 `*`，复杂场景用正则）

**重要**：没有任何 tag 的项目**不能依赖任何项目**（除非显式用 `*` 放开）。

## nx release：版本、changelog、发布

`nx release` 把发布拆成三段，既可一条命令跑完，也可分段定制：

1. **Versioning（定版）**：确定各项目下一个版本号，并更新依赖方引用。
2. **Changelog（变更日志）**：从提交信息或 version plan 文件推导 changelog。
3. **Publishing（发布）**：发到 registry（npm / crates.io / Docker registry 等）。

```bash
# 强烈建议先 dry-run（发布难以撤销）
nx release --dry-run

# 首次发布：没有历史可比，需加 --first-release
nx release --first-release --dry-run
```

不带参数时 `nx release` 会提示你选版本关键字（major/minor/patch）或输入自定义版本，然后依次跑三段。配置写在 `nx.json` 的 `release`：

```json
{
  "release": {
    "projects": ["packages/*"],
    "projectsRelationship": "independent",
    "releaseTagPattern": "{projectName}@{version}",
    "version": {
      "conventionalCommits": true
    },
    "changelog": {
      "workspaceChangelog": { "createRelease": "github" },
      "projectChangelogs": true
    },
    "git": { "commit": true, "tag": true }
  }
}
```

- **`projectsRelationship`**：默认 `fixed`（所有项目锁步同版本），设 `independent` 则各自独立发版。
- **`releaseTagPattern`**：tag 模板，支持 `{version}`、`{projectName}`、`{releaseGroupName}`；fixed 默认 `v{version}`，independent 默认 `{projectName}@{version}`。
- **约定式提交**：`version.conventionalCommits: true` 依据 commit 类型自动定版。
- **编程式 API**：`import { releaseVersion, releaseChangelog, releasePublish } from 'nx/release'` 可组合出自定义发布流程。

::: warning Nx 21 的 release 破坏性变更
Nx 21 重写了版本逻辑（由 `VersionActions` 驱动，`@nx/js` 提供默认实现）：`release.version.generatorOptions` 被移除、其属性上提到 `release.version` 顶层；`packageRoot` 由更灵活的 `manifestRootsToUpdate` 取代；生态专属选项（如 `skipLockFileUpdate`）移入 `versionActionsOptions`；`preserveLocalDependencyProtocols` 默认变为 `true`。`nx migrate` 会自动迁移配置；过渡期可临时设 `release.version.useLegacyVersioning: true`，但该开关将在 **v22 移除**。
:::

## nx migrate：自动升级

`nx migrate` 让升级 Nx/插件不再痛苦，它能：更新 `package.json` 依赖、迁移配置文件（Jest/ESLint/Nx 配置）、按插件提供的迁移脚本**改动源码**以适配 breaking change。三步走：

```bash
# 第 1 步：更新 package.json 并生成 migrations.json（此时未安装、未改其它文件）
nx migrate latest          # 或 nx migrate nx@<version> 指定版本

# 检查 package.json 与 migrations.json 是否合理，可手动微调

# 第 2 步：执行代码/配置迁移（改动保持 unstaged，供你 review）
nx migrate --run-migrations

# 第 3 步：清理 migrations.json 并提交
```

要点：

- `migrations.json` 可保留到「所有旧分支合并完」，让同事合并后也能 `nx migrate --run-migrations` 应用同一批迁移。
- `--interactive` 可挑选接受哪些迁移（工作区尚未就绪时临时跳过某些）。
- 社区插件需单独迁移（若其提供迁移脚本）。
- 运行 `nx migrate` 时 `nx` 与所有 `@nx/*` 会被更新到**同一版本**——保持同版本至关重要；新增插件用 `nx add <plugin>` 自动匹配版本。
