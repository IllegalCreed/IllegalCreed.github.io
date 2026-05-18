---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Analog v1.x / v2.x（`@analogjs/platform` / `@analogjs/router` / `@analogjs/content`）+ Angular v17/v18/v19/v20+ + Vite v5/v6/v8 + Nitro v2 编写。Analog 紧贴 Angular 版本演进，本文按官方 `template-latest` 模板讲解。

## 速查

- 系统要求：**Node.js v18.13.0+**（推荐 v20 LTS / v22 LTS）+ **Angular v15+**（推荐 v17+ 以使用 standalone API + 控制流语法）
- 创建项目：`npm create analog@latest`（npm / yarn / pnpm / bun 同理）
- 启动 dev server：`npm run start`（端口 **5173**，Vite 默认）
- 生产构建：`npm run build`（产物：`dist/analog/public/` 客户端 + `dist/analog/server/` 服务端入口）
- 预览：`npm run preview`（启动 `node dist/analog/server/index.mjs`）
- 单元测试：`npm test`（Vitest）
- 核心包：`@analogjs/platform`（Vite 插件 + Nitro 集成）/ `@analogjs/router`（文件路由 + Server Load）/ `@analogjs/content`（Markdown）
- 第一个组件：`@Component({ standalone: true, template: '...' })`
- 第一个路由：`src/app/pages/(home).page.ts` → `/`
- 静态路由：`src/app/pages/about.page.ts` → `/about`
- 动态路由：`src/app/pages/products/[id].page.ts` → `/products/:id`
- 路由组：`src/app/pages/(auth)/login.page.ts` → `/login`（不带 `auth` 段）
- 兜底：`src/app/pages/[...not-found].page.ts` → 通配符 `**`
- Server Data：`src/app/pages/index.server.ts` 中导出 `async load()`，组件中 `injectLoad<typeof load>()`
- API Route：`src/server/routes/api/hello.ts` → `GET /api/hello`
- 表单 Action：`src/app/pages/contact.server.ts` 中导出 `async action()`，组件中 `<form method="post" (onSuccess)="..." />` 加 `FormAction` 指令
- Markdown 路由：`src/app/pages/about.md` 直接成为 `/about` 页面
- 调试路由：`provideFileRouter(withDebugRoutes())` → 访问 `__analog/routes` 看完整路由表

## Analog 是「Angular 元框架」不是「Angular 替代品」

理解 Analog 必须先理解它**不替代 Angular**——它是 **Angular 之上的生产力层**：

| 维度 | Analog 1.x/2.x | Angular CLI | Nuxt 3 | Next.js 15 | SolidStart 1.x |
|---|---|---|---|---|---|
| 底层框架 | **Angular** | Angular | Vue 3 | React | Solid |
| 构建工具 | **Vite + Nitro** | esbuild + Webpack | Vite + Nitro | Webpack/Turbopack | Vite + Nitro |
| 测试 | **Vitest** | Karma / Jasmine | Vitest | Jest | Vitest |
| 文件路由 | **是（`*.page.ts`）** | 否（手动） | 是（`pages/`） | 是（`app/`） | 是（`routes/`） |
| Server Routes | **是（h3）** | 无 | 是（h3） | Route Handlers | 是 |
| Server Data | **`load()` + `injectLoad`** | 无 | `useFetch` / `useAsyncData` | RSC / `loader` | `query()` / `createAsync` |
| Form Actions | **`FormAction` + `action()`** | 无 | server | Server Actions | `action()` |
| Markdown 路由 | **`*.md` 文件** | 无 | `@nuxt/content` | MDX | `vinxi/markdown` |
| SSR | **默认开启** | 需 Universal | 默认 | 默认 | 默认 |
| SSG / Prerender | **`prerender.routes`** | 需 Universal + scully | 是 | 是 | 是 |
| 部署 preset | **Nitro 17+ presets** | 无 | Nitro | Vercel/Node | Nitro 17+ |
| 与底层 CLI 共存 | **保留 `angular.json`** | 原生 | 替代 | 替代 | 替代 |

**含义**：

