---
layout: doc
outline: [2, 3]
---

# 元素与样式隔离

> 基于 micro-app 1.0（RC） · 核于 2026-07

## 速查

- 因为默认**不用 Shadow DOM**，micro-app 的隔离要**自己实现两件事**：**元素隔离**（DOM 作用域）与**样式隔离**（scopedcss）——CSS 隔离四路通论见[核心机制·样式隔离](../../mfe-mechanisms/guide-line/css-isolation)
- **元素隔离**：子应用的 `document.querySelector` 等**只能查到 <code v-pre>&lt;micro-app&gt;</code> 边界内**自己的元素，查不到主应用或别的子应用的元素——「模拟 ShadowDOM」的效果，但不是真 Shadow DOM
- **主子不对称**：**主应用能访问子应用元素**（主应用统筹全局），**子应用不能访问主应用元素**——这与真 Shadow DOM 的双向封闭不同
- **逃逸口 `removeDomScope`**：`removeDomScope(true)` 解绑作用域（DOM 操作转向主应用）、`removeDomScope(false)` 恢复；子应用用 `window.microApp.removeDomScope()`
- **样式隔离（scopedcss，默认开）**：把子应用 CSS 选择器**改写加前缀** `micro-app[name=xxx]`，例如 `.test{}` → `micro-app[name=xxx] .test{}`，圈进容器
- **关键局限**：scopedcss 只约束**子应用的样式**——**主应用的全局样式仍会下渗影响子应用**，靠命名规范 / CSS Modules 化解
- **关样式隔离 4 级**：全局 `disableScopecss`、单应用 `disable-scopecss` 属性、文件级 `/*! scopecss-disable */ … /*! scopecss-enable */`、行级 `/*! scopecss-disable-next-line */`；选择器级 `/*! scopecss-disable .a, .b */`
- 隔离注释须以 **`/*!`** 开头（`!` 让压缩器 cssnano 的 `discardComments` 保留它）
- **`shadowDOM` 可选**：想要更彻底的样式封闭可开 Shadow DOM，但有兼容/第三方弹窗逃逸等代价，非默认
- 本页只讲 micro-app 的**元素 + 样式隔离**；JS 沙箱见 [with 沙箱](./with-sandbox)/[iframe 沙箱模式](./iframe-sandbox-mode)

## 一、边界：本页讲什么

CSS 隔离的**四路通论**（Shadow DOM / scoped 属性前缀改写 / CSS Modules / 运行时命名空间）与各自取舍，已在[核心机制·样式隔离](../../mfe-mechanisms/guide-line/css-isolation)讲透。micro-app 走的是**「属性前缀改写」这一路**（scopedcss）。本页只讲：micro-app 因为默认不套 Shadow DOM，**它的元素隔离与样式隔离具体怎么落地、怎么关、怎么处理和主应用的样式冲突**。

## 二、元素隔离：DOM 查询被圈进 <code v-pre>&lt;micro-app&gt;</code> 边界

micro-app 默认不套 Shadow DOM，但要达到「子应用别乱碰别人 DOM」的效果，它做了**元素隔离**——**代理子应用里的 DOM 查询/操作方法，把作用域限定在 <code v-pre>&lt;micro-app&gt;</code> 元素这棵子树内**：

```js
// 子应用里执行（micro-app 已代理了 document 查询方法）
document.querySelector("#root"); // 只在 micro-app 边界内找，找不到主应用的 #root
document.getElementById("app"); // 同理，作用域被限定在自己这棵树
```

官方定义：**「元素不会逃离 <code v-pre>&lt;micro-app&gt;</code> 元素边界，子应用只能对自身的元素进行增、删、改、查」**——效果像 ShadowDOM，但实现是「代理查询」而非真影子树。有一处**关键不对称**要记牢：

- **子应用 → 主应用：不可见**。子应用的查询被圈在自己边界内，碰不到主应用元素。
- **主应用 → 子应用：可见**。因为「主应用拥有统筹全局的作用」，主应用可以正常查到、操作子应用 <code v-pre>&lt;micro-app&gt;</code> 内部的元素。

**逃逸口 `removeDomScope`**：当你**确实需要**让 DOM 操作临时指向主应用（比如子应用要往 `document.body` 挂一个真正全局的弹层），用它临时解绑作用域：

```js
// 主应用
import { removeDomScope } from "@micro-zoe/micro-app";
removeDomScope(true); // 解绑元素作用域，后续 DOM 操作指向主应用
// …执行需要作用于主应用的 DOM 操作…
removeDomScope(false); // 恢复绑定
```

```js
// 子应用侧等价 API
window.microApp.removeDomScope(true); // 解绑
window.microApp.removeDomScope(false); // 恢复
```

> **坑**：由于作用域的绑定/解绑是异步管理的，偶尔会出现「主应用创建的元素被错误插入到子应用 <code v-pre>&lt;micro-app&gt;</code> 内部」。遇到这类元素错位，通常就是要在恰当时机显式 `removeDomScope` 来纠正指向。

## 三、样式隔离：scopedcss 前缀改写

