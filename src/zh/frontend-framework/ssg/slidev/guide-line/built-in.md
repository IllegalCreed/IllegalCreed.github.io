---
layout: doc
outline: [2, 4]
---

# 内置

## 速查

- 组件
    - 箭头：`<Arrow />`
    - 可拖拽箭头：`<VDragArrow />`
    - 自动适应文本：`<AutoFitText />`
    - 根据主题切换：`<LightOrDark />`
    - 链接：`<Link />`
    - 根据上下文渲染：`<RenderWhen />`
    - 幻灯片编号：`<SlideCurrentNo />`
    - 幻灯片总数：`<SlidesTotal  />`
    - 幻灯片标题：`<TitleRenderer no="1" />`
    - 目录：`<Toc />`
    - 缩放组件：`<Transform />`
    - 动画相关组件：`<v-click />` | `<v-after />` | `<v-clicks />` | `<v-switch>`
    - 可拖动组件：`<v-drag />`
    - 视频：`<SlidevVideo />`
- 布局
    - 居中：`center`
    - 封面：`cover`
    - 封底：`end`
    - 左图：`image-left`
    - 右图：`image-right`
    - 两栏：`two-cols`
    - 带标题的两栏：`two-cols-header`

## 内置组件

### Arrow

```markdown
<Arrow x1="10" y1="20" x2="100" y2="200" />
<!--or-->
<Arrow v-bind="{ x1:10, y1:10, x2:200, y2:200 }" />
```

**参数：**

- `x1` (`string | number`, 必要值): 起始 x 位置
- `y1` (`string | number`, 必要值): 起始 y 位置
- `x2` (`string | number`, 必要值): 终点 x 位置
- `y2` (`string | number`, 必要值): 终点 y 位置
- `width` (`string | number`, 默认为: `2`): 线宽
- `color` (`string`, 默认为: `'currentColor'`): 颜色
- `two-way` (`boolean`, 默认为: `false`): 是否为双向箭头

### VDragArrow

类似 `Arrow` 组件，但可以拖动

```markdown
<v-drag-arrow />
```

### AutoFitText

字体大小会自动适应内容的方框。类似于 PowerPoint 或 Keynote 的文本框。

```markdown
<AutoFitText :max="200" :min="100" modelValue="Some text"/>
```

**参数:**

- `max` (`string | number`, 默认为: `100`): 最大字体大小
- `min` (`string | number`, 默认为: `30`): 最小字体大小
- `modelValue` (`string`, 默认为: `''`): 文本内容

### LightOrDark

配合主题色控制内部元素显隐

```markdown
<LightOrDark>
  <template #dark>正在使用暗色主题</template>
  <template #light>正在使用亮色主题</template>
</LightOrDark>
```

访问组件 props

```markdown
<LightOrDark width="100" alt="some image">
  <template #dark="props">
    <img src="/dark.png" v-bind="props"/>
  </template>
  <template #light="props">
    <img src="/light.png" v-bind="props"/>
  </template>
</LightOrDark>
```

结合 markdown

```markdown
<LightOrDark>
  <template #dark>

![dark](/dark.png)

  </template>
  <template #light>

![light](/light.png)

  </template>
</LightOrDark>
```

### Link

插入一个链接，你可以用它来导航到一个指定的幻灯片

```markdown
<Link to="42">跳转到第 42 张 slide</Link>
<Link to="42" title="Go to slide 42"/>
<Link to="solutions" title="Go to solutions"/>
```

**参数：**

- `to` (`string | number`): 导航到的幻灯片的路径 (幻灯片从 `1` 开始计数)
- `title` (`string`): 要显示的标题

```markdown
---
routeAlias: solutions
---

# 现在来些解决方案！
```

### PoweredBySlidev

可以用来致敬 Slidev

### RenderWhen

插槽仅在上下文满足条件时（如处于演示者视图中时）才会渲染。

```markdown
<RenderWhen context="presenter">这只会在演讲者视图中显示。</RenderWhen>
```

**参数：**

