---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 denoland/skills 官方 skills 的 `SKILL.md` 逐个梳理，覆盖 6 个技能的核心指令、命令与反模式。

## 速查

- **deno-guidance**：JSR 优先、`@std/*` 标准库、`deno add`/`update`(依赖) vs `upgrade`(runtime)、`deno fmt`/`lint`/`test`、CI 用 `deno fmt --check`
- **deno-deploy**：用 `deno deploy`（**非 `deployctl`**，需 Deno ≥ 2.4.2）；先定位 app 目录 → 查版本 → 查启动依赖 → 部署；`--prod`/preview；env 三 context + `--secret`；Deno KV `Deno.openKv()`；`--tunnel` 本地联调
- **deno-frontend**：Fresh 2.x（`from "fresh"`、无 manifest、`vite.config.ts`、单 `(ctx)`、`_error.tsx`）；island 架构、`define.handlers` 返回 `{ data }`、Preact signals、Tailwind 需装两个包
- **deno-expert**：审查 checklist（导入/配置/Fresh/质量），每次涉 Deno 代码都提 fmt/lint/test；commit `deno.lock`
- **deno-project-templates**：Fresh Web / CLI / 库 / API server 四类脚手架
- **deno-sandbox**：`@deno/sandbox` Firecracker microVM，`await using` 自动释放，`spawn` + `--allow-none` 最小权限
- **通用反模式**：旧 URL 导入、`deployctl`、Fresh 1.x、整页当 island、非可序列化 island props、裸 `const sandbox`

## deno-guidance：基础与 deno.json

这是打地基的技能，在任何 Deno 项目（识别标志 = 存在 `deno.json`）都应用。

**包管理优先级**：`jsr:`（首选）→ `npm:`（无 JSR 替代时）→ 避免旧的 URL 式导入（已废弃，很多 LLM 会错误默认它）。标准库统一走 `jsr:@std/*`。

**关键区分 `deno update` vs `deno upgrade`**：

- `deno update` —— 更新 `deno.json`（及 `package.json`）里的**项目依赖**到最新兼容版本，遵守 semver
- `deno upgrade` —— 更新 **Deno runtime 本身**，与项目依赖无关

**工作流**：改完代码常跑 `deno fmt && deno lint && deno test`；CI 里用 `deno fmt --check`（不改文件、只失败）。`deno.json` 可配 `fmt.exclude` / `lint.exclude` 或顶层 `exclude` 排除目录。

**权限**：跑代码要按需授权，如 `deno run --allow-net server.ts`；缺 flag 会报「Requires net access」。

::: tip guardrail：绝不写废弃 URL
deno-guidance 有条硬规则：帮用户从旧写法迁移时，只描述「旧的 URL 式注册表」这个概念、并只展示正确的 `jsr:` 写法，绝不写出实际的废弃 URL 字符串——即便用户在提问里写了也不回显。这是为了防止 AI 把过时写法「教」回给用户。
:::

## deno-deploy：新 `deno deploy` CLI

::: warning 最重要的一条：用 `deno deploy`，不用 `deployctl`
- `deployctl` 是 Deno Deploy **Classic**（已弃用）
- `deno deploy` 是**内建于 Deno CLI 的现代命令**，需 **Deno ≥ 2.4.2**（`deno deploy` 子命令在 Deno 2.4 引入）
- 拿不准 flag 时先跑 `deno deploy --help` / `deno deploy create --help`，别猜
:::

**部署工作流**（先给核心命令 `deno deploy --prod`，再讲诊断）：

1. **定位 app 目录**——找到 `deno.json`/`deno.jsonc` 所在处，所有 deploy 命令在此运行
2. **预检**——`deno --version`（须 ≥ 2.4.2）、查 `deno.json` 是否已有 `deploy.org` / `deploy.app`
3. **查启动依赖**——若 app 在启动时连数据库（如 `main.ts` 顶层 `await initDb()`），首次部署会在 warmup 失败。此时先 `deno deploy create ... --no-wait` 建 app，再 `deno deploy database provision/assign` 建库并挂上，最后 `deno deploy --prod` 重新部署
4. **部署**——有 deploy 配置就直接 `deno deploy --prod`（Fresh/Astro 等先 `deno task build`）；无配置需先创建 app

**创建 app**：交互式 `deno deploy create --org <ORG_NAME>`（开浏览器，仅人工可用）；非交互式（AI/CI 用）需带全 flag：

```bash
deno deploy create \
  --org my-org --app my-api \
  --source local \
  --runtime-mode dynamic --entrypoint main.ts \
  --build-timeout 5 --build-memory-limit 1024 --region us
```

