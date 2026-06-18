---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 TypeDoc 0.28.x 编写

## 速查

- 安装：`npm install --save-dev typedoc`；最简：`npx typedoc src/index.ts`（默认输出 `./docs`）
- 当前 latest **0.28.19**，纯 **ESM**，peer TS `5.0 ~ 6.0`，仍是 0.x（minor 可含破坏性变更）
- 标签三类：Block（`@param`）/ Modifier（`@internal`）/ Inline（`{@link}`），各有白名单 `blockTags`/`modifierTags`/`inlineTags`
- `entryPointStrategy` 四值：`resolve`（默认）/ `expand` / `packages` / `merge`
- 可见性：`excludePrivate`=**true**、`excludeProtected`=false、`excludeInternal`=跟随 TS `stripInternal`
- 校验：`notExported`/`invalidLink`=true、`notDocumented`=**false**；CI 用 `treatValidationWarningsAsErrors`
- 接 VitePress/Docusaurus **必须 `typedoc-plugin-markdown`**（默认主题只出 HTML）
- 工具链坐标：TypeDoc 主 TS（读类型系统）、JSDoc 主纯 JS（读注释标注）、API Extractor 做 API 治理、TSDoc 是注释规范

## CLI 速查

```bash
npx typedoc --entryPoints src/index.ts --out docs      # 单入口出 HTML
npx typedoc --entryPoints src/index.ts --json docs/api.json   # 出 JSON（会覆盖 outputs）
npx typedoc --treatWarningsAsErrors --validation.notDocumented true   # 严格 CI
npx typedoc --watch                                    # 监听
npx typedoc --showConfig                               # 打印最终生效配置后退出
```

| flag                   | 等价 option       | 说明                          |
| ---------------------- | ----------------- | ----------------------------- |
| `--entryPoints <glob>` | `entryPoints`     | 显式入口，可重复              |
| `--out <dir>`          | `out`             | HTML 输出目录                 |
| `--json <file>`        | `json`            | JSON 反射数据（覆盖 outputs） |
| `--tsconfig <file>`    | `tsconfig`        | 指定 tsconfig.json            |
| `--plugin <name>`      | `plugin`          | 加载插件，可重复              |
| `--theme <name>`       | `theme`           | 主题名（默认 `default`）      |
| `--watch`              | `watch`           | 监听增量重建                  |
| `--skipErrorChecking`  | `skipErrorChecking` | 跳过 TS 类型检查（慎用）    |

## 全标签速查

详见 [注释与标签体系](./guide-line/comments-tags.md)。

**Block 块标签**（独占段落）：

| 标签           | 别名         | 用途                       |
| -------------- | ------------ | -------------------------- |
| `@param`       |              | 描述参数（破折号可选）     |
| `@returns`     | `@return`    | 描述返回值                 |
| `@typeParam`   | `@template`  | 泛型类型参数               |
| `@remarks`     |              | 摘要外的补充详述           |
| `@example`     |              | 用法示例（0.28 语义变了）  |
| `@defaultValue`| `@default`   | 默认值                     |
| `@see` / `@deprecated` / `@throws` | | 交叉引用 / 废弃 / 异常 |
| `@category` / `@group` |      | 自定义分类 / 分组          |
| `@module`      |              | 文件级注释 + 重命名模块    |

**Modifier 修饰标签**（纯开关）：`@internal`、`@hidden` / `@ignore`、`@alpha` / `@beta` / `@experimental`、`@public` / `@private` / `@protected`、`@readonly`、`@class` / `@interface` / `@enum` / `@namespace` / `@function`、`@event` / `@eventProperty`、`@overload`、`@packageDocumentation`、`@primaryExport`（0.28 新增）。

**Inline 内联标签**（嵌在文字里）：`{@link}` / `{@linkcode}`（等宽）/ `{@linkplain}`（普通）、`{@inheritDoc}`、`{@label}`、`{@include}` / `{@includeCode}`（0.28 新增）。

## 配置 options 速查

详见 [配置详解](./guide-line/configuration.md)。

