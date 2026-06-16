---
layout: doc
outline: [2, 3]
---

# 集成与生态

> 基于 Stylelint v17.13.0 编写

## 速查

- 编辑器：VS Code 装官方 **stylelint** 扩展（`stylelint.vscode-stylelint`），保存自动 `--fix`，并关掉内置 `css.validate` 避免重复
- CI：`stylelint "**/*.css"`，发现问题以非零退出码失败；`--max-warnings 0` 让任何警告失败
- 输出格式 `-f`：`string`（CLI 默认）/ `json`（API 默认）/ `github` / `compact` / `unix` / `tap` / `verbose`
- 退出码：`1` 致命错误 · `2` 发现 lint 问题 · `64` 用法错误 · `78` 配置无效
- Git 钩子：配合 `lint-staged` 只查暂存文件
- 构建集成：webpack 用 `stylelint-webpack-plugin`；也可作为 PostCSS 插件接入
- 缓存：`--cache` + `--cache-location`，仅查变更文件加速
- 与 Prettier：格式交 Prettier、质量交 Stylelint，二者无冲突，无需 `stylelint-config-prettier`

## 编辑器集成

VS Code 在扩展市场安装官方 **stylelint** 扩展（`stylelint.vscode-stylelint`），即可获得：

- 即时高亮问题
- 保存时自动 `--fix`（在设置里开启 `editor.codeActionsOnSave`）

::: warning 关闭内置 CSS 校验避免重复
VS Code 自带 CSS/SCSS/Less 校验，会与 Stylelint 重复报错。通常在设置里关闭：

```json
{
  "css.validate": false,
  "scss.validate": false,
  "less.validate": false
}
```

:::

其它编辑器也有社区集成：Vim（ale）、Neovim（coc-stylelint）、Emacs（flycheck）、Sublime（SublimeLinter-stylelint）、Zed（zed-stylelint）。

## CI 集成

CI 里直接跑，发现问题即以非零退出码失败：

```bash
stylelint "**/*.css"
```

把警告也视为失败：

```bash
stylelint "**/*.css" --max-warnings 0
```

### 输出格式

`-f` / `--formatter` 切换报告格式，便于对接不同 CI：

| 格式      | 说明                          |
| --------- | ----------------------------- |
| `string`  | 人类可读彩色文本（CLI 默认）  |
| `json`    | 机器可读（Node API 默认）     |
| `github`  | GitHub Actions 注解           |
| `compact` | 紧凑单行                      |
| `unix`    | Unix 风格                     |
| `tap`     | TAP 协议                      |
| `verbose` | 详细，含规则统计              |

```bash
stylelint -f github "**/*.css"
```

### 退出码

| 退出码 | 含义              |
| ------ | ----------------- |
| `1`    | 致命错误          |
| `2`    | 发现 lint 问题    |
| `64`   | CLI 用法错误      |
| `78`   | 配置文件无效      |

::: tip 16 起的变化
Stylelint 16 把问题信息打印到 **stderr**（而非 stdout），并把“用法错误”退出码从 `2` 改为 `64`。写 CI 脚本解析输出时需注意。
:::

## Git 钩子（lint-staged）

只检查暂存的样式文件，作为 pre-commit 快门：

```json
// package.json
{
  "lint-staged": {
    "*.{css,scss}": "stylelint --fix"
  }
}
```

## 构建工具集成

- **webpack**：用 `stylelint-webpack-plugin`，在 `plugins` 中实例化，构建时跑 Stylelint。
- **PostCSS**：`stylelint` 本身可作为 PostCSS 插件接入已有的 PostCSS 流水线。
- **Vite / gulp 等**：有对应社区插件（如 `gulp-stylelint`）。

```js
// webpack.config.js
import StylelintPlugin from "stylelint-webpack-plugin";

export default {
  plugins: [new StylelintPlugin({ files: "**/*.css" })],
};
```

## 缓存加速

重复运行时开启缓存，仅检查变更过的文件：

```bash
stylelint "src/**/*.scss" --cache --cache-location "node_modules/.cache/.stylelintcache"
```

`--cache-strategy` 可选 `metadata`（按文件元数据）或 `content`（按内容哈希）。

## 与 Prettier 协作

让 **Prettier 管所有格式**（空白、引号风格、换行），**Stylelint 只留避错与非格式约定**。由于 Stylelint 16 已移除全部风格规则，二者**天然不冲突**，**无需** `stylelint-config-prettier`（已废弃）。

更完整的命令行与配置字段见 [参考](../reference.md)。
