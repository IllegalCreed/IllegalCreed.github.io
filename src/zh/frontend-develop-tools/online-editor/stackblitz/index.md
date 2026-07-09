---
layout: doc
---

# StackBlitz

由 WebContainers（基于 WebAssembly 的浏览器内微型操作系统）驱动的即时全栈网页 IDE / playground——Node.js、终端、git、npm 全部跑在浏览器标签页内，毫秒级启动、可离线运行。最广为人知的用途，是嵌入文档 / README / StackOverflow 的「可运行代码编辑器」，让读者点开即跑、即时改、即时看效果。

## 评价

**优点**

- 浏览器内原生跑 Node.js（WebContainers），无需远程服务器，毫秒启动、可离线，体感「比 localhost 还快」
- 安全沙箱就在标签页内，代码不出本机；不像传统在线 IDE 把代码送到远端容器执行
- 可嵌入任意网页做「可运行 demo」，是文档 / 教程 / 博客的可交互代码块首选
- 支持 npm / pnpm / yarn，兼容 Vite / Next / Nuxt / Remix / SvelteKit 等主流框架与工具链
- 提供 `@stackblitz/sdk` 程序化嵌入，配合丰富的 `*.new` 速建短链，新建项目近乎零成本
- GitHub 仓库导入即用，并与上游保持同步——push 到 GitHub 后对应项目自动更新

**缺点**

- 只能运行 Web 原生支持的语言（JS + WASM），原生二进制 / 原生 addon / Python / Java 原生不行
- 依赖浏览器的跨域隔离能力：Chrome 完整支持、Safari 16.4+ 仍在 beta、Firefox 仍是 alpha，移动端不支持
- 文件系统是内存态的，刷新 / 关页易丢失（未 fork / 未登录尤甚）
- 私有项目需付费套餐，免费版仅限公开项目（具体档位与价格以官方 pricing 为准）
- 公司战略重心正转向 AI 应用生成器 bolt.new，编辑器本体的迭代节奏需留意

## 文档地址

[StackBlitz](https://developer.stackblitz.com/)

## GitHub地址

[WebContainers](https://github.com/stackblitz/webcontainer-core)

## 幻灯片地址

<a href="/SlideStack/stackblitz-slide/" target="_blank">StackBlitz</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=stackblitz" target="_blank" rel="noopener noreferrer">StackBlitz 测试题</a>
