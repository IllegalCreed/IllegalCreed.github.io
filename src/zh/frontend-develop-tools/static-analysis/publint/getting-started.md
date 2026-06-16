---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 publint v0.3.21 编写

## 速查

- 网页版（零安装）：打开 [publint.dev](https://publint.dev)，粘贴包名 / npmjs.com 链接 / pkg.pr.new 链接
- 本地装：`npm install --save-dev publint`，脚本 `"lint:package": "publint"`
- 直接跑：`npx publint`（默认检查当前目录）/ `npx publint ./packages/my-lib`（指定目录）
- 检查 tarball：`npx publint ./my-lib-1.0.0.tgz`
- **先 build 再 publint**：检查的是「将发布的产物」，产物没生成会误报文件缺失
- 三档级别：`error`（须修）/ `warning`（潜在问题）/ `suggestion`（最佳实践）
- 过滤显示：`publint --level warning`（默认 `suggestion`，即全显示）
- 严格模式：`publint --strict`（把 warning 也当作 error，CI 常用）
- 打包来源：`publint --pack <auto|npm|yarn|pnpm|bun|false>`（默认 `auto`）
- 环境：Node.js **>= 18**，自身是 ESM 包；不支持 yarn 1
- 搭档：`@arethetypeswrong/cli`（attw）补足类型解析检查，官方建议两个一起跑

## publint 是什么

publint 是一个 **npm 包的 linter**，校验「包发布出去后能否在尽可能广的环境被正确解析」。它检查的是你 `npm publish` 出去、别人 `npm install` 拿到的那份东西：`package.json` 的入口字段是否正确、指向的文件是否真实存在、ESM/CJS 能否互通、类型能否被 TypeScript 找到。

它面向的是**库/包作者的发布前检查**，不是应用业务代码的 lint——后者是 ESLint/oxlint 的职责。

## 最快上手：网页版

不想装任何东西时，直接打开 [publint.dev](https://publint.dev)，粘贴：

- 一个 npm 包名（如 `vue`）
- 一个 npmjs.com 链接
- 一个 pkg.pr.new 预览链接

它会在浏览器的 Web Worker 里下载该包的 tarball 并就地分析，秒出报告。适合快速体检第三方包，或自己刚发布的版本。

## 本地安装与运行

作为开发依赖装进库项目：

```bash
npm install --save-dev publint
```

也支持 pnpm / yarn / bun。在库根目录直接跑：

```bash
# 检查当前目录的包
npx publint

# 检查 monorepo 里的某个子包
npx publint ./packages/my-lib

# 直接检查一个已经 npm pack 出来的 tarball
npx publint ./my-lib-1.0.0.tgz
```

把它加进脚本，便于在 CI/发布流程里复用：

```json
// package.json
{
  "scripts": {
    "lint:package": "publint"
  }
}
```

::: warning 一定要在 build 之后跑
publint 检查的是「将要发布的文件」。如果还没生成 `dist` 等产物就跑，`exports`/`main` 指向的文件还不存在，会误报 `FILE_DOES_NOT_EXIST`。所以应当 **先构建、再 publint**，常把它放在 `prepublishOnly` 或 release 工作流里。
:::

## 看懂报告：三个级别

publint 的每条消息分三档：

| 级别         | 含义                                       |
| ------------ | ------------------------------------------ |
| `error`      | 很可能导致某些环境无法解析，应当修复       |
| `warning`    | 潜在兼容问题或不推荐的写法                 |
| `suggestion` | 最佳实践提示（如补 `license`、`files`）    |

用 `--level` 收敛输出，用 `--strict` 收紧失败判定：

```bash
# 只看 warning 和 error，忽略 suggestion
npx publint --level warning

# 把 warning 也当作错误，让 CI 失败
npx publint --strict
```

::: tip 退出码语义
默认情况下，只有 `error` 级问题会让 publint 以非零退出码失败。`--strict` 会把 `warning` 也算作失败；而 `--level` 只影响「显示哪些」，不改变失败判定。
:::

## 一个典型问题：exports 条件顺序

publint 最常报的问题之一是 `exports` 里条件顺序不对。条件是**按书写顺序匹配**的，因此：

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

- `types` 要放**最前**（否则 TS 可能先命中 JS 条件、拿不到类型）
- `default`（若有）要放**最后**（作为兜底，放前面会抢先命中）
- `module` 若与 `require` 并存，`module` 应在 `require` 之前

详见 [检查项详解](./guide-line/checks-explained.md)。

## 和 attw 搭配

publint 用自己的静态分析查发布正确性（覆盖面不止 `package.json`），而 `@arethetypeswrong/cli`（attw）借助 TypeScript 编译器在各 `moduleResolution` 下查类型解析问题。二者互补，官方建议发布前**两个都跑**。详见 [搭配 are-the-types-wrong](./guide-line/with-arethetypeswrong.md)。
