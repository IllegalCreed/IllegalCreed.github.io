---
layout: doc
outline: [2, 3]
---

# CLI 与编程式 API

> 基于 publint v0.3.21 编写

## 速查

- 命令：`publint [path] [options]`；`path` 可为目录或 `.tgz` tarball，省略则查当前目录
- `--level <suggestion|warning|error>`：显示的最低级别，默认 `suggestion`（全显示）
- `--strict`：把 warning 当作 error（默认 `false`），CI 卡门禁常用
- `--pack <auto|npm|yarn|pnpm|bun|false>`：用哪个包管理器确定「将发布文件」，默认 `auto`
- 退出码：默认仅 `error` 致失败；`--strict` 下 `warning` 也致失败
- API：`import { publint } from 'publint'` → `await publint(options)` 返回 `{ messages, pkg }`
- API 选项：`pkgDir` / `level` / `strict` / `pack`（含 `{ tarball }` / `{ files }` 形态）
- `Message`：`{ code, args, path, type }`，`type` 为 `'suggestion'|'warning'|'error'`
- 格式化：`import { formatMessage } from 'publint/utils'` → `formatMessage(message, pkg)`

## CLI 用法

```bash
publint [path] [options]
```

`path` 是可选的位置参数：

- 传**目录**：lint 该目录下的包（如 `publint ./packages/my-lib`）
- 传 **tarball 文件**：直接分析 `.tgz`（如 `publint ./my-lib-1.0.0.tgz`）
- 省略：lint 当前工作目录

### 选项一览

| 选项                         | 取值 / 默认                                            | 作用                                         |
| ---------------------------- | ----------------------------------------------------- | -------------------------------------------- |
| `--level <level>`            | `suggestion`(默认) / `warning` / `error`              | 只显示不低于该级别的消息                     |
| `--strict`                   | 布尔，默认 `false`                                    | 把 `warning` 当作 `error`（影响退出码）      |
| `--pack <pm>`                | `auto`(默认) / `npm` / `yarn` / `pnpm` / `bun` / `false` | 用哪个包管理器打包、确定「将发布的文件清单」 |

```bash
# 只看 warning 与 error
publint --level warning

# 警告也视为失败（CI 门禁）
publint --strict

# 指定用 npm 来打包推断文件清单
publint --pack npm
```

::: tip --pack 在查什么
publint 需要知道「真正会被发布的文件」才能准确判断文件存在性、是否被 `files` 漏掉。`--pack` 借助包管理器的 `pack` 能力（类似 `npm pack`）来获取这份清单。`auto` 会自动探测当前项目用的包管理器；`false` 则不打包、直接基于目录推断。
:::

## 编程式 API

把 publint 集成进自定义脚本或工具：

```js
import { publint } from "publint";

const { messages, pkg } = await publint({
  pkgDir: "./packages/my-lib",
  level: "warning",
  strict: false,
});

console.log(`共发现 ${messages.length} 个问题`);
```

### 选项（Options）

| 字段      | 类型 / 取值                                                              | 说明                                       |
| --------- | ----------------------------------------------------------------------- | ------------------------------------------ |
| `pkgDir`  | `string`                                                                | 要检查的包目录                             |
| `level`   | `'suggestion' \| 'warning' \| 'error'`                                  | 返回消息的最低级别                         |
| `strict`  | `boolean`                                                               | 是否把 warning 视为 error                  |
| `pack`    | `'auto'\|'npm'\|'yarn'\|'pnpm'\|'bun'\| { tarball } \| { files } \| false` | 打包来源；也可直接传 tarball 或预解包文件 |

### 返回值（Result）

```ts
interface Result {
  messages: Message[]; // 发现的问题列表
  pkg: Record<string, any>; // 解析后的 package.json，配合 formatMessage 用
}
```

### Message 结构

```ts
interface Message {
  code: string; // 规则码，如 'EXPORTS_TYPES_SHOULD_BE_FIRST'
  args: Record<string, any>; // 填充消息模板的参数
  path: string[]; // 定位到 package.json 字段的键路径，如 ['exports', '.', 'types']
  type: "suggestion" | "warning" | "error"; // 严重级别
}
```

`messages` 是**结构化数据**，方便你自行筛选、统计或对接其它系统；它本身不是给人读的字符串。

## 格式化为可读文本

把结构化消息渲染成终端能看的文本，用 `publint/utils` 的 `formatMessage`：

```js
import { publint } from "publint";
import { formatMessage } from "publint/utils";

const { messages, pkg } = await publint({ pkgDir: "./my-lib" });

for (const message of messages) {
  // 传入单条 message 与 pkg，得到一段可读字符串
  console.log(formatMessage(message, pkg));
}
```

::: tip CLI 内部也是这么做的
publint 的命令行输出，正是用 `formatMessage` 把每条 `Message` 渲染出来的。结构化数据 + 格式化函数分离，让你能完全自定义展示方式（如输出 JSON、接入自己的报告面板）。
:::

## 接入 CI / 发布流程

推荐「构建后、发布前」体检，并用 `--strict` 收紧：

```json
// package.json
{
  "scripts": {
    "build": "tsup",
    "lint:package": "publint --strict",
    "prepublishOnly": "npm run build && npm run lint:package"
  }
}
```

这样 `npm publish` 前会自动先 build、再以严格模式跑 publint，任何警告都会中断发布。配合 [attw](./with-arethetypeswrong.md) 一起跑可进一步覆盖类型解析问题。

字段与规则的完整清单见 [参考](../reference.md)。
