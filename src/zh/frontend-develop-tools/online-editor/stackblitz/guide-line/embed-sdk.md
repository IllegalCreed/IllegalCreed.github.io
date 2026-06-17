---
layout: doc
outline: [2, 3]
---

# 嵌入与 SDK

> 基于 developer.stackblitz.com 与 @webcontainer/api 2025–2026 现状编写

## 速查

- **安装**：`npm install @stackblitz/sdk`（~3kB gzip）；`import sdk from '@stackblitz/sdk'`；CDN UMD 暴露全局 `StackBlitzSDK`
- **7 个入口**：`embedProject` / `embedProjectId` / `embedGithubProject`（→ `Promise<VM>`，iframe 替换目标元素）；`openProject` / `openProjectId` / `openGithubProject`（开新标签，**不返回 VM**）；`connect(iframe)` → `Promise<VM>`
- **Project 对象**：`{ title*, description?, template*, files*, dependencies?, settings? }`
- **SDK 8 模板**：`angular-cli` `create-react-app` `html` `javascript` `node` `polymer` `typescript` `vue`——**只有 `node` 跑在 WebContainers**
- **`dependencies` 仅 EngineBlock 生效**；`node` 模板依赖必须写进 `package.json` 文件
- **POST API**：表单 POST 到 `https://stackblitz.com/run`，模板**仅 4 个**：`typescript` `angular-cli` `create-react-app` `javascript`
- **关键映射**：`clickToLoad→ctl`、`forceEmbedLayout→embed`、`crossOriginIsolated→corp`、`openFile→file`
- **view 取值**：`'default'` / `'editor'` / `'preview'`（**没有 'both'**，分屏即 `default`）
- **VM API**：`applyFsDiff` / `getFsSnapshot` / `getDependencies` / `editor.*` / `preview.*`；多数方法 resolve 的是 `Promise<null>`
- **`.stackblitzrc` 仅 4 字段**：`installDependencies` / `startCommand` / `compileTrigger` / `env`
- **文档**：<https://developer.stackblitz.com/platform/api/javascript-sdk>

## 安装与引入

```bash
npm install @stackblitz/sdk
```

SDK 极轻量（**约 3kB gzip**），ESM 默认导出一个 `sdk` 对象：

```js
import sdk from "@stackblitz/sdk";
```

也可用 CDN 的 UMD 构建，此时全局变量是 **`StackBlitzSDK`**。

## 7 个入口方法

SDK 的全部入口分三类。**记住一条铁律：`embed*` 返回 VM（可后续控制），`open*` 跳转新标签、不返回 VM。**

| 方法                                              | 返回           | 行为                                       |
| ------------------------------------------------- | -------------- | ------------------------------------------ |
| `embedProject(elOrId, project, options?)`         | `Promise<VM>`  | 用 iframe **替换**目标元素，嵌入内联项目   |
| `embedProjectId(elOrId, projectId, options?)`     | `Promise<VM>`  | 同上，嵌入一个已存在的项目 ID              |
| `embedGithubProject(elOrId, repoSlug, options?)`  | `Promise<VM>`  | 同上，从 GitHub 仓库嵌入                   |
| `openProject(project, options?)`                  | —              | **开新标签**打开内联项目，**不返回 VM**    |
| `openProjectId(projectId, options?)`              | —              | 开新标签打开项目 ID                        |
| `openGithubProject(repoSlug, options?)`           | —              | 开新标签打开 GitHub 仓库                   |
| `connect(iframeEl)`                               | `Promise<VM>`  | 连接一个**已存在**的 StackBlitz iframe     |

- `elOrId`：DOM 元素或其 `id` 字符串。**embed 会用生成的 iframe 替换这个元素**。
- `repoSlug`：`"owner/repo"`，可带分支 / tag / commit 与子目录，形如 `"owner/repo/tree/{branch|tag|commit}/{folder}"`。

```js
// 嵌入并拿到 VM
const vm = await sdk.embedProjectId("embed-target", "vitejs-vite-abc123", {
  height: 500,
  view: "preview",
});

// open* 不返回 VM，仅跳转
sdk.openGithubProject("vitejs/vite");
```

## Project 对象

内联项目（`embedProject` / `openProject`）接收一个 Project 对象：

```ts
{
  title: string;          // 必填
  description?: string;
  template: string;       // 必填，见下方模板表
  files: Record<string, string>;  // 必填，路径 → 文件内容
  dependencies?: Record<string, string>;
  settings?: { compile?: { /* ... */ } };
}
```

### SDK 模板：8 个（只有 `node` 在 WebContainers）

`template` 必须取下面 8 个之一：

| 模板               | 运行引擎          |
| ------------------ | ----------------- |
| `node`             | **WebContainers** |
| `angular-cli`      | EngineBlock       |
| `create-react-app` | EngineBlock       |
| `html`             | EngineBlock       |
| `javascript`       | EngineBlock       |
| `polymer`          | EngineBlock       |
| `typescript`       | EngineBlock       |
| `vue`              | EngineBlock       |

