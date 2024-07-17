---
layout: doc
outline: [2, 3]
---

# 基础

## markdown 扩展

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
