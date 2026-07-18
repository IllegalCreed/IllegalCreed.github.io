---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 addyosmani/web-quality-skills（Addy Osmani）README、AGENTS.md 与 skills/ 编写。

## 速查

- **装**：`npx skills add addyosmani/web-quality-skills`
- **6 技能**：web-quality-audit / performance / core-web-vitals / accessibility / seo / best-practices
- **每技能**：`SKILL.md`（必）+ `scripts/`（可选）+ `references/`（可选），遵 agentskills.io
- **CWV**：LCP ≤ 2.5s ·INP ≤ 200ms ·CLS ≤ 0.1（75 分位）
- **Lighthouse 目标分**：Performance ≥ 90 ·Accessibility 100 ·Best Practices ≥ 95 ·SEO ≥ 95
- **许可**：MIT ·Addy Osmani（Google Chrome / Web 性能权威）·unofficial

## 6 技能全表

| 技能 | 触发词 | 覆盖 |
| --- | --- | --- |
| `web-quality-audit` | audit my site / lighthouse audit / quality review | 编排全部技能，150+ 检查，Critical/High/Medium/Low 分级 |
| `performance` | speed up / optimize performance / reduce load time / fix slow | 关键渲染路径、JS/图片/字体、缓存、运行时、第三方 |
| `core-web-vitals` | Core Web Vitals / LCP / INP / CLS / page experience | 三大指标专项优化 + 调试 + 框架快修 |
| `accessibility` | accessibility / a11y / WCAG / screen reader / keyboard navigation | WCAG 2.2 POUR + 2.2 新准则 + 测试清单 |
| `seo` | SEO / search optimization / meta tags / structured data / sitemap | 技术/页面 SEO、JSON-LD、移动、i18n、AI 可见性 |
| `best-practices` | best practices / security audit / modern standards / code quality | 安全、浏览器兼容、废弃 API、错误、source map |

## 安装方式全表

| 场景 | 命令 |
| --- | --- |
| skills CLI（主推） | `npx skills add addyosmani/web-quality-skills` |
| add-skill（等价） | `npx add-skill addyosmani/web-quality-skills` |
| 手动 | `cp -r skills/* ~/.claude/skills/` |
| Claude Code 插件 | `/plugin marketplace add addyosmani/web-quality-skills` → `/plugin install web-quality-skills@addy-web-quality-skills` |
| Codex（v0.122+） | `codex plugin marketplace add addyosmani/web-quality-skills` |
| Gemini CLI | `gemini extensions install https://github.com/addyosmani/web-quality-skills` |

## Core Web Vitals 阈值

| 指标 | Good | 需改进 | 差 |
| --- | --- | --- | --- |
| LCP（最大内容渲染） | ≤ 2.5s | 2.5s–4.0s | > 4.0s |
| INP（交互到下次绘制） | ≤ 200ms | 200ms–500ms | > 500ms |
| CLS（累计布局偏移） | ≤ 0.1 | 0.1–0.25 | > 0.25 |

Google 在 **75 分位**衡量：75% 的页面访问必须达到「Good」。

## 性能预算建议

| 资源类型 | 预算（压缩后） |
| --- | --- |
| 总页重 | < 1.5 MB |
| JavaScript | < 300 KB |
| CSS | < 100 KB |
| 首屏图片 | < 500 KB |
| 字体 | < 100 KB |
| 第三方 | < 200 KB |

## Lighthouse 目标分

| 类别 | 目标分 |
| --- | --- |
| Performance | ≥ 90 |
| Accessibility | 100 |
| Best Practices | ≥ 95 |
| SEO | ≥ 95 |

## 严重度分级

| 级别 | 说明 | 处理 |
| --- | --- | --- |
| Critical | 安全漏洞、彻底失败 | 立即修 |
| High | Core Web Vitals 失败、重大 a11y 障碍 | 上线前修 |
| Medium | 性能机会、SEO 改进 | 本迭代修 |
| Low | 微优化、代码风格 | 有空再修 |

## WCAG 2.2 新增准则（accessibility 技能覆盖）

| 准则 | 编号 | 要点 |
| --- | --- | --- |
| 焦点不被遮挡 | 2.4.11 | 聚焦元素不被 sticky 头/尾完全挡住 |
| 目标尺寸（最小） | 2.5.8 | 交互目标 ≥ 24×24 CSS 像素 |
| 拖拽动作 | 2.5.7 | 拖拽须有单指针替代 |
| 一致的帮助 | 3.2.6 | 重复帮助入口保持相同相对顺序 |
| 避免重复输入 | 3.3.7 | 同会话不重填已提供信息 |
| 可访问的认证 | 3.3.8 | 登录不只靠记忆/解谜，提供 passkey/邮件链接/允许粘贴 |

## 目录结构

```text
web-quality-skills/
├── README.md
├── AGENTS.md
├── LICENSE                 # MIT
└── skills/
    ├── web-quality-audit/  # SKILL.md + scripts/ + references/
    ├── performance/
    ├── accessibility/
    ├── seo/
    ├── best-practices/
    └── core-web-vitals/
```

每技能：`SKILL.md`（agent 指令，建议 < 500 行）+ `scripts/`（自动化，输出不占上下文）+ `references/`（支撑文档，单文件 < 200 行）。

## 关键命令速记

```bash
# Lighthouse 全量审计
npx lighthouse https://example.com --output html --output-path report.html

# 只跑无障碍
npx lighthouse https://example.com --only-categories=accessibility

# axe-core 无障碍扫描
axe https://example.com

# 依赖漏洞
npm audit --audit-level=moderate
```

```javascript
// web-vitals 库采集三大指标
import { onLCP, onINP, onCLS } from 'web-vitals';
onLCP(console.log); onINP(console.log); onCLS(console.log);
```

## 许可与出品

- **许可**：MIT
- **出品**：Addy Osmani（Google Chrome 团队 / Web 性能权威），含 Chrome DevTools 团队洞见
- **性质**：README 标注 unofficial（个人集合，非 Google 官方产品）

## 资源链接

- 仓库：[addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills)
- [Google Lighthouse 文档](https://developer.chrome.com/docs/lighthouse/)
- [web.dev Learn Performance](https://web.dev/learn/performance/)
- [Core Web Vitals](https://web.dev/articles/vitals)
- [WCAG 2.2 快速参考](https://www.w3.org/WAI/WCAG22/quickref/)
- 相关叶：[Addy Osmani Agent Skills](../addy-osmani-agent-skills/)（宽泛集，不同仓） · [Impeccable](../impeccable/)

## 下一步

- 回 [入门](./getting-started) 装技能、看 6 技能总览
- 看 [指南](./guide-line) 逐技能深入与反模式
