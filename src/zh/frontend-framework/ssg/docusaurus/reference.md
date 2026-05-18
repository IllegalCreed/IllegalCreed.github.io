---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Docusaurus 3.x（`@docusaurus/core` / `@docusaurus/preset-classic`）—— API 速查 / 配置全表 / CLI 全集 / Hooks / 文件约定

## 包结构

| 包 | 用途 | 通常装在 |
|---|---|---|
| `@docusaurus/core` | 核心引擎（Webpack + React + 路由） | dependencies |
| `@docusaurus/preset-classic` | 经典预设（docs/blog/pages/theme） | dependencies |
| `@docusaurus/plugin-content-docs` | 文档插件（preset-classic 已含） | dependencies |
| `@docusaurus/plugin-content-blog` | 博客插件（preset-classic 已含） | dependencies |
| `@docusaurus/plugin-content-pages` | 独立页面插件（preset-classic 已含） | dependencies |
| `@docusaurus/plugin-sitemap` | sitemap.xml 生成（preset-classic 已含） | dependencies |
| `@docusaurus/plugin-debug` | 调试页 `/__docusaurus/debug` | dependencies |
| `@docusaurus/plugin-google-gtag` | Google Analytics | dependencies |
| `@docusaurus/plugin-google-tag-manager` | Google Tag Manager | dependencies |
| `@docusaurus/plugin-ideal-image` | 图片优化（懒加载 / WebP / 占位符） | dependencies |
| `@docusaurus/plugin-pwa` | PWA 离线支持 | dependencies |
| `@docusaurus/plugin-client-redirects` | 客户端 / 服务端重定向 | dependencies |
| `@docusaurus/theme-classic` | 经典主题（preset-classic 已含） | dependencies |
| `@docusaurus/theme-search-algolia` | Algolia DocSearch（preset-classic 已含） | dependencies |
| `@docusaurus/theme-mermaid` | Mermaid 流程图 | dependencies |
| `@docusaurus/theme-live-codeblock` | 实时可编辑代码块 | dependencies |
| `@docusaurus/types` | TS 类型定义 | devDependencies |
| `@docusaurus/tsconfig` | 共享 tsconfig | devDependencies |
| `@docusaurus/module-type-aliases` | `@theme/*` / `@site/*` 类型 | devDependencies |
| `@docusaurus/remark-plugin-npm2yarn` | npm/yarn/pnpm 一键切换 | devDependencies |
| `prism-react-renderer` | 代码语法高亮主题 | dependencies |

## `docusaurus.config.ts` 字段全表

### 站点元数据

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `title` | string | ✅ 必需 | 站点标题 |
| `tagline` | string | `''` | 副标题 |
| `favicon` | string | `undefined` | 浏览器图标（相对 `static/`） |
| `url` | string | ✅ 必需 | 部署域名（无尾斜杠） |
| `baseUrl` | string | ✅ 必需 | 子路径（必须 `/` 结尾） |
| `titleDelimiter` | string | `'|'` | 浏览器标签分隔符 |
| `baseUrlIssueBanner` | boolean | `true` | baseUrl 错误时显示横幅 |
| `noIndex` | boolean | `false` | 加 `<meta name="robots" content="noindex,nofollow">` |
| `trailingSlash` | boolean \| undefined | `undefined` | URL 末尾斜杠：保留 / 加 / 删 |
| `customFields` | object | `{}` | 自定义字段（在 `siteConfig.customFields` 可读取） |

### 部署相关

| 字段 | 类型 | 说明 |
|---|---|---|
| `organizationName` | string | GitHub 组织/用户名 |
| `projectName` | string | GitHub 仓库名 |
| `deploymentBranch` | string | 部署分支（默认 `gh-pages`） |
| `githubHost` | string | GitHub Enterprise 主机（默认 `github.com`） |
| `githubPort` | string | SSH 端口（默认 `22`） |

### 错误处理

| 字段 | 类型 | 可选值 | 默认 |
|---|---|---|---|
| `onBrokenLinks` | string | `'ignore' \| 'log' \| 'warn' \| 'throw'` | `'throw'` |
| `onBrokenAnchors` | string | 同上 | `'warn'` |
| `onBrokenMarkdownLinks` | string | 同上 | `'warn'` |
| `onDuplicateRoutes` | string | 同上 | `'warn'` |

### i18n