样式隔离默认开启，机制是**把子应用的每条 CSS 选择器改写、加上 <code v-pre>&lt;micro-app&gt;</code> 的属性前缀**，让它只在本容器内生效：

```css
/* 子应用原始 CSS */
.test {
  color: red;
}

/* micro-app 改写后（xxx 为子应用 name） */
micro-app[name="xxx"] .test {
  color: red;
}
```

于是子应用的 `.test` 只会命中 <code v-pre>&lt;micro-app name="xxx"&gt;</code> 内部的元素，不会污染主应用或别的子应用。这就是[通论](../../mfe-mechanisms/guide-line/css-isolation)里说的「**运行时给选择器加作用域前缀**」路线在 micro-app 里的落地——和 [qiankun](../../qiankun/guide-line/style-isolation) 的 `experimentalStyleIsolation`（`div[data-qiankun]` 前缀）思路一致，只是前缀选择器不同。

## 四、关样式隔离：四级粒度

有时你**不想要**隔离（比如子应用要往主应用挂全局样式、或隔离改写破坏了某些选择器）。micro-app 提供**四级关闭**，从粗到细：

```js
// ① 全局关闭：所有子应用都不做样式隔离
microApp.start({ disableScopecss: true });
```

```html
<!-- ② 单应用关闭：只这个子应用不隔离 -->
micro-app name="xx" url="xx" disable-scopecss/micro-app
```

```css
/* ③ 文件级/区间关闭：这段之间的样式不被改写 */
/*! scopecss-disable */
.test {
  color: red;
}
/*! scopecss-enable */

/* 也可只对指定选择器关闭 */
/*! scopecss-disable .test1, .test2 */
```

```css
/* ④ 行级关闭：只放行紧接的下一行 */
/*! scopecss-disable-next-line */
.test1 {
  color: red;
}
```

**务必注意注释写法**：控制注释必须以 **`/*!`** 开头（带感叹号）。因为构建压缩（cssnano 的 `discardComments`）默认会删掉普通 `/* */` 注释，只有 `/*!` 这类「重要注释」会被保留——否则你的隔离开关在生产构建里就没了。

## 五、shadowDOM：可选的更强样式隔离

如果 scopedcss 前缀改写还不够（例如需要彻底封闭、连主应用样式都别下渗），micro-app 允许**可选启用真 Shadow DOM**：

```html
<!-- 可选：用 Shadow DOM 承载子应用，样式随影子树天然隔离 -->
micro-app name="xx" url="xx" shadowDOM/micro-app
```

开了 `shadowDOM` 后，子应用渲染进真正的 `shadowRoot`，样式获得 Shadow DOM 级别的封闭。但它**不是默认**，因为代价不小：部分第三方 UI 库/弹窗依赖挂到 `document.body`，进了 Shadow DOM 会**逃逸受限、定位错乱**；一些依赖全局选择器的样式方案也会失效。**默认的 scopedcss 是更普适的折中**，`shadowDOM` 是「明确需要强封闭且能接受其副作用」时才开。

## 六、和主应用样式冲突怎么办

这是 micro-app 样式隔离**最需要认清的边界**——官方原话：**「主应用的样式依然会对子应用产生影响」**。原因很直接：scopedcss 只改写了**子应用的样式**（给它加前缀圈住），但它**管不到主应用**——主应用的全局样式（尤其是 `*`、标签选择器、`body`/`a`/`h1` 这类）会照常下渗到 <code v-pre>&lt;micro-app&gt;</code> 内部的子应用元素上。

实用对策：

- **主应用侧收敛全局样式**：少写裸标签选择器和 `*` 通配，全局样式尽量加类名/命名空间约束，别让它「漏」进子应用。
- **子应用侧用 CSS Modules / 命名约定**：子应用自己的类名做模块化或加前缀，降低与主应用类名撞车的概率。
- **确需强封闭**：对样式冲突特别敏感的子应用，再考虑 `shadowDOM`（接受其弹窗逃逸等代价）。

一句话：micro-app 的默认样式隔离是**「圈住子应用、但挡不住主应用下渗」的单向隔离**，这与真 Shadow DOM 的双向封闭有本质区别，工程上靠主应用样式收敛 + 子应用模块化来补。

## 小结

因为默认不套 Shadow DOM，micro-app 自己实现了**元素隔离**（代理 DOM 查询、圈进 <code v-pre>&lt;micro-app&gt;</code> 边界，主可访子、子不可访主，逃逸用 `removeDomScope`）与**样式隔离**（scopedcss 给子应用选择器加 `micro-app[name=xxx]` 前缀）。样式隔离可四级关闭（注释须 `/*!` 开头以躲过压缩），`shadowDOM` 是可选的更强封闭但有弹窗逃逸代价；最需认清的边界是**主应用全局样式仍会下渗子应用**，靠主应用样式收敛 + 子应用 CSS Modules 化解。三件隔离（JS 沙箱 / 元素 / 样式）都讲完了，接下来看主子应用之间怎么互通有无——下一页 [数据通信](./data-communication)。
