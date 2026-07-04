---
layout: doc
outline: [2, 3]
---

# 版本与发布

> 基于 Lerna（9.x，由 Nx 团队维护）· 核于 2026-07

## 速查

- **两条命令解耦**：**`lerna version`** 负责升号 + changelog + git tag/commit/push（**不发 npm**）；**`lerna publish`** 负责真正发布到 npm（默认会先在背后调 `lerna version`）。
- **fixed / locked（默认）**：`lerna.json` 的 `version` 是语义版本串 → **全仓统一版本线**，任一包 major 变更全体升 major，单个全局 tag `v1.0.0`。
- **independent**：`version` 设为字面量 `"independent"` → **每包独立升号**，每包一个 tag `package-a@1.1.0`（分隔符 `@`，可用 `--tag-version-separator` 改）。
- **进入 independent**：`lerna init --independent` 或手改 `lerna.json`。
- **conventional-commits**：`--conventional-commits` 按提交信息**自动推断版本级别并生成 CHANGELOG.md**；默认 preset `angular`，`--changelog-preset` 可换。
- **publish 三模式**：默认（先 version 再发）／**`from-git`**（发当前 commit 已被 tag 过的包）／**`from-package`**（发 registry 里尚不存在该版本的包，用于补发/重试）。
- **永远用 npm 发布**：*"Lerna always uses npm to publish packages"*——认证写 `.npmrc` / `publishConfig`，与 `npmClient` 无关。
- **scoped 包发公开**：必须 `publishConfig.access: "public"`，否则失败。
- **private 包**：默认**不发**；`--include-private <pkg|"*">` 才发（会临时删 `private` 字段）。
- **canary**：`--canary` 按 commit 发预览版，`1.0.0 → 1.1.0-alpha.0+<sha>`；**不能与 `--build-metadata` 同用**。
- **占位符**：`%s`→`v1.0.0`、`%v`→`1.0.0` **仅 fixed 模式生效**；independent 无全局版本，不替换。
- **create-release**：`--create-release github|gitlab` **必须配 `--conventional-commits`**，且不能同时 `--no-changelog`（需 `GH_TOKEN` / `GL_TOKEN`）。

## fixed / locked vs independent

| 维度 | Fixed / Locked（默认） | Independent |
| --- | --- | --- |
| `lerna.json` 的 `version` | 语义版本串，如 `"9.0.7"` | 字面量 `"independent"` |
| 版本策略 | **全仓单一版本线**，所有包统一升号 | **每个包各自独立升号** |
| 交互提示 | 只问一次统一版本 | 逐个变更包分别提示 |
| git tag | 单个全局 tag，如 `v9.0.7` | 每包一个 tag：`package-name@version`（如 `package-a@1.1.0`） |
| 提交信息占位符 | `%s` / `%v` 生效 | **不替换**（无全局版本概念） |
| 初始化 | 默认 | `lerna init --independent` |

- **fixed 想让未变更的包也一起升号发布**：`lerna version --force-publish`（跳过 changed 检测让全体升号）后 `lerna publish from-git`，保持版本同步。
- **从 fixed 切 independent**：把 `version` 改成 `"independent"`，下次 `lerna version` 起以各包 `package.json` 当前版本为基线分别计算。

## lerna version：升版本（不发 npm）

`lerna version` 的工作流大致五步：

1. **识别**自上次 tag 以来有变更的包；
2. **提示**你为它们选新版本（或由 `--conventional-commits` 自动推断）；
3. **修改**包元数据（`package.json` 的 `version` 及内部依赖），运行 version lifecycle 脚本；
4. **commit** 改动并**打 git tag**；
5. **push** commit 与 tag 到 git remote。

```bash
# 交互式选版本
npx lerna version

# 显式指定 bump（跳过版本选择；CI 里仍需 --yes）
npx lerna version patch          # 或 minor / major / premajor / prerelease ...
npx lerna version 1.4.0 --yes    # 直接指定具体版本号

# 用 conventional commits 自动定版本 + 生成 changelog
npx lerna version --conventional-commits --yes
```

关键 flags：

