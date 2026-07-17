---
layout: doc
---

# Nuxt UI Skill

Nuxt UI Skill（`nuxt/ui` 官方仓库 v4 分支内 `skills/nuxt-ui/SKILL.md`，MIT，★6.7k）是 **Nuxt UI 组件库自带的官方 usage skill**——由 nuxt 官方组织维护，教 AI 编码 agent 用 **Nuxt UI v4**（基于 Reka UI + Tailwind CSS + Tailwind Variants 的 125+ 无障碍 Vue 组件）建界面：安装、主题定制、选组件、composables、表单、overlays、布局。它遵循 [agentskills.io](https://agentskills.io) 开放格式，用 skills CLI 一条命令装进 35+ 种 agent（Claude Code / Cursor / Codex / Windsurf / Cline…），装后在对话里 `/nuxt-ui` 触发。核心是**按需加载的 references（渐进披露）**——SKILL.md 只是入口，按任务再拉对应的 guidelines / layouts / recipes，保持上下文高效。

> **官方 skill，区别于社区 Nuxt Skills**：本叶是 nuxt 官方 `nuxt/ui` 仓库内、**只聚焦 Nuxt UI 组件库**的 usage skill；批 4 的 [Nuxt Skills](../nuxt-skills/)（`onmax/nuxt-skills`）是**社区个人**维护的 21-skill 全生态集（nuxt/vue/nuxthub/nuxt-content/vueuse…，其中含一个 `nuxt-ui` skill）。两者都遵 agentskills.io，但一个官方单库、一个社区全家桶。

## 评价

**优点**

- **官方出品、随库同源**：skill 就住在 `nuxt/ui` 仓库的 `skills/nuxt-ui/`，与组件库同仓演进、v4 对齐，不会像外部知识那样漂
- **教「怎么用好」而非「有什么 API」**：分工明确——组件的 props/slots/events 查 [Nuxt UI MCP server](https://ui.nuxt.com/docs/getting-started/ai/mcp)，skill 专教「何时用哪个组件、怎么建得好」
- **渐进披露省 token**：SKILL.md 作入口 + 路由表（任务→该加载哪些 reference），只按需拉 14 个 reference 子文件（4 guidelines + 5 layouts + 4 recipes + 1 components 索引）
- **五条核心铁律**：`UApp` 必包、只用语义色（`text-default`/`bg-elevated`）、读生成的主题文件找 slot 名、覆盖优先级、图标 `i-{collection}-{name}` 格式
- **跨 agent**：skills CLI 装进 35+ agent，`/nuxt-ui` 触发；也可 `claude skill add` GitHub URL
- **覆盖建站全链路**：安装（Nuxt/Vue/Laravel/AdonisJS）、7 语义色主题、125+ 组件选型、composables、Standard Schema 表单、dashboard/docs/chat/editor 布局、官方模板

**缺点 / 边界**

- **只管 Nuxt UI**：不覆盖 Nuxt 框架本身、其它 UI 库或非 Vue 栈——那是 [Nuxt Skills](../nuxt-skills/) 或框架自身文档的事
- **要配 MCP 才完整**：组件精确 API（props/slots/events）靠 Nuxt UI MCP server，skill 本身不背全部 API 明细
- **绑 v4**：面向 Nuxt UI v4（Reka UI + Tailwind v4），v3 及更早写法不适用
- **不替代理解**：skill 喂正确模式，但布局取舍、品牌设计仍靠人

## 适用场景

- 用 AI 助手写 Nuxt UI v4 界面，想让它照官方模式选组件、定制主题、建表单
- 建 dashboard / docs / landing / chat / editor 等成套页面结构
- 定制品牌色、语义色主题、组件 slot 覆盖
- 想同时接 Nuxt UI MCP（查 API）+ skill（教用法）的组合工作流

## 边界

- **是单库 usage skill，非框架/CLI**：喂给 agent 的知识，不改变 Nuxt UI 本身
- **只聚焦 Nuxt UI 组件库**：Nuxt 框架、全生态那套在别处
- **官方非社区**：区别于 `onmax/nuxt-skills`，别混为一谈
- **API 明细归 MCP**：skill 教「何时/怎么用」，精确 props 查 MCP

## 官方文档

[Nuxt UI · AI Skills 文档](https://ui.nuxt.com/docs/getting-started/ai/skills) ｜ [Nuxt UI MCP server](https://ui.nuxt.com/docs/getting-started/ai/mcp) ｜ [Nuxt UI 官网](https://ui.nuxt.com) ｜ [agentskills.io 开放格式](https://agentskills.io)

## GitHub 地址

[nuxt/ui · skills/nuxt-ui](https://github.com/nuxt/ui/tree/v4/skills/nuxt-ui)（MIT，v4 分支）

## 内容地图

- [入门](./getting-started) —— 官方定位（vs 社区 Nuxt Skills）、skills CLI 安装（35+ agents）、`/nuxt-ui` 触发、Nuxt UI v4 总览
- [指南](./guide-line) —— usage skill 教什么（安装/主题/组件/composables/表单/overlays/布局）、按需 references 渐进披露、五条核心铁律、反模式
- [参考](./reference) —— 能力清单表、安装/多 agent、`/nuxt-ui`、references 结构、版本、许可、链接

## 幻灯片地址

<a href="/SlideStack/nuxt-ui-skill-slide/" target="_blank">Nuxt UI Skill</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Nuxt UI Skill 测试题</a>

> 测试题链接待生产库分类导入、获得真实数字叶节点 ID 后回填。
