---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 reduxjs/redux-toolkit 官方 skills（`packages/toolkit/skills/` + `packages/rtk-query-codegen-openapi/skills/`）编写。

## 速查

- **9 SKILL.md / 5 任务类**：build-modern-redux-apps(2) · model-redux-state(2) · manage-server-data(2) · orchestrate-side-effects(1) · evolve-and-diagnose-redux-apps(2)
- **`type` 分三种**：`lifecycle`（4：modern-redux/adopt-rtk-query/debug/migrate）· `core`（4：redux-dataflow/slices-selectors/state-ownership/handle-side-effects）· `composition`（1：openapi codegen）
- **版本**：`@reduxjs/toolkit` skills 声明 `2.11.2`（最新 2.12.0）；codegen 声明 `@rtk-query/codegen-openapi 2.2.0`
- **依赖根**：`redux-dataflow` 与 `design-state-ownership` 无 `requires`，是两个地基
- **许可**：MIT；主仓库 `reduxjs/redux-toolkit`；根 `skills/` 为 symlink

## 9 个 SKILL.md 全表

| 任务类 | SKILL | type | requires | 一句话 |
| --- | --- | --- | --- | --- |
| build-modern-redux-apps | `modern-redux` | lifecycle | redux-dataflow | configureStore/Provider/typed hooks/SSR store 生命周期 |
| build-modern-redux-apps | `redux-dataflow` | core | — | event→reducer→selector→render、事件式 action、selector 派生 |
| model-redux-state | `build-slices-and-selectors` | core | design-state-ownership | createSlice/Immer/slice selectors/`create.asyncThunk`/entity adapter/懒注入 |
| model-redux-state | `design-state-ownership` | core | — | 数据放 Redux 还是组件/路由、权威边界、slice 尺寸 |
| manage-server-data | `adopt-rtk-query` | lifecycle | modern-redux | createApi/一后端一 API 根/tag 失效/乐观更新 |
| manage-server-data | `generate-rtk-query-from-openapi` | composition | adopt-rtk-query | 空 API + `@rtk-query/codegen-openapi` 从 OpenAPI 生成 |
| orchestrate-side-effects | `handle-side-effects` | core | redux-dataflow | RTK Query→asyncThunk→listener 决策；listener 要 prepend |
| evolve-and-diagnose | `debug-redux-toolkit-apps` | lifecycle | redux-dataflow | 重复请求/stale 缓存/订阅过宽/序列化警告 |
| evolve-and-diagnose | `migrate-to-modern-redux` | lifecycle | modern-redux | createStore→configureStore、增量迁移、codemod、上 RTK Query |

> `generate-rtk-query-from-openapi` 物理上在 `packages/rtk-query-codegen-openapi/skills/manage-server-data/` 下，`library` 是 `@rtk-query/codegen-openapi`，其余 8 个在 `packages/toolkit/skills/`。

## requires 依赖图

```text
redux-dataflow (core, 无依赖)
├── modern-redux (lifecycle)
│   ├── adopt-rtk-query (lifecycle)
│   │   └── generate-rtk-query-from-openapi (composition)
│   └── migrate-to-modern-redux (lifecycle)
├── handle-side-effects (core)
└── debug-redux-toolkit-apps (lifecycle)

design-state-ownership (core, 无依赖)
└── build-slices-and-selectors (core)
```

两个「地基」skill 无 `requires`：`redux-dataflow`（数据流心智）与 `design-state-ownership`（状态归属）。其余都最终依赖它们之一。

## SKILL.md frontmatter 字段

```yaml
name: build-modern-redux-apps/modern-redux   # 任务类/技能名
description: >                                # Use this when… agent 据此触发
  ...
type: lifecycle                               # lifecycle | core | composition
library: "@reduxjs/toolkit"
library_version: "2.11.2"
requires:                                     # 依赖的其它 skill（可选）
  - build-modern-redux-apps/redux-dataflow
sources:                                      # 可溯源：仓库内文档/源码路径
  - "reduxjs/redux-toolkit:docs/tutorials/quick-start.mdx"
  - "reduxjs/redux:docs/style-guide/style-guide.md"
```

正文四段固定结构：**Setup**（可跑代码）→ **Core Patterns**（每个模式：代码 + 一句解释）→ **Common Mistakes**（`严重度 + 标题` / Wrong / Correct / 一句原因 / `Source:`）→ **References**（指向 `references/*.md` 深挖）。

## 现代 Redux 核心 API 速查