| 分类         | option                                            | 默认       | 作用                     |
| ------------ | ------------------------------------------------- | ---------- | ------------------------ |
| Config       | `tsconfig` / `compilerOptions` / `plugin`         | 自动       | tsconfig / 编译覆盖 / 插件 |
| Input        | `entryPoints` / `entryPointStrategy`              | `resolve`  | 入口与策略               |
| Input        | `exclude` / `externalPattern` / `excludeExternals`| false      | 排除文件 / 外部模块      |
| Input        | `excludePrivate` / `excludeProtected` / `excludeInternal` | 见可见性 | 可见性过滤        |
| Input        | `name` / `includeVersion` / `readme`              | —          | 元信息                   |
| Output       | `out` / `outputs` / `json` / `pretty` / `emit`    | `docs`     | 输出位置 / 格式          |
| Output       | `theme` / `router` / `customCss` / `navigationLinks` | `default`/`kind` | 主题 / 路由 / 定制 |
| Organization | `categorizeByGroup` / `defaultCategory` / `sort` / `kindSortOrder` | false/Other | 分组 / 排序 |
| Validation   | `validation` / `treatWarningsAsErrors` / `treatValidationWarningsAsErrors` | — | 校验   |
| Other        | `watch` / `showConfig` / `logLevel`               | —          | 其它                     |

**`entryPointStrategy` 四值**：`resolve`（默认，跟 re-export）/ `expand`（每文件出页）/ `packages`（monorepo）/ `merge`（合并 JSON）。

**`validation` 子项默认**：`notExported`=true、`invalidLink`=true、`invalidPath`=true、`rewrittenLink`=true、`notDocumented`=**false**、`unusedMergeModuleWith`=true。

## 0.28 重大变更清单

从 0.27 升 0.28 是版本差异题富矿，纯 ESM + drop TS < 5.0。

**破坏性变更：**

| 变更                          | 说明 / 迁移                                              |
| ----------------------------- | ------------------------------------------------------- |
| 引入 `Router` 抽象            | `Reflection.url` / `.anchor` / `.hasOwnDocument` **被移除**（旧主题/插件需改写） |
| 入口 glob 必须用 `/` 分隔     | 不再接受反斜杠（Windows 上 `src\\index.ts` 失效）       |
| `intentionallyNotExported` 改路径 | 文件名引用改为**包相对路径**（原绝对路径）          |
| `merge` 策略要求 JSON 来自 0.28+ | 老版本 JSON 不能合并                                  |
| `@example` 语义变化           | 移除"具名示例（首行当标题）"，改为无围栏时整段当代码    |
| 选项重命名                    | `namedAnchors` → **`useHTMLAnchors`**；移除 `hideInPageTOC` |
| 函数型变量导出                | 仅当用函数表达式初始化才当 function，否则需 `@function` 标签 |
| `@group`/`@category` 不再剥离 | 改用 `notRenderedTags` 跳过渲染                         |
| 移除 `jp` locale              | 迁 `ja`                                                 |

**新增：**

- **`outputs` 数组**：一次运行多种输出（HTML + JSON + 自定义）。
- **`router` 选项**：改输出目录结构，可被插件扩展。
- 新标签：`@primaryExport`、`@preventInline` / `@inlineType`、`@preventExpand` / `@expandType`、`@function`、`@mergeModuleWith`、`@include` / `@includeCode`。
- `packagesRequiringDocumentation` 校验选项；`@group none` / `@category none` 无标题渲染；`@disableGroups`。
- **`typedoc/browser`** 入口：浏览器里反序列化 JSON。

## 工具链对比

| 维度       | **TypeDoc**                      | **JSDoc**                  | **API Extractor**         | **TSDoc**          |
| ---------- | -------------------------------- | -------------------------- | ------------------------- | ------------------ |
| 本质       | TS API 文档生成器                | 通用文档生成器             | `.d.ts` rollup + API 报告 | 注释**规范**（非工具） |
| 类型来源   | **TS 编译器/类型系统**（含推断、泛型） | 注释里的 `@type` 标注  | `.d.ts`（已是类型）       | —                  |
| 产出       | HTML 站点 / JSON 模型            | HTML 站点                  | `.api.md` / `.d.ts` rollup / `.api.json` | 标准 + parser 库 |
| 主用途     | 给人浏览的 API 参考站            | JS 项目文档                | 监控公共 API 破坏性变更   | 统一注释语法       |
| 维护方     | TypeStrong（社区）              | 社区                       | Microsoft                 | Microsoft          |
| 当前版本   | 0.28.19                          | 4.0.5                      | 7.58.9                    | @microsoft/tsdoc   |
| 何时选     | TS 库要可浏览 API 站/JSON       | 纯 JS 项目                 | 库的 API 治理/防破坏      | 想规范注释（配合上面） |

