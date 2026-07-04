---
layout: doc
outline: [2, 3]
---

# 指南 - 工作流

> 基于 Changesets（@changesets/cli）· 核于 2026-07

## 速查

- **`changeset version` 五件事**：①消费全部 changeset ②按最高 bump 算每个包新版本 ③联动升级内部依赖 ④写各包 `CHANGELOG.md` ⑤**删掉已消费的 changeset 文件**
- **同包多 changeset**：取**最高级**——同时有 patch + minor 则升 minor；有 major 则升 major
- **`version` 只改文件、不发布**：产出是 `package.json` / `CHANGELOG.md` 的 diff + `.changeset/*.md` 被删；**务必先 review 再发**
- **内部依赖联动**：被依赖包升级时，依赖方按 `updateInternalDependencies`（默认 `patch`）自动补 bump 并更新 range
- **`changeset publish` 幂等**：逐包比较「本地版本 vs npm 版本」，**只发更新过的**，可反复重跑不会重复发
- **发布后打 tag**：`publish` 成功后为每个已发布包打 `pkg@version` 形式的 git tag，需 `git push --follow-tags` 推上去
- **发布顺序**：自动按依赖拓扑排序发布，保证被依赖包先上 npm
- **空 changeset**：`changeset --empty` 生成无包 frontmatter 的文件，声明「这次改动无需发版」，给 CI 卡点放行
- **`changeset status`**：列出待发布内容；有改动却无 changeset 时**退出码 1**，是 CI 卡点的关键
- **`status` 参数**：`--since=origin/main` 比对基线、`--output=x.json` 导出 JSON、`--verbose` 显示新版本与链接
- **`changeset tag`**：按当前 `package.json` 版本补打 git tag（version 之后、非 publish 路径发布时用）

## `changeset version` 到底做了什么

这是整个流程里最「重」的一步。执行 `changeset version` 时，它按顺序完成：

1. **收集** `.changeset/` 下所有 changeset 文件；
2. **计算版本**：对每个被提及的包，取所有命中它的 changeset 里**最高的 bump 级别**，在当前版本上递增（遵循 semver）；
3. **联动内部依赖**：如果 monorepo 里 A 依赖 B，而 B 升级了，那么 A 也会被补一个 bump，同时把 A 的 `package.json` 里对 B 的依赖范围更新到新版本（详见 [Monorepo 页](./monorepo.md)）；
4. **写 changelog**：把每个 changeset 的正文，按包归并进对应包的 `CHANGELOG.md`；
5. **删除 changeset**：已消费的 `.changeset/*.md` 被删除——它们的使命已经完成。

### 「取最高级」的合并规则

假设 `@myorg/core` 当前 `1.4.0`，有三个 changeset 分别给它标了 `patch`、`patch`、`minor`：

```
patch + patch + minor  ──►  取最高 minor  ──►  1.5.0
```

如果其中任意一个是 `major`，结果就是 `2.0.0`。**不会**累加（不是「两个 patch = 一个 minor」），只认最高级。

### 产出是「一批改动」，不是「已发布」

`version` 跑完，你的工作区会出现：

- 若干 `package.json` 的 `version` 字段被改；
- 若干 `CHANGELOG.md` 新增条目；
- `.changeset/*.md` 被删除。

**此时什么都还没发布。** 强烈建议把这批 diff 当成一次正常提交去 review——版本号对不对、changelog 通不通顺、有没有意外波及到不该动的包。确认无误后再提交、再 publish。CI 自动化流程（`changesets/action`）正是把这批改动做成一个「Version Packages」PR，让你在 GitHub 上 review。

## `changeset publish`：幂等发布

```bash
pnpm changeset publish
```

它的逻辑非常克制：**逐个包比较「本地 `package.json` 的版本」和「该包在 npm registry 上的最新版本」，只有本地更新的才 `npm publish`。**

- **幂等**：因为判据是「本地比 npm 新」，重复执行不会重复发布——第一次发成功后，本地和 npm 版本一致，再跑就跳过。发布中途失败（比如网络断了发了一半）可以直接重跑，已发的自动跳过。
- **拓扑排序**：多个包会按依赖关系排序发布，保证被依赖的包先上 npm，避免下游装不到依赖。
- **打 tag**：每个成功发布的包会打一个 `包名@版本` 形式的 git tag（如 `@myorg/core@1.5.0`）。注意 `publish` **不会自动 push** 这些 tag，需要：

```bash
git push --follow-tags
```

::: warning `access` 与私有 scope
scoped 包（`@org/pkg`）在 npm 上**默认按私有处理**，直接 publish 会因为没订阅私有仓库而失败。要发公开包，必须在 `config.json` 里设 `"access": "public"`（详见 [配置页](./config.md#access)）。
:::

### `--otp` 与其他常用参数

```bash
pnpm changeset publish --otp=123456   # 开了 2FA 的 npm 账号，传一次性密码
pnpm changeset publish --tag next      # 发到指定 dist-tag（而非 latest），预发布 / snapshot 用
pnpm changeset publish --no-git-tag    # 不打 git tag（snapshot 场景常用）
```

## `changeset tag`：只打 tag 不发布

在某些不走 `changeset publish` 的发布路径（比如用 `npm publish` / `pnpm -r publish` 自己发，或发布非 npm 产物），可以先 `changeset version` 更新版本，再用：

```bash
pnpm changeset tag
```

它按**当前 `package.json` 里的版本**为所有包补打 git tag。前提是 `version` 已经跑过、版本号是最终值。

## 空 changeset：声明「这次不用发版」

不是每个 PR 都需要发版——改文档、调 CI、动测试，这些改动没有面向用户的语义变化。但如果团队用「无 changeset 就卡 CI」的策略（见下），这类 PR 会被卡住。解法是建一个**空 changeset**：

```bash
pnpm changeset --empty
```

它生成一个 frontmatter 为空、不提及任何包的文件：

```md
---
---
```

它会被 `version` 正常消费（但不触发任何版本变更），从而让「必须有 changeset」的检查放行。**语义是「我知道这次不用发版，特此声明」**，比直接关掉检查更可控。

## `changeset status`：CI 卡点的关键

```bash
pnpm changeset status
pnpm changeset status --since=origin/main   # 只看相对 main 的新增改动
pnpm changeset status --verbose             # 展示每个包将升到的新版本 + changeset 链接
pnpm changeset status --output=status.json  # 把结果写成 JSON，供脚本消费
```

它汇报「当前累积的 changeset 会带来哪些发布」。**最关键的行为：当检测到有包发生了改动、却没有对应 changeset 时，`status` 以退出码 1 失败。** 这让它成为 CI 里「强制每个改动都附带发布决策」的守门员：

```yaml
# .github/workflow 里的一步（示意）
- name: 检查是否漏写 changeset
  run: pnpm changeset status --since=origin/main
```

配合前面的「空 changeset」——无需发版的 PR 补一个空 changeset 即可合法放行。

## 与 CI 自动化的衔接

手工 `version` → review → `publish` 的流程，在实践中通常交给 `changesets/action`：它把 `version` 的产出做成「Version Packages」PR，合并该 PR 即触发 `publish`。详见 [预发布与 CI 页](./prerelease-ci.md#changesets-action-合并即发布)。
