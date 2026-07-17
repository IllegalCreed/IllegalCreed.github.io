---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 onmax/nuxt-skills（社区项目，非官方）README 与 skills/ 编写。

## 速查

- **装**：`npx skills add onmax/nuxt-skills`（`-g` 全局 / `-y` 全装）；或 Claude Code `/plugin marketplace add onmax/nuxt-skills`
- **21 skills / 5 组**：核心 2 · Nuxt 生态 7 · Vue 生态 4 · 工具链 5 · 写作与游戏 3
- **格式**：agentskills.io；每 skill = `SKILL.md` + 可选 `references/`；MIT
- **激活**：自动发现（读 description）+ 手动 `/skill-name`
- **多 agent**：Claude Code / Cursor / Codex / OpenCode / Copilot / Gemini / Antigravity / Roo Code
- **版本快照**：Nuxt 4.3+ · NuxtHub v0.10.6 · Nuxt UI v4.4 · Reka UI v2 · VueUse v14
- **自动维护**：GitHub Actions 每周重生成 reka-ui/nuxt-ui/vueuse 文档，每两周检测上游破坏性变更

## Skills 分组全表

| 组 | Skill | 覆盖 |
| --- | --- | --- |
| **核心** | `nuxt` | Nuxt 4+ 服务端路由、文件路由、中间件、composables、config（h3 v1 / nitro v2，4.3+） |
| | `vue` | Vue 3 组合式 API、组件、composables、测试、props/emits |
| **Nuxt 生态** | `nuxthub` | NuxtHub v0.10.6：DB（Drizzle）、KV、Blob、Cache、多云部署 |
| | `nuxt-content` | Content v3：collections、queryCollection、MDC 渲染、NuxtStudio |
| | `nuxt-ui` | @nuxt/ui v4：组件、表单校验、数据表、overlays、Tailwind Variants 主题 |
| | `nuxt-modules` | 建模块：defineNuxtModule、Kit 工具、hooks、E2E 测试、发布 |
| | `nuxt-seo` | SEO 元模块：robots、sitemap、og-image、schema-org、site config |
| | `nuxt-studio` | 自托管开源 CMS：可视化编辑、媒体管理、Git 发布、AI 内容 |
| | `nuxt-better-auth` | @onmax/nuxt-better-auth：useUserSession、路由保护、clientOnly |
| **Vue 生态** | `reka-ui` | Reka UI（无头 Vue，前 Radix Vue）：可访问原语、asChild、受控态 |
| | `vueuse` | VueUse composables：状态、浏览器、传感器、网络、动画工具 |
| | `motion` | Motion Vue（motion-v）：motion 组件、手势、滚动联动、布局过渡 |
| | `tresjs` | TresJS 3D（Vue Three.js）：TresCanvas、Cientos 助手、后处理 |
| **工具链** | `vite` | Vite 构建：config、插件、HMR、SSR、库模式、Vite 8 Rolldown 迁移 |
| | `vitest` | Vitest 测试：test API、mock、覆盖率、类型测试、环境 |
| | `pnpm` | pnpm 包管理：workspaces、catalogs、overrides、CI/CD |
| | `tsdown` | tsdown 打包器：TS 库、DTS 生成、双 ESM/CJS、包校验 |
| | `ts-library` | TS 库开发：exports、构建工具、API 模式、类型技巧、CI |
| **写作 / 游戏** | `document-writer` | 写 Nuxt 生态文档：MDC、风格、结构、代码示例 |
| | `writing-web-documentation` | 通用开发者文档：页面类型、行文风格、模板、Web 项目规则 |
| | `phaser-best-practices` | Phaser 3 浏览器游戏：场景、实体、物理、tilemap、输入、音频 |

> README 的可见 Skills 表列 **19 行**，仓库实际 ships **21 个 skill 文件夹**（多 `nuxt-studio` + `phaser-best-practices`）。上表以磁盘 `skills/` 为准。

## 安装与多 agent

```bash
# 标准安装（自动检测 agent，交互式挑选）
npx skills add onmax/nuxt-skills

# 全局 / 全装
npx skills add onmax/nuxt-skills -g
npx skills add onmax/nuxt-skills -y

# Claude Code marketplace（作为一个插件装，动态发现全部 skill）
/plugin marketplace add onmax/nuxt-skills
/plugin install nuxt-skills@nuxt-skills
```

手动安装：克隆仓库，把 `skills/<name>/` 拷进对应 agent 目录（各 agent 路径见[入门页表格](./getting-started#手动安装)）。

## 激活方式

| 方式 | 怎么触发 |
| --- | --- |
| **自动发现** | agent 读每个 skill `SKILL.md` frontmatter 的 `description`（「Use when…」），任务相关时自动加载 |
| **手动调用** | 输入 `/skill-name`（如 `/nuxt`、`/nuxthub`）显式加载 |

## 版本快照

skill 内标注的上游版本（会随上游演进，仅供参考）：

| 库 | skill 内版本 |
| --- | --- |
| Nuxt | 4.3+（h3 v1 / nitropack v2） |
| NuxtHub | v0.10.6 |
| Nuxt UI | v4.4.0（2026-01） |
| Reka UI | v2 |
| VueUse | v14 |
| Nuxt Content | v3 |

## 目录结构

```txt
nuxt-skills/
├── skills/                     # 21 个 skill（agentskills 格式）
│   ├── nuxt/
│   │   ├── SKILL.md            # 入口（含 frontmatter）
│   │   └── references/         # 按需加载子文件
│   ├── vue/
│   ├── nuxthub/
│   ├── nuxt-content/
│   ├── nuxt-ui/
│   ├── ...（共 21 个）
│   └── versions.json           # 各 skill 版本锁
└── .claude-plugin/
    ├── plugin.json             # Claude Code 插件清单
    └── marketplace.json        # Claude Code marketplace
```

## 自动维护

| 工作流 | 频率 | 作用 |
| --- | --- | --- |
| `update-skills.yml` | 每周（周一） | 从上游重生成 reka-ui、nuxt-ui、vueuse 文档 |
| `skill-maintenance.yml` | 每两周（1 / 15 号） | Claude 分析上游 changelog，需要时开 PR |

## 贡献与致谢

- **格式**：遵 [agentskills](https://github.com/agentskills/agentskills) 标准，欢迎 PR
- **致谢**：`vue` skill 的 gotchas 源自 [vuejs-ai/skills](https://github.com/vuejs-ai/skills)（200+ 规则）；`vitest`/`vite`/`pnpm`/`tsdown` 源自 [@antfu](https://github.com/antfu) 的 [skills](https://github.com/antfu/skills)

## 许可

MIT（社区项目，作者 onmax）。

## 资源链接

- 仓库：[onmax/nuxt-skills](https://github.com/onmax/nuxt-skills)
- 格式规范：[agentskills.io](https://agentskills.io) ｜ [skills CLI（npm）](https://www.npmjs.com/package/skills)
- Nuxt 官方：[nuxt.com/docs](https://nuxt.com/docs)
- 官方化进程：[RFC #34059 · 模块内置 Skills](https://github.com/nuxt/nuxt/discussions/34059) ｜ [PR #33498（已关闭）](https://github.com/nuxt/nuxt/pull/33498)
- 相关叶：[Vercel Agent Skills](../vercel-agent-skills/) · [Antfu Skills](../antfu-skills/) · [Vue Skills](../vue-skills/)
