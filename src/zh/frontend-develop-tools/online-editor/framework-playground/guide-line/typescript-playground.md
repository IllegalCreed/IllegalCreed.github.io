---
layout: doc
outline: [2, 3]
---

# TypeScript Playground

> 基于三家官方 Playground 2025–2026 现状编写

## 速查

- **地址**：<https://www.typescriptlang.org/play>（也可写 `/play/`）；底层 = **Monaco Editor + 浏览器内 tsc**，开源在 `microsoft/TypeScript-Website` 的 `packages/playground`
- **TS Config 面板**：可视化勾选编译选项（`target`、`strict`、`noImplicitAny`、`strictNullChecks`、`esModuleInterop`、`jsx` 等）；改动的 flag 自动记进分享 URL
- **Lang 下拉**：在 **TypeScript / TypeScript Definitions（.d.ts）/ JavaScript** 间切换编辑器模式
- **输出 Sidebar 标签**：**`.JS`**（降级后的 JS）/ **`.D.TS`**（生成的声明）/ **`Errors`** / **`Logs`**（配工具栏 **Run**）/ **`Plugins`**
- **多文件**：靠 twoslash 注释 **`// @filename: foo.ts`** 在单编辑器里切分虚拟文件（**不是真文件标签**）
- **分享 URL 两套**：代码在 **hash**（`#code/` + lz-string 压缩）；版本 / flag 在 **query**（`?ts=5.x` / `?ts=next` / `?flag=value` / `?filetype=js|ts|dts`）
- **版本切换**：`?ts=5.x.x`（指定）/ `?ts=next`（nightly）/ `?ts=dev`（本地构建）
- **Examples 面板**：内置大量分类示例，`#example/<id>` 可直达
- **Plugins**：第三方插件挂 Sidebar，npm 发布后可用；可连 `localhost` 调试
- **Export 出口**：可导出到 CodeSandbox / StackBlitz / VS Code、AST Viewer、Bug Workbench 等
- **文档**：Playground Handbook（站内 `/_playground-handbook/*.html`）

## 底层：Monaco + 浏览器内的 tsc

TypeScript Playground 把 **Monaco Editor**（VS Code 的编辑器内核）和**完整的 TypeScript 编译器（tsc）**一起打包进前端，全部在你的浏览器里跑。所以它能即时提供补全、类型检查、报错，也能即时把你的 TS 编译成 JS——**全程不连服务器**。

源码开源在 `microsoft/TypeScript-Website` 仓库的 `packages/playground`。

## Compiler Options：TS Config 面板

左上的 **TS Config** 面板把编译选项做成了可视化勾选，常见可见项包括：

- `target`（编译目标，决定语法降级到哪个 ES 版本）
- `strict` 及其细分：`noImplicitAny`、`strictNullChecks` 等
- `esModuleInterop`、`jsx` 等

面板旁还有 **Lang（语言）下拉**，可在三种编辑器模式间切换：**TypeScript / TypeScript Definitions（即 `.d.ts`）/ JavaScript**。

::: tip flag 改动会自动进分享 URL
你在 TS Config 面板里改过的编译选项，会被记录为「相对默认值的 diff」并写进分享 URL。别人打开链接就得到**同样的编译器配置**，无需你口头叮嘱「记得开某个 flag」。这正是 Playground 做 repro 精确的关键之一。
:::

## 输出 Sidebar：看编译产物的核心

右侧 Sidebar 的几个标签，是「看编译产物」教学价值的落点：

| 标签         | 看什么                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------- |
| **`.JS`**    | 代码按 `target`（默认约 ES2017）转译后的 **JavaScript**，随输入实时更新——看**语法降级（downleveling）**就在这里。`.d.ts` 文件会被正确显示为「无 JS 等价物」 |
| **`.D.TS`**  | TS 为你的代码生成的 **`.d.ts` 声明文件**——理解 `export` 的效果、类型解析；用 JS + JSDoc 写库时也能看推断出的声明 |
| **`Errors`** | 编译 / 类型错误                                                                              |
| **`Logs`**   | `console.log/warn/debug` 的输出；配合工具栏的 **Run** 按钮运行代码后在此查看                  |
| **`Plugins`**| 插件 Sidebar（见下文）                                                                       |

::: tip `.JS` 看降级、`.D.TS` 看声明
想搞懂「我这段 TS 在某个 `target` 下会变成什么 JS」，盯 **`.JS`** 标签改 `target` 看变化；想搞懂「这个模块对外暴露出怎样的类型」，看 **`.D.TS`**。这两个标签是 TS Playground 区别于普通编辑器的灵魂。
:::

## 多文件：靠 `// @filename:` twoslash 注释