```ts
i18n: {
  defaultLocale: 'zh-Hans',
  locales: ['zh-Hans', 'en', 'ja'],
  path: 'i18n',                                  // 翻译目录（默认 i18n）
  localeConfigs: {
    'zh-Hans': {
      label: '简体中文',                            // locale switcher 显示
      direction: 'ltr',                            // 'ltr' | 'rtl'
      htmlLang: 'zh-CN',                           // <html lang>
      calendar: 'gregory',                         // Intl.Locale 日历
      path: 'zh-Hans',                             // URL 路径
      translate: false,                            // 此 locale 是否参与翻译（特殊用）
      url: 'https://zh.example.com',               // 特定 locale 的独立域名（高级）
      baseUrl: '/',                                // 特定 locale 的 baseUrl
    },
  },
}
```

### markdown 配置

```ts
markdown: {
  format: 'mdx',                                 // 'mdx' | 'md' | 'detect'
  mermaid: true,                                  // 启用 Mermaid
  emoji: true,                                    // :emoji: 支持
  preprocessor: ({ filePath, fileContent }) => {  // 预处理钩子
    return fileContent.replaceAll('{{VAR}}', 'value')
  },
  parseFrontMatter: async (params) => {           // 自定义 frontmatter 解析
    const result = await params.defaultParseFrontMatter(params)
    return result
  },
  mdx1Compat: {                                   // MDX v1 兼容（v2/v3 已默认关闭）
    comments: true,
    admonitions: true,
    headingIds: true,
  },
  anchors: {
    maintainCase: true,                            // 锚点保留大小写
  },
  hooks: {
    onBrokenMarkdownLinks: 'warn',
    onBrokenMarkdownImages: 'throw',
  },
  remarkRehypeOptions: {                          // remark-rehype 配置
    footnoteLabel: '脚注',
  },
}
```

### future（实验特性）

```ts
future: {
  /** v4 改动预览 */
  v4: {
    removeLegacyPostBuildHeadAttribute: true,
    useCssCascadeLayers: true,
    siteStorageNamespacing: true,
    fasterByDefault: true,
    mdx1CompatDisabledByDefault: true,
  },

  /** 性能加速 */
  faster: {
    swcJsLoader: true,                             // SWC 替代 Babel
    swcJsMinimizer: true,
    swcHtmlMinimizer: true,
    lightningCssMinimizer: true,
    rspackBundler: true,                           // Rspack 替代 Webpack
    rspackPersistentCache: true,
    ssgWorkerThreads: true,
    mdxCrossCompilerCache: true,
  },

  /** Hash 路由（用 # 而非 history） */
  experimental_router: 'hash',                     // 'browser' | 'hash'
}
```

### 高级字段

```ts
{
  /** 静态资源目录（默认 ['static']） */
  staticDirectories: ['static', 'extra-static'],

  /** 全局存储 */
  storage: {
    type: 'localStorage',                          // 'localStorage' | 'sessionStorage'
    namespace: true,                               // 多站点隔离
  },

  /** 注入 <head> 标签 */
  headTags: [
    {
      tagName: 'link',
      attributes: { rel: 'icon', href: '/img/favicon.svg' },
    },
  ],

  /** 注入 <script> */
  scripts: [
    'https://cdn.example.com/lib.js',
    { src: 'https://cdn.example.com/lib2.js', async: true, defer: true },
  ],

  /** 注入 <link rel="stylesheet"> */
  stylesheets: [
    'https://fonts.googleapis.com/css?family=Roboto',
    { href: '/css/extra.css', type: 'text/css' },
  ],

  /** 客户端 JS / CSS 模块（每个页面都加载） */
  clientModules: ['./src/clientModule.ts'],

  /** 自定义 SSR HTML 模板（高级） */
  ssrTemplate: '<!DOCTYPE html><html ...>...</html>',
}
```

## `sidebars.ts` 完整语法

### 类型

```ts
type Sidebars = Record<string, SidebarItem[]>     // 多 sidebar 对象

type SidebarItem =
  | string                                         // doc id 简写
  | SidebarItemDoc
  | SidebarItemLink
  | SidebarItemCategory
  | SidebarItemAutogenerated
  | SidebarItemHtml
  | SidebarItemRef
```

### Doc 项

```ts
{
  type: 'doc',
  id: 'tutorial/intro',                            // docs/tutorial/intro.md
  label: '简介',                                    // 可选，覆盖 frontmatter sidebar_label
  className: 'my-class',
  customProps: { badge: 'new' },                    // 自定义数据（swizzle 后可读）
}
```

### Link 项（外部链接）

```ts
{
  type: 'link',
  label: 'GitHub',
  href: 'https://github.com',
  className: 'link-external',
  description: 'Source code',
}
```

### Category 项

