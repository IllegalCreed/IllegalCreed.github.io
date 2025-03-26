---
layout: doc
outline: [2, 4]
---

# 参考

## 速查

- 进入该幻灯片时调用：`onSlideEnter`
- 离开该幻灯片时调用：`onSlideLeave`
- 幻灯片是否处于活动状态：`useIsSlideActive`
- 幻灯片导航：`useNav` | `$nav`
- 绘画相关：`useDrawings` | `drawingState` | `onDrawingUpdate`
- 主题相关：`useDarkMode` | `$slidev.themeConfigs`
- 幻灯片上下文：`useSlideContext` | `$slidev`
- 幻灯片元信息：`$frontmatter`
- 幻灯片点击次数：`$clicks`
- 幻灯片渲染上下文：`$renderContext`
- 幻灯片项目配置：`$slidev.configs`
- 幻灯片页码：`$page`


## API

### 用法

**在markdown或组件中直接使用**

```markdown
<!-- slides.md -->

# Page 1

当前正在查看第 {{ $nav.currentPage }} 页
```

```html
<!-- Foo.vue -->

<template>
  <div>Title: {{ $slidev.configs.title }}</div>
  <button @click="$nav.next">
    下一步动画
  </button>
  <button @click="$nav.nextSlide">
    下一张幻灯片
  </button>
</template>
```

**通过 Composable 使用**

```html
<script setup>
import { onSlideEnter, onSlideLeave, useDarkMode, useIsSlideActive, useNav, useSlideContext } from '@slidev/client'

const { $slidev } = useSlideContext()
const { currentPage, currentLayout, currentSlideRoute } = useNav()
const { isDark } = useDarkMode()
const isActive = useIsSlideActive()
onSlideEnter(() => { /* ... */ })
onSlideLeave(() => { /* ... */ })
// ...
</script>
```

:::warning
当你使用 `useSlideContext` 时，`$slidev` 将不会被自动注入
:::

### 生命周期 Hooks

```jsx
import { onSlideEnter, onSlideLeave, useIsSlideActive } from '@slidev/client'

const isActive = useIsSlideActive()

onSlideEnter(() => {
  /* 将会在进入该幻灯片时被调用 */
})

onSlideLeave(() => {
  /* 将会在离开该幻灯片时被调用 */
})
```

### **注入的属性**

**`$slidev`**

全局上下文对象。

**`$frontmatter`**

当前幻灯片的 frontmatter 对象。

**`$clicks`**

该属性表示当前幻灯片上的点击次数。

```jsx
<div v-if="$clicks > 3">Content</div>
```

**`$nav`**

导航对象

```jsx
$nav.next() // 下一步动画
$nav.nextSlide() // 下一张幻灯片，跳过动画
$nav.go(10) // 跳转到第 10 页

$nav.currentPage // 当前页码
$nav.currentLayout // 当前幻灯片的布局
```

**`$page`**

当前页的页码，从 1 开始。

```jsx
这是第 {{ $page }} 页

正在查看该页吗? {{ $page === $nav.currentPage }}
```

:::tip
`$nav.clicks` 是全局导航状态，而 `$clicks` 是每张幻灯片的自己的点击次数。

:::

**`$renderContext`**

当前的渲染上下文

```jsx
<div v-if="['slide', 'presenter'].includes($renderContext)">
  该内容仅在主幻灯片视图中呈现
</div>
```

```tsx
type RenderContext = 'none' | 'slide' | 'overview' | 'presenter' | 'previewNext'
```

可以用 `<RenderWhen>` 替换

**`$slidev.configs`**

幻灯片项目的配置

```markdown
---
title: My First Slidev!
---

# 第一页

---

# 其他任何页面

{{ $slidev.configs.title }} // 'My First Slidev!'
```

**`$slidev.themeConfigs`**

解析后的主题配置

```yaml
---
title: My First Slidev!
themeConfig:
  primary: '#213435'
---

{{ $slidev.themeConfigs.primary }} // '#213435'
```

### **类型支持**

可以从 `@slidev/types` 导入 `TocItem` 等类型信息

