---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **Bun 1.2+**。本篇把「会装包」用到「懂机制」：安装策略（hoisted vs isolated）、`node_modules` 结构、workspaces 基础、`bunfig.toml`、生命周期脚本安全模型。仅讲包管理器。

## 一、安装的全流程发生了什么

跑 `bun install` 时：

1. 读 `package.json` 与（若有）`bun.lock`，解析依赖树；
2. 缺失的包从 registry 下载到**全局缓存** `~/.bun/install/cache`；
3. 用 `clonefile`（macOS）/`hardlink`（Linux）把缓存**物化**进 `node_modules`；
4. 跑**项目自身**的生命周期脚本（依赖的脚本默认被拦）；
5. 写/更新 `bun.lock`。

> 关键：**锁文件命中且 `package.json` 未变**时，Bun 走「惰性 + 按需」——`node_modules` 里已存在 name/version 匹配的包就跳过下载。这是二次安装近乎瞬时的原因。

## 二、两种安装策略：hoisted vs isolated

这是 Bun 包管理最该先理解的概念。

| 维度 | **hoisted（提升/扁平）** | **isolated（隔离）** |
|---|---|---|
| 结构 | 依赖扁平铺到共享 `node_modules` 顶层 | 中心 store `node_modules/.bun/pkg@ver/` + 顶层 symlink |
| 风格 | 传统 npm / yarn classic | pnpm 式 |
| 幻影依赖 | **可能**（能 import 没声明的包） | **杜绝**（只能访问已声明依赖） |
| 切换 | `--linker hoisted` | `--linker isolated` |

```bash
bun install --linker isolated   # 显式用隔离
bun install --linker hoisted    # 显式用扁平
```

也可写进 `bunfig.toml`：

```toml
[install]
linker = "isolated"
```

::: tip 默认策略由场景决定
官方规则：**新建 workspaces/monorepo → 默认 `isolated`**（防幻影依赖）；**新建单包项目 → 默认 `hoisted`**（传统 npm 行为）；**v1.3.2 之前创建的老项目 → 保持 `hoisted`**（向后兼容）。默认由锁文件的 `configVersion` 字段控制。
:::

### 什么是「幻影依赖」

扁平 `node_modules` 下，A 依赖了 B、B 依赖了 C，C 被提升到顶层，于是 A 的代码**能 import C** —— 哪怕 A 的 `package.json` 根本没声明 C。一旦 B 升级不再依赖 C，A 就突然报错。isolated 用 symlink 严格隔离，A 只能看到自己声明的依赖，从源头消灭这类隐患。

## 三、workspaces 基础

monorepo 在**根 `package.json`** 声明工作区：

```json
{
  "name": "my-monorepo",
  "workspaces": ["packages/*"]
}
```

- 支持 glob 与负向模式（`"!**/excluded/**"`）。
- 包之间用 `workspace:` 协议互相引用：

```json
// packages/app/package.json
{ "dependencies": { "@my/ui": "workspace:*" } }
```

- 在仓库根跑**一次** `bun install`，即为所有工作区安装依赖并自动去重。
- 发布时 `workspace:*` 会被替换成被引用包的真实版本号。

> 对位：Bun 的 `workspaces` 写法与 npm/yarn 一致（数组放 `package.json`），不像 pnpm 用单独的 `pnpm-workspace.yaml`。更细的 `--filter` / catalog 见[进阶篇](./advanced)。

## 四、bunfig.toml：按需配置

Bun 追求零配置，但需要时用 `bunfig.toml` 覆盖默认。安装相关项都在 `[install]` 段：

```toml
[install]
exact = true               # 默认写精确版本
production = false
linker = "isolated"
```

搜索顺序：`$HOME/.bunfig.toml`（全局）→ 项目根 `./bunfig.toml`，两者合并；**环境变量优先级最高**。

## 五、生命周期脚本：安全默认

这是 Bun 与 npm 最重要的行为差异：

> **Unlike other npm clients, Bun does not execute arbitrary lifecycle scripts like `postinstall` for installed dependencies.**

即——**依赖的** `postinstall` 等脚本**默认不跑**（供应链攻击常借此执行恶意代码）。要放行某个确需脚本的包（如带原生编译的 `sharp`）：

```jsonc
// package.json
{
  "trustedDependencies": ["sharp"]
}
```

```bash
bun install                 # 重装，sharp 的脚本被放行
# 或一步到位：
bun add sharp --trust
```

辅助命令：

```bash
bun pm untrusted            # 看哪些依赖的脚本被拦下了
bun pm trust sharp          # 事后放行并写入 trustedDependencies
bun pm default-trusted      # 看默认信任列表
```

::: warning 两个易忘点
① 项目**自身**的 `pre/post install/prepare` 脚本仍会跑，被拦的只是**依赖**的脚本。
② Bun 会为 `esbuild`、`sharp` 等热门包自动优化 postinstall 处理，多数情况无需手动配置。
:::

---

进入 [指南 · 进阶](./advanced)：`--filter` 跨工作区跑脚本、catalog 版本目录、私有 registry / `.npmrc`、`--production` 与 `--frozen-lockfile` 实战。
