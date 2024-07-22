---
layout: doc
outline: [2, 3]
---

# 基础

## 速查

- 自定义锚点：`# 使用自定义锚点 {#my-anchor}`
- 链接：`[foo heading](./#heading)`
- Emoji：`:tada:` `:100:`
- 容器：`::: info` `:::` `::: tip` `:::` `::: warning` `:::` `::: danger` `:::`
- 折叠容器 + 自定义标题： `::: details 点我查看代码` `:::`
- 代码块：` ```js ``` `
- 代码块聚焦：`{5-8}`
- 代码块高亮：`[!code focus]`
- 代码块增删：`[!code ++]` `[!code --]`
- 代码块警告：`[!code error]` `[!code warning]`
- 代码块行号：`:line-numbers`
- 导入代码片段：`<<< @/snippets/snippet.js`
- 代码块标签页：`::: code-group` `:::`
- 导入 markdown 文件片段：`<!--@include: ./parts/basics.md{3,}-->`
- 数学方程：需要安装 `markdown-it-mathjax3`
- 引用图片：`![An image](./assets/logo.png)`
- frontmatter： `{{ $frontmatter.title }}` `useData()`
- 在MD中使用Vue： 和 SFC 一致，但是不用写 `<template>`

## markdown 扩展

不要在 markdown 中写与 Vue 模板语法冲突的表达式，比如`{}`和`<>`一定要用模板字符串形式，否则会被识别为 Vue 插值语法或者标签。

### 锚点

