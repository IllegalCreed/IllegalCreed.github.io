---
layout: doc
outline: [2, 3]
---

# Astryx 指南

> 基于 Astryx 0.1.3（Beta）· 核于 2026-07

本文假设你已读过[入门](./getting-started.md)、装好 Astryx 并跑通第一个组件。这里深入八条主线：**StyleX 关系**、**组件与 Layout**、**主题系统**、**CLI 全命令**、**AI-agent-ready 全景（MCP + manifest 契约）**、**模板系统**、**升级/诊断/swizzle**、**选型对比与常见坑**。⚠️ Astryx 仍是 0.1.x Beta，边缘特性以官方最新文档为准，本文对存疑处标注「早期/待观察」。

## 速查

- **StyleX 关系**：Astryx 用 StyleX 写样式，**编译期**编译为原子 CSS，对使用者**不可见**；语法/编译细节归 [StyleX 叶](/zh/web-advanced/language/stylex/)，本叶只讲关系。
- **组件导入**：`@astryxdesign/core/<Name>` 子路径按名导入；`Layout` 提供 `VStack`/`HStack`/`Stack`，`gap` 控间距。
- **主题**：7 个 `@astryxdesign/theme-*`；自定义用 `defineTheme` + `npx astryx theme build`；foundations token 有 Color/Elevation/Icons/Illustrations/Motion/Shape/Spacing/Typography。
- **CLI 命令**：`init`/`component`/`search`/`docs`/`template`/`hook`/`swizzle`/`upgrade`/`theme build`/`discover`/`doctor`。
- **全局 flag**：`--json`（`{ type, data }` 信封）/`--detail brief|compact|full`/`--zh`/`--dense`/`--lang en|zh|dense`。
- **manifest**：`astryx manifest --json`（或 `astryx --json`）返回**自描述契约**——每命令/参数/flag（类型·choices·默认值），命令行的 OpenAPI。
- **MCP**：托管 `https://astryx.atmeta.com/mcp`（服务名 `xds`，`type: url`），工具 `search(query)` + `get(name)`；支持 Claude Desktop/Cursor/Windsurf/Cline。
- **agent 文档**：`astryx init --features agents --agent claude|cursor|codex` → `CLAUDE.md`/`.cursorrules`/`AGENTS.md`。
- **升级/深改**：`astryx upgrade`（codemod 迁移）、`astryx doctor`（诊断）、`astryx swizzle`（复制源码深度定制）。
- **选型**：vs shadcn（受管依赖 vs 复制源码）、vs MUI（编译期 vs Emotion 运行时）、vs Radix（带样式 vs 无头）、vs Chakra（编译期 vs 运行时 style props）。

## 一、Astryx 与 StyleX：编译期原子化 CSS

Astryx 的样式引擎是 **StyleX**（Meta 同门），但二者是**两层**，本叶只讲关系、不重讲 StyleX（细节见 [StyleX 叶](/zh/web-advanced/language/stylex/)）。

**三个关键事实**：

1. **编译期，不是运行时**。StyleX 在**构建期**把组件里声明的样式编译成**原子化 CSS 类**，运行时不再做样式对象序列化/注入。对比 Emotion（MUI）、运行时 style props（Chakra）这类**运行时 CSS-in-JS**，Astryx 运行时**零样式计算开销**。
2. **对使用者不可见（invisible）**。你用 Astryx 组件时**无需写一行 StyleX**，甚至不必知道它存在；要覆盖样式时用 `className`，配 Tailwind / CSS Modules / 纯 CSS 均可。
3. **原子化 → 同值去重**。相同的 CSS 声明在整站/整组件库**只落一份**，CSS 体积随「**不同声明数**」而非「组件数 × 用法数」增长——这正是 Meta 用它支撑 13000+ 应用的关键工程理由：超大规模下样式体积近**次线性**、缓存复用强。

**抽象在哪里泄漏**：日常写业务不碰 StyleX，但这几处会触及底层——① 接打包器时配 `@astryxdesign/build`（StyleX 构建插件）；② `swizzle` 换出组件源码后会看到其中的 StyleX 写法；③ 排查原子类优先级冲突或做 `defineTheme` 深度定制时，需要理解编译期机制。

