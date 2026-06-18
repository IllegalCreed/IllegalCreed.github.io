---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 TypeDoc 0.28.x 编写

## 速查

- 安装：`npm install --save-dev typedoc`（typedoc 把 `typescript` 当 peer 依赖，需自备）
- 最简生成：`npx typedoc src/index.ts` —— 单入口，默认输出到 `./docs`
- 显式入口 + 输出：`npx typedoc --entryPoints src/index.ts --out api`
- **核心区别**：TypeDoc 直读 **TS 类型系统**拿真实类型（推断/泛型/联合），JSDoc 靠注释里的 `@type` 标注——所以签名不写注释也能生成
- 工作流：从 entry point 出发，跟随 `export` / re-export 跨文件 → 构建 `ProjectReflection` 反射树 → 渲染 HTML 或序列化 JSON
- `entryPoints` 默认**自动发现**：读 package.json 的 `exports` 或 `main` 字段
- TypeDoc 复用 tsconfig 的 `compilerOptions` / `include` / `exclude` 决定编译范围，默认从当前目录向上自动找 tsconfig.json
- 0.28 已是纯 **ESM**，drop 了 TS < 5.0；peer 支持 TS `5.0 ~ 6.0`

## 定位与工具链坐标

TypeDoc 是 **TypeScript 专用**的 API 文档生成器。它最重要的卖点是：**不靠解析注释里的类型标注来推断类型，而是用 TS 编译器（typescript 包）拿到真实类型**——包括你没写出来、由编译器推断的类型、泛型约束、联合类型。

这条分界决定了它和 JSDoc 的根本不同：

| 维度         | **TypeDoc**                            | **JSDoc**                          |
| ------------ | -------------------------------------- | ---------------------------------- |
| 类型来源     | **TS 编译器 / 类型系统**（含推断、泛型） | 注释里的 `@type` / `@param {T}` 标注 |
| 注释的职责   | 只负责"描述文字"，类型自动来自 TS       | 既描述，又承载类型信息             |
| 输入         | TS 源码 + tsconfig + 注释              | JS/TS 源码 + JSDoc 注释            |
| 不写注释     | 签名/参数/返回类型**照样生成**         | 缺类型标注则信息缺失               |

::: tip 什么时候选 TypeDoc
项目是 TS 写的、想要一个**可浏览的 API 参考站点**（类/接口/函数/类型别名页 + 搜索 + 源码链接），或想要结构化 JSON 喂给其他工具——选它。纯 JS 项目用 [JSDoc](../jsdoc/)；只想做 `.d.ts` 公共 API 审计/防破坏性变更用 API Extractor；只想规范注释写法不生成站点，TSDoc 是规范不是生成器。
:::

## 安装与命令行

```bash
npm install --save-dev typedoc        # typedoc 自带 typescript 作为 peer 依赖
npx typedoc src/index.ts              # 最简：单入口 → 默认输出到 ./docs
npx typedoc --entryPoints src/index.ts --out api   # 显式入口 + 输出目录
```

高频 CLI flag：

| flag                       | 等价 option       | 说明                                   |
| -------------------------- | ----------------- | -------------------------------------- |
| `typedoc src/index.ts`     | `entryPoints`     | 位置参数即入口（可多个 glob）          |
| `--entryPoints <glob>`     | `entryPoints`     | 显式入口，可重复传                     |
| `--out <dir>`              | `out`             | HTML 输出目录                          |
| `--json <file>`            | `json`            | 额外输出 JSON 反射数据（会覆盖 `outputs`） |
| `--tsconfig <file>`        | `tsconfig`        | 指定 tsconfig.json（默认自动向上查找） |
| `--plugin <name>`          | `plugin`          | 加载插件，可重复                       |
| `--theme <name>`           | `theme`           | 主题名（默认 `default`）               |
| `--watch`                  | `watch`           | 监听模式增量重建                       |
| `--name <str>`             | `name`            | 站点标题（默认取 package.json 的 name）|
| `--readme <path\|none>`     | `readme`          | 首页 README；`none` 关闭首页           |
| `--skipErrorChecking`      | `skipErrorChecking` | 跳过 TS 类型错误检查（提速，慎用）   |
| `--showConfig`             | `showConfig`      | 打印最终生效配置后退出（排错神器）     |

