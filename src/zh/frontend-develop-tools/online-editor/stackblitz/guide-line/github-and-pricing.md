---
layout: doc
outline: [2, 3]
---

# GitHub 集成与套餐

> 基于 developer.stackblitz.com 与 @webcontainer/api 2025–2026 现状编写

## 速查

- **从 GitHub 打开**：`stackblitz.com/github/{owner}/{repo}`；指定 ref / 子目录用 `.../tree/{ref}/{folder}`
- **分享按钮推荐**：`stackblitz.com/fork/github/{owner}/{repo}`
- **查询参数**：`?title=`、`?startScript=`（打开后自动装依赖跑 npm script）、`?configPath=`（含 package.json 的子目录）、`?file=`
- **启动逻辑**：先找 `package.json` 的 `dev` → 再 `start` → 可被 `.stackblitzrc` 的 `startCommand` 覆盖
- **同步**：导入后保持连接，**push 到 GitHub 后项目自动更新**（GitHub 是权威源）
- **导入限制**：仅含 `package.json` 的项目；不支持后端语言（PHP/Python/Java）与需二进制服务进程的数据库（MySQL/PostgreSQL）
- **套餐（功能向，档名/价格以官方 pricing 为准）**：免费版仅**公开**项目 + 单文件上传 **1MB**；**私有**项目/仓库/npm 需**付费套餐**；**Enterprise** 才有 WebContainer API 商用 + 自托管 + SSO/SAML
- **bolt.new**：StackBlitz 的 AI 应用生成器，与编辑器订阅**独立计费**（按 token）
- **文档**：<https://developer.stackblitz.com/guides/integration/import-from-github>

## 从 GitHub 打开

把任意公开 GitHub 仓库直接在 StackBlitz 里打开，URL 规则如下：

| 目的                          | URL                                                 |
| ----------------------------- | --------------------------------------------------- |
| 打开仓库（默认分支）          | `stackblitz.com/github/{owner}/{repo}`              |
| 指定分支 / tag / commit       | `stackblitz.com/github/{owner}/{repo}/tree/{ref}`   |
| 指定子目录                    | `.../tree/{ref}/{folder}`                           |
| **分享按钮推荐写法**          | `stackblitz.com/fork/github/{owner}/{repo}`         |

::: tip 分享给读者用 `fork/github/...`
官方推荐文档 / README 里的「在 StackBlitz 打开」按钮用 `stackblitz.com/fork/github/{owner}/{repo}`——读者点开得到的是一份可自由改动的 fork，不会影响你的仓库。
:::

### 查询参数

| 参数            | 作用                                                       |
| --------------- | ---------------------------------------------------------- |
| `?file=`        | 打开后聚焦指定文件                                         |
| `?title=`       | 覆盖项目标题                                               |
| `?startScript=` | 打开后**自动安装依赖并运行**指定的 npm script              |
| `?configPath=`  | 指向含 `package.json` 的子目录（monorepo 常用）            |

```
https://stackblitz.com/github/vitejs/vite/tree/main/playground/vue?file=src/App.vue&startScript=dev
```

### 启动逻辑

StackBlitz 决定「打开后跑什么命令」的顺序：

1. 找 `package.json` 里的 **`dev`** script；
2. 没有则找 **`start`**；
3. 以上都可被 **`.stackblitzrc` 的 `startCommand`** 覆盖（或 `?startScript=` 指定）。

## 与 GitHub 保持同步

导入不是一次性快照——**项目会与 GitHub 仓库保持连接**：

- **GitHub 是权威源（source of truth）**：你 **push 到 GitHub 后，对应的 StackBlitz 项目会自动更新**。
- 这让「文档里的可运行 demo」能随仓库演进，而不必每次手动重建。

::: warning 导入的硬性限制
GitHub 导入要求：
- **仓库必须含 `package.json`**（这是 StackBlitz 识别项目的入口）；
- **不支持后端语言**：PHP / Python / Java 等；
- **不支持需要二进制服务进程的数据库**：MySQL / PostgreSQL 这类需要独立 server 进程的数据库跑不起来（用 LibSQL 等纯 JS / WASM 方案可绕开）。

