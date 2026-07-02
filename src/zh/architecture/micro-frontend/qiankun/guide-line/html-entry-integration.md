---
layout: doc
outline: [2, 3]
---

# HTML entry 与接入约束

> 基于 qiankun 2.10（3.0 rc 追踪） · 核于 2026-07

## 速查

- HTML entry 的**通论**（相比 JS entry 的取舍、import-html-entry 如何解析）见[核心机制·HTML entry](../../mfe-mechanisms/guide-line/html-entry-loading)——本页只讲 **qiankun 子应用的具体接入约束与报错排查**
- **HTML entry 心智**：主应用 `entry` 只填子应用的 HTML 地址（`'//host:7100'`），qiankun `fetch` 回 HTML、解析出 `<script>`/`<link>`、在沙箱里执行、从中取生命周期——子应用「像 iframe 一样」被引入
- `entry` 两种写法：**HTML 地址**（`'//localhost:7100'`，末尾 `/` 不能省）或 **`{ scripts: [...], styles: [...], html }`** 显式清单
- **UMD 是硬约束**：子应用必须打成 UMD——`output.libraryTarget: 'umd'` + `output.library` 唯一名——qiankun 要从 UMD 导出对象上取 `bootstrap`/`mount`/`unmount`；打成 CommonJS/AMD 就报 “You need to export the functional lifecycles”
- **`output.library` 约定唯一**（`${packageName}-[name]`）、**`chunkLoadingGlobal`**（webpack4 用 `jsonpFunction`）也要唯一（`webpackJsonp_${packageName}`）——否则多子应用的 chunk 加载全局互相覆盖
- **entry script 标记**：`entry` 指 HTML 时，qiankun 以 HTML 里**最后一个（或标了 `entry` 的）`<script>`** 作为入口脚本，取其 UMD 导出的生命周期
- **`__INJECTED_PUBLIC_PATH_BY_QIANKUN__`**：子应用被嵌入后资源基准变了，qiankun 挂载前注入此变量，子应用入口顶部 `__webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__` 修正动态 chunk 路径（放 `public-path.js`）
- 子应用用 <code v-pre>window.__POWERED_BY_QIANKUN__</code> 判断独立/嵌入，据此决定是否修 publicPath、切路由 `base`、是否自己 `render`
- **CORS 是硬要求**：qiankun 用 `fetch` 拉子应用 HTML 与静态资源，跨域资源必须开 `Access-Control-Allow-Origin`；带 cookie 的 entry 需自定义 `fetch` 加 `credentials: 'include'` + `mode: 'cors'`
- **entry 末尾 `/` 不能省**、**`activeRule` 不能等于真实访问路径**——否则 publicPath 推断错、路由自激活死循环
- 常见报错三连：`export lifecycles`（UMD/生命周期没对）、`died in LOADING_SOURCE_CODE`（entry 404/CORS/格式错）、`Application 'xxx' died`（生命周期抛错）

## 一、边界：本页讲什么、不讲什么

「HTML entry vs JS entry」的取舍、import-html-entry 如何用正则解析 HTML 把脚本 fetch 回来执行、与 import maps 的对比——这些 HTML entry 的**通论**在[核心机制·HTML entry 与资源加载](../../mfe-mechanisms/guide-line/html-entry-loading)讲过。本页只答 **qiankun 子应用要接进来，具体得满足哪些约束、报错怎么查**。

## 二、HTML entry：子应用「像 iframe 一样」被引入

qiankun 相比 single-spa 最省事的一点，就是 `entry` 只填子应用的 **HTML 地址**——不用像 single-spa 那样手写 import maps、把子应用改造成裸 JS 模块：

```js
// 主应用：entry 填 HTML 地址，qiankun 自己解析出脚本与样式
registerMicroApps([
  {
    name: "vue-app",
    entry: "//localhost:7101/", // HTML entry：末尾 / 不能省
    container: "#subapp",
    activeRule: "/vue",
  },
]);
```

qiankun 拿到这个地址后：`fetch` 回 HTML → 用 import-html-entry 解析出 `<script>`/`<link>` → 拉取脚本内容、在沙箱里执行 → 从入口脚本的 UMD 导出上取生命周期 → 处理样式隔离 → 挂载。子应用因此「像 iframe 一样」被引入，但又不是真 iframe（共享 DOM、可被沙箱记账）。

