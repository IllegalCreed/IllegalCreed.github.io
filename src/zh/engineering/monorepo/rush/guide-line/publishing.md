---
layout: doc
outline: [2, 3]
---

# 受控发布：change file、版本策略与部署

> 基于 Rush（@microsoft/rush 5.x）· 核于 2026-07

## 速查

- **change file 是 Rush 招牌能力**：改了可发布包后用 `rush change` 交互式生成一个 change file（JSON），描述「本次改动需要哪种版本递增 + 变更说明」，**随代码一起提交**。
- **存放位置**：`common/changes/`，文件名形如 `<branch>-<timestamp>.json`；结构核心是 `changes` 数组，每个受影响包一条（`packageName` / `comment` / `type`）。
- **五种 change type**：`major`（破坏性 → 主版本 +1）、`minor`（兼容新增 → 次版本 +1）、`patch`（修复 → 修订号 +1）、`none`（不发布但**仍需写一条**交代）、`hotfix`（实验，针对旧版热修）。
- **CI 门禁 `rush change --verify`**：改了公共包却没写对应 change file → **直接失败**（「忘写 change file」是最高频考点）；变更检测靠 `git diff` 对比目标分支（默认 `main`，可 `-b`/`--target-branch`）。
- **批量**：`rush change --bulk --message "..." --bump-type patch` 给所有变更项目同一条。
- **发布两步走**：第 1 步 `rush version --bump`（消费 change files、按版本策略递增 `package.json`、生成/追加 `CHANGELOG.md`）；第 2 步 `rush publish`。
- **`rush publish` 的四档语义**：裸跑 = **dry run**（不落盘）；`--apply`（改 package.json + changelog）；`--apply --target-branch <b>`（提交到 publish 分支）；`--publish`（真发 registry）；`--pack --include-all` 产 `.tgz`。
- **两种版本策略**（`common/config/rush/version-policies.json`）：**`lockStepVersion`（锁步）**——一组包共享同一版本号、一起递增；**`individualVersion`（独立）**——各包按自己的 change file 独立递增。
- **lockstep 字段**：`version`（当前版，Rush 以它算下一版）、`nextBump`（下次递增类型）、`mainProject`（放共享 CHANGELOG 的项目）；**individual 字段**：`lockedMajor`（强制全组共享同一主版本）。
- **绑定**：项目在 `rush.json` 用 `versionPolicyName` 绑策略，`shouldPublish: true` 标记公共包。
- **`rush deploy` ≠ `rush publish`**：**deploy** 把某项目 + 生产依赖裁剪拷进 `common/deploy/`，交付**可直接上服务器运行的 App**；**publish** 发 **npm 包**。两者正交。
- **deploy 配置**：`deploy.json`（`rush init-deploy` 生成）的 `deploymentProjectNames`、`linkCreation`（`default`/`script`/`none`）。

## 一、为什么发布要「受控」

在几百个包的大仓里，「谁改了什么、该升什么版本、该写进哪份 changelog」如果靠人工记忆和约定，必然失控——有人改了公共包忘了升版本、有人升错了级别（破坏性改动只升了 patch）、changelog 长期与代码脱节。Rush 的解法是把发布拆成一条**机器可校验的流水线**，核心载体就是 **change file**：**让「本次改动的版本影响」在提交代码的那一刻就被记录下来，并在 CI 强制校验**。

这条流水线是 Rush 区别于「手动 `npm version` + `npm publish`」的关键，也是它比只做构建加速的工具（Turborepo）多出来的治理维度。

## 二、change file：把「版本影响」随代码提交

开发者改了**可发布包**（`shouldPublish: true`）后，运行 `rush change`，Rush 交互式地问「这次改动是什么级别、说明是什么」，然后生成一个 change file：

```bash
rush change          # 交互式：为本分支改动的每个公共包生成 change file
```

生成的文件放在 **`common/changes/`**，随代码一起提交。结构如下（`changes` 数组，每个受影响包一条）：

```json
{
  "changes": [
    {
      "packageName": "@my-scope/my-lib",
      "comment": "Add the retryCount option to fetchData()",
      "type": "minor"
    }
  ],
  "packageName": "@my-scope/my-lib",
  "email": "dev@example.com"
}
```

它记录的不是「现在升到哪个版本」，而是「**这次改动需要哪种递增**」——真正的版本号计算推迟到发布时（`rush version --bump`）统一做。这样多个 PR 各自声明自己的影响，发布时一次性结算。

## 三、五种 change type

| type | 语义 | SemVer 效果 |
| --- | --- | --- |
| `major` | 破坏性变更（改类名、加必填参数、删 API） | 主版本 +1 |
| `minor` | 向后兼容的新增（新 API、可选参数） | 次版本 +1 |
| `patch` | Bug 修复、私有 API 改动 | 修订号 +1 |
| `none` | **不需要发布**（工具/配置/测试改动） | 不升版本，但**仍需写一条 change file 交代** |
| `hotfix` | 针对旧版本的热修（实验特性） | 阻止其他版本递增 |

> **`none` 也要写**：这是高频坑。即使你的改动不该触发发布（比如只改了 CI 配置），只要动了公共包目录，`rush change --verify` 仍要求有一条 change file——写 `type: none` 明确「我知道这次不用发」。**「没写 change file」和「写了 type: none」是两回事**，前者会被 CI 拦下。

## 四、CI 门禁：rush change --verify

`rush change --verify` 是这套流水线的**强制关卡**，应作为 CI 的一个 step：

```bash
rush change --verify                      # 改了公共包却没写 change file → 失败
rush change --verify -b origin/release    # 指定对比的目标分支
```

