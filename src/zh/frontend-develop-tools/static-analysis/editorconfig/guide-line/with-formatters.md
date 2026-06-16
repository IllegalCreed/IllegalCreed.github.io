---
layout: doc
outline: [2, 3]
---

# 搭配格式化器

> 基于 EditorConfig 规范编写

## 速查

- 职责划分：EditorConfig 管**编辑器基础行为**（缩进/换行/编码/末尾空行），格式化器管**细粒度风格**（引号/分号/换行折叠）
- **Prettier 会读取** `.editorconfig`：用其 `indent_style`/`indent_size`/`tab_width`/`end_of_line` 作为自身缺省值的基线
- 显式的 Prettier 配置（`.prettierrc`）**优先于** `.editorconfig`
- 推荐组合：`.editorconfig`（兜底，覆盖所有编辑器与非格式化文件）+ Prettier（精修代码风格）
- 避免冲突：缩进/换行只在一处「拍板」，或保证两边数值一致
- 与 ESLint/Stylelint 同理：它们管代码质量与风格规则，EditorConfig 管编辑器基础行为，互不替代

## 为什么需要两者

EditorConfig 只覆盖最基础的编辑器行为，**够轻但够粗**：

- 它管：缩进风格与宽度、换行符、编码、行尾空白、末尾空行。
- 它**不管**：引号用单还是双、要不要分号、对象换行折叠、import 排序……

这些细粒度风格是 **Prettier**（或 ESLint/Stylelint）的领域。所以二者不是二选一，而是**分层协作**。

## Prettier 如何读取 .editorconfig

Prettier 默认会解析 `.editorconfig`，并将其中的属性映射为自己的选项基线：

| EditorConfig            | Prettier 选项                  |
| ----------------------- | ------------------------------ |
| `indent_style = space`  | `tabWidth` 生效、`useTabs:false` |
| `indent_style = tab`    | `useTabs: true`                |
| `indent_size` / `tab_width` | `tabWidth`                  |
| `end_of_line`           | `endOfLine`                    |
| `max_line_length`       | `printWidth`                   |

::: tip 显式 Prettier 配置优先
若 `.prettierrc` 里显式写了 `tabWidth`、`endOfLine` 等，**以 Prettier 配置为准**；`.editorconfig` 只在 Prettier 未显式设置时充当基线。
:::

## 推荐组合

```ini
# .editorconfig —— 兜底，覆盖所有编辑器 + 非代码文件
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2
```

```json
// .prettierrc —— 精修代码风格
{
  "singleQuote": true,
  "semi": false,
  "trailingComma": "all"
}
```

这样：`.editorconfig` 保证连 `.md`、`.yml`、`.json` 这类 Prettier 可能不格式化或编辑器临时手敲的文件也守住基础风格；Prettier 负责把代码风格做细。

## 避免冲突

冲突几乎都源于「同一个维度在两处给了不同值」：

- **缩进/换行只在一处拍板**：要么交给 EditorConfig，要么交给 Prettier；若两边都写，务必保证数值一致（如 `indent_size = 2` ↔ `tabWidth: 2`）。
- 让 Prettier 读 `.editorconfig` 当基线，是天然对齐两者的简单做法。

::: warning 与 eslint-config-prettier 的角色不同
`eslint-config-prettier` 解决的是 **ESLint 与 Prettier 的规则冲突**，和 EditorConfig 无关。EditorConfig 不产生「lint 报错」，只影响编辑器/格式化器的基础行为，不需要类似的「关冲突」配置。
:::

## 与 ESLint / Stylelint

ESLint、Stylelint 管的是代码**质量与风格规则**（可能报错、可 `--fix`）；EditorConfig 管的是**编辑器基础行为**（不会报错）。三者层次不同：

- EditorConfig：你敲键盘时编辑器怎么处理缩进/换行/编码。
- Prettier：保存/提交时如何重排代码格式。
- ESLint/Stylelint：哪些写法算问题、能否自动修。

按需叠加即可，互不替代。
