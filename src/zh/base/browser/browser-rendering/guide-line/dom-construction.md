---
layout: doc
outline: [2, 3]
---

# HTML 解析与 DOM 构建

> 基于 Chromium 现代架构 · 核于 2026-07

## 速查

- 解析链：字节流 → **tokenization**（`startTag`/`endTag`/属性等 token）→ 节点 → **DOM 树**
- **DOM 构建是增量的**：不必等 HTML 下载完，边收边解析；一个 DOM 节点始于 startTag token、终于 endTag token
- **HTML 从不报错**：容错是 HTML 规范内建设计，标签交错/漏闭合会被自动修复
- **preload scanner** 与主解析器并行，扫 token 预取 CSS/JS/字体等高优资源
- `<script>`（无 async/defer）**暂停 HTML 解析**——因为 JS 可能 `document.write()` 改写文档结构
- **CSS 不阻塞 HTML 解析，但阻塞 JS 执行**（JS 常查询样式），JS 又阻塞解析——形成连坐
- `defer`：下载不阻塞，**按序**在文档解析完后执行；`async`：下载不阻塞，**下载完立即执行**（乱序）
- `type="module"` 默认 defer 行为；`document.write` 在 async/defer/module 脚本里被禁用
- DOM 节点数越多，构建越慢，后续 CRP 每一步也越慢——精简标记是地基优化
- 关键提示：`<link rel="preload">` 声明「本次导航必需，尽快下载」

## 一、从字节到树：tokenization 与增量解析

主线程收到导航提交（commit）后开始接收 HTML 数据，把文本**解析（parse）成 DOM**——DOM 既是浏览器对页面的内部表示，也是暴露给 JS 操作的数据结构与 API。

解析分两步（MDN：「HTML parsing involves tokenization and tree construction」）：

```
字节流 ──▶ token 流 ──▶ 节点 ──▶ DOM 树
          startTag / endTag /        <html> 为根，
          属性名 / 属性值 / 文本      嵌套即父子
```

- **tokenization（词法分析）**：把字符流切成 token——开始标签、结束标签、属性名与值、文本。
- **树构建**：按 token 建节点、按嵌套挂树。一个 DOM 节点从 `startTag` token 开始、到 `endTag` token 结束（MDN CRP 原文）。

两个对写代码有直接影响的性质：

1. **增量式**。DOM 构建不需要等整个 HTML 到齐，收到多少解析多少。这就是流式 HTML（服务端边生成边发送）能提前出首屏的原理。
2. **节点数量 = 全管线成本**。「DOM 节点越多，构建 DOM 树耗时越长」，且 CRP 后续每步（样式匹配、布局遍历）都按节点规模放大。滥用包装 `<div>` 不是免费的。

## 二、HTML 容错：浏览器从不抛错

Chrome 官方原文：浏览器对 HTML **从不抛出错误**（never throws an error）。漏写 `</p>` 是合法 HTML；标签交错也会被自动修复：

```html
<!-- 你写的（交错标签） -->
Hi! <b>I'm <i>Chrome</b>!</i>

<!-- 解析器实际当作 -->
Hi! <b>I'm <i>Chrome</i></b><i>!</i>
```

这不是浏览器各自的黑魔法——**HTML 规范本身就设计为优雅处理这些错误**，修复规则是标准化的（所以各浏览器修复结果一致）。

> 对写代码的影响：容错 ≠ 无代价。交错标签的「修复」会产生你意料之外的 DOM 结构（上例多出一个 `<i>` 节点），CSS 选择器与 JS 遍历都会踩到。别依赖容错，写规范嵌套。

## 三、preload scanner：解析之外的并行预取

HTML 解析器逐个处理 token 时若被脚本暂停（见下节），后面的 `<img>`、`<link>` 岂不是要干等？不会——**preload scanner（预加载扫描器）与解析器并行运行**：

- 它扫描 tokenizer 产出的 token，一旦发现 `<img>`、`<link>`、`<script src>` 这类外部资源引用，就直接把请求发给浏览器进程的**网络线程**，不等主解析器走到那儿。
- MDN：它在后台预取 CSS、JavaScript、Web 字体等**高优先级资源**，「等主解析器到达该资源时，它可能已在传输中甚至已下载完成」。

```html
<link rel="stylesheet" href="styles.css" />
<script src="my-script.js" async></script>
<img src="my-image.jpg" alt="..." />
<!-- 主线程还在解析上面的内容时，preload scanner 已把 script 和 img 的请求发出去了 -->
```

对写代码的影响：

