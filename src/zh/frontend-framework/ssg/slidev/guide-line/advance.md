---
layout: doc
outline: [2, 4]
---

# 高级

## 速查

- shiki 配置文件：`./setup/shiki.ts`
- vite 配置文件：`./vite.config.ts`
- vue 配置文件：`./setup/main.ts`
- UnoCSS 配置文件：`./uno.config.ts`
- 代码运行器配置文件：`./setup/code-runners.ts`
- MD语法扩展配置文件：`./setup/transformers.ts`
- Monaco 配置文件：`./setup/monaco.ts`
- KaTeX 配置文件：`./setup/katex.ts`
- Mermaid 配置文件：`./setup/mermaid.ts`
- 路由配置文件：`./setup/router.ts`
- 快捷键配置文件：`./setup/shortcuts.ts`
- 右键菜单配置文件：`./setup/context-menu.ts`
- 预解析器配置文件：`./setup/preparser.ts`

## 自定义配置

### Headmatter

```yaml
---
# 主题 id 或 主题包名称
# 了解更多：https://cn.sli.dev/guide/theme-addon#use-theme
theme: default
# 附加组件, 一个可以含包名或本地路径的数组。
# 了解更多： https://cn.sli.dev/guide/theme-addon#use-addon
addons: []
# 幻灯片的总标题，如果没有指定，那么将以第一张拥有标题的幻灯片的标题作为总标题。
title: Slidev
# 网页的标题模板，`%s` 会被页面的标题替换。
titleTemplate: '%s - Slidev'
# 幻灯片信息，可以是一个 markdown 字符串。
info: false
# 导出的 PDF 或 PPTX 文件中的作者字段。
author: Your Name Here
# 导出的 PDF 文件中的关键字，以逗号分割。
keywords: keyword1,keyword2

# 启用演讲者模式，可以是一个 boolean 值、'dev' 或 'build'
presenter: true
# 在单页（SPA）构建中启用 pdf 下载，也可以指定一个自定义 url
download: false
# 要导出文件的文件名称
exportFilename: slidev-exported
# 导出选项
# 使用驼峰命名法的导出 CLI 选项
# 了解更多： https://cn.sli.dev/guide/exporting
export:
  format: pdf
  timeout: 30000
  dark: false
  withClicks: false
  withToc: false
# 语法高亮设置，可以使用 'shiki' 或 'prism'(已弃用) 方案
highlighter: shiki
# 启用 twoslash, 可以是一个 boolean 值，'dev' 或 'build'
twoslash: true
# 在代码块中显示行号
lineNumbers: false
# 启用 monaco 编辑器，可以是一个 boolean 值，'dev' 或 'build'
monaco: true
# 从何处加载 monaco 的类型，可以是 'cdn'，'local' 或 ‘none’
monacoTypesSource: local
# 指定额外的本地包以导入 monaco 类型
monacoTypesAdditionalPackages: []
# 指定额外的本地模块作为 monaco 可运行的依赖项
monacoRunAdditionalDeps: []
# 使用 vite-plugin-remote-assets 在本地下载远程资源，可以是一个 boolean 值，'dev' 或者 'build'
remoteAssets: false
# 控制幻灯片中的文本是否可以被选择
selectable: true
# 启用幻灯片录制，可以是一个 boolean 值，'dev' 或者 'build'
record: dev
# 启用 Slidev 的前后文菜单，可以是一个 boolean 值，'dev' 或者 'build'
contextMenu: true
# 防止休眠，可以是一个 boolean 值，'dev' 或者 'build'
wakeLock: true

# 幻灯片的配色方案，可以使用 'auto'，'light' 或者 'dark'
colorSchema: auto
# vue-router 模式，可以使用 'history' 或 'hash' 模式
routerMode: history
# 幻灯片的长宽比
aspectRatio: 16/9
# canvas 的真实宽度，单位为 px
canvasWidth: 980
# 用于主题定制，会将属性 `x` 注入根样式 `--slidev-theme-x`
themeConfig:
  primary: '#5d8392'

# favicon 可以是本地文件路径，也可以是一个 URL
favicon: 'https://cdn.jsdelivr.net/gh/slidevjs/slidev/assets/favicon.png'
# 用于渲染图表的 PlantUML 服务器的 URL
# 了解更多： https://cn.sli.dev/features/plantuml.html
plantUmlServer: https://www.plantuml.com/plantuml
# 字体将从 Google 字体自动导入
# 了解更多： https://cn.sli.dev/custom/config-fonts
fonts:
  sans: Roboto
  serif: Roboto Slab
  mono: Fira Code

# 为所有幻灯片添加默认的 frontmatter
defaults:
  layout: default
  # ...

# 绘制选项
# 了解更多：https://cn.sli.dev/features/drawing
drawings:
  enabled: true
  persist: false
  presenterOnly: false
  syncAll: true

# HTML 标签属性
htmlAttrs:
  dir: ltr
  lang: en
---
```