```ts
{
  type: 'category',
  label: '基础',
  link: {
    type: 'generated-index',                        // 自动索引页
    title: '基础教程',
    description: '...',
    slug: '/category/basics',
    keywords: ['basics'],
    image: '/img/cat.jpg',
  },
  // 或：
  // link: { type: 'doc', id: 'basics/index' },
  items: [
    'basics/install',
    'basics/config',
    { type: 'category', /* 嵌套 */ },
  ],
  collapsed: true,                                  // 初始折叠
  collapsible: true,                                // 是否可折叠
  className: 'category-basics',
}
```

### Autogenerated 项

```ts
{
  type: 'autogenerated',
  dirName: 'tutorial',                              // 相对 docs/ 的目录
  // 或：
  // dirName: '.',                                  // 整个 docs/
}
```

### HTML 项

```ts
{
  type: 'html',
  value: '<hr />',
  defaultStyle: true,                               // 应用主题默认样式
  className: 'sidebar-separator',
}
```

### Ref 项（引用）

```ts
{
  type: 'ref',
  id: 'api/auth',                                   // 引用其他文档，不计入「上一篇/下一篇」
  label: '认证 API',                                 // 可选
}
```

### Sidebar 排序与 `_category_.json`

```json
{
  "label": "基础",
  "position": 1,
  "collapsible": true,
  "collapsed": false,
  "className": "sidebar-category-basics",
  "link": {
    "type": "generated-index",
    "title": "基础",
    "description": "Docusaurus 基础",
    "slug": "/category/basics"
  },
  "customProps": {
    "anyExtraData": "..."
  }
}
```

排序优先级（小数字在前）：

1. frontmatter `sidebar_position` / `_category_.json.position`
2. 文件名数字前缀（`01-intro.md` → 序号 1，需配置 `numberPrefixParser`）
3. 文件名字典序

## Frontmatter 字段速查

### 文档 frontmatter

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 文档 ID（默认文件相对路径） |
| `title` | string | h1 标题 |
| `sidebar_label` | string | 侧边栏文本 |
| `sidebar_position` | number | 排序权重 |
| `slug` | string | 自定义 URL |
| `description` | string | SEO description |
| `keywords` | string[] | SEO keywords |
| `image` | string | 社交分享图 |
| `tags` | string[] | 标签 |
| `hide_title` | boolean | 隐藏 h1 |
| `hide_table_of_contents` | boolean | 隐藏右侧 TOC |
| `toc_min_heading_level` | number | TOC 最小层级（默认 2） |
| `toc_max_heading_level` | number | TOC 最大层级（默认 3） |
| `pagination_label` | string | 上/下篇链接显示文本 |
| `pagination_prev` | string \| null | 上一篇文档 ID（null 隐藏） |
| `pagination_next` | string \| null | 下一篇文档 ID（null 隐藏） |
| `displayed_sidebar` | string | 显式指定 sidebar |
| `draft` | boolean | 草稿（生产忽略） |
| `unlisted` | boolean | 未列出（不在 sidebar/搜索，但可访问） |
| `custom_edit_url` | string | 自定义编辑链接 |
| `last_update` | object | `{ author?, date? }` |
| `sidebar_class_name` | string | 侧边栏项 CSS 类 |
| `parse_number_prefixes` | boolean | 文件名数字前缀解析（覆盖全局） |

### 博客 frontmatter

| 字段 | 类型 | 说明 |
|---|---|---|
| `slug` | string | URL（默认从文件名） |
| `title` | string | 标题 |
| `authors` | string[] \| object[] | 作者 ID 数组（引用 authors.yml）或内联 |
| `tags` | string[] | 标签 |
| `date` | string \| Date | 发布日期 |
| `image` | string | 缩略图 + 社交分享图 |
| `description` | string | SEO description |
| `keywords` | string[] | SEO keywords |
| `draft` | boolean | 草稿 |
| `unlisted` | boolean | 未列出 |
| `hide_table_of_contents` | boolean | 隐藏 TOC |
| `toc_min_heading_level` | number | TOC 最小层级 |
| `toc_max_heading_level` | number | TOC 最大层级 |
| `last_update` | object | `{ author?, date? }` |

### 页面 frontmatter（`src/pages/*.md`）

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | 页面标题 |
| `description` | string | SEO description |
| `keywords` | string[] | SEO keywords |
| `image` | string | 社交分享图 |
| `hide_table_of_contents` | boolean | 隐藏 TOC |
| `wrapperClassName` | string | 包裹层 CSS 类 |

## CLI 命令全集

通过 `npm run docusaurus <command>` 或脚本快捷方式调用。

### `docusaurus start`

启动 dev server。

