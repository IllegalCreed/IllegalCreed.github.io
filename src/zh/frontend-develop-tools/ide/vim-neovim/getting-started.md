---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Vim 官方帮助（vimhelp.org）。本页讲 Vim 核心；Neovim 的现代化差异见 [Neovim 进阶](./guideline-neovim.md)。

## 速查

- 进入插入：`i`（前）/ `a`（后）/ `o`（下方开行）
- 回到 Normal：`Esc`（一切操作的轴心）
- 保存/退出：`:w` 写、`:q` 退、`:wq`/`:x`/`ZZ` 写并退、`:q!`/`ZQ` 丢弃退出
- 撤销/重做：`u` / `Ctrl-r`；重复上次修改：`.`

## 模态编辑：为何高效

Vim 是**模态编辑器**——Normal 模式下**每个键都是命令**而非输入文本，把整套编辑动作压进单手可及的键位，且**可组合、可计数、可重复**。这套「编辑语言」是它高效的根本。

七个模式（核心五个）：

| 模式 | 进入 | 作用 |
| --- | --- | --- |
| **Normal** | `Esc` | 默认态，敲命令 |
| **Insert** | `i I a A o O` | 输入文本 |
| **Visual** | `v`（字符）/ `V`（行）/ `Ctrl-V`（块） | 选区后操作 |
| **Command-line** | `:` `/` `?` | Ex 命令 / 搜索 |
| **Replace** | `R` | 逐字符覆盖 |

## 编辑语法核心（Vim 精髓）

**公式：`[count] operator [count] {motion|text-object}`**，两处 count 相乘（`2d3w` 删 6 个词）。

**Motions（移动）**：`h/j/k/l`、`w/b/e`（词）、`0/^/$`（行首/首非空白/行尾）、`gg/G`（首/末行）、`f{c}/t{c}`（行内查找）、`{/}`（段落）、`%`（跳配对括号）。

**Operators（操作符）**：`d` 删、`c` 改、`y` 复制、`>/<` 缩进、`gu/gU` 大小写。

- operator + motion：`dw`（删到下一词）、`d$`/`D`（删到行尾）、`ci(`（改括号内）
- **双写 = 整行**：`dd` 删行、`yy`/`Y` 复制行、`cc` 改行

**Text objects（文本对象）**：`i` = inner（内层不含界定符），`a` = around（含界定符/周围空白）。

- `iw/aw`（词）、`i(`/`a(`（括号）、`i"`/`a"`（引号）、`it/at`（HTML 标签）
- 经典：`ci"`（改引号内）、`dap`（删一段）、`yat`（复制整个标签块）

::: warning 高频易错
`cw` 在词中时等同 `ce`（**不含**词后空白），与 `dw`（含词后空白）不同；`Y` 在纯 Vim 里等于 `yy`（整行复制），**不是** `y$`。
:::

## 寄存器与宏

- **寄存器**：`"0` 存最近一次 yank（删除不覆盖它，故 `"0p` 粘最后复制内容）；`"a`–`"z` 命名，**大写追加**；`"_` 黑洞（丢弃）；`"+` 系统剪贴板
- **宏**：`q{reg}` 开录 → 操作 → `q` 停；`@{reg}` 回放，`{count}@a` 回放多次，`@@` 重复上次

## 查找替换

- 搜索：`/pattern`（前向）、`?pattern`（后向）、`n/N`（下/上一个）、`*`（搜光标词）
- 替换：`:[range]s/old/new/[flags]`，如 `:%s/a/b/g`（全文每处）、`:%s/a/b/gc`（逐个确认）；漏 `g` 只替换每行第一个

## 缓冲区 / 窗口 / 标签

- **概念**：buffer（内存文本）/ window（视口）/ tab（窗口集合）——一个 buffer 可被多窗口显示
- 缓冲区：`:e {file}` 打开、`:bn`/`:bp` 切换、`:ls` 列表
- 窗口：`:sp`/`:vsp` 水平/垂直分屏、`Ctrl-W h/j/k/l` 导航、`Ctrl-W o` 仅留当前
- 标签：`:tabnew`、`gt`/`gT` 切换

## 配置 `.vimrc`

位置 `~/.vimrc`（`:edit $MYVIMRC` 编辑）。语法 `set option` / `set nooption` / `set option=value`：

```vim
syntax on
filetype plugin indent on
set number
set ignorecase smartcase
set tabstop=4 shiftwidth=4 expandtab
nnoremap <C-s> :w<CR>   " 非递归映射（推荐 nnoremap 而非 map）
```

## 下一步

- Neovim 现代化（Lua / 内置 LSP / Treesitter / 插件）：见 [Neovim 进阶](./guideline-neovim.md)
