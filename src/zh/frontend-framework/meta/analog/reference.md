---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Analog v1.x / v2.x（`@analogjs/platform` / `@analogjs/router` / `@analogjs/content`）+ Angular v17/v18/v19/v20+ + Vite v5/v6/v8 + Nitro v2 编写。API 速查 / 文件约定 / 配置选项 / 命名约定 / 常用集成。

## 包结构

| 包 | 用途 | 必需 |
|---|---|---|
| `@analogjs/platform` | Vite 插件 + Nitro 集成（核心）| **是** |
| `@analogjs/router` | 文件路由 + Server Load + FormAction + Resolver tokens | **是** |
| `@analogjs/vite-plugin-angular` | Angular 组件编译（被 `@analogjs/platform` 内部使用） | **是**（间接） |
| `@analogjs/vite-plugin-nitro` | Nitro 集成（被 `@analogjs/platform` 内部使用） | **是**（间接） |
| `@analogjs/content` | Markdown 路由 + frontmatter + 语法高亮 | 内容站必需 |
| `@analogjs/content/prism-highlighter` | Prism 高亮提供方 | 可选 |
| `@analogjs/content/shiki-highlighter` | Shiki 高亮提供方 | 可选 |
| `@analogjs/vitest-angular` | Vitest 测试集成 | 测试用 |
| `@analogjs/astro-angular` | Astro Island 集成（在 Astro 项目中嵌入 Angular 组件） | Astro 用 |
| `@analogjs/trpc` | tRPC 集成 | 可选 |
| `create-analog` | 脚手架工具 | 创建时 |

## `@analogjs/router`：路由 + Server Load + 工具

### `provideFileRouter()`

文件路由的主提供方。

```ts
function provideFileRouter(
  ...features: FileRouterFeature[]
): EnvironmentProviders;
```

```ts
// src/app/app.config.ts
import { provideFileRouter } from "@analogjs/router";

providers: [provideFileRouter()];
```

### `withComponentInputBinding()`

启用 Angular Router 的 Component Input Bindings——把路由参数 / loader 结果直接作为 `@Input()`。

```ts
import { withComponentInputBinding } from "@angular/router";

providers: [provideFileRouter(withComponentInputBinding())];
```

> 注意 `withComponentInputBinding()` 来自 `@angular/router`，不是 `@analogjs/router`。

### `withNavigationErrorHandler(fn)`

注册导航错误处理：

```ts
import { withNavigationErrorHandler } from "@angular/router";

providers: [provideFileRouter(withNavigationErrorHandler(console.error))];
```

### `withExtraRoutes(routes)`

手动追加路由（前置合并到自动发现的列表）：

```ts
import { withExtraRoutes } from "@analogjs/router";
import type { Routes } from "@angular/router";

const customRoutes: Routes = [
  {
    path: "legacy",
    loadComponent: () =>
      import("./legacy.component").then((m) => m.LegacyComponent),
  },
];

providers: [provideFileRouter(withExtraRoutes(customRoutes))];
```

### `withDebugRoutes()`

启用 `/__analog/routes` 调试页：

```ts
import { withDebugRoutes } from "@analogjs/router";

providers: [provideFileRouter(withDebugRoutes())];
```

### `injectLoad()`

在组件中读取 `*.server.ts` 中的 `load()` 返回值：

```ts
function injectLoad<TLoad extends (...args: any) => any>(): Observable<
  LoadResult<TLoad>
>;
```

```ts
import { injectLoad } from "@analogjs/router";
import { toSignal } from "@angular/core/rxjs-interop";

import type { load } from "./index.server";

export default class Page {
  data = toSignal(injectLoad<typeof load>(), { requireSync: true });
}
```

### `LoadResult<T>`

`load` 函数返回值的类型推导：

```ts
type LoadResult<T extends (...args: any) => any> = Awaited<ReturnType<T>>;
```

```ts
import type { LoadResult } from "@analogjs/router";
import type { load } from "./index.server";

// LoadResult<typeof load> 自动推断为 load 返回值的类型
@Input() set load(value: LoadResult<typeof load>) {
  this.data = value;
}
```

### `getLoadResolver(route)`

在 `RouteMeta.resolve` 中获取 `load` 数据：

