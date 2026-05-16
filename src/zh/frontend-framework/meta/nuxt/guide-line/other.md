---
layout: doc
outline: [2, 3]
---

# 指南 - 其他

> v3 → v4 迁移、vs Next.js、TypeScript、测试、常见陷阱

## 速查

- Nuxt 3 → 4：源码搬到 `app/`、`useFetch` 用 shallowRef、模块加载顺序修正、四套 tsconfig
- vs Next.js：Vue vs React / Nitro vs Vercel-tied / 模块系统 vs Marketplace / Composition API vs Hooks
- TypeScript：零配置；`app` / `server` / `node` / `shared` 四套 tsconfig；`tsc` 跑 `vue-tsc --noEmit`
- 测试：单元用 `@nuxt/test-utils` + Vitest；E2E 用 Playwright
- 常见陷阱：hydration mismatch / useFetch 重复请求 / 自动导入未生效 / 服务端没有 window / RouteParam 是 string|string[]

## v3 → v4 迁移

### 大变化清单

| 变化 | 影响 | 处理 |
|---|---|---|
| **目录结构**：源码搬到 `app/` | components / pages / composables / layouts / middleware / plugins 都移过去 | 跑 `pnpm dlx nuxt upgrade` codemod；或保留旧结构（Nuxt 4 自动识别） |
| **`useFetch` 用 `shallowRef`** | 深层属性变化不再触发响应 | 需要深响应时改 `useAsyncData` + `ref` |
| **同 key 数据共享** | 同 URL 的 `useFetch` 共享 data / error | 不再要担心两个组件并发请求 |
| **模块加载顺序**：layer 先 / project 后 | layer 内的 plugin 先跑 | 项目代码可覆盖 layer 行为 |
| **TypeScript 多 tsconfig** | `tsc` 失效，改用 `vue-tsc --noEmit` 或 Nuxt CLI | CI 脚本要改 |
| **`window.__NUXT__` 移除** | 直接读 `window.__NUXT__.data` 的代码挂 | 用 `useNuxtApp().payload` 替代 |
| **`noUncheckedIndexedAccess: true`** | 数组下标推断成 `T \| undefined` | 加 `!` 断言或 if 守卫 |
| **`generate` 配置移除** | `nuxt.config.ts` 顶层 `generate: { ... }` 不再生效 | 改 `nitro.prerender.routes` |
| **EJS 模板移除** | 自写模块用 EJS 编译挂 | 改用 `virtual` import |
| **Unhead v2** | `vmid` / `hid` / `children` / `body` 属性移除 | 用 `key` 替代 vmid |

### 迁移命令

```bash
# 升级到 latest
pnpm dlx nuxi@latest upgrade --force

# 跑 codemod 自动迁移
pnpm dlx nuxt-upgrade
```

