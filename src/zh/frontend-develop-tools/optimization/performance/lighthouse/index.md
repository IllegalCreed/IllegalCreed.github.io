---
layout: doc
---

# Lighthouse

Lighthouse 是 Google 开源的**网页质量审计工具**，由 Chrome 团队维护，对一个 URL 跑一次「加载 + 交互」模拟，输出 Performance（性能）、Accessibility（可访问性）、Best Practices（最佳实践）、SEO 四类 0–100 评分，并附 Opportunities（节省时间）与 Diagnostics（诊断项）两张可操作清单。它有四种主要运行方式——Chrome DevTools 内置面板、命令行（CLI / Node Module）、CI 集成（Lighthouse CI / LHCI）、PageSpeed Insights（PSI，同时给实验室与真实用户数据），覆盖「本地调试 → 持续集成 → 线上监控」全链路。Lighthouse 13（2025-10）是当前稳定大版本，报告默认视图切到 **insights** 段，引入 `lcp-phases-insight`、`cls-culprits-insight`、`render-blocking-insight` 等更精准的诊断审计；评分指标自 Lighthouse 12 起纳入 INP（10% 权重），自 Lighthouse 10 起移除 TTI 不再作为评分项。Core Web Vitals 三件套（LCP / INP / CLS）+ 辅助指标 FCP / TBT / Speed Index / TTFB 构成 Performance 类的骨架，权重之和过半落在 TBT（30%）+ LCP（25%）两项，是性价比最高的两个优化抓手。

## 评价

**优点**

- **官方权威、生态默认**：Chrome 团队维护、DevTools 内置、PageSpeed Insights 底层都跑它，结论被业界当基准
- **四类一锅端**：一次跑同时审 Performance / Accessibility / Best Practices / SEO，省去多工具拼接
- **可操作性强**：每条 audit 都给「问题 + 建议 + 节省时间估算」，直接落到代码层
- **CI 友好**：LHCI 用 `minScore` / `maxNumericValue` 断言、`median-run` 取代表值，能可靠防回归
- **多形态运行**：DevTools 调试、CLI 脚本化、CI 自动化、PSI 公网监测，场景全覆盖
- **insights 段升级**（Lighthouse 13）：与 DevTools Performance panel 同源，定位元凶更精准

**缺点**

- **lab 数据 ≠ field 数据**：单次模拟环境的分数会因 A/B 测试、广告、扩展、设备差异波动；真实用户感受要看 CrUX
- **INP 在 lab 测不准**：默认无真实交互，INP 值意义有限；field 数据要靠 `web-vitals` 的 `onINP`
- **跑分敏感**：节流方式（`simulate` vs `devtools` vs `provided`）、设备、网络一变分数就跳，跨运行对比需固定环境
- **100 分陷阱**：官方明说 100 极难且不必要，99→100 改进量 ≈ 90→94，性价比极低
- **Node 版本要求严**：Lighthouse 13 需 Node 22.19+，低版本会启动失败
- **旧 audit 已移除**：v13 删了 `first-meaningful-paint`、`no-document-write`、`uses-rel-preload` 等多个 audit，LHCI 断言引用这些 ID 会失效

## 文档地址

- [Lighthouse 官方总入口](https://developer.chrome.com/docs/lighthouse/overview)
- [Performance 评分计算](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)
- [Lighthouse CLI 文档](https://googlechrome-lighthouse.mintlify.app/running/cli)
- [Lighthouse CI 配置](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md)

## GitHub地址

[GoogleChrome/lighthouse](https://github.com/GoogleChrome/lighthouse) · [GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci)

## 幻灯片地址

<a href="/SlideStack/lighthouse-slide/" target="_blank">Lighthouse</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=671" target="_blank" rel="noopener noreferrer">Lighthouse 测试题</a>