**SSR/RSC 友好**：样式已在编译期落为静态 CSS 文件，SSR 时是普通 `<link>` 样式表，无运行时注入、无样式相关 hydration 闪烁。在 React Server Components 下，样式层不与「服务端无运行时样式引擎」的模型冲突——交互组件仍按 React 惯例标 `"use client"`，但**样式不再是 RSC 的绊脚石**。（RSC 具体支持属 Beta，待官方进一步明确。）

## 二、组件与 Layout 体系

**组件导入**统一走 core 子路径按名导入，利于按需打包：

```tsx
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Dialog} from '@astryxdesign/core/Dialog';
import {VStack, HStack} from '@astryxdesign/core/Layout';
```

**Layout 布局组件**做结构堆叠，用 token 化的 `gap` 表达间距，避免裸写 flex/margin：

```tsx
<VStack gap={2}>           {/* 纵向堆叠 */}
  <Card>
    <HStack gap={1}>       {/* 横向堆叠 */}
      <Button label="保存" />
      <Button label="取消" />
    </HStack>
  </Card>
</VStack>
```

> ⚠️ Beta 期组件命名与 props 仍在补全/演进。**权威来源是你安装版本的 CLI**：`npx astryx component <Name>` 打印该组件的 props、用法示例与源码；`npx astryx component --list` 列全部；`npx astryx hook --list` 列 hooks。别凭记忆猜 props，直接问 CLI（或 MCP）。

**无障碍是默认**：150+ 组件内建键盘可达与 ARIA 语义，无需你额外接 a11y 逻辑——这也是选「成品设计系统」相对「无头库自己上样式」的省心之处。

## 三、主题系统

主题是 Astryx「品牌级定制」的核心。分三层理解：

**1) 开箱主题（换一行 CSS）**。7 个 `@astryxdesign/theme-*` 包：`neutral` / `butter` / `chocolate` / `matcha` / `stone` / `gothic` / `y2k`。装包 + 导入其 `theme.css` 即切换：

```css
@import '@astryxdesign/theme-gothic/theme.css';
```

**2) foundations tokens（设计基础）**。主题由一组设计 token 组成，官方 foundations 覆盖：**Color、Elevation、Icons、Illustrations、Motion、Shape、Spacing、Typography、All Tokens**。用 CLI 直接查：

```bash
npx astryx docs tokens        # 全部 token
npx astryx docs color         # 颜色
npx astryx docs spacing       # 间距
npx astryx docs typography    # 排版
```

**3) 自定义品牌主题（`defineTheme` + `theme build`）**。在官方 7 主题之外做企业品牌定制：写一个 `defineTheme` 主题定义文件，再编译为生产资源：

```bash
npx astryx theme build        # 把 defineTheme 文件编译成生产 CSS/JS
```

要点：主题走**编译期产物**（不牺牲运行时性能）；改一组 token 即让**全部 150+ 组件统一换肤**，且**保留无障碍与交互行为**——相比「复制组件再逐个改样式」，以极小改动获得品牌一致性，升级也不被本地魔改阻断。**暗色内建**，随 token 生效。

## 四、CLI 全命令详解

`@astryxdesign/cli` 覆盖装、查、注模板、迁移、诊断全生命周期：

| 命令 | 作用 |
| --- | --- |
| `init` | 初始化：装包、配主题、写入 AI agent 文档 |
| `component` | 列出组件，或打印某组件的 props / 用法示例 / 源码文档 |
| `search` | 跨组件/hooks/文档/模板的统一排序检索（**发现入口**） |
| `docs` | 打印参考文档（tokens、theme、color、typography、spacing…） |
| `template` | 把页面/区块模板注入项目（`--list` 列表，`--skeleton` 取骨架） |
| `hook` | 列出 hooks 并打印 hook 文档 |
| `swizzle` | 把组件源码复制进项目做**深度定制**（opt-in） |
| `upgrade` | 运行 **codemods** 在版本间迁移 |
| `theme build` | 把 `defineTheme` 文件编译为生产 CSS/JS |
| `discover` | 发现外部包与组件 |
| `doctor` | 诊断 Astryx 安装/配置并给出修复建议 |

**心智模型**：`search` 是「我不确定叫什么」时的发现入口；拿到名字后用 `component`/`docs`/`hook` 取详情；要落地则 `template`（注模板）/`swizzle`（换源码）；维护期用 `upgrade`（升级）/`doctor`（排障）。