详细变更列表见 [官方升级指南](https://nuxt.com/docs/4.x/getting-started/upgrade)。

### 迁移 checklist

- [ ] Node.js 升到 20.19+ / 22.12+ / 24+
- [ ] 跑 codemod，源码移到 `app/`
- [ ] 检查 `useFetch` 用法：依赖深响应的换 `useAsyncData`
- [ ] 检查 `nuxt.config.ts`：顶层 `generate` → `nitro.prerender`
- [ ] CI 类型检查：`tsc` → `vue-tsc --noEmit` 或 `nuxi typecheck`
- [ ] 数组下标处理 `T | undefined`（启用 `noUncheckedIndexedAccess`）
- [ ] 第三方模块兼容性查 release notes

## vs Next.js（React 阵营）

| 维度 | Nuxt 4 | Next.js 15 |
|---|---|---|
| 基础框架 | Vue 3 | React 19 |
| 路由 | 文件路由（`pages/` 或 layer） | 文件路由（`app/` Router 已成主流） |
| 渲染模式 | SSR / SSG / ISR / SWR / CSR + routeRules | SSR / SSG / ISR / Streaming + Server Components |
| 数据获取 | `useFetch` / `useAsyncData` 客户端 + 服务端 | RSC / `fetch` server-side + caching |
| 状态管理 | `useState` / Pinia 模块 | Context / Redux / Zustand（自选） |
| 服务端 API | `server/api/*.ts`（Nitro） | `app/api/*/route.ts` + Route Handlers |
| 自动导入 | 默认开启（components / composables / utils） | 不带 |
| TypeScript | 多 tsconfig + 自动生成 types | 单 tsconfig + 内置支持 |
| 部署 | 任意（Nitro presets 多） | Vercel 友好 / 其它也行 |
| Marketplace | 模块（npm `@nuxt/*`） | Next.js 官方少；React 生态丰富但分散 |
| DevX | DevTools 内置 + HMR | 类似 + RSC 调试 |
| 学习曲线 | 中（Vue + 约定式） | 中（React Server Components 需重学） |

**选谁**：你的团队主语言决定 80%——已经写 Vue 选 Nuxt，已经写 React 选 Next.js。两者技术深度旗鼓相当。

## TypeScript

### 零配置

`nuxt prepare`（dev / build 自动跑）会在 `.nuxt/` 下生成类型：

- `.nuxt/types/`：路由 / 组件 / API / runtime config 自动推导
- `.nuxt/tsconfig.json`：拼好的 tsconfig，主项目继承

Nuxt 4 的四套 tsconfig：

```
.nuxt/
├── tsconfig.app.json       # 客户端代码（pages / components）
├── tsconfig.server.json    # 服务端代码（server/）
├── tsconfig.node.json      # 配置文件 / 脚本
└── tsconfig.shared.json    # shared/ 目录
```

主项目根 `tsconfig.json`：

```json
{
  "extends": "./.nuxt/tsconfig.json"
}
```

### 类型检查

```bash
pnpm dlx nuxi typecheck     # 等价 vue-tsc --noEmit
```

CI 接：

```yaml
- name: TypeScript check
  run: pnpm dlx nuxi typecheck
```

::: warning `tsc` 不够用

Vue SFC + Nuxt 自动导入 + 多 tsconfig 让普通 `tsc` 报漂亮的「找不到模块」错。改用 `vue-tsc` 或 `nuxi typecheck`。

:::

### 给 useState / useFetch 加类型

```ts
// 显式给 useState 加类型
const user = useState<User | null>('user', () => null);

// useFetch 自动从 API 响应推导（如果 server/api 有 return 类型）
const { data } = await useFetch('/api/me');  // data 类型 = ReturnType<typeof handler>

// 不行的话手动断言
const { data } = await useFetch<User>('/api/me');
```

### Runtime config 类型

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    apiSecret: '' as string,
    public: {
      apiBase: '' as string,
    },
  },
});
```

或更精确：

```ts
declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    apiBase: string;
  }
  interface RuntimeConfig {
    apiSecret: string;
  }
}
```

## 测试

### 单元 / 组件测试（Vitest）

安装：

```bash
pnpm add -D @nuxt/test-utils vitest @vue/test-utils happy-dom
```

```ts
// vitest.config.ts
import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
  },
});
```

```ts
// tests/Component.spec.ts
import { mountSuspended } from '@nuxt/test-utils/runtime';
import Component from '../app/components/Hello.vue';

it('renders', async () => {
  const wrapper = await mountSuspended(Component);
  expect(wrapper.text()).toContain('Hello');
});
```

`mountSuspended` 处理 Nuxt 异步组件 / `useFetch` / `useState` 等。

### E2E（Playwright）

```bash
pnpm dlx playwright init
```

```ts
// tests/e2e/home.spec.ts
import { test, expect } from '@playwright/test';
import { setup, $fetch } from '@nuxt/test-utils';

await setup({ host: 'http://localhost:3000' });

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Welcome');
});
```

### 内置 testing utilities

| 函数                | 作用                                  |
| ------------------- | ------------------------------------- |
| `mountSuspended()`  | 挂载支持异步 setup 的组件             |
| `renderSuspended()` | SSR 渲染（验输出 HTML）               |
| `mockNuxtImport()`  | mock 自动导入的函数                   |
| `registerEndpoint()` | 注册 mock API 端点                  |
| `$fetch(url)`       | 调内部 API（不启完整 server）         |

## 常见陷阱

### 1. Hydration mismatch

服务端渲染的 HTML 与客户端渲染的不一致 → React 报红 / Vue 警告。

**原因**：

- 用了 `Math.random()` / `Date.now()` 等不稳定值
- `<ClientOnly>` 包不全的浏览器 API（`window` / `localStorage`）
- 服务端 / 客户端 cookie 不一致（如登录态读取时机）

**解决**：

```vue
<!-- ❌ 服务端无 window -->
<div>{{ window.innerWidth }}</div>

<!-- ✅ 用 import.meta.client 守卫 -->
<div>{{ import.meta.client ? window.innerWidth : 0 }}</div>

