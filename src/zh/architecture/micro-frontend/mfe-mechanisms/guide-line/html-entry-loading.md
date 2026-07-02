---
layout: doc
outline: [2, 3]
---

# HTML entry 与资源加载

> 基于微前端 2026 生态 · 核于 2026-07

## 速查

- 主应用「拿到」子应用有两种契约：**JS entry**（子应用暴露全局渲染函数，Fowler：`window.renderBrowse(containerId, history)`，「这个全局函数的签名就是容器与微前端之间的关键契约」）与 **HTML entry**（给一个 HTML 地址，**HTML 本身就是资源清单**）
- JS entry 的隐性成本：样式与资源要么打进 JS 要么另行约定、产物文件名带 hash 还需要一层 manifest；HTML entry 天然与「子应用独立运行」同构——**开发时单独跑、集成时被解析，是同一份 HTML**
- **import-html-entry**（qiankun 底层）是 HTML entry 的事实标准：`importHTML(url)` 返回 `{ template, assetPublicPath, getExternalScripts, getExternalStyleSheets, execScripts }` 五件套
- **`execScripts(sandbox, strictGlobal)`** 是灵魂 API：在给定 **proxy（沙箱对象）**上下文里执行全部脚本，返回**入口脚本在 window/proxy 上设置的最后一个属性**——生命周期导出就是这么被拿到的
- `importEntry` 还接受对象形式 `{ scripts, styles, html }`（qiankun entry 配置的对象写法即透传于此，此时 publicPath 自动为 `/`）；HTML 里可用 `entry` 属性显式标记入口 script
- 脚本是被 **fetch 成文本再求值**的（非 `<script>` 标签插入）——因此子应用**所有静态资源必须支持跨域**（qiankun FAQ 原文），CORS 是 HTML entry 的硬前提（配置见[跨源与 CORS](/zh/base/network/net-cors/)）
- 子应用必须打成 **UMD**（`output.library` + `libraryTarget: 'umd'`），且 library 名与主应用注册名对齐——识别导出靠「执行后全局多出来的那个变量」；报错 **`Application died in status LOADING_SOURCE_CODE`** = 从 entry 里识别不到生命周期导出
- **publicPath 运行时注入**：子应用打包时不知道自己将来挂在谁的域名下——主应用把解析出的 `assetPublicPath` 注入全局（`__INJECTED_PUBLIC_PATH_BY_QIANKUN__` 型机制），子应用 entry 顶部回填 `__webpack_public_path__`
- CSS 内的 `url()`（字体/背景图）**不走 webpack 运行时 publicPath**——修不了就绕：上 CDN、小文件 base64、file-loader 写死完整路径（qiankun FAQ 三方案）
- **ESM 时代的根本冲突**：整套机制建立在「classic script + 全局导出」上；ESM 的 `import/export` 语法在函数作用域求值直接 SyntaxError、`import.meta` 只在真模块里存在、模块顶层变量本就不上 window——**qiankun 2.x 不支持 vite/ESM 入口的根因**
- ESM 时代的出路：社区插件把 ESM 包回全局约定（vite-plugin-qiankun 型）、或换原生兼容 ESM 的路线（wujie / micro-app iframe 沙箱、Module Federation、import maps）

## 一、两种 entry 契约：全局函数 vs 资源清单

微前端运行时集成的第一个问题：主应用怎么知道「子应用长什么样、怎么启动」？答案分两派。

**JS entry**：约定每个子应用构建成一个 JS bundle，加载后在全局暴露渲染/卸载函数。这是 Fowler 文章演示的经典形态：

```js
// 子应用打包产物在全局挂上渲染函数 —— 签名即契约
window.renderBrowse = (containerId, history) => { /* 渲染进指定容器 */ };
window.unmountBrowse = (containerId) => { /* 对应的清理函数 */ };

// 容器应用按约定调用
window.renderBrowse("browse-container", history);
```

Fowler 的原话点出了本质：「**这个全局函数的签名，就是容器应用与微前端之间的关键契约**」——契约应保持轻量，因为每个新微前端都要实现它。JS entry 简单直接，但工程上有三笔隐性账：CSS 与静态资源要么打进 JS（体积、闪烁）要么再立一套约定；产物文件名带 hash 时还需要 manifest 层解析「最新的 bundle 是哪个」；子应用「独立运行」与「被集成」是两套入口，容易漂移。

**HTML entry**：干脆把子应用的 **HTML 地址**当入口。HTML 本来就是浏览器世界的资源清单——里面的 `<script>`、`<link>` 如实列出了这个应用需要的一切，且天然带 hash 后的最新文件名。主应用 fetch 这个 HTML、解析出资源、模拟浏览器把它「装」进自己的某个容器里。最大的架构收益是**同构**：子应用开发时独立跑的、和被主应用集成的，是同一份 HTML——集成测试与独立调试不再是两个世界。代价是主应用要内置一个「迷你浏览器」，这正是 import-html-entry 的角色。