create 完成会自动把 `deploy.org`/`deploy.app` 写回 `deno.json`，之后只需 `deno deploy --prod`。org 名在 `console.deno.com/你的-org` 的 URL 里。

**环境变量**：三个 context——Production（生产流量）、Development（预览/分支）、Build（仅构建期）。预定义变量如 `DENO_DEPLOY=1`、`DENO_DEPLOYMENT_ID`。CLI 管理：

```bash
deno deploy env add DATABASE_URL "postgres://..."     # 明文
deno deploy env add API_KEY "sk-..." --secret          # 密钥（创建后隐藏）
deno deploy env list
deno deploy env load .env.production                    # 从 .env 载入（默认当密钥）
```

限制：key 名 ≤ 128 字节、值 ≤ 16 KB、key 不能以 `DENO_`/`LD_`/`OTEL_` 开头。

**数据库**：内建 Deno KV + PostgreSQL，**每个环境自动隔离**独立库。Deno KV 零配置：

```typescript
const kv = await Deno.openKv();
await kv.set(["users", "alice"], { name: "Alice", role: "admin" });
const user = await kv.get(["users", "alice"]);
```

provision：`deno deploy database provision my-db --kind denokv`（或 `--kind prisma` 建 Postgres）+ `deno deploy database assign my-db --app my-app`。

**本地 tunnel**：`deno run --tunnel -A main.ts` 或 `deno task --tunnel dev`——把本地服务暴露到公网，还会同步 Deno Deploy「Local」context 的环境变量、发 OpenTelemetry 日志、连你分配的开发数据库。适合测 webhook、给同事预览、移动端联调。

## deno-frontend：Fresh 2.x

::: warning Fresh 2.x vs 1.x
Fresh 1.x 已废弃。2.x 关键差异：`import { App } from "fresh"`（旧美元符号路径废弃）、**无 manifest 文件**、用 `vite.config.ts`（旧 `dev.ts` 入口没了）、`new App()` 配置、handler 用**单一 `(ctx)` 参数**、**统一 `_error.tsx`**（不再分开的错误页）。
:::

**项目结构**：`main.ts`（服务端入口）、`client.ts`（客户端入口/CSS）、`vite.config.ts`、`routes/`（文件路由，含 `_app.tsx` 布局、`_error.tsx`、`index.tsx`、`api/`）、`islands/`（交互组件，客户端 hydrate）、`components/`（纯服务端组件，不发 JS）、`static/`、`utils/state.ts`（`createDefine` 类型辅助）。

**路由**：文件即路由——`routes/about.tsx` → `/about`；`[slug]` 动态；`[[version]]` 可选段；`[...path]` catch-all；`(marketing)/` 路由组（共享布局不改 URL）。

**数据获取（两法）**：

- **法 A · handler + `{ data }`（推荐）**：完整 Fresh 2.x 架构，支持鉴权/重定向/类型传递

  ```tsx
  // routes/posts.tsx
  import { define } from "@/utils/state.ts";

  export const handler = define.handlers(async (ctx) => {
    const posts = await (await fetch(".../posts")).json();
    return { data: { posts } };   // 返回 { data: {...} }
  });

  export default define.page<typeof handler>(({ data }) => (
    <ul>{data.posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>
  ));
  ```

- **法 B · async 服务端组件（简写）**：无鉴权/重定向的简单查询直接 `export default async function`

::: danger 最常见 LLM 错误
Fresh 2.x **不能**通过 `ctx.render()` 传数据给页面。必须从 handler 返回带 `data` 属性的对象，再用 `define.page<typeof handler>` 关联类型。这是高频踩坑点。
:::

**island 规则**：props 必须**可序列化**（原始类型/数组/Map/Set/普通对象/URL/Date/Signal 等，**不能传函数**）；island 要小、只放交互部分，其余用 `components/` 里的服务端组件。客户端专用代码用 `fresh/runtime` 的 `IS_BROWSER` 守卫。

**Preact vs React**：`class` 直接可用（不必 `className`）；`@preact/signals` 替代 `useState`；3KB vs ~40KB；hooks 用法相同。

**Tailwind（可选）**：必须装**两个包**——`deno add npm:@tailwindcss/vite npm:tailwindcss`（`@tailwindcss/vite` 是 Vite 插件，依赖核心 `tailwindcss`）；`vite.config.ts` 加 `tailwindcss()` 插件；CSS 文件 `@import "tailwindcss"`；在 `client.ts` 引入该 CSS。只装 Vite 插件会报 `Can't resolve 'tailwindcss'`。

