---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 denoland/skills 官方 skills（README 与 `skills/*/SKILL.md`）编写，覆盖 deno-guidance / deno-deploy / deno-frontend / deno-expert / deno-project-templates / deno-sandbox 六个技能。

## 速查

- **是什么**：Deno 官方（denoland org）的 AI 编码助手技能集，6 个 skill，MIT，遵 agentskills.io 规范
- **装（插件）**：`/plugin marketplace add denoland/skills` → `/plugin install deno-skills@denoland-skills`
- **装（手动）**：`git clone https://github.com/denoland/skills.git /tmp/deno-skills` → `cp -r /tmp/deno-skills/skills/* ~/.claude/skills/`
- **6 skills**：`deno-guidance`（基础/deno.json/JSR/CLI）·`deno-deploy`（新 `deno deploy` CLI/env/KV）·`deno-frontend`（Fresh 2.x/island/Preact/Tailwind）·`deno-expert`（审查/调试）·`deno-project-templates`（脚手架）·`deno-sandbox`（`@deno/sandbox` 沙箱）
- **三大原则**：① JSR（`jsr:`）优先于旧的 URL 式导入（已废弃）② `npm:` 作后备 ③ 内建工具 `deno fmt`/`lint`/`test`/`doc`
- **两个纠偏点**：部署用 `deno deploy`（**非弃用的 `deployctl`**，需 Deno ≥ 2.4.2）；前端用 Fresh 2.x（**非 1.x**）
- **激活**：装后在有 `deno.json` 的项目 / 建 Deno 应用 / 加依赖 / 部署 / 建 Fresh 应用 / 跑沙箱时自动应用

## 官方定位

Deno Skills 出自 **denoland org**——即 Deno 团队本身，不是社区二手总结。它遵循 [Agent Skills 开放规范](https://agentskills.io/specification)，把「现代 Deno 开发知识」封装成 6 个技能，教 AI 助手用当前最佳实践构建 Deno 应用。

它的一大存在意义是**纠正 LLM 的过时习惯**：很多模型的训练数据里默认写旧的 URL 式导入、Fresh 1.x 模式、用 `deployctl` 部署——这些如今都已废弃。Deno Skills 用明确的 guardrail 把 AI 拉回现代写法。

## 安装

### 方式一：作为插件（Claude Code）

```bash
# 添加 marketplace
/plugin marketplace add denoland/skills

# 安装插件
/plugin install deno-skills@denoland-skills
```

### 方式二：手动 clone + 拷贝

```bash
# 克隆仓库
git clone https://github.com/denoland/skills.git /tmp/deno-skills

# 拷贝单个技能到个人技能目录
cp -r /tmp/deno-skills/skills/deno-guidance ~/.claude/skills/

# 或一次拷贝全部
cp -r /tmp/deno-skills/skills/* ~/.claude/skills/
```

其它平台：Cursor 放 `~/.cursor/skills/`（需 v2.4+）；VS Code + GitHub Copilot 放 `.github/skills/` 并开启 `chat.useAgentSkills` 设置。装后技能自动生效——AI 在相关任务时调用。

## 6 个技能总览

| 技能 | 何时用 | 一句话 |
| --- | --- | --- |
| `deno-guidance` | 起项目、选包、配 `deno.json`、跑 CLI | 基础规范：JSR 优先、内建工具、权限模型 |
| `deno-deploy` | 部署到 Deno Deploy | 新 `deno deploy` CLI（非 `deployctl`）、env + KV、tunnel |
| `deno-frontend` | 建 Fresh 前端、写 Preact/Tailwind | Fresh 2.x：文件路由、island 架构、`define.handlers` |
| `deno-expert` | 审查/调试 Deno 代码 | 专家级 checklist，每次都提醒 fmt/lint/test |
| `deno-project-templates` | 脚手架新项目 | Fresh Web / CLI / 库 / API server 四类模板 |
| `deno-sandbox` | 跑不可信 / AI 生成代码 | `@deno/sandbox` Firecracker microVM 隔离执行 |

## 三大核心：Deno、JSR、Fresh

### Deno runtime

- **原生 TypeScript**：直接跑 `.ts`，无需构建步骤
- **显式权限**：`--allow-net`、`--allow-read`、`--allow-env` 等 flag 授权，默认最小权限
- **`deno.json`**：配置文件（类似 `package.json` 但更简），`imports` 字段即 import map
- **内建工具**：`deno fmt`（格式化）、`deno lint`（检查）、`deno test`（测试）、`deno check`（类型检查）、`deno doc`（文档）

### JSR：现代包注册表

包管理优先级：

1. **JSR 包（`jsr:`）**——Deno 原生首选，类型内建、解析快，如 `jsr:@std/http`、`jsr:@fresh/core`
2. **npm 包（`npm:`）**——无 JSR 替代时用，Deno 全兼容 npm，如 `npm:express`、`npm:zod`
3. **避免**：旧的 URL 式导入（已废弃）——很多 LLM 会错误默认这种，技能明确禁止

标准库在 JSR 的 `@std/` 下：

```jsonc
// deno.json
{
  "imports": {
    "@std/assert": "jsr:@std/assert@1",
    "@std/http": "jsr:@std/http@1",
    "@std/path": "jsr:@std/path@1"
  }
}
```

```typescript
import { serve } from "@std/http";
import { join } from "@std/path";
```

用 `deno add jsr:@std/http` 加包（保持 lockfile 同步）；`deno update` 更新**项目依赖**，`deno upgrade` 更新 **Deno runtime 本身**——两者别混。

### Fresh：Deno 的 Web 框架

Fresh 用 **island 架构**——页面在服务端渲染，只有交互部分（island）才向浏览器发 JavaScript。建项目：

```bash
deno run -Ar jsr:@fresh/init my-project
cd my-project
deno task dev    # 开发服务器跑在 http://127.0.0.1:5173/
```

务必用 **Fresh 2.x**：`import { App } from "fresh"`（旧的美元符号导入路径已废弃）、无 manifest 文件、用 `vite.config.ts`、handler 用单一 `(ctx)` 参数、统一 `_error.tsx`。详见[指南](./guide-line)。

## 下一步

- [指南](./guide-line) —— 6 skills 逐个深入、反模式、作用域机制
- [参考](./reference) —— 6 skills 全表、CLI/JSR、Fresh 2.x、`deno deploy` 命令、安装、许可