- Analog **不创造新的组件模型**——你写的依然是 Angular Standalone Component / Signals / RxJS / DI / HttpClient
- **不替代 Angular CLI**：Analog 项目里依然保留 `angular.json`、`ng` 命令、`ng generate component` 等 CLI 工作流
- **替代构建工具链**：用 `@analogjs/platform:vite` builder 替代默认的 `@angular-devkit/build-angular:application`
- **新增能力**：文件路由 + Server Routes + Server Load + Form Actions + Markdown Content + Nitro 部署
- **适合**：希望用 Angular 但需要全栈能力 / 需要 SSR 但嫌 Universal 繁琐 / 需要 SSG 博客或文档站点 / Nx 大型 monorepo 项目
- **不适合**：纯 SPA 不需要服务端 / 项目深度依赖 NgModule（Analog 强烈推荐 standalone API）

## 安装与首次启动

### 创建新项目

最简单的起点：

```bash
npm create analog@latest
# 或：pnpm create analog / yarn create analog / bun create analog
```

交互式菜单：

```
✔ Project name (or '.' to scaffold in the current directory) … my-app
✔ Which Angular version would you like to use? › Angular 20+ (latest)
✔ Select a template:
  ❯ Full-stack Application (Default Analog application)
    Blog (Default template enhanced with a blog example)
    Minimal (Bare-bones template)
✔ Add Tailwind CSS? › No
```

带 flags 直接指定模板：

```bash
# 默认全栈
npm create analog@latest my-app -- --template latest

# 博客模板（含 Markdown 内容路由示例）
npm create analog@latest my-app -- --template blog

# 极简模板
npm create analog@latest my-app -- --template minimal
```

完成后：

```bash
cd my-app
npm install   # 已自动执行
npm run start
# 浏览器访问 http://localhost:5173
```

> **模板选择建议**
>
> - **Full-stack Application（推荐新手）**：含 demo 路由 + `analog-welcome` 组件 + 完整 SSR 配置
> - **Blog**：含 `src/content/` Markdown 文件 + `injectContentFiles` 列表页 + `injectContent` 详情页——博客 / 文档站点起点
> - **Minimal**：仅 `<router-outlet>` + 一个空 `(home).page.ts`——希望从零开始时选

### Node 版本要求

```bash
node -v   # 必须 ≥ 18.13.0，推荐 v20 LTS 或 v22 LTS
```

如未安装：

```bash
nvm install --lts && nvm use --lts
```

> **注意**：Analog 2.x 的 `package.json` 中 `"engines": { "node": ">=20.19.1" }`——较新版本要求 Node 20+。

### 关键脚本（package.json）

| 脚本 | 命令 | 用途 |
|---|---|---|
| `start` | `vite` | 开发模式（SSR + HMR，端口 5173） |
| `dev` | `vite` | 等价 start |
| `ng` | `ng` | Angular CLI（用于 `ng generate component` 等） |
| `build` | `vite build` | 完整构建（client 到 `dist/analog/public`，server 到 `dist/analog/server`） |
| `watch` | `vite build --watch` | 监听模式构建 |
| `test` | `vitest` | 单元测试（Vitest + jsdom） |
| `preview` | `node dist/analog/server/index.mjs` | 启动生产服务（端口 3000） |

> **没有单独的 `dev:server` 脚本**：Vite + Nitro 的开发服务器一体化运行，同时处理 SSR 和 API routes。

## 项目结构

最常见的 Analog v2 项目：

