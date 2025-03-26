---
layout: doc
outline: [2, 3]
---

# 参考

## 速查

- 检查格式：`--check`
- 指定配置文件：`--config`
- 查找配置文件：`--find-config-path`
- 忽略配置文件：`--no-config`
- 格式化文件：`--write`
- 设置日志级别：`--log-level`
- 指定文件全名：`--stdin-filepath`
- 忽略不支持类型：`--ignore-unknown`
- 启用缓存：`--cache`
- 格式化代码：`prettier.format(source, options)`
- 检查格式：`prettier.check(source [, options])`
- 格式化并固定光标：`prettier.formatWithCursor(source [, options])`
- 解析配置：`prettier.resolveConfig(fileUrlOrPath [, options])`
- 获取配置文件路径：`prettier.resolveConfigFile([fileUrlOrPath])`
- 获取文件信息：`prettier.getFileInfo(fileUrlOrPath [, options])`

## CLI

**命令格式**：`prettier [options] [file/dir/glob ...]`

**执行方式**：推荐前缀 `npx`、`yarn exec`、`pnpm exec` 或 `bun exec` 调用本地版本

示例：

```bash
prettier . --write
```

> `--write` 格式化并覆盖文件

<br>

::: warning **不要忘记 globs 周围的引号**

例如：

```bash
prettier docs package.json "{app,__{tests,mocks}__}/**/*.js" --write --single-quote --trailing-comma all
```

:::

<br>

::: tip **参数顺序**

大多数命令行工具（包括 Prettier）在解析参数时，并不严格要求选项和文件路径的顺序。只要语法正确（选项以 `--` 或 `-` 开头，文件路径是普通字符串），工具都能正确识别。也就是说：
`prettier --write .` 和 `prettier . --write` 在功能上是等价的

:::

### 文件匹配规则

#### **输入路径处理规则**

1. **若为文件则直接处理**: 如果输入路径指向现有文件，Prettier 直接格式化该文件。
2. **目录则递归查找支持的文件**: 如果路径是目录，Prettier 递归查找目录中支持的文件（基于扩展名和语言关联）。
3. **否则作为 glob 模式解析**: 如果路径既不是文件也不是目录，则按 `fast-glob` 的 `glob` 语法解析。

#### **默认行为规则**

1. **默认忽略 node_modules**: Prettier 跳过 `node_modules` 目录中的文件，可用 `--with-node-modules` 取消此限制。
2. **不追踪符号链接的目标，只处理链接本身路径**: Prettier 不跟随符号链接到其指向的文件或目录，仅处理链接路径本身。
3. **glob 中特殊字符需转义**: 在 `glob` 模式中，特殊字符需用 `[dir]` 或 `[[]dir]` 转义，后者更兼容 Windows（避免反斜杠问题）。

示例：

```bash
prettier “\[my-dir]/*.js” 
prettier “[[]my-dir]/*.js”
```

### --check

使用 `prettier [file/dir/glob] --check`（或简写 `-c`）检查文件是否符合 Prettier 的格式化规则，而不修改文件

示例：

```bash
prettier . --check
```

输出：

- 全部已格式化

```bash
Checking formatting...
All matched files use Prettier code style!
```

- 部分未格式化

```bash
Checking formatting...
[warn] src/fileA.js
[warn] src/fileB.js
[warn] Code style issues found in 2 files. Run Prettier with --write to fix.
```

退出码：

- `0`：所有文件已正确格式化。
- `1`：存在未格式化文件，适用于 CI 管道检测失败。
- `2`：Prettier 自身出错。

::: tip

在 CI 中，`exit 1` 表示格式问题，可触发构建失败。

:::

替代选项：

- `--list-different`: 输出未格式化文件列表（无详细消息），适合管道处理（如 `prettier . --list-different | xargs echo`）

### --debug-check

用来检查 Prettier 格式化后的代码是否可能改变了代码的“正确性”（correctness），也就是会不会引入语法错误或逻辑变化

运行方式：

1. 解析输入文件的 AST（抽象语法树）。
2. 格式化代码生成新的 AST。
3. 比较两个 AST，看是否有差异可能影响代码行为。
4. 如果发现问题，输出错误消息，但不修改文件。

示例：

```bash
prettier file.js --debug-check  # 检查
prettier file.js --write        # 确认无问题后格式化
```

### --find-config-path

查找 Prettier 配置文件的路径，帮助定位 `.prettierrc` 等文件。

Prettier 每次运行时会从目标文件位置向上查找配置文件（如 `.prettierrc`），这可能带来轻微性能开销，尤其在频繁格式化单个文件时。这时使用 `--find-config-path` 输出配置文件路径，再搭配 `--config` 指定配置文件路径可以提高性能

示例：

```bash
# 输入
prettier --find-config-path src/index.js

# 输出
/project/.prettierrc
```

### --config

直接告诉 Prettier 使用指定的配置文件。

示例：

```bash
prettier src/index.js --write --config /project/.prettierrc
```

### --no-config

