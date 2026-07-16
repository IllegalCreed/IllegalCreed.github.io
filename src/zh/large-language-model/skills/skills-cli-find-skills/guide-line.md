---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 fockus/claude-skill-find-skill v1.0.1 的 `SKILL.md` 与 README 编写。

## 速查

- **6 阶段**：新鲜度检查 → 理解查询 → 本地目录搜索 → （<2 结果）SkillsMP 兜底 → 展示 → 确认后安装
- **排序** = 查询相关度（名字命中 100 / 描述命中 20 / 标签命中 10）+ 源优先级 + 星数加成（≤20）
- **本地优先**：先搜 `catalogue.json`（省 API），结果 <2 才联网
- **格式转换**：Codex 1:1；OpenCode 加 `tools`；Cursor 加 `allowed-tools`；正文逐字保留
- **信任分级**：Anthropic/skills.sh/精选 list（绿）> 社区（黄/橙）> SkillsMP 市场（灰，需人工核验）
- **边界**：find-skill=clone 单技能到本地；`claude plugin`=装托管插件包，两条路并存

## find-skill 的 6 阶段工作流

find-skill 本身就是一个技能——它的 `SKILL.md` 把「怎么找技能」写成 6 步交给 agent 执行：

| 阶段 | 做什么 |
| --- | --- |
| **Stage 0** 新鲜度 | 检查 `catalogue.json` 是否 >30 天，过期则提示更新 |
| **Stage 1** 理解查询 | 查询含糊时问 1-2 个澄清问题（什么栈？什么任务？），清晰则直接搜 |
| **Stage 2** 本地搜索 | 用内嵌 Python 对 `catalogue.json` 打分排序，离线出结果 |
| **Stage 3** 实时兜底 | 本地 <2 结果时，才调 SkillsMP API（需 key，缺 key 则只提示一次并回落本地） |
| **Stage 4** 展示 | ≤5 结果用紧凑卡片、6+ 用表格；标源 + 信任级；**问 Install?** |
| **Stage 5** 安装 | 用户确认后 `git clone` 到 `~/.claude/skills/<name>`，并 head 验证 |
| **Stage 6** 确认解释 | 说明装在哪、怎么激活（`/name` 或自动）、给一个当前项目的用法示例 |

> 这套设计本身就是一个「用户触发 + 强制确认」的技能范例：把发现→甄别→确认→安装的流程固化，避免 agent 背着你装东西。

## 排序：查询相关度 × 源信任 × 星数

Stage 2 的 Python 打分（写死在 `SKILL.md` 里）决定结果次序：

```python
# 1) 查询相关度
if query == name:      score = 100   # 精确匹配技能名
elif query in name:    score = 50    # 名字含查询
elif query in desc:    score = 20    # 描述含查询
elif query in tags:    score = 10    # 标签含查询

# 2) 源信任加成（Anthropic 60 → skills.sh 30 → 各社区源递减 → SkillsMP 3）
score += SOURCE_PRIORITY[source]

# 3) 星数加成（最多 +20）
score += min(stars / 1000, 20)

# 排序：score 降序，同分按星数降序
```

含义：**官方与高信任源天然靠前，热门（高星）再加成，但精确名字命中压倒一切**。这让你搜 `docker` 时，官方 docker 技能排在一堆社区同名技能之前。

## 信任分级：结果可信度一眼可辨

find-skill 把 14 个源分档，展示时标色，让你在「装别人的指令」前先掂量来源：

| 档位 | 代表源 | 语义 |
| --- | --- | --- |
| Official（绿） | Anthropic、skills.sh（Vercel 精选目录） | 官方/权威 |
| Top awesome-list（绿） | hesreallyhim、ComposioHQ | 头部精选清单 |
| Curated（黄） | vercel-labs、VoltAgent、travisvn、BehiSecc | 社区精选 |
| Community（橙） | alirezarezvani、heilcheng、daymade、mxyhi | 社区收录 |
| Marketplace（灰） | SkillsMP | 市场源，**须人工核验仓库** |

> 装技能 = 执行别人写的指令。来源越靠下越要读 `SKILL.md` 确认它到底会让 agent 做什么。

## 安装即格式转换

同一个 Claude 风格 `SKILL.md` 装到不同 agent，find-skill 自动改写 frontmatter 头，正文一字不动：

| 目标 | 转换 |
| --- | --- |
| → Codex | `name` + `description` 原样 1:1 拷贝 |
| → OpenCode | 变成 `description` + `argument-hint` + `tools: {read, write, bash, edit}` |
| → Cursor | 变成 `description` + `allowed-tools: [Bash, Read, Write, Edit]` |

这解决了跨 agent 可移植性的「最后一公里」——开放规范保证正文通用，find-skill 补上各家 frontmatter 差异。

## 本地优先：为什么先搜缓存

Stage 2 永远先搜本地 `catalogue.json`（4835 条、离线），只有结果 <2 才在 Stage 3 联网 SkillsMP。好处：

- **省 API 配额**（SkillsMP 有每日限额）
- **隐私**：搜索不出本机
- **离线可用**：断网也能搜 4800+ 技能

SkillsMP key（可选）只影响两件事：实时兜底、以及下次 `update-skills-catalogue.sh` 时把 352 条市场技能并进本地目录。**核心离线功能不需要 key**。

::: tip key 的安全约定
key 存 `~/.claude/skills/find-skill/.env`（`chmod 600`）。agent 调 SkillsMP 前必须 `source` 该文件，**不得 `cat` 读出、不得打印原始 key**——这是 `SKILL.md` 里写死的安全规则。
:::

## 与 `claude plugin` 的边界

技能进你项目有两条路，别混淆：

| 维度 | find-skill / `npx skills` | `claude plugin` |
| --- | --- | --- |
| 装的是 | 单个技能文件夹（clone/拷贝到本地） | 托管插件包（可含技能+hooks+MCP+子代理） |
| 可编辑 | 是（拷到本地随你改） | 否（只读、订阅式，作者更新你跟着更新） |
| 更新 | 手动重装 / 更目录 | `claude plugin update` |
| 适合 | 找单个技能、跨 agent、要 hack | 装整套受维护的技能集（如 Superpowers/gstack） |

> 两者互补：想找「一个」技能用 find-skill；想订阅「一整套」受维护技能用插件市场。

## 反模式与局限

| 反模式 / 局限 | 说明 |
| --- | --- |
| 装完不读 `SKILL.md` | 等于盲执行别人的指令；市场源尤其要读 |
| 只看星数挑 | 星数只占排序一档，热门≠适合你的场景 |
| 忘了更目录 | 不自动更新，久了搜到的是过期快照 |
| 把它当版本管理器 | 没有语义化版本/依赖解析，就是搜+clone+转格式 |
| 期望它保证质量 | 它保证「找得到」，不保证「找得对」——质量自负 |

## 下一步

- [参考](./reference) —— `/find-skill` 与 `/install-skill` 全 flag、14 个源、安装路径、目录维护命令
- 上游：[find-skill README](https://github.com/fockus/claude-skill-find-skill#readme)