```
my-app/
├── src/
│   ├── app/                              # ✨ Angular 应用代码（核心）
│   │   ├── pages/                        # ✨ 文件路由根目录
│   │   │   ├── (home).page.ts            # 首页 (/)
│   │   │   ├── about.page.ts             # /about
│   │   │   ├── products/
│   │   │   │   ├── (products-list).page.ts   # /products
│   │   │   │   └── [id].page.ts          # /products/:id
│   │   │   ├── products.page.ts          # /products + /products/:id 共享 layout
│   │   │   ├── blog/
│   │   │   │   ├── (blog-list).page.ts   # /blog
│   │   │   │   └── posts.[slug].page.ts  # /blog/posts/:slug
│   │   │   ├── analog-welcome.ts         # 演示组件（非路由）
│   │   │   └── [...not-found].page.ts    # 404 兜底
│   │   ├── app.ts                        # 根组件 <router-outlet>
│   │   ├── app.config.ts                 # client 应用配置
│   │   └── app.config.server.ts          # server 应用配置（merge）
│   ├── server/                           # ✨ Nitro 服务端代码
│   │   ├── routes/
│   │   │   └── api/                      # API endpoints → /api/*
│   │   │       ├── hello.ts              # GET /api/hello
│   │   │       └── v1/
│   │   │           └── todos.ts          # GET /api/v1/todos
│   │   └── middleware/                   # 服务端中间件
│   │       └── 1.auth.ts                 # 编号前缀控制执行顺序
│   ├── content/                          # Markdown 内容文件（可选）
│   │   └── blog/
│   │       └── 2026-01-hello.md
│   ├── main.ts                           # 浏览器 bootstrap 入口
│   ├── main.server.ts                    # 服务端 render 入口
│   ├── styles.css                        # 全局样式
│   ├── test-setup.ts                     # Vitest 测试设置
│   └── vite-env.d.ts                     # Vite 类型声明
├── public/                               # 静态资源（拷贝到 dist 根）
│   ├── favicon.ico
│   └── robots.txt
├── index.html                            # 入口 HTML（Vite 处理）
├── angular.json                          # Angular CLI 配置（保留）
├── vite.config.ts                        # ✨ Vite + analog 主配置
├── tsconfig.json                         # 根 tsconfig
├── tsconfig.app.json                     # 应用 tsconfig
├── tsconfig.spec.json                    # 测试 tsconfig
└── package.json
```

### 核心入口文件

#### `src/main.ts`（client bootstrap）

```ts
// src/main.ts
import { bootstrapApplication } from "@angular/platform-browser";

import { App } from "./app/app";
import { appConfig } from "./app/app.config";

bootstrapApplication(App, appConfig);
```

#### `src/main.server.ts`（server render）

```ts
// src/main.server.ts
import "@angular/platform-server/init";
import { render } from "@analogjs/router/server";

import { App } from "./app/app";
import { config } from "./app/app.config.server";

export default render(App, config);
```

**关键观察**：

- `bootstrapApplication` + `provideFileRouter()`：Standalone API + 文件路由，无 NgModule
- `render(App, config)`：`@analogjs/router/server` 内置的 SSR 渲染器，封装 `renderApplication`
- `provideServerContext` 已经在 `render` 内部完成——你不需要手动注入

#### `src/app/app.config.ts`（client 配置）

```ts
// src/app/app.config.ts
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from "@angular/common/http";
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from "@angular/core";
import {
  provideClientHydration,
  withEventReplay,
} from "@angular/platform-browser";
import { provideFileRouter, requestContextInterceptor } from "@analogjs/router";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideFileRouter(),
    provideHttpClient(
      withFetch(),
      withInterceptors([requestContextInterceptor])
    ),
    provideClientHydration(withEventReplay()),
  ],
};
```

**核心点**：

- `provideFileRouter()`：Analog 的文件路由提供方——会自动扫描 `src/app/pages/*.page.ts`
- `provideHttpClient(withFetch(), withInterceptors([requestContextInterceptor]))`：使用 fetch + Analog 拦截器（**`requestContextInterceptor` 必须放在数组最后**，它将相对 URL 转换为绝对 URL）
- `provideClientHydration(withEventReplay())`：启用 hydration + 事件回放（用户在 hydration 完成前点击的事件不会丢失）

#### `src/app/app.config.server.ts`（server 配置）