### FrontMatter

```yaml
---
# 自定义点击计数
# 了解更多： https://cn.sli.dev/guide/animations#custom-total-clicks-count
clicks: 0
# 自定义初始点击次数
clicksStart: 0
# 完全禁用和隐藏幻灯片
disabled: false
# 等同于 `disabled` 
hide: false
# 为 `<Toc>` 组件隐藏幻灯片
hideInToc: false
# 定义应用于幻灯片的布局组件
layout: <"cover" if the slide is the first slide, otherwise "default">
# 仅当同时声明了 `title` 配置时，为 `<TitleRenderer>` 和 `<Toc>` 提供组件级的标题覆盖
level: 1
# 预加载下一张幻灯片
preload: true
# 创建一个路由别名，可用于 URL 或 `<Link>` 组件
routeAlias: undefined # 或 string
# 引入一个 Markdown 文件
# 了解更多： https://cn.sli.dev/guide/syntax.html#importing-slides
src: undefined # 或 string
# 仅当同时声明了 `level` 配置时，覆盖 `<TitleRenderer>` 和 `<Toc>` 组件的标题
title: undefined # 或 string
# 定义幻灯片与下一张幻灯片之间的过渡
# 了解更多： https://cn.sli.dev/guide/animations.html#slide-transitions
transition: undefined # 或 string | TransitionProps
# 自定义缩放比例
# 适用于内容较多的幻灯片
zoom: 1
# 用于可拖动元素的位置
# 了解更多： https://cn.sli.dev/features/draggable.html
dragPos: {} # 类型: Record<string,string>
---
```

## 目录结构

```yaml
your-slidev/
  ├── components/       # 自定义组件
  ├── layouts/          # 自定义布局
  ├── public/           # 静态资源
  ├── setup/            # 自定义 setup / hooks
  ├── snippets/         # 代码片段
  ├── styles/           # 自定义样式
  ├── index.html        # 注入的 index.html
  ├── slides.md         # 幻灯片主入口
  └── vite.config.ts    # 扩展 vite 配置
```

### 样式

约定路径: `./style.css` | `./styles/index.{css,js,ts}`

默认自动注入样式，如需多个请自己整合，示例：

```bash
your-slidev/
  ├── ...
  └── styles/
      ├── index.ts
      ├── base.css
      ├── code.css
      └── layouts.css
```

```jsx
// styles/index.ts

import './base.css'
import './code.css'
import './layouts.css'
```

