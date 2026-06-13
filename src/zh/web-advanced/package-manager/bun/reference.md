---
layout: doc
outline: [2, 3]
---

# 参考

> Bun **包管理器** 常用命令、标志、`bunfig.toml` 与环境变量速查。版本基线 Bun 1.2+。运行时/打包/测试命令不在此列。

## 一、核心命令

| 命令 | 作用 | 对位 npm |
|---|---|---|
| `bun install` / `bun i` | 安装 `package.json` 全部依赖，写 `bun.lock` | `npm install` |
| `bun add <pkg>` | 新增依赖并写入 `package.json` | `npm install <pkg>` |
| `bun remove <pkg>` / `bun rm` | 卸载依赖 | `npm uninstall <pkg>` |
| `bun update [pkg]` | 在 semver range 内升级 | `npm update` |
| `bun outdated` | 列出可升级项（Current/Update/Latest） | `npm outdated` |
| `bun patch <pkg>` | 给依赖打补丁 | （patch-package） |
| `bun link` | 链接本地包供调试 | `npm link` |
| `bun ci` | = `install --frozen-lockfile` | `npm ci` |
| `bunx <pkg>` / `bun x` | 一次性执行包的 bin | `npx <pkg>` |

## 二、bun install / add 常用标志

| 标志 | 含义 |
|---|---|
| `-d` / `--dev` / `-D` | 加入 `devDependencies` |
| `--optional` / `--peer` | 加入 optional / peer 依赖 |
| `-g` / `--global` | 全局安装 |
| `-E` / `--exact` | 写精确版本（不加 `^`） |
| `--frozen-lockfile` | 严格按锁文件装，不一致即报错且不更新 |
| `--production` | 不装 devDependencies / optionalDependencies |
| `--omit dev\|optional\|peer` | 按类型排除依赖 |
| `--save-text-lockfile` | 生成文本锁文件 `bun.lock` |
| `--lockfile-only` | 只生成锁文件不实际安装 |
| `--filter <pattern>` | 只对匹配的工作区操作 |
| `--linker hoisted\|isolated` | 选择安装策略 |
| `--trust` | 把包加入 `trustedDependencies` 并安装 |
| `--dry-run` | 模拟，不真正安装 |
| `--force` | 强制拉最新并重装 |
| `--backend clonefile\|hardlink\|symlink\|copyfile` | 文件物化方式 |
| `--minimum-release-age <秒>` | 只装发布满指定时长的版本 |

## 三、`bun update` 标志

| 标志 | 含义 |
|---|---|
| `--latest` | 突破 `package.json` 的 range 升到绝对最新 |
| `-i` / `--interactive` | 交互式勾选要升级的包 |
| `-r` / `--recursive` | 配合 `-i` 跨工作区升级 |

## 四、`bun pm` 工具族

| 子命令 | 作用 |
|---|---|
| `bun pm ls [--all]` | 列已装依赖及解析版本（`--all` 含传递依赖） |
| `bun pm cache [rm]` | 显示 / 清除全局缓存 |
| `bun pm hash` | 生成/显示锁文件哈希 |
| `bun pm bin [-g]` | 输出 `node_modules/.bin`（`-g` 全局 bin）路径 |
| `bun pm whoami` | 打印当前登录的 npm 用户名 |
| `bun pm pkg get/set/delete/fix` | 读写 / 修复 `package.json` 字段 |
| `bun pm version <patch\|minor\|major>` | 升版本号 |
| `bun pm pack` | 打出将发布到 npm 的 `.tgz` |
| `bun pm migrate` | 迁移其它包管理器的锁文件（不安装） |
| `bun pm trust <names> [--all]` | 放行 untrusted 依赖的脚本并写入 `trustedDependencies` |
| `bun pm untrusted` | 列出被拦下脚本的依赖 |
| `bun pm default-trusted` | 显示默认信任列表 |

## 五、bunfig.toml `[install]` 段

```toml
[install]
optional = true            # 装 optionalDependencies
dev = true                 # 装 devDependencies
peer = true                # 装 peerDependencies（默认 true）
production = false          # 等价 --production
exact = false              # 等价 --exact
frozenLockfile = false     # 等价 --frozen-lockfile
saveTextLockfile = true    # 1.2 起默认 true（文本 bun.lock）
linker = "hoisted"         # 或 "isolated"
concurrentScripts = 16     # 并发生命周期脚本数（默认 CPU×2）
registry = "https://registry.npmjs.org"
minimumReleaseAge = 259200            # 只装发布满 3 天的版本（秒）
minimumReleaseAgeExcludes = ["@types/node", "typescript"]

[install.scopes]           # 按作用域配私有 registry
myorg = { token = "$npm_token", url = "https://registry.myorg.com/" }

[install.cache]
dir = "~/.bun/install/cache"
disable = false            # 跳过全局缓存
disableManifest = false    # 总是拉最新 manifest

[install.lockfile]
save = true
print = "yarn"             # 额外生成 yarn.lock
```

> 搜索顺序：`$HOME/.bunfig.toml`（全局）→ `./bunfig.toml`（项目），两者合并；**环境变量优先级高于 `bunfig.toml`**。

## 六、常用环境变量

| 变量 | 作用 |
|---|---|
| `BUN_CONFIG_REGISTRY` | 设置 npm registry |
| `BUN_CONFIG_YARN_LOCKFILE` | 额外生成 yarn.lock |
| `BUN_CONFIG_SKIP_SAVE_LOCKFILE` | 不保存锁文件 |
| `BUN_CONFIG_SKIP_INSTALL_PACKAGES` | 不安装任何包 |

---

命令查完，进 [指南 · 基础](./guide-line/base) 理解机制，或 [指南 · 进阶](./guide-line/advanced) 看 workspaces / catalog / 私有源实战。