- **资源引用写在 HTML 标记里才吃得到这份红利**。JS 动态插入的 `<script>`、CSS `background-image`、`@import` 对 preload scanner 不可见，加载起点被推迟。
- 对确实无法出现在早期标记里的关键资源，用 `<link rel="preload">` 显式声明「对当前导航至关重要，尽快下载」。

## 四、JS 阻塞解析：`document.write` 为何毒

HTML 解析器遇到 `<script>` 标签（无 `async`/`defer`）时会**暂停 HTML 文档解析**：先下载（若外链）、解析并**执行完** JS，才继续。

为什么必须停？Chrome 原文：**因为 JavaScript 可以用 `document.write()` 之类的方式改变文档形状（shape），改写整个 DOM 结构**。解析器无法预知脚本会不会这么干，只能保守地停下来等。

```html
<p>第一段</p>
<script>
  // 解析器在这里必须暂停：这行会在当前解析位置插入新标记，
  // 后续 HTML 的解析结果取决于它写了什么
  document.write("<p>我插进来了</p>");
</script>
<p>第二段——在上面脚本执行完之前，解析器根本不敢碰我</p>
```

`document.write` 的毒性清单：

- **迫使解析器串行化**：它的存在（可能性）是「script 默认阻塞解析」这条规则的根因。
- **对 async/defer/module 脚本无效**：解析器不在这些脚本执行时驻留原地，规范直接禁用（调用被忽略并告警）。
- **文档解析完后再调用会隐式 `document.open()`，清空整个文档**——经典事故。

还有一层隐蔽的连坐：**CSS 阻塞 JS，JS 阻塞解析**。MDN 原文——「等待 CSS 不阻塞 HTML 解析或下载，但它阻塞 JavaScript，因为 JS 经常用于查询 CSS 属性对元素的影响」。于是同步脚本前若有未就绪的样式表，解析器要先等 CSS、再等 JS、才能继续解析。

## 五、脚本加载策略：async / defer / module

打破「下载 + 执行都卡在解析路上」的三件套。Chrome 官方建议：脚本不依赖 DOM 时用 `async` 或 `defer` 异步加载。

| 方式 | 下载 | 执行时机 | 顺序保证 | `document.write` |
| --- | --- | --- | --- | --- |
| `<script>`（裸） | **阻塞解析** | 下载完立即执行，执行完解析才继续 | 按文档顺序 | 可用（毒） |
| `<script defer>` | 并行，不阻塞 | **文档解析完成后**、`DOMContentLoaded` 前 | **按文档顺序** | 禁用 |
| `<script async>` | 并行，不阻塞 | **下载完立即执行**（此刻会暂停解析） | **无序**，先到先跑 | 禁用 |
| `<script type="module">` | 并行（含依赖图） | 默认同 defer；加 `async` 则同 async | 依赖图顺序 | 禁用 |

选型直觉：

- **依赖 DOM、依赖彼此顺序**（主应用逻辑）→ `defer`（或 module 默认行为）。
- **完全独立、越早跑越好**（埋点、广告）→ `async`。
- **必须同步注入的极少数**（如 polyfill 判断、防闪烁的主题脚本）→ 裸 script，但要尽量小、内联。

> 备注：`defer` 脚本与「放 `</body>` 前的裸 script」执行时机接近，但 defer 版下载更早开始（preload scanner + 并行下载），通常更优。

## 六、解析期间的其他工作

解析并不只产出 DOM：

- **JS 编译**：下载到的脚本被解析为 AST，部分引擎再编译成字节码（JavaScript compilation）；大多数代码在主线程解释执行，Web Worker 里的除外。
- **无障碍树（AOM）**：浏览器同步构建供辅助设备使用的 accessibility tree，DOM 更新时随之更新；**AOM 建成前内容对屏幕阅读器不可及**。

CSS 侧的解析（CSSOM）为什么单独成页？因为它的「非增量」性质和 render-blocking 行为自成一套逻辑——见下一页。

## 小结

- HTML → token → 节点 → DOM，**增量构建**；节点数是全管线的成本基数。
- 容错是规范内建：浏览器从不报错，但修复出的 DOM 可能不是你想的那个——写规范嵌套。
- **preload scanner** 并行预取高优资源；资源写进早期标记、必要时 `rel="preload"`，让它看得见。
- 裸 `<script>` 暂停解析（根因：`document.write` 可改写文档）；CSS 又阻塞 JS——连坐效应。
- `defer` 按序等解析完、`async` 先到先跑、module 默认 defer；三者都禁 `document.write`。
- CSSOM 为什么必须完整才能用？下一页：[CSSOM 与 render tree](./cssom-render-tree)。