```html
<script setup>
import type { TocItem } from '@slidev/types'

function tocFunc(tree: TocItem[]): TocItem[] {
  // ...
}
</script>
```

## CLI

可以通过全局安装 `@slidev/cli` 来使用 CLI，默认通过 `npm init slidev` 创建的项目已经安装好了

命令行选项遵循以下规则：

- 选项的值可以在空格或 `=` 字符后传递：
    
    例子: `slidev --port 8080` 等价于 `slidev --port=8080`
    
- 对于布尔选项，`true` 值可以省略：
    
    例子: `slidev --open` 等价于 `slidev --open true`
    

### **slidev [entry]**

启动一个本地 Slidev 服务器。

- `[entry]` (`string`, 默认值: `slides.md`): 幻灯片的 markdown 文件路径.

选项:

- `-port`, `p` (`number`, 默认值: `3030`): 端口号
- `--base` (`string`, 默认值: `/`): base URL
- `-open`, `o` (`boolean`, 默认值: `false`): 自动在浏览器中打开
- `-remote [password]` (`string`): 监听公共主机并启用远程控制。如果传递了一个值，演示者模式将会是私有的，只能通过在URL中添加 `password` 的参数来传递密码以访问。
- `-bind` (`string`, 默认值: `0.0.0.0`): 指定服务器在远程模式下应监听哪些IP地址
- `-log` (`'error', 'warn', 'info', 'silent'`, 默认值: `'warn'`): 日志等级
- `-force`, `f` (`boolean`, 默认值: `false`): 强制忽略缓存并重新打包
- `-theme`, `t` (`string`): 覆盖文件中设定的主题

### **slidev build [entry]**

构建 SPA

- `[entry]` (`string`, default: `slides.md`): 幻灯片的 markdown 文件路径。

选项：

- `-out`, `o` (`string`, 默认值: `dist`): 输出目录
- `-base` (`string`, 默认值: `/`): 基本 URL (参考 [**https://vitejs.dev/config/shared-options.html#base**](https://vitejs.dev/config/shared-options.html#base))
- `-download` (`boolean`, 默认值: `false`): 允许在构建后下载相应 幻灯片的 PDF 文件
- `-theme`, `t` (`string`): 覆盖文件中设定的主题

### **slidev export [...entry]**

将幻灯片导出为 PDF（或其他格式）

- `[entry]` (`string`, 默认值: `slides.md`): 幻灯片的 markdown 文件路径

选项：

- `-output` (`string`, 默认值: use `exportFilename` (参考 [**https://cn.sli.dev/custom/#frontmatter-configures**](https://cn.sli.dev/custom/#frontmatter-configures)) 或使用 `[entry]-export`): 导出的路径.
- `-format` (`'pdf', 'png', 'md'`, 默认值: `'pdf'`): 输出格式.
- `-timeout` (`number`, 默认值: `30000`): 渲染打印页面的超时时间 (参考 [**https://playwright.dev/docs/api/class-page#page-goto**](https://playwright.dev/docs/api/class-page#page-goto))
- `-range` (`string`): 导出的页面范围 (示例: `'1,4-5,6'`).
- `-dark` (`boolean`, 默认值: `false`): 导出为暗黑模式
- `-with-clicks`, `c` (`boolean`, 默认值: `false`): 为每次点击分别导出 (参考 [**https://cn.sli.dev/guide/animations.html#click-animations**](https://cn.sli.dev/guide/animations.html#click-animations)).
- `-theme`, `t` (`string`): 覆盖文件中设定的主题
- `-omit-background` (`boolean`, default: `false`): 不导出浏览器默认的背景色

### **slidev format [entry]**

格式化 markdown 文件。

- `[entry]` (`string`, 默认值: `slides.md`): 幻灯片的 markdown 文件路径

### **slidev theme [subcommand]**

主题相关的操作。

子命令：

- `eject [entry]`: 将当前主题弹出到本地文件中
    - `[entry]` (`string`, 默认值: `slides.md`): 幻灯片的 markdown 文件路径
    - 选项:
        - `-dir` (`string`, 默认值: `theme`): 输出文件夹
        - `-theme`, `t` (`string`): 覆盖文件中设定的主题