---
layout: doc
outline: [2, 3]
---

# 属性详解

> 基于 EditorConfig 规范编写

## 速查

- 通用属性（跨编辑器广泛支持）：`indent_style` / `indent_size` / `tab_width` / `end_of_line` / `charset` / `trim_trailing_whitespace` / `insert_final_newline`
- `indent_style`：`tab` 或 `space`
- `indent_size`：整数，软 tab 宽度；设为字面量 `tab` 则取 `tab_width`
- `tab_width`：整数，**默认等于** `indent_size`，通常不必写
- `end_of_line`：`lf` / `cr` / `crlf`
- `charset`：`latin1` / `utf-8` / `utf-8-bom` / `utf-16be` / `utf-16le`
- `trim_trailing_whitespace`、`insert_final_newline`：`true` / `false`
- 键名与取值**大小写不敏感**，解析时统一小写；`unset` 取消任意属性
- `max_line_length`：取正整数或 `unset`，但**仅部分编辑器**支持

## 缩进相关

### indent_style

设为 `tab`（硬 tab）或 `space`（软 tab，即空格）。

```ini
[*.py]
indent_style = space

[Makefile]
indent_style = tab
```

### indent_size

整数，表示每级缩进的列数 / 软 tab 的宽度。

特殊值 `tab`：当 `indent_size = tab` 时，缩进宽度取 `tab_width`（若未指定，则取编辑器设置的 tab 宽度）。

```ini
[*.go]
indent_style = tab
indent_size = tab        # 跟随用户的 tab 可视宽度
```

### tab_width

整数，表示一个 tab 字符占的列数。**默认取 `indent_size` 的值**，因此通常无需单独指定——只有当它与 `indent_size` 不同时才写。

::: tip 用 Tab 缩进时，留空 indent_size
若用 `tab` 缩进，可不写 `indent_size`，让每位开发者按自己偏好显示 tab 宽度。这是规范推荐的「能不写就不写」思路。
:::

## 换行与编码

### end_of_line

控制换行符表示：`lf`（Unix）、`cr`（老 Mac）、`crlf`（Windows）。跨平台协作常统一为 `lf`。

```ini
[*]
end_of_line = lf
```

### charset

文件编码，取值：`latin1` / `utf-8` / `utf-8-bom` / `utf-16be` / `utf-16le`。前端项目通常用 `utf-8`。

::: warning utf-8-bom 慎用
除非工具链明确要求 BOM，否则前端项目用 `utf-8`（无 BOM）；BOM 可能导致某些打包/脚本场景出现意外字符。
:::

## 空白处理

### trim_trailing_whitespace

`true` 删除每行行尾、换行符之前的空白；`false` 则保留。

### insert_final_newline

`true` 保存时确保文件以一个换行结尾；`false` 则确保没有。POSIX 文本文件惯例是以换行结尾。

```ini
[*]
trim_trailing_whitespace = true
insert_final_newline = true
```

## max_line_length（有限支持）

强制在指定字符数后硬换行；取**正整数**或 `unset`（关闭）。它**不在**「通用属性」之列——只有部分编辑器/工具支持（如 Vim、Emacs、JetBrains 系、Prettier 等），在不支持的编辑器中会被忽略。

```ini
[*.md]
max_line_length = off    # 注：部分实现写 off，规范层面用 unset 关闭
```

::: warning 别依赖它做硬约束
因覆盖面有限，不要把 `max_line_length` 当作团队强制规则；要硬性限制行宽，交给 Prettier / linter。
:::

## unset：取消某属性

任意属性都可取值 `unset`，用于「撤销」上层已设置的效果，让编辑器回到默认：

```ini
[*]
indent_size = 2

[legacy/**]
indent_size = unset      # 老代码不强制，用编辑器默认
```

## 大小写规则

键名（property name）大小写不敏感，解析后统一小写；上述属性的取值同样大小写不敏感（会被核心库小写化）。因此 `Indent_Style = Tab` 等价于 `indent_style = tab`。

字段与 glob 段匹配规则的完整说明见 [参考](../reference.md)。
