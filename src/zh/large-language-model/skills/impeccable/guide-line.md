---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 pbakaus/impeccable（Paul Bakaus 个人出品，Apache-2.0）的 `skill/SKILL.md`（v3.9.1）、`skill/reference/*` 命令参考与 detector registry 编写。个人/产品，非组织官方，但作者知名、项目极流行。

## 速查

- **设计维度 → 命令**：typography→`typeset`、color→`colorize`、motion→`animate`、layout→`layout`、UX writing→`clarify`
- **steering 命令用法**：`/impeccable <command> [target]`；不匹配命令时按意图路由（「fix the spacing」→`layout`）；`pin` 建独立快捷方式
- **46 检测**：27 条 AI slop + 19 条通用质量（含 4 条 DESIGN.md 设计系统检查）；CLI/扩展无 LLM 直接跑
- **live 迭代**：`/impeccable live` 在浏览器选元素、选动作，AI 生成变体经 HMR 热替换（web-only，需 dev server 或静态 HTML）
- **绝对禁止**（match-and-refuse）：侧边彩条、渐变文字、默认玻璃拟态、hero-metric 模板、雷同卡片网格、每段 eyebrow、`01/02/03` 编号段标、文本溢出
- **AI slop 测试**：若有人一眼就能说「这是 AI 做的」，即判失败；再跑「类别反射」二阶检查
- **register**：brand 读 `reference/brand.md`、product 读 `reference/product.md`；风格由此分岔

## 设计维度：把「改设计」拆成可引导的轴

Impeccable 的核心是把界面拆成**具体的设计维度**，每个维度对应一条精准命令。你不再说「弄好看点」，而是引导某个轴：

| 维度 | 命令 | 引导什么 |
| --- | --- | --- |
| **Typography 排版** | `typeset` | 字体选择、层级、字号、字距、行长 |
| **Color 色彩** | `colorize` | 给单调 UI 引入策略性颜色、对比度 |
| **Motion 动效** | `animate` | 有目的的动画与微交互 |
| **Layout 布局** | `layout` | 间距、节奏、视觉层级、对齐 |
| **UX writing 文案** | `clarify` | 标签、错误信息、界面文案 |

每个维度都有明确的「怎样算对」，摘自 skill 的通用规则：

### Color 色彩

- **验对比度**：正文 ≥4.5:1，大字（≥18px 或粗体 ≥14px）≥3:1，占位符也要 4.5:1。最常见的翻车是「浅灰正文压在偏白暖底上」——为了「优雅」用浅灰，恰恰是 AI 设计最难读的头号原因
- 彩色底上的灰字会发灰泛白——改用底色自身色相的更深一档，或文字色的透明度
- 新项目用 **OKLCH**；**cream/米色底是 2026 年的饱和 AI 默认**，`--paper`/`--sand`/`--linen` 这类命名本身就是 tell

### Typography 排版

- 正文行长封顶 **65–75ch**
- 别配「像但不同」的字体（两个几何无衬线、两个人文无衬线）——要么按对比轴配（衬线+无衬线、几何+人文），要么同一字族多字重
- Hero/展示标题上限 `clamp()` max ≤ 6rem（~96px）；字距下限 ≥ -0.04em，再紧字母就贴一起了
- h1–h3 用 `text-wrap: balance`，长正文用 `text-wrap: pretty` 减少孤字

### Layout 布局

- 变化间距造节奏；**卡片是偷懒答案**，卡片套卡片永远错
- 一维用 Flexbox、二维用 Grid，别默认 Grid；无断点响应网格用 `repeat(auto-fit, minmax(280px, 1fr))`
- 建**语义化 z-index 阶梯**（dropdown → sticky → modal-backdrop → modal → toast → tooltip），别用 `999`/`9999`

### Motion 动效

- 动效要有意图、是构建的一部分，不是事后补
- 用指数缓出（ease-out-quart/quint/expo），**不要 bounce、不要 elastic**（显旧）
- `prefers-reduced-motion` 不是可选项——每个动画都要有降级（淡入或瞬时）
- 列表内错峰（stagger）合法；病是「统一反射」（每段套同一入场）。别把内容可见性绑在 class 触发的过渡上，否则隐藏标签页/无头渲染里过渡不触发，整段空白上线

### UX writing 文案

- `clarify` 改不清楚的文案；detector 直接抓文案层的 AI tell：营销黑话、em-dash 滥用、格言腔（aphoristic-cadence）、剧场式框架语（theater-slop-phrase）、正文全大写

### Interaction 交互

- `position: absolute` 的下拉在 `overflow: hidden/auto` 容器里会被裁——用原生 `<dialog>`/popover、`position: fixed` 或 portal 逃出层叠上下文

## steering 命令用法

命令按四条路由规则派发（skill 的 Routing rules）：

1. **不带参数** → 「我该做什么？」把菜单变成上下文感知：读项目信号，先给 2–3 个最高价值的下一步，再列全菜单
2. **首词匹配命令**（表中命令或 `pin`/`unpin`/`hooks`）→ 加载该命令的 `reference/<command>.md` 并执行，其余全是 target
3. **首词不匹配但意图明确**（「fix the spacing」→`layout`、「rewrite this error message」→`clarify`、「颜色发平」→`colorize`）→ 当作调用该命令
4. **无明确匹配** → 通用设计调用，套用 setup、通用规则与 register 参考

