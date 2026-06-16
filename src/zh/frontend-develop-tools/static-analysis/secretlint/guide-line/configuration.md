---
layout: doc
outline: [2, 3]
---

# 配置

> 基于 Secretlint v13.0.2 编写

## 速查

- 配置文件：`.secretlintrc.{json,yml,yaml,js}`（`secretlint --init` 生成）
- 核心结构：顶层 `rules` 数组，每项用 `id` 指定规则包名
- 规则三个通用字段：`options`（规则选项）/ `disabled`（关闭）/ `allowMessageIds`（按 messageId 抑制）
- 预设里改某条规则：在预设项内再写 `rules` 嵌套覆盖（不能直接平铺在顶层）
- 忽略文件：`.secretlintignore`（同 `.gitignore` 语法，`!` 取反）
- 默认忽略：`**/.git/**`、`**/node_modules/**`、`.secretlintrc.*`、`.secretlintignore*`
- 复用 ignore：`secretlint --secretlintignore .gitignore "**/*"`
- 注释忽略：`secretlint-disable` / `-enable` / `-disable-line` / `-disable-next-line`（由 `filter-comments` 规则提供，recommend 已含）
- 指定配置：`--secretlintrc <path>`；免文件：`--secretlintrcJSON '<json>'`

## 配置文件

Secretlint 支持 `.secretlintrc.json`、`.secretlintrc.yml`、`.secretlintrc.yaml`、`.secretlintrc.js` 四种格式，放在项目根目录。最常见的是 JSON：

```json
{
  "rules": [
    {
      "id": "@secretlint/secretlint-rule-preset-recommend"
    }
  ]
}
```

顶层只有一个 `rules` 数组，每个元素的 `id` 是规则包（或预设包）的 npm 名称。

::: warning 没有内置规则
`rules` 为空时 Secretlint 不检查任何东西。每条规则都必须先 `npm install` 安装对应包，再写进 `rules`。
:::

## 规则的通用配置字段

`rules` 数组里每一项除了 `id`，还支持三个通用字段：

| 字段              | 作用                                                         |
| ----------------- | ------------------------------------------------------------ |
| `options`         | 规则的选项对象，具体可选项见各规则文档（如 `allows` 忽略名单）|
| `disabled`        | 设为 `true` 关闭该规则                                       |
| `allowMessageIds` | 一个 messageId 数组，抑制对应类型的告警                      |

### options：规则选项

很多规则支持 `allows`——一个 [RegExp-like String](https://github.com/textlint/regexp-string-matcher#regexp-like-string) 列表，命中的内容会被忽略：

```json
{
  "rules": [
    {
      "id": "@secretlint/secretlint-rule-example",
      "options": {
        "allows": ["/dummy_secret/i"]
      }
    }
  ]
}
```

### allowMessageIds：按 messageId 抑制

每条规则的报错都带一个 messageId（如 AWS 规则的 `AWSAccountID`、`AWSAccessKeyID`）。想放行某一类告警时：

```json
{
  "rules": [
    {
      "id": "@secretlint/secretlint-rule-example",
      "allowMessageIds": ["EXAMPLE_MESSAGE"]
    }
  ]
}
```

## 在预设里覆盖单条规则

这是最易踩坑的一点：当你用的是**预设**（如 `preset-recommend`），想给预设里的某条规则配 `options` 或 `allowMessageIds`，必须在预设项内部再写一个 `rules` 数组嵌套，而**不能**把那条规则平铺到顶层。

```json5
{
  "rules": [
    {
      "id": "@secretlint/secretlint-rule-preset-recommend",
      // 在预设内部用嵌套 rules 覆盖其中某条规则
      "rules": [
        {
          "id": "@secretlint/secretlint-rule-aws",
          "allowMessageIds": ["AWSAccountID", "AWSAccessKeyID"]
        }
      ]
    }
  ]
}
```

## 忽略文件：.secretlintignore

在项目根放 `.secretlintignore`，每行一个 glob，语法与 `.gitignore` 完全一致：

```text
# 注释行以 # 开头
**/*.js
config/*.pem

# ! 取反：重新纳入此前被忽略的文件
!keep/this.pem
```

要点：

- 路径相对当前工作目录，**必须用正斜杠** `/`（即便在 Windows）
- 行为遵循 [`.gitignore` 规范](https://git-scm.com/docs/gitignore)

### 默认已忽略

Secretlint 默认忽略以下路径，无需手动写：

```
**/.git/**
**/node_modules/**
**/.secretlintrc/**
**/.secretlintrc.{json,yaml,yml,js}/**
**/.secretlintignore*/**
```

### 复用 .gitignore

因为格式相同，可以直接拿 `.gitignore` 当忽略文件：

```bash
secretlint --secretlintignore .gitignore "**/*"
```

## 用注释忽略

`@secretlint/secretlint-rule-filter-comments` 提供注释级忽略（recommend 预设已内置，无需单独装）。四个指令：

| 指令                          | 作用             |
| ----------------------------- | ---------------- |
| `secretlint-disable`          | 从此处起禁用     |
| `secretlint-enable`           | 重新启用         |
| `secretlint-disable-line`     | 忽略当前行       |
| `secretlint-disable-next-line`| 忽略下一行       |

```js
/* secretlint-disable */
const FAKE_TOKEN = "ghp_thisIsJustAnExample";
/* secretlint-enable */

// 也可只针对某条规则
// secretlint-disable @secretlint/secretlint-rule-github -- 这是文档示例
```

注释里 `--` 之后是说明文字。把 `/* secretlint-disable */` 放在文件顶部即可忽略整个文件。

更完整的规则与预设介绍见 [规则与预设](./rules-and-presets.md)，字段速查见 [参考](../reference.md)。
