---
layout: doc
outline: [2, 3]
---

# Neovim 进阶

> 基于 Neovim 官方文档（neovim.io/doc）。Neovim 是 Vim 的现代化 fork（2014 起），主打 Lua、异步、可嵌入、内置 LSP/Treesitter。

## Neovim vs Vim

| 维度 | Vim | Neovim |
| --- | --- | --- |
| 配置语言 | Vimscript（`.vimrc`） | **Lua**（`init.lua`）为一等公民 |
| LSP | 需第三方插件 | **内置 LSP client**（`vim.lsp`） |
| Treesitter | 无 | **内置** Tree-sitter 引擎 |
| 架构 | 单进程 | API + job control（libuv），UI 解耦、外部插件独立进程 |
| 终端 | — | 内置 `:terminal` |

## 配置：init.lua

- 位置 `~/.config/nvim/init.lua`（或 `init.vim`），数据 `~/.local/share/nvim`

::: warning 互斥（高频易错）
`init.lua` 与 `init.vim` **不能同时存在**，否则报 **`E5422`**。
:::

**默认值差异**（Neovim 开箱即用、Vim 需手动开）：Neovim 默认开 `syntax` / 文件类型检测 / `hlsearch` / `incsearch` / `autoindent`；`'compatible'` 始终关；`history=10000`。

常用 Lua API：

```lua
vim.o.number = true          -- 标量选项（:set）
vim.opt.shiftwidth = 4       -- 对象式，支持 :append/:remove
vim.keymap.set('n', '<C-s>', ':w<CR>')  -- 设键位
vim.cmd('colorscheme habamax')
```

> `vim.opt`（对象，支持 list/map 操作）vs `vim.o`（标量）；`vim.uv`（= `vim.loop`）是 libuv 异步绑定，回调里调非 fast 的 `vim.api` 需 `vim.schedule_wrap`。

## 内置 LSP

`vim.lsp` 是内置 **LSP client**（不是 server），提供跳转/引用/悬浮/重命名/格式化等。

- 现代配置法 **`vim.lsp.config()` + `vim.lsp.enable()`**（0.11 引入）；`vim.lsp.start()` 是 0.8
- 默认全局键位（较新版本）：`grn` 重命名、`grr` 引用、`gra` code action、`gri` 实现、`K` 悬浮
- 诊断独立模块 `vim.diagnostic`

::: warning 内置 LSP ≠ nvim-lspconfig（高频混淆）
内置 `vim.lsp` 是**框架**；`nvim-lspconfig` 是社区维护的各语言 server **预设配置集合**，二者不是一回事。
:::

## Treesitter

增量解析产出语法树，驱动语义高亮/折叠/选择，比正则 syntax 更上下文感知。

- 内置随附 parser 仅 **c / lua / vim / vimdoc / markdown / query**；其他语言需 **nvim-treesitter** 插件安装
- 命令：`:InspectTree`（语法树可视化）、`:Inspect`（光标处高亮来源）、`:EditQuery`
- 查询写在 `*.scm`，capture 以 `@` 前缀（主文件 `highlights.scm`）

## 插件管理与发行版

- **lazy.nvim**（folke）：现代主流，按 event/cmd/ft 惰性加载、字节码缓存、`lazy-lock.json` 锁文件
- **packer.nvim**：2025 起已停止维护
- **vim.pack**：Neovim **内置**包管理器（0.12+，`:packadd`/`:packupdate`/`:packdel`）
- 流行发行版/起步：**LazyVim** / **NvChad**（极快启动）/ **AstroNvim** / **kickstart.nvim**（单文件入门模板）

## 与 Vim 的若干差异（易错）

- **不支持 Vim9script**（Vim 9+ 的新 Vimscript 方言）
- viminfo → **`.shada`**（二进制 messagepack）
- Provider 模型：Vim 把 Python 等编译进二进制；Neovim 用外部 provider（`pynvim` / npm `neovim`），`:checkhealth` 诊断
- `Y` 默认改为 `y$`（纯 Vim 是 `yy` 整行）