| 参数 | 默认 | 说明 |
|---|---|---|
| `--port` | `3000` | 端口 |
| `--host` | `localhost` | 主机 |
| `--locale` | defaultLocale | 启动语言 |
| `--hot-only` | `false` | 不刷新整页，仅 HMR |
| `--no-open` | `false` | 不自动开浏览器 |
| `--config` | `docusaurus.config.ts` | 配置文件路径 |
| `--poll` | `false` | 文件轮询（容器内常用） |
| `--no-minify` | `false` | 不压缩 |

```bash
docusaurus start --port 4000 --host 0.0.0.0
```

### `docusaurus build`

生产构建。

| 参数 | 默认 | 说明 |
|---|---|---|
| `--dev` | `false` | dev mode 构建（不压缩） |
| `--bundle-analyzer` | `false` | 启动 Webpack Bundle Analyzer |
| `--out-dir` | `build` | 输出目录 |
| `--config` | `docusaurus.config.ts` | 配置文件 |
| `--locale` | 所有 | 仅构建指定语言 |
| `--no-minify` | `false` | 不压缩 |

```bash
docusaurus build --out-dir public --locale en
```

### `docusaurus serve`

预览构建产物。

| 参数 | 默认 | 说明 |
|---|---|---|
| `--port` | `3000` | 端口 |
| `--dir` | `build` | 静态文件目录 |
| `--build` | `false` | 先构建再预览 |
| `--host` | `localhost` | 主机 |
| `--no-open` | `false` | 不自动开浏览器 |

### `docusaurus clear`

清理 `.docusaurus/` 缓存目录。

### `docusaurus swizzle`

定制主题组件。

```bash
docusaurus swizzle [themeName] [componentName] [siteDir]
```

| 参数 | 说明 |
|---|---|
| `--list` | 列出所有可定制组件 |
| `--eject` | 完全替换（拷贝组件代码） |
| `--wrap` | 包装增强（推荐） |
| `--danger` | 允许 swizzle Unsafe 组件 |
| `--typescript` | 生成 TypeScript 文件 |

```bash
docusaurus swizzle @docusaurus/theme-classic Footer -- --wrap --typescript
docusaurus swizzle -- --list
```

### `docusaurus deploy`

部署到 GitHub Pages。

| 参数 | 默认 | 说明 |
|---|---|---|
| `--locale` | 所有 | 仅部署指定语言 |
| `--out-dir` | `build` | 构建输出 |
| `--skip-build` | `false` | 跳过构建直接推 |
| `--target-dir` | `.` | gh-pages 分支中目标目录 |

```bash
GIT_USER=username docusaurus deploy
```

环境变量：

- `GIT_USER`（必需）：GitHub 用户名
- `USE_SSH=true`：用 SSH 推送（无需 PAT）
- `DEPLOYMENT_BRANCH`：覆盖 `deploymentBranch` 配置
- `GIT_PASS`：HTTPS 推送时的 PAT

### `docusaurus docs:version`

为多版本文档创建新版本。

```bash
docusaurus docs:version 1.0.0
docusaurus docs:version 2.0.0
# 也可以指定 plugin id（多 docs 实例）
docusaurus docs:version:api 1.0.0
```

### `docusaurus write-translations`

提取所有可翻译字符串。

| 参数 | 默认 | 说明 |
|---|---|---|
| `--locale` | defaultLocale | 目标语言 |
| `--override` | `false` | 覆盖已存在的翻译 |
| `--config` | `docusaurus.config.ts` | 配置文件 |
| `--messagePrefix` | `''` | 给所有 message 加前缀（标记未翻译） |

```bash
docusaurus write-translations --locale en
docusaurus write-translations --locale zh-Hans --override
```

### `docusaurus write-heading-ids`

给所有 Markdown 标题加显式 ID（避免标题改后锚点失效）。

| 参数 | 默认 | 说明 |
|---|---|---|
| `--syntax` | `'classic'` | `'classic'` 或 `'pragmatic'` |
| `--migrate` | `false` | 从旧 GFM 语法迁移 |
| `--overwrite` | `false` | 覆盖已存在的 ID |
| `--maintain-case` | `false` | 保留大小写 |

```bash
docusaurus write-heading-ids
docusaurus write-heading-ids docs/intro.md
```

执行后 Markdown 标题变成：

```md
## 我的标题 {#my-heading-id}
```

## MDX 内置组件

### `<Tabs>` / `<TabItem>`

```mdx
import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'

<Tabs
  defaultValue="apple"
  groupId="fruit"
  queryString="fruit"
  values={[
    { label: 'Apple', value: 'apple' },
    { label: 'Orange', value: 'orange' },
  ]}
>
  <TabItem value="apple">🍎</TabItem>
  <TabItem value="orange">🍊</TabItem>
</Tabs>
```