```ts
// src/app/app.config.server.ts
import { mergeApplicationConfig, ApplicationConfig } from "@angular/core";
import { provideServerRendering } from "@angular/platform-server";

import { appConfig } from "./app.config";

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering()],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

**关键点**：

- `mergeApplicationConfig(appConfig, serverConfig)`：合并 client 配置 + server 端特有 providers
- `provideServerRendering()`：启用 SSR 渲染（Angular 19+ 后是 standalone）

#### `src/app/app.ts`（根组件）

```ts
// src/app/app.ts
import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "app-root",
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: `
    :host {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }
  `,
})
export class App {}
```

> Analog 2.x 项目默认所有组件都是 standalone（`@Component({ standalone: true })` 在 Angular 19+ 后可省略，因为 `standalone` 已成为默认值）。

### `vite.config.ts`（核心配置）

```ts
/// <reference types="vitest" />
import { defineConfig } from "vite";
import analog from "@analogjs/platform";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    target: ["es2020"],
  },
  resolve: {
    mainFields: ["module"],
  },
  plugins: [
    // 核心：analog() 插件——同时启用：
    // 1. @analogjs/vite-plugin-angular（Angular 编译）
    // 2. @analogjs/vite-plugin-nitro（API routes + SSR + 部署 preset）
    // 3. 文件路由扫描
    // 4. Markdown content 加载
    analog(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/test-setup.ts"],
    include: ["**/*.spec.ts"],
    reporters: ["default"],
  },
}));
```

**关键观察**：

- `analog()` 接受可选配置对象（详见指南）：`prerender` / `nitro` / `content` / `ssr` / `static` / `fileReplacements` / `liveReload`
- 不需要单独的 `vitest.config.ts`——Vitest 配置直接放在 `vite.config.ts` 的 `test` 字段
- 不需要 `resolve.alias`——Angular 路径别名通过 `tsconfig.json` 的 `paths` + `vite-tsconfig-paths` 插件处理

### `angular.json`（保留，使用 Analog builder）

```json
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "builder": "@analogjs/platform:vite",
          "options": {
            "configFile": "vite.config.ts",
            "main": "src/main.ts",
            "outputPath": "dist/client",
            "tsConfig": "tsconfig.app.json"
          }
        },
        "serve": {
          "builder": "@analogjs/platform:vite-dev-server",
          "options": {
            "buildTarget": "my-app:build",
            "port": 5173
          }
        },
        "test": {
          "builder": "@analogjs/vitest-angular:test"
        }
      }
    }
  }
}
```

> **意义**：保留 `angular.json` 意味着 `ng build` / `ng serve` / `ng generate component` 等命令依然可用——Analog 的 builder 把这些命令底层切到 Vite。

## 第一个组件

Analog 的组件就是普通 Angular 组件——只需要使用 `standalone: true`（Angular 19+ 后默认）：

```ts
// src/app/counter.ts
import { Component, signal } from "@angular/core";

/**
 * 简单计数器组件
 * - 使用 Angular Signals（v17+）
 * - 控制流语法 @if / @for / @switch（v17+）
 * - 默认 standalone
 */
@Component({
  selector: "app-counter",
  template: `
    <div>
      <button (click)="increment()">Clicked {{ count() }} times</button>
      @if (count() > 5) {
        <p>You clicked more than 5 times!</p>
      }
    </div>
  `,
})
export class Counter {
  count = signal(0);

  increment() {
    this.count.update((c) => c + 1);
  }
}
```

在路由中使用：

```ts
// src/app/pages/(home).page.ts
import { Component } from "@angular/core";
import { Counter } from "../counter";

