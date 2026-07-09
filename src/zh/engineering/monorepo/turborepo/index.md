---
layout: doc
---

# Turborepo

为 JavaScript / TypeScript monorepo 服务的高性能任务编排与缓存系统，基于依赖图并行执行任务，并对任务输出做本地与远程缓存。

## 评价

**优点**

- 任务依赖图驱动 + 输入哈希缓存，**重复执行近乎瞬时**（"do the work once"）
- 内置 Remote Cache（Vercel 托管或自托管），团队成员、CI 之间共享构建产物
- 一条 `--affected` 即可在大 monorepo 中只跑受变更影响的包，CI 流水线压缩明显
- 命令面 (`--filter`) 表达力强，支持按包名 / 目录 glob / dependents / dependencies / Git 范围组合
- 与包管理器解耦：pnpm / npm / yarn / bun 均可，仅依赖 workspace 声明
- v2 起 Strict 环境变量模式作为默认，杜绝"忘了在 `env` 里声明导致缓存命中错误产物"这类坑

**缺点**

- 缓存正确性强依赖 `inputs` / `outputs` / `env` 的精确声明，配置不当容易出现"该 miss 没 miss / 该 hit 没 hit"
- Remote Cache 自托管需要额外维护对象存储和签名密钥
- 文档中部分能力已被标记为 **deprecated**（`scan` 命令、`--no-cache` / `--remote-only` / `--parallel` 等）或 **experimental**（`boundaries`、`futureFlags.*`）
- 任务编排粒度是"包级"，包内做不到任务图细分（更细的依赖需自行用 `dependsOn` + 拆任务）

## 文档地址

[Turborepo](https://turborepo.com/docs)

## GitHub地址

[Turborepo](https://github.com/vercel/turborepo)

## 幻灯片地址

<a href="/SlideStack/turborepo-slide/" target="_blank">Turborepo</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=turborepo" target="_blank" rel="noopener noreferrer">Turborepo 测试题</a>