每条命令先跑 setup：读 `PRODUCT.md`（缺则按 `init` 分流）→ 读命令参考 → 熟悉现有设计系统 → 读 register 参考（brand/product）→ 原生平台再读 HIG/Material。

## 46 条检测规则

detector 是「确定性引擎」——**无 LLM、无 API key**，同一套规则同时驱动 design hook、`/impeccable audit`、浏览器扩展与公开的 slop 目录。

### AI slop（27 条：一眼假的 tell）

`side-tab`（侧边强调条，最易辨识的 AI tell）· `border-accent-on-rounded` · `overused-font`（Inter/Roboto/Geist…）· `single-font` · `flat-type-hierarchy` · `gradient-text` · `ai-color-palette` · `cream-palette` · `nested-cards` · `monotonous-spacing` · `bounce-easing` · `dark-glow` · `icon-tile-stack` · `italic-serif-display` · `hero-eyebrow-chip` · `repeated-section-kickers` · `numbered-section-markers`（`01/02/03`）· `em-dash-overuse` · `marketing-buzzword` · `aphoristic-cadence` · `oversized-h1` · `extreme-negative-tracking` · `gpt-thin-border-wide-shadow` · `repeating-stripes-gradient` · `codex-grid-background` · `theater-slop-phrase` · `image-hover-transform`

### 通用质量（19 条：用户看得见的问题）

`broken-image` · `gray-on-color` · `low-contrast` · `layout-transition` · `line-length` · `cramped-padding` · `body-text-viewport-edge` · `tight-leading` · `skipped-heading` · `justified-text` · `tiny-text` · `all-caps-body` · `wide-tracking` · `text-overflow` · `clipped-overflow-container` +（DESIGN.md 存在时）`design-system-font` · `design-system-color` · `design-system-radius` · `design-system-font-size`

### 用法与豁免

```bash
npx impeccable detect src/            # 扫目录（走 .impeccable/config.json）
npx impeccable detect --no-config .   # 原始扫描，忽略项目配置与 DESIGN.md 上下文
npx impeccable ignores list                                   # 看忽略项
npx impeccable ignores add-value overused-font Inter --reason "Brand font"
npx impeccable ignores add-file "src/legacy/**"
```

单文件级豁免用行内注释（任何注释语法都行，作用于整文件；行级用 `impeccable-disable-line`/`-next-line`）：

```html
<!-- impeccable-disable overused-font: exported brand doc -->
```

有 `DESIGN.md` 时，`detect` 默认启用设计系统检查（字体/字面色值/圆角/字号是否越出文档的排版阶梯），`.impeccable/design.json` sidecar 提供更丰富的 token 数据。

## live browser 迭代

`/impeccable live` 进「视觉变体模式」：在浏览器里选元素 → 选设计动作 → AI 生成三个不同方向的 HTML+CSS 变体，经 dev server 的 HMR **热替换**，你边看边接受/丢弃。

- **前置**：一个支持 HMR 的 dev server（Vite/Next/Bun…）或一个在浏览器打开的静态 HTML
- **DESIGN.md 赢视觉决定、PRODUCT.md 赢策略/语气决定**；没有 DESIGN.md 时从 CSS 变量、计算样式、同页兄弟组件里提取身份，**默认保身份**，偏离需明确触发
- **web-only**：`live` 与 detector 都作用于 HTML/CSS，iOS/Android 原生代码不吃

## 避通用 AI 套路：绝对禁止（match-and-refuse）

skill 里有一份「若你正要写这些，就换个结构重写」的硬清单：

- **侧边彩条**：卡片/列表项/callout 上 >1px 的 `border-left`/`border-right` 彩色强调——从不是有意的
- **渐变文字**：`background-clip: text` + 渐变背景——装饰性、从无意义，用单色，强调靠字重/字号
- **默认玻璃拟态**：装饰性的模糊玻璃卡——罕见且有目的，否则不用
- **hero-metric 模板**：大数字+小标签+辅助数据+渐变强调——SaaS 陈词
- **雷同卡片网格**：同尺寸「图标+标题+文字」卡无限重复
- **每段小号全大写 eyebrow**：`ABOUT`/`PROCESS`/`PRICING` 那种宽字距小标——出现在 55–95% 的生成里，即 tell 的定义
- **默认编号段标**（`01/02/03`）：段落不是真序列时别编号
- **文本溢出容器**：长标题词 + 大 clamp + 窄网格 → 平板/手机溢出；视口是设计的一部分

### AI slop 测试与二阶反射

若有人能毫不迟疑地说「这是 AI 做的」，就失败了。再跑**类别反射**两阶检查：

- **一阶**：若光从品类就能猜出主题+配色，就是第一层训练反射
- **二阶**：若能从「品类 + anti-references」猜出美学家族（「不做 SaaS-cream 的 AI 工具 → 编辑排版风」「不做藏青金的 fintech → 终端暗色」），就是更深一层的坑

## 下一步

- [参考](./reference) —— 命令全表、检测清单、安装方式、多 agent、许可与链接
- 上游：[impeccable.style 文档](https://impeccable.style) · [detector 文档](https://impeccable.style/docs/detector)
