---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 pbakaus/impeccable（Paul Bakaus 个人出品，Apache-2.0）的 README 与 `skill/SKILL.md`（v3.9.1）编写。个人/产品，非组织官方，但作者知名、项目极流行。

## 速查

- **是什么**：面向 AI 编码 agent 的**设计语言**——用 steering 命令词汇引导 AI 做出「有意图的、生产级 UI」，避开 AI 生成界面的通用套路
- **谁做的**：Paul Bakaus（[@pbakaus](https://github.com/pbakaus)）个人出品；Apache-2.0；GitHub 高星、业界知名
- **构成**：**1 skill + 23 命令 + 46 确定性检测规则 + live browser 迭代**
- **装**：`npx impeccable install`（项目根目录），再在 AI 工具里 `/impeccable init`
- **更新**：`npx impeccable update`
- **用**：`/impeccable <command> [target]`，如 `/impeccable polish settings`；直接 `/impeccable` 看全菜单
- **register**：`init` 先问 **brand**（营销/落地/作品集）还是 **product**（应用/仪表盘/工具），写 `PRODUCT.md` + `DESIGN.md`
- **CLI 检测**：`npx impeccable detect src/`（无 LLM、无 API key），退出码 `0` 无命中 / `2` 有命中 / `1` 失败
- **跨 agent**：Claude Code / Cursor / Gemini / Codex / GitHub Copilot / OpenCode / Pi / Qoder / Trae / Rovo Dev…
- **许可**：Apache-2.0 ｜ 站点 [impeccable.style](https://impeccable.style)

## 定位：AI 的设计语言

每个模型都在同一批 SaaS 模板上训练，跳过设计引导，你就会在每个项目上得到同一撮「AI tells」：**处处 Inter 字体、紫到蓝的渐变、卡片套卡片、彩色底上的灰字、每个标题上方那个圆角方块图标**。Impeccable 脱胎自 Anthropic 的 frontend-design skill，再往前一步：它给你和 AI 之间一套**共享的设计词汇**，让你能用设计精度去引导（steer）输出，而不是靠模糊的散文。

成功的标准有两条：(1) 你能用设计精度而非含糊描述引导 AI；(2) AI 产出的界面能过专业设计评审，而不是「一眼看就是 AI 做的」。

## 安装

从项目根目录运行（推荐的 CLI 安装器）：

```bash
npx impeccable install
```

它会：展示检测到的 harness 目录（如 `~/.claude`、`~/.codex`、项目内 `.cursor`）→ 让你保留或自定义 provider → 询问装到当前项目还是全局。脚本里可用 `--providers=claude,codex,cursor` 与 `--scope=project|global` 跳过交互。在 Claude Code / Cursor / Codex 上还会装 provider 原生的 hook manifest。装完**重载你的 harness**。

刷新已有安装：

```bash
npx impeccable update
```

> **Codex 用户**：install/update 后打开 `/hooks` 并批准项目 hook（Codex 按 hook 定义追踪信任，`.codex/hooks.json` 变了需重新批准）。

装完，在 AI 编码工具里为每个新项目先跑一次：

```bash
/impeccable init
```

`init` 会问这个界面属于 **brand**（营销、落地页、作品集——设计**就是**产品）还是 **product**（应用 UI、仪表盘、工具——设计**服务**产品），然后写入设计上下文（受众、品牌/产品定位、语气、anti-references、颜色、字体、组件），后续每条命令都会读它。

## 1 skill + 23 命令 + 46 检测

### 一个 skill，全部命令走它

技能只装成一个入口，所有能力都从 `/impeccable` 进：

```bash
/impeccable <command> <target>
```

大多数命令可带一个可选参数聚焦某处：`/impeccable audit the header`、`/impeccable polish the checkout form`。常用的可 `pin`：`/impeccable pin audit` 之后 `/audit` 就是独立快捷方式。

### 23 个命令（按类别）

| 类别 | 命令 |
| --- | --- |
| **Build 构建** | `craft` · `shape` · `init` · `document` · `extract` |
| **Evaluate 评审** | `critique`（UX 设计评审）· `audit`（a11y/性能/响应式技术检查） |
| **Refine 精修** | `polish` · `bolder` · `quieter` · `distill` · `harden` · `onboard` |
| **Enhance 增强** | `animate` · `colorize` · `typeset` · `layout` · `delight` · `overdrive` |
| **Fix 修复** | `clarify` · `adapt` · `optimize` |
| **Iterate 迭代** | `live`（浏览器里生成/热替换变体） |

另有三个管理命令：`pin <command>` / `unpin <command>` / `hooks <on\|off\|status\|…>`。

```text
/impeccable audit blog        # 审计博客与文章页
/impeccable critique landing  # 落地页 UX 评审
/impeccable polish settings   # 上线前最后一道
/impeccable harden checkout   # 补错误处理 + 边界情况
```

也可以不带命令名，直接描述：`/impeccable redo this hero section`——它会把你的意图路由到最匹配的命令。

### 46 条确定性检测规则

打包的 detector 抓 **46** 个确定性问题，分两大类：

- **AI slop（27 条）**：侧边强调条、圆角元素上的彩边、过度使用的字体、渐变文字、AI 配色、cream/米色底、卡片套卡片、单调间距、bounce/弹性缓动、暗色发光、图标块叠标题、每段重复的 eyebrow、`01/02/03` 编号段标、em-dash 滥用、营销黑话……
- **通用质量（19 条，含 4 条 DESIGN.md 设计系统检查）**：坏图、彩底灰字、低对比、动画布局属性、行长过长、局促内边距、正文贴视口边、行高过紧、跳级标题、两端对齐正文、过小正文、正文全大写、文本溢出容器……

CLI 与浏览器扩展**不需要 LLM、不需要 API key** 就能跑这些确定性规则：

```bash
npx impeccable detect src/                 # 扫目录
npx impeccable detect index.html           # 扫 HTML（含其引用的本地 CSS）
npx impeccable detect https://example.com  # 扫 URL（Puppeteer 渲染后检查）
npx impeccable detect --json .             # CI 友好的 JSON 输出
```

退出码：`0` 无命中、`2` 有命中、`1` 命令失败——CI 里对 `2` 失败即可。

## 下一步

- [指南](./guide-line) —— 设计维度深入、steering 命令用法、46 检测规则、live 迭代、避通用 AI 套路与反模式
- [参考](./reference) —— 命令全表、检测清单、安装方式、多 agent、许可与链接