```ts
import { getLoadResolver } from "@analogjs/router";
import type { RouteMeta } from "@analogjs/router";

export const routeMeta: RouteMeta = {
  resolve: {
    extra: async (route) => {
      const data = await getLoadResolver(route);
      return { ...data, timestamp: Date.now() };
    },
  },
};
```

### `PageServerLoad`

`load()` 函数的参数类型：

```ts
interface PageServerLoad {
  params: Record<string, string>; // 路由参数
  req: H3Event["node"]["req"]; // Node 原生 request
  res: H3Event["node"]["res"]; // Node 原生 response
  fetch: <T = unknown>(
    input: string,
    init?: RequestInit
  ) => Promise<T>; // 内置 fetch
  event: H3Event; // 完整 h3 事件
}
```

```ts
import type { PageServerLoad } from "@analogjs/router";

export async function load({ params, req, res, fetch, event }: PageServerLoad) {
  const id = params["id"];
  const data = await fetch<MyData>(`/api/v1/data/${id}`);
  return { data };
}
```

### `PageServerAction`

表单 `action()` 函数的参数类型：

```ts
interface PageServerAction {
  params: Record<string, string>;
  req: H3Event["node"]["req"];
  res: H3Event["node"]["res"];
  fetch: typeof fetch;
  event: H3Event;
}
```

```ts
import type { PageServerAction } from "@analogjs/router/server/actions";
import { readFormData } from "h3";

export async function action({ event }: PageServerAction) {
  const body = await readFormData(event);
  // ...
}
```

### Form Action 三件套

```ts
import { json, redirect, fail } from "@analogjs/router/server/actions";
```

| 函数 | 签名 | 用途 |
|---|---|---|
| `json(data)` | `<T>(data: T) => JsonResponse<T>` | 成功响应（触发 `(onSuccess)`） |
| `redirect(path, status?)` | `(path: string, status?: number) => RedirectResponse` | 重定向（必须绝对路径） |
| `fail(status, data)` | `<T>(status: number, data: T) => FailResponse<T>` | 校验错误（触发 `(onError)`） |

### `FormAction` 指令

```ts
import { FormAction } from "@analogjs/router";

@Component({
  imports: [FormAction],
  template: `
    <form
      method="post"
      (onSuccess)="handle($event)"
      (onError)="handleError($event)"
      (onStateChange)="onChange()"
    >
      <!-- ... -->
    </form>
  `,
})
```

| 事件 | 类型 | 触发 |
|---|---|---|
| `(onSuccess)` | `EventEmitter<any>` | server 返回 `json(...)` |
| `(onError)` | `EventEmitter<any>` | server 返回 `fail(...)` 或异常 |
| `(onStateChange)` | `EventEmitter<void>` | 表单 submit 开始 |

### Server Context Tokens（`@analogjs/router/tokens`）

```ts
import {
  injectRequest,
  injectResponse,
  injectBaseURL,
  injectAPIPrefix,
} from "@analogjs/router/tokens";
```

| 函数 | 返回 | 适用 |
|---|---|---|
| `injectRequest()` | `H3Event["node"]["req"] \| null` | SSR / API route |
| `injectResponse()` | `H3Event["node"]["res"] \| null` | SSR / API route |
| `injectBaseURL()` | `string \| null` | server base URL |
| `injectAPIPrefix()` | `string` | API 路径前缀（默认 `''`） |

```ts
@Injectable({ providedIn: "root" })
export class MyService {
  request = injectRequest();
  response = injectResponse();
  baseUrl = injectBaseURL();
  apiPrefix = injectAPIPrefix();

  setStatus(code: number) {
    if (this.response) {
      this.response.statusCode = code;
    }
  }
}
```

### `requestContextInterceptor`

`HttpClient` 拦截器——把相对 URL 转为绝对 URL：

```ts
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from "@angular/common/http";
import { requestContextInterceptor } from "@analogjs/router";

providers: [
  provideHttpClient(
    withFetch(),
    withInterceptors([
      // 其他拦截器
      requestContextInterceptor, // ⚠️ 必须放最后
    ])
  ),
];
```

### `RouteMeta`

每个 `*.page.ts` 可导出的元数据：