插件：[markdown-it-anchor](https://github.com/valeriangalliat/markdown-it-anchor/blob/master/README-zh_CN.md)

配置：[VuePress](https://vuepress.vuejs.org/zh/reference/config.html#markdown-anchor)

#### 自定义锚点

用于修改地址栏锚点文本

```
# 使用自定义锚点 {#my-anchor}
```

### 链接

```md
[Home](/) <!-- 将用户导航至根目录下的 index.html -->
[foo](/foo/) <!-- 将用户导航至目录 foo 下的 index.html -->
[foo heading](./#heading) <!-- 将用户锚定到目录 foo 下的index文件中的一个标题上 -->
[bar - three](../bar/three) <!-- 可以省略扩展名 -->
[bar - three](../bar/three.md) <!-- 可以添加 .md -->
[bar - four](../bar/four.html) <!-- 或者可以添加 .html -->
```

### frontmatter

用来做配置的，配置站点，页面，主题等。yaml 语法。

插件：[@mdit-vue/plugin-frontmatter](https://github.com/mdit-vue/mdit-vue/tree/main/packages/plugin-frontmatter)

### 表格

```md
| Tables        |      Are      |  Cool |
| ------------- | :-----------: | ----: |
| col 3 is      | right-aligned | $1600 |
| col 2 is      |   centered    |   $12 |
| zebra stripes |   are neat    |    $1 |
```

| Tables        |      Are      |  Cool |
| ------------- | :-----------: | ----: |
| col 3 is      | right-aligned | $1600 |
| col 2 is      |   centered    |   $12 |
| zebra stripes |   are neat    |    $1 |

### Emoji

插件：[markdown-it-emoji](https://github.com/markdown-it/markdown-it-emoji)

```
:tada: :100:
```

:tada: :100:

### 目录表

插件：[@mdit-vue/plugin-toc](https://github.com/mdit-vue/mdit-vue/tree/main/packages/plugin-toc)

```md
[[toc]]
```

和默认模板右侧浮动目录效果一样，意义不大。

### 自定义容器

不同颜色的文本块

插件：[markdown-it-container](https://github.com/markdown-it/markdown-it-container)

```md
::: info
This is an info box.
:::

::: tip
This is a tip.
:::

::: warning
This is a warning.
:::

::: danger
This is a dangerous warning.
:::

::: details
This is a details block.
:::
```

::: info
This is an info box.
:::

::: tip
This is a tip.
:::

::: warning
This is a warning.
:::

::: danger
This is a dangerous warning.
:::

::: details
This is a details block.
:::

#### 自定义容器标题

````md
::: danger STOP
危险区域，请勿继续
:::

::: details 点我查看代码

```js
console.log("Hello, VitePress!");
```

:::
````

::: danger STOP
危险区域，请勿继续
:::

::: details 点我查看代码

```js
console.log("Hello, VitePress!");
```

:::

#### 自定义容器的另一种写法

```md
> [!NOTE]
> 强调用户在快速浏览文档时也不应忽略的重要信息。

> [!TIP]
> 有助于用户更顺利达成目标的建议性信息。

> [!IMPORTANT]
> 对用户达成目标至关重要的信息。

> [!WARNING]
> 因为可能存在风险，所以需要用户立即关注的关键内容。

> [!CAUTION]
> 行为可能带来的负面影响。
```

> [!NOTE]
> 强调用户在快速浏览文档时也不应忽略的重要信息。

> [!TIP]
> 有助于用户更顺利达成目标的建议性信息。

> [!IMPORTANT]
> 对用户达成目标至关重要的信息。

> [!WARNING]
> 因为可能存在风险，所以需要用户立即关注的关键内容。

> [!CAUTION]
> 行为可能带来的负面影响。

### 代码块

插件：[shiki](https://github.com/shikijs/shiki)

````md
```js
console.log("Hello, VitePress!");
```
````

```js
console.log("Hello, VitePress!");
```

#### 在代码块嵌套

如果存在嵌套关系请增加 `` ` `` 的数量。

`````md
````md
```js{4}
export default {
  data () {
    return {
      msg: 'Highlighted!'
    }
  }
}
```
````
`````

#### 行高亮

````md
```js{4}
export default {
  data () {
    return {
      msg: 'Highlighted!'
    }
  }
}
```
````

```js{4}
export default {
  data () {
    return {
      msg: 'Highlighted!'
    }
  }
}
```

- 多行：例如 `{5-8}`、`{3-10}`、`{10-17}`
- 多个单行：例如 `{4,7,9}`
- 多行与单行：例如 `{4,7-13,16,23-27,40}`

> [!TIP]
> 也可以使用 // [!code highlight] 注释实现行高亮。

#### 聚焦

使用 `// [!code focus]` 或 `// [!code focus:<lines>]`

````
```js
export default {
  data () {
    return {
      msg: 'Focused!' // [!!code focus]
    }
  }
}
```
````

```js
export default {
  data() {
    return {
      msg: "Focused!", // [!code focus]
    };
  },
};
```

#### 添加删除行

````
```js
export default {
  data () {
    return {
      msg: 'Removed' // [!!code --]
      msg: 'Added' // [!!code ++]
    }
  }
}
```
````

```js
export default {
  data () {
    return {
      msg: 'Removed' // [!code --]
      msg: 'Added' // [!code ++]
    }
  }
}
```

#### 高亮错误和警告

````
```js
export default {
  data () {
    return {
      msg: 'Error', // [!!code error]
      msg: 'Warning' // [!!code warning]
    }
  }
}
```
````

```js
export default {
  data() {
    return {
      msg: "Error", // [!code error]
      msg: "Warning", // [!code warning]
    };
  },
};
```

#### 显示行号

从配置文件开启全局行号

```js
export default {
  markdown: {
    lineNumbers: true,
  },
};
```

````
```ts
// 默认禁用行号
const line2 = 'This is line 2'
const line3 = 'This is line 3'
```

```ts:line-numbers
// 启用行号
const line2 = 'This is line 2'
const line3 = 'This is line 3'
```

```ts:line-numbers=2
// 行号已启用，并从 2 开始
const line3 = 'This is line 3'
const line4 = 'This is line 4'
```
````

```ts
// 默认禁用行号
const line2 = "This is line 2";
const line3 = "This is line 3";
```

```ts:line-numbers
// 启用行号
const line2 = 'This is line 2'
const line3 = 'This is line 3'
```

```ts:line-numbers=2
// 行号已启用，并从 2 开始
const line3 = 'This is line 3'
const line4 = 'This is line 4'
```

#### 从文件导入代码片段

导入语法

```md
<<< @/filepath
```

导入并行高亮

```md
<<< @/snippets/snippet.js{2}
```

导入代码片段

```md
<<< @/snippets/snippet-with-region.js#snippet
```

需要在源文件注释代码片段

```js
// #region snippet
function foo() {
  // ..
}
// #endregion snippet

export default foo;
```

导入结果

```js
function foo() {
  // ..
}
```

指定语言

```md
<<< @/snippets/snippet.cs{c#}
```

混合使用

```md
<<< @/snippets/snippet.cs{1,2,4-6 c#:line-numbers}
```

### 代码块标签页

````
::: code-group

```js [config.js]
/**
 * @type {import('vitepress').UserConfig}
 */
const config = {
  // ...
}

export default config
```

```ts [config.ts]
import type { UserConfig } from 'vitepress'

const config: UserConfig = {
  // ...
}

export default config
```

:::
````

::: code-group

```js [config.js]
/**
 * @type {import('vitepress').UserConfig}
 */
const config = {
  // ...
};

export default config;
```

```ts [config.ts]
import type { UserConfig } from "vitepress";

const config: UserConfig = {
  // ...
};

export default config;
```

:::

### 导入 markdown 文件片段

```md
# Docs

## Basics

<!--@include: ./parts/basics.md-->
```

指定行号

```md
# Docs

## Basics

<!--@include: ./parts/basics.md{3,}-->
```

行号语法： `{3,}`、 `{,10}`、`{1,10}`

### 数学方程

插件：[markdown-it-mathjax3](https://github.com/tani/markdown-it-mathjax3)

#### 安装依赖

```sh
npm add -D markdown-it-mathjax3
```

#### 配置

```js
export default {
  markdown: {
    math: true,
  },
};
```

### 图片懒加载

```js
export default {
  markdown: {
    image: {
      // 默认禁用图片懒加载
      lazyLoading: true,
    },
  },
};
```

## 资源处理

### 引用静态资源

推荐使用相对路径引用资源

```md
![An image](./assets/logo.png)
```

### public 目录

`public` 目录中的文件会被直接复制到输出目录中。引用 `public` 中的文件请直接使用绝对路径。

例如，`public/icon.png` 应始终在源代码中使用 `/icon.png` 引用。

### 根 URL

为了配合部署，可以通过 `.vitepress/config.js` 中设置 `base` 选项修改 `根URL`。

`public` 中的资源的绝对引用无需修改。

## frontmatter

插件：YAML 解析器 [gray-matter](https://github.com/jonschlinkert/gray-matter)

### 用法

写在 markdown 文件顶部

```yaml
---
title: Docs with VitePress
editLink: true
---
```

### 访问 frontmatter 数据

md 中

```md
---
title: Docs with VitePress
editLink: true
---

# {{ $frontmatter.title }}

Guide content
```

`<script setup>` 中

```js
useData();
```

## 在 Markdown 使用 Vue

### 模板化

支持

```md
{{ 1 + 1 }}
```

```html
<span v-for="i in 3">{{ i }}</span>
```

### `<script>` 和 `<style>`

```md
---
hello: world
---

<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

## Markdown Content

The count is: {{ count }}

<button :class="$style.button" @click="count++">Increment</button>

<style module>
.button {
  color: red;
  font-weight: bold;
}
</style>
```

### 使用组件

```md
<script setup>
  import CustomComponent from '../../components/CustomComponent.vue'
</script>

<CustomComponent />
```
