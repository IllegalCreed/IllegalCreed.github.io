---
layout: doc
outline: [2, 3]
---

# 编辑器支持

> 基于 EditorConfig 规范编写

## 速查

- **原生支持**（开箱即用，无需插件）：VS Code、JetBrains 全家桶（IDEA/WebStorm/PyCharm…）、Vim/Neovim、Emacs、BBEdit、GitHub、GitLab 等
- **需要插件**：Sublime Text、Atom、Notepad++、Eclipse、Brackets 等
- 文件名必须是全小写 `.editorconfig`
- 部分属性（如 `max_line_length`）仅一部分编辑器支持，不通用
- 用法：装好支持 → 把 `.editorconfig` 提交进仓库 → 对全团队生效
- 验证：故意写错缩进保存，看是否被纠正；或看编辑器是否提示已读取 `.editorconfig`

## 原生支持（无需插件）

这些编辑器/平台内置了 EditorConfig 支持，放好 `.editorconfig` 即生效：

| 类别       | 代表                                            |
| ---------- | ----------------------------------------------- |
| 通用编辑器 | **VS Code**、BBEdit                            |
| JetBrains  | IntelliJ IDEA、WebStorm、PyCharm、GoLand 等     |
| 终端编辑器 | **Vim**、**Neovim**、Emacs                     |
| 代码托管   | **GitHub**、**GitLab**（在线查看时按其渲染）    |

::: tip VS Code 原生但可加强
VS Code 现已原生读取 `.editorconfig`。社区扩展 `EditorConfig for VS Code` 可提供更完整的属性覆盖与即时反馈，按需安装。
:::

## 需要插件

以下编辑器需在插件市场安装 EditorConfig 插件：

- **Sublime Text** → `EditorConfig` 包（通过 Package Control）
- **Atom** → `editorconfig` 包
- **Notepad++** → EditorConfig 插件
- **Eclipse** → editorconfig-eclipse
- **Brackets** → brackets-editorconfig

## 属性支持不一致

需要注意：**并非每个属性都被每个编辑器支持**。

- 通用属性（`indent_style`、`indent_size`、`tab_width`、`end_of_line`、`charset`、`trim_trailing_whitespace`、`insert_final_newline`）覆盖最广。
- `max_line_length` 仅一部分编辑器/工具支持（Vim、Emacs、JetBrains 系、Prettier 等），其余忽略。

::: warning 以通用属性为团队规约
跨编辑器协作时，团队规约应建立在「通用属性」之上；小众属性可写，但别假设人人生效。
:::

## 验证是否生效

1. 在已配置 `indent_style = space`、`indent_size = 2` 的项目里，新建文件按 Tab，看是否插入 2 个空格。
2. 写一行带行尾空格的代码保存，若配了 `trim_trailing_whitespace = true`，应被自动清除。
3. JetBrains 系会在状态栏/设置中提示「EditorConfig」已接管相应设置。

## 落地约定

支持就绪后，落地只需两步：

1. 在项目根放 `.editorconfig`（全小写文件名）。
2. 提交进版本库——团队成员拉取后，各自支持 EditorConfig 的编辑器自动遵循。

子目录可放各自的 `.editorconfig` 覆盖局部规则（查找与优先级规则见 [入门](../getting-started.md#root-与查找规则)）。