```bash
# 典型工作流
npx astryx search "date picker"       # 发现相关组件/模板/文档
npx astryx component DatePicker       # 看它的 props 与用法
npx astryx template dashboard --list  # 看有哪些 dashboard 模板
npx astryx template kanban-board      # 注入 Kanban 看板页面模板
npx astryx doctor                     # 配置有问题时自检
```

## 五、CLI 全局选项与 manifest 契约

**全局选项**（多数命令通用）：

| 选项 | 含义 |
| --- | --- |
| `--json` | 输出**类型化 JSON 信封** `{ type, data }`，便于程序/agent 消费 |
| `--detail <level>` | 详略级别：`brief` / `compact` / `full` |
| `--zh` | 以简体中文输出文档 |
| `--dense` | 压缩、token 高效格式，专为喂 AI（省 context window） |
| `--lang <locale>` | `en` / `zh` / `dense` 的统一快捷方式（`--dense` ≈ `--lang dense`） |

**manifest —— 命令行的 OpenAPI**。一次调用返回一个**自描述 manifest**：

```bash
npx astryx manifest --json     # 或简写 npx astryx --json
```

它列出**每一条命令、其参数、每个 flag（含类型、可选值 choices、默认值）、以及是否支持 `--json`**。这相当于「命令行版的 OpenAPI」：

- **对 agent**：可在运行时读取全部命令契约，**自举出正确调用**、按类型/choices**校验参数**、随版本变化**自适应**——无需抓 HTML 文档、无需从散文里猜 API 形状；把「自然语言理解」的不确定性换成「读结构化契约」的确定性。
- **对人**：一份权威、可 diff 的能力清单，写脚本/CI 集成时不必翻文档。

## 六、AI-agent-ready 全景

Astryx 把「机器可消费」当**一等公民**，而非在旧系统外贴抓取层。它有**两条**结构化访问路径，按场景取用：

**路径 A：托管 MCP server（对话式按需检索）**。配置对所有 MCP 工具一致：

```json
{
  "mcpServers": {
    "xds": {
      "type": "url",
      "url": "https://astryx.atmeta.com/mcp"
    }
  }
}
```

- **服务名 `xds`、`type: url`（远程托管）**，支持 Claude Desktop、Cursor、Windsurf、Cline 等。
- 暴露两个工具：`search(query)` 用自然语言发现组件/文档主题/模板；`get(name)` 取回带 props、用法、示例的完整文档。
- 走 MCP 的 host/client/server 架构（JSON-RPC 传输）。**便利但需联网**：强隔离/离线/数据不出网环境不适用，改用离线 CLI。

Cursor 也可装成 user rule 以更稳定：

```bash
mkdir -p ~/.cursor/rules
npx astryx init --features agents --agent-docs-path ~/.cursor/rules/xds.mdc
```

**路径 B：CLI + manifest（可脚本化、确定性自动化）**。`--json` 类型化信封 + `manifest` 契约 + `--dense` token 高效输出，适合本机项目里可脚本化、可离线、可精确调用的流水线：

```bash
npx astryx component Dialog --dense   # 压缩组件文档，省上下文
npx astryx docs styling --dense       # 压缩样式文档
npx astryx manifest --json            # 拿全量命令契约
```

**agent 约定文档**：`astryx init --features agents --agent claude|cursor|codex` 分别生成 `CLAUDE.md` / `.cursorrules` / `AGENTS.md`，让 coding agent 一进项目就带上 Astryx 用法规范。

> **A 与 B 是同一契约的两种投影**，按场景并用而非二选一：交互式 IDE 顺手用 MCP；CI/批量生成用 CLI+manifest；`--dense` 在大规模「一次塞多个组件契约进 prompt」时随规模放大收益。

## 七、模板系统

`astryx template` 把**整段页面/区块模板**注入项目——不是单个组件，而是可运行的成品页面（含布局与组合）：

```bash
npx astryx template --list            # 列出可用模板
npx astryx template dashboard         # 注入 dashboard 页面源码
npx astryx template kanban-board      # 注入 Kanban 看板（0.1.3 新增）
npx astryx template <name> --skeleton # 只要骨架结构
```

模板是「ready to ship」的一部分：相比只给单个组件，它给你**整段业务场景**的起点，配合 token 主题即可快速换成品牌视觉。