| API | 出处 skill | 作用 |
| --- | --- | --- |
| `configureStore` | modern-redux | 装 store，默认 middleware（thunk + dev 检查）+ DevTools |
| `createSlice` | slices-and-selectors | Immer reducer + 自动 action creators + slice selectors |
| `buildCreateSlice` + `asyncThunkCreator` | slices-and-selectors | 解锁 `create.asyncThunk` |
| `createAsyncThunk` | handle-side-effects | 命令式异步，pending/fulfilled/rejected |
| `createEntityAdapter` | slices-and-selectors | 归一化集合（`selectId` 自定义主键） |
| `combineSlices` / `injectInto` / `withLazyLoadedSlices` | slices-and-selectors | 懒加载 reducer 注入 |
| `createSelector` | redux-dataflow | 记忆化派生 selector |
| `createListenerMiddleware` | handle-side-effects | 反应式副作用（`prepend`） |
| `createApi` / `fetchBaseQuery` | adopt-rtk-query | RTK Query 数据获取缓存 |
| `useDispatch.withTypes` / `useSelector.withTypes` | modern-redux | 预类型化 hooks |
| `api.util.updateQueryData` | adopt-rtk-query | 乐观更新缓存 patch |

## rtk-query-codegen-openapi 配置

```ts
import type { ConfigFile } from '@rtk-query/codegen-openapi'

const config: ConfigFile = {
  schemaFile: './openapi.json',      // OpenAPI schema（本地或 URL）
  apiFile: './src/store/emptyApi.ts',// 空 API 文件
  apiImport: 'emptySplitApi',        // 空 API 导出名
  outputFile: './src/store/petApi.ts',
  exportName: 'petApi',
  hooks: true,                       // 生成 useXxxQuery/useXxxMutation
  tag: true,                         // 生成 tag（默认 string-only）
  filterEndpoints: ['loginUser', /User/],
  endpointOverrides: [
    { pattern: 'loginUser', type: 'mutation' },
    { pattern: 'getPetById', providesTags: ['SinglePet'] },
    { pattern: /.*/, parameterFilter: (_n, p) => p.in !== 'header' },
  ],
}
export default config
// 运行：npx @rtk-query/codegen-openapi openapi-config.ts
```

## 严重度分级含义

| 级别 | 含义 | 例 |
| --- | --- | --- |
| `CRITICAL` | 破坏不可变 / reducer 纯度 / 缓存一致性 | reducer 里跑副作用、reducer 外 mutate、一后端多 API 根 |
| `HIGH` | 过时默认 / 易错常见坑 | `connect`、`extraReducers` 对象语法、URL 状态入 Redux、漏 middleware |
| `MEDIUM` | 会漂移的次优选择 | 存派生值、表单态入 Redux、slice 边界固化、不稳定 selectFromResult |

## 安装

```bash
# 运行时依赖
npm install @reduxjs/toolkit react-redux

# 新项目脚手架
npx create-react-app my-app --template redux-typescript

# 代码生成 / codemod（按需）
npm install -D @rtk-query/codegen-openapi
npx @reduxjs/rtk-codemods createSliceBuilder src/features/**/*.ts
```

## 版本与许可

- **skills 声明版本**：`@reduxjs/toolkit` `2.11.2`；`@rtk-query/codegen-openapi` `2.2.0`
- **RTK 最新**：`v2.12.0`（RTK 2.x）
- **许可**：MIT
- **主仓库**：`reduxjs/redux-toolkit`（skills 在 `packages/toolkit/skills/`，根 `skills/` 为 symlink）

## 资源链接

- 仓库：[reduxjs/redux-toolkit](https://github.com/reduxjs/redux-toolkit) · [skills 目录](https://github.com/reduxjs/redux-toolkit/tree/master/packages/toolkit/skills)
- 官网：[redux-toolkit.js.org](https://redux-toolkit.js.org/)
- 风格指南：[Redux Style Guide](https://redux.js.org/style-guide/)
- 迁移：[Migrating to Modern Redux](https://redux-toolkit.js.org/usage/migrating-to-modern-redux) · [Migrating to RTK 2.0](https://redux-toolkit.js.org/usage/migrating-rtk-2)
- RTK Query：[RTK Query 概览](https://redux-toolkit.js.org/rtk-query/overview) · [代码生成](https://redux-toolkit.js.org/rtk-query/usage/code-generation)
- 相关叶：[React Router Skill](../react-router-skill/) · [TanStack Router & Start Skills](../tanstack-router-start-skills/)
