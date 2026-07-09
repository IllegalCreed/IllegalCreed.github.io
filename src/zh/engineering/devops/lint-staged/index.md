---
layout: doc
---

# lint-staged

> 基于 lint-staged v17.0.4 编写

在 Git 的 **暂存区文件（staged files）** 上跑 format / lint / 类型检查等命令——只检查"这次提交"涉及的文件，比扫全仓库快几个数量级。配合 husky `pre-commit` hook，把"格式化 + 静态检查"做到提交时刻自动完成。

## 评价

通常和 [husky](../husky/) 搭配使用：husky 装钩子、lint-staged 跑命令。

**优点**

- **作用范围精准**：只处理 git 暂存的文件，提交 1 个文件不会扫全仓库
- **支持任意工具**：prettier / eslint / stylelint / tsc / 自定义脚本都行，命令字符串 + 函数式两种形态
- **Glob 灵活**：基于 [picomatch](https://github.com/micromatch/picomatch)，支持 `*.{js,ts}` / `!(*.test).js` / 路径前缀等所有常见模式
- **Monorepo 友好**：每个 package 可以放独立配置文件，lint-staged 自动用最近的那份
- **修改后自动 staged**：命令修改了文件不需要手动 `git add`，lint-staged 会自动入暂存

**缺点**

- **不能独立运行**：必须由 git hook（husky）或 CI 触发——不是"持续"工具
- **不负责忽略**：忽略逻辑得交给底层工具（`.prettierignore` / ESLint `ignores`）；lint-staged 只负责把暂存文件列表交给命令
- **glob 重叠 = 竞争条件**：多个规则匹配同一文件 + 命令都修改文件时可能互相覆盖，要靠否定模式或 `--concurrent` 手动规避
- **v17 起 Node.js 必须 22.22.1+**：v16 还兼容 Node 20，v17 强制升 22 LTS

## v17 版本要点

- **Node.js 最低 22.22.1**（v16 还能跑 Node 20，v17 强制升 LTS）
- **Git 最低 2.32.0**（2021 年的版本，基本没人比这更低）
- **新 flag `--hide-all`**：跑任务前把未暂存改动 + 未跟踪文件都隐藏，给 Knip 这种"全仓扫死代码"的工具准备
- **YAML 配置文件依赖改为可选**：用 `.lintstagedrc.yaml` 的话要单独 `pnpm add yaml`
- **CLI 解析器从 `commander` 换成原生 `node:util.parseArgs`**：bundle 更小
- **改用 `git update-index --again`** 替代 `git add <files>`：对非默认 index（worktree、自定义索引）兼容性更好
- **Bun 运行时全测试通过**

## 文档地址

[lint-staged GitHub README](https://github.com/lint-staged/lint-staged#readme)（README 即官方文档）

## GitHub 地址

[lint-staged/lint-staged](https://github.com/lint-staged/lint-staged)

## 幻灯片地址

<a href="/SlideStack/lint-staged-slide/" target="_blank">lint-staged</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=lint-staged" target="_blank" rel="noopener noreferrer">lint-staged 测试题</a>