::: tip 选型 + 配合一句话
纯 JS → **JSDoc**（见 [JSDoc 笔记](../jsdoc/)）；TS 库要 API 站/JSON → **TypeDoc**；库的 API 报告 + 破坏性变更门禁 → **API Extractor**；想规范注释语法 → **TSDoc**。配合关系：TSDoc 定语法 → 照 TSDoc 写注释 → API Extractor 做 API 报告与防破坏 → TypeDoc 生成给人看的站点。TypeDoc 与 API Extractor 互补（一个面向"人读站点"，一个面向"API 治理"），不是二选一。
:::

## 踩坑清单

| #  | 坑                          | 对策                                                        |
| -- | --------------------------- | ----------------------------------------------------------- |
| 1  | `exclude` ≠ tsconfig 的 exclude | typedoc `exclude` 只决定"哪些不当入口"，要彻底不编译改 **tsconfig.json 的 `exclude`** |
| 2  | `@internal` 默认没被过滤    | `excludeInternal` 跟随 TS `stripInternal`，没设时是 false；开 `stripInternal` 或显式 `excludeInternal` |
| 3  | `notExported` 告警刷屏      | 导出该类型 / 用 `typedoc-plugin-missing-exports` / 列入 `intentionallyNotExported`（**0.28 用包相对路径**） |
| 4  | 0.28 入口路径反斜杠失效     | 必须 `/` 分隔（glob 语义）                                  |
| 5  | 接 VitePress 却用默认主题   | 必须装 **`typedoc-plugin-markdown`**，且文档站 build **之前**跑 typedoc |
| 6  | `@example` 行为在 0.28 变了 | 旧"具名示例"被移除；无围栏时整段当代码——按新规则改写或加围栏 |
| 7  | `packages` 策略里插件不生效 | 子包插件不会加载，插件只在顶层配置加载                      |
| 8  | 自定义主题/插件升 0.28 崩   | `Reflection.url`/`anchor`/`hasOwnDocument` 被移除，改用 `Router`，旧插件需改写 |
| 9  | `--json` 静默覆盖 `outputs` | 同时配 `outputs` 和 `--json` 时 `json` 会盖掉对应项         |
| 10 | 类型太深被截断              | `maxTypeConversionDepth` 默认 10，过深被截，必要时调大      |
| 11 | `skipLibCheck` 缺失报第三方 `.d.ts` 错 | `compilerOptions` 加 `"skipLibCheck": true`，或 `--skipErrorChecking`（会漏自己的真错） |

## 版本与现状

- 当前 latest **0.28.19**（2026-04-12）。0.28.0 于 2025-03 发布，0.28.x 约每 2~4 周一个补丁。
- peer TS `5.0.x ~ 6.0.x`，版本号**与 TS 紧耦合**；仍是 0.x（无稳定大版本承诺，minor 可含破坏性变更）。
- 0.28 是纯 **ESM**，已 drop TS < 5.0。
- 生态版本：typedoc-plugin-markdown **4.12.0**、typedoc-vitepress-theme **1.1.3**、docusaurus-plugin-typedoc **1.4.2**。

## 文档与 GitHub 链接

- 官方文档：[https://typedoc.org/](https://typedoc.org/)
- GitHub 仓库：[https://github.com/TypeStrong/typedoc](https://github.com/TypeStrong/typedoc)

返回：[入门](./getting-started.md) · [注释与标签体系](./guide-line/comments-tags.md) · [配置详解](./guide-line/configuration.md) · [主题与插件](./guide-line/themes-plugins.md) · [接入文档站](./guide-line/docs-site.md)