- `context` (`Context | Context[]`): 要求的渲染上下文或渲染上下文数组
    - `'main'`: 在幻灯片和演示者视图中渲染（相当于 ['slide', 'presenter']）,
    - `'visible'`: 如果当前可见则渲染
    - `'print'`: 在打印模式下渲染
    - `'slide'`: 在普通播放模式中渲染
    - `'overview'`: 在概览中渲染
    - `'presenter'`: 在演示者视图中渲染
    - `'previewNext'`: 在演示者的下一张幻灯片视图中渲染

**插槽：**

- `#default`: 在 context 符合时显示
- `#fallback`: 在 context 不符合时显示

### SlideCurrentNo

当前幻灯片编号。

```markdown
<SlideCurrentNo />
```

### SlidesTotal

幻灯片总数。

```markdown
<SlidesTotal />
```

### TitleRenderer

使用 frontmatter 设置标题

```yaml
---
title: 一个令人惊叹的标题
level: 2
---
```

用法

```jsx
import TitleRenderer from '#slidev/title-renderer'

<TitleRenderer no="42" />
```

**参数：**

- `no` (`string | number`): 显示标题的幻灯片编号（幻灯片从 `1` 开始）

### Toc

插入目录

```jsx
<Toc />
```

**参数：**

- `columns` (`string | number`, 默认为: `1`): 显示的列数
- `listClass` (`string | string[]`, 默认为: `''`): 应用于目录列表的类
- `maxDepth` (`string | number`, 默认为: `Infinity`): 要显示的标题的最大深度级别
- `minDepth` (`string | number`, 默认为: `1`): 要显示的标题的最小深度级别
- `mode` (`'all' | 'onlyCurrentTree'| 'onlySiblings'`, 默认为: `'all'`):
    - `'all'`: 显示所有项目
    - `'onlyCurrentTree'`: 仅显示当前树中的项目（活动项目、活动项目的父项和子项）
    - `'onlySiblings'`: 仅显示当前树中的项目及其直系同级项目

如果不想让一张幻灯片出现在 `<Toc>` 组件中

```jsx
---
hideInToc: true
---
```

### Transform

为元素应用缩放变换。

```markdown
<Transform :scale="0.5">
  <YourElements />
</Transform>
```

**参数：**

- `scale` (`number | string`, 默认为 `1`): 大小比例
- `origin` (`string`, 默认为 `'top left'`): 原点位置

### Tweet

嵌入一条推文。

```markdown
<Tweet id="20" />
```

**参数：**

