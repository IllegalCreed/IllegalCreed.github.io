---
layout: doc
outline: [2, 4]
---

# 参考

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