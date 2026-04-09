# lint-staged 文档审查计划

## Context

按照内容生产流程，对现有 lint-staged VitePress 文档进行质量审查。对照最新官方文档（v16.4.0, 2026-03-14） 逐页比对，识别事实错误、缺失内容和可改进项。

## 执行状态

✅ 已完成 - 2026-04-08

## 审查发现

### index.md

| # | 类型 | 问题 | 状态 |
|---|------|------|------|
| 1 | 缺失 | 缺少版本号 | ✅ 已添加 |
| 2 | 缺失 | 缺少文档地址链接 | ✅ 已添加 |
| 3 | 内容 | "缺点"过于主观 | ✅ 已修改为客观描述 |

### getting-started.md

| # | 类型 | 问题 | 状态 |
|---|------|------|------|
| 1 | **事实错误** | `packagge.json` typo | ✅ 已修复 |
| 2 | **事实错误** | 写的是 MicroMatch，官方 v16 用 picomatch | ✅ 已修复 |
| 3 | 缺失 | 缺少版本号 | ✅ 已添加 |
| 4 | 缺失 | 缺少 Node.js 最低版本要求 | ✅ 已添加到 v16 重大变更提示 |
| 5 | 缺失 | 缺少 v16 `--shell` 移除说明 | ✅ 已添加到 v16 重大变更提示 |
| 6 | 缺失 | 缺少 CLI 参数文档 | ✅ 已新增章节 |
| 7 | 缺失 | 缺少 Node.js API 用法 | ✅ 已新增章节 |
| 8 | 缺失 | 缺少 CI 使用场景 | ✅ 已新增章节 |
| 9 | **缺失** | 缺少 lint-staged 官方的 ESLint ignore 方案 | ✅ 已整合到"忽略文件"章节 |
| 10 | 缺失 | "忽略文件"章节原则不清晰 | ✅ 已添加核心原则说明 |

### advanced.md

| # | 类型 | 问题 | 状态 |
|---|------|------|------|
| 1 | **事实错误** | 所有示例用 `import micromatch from 'micromatch'` | ✅ 已修复为 picomatch |
| 2 | **过时** | `stylelint --syntax=scss` | ✅ 已修复 |
| 3 | 缺失 | 缺少 JavaScript Functions（对象式任务配置） | ✅ 已新增章节 |
| 4 | 缺失 | Monorepo 说明不完整 | ✅ 已补充关键细节 |
| 5 | 缺失 | 缺少 `--diff` CI 用法 | ✅ 已新增到 CI 章节中 |
| 6 | 缺失 | 缺少 `--fail-on-changes`、`--continue-on-error` 说明 | ✅ 已新增到 CI 章节中 |
| 7 | 缺失 | 缺少 Node.js API 文档 | ✅ 已整合到 getting-started |
| 8 | 缺失 | TypeScript tsconfig 忽略问题 | ✅ 已新增章节 |

## glob 库家族说明

lint-staged 从 micromatch 切换到 picomatch：

| 库 | 定位 | 特点 |
|---|------|------|
| **minimatch** | 原始实现 | 老牌、功能完整、但较慢 |
| **micromatch** | minimatch 的替代品 | 功能最全，支持 brace expansion、extglobs、POSIX brackets |
| **picomatch** | 轻量级 | **零依赖**，加载约 2ms，API 精简 |
| **nanomatch** | 极简版 | 最快的简化实现 |

**切换时间**：lint-staged v15.2.10 仍使用 micromatch，v16.x 切换到 picomatch

## 验证

```bash
cd /Users/zhangxu/workspace/IllegalCreedWebsite && pnpm docs:dev
```
