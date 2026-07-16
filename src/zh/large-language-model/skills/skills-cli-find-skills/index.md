---
layout: doc
---

# Skills CLI 与 find-skills

围绕 Agent Skills 标准，长出了一套**命令行工具生态**：发现（find-skills）、安装（`npx skills` / `claude plugin`）、校验（`skills-ref validate`）。其中 **find-skills**（`fockus/claude-skill-find-skill`）是发现旗舰——一个多 agent 的技能发现/安装 CLI，把 14 个源、4835 个技能汇进一份本地目录，在 Claude Code / Codex / OpenCode / Cursor 里用 `/find-skill` 搜、`/install-skill` 装，并按目标 agent 自动转换格式。

## 评价

**优点**

- **本地离线优先**：`catalogue.json`（4835 条、2.5MB）离线可搜，不联网也能用，隐私友好
- **多 agent 统一**：一份共享目录喂 4 个 agent（Claude Code/Codex/OpenCode/Cursor），装一次全受益
- **信任分级**：结果按「源优先级 × GitHub 星数」排序，官方/精选在前、市场源在后并标风险
- **安装即转换**：把 Claude 风格 `SKILL.md` 的 frontmatter 自动改写成各目标 agent 的原生格式，正文逐字保留
- **未确认不安装**：铁律——搜到后必须用户确认才 clone，缓存优先省 API
- **安装方式多**：`brew` / `pipx` / `curl` 一行 / 手动 clone 任选

**缺点**

- **目录不自动更新**：`catalogue.json` 需手动跑 `update-skills-catalogue.sh` 或挂 cron，否则会过期
- **实时兜底要 API key**：本地结果 <2 条才回落 SkillsMP，且需注册 key（离线核心功能不受影响）
- **发现 ≠ 质量**：它帮你找到技能，但技能好不好仍要自己读 `SKILL.md` 判断；市场源需人工核验
- **星数≠质量的老问题**：排序权重里星数占一档，热门未必适合你的场景
- **生态分散**：14 个源良莠不齐，同名/重复技能需要甄别

## 适用场景

- 想给项目找一个现成技能（Docker、测试、React…），不想手翻十几个 awesome-list
- 同时用多个 coding agent，想让它们共享同一份技能目录、装一次到处用
- 想在一处比较不同来源的同类技能、按信任度挑选
- 写完自己的技能，想用 `skills-ref validate` 校验、或用 `npx skills` 分发

## 边界

- **不是技能本身，是找技能的工具**：它发现和安装别人写的技能，不替你写技能
- **不是包管理器的完整替代**：没有版本锁定、依赖解析、语义化版本——就是「搜 + clone + 转格式」
- **与 `claude plugin` 互补不互斥**：插件市场（`/plugin marketplace add`）装的是托管插件包；find-skills 装的是单个技能文件夹，两条路并存
- **技能质量与安全自负**：装第三方技能等于执行别人的指令，来源不明须谨慎

## 官方文档

[find-skill · README](https://github.com/fockus/claude-skill-find-skill#readme) ｜ [SkillsMP 市场](https://skillsmp.com) ｜ [skills.sh（`npx skills`）](https://skills.sh) ｜ [skills-ref 校验库](https://github.com/agentskills/agentskills/tree/main/skills-ref)

## GitHub 地址

[fockus/claude-skill-find-skill](https://github.com/fockus/claude-skill-find-skill)（v1.0.1，MIT）

## 内容地图

- [入门](./getting-started) —— 装上 find-skill，用 `/find-skill` 搜、`/install-skill` 装第一个技能
- [指南](./guide-line) —— 6 阶段工作流、信任排序、格式转换、更广的技能 CLI 生态（安装/校验/分发）
- [参考](./reference) —— 命令与 flag 全表、14 个源、安装路径约定、目录维护、API key

## 幻灯片地址

<a href="/SlideStack/skills-cli-find-skills-slide/" target="_blank">Skills CLI 与 find-skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=584" target="_blank" rel="noopener noreferrer">Skills CLI 与 find-skills 测试题</a>