忽略任何配置文件，使用 Prettier 默认设置。

示例：

```bash
prettier src/index.js --write --no-config
```

### --ignore-path

指定忽略文件的路径，替代或补充默认的 `.gitignore` 和 `.prettierignore`。

示例：

```bash
prettier . --write --ignore-path .gitignore --ignore-path .customignore
```

忽略文件格式：与 `.gitignore` 类似，支持 `glob` 模式

```bash
# custom-ignore.txt
dist/
*.log
```

::: warning

注意：这里指的是包含忽略规则的文件，而不是不格式化文件路径指向的文件本身，话句话说 `prettier . --write --ignore-path .customignore` 的语义是：读取 `.customignore` 文件，并根据文件内的规则排除对应的文件。

:::

### --list-different

列出与 Prettier 格式化规则不一致的文件名，用于检查而非修改，可简写为 `-l`

功能：

- 检查文件是否已格式化，输出未格式化文件的路径。
- 若有差异，返回退出码 1（无差异返回 0），适合 CI 场景。

示例：

```bash
prettier . --single-quote --list-different
```

### --config-precedence

定义 CLI 选项与配置文件（如 .prettierrc）的优先级规则。

选项：

- `cli-override` (默认)：CLI 选项优先于配置文件。
- `file-override`：配置文件优先于 CLI 选项。
- `prefer-file`：若找到配置文件，则只用其设置，忽略 CLI 选项；若无配置文件，则正常使用 CLI 选项。

### --no-editorconfig

禁止 Prettier 解析 .editorconfig 文件的配置。

### --with-node-modules

允许 Prettier 格式化 node_modules 中的文件。

### --write

格式化并覆盖文件（类似 eslint --fix）。简写为 `-w`

### --log-level

设置 CLI 日志级别。

选项：

- `error`：只显示错误。
- `warn`：显示警告和错误。
- `log` (默认)：显示常规日志、警告和错误。
- `debug`：显示详细调试信息。
- `silent`：无输出。

### --stdin-filepath

指定标准输入（stdin）的文件路径，让 Prettier 根据路径推断文件类型和配置。

背景：当通过管道输入代码时，Prettier 默认无法知道文件类型，可以使用 `--stdin-filepath` 提供完整带后缀的路径，以便于 Prettier 根据后缀判断文件类型。

示例：

```bash
cat abc.css | prettier --stdin-filepath abc.css
```

### --ignore-unknown

忽略 Prettier 不支持的未知文件类型，防止报错。简写为 `-u`

示例：

```bash
prettier "**/*" --write --ignore-unknown
```

### --no-error-on-unmatched-pattern

当 glob 模式未匹配任何文件时，不报错。

示例：

```bash
prettier "nonexistent/*.js" --write --no-error-on-unmatched-pattern
```

### --cache

启用缓存，仅在关键因素变化时格式化文件，提升性能。

关键因素：

- Prettier 版本
- Options
- Node.js 版本
- 文件元数据，例如时间戳（如果 `--cache-strategy metadata`）
- 文件的内容（如果 `--cache-strategy content`）

清除缓存：

- 不带 --catch 运行 Prettier
- 删除缓存文件：`rm ./node_modules/.cache/prettier/.prettier-cache`

示例：

```bash
prettier . --write --cache
```

::: warning

插件版本和实现不作为缓存键，更新插件时建议清除缓存。

:::

### --cache-location

指定缓存文件路径，覆盖默认位置。默认缓存保存于 `./node_modules/.cache/prettier/.prettier-cache`，此选项允许自定义

示例：

```bash
prettier . --write --cache --cache-location=path/to/cache-file
```

### --cache-strategy

定义缓存检测文件变化的策略

有效值：

- `metadata`：使用文件元数据（如时间戳），更快，但可能因 Git 操作（如 `git clone`）失效。
- `content`：使用文件内容，默认策略，适用于元数据不可靠时。

示例：

```bash
prettier . --write --cache --cache-strategy metadata
```

## API

如果您想通过编程方式运行 Prettier，可以使用 prettier 模块的 API

```bash
import * as prettier from "prettier";
```

特性：

- 默认提供异步 API
- 若需同步 API，可使用 `@prettier/sync`（需单独安装）

### prettier.format(source, options)

使用 Prettier 格式化代码文本。

参数：

- `source`：要格式化的代码字符串
- `options`：配置对象
    - `parser`：必须指定语言解析器（如 `"babel"`、`"vue"`），见可用解析器列表。
    - `filepath`：可选，指定文件路径以推断解析器（基于扩展名）。
    - 其他选项：覆盖默认设置（如 `semi`、`singleQuote`）。

### prettier.check(source [, options])

检查代码是否已按指定选项格式化，返回 `Promise<boolean>`。

参数：

- `source`：待检查的代码字符串。
- `options`：可选配置（如 `parser`），与 `format` 一致。

示例：

```js
await prettier.check("foo()\n", { semi: false, parser: "babel" });
// 返回: true
await prettier.check("foo ( );", { semi: false, parser: "babel" });
// 返回: false
```