## 八、升级、诊断与 swizzle

作为**受管 npm 依赖**，Astryx 提供了复制粘贴组件所没有的「有升级路径」：

- **`astryx upgrade`**：运行 **codemods** 在版本间自动迁移代码。对仍在 0.1.x 快速演进的项目，codemod 化升级把破坏性变更的手工成本降到最低。
- **`astryx doctor`**：诊断安装/配置问题（主题未导入、版本不匹配、构建插件缺失等）并给出修复建议。
- **`astryx swizzle`**：需要超出 `className`/token 的**深度定制**时，把组件源码复制进项目（opt-in）。语义类似 shadcn 的复制粘贴，但在 Astryx 里是**例外逃生口**，默认仍用受管依赖。

> ⚠️ **swizzle 的代价**：被换出的组件脱离了包的版本管理，`upgrade` codemod 不再自动覆盖它——过度 swizzle 会阻断升级。原则：**能用 token/className 解决就别 swizzle**，把 swizzle 控制到最少。

## 九、选型对比

| 对比对象 | 与 Astryx 的核心差异 | 何时选它而非 Astryx |
| --- | --- | --- |
| **shadcn/ui** | shadcn 默认**复制源码**进项目（代码归你、Tailwind/Radix）；Astryx 默认**受管 npm 依赖**、`swizzle` 才复制 | 想要源码完全归己、随意魔改、深绑 Tailwind 生态 |
| **经典 MUI** | MUI 用 **Emotion 运行时** CSS-in-JS；Astryx 用 **StyleX 编译期**原子 CSS（零运行时样式开销） | 要最成熟稳定生态、海量企业级 Pro 组件（Astryx 尚 0.1.x） |
| **Radix Primitives** | Radix 是**无头**行为原语（无样式）；Astryx 带品牌样式 + 主题 + 暗色 | 要完全自定义外观、只需可访问性行为地基 |
| **Chakra UI** | Chakra 用**运行时** style props + Emotion；Astryx 编译期 StyleX + token 主题 | 偏好运行时 style props 心智、已在 Chakra 生态 |

**Astryx 的甜蜜区**：想要「Meta 长期背书 + 编译期零运行时样式 + 受管依赖与版本化升级 + 原生 AI/MCP 工作流」，且能接受它 0.1.x Beta 的早期状态、以小范围试点起步的团队。

## 十、React 生态与 SSR/RSC

- **仅 React 系**：无 Vue/Svelte/Solid 版本。
- **SSR**：StyleX 编译期静态 CSS → 服务端直接普通样式表，无运行时注入、无 FOUC/样式 hydration 复杂度（这是相对 Emotion/Chakra 运行时方案的**结构性优势**）。
- **RSC**：样式层不与 RSC 冲突；交互组件按惯例标 `"use client"`。RSC 的官方明确表述仍在完善，属**待观察**。
- **构建**：需在打包器接入 `@astryxdesign/build`（StyleX 构建插件），`astryx init` 会尽量替你配置。

## 十一、常见坑

1. **只装了 core、没装主题包** → 组件没 token、样式异常。**主题包必装**，且 CSS 要导入其 `theme.css`。
2. **CSS 只导入了一行** → 缺 reset 或基础样式。三行都要：`reset.css` → `astryx.css` → `theme-*/theme.css`，**顺序别乱**。
3. **凭记忆猜组件 props** → Beta 期 props 会变。**用 `npx astryx component <Name>`（或 MCP `get`）取权威 props**。
4. **去改 `node_modules` 里的组件源码** → 不可维护、升级即丢。局部覆盖用 `className`，深改用 `swizzle`。
5. **过度 swizzle** → 阻断 `upgrade` codemod。能 token/className 解决就别 swizzle。
6. **强隔离/离线环境配了托管 MCP** → 连不上。离线场景改用 CLI `--dense` 输出。
7. **把 StyleX 当成要学的东西** → 日常用组件**无需写 StyleX**；只有构建配置/swizzle/深度定制才触及。
8. **拿 0.1.x 直接全量押生产** → 风险过高。**锁版本 + 跟踪 changelog + 小范围试点**，核心生产线等 API 收敛。

---

API/命令/主题/token/MCP 一站式速查见 **[参考](./reference.md)**。
