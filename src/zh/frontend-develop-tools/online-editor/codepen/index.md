---
layout: doc
---

# CodePen

面向前端 / 设计的社区型在线代码 Playground——在浏览器里写 HTML/CSS/JS（含 SCSS、Less、Babel、TypeScript 等预处理器），实时渲染预览，并围绕「展示作品 + 社区互动 + 文档嵌入」构建。本质是**纯前端 iframe 沙箱**，所有 JS 都在浏览器端执行，**不跑 Node、无后端、无数据库**——这是它与 StackBlitz（WebContainers 跑 Node）、CodeSandbox（云端 microVM 跑全栈）之间的根本能力边界。最广为人知的用途是「CSS/动效/组件片段的快速实验与分享」，以及通过 Prefill Embed API 把可运行示例嵌进文档、博客、教程。目前正从 Classic（1.0，Ruby on Rails）整体重写为 CodePen 2.0（Next.js + SSR，公开 Beta），带来多文件 Pen、原生协作、Omnibar 命令面板、一键部署成网站等重大能力。

## 评价

**优点**

- 写一段 HTML/CSS/JS 立刻就能看到渲染结果，零配置、零安装，前端片段与设计 demo 的实验成本几乎为零
- 内置 CDNjs 库搜索（quick-add），选版本即注入，无需手填 URL；预处理器（SCSS/Less/Stylus/PostCSS、Babel/TypeScript）开箱即用
- **Prefill Embed API** 让「代码留在你自己站点、CodePen 只负责渲染成可运行嵌入」，对文档 / 教程 SEO 友好，是内联可运行示例的首选做法
- 社区与社交属性极强（评论、love、关注、Collections、CodePen TV），远超 JSFiddle，作品展示与灵感发现是核心场景
- CodePen 2.0 带来多文件 / 文件夹、原生 Collab、Omnibar（⌘K）、一键部署成线上网站，能力大幅向「轻量项目」延伸

**缺点**

- 纯前端 iframe 沙箱，**不能跑 Node / 后端 / 数据库 / 服务端语言**（PHP/Ruby/Python 都不行），要装包跑构建或起服务器得换 StackBlitz / CodeSandbox
- Classic Pen **相对路径不可用**（资源必须用完整 URL），且单 Pen 约 1MB / 100 万字符就禁用保存，大项目需改用 2.0 多文件 Pen
- 私有 Pen、Asset Hosting、可编辑嵌入、Collab、一键部署等关键能力均为 **PRO 付费**，免费档 Pen 全部公开
- 非开源产品，无法自托管，行为完全取决于平台
- 正处于 Classic 与 2.0 并存的过渡期，部分特性（Haml/Slim/CoffeeScript、旧 Projects、Professor Mode）已被废弃或取代，老资料容易过时

## 文档地址

[CodePen 文档](https://blog.codepen.io/documentation/)

## GitHub地址

CodePen 为非开源产品，无公开源码仓库。官方文档与支持资源见 [CodePen Documentation](https://blog.codepen.io/documentation/)（Classic）与 [CodePen 2.0 Docs](https://blog.codepen.io/docs/)。

## 幻灯片地址

<a href="/SlideStack/codepen-slide/" target="_blank">CodePen</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=codepen" target="_blank" rel="noopener noreferrer">CodePen 测试题</a>