### prettier.formatWithCursor(source [, options])

格式化代码并转换光标位置，从未格式化代码映射到格式化后的位置，适用于编辑器集成，避免格式化时光标跳动

参数：

- `source`：要格式化的代码字符串
- `options`：配置对象
    - `cursorOffset`：必需，指定未格式化代码中的光标位置（从 `0` 开始计数）。
    - `parser`：必须指定语言解析器（如 `"babel"`、`"vue"`）。
    - 其他选项：覆盖默认设置（如 `semi`）。

返回 Promise，返回对象：

- `formatted`：格式化后的代码字符串。
- `cursorOffset`：格式化后光标的新位置。

示例：

```js
await prettier.formatWithCursor(" 1", { cursorOffset: 2, parser: "babel" });
// 返回: { formatted: "1;\n", cursorOffset: 1 }
```

### prettier.resolveConfig(fileUrlOrPath [, options])

为指定文件解析 Prettier 配置，返回配置对象。

参数：

- `fileUrlOrPath`：需要被格式化的文件路径或 URL，从其目录开始向上查找配置文件。
- `options`：
    - `config`：可选，直接指定配置文件路径，跳过查找。
    - `useCache`：默认 `true`，设为 `false` 禁用缓存。
    - `editorconfig`：默认 `false`，设为 `true` 解析 `.editorconfig`（支持 `end_of_line`、`indent_style`、`indent_size/tab_width`、`max_line_length`）。

返回 Promise，解析为：

- 配置对象（若找到配置文件）。
- `null`（若未找到）。
- 解析错误时拒绝。

示例：

```js
const text = await fs.readFile(filePath, "utf8");
const options = await prettier.resolveConfig(filePath);
const formatted = await prettier.format(text, {
  ...options,
  filepath: filePath,
});
```

### prettier.resolveConfigFile([fileUrlOrPath])

查找 Prettier 配置文件的路径。

参数：

`fileUrlOrPath`：可选，指定起始查找路径，默认从 `process.cwd()` 开始。

返回 Promise，解析为：

- 配置文件路径（如 `/project/.prettierrc`）。
- `null`（若未找到）。
- 解析错误时拒绝。

示例：

```js
const configFile = await prettier.resolveConfigFile(filePath);
// you got the path of the configuration file
```

### prettier.clearConfigCache()

清除 Prettier 的配置文件和插件缓存。

示例：

```js
const prettier = require("prettier");
prettier.clearConfigCache();
```

### prettier.getFileInfo(fileUrlOrPath [, options])

检查文件是否需要格式化，主要用于编辑器扩展，返回文件信息。

参数：

- `fileUrlOrPath`：文件路径或 URL（字符串或 URL 类型）。
- `options`：
    - ignorePath：指定忽略路径（字符串、URL 或数组），影响 `ignored` 值。
    - withNodeModules：布尔值，是否包含 `node_modules`（默认 `false`）。
    - plugins：插件路径数组（字符串、URL 或插件对象），帮助推断非核心支持文件的解析器。
    - resolveConfig：布尔值（默认 `true`），设为 `false` 时不查找配置文件。

返回 Promise，解析为对象：

- `ignored`：布尔值，文件是否被忽略（默认 `false`）。
- `inferredParser`：字符串或 `null`，推断的解析器（如 `"vue"`），若 `ignored` 为 `true` 则为 `null`。
- 若 `fileUrlOrPath` 类型错误（非字符串或 URL），Promise 拒绝。

返回值对象：

```js
{
  ignored: boolean;
  inferredParser: string | null;
}
```

示例：

```js
const prettier = require("prettier");
const info = await prettier.getFileInfo("src/App.vue");
console.log(info); // { ignored: false, inferredParser: "vue" }
```

### prettier.getSupportInfo()

获取 Prettier 支持的选项、解析器、语言和文件类型信息。

返回值对象：

```ts
{
  languages: Array<{
    name: string;
    parsers: string[];
    group?: string;
    tmScope?: string;
    aceMode?: string;
    codemirrorMode?: string;
    codemirrorMimeType?: string;
    aliases?: string[];
    extensions?: string[];
    filenames?: string[];
    linguistLanguageId?: number;
    vscodeLanguageIds?: string[];
  }>;
}
```

`languages`：数组，每个元素描述一种语言的支持信息：

- `name`：语言名称（如 `"JavaScript"`）。
- `parsers`：支持的解析器数组（如 [`"babel"`, `"flow"`]）。
- `group`：可选，语言分组。
- `tmScope`, `aceMode`, `codemirrorMode`, `codemirrorMimeType`：可选，编辑器相关标识。
- `aliases`：可选，语言别名。
- `extensions`：可选，文件扩展名（如 [`".js"`, `".jsx"`]）。
- `filenames`：可选，特定文件名。
- `linguistLanguageId`：可选，Linguist ID。
- `vscodeLanguageIds`：可选，VS Code 语言 ID。