<!-- ✅✅ 干脆只在客户端渲 -->
<ClientOnly>
  <div>{{ window.innerWidth }}</div>
</ClientOnly>
```

### 2. useFetch 重复请求

```vue
<script setup>
// ❌ 每次 page 重新挂载都拉
const { data } = await useFetch('/api/articles');
</script>
```

如果 `/articles` 进了 `<KeepAlive>` 来回切换，可能看到重复请求。检查：

- 加 `definePageMeta({ keepalive: true })` 让页面真的被缓存
- `useFetch` 默认按 URL 当 key，跨页面共享——只要 URL 一样不会重复拉

### 3. 自动导入不生效

```ts
// ❌ 在 setTimeout 回调里调 composable
setTimeout(() => {
  const user = useUser();  // 报「Nuxt instance is unavailable」
}, 1000);

// ✅ 在 setup 顶层调好，再用
const user = useUser();
setTimeout(() => {
  console.log(user.value);
}, 1000);
```

Nuxt context 只在特定生命周期（`<script setup>` / plugin / middleware）里活——离开同步执行栈就丢了。

### 4. 服务端调外部 API 时 fetch undefined

```ts
// ❌ Node 18 之前没有全局 fetch
export default defineEventHandler(async () => {
  return await fetch('https://api.example.com/data');
});
```

Nuxt 4 要求 Node 20+，全局 fetch 都有。但 Edge runtime（Cloudflare Workers）的 fetch 行为有差异——某些 header / cookie 在 Edge 上读不到。优先用 `$fetch`（内部 ofetch，跨环境一致）。

### 5. RouteParam 是 `string | string[]`

```vue
<script setup>
const route = useRoute();
const id = route.params.id;  // 类型 string | string[]
// 因为 catch-all routes 会给数组：[...slug] → ['a', 'b']

// 正确处理
const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;
</script>
```

### 6. SSR 中 `useState` 必须给 key

```ts
// ❌ 没 key，SSR 时多个组件互相覆盖
const count = useState(() => 0);

// ✅ 给唯一 key
const count = useState('counter', () => 0);
```

SSR 时 Nuxt 序列化 state 用 key 当索引，没 key 就乱套。

### 7. middleware 在 SSR 时也跑

```ts
// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  // ❌ SSR 时 localStorage 不存在
  const token = localStorage.getItem('token');

  // ✅ 用 cookie 或 useState（双端都有）
  const user = useUser();
});
```

middleware 默认双端跑——客户端有的东西要用 cookie / useState 才能两边都拿到。

### 8. `definePageMeta` 在 setup 里读 reactive

```vue
<script setup>
const route = useRoute();

// ❌ definePageMeta 是编译期宏，不能用 reactive
definePageMeta({
  middleware: route.params.id ? 'auth' : undefined,
});

// ✅ definePageMeta 必须传字面量
definePageMeta({
  middleware: 'auth',
});
</script>
```

`definePageMeta` 在编译时被提取，不在运行时执行——里面只能用字面量、不能用 ref / route 等运行时值。

### 9. 服务端 cookie 时机

```ts
// server/api/login.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const user = await authenticate(body);

  // ❌ 先返回再 setCookie，cookie 不会进响应
  const result = { user };
  setCookie(event, 'session', user.token);
  return result;

  // ✅ setCookie 必须在 return 之前
  setCookie(event, 'session', user.token, {
    httpOnly: true, secure: true, sameSite: 'lax',
  });
  return { user };
});
```

### 10. 部署后 routeRules 没生效

```ts
// ❌ routeRules 在 nuxt.config 顶层
routeRules: { '/': { prerender: true } }
// 但部署后 / 还是动态 SSR
```

检查：

1. 是否 `pnpm build` 而不是 `pnpm dev`（dev 模式 routeRules 部分失效）
2. nitro preset 是否支持该 rule（如静态 host 不能跑 ISR / SWR）
3. CDN / 反向代理是否覆盖了 `Cache-Control` 头

## 何时不选 Nuxt

- 项目核心是 React → Next.js 更顺
- 纯静态文档站 → VitePress / Astro 更轻
- 纯 SPA 后台仪表盘且不在乎 SSR → 直接 Vue 3 + Vite + Vue Router 更省心（不背 Nitro 那一大坨）
- Edge-only 部署且极致性能 → 看 Astro / Qwik（更激进的 island / resumable）
