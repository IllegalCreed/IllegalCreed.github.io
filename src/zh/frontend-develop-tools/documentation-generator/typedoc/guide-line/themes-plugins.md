---
layout: doc
outline: [2, 3]
---

# 主题与插件

> 基于 TypeDoc 0.28.x 编写

## 速查

- TypeDoc 内置**唯一**默认主题 `default`，更多主题由插件提供；`--theme <name>` 切换
- 小改样式不必写主题：用 `customCss` / `customJs`（拷进 assets 目录）即可
- **`router` 选项**（0.28 新增，默认 `kind`）：决定 HTML 输出的文件夹结构与页面间链接，可选 `kind` / `kind-dir` / `structure` / `structure-dir` / `group` / `category`
- 接 VitePress/Docusaurus 必须用 **`typedoc-plugin-markdown`**（默认主题只出 HTML）
- 插件加载：`--plugin <name>` 或配置 `"plugin": ["a", "b"]`；npm 关键词 `typedoc-plugin`
- **`@group` 有按 TS kind 的默认分组，`@category` 没有自动分类**——这是两者最大区别
- `categorizeByGroup`（默认 false）：开启后在每个 group 内部再按 category 分（两级）
- `sort` 默认 `["kind", "instance-first", "alphabetical-ignoring-documents"]`，多策略顺序应用

## 主题

TypeDoc 只内置**一个**默认主题 `default`，用 `--theme <name>` 切换到插件提供的主题。小改样式根本不必写主题：

```jsonc
// typedoc.json —— 不写主题，只注入自定义样式/脚本
{
  "customCss": "./typedoc-theme.css",
  "customJs": "./typedoc-extra.js",
  "favicon": "./favicon.ico"
}
```

### router 选项（0.28 新增）

`router`（默认 `kind`）决定 HTML 输出的**文件夹结构**与页面间链接方式，可被插件扩展：

| 值              | 文件夹组织方式                |
| --------------- | ----------------------------- |
| `kind`（默认）  | 按反射 kind（类/接口/函数…）  |
| `kind-dir`      | 按 kind，但每类一个目录       |
| `structure`     | 按源码模块结构                |
| `structure-dir` | 按结构，每模块一个目录        |
| `group`         | 按 `@group` 分组              |
| `category`      | 按 `@category` 分类           |

高亮主题用 `lightHighlightTheme` / `darkHighlightTheme`（Shiki 主题名），语言集用 `highlightLanguages`。

### 社区 HTML 主题

| 主题                                  | 风格                |
| ------------------------------------- | ------------------- |
| `typedoc-theme-oxide`                 | Rustdoc 风          |
| `typedoc-github-theme`                | GitHub 风           |
| `typedoc-material-theme`              | Material 3          |
| `@typhonjs-typedoc/typedoc-theme-dmt` | DMT，增强 UX        |

npm 关键词 `typedoc-theme` 可搜更多。

::: tip 自定义主题（编程向）
在插件 `load(app)` 里用 `app.renderer.defineTheme("name", ThemeClass)` 注册；自定义主题通常**继承 `DefaultTheme`**，并通过 `DefaultThemeRenderContext` 覆盖局部模板函数，或监听 `app.renderer` 的事件改 HTML。
:::

## 插件生态

加载插件：`--plugin <name>`（可重复）或配置文件 `"plugin": ["a", "b"]`。npm 关键词 `typedoc-plugin` 搜插件。最重要的是 `typedoc-plugin-markdown`（Markdown 输出，接文档站的命脉）。

常用插件清单：

| 插件                                   | 作用                                              |
| -------------------------------------- | ------------------------------------------------- |
| **typedoc-plugin-markdown**            | 输出 Markdown（接 VitePress/Docusaurus/wiki）     |
| **typedoc-vitepress-theme**            | 配合上者，生成 VitePress 结构 + `typedoc-sidebar.json` |
| **docusaurus-plugin-typedoc**          | 接 Docusaurus                                     |
| **typedoc-plugin-missing-exports**     | 把**未导出**但被引用的类型也纳入文档              |
| **typedoc-plugin-coverage**            | 生成文档覆盖率徽章                                |
| **@boneskull/typedoc-plugin-mermaid**  | 渲染 Mermaid 图                                   |
| **typedoc-umlclass**                   | 生成 UML 类图                                     |
| **typedoc-plugin-zod** / **-valibot**  | 把 `z.infer<typeof x>` 替换为推断出的真实类型     |
| **typedoc-plugin-mdn-links**           | 把内置类型链接到 MDN（官方示例插件）              |
| **typedoc-plugin-frontmatter**         | 给 Markdown 输出加 frontmatter                    |
| **typedoc-plugin-rename-defaults**     | 给默认导出起有意义的名字                          |
| **typedoc-plugin-llms-txt**            | 生成 llms.txt 供 LLM 消费                         |

