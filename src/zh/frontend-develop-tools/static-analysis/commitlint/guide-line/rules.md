---
layout: doc
outline: [2, 3]
---

# 规则

> 基于 commitlint v21.0.2 / @commitlint/config-conventional 编写

## 速查

- 规则写法：`'rule-name': [level, applicable, value]`
- `level`：`0` 关闭 / `1` 警告 / `2` 错误
- `applicable`：`'always'` 必须满足 / `'never'` 绝不允许（反转）
- 规则按部位分组：`type-*` / `scope-*` / `subject-*` / `header-*` / `body-*` / `footer-*` + 若干特殊规则
- config-conventional 关键默认值：
  - `type-enum`：`build/chore/ci/docs/feat/fix/perf/refactor/revert/style/test`
  - `type-empty: never`、`subject-empty: never`
  - `type-case: lower-case`、`subject-case` 禁 `sentence/start/pascal/upper-case`
  - `subject-full-stop: never '.'`（subject 不以句号结尾）
  - `header-max-length: 72`
  - `body-leading-blank` / `footer-leading-blank`（前导空行，通常 level 1）

## 规则三元组

每条规则都写成数组：

```js
"type-enum": [2, "always", ["feat", "fix", "docs"]]
//            │      │              └─ value：比较值
//            │      └─ applicable：always / never
//            └─ level：0 关闭 / 1 警告 / 2 错误
```

`applicable` 的 `never` 会把判定反转。例如：

```js
"subject-empty": [2, "never"]        // subject 绝不能为空
"subject-full-stop": [2, "never", "."] // subject 绝不能以 "." 结尾
```

## type 相关

| 规则             | 作用                       | config-conventional 默认                 |
| ---------------- | -------------------------- | ---------------------------------------- |
| `type-enum`      | type 只能取枚举集合        | 见下方列表，`[2, always, [...]]`         |
| `type-case`      | type 的大小写              | `lower-case`                             |
| `type-empty`     | type 是否可空              | `[2, never]`（不能空）                   |
| `type-min-length`| type 最小长度              | `0`                                      |
| `type-max-length`| type 最大长度              | `Infinity`                               |

`type-enum` 默认枚举：

```js
["build", "chore", "ci", "docs", "feat", "fix",
 "perf", "refactor", "revert", "style", "test"]
```

```bash
echo 'foo: some message' | npx commitlint   # 失败：foo 不在枚举
echo 'fix: some message' | npx commitlint   # 通过
```

## scope 相关

| 规则                    | 作用                         | 默认           |
| ----------------------- | ---------------------------- | -------------- |
| `scope-enum`            | scope 必须在允许列表内       | 未限制         |
| `scope-case`            | scope 大小写                 | `lower-case`   |
| `scope-empty`           | scope 是否可空               | 未强制         |
| `scope-delimiter-style` | 多 scope 的分隔符风格        | —              |
| `scope-min-length` / `scope-max-length` | scope 长度       | `0` / `Infinity` |

config-conventional 中 scope 是**可选**的——不写 scope 也合法（`fix: x` 通过）。需要限制时自己加 `scope-enum`：

```js
"scope-enum": [2, "always", ["api", "ui", "docs"]]
```

## subject 相关

| 规则                       | 作用                       | 默认                                       |
| -------------------------- | -------------------------- | ------------------------------------------ |
| `subject-case`             | 禁止某些大小写形态         | 禁 `sentence/start/pascal/upper-case`      |
| `subject-empty`            | subject 是否可空           | `[2, never]`（不能空）                     |
| `subject-full-stop`        | subject 末尾字符           | `[2, never, '.']`（不以句号结尾）          |
| `subject-exclamation-mark` | subject 是否含感叹号       | —                                          |
| `subject-min-length` / `subject-max-length` | subject 长度 | `0` / `Infinity`                        |

`subject-case` 默认禁止「句首大写 / 全大写」等形态，必须小写开头：

```bash
echo 'fix(scope): Some message' | npx commitlint  # 失败：sentence-case
echo 'fix(scope): some message' | npx commitlint  # 通过
```

## header 相关

`header` 指首行整行（`type(scope): subject`）。

| 规则                | 作用                 | 默认             |
| ------------------- | -------------------- | ---------------- |
| `header-case`       | 首行大小写           | `lower-case`     |
| `header-full-stop`  | 首行末尾字符         | `[2, never, '.']`|
| `header-max-length` | 首行最大长度         | `72`             |
| `header-min-length` | 首行最小长度         | `0`              |
| `header-trim`       | 去除首尾空白         | —                |

```bash
# 失败：首行超过 72 字符
echo 'fix: some message that is way too long and breaks the line max-length by several characters' | npx commitlint
echo 'fix: some message' | npx commitlint   # 通过
```

## body 与 footer 相关

| 规则                                       | 作用                       | 默认        |
| ------------------------------------------ | -------------------------- | ----------- |
| `body-leading-blank`                       | body 前须有空行            | 通常 `[1, always]` |
| `body-max-line-length`                     | body 每行最大长度          | `Infinity`（约定式常设 100） |
| `body-empty` / `body-case` / `body-full-stop` | body 非空 / 大小写 / 末尾 | —           |
| `footer-leading-blank`                     | footer 前须有空行          | 通常 `[1, always]` |
| `footer-max-line-length`                   | footer 每行最大长度        | `Infinity`（约定式常设 100） |
| `footer-empty`                             | footer 是否可空            | —           |

`body-leading-blank` / `footer-leading-blank` 落实 Conventional Commits「各部分之间用空行分隔」的排版约定。

## 特殊规则

| 规则                                 | 作用                                            |
| ------------------------------------ | ----------------------------------------------- |
| `breaking-change-exclamation-mark`   | 校验 header 中 `!` 与 footer 中 `BREAKING CHANGE` 的一致性 |
| `references-empty`                   | 要求至少一个 issue 引用                         |
| `signed-off-by`                      | 要求包含 `Signed-off-by:`                       |
| `trailer-exists`                     | 要求存在指定 trailer（默认 `Signed-off-by:`）   |

## 自定义示例

在沿用约定式规则的基础上微调：

```js
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [2, "always", ["a", "b"]], // 给了 scope 但不在列表内 → 报错
    "header-max-length": [2, "always", 100], // 首行放宽到 100
    "body-max-line-length": [0], // 关闭 body 行长限制
  },
};
```

完整规则索引以官方 [Rules reference](https://commitlint.js.org/reference/rules.html) 为准。