@Component({
  selector: "app-home",
  imports: [Counter],
  template: `
    <section>
      <h1>Welcome to Analog</h1>
      <app-counter />
    </section>
  `,
})
export default class Home {}
```

**核心点**：

- 路由组件**必须是 `default export`**（`export default class`）——Analog 通过 `loadComponent` 自动 lazy load
- 必须使用 `imports: []` 显式引入子组件（standalone 模式下不再有 `declarations`）
- Signals + `@if` / `@for` 在 Angular 17+ 下推荐
- 选择器命名仍遵循 `app-` 前缀（在 `angular.json` 的 `prefix` 配置）

## 第一个路由

Analog 文件路由用 `src/app/pages/*.page.ts` 文件——目录与文件名映射到 URL。

### Index 路由

首页 `/` 用 `(home).page.ts` 或 `index.page.ts`：

```ts
// src/app/pages/(home).page.ts → /
import { Component } from "@angular/core";

@Component({
  template: `<h2>Welcome Home</h2>`,
})
export default class HomePageComponent {}
```

> **括号语法**：`(home)` 中的 `home` 是「文件名标签」，不影响 URL—— `(home).page.ts` 和 `index.page.ts` 等价生成 `/` 路由。括号语法可读性更好，看到 `(home).page.ts` 立刻知道是首页。

### 静态路由

```ts
// src/app/pages/about.page.ts → /about
import { Component } from "@angular/core";

@Component({
  template: `
    <h2>About Analog</h2>
    <p>Analog is a meta-framework on top of Angular.</p>
  `,
})
export default class AboutPageComponent {}
```

嵌套静态路由有两种写法：

```treeview
# 方式 1：嵌套文件夹
src/app/pages/about/team.page.ts        → /about/team

# 方式 2：点号
src/app/pages/about.team.page.ts        → /about/team
```

两种方式等价，**点号写法更扁平**，文件夹写法适合需要嵌套 layout 的场景。

### 动态路由

参数用 `[xxx]` 方括号：

```ts
// src/app/pages/products/[productId].page.ts → /products/:productId
import { Component, inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AsyncPipe } from "@angular/common";
import { map } from "rxjs";

@Component({
  imports: [AsyncPipe],
  template: `
    <h2>Product Details</h2>
    <p>ID: {{ productId$ | async }}</p>
  `,
})
export default class ProductDetailsPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly productId$ = this.route.paramMap.pipe(
    map((params) => params.get("productId"))
  );
}
```

> 注意 Angular 模板中的 <span v-pre>`{{ productId$ | async }}`</span> 是 Angular 插值语法（与组件类的属性绑定），不是 Vue 的 `{{ }}` ——在 VitePress 中如果出现在内联反引号里必须用 `<span v-pre>` 包裹避免被 Vue 编译。

#### 使用 Component Input Bindings（推荐）

Angular Router 的 `withComponentInputBinding()` 让动态参数变成 Input——大幅简化代码：

```ts
// src/app/app.config.ts
import { provideFileRouter } from "@analogjs/router";
import { withComponentInputBinding } from "@angular/router";

export const appConfig: ApplicationConfig = {
  providers: [
    provideFileRouter(withComponentInputBinding()),
    // ... 其他 providers
  ],
};
```

然后：

```ts
// src/app/pages/products/[productId].page.ts
import { Component, Input } from "@angular/core";

@Component({
  template: `
    <h2>Product Details</h2>
    <p>ID: {{ productId }}</p>
  `,
})
export default class ProductDetailsPageComponent {
  @Input() productId!: string;
}
```

**核心点**：Input 名必须与方括号中的参数名一致（`[productId]` ↔ `productId`）。

### 路由组（不影响 URL）

`(group)/` 括号文件夹将路由分组但不增加 URL 段：

```treeview
src/
└── app/
    └── pages/
        └── (auth)/
            ├── login.page.ts       → /login
            └── signup.page.ts      → /signup
```

`(auth)` 不出现在 URL 里——常用于按业务域组织文件，或与 Pathless Layout（同名 `(auth).page.ts`）配合实现共享布局。

### Catch-all 兜底

`[...xxx]` 三个点匹配任意路径（用于 404 等）：

```ts
// src/app/pages/[...not-found].page.ts → 通配符 **
import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { injectResponse } from "@analogjs/router/tokens";
import type { RouteMeta } from "@analogjs/router";

export const routeMeta: RouteMeta = {
  title: "Page Not Found",
  canActivate: [
    () => {
      const response = injectResponse();
      if (import.meta.env.SSR && response) {
        // 在 SSR 时设置 HTTP 404 状态码
        response.statusCode = 404;
        response.end();
      }
      return true;
    },
  ],
};

@Component({
  imports: [RouterLink],
  template: `
    <h2>Page Not Found</h2>
    <a routerLink="/">Go Back Home</a>
  `,
})
export default class PageNotFoundComponent {}
```

**核心点**：

- `routeMeta` 与组件同文件导出（**命名导出**），Analog 自动合并到路由配置
- `injectResponse()`（来自 `@analogjs/router/tokens`）在 SSR 中拿到 H3 Response 对象，可直接设状态码
- `import.meta.env.SSR` 是 Vite 提供的常量——dev/build 时分别值不同

### 链接与导航

使用 Angular Router 标准 API：

```ts
import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive, Router } from "@angular/router";
import { inject } from "@angular/core";

@Component({
  selector: "app-nav",
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav>
      <!-- 声明式：RouterLink + RouterLinkActive 高亮 -->
      <a routerLink="/" routerLinkActive="active">Home</a>
      <a routerLink="/about" routerLinkActive="active">About</a>
      <a [routerLink]="['/products', productId]">Product</a>

      <!-- 编程式 -->
      <button (click)="goToDashboard()">Go Dashboard</button>
    </nav>
  `,
})
export class NavComponent {
  productId = "1";
  private router = inject(Router);

  goToDashboard() {
    this.router.navigate(["/dashboard"]);
  }
}
```

## 第一个 Server Load

服务端数据加载——`*.server.ts` 中导出 `async load` 函数：

```ts
// src/app/pages/products/[id].server.ts
import type { PageServerLoad } from "@analogjs/router";

/**
 * 服务端数据加载器
 * - 仅在服务器端执行（不打包到 client）
 * - 每次导航到该路由时触发
 * - 返回值通过 injectLoad<typeof load>() 提供给组件
 */
