---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 denoland/skills 官方 README 与 `skills/*/SKILL.md` 编写，速查表 + 命令清单。

## 速查

- **装**：插件 `/plugin marketplace add denoland/skills` + `/plugin install deno-skills@denoland-skills`；或 `git clone https://github.com/denoland/skills.git` 后 `cp -r skills/* ~/.claude/skills/`
- **6 skills**：deno-guidance / deno-deploy / deno-frontend / deno-expert / deno-project-templates / deno-sandbox
- **每技能**：`SKILL.md`（必）+ 可选 `scripts/` / `references/` / `assets/`；遵 agentskills.io；MIT
- **原则**：JSR 优先 · `npm:` 后备 · 内建工具（fmt/lint/test/doc）· Fresh island 架构
- **纠偏**：`deno deploy`（非 `deployctl`，Deno ≥ 2.4.2）· Fresh 2.x（非 1.x）· 绝不写废弃 URL 导入

## 6 技能全表

| 技能 | 版本 | 触发（Use when） | 覆盖 |
| --- | --- | --- | --- |
| `deno-guidance` | 1.2 | 起项目、选包、配 `deno.json`、跑 CLI | JSR 优先、`@std/*`、权限、fmt/lint/test、`deno add`/`update`/`upgrade` |
| `deno-deploy` | 1.5 | 部署到 Deno Deploy | `deno deploy` CLI、env 三 context、Deno KV/Postgres、`--tunnel`、logs |
| `deno-frontend` | 2.4 | 建 Fresh、写 Preact/Tailwind | Fresh 2.x 结构、文件路由、`define.handlers`、island、signals、Tailwind |
| `deno-expert` | 1.1 | 审查/调试 Deno 代码 | 审查 checklist、反模式、调试、commit `deno.lock` |
| `deno-project-templates` | 1.2 | 脚手架新项目 | Fresh Web / CLI / 库 / API server 模板 |
| `deno-sandbox` | 1.1 | 跑不可信 / AI 生成代码 | `@deno/sandbox`、Firecracker microVM、`await using`、`spawn` |

## Deno CLI 命令

| 命令 | 用途 |
| --- | --- |
| `deno run file.ts` | 运行 TS/JS 文件 |
| `deno run --allow-net server.ts` | 带权限运行 |
| `deno task <name>` | 跑 `deno.json` 里的任务 |
| `deno fmt` / `deno fmt --check` | 格式化 / CI 只检查不改 |
| `deno lint` / `deno test` / `deno check` | 检查 / 测试 / 类型检查 |
| `deno add jsr:@std/http` | 加 JSR 包 |
| `deno add npm:express` | 加 npm 包 |
| `deno install` | 装全部依赖 |
| `deno update` | 更新**项目依赖** |
| `deno upgrade` | 更新 **Deno runtime 本身** |
| `deno doc <pkg>` | 查包文档 |
| `deno compile` | 编译独立二进制 |
| `deno publish` | 发布库到 JSR |

## JSR 与包管理

- 优先级：`jsr:`（首选）→ `npm:`（无 JSR 替代）→ 避免旧 URL 式导入（已废弃）
- 标准库：`jsr:@std/*`（如 `@std/http`、`@std/path`、`@std/assert`、`@std/cli`、`@std/fmt`）
- import map 写在 `deno.json` 的 `imports`，所有 specifier 带版本约束（如 `jsr:@std/http@1`）
- 有 `deno.json` 时把内联 specifier 移进 import map；npm 依赖优先放 `package.json`（若存在）

## `deno deploy` 命令参考

| 命令 | 用途 |
| --- | --- |
| `deno deploy --prod` | 部署到生产（app 须先存在） |
| `deno deploy` | 预览部署（独立 URL） |
| `deno deploy create --org <name>` | 交互式建 app（开浏览器） |
| `deno deploy create --org <name> --app <name> --source local --runtime-mode dynamic --entrypoint main.ts --build-timeout 5 --build-memory-limit 1024 --region us` | 非交互式建 app（AI/CI） |
| `deno deploy env add <var> <value> [--secret]` | 加环境变量 / 密钥 |
| `deno deploy env list` / `load <file>` | 列出 / 从 `.env` 载入 |
| `deno deploy database provision <name> --kind <denokv\|prisma>` | provision 数据库 |
| `deno deploy database assign <name> --app <app>` | 挂库到 app |
| `deno deploy logs` | 查日志 |
| `deno run --tunnel -A <file>` / `deno task --tunnel <task>` | 本地 tunnel |