`entry` 也可给**显式资源清单**，跳过 HTML 解析（子应用没有独立 HTML、或你想精确控制加载哪些资源时）：

```js
entry: {
  scripts: ["//localhost:7101/main.js"], // 显式脚本清单
  styles: ["//localhost:7101/main.css"], // 显式样式清单
  html: "<div id='app'></div>", // 可选：HTML 模板
}
```

## 三、UMD 打包：qiankun 取生命周期的硬约束

qiankun 从子应用**入口脚本的导出对象**上取 `bootstrap`/`mount`/`unmount`。要让这个「导出对象」在浏览器里能被 qiankun 拿到，子应用必须打成 **UMD**：

```js
// 子应用 webpack（webpack 5）：output 段
const packageName = require("./package.json").name;
module.exports = {
  output: {
    library: `${packageName}-[name]`, // 库名：约定唯一，qiankun 据此定位导出
    libraryTarget: "umd", // 硬约束：必须 UMD（不能 CommonJS/AMD）
    chunkLoadingGlobal: `webpackJsonp_${packageName}`, // webpack4 用 jsonpFunction
    globalObject: "window", // UMD 挂到 window（避免 self 在某些环境出错）
  },
};
```

两个「唯一」要盯紧，否则多子应用互相踩：

- **`library` 唯一**：多个子应用若同名，UMD 挂到 window 的键冲突，qiankun 取错生命周期。约定用包名派生（`${packageName}-[name]`）。
- **`chunkLoadingGlobal`（webpack4 `jsonpFunction`）唯一**：webpack 异步 chunk 靠一个全局数组（默认 `webpackJsonp`）通信，多子应用共用默认名会**互相覆盖对方的 chunk**，表现为「莫名其妙加载失败/白屏」。改成 `webpackJsonp_${packageName}` 隔离。FAQ 也强调 `package.json` 的 `name` 字段在子应用间必须唯一。

若子应用被打成了 AMD/CommonJS，qiankun 读不到导出，报 **“You need to export the functional lifecycles in xxx entry”**——FAQ 给的解法就是把 `libraryTarget` 改成 `umd`（或退一步 `window`）。

## 四、entry script 标记与生命周期导出

`entry` 指向 HTML 时，一个 HTML 里可能有多个 `<script>`，qiankun 需要知道**哪个是入口**（从哪个取生命周期）。规则：以 HTML 里**标了 `entry` 属性的 `<script>`**，或没标时的**最后一个 `<script>`** 作为入口脚本：

```html
<!-- 子应用 HTML：入口脚本可显式标 entry -->
<script src="//localhost:7101/vendor.js"></script>
<script src="//localhost:7101/main.js" entry></script>
<!-- ↑ 标了 entry：qiankun 从这个脚本的 UMD 导出取 bootstrap/mount/unmount -->
```

入口脚本里，生命周期要**具名导出**（webpack UMD 会把它们挂到 `library` 指定的对象上）：

```js
// 子应用入口：导出生命周期（框架无关契约）
export async function bootstrap() {}
export async function mount(props) {
  // props.container 是 qiankun 提供的挂载节点；独立运行时为 undefined
  render(props.container);
}
export async function unmount(props) {}
```

## 五、publicPath 修正：`__INJECTED_PUBLIC_PATH_BY_QIANKUN__`

子应用独立运行时，动态 chunk（懒加载路由、图片）从子应用自己的域名取；一旦被嵌进主应用，页面地址变成主应用的，webpack 的 `publicPath` 若是相对路径就会**把资源指错到主应用域名下**导致 404。qiankun 的解法是在挂载前注入一个运行时变量，子应用入口顶部据此修正：

```js
// public-path.js：import 到子应用入口的最顶部（早于任何其他 import）
if (window.__POWERED_BY_QIANKUN__) {
  // 被 qiankun 嵌入：用注入的动态 publicPath 修正资源基准
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}
```

```js
// 子应用入口第一行 import
import "./public-path"; // 必须最先执行，才能在其他 chunk 加载前改好 publicPath
```