```ts
import type { RouteMeta } from "@analogjs/router";

interface RouteMeta {
  title?: string | ResolveFn<string>;
  meta?: MetaTag[] | ResolveFn<MetaTag[]>;
  canActivate?: CanActivateFn[];
  canActivateChild?: CanActivateChildFn[];
  canDeactivate?: CanDeactivateFn<unknown>[];
  canMatch?: CanMatchFn[];
  resolve?: Record<string, ResolveFn<any>>;
  providers?: Provider[];
  data?: Record<string, any>;
  redirectTo?: string;
  pathMatch?: "full" | "prefix";
}
```

示例：

```ts
import type { RouteMeta } from "@analogjs/router";
import { inject } from "@angular/core";
import { CanActivateFn } from "@angular/router";

import { AuthService } from "../auth.service";

const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn();
};

export const routeMeta: RouteMeta = {
  title: "Dashboard",
  canActivate: [authGuard],
  providers: [/* 路由级 providers */],
  meta: [
    { name: "description", content: "User dashboard" },
    { property: "og:title", content: "Dashboard" },
  ],
};
```

### `MetaTag`

```ts
interface MetaTag {
  name?: string;
  property?: string;
  content?: string;
  httpEquiv?: string;
  charset?: string;
  // 任意 HTML meta 属性
}
```

### `render(App, config)`

SSR 渲染入口（`@analogjs/router/server`）——`main.server.ts` 中使用：

```ts
// src/main.server.ts
import "@angular/platform-server/init";
import { render } from "@analogjs/router/server";

import { App } from "./app/app";
import { config } from "./app/app.config.server";

export default render(App, config);
```

> 内部封装了 `provideServerContext` + `renderApplication`——开发者无需手动配置。

## `@analogjs/content`：Markdown 内容

### `provideContent(...features)`

```ts
import { provideContent, withMarkdownRenderer } from "@analogjs/content";

providers: [provideContent(withMarkdownRenderer())];
```

### `withMarkdownRenderer(options?)`

启用 Markdown 渲染。

```ts
interface MarkdownRendererOptions {
  loadMermaid?: () => Promise<typeof import("mermaid")>;
}

provideContent(
  withMarkdownRenderer({
    loadMermaid: () => import("mermaid"),
  })
);
```

### `withPrismHighlighter()`

```ts
import { withPrismHighlighter } from "@analogjs/content/prism-highlighter";

provideContent(withMarkdownRenderer(), withPrismHighlighter());
```

样式：

```css
@import "prismjs/themes/prism.css";
```

### `withShikiHighlighter()`

```ts
import { withShikiHighlighter } from "@analogjs/content/shiki-highlighter";

provideContent(withMarkdownRenderer(), withShikiHighlighter());
```

配合 `vite.config.ts`：

```ts
analog({
  content: {
    highlighter: "shiki",
    shikiOptions: {
      highlight: { theme: "github-dark" },
      highlighter: {
        additionalLangs: ["diff", "yaml"],
        themes: ["github-dark", "github-light"],
      },
    },
  },
});
```

### `injectContent<T>(options?)`

读取单个 Markdown 文件（返回 `Observable<ContentFile<T>>`）：

```ts
function injectContent<T = Record<string, any>>(
  options?: InjectContentOptions | string
): Observable<ContentFile<T>>;

interface InjectContentOptions {
  param?: string; // 路由参数名（默认 'slug'）
  subdirectory?: string; // 在 src/content/{subdirectory}/ 下查找
  customFilename?: string; // 自定义文件名（不走路由参数）
}

interface ContentFile<T> {
  filename: string; // 完整路径
  slug: string; // frontmatter slug 或文件名
  attributes: T; // frontmatter 解析结果
  content: string; // 渲染后 HTML
}
```

```ts
// 默认按 :slug 参数读 src/content/{slug}.md
post$ = injectContent<PostAttributes>();

// 按 :slug 参数读 src/content/blog/{slug}.md
post$ = injectContent<PostAttributes>({
  param: "slug",
  subdirectory: "blog",
});

// 读固定文件
about$ = injectContent<AboutAttributes>({
  customFilename: "about",
});
```

### `injectContentFiles<T>(filterFn?)`

读取多个文件的 metadata（**不包含 content body**）：

```ts
function injectContentFiles<T = Record<string, any>>(
  filterFn?: InjectContentFilesFilterFunction<T>
): ContentFile<T>[];

type InjectContentFilesFilterFunction<T> = (
  contentFile: ContentFile<T>
) => boolean;
```

