---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **pnpm 11.x**。本篇聚焦 monorepo 与工程化：`pnpm-workspace.yaml`、`workspace:` 协议、`--filter` 选择性执行、catalog 版本目录、CI 与 `--frozen-lockfile`、依赖治理（`overrides`/`peerDependencyRules`/`packageExtensions`）。

## 一、定义 monorepo：pnpm-workspace.yaml

pnpm 的工作区成员写在**独立的** `pnpm-workspace.yaml`（不是 `package.json`）：

```yaml
# pnpm-workspace.yaml（项目根）
packages:
  - "packages/*" # packages 下每个直接子目录
  - "apps/*" # apps 下每个直接子目录
  - "!**/test/**" # 排除 test 目录
```

根包始终包含在工作区内。配好后在根目录 `pnpm install`，所有成员一次性安装、共享单一根 `pnpm-lock.yaml`。

> 共享单锁文件（`sharedWorkspaceLockfile`，默认 `true`）让**整个工作区每个依赖成为单例**、版本解析一致，安装更快、便于整体去重——「every dependency is a singleton」。

## 二、引用本地包：workspace: 协议

子包之间互相依赖，用 `workspace:` 协议显式声明：

```json
// packages/web/package.json
{
  "dependencies": {
    "@org/utils": "workspace:*"
  }
}
```

官方：「When this protocol is used, pnpm will refuse to resolve to anything other than a local workspace package.」——**强制**用本地包，绝不去 registry 拉同名包。

发布时自动替换为真实版本（设所有包当前 `1.5.0`）：

| 声明 | 发布后 |
|---|---|
| `workspace:*` | `1.5.0` |
| `workspace:~` | `~1.5.0` |
| `workspace:^` | `^1.5.0` |

> 这样**开发期链接本地、发布后可被 registry 解析**，两全其美。

## 三、选择性执行：--filter

monorepo 里不想对所有包跑命令，用 `--filter`（别名 `-F`）选子集：

```bash
pnpm --filter @app/web build          # 只对 @app/web 跑 build
pnpm --filter "@app/*" test           # glob 匹配一组
pnpm --filter "./packages/**" lint    # 按目录
```

按依赖图扩展（`...` 的位置决定方向）：

```bash
pnpm --filter @app/web... build       # @app/web + 它依赖的包（上游）
pnpm --filter ...@app/web test        # @app/web + 依赖它的包（下游 dependents）
```

按 git 变更（monorepo CI 核心用法）：

```bash
# 自 origin/main 以来改动过的包 + 受影响的下游，一并构建/测试
pnpm --filter "...[origin/main]" build
```

> 口诀：**`...` 在前 = 带下游（谁依赖我）**；**`...` 在后 = 带上游（我依赖谁）**。对全体递归则用 `pnpm -r <cmd>`（可与 `--filter` 组合缩小范围）。

## 四、统一版本：catalog（版本目录）

monorepo 里同一个库被多个包以不同范围声明，容易解析出**多个版本**。catalog 让你**集中声明一次**，各包引用：

```yaml
# pnpm-workspace.yaml
catalog: # 默认目录
  react: ^18.2.0
  react-dom: ^18.2.0
catalogs: # 命名目录（可与默认并存）
  react17:
    react: ^17.0.2
```

```json
// 子包 package.json
{
  "dependencies": {
    "react": "catalog:", // 引用默认目录（= catalog:default）
    "react-dom": "catalog:" // → 解析为 ^18.2.0
  }
}
```

收益（官方）：**版本一致**（通常只该有一个版本）、**升级只改目录一处**、**减少 `package.json` 的合并冲突**。发布时 `catalog:` 同样会被替换成目录里的真实版本（如 `^18.2.0`）。

> 默认目录用单数 `catalog:`，命名目录挂在复数 `catalogs:` 下，引用写 `catalog:react17`。二者可并存。

## 五、CI 与 frozen-lockfile

CI 安装一律加 `--frozen-lockfile`：

```yaml
# GitHub Actions 片段
- uses: pnpm/action-setup@v4 # 安装 pnpm（或用 corepack）
- run: pnpm install --frozen-lockfile # 严格按锁文件，不一致即失败
- run: pnpm -r build
```

- 行为：严格按 `pnpm-lock.yaml` 安装，**不修改锁文件**；若锁文件与 `package.json` 不一致 → **报错退出**。
- 缓存：缓存 **pnpm store**（`pnpm store path` 给路径，按 `pnpm-lock.yaml` 哈希做 key）比缓存 `node_modules` 更通用——store 跨项目复用、安装走硬链接很快。

## 六、依赖治理三件套

| 场景 | 用哪个 | 示例 |
|---|---|---|
| 强制某依赖（含**传递依赖**）的版本（如安全修复） | `overrides` | `overrides: { "lodash": "^4.17.21" }` |
| 某包 peer 声明过窄，确认可用想消告警 | `peerDependencyRules` | `allowedVersions: { react: "18" }` |
| 破损包**漏声明**了它实际需要的依赖/peer | `packageExtensions` | 给它补 `peerDependencies` |

```yaml
# pnpm-workspace.yaml（monorepo；单包写 package.json 的 pnpm 字段）
overrides:
  lodash: ^4.17.21 # 把所有层级的 lodash 钉到安全版本
peerDependencyRules:
  allowedVersions:
    react: "18" # 放宽某包对 react 的过窄 peer 要求
  ignoreMissing:
    - "@babel/core" # 忽略缺失 peer 的告警
packageExtensions:
  react-redux@1: # 给破损包补上缺失的 peer 声明
    peerDependencies:
      react: "*"
```

> 三者别混：`overrides` 改**版本**、`peerDependencyRules` 调 **peer 校验**、`packageExtensions` 补**缺失声明**。

---

进入 [指南 · 专家](./guide-line/expert)：安全默认（构建脚本拦截、`allowBuilds`/`approve-builds`）、`pnpm patch`、`pnpm deploy` 与 Docker、`pnpm fetch` 层缓存、`nodeLinker`/hoist 逃生舱、迁移实战。