`<Tabs>` props：

| Prop | 类型 | 说明 |
|---|---|---|
| `defaultValue` | string \| null | 默认选中 tab（null 不选） |
| `values` | array | 替代 children 配置 |
| `groupId` | string | 同 groupId 跨 Tabs 同步 |
| `queryString` | string \| true | 写入 URL search param |
| `className` | string | 容器 CSS 类 |
| `lazy` | boolean | 懒渲染（仅渲染当前 tab） |

`<TabItem>` props：

| Prop | 类型 | 说明 |
|---|---|---|
| `value` | string | 唯一标识 |
| `label` | string | 显示文本 |
| `default` | boolean | 默认选中 |
| `attributes` | object | 给 tab heading 加属性 |

### `<CodeBlock>`

```mdx
import CodeBlock from '@theme/CodeBlock'

<CodeBlock
  language="ts"
  title="hello.ts"
  showLineNumbers
>
  {`const message: string = 'Hello'`}
</CodeBlock>
```

### `<Admonition>`

```mdx
import Admonition from '@theme/Admonition'

<Admonition type="tip" title="提示" icon="💡">
  内容
</Admonition>
```

`type`：`'note' | 'tip' | 'info' | 'warning' | 'danger'`

### `<DocCardList>`

```mdx
import DocCardList from '@theme/DocCardList'

<DocCardList />
```

自动生成当前 category 下所有文档的卡片列表。

### `<TOCInline>` / `<TOCCollapsible>`

```mdx
import TOCInline from '@theme/TOCInline'

<TOCInline toc={toc} minHeadingLevel={2} maxHeadingLevel={4} />
```

`toc` 是 MDX 自动注入的目录数据。

## 客户端 API 全集

### Components

| 组件 | 模块 | 用途 |
|---|---|---|
| `<Link to>` | `@docusaurus/Link` | 内部链接（自动 prefetch） |
| `<Redirect to>` | `@docusaurus/router` | 重定向 |
| `<BrowserOnly fallback>` | `@docusaurus/BrowserOnly` | 仅浏览器渲染 |
| `<Head>` | `@docusaurus/Head` | 修改 `<head>` |
| `<Translate id description>` | `@docusaurus/Translate` | i18n 翻译 |
| `<Interpolate values>` | `@docusaurus/Interpolate` | 字符串插值 |
| `<ErrorBoundary fallback>` | `@docusaurus/ErrorBoundary` | React Error Boundary |
| `<Layout>` | `@theme/Layout` | 站点布局（含 navbar/footer） |
| `<NotFound>` | `@theme/NotFound` | 404 页 |

### Hooks

| Hook | 模块 | 返回 |
|---|---|---|
| `useDocusaurusContext()` | `@docusaurus/useDocusaurusContext` | `{ siteConfig, siteMetadata, globalData, i18n, codeTranslations }` |
| `useColorMode()` | `@docusaurus/theme-common` | `{ colorMode, setColorMode }` |
| `useLocation()` | `@docusaurus/router` | React Router 的 location |
| `useHistory()` | `@docusaurus/router` | React Router 的 history |
| `useIsBrowser()` | `@docusaurus/useIsBrowser` | bool（hydration 后才为 true） |
| `useBaseUrl(url)` | `@docusaurus/useBaseUrl` | 加 baseUrl 前缀 |
| `useBaseUrlUtils()` | `@docusaurus/useBaseUrl` | `{ withBaseUrl }` |
| `useGlobalData()` | `@docusaurus/useGlobalData` | 所有 plugin 全局数据 |
| `usePluginData(pluginName, pluginId)` | `@docusaurus/useGlobalData` | 特定 plugin 数据 |
| `useThemeConfig()` | `@docusaurus/theme-common` | `themeConfig` 对象 |

### Modules

| 模块 | 内容 |
|---|---|
| `ExecutionEnvironment` | `{ canUseDOM, canUseEventListeners, canUseIntersectionObserver, canUseViewport }` |
| `constants` | `{ DEFAULT_PLUGIN_ID: 'default' }` |

### Functions

| 函数 | 模块 | 用途 |
|---|---|---|
| `interpolate(text, values)` | `@docusaurus/Interpolate` | 命令式字符串插值 |
| `translate({ message, id, description }, values?)` | `@docusaurus/Translate` | 命令式翻译 |

## `themeConfig` 完整字段

### navbar