export const load = async ({
  params,    // 路由参数
  req,       // H3 Request
  res,       // H3 Response
  fetch,     // 内置 fetch，直连内部 API
  event,     // 完整请求事件
}: PageServerLoad) => {
  const id = params["id"];
  const product = await fetch<{ id: string; name: string; price: number }>(
    `/api/v1/products/${id}`
  );

  return {
    product,
    loaded: true,
  };
};
```

组件中使用 `injectLoad`：

```ts
// src/app/pages/products/[id].page.ts
import { Component } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { injectLoad } from "@analogjs/router";

import type { load } from "./[id].server"; // 仅类型导入，不会进入 client bundle

@Component({
  template: `
    @if (data(); as d) {
      <article>
        <h1>{{ d.product.name }}</h1>
        <p>Price: \${{ d.product.price }}</p>
      </article>
    }
  `,
})
export default class ProductDetailsComponent {
  // 用 toSignal 把 Resolver Observable 转为 Signal
  data = toSignal(injectLoad<typeof load>(), { requireSync: true });
}
```

**核心点**：

- `import type { load }`：**类型导入**——Vite 在 client 构建时会移除这行，避免 `*.server.ts` 中的 server-only 代码（如 DB 客户端）泄漏到浏览器
- `injectLoad<typeof load>()`：泛型推断返回 Observable，配合 `toSignal` 转为 Signal
- `{ requireSync: true }`：因为 load 是路由 resolver，在组件实例化前已完成，可同步访问
- 内置 `fetch` 自动用 server context（在 SSR 时直接调用 Nitro 内部，避免 HTTP roundtrip）

### 用 Component Input Bindings 接收 load 数据

如开启了 `withComponentInputBinding()`，可以用 `@Input() load`：

```ts
import { Component, Input } from "@angular/core";
import type { LoadResult } from "@analogjs/router";
import type { load } from "./[id].server";

@Component({
  template: `
    @if (data) {
      <h1>{{ data.product.name }}</h1>
    }
  `,
})
export default class ProductDetailsComponent {
  @Input() set load(value: LoadResult<typeof load>) {
    this.data = value;
  }
  data!: LoadResult<typeof load>;
}
```

## 第一个 API Route

API 路由在 `src/server/routes/api/*.ts`，基于 [h3](https://h3.unjs.io/)：

```ts
// src/server/routes/api/hello.ts → GET /api/hello
import { defineEventHandler } from "h3";

export default defineEventHandler(() => ({
  message: "Hello World",
  timestamp: Date.now(),
}));
```

启动 dev server 后访问 `http://localhost:5173/api/hello`，看到：

```json
{ "message": "Hello World", "timestamp": 1747800000000 }
```

### 动态 API 参数

`[name]` 方括号传参，`getRouterParam` 读取：

```ts
// src/server/routes/api/hello/[name].ts → GET /api/hello/:name
import { defineEventHandler, getRouterParam } from "h3";

export default defineEventHandler((event) => {
  const name = getRouterParam(event, "name");
  return { message: `Hello, ${name}!` };
});
```

访问 `/api/hello/Analog` → `{ "message": "Hello, Analog!" }`。

### HTTP 方法后缀

文件名加 `.get.ts` / `.post.ts` / `.put.ts` / `.delete.ts` 限定方法：

```ts
// src/server/routes/api/users.post.ts → POST /api/users
import { defineEventHandler, readBody } from "h3";

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name: string; email: string }>(event);
  // TODO: insert into DB
  return { id: 1, ...body };
});
```

### 在 Service 中调用 API

```ts
// src/app/products.service.ts
import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({ providedIn: "root" })
export class ProductsService {
  private http = inject(HttpClient);

  /** 列出所有商品 */
  list() {
    return this.http.get<Product[]>("/api/v1/products");
  }

  /** 单个商品 */
  get(id: string) {
    return this.http.get<Product>(`/api/v1/products/${id}`);
  }
}

