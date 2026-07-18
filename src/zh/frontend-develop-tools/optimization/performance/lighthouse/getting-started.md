---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Google Lighthouse 官方文档（developer.chrome.com/docs/lighthouse）编写，对照 Lighthouse 13 稳定版行为

## 速查

- 四类审计：**Performance / Accessibility / Best Practices / SEO**，每类 0–100 分（绿 90+ / 橙 50–89 / 红 0–49）
- 三大 Core Web Vitals：**LCP ≤ 2.5s**（加载）、**INP ≤ 200ms**（交互，2024-03-12 取代 FID）、**CLS ≤ 0.1**（视觉稳定）
- 辅助指标：FCP ≤ 1.8s、TBT ≤ 200ms（仅 lab）、Speed Index、TTFB < 800ms（audit）
- Performance 权重：**TBT 30% + LCP 25% + CLS 15% + FCP 10% + Speed Index 10% + INP 10%**（Lighthouse 12+）
- 四种运行方式：**Chrome DevTools 面板 / CLI（npx lighthouse） / Node Module / PageSpeed Insights / 扩展**
- CLI 必会：`--only-categories=performance`、`--preset=desktop`、`--output=json|html|csv`、`--view`
- 节流三档：`simulate`（默认，最稳定）/ `devtools`（更接近真实 DevTools）/ `provided`（不节流）
- Node 要求：Lighthouse 13 需 **Node 22.19+**

## Lighthouse 是什么

Lighthouse 是 Google 开源的网页质量审计工具，通过「模拟一次加载 + 一段交互」收集 artifacts，跑一组 audit，把结果聚合成 0–100 的分数与可操作清单。它的核心定位有三：

- **官方基准**：Chrome 团队维护、DevTools 内置、PageSpeed Insights 底层引擎
- **四类一锅端**：Performance / Accessibility / Best Practices / SEO 一次审完
- **lab 工具**：跑在模拟环境，与 CrUX 的 field（真实用户 p75）数据互补，不互相替代

> Lighthouse ≠ Core Web Vitals 真实用户体验。它是单次模拟（lab），CrUX 才是真实用户分布（field）。

## 四类审计

| 类别 | 关注 | 典型 audit |
| --- | --- | --- |
| **Performance** | 加载与交互性能 | LCP、TBT、CLS、FCP、Speed Index、INP |
| **Accessibility** | 残障用户可用性 | 颜色对比度、alt 文本、label、tabindex、ARIA |
| **Best Practices** | 工程规范 | HTTPS、控制台错误、图像尺寸、缓存头、JS 内存 |
| **SEO** | 搜索引擎抓取 | title、meta description、robots、移动友好、hreflang |

> Performance 是开发者最常盯的一类，但 Accessibility / SEO 同样计入分数，不可忽视。

## 六指标速览

| 指标 | 含义 | Good | NI | Poor |
| --- | --- | --- | --- | --- |
| **LCP** | 最大内容绘制（最大图像 / 文本块 / 视频） | ≤ 2.5s | 2.5–4s | > 4s |
| **INP** | 交互到下次绘制（2024-03-12 取代 FID） | ≤ 200ms | 200–500ms | > 500ms |
| **CLS** | 累计布局偏移（分数，非时间） | ≤ 0.1 | 0.1–0.25 | > 0.25 |
| **FCP** | 首次内容绘制（任意内容首次出现） | ≤ 1.8s | 1.8–3s | > 3s |
| **TBT** | 总阻塞时间（主线程 > 50ms 任务累加，仅 lab） | ≤ 200ms | 200–600ms | > 600ms |
| **TTFB** | 首字节时间（audit，不计入评分） | < 800ms | 800–1800ms | > 1800ms |

> Lighthouse Performance 评分 ≠ 单个指标 Good / NI / Poor。LCP = 2.5s 对应约 90 分（green 控制点），不是 100。

## 评分颜色与权重

**颜色编码**（每类分数）：0–49 红 Poor / 50–89 橙 Needs Improvement / 90–100 绿 Good。

**Performance 评分权重**（Lighthouse 12+，合计 100%）：

| 指标 | 权重 | 解读 |
| --- | --- | --- |
| TBT | **30%** | 主线程阻塞，性价比最高的优化抓手 |
| LCP | **25%** | 加载体验，权重第二 |
| CLS | **15%** | 视觉稳定 |
| FCP | **10%** | 首次出现任意内容 |
| Speed Index | **10%** | 视觉填充速度 |
| INP | **10%** | 交互响应（Lighthouse 12+ 新增） |

> 评分曲线是 log-normal，源自 HTTP Archive 真实站点：25th 百分位映射 50 分（median 控制点），8th 百分位映射 90 分（green 控制点）。0.96 分附近是边际收益递减拐点。

## 四种运行方式

| 方式 | 命令 / 入口 | 适用 |
| --- | --- | --- |
| **Chrome DevTools** | 面板栏 → Lighthouse → Generate report | 本地调试、可视化看报告 |
| **CLI** | `npx lighthouse <url> --output=html --view` | 脚本化、批量、自定义配置 |
| **Node Module** | `import lighthouse from 'lighthouse'` | 集成进自己的工具 / pipeline |
| **PageSpeed Insights** | [pagespeed.web.dev](https://pagespeed.web.dev) | 公网监测，同时给 lab + CrUX field |
| **Lighthouse CI（LHCI）** | `lhci collect` → `assert` → `upload` | 持续集成防回归 |
| **浏览器扩展** | Chrome Web Store 的 Lighthouse 扩展 | 不开 DevTools 也能跑 |

## CLI 速跑

```bash
# 最常用：跑 Performance，开浏览器看 html 报告
npx lighthouse https://example.com --only-categories=performance --view

# 桌面模式（默认是移动）
npx lighthouse https://example.com --preset=desktop

# 同时输出 json + html（json 给脚本解析，html 给人看）
npx lighthouse https://example.com --output=json --output=html \
  --output-path=./report --view

# 多类审计 + 自定义节流
npx lighthouse https://example.com \
  --only-categories=performance,accessibility,best-practices,seo \
  --throttling-method=devtools
```

> Node 版本不够会启动失败。Lighthouse 13 需 `node -v` ≥ 22.19，可用 `nvm use 22` 切换。

## PageSpeed Insights（PSI）

[pagespeed.web.dev](https://pagespeed.web.dev) 输入 URL 即得：

- **Lab 数据**（Lighthouse）：模拟环境的 Performance / Accessibility / Best Practices / SEO 评分
- **Field 数据**（CrUX）：真实用户的 LCP / INP / CLS / FCP 的 **p75 分位数**

> 两边都达标才算真正稳。Lab 高、Field 低通常意味着真实设备 / 网络 / 用户交互分布比模拟环境差。

## 下一步

- [核心指标与审计](./guide-line.md)：六指标含义 + 阈值 + 优化方向、四类审计、CLI/DevTools/CI/PSI 深入、反模式
- [参考](./reference.md)：完整阈值表、CLI 命令清单、版本变化、官方资源