::: danger 只有 `node` 跑在 WebContainers
其余 7 个模板都跑在旧的 EngineBlock 引擎上。需要真实 Node 环境 / 自定义 dev server，**必须**用 `node` 模板。
:::

::: warning `dependencies` 字段仅 EngineBlock 生效
顶层的 `dependencies` 字段**只对 EngineBlock 模板有效**。`node` 模板（WebContainers）会**忽略**它——`node` 模板的依赖必须写进 `files` 里的 **`package.json`** 文件，由 WebContainer 在终端里 `npm install`。
:::

### settings.compile

`settings.compile` 控制嵌入项目的编译 / 刷新行为：

| 字段           | 取值                              | 默认     |
| -------------- | --------------------------------- | -------- |
| `trigger`      | `auto` / `keystroke` / `save`     | `auto`   |
| `action`       | `hmr` / `refresh`                 | `hmr`    |
| `clearConsole` | `true` / `false`                  | `true`   |

```js
const project = {
  title: "Vite Demo",
  description: "可运行示例",
  template: "node",
  files: {
    "package.json": JSON.stringify({
      name: "demo",
      dependencies: { vite: "^5.0.0" },
      scripts: { dev: "vite" },
    }),
    "index.html": "<h1>Hello</h1>",
  },
  settings: {
    compile: { trigger: "save", action: "hmr", clearConsole: true },
  },
};
```

## POST API：无 JS 也能建项目

不想引 SDK 时，可以用纯 HTML 表单 **POST** 到 `https://stackblitz.com/run` 来动态创建并打开项目：

```html
<form method="post" action="https://stackblitz.com/run" target="_blank">
  <input type="hidden" name="project[title]" value="My Project" />
  <input type="hidden" name="project[template]" value="javascript" />
  <input type="hidden" name="project[files][index.js]" value="console.log('hi')" />
  <input type="hidden" name="project[dependencies]" value='{"lodash":"^4.17.21"}' />
  <button type="submit">在 StackBlitz 打开</button>
</form>
```

字段约定：

- `project[title]`、`project[template]`
- `project[files][<路径>]`：每个文件一个字段
- `project[dependencies]`：**JSON 字符串**

::: warning POST API 的模板只有 4 个
POST API **仅支持 4 个模板**：`typescript`、`angular-cli`、`create-react-app`、`javascript`。它比 SDK 的 8 个模板更窄，且**不含 `node`**——POST 方式无法直接起 WebContainers 项目。
:::

## EmbedOptions / OpenOptions

二者都继承通用的 ProjectOptions。下面按「通用 / 仅 Embed / 仅 Open」分组。

### 通用选项（Embed 与 Open 都有）

| 选项                | 取值 / 默认                                         | 说明                                       |
| ------------------- | -------------------------------------------------- | ------------------------------------------ |
| `clickToLoad`       | 默认 `false`（URL 参数 `ctl`）                     | 显示「点击运行」对话框，懒加载             |
| `openFile`          | 字符串 / 数组（URL 参数 `file`）                   | 打开并高亮文件，见下                       |
| `view`              | `'default'` / `'editor'` / `'preview'`             | **没有 'both'**，分屏即 `default`          |
| `theme`             | `'default'` / `'dark'` / `'light'`                 | 主题                                       |
| `hideExplorer`      | 默认 `false`                                       | 隐藏文件树                                 |
| `hideDevTools`      | 默认 `false`                                       | 隐藏开发者工具面板                         |
| `showSidebar`       | 布尔                                               | 是否展开侧边栏                             |
| `sidebarView`       | `'project'` / `'search'` / `'ports'` / `'settings'`| 侧边栏默认面板                             |
| `startScript`       | 字符串（**仅 WebContainers**）                     | 启动后自动跑的 npm script                  |
| `terminalHeight`    | `0`–`100`（**仅 WebContainers**，默认 `30`）       | 终端高度百分比                             |
| `origin`            | 字符串（Enterprise）                               | 自托管实例 origin                          |
| `forceEmbedLayout`  | **已废弃 → `embed`**                               | 旧的强制嵌入布局开关                       |

`openFile` 支持多种写法：

```js
// 单文件 + 行高亮
{ openFile: "src/App.tsx:L5-L8" }
// 逗号串多个文件
{ openFile: "src/App.tsx,src/main.tsx" }
// 数组 → 分屏
{ openFile: ["src/App.tsx", "src/main.tsx"] }
```

### 仅 Embed

| 选项                  | 默认       | 说明                                       |
| --------------------- | ---------- | ------------------------------------------ |
| `height`              | `300`      | iframe 高度                                |
| `width`               | `100%`     | iframe 宽度                                |
| `hideNavigation`      | —          | 隐藏顶部导航条                             |
| `crossOriginIsolated` | URL 参数 `corp` | 跨域隔离相关开关                      |

### 仅 Open

| 选项         | 默认       | 说明                       |
| ------------ | ---------- | -------------------------- |
| `newWindow`  | `true`     | 是否开新窗口               |
| `zenMode`    | —          | 极简（禅）模式             |

