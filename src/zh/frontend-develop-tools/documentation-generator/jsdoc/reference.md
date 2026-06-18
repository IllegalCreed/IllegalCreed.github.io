---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 JSDoc 4.0.x 编写

## 速查

- 安装：`pnpm add -D jsdoc`；生成：`pnpm exec jsdoc src/ -r -d docs/`
- 默认输出目录是 **`out/`**（不是 `dist/` / `docs/`），别找错
- 注释必须 `/**` 开头；`@returns` 与 `@return` 等价；弃用只认 `@deprecated`
- 内联标签仅 4 个：`{@link}` / `{@linkcode}` / `{@linkplain}` / `{@tutorial}`
- 配置文件 `jsdoc.json`（JSON 或 CJS），`-c` 传入；**命令行参数优先级 > 配置文件**
- 社区模板：`docdash` / `better-docs` / `minami`，用 `-t` 或 `opts.template` 切换
- 工具链坐标：JSDoc 主纯 JS、TypeDoc 主 TS、TSDoc 是注释规范、eslint-plugin-jsdoc 做 CI 门禁
- 当前版本 **4.0.5**，引擎要求 Node `>=12`，成熟稳定、更新节奏慢

## 命令行参数速查

```bash
pnpm exec jsdoc book.js            # 生成单文件文档，默认输出 out/
pnpm exec jsdoc src/ -r -d docs/   # 递归 src/，输出到 docs/
pnpm exec jsdoc -c jsdoc.json      # 指定配置文件
```

| 参数         | 作用                          |
| ------------ | ----------------------------- |
| `-r`         | 递归扫描子目录                |
| `-d <dir>`   | 输出目录（默认 `out/`）       |
| `-c <file>`  | 指定配置文件                  |
| `-t <dir>`   | 指定模板                      |
| `-R <file>`  | 指定首页 README               |
| `-v`         | 版本                          |

## 全标签速查

详见 [核心标签详解](./guide-line/tags.md) 与 [类与模块](./guide-line/classes-modules.md)。

| 标签                                | 用途 / 要点                                            |
| ----------------------------------- | ------------------------------------------------------ |
| `@param {类型} 名 - 描述`           | 参数；名后 `-` 可选（仅可读性）                         |
| `@returns` / `@return`              | 返回值，**两者互为别名、等价**                          |
| `@type {类型}`                      | 变量 / 常量类型                                         |
| `@typedef`                          | 定义可复用命名类型                                      |
| `@property` / `@prop`               | 描述对象成员（配合 `@typedef`）                         |
| `@callback`                         | 定义回调函数签名                                        |
| `@template`                         | 声明泛型类型参数                                        |
| `@enum {类型}`                      | 一组同类型命名常量，常配 `@readonly`                    |
| `@example`                          | 示例代码块，可多个                                      |
| `@throws` / `@exception`            | 可能抛出的异常类型与条件                                |
| `@async` / `@generator` / `@yields` | 异步 / 生成器及其产出（TS 不识别 `@async` / `@yields`） |
| `@deprecated`                       | 弃用标记（非 `@obsolete` / `@removed` / `@legacy`）     |
| `@see`                              | 交叉引用（符号或链接）                                  |
| `@summary`                          | 一句话摘要（vs `@description` 完整说明）                |
| `@ignore`                           | 让符号**不出现**在文档中                                |
| `@readonly`                         | 只读成员（文档语义）                                    |
| `@private` / `@protected` / `@public` / `@package` | 访问可见性（文档语义）                   |
| `@extends` / `@augments`            | 显式继承（别名）                                        |
| `@implements` / `@interface` / `@override` | 接口契约 / 重写                                  |
| `@module` / `@exports`              | 模块标记 / 显式导出                                     |
| `@author` / `@version` / `@since` / `@default` | 元信息 / 默认值                              |

**内联标签**（仅 4 个，写在 `{}` 内）：`{@link}`、`{@linkcode}`（等宽）、`{@linkplain}`（纯文本）、`{@tutorial}`。文本含 `}` 需转义 `\}`。

## 类型语法速查

详见 [类型表达式全集](./guide-line/types.md)。

| 写法                                  | 含义                          |
| ------------------------------------- | ----------------------------- |
| `{string}` `{number}` `{boolean}`     | 基础类型                      |
| `{?number}`                           | 可空（number 或 null）        |
| `{!string}`                           | 非空（前缀 `!`）              |
| `{type=}` / `[name]`                  | 可选参数                      |
| `[name=default]`                      | 可选 + 默认值                 |
| `{...number}`                         | 可变参数（rest）              |
| `{(string\|number)}`                  | 联合类型（竖线分组）          |
| `Array.<T>` / `T[]`                   | 数组（两种等价）              |
| `Object.<K, V>`                       | 键值映射                      |
| `{{a: number, b: string}}`            | 对象字面量类型                |
| `{function(string): boolean}`         | 函数类型                      |
| `{*}`                                 | 任意类型（any）               |
| `{null}` `{undefined}` `{void}`       | 特殊值                        |