这些限制都源于 WebContainers「只跑 JS + WASM」的本质。
:::

## 私有仓库

导入 / 同步**私有仓库需要付费套餐**。免费版只能用公开仓库。

## Codeflow / pr.new（表述谨慎）

StackBlitz 还有一套面向「在浏览器里 review / 改 PR」的 **Codeflow**，入口是 `pr.new`：

| URL                                          | 作用                                  |
| -------------------------------------------- | ------------------------------------- |
| `pr.new/github.com/{owner}/{repo}`           | 在 Codeflow IDE 里打开仓库            |
| `pr.new/github.com/{owner}/{repo}/pull/33`   | PR review 模式，查看该 PR 的 diff     |

::: danger Codeflow 改动会话间不持久化
Codeflow IDE 的改动**在会话之间不会保留**——**关页前必须 `commit & push`**，否则丢失。
:::

::: warning 文档里的 Beta / 年份是过期遗留
Codeflow 长期处于 **Beta**、并非官方当前主推方向。其文档里残留的 `Beta` / `2023` / `Node 16` 等时间戳是**过期遗留信息**，只参考它的**功能与 URL 规则**即可，**不要照抄里程碑 / 版本号**当事实。
:::

## 套餐定价

::: warning 档位名称与价格以官方 pricing 页为准
不同信源对**档位名称 / 价格 / 人数上限**说法不一，下文只总结**功能边界**（这部分各源一致），具体档名与金额请以官方 <https://stackblitz.com/pricing> 实时为准。
:::

按**功能**划分（而非纠结档名）：

| 能力档        | 关键边界                                                                 |
| ------------- | ------------------------------------------------------------------------ |
| **免费版**    | 无限**公开**项目 / collections / GitHub 仓库；**单项目文件上传 1MB**；社区支持 |
| **付费套餐**  | 解锁**私有**项目 / 私有仓库 / 私有 npm registry；团队协作与 GitHub 组织同步 |
| **Enterprise**| **WebContainer API 商用访问** + 自托管（on-prem / VPC）+ SSO / SAML       |

::: tip 最稳的记忆点
不论档名怎么变：**免费版只能建公开项目**；要**私有**就得**付费**；要把 **WebContainer API 用于商用**（或自托管 / SSO）则是 **Enterprise** 级。
:::

## bolt.new 关系（澄清）

- **bolt.new 是 StackBlitz 的 AI 应用生成器**：用自然语言 prompt 直接生成一个 app，底层同样建立在 **WebContainers** 上。
- **它没有取代编辑器本体**——StackBlitz 编辑器仍是独立产品，bolt.new 是其上的 AI 层。
- **计费完全独立**：bolt.new 走**独立的 token 体系**，与 StackBlitz 编辑器的订阅是两套账，价格 / 档位各自独立。

::: warning 别把两套计费混为一谈
bolt.new 的套餐与 StackBlitz 编辑器的套餐是**不同产品、不同计费口径**（一个按 token，一个按席位 / 项目）；具体价格以各自官方页为准，别混算。
:::

## vs CodeSandbox

| 维度           | StackBlitz                                  | CodeSandbox                          |
| -------------- | ------------------------------------------- | ------------------------------------ |
| 执行模型       | **WebContainers，浏览器内**                 | 更依赖云端容器                       |
| 强项           | **速度 / 嵌入式 demo / 单人前端 / 文档教程**| **团队协作 + 多分支版本迭代**        |
| 启动 / 离线    | 即时、可离线                                | 受云端与网络影响                     |
| GitHub 集成    | **有**（导入 + 自动同步）                   | 有                                   |

::: tip 纠正一个过时说法
「StackBlitz 没有 GitHub 集成」是**过时误传**——它不仅能从 GitHub 导入，还能与上游**自动同步**（push 即更新）。选型时按场景判断：要极致速度 / 可嵌入 demo / 单人前端教程选 StackBlitz；要重度团队协作 / 多分支并行迭代，CodeSandbox 的云端容器模型更顺手。
:::