```ts
themeConfig: {
  navbar: {
    title: 'Site Title',
    logo: {
      alt: 'Site Logo',
      src: 'img/logo.svg',
      srcDark: 'img/logo-dark.svg',
      href: 'https://example.com',
      target: '_self',
      width: 32,
      height: 32,
      className: 'navbar-logo',
    },
    hideOnScroll: true,                            // 滚动隐藏
    style: 'primary',                              // 'primary' | 'dark'
    items: [
      /** 内部链接 */
      { to: '/docs/intro', label: '文档', position: 'left' },

      /** 关联 sidebar */
      {
        type: 'docSidebar',
        sidebarId: 'tutorialSidebar',
        position: 'left',
        label: '教程',
      },

      /** 链接到特定 doc */
      {
        type: 'doc',
        docId: 'intro',
        position: 'left',
        label: '介绍',
      },

      /** 版本切换 */
      {
        type: 'docsVersionDropdown',
        position: 'right',
        dropdownItemsAfter: [{ to: '/versions', label: '所有版本' }],
        dropdownActiveClassDisabled: true,
      },

      /** 当前版本链接 */
      { type: 'docsVersion', position: 'left', label: '版本' },

      /** 语言切换 */
      {
        type: 'localeDropdown',
        position: 'right',
        dropdownItemsAfter: [{ type: 'html', value: '<hr />' }],
      },

      /** 搜索框（仅占位，需 algolia 插件） */
      { type: 'search', position: 'right' },

      /** 外部链接 */
      { href: 'https://github.com', label: 'GitHub', position: 'right' },

      /** 嵌套下拉 */
      {
        label: '社区',
        position: 'right',
        items: [
          { label: 'Twitter', href: 'https://twitter.com' },
          { type: 'doc', docId: 'support', label: '支持' },
        ],
      },

      /** 自定义 HTML */
      {
        type: 'html',
        position: 'right',
        value: '<button>Login</button>',
      },
    ],
  },
}
```

### footer

```ts
footer: {
  style: 'dark',                                   // 'dark' | 'light'
  logo: {
    alt: 'Footer Logo',
    src: 'img/footer-logo.svg',
    href: '/',
    width: 160,
    height: 51,
  },
  copyright: `Copyright © ${new Date().getFullYear()} My Site.`,
  links: [
    /** 多列分组 */
    {
      title: '文档',
      items: [
        { label: '入门', to: '/docs/intro' },
        { label: '指南', to: '/docs/guide' },
      ],
    },
    /** 单列扁平（不要 title 字段） */
    {
      items: [
        { label: 'GitHub', href: 'https://github.com' },
      ],
    },
  ],
}
```

### colorMode

```ts
colorMode: {
  defaultMode: 'light',                            // 'light' | 'dark'
  disableSwitch: false,                            // 隐藏切换按钮
  respectPrefersColorScheme: true,                 // 跟随系统
}
```

### prism

```ts
prism: {
  theme: prismThemes.github,
  darkTheme: prismThemes.dracula,
  defaultLanguage: 'javascript',
  additionalLanguages: ['bash', 'json', 'yaml', 'python'],
  magicComments: [
    {
      className: 'theme-code-block-highlighted-line',
      line: 'highlight-next-line',
      block: { start: 'highlight-start', end: 'highlight-end' },
    },
    {
      className: 'code-block-error-line',
      line: 'this-will-error',
    },
  ],
}
```

### docs.sidebar

```ts
docs: {
  sidebar: {
    hideable: true,                                // 用户可隐藏整个 sidebar
    autoCollapseCategories: true,                  // 展开一个时自动收其他
  },
  versionPersistence: 'localStorage',              // 'localStorage' | 'none'
}
```

### tableOfContents

```ts
tableOfContents: {
  minHeadingLevel: 2,
  maxHeadingLevel: 4,
}
```

### announcementBar

```ts
announcementBar: {
  id: 'announcement-2026-05',                      // 用户关闭后不再显示（按 id）
  content: '🎉 Docusaurus 3.5 已发布！ <a href="/blog/release-3.5">阅读详情</a>',
  backgroundColor: '#fafbfc',
  textColor: '#091E42',
  isCloseable: true,
}
```

### algolia

```ts
algolia: {
  appId: 'YOUR_APP_ID',
  apiKey: 'YOUR_SEARCH_KEY',
  indexName: 'YOUR_INDEX',
  contextualSearch: true,                          // 按 locale/version 过滤
  externalUrlRegex: 'external\\.com',
  replaceSearchResultPathname: {                   // URL 改写
    from: '/docs/',
    to: '/',
  },
  searchParameters: {
    facetFilters: ['language:zh'],
  },
  searchPagePath: 'search',                        // 独立搜索页
  insights: false,                                 // Algolia Insights 跟踪
}
```