```js
// plugin.js —— npx typedoc --plugin ./plugin.js
import { Converter } from "typedoc";
/** @param {import("typedoc").Application} app */
export function load(app) {
  // 监听转换/渲染事件；可用 app.options.addDeclaration 加自定义选项
  app.converter.on(Converter.EVENT_CREATE_DECLARATION, (_ctx, refl) => {
    // 处理每个新建的声明反射
  });
}
```

## 分组（@group）vs 分类（@category）

这是 TypeDoc 组织页面的**两个独立维度**，都用于在页面索引下分节，都可多次标记（一个反射可出现在多个标题下）。最关键的区别：

| 维度          | 标签        | 不标时的默认行为                                  | 描述标签             |
| ------------- | ----------- | ------------------------------------------------- | -------------------- |
| **Group 分组** | `@group X`  | **自动按 TS kind 分组**（Functions / Classes / Interfaces…） | `@groupDescription`  |
| **Category 分类** | `@category X` | **不自动分**（未标的进 `defaultCategory`，默认 "Other"） | `@categoryDescription` |

核心区别：`@group` 有"按 kind 的默认分组"，`@category` 没有自动分类。`@group` 能**模拟自定义成员类型**（如把若干静态常量归到 "Events" 组）。

```ts
/**
 * @groupDescription Events
 * Events are for ...
 * @showGroups
 */
export class App extends EventEmitter {
  /** @group Events */
  static readonly BEGIN = "begin";
}
```

```ts
/** @category General Use */
export function runProcess(): void;

/** @category Advanced Use */
export function unref(): void;
```

::: tip categorizeByGroup —— 两级嵌套
`categorizeByGroup`（默认 `false`）开启后**在每个 group 内部再按 category 分**（即先 group 后 category 的两级）。`defaultCategory`（默认 `"Other"`）是只有部分元素被分类时其余的归属。0.28 起 `@group none` / `@category none` 渲染时**不出标题**（直接平铺）。`@event` / `@eventProperty` 等价于 `@group Events`。
:::

导航控制标签（放在父反射上）：`@showGroups` / `@hideGroups`、`@showCategories` / `@hideCategories`，或全局 `navigation.includeGroups` / `navigation.includeCategories`；`@disableGroups` 对某父反射禁用分组。

## 排序（sort / kindSortOrder）

`sort`（默认 `["kind", "instance-first", "alphabetical-ignoring-documents"]`）是多策略**顺序应用**——先按 kind，再实例优先，再字母序。全部策略值：

```
source-order、alphabetical、alphabetical-ignoring-documents、
enum-value-ascending、enum-value-descending、static-first、instance-first、
visibility、required-first、kind、external-last、documents-first、documents-last
```

| 选项                   | 默认                                | 作用                          |
| ---------------------- | ----------------------------------- | ----------------------------- |
| `sort`                 | `["kind","instance-first","alphabetical-ignoring-documents"]` | 多策略顺序应用 |
| `kindSortOrder`        | `Reference, Project, Module, Namespace, Enum, …` | 同 kind 内的排序 |
| `sortEntryPoints`      | `true`                              | 顶层成员是否也按 `sort` 排    |
| `groupReferencesByType`| `false`                             | 把 re-export 归到被引成员所在类型分组下 |

`kindSortOrder` 默认顺序（节选）：`Reference, Project, Module, Namespace, Enum, EnumMember, Class, Interface, TypeAlias, Constructor, Property, Variable, Function, Accessor, Method`。

## typedoc-plugin-markdown 简介

这是接 Markdown 文档站的命脉插件（当前 4.12.0，peer `typedoc: 0.28.x`）。它把反射树渲染为 **Markdown** 而非 HTML。常用输出选项：

| 选项                                          | 作用                                          |
| --------------------------------------------- | --------------------------------------------- |
| `hideBreadcrumbs` / `hidePageHeader`          | 去面包屑 / 页头                               |
| `entryFileName`                               | 入口 Markdown 文件名（默认 `README.md`，VitePress 常改 `index.md`） |
| `useCodeBlocks`                               | 是否用代码块渲染                              |
| `parametersFormat` / `propertiesFormat` / `enumMembersFormat` | 成员渲染格式（`list` / `table`）  |

::: warning 想接 VitePress/Docusaurus 却用默认主题
默认主题**只出 HTML**，无法注入 Markdown 文档站。必须装 `typedoc-plugin-markdown`（+ vitepress/docusaurus 配套）。完整接入流程见[接入文档站](./docs-site.md)。
:::

下一步：[接入文档站](./docs-site.md) · [配置详解](./configuration.md) · [注释与标签体系](./comments-tags.md) · [速查参考](../reference.md)