```ts
posts = injectContentFiles<PostAttributes>(
  (file) => file.filename.includes("/src/content/blog/")
);

// 排序
sortedPosts = computed(() =>
  this.posts.sort(
    (a, b) =>
      new Date(b.attributes.date).getTime() -
      new Date(a.attributes.date).getTime()
  )
);
```

> **注意**：`injectContentFiles` 返回值的 `.content` 字段是 `undefined`——只有 `injectContent` 才加载完整内容。

### `<analog-markdown>` 组件

```ts
import { MarkdownComponent } from "@analogjs/content";

@Component({
  imports: [MarkdownComponent],
  template: `<analog-markdown [content]="content" />`,
})
export class PostPage {
  content = "# Hello\n\nThis is **bold**.";
}
```

| Input | 类型 | 说明 |
|---|---|---|
| `content` | `string` | Markdown 字符串 |
| `classes` | `string` | 容器 class |

### `injectActivePostAttributes(route)`

在 resolver 中读取当前 Markdown 文件的 frontmatter（仅 SSR / Resolver 阶段）：

```ts
import { injectActivePostAttributes } from "@analogjs/content";
import type { ResolveFn } from "@angular/router";

const titleResolver: ResolveFn<string> = (route) => {
  const attrs = injectActivePostAttributes(route);
  return attrs.title;
};

export const routeMeta: RouteMeta = {
  title: titleResolver,
};
```

## h3：API Routes Handler API