### metadata

```ts
metadata: [
  { name: 'twitter:card', content: 'summary_large_image' },
  { name: 'twitter:site', content: '@docusaurus' },
  { property: 'og:type', content: 'website' },
]
```

### image

```ts
image: 'img/social-card.jpg',                      // 默认 og:image
```

### liveCodeBlock（需 theme-live-codeblock）

```ts
themes: ['@docusaurus/theme-live-codeblock'],
themeConfig: {
  liveCodeBlock: {
    playgroundPosition: 'bottom',                  // 'top' | 'bottom'
  },
}
```

### mermaid（需 theme-mermaid）

```ts
themes: ['@docusaurus/theme-mermaid'],
markdown: { mermaid: true },
themeConfig: {
  mermaid: {
    theme: { light: 'neutral', dark: 'dark' },
    options: { /* Mermaid 选项 */ },
  },
}
```

## 文件约定

| 路径 | 用途 | 必需 |
|---|---|---|
| `docusaurus.config.ts` | 站点配置 | ✅ |
| `sidebars.ts` | 文档侧边栏 | docs 用时 |
| `package.json` | 依赖 | ✅ |
| `tsconfig.json` | TS 配置 | TS 项目 |
| `babel.config.js` | Babel 配置 | ✅（自动生成） |
| `docs/` | 文档源 | docs 用时 |
| `docs/**/_category_.json` | 目录配置 | 可选 |
| `docs/tags.yml` | 文档标签声明 | 可选 |
| `blog/` | 博客文章 | blog 用时 |
| `blog/authors.yml` | 博客作者 | 可选 |
| `blog/tags.yml` | 博客标签声明 | 可选 |
| `src/pages/` | 独立页面 | 可选 |
| `src/components/` | 自定义 React 组件 | 可选 |
| `src/css/custom.css` | 全局样式 | preset-classic 用 |
| `src/theme/` | Swizzle 后的主题组件 | 可选 |
| `src/theme/MDXComponents.tsx` | 全局 MDX 组件 | 可选 |
| `src/theme/Root.tsx` | App 根包装 | 可选 |
| `static/` | 静态资源 | ✅ |
| `i18n/{locale}/` | 翻译文件 | i18n 用时 |
| `versioned_docs/version-X.X.X/` | 历史版本文档 | 多版本时 |
| `versioned_sidebars/` | 历史版本 sidebar | 多版本时 |
| `versions.json` | 版本列表 | 多版本时 |
| `.docusaurus/` | 构建缓存（gitignore） | 自动生成 |
| `build/` | 构建产物（gitignore） | 自动生成 |
| `_*.{md,mdx,tsx,ts}` | 下划线前缀文件 / 目录 | ❌ 不会生成路由（用于工具文件） |

## 路径别名

| 别名 | 指向 |
|---|---|
| `@site` | 项目根目录 |
| `@theme` | 当前主题（含 swizzled 组件） |
| `@theme-original` | 主题原始组件（swizzle wrap 用） |
| `@theme-init` | 主题初始组件（swizzle 后链式覆盖用） |
| `@docusaurus/*` | Docusaurus 客户端 API |
| `@generated/*` | 构建时自动生成的代码 |

示例：

```tsx
import Layout from '@theme/Layout'                              // 当前主题
import FooterOriginal from '@theme-original/Footer'             // 未被 swizzle 的原 Footer
import config from '@site/docusaurus.config'                    // 项目根
import Hello from '@site/src/components/Hello'                  // 项目内组件
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import { translations } from '@generated/docusaurus.config'
```

## Plugin Lifecycle Hooks

| Hook | 时机 | 返回 |
|---|---|---|
| `loadContent()` | 加载阶段 | 任意数据（喂给 contentLoaded） |
| `contentLoaded({ content, actions })` | 数据就绪 | 用 `actions.addRoute()` / `createData()` |
| `postBuild({ siteConfig, routesPaths, outDir, head, content })` | 构建完成 | void |
| `postStart({ siteConfig })` | dev server 启动后 | void |
| `configureWebpack(config, isServer, utils, content)` | webpack 编译前 | webpack 配置补丁 |
| `configurePostCss(options)` | PostCSS 处理前 | 修改后的 options |
| `injectHtmlTags({ content })` | HTML 渲染 | `{ headTags, preBodyTags, postBodyTags }` |
| `getThemePath()` | 主题解析 | 主题目录路径 |
| `getTypeScriptThemePath()` | TS 主题解析 | TS 主题目录路径 |
| `getClientModules()` | 客户端 | 模块路径数组 |
| `getDefaultCodeTranslationMessages()` | i18n | `Record<string, string>` |
| `getPathsToWatch()` | dev | 监听路径数组 |
| `extendCli(cli)` | CLI 扩展 | void（用 commander API） |

