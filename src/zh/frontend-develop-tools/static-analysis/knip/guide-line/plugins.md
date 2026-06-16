---
layout: doc
outline: [2, 3]
---

# 插件机制

> 基于 Knip v6.17.1 编写

## 速查

- **155+ 内置插件**，按 `package.json` 里的依赖**自动启用**，无需手动开
- 插件做三件事：①解析工具配置文件 ②补充入口文件 ③识别隐式依赖
- 例：Vitest 插件自动把 `**/*.{test,spec}.ts` 加为入口
- 例：ESLint 的 `"extends": ["airbnb"]` 能被识别出 `eslint-config-airbnb` 依赖
- 覆盖 Vite / Jest / Next / Storybook / Playwright / Angular / Webpack 等主流工具
- **插件缺失或不全是误报的主要来源**——可改进插件而非到处 `ignore`

## 为什么需要插件

很多依赖**不是**通过 `import` 用到的，而是写在工具的配置文件里。比如：

- `.eslintrc.json` 里 `"extends": ["airbnb", "prettier"]` 引用了 `eslint-config-airbnb`、`eslint-config-prettier`
- `vitest.config.ts`、`playwright.config.ts` 引用了各自的运行器与插件
- `package.json` 的 `scripts` 里调用了某个 CLI 命令

纯靠分析 `import`，这些会被误判为"未使用的依赖"。**插件就是来补上这块的**。

## 插件做的三件事

1. **解析配置文件**：读 `.eslintrc`、`vitest.config.ts`、`tailwind.config.js` 等，把里面引用到的依赖挖出来，避免误报为"未使用"。
2. **补充入口文件**：自动把工具约定的文件加为 `entry`。例如 Vitest 插件加上 `**/*.{test,test-d,spec,spec-d}.ts`，无需你手写。
3. **识别隐式依赖**：从配置里提取并非 `import` 形式的依赖引用（如 `extends`、`plugins` 字段里的包名）。

## 自动启用

插件**按 `package.json` 的依赖自动启用**：装了 `vitest`，Vitest 插件就生效；装了 `eslint`，ESLint 插件就生效。不必在配置里手动声明开启。

```json
// 装了这些，对应插件即自动工作
{
  "devDependencies": {
    "vitest": "^4.0.0",
    "eslint": "^9.0.0",
    "next": "^15.0.0"
  }
}
```

## 覆盖范围

官方提供 **155+** 插件，覆盖绝大多数主流工具，包括但不限于：

| 领域       | 代表插件                                              |
| ---------- | ----------------------------------------------------- |
| 构建/打包  | Vite、Webpack、Rollup、esbuild、Rspack                |
| 框架       | Next.js、Nuxt、Angular、Remix、Astro、SvelteKit       |
| 测试       | Vitest、Jest、Playwright、Cypress                     |
| 代码质量   | ESLint、Prettier、Biome、Stylelint、commitlint        |
| 其它       | Storybook、Tailwind、TypeScript、GitHub Actions       |

完整清单见官方 [Plugins](https://knip.dev/reference/plugins)（页面列出全部 150+ 项）。

## 插件与误报的关系

::: warning 插件不全 = 误报来源
官方明确指出：**缺失或不完整的插件是误报的主要来源**。当某工具的依赖被误报为"未使用"时，正确做法往往是**改进/新增插件**，而非到处加 `ignoreDependencies`——前者一次解决、对所有项目生效，后者只是局部消音。
:::

如果配置覆盖不到你的自定义入口，可在 Knip 配置里手动补 `entry`（见 [配置](./configuration.md#entry-与-project-两个核心字段)）。系统性处理误报的步骤见 [处理误报](./usage-and-fixing.md#处理误报)。
