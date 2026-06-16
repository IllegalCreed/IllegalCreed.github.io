---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Secretlint v13.0.2 编写

## 速查

- 安装：`npm install -D secretlint @secretlint/secretlint-rule-preset-recommend`（需 Node.js 20+）
- 生成配置：`npx secretlint --init` → `.secretlintrc.json`
- 运行：`npx secretlint "**/*"` —— **glob 必须用双引号包裹**（否则被 shell 提前展开）
- 一条命令体验（免配置）：`npx @secretlint/quick-start "**/*"`
- Docker（免配置、内置 recommend）：`docker run -v $(pwd):$(pwd) -w $(pwd) --rm secretlint/secretlint secretlint "**/*"`
- 无内置规则：装规则包并写进 `.secretlintrc` 的 `rules` 才生效
- 退出码：`0` 干净 / `1` 发现密钥 / `2` 致命错误
- 默认脱敏：错误信息中的密钥会被 mask，`--no-maskSecrets` 显示原值
- pre-commit：Husky + lint-staged，`"*": ["secretlint --no-glob"]`
- 忽略：`.secretlintignore`（同 `.gitignore` 语法）/ `secretlint-disable` 注释 / `allowMessageIds`

## 安装

Secretlint 用 JavaScript 编写，需要 **Node.js 20+**。推荐作为开发依赖安装本体与 recommend 预设：

```bash
npm install -D secretlint @secretlint/secretlint-rule-preset-recommend
```

::: warning 必须装规则包
Secretlint **没有内置规则**。只装 `secretlint` 本体不会检测任何东西——必须额外安装规则包（如上面的 `preset-recommend`）并在配置里声明，否则扫描结果永远为空。
:::

不想装到项目里，也可以一条命令直接试跑（内置 recommend 预设）：

```bash
npx @secretlint/quick-start "**/*"
```

## 生成配置并运行

安装后先生成配置文件：

```bash
npx secretlint --init
```

会在项目根写出 `.secretlintrc.json`，默认挂上 recommend 预设：

```json
{
  "rules": [
    {
      "id": "@secretlint/secretlint-rule-preset-recommend"
    }
  ]
}
```

然后扫描整个项目：

```bash
npx secretlint "**/*"
```

::: tip glob 要用双引号
Secretlint 自己处理 glob（基于 micromatch），所以 `"**/*"` 必须用双引号包裹，避免被 shell 提前展开成一长串文件名。
:::

发现密钥时输出类似：

```
SECRET.txt
  1:8  error  [AWSSecretAccessKey] found AWS Secret Access Key  @secretlint/secretlint-rule-aws

✖ 1 problem (1 error, 0 warnings)
```

并以非零退出码结束（`1` = 发现密钥，CI 据此失败）。

## Docker 运行（零配置）

项目用 Docker、或想完全免安装时，官方镜像内置了 recommend 预设：

```bash
docker run -v $(pwd):$(pwd) -w $(pwd) --rm secretlint/secretlint secretlint "**/*"
```

镜像内置 `preset-recommend`、`pattern`、`sarif` formatter，开箱即用。

## 默认脱敏

Secretlint **默认对错误信息里的密钥脱敏**（打码），避免它在 CI 日志、终端输出或 AI 工具上下文中被二次暴露。需要查看原始值时显式关闭：

```bash
npx secretlint --no-maskSecrets "**/*"
```

## 接入 pre-commit

因为定位是「提交前拦截」，Secretlint 最典型的用法是 Git 钩子。Node.js 项目用 Husky + lint-staged：

```json
// package.json
{
  "lint-staged": {
    "*": ["secretlint --no-glob"]
  }
}
```

::: warning lint-staged 要加 --no-glob
lint-staged 已经把暂存的文件名传给命令了，此时要加 `--no-glob`，让 Secretlint 直接处理这些文件名而非再做 glob 匹配。
:::

详见 [集成 pre-commit 与 CI](./guide-line/integration.md)。

## 接入 CI

GitHub Actions 里全量扫描，发现密钥即让流水线失败：

```yaml
- run: npm ci
- run: npx secretlint "**/*"
```

本地 pre-commit + CI 双保险：本地漏掉的，CI 兜底拦下。
