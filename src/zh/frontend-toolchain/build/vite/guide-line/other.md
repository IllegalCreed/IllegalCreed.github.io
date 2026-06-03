---
layout: doc
outline: [2, 3]
---

# 指南 · 其他

> 基于 **Vite 8.x**。本篇覆盖静态部署、性能优化与故障排查——把项目稳妥地送上线、跑得快、出问题能定位。

## 一、静态部署

### 构建与本地预览

```bash
npm run build     # vite build → 输出 dist/（可改 build.outDir）
npm run preview   # vite preview → http://localhost:4173 本地预览生产构建
```

> ⚠️ `vite preview` 端口是 **4173**（dev 是 5173），且**仅本地预览，不可作生产服务器**。

子路径部署在 `vite.config` 设 `base`：GitHub **用户/组织站**用 `base: '/'`，**项目站**（`https://<USER>.github.io/<REPO>/`）用 `base: '/<REPO>/'`。

### 各平台部署速查

| 平台 | 关键点 |
|---|---|
| **GitHub Pages** | GitHub Actions：`upload-pages-artifact` 的 `path` 必须 `'./dist'`；权限 `pages:write` / `id-token:write`；Settings→Pages→Source 选 GitHub Actions |
| **GitLab Pages** | `.gitlab-ci.yml` job 名 `pages`，**产物必须放 `public/`**（`cp -a dist/. public/`），`artifacts.paths: [public]` |
| **Netlify / Vercel** | 自动识别 Vite，输出 `dist`；分支/PR 生成 Preview，主分支生成 Production |
| **Cloudflare** | `@cloudflare/vite-plugin` + `wrangler.jsonc`，`npx wrangler deploy` |
| **Firebase** | `firebase.json` 设 `public: 'dist'` + **SPA 必需** `rewrites ** → /index.html` |

GitHub Pages 工作流示例（核心步骤）：

```yaml
# .github/workflows/deploy.yml
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: lts/*, cache: npm }
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: "./dist" } # 必须 ./dist
```

## 二、性能优化

开发态变慢，按官方[性能指南](https://vite.dev/guide/performance.html)排查这些常见元凶：

### 桶文件（barrel file）—— 隐形头号杀手

从 `src/utils/index.js` 统一导出再按需引用，会让 Vite **fetch + transform 整个目录**所有文件：

```ts
// ❌ 慢：拉取整个 utils 目录
import { slash } from "./utils";
// ✅ 快：直接指向具体文件
import { slash } from "./utils/slash.js";
```

### 其它手段

- **收窄 `resolve.extensions`**：默认 `['.mjs','.js','.mts','.ts','.jsx','.tsx','.json']`，显式写扩展名能少做解析尝试；TS 配 `moduleResolution: 'bundler'` + `allowImportingTsExtensions` 可直接导 `.ts`。
- **`server.warmup`**：预热高频文件（`clientFiles` / `ssrFiles`），别滥用否则压垮 dev server。
- **DevTools 缓存**：开着 DevTools 勾「Disable cache」会显著拖慢启动与整页重载；浏览器扩展也可能干扰，建议用无扩展 / 无痕 profile。
- **第三方插件别在启动钩子做重活**：`config` / `configResolved` / `buildStart` 在 dev 启动期被 `await`；`resolveId` / `load` / `transform` 应先做检查再转换。
- **用更轻量的工具**：能用 CSS 就别上 Sass/Less/Stylus；SVG 当字符串/URL 导入别转 UI 组件。

诊断命令：`vite --profile --open`（按 `p` + 回车生成 `.cpuprofile`，上传 [speedscope.app](https://www.speedscope.app/)）、`vite --debug transform`、`vite-plugin-inspect`。

## 三、故障排查

| 症状 | 原因与解法 |
|---|---|
| **HMR 不工作 / 整页重载** | 核对 import **大小写**（`'./foo.js'` 非 `'./Foo.js'`，macOS/Windows 大小写不敏感会掩盖问题）；打破**循环依赖**；`vite --debug hmr` 定位 |
| **构建产物 CORS**（`origin null blocked`） | 绝不能 `file://` 双击打开 dist，必须 `npx vite preview` 经 HTTP 服务 |
| **`Failed to fetch dynamically imported module`** | ①部署后旧 chunk 没了（保留旧 chunk / 优雅重载回退）；②网络差浏览器不重试；③广告拦截器（换 `rolldownOptions.output.chunkFileNames`） |
| **`pnpm/npm link` 依赖改了不生效** | 预构建缓存不会因 link 失效，须 `vite --force` |
| **`This package is ESM only but tried to load by require`** | `package.json` 加 `"type": "module"` 或配置文件改名 `.mjs`/`.mts` |
| **Linux 请求永久挂起 / ENOSPC** | `ulimit -Sn 10000`；`fs.inotify.max_user_watches` 提到 524288，或 `server.watch.usePolling` |
| **Dev Containers 端口转发挂起** | `server.host` 设 `'127.0.0.1'` |

::: tip 部署后的 chunk 404 兜底
新部署后用户页面引用的旧 chunk 可能 404。监听 `vite:preloadError` 事件兜底（如提示刷新），并务必让 **HTML 配 `Cache-Control: no-cache`**，否则用户仍拿到旧 HTML 引旧 chunk。
:::

---

配置项默认值、JS API、HMR API 的完整速查见 [参考](../reference)。
