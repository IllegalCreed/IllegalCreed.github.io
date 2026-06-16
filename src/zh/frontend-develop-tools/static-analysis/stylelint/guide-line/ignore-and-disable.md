---
layout: doc
outline: [2, 3]
---

# 忽略与禁用

> 基于 Stylelint v17.13.0 编写

## 速查

- 区域禁用：`/* stylelint-disable */ … /* stylelint-enable */`
- 单行禁用：`/* stylelint-disable-line 规则名 */`（无需 enable）
- 下一行禁用：`/* stylelint-disable-next-line 规则名 */`
- 精确到规则：在指令后跟规则名（多个用逗号），如 `selector-max-id, declaration-no-important`
- 写理由：`-- 理由`（两侧需空格），如 `/* stylelint-disable-line foo -- 临时兼容 */`
- 文件忽略：`.stylelintignore`（gitignore 风格 glob），或配置里 `ignoreFiles`，或 `--ignore-path`
- `node_modules` 默认已忽略
- 审计 disable：开启 `reportNeedlessDisables` / `reportInvalidScopeDisables` / `reportDescriptionlessDisables`

## 行内禁用注释

CSS 注释（`/* */`）里写 `stylelint-disable-*` 指令即可临时关闭规则。

### 区域禁用

成对使用，关闭一段代码内的规则：

```css
/* stylelint-disable */
a {
  color: #fff;
}
/* stylelint-enable */
```

### 单行 / 下一行禁用

```css
a {
  color: #fff; /* stylelint-disable-line color-no-invalid-hex */
}

/* stylelint-disable-next-line declaration-no-important */
b {
  color: pink !important;
}
```

单行/下一行版本作用范围仅一行，**无需再 enable**。

### 精确到规则 + 写理由

> 强烈推荐：禁用时精确到规则名，并用 `--` 补充理由。

```css
/* stylelint-disable selector-max-id, declaration-no-important -- 第三方组件覆盖所需 */
```

- **精确到规则名**：避免裸 `disable` 误伤其它规则（多个规则用逗号分隔）
- **`--` 后写理由**：两侧需有空格，让维护者明白为何破例

## 文件级忽略

### .stylelintignore

在 `process.cwd()` 放 `.stylelintignore`，用 **gitignore 风格** glob：

```text
vendor/**/*.css
dist/**
*.min.css
```

也可用 CLI 的 `--ignore-path <file>` 指向别处的忽略文件。

### 配置里的 ignoreFiles

```json
{ "ignoreFiles": ["**/*.js", "dist/**"] }
```

::: tip node_modules 默认忽略
`node_modules` 默认已被忽略，一般无需手动写。若用 `ignoreFiles` 覆盖了默认，记得自行排除。
:::

## 审计 disable 注释

随着项目演进，`stylelint-disable` 注释容易变得过时或滥用。开启以下选项可让 Stylelint 帮你审计：

```json
{
  "reportNeedlessDisables": true,
  "reportInvalidScopeDisables": true,
  "reportDescriptionlessDisables": true
}
```

- `reportNeedlessDisables`：禁用注释**没有实际阻止任何违规**（多余）时报告
- `reportInvalidScopeDisables`：禁用了**配置里不存在**的规则时报告
- `reportDescriptionlessDisables`：禁用注释**缺少 `--` 理由**时报告

命令行也有对应的 `--report-needless-disables`（`--rd`）。配合“精确到规则 + 写理由”的习惯，可让 disable 注释长期保持整洁、可审计。
