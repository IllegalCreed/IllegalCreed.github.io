---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 onmax/nuxt-skills（社区项目，非官方，Nuxt 4+）主分支的 README 与 skills/ 编写。

## 速查

- **装**：`npx skills add onmax/nuxt-skills`（自动检测 agent，交互式挑选；`-g` 全局，`-y` 装全部）
- **另一种（Claude Code）**：`/plugin marketplace add onmax/nuxt-skills` → `/plugin install nuxt-skills@nuxt-skills`
- **21 个 skill**：核心 `nuxt`/`vue`；Nuxt 生态 `nuxthub`/`nuxt-content`/`nuxt-ui`/`nuxt-modules`/`nuxt-seo`/`nuxt-studio`/`nuxt-better-auth`；Vue 生态 `reka-ui`/`vueuse`/`motion`/`tresjs`；工具链 `vite`/`vitest`/`pnpm`/`tsdown`/`ts-library`；写作 `document-writer`/`writing-web-documentation`；游戏 `phaser-best-practices`
- **社区定位**：作者 onmax，**非 nuxt 官方 org**；官方 PR #33498 已关闭，RFC #34059 讨论「模块内置 skills」
- **触发**：① 自动发现（agent 读 `description` 匹配任务）② 手动 `/nuxt` 等显式加载
- **跨 agent**：Claude Code / Cursor / Codex / OpenCode / Copilot / Gemini / Antigravity / Roo Code
- **格式**：agentskills.io 开放格式，每 skill = `SKILL.md`（入口）+ `references/`（按需子文件）；MIT

## 安装

```bash
npx skills add onmax/nuxt-skills
```

[`skills`](https://www.npmjs.com/package/skills) CLI 会自动检测你已安装的 agent，并给出交互式挑选器。加 `-g` 装到用户级（全局），加 `-y` 一次装全部 skill。支持 Claude Code、Cursor、Codex、OpenCode、GitHub Copilot、Antigravity、Roo Code 等。

### Claude Code Marketplace（可选）

Claude Code 用户还有一条路——把整套作为一个插件装，插件内部动态发现所有 skill 条目：

```bash
# 添加 marketplace
/plugin marketplace add onmax/nuxt-skills

# 安装 Nuxt Skills
/plugin install nuxt-skills@nuxt-skills
```

### 手动安装

克隆仓库，把 skill 文件夹拷进 agent 的 skills 目录：

| Agent       | 项目内路径          | 全局路径                     |
| ----------- | ------------------- | ---------------------------- |
| Claude Code | `.claude/skills/`   | `~/.claude/skills/`          |
| Cursor      | `.cursor/skills/`   | `~/.cursor/skills/`          |
| Codex       | `.codex/skills/`    | `~/.codex/skills/`           |
| OpenCode    | `.opencode/skill/`  | `~/.config/opencode/skill/`  |
| Copilot     | `.github/skills/`   | —                            |

## 21 个 skill 总览

一条命令装进来的是「Nuxt 全栈那套」——按主题分五组：

| 组 | skill | 一句话 |
| --- | --- | --- |
| **核心** | `nuxt` · `vue` | Nuxt 4+ 服务端路由/路由/中间件/composables；Vue 3 组合式 API |
| **Nuxt 生态** | `nuxthub` · `nuxt-content` · `nuxt-ui` · `nuxt-modules` · `nuxt-seo` · `nuxt-studio` · `nuxt-better-auth` | 全栈存储、内容站、UI 库、模块开发、SEO、CMS、鉴权 |
| **Vue 生态** | `reka-ui` · `vueuse` · `motion` · `tresjs` | 无头组件、composables、动画、3D |
| **工具链** | `vite` · `vitest` · `pnpm` · `tsdown` · `ts-library` | 构建、测试、包管理、打包、库开发 |
| **写作 / 游戏** | `document-writer` · `writing-web-documentation` · `phaser-best-practices` | 文档写作、Phaser 3 游戏 |

> **数量小注**：README 的 Skills 表列了 19 行，而仓库实际 ships **21 个 skill 文件夹**（多出 `nuxt-studio` 与 `phaser-best-practices`）。以磁盘上的 `skills/` 为准。

各组更细的 skill 定位见 [参考页的分组全表](./reference#skills-分组全表)。

## 社区定位与官方化进程

这一节最容易被误解，务必如实理解：

- **它是社区个人项目**：仓库归 **onmax**（Nuxt 生态活跃贡献者）个人，**不属于 `nuxt` 官方组织**。别在文档/PPT 里把它标成「Nuxt 官方 Skills」。
- **官方尝试已关闭**：nuxt 官方仓库曾有 PR [#33498](https://github.com/nuxt/nuxt/pull/33498)（给 Nuxt 加 Claude Code skill），**已 closed、未合并**。
- **官方化仍在讨论**：RFC [#34059](https://github.com/nuxt/nuxt/discussions/34059)「Bundling Agent Skills in Nuxt Modules」在讨论让 Nuxt **模块自带 skills** 的方向——若落地，未来「装模块即得 skill」，这套社区仓库的定位可能随之变化。
- **可能迁站**：README 顶部 WARNING 明说本仓库未来可能被 [nuxt-skill.onmax.me](https://nuxt-skill.onmax.me/) 取代。

一句话：**现在用它没问题（MIT、维护活跃、有 CI 自动更新），但它是社区产物，官方内置还在路上。**

## 如何触发

skill 遵循 [Agent Skills](https://agentskills.io) 开放格式，两种激活方式：

1. **自动发现**：agent 读每个 skill 的 `description`（frontmatter 里写明「Use when…」），任务相关时自动加载
2. **手动调用**：输入 `/skill-name`（如 `/nuxt`）显式加载

agent 会按你在做的事挑 skill：

| 你在动的文件 / 任务 | agent 可能自动加载 |
| --- | --- |
| `.vue` 文件 | `vue` |
| `server/api/` 路由 | `nuxt` |
| `nuxt.config.ts` | `nuxt` |
| NuxtHub 存储（DB/KV/Blob） | `nuxthub` |
| 鉴权 / 登录 / 会话 | `nuxt-better-auth` |

## 下一步

- [指南](./guide-line) —— 渐进披露与多 skill 组织、nuxt 核心（app/ 目录、useFetch/useAsyncData、server routes、SSR/hydration）、生态 skills、反模式
- [参考](./reference) —— 21 skills 分组全表 + 安装/多 agent + 版本 + 贡献 + 许可 + 链接