`__webpack_public_path__` 是 webpack 提供的**运行时改 publicPath 的魔法变量**；`window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__` 是 qiankun 注入的动态值。另一种更省事的做法是构建时写死绝对 publicPath（`output.publicPath: '//localhost:7101/'`），适合子应用部署地址固定的场景。

`window.__POWERED_BY_QIANKUN__` 是 qiankun 注入的**独立/嵌入判别标记**，子应用靠它决定：是否修 publicPath、路由 `base` 用哪个（嵌入时用主应用分配的前缀）、是否自己 `render`（独立时自己挂载，嵌入时等 qiankun 调 `mount`）。

## 六、CORS：跨域 entry 的硬要求

qiankun 用 `fetch` 拉子应用的 HTML 与静态资源——这是它区别于 iframe 的关键（能拿到内容才能沙箱执行），但也带来一个**硬要求：跨域资源必须开 CORS**。FAQ 原文确认：子应用资源经 `fetch` 引入，**这些静态资源必须支持 CORS**。

- **子应用侧**：静态资源服务器返回 `Access-Control-Allow-Origin`（开发时 devServer 加 `headers: { 'Access-Control-Allow-Origin': '*' }`）。
- **带 cookie 的 entry**：默认 `fetch` 不带凭证，需在 `start` 里自定义 `fetch` 加凭证：

```js
// 主应用：给需要 cookie 的 entry 定制 fetch
start({
  fetch(url, ...args) {
    if (url === "http://app.example.com/entry.html") {
      return window.fetch(url, { ...args, mode: "cors", credentials: "include" });
    }
    return window.fetch(url, ...args);
  },
});
```

生产环境规避 CORS 的常见手段（Cookbook 推荐）是**用 nginx 反向代理把子应用代理到主应用同源路径下**，`entry` 填相对路径 `'/app1/'`，既免 CORS 又统一部署。

## 七、常见接入报错排查

| 报错 / 现象 | 多半原因 | 处理 |
| --- | --- | --- |
| `You need to export the functional lifecycles in xxx entry` | 子应用没打 UMD / 生命周期没具名导出 / entry script 没被识别 | 检查 `libraryTarget: 'umd'`、`export bootstrap/mount/unmount`、入口 script 标记 |
| `Application 'xxx' died in status LOADING_SOURCE_CODE` | entry 404、跨域没开 CORS、entry 资源格式错 | 查 network：entry 能否 fetch 到、有无 CORS 头、末尾 `/` 是否漏 |
| 子应用静态资源 404 / 白屏 | publicPath 没修 | 加 `public-path.js` + `__INJECTED_PUBLIC_PATH_BY_QIANKUN__`，确认最先 import |
| 多子应用随机加载失败 | `library` / `chunkLoadingGlobal` 未唯一，chunk 全局冲突 | 用包名派生唯一名，确认 `package.json` name 唯一 |
| 路由自激活死循环 / 冲突 | `activeRule` 等于子应用真实访问路径 | 让 `activeRule` 与真实路径错开（Cookbook 明确约束） |
| 子应用弹窗无样式 | 开了 `strictStyleIsolation`，弹窗挂 body 逃出 shadow tree | 换 `experimentalStyleIsolation` 或改弹窗挂载点（见[样式隔离](./style-isolation)） |

## 小结

qiankun 的 HTML entry 让「引入子应用像用 iframe 一样简单」，代价是子应用要满足一串接入约束：**打成 UMD**（`libraryTarget: 'umd'` + 唯一 `library`）供 qiankun 取生命周期、**入口脚本具名导出** `bootstrap/mount/unmount`、**修 publicPath**（`__INJECTED_PUBLIC_PATH_BY_QIANKUN__`）、**开 CORS**（fetch 拉资源）、**entry 末尾带 `/`、activeRule 与真实路径错开**。接入报错八成落在「UMD 没对、CORS 没开、publicPath 没修」这三处。而这套约束里最致命的一条限制——它**只吃能被 fetch 回来当字符串执行的脚本，不认 ESM**——正是 Vite 子应用接不进来的根源：下一页[Vite 与 ESM 之痛](./vite-esm-pain)。