interface Product {
  id: string;
  name: string;
  price: number;
}
```

**关键点**：

- 直接用相对路径 `/api/v1/products`——`requestContextInterceptor`（已注册在 `app.config.ts`）会在 SSR 时把它转成绝对 URL（避免 SSR 时无 host 导致请求失败）
- `HttpClient` 在 SSR 阶段所有请求自动通过 Angular `TransferState` 缓存，client hydration 阶段不会重复发起

## 第一个 Form Action

表单提交 + 副作用（数据库写、邮件等），仿 Remix/SvelteKit 风格：

```ts
// src/app/pages/newsletter.page.ts
import { Component, signal } from "@angular/core";
import { FormAction } from "@analogjs/router";

type FormErrors = { email?: string } | undefined;

@Component({
  imports: [FormAction],
  template: `
    <h3>Newsletter Signup</h3>

    @if (!signedUp()) {
      <form
        method="post"
        (onSuccess)="onSuccess()"
        (onError)="onError($any($event))"
        (onStateChange)="errors.set(undefined)"
      >
        <div>
          <label for="email">Email</label>
          <input type="email" name="email" id="email" />
        </div>

        <button type="submit">Submit</button>
      </form>

      @if (errors()?.email) {
        <p class="error">{{ errors()?.email }}</p>
      }
    } @else {
      <div>Thanks for signing up!</div>
    }
  `,
})
export default class NewsletterComponent {
  signedUp = signal(false);
  errors = signal<FormErrors>(undefined);

  onSuccess() {
    this.signedUp.set(true);
  }

  onError(result?: FormErrors) {
    this.errors.set(result);
  }
}
```

服务端 action：

```ts
// src/app/pages/newsletter.server.ts
import {
  type PageServerAction,
  redirect,
  json,
  fail,
} from "@analogjs/router/server/actions";
import { readFormData } from "h3";