## VM API（embed\* / connect 返回）

只有 `embed*` 与 `connect` 会 resolve 出一个 **VM** 句柄，用它能在嵌入运行后程序化操作项目：

```js
const vm = await sdk.embedProjectId("target", "abc123");

// 文件系统
await vm.applyFsDiff({
  create: { "src/index.js": "console.log('updated')" },
  destroy: ["src/old.js"],
});
const snapshot = await vm.getFsSnapshot();
const deps = await vm.getDependencies();

// 编辑器
await vm.editor.openFile("src/App.tsx");
await vm.editor.setCurrentFile("src/main.tsx");
await vm.editor.setTheme("dark");
await vm.editor.setView("preview");
await vm.editor.showSidebar(true);

// 预览
const url = await vm.preview.getUrl();
await vm.preview.setUrl("/about");
const origin = vm.preview.origin; // 只读
```

::: warning `applyFsDiff` 改已有文件要给全量内容
`applyFsDiff` 的 `create` 是「写入 / 覆盖」语义：要修改一个已存在的文件，必须在 `create` 里给出**该文件的完整新内容**，而不是 diff 片段。`destroy` 接收要删除的路径数组。
:::

::: warning 多数 VM 方法 resolve 的是 `Promise<null>`
除了 `getFsSnapshot` / `getDependencies` / `preview.getUrl` 这**三个 getter** 会返回数据，其余 VM 方法 resolve 的都是 `Promise<null>`（仅表示「操作完成」，**不是返回值**）。别指望 `await vm.editor.openFile(...)` 拿到什么数据。
:::

::: danger `vm.preview.origin` 在 WebContainers 上恒为 `null`
`vm.preview.origin` 是只读属性，但在 **WebContainers** 项目上它**永远是 `null`**——因为预览 URL 由 ServiceWorker 动态生成，没有固定 origin。需要预览地址请用 `await vm.preview.getUrl()`。
:::

## 嵌入 URL 参数（大小写敏感）

不引 SDK 时，可以直接用带 query 的 iframe URL 嵌入。**这些参数大小写敏感，写错就不生效**：

| 参数                | 取值                  | 对应 SDK 选项          |
| ------------------- | --------------------- | ---------------------- |
| `embed`             | `0` / `1`             | `forceEmbedLayout`     |
| `ctl`               | `0` / `1`             | `clickToLoad`          |
| `file`              | 路径                  | `openFile`             |
| `view`              | `editor` / `preview`  | `view`                 |
| `theme`             | `light` / `dark`      | `theme`                |
| `hideNavigation`    | `0` / `1`             | —                      |
| `hideExplorer`      | `0` / `1`             | `hideExplorer`         |
| `hidedevtools`      | `0` / `1`（**全小写**）| `hideDevTools`         |
| `devtoolsheight`    | 数字（**全小写**）    | —                      |
| `terminalHeight`    | `0`–`100`（camelCase）| `terminalHeight`       |
| `showSidebar`       | `0` / `1`             | `showSidebar`          |
| `initialpath`       | 路径（**全小写**，URI 编码）| —                |
| `startScript`       | script 名             | `startScript`          |
| `corp`              | —                     | `crossOriginIsolated`  |

::: danger 大小写陷阱
`hidedevtools`、`devtoolsheight`、`initialpath` 是**全小写**，而 `terminalHeight`、`showSidebar`、`hideNavigation`、`hideExplorer`、`startScript` 是 **camelCase**。混淆大小写是嵌入参数「不生效」的头号原因。
:::

官方示例：

```html
<iframe src="https://stackblitz.com/edit/angular?embed=1"></iframe>
```

关键映射关系（SDK 选项 → URL 参数）：`clickToLoad → ctl`、`forceEmbedLayout → embed`、`crossOriginIsolated → corp`、`openFile → file`。

## `.stackblitzrc`：项目级配置

在项目根放一个 **`.stackblitzrc`**（**JSON，不支持注释**），可声明项目打开时的行为；也可以把同样的内容放在 `package.json` 的 `stackblitz` 字段里。它**只有 4 个字段**：

```json
{
  "installDependencies": true,
  "startCommand": "npm run dev",
  "compileTrigger": "auto",
  "env": {
    "NODE_ENV": "development"
  }
}
```

| 字段                  | 取值                              | 默认                       |
| --------------------- | --------------------------------- | -------------------------- |
| `installDependencies` | 布尔                              | `true`                     |
| `startCommand`        | 字符串 / `false`                  | 按 `package.json` 推断     |
| `compileTrigger`      | `'auto'` / `'keystroke'` / `'save'`| `auto`                     |
| `env`                 | `Record<string, string>`          | —                          |

::: warning 终端 / 控制台高度不是 `.stackblitzrc` 字段
想调终端或控制台高度（`terminalHeight` / `devtoolsheight`）属于 **SDK 嵌入选项 / URL 参数**，**不是** `.stackblitzrc` 的字段。`.stackblitzrc` 只管这 4 项，别往里塞高度配置。
:::