API routes 基于 [h3](https://h3.unjs.io/)，常用 helper：

### `defineEventHandler(handler)`

```ts
import { defineEventHandler } from "h3";

export default defineEventHandler((event) => {
  return { hello: "world" };
});
```

异步：

```ts
export default defineEventHandler(async (event) => {
  const data = await fetch("https://example.com/api").then((r) => r.json());
  return data;
});
```

### `defineWebSocketHandler(handlers)`

```ts
import { defineWebSocketHandler } from "h3";

export default defineWebSocketHandler({
  open(peer) {
    /* ... */
  },
  message(peer, message) {
    /* ... */
  },
  close(peer) {
    /* ... */
  },
  error(peer, error) {
    /* ... */
  },
});
```

### 请求读取

| 函数 | 用途 |
|---|---|
| `getRouterParam(event, name)` | 读取路由动态段（`[name]`） |
| `getQuery(event)` | 读取 query string（返回对象） |
| `getRequestURL(event)` | 完整 URL（`URL` 对象） |
| `getRequestHeaders(event)` | 所有 headers |
| `getHeader(event, name)` | 单个 header |
| `readBody<T>(event)` | 读 JSON / form body |
| `readFormData(event)` | 读取 `FormData`（multipart / urlencoded） |
| `readMultipartFormData(event)` | 读 multipart（含文件） |
| `parseCookies(event)` | 读取所有 cookies（对象） |

### 响应写入

| 函数 | 用途 |
|---|---|
| `setHeader(event, name, value)` | 设单个 header |
| `setHeaders(event, headers)` | 设多个 headers |
| `setCookie(event, name, value, opts)` | 设 cookie |
| `deleteCookie(event, name)` | 删除 cookie |
| `setResponseStatus(event, code, text?)` | 设 status code |
| `sendRedirect(event, url, code?)` | 重定向（默认 302） |
| `createEventStream(event)` | 创建 SSE 流 |

### 错误抛出

```ts
import { createError } from "h3";

throw createError({
  statusCode: 400,
  statusMessage: "Bad Request",
  data: { field: "email" },
});
```

| 字段 | 类型 |
|---|---|
| `statusCode` | `number` |
| `statusMessage` | `string` |
| `data` | `any`（附加到响应 body） |
| `cause` | `Error`（原错误） |

## `vite.config.ts`：`analog()` 选项

```ts
import { defineConfig } from "vite";
import analog from "@analogjs/platform";

export default defineConfig({
  plugins: [
    analog({
      // ... 选项
    }),
  ],
});
```

### 完整选项接口

```ts
interface AnalogOptions {
  ssr?: boolean; // 默认 true
  static?: boolean; // 只输出静态文件（无 server runtime）
  liveReload?: boolean; // 启用 Angular HMR
  inlineStylesExtension?: "css" | "scss" | "sass" | "less";
  apiPrefix?: string; // API 路径前缀（默认 'api'）
  workspaceRoot?: string;

  // 文件替换（替代 angular.json 的 fileReplacements）
  fileReplacements?: Array<{ replace: string; with: string }>;

  // 内容配置
  content?: {
    highlighter?: "prism" | "shiki";
    prismOptions?: {
      additionalLangs?: string[];
    };
    shikiOptions?: {
      container?: string;
      highlight?: {
        theme?: string | { light: string; dark: string };
      };
      highlighter?: {
        langs?: string[];
        themes?: string[];
        additionalLangs?: string[];
        skipLangs?: string[];
      };
    };
  };

  // 预渲染配置
  prerender?: {
    routes?:
      | string[]
      | (() => Promise<Array<string | PrerenderRoute | PrerenderContentDir>>);
    postRenderingHooks?: Array<(route: PrerenderRoute) => Promise<void> | void>;
    sitemap?: {
      host: string;
    };
  };

  // Nitro 配置
  nitro?: {
    preset?: string; // 部署 preset
    routeRules?: Record<string, RouteRule>;
    experimental?: {
      websocket?: boolean;
    };
    logLevel?: "debug" | "info" | "warn" | "error";
    // 其他 Nitro 选项
    [key: string]: any;
  };
}
```

### 子类型：`PrerenderRoute`

```ts
type PrerenderRoute =
  | string
  | {
      route: string;
      staticData?: boolean;
      sitemap?: SitemapEntry;
      outputSourceFile?: string;
    };
```

### 子类型：`PrerenderContentDir`

```ts
interface PrerenderContentDir {
  contentDir: string;
  transform: (file: PrerenderContentFile) => string | false;
  recursive?: boolean;
  sitemap?: SitemapEntry | ((file: PrerenderContentFile) => SitemapEntry);
  outputSourceFile?: (file: PrerenderContentFile) => string | false;
}

interface PrerenderContentFile {
  name: string; // 文件名（不含扩展）
  attributes: Record<string, any>; // frontmatter
  content: string; // 文件内容
  relativePath: string; // 相对 contentDir 的目录
}

interface SitemapEntry {
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
}
```

### 子类型：`RouteRule`（Nitro）

```ts
interface RouteRule {
  ssr?: boolean; // 是否 SSR
  static?: boolean; // 是否预渲染
  prerender?: boolean;
  redirect?: { to: string; statusCode?: number };
  headers?: Record<string, string>;
  cache?: CacheOptions;
  cors?: boolean;
  // ... 其他
}
```

## 文件约定

### 应用代码

| 文件 | 路径 | 含义 |
|---|---|---|
| `src/main.ts` | — | client bootstrap |
| `src/main.server.ts` | — | server render 入口 |
| `src/app/app.ts` | — | 根组件（含 `<router-outlet />`） |
| `src/app/app.config.ts` | — | client `ApplicationConfig` |
| `src/app/app.config.server.ts` | — | server providers（merge 到 client config） |
| `src/styles.css` | — | 全局样式（被 `index.html` 引用） |
| `src/test-setup.ts` | — | Vitest 测试初始化 |
| `index.html` | — | HTML 模板（Vite 处理） |

### 路由文件

| 文件 | 路径 | 含义 |
|---|---|---|
| `src/app/pages/(home).page.ts` | `/` | 首页 |
| `src/app/pages/index.page.ts` | `/` | 首页（等价写法） |
| `src/app/pages/about.page.ts` | `/about` | 静态路由 |
| `src/app/pages/about/team.page.ts` | `/about/team` | 嵌套（文件夹） |
| `src/app/pages/about.team.page.ts` | `/about/team` | 嵌套（点号） |
| `src/app/pages/products/[id].page.ts` | `/products/:id` | 动态段 |
| `src/app/pages/products.[id].page.ts` | `/products/:id` | 动态段（点号） |
| `src/app/pages/products.page.ts` + `products/` | `/products` + 子 | Layout 路由 |
| `src/app/pages/(auth)/login.page.ts` | `/login` | 路由组（不影响 URL） |
| `src/app/pages/(auth).page.ts` + `(auth)/` | 共享 layout | Pathless Layout |
| `src/app/pages/[...not-found].page.ts` | `**` | Catch-all |
| `src/app/pages/about.md` | `/about` | Markdown 路由 |
| `*.server.ts` | — | 与同名 `.page.ts` 配对的 server load/action |
| `*.spec.ts` | — | Vitest 测试文件 |

### Server 文件

| 文件 | 路径 | 含义 |
|---|---|---|
| `src/server/routes/api/hello.ts` | `/api/hello` | 任意方法 API |
| `src/server/routes/api/users.get.ts` | `GET /api/users` | 限定 GET |
| `src/server/routes/api/users.post.ts` | `POST /api/users` | 限定 POST |
| `src/server/routes/api/users/[id].ts` | `/api/users/:id` | 动态段 |
| `src/server/routes/api/[...].ts` | `/api/**` | Catch-all |
| `src/server/routes/api/sitemap.xml.ts` | `/api/sitemap.xml` | 自定义文件名 |
| `src/server/routes/api/ws/chat.ts` | `ws://.../api/ws/chat` | WebSocket（需启用） |
| `src/server/middleware/1.auth.ts` | — | 中间件（数字前缀控制顺序） |

### 内容文件

| 文件 | 路径 | 含义 |
|---|---|---|
| `src/content/` | — | 默认 content 目录 |
| `src/content/blog/*.md` | — | `injectContent({ subdirectory: 'blog' })` 读取 |
| `src/app/pages/*.md` | URL 同名 | Markdown 路由 |

### 配置文件

| 文件 | 用途 |
|---|---|
| `vite.config.ts` | Vite + analog 主配置 |
| `tsconfig.json` | TypeScript 根配置 |
| `tsconfig.app.json` | 应用 tsconfig（含 `include` 路径） |
| `tsconfig.spec.json` | 测试 tsconfig |
| `angular.json` | Angular CLI 项目配置（保留，使用 Analog builder） |
| `package.json` | scripts: `dev` / `build` / `test` / `preview` |
| `index.html` | HTML 模板 |
| `.env` / `.env.local` | 环境变量（`VITE_*` 公开，其他仅 server） |

## Nitro Preset 速查

| Preset | 平台 | 输出 |
|---|---|---|
| `node-server` | Node.js standalone（默认） | `dist/analog/server/index.mjs` |
| `node-cluster` | Node.js cluster 模式 | 同上 + cluster |
| `vercel` | Vercel Serverless | `.vercel/output/` |
| `vercel-edge` | Vercel Edge Functions | `.vercel/output/` |
| `netlify` | Netlify Functions | `netlify/functions/` |
| `netlify-edge` | Netlify Edge | `netlify/edge-functions/` |
| `cloudflare-pages` | Cloudflare Pages | `dist/analog/public/` + workers |
| `cloudflare` | Cloudflare Workers | Workers script |
| `cloudflare-module` | Cloudflare Workers (Module) | ESM Workers |
| `firebase` | Firebase Cloud Functions | `dist/analog/server/` |
| `aws-lambda` | AWS Lambda | Lambda handler |
| `azure` | Azure Functions | Functions runtime |
| `azure-static` | Azure Static Web Apps | 静态 + API |
| `deno-server` | Deno Deploy | Deno script |
| `bun` | Bun runtime | Bun-compatible bundle |
| `github-pages` | GitHub Pages（SSG） | 纯静态 |
| `static` | 纯静态 | `dist/analog/public/` |
| `render-com` | Render.com | Node + static |
| `digital-ocean` | DigitalOcean App Platform | Node 服务 |
| `edgio` | Edgio | Edgio runtime |
| `zerops` | Zerops | Node 服务（官方合作） |

> 完整 Nitro Preset 列表见 [Nitro 部署文档](https://nitro.unjs.io/deploy)。

## 切换 Preset 的两种方式

**方式 1：环境变量（推荐）**

```bash
BUILD_PRESET=vercel npm run build
```

**方式 2：`vite.config.ts`**

```ts
analog({
  nitro: {
    preset: "vercel",
  },
});
```

## 环境变量

| 变量名 | 用途 |
|---|---|
| `VITE_*` | client 可见的环境变量（`import.meta.env['VITE_X']`） |
| 无前缀 | 仅 server 可访问（`process.env['X']`） |
| `BUILD_PRESET` | Nitro 部署 preset |
| `NITRO_PORT` / `PORT` | Node server 端口（默认 3000） |
| `NITRO_HOST` / `HOST` | Node server 主机 |
| `NITRO_APP_BASE_URL` | 子路径部署的 base URL |
| `VITE_ANALOG_PUBLIC_BASE_URL` | server-side data fetching 的 base URL |

## 常用集成包

### `@analogjs/trpc`：tRPC 集成

```bash
npm install @analogjs/trpc @trpc/server @trpc/client
```

```ts
// src/trpc/router.ts
import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

export const appRouter = t.router({
  hello: t.procedure.query(() => "Hello tRPC"),
});

export type AppRouter = typeof appRouter;
```

```ts
// src/app/app.config.ts
import { provideTrpcClient } from "@analogjs/trpc";

providers: [
  provideTrpcClient({
    url: "/api/trpc",
  }),
];
```

```ts
// 组件中调用
import { injectTrpcClient } from "@analogjs/trpc";

class MyComponent {
  trpc = injectTrpcClient();
  greeting = this.trpc.hello.query();
}
```

### `@analogjs/astro-angular`：Astro Island

```bash
npx astro add @analogjs/astro-angular
```

Astro 配置：

```ts
// astro.config.mjs
import { defineConfig } from "astro/config";
import angular from "@analogjs/astro-angular";

export default defineConfig({
  integrations: [angular()],
});
```

Astro 页面：

```astro
---
import Counter from "../components/Counter";
---

<html>
  <body>
    <Counter client:visible />
  </body>
</html>
```

### `@analogjs/platform:vite`（库 builder）

```json
// project.json
{
  "architect": {
    "build": {
      "builder": "@analogjs/platform:vite",
      "options": {
        "configFile": "vite.config.ts",
        "outputPath": "dist/my-lib"
      }
    }
  }
}
```

```ts
// vite.config.ts
import angular from "@analogjs/vite-plugin-angular";

export default defineConfig({
  plugins: [angular()],
  build: {
    lib: {
      entry: "src/public-api.ts",
      formats: ["es"],
    },
  },
});
```

### `nxCopyAssetsPlugin`：拷贝额外资源

```ts
import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";

plugins: [
  analog(),
  nxCopyAssetsPlugin(["*.md", "package.json", "LICENSE"]),
];
```

## 命名约定

| 类型 | 推荐 | 示例 |
|---|---|---|
| 组件 class | PascalCase | `Counter` / `UserCard` |
| 组件 selector | `app-` 前缀 + kebab | `app-counter` / `app-user-card` |
| 路由文件 | kebab-case + `.page.ts` | `user-list.page.ts` |
| Server Load 文件 | 与 page 同名 + `.server.ts` | `index.server.ts` |
| API route | kebab-case | `user-profile.ts` |
| Service | PascalCase + `Service` 后缀 | `UserService` |
| Resolver 函数 | camelCase + `Resolver` 后缀 | `userResolver` |
| Frontmatter 字段 | camelCase 或 kebab-case | `coverImage` / `cover-image` |
| Content slug | kebab-case + 可选日期前缀 | `2026-01-01-hello-world` |

## Vitest 配置

Analog 项目的 Vitest 配置合并在 `vite.config.ts`：

```ts
/// <reference types="vitest" />
import { defineConfig } from "vite";
import analog from "@analogjs/platform";

export default defineConfig({
  plugins: [analog()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/test-setup.ts"],
    include: ["**/*.spec.ts"],
    reporters: ["default"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["**/*.spec.ts", "**/*.server.ts"],
    },
  },
});
```

### `src/test-setup.ts`

```ts
import "@analogjs/vitest-angular/setup-zoneless";
// 或：import '@analogjs/vitest-angular/setup-snapshots';

import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";

TestBed.initTestEnvironment(
  [], // platform modules
  { providers: [provideZonelessChangeDetection()] }
);
```

### 组件测试示例

```ts
import { describe, expect, it } from "vitest";
import { TestBed } from "@angular/core/testing";

import HomePage from "./pages/(home).page";

describe("HomePage", () => {
  it("应该渲染欢迎标题", async () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const h1 = fixture.nativeElement.querySelector("h1");
    expect(h1.textContent).toContain("Welcome");
  });
});
```

## TypeScript 类型导出速查

### `@analogjs/router`

```ts
export {
  // 配置
  provideFileRouter,
  withExtraRoutes,
  withDebugRoutes,
  requestContextInterceptor,
  // Load
  injectLoad,
  getLoadResolver,
  // 表单
  FormAction,
  // 类型
  RouteMeta,
  PageServerLoad,
  LoadResult,
};
```

### `@analogjs/router/server/actions`

```ts
export { json, redirect, fail, PageServerAction };
```

### `@analogjs/router/server`

```ts
export { render };
```

### `@analogjs/router/tokens`

```ts
export { injectRequest, injectResponse, injectBaseURL, injectAPIPrefix };
```

### `@analogjs/content`

```ts
export {
  provideContent,
  withMarkdownRenderer,
  injectContent,
  injectContentFiles,
  injectActivePostAttributes,
  MarkdownComponent,
  // 类型
  ContentFile,
  InjectContentOptions,
  InjectContentFilesFilterFunction,
};
```

### `@analogjs/content/prism-highlighter`

```ts
export { withPrismHighlighter };
```

### `@analogjs/content/shiki-highlighter`

```ts
export { withShikiHighlighter };
```

### `@analogjs/platform`

```ts
export default analog; // Vite plugin
export { AnalogOptions, PrerenderContentFile, PrerenderRoute };
```

## 实用脚本片段

### 启动 dev + 调试 routes

```bash
npm run start
# 等待启动后，浏览器访问：
# - 应用：http://localhost:5173
# - 路由调试：http://localhost:5173/__analog/routes
```

### 构建 + 本地预览生产

```bash
npm run build
npm run preview
# Listening on http://localhost:3000
```

### 切换部署 preset 构建

```bash
# Cloudflare Pages
BUILD_PRESET=cloudflare-pages npm run build

# Vercel
BUILD_PRESET=vercel npm run build

# Static SSG
BUILD_PRESET=static npm run build
```

### 测试 + 覆盖率

```bash
npm test                    # watch 模式
npx vitest run              # 单次跑
npx vitest run --coverage   # 覆盖率
```

### Cloudflare Pages 本地预览

```bash
BUILD_PRESET=cloudflare-pages npm run build
npx wrangler pages dev ./dist/analog/public
```

### Firebase 模拟器

```bash
BUILD_PRESET=firebase npm run build
firebase emulators:start
```

## 与同类元框架对比

| 维度 | Analog 1.x/2.x | Nuxt 3 | Next.js 15 | SolidStart 1.x | SvelteKit 2.x |
|---|---|---|---|---|---|
| 底层框架 | Angular | Vue 3 | React | Solid | Svelte |
| 构建工具 | **Vite + Nitro** | Vite + Nitro | Webpack/Turbopack | Vite + Nitro | Vite + Nitro |
| 测试 | **Vitest** | Vitest | Jest | Vitest | Vitest |
| 文件路由 | `src/app/pages/*.page.ts` | `pages/*.vue` 或 `app/*.vue` | `app/*/page.tsx` | `routes/*.tsx` | `routes/+page.svelte` |
| Server Routes | `src/server/routes/api/` | `server/api/` | `app/api/route.ts` | `routes/api/` | `+server.ts` |
| Server Data | `load()` + `injectLoad` | `useFetch` / `useAsyncData` | RSC / loaders | `query()` + `createAsync` | `+page.server.ts` `load()` |
| Form Actions | `FormAction` + `action()` | server | Server Actions | `action()` | `+page.server.ts` `actions` |
| Markdown 路由 | `.md` 直接作路由 | `@nuxt/content` | `MDX` | `vinxi/markdown` | `mdsvex` |
| 部署 preset 数 | 17+（Nitro） | 17+（Nitro） | 主要 Vercel | 17+（Nitro） | 17+（adapter） |
| SSG | `prerender.routes` | `nitro.prerender` | `generateStaticParams` | `vite.config` | `prerender = true` |
| RSC | ❌ | ❌ | ✅ | ❌ | ❌ |
| Island 架构（在 Astro 中） | ✅ `@analogjs/astro-angular` | ❌ | ❌ | ❌ | ❌ |

## 进一步阅读

- [Analog 官网](https://analogjs.org/) | [文档](https://analogjs.org/docs)
- [Nitro 文档](https://nitro.unjs.io/) — 部署 preset 详解
- [h3 文档](https://h3.unjs.io/) — API route handler API
- [Vitest 文档](https://vitest.dev/) — 测试框架
- [Angular 文档](https://angular.dev/) — 底层框架
- [@analogjs/analog GitHub](https://github.com/analogjs/analog) — 源码 + examples
- [Discord 社区](https://chat.analogjs.org) — 实时讨论
