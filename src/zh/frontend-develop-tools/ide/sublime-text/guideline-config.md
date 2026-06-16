---
layout: doc
outline: [2, 3]
---

# 配置与构建

> 基于 Sublime Text 4 官方文档（2026）。配置体系、项目、构建系统是进阶使用的关键。

## 设置优先级

设置按以下顺序后者覆盖前者：

1. Default → 2. Default 平台特定 → 3. **User** → 4. **Project 设置** → 5. `Packages/<syntax>/<syntax>.sublime-settings` → 6. `Packages/User/<syntax>.sublime-settings` → 7. buffer 特定

::: warning 高频易错
**语法特定设置（User 级）优先级高于 Project 设置**——即项目设置**不能覆盖**语法特定设置。
:::

- 三类设置：Editor / UI / Application Behavior；UI 与 Application 设置**全局**，不受语法特定文件控制
- 包加载顺序：`Default` 永远最先、`User` 永远最后，其余按字母序

## Key Bindings

文件 `.sublime-keymap`（JSON 数组）。每项：

```json
{ "keys": ["ctrl+shift+k"], "command": "...", "context": [...] }
```

- `"keys"` 多元素 = **和弦/序列**按键（依次按）
- 跨平台修饰键用 **`primary`**（Win/Linux=Ctrl，Mac=⌘）
- `context` 条件键：`selector` / `selection_empty` / `preceding_text` 等

## 项目

| 文件 | 用途 | 版本控制 |
| --- | --- | --- |
| `.sublime-project` | 项目定义（folders / settings / build_systems） | **入版本控制** |
| `.sublime-workspace` | 用户态（打开的文件、改动等） | **不入版本控制** |

::: tip 易错点
两者别搞反：`.sublime-project` 是可共享的项目定义，`.sublime-workspace` 是个人会话状态。
:::

- 切换项目：Quick Switch Project `Ctrl+Alt+P` · `⌃+⌘+P`

## 构建系统

文件 `.sublime-build`（JSON）：

```json
{
  "shell_cmd": "python -u \"$file\"",
  "selector": "source.python",
  "file_regex": "^\\s*File \"(...)\", line ([0-9]+)"
}
```

::: warning shell_cmd vs cmd（易错）
`shell_cmd` 支持管道/重定向且**优先于** `cmd`；`cmd`（数组）不支持 shell 特性。
:::

- 运行：`Ctrl+B`（或 `F7`）；选变体（Build With）：`Ctrl+Shift+B`；结果导航 `F4` / `Shift+F4`
- 变量：`$file` / `$file_path` / `$folder` / `$project` / `$platform`

## 语法定义与 Vintage

- **`.sublime-syntax`**（**YAML**）取代旧 `.tmLanguage`，头部 `name`/`file_extensions`/`scope`，推荐 version 2
- **Vintage**（vi 模式）**内置但默认禁用**——从 `ignored_packages` 移除 `"Vintage"` 即可启用；默认进 insert 模式