## namepaths 速查

| 符号        | 含义           | 例                              |
| ----------- | -------------- | ------------------------------- |
| `#`         | 实例成员       | `Book#title`                    |
| `.`         | 静态成员       | `Point.fromString`              |
| `~`         | 内部成员       | `Person~say`                    |
| `module:`   | 模块           | `module:foo/bar`                |
| `external:` | 内置 / 外部对象 | `external:String`               |
| `event:`    | 事件           | `module:foo/bar.event:MyEvent`  |

## 配置字段速查（jsdoc.json）

格式为 JSON（3.3.0+ 可带注释）或 CJS 模块（3.5.0+），用 `-c jsdoc.json` 传入。

```json
{
  "source": {
    "include": ["src/"],
    "exclude": ["src/vendor"],
    "includePattern": ".+\\.js(doc|x)?$",
    "excludePattern": "(^|\\/|\\\\)_"
  },
  "plugins": ["plugins/markdown"],
  "recurseDepth": 10,
  "sourceType": "module",
  "tags": { "allowUnknownTags": true, "dictionaries": ["jsdoc", "closure"] },
  "templates": { "cleverLinks": false, "monospaceLinks": false },
  "opts": { "destination": "./docs/", "recurse": true, "readme": "README.md" }
}
```

| 字段                          | 作用                                                      |
| ----------------------------- | --------------------------------------------------------- |
| `source.include` / `exclude`  | 扫描 / 排除范围                                           |
| `source.includePattern` / `excludePattern` | 文件名正则；`excludePattern` 默认跳过下划线开头文件 |
| `plugins`                     | 插件路径（相对 JSDoc 目录）                               |
| `recurseDepth`                | `-r` 时递归深度（默认 10，3.5.0+）                         |
| `sourceType`                  | `module`（默认）/ `script`                                |
| `tags.allowUnknownTags`       | 布尔或允许的标签名数组（默认 true）                       |
| `tags.dictionaries`           | `jsdoc`（标准）/ `closure`（含 `!` `?`），**默认两者都启用** |
| `templates.cleverLinks` / `monospaceLinks` | 控制 `{@link}` 渲染风格                       |
| `opts`                        | 把命令行参数写进配置（destination / recurse / readme / template / tutorials） |

::: warning 命令行参数会覆盖配置文件
同一项若命令行和 `jsdoc.json` 都设了，**以命令行为准**。例如 `-d` 会覆盖 `opts.destination`。
:::

## 模板与插件

| 类别       | 选项                                                  |
| ---------- | ----------------------------------------------------- |
| **社区模板** | `docdash` / `better-docs` / `minami`（`-t` 或 `opts.template` 切换） |
| **内置插件** | `plugins/markdown`（注释内 Markdown → HTML）、`plugins/summarize` 等 |

## 工具链对比

| 工具                     | 角色                                         | 与 JSDoc 关系                          |
| ------------------------ | -------------------------------------------- | -------------------------------------- |
| **TypeDoc**              | 从 TS 类型系统生成 HTML 文档                 | TS 项目的对位选择；JSDoc 主纯 JS       |
| **API Extractor**（微软）| `.d.ts` rollup + API 报告 + 破坏性变更门禁   | 库作者向，搭 api-documenter 出 Markdown |
| **TSDoc**（微软）        | TS 注释**规范**（非生成器）                  | 规范化注释语法，被 api-extractor 读取   |
| **eslint-plugin-jsdoc**  | ESLint 规则集，校验 JSDoc 注释规范 / 完整性  | 适合 CI 门禁；JSDoc 本体不做这类校验    |
| documentation.js / ESDoc | 其他 JS 文档生成器                           | documentation.js 放缓、ESDoc 已弃用    |

::: tip 选型一句话
纯 JavaScript → **JSDoc**；TypeScript 项目要 API 文档 → **TypeDoc**；库作者要 API 报告 + 破坏性变更门禁 → **API Extractor**（注释规范用 **TSDoc**）；想在 CI 强制注释完整性 → **eslint-plugin-jsdoc**。它们互补而非互斥。
:::

## 版本与现状

- JSDoc 当前 **4.0.5**，引擎要求 Node `>=12`。
- 成熟稳定、feature-complete，更新节奏慢（不是停滞）。
- TypeDoc 0.28.x 活跃，紧跟 TypeScript 版本。

## 文档与 GitHub 链接

- 官方文档：[https://jsdoc.app/](https://jsdoc.app/)
- GitHub 仓库：[https://github.com/jsdoc/jsdoc](https://github.com/jsdoc/jsdoc)

返回：[核心标签详解](./guide-line/tags.md) · [类型表达式全集](./guide-line/types.md) · [类与模块](./guide-line/classes-modules.md) · [配合 TypeScript](./guide-line/typescript.md)