## 预设（preset-classic）内含

`@docusaurus/preset-classic` 一次启用以下插件 / 主题：

| 子项 | 配置 key | 作用 |
|---|---|---|
| `@docusaurus/plugin-content-docs` | `docs` | 文档系统 |
| `@docusaurus/plugin-content-blog` | `blog` | 博客系统 |
| `@docusaurus/plugin-content-pages` | `pages` | 独立页面 |
| `@docusaurus/plugin-sitemap` | `sitemap` | sitemap.xml |
| `@docusaurus/plugin-debug` | `debug` | `/__docusaurus/debug` |
| `@docusaurus/plugin-google-gtag` | `gtag` | Google Analytics |
| `@docusaurus/plugin-google-tag-manager` | `googleTagManager` | GTM |
| `@docusaurus/theme-classic` | `theme` | 经典主题 |
| `@docusaurus/theme-search-algolia` | — | Algolia 集成 |

配置示例：

```ts
presets: [
  [
    'classic',
    {
      docs: { /* plugin-content-docs 配置 */ },
      blog: { /* plugin-content-blog 配置 */ },
      pages: { /* plugin-content-pages 配置 */ },
      sitemap: { changefreq: 'weekly', priority: 0.5 },
      debug: undefined,                            // 关闭：false
      gtag: { trackingID: 'G-XXXXX', anonymizeIP: true },
      googleTagManager: { containerId: 'GTM-XXXXX' },
      theme: { customCss: './src/css/custom.css' },
    },
  ],
]
```

## 命名约定

| 实体 | 约定 |
|---|---|
| 站点 | `kebab-case`（`my-docs-site`） |
| 文档 ID | `kebab-case`（`tutorial-basics/create-a-page`） |
| 博客 slug | `kebab-case`（`welcome-docusaurus-v3`） |
| React 组件 | `PascalCase`（`HomepageFeatures.tsx`） |
| CSS Modules | `kebab-case.module.css` |
| 全局 CSS 类 | `kebab-case`（`my-custom-class`） |
| Frontmatter 字段 | `snake_case`（`sidebar_position` / `hide_title`） |
| Plugin 名 | `@scope/plugin-name`（`@docusaurus/plugin-content-docs`） |
| Plugin ID | 当多实例时 `kebab-case`（`api` / `tutorial`） |

## 调试

### Debug 页

```ts
plugins: ['@docusaurus/plugin-debug']
// preset-classic 默认在 dev 启用
```

访问 `/__docusaurus/debug`——展示：

- 站点元数据
- 路由列表
- 内容（docs / blog / pages）
- 全局 plugin 数据
- 注册器配置

### Webpack Bundle Analyzer

```bash
npm run build -- --bundle-analyzer
```

构建后自动启动浏览器查看 bundle 组成。

### MDX 编译错误

报错时优先：

1. `npx docusaurus-mdx-checker` 扫描整站 MDX
2. 在出错文件中搜索 `{` / `<` 字符
3. 用反引号 `` ` `` 或 HTML 实体（`&#123;` / `&lt;`）转义

### 开发环境

```bash
DEBUG=docusaurus:* npm run start
# 输出详细日志
```

## 升级路径

### v2 → v3

主要变更：

- **MDX 1 → 3**：解析更严格（`{` / `<` 字符）
- **Node 16 → 18+**（v3.6+ 要求 20+）
- **React 17 → 18**
- **TypeScript 4 → 5.1+**
- `@tsconfig/docusaurus` → `@docusaurus/tsconfig`
- `prism-react-renderer` v1 → v2（主题导入方式变化）

升级步骤：

```bash
npm install --save @docusaurus/core@latest @docusaurus/preset-classic@latest
npm install --save-dev @docusaurus/types@latest @docusaurus/tsconfig@latest @docusaurus/module-type-aliases@latest
npx docusaurus-mdx-checker
```

### v3.x 内部升级

通常无破坏变更，但建议关注 `future.faster` 实验特性：

```ts
future: {
  faster: { rspackBundler: true, swcJsLoader: true },
}
```

可在生产前先用 dev 验证。

### v4 准备

未来 v4 会默认启用现在的 `future.v4` 标志。可提前在 v3 启用：

```ts
future: {
  v4: {
    removeLegacyPostBuildHeadAttribute: true,
    useCssCascadeLayers: true,
    siteStorageNamespacing: true,
    fasterByDefault: true,
    mdx1CompatDisabledByDefault: true,
  },
}
```