::: tip 布尔与对象选项的命令行写法
布尔选项：`--excludePrivate` 开启，`--excludePrivate false` 显式关闭。对象选项用点路径：`--jsDocCompatibility.defaultTag false`、`--validation.notDocumented true`。
:::

## 入口点基础

`entryPoints` 是"要文档化的入口" glob 数组。**不配时会自动发现**——读 package.json 的 `exports` 或 `main` 字段。TypeDoc 从入口出发，跟随 `export` / re-export 跨文件解析。

```jsonc
// typedoc.json
{ "entryPoints": ["src/index.ts", "src/alt.ts", "src/multiple/*.ts"] }
```

入口的解析行为由 `entryPointStrategy` 控制（默认 `resolve`），四种值各有用途，详见[配置详解](./guide-line/configuration.md)：

| 值          | 行为                                              | 典型场景         |
| ----------- | ------------------------------------------------- | ---------------- |
| `resolve`（默认） | 入口须在根 tsconfig 工程内；目录入口取 `<dir>/index` | 库有单一/少数入口 |
| `expand`    | 目录被**递归展开**，每个文件都成独立入口          | 想给每个文件单独出页 |
| `packages`  | 入口是含自己 package.json 的**目录**，各包独立跑再合并 | **monorepo** 主力 |
| `merge`     | 入口是之前 `--json` 跑出的 `.json` 文件，合并成一个站点 | 分阶段/分仓库构建 |

## 第一次生成文档

假设有一个最小的库 `src/index.ts`：

```ts
/**
 * 把两个数相加。
 *
 * @param a - 第一个加数
 * @param b - 第二个加数
 * @returns 两数之和
 *
 * @example
 * ```ts
 * add(1, 2); // => 3
 * ```
 */
export function add(a: number, b: number): number {
  return a + b;
}

/** 一个简单的计数器类。 */
export class Counter {
  /** 当前计数值。 */
  count = 0;
  /** 计数 +1 并返回新值。 */
  increment(): number {
    return ++this.count;
  }
}
```

跑一条命令：

```bash
npx typedoc --entryPoints src/index.ts --out docs
```

打开 `docs/index.html` 即可看到：`add` 函数页（**参数类型 `number`、返回类型 `number` 都自动从 TS 推出**，注释只提供了描述文字）、`Counter` 类页（含 `count` 属性与 `increment` 方法）、顶部搜索框、源码链接。注意 `increment` 的返回类型 `number` 即使注释没写，也被 TS 编译器推断并展示出来——这正是 TypeDoc 的核心能力。

::: warning 注释正文支持 Markdown，但代码块只认围栏
注释正文用 markdown-it 渲染，**支持 Markdown**；代码高亮用 Shiki，**仅识别围栏代码块**（```` ```ts ````），不支持缩进式代码块。用反斜杠可转义 `{ } @ /` 输出字面量。
:::

## 与 tsconfig 的关系入门

TypeDoc 会**复用 tsconfig 的 `compilerOptions`、`include` / `exclude`** 来决定哪些文件被 TS 编译。默认从当前目录向上自动查找 tsconfig.json，也可用 `--tsconfig` 指定。

最容易踩的坑是：**typedoc 自己的 `exclude` 只决定"哪些文件不当入口"，不影响 TS 编译范围**。要把某文件彻底排除出编译，得改 **tsconfig.json 的 `exclude`**。

```jsonc
// typedoc.json —— 仅配置文件可用 compilerOptions，选择性覆盖 TS 编译选项
{
  "entryPoints": ["src/index.ts"],
  "compilerOptions": {
    "skipLibCheck": true,      // 第三方 .d.ts 不干净时避免报错
    "strictNullChecks": false  // 仅为生成文档时生效，不动你的真实 tsconfig
  }
}
```

::: warning 第三方 .d.ts 报错
TypeDoc 会跑 TS 类型检查，第三方库类型不干净时会报错。对策：在 `compilerOptions` 里加 `"skipLibCheck": true`，或用 `--skipErrorChecking` 跳过检查（但后者会漏掉你自己代码的真实类型错误，慎用）。
:::

下一步：[注释与标签体系](./guide-line/comments-tags.md) · [配置详解](./guide-line/configuration.md) · [主题与插件](./guide-line/themes-plugins.md) · [接入文档站](./guide-line/docs-site.md) · [速查参考](./reference.md)