- **作用**：若本次改动动了公共包、却**没有对应的 change file**，**直接失败**——从制度上杜绝「忘写 change file」。
- **变更检测**：靠 `git diff` 对比**目标分支**（默认 `main`，用 `-b` / `--target-branch` 指定），算出「哪些公共包被改了」，再检查这些包是否都有 change file。
- **批量补写**：`rush change --bulk --message "..." --bump-type patch` 给所有变更项目一次性生成同一条 change file（适合大范围机械改动）。

## 五、发布两步走：version --bump → publish

change files 攒够后，发布分**两个正交步骤**——先算版本，再发包，中间可以插入测试：

### 第 1 步：rush version --bump（结算版本）

```bash
rush version --bump
```

它**消费 `common/changes/` 里的 change files**，按每个项目绑定的**版本策略**递增 `package.json` 的版本号，并生成/追加 **`CHANGELOG.md` 与 `CHANGELOG.json`**。这一步只动版本与 changelog，不发 registry——所以你可以在这之后**跑一轮测试**，确认版本无误再真正发布。

### 第 2 步：rush publish（发包）

`rush publish` 有**从安全到危险的四档**，理解它们是发布最易错的考点：

| 调用方式 | 行为 |
| --- | --- |
| `rush publish` | **dry run**：只读检查，不落盘、不 git commit、不发 registry |
| `rush publish --apply` | 落盘：更新本地 `package.json` + changelog，但不 git / registry |
| `rush publish --apply --target-branch <b>` | 提交到一个 `publish-` 前缀的新分支，仍不发 registry |
| `rush publish --publish` | **完整执行**：版本 + 提交 + 真发 registry |

真发布的典型完整命令：

```bash
rush publish --apply --target-branch main \
  --publish --registry https://registry.npmjs.org/ \
  --npm-auth-token "$NPM_TOKEN"
```

用 `--pack --include-all --publish` 可产出 `.tgz` 包而非直发 registry（用于内部分发或审查）。发布后被消费的 change files 会被清空。

> **裸跑 `rush publish` 是 dry run** 这一点务必记牢——它是安全默认值，让你先看清「将要发什么」再加 `--publish` 真发。

## 六、版本策略：lockstep vs individual

`common/config/rush/version-policies.json` 定义版本递增规则，项目在 `rush.json` 用 `versionPolicyName` 绑定。两种 `definitionName`：

```json
[
  {
    "policyName": "myPublic",
    "definitionName": "lockStepVersion",
    "version": "1.0.0",
    "nextBump": "minor",
    "mainProject": "@my-scope/my-lib"
  },
  {
    "policyName": "myInternal",
    "definitionName": "individualVersion",
    "lockedMajor": 3
  }
]
```

- **`lockStepVersion`（锁步）**：一组包**共享同一版本号、一起递增**——适合「同一产品的一组可选组件」，希望它们版本齐平。字段：**`version`**（当前版本，Rush 以它算下一版，而非读各自 package.json）、**`nextBump`**（下次递增类型：`prerelease`/`minor`/`patch`/`major` 等）、**`mainProject`**（放共享 `CHANGELOG.md` 的项目；不填则各包各自 changelog）。
- **`individualVersion`（独立）**：各包按自己的 change file **独立递增**（标准 npm 模型）——适合彼此独立演进的库。字段：**`lockedMajor`**（可选，强制全组共享同一主版本号，允许次/修订号各自走）。

一句话选型：**「一起发、版本要齐」→ lockstep；「各发各的、独立演进」→ individual**。

## 七、rush deploy：与 publish 正交的「交付可运行 App」

`rush publish` 发的是 **npm 包**（给别人 `npm install`）。但很多 monorepo 里的项目是**要部署上服务器运行的 App**，不是要发布的库——这类交付走 **`rush deploy`**，它和 publish **正交**：

- **`rush deploy`**：把**某个（或某些）项目 + 其生产依赖**裁剪、拷贝进 **`common/deploy/`**，产出一份**可直接上服务器运行的最小部署包**（排除 devDependencies 与无关文件）。
- **典型流程**：`rush install` → `rush build` → `rush deploy`。

配置在 `deploy.json`（用 `rush init-deploy --project app1` 生成）：

- **`deploymentProjectNames`**：可部署项目的白名单；
- **`linkCreation`**：symlink 处理策略——`default`（直接建 symlink）/ `script`（生成 `create-links.js`，在服务器上 `node create-links.js create` 建链）/ `none`；
- **`additionalProjectsToInclude`**：额外纳入的项目。

多场景部署：`rush deploy --scenario app2-example --target-folder /mnt/deploy/app2`。

> **一句话区分**：**deploy = 交付一个可运行的 App（到 `common/deploy/`）；publish = 发布一个 npm 包（到 registry）**。别把两者搞混——大仓里 App 用 deploy、库用 publish，同一个仓两者常并存。

## 小结

受控发布是 Rush 相比构建加速工具多出的治理维度，核心是 **change file**：改公共包用 `rush change` 写一条（`major/minor/patch/none/hotfix`，**`none` 也要写**），存 `common/changes/`，CI 用 **`rush change --verify`** 强制门禁（靠 `git diff` 对比目标分支）。发布**两步走**：`rush version --bump`（结算版本 + changelog）→ `rush publish`（**裸跑是 dry run**，`--publish` 才真发）。版本策略分 **lockstep（共享版本一起升）** 与 **individual（各升各的，`lockedMajor` 锁主版本）**。最后记牢 **deploy ≠ publish**——deploy 交付可运行 App，publish 发 npm 包。发布之外，Rush 还有一整套可扩展生态与配套工具：[生态与扩展](./ecosystem)。
