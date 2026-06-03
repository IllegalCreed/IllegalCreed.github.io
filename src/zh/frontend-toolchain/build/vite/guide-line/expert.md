---
layout: doc
outline: [2, 3]
---

# 指南 · 高级

> 基于 **Vite 8.x**。本篇覆盖 SSR、后端集成、Environment API、插件系统与 Rolldown 内核——面向框架作者与复杂工程场景。

## 一、SSR（服务端渲染）

### 项目结构

Vite 内置 SSR 支持，开发期以**中间件模式**由父级 Node 服务器（如 Express）接管 HTML：

```
├── index.html          # 含 <!--ssr-outlet--> 占位 + 引 entry-client.js
├── server.js           # 父级 Node 服务器
└── src/
    ├── main.js         # universal 通用代码
    ├── entry-client.js # 挂载到 DOM
    └── entry-server.js # 导出 render(url)
```

用 `if (import.meta.env.SSR) { /* 仅服务端 */ }` 写条件分支（构建时静态替换，可 tree-shake 未用分支）。

### 开发态：中间件模式与单次请求三步

```js
const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom", // 必须 custom，否则 Vite 仍接管 HTML 与父服务器冲突
});
app.use(vite.middlewares);

app.use("*", async (req, res) => {
  // ① 读模板并注入 HMR client
  let template = fs.readFileSync("index.html", "utf-8");
  template = await vite.transformIndexHtml(req.originalUrl, template);
  // ② 加载服务端入口（转 ESM 供 Node，unbundled + HMR）
  const { render } = await vite.ssrLoadModule("/src/entry-server.js");
  // ③ 渲染并替换占位（第二参用函数避免 $ 特殊替换字符）
  const appHtml = await render(req.originalUrl);
  const html = template.replace("<!--ssr-outlet-->", () => appHtml);
  res.status(200).set({ "Content-Type": "text/html" }).end(html);
});
```

`vite.ssrFixStacktrace(e)` 把错误栈映射回源码。`vite preview` **不支持** SSR 应用。

### 生产构建：两次构建与外部化

```bash
# 客户端构建（加 --ssrManifest 生成 dist/client/.vite/ssr-manifest.json）
vite build --outDir dist/client --ssrManifest
# 服务端构建
vite build --outDir dist/server --ssr src/entry-server.js
```

- 两次**独立** build，不能合并。`ssr-manifest.json` 在 `dist/client/.vite/` 下（客户端输出）。
- 已知数据的路由可复用同一套生产 SSR 逻辑**预渲染为静态 HTML（SSG）**。
- **外部化**：SSR 默认把依赖外部化以加速。`ssr.noExternal: true` 强制全部走 Vite 管线（语义是「全部当 external」并禁 Node 内建导入，易误用）；linked 依赖默认**不**外部化（为 HMR，与普通 npm 依赖相反）。
- `ssr.target` 默认 `'node'`；`ssr.resolve.mainFields` 默认无 `browser`（区别于客户端）。

## 二、后端集成

传统后端（Rails / Laravel）渲染 HTML、Vite 服务资源时，开发期需手动往后端模板注入：

```html
<!-- 开发期注入（5173 为占位，须换真实 dev server 地址） -->
<script type="module" src="http://localhost:5173/@vite/client"></script>
<script type="module" src="http://localhost:5173/src/main.js"></script>
```

> ⚠️ **React 顺序坑**：用 `@vitejs/plugin-react` 时，必须在上述脚本**之前**注入 `@react-refresh` preamble（`RefreshRuntime.injectIntoGlobalHook` 等），否则 Fast Refresh 不工作。

- 入口未禁 module preload 时须 `import 'vite/modulepreload-polyfill'`。
- 把静态资源请求代理到 dev server，或设 `server.origin` 用后端 URL 解析。
- **生产**：`build.manifest: true` 生成 `.vite/manifest.json`（Vite 8 用 `build.rolldownOptions.input` 指定入口）。据此**四步注入 HTML**：① 入口 chunk 的 CSS → `<link stylesheet>`；② 递归 `imports` 的 CSS（避免漏样式 FOUC）；③ 入口 `file` → `<script type=module>`；④ 可选为每个 imported JS chunk → `<link modulepreload>`。

## 三、Environment API（Vite 6 引入，RC）

把过去隐式的 client / ssr 形式化为**多环境**（浏览器 client、Node ssr、Edge/Cloudflare workerd、自定义）：

```ts
export default defineConfig({
  environments: {
    client: {},
    ssr: { resolve: { conditions: ["node"] } },
    // 自定义 edge 环境
    edge: { resolve: { noExternal: true } },
  },
});
```

- dev 期单个 Vite server 并发管理多个独立环境，**共享** HTTP server / 中间件 / resolved config / 插件管线，但各有自己的 dev runtime。
- build 期 client 始终存在，ssr **仅显式配置才有**（与 dev 不同）。
- 顶层 `build` / `optimizeDeps` 隐式配置 client 环境（向后兼容）；子环境继承顶层，除非覆盖。

**关键类型**：