**env 三 context**：Production / Development / Build。预定义变量：`DENO_DEPLOY`（=1）、`DENO_DEPLOYMENT_ID`、`DENO_DEPLOY_ORG_ID`、`DENO_DEPLOY_APP_ID`、`CI`。key 不能以 `DENO_`/`LD_`/`OTEL_` 开头。

## Fresh 2.x 速查

| 项 | 值 |
| --- | --- |
| 建项目 | `deno run -Ar jsr:@fresh/init my-project` |
| 开发 | `deno task dev`（端口 5173） |
| 构建 / 预览 | `deno task build` / `deno task preview` |
| 迁移 1.x→2.x | `deno run -Ar jsr:@fresh/update` |
| 核心导入 | `import { App, staticFiles, fsRoutes } from "fresh"` |
| 类型辅助 | `createDefine<State>()` in `utils/state.ts` |
| 数据传递 | handler 返回 `{ data: {...} }` + `define.page<typeof handler>` |
| island 交互 | `islands/`，`useSignal` from `@preact/signals` |
| 服务端组件 | `components/`（不发 JS） |
| 客户端守卫 | `IS_BROWSER` from `fresh/runtime` |
| Tailwind | `deno add npm:@tailwindcss/vite npm:tailwindcss`（两个都要） |

**目录**：`main.ts` · `client.ts` · `vite.config.ts` · `routes/`（`_app.tsx`/`_error.tsx`/`index.tsx`/`api/`）· `islands/` · `components/` · `static/` · `utils/state.ts`。

## `@deno/sandbox` 速查

| 任务 | 代码 |
| --- | --- |
| 建 sandbox | `await using sandbox = await Sandbox.create()` |
| 跑命令 | `sandbox.spawn("cmd", { args: [...] })` |
| 取输出 | `const output = await child.output()` |
| 写 / 读文件 | `await sandbox.fs.writeFile(path, content)` / `readFile(path)` |
| 杀进程 | `await child.kill()` |
| 装 | `deno add jsr:@deno/sandbox` |

默认 2 vCPU / 512MB / 10GB，启动 < 200ms，Firecracker microVM 隔离。

## 安装位置（各平台）

| 平台 | 目录 | 备注 |
| --- | --- | --- |
| Claude Code | `~/.claude/skills/` 或 `.claude/skills/` | 也可用插件方式 |
| Cursor | `~/.cursor/skills/` 或 `.cursor/skills/` | 需 v2.4+ |
| VS Code Copilot | `.github/skills/` 或 `~/.copilot/skills/` | 需开 `chat.useAgentSkills` |

## 目录结构

```
skills/
├── deno-guidance/SKILL.md
├── deno-deploy/SKILL.md        (+ references/)
├── deno-frontend/SKILL.md
├── deno-expert/SKILL.md
├── deno-project-templates/SKILL.md   (+ assets/)
└── deno-sandbox/SKILL.md
```

## 许可与链接

- 仓库：[denoland/skills](https://github.com/denoland/skills)（MIT）
- Deno 文档：[docs.deno.com](https://docs.deno.com)
- Fresh：[fresh.deno.dev/docs](https://fresh.deno.dev/docs)
- JSR：[jsr.io](https://jsr.io)
- Deno Deploy：[docs.deno.com/deploy](https://docs.deno.com/deploy/)
- Agent Skills 规范：[agentskills.io/specification](https://agentskills.io/specification)
- 相关叶：[Matteo Collina Node.js Skills](../matteo-collina-nodejs-skills/) · [NestJS Best Practices](../nestjs-best-practices/)
