---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 commitlint v21.0.2 编写

## 速查

- 安装：`npm install -D @commitlint/cli @commitlint/config-conventional`（也支持 pnpm/yarn/bun）
- 配置：项目根建 `commitlint.config.js`，内容 `export default { extends: ['@commitlint/config-conventional'] };`
- 试跑（stdin）：`echo 'foo: bar' | npx commitlint` —— `foo` 非合法 type，会报错
- 用默认规则跑：`echo 'feat: x' | npx commitlint --default-config`
- 接入本地：husky v9 → `npm i -D husky` + `npx husky init`，在 `.husky/commit-msg` 写 `npx --no -- commitlint --edit $1`
- 接入 CI：push 用 `npx commitlint --last --verbose`；PR 用 `npx commitlint --from <base> --to <head> --verbose`
- 提交格式：`type(scope): subject`，如 `feat(api): add login`
- 边界：commitlint 校验**消息**，husky 管**钩子**，lint-staged 调度**暂存文件**，三者分工

## 安装

commitlint 由「命令行本体」和「规则集」两部分组成，官方推荐一起装：

```bash
npm install -D @commitlint/cli @commitlint/config-conventional
```

- `@commitlint/cli`：提供 `commitlint` 命令（引擎）
- `@commitlint/config-conventional`：把 Conventional Commits 规范翻译成一组规则（被 `extends` 引用）

也支持 pnpm / yarn / bun / deno：

```bash
pnpm add -D @commitlint/cli @commitlint/config-conventional
```

::: tip 只有 CLI 不够
单装 `@commitlint/cli` 等于有引擎没规则。必须再 `extends` 一个 `config-*`（或自己写 `rules`）才会真正校验。
:::

## 写配置文件

在项目根创建 `commitlint.config.js`，最小内容就是继承官方约定式规则集：

```js
export default { extends: ["@commitlint/config-conventional"] };
```

CommonJS 项目可写成 `module.exports = { extends: ["@commitlint/config-conventional"] };`。

::: warning Node v24 的模块加载坑
Node v24 改变了模块加载方式。若项目根没有 `package.json`，`commitlint.config.js` 可能加载失败。解决：给项目加一个声明了 `"type": "module"` 的 `package.json`，或把配置文件改名为 `commitlint.config.mjs`。
:::

配置可放在多种文件名里（`.commitlintrc.json`、`commitlint.config.ts`……），也可写进 `package.json` 的 `commitlint` 字段。全貌见 [配置](./guide-line/configuration.md)。

## 验证是否生效

commitlint 默认从标准输入读取待校验文本，用管道喂入即可：

```bash
# 不合法：foo 不是约定的 type，应当报错
echo 'foo: bar' | npx commitlint

# 合法：feat 是合法 type，应当通过
echo 'feat: add login' | npx commitlint
```

没装配置文件、想直接用内置约定式规则试，可加 `--default-config`：

```bash
echo 'feat: add login' | npx commitlint --default-config
```

::: tip 合法时为什么没输出
自 v8 起，commitlint 在提交**合法**时默认静默（无输出）。想看到「通过」之类正向反馈，加 `--verbose`。
:::

## 一条合法提交长什么样

commitlint 默认校验的是 Conventional Commits 格式：

```text
type(scope): subject

body（可选，与 header 间空一行）

footer（可选，与 body 间空一行）
```

例如：

```text
feat(api): add login endpoint
```

- `type`：变更类型，须是约定枚举之一（feat / fix / docs / …）
- `scope`：可选，影响范围（如 `api`、`ui`）
- `subject`：简短描述，默认须小写开头、不以句号结尾

类型、大小写、长度等具体约束见 [规则](./guide-line/rules.md)。

## 接入本地提交（husky）

把 commitlint 挂到 husky 的 `commit-msg` 钩子上，提交时自动校验。下例基于 **husky v9**：

```bash
npm install -D husky
npx husky init
```

然后让 `.husky/commit-msg` 文件包含这一行：

```bash
npx --no -- commitlint --edit $1
```

- `--edit $1`：读取 Git 传入的提交信息文件（`$1` 是消息文件路径）并校验
- `npx --no`：禁止 npx 在本地找不到时去远程下载

::: warning husky 版本差异
v9 用 `npx husky init`，v8 及更早用 `npx husky install`。commitlint 文档按 `husky@v9` 给示例，旧版请查对应版本文档。
:::

husky 与 commitlint 的职责边界、为什么本地校验还不够，详见 [集成 husky 与 CI](./guide-line/integration-husky.md)。

## 接入 CI

本地钩子可被 `git commit --no-verify` 跳过，因此还需在 CI 兜底：

```bash
# push 事件：只校验最后一次提交
npx commitlint --last --verbose

# Pull Request：校验一段提交范围
npx commitlint --from <base-sha> --to <head-sha> --verbose
```

GitHub Actions / GitLab 的完整示例见 [集成 husky 与 CI](./guide-line/integration-husky.md)。
