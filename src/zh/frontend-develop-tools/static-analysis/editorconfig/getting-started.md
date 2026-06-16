---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 EditorConfig 规范编写

## 速查

- 在项目根新建 `.editorconfig`，提交进仓库即对全团队生效
- 顶层加 `root = true`：停止向上查找父目录的 `.editorconfig`
- 用 `[glob]` 段匹配文件，段内写 `key = value`；`#` 或 `;` 注释独占一行
- 通用属性：`indent_style`(tab/space)、`indent_size`、`tab_width`、`end_of_line`(lf/cr/crlf)、`charset`(utf-8…)、`trim_trailing_whitespace`、`insert_final_newline`
- 查找规则：从文件所在目录**逐级向上**，越近优先级越高；遇 `root = true` 或根目录停止
- 取消某属性用 `unset`；键名与取值**大小写不敏感**
- 编辑器：VS Code / JetBrains / Vim / GitHub 等**原生支持**，Sublime / Atom / Eclipse 等需插件
- 它**不做**格式化（引号、分号等交给 Prettier），二者互补

## 它解决什么问题

同一个项目，A 用 VS Code、B 用 WebStorm、C 用 Vim，缩进用 tab 还是 space、换行是 `lf` 还是 `crlf`、文件编码、末尾要不要留空行——各人编辑器默认不同，diff 里全是无意义的空白改动。

EditorConfig 用一个提交进仓库的 `.editorconfig` 文件，把这些**编辑器基础行为**统一下来，谁打开都按同一套来。

::: tip 它不是 linter，也不是格式化器
EditorConfig 只管「编辑器层面的基础风格」。引号风格、分号、换行折叠这些更细的规则，是 Prettier / Stylelint 的职责。
:::

## 第一个 .editorconfig

在项目根新建 `.editorconfig`（全小写文件名）：

```ini
# EditorConfig 顶层文件
root = true

# 所有文件的统一基线
[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

# Python 用 4 空格
[*.py]
indent_size = 4

# Makefile 必须用真 Tab
[Makefile]
indent_style = tab
```

把它提交进 Git，团队所有支持 EditorConfig 的编辑器都会自动遵循。

## 文件格式

- 本质是 **INI 风格**：`[glob]` 段 + 段内的 `key = value` 对。
- 注释：用 `#` 或 `;`，且应**独占一行**。
- 文件应为 **UTF-8 编码**，`CRLF` 或 `LF` 换行均可。
- 路径分隔符只用正斜杠 `/`（即使在 Windows 上）。

## root 与查找规则

打开一个文件时，插件会从该文件所在目录开始，**逐级向上**查找 `.editorconfig`：

- 遇到 `root = true` 的文件，或到达文件系统根目录，就**停止**向上查找。
- 多个 `.editorconfig` 自顶向下读取，**越靠近**目标文件的配置优先级越高。
- 同一文件内，靠后的段覆盖靠前的段。

```bash
project/.editorconfig        # root = true
project/packages/web/.editorconfig
project/packages/web/src/app.ts   # ← 打开它
# 生效：根配置 → web 配置（web 覆盖根的同名属性）
```

子目录可各放一份 `.editorconfig`，无需把所有规则塞进根文件——对 monorepo 很友好。详见 [属性详解](./guide-line/properties.md)。

## 常用属性速览

```ini
[*]
indent_style = space          # tab 或 space
indent_size = 2               # 软 tab 宽度（整数）
end_of_line = lf              # lf / cr / crlf
charset = utf-8               # utf-8 / utf-8-bom / latin1 / utf-16le / utf-16be
trim_trailing_whitespace = true
insert_final_newline = true
```

::: warning unset：取消而非关闭
要在某段「撤销」上层已设置的属性，用 `unset`（如 `indent_size = unset`），让编辑器回到默认，而不是写成某个具体值。
:::

属性全集与取值见 [属性详解](./guide-line/properties.md) 与 [参考](./reference.md)。

## 集成编辑器

- **原生支持**（无需插件）：VS Code、JetBrains 全家桶（IDEA/WebStorm/PyCharm…）、Vim/Neovim、Emacs、BBEdit、GitHub、GitLab 等。
- **需要插件**：Sublime Text、Atom、Notepad++、Eclipse、Brackets 等。

具体清单与验证方式见 [编辑器支持](./guide-line/editor-support.md)。

## 和 Prettier 的关系

EditorConfig 管基础行为，Prettier 管细粒度风格，二者**搭配使用**：Prettier 会主动读取 `.editorconfig`，把其中的 `indent_style`、`indent_size`、`end_of_line` 等作为自身缺省值的基线。详见 [搭配格式化器](./guide-line/with-formatters.md)。
