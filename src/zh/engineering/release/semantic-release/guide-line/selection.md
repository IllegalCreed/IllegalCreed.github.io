---
layout: doc
outline: [2, 3]
---

# 选型与工程落地

> 基于 semantic-release v25 · 核于 2026-07

## 速查

- **semantic-release 的定位**：**全自动、单包、commit 驱动**——push 即发布，无人工介入。适合「发布应尽量频繁且无人值守」的单包库/服务。
- **monorepo 是短板**：开箱只面向单包；多包独立版本需 `semantic-release-monorepo` / `@semantic-release/exec` 等扩展，配置复杂，且「全自动」在多包场景反成负担（一个提交可能误触发无关包发版）。
- **对比 Changesets**：Changesets 是**意图驱动**——开发者手写 changeset 文件声明「这次改了什么、升哪一级」，机器人开 PR 汇总。monorepo 多包独立版本最成熟，控制力强，但需人工写 changeset。
- **对比 release-please**：release-please（Google）走 **Release PR** 模型——解析 Conventional Commits，维护一个「发布 PR」，**合并该 PR 才发布**，多了一道人工闸门，语言无关、支持 monorepo manifest。
- **一句话选型**：要**全自动无人值守**选 semantic-release；要 **monorepo 多包 + 人工把关**选 Changesets；要 **commit 驱动但保留「点一下才发」**选 release-please。
- **凭据两类**：**Git 推送**（`GITHUB_TOKEN`/`GH_TOKEN`、`GL_TOKEN`、`BB_TOKEN`）用于打 tag/建 Release；**npm 发布**（`NPM_TOKEN`）用于 `npm publish`。`GITHUB_TOKEN`/`GITLAB_TOKEN` 同时兼作 Git 与 API 认证。
- **npm 2FA**：仅支持 `auth-only` 级别的双因子；`publish` 级 2FA 无法在 CI 自动发布——改用 automation/CI token 或 OIDC Trusted Publishing。
- **幂等可重跑**：靠 Git tag 记录「已发到哪」，重跑不会重复发版；发布中途失败重跑通常安全。
- **提交规范是命根子**：semantic-release **不校验**提交格式——必须配 **commitlint + Husky** 在 `commit-msg` 钩子拦住不规范提交，否则版本会乱跳或不发。
- **配套**：`commitizen`/`cz-git` 交互式引导写规范提交，进一步降低人工出错。

## 一、semantic-release 的能力边界

先明确它擅长什么、不擅长什么，选型才有依据：

**擅长**：单包（single-package）仓库的**全自动、无人值守**发布。你 push 到发布分支，它就在 CI 里算版本、发包、建 Release，全程无需人点任何按钮。发布频率可以极高（每次合并都可能发一版），这正是它的设计目标——「消除人与版本号之间的连接」。

**不擅长**：

- **monorepo 多包独立版本**：内核假设「一个仓库 = 一个包」。多包场景要靠 `semantic-release-monorepo`（按包路径过滤提交）、`multi-semantic-release`，或用 `@semantic-release/exec` 手写逻辑，配置显著变复杂。
- **需要人工把关的发布**：它的「全自动」在某些团队反而是缺点——没有「攒几个功能一起发」「这次先别发」的天然闸门。
- **精细控制单次版本跳变**：版本完全由提交决定，想「这次强制发 major」得靠特殊提交或改规则，不如 Changesets 直接。

## 二、与 Changesets、release-please 的架构对比

三者都能自动化发布，但**发布哲学**根本不同：

| 维度 | semantic-release | Changesets | release-please |
| --- | --- | --- | --- |
| 版本来源 | Conventional Commits（自动推断） | 开发者手写 changeset 文件（声明意图） | Conventional Commits（自动推断） |
| 触发发布 | push 到分支即发（全自动） | 合并「Version Packages」PR 后发 | 合并「Release PR」后发 |
| 人工闸门 | **无** | 有（合 PR） | 有（合 PR） |
| monorepo | 弱，需扩展 | **强**，多包独立版本最成熟 | 支持（manifest 配置） |
| 心智负担 | 只需写规范提交 | 需为每次改动写 changeset | 只需写规范提交 |
| 语言 | 偏 JS/npm 生态 | 偏 JS/npm 生态 | **语言无关** |
| 出品方 | 社区 | Atlassian（Changesets 团队） | Google |

选型直觉：