**迁移 1.x → 2.x**：`deno run -Ar jsr:@fresh/update` 自动转导入、handler 签名、任务、错误页。注意：`@fresh/core@2.0.0-alpha.*` 项目里的 `dev.ts` **不是** 1.x 残留，是 alpha 版的正确入口——看 `deno.json` imports 判断版本。

## deno-expert：审查与调试

专家级技能，用于审查 Deno/Fresh 代码、调试运行时问题、执行最佳实践。核心要求：**每次涉及 Deno 代码的回复都要点名内建工具**（至少 `deno fmt`/`deno lint`/`deno test`）。

**审查 checklist**：

- **导入**：用 `jsr:` / 仅无替代时 `npm:` / 无旧 URL 导入 / 标准库走 `jsr:@std/*`
- **配置**：有 `deno.json` / import map 在 `deno.json` 里 / run 命令权限正确
- **Fresh**：island 小而聚焦 / 传 island 的 props 可序列化 / 非交互组件放 `components/` / 用 `class` / 部署前先 build
- **质量**：`deno fmt` 过 / `deno lint` 过 / 有测试 / 公共 API 有文档

**反模式**：内联的 `jsr:`/`npm:` specifier（若有 `deno.json` 应移进 import map）、整页当 island、非可序列化 island props。调试：权限错查 `--allow-*`、TS 错跑 `deno check main.ts`、给所有 specifier 加版本约束。建议 commit `deno.lock` 保证 CI 可复现。

## deno-project-templates：脚手架

按项目类型给模板：

| 类型 | 用途 | 关键 |
| --- | --- | --- |
| **Fresh Web app** | 全栈 Web | `deno run -Ar jsr:@fresh/init my-project`，端口 5173 |
| **CLI 工具** | 命令行 | `main.ts` + `@std/cli` 的 `parseArgs`；`deno compile` 出独立二进制 |
| **库** | 发布到 JSR | `mod.ts` / `mod_test.ts`；`deno publish` |
| **API server** | 无前端后端 | `main.ts` + `@std/http`，端口 8000 |

建完跑 `deno install && deno fmt && deno lint`。部署：Fresh `deno task build && deno deploy --prod`、CLI `deno task compile`、库 `deno publish`、API `deno deploy --prod`。

## deno-sandbox：隔离执行

`@deno/sandbox` 提供安全隔离环境——每个 sandbox 跑在自己的 Linux **Firecracker microVM**（与 AWS Lambda 同技术），独立 FS/网络/进程。用于跑用户代码、AI 生成代码、playground、多租户、隔离测试。

```typescript
import { Sandbox } from "@deno/sandbox";

// 始终用 await using 自动释放
await using sandbox = await Sandbox.create();

const child = await sandbox.spawn("deno", {
  args: ["run", "--allow-none", "/tmp/user_code.ts"],  // 最小权限
  stdout: "piped",
  stderr: "piped",
});
const output = await child.output();
```

::: warning sandbox 关键纪律
- **永远 `await using`**——绝不写裸 `const sandbox = await Sandbox.create()`（会泄漏资源）
- **最小权限**——跑不可信代码用 `--allow-none`，真需要网络才 `--allow-net`，绝不 `--allow-all`
- **要 pipe 输出**——不 `stdout: "piped"` 则 `output.stdout` 为空
- **设超时**——`setTimeout(() => child.kill(), 5000)` 防用户代码跑不停
- **验证输出**——把 sandbox 输出当**数据**（`JSON.parse`）校验，绝不当代码执行
:::

默认资源 2 vCPU / 512MB / 10GB，启动 < 200ms；可直接 `deno deploy --prod` 部署；API 用 `deno doc jsr:@deno/sandbox` 查。

## 作用域机制：只在 Deno 语境激活

每个 skill 都写了 **Scope Boundaries**：用户问 Node.js / Bun / Python / Go / 其它框架时，直接用那门技术回答，**不掺 Deno**、不推 `jsr:` 导入或 `deno.json`；纯粹的 TS/JS 通用问题也不预设 Deno。只有用户明确问 Deno、或身处 Deno 项目时才应用这些技能。这种克制让技能集不会「见谁都推 Deno」。

## 下一步

- [参考](./reference) —— 6 skills 全表、CLI/JSR、Fresh 2.x、`deno deploy` 命令、安装、许可
- 上游：[Deno 文档](https://docs.deno.com) · [Fresh 文档](https://fresh.deno.dev/docs) · [Deno Deploy](https://docs.deno.com/deploy/)
