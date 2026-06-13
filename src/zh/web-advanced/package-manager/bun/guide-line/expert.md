---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **Bun 1.2+**。深入包管理器内核：`bun.lock` 文本化原理与 `bun.lockb` 升级、isolated 内部结构、`minimumReleaseAge` 供应链防护、`bun patch`、跨平台锁文件、性能调优。

## 一、bun.lock 文本化：为什么 & 怎么升

Bun 1.2 把默认锁文件从二进制 `bun.lockb` 换成文本 **`bun.lock`**，采用 **JSONC**（JSON with Comments，类似 `tsconfig.json`）。

**为什么换**（官方原文要点）：

- 二进制锁文件在 PR 里**没法 review**、合并冲突难解、工具读不了；
- 文本化后 GitHub 能渲染 diff、Dependabot 等能接入；
- 出人意料地——切到文本后**缓存命中的 `bun install` 还快了约 30%**。

> 文本锁文件在 1.1.39 经 `--save-text-lockfile` 引入，1.2 成为默认。

**把旧的 `bun.lockb` 升级为 `bun.lock`**（官方推荐）：

```bash
bun install --save-text-lockfile --frozen-lockfile --lockfile-only
rm bun.lockb
```

- `--frozen-lockfile`：保持已解析版本不变；
- `--lockfile-only`：只生成锁文件、不实际安装；
- 完成后删除旧的二进制锁文件即可。

## 二、isolated 内部结构

`--linker isolated` 下的 `node_modules`：

```text
node_modules/
├── .bun/
│   ├── react@19.0.0/node_modules/react/...      # 中心 store，按 pkg@version 存
│   └── @scope+pkg@2.1.0/...                      # 作用域包：/ 替换为 +
├── react -> .bun/react@19.0.0/node_modules/react # 顶层 symlink
└── ...
```

- 顶层只放**指向 store 的 symlink**，包只能访问自己声明过的依赖 → **杜绝幻影依赖**。
- 与 pnpm 的差异：pnpm 用**全局** store + symlink，Bun 默认把包**物化在项目本地** `node_modules/.bun/`。
- 作用域包命名：`@scope/pkg` → `@scope+pkg@ver`（`/` 换成 `+`）。

## 三、minimumReleaseAge：供应链时间闸门

针对「恶意包被快速发布、几小时内就被装进来」的攻击，可设一个**最小发布时长**，过滤掉太新的版本：

```bash
# 只装发布满 3 天（259200 秒）的版本
bun add @types/bun --minimum-release-age 259200
```

```toml
# bunfig.toml
[install]
minimumReleaseAge = 259200
minimumReleaseAgeExcludes = ["@types/node", "typescript"]  # 信任的包跳过闸门
```

机制要点：

- 只影响**新解析**——已在 `bun.lock` 的包不变；
- 直接与传递依赖都受约束；
- 还带「稳定性检查」：若多个版本扎堆在闸门外刚发布，会再往后跳过这些可能不稳的版本（最多向后找 7 天）；
- 精确版本请求（`pkg@1.1.1`）仍受闸门约束，但跳过稳定性检查。

> 更强的安全扫描见官方 Security Scanner API（可接第三方服务做自定义过滤）。

## 四、bun patch：给依赖打补丁

上游有 bug 但还没发版，本地先修并固化进项目：

```bash
bun patch lodash             # 准备成可编辑状态
# ... 直接改 node_modules/lodash 里的文件 ...
bun patch --commit           # 生成补丁并写入 package.json 的 patchedDependencies
```

之后每次 `bun install` 会自动应用该补丁。`patchedDependencies` 字段从 pnpm 迁移时也会被一并迁移。

## 五、跨平台锁文件

Bun 把规范化的 `cpu`/`os` 值连同已解析包存进锁文件，并在安装时**跳过对当前平台禁用的包**：

```bash
bun install --cpu=x64 --os=linux   # 为指定平台选包（跨平台构建/部署预备）
```

结果：**`bun.lock` 在不同平台/架构间保持不变**，变的只是最终落地的包。所以一份锁文件即可跨 macOS/Linux/Windows 提交与复现，无需逐 OS 生成。

## 六、性能调优清单

| 手段 | 说明 |
|---|---|
| 提交并复用 `bun.lock` | 命中锁文件 → 惰性按需安装，二次安装近乎瞬时 |
| CI 缓存 `~/.bun/install/cache` | 跨流水线复用全局缓存 |
| `--backend` | 默认已最优（macOS `clonefile`/Linux `hardlink`），异常时再调 |
| `--concurrent-scripts` / `--network-concurrency` | 调生命周期脚本与网络并发上限 |
| `--production` + `--frozen-lockfile` | 生产装得更少、更稳 |

## 七、辨析：包管理器 Bun ≠ 运行时 Bun

最后强调本篇贯穿的边界：

- **包管理器 Bun**（本篇）：`bun install`/`bun add`/`bun pm`……读写标准 `package.json`/`node_modules`，**可单独用在 Node 项目**，不要求换运行时。
- **运行时 Bun**：`bun run x.ts`、`bun build`、`bun test`——那是「后端框架 > Bun」的范畴。

两者解耦：你完全可以「用 `bun install` 装依赖 + `node` 跑代码 + Vite 打包」。把这条记牢，就不会把「装包快」误解成「必须整套换 Bun」。

---

回到 [入门](../getting-started) 复习命令，或查 [参考](../reference) 速览标志与 `bunfig.toml`。