- `DevEnvironment` 是基类；`RunnableDevEnvironment` 带 `runner`（`ModuleRunner`），`runner.import(url)` 在同进程执行模块（等价 `ssrLoadModule`）。
- 访问 runner 前必须用 `isRunnableDevEnvironment(env)` 守卫——非同进程环境（worker / 边缘）没有 runner，须用 `transport` + `fetchModule`。
- 插件用 `applyToEnvironment` / `perEnvironmentPlugin` 限定环境；`sharedPlugins` 让 build 期跨环境只跑一次；`Builder` API 做编程式多环境构建。

> ⚠️ RC 状态，部分 API 仍可能变动，生产慎用；顶层 `ssr` 配置稳定后将迁向 `environments`。

## 四、插件系统

### 注册与顺序

```ts
export default defineConfig({
  plugins: [
    vue(),
    { ...image(), enforce: "pre" }, // 核心插件之前
    { ...analyze(), apply: "build" }, // 仅构建期
    isDev && devOnlyPlugin(), // falsy 会被忽略，可条件启停
  ],
});
```

- `plugins` 可接受**预设**（返回插件数组）作单个元素，Vite 自动扁平化；falsy 插件被忽略。
- `enforce`：`'pre'`（核心前）/ 默认（核心后）/ `'post'`（构建插件后）——这是**插件级**位置。
- `apply`：`'build'` / `'serve'` / 函数，限定运行阶段。

**dev 插件流水线顺序**：Alias → `enforce:'pre'` → Vite 核心 → 普通插件 → Vite 构建插件 → `enforce:'post'` → Vite 后置（minify / manifest / reporting）。

### 通用钩子（Rollup/Rolldown）

| 钩子 | 调用时机 |
|---|---|
| `options` / `buildStart` | 服务器启动只调一次 |
| `resolveId` / `load` / `transform` | 每次模块请求 |
| `buildEnd` / `closeBundle` | 关闭时 |

> ⚠️ dev 下 `moduleParsed` 和除 `closeBundle` 外的 Output Generation 钩子**不被调用**——依赖它们的 Rollup 插件应只用于构建。`transform` / `load` 不改代码时应 `return null`。

### 虚拟模块与 Vite 专属钩子

```ts
const virtualId = "virtual:my-module";
const resolvedId = "\0" + virtualId; // \0 前缀阻止其他插件处理 + 让 sourcemap 正常

function myPlugin() {
  return {
    name: "my-plugin",
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id === resolvedId) return `export const msg = "hi"`;
    },
    // config 钩子返回部分配置（深合并）；在此注入新插件无效
    config(config, env) {
      /* env.mode / env.command */
    },
    configureServer(server) {
      // 想在内部中间件之后注入须返回函数
      return () => server.middlewares.use(myMiddleware);
    },
    transformIndexHtml(html) {
      // 返回 HtmlTagDescriptor 数组，injectTo: head|body|head-prepend|body-prepend
      return [{ tag: "script", attrs: { src: "/x.js" }, injectTo: "body" }];
    },
  };
}
```

### HMR 钩子与客户端-服务器通信

```ts
// handleHotUpdate：返回 [] 表示自行处理、不走默认 HMR
handleHotUpdate(ctx) {
  if (ctx.file.endsWith(".my")) {
    ctx.server.ws.send("my:update", { msg: "changed" });
    return []; // 不 return 则走默认
  }
}
```

```ts
// 服务器 → 客户端
server.ws.send("my:greet", { msg: "hi" });
import.meta.hot.on("my:greet", (data) => console.log(data.msg));
// 客户端 → 服务器
import.meta.hot.send("my:from-client", { id: 1 });
server.ws.on("my:from-client", (data, client) => client.send("my:ack", {}));
```

检测引擎：`this.meta.viteVersion`；`this.meta.rolldownVersion` **仅** Rolldown 驱动的 Vite 8+ 存在。

## 五、Rolldown 内核

Rolldown 是 Rust 写的 Rollup 兼容打包器，**Vite 8 默认**用它统一了过去的 esbuild（预构建）+ Rollup（生产）。

### 在 Vite 6/7 中 opt-in

```jsonc
// package.json —— 用包别名覆盖
{
  "dependencies": { "vite": "npm:rolldown-vite@latest" }
}
```

> ⚠️ `rolldown-vite` 与 Vite 同步 major/minor 但 patch 独立，**patch 内也可能含破坏性变化，务必 pin 版本**。

### 迁移与原生插件

- `build.rollupOptions` → `rolldownOptions`；`manualChunks` → `advancedChunks`/`codeSplitting`；`transformWithEsbuild` → `transformWithOxc`。
- `experimental.enableNativePlugin` 默认 `'v1'`：alias / resolve 等以原生 Rust 运行，出问题可回退。无原生 filter 的插件用 `withFilter` 适配：

```ts
withFilter(svgr({ /* ... */ }), { load: { id: /\.svg\?react$/ } });
```

- Rolldown **原生处理 CJS**（替代 `@rollup/plugin-commonjs`），CJS 默认导入在 dev/prod 统一——这可能改变既有 import 结果（典型报错 `Element type is invalid`）。
- `import.meta.hot.accept` 传 URL 在 Vite 8 **已移除**，必须传 id。

---

最后是 [其他篇](./other)（部署 / 性能 / 故障排查）与 [参考](../reference)（配置速查 / JS API / HMR API）。
