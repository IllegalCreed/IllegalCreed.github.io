---
layout: doc
outline: [2, 3]
---

# Edge Functions 与内置后端：表单、Identity、A/B 测试

> 基于 Netlify 官方文档（2025） · 核于 2026-08

## 速查

- **Edge Functions**：运行在**全球边缘节点**（离用户最近的 CDN 节点）的 TypeScript/JavaScript 函数，由 **Deno** runtime 驱动，冷启动毫秒级，用于改写请求/响应、A/B 分流、鉴权、地理位置个性化。
- **Deno runtime**：Netlify Edge Functions 基于 **Deno**（安全的现代 JS/TS runtime），原生支持 TypeScript、Web 标准 API（`Request`/`Response`/`fetch`），无需编译直接跑 `.ts`。
- **签名**：Edge Functions 默认匹配 URL 路径（文件名即路由，如 `netlify/edge-functions/hello.ts` 匹配 `/hello`），可在文件头用 `export const config = { path: "/api/*" }` 自定义匹配规则。
- **冷启动**：边缘函数首次调用有冷启动，但因 Deno + V8 isolate 架构，**冷启动约几十毫秒**，远快于传统 Lambda 容器冷启动（数百毫秒到秒）。
- **Forms（表单）**：静态站点无需写后端，HTML 表单加 `data-netlify="true"` 属性，Netlify 自动捕获提交、存后台、发邮件通知、可转 Webhook。
- **Identity（认证）**：开箱即用的用户认证服务（注册/登录/找回密码/OAuth 社交登录），基于 JWT，前端 `<netlify-identity-widget>` 组件即装即用。
- **A/B 测试（Branch-Based Testing）**：基于分支的 A/B 测试——把不同分支部署为不同变体，Netlify 按比例（如 50/50）将流量分流到各变体，无需改代码。
- **重定向与改写（Redirects/Rewrites）**：`netlify.toml` 或 `_redirects` 文件配置 URL 重定向（301/302）与改写（透明转发，URL 不变），支持基于角色/地理位置/条件的智能路由。
- **Functions（Serverless）**：除 Edge Functions 外，Netlify 还有传统 **Serverless Functions**（基于 AWS Lambda，Node.js/Go/Rust），运行在单一区域，适合重逻辑；Edge 跑全球边缘，适合轻逻辑低延迟。
- **Edge vs Serverless 选型**：要全球低延迟 + Web API → Edge；要长任务/重计算/特定区域 → Serverless（Lambda）。

## 一、Edge Functions：Deno 驱动的边缘计算

Edge Functions 让静态站点拥有"在边缘处理请求"的能力。一个最简单的 Edge Function：

```ts
// netlify/edge-functions/hello.ts
export default async (request: Request) => {
  const url = new URL(request.url);
  const name = url.searchParams.get("name") || "world";
  // 可直接 fetch 第三方 API
  return new Response(`Hello, ${name}!`, {
    headers: { "content-type": "text/plain" },
  });
};

// 自定义匹配路径（默认按文件名）
export const config = { path: "/hello" };
```

- **运行位置**：全球边缘节点——用户在东京访问，由东京节点执行；用户在法兰克福，由法兰克福节点执行。延迟贴近用户。
- **Deno 特性**：原生 TypeScript（无需 `tsc` 编译）、原生 Web API（`Request`/`Response`/`Headers`/`fetch`/`crypto.subtle`）、默认安全（无文件系统/进程访问权限，除非显式授予）。
- **典型用途**：
  1. **A/B 测试分流**：在边缘按 cookie/随机数把用户分到不同变体，返回不同 HTML。
  2. **鉴权**：校验 JWT、检查登录态、未登录重定向到登录页。
  3. **地理位置个性化**：根据请求 IP 的国家返回本地化内容或语言。
  4. **请求改写**：把 `/api/old` 透明转发到 `/api/new`，或拼装多源数据。
  5. **缓存控制**：动态设置 `Cache-Control` 头优化 CDN 缓存。

## 二、Forms：静态站点的表单后端

JAMstack 站点常需"联系我们""订阅""报名"等表单，但静态站点没有后端。Netlify Forms 填补这个空缺：

```html
<!-- 静态 HTML，加 data-netlify 属性即可 -->
<form name="contact" method="POST" data-netlify="true">
  <input type="text" name="name" />
  <input type="email" name="email" />
  <button type="submit">提交</button>
</form>
```

- **工作机制**：构建时 Netlify 解析 HTML 中的 `data-netlify="true"` 表单，注册到后台；用户提交时，Netlify 边缘节点接收 POST、存储到后台、发邮件通知站长、可通过 Webhook 转发到 Slack/CRM。
- **AJAX 提交**：也可用 fetch POST 到 `/__forms.html`，实现无刷新提交。
- **文件上传、反垃圾（reCAPTCHA）、字段验证**都支持。
- **限制**：免费层每月表单提交条数有限，超出需升级——营销活动收集大量表单时要规划成本。

## 三、Identity：开箱即用的认证

Identity 提供完整的用户认证体系，无需自建认证服务：

- **能力**：邮箱密码注册/登录、邮箱验证、密码找回、**OAuth 社交登录**（Google/GitHub/GitLab/Bitbucket）、JWT 令牌、角色管理（admin/member）。
- **客户端**：引入 `<netlify-identity-widget>` 组件，几行代码即有注册/登录 UI；或用 `gotrue-js` SDK 自定义 UI。
- **与 Functions 联动**：Edge/Serverless Functions 可读取 `clientContext` 中的 `user` 对象（含角色），实现基于角色的鉴权（如只有 `admin` 角色能访问 `/admin`）。
- **适用**：会员站、后台管理、需要个性化的小型 SaaS——比自建 Auth0/Firebase 省事。

## 四、A/B 测试：基于分支的流量分流

Netlify 的 A/B 测试不需改代码、不需第三方工具，靠**分支部署**实现：

- **原理**：把实验变体放在不同分支（`main` = 对照组，`experiment-blue-button` = 实验组），Netlify 把两个分支都部署为可访问版本，再按配置的权重（如 50/50）在边缘把流量分流。
- **配置**：在站点设置里开启 Branch-Based Testing，选实验分支与权重。
- **优势**：真正在生产环境、真实流量上测试，比预发布环境可信；分流在边缘完成，用户无感知。
- **局限**：变体是整站级（整分支），不像专业 A/B 工具能做组件级实验；多变量实验复杂度高。

## 五、重定向与改写

`netlify.toml`（推荐）或 `_redirects` 文件声明式配置路由：

```toml
# netlify.toml
[[redirects]]
  from = "/old-path"
  to = "/new-path"
  status = 301          # 永久重定向

[[redirects]]
  from = "/api/*"
  to = "https://api.example.com/:splat"
  status = 200          # 200 = 改写（rewrite），URL 不变，透明转发
  force = true          # 即使有匹配文件也强制改写
```

- **重定向（3xx）**：URL 在浏览器地址栏变化，常用于旧 URL 迁移。
- **改写（200）**：URL 不变，请求被透明转发到另一个路径或外部 URL——可做反向代理、SPA 路由兜底、把 `/api/*` 转到外部 API。
- **条件规则**：可基于角色、国家、语言、cookie 做条件路由（如未登录访问 `/admin` 重定向到 `/login`）。

## 下一步

掌握 Edge Functions 与内置后端后，下一站进入[插件生态与高级部署](./plugins-and-deploy)——如何用 Build Plugins 编程化扩展构建流水线，以及部署预览、原子发布、CI/CD 集成的工程实践。
