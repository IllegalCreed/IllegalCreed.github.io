---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 addyosmani/web-quality-skills（Addy Osmani）主分支的 README、AGENTS.md 与 skills/ 编写。

## 速查

- **是什么**：Addy Osmani（Google Chrome / Web 性能权威）个人维护的 agent 技能集，MIT；「基于 Lighthouse + Core Web Vitals 优化 web 质量」，框架无关
- **装**：`npx skills add addyosmani/web-quality-skills`（或 `npx add-skill …`；也支持 Claude Code plugin / Codex / Gemini CLI）
- **6 技能**：`web-quality-audit`（编排全站审计）·`performance`（加载+运行时）·`core-web-vitals`（LCP/INP/CLS）·`accessibility`（WCAG 2.2）·`seo`·`best-practices`
- **触发**：装后任务匹配自动激活，如「Audit my site」「Speed up my site」「Fix LCP」「WCAG audit」「Optimize SEO」「Security audit」
- **CWV 阈值**：LCP ≤ 2.5s ·INP ≤ 200ms ·CLS ≤ 0.1（Google 取 75 分位）
- **Lighthouse 目标分**：Performance ≥ 90 ·Accessibility 100 ·Best Practices ≥ 95 ·SEO ≥ 95
- **不同仓**：`addyosmani/agent-skills`（宽泛集）是另一叶 [Addy Osmani Agent Skills](../addy-osmani-agent-skills/)；本叶专注 web quality
- **注意**：README 标「unofficial」——Addy 个人集合，非 Google 官方发布

## 定位：谁做的，跟哪个叶不一样

Web Quality Skills 由 **Addy Osmani** 维护。他是 Google Chrome 团队工程负责人、Web 性能领域公认的权威（著有《Learning Patterns》《Image Optimization》，长期布道 Core Web Vitals）。这套技能把他与 **Chrome DevTools 团队**的实战洞见，连同 Google Lighthouse 的 150+ 审计规则，沉淀成 agent 可按需调用的 6 个技能。

一句话概括仓库描述：**「基于 Google Lighthouse 指南与 Core Web Vitals 最佳实践，优化 web 项目质量的 Agent Skills」**。它 **框架无关**——React、Vue、Angular、Svelte、Next.js、Nuxt、Astro、纯 HTML 都能用，示例先给 vanilla HTML/CSS/JS，再补框架专有注释。

::: warning 与「Addy Osmani Agent Skills」叶区分
本叶是 `addyosmani/web-quality-skills`，**专注 web quality**（性能 / 无障碍 / SEO / 安全）。另有一叶 [Addy Osmani Agent Skills](../addy-osmani-agent-skills/) 对应 `addyosmani/agent-skills`，是**宽泛的通用工程技能集**。两者同为 Addy Osmani 出品，但**不同仓、不同侧重**，别混。
:::

## 安装

主推 skills CLI，一条命令装进你的编码 agent：

```bash
npx skills add addyosmani/web-quality-skills
```

或等价的：

```bash
npx add-skill addyosmani/web-quality-skills
```

手动复制（装进 Claude Code 的用户级技能目录）：

```bash
cp -r skills/* ~/.claude/skills/
```

其它 agent 也各有入口：

```text
# Claude Code 插件（带版本、带命名空间）
/plugin marketplace add addyosmani/web-quality-skills
/plugin install web-quality-skills@addy-web-quality-skills

# Codex（CLI v0.122+）
codex plugin marketplace add addyosmani/web-quality-skills

# Gemini CLI 扩展
gemini extensions install https://github.com/addyosmani/web-quality-skills
```

装后技能**自动可用**——agent 检测到相关任务时激活，也可用自然语言显式触发。

## 6 个技能速览

| 技能 | 何时用（触发词） | 一句话 |
| --- | --- | --- |
| `web-quality-audit` | 「Audit my site」「Lighthouse audit」 | 编排全部技能，跨性能/a11y/SEO/最佳实践 150+ 检查 |
| `performance` | 「Speed up」「Optimize performance」 | 加载 + 运行时性能：关键渲染路径、JS/图片/字体、缓存 |
| `core-web-vitals` | 「Fix LCP」「Reduce CLS」「INP」 | 影响 Google 排名的三大指标 LCP/INP/CLS |
| `accessibility` | 「a11y」「WCAG」「screen reader」 | WCAG 2.2 无障碍：POUR 四原则，含 2.2 新增准则 |
| `seo` | 「Optimize SEO」「meta tags」 | 技术 SEO / 页面 SEO / 结构化数据 / 移动友好 |
| `best-practices` | 「Security audit」「code quality」 | 安全（HTTPS/CSP/SRI）、现代 API、代码质量 |

## 用法：一句话触发

技能装好后，直接用自然语言描述任务，agent 会匹配对应技能：

```text
Audit this page for web quality issues        # → web-quality-audit
Optimize performance and fix Core Web Vitals  # → performance + core-web-vitals
Review accessibility and suggest improvements # → accessibility
Make this SEO-ready                           # → seo
```

`web-quality-audit` 是「总入口」——不确定该查哪块时用它，它会编排其它技能做全站审计，把发现按 Critical / High / Medium / Low 分级报告。

## Lighthouse + Core Web Vitals：量化的地基

这套技能的所有阈值都来自 Google Lighthouse 与 Core Web Vitals。记住三大指标的「Good」阈值（Google 在**75 分位**衡量，即 75% 的访问要达标）：

| 指标 | 衡量 | Good | 需改进 | 差 |
| --- | --- | --- | --- | --- |
| **LCP** | 加载（最大内容渲染） | ≤ 2.5s | 2.5s–4.0s | > 4.0s |
| **INP** | 交互响应 | ≤ 200ms | 200ms–500ms | > 500ms |
| **CLS** | 视觉稳定 | ≤ 0.1 | 0.1–0.25 | > 0.25 |

Lighthouse 四大类的目标分：**Performance ≥ 90、Accessibility 100、Best Practices ≥ 95、SEO ≥ 95**。跑一次 Lighthouse 就能拿到基线：

```bash
npx lighthouse https://example.com --output html --output-path report.html
```

## 下一步

- [指南](./guide-line) —— 6 技能逐讲（audit 编排 / performance / accessibility WCAG 2.2 / core-web-vitals / best-practices / seo）、触发词、反模式
- [参考](./reference) —— 6 技能全表 + 触发词 + CWV 阈值 + 性能预算 + 许可 + 链接
