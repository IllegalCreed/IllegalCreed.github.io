---
layout: doc
outline: [2, 3]
---

# 规则与预设

> 基于 Secretlint v13.0.2 编写

## 速查

- 规则即独立 npm 包，命名 `@secretlint/secretlint-rule-<name>`，**无内置规则**
- 推荐：`@secretlint/secretlint-rule-preset-recommend`，一次性挂上 15 条常用规则
- recommend 含：`aws`/`gcp`/`privatekey`/`npm`/`basicauth`/`slack`/`sendgrid`/`shopify`/`github`/`openai`/`anthropic`/`linear`/`1password`/`database-connection-string`/`filter-comments`
- 预设**不含**的可选规则：`pattern`（自定义正则）/`no-dotenv`/`no-homedir`/`no-k8s-kind-secret`/`secp256k1-privatekey`/`azure`/`gcp` 之外的厂商等
- 自定义模式：装 `@secretlint/secretlint-rule-pattern`，用正则匹配私有密钥格式
- 自写规则：一条规则就是一个 npm 包，`npm run gen:rule` 起步（见官方 secretlint-rule 文档）
- 「规则即文档」：每条规则都有文档解释「为什么这是密钥」，终端报错可点链接跳转

## 规则是独立的包

Secretlint 把每类凭据的检测做成单独的 npm 包，命名规范是 `@secretlint/secretlint-rule-<name>`。这与它的 **opt-in** 哲学一致：你装什么、写什么，才检查什么，避免默认一堆规则带来的误报。

## recommend 预设

绝大多数项目直接用官方推荐预设即可：

```bash
npm install -D @secretlint/secretlint-rule-preset-recommend
```

```json
{
  "rules": [{ "id": "@secretlint/secretlint-rule-preset-recommend" }]
}
```

它打包了以下 **15 条**规则：

| 类别       | 规则包                                                              |
| ---------- | ------------------------------------------------------------------ |
| 云厂商     | `aws`、`gcp`                                                        |
| 平台 Token | `github`、`slack`、`sendgrid`、`shopify`                            |
| AI / SaaS  | `openai`、`anthropic`、`linear`、`1password`                       |
| 通用密钥   | `privatekey`、`basicauth`、`database-connection-string`            |
| 工具       | `npm`、`filter-comments`（提供 `secretlint-disable` 注释忽略能力） |

::: tip filter-comments 已包含在内
recommend 预设已内置 `filter-comments`，所以用了 recommend 就能直接用 `secretlint-disable` 注释，无需单独安装。
:::

## 预设之外的可选规则

仓库还提供一批**不在** recommend 预设里的规则，按需单独安装并加入 `rules`：

| 规则包                          | 用途                                       |
| ------------------------------- | ------------------------------------------ |
| `pattern`                       | 用自定义正则匹配任意密钥格式               |
| `no-dotenv`                     | 禁止提交 `.env` 文件                       |
| `no-homedir`                    | 检测泄露的家目录绝对路径                    |
| `no-k8s-kind-secret`            | 检测 Kubernetes `kind: Secret` 资源        |
| `secp256k1-privatekey`          | 检测 secp256k1 私钥（区块链常见）          |
| `azure`                         | Azure 凭据                                 |

## 用 pattern 规则匹配私有密钥

公司内部往往有自定义格式的密钥（如 `MYCORP_xxxxx`）。`@secretlint/secretlint-rule-pattern` 让你用正则自定义检测：

```json
{
  "rules": [
    {
      "id": "@secretlint/secretlint-rule-pattern",
      "options": {
        "patterns": [
          {
            "name": "MyCorp Internal Token",
            "pattern": "/MYCORP_[A-Za-z0-9]{32}/"
          }
        ]
      }
    }
  ]
}
```

## 「规则即文档」

Secretlint 的一个设计哲学是「规则即文档」（Rule as Documentation）——每条规则都必须有文档说明**为什么**某段内容被判定为密钥。这样做：

- 降低误报：写不出合理理由的「规则」只是主观偏好，不该报错
- 提升可解释性：终端支持超链接，报错的 messageId 可直接点开跳到该规则的说明页

## 自定义规则

一条 Secretlint 规则本身就是一个 npm 包，你可以为团队的特定密钥格式写专属规则。仓库提供 `npm run gen:rule` 脚手架起步，具体 API 见官方 [secretlint-rule 文档](https://github.com/secretlint/secretlint/blob/master/docs/secretlint-rule.md)。

类型与脱敏等机制的细节见 [配置](./configuration.md) 与 [参考](../reference.md)。
