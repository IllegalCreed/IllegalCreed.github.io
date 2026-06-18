---
layout: doc
outline: [2, 3]
---

# 发布标签与 API 报告评审工作流

> 基于 @microsoft/api-extractor 7.58.9 编写

## 速查

- 发布标签是 4 个 TSDoc 修饰标签：`@public` / `@beta` / `@alpha` / `@internal`，标记单个 API 成员的**支持级别**
- 官方强调："beta" 描述的是 **individual API members** 的级别，不是整个发布分支的成熟度
- rollup 按标签裁剪，三档累积：`publicTrimmedFilePath`(仅 @public) ⊂ `betaTrimmedFilePath`(+@beta) ⊂ `alphaTrimmedFilePath`(+@alpha)，`untrimmedFilePath` 含全部
- `@internal` 在对外档（public/beta/alpha）里都会被裁掉
- 缺标签 → `ae-missing-release-tag`；标多个 → `ae-extra-release-tag`
- 评审工作流：`.api.md` 进 Git → 改代码 → 本地 `--local` 自动更新报告 → 提交 → CI（不带 `--local`）比对，不一致即失败

## 四个发布标签

它们是 TSDoc **修饰标签**（只表标记、内容为空），贴在导出成员上表达其发布成熟度：

| 标签 | 含义 | 对外承诺 |
| --- | --- | --- |
| `@public` | 正式公共 API | 是，破坏要升 major |
| `@beta` | 公开但仍可能变 | 部分 |
| `@alpha` | 早期预览 | 否 |
| `@internal` | 内部实现 | 否，不对外 |

官方原话（configure_rollup）：“instead of 'beta' referring to the readiness of an entire release branch, we're using 'beta' to describe the support level for _individual API members_.” 即同一个稳定发布里可以**混有** `@public` 与 `@beta` 成员，rollup 按**成员粒度**裁剪。

```ts
/**
 * 绘制组件。
 * @param ctx - 渲染上下文
 * @public
 */
export function draw(ctx: Context): void {}

/** @internal 内部缓存，不对外承诺 */
export function _cache(): void {}
```

## rollup 裁剪三档

按发布标签产出不同范围的声明，越往 alpha 放得越宽（累积关系）：

| 字段 | 含哪些标签 | 用途 |
| --- | --- | --- |
| `publicTrimmedFilePath` | 仅 `@public` | 对外发布给用户 |
| `betaTrimmedFilePath` | `@public` + `@beta` | beta 渠道 |
| `alphaTrimmedFilePath` | `@public` + `@beta` + `@alpha` | 早期预览渠道 |
| `untrimmedFilePath` | 全部（含 `@internal`） | 内部 / 测试 / 其它内部包消费 |

所以一个标 `@internal` 的成员，在 public/beta/alpha 档里都会被**裁掉**，只有 `untrimmedFilePath` 保留它——这正是"对外只暴露你愿意承诺的公共面"。

## 标签相关的两条诊断

- `ae-missing-release-tag`：导出成员**缺发布标签**。裁剪 / 报告分级都靠标签判断等级，缺则提醒补标签（或在配置里设默认）
- `ae-extra-release-tag`：一个成员标了**多个**发布标签（如 `@public` 又 `@beta`），语义冲突，提示去掉多余的

想强制"每个公共导出都必须带发布标签否则 CI 失败"，把 `ae-missing-release-tag` 的 `logLevel` 设为 `error`，并在 CI 不带 `--local` 跑即可。

## API 报告评审工作流（完整闭环）

1. 改了公共 API（增删改导出 / 改签名）
2. 本地跑 `api-extractor run --local`
3. AE 检测到变化，**自动更新** `etc/*.api.md`
4. 把代码 + 更新后的 `.api.md` **一起提交**进 PR
5. 评审者看 `.api.md` 的 **diff**，判断变更是否可接受、是否要升 major
6. CI 跑 `api-extractor run`（**不带** `--local`）做最终比对：
   - 报告与代码**一致** → 通过
   - **不一致** → 构建失败，提示把 `temp/*.api.md` 复制到 `etc/*.api.md`

- **本地**（带 `--local`）：检测到 API 变化时自动把新报告复制到 `etc/`，提示 `You have changed the Public API signature ... Updating 'etc/...api.md'`
- **CI**（不带 `--local`）：报告与代码不一致即**失败**，提示 `Please copy the file "temp/...api.md" to "etc/...api.md", or perform a local build (which does this automatically)`
- rushstack 仓库用 `.github/CODEOWNERS` 要求 API 变更时由指定人员审批——把 API 评审制度化

::: warning "build 成功 ≠ 没有破坏性变更"
门禁生效**取决于**：`.api.md` 已提交进 Git，且 CI **不带** `--local`。若 CI 误加 `--local`（关校验 + 自动覆写报告）或没开 `apiReport`，则 API 变了也可能照过。
:::

下一步：[配合 TSDoc + api-documenter](./tsdoc-and-documenter.md) · [速查参考](../reference.md)