| Flag | 作用 |
| --- | --- |
| `--conventional-commits` | 用 conventional-changelog **自动推断 bump 幅度并生成 CHANGELOG.md** |
| `--changelog-preset <preset>` | changelog 预设，默认 `angular`；换非默认需装对应 `conventional-changelog-*` |
| `--create-release github\|gitlab` | 创建官方 Release（**必须配 `--conventional-commits`**，不可 `--no-changelog`） |
| `--conventional-prerelease` / `--conventional-graduate` | 发预发布 / 把预发布「毕业」为正式版（`1.0.0-alpha.0 → 1.0.0`） |
| `--force-publish` | 强制所有（或指定）包升号，无视 changed 检测 |
| `--exact` | 内部依赖写精确版本 |
| `--allow-branch <glob>` | 限定只在某分支运行（最佳实践限主分支） |
| `--ignore-changes <glob>` | 检测变更时忽略某些文件（如 `**/*.md`） |
| `--preid <id>` | 预发布标识（`1.0.1-next.0`） |
| `--amend` | 改到当前 commit（隐含 `--no-push`） |
| `--no-changelog` / `--no-push` / `--no-git-tag-version` / `--no-private` | 关闭对应默认行为 |
| `--yes` | 跳过所有确认（CI 必备） |

- **version lifecycle 顺序**：`preversion`（升号前）→ `version`（升号后、commit 前）→ `postversion`（commit 后）。

## lerna publish：发布到 npm

版本与发布在 v7+ **解耦**：`lerna publish` 默认会先在背后调 `lerna version`，再发布。三种模式：

```bash
lerna publish              # 发布自上次 release 以来变更的包（背后先 lerna version）
lerna publish from-git     # 发布"当前 commit 上已被 lerna version 打过 tag"的包
lerna publish from-package # 发布"registry 里尚不存在该版本"的包（补发失败的包）
```

- **`from-git`**：不再升号，直接发已打 tag 的那批版本——适合「version 与 publish 分两个 CI job」的流水线。
- **`from-package`**：*"Lerna will compare the version of every package in the repository with the version of it that is published to npm"*，只发 registry 里缺失的版本——**发布中途失败后的补发利器**。
- **永远用 npm**：*"Lerna always uses npm to publish packages. If you use a package manager other than npm, you will need to still add the appropriate publishing configuration to `.npmrc`."* pnpm/yarn 的认证配置**不被读取**。

publish 专属 flags（选摘）：

| Flag | 作用 |
| --- | --- |
| `--canary` | 按 commit 粒度发预览版：`1.0.0 → 1.1.0-alpha.0+<sha>`；**不能与 `--build-metadata` 同用** |
| `--dist-tag <tag>` | npm dist-tag，默认 `latest`；发 beta/next 用它避免用户误升 |
| `--pre-dist-tag <tag>` | 仅预发布版使用的 dist-tag |
| `--include-private <pkg\|"*">` | 强制发布 `private` 包（会临时删 `private` 字段） |
| `--otp <code>` | npm 2FA 一次性密码 |
| `--registry <url>` | 指定 registry |
| `--contents <dir>` | 发布子目录（如 `dist`，须每个包都有） |
| `--temp-tag` | 先发到临时 dist-tag `lerna-temp` 再改名 |
| `--no-git-reset` | 保留工作区改动（配合 canary 供后续 CI 用） |
| `--git-head <sha>` | `from-package` 时手动指定 gitHead（如 CodeBuild 无 git 时） |
| `--throttle` / `--throttle-size`(默认 25) / `--throttle-delay`(默认 30s) | 限流 registry |
| `--yes` | 跳过确认 |

- **每包 `publishConfig`**：`access`（scoped 包发公开必须 `"public"`）、`registry`、`tag`、`directory`。
- **publish lifecycle（拓扑序，依赖先于被依赖）**：`prepublish` → `prepare` → `prepublishOnly` → `prepack` →（打包）→ `postpack` →（发布）→ `publish` → `postpublish`。

## 内部依赖联动

- **内部依赖会被自动更新**：当同仓包 A 依赖包 B，B 升版本时，A 的 `package.json` 里对 B 的依赖范围会被 Lerna 同步更新（`--exact` 决定写精确版本还是 `^` 范围）。
- **pnpm 的 `workspace:` 协议**：pnpm 工作区下 `lerna version` **保留 `workspace:` 前缀**、workspace 别名依赖不会被误升号（详见[迁移与选型](./migration-selection)）。

## 发布失败如何重试

发布是「先 version、后逐包 push npm」的多步过程，中途失败很常见。恢复策略：

1. **回到干净工作区重跑 `lerna publish`**——已成功发布的包会被跳过。
2. **`lerna publish from-git`**——复用已打 tag 的同一批版本，不再升号。
3. **`lerna publish from-package`**——只补发 registry 里还缺的版本。

::: warning GitHub 网页 UI 打的 tag 有坑
GitHub Release 网页 UI 打的是 **lightweight tag**，Lerna 不识别、会退回更旧的 annotated tag，导致版本推荐错误或 changelog 重复。**手动打 tag 请用 `git tag -a -m`**（annotated）。另外**拆分 version/publish 时 `--tag-version-prefix` 要两处都传**，否则 `from-git` 找不到 tag。
:::
