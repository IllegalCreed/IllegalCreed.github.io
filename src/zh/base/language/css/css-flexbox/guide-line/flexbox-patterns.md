---
layout: doc
outline: [2, 3]
---

# Flexbox 实战模式

> 基于 CSS 现代标准 · 核于 2026-06

## 速查

- **圣杯 / 粘性页脚**：`body { min-height: 100vh; display: flex; flex-direction: column }` + 主区 `flex: 1`，页脚自动沉底
- **三栏圣杯**：容器 `display: flex`，两侧 `flex: 0 0 <宽>` 锁死，中栏 `flex: 1` 自适应
- **等高列**：靠 `align-items: stretch`（默认）天然实现，前提是列上别设固定高度
- **自适应导航**：`display: flex; align-items: center; gap`，用 `margin-left: auto` 把右侧操作推开
- **媒体对象**（头像 + 文字）：容器 `display: flex; gap`，图 `flex: none` 锁尺寸，文字区 `flex: 1` + `min-width: 0`
- 通用避坑：文字 / 长内容溢出就给该弹性项 `min-width: 0`；不能被压扁的元素给 `flex: none`
- 间距一律用 `gap`，单项推开用 `margin: auto`，等分用 `flex: 1`

把前五页的属性组合起来，就是日常 UI 里反复出现的几套布局。下面每个模式都给出可直接抄用的最小实现，并标注关键行。

## 模式一：圣杯布局 + 粘性页脚

「页头 + 自适应主区 + 永远沉底的页脚」是网页最经典的整体骨架。让 `body` 成为纵向 Flex 容器，主区 `flex: 1` 撑开剩余高度，页脚自然被挤到底部——内容再短也不会浮在半空：

```html
<body>
  <header>页头</header>
  <main>主内容（高度自适应）</main>
  <footer>页脚（永远在底部）</footer>
</body>
```

```css
body {
  min-height: 100vh; /* 至少占满一屏，才有空间可分配 */
  margin: 0;
  display: flex;
  flex-direction: column; /* 主轴变纵向，三块自上而下 */
}

main {
  flex: 1; /* = 1 1 0：吃掉页头页脚之外的全部高度 */
}
```

只要 `main` 写了 `flex: 1`，无论内容多少，`footer` 都会贴在视口底部。这是 Flexbox 取代旧 `position: fixed` 页脚方案的标准做法。

## 模式二：三栏圣杯（固定侧栏 + 自适应中栏）

经典「左导航 + 中内容 + 右侧栏」，两侧锁死宽度、中间自适应：

```html
<div class="holy-grail">
  <nav class="side">左栏</nav>
  <main class="content">中栏（自适应）</main>
  <aside class="side">右栏</aside>
</div>
```

```css
.holy-grail {
  display: flex;
  gap: 16px;
  min-height: 60vh;
}

.holy-grail .side {
  flex: 0 0 200px; /* 锁死 200px：不伸不缩 */
}

.holy-grail .content {
  flex: 1; /* 抢占中间剩余空间 */
  min-width: 0; /* 防止内部长内容把中栏顶宽、挤坏布局 */
}
```

要点：两侧用 `flex: 0 0 200px`（即 `flex-grow:0 flex-shrink:0 flex-basis:200px`）固定，中栏 `flex: 1` 弹性。给中栏补一句 `min-width: 0`，可避免里面的长文本 / 表格撑破布局（参见 flex 三值页的「子项不肯缩」）。

## 模式三：等高列

「几张并排的卡片，不管内容多少都一样高」——这是 Flexbox **默认就送**的能力，因为 `align-items` 初始值就是 `stretch`：

```css
.card-row {
  display: flex;
  gap: 16px;
  /* align-items: stretch; —— 默认值，无需写，列自动等高 */
}

.card-row > .card {
  flex: 1; /* 顺便让卡片等宽均分 */
}
```

你几乎什么都不用做，列就等高了。唯一要注意：**别给卡片设固定 `height`**，否则固定高度会覆盖 `stretch` 的拉伸，等高失效。想让某张卡片内部内容顶部对齐、按钮沉底，可在卡片内部再开一个纵向 Flex 容器，按钮用 `margin-top: auto` 推到底。

## 模式四：自适应导航栏

「左侧 Logo + 一组链接 + 右侧登录按钮」，且各元素垂直居中、登录按钮永远靠右：

```html
<nav class="navbar">
  <a class="brand" href="/">Logo</a>
  <a href="/docs">文档</a>
  <a href="/blog">博客</a>
  <button class="login">登录</button>
</nav>
```

```css
.navbar {
  display: flex;
  align-items: center; /* 所有项目垂直居中对齐 */
  gap: 20px; /* 项目之间统一间距 */
  padding: 12px 24px;
}

.navbar .login {
  margin-left: auto; /* 左外边距吃光剩余空间，把按钮推到最右 */
}
```

核心两招：`align-items: center` 解决垂直对齐，`margin-left: auto` 解决「左群 + 右单」分组——比拆容器或 `justify-content: space-between` 更灵活，因为左侧可以是任意多个元素。

## 模式五：媒体对象（头像 + 文字）

评论、通知、聊天气泡里随处可见的「左图右文」结构。图片固定尺寸不被压扁，文字区吃掉剩余宽度：

```html
<div class="media">
  <img class="media__avatar" src="avatar.png" alt="头像" />
  <div class="media__body">
    <h4>用户名</h4>
    <p>一段可能很长很长的评论文字，应当自动换行而不是把头像挤变形……</p>
  </div>
</div>
```

```css
.media {
  display: flex;
  gap: 12px;
  align-items: flex-start; /* 图与文都顶部对齐 */
}

.media__avatar {
  flex: none; /* = 0 0 auto：头像保持固有尺寸，绝不被压扁 */
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.media__body {
  flex: 1; /* 吃掉剩余宽度 */
  min-width: 0; /* 关键：允许文字区收缩，长单词 / URL 才会正常换行 */
}
```

这个模式把全叶的避坑点都用上了：图片用 `flex: none` 锁死、文字区用 `flex: 1` 自适应、再用 `min-width: 0` 解除最小尺寸下限让长文本乖乖折行。记住这三行，媒体对象就再不会「把布局挤爆」。

## 一维到此为止：何时该换 Grid

这些模式都是**一维**的——沿一条轴排列、靠换行凑出多行，但**行与行之间的列并不会对齐**（每行独立计算）。一旦需求变成「严格的二维网格：行列都要对齐、要跨行跨列」，那就该用 CSS Grid 了。Flexbox 与 Grid 是互补关系：**一行 / 一列内的分布与对齐用 Flexbox，整页的二维骨架用 Grid**，二者常常嵌套配合。

## 小结

圣杯沉底、三栏自适应、等高列、导航栏、媒体对象——这五套模式覆盖了绝大多数日常布局，背后反复用的就是 `flex: 1`（等分 / 自适应）、`flex: none`（锁死）、`align-items: stretch`（等高）、`margin: auto`（推开）、`min-width: 0`（防溢出）这几张牌。需要逐项查属性默认值与取值时，转到本叶的 [参考](../reference) 速查表。
