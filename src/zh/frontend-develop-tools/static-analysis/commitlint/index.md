---
layout: doc
---

# commitlint

校验 Git 提交信息（commit message）是否符合约定格式的 Linter，默认对接 Conventional Commits（`type(scope): subject`），让团队的提交历史保持一致、可被工具消费。

## 评价

### 优点

- 专注单一职责：只校验「提交信息」这一文本制品，规则清晰、心智负担低
- 开箱即用：装上 `@commitlint/cli` + `@commitlint/config-conventional`，写一行 `extends` 即可强制约定式提交
- 规则可精调：`[level, applicable, value]` 三元组语义与 ESLint 一致，单条规则可放宽或收紧
- 生态完善：共享配置（`commitlint-config-*`）、交互式提交（`@commitlint/prompt-cli` / `cz-commitlint`）、CI 校验一应俱全
- 与 husky / lint-staged 等工程化工具配合顺滑，本地 + CI 双层门禁

### 缺点

- 本身不生成 changelog、不升版本号——那是 semantic-release / standard-version 等下游工具的事
- 本地钩子可被 `git commit --no-verify` 绕过，必须辅以 CI 校验才能真正兜底
- 只规范「格式」，无法保证提交信息「内容」的真实与有意义
- 跨大版本（如 v21 输出格式变更、husky v8→v9 命令变更）对接时需留意差异

## 文档地址

[commitlint](https://commitlint.js.org/)

## GitHub地址

[conventional-changelog/commitlint](https://github.com/conventional-changelog/commitlint)

## 幻灯片地址

<a href="/SlideStack/commitlint-slide/" target="_blank">commitlint</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=commitlint" target="_blank" rel="noopener noreferrer">commitlint 测试题</a>