export async function action({ event }: PageServerAction) {
  const body = await readFormData(event);
  const email = body.get("email") as string;

  if (!email) {
    return fail(422, { email: "Email is required" });
  }

  // 模拟保存到数据库
  console.log("Subscribed:", email);

  return json({ type: "success" });
}
```

**核心点**：

- `FormAction` 指令：导入到 `imports: []`，自动绑定 `<form method="post">`，事件 `(onSuccess)` / `(onError)` / `(onStateChange)`
- **JS 禁用下也能工作**：原生 `<form method="post">` 提交时浏览器发送 form data，服务端 action 处理后正常返回——progressive enhancement
- 服务端三件套：`json(data)` 返回成功 JSON / `redirect(path)` 重定向 / `fail(status, data)` 返回校验错误
- `readFormData(event)` 来自 h3，解析 `application/x-www-form-urlencoded` 或 `multipart/form-data`

## 第一个 Markdown 路由

`src/app/pages/*.md` 直接作为路由——只需启用 `provideContent()`：

```ts
// src/app/app.config.ts
import { provideContent, withMarkdownRenderer } from "@analogjs/content";

export const appConfig: ApplicationConfig = {
  providers: [
    // ... 其他 providers
    provideContent(withMarkdownRenderer()),
  ],
};
```

启用 content 插件：

```ts
// vite.config.ts
import analog from "@analogjs/platform";

export default defineConfig({
  plugins: [
    analog({
      content: {
        highlighter: "prism", // 或 "shiki"
      },
    }),
  ],
});
```

写一个 Markdown 路由：

```md
<!-- src/app/pages/about.md → /about -->
---
title: About
meta:
  - name: description
    content: About Page Description
  - property: og:title
    content: About
---

## About Analog

Analog is a meta-framework for Angular.

[Back Home](./)
```

访问 `/about` 直接渲染。Frontmatter（YAML 头部）自动被处理为路由 meta tags + 页面标题。

> 完整的 Markdown content 用法（含 `injectContent` 单文件 + `injectContentFiles` 列表 + 子目录递归 + Shiki / Prism / Mermaid）见 [指南](./guide-line.md)「Markdown Content Routes」章节。

## 调试路由

`withDebugRoutes()` 可视化所有发现的路由：

```ts
// src/app/app.config.ts
import { provideFileRouter, withDebugRoutes } from "@analogjs/router";

export const appConfig: ApplicationConfig = {
  providers: [
    provideFileRouter(withDebugRoutes()),
    // ...
  ],
};
```

访问 `http://localhost:5173/__analog/routes` 看到完整路由表：

```
Path                  Component / Page                        Layout
/                     (home).page.ts                          —
/about                about.page.ts                           —
/products             products/(products-list).page.ts        products.page.ts
/products/:id         products/[id].page.ts                   products.page.ts
/blog/posts/:slug     blog/posts.[slug].page.ts               —
**                    [...not-found].page.ts                  —
```

> 新增路由后路由可能没立即生效——重启 dev server 或刷新 `/__analog/routes` 页面。

## 测试

Analog 项目默认用 Vitest（替代 Karma + Jasmine），开箱即可写组件测试：

```ts
// src/app/pages/about.spec.ts
import { describe, expect, it } from "vitest";
import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";

import AboutPageComponent from "./about.page";

describe("AboutPageComponent", () => {
  it("应该渲染 About 标题", async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    const fixture = TestBed.createComponent(AboutPageComponent);
    fixture.detectChanges();

    const h2 = fixture.nativeElement.querySelector("h2");
    expect(h2.textContent).toContain("About Analog");
  });
});
```

运行：

```bash
npm test
```

> **注意**：Vitest 在监听模式下默认 watch + 显示交互式 UI。CI 用 `vitest run` 一次性运行。

## 部署

默认 Node.js preset——执行 `npm run build` 后：

```bash
node dist/analog/server/index.mjs
# Listening on http://localhost:3000
```

切换部署 preset（如 Vercel / Cloudflare / Netlify）只需改 `vite.config.ts`：

```ts
// vite.config.ts
analog({
  nitro: {
    preset: "vercel", // 或 cloudflare-pages / netlify / static / ...
  },
});
```

或通过环境变量：

```bash
BUILD_PRESET=cloudflare-pages npm run build
```

> 完整的部署 preset 列表（17+ 个）+ 各平台特殊配置见 [指南](./guide-line.md)「Nitro Adapter」章节。

## 与现有 Angular 项目集成（迁移）

如果你已有 Angular CLI 项目，可一键迁移到 Analog：

```bash
npm install @analogjs/platform --save-dev
npx ng generate @analogjs/platform:migrate --project my-app
```

这个 schematic 会：

- 创建 `vite.config.ts`
- 更新 `angular.json` 中 `architect.build` 的 builder 为 `@analogjs/platform:vite`
- 把现有 `index.html` / `main.ts` / `tsconfig.app.json` 调整为 Analog 兼容版本
- 可选启用 Vitest 替代 Karma

迁移后既可继续用 `ng build` / `ng serve`，也可用 Analog 新加的文件路由 + Server Routes。

> Nx workspace 项目：用 `npx nx generate @analogjs/platform:migrate --project [your-project-name]`。

## 接下来读什么

完成本入门后建议按顺序读：

- [指南](./guide-line.md)：文件路由全集 / Layouts 嵌套 / Server Routes 全部用法 / WebSocket + SSE / Server Load 高级 / Form Actions 多表单 / Markdown Content 完整 / SSR / SSG / Sitemap / Nitro Adapter 全部 preset / 与 Angular 标准项目共存 / 常见踩坑
- [参考](./reference.md)：API 速查 / 文件约定 / `vite.config.ts` 全部 `analog()` 选项 / Nitro preset 列表 / 命名约定 / 常用集成包
