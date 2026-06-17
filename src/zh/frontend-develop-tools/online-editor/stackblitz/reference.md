---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 developer.stackblitz.com 与 @webcontainer/api 2025–2026 现状编写

## URL 速查

| 操作                     | URL                                              |
| ------------------------ | ------------------------------------------------ |
| 打开项目                 | `stackblitz.com/edit/<id>`                       |
| fork 项目                | `stackblitz.com/fork/<id>`                       |
| POST 建项目              | `POST https://stackblitz.com/run`                |
| 从 GitHub 打开           | `stackblitz.com/github/{owner}/{repo}`           |
| GitHub 指定 ref / 子目录 | `stackblitz.com/github/{owner}/{repo}/tree/{ref}/{folder}` |
| 从 GitHub fork（分享）   | `stackblitz.com/fork/github/{owner}/{repo}`      |
| Codeflow 打开仓库        | `pr.new/github.com/{owner}/{repo}`               |
| Codeflow 看 PR diff      | `pr.new/github.com/{owner}/{repo}/pull/{n}`      |

## `*.new` 速建短链（框架自有域名）

| 短链            | 起出的项目        |
| --------------- | ----------------- |
| `vite.new`      | Vite              |
| `vite.new/react`| Vite + React      |
| `astro.new`     | Astro             |
| `nextjs.new`    | Next.js           |
| `nuxt.new`      | Nuxt              |
| `node.new`      | 空白 Node 项目    |
| `sveltekit.new` | SvelteKit         |
| `remix.new`     | Remix             |
| `vitepress.new` | VitePress         |
| `sli.dev/new`   | Slidev            |

> 这些是各框架**自有顶级域名**，落地页指向 StackBlitz，不是 `stackblitz.com/fork/*` 子路径。

## SDK 方法签名

| 方法                                              | 返回           | 行为                          |
| ------------------------------------------------- | -------------- | ----------------------------- |
| `embedProject(elOrId, project, options?)`         | `Promise<VM>`  | iframe 替换元素，嵌入内联项目 |
| `embedProjectId(elOrId, projectId, options?)`     | `Promise<VM>`  | 嵌入已存在的项目 ID           |
| `embedGithubProject(elOrId, repoSlug, options?)`  | `Promise<VM>`  | 从 GitHub 嵌入                |
| `openProject(project, options?)`                  | —              | 开新标签（不返回 VM）         |
| `openProjectId(projectId, options?)`              | —              | 开新标签                      |
| `openGithubProject(repoSlug, options?)`           | —              | 开新标签                      |
| `connect(iframeEl)`                               | `Promise<VM>`  | 连接已存在的 iframe           |

> `repoSlug` = `"owner/repo"`，可带 `/tree/{branch|tag|commit}/{folder}`。

## VM 方法

| 成员                       | 返回           | 说明                                  |
| -------------------------- | -------------- | ------------------------------------- |
| `vm.applyFsDiff(diff)`     | `Promise<null>`| `{ create: {path:content}, destroy: [] }`；改文件给全量内容 |
| `vm.getFsSnapshot()`       | 数据           | 读取文件系统快照                      |
| `vm.getDependencies()`     | 数据           | 读取依赖                              |
| `vm.editor.openFile(p)`    | `Promise<null>`| 打开文件                              |
| `vm.editor.setCurrentFile(p)` | `Promise<null>` | 切换当前文件                       |
| `vm.editor.setTheme(t)`    | `Promise<null>`| 设主题                                |
| `vm.editor.setView(v)`     | `Promise<null>`| 设视图                                |
| `vm.editor.showSidebar(b)` | `Promise<null>`| 显隐侧边栏                            |
| `vm.preview.getUrl()`      | 数据           | 读取预览 URL                          |
| `vm.preview.setUrl(path)`  | `Promise<null>`| 设预览路径                            |
| `vm.preview.origin`        | 只读           | **WebContainers 上恒为 `null`**       |

