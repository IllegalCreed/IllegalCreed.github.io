---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 mcollina/skills（Matteo Collina 个人）README 与 `skills/` 编写。

## 速查

- **装**：`npx skills add mcollina/skills`
- **11 技能**：fastify / node / nodejs-core / typescript-magician / oauth / linting-neostandard-eslint9 / documentation / init / octocat / skill-optimizer / snipgrapher
- **每技能**：`SKILL.md`（frontmatter + 指令）+ 多数带 `rules/`（分主题细则）
- **性质**：个人权威（非 org 官方）；MIT；Copyright © 2026 Matteo Collina
- **作者**：Matteo Collina = Node.js TSC 成员 · Fastify/Pino 作者 · Platformatic CTO

## 11 技能全表

| 技能 | 覆盖 |
| --- | --- |
| `fastify` | 封装/`fastify-plugin`、路由、JSON Schema、hooks、error-handling、认证、`inject()` 测试、性能、Pino、TS strip types、装饰器、CORS/安全、WebSocket、DB、部署、`reply.from()` 代理 |
| `node` | type stripping（Node 22.6+）、错误处理、async 模式、流（`pipeline()`）、模块、测试、flaky/卡死排查、性能、缓存（`lru-cache`/`async-cache-dedupe`）、profiling、日志、环境、优雅关闭 |
| `nodejs-core` | V8（GC/隐藏类/JIT）、libuv（事件循环/线程池/异步 I/O）、N-API/node-addon-api/原生内存、核心模块 internals、primordials、构建（gyp/ninja/make）、CLI 选项、贡献/commit/PR 规范、原生 debug/profiling |
| `typescript-magician` | 泛型/约束/推断、条件类型、`infer`、模板字面量、映射类型、`as const`/`typeof`、工具类型、品牌/名义类型、类型收窄、函数重载、错误诊断 |
| `oauth` | 授权码 + PKCE、client credentials、设备流、刷新令牌轮换、JWT 校验、introspection/revocation、Fastify 集成、RFC 6749/6750/7636/7519/8252/8628 |
| `linting-neostandard-eslint9` | `neostandard()` flat config、ESLint v9、从 `standard` 迁移、从 `.eslintrc*` 迁移、CI/pre-commit/编辑器集成 |
| `documentation` | Diátaxis 四类（教程/指南/参考/解释）、类型识别决策表、类型专属模式、分离与交叉链接、交付前校验 |
| `init` | 高信号 `AGENTS.md`：可发现性过滤、非可发现地雷、工作流坑、层级化 AGENTS、质量门禁 |
| `octocat` | Git/GitHub 全用 `gh` CLI：PR 创建/评审、CI 监视、交互式 rebase、分支清理、submodule、`git log/blame/bisect` 考古 |
| `skill-optimizer` | 提升技能激活率、benchmark 表现、跨模型抗回归 |
| `snipgrapher` | 配置并用 snipgrapher 生成精美代码截图图片 |

## 安装

```bash
npx skills add mcollina/skills
```

遵开放 Agent Skills 标准，可装进 Claude Code / GitHub Copilot / Codex 等；装后 agent 按任务匹配自动激活，也可自然语言显式触发。

## Diátaxis 四类（documentation 技能）

| 类型 | 导向 | 标题模式 | 交付校验 |
| --- | --- | --- | --- |
| 教程 | 学习 | 动词开头「Build your first X」 | 新手能否无外援端到端走完 |
| 指南 | 问题 | 任务式「How to configure X」 | 老手能否无困惑解决问题 |
| 参考 | 信息 | 命名式「Configuration options」 | 能否 30 秒内查到某一事实 |
| 解释 | 理解 | 概念式「How X works」 | 读后能否用自己的话解释 why |

## ESLint v9 + neostandard（linting 技能）

```bash
npm install --save-dev eslint@9 neostandard
```

```js
// eslint.config.js
import neostandard from 'neostandard'
export default neostandard()
```

```bash
npx eslint .
```

原则：pin 主版本、config 极简显式、flat config、lint 失败当 CI 质量门禁、本地才 `--fix`。

## OAuth 安全清单（oauth 技能）

| 要求 | RFC |
| --- | --- |
| 校验 redirect URI 白名单 | RFC 6749 §3.1.2 |
| 公共客户端 PKCE（S256） | RFC 7636 §4.2 |
| 校验 `state` 防 CSRF | RFC 6749 §10.12 |
| 每 JWT 校验 `iss`/`aud`/`exp` | RFC 7519 §4 |
| 刷新令牌每次轮换 | RFC 6749 §10.4 |
| 全程 HTTPS、拒 HTTP redirect | RFC 6749 §3.1.2.1 |
| 令牌端点限流 | OAuth 2.1 §7 |

## nodejs-core 常用 debug 命令

```bash
# V8 优化/去优化追踪
node --trace-opt --trace-deopt script.js
node --prof script.js && node --prof-process isolate-*.log > processed.txt

# 事件循环延迟
node --trace-event-categories v8,node,node.async_hooks script.js

# 原生插件 gdb
gdb --args node --napi-modules ./build/Release/addon.node
```

铁律：改 `src/`/`lib/` → `make -j$(nproc)` → `make lint` → 再测。

## 版本与许可

- **许可**：MIT，Copyright © 2026 Matteo Collina
- **格式**：遵开放 Agent Skills 标准，每技能一个 `SKILL.md`（frontmatter `name`/`description`/`metadata.tags`）+ 多数带 `rules/*.md` 细则
- **性质**：个人权威（非 nodejs org 官方）
- **ESLint**：v9（flat config）；**neostandard**：Standard 风格基线；**Node**：type stripping 需 22.6+

## 资源链接

- 仓库：[mcollina/skills](https://github.com/mcollina/skills)（MIT）
- README：[mcollina/skills#readme](https://github.com/mcollina/skills#readme)
- benchmark：[跨模型 skill benchmarking 工作流](https://github.com/mcollina/skills/blob/main/docs/skill-benchmarking.md)
- 开放标准：[agentskills.io](https://agentskills.io/)
- 作者：Matteo Collina（Node.js TSC · Fastify/Pino 作者 · Platformatic CTO）
