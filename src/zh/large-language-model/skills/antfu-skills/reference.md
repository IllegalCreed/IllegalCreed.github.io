---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 antfu/skills README 与 skills/ 编写。

## 速查

- **装**：`pnpx skills add antfu/skills --skill='*'`（`-g` 全局）
- **19 技能三类**：手工维护 2 / 官方文档生成 8 / vendored 9
- **核心**：git submodule 引源文档，随上游同步
- **antfu 约定**：显式 import、无 alias、isomorphic + `@env`、types/constants 分离
- **可 fork 作模板**：改 meta.ts + submodule 生成自己的
- Anthony Fu（Vue/Nuxt/Vite 核心），MIT（vendored 保留原许可）

## 全技能表（三类）

### 手工维护（opinionated）

| 技能 | 描述 |
| --- | --- |
| `antfu` | Anthony Fu 对 app/库项目的偏好（eslint、pnpm、vitest、vue 等） |
| `antfu-design` | UnoCSS 中心的设计原则、语义 token、双主题、anti-slop |

### 从官方文档生成（unopinionated）

| 技能 | 源 |
| --- | --- |
| `vue` | vuejs/docs |
| `nuxt` | nuxt/nuxt |
| `pinia` | vuejs/pinia |
| `vite` | vitejs/vite |
| `vitepress` | vuejs/vitepress |
| `vitest` | vitest-dev/vitest |
| `unocss` | unocss/unocss |
| `pnpm` | pnpm/pnpm.io |

### vendored（同步自外部）

| 技能 | 源 |
| --- | --- |
| `slidev`（官方） | slidevjs/slidev |
| `tsdown`（官方） | rolldown/tsdown |
| `turborepo`（官方） | vercel/turborepo |
| `vueuse-functions`（官方） | vueuse/skills |
| `vue-best-practices` / `vue-router-best-practices` / `vue-testing-best-practices` | vuejs-ai/skills |
| `web-design-guidelines` | vercel-labs/agent-skills |

## antfu 约定

| 类 | 约定 |
| --- | --- |
| 代码组织 | 单一职责/文件、大文件拆、`types.ts`、`constants.ts` |
| 运行时 | isomorphic 优先、`// @env node`/`browser` 标注 |
| TypeScript | 显式返回类型、复杂类型抽 type/interface |
| 显式性 | 显式 import（关 auto-import）、默认无 path alias（用相对导入） |

## 生成你自己的技能集

```bash
# 1. fork/clone 后
pnpm install
# 2. 改 meta.ts 填你的项目和技能源
# 3. 初始化
pnpm start cleanup   # 清旧 submodule/技能
pnpm start init      # clone submodule
pnpm start sync      # 同步 vendored
# 4. 让 agent：Generate skills for <project>（建议一次一个）
```

## Skills vs AGENTS.md（Anthony 观点）

- skills 价值 = shareable + on-demand
- 承认「AGENTS.md outperforms skills」为真（全量前置、无假阴性），视为工具集成 gap
- 实用技巧：**想让某技能总生效，在 AGENTS.md 里引用它**

## 许可

Skills 与脚本 MIT；vendored 技能保留原仓库许可——见各技能目录。

## 资源链接

- 仓库：[antfu/skills](https://github.com/antfu/skills)
- Anthony Fu：[antfu.me](https://antfu.me/)
- skills CLI：[vercel-labs/skills](https://github.com/vercel-labs/skills)
- 相关叶：[Vue Skills](../vue-skills/)（被 vendored）· [Vercel Agent Skills](../vercel-agent-skills/)（被 vendored）