- `id` (`number | string`, 必要值): 推文 id
- `scale` (`number | string`, 默认为: `1`): 大小比例
- `conversation` (`string`, 默认为: `'none'`): [**推文内嵌参数**](https://developer.twitter.com/en/docs/twitter-for-websites/embedded-tweets/guides/embedded-tweet-parameter-reference)
- `cards` (`'hidden' | 'visible'`, 默认为: `'visible'`): [**推文内嵌参数**](https://developer.twitter.com/en/docs/twitter-for-websites/embedded-tweets/guides/embedded-tweet-parameter-reference)

### 动画相关组件

#### VClick

```markdown
<v-click> Hello World! </v-click>
```

#### VAfter

```markdown
<div v-click> Hello </div>
<div v-after> World </div>  <!-- 或 <v-after> World </v-after> -->
```
#### VClicks

```markdown
<v-clicks depth="2">

- Item 1
  - Item 1.1
  - Item 1.2
- Item 2
  - Item 2.1
  - Item 2.2

</v-clicks>
```

#### VSwitch

根据点击动画切换显示的插槽。

```markdown
<v-switch>
  <template #1> 在第 1 步动画显示 </template>
  <template #2> 在第 2,3,4 步动画显示 </template>
  <template #5-7>  在第 5,6 步动画显示 </template>
</v-switch>
```

- 当 `unmount` 属性设置为 `true` 时，切换到下一个插槽时，上一个插槽的内容将被卸载。默认为 `false`。
- 使用 `tag` 和 `childTag` 属性来更改组件及其子元素的默认标签。默认为 `div`。
- 使用 `transition` 属性来更改过渡效果。默认为 `false`（禁用）。

### VDrag

可拖动组件

```markdown
---
dragPos:
  square: Left,Top,Width,Height,Rotate
---

<img v-drag="'square'" src="https://sli.dev/logo.png">
```

### SlidevVideo

嵌入视频

```markdown
<SlidevVideo v-click autoplay controls>
  <!-- 可以加入 HTML video 元素中能包含的任何内容。 -->
  <source src="/myMovie.mp4" type="video/mp4" />
  <source src="/myMovie.webm" type="video/webm" />
  <p>
    你的浏览器不支持播放该视频，请点击
    <a href="/myMovie.mp4">此处</a>
    下载。
  </p>
</SlidevVideo>
```

**参数：**

- `controls` (`boolean`, 默认为 `false`): 显示视频控件
- `autoplay` (`boolean | 'once'`, 默认为 `false`):
    - `true` 或 `'once'`: 仅播放一次视频，结束或暂停后不会重新开始
    - `false`: 从不自动播放视频（依赖于 `controls`）
- `autoreset` (`'slide' | 'click'`, 默认为 `undefined`):
    - `'slide'`: 返回到幻灯片时重新开始视频
    - `'click'`: 返回到组件的点击轮次时重新开始视频
- `poster` (`string | undefined`, 默认为 `undefined`):
    - 视频未播放时显示的图像源。
- `printPoster` (`string | undefined`, 默认为 `undefined`):
    - 打印时 `poster` 的覆盖。
- `timestamp` (`string | number`, 默认为 `0`):
    - 视频的开始时间（秒）。
- `printTimestamp` (`string | number | 'last' | undefined`, 默认为 `undefined`):
    - 打印时 `timestamp` 的覆盖。

### Youtube

嵌入 YouTube 视频。

```markdown
<Youtube id="luoMHjh-XcQ" />
```

**参数：**

- `id` (`string`, 必要值): YouTube 视频 id
- `width` (`number`): 视频宽度
- `height` (`number`): 视频高度

你还可以在 id 值中添加 `?start=1234`（其中 1234 为秒）来让视频在特定时间开始播放。

## 内置布局

### center

在屏幕中间展示内容。

```markdown
<template>
  <div class="slidev-layout center h-full grid place-content-center">
    <div class="my-auto">
      <slot />
    </div>
  </div>
</template>
```

```css
.slidev-layout {
  @apply px-14 py-10 text-[1.1rem] h-full;

  pre,
  code {
    @apply select-text;
  }

  code {
    @apply font-mono;
  }

  h1 {
    @apply text-4xl mb-4;
  }

  h2 {
    @apply text-3xl;
  }

  h3 {
    @apply text-2xl;
  }

  h4 {
    @apply text-xl;
  }

  h5 {
    @apply text-base;
  }

  h6 {
    @apply text-sm pt-1 uppercase tracking-widest font-500;
  }

  h6:not(.opacity-100) {
    @apply opacity-40;
  }

  p {
    @apply my-4 leading-6;
  }

  ul {
    list-style: square;
  }

  ol {
    list-style: decimal;
  }

  li {
    @apply leading-1.8em;
  }

  blockquote {
    background: var(--slidev-code-background);
    color: var(--slidev-code-foreground);
    @apply text-sm px-2 py-1 border-primary border-l rounded;
  }

  blockquote > * {
    @apply my-0;
  }

  table {
    @apply w-full;
  }

  tr {
    @apply border-b border-main;
  }

  th {
    @apply text-left font-400;
  }

  a {
    @apply border-current border-b border-dashed hover:text-primary hover:border-solid;
  }

  td,
  th {
    @apply p-2 py-3;
  }

  b,
  strong {
    @apply font-600;
  }

  kbd {
    @apply border border-main border-b-2 rounded;
    @apply bg-gray-400 bg-opacity-5 py-0.5 px-1 text-xs font-mono;
  }
}
```

### cover

用来展示演讲稿的封面页，可以包含演讲的标题、演讲者、时间等。

```markdown
<template>
  <div class="slidev-layout cover">
    <slot />
  </div>
</template>
```

```css
.slidev-layout.cover,
.slidev-layout.intro {
  @apply h-full grid;

  h1 {
    @apply text-6xl leading-20;
  }

  h1 + p {
    @apply -mt-2 opacity-50 mb-4;
  }

  p + h2,
  ul + h2,
  table + h2 {
    @apply mt-10;
  }
}
```

### default

最基础的布局，用于展示任意类型的内容。

```markdown
<template>
  <div class="slidev-layout default">
    <slot />
  </div>
</template>
```

### end

最后一页

```markdown
<template>
  <div class="slidev-layout end">
    <slot>END</slot>
  </div>
</template>

<style scoped lang="postcss">
.slidev-layout.end {
  @apply text-white text-opacity-85 text-xl tracking-widest bg-black h-full text-center grid place-content-center select-none;
}
</style>
```

### fact

用来在屏幕上突出展示很多事实或数据。

```markdown
<template>
  <div class="slidev-layout fact">
    <div class="my-auto">
      <slot />
    </div>
  </div>
</template>
```

```css
.slidev-layout.fact {
  @apply text-center grid h-full;
  h1 {
    @apply text-8xl font-700;
  }
  h1 + p {
    @apply font-700 text-2xl;
  }
}
```

### full

使用屏幕全部空间来展示内容。

```markdown
<template>
  <div class="slidev-layout full w-full h-full">
    <slot class="w-full h-full" />
  </div>
</template>
```

### image-left

在屏幕左侧展示图片，屏幕右侧展示内容。

```yaml
---
layout: image-left

# the image source
image: /path/to/the/image

# a custom class name to the content
class: my-cool-content-on-the-right
---
```

```yaml
---
layout: image-left

image: /path/to/the/image 

backgroundSize: 20em 70%
---
```

### image-right

```yaml
---
layout: image-right

# the image source
image: /path/to/the/image

# a custom class name to the content
class: my-cool-content-on-the-left
---
```

### image

```yaml
---
layout: image

# the image source
image: /path/to/the/image

backgroundSize: contain
---
```

### iframe-left

在屏幕左侧通过 `<iframe>` 元素显示网页，内容将位于右侧。

```yaml
---
layout: iframe-left

# the web page source
url: https://github.com/slidevjs/slidev

# a custom class name to the content
class: my-cool-content-on-the-right
---
```

### iframe-right

```yaml
---
layout: iframe-right

# the web page source
url: https://github.com/slidevjs/slidev

# a custom class name to the content
class: my-cool-content-on-the-left
---
```

### iframe

```yaml
---
layout: iframe

# the web page source
url: https://github.com/slidevjs/slidev
---
```

### intro

介绍演讲稿，通常带有演讲稿标题、简述、作者等信息。

```markdown
<template>
  <div class="slidev-layout intro">
    <slot />
  </div>
</template>
```

据我所知应该和 `cover` 布局一样

### none

没有任何样式的布局。

```markdown
<template>
  <div>
    <slot />
  </div>
</template>
```

### quote

突出显示引文。

```markdown
<template>
  <div class="slidev-layout quote">
    <div class="my-auto">
      <slot />
    </div>
  </div>
</template>
```

```css
.slidev-layout.quote {
  @apply grid h-full;

  h1 + p {
    @apply mt-2;
  }
}
```

### section

用来标记演讲稿的新部分的开始。

```markdown
<template>
  <div class="slidev-layout section">
    <slot />
  </div>
</template>
```

```css
.slidev-layout.section {
  h1 {
    @apply text-6xl font-500 leading-20;
  }
}
```

### statement

将主张/声明作为主要页面内容。

```markdown
<template>
  <div class="slidev-layout statement">
    <div class="my-auto">
      <slot />
    </div>
  </div>
</template>
```

```css
.slidev-layout.statement {
  @apply text-center grid h-full;

  h1 {
    @apply text-6xl font-700;
  }
}
```

### two-cols

将页面内容分为两列。

```markdown
---
layout: two-cols
---

# Left

This shows on the left

::right::

# Right

This shows on the right
```

### two-cols-header

将页面内容分为两列，上方和下方的内容分开，第二行将左右两列分开。

```markdown
---
layout: two-cols-header
---

This spans both

::left::

# Left

This shows on the left

::right::

# Right

This shows on the right
```