⚠️ 这是 TS Playground 和 Vue / Svelte 的一个关键不同：**它没有多个真实的文件标签页**。多文件是通过 **twoslash 注释 `// @filename: foo.ts`** 在**同一个编辑器**里切分多个虚拟文件实现的。

```ts
// @filename: math.ts
export function add(a: number, b: number) {
  return a + b;
}

// @filename: main.ts
import { add } from "./math";
console.log(add(1, 2));
```

twoslash 是 TS 官方文档 / 示例使用的一套以 `// @` 开头的标注体系，输入即生效、可随 URL 分享。除 `@filename` 外常用的还有：

| twoslash 标记            | 作用                                            |
| ------------------------ | ----------------------------------------------- |
| `// @errors: 2345`       | 标注预期的错误码                                |
| `//    ^?`               | 行内实时显示某变量的类型（type query）          |
| `// @showEmit`           | 查看 emit 产物                                  |
| `// @target: esnext`     | 带值的编译 flag                                 |
| `// @module: nodenext`   | 带值的编译 flag                                 |
| `// @lib: es2015,dom`    | 列表型 flag                                     |
| `// @isolatedModules`    | 布尔 flag                                       |

::: warning 别和 Vue / Svelte 的「真文件标签」搞混
Vue / Svelte 的多文件是顶部一排**真实文件标签**（`App.vue`、`import-map.json` 等）。TS 这边是**单编辑器 + `// @filename:` 注释切分**，二者机制不同。
:::

## 分享 URL：hash 装代码、query 装配置

这是 TS Playground 最容易被笼统讲错的点——分享 URL 是**两套机制**，别一概说成「都在 hash 里」：

| 段落          | 装什么       | 示例                                                                 |
| ------------- | ------------ | -------------------------------------------------------------------- |
| **Hash（`#`）** | **编辑器状态** | `#code/PRAz3dDc3...`（用 lz-string 的 `compressToEncodedURIComponent` 压缩的代码）；旧格式 `#src=...`（URLEncoded，向后兼容）；`#example/xxx`（加载示例）；`#show-examples` 等 UI 动作 |
| **Query（`?`）** | **配置默认值** | `?ts=`（版本）、`?flag=value`（任意编译 flag）、`?filetype=js|ts|dts`（编辑器语言） |

- URL 随编辑**实时更新**（HTML5 `replaceState`），浏览器后退键正常工作。
- URL 内含的信息让复现精确：是否在某 example、gzip 压缩的源码、所用语言、**编译器设置相对默认的 diff**、文本选区。

### 版本切换

通过 query 参数切 TypeScript 版本：

| 参数           | 含义               |
| -------------- | ------------------ |
| `?ts=5.x.x`    | 指定具体版本       |
| `?ts=next`     | nightly（最新构建）|
| `?ts=dev`      | 本地构建           |

可用版本列在站点的 `releases.json` / `pre-releases.json` 里。

## Examples、Plugins 与导出

### Examples 面板

内置大量分类示例：JavaScript Essentials、Functions with JavaScript、Working With Classes、Modern JavaScript、External APIs（含 React / Deno / Node / WebGL）、Primitives / Meta-Types / Language Extensions 等。URL 可直达：`#example/generic-functions`（按 example id 加载）。TS 官方文档（如各版本 release notes）大量用 `/play/#example/optional-chaining` 这类链接做「即点即试」。

### Plugins 面板

Playground 支持**第三方插件**，挂到 Sidebar 扩展功能（官方 Sidebar 本身就建在同一套插件基础设施上）：

- **开发**：在 Options 菜单里连本地 dev server（`Connect to localhost:5000/index.js`）调试。
- **发布**：打磨好后发布到 **npm registry**，即进入 Plugins sidebar。
- **示例插件**：Presentation Mode、Clippy、TSQuery、Collaborate、Transformer Timeline 等（样例仓库 `microsoft/TypeScript-Playground-Samples`）。

### 导入类型 / npm 包

可在代码里直接 `import` 第三方类型，Playground 会**自动拉取对应的 `.d.ts`**（例如从 npm / `@types`）；External APIs 示例里直接演示了 React / Node 等。

### Export 菜单：跳去通用编辑器的出口

Export 菜单可把当前 Playground 导出到：Tweet、Markdown Issue / Link（含 Preview）、TypeScript AST Viewer、Bug Workbench，以及 **Open in CodeSandbox / StackBlitz / VS Code TS Playground（alpha）**。

::: tip 这正是「学习 → 开发」的过渡锚点
当你在 Playground 里调通一个最小示例、想把它扩成完整项目时，Export 菜单的 **Open in CodeSandbox / StackBlitz** 让你一键带着代码跳进通用编辑器。这是「官方 Playground（学习 / repro）→ 通用在线 IDE（开发）」最顺滑的衔接。
:::
