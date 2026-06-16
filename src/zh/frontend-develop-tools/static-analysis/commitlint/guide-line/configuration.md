---
layout: doc
outline: [2, 3]
---

# 配置

> 基于 commitlint v21.0.2 编写

## 速查

- 配置文件名（cosmiconfig 解析，任选其一）：`.commitlintrc`、`.commitlintrc.{json,yaml,yml,js,cjs,mjs,ts,cts,mts}`、`commitlint.config.{js,cjs,mjs,ts,cts,mts}`、或 `package.json` 的 `commitlint` 字段
- 顶层字段：`extends` / `rules` / `parserPreset` / `formatter` / `ignores` / `defaultIgnores` / `helpUrl` / `prompt`
- 继承共享配置：`extends: ['@commitlint/config-conventional']`（数组，可继承多个）
- 本地 `rules` 覆盖 `extends` 继承来的同名规则
- 规则写法：`'rule-name': [level, applicable, value]`
- `defaultIgnores: false` 可对 merge / revert / 版本号等提交也强制校验
- `helpUrl` 自定义校验失败时提示的链接

## 配置文件

commitlint 用 [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) 查找配置，支持的文件名（按解析顺序）包括：

- `.commitlintrc`
- `.commitlintrc.json`
- `.commitlintrc.yaml` / `.commitlintrc.yml`
- `.commitlintrc.js` / `.commitlintrc.cjs` / `.commitlintrc.mjs`
- `.commitlintrc.ts` / `.commitlintrc.cts` / `.commitlintrc.mts`
- `commitlint.config.js` / `commitlint.config.cjs` / `commitlint.config.mjs`
- `commitlint.config.ts` / `commitlint.config.cts` / `commitlint.config.mts`
- `package.json` 中的 `commitlint` 字段

最常见的是 `commitlint.config.js`。写进 `package.json` 的内联形式：

```json
{
  "commitlint": {
    "extends": ["@commitlint/config-conventional"]
  }
}
```

## extends：继承共享配置

`extends` 接受一个数组，把外部 npm 包或本地文件导出的配置继承进来：

```js
export default {
  extends: ["@commitlint/config-conventional"],
};
```

可同时继承多个，后续配置与本地 `rules` 递归合并。共享配置的命名约定与发布方式见 [约定与交互式提交](./conventions-and-prompt.md#共享配置-shareable-config)。

## rules：自定义规则

`rules` 用来覆盖或补充继承来的规则。每条规则是 `[level, applicable, value]` 三元组：

```js
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // 只允许这些 scope，给了 scope 但不在列表内就报错
    "scope-enum": [2, "always", ["api", "ui", "docs"]],
    // 放宽首行长度到 100
    "header-max-length": [2, "always", 100],
    // 关闭对 subject 大小写的限制
    "subject-case": [0],
  },
};
```

- `level`：`0` 关闭 / `1` 警告 / `2` 错误
- `applicable`：`'always'`（必须满足）或 `'never'`（绝不允许，把条件反转）
- `value`：比较值（部分规则不需要）

::: tip 本地 rules 优先
`extends` 提供基线，本地 `rules` 中的同名规则会覆盖它。这让你能沿用 config-conventional 的同时，针对性微调个别规则。
:::

规则全清单与 config-conventional 默认值见 [规则](./rules.md)。

## parserPreset：自定义解析

`parserPreset` 决定如何把一条原始 commit message 拆成 `type` / `scope` / `subject` / `body` / `footer`。规则都是在解析出的这些字段上判定的，所以解析方式直接影响校验结果。可传 npm 包名或带 `parserOpts` 的对象：

```js
export default {
  extends: ["@commitlint/config-conventional"],
  parserPreset: {
    parserOpts: {
      // 自定义 header 的解析正则
      headerPattern: /^(\w*)(?:\((.*)\))?!?: (.*)$/,
      headerCorrespondence: ["type", "scope", "subject"],
    },
  },
};
```

## ignores 与 defaultIgnores

- `ignores`：一个函数数组，返回 `true` 则对该条消息跳过校验。
- `defaultIgnores`：布尔，是否启用内置忽略（默认对 merge 提交、revert 提交、版本号提交等自动跳过）。设为 `false` 可强制对所有提交都校验。

```js
export default {
  extends: ["@commitlint/config-conventional"],
  // 跳过以 "WIP" 开头的提交
  ignores: [(message) => message.startsWith("WIP")],
  // 关掉内置忽略，连 merge/revert 也要校验
  defaultIgnores: false,
};
```

## formatter 与 helpUrl

- `formatter`：指定结果输出格式所用的包，默认 `@commitlint/format`。
- `helpUrl`：校验失败时在报错信息里附带的帮助链接，方便引导成员查团队提交规范。

```js
export default {
  extends: ["@commitlint/config-conventional"],
  helpUrl: "https://your-team.example.com/commit-guide",
};
```

## prompt

`prompt` 字段供 `@commitlint/cz-commitlint` 等交互式工具读取，控制「按问答生成提交信息」时的 settings / messages / questions。详见 [约定与交互式提交](./conventions-and-prompt.md#交互式提交-prompt)。

字段与默认值的完整速查见 [参考](../reference.md)。
