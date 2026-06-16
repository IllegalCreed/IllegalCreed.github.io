---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 EditorConfig 规范编写

## 速查

- 文件：项目内任意目录的全小写 `.editorconfig`；顶层加 `root = true`
- 段：`[glob]`；对：`key = value`；注释：`#` 或 `;`（独占一行）
- glob：`*`(不跨 `/`) / `**`(跨目录) / `?` / `[name]` / `[!name]` / `{a,b}` / `{n1..n2}`
- 通用属性：`indent_style` / `indent_size` / `tab_width` / `end_of_line` / `charset` / `trim_trailing_whitespace` / `insert_final_newline`
- 取值大小写不敏感、统一小写；`unset` 取消任意属性
- 优先级：越近的文件 / 越靠后的段，取胜

## 文件与语法

| 要素       | 说明                                                    |
| ---------- | ------------------------------------------------------- |
| 文件名     | `.editorconfig`（全小写）                               |
| 编码       | UTF-8，`LF` 或 `CRLF` 换行                              |
| `root`     | 置于文件顶部（任何段之外）；`true` 停止向上查找         |
| 段（section）| `[glob]`，对其后属性生效，直到下一个段                |
| 键值对     | `key = value`                                           |
| 注释       | `#` 或 `;`，独占一行                                     |
| 路径分隔符 | 仅正斜杠 `/`                                            |

## glob 通配符

| 模式            | 含义                                       |
| --------------- | ------------------------------------------ |
| `*`             | 任意字符，但**不跨**路径分隔符 `/`         |
| `**`            | 任意字符，**可跨**目录                     |
| `?`             | 任意单个字符                               |
| `[name]`        | `name` 中的任一字符                        |
| `[!name]`       | 不在 `name` 中的任一字符                   |
| `{s1,s2,s3}`    | 给定字符串中的任一个（逗号分隔）           |
| `{num1..num2}`  | `num1` 到 `num2` 之间的任意整数            |

- 段名**不含** `/`：可在任意层级匹配。
- 段名**含** `/`：相对于该 `.editorconfig` 所在目录。

## 通用属性

| 属性                       | 取值                                              | 说明                         |
| -------------------------- | ------------------------------------------------- | ---------------------------- |
| `indent_style`             | `tab` / `space`                                   | 硬 tab 或软 tab              |
| `indent_size`              | 整数 / `tab`                                      | 缩进列数；`tab` 取 tab_width |
| `tab_width`                | 整数                                              | tab 列数，默认取 indent_size |
| `end_of_line`              | `lf` / `cr` / `crlf`                              | 换行符                       |
| `charset`                  | `latin1` / `utf-8` / `utf-8-bom` / `utf-16be` / `utf-16le` | 编码                |
| `trim_trailing_whitespace` | `true` / `false`                                  | 删行尾空白                   |
| `insert_final_newline`     | `true` / `false`                                  | 末尾留换行                   |
| `unset`（值）              | 任意属性                                          | 取消该属性，回到编辑器默认   |

## 有限支持的属性

| 属性              | 取值              | 说明                                          |
| ----------------- | ----------------- | --------------------------------------------- |
| `max_line_length` | 正整数 / `unset`  | 硬换行行宽，仅部分编辑器/工具（Vim/Emacs/JetBrains/Prettier 等）支持 |

## 优先级规则

- 多个 `.editorconfig` 自顶向下读取，**越靠近**目标文件的越后读、优先级越高。
- 同一文件内，**靠后的段**覆盖靠前的段。
- 遇 `root = true` 或文件系统根，停止向上查找。

## 相关链接

- [EditorConfig 官网](https://editorconfig.org/)
- [GitHub: editorconfig/editorconfig](https://github.com/editorconfig/editorconfig)
- [EditorConfig 规范](https://spec.editorconfig.org/) · [属性清单 Wiki](https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties)
- 官方解析器库（npm）：`editorconfig`；配套格式化器常用 Prettier