> 除 `getFsSnapshot` / `getDependencies` / `preview.getUrl` 三个 getter 外，VM 方法 resolve 的都是 `Promise<null>`。

## 嵌入 URL 参数（大小写敏感）

| 参数                | 取值                  | 对应 SDK 选项          |
| ------------------- | --------------------- | ---------------------- |
| `embed`             | `0` / `1`             | `forceEmbedLayout`     |
| `ctl`               | `0` / `1`             | `clickToLoad`          |
| `file`              | 路径                  | `openFile`             |
| `view`              | `editor` / `preview`  | `view`                 |
| `theme`             | `light` / `dark`      | `theme`                |
| `hideNavigation`    | `0` / `1`             | —                      |
| `hideExplorer`      | `0` / `1`             | `hideExplorer`         |
| `hidedevtools`      | `0` / `1`（全小写）   | `hideDevTools`         |
| `devtoolsheight`    | 数字（全小写）        | —                      |
| `terminalHeight`    | `0`–`100`（camelCase）| `terminalHeight`       |
| `showSidebar`       | `0` / `1`             | `showSidebar`          |
| `initialpath`       | 路径（全小写，URI 编码）| —                    |
| `startScript`       | script 名             | `startScript`          |
| `corp`              | —                     | `crossOriginIsolated`  |

## EmbedOptions / OpenOptions

| 选项                | 取值 / 默认                                         | 作用域          |
| ------------------- | -------------------------------------------------- | --------------- |
| `clickToLoad`       | 默认 `false`                                       | 通用            |
| `openFile`          | 字符串 / 数组                                      | 通用            |
| `view`              | `'default'` / `'editor'` / `'preview'`（无 'both'）| 通用            |
| `theme`             | `'default'` / `'dark'` / `'light'`                 | 通用            |
| `hideExplorer`      | 默认 `false`                                       | 通用            |
| `hideDevTools`      | 默认 `false`                                       | 通用            |
| `showSidebar`       | 布尔                                               | 通用            |
| `sidebarView`       | `'project'` / `'search'` / `'ports'` / `'settings'`| 通用            |
| `startScript`       | 字符串（仅 WebContainers）                         | 通用            |
| `terminalHeight`    | `0`–`100`，默认 `30`（仅 WebContainers）           | 通用            |
| `origin`            | 字符串（Enterprise）                               | 通用            |
| `forceEmbedLayout`  | 已废弃 → `embed`                                   | 通用            |
| `height`            | 默认 `300`                                         | 仅 Embed        |
| `width`             | 默认 `100%`                                        | 仅 Embed        |
| `hideNavigation`    | 布尔                                               | 仅 Embed        |
| `crossOriginIsolated` | → URL 参数 `corp`                                | 仅 Embed        |
| `newWindow`         | 默认 `true`                                        | 仅 Open         |
| `zenMode`           | 布尔                                               | 仅 Open         |

## 模板词表

| 用途              | 模板集合                                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| **SDK（8 个）**   | `angular-cli` `create-react-app` `html` `javascript` `node` `polymer` `typescript` `vue`（**仅 `node` 在 WebContainers**） |
| **POST API（4 个）** | `typescript` `angular-cli` `create-react-app` `javascript`            |

## `.stackblitzrc` 字段（共 4 个）

| 字段                  | 取值                              | 默认                   |
| --------------------- | --------------------------------- | ---------------------- |
| `installDependencies` | 布尔                              | `true`                 |
| `startCommand`        | 字符串 / `false`                  | 按 `package.json` 推断 |
| `compileTrigger`      | `'auto'` / `'keystroke'` / `'save'`| `auto`                 |
| `env`                 | `Record<string, string>`          | —                      |

> JSON 格式、不支持注释；也可放在 `package.json` 的 `stackblitz` 字段。终端 / 控制台高度**不是**这里的字段（属 SDK 嵌入选项 / URL 参数）。