得益于 [**UnoCSS**](https://unocss.dev/) 和 [**PostCSS**](https://postcss.org/)，样式中可以使用 css 嵌套和 [**at-directives**](https://unocss.dev/transformers/directives#apply)。示例：

```css
.slidev-layout {
  --uno: px-14 py-10 text-[1.1rem];

  h1, h2, h3, h4, p, div {
    --uno: select-none;
  }

  pre, code {
    --uno: select-text;
  }

  a {
    color: theme('colors.primary');
  }
}
```

### index.html

放在根路径下，会和 Slidev 生成的 `index.html` 进行合并

```html
<!-- ./index.html -->
<head>
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Nunito+Sans:wght@200;400;600&display=swap" rel="stylesheet">
</head>

<body>
  <script src="./your-scripts"></script>
</body>
```

合并后

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/gh/slidevjs/slidev/assets/favicon.png">
  <!-- injected head -->
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Nunito+Sans:wght@200;400;600&display=swap" rel="stylesheet">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="__ENTRY__"></script>
  <!-- 注入的 body -->
  <script src="./your-scripts"></script>
</body>
</html>
```
## 配置语法高亮

创建 `./setup/shiki.ts` 文件：

```jsx
/* ./setup/shiki.ts */
import { defineShikiSetup } from '@slidev/types'

export default defineShikiSetup(() => {
  return {
    themes: {
      dark: 'min-dark',
      light: 'min-light',
    },
    transformers: [
      // ...
    ],
  }
})
```

修改主题，添加语言

```jsx
/* ./setup/shiki.ts */
import { defineShikiSetup } from '@slidev/types'
import customTheme from './customTheme.tmTheme.json'
import customLanguage from './customLanguage.tmLanguage.json'

export default defineShikiSetup(() => {
  return {
    themes: {
      dark: customTheme,
      light: 'min-light',
    },
    langs: [
      'js',
      'typescript',
      'cpp',
      customLanguage,
      // ...
    ],
    transformers: [
      // ...
    ],
  }
})
```

## 配置 Vite

如果项目中存在 `vite.config.ts` 文件，将被自动读取，并将与 Slidev，你的主题和扩展插件提供的配置文件合并

### 配置内部插件

Slidev 已经内置了以下插件：

- [**@vitejs/plugin-vue**](https://github.com/vitejs/vite-plugin-vue)
- [**unplugin-vue-components**](https://github.com/unplugin/unplugin-vue-components)
- [**unplugin-icons**](https://github.com/unplugin/unplugin-icons)
- [**vite-plugin-vue-markdown**](https://github.com/unplugin/unplugin-vue-markdown)
- [**vite-plugin-remote-assets**](https://github.com/antfu/vite-plugin-remote-assets)
- [**unocss/vite**](https://github.com/unocss/unocss/tree/main/packages/vite)

示例

```jsx
import { defineConfig } from 'vite'

export default defineConfig({
  slidev: {
    vue: {
      /* vue 的选项 */
    },
    markdown: {
      /* markdown-it 的选项 */
      markdownItSetup(md) {
        /* 自定义的 markdown-it 插件 */
        md.use(MyPlugin, /* ... */)
      },
    },
    /* 其他插件的选项 */
  },
})
```

## 配置 Vue 实例

创建 `./setup/main.ts` 文件

```jsx
import { defineAppSetup } from '@slidev/types'

export default defineAppSetup(({ app, router }) => {
  // Vue App
  app.use(YourPlugin)
})
```

## 配置 UnoCSS

默认地，Slidev 开箱即用地使用了以下的预设：

- [**@unocss/preset-uno**](https://unocss.dev/presets/uno) - Tailwind / Windi CSS 兼容工具
- [**@unocss/preset-attributify**](https://unocss.dev/presets/attributify) - Attributify 模式
- [**@unocss/preset-icons**](https://unocss.dev/presets/icons) - 以 class 方式使用任何 icon
- [**@unocss/preset-web-fonts**](https://unocss.dev/presets/web-fonts) - 轻松使用网络字体文件
- [**@unocss/transformer-directives**](https://unocss.dev/transformers/directives) - 在 CSS 中使用 `@apply`

在跟文件夹创建 `uno.config.ts`来扩展内置配置项

```jsx
import { defineConfig } from 'unocss'

export default defineConfig({
  shortcuts: {
    // 自定义默认的背景
    'bg-main': 'bg-white text-[#181818] dark:(bg-[#121212] text-[#ddd])',
  },
  // ...
})
```

## 配置代码运行器

默认支持 JS 和 TS ，也可以自定义语言

创建 `./setup/code-runners.ts` 文件：

```jsx
import { defineCodeRunnersSetup } from '@slidev/types'

export default defineCodeRunnersSetup(() => {
  return {
    async python(code, ctx) {
      // 以某种方式执行代码并获取输出
      const result = await executePythonCodeRemotely(code)
      return {
        text: result
      }
    },
    html(code, ctx) {
      return {
        html: sanitizeHtml(code)
      }
    },
    // 也可以添加其他语言。键是语言id，值是运行器函数
  }
})
```

第二个传入参数 `ctx` 是运行的上下文, 包含了以下属性：

```jsx
export interface CodeRunnerContext {
  /**
   * 通过 `runnerOptions` 属性传递给运行器的选项。
   */
  options: Record<string, unknown>
  /**
   * 使用 Shiki 高亮代码。
   */
  highlight: (code: string, lang: string, options?: Partial<CodeToHastOptions>) => string
  /**
   * 使用其他代码运行器运行代码。
   */
  run: (code: string, lang: string) => Promise<CodeRunnerOutputs>
}
```

运行器可以返回文本或 HTML 输出，或者一个要挂载的 HTML 元素。

## 配置自定义MD语法

创建一个 `/setup/transformers.ts` 文件

```jsx
import type { MarkdownTransformContext } from '@slidev/types'
import { defineTransformersSetup } from '@slidev/types'

function myCodeblock(ctx: MarkdownTransformContext) {
  console.log('在整个幻灯片中的索引：', ctx.slide.index)
  ctx.s.replace(
    /^```myblock *(\{[^\n]*\})?\n([\s\S]+?)\n```/gm,
    (full: string, options = '', code = '') => {
      return `...`
    },
  )
}

export default defineTransformersSetup(() => {
  return {
    pre: [],
    preCodeblock: [myCodeblock],
    postCodeblock: [],
    post: [],
  }
})
```

返回值是包含 `pre`、`preCodeblock`、`postCodeblock` 和 `post` 四个可选字段，每个字段的值是函数数组，将被调用以转换 Markdown 内容。它们的调用顺序为：

1. 来自你的项目的 `pre`
2. 来自插件和主题的 `pre`
3. 导入代码片段语法和 Shiki magic move
4. 来自你的项目的 `preCodeblock`
5. 来自插件和主题的 `preCodeblock`
6. 内置的 Mermaid、Monaco 和 PlantUML 等特殊代码块
7. 来自插件和主题的 `postCodeblock`
8. 来自你的项目的 `postCodeblock`
9. 其他内置的自定义语法，如代码块包装
10. 来自插件和主题的 `post`
11. 来自你的项目的 `post`

## 配置 Monaco

创建 `./setup/monaco.ts` 文件：

```jsx
import { defineMonacoSetup } from '@slidev/types'

export default defineMonacoSetup(async (monaco) => {
  // 使用 `monaco` 配置
})
```

### TypeScript 类型

当你使用 Monaco 编写 TypeScript 时，类型依赖将会自动安装到客户端.

````markdown
```ts {monaco}
import { ref } from 'vue'
import { useMouse } from '@vueuse/core'

const counter = ref(0)
```
````

在上面的例子中，确保 `vue` 和 `@vueuse/core` 作为 dependencies 或 devDependencies 安装在本地，Slidev 将处理其余部分，以使编辑器自动使用这些类型。当部署为 SPA 时，这些类型也将被打包用于静态托管。

### 附加类型

```yaml
---
monacoTypesAdditionalPackages:
  - lodash-es
  - foo
---
```

### 自动类型获取

```yaml
---
monacoTypesSource: ata
---
```

### 配置主题

Monaco 将复用你在 Shiki 的配置文件中配置的 Shiki 主题

### 配置编辑器

实例：

````markdown
```ts {monaco} { editorOptions: { wordWrap:'on'} }
console.log('HelloWorld')
```
````

全局：

```jsx
// ./setup/monaco.ts
import { defineMonacoSetup } from '@slidev/types'

export default defineMonacoSetup(() => {
  return {
    editorOptions: {
      wordWrap: 'on'
    }
  }
})
```

## 配置 KaTeX

创建 `./setup/katex.ts` 文件：

```jsx
import { defineKatexSetup } from '@slidev/types'

export default defineKatexSetup(() => {
  return {
    maxExpand: 2000,
    /* ... */
  }
})
```

## 配置 Mermaid

创建 `./setup/mermaid.ts` 文件：

```jsx
import { defineMermaidSetup } from '@slidev/types'

export default defineMermaidSetup(() => {
  return {
    theme: 'forest',
  }
})
```

### 主体和样式配置

```jsx
import { defineMermaidSetup } from '@slidev/types'

export default defineMermaidSetup(() => {
  return {
    theme: 'base',
    themeVariables: {
      // 主题变量
      noteBkgColor: '#181d29',
      noteTextColor: '#F3EFF5cc',
      noteBorderColor: '#404551',

      // 序列图变量
      actorBkg: '#0E131F',
      actorBorder: '#44FFD2',
      actorTextColor: '#F3EFF5',
      actorLineColor: '#F3EFF5',
      signalColor: '#F3EFF5',
      signalTextColor: '#F3EFF5',
    }
  }
})
```

## 配置路由

用于将自定义页面添加到 Slidev。

创建 `./setup/routes.ts` 文件：

```jsx
import { defineRoutesSetup } from '@slidev/types'

export default defineRoutesSetup((routes) => {
  return [
    ...routes,
    {
      path: '/my-page',
      component: () => import('../pages/my-page.vue'),
    },
  ]
})
```

## 配置快捷键

创建 `./setup/shortcuts.ts` 文件：

```jsx
import type { NavOperations, ShortcutOptions } from '@slidev/types'
import { defineShortcutsSetup } from '@slidev/types'

export default defineShortcutsSetup((nav: NavOperations, base: ShortcutOptions[]) => {
  return [
    ...base, // 保留已有的快捷键
    {
      key: 'enter',
      fn: () => nav.next(),
      autoRepeat: true,
    },
    {
      key: 'backspace',
      fn: () => nav.prev(),
      autoRepeat: true,
    },
  ]
})
```

:::tip **键盘 Code**

https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values

:::

## 配置右键菜单

创建 `./setup/context-menu.ts` 文件：

```jsx
import { defineContextMenuSetup } from '@slidev/types'
import { useNav } from '@slidev/client'
import { computed } from 'vue'
import Icon3DCursor from '~icons/carbon/3d-cursor'

export default defineContextMenuSetup((items) => {
  const { isPresenter } = useNav()
  return computed(() => [
    ...items.value,
    {
      small: false,
      icon: Icon3DCursor, // 当 `small` 为 `true` 时，仅显示图标
      label: 'Custom Menu Item', // 也可以是 Vue 组件
      action() {
        alert('Custom Menu Item Clicked!')
      },
      disabled: isPresenter.value,
    },
  ])
})
```

## 配置字体

```jsx
---
fonts:
  # basically the text
  sans: Robot
  # use with `font-serif` css class from UnoCSS
  serif: Robot Slab
  # for code blocks, inline code, etc.
  mono: Fira Code
---
```

- 普通文本（无特殊类的）用 Roboto。
- 加了 font-serif 类的文本用 Roboto Slab。
- 代码用 Fira Code。

默认会从 **[Google Fonts](https://fonts.google.com/)** 自动引入，可以指定 `fonts.local` 字段来选择不使用自动引入的字体

### 粗体斜体

```yaml
---
fonts:
  sans: Robot
  # 默认为
  weights: '200,400,600'
  # 引入斜体字体，默认 `false`
  italic: false
---
```

### 禁用字体回退

```yaml
---
fonts:
  mono: 'Fira Code, monospace'
  fallbacks: false
---
```

### 设置字体源

- 选项: `google` | `none`
- 默认值: `google`

```yaml
---
fonts:
  provider: none
---
```

### 配置预解析器

创建 `./setup/preparser.ts` 文件：

```jsx
import { definePreparserSetup } from '@slidev/types'

export default definePreparserSetup(({ filepath, headmatter, mode }) => {
  return [
    {
      transformRawLines(lines) {
        for (const i in lines) {
          if (lines[i] === '@@@')
            lines[i] = 'HELLO'
        }
      },
    }
  ]
})
```

这个例子系统地将任何 `@@@`行替换为 `hello` 行。