- **全自动、无人值守、单包库/服务** → **semantic-release**。典型：内部工具库、独立 SDK、后端服务镜像。
- **monorepo 多包、要人工控制每次发什么、开源协作** → **Changesets**。典型：组件库 monorepo、大型开源项目（PR 里带上 changeset 一起评审）。
- **想要 commit 驱动的自动化，但保留「合个 PR 才真发」的确认步骤，或非 JS 项目** → **release-please**。

## 三、凭据体系：谁能打 tag、谁能发包

semantic-release 需要两类权限，分别由不同令牌提供：

**① Git 推送权限**（打 tag、建 Release，用 `@semantic-release/git` 时还要回提交）：

- GitHub：`GITHUB_TOKEN` 或 `GH_TOKEN`
- GitLab：`GITLAB_TOKEN` 或 `GL_TOKEN`
- Bitbucket：`BB_TOKEN` / `BB_TOKEN_BASIC_AUTH`
- 通用：`GIT_CREDENTIALS`（`username:password`，URL 编码）或 SSH key

其中 `GITHUB_TOKEN`/`GITLAB_TOKEN` **一份兼两用**：既做 Git 推送认证，也做平台 API 认证（建 Release、评论 issue）。GitHub Actions 里用内置 <code v-pre>${{ secrets.GITHUB_TOKEN }}</code> 即可，但记得给 `permissions: contents: write`。

**② npm 发布权限**（`@semantic-release/npm` 的 `publish`）：

- `NPM_TOKEN`：用 `npm token create` 生成。**注意**：只支持 `auth-only` 级别的双因子认证；若 npm 账号开了 `publish` 级 2FA，CI 无法自动发布——应改用 **automation/CI token**，或采用 npm 的 **OIDC Trusted Publishing**（无长期令牌，CI 用短时凭据换取发布权，更安全）。

**最小权限原则**：令牌只给「发布这一个包」所需的权限；能用 OIDC 短时凭据就不用长期 token（同 [CI/CD 安全实践](../../../devops/cicd-core/guide-line/security-supply-chain)）。

## 四、幂等与重跑

semantic-release 的**已发布状态存在 Git tag 里**，不在任何数据库或配置文件中。这带来天然的幂等性：

- 重跑时它先看 HEAD 对应的历史 tag，若当前提交已被发布过（无新的可发布提交），就报「no relevant changes」直接退出，**不会重复发版**。
- 发布中途失败（如 `npm publish` 网络抖动）后重跑，通常能安全续上——已完成的步骤不会造成重复副作用（npm 对已存在版本会拒绝重复发布）。

但要注意：`@semantic-release/git` 回提交、多平台同时 publish 等场景下，「部分成功」的清理仍需留意（比如 tag 已打但 npm 没发成功），此时重跑一般能补齐，个别情况需人工核对 tag 与 registry 是否一致。

## 五、提交规范是命根子：配 commitlint + Husky

semantic-release **只消费**提交信息，**不负责校验**它们是否合规。如果团队里有人写了 `更新代码` 这种不规范提交，semantic-release 只会把它当作「不触发发布的类型」忽略——**该发的版本没发出来**。反过来，滥用 `feat`/`BREAKING CHANGE` 会让版本号乱跳。所以**提交规范必须在源头强制**：

- **commitlint**：校验提交信息是否符合 Conventional Commits。
- **Husky**：注册 Git 的 `commit-msg` 钩子，在每次提交时调 commitlint，不合规就**拒绝提交**。

```bash
# 安装
npm i -D @commitlint/{cli,config-conventional} husky

# 初始化 husky 并挂 commit-msg 钩子
npx husky init
echo 'npx --no-install commitlint --edit "$1"' > .husky/commit-msg
```

`commitlint.config.js`：

```js
// 采用 Conventional Commits 官方规则集
export default { extends: ["@commitlint/config-conventional"] };
```

这样「不规范的提交进不了仓库」，semantic-release 的输入就有了质量保证。进一步可用 **commitizen / cz-git** 提供交互式提交引导，让开发者按菜单选 `type`/`scope`、填写破坏性变更，从「被动拦截」升级为「主动引导」。

> 组合拳的完整链路：**commitizen（引导写）→ commitlint + Husky（拦不合规）→ CI 测试全过 → semantic-release（算版本、发布）**。前三环保证输入质量，最后一环才敢全自动。相关工具见 [Husky](../../../devops/husky/) 与 commitlint 笔记。
