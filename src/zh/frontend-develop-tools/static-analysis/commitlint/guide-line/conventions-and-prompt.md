---
layout: doc
outline: [2, 3]
---

# 约定与交互式提交

> 基于 commitlint v21.0.2 编写

## 速查

- 提交格式：`type(scope): subject` + 可选 body / footer（各部分空行分隔）
- 常见 type：`feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `build` / `ci` / `chore` / `revert`
- 破坏性变更：type 后加 `!`（`feat!:`），或 footer 写 `BREAKING CHANGE:` —— 驱动主版本（major）升级
- 多 scope：默认分隔符 `/`、`\`、`,`（如 `feat(api,ui): ...`）
- 共享配置命名：`commitlint-config-*` 或 `@scope/commitlint-config`；`extends: ['x']` 自动补成 `commitlint-config-x`
- 交互式提交：`@commitlint/prompt-cli`（独立命令）或 `@commitlint/cz-commitlint`（commitizen 适配器）
- 交互问答内容由配置里的 `prompt` 字段（settings / messages / questions）驱动

## Conventional Commits 锚点

commitlint 默认对接 Conventional Commits。一条提交的解剖：

```text
<type>(<scope>): <subject>
<空行>
<body>
<空行>
<footer>
```

- **type**：变更类别，给提交「语义」。下游工具据此生成 changelog、决定版本号。
- **scope**：可选，标注影响范围（如 `api`、`router`）。
- **subject**：简短描述，默认小写开头、不以句号结尾。
- **body**：可选的详细说明。
- **footer**：可选的元信息（如破坏性变更、issue 引用）。

常见 type 含义：

| type       | 含义                         |
| ---------- | ---------------------------- |
| `feat`     | 新功能                       |
| `fix`      | 修复缺陷                     |
| `docs`     | 仅文档                       |
| `style`    | 不影响语义的格式调整         |
| `refactor` | 既非新增也非修复的重构       |
| `perf`     | 性能优化                     |
| `test`     | 增删测试                     |
| `build`    | 构建系统或依赖变更           |
| `ci`       | CI 配置变更                  |
| `chore`    | 杂项（不改 src/test）        |
| `revert`   | 回滚先前提交                 |

## 为什么要约定式提交

把提交信息结构化，能让工具「读懂」历史：

- 自动生成丰富的 **changelog**（按 type 分组）
- 依据提交类型**自动升版本号**（fix → patch，feat → minor，破坏性 → major）
- 便于按类型筛选、做发布过滤

commitlint 的角色是**入口守门**——保证喂给这些工具的提交信息格式正确。

## 破坏性变更（BREAKING CHANGE）

两种标记方式：

```text
# 方式一：type/scope 后加 !
feat(api)!: drop support for v1 endpoint

# 方式二：footer 写 BREAKING CHANGE:
feat(api): rework auth

BREAKING CHANGE: the auth header format has changed
```

commitlint 的 `breaking-change-exclamation-mark` 规则可校验「`!` 与 footer 中 `BREAKING CHANGE` 的一致性」。破坏性变更会驱动下游工具做主版本（major）升级。

## 多 scope

一条提交可标注多个 scope，默认分隔符是 `/`、`\` 和 `,`：

```text
feat(api,ui): unify error toast
```

是否启用多 scope、以及分隔符风格，可由 `scope-delimiter-style` 等规则约束。交互式提交里则由 `prompt.settings.enableMultipleScopes` 控制。

## 共享配置（shareable config）

把一套规则发布成 npm 包供多项目复用，就是共享配置。它最常导出一个含 `.rules`（及可选 `parserPreset` 等）的对象：

```js
// commitlint-config-acme/index.js
export default {
  rules: {
    "scope-enum": [2, "always", ["web", "app", "infra"]],
  },
};
```

命名约定：

- 普通包：`commitlint-config-*`（如 `commitlint-config-acme`）
- 作用域包：`@scope/commitlint-config`

`extends` 会自动补全前缀——`extends: ['acme']` 解析为 `commitlint-config-acme`，`extends: ['@acme']` 解析为 `@acme/commitlint-config`。官方维护的有 `@commitlint/config-conventional`、`@commitlint/config-angular`、`@commitlint/config-lerna-scopes` 等。

## 交互式提交（prompt）

「先写后校验」体验不佳，commitlint 生态提供「边问边填」的交互式提交：

- `@commitlint/prompt-cli`：独立的交互式命令。
- `@commitlint/cz-commitlint`：作为 [commitizen](https://github.com/commitizen/cz-cli) 的适配器，配 `git cz` 使用。

安装（含 commitizen 适配器路线）：

```bash
npm install -D @commitlint/cli @commitlint/config-conventional @commitlint/cz-commitlint commitizen
```

在 `package.json` 指定 commitizen 适配器：

```json
{
  "config": {
    "commitizen": {
      "path": "@commitlint/cz-commitlint"
    }
  }
}
```

之后用 `npx cz`（或 `git cz`）即可逐步问 type / scope / subject / body / 是否破坏性变更等，按你的 commitlint 规则生成合规消息。

交互问答的内容由配置里的 `prompt` 字段驱动：

```js
export default {
  extends: ["@commitlint/config-conventional"],
  prompt: {
    settings: {
      enableMultipleScopes: true,
      scopeEnumSeparator: ",",
      useExclamationMark: true, // 破坏性变更时在 type 后加 !
    },
    messages: {
      skip: "（回车跳过）",
      max: "最多 %d 字符",
      min: "至少 %d 字符",
    },
  },
};
```

- `settings`：多 scope、分隔符、感叹号等开关
- `messages`：各步提示文案（可本地化）
- `questions`：自定义 `header` / `type` / `scope` / `subject` / `body` / `isBreaking` 等步骤

::: tip prompt 不替代校验
交互式工具帮你「生成」合规消息，但 commitlint 的 `commit-msg` 校验仍是兜底。二者互补：prompt 改善体验，校验保证底线。
:::