## 二、import-html-entry 工作流

[import-html-entry](https://github.com/kuitos/import-html-entry)（qiankun 底层依赖，kuitos 维护）把「HTML 当清单」这件事做成了三个 API。核心工作流：

```js
import { importHTML } from "import-html-entry";

const {
  template,                 // 处理后的 HTML 模板（外链 script 已摘除、待注入容器）
  assetPublicPath,          // 从 entry 地址推导出的资源基准路径
  getExternalScripts,       // () => Promise<脚本内容数组>：拉取全部外链 JS
  getExternalStyleSheets,   // () => Promise<样式内容数组>：拉取全部外链 CSS
  execScripts,              // (sandbox?, strictGlobal?) => Promise<入口导出>
} = await importHTML("//sub-app.example.com/index.html");

container.innerHTML = template;            // ① 模板进容器（样式已内联其中）
const exports = await execScripts(sandboxProxy, true); // ② 在沙箱上下文执行全部脚本
exports.mount(props);                      // ③ 拿到生命周期，进入编排
```

三个 API 各自的职责边界：

| API | 输入 | 关键行为 |
| --- | --- | --- |
| `importHTML(url, opts)` | HTML 地址 | fetch HTML → 解析模板 → 抽出 styles/scripts 清单 → 返回五件套 |
| `importEntry(entry, opts)` | 字符串 **或** `{ scripts, styles, html }` 对象 | 对象形式跳过 HTML 解析，直接给资源清单（qiankun entry 对象配置透传于此） |
| `execScripts(entry, scripts, proxy, opts)` | 入口地址 + 脚本列表 + **代理对象** | 逐个执行脚本，**以 proxy 为全局上下文**；返回入口脚本的导出 |

几处直接影响工程决策的细节：

- **导出识别机制**：`execScripts` 的返回值是「**入口脚本在 window（或 proxy）上设置的最后一个属性**」——这就是为什么子应用必须 UMD、为什么 library 名要对齐（见下节）。
- **入口标记**：HTML 里多个 script 时，默认最后一个是入口；也可以显式加 `entry` 属性：`<script src="/main.js" entry></script>`。
- **proxy 参数即沙箱插槽**：把 [JS 沙箱](./js-sandbox)的代理对象递进来，子应用代码里的全局访问就落进了沙箱——**HTML entry 与沙箱机制在这一个参数上会师**。
- **可定制点**：`fetch`（自定义请求，如带 cookie、处理非 UTF-8 的 `autoDecodeResponse`）、`getPublicPath`（改资源基准路径推导）、`getTemplate`（执行前改模板）、`execScriptsHooks`（`beforeExec`/`afterExec` 脚本前后钩子）。

## 三、执行细节与 UMD 约束

理解「脚本是怎么被执行的」，后面的约束就全是推论。import-html-entry **不是**把 `<script src>` 插回文档让浏览器加载，而是 **fetch 拿到脚本文本，在函数作用域里求值**（eval 型执行），并把 proxy 绑定为它看到的「全局」。三条推论：

**推论一：资源必须跨域可访问。** 脚本、样式全走 `fetch`，同源策略立刻生效——qiankun FAQ 原文：「qiankun 是通过 fetch 去获取微应用的静态资源的，所以必须要求这些静态资源支持跨域」。子应用的静态服务器要配 CORS（`Access-Control-Allow-Origin`），这也是很多「本地好好的、上线 404/CORS 报错」的第一排查点（规则细节见[跨源与 CORS](/zh/base/network/net-cors/)）。

**推论二：导出要打到「全局」上，即 UMD。** 求值后框架从 proxy 上找「入口脚本设置的最后一个属性」当导出，所以子应用要用 UMD 格式让生命周期落到全局变量上，且变量名可预期：

```js
// 子应用 webpack 配置（qiankun FAQ 原方案）
const packageName = require("./package.json").name;
module.exports = {
  output: {
    library: `${packageName}-[name]`,   // 全局变量名 —— 与主应用注册的 name 对齐
    libraryTarget: "umd",               // UMD 格式：导出挂到全局
    jsonpFunction: `webpackJsonp_${packageName}`, // webpack4 需隔离 jsonp 回调名
  },
};
```

**推论三：识别失败有固定病名。** `Application died in status LOADING_SOURCE_CODE: You need to export lifecycle functions` ——官方解释就一句：「无法从微应用的 entry js 中识别出其导出的生命周期钩子」。排查按机制走：生命周期是否真的导出了 → `output.library`/`globalObject` 是否让导出落上 window → entry 脚本是不是最后执行（不是就加 `entry` 属性标记）→ 生产环境 HTML/JS 响应是否 200 → 与 Module Federation 混用时是否在 bootstrap 里重新暴露了生命周期。

## 四、publicPath 运行时注入

还有一类必踩的坑：**子应用打包时不知道自己将来部署在哪、更不知道会被谁加载**。它产物里的动态资源引用（懒加载 chunk、动态 import 的图片）默认按相对路径解析——被主应用（另一个域名）加载后，这些相对路径全部按**主应用的地址**解析，404 连片。

机制层的解法分两步。主应用侧：import-html-entry 从 entry 地址推导出 `assetPublicPath`，框架把它注入子应用的全局（qiankun 的实现是 `window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__` 型全局变量）。子应用侧：在 entry **最顶部**用 webpack 的运行时 publicPath 接住它：

```js
// public-path.js —— 必须是子应用 entry 里第一个被执行的模块
if (window.__POWERED_BY_QIANKUN__) {
  // 运行时改写 webpack publicPath：之后所有动态 chunk/资源都以注入值为基准
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}
```

qiankun FAQ 对适用范围的界定值得原样记住：「runtime publicPath 主要解决的是微应用**动态载入的**脚本、样式、图片等地址不正确的问题」。反过来说，**CSS 文件内部的 `url()` 引用**（字体、背景图）是编译期写死在 CSS 里的，不经过 webpack 运行时——这块修不了只能绕，FAQ 给了三条：资源上 CDN 直接引绝对地址；小文件 url-loader 转 base64 内联；大文件 file-loader 注入完整 publicPath。

## 五、ESM 时代的挑战

上面整套机制有一个共同的地基：**子应用产物是 classic script（非模块脚本），导出走全局变量**。Vite 时代这个地基裂了——vite 的产物是原生 ESM（`<script type="module">`），而 ESM 与「fetch 文本 + 函数作用域求值 + proxy 当全局」的执行模型逐条冲突：

| classic script 假设 | ESM 的现实 |
| --- | --- |
| 脚本文本可以在函数作用域里 eval 求值 | `import`/`export` 是模块专属语法，eval/`new Function` 语境下直接 **SyntaxError** |
| 顶层变量可经 `library` 配置挂到全局，导出可从 proxy 上取 | 模块作用域天然封闭，**顶层变量本就不进 window**，「执行后全局多出来的变量」无从谈起 |
| 无 `import.meta`、依赖可整包打进产物 | `import.meta.url`、裸说明符解析都绑定在**真实的模块图**上，脱离浏览器模块加载器就不成立 |
| `with(proxy)` 可介入作用域链（strictGlobal/沙箱） | ESM **强制严格模式**，`with` 是语法错误——沙箱手段直接被没收 |

这就是「qiankun 2.x 不支持 vite/ESM 入口」的根因：不是没适配，而是 HTML entry + execScripts 的执行模型**结构性地**装不下 ESM。症状通常表现为上一节那个 `LOADING_SOURCE_CODE` 报错——模块没按预期方式执行，生命周期自然无处可寻。

出路有三个方向，代价各不同：

1. **把 ESM 包回旧约定**：社区插件（vite-plugin-qiankun 型)在构建层把入口重新暴露成全局变量——能用，但等于给新工具链套上旧枷锁；
2. **换执行环境**：iframe 沙箱路线（wujie、micro-app iframe 模式）里子应用脚本由 iframe 的浏览器上下文原生执行，`type="module"` 天然合法——ESM 兼容性是 iframe 路线的隐藏红利；
3. **换共享模型**：Module Federation、import maps 本身就活在模块世界里，根本不存在「把模块塞进全局」的问题（见[依赖共享三路线](./dependency-sharing)）。

## 小结

HTML entry 的本质是一句话：**把子应用的 HTML 当作资源清单，由主应用扮演迷你浏览器**。import-html-entry 用五件套返回值把它标准化——`template` 进容器、`execScripts(proxy)` 在沙箱上下文执行并返回「入口脚本落在全局上的最后一个属性」。由执行模型可推出全部工程约束：fetch 拉资源 ⇒ 必须 CORS；从全局取导出 ⇒ 必须 UMD 且 library 对齐；打包时不知部署位置 ⇒ publicPath 运行时注入（CSS `url()` 除外，只能绕）。而它与 ESM 的冲突是结构性的——eval 语境容不下 `import/export`、模块作用域不上全局、严格模式没收 `with`——这条裂缝直接解释了 qiankun 的 Vite 之痛，也解释了 wujie/micro-app iframe 模式与 Module Federation 各自的兴起路径。应用装进来了，下一页解决它们怎么开口说话：[应用间通信](./communication)。
