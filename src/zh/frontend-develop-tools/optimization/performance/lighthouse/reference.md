---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Google Lighthouse 官方文档（developer.chrome.com/docs/lighthouse）编写，对照 Lighthouse 13 稳定版

## 速查

- Performance 权重：**TBT 30% / LCP 25% / CLS 15% / FCP 10% / SI 10% / INP 10%**（Lighthouse 12+）
- 评分颜色：绿 90+ / 橙 50–89 / 红 0–49
- 指标阈值（Good）：LCP ≤ 2.5s、INP ≤ 200ms、CLS ≤ 0.1、FCP ≤ 1.8s、TBT ≤ 200ms、TTFB < 800ms
- 评分曲线：log-normal，HTTP Archive 真实数据；25th 百分位 = 50 分、8th 百分位 = 90 分
- CLI 速跑：`npx lighthouse <url> --only-categories=performance --view`
- LHCI 三级：`off` / `warn`（exit 0）/ `error`（exit 非零）
- Node 22.19+（Lighthouse 13）
- 完整说明见 [入门](./getting-started.md) / [核心指标与审计](./guide-line.md)

## 指标阈值完整表

| 指标 | 含义 | Good | Needs Improvement | Poor | 计入评分 |
| --- | --- | --- | --- | --- | --- |
| **LCP** | 最大内容绘制 | ≤ 2.5s | 2.5–4s | > 4s | 是（25%） |
| **INP** | 交互到下次绘制 | ≤ 200ms | 200–500ms | > 500ms | 是（10%，v12+） |
| **CLS** | 累计布局偏移（分数） | ≤ 0.1 | 0.1–0.25 | > 0.25 | 是（15%） |
| **FCP** | 首次内容绘制 | ≤ 1.8s | 1.8–3s | > 3s | 是（10%） |
| **TBT** | 总阻塞时间（仅 lab） | ≤ 200ms | 200–600ms | > 600ms | 是（30%） |
| **Speed Index** | 视觉填充速度 | ≤ 3.4s | 3.4–5.8s | > 5.8s | 是（10%） |
| **TTFB** | 首字节时间 | < 800ms | 800–1800ms | > 1800ms | 否（audit） |

## 评分颜色编码

| 分数区间 | 等级 | 颜色 |
| --- | --- | --- |
| 90–100 | Good | 绿 |
| 50–89 | Needs Improvement | 橙 |
| 0–49 | Poor | 红 |

## Performance 评分权重（Lighthouse 12+）

| 指标 | 权重 | 备注 |
| --- | --- | --- |
| TBT | 30% | 主线程阻塞，性价比最高 |
| LCP | 25% | 加载体验 |
| CLS | 15% | 视觉稳定 |
| FCP | 10% | 首次任意内容 |
| Speed Index | 10% | 视觉填充速度 |
| INP | 10% | 交互响应（v12 起新增） |

> 评分曲线 log-normal，源自 HTTP Archive：25th 百分位 = 50 分、8th 百分位 = 90 分。0.96 分附近边际收益递减。

## CLI 命令清单

### 基础

```bash
# 全部默认（移动 + 节流 + 四类审计 + html 报告）
npx lighthouse https://example.com

# 仅 Performance，开浏览器
npx lighthouse https://example.com --only-categories=performance --view

# 桌面模式
npx lighthouse https://example.com --preset=desktop

# 同时输出 json + html
npx lighthouse https://example.com \
  --output=json --output=html --output-path=./report --view
```

### 类别 / 预设

| flag | 取值 |
| --- | --- |
| `--only-categories=` | `performance,accessibility,best-practices,seo,pwa`（逗号分隔） |
| `--only-audits=` | 仅跑指定 audit |
| `--skip-audits=` | 跳过指定 audit |
| `--preset=` | `perf` / `experimental` / `desktop` |
| `--config-path=` | 自定义 JS / JSON 配置 |
| `--plugins=` | 加载插件 |
| `--locale=` | 报告语言（如 `zh-CN`） |

### 节流（throttling）

| flag | 作用 |
| --- | --- |
| `--throttling-method=` | `simulate`（默认）/ `devtools` / `provided`（不节流） |
| `--throttling.rttMs=` | 模拟 RTT 毫秒数 |
| `--throttling.throughputKbps=` | 模拟下行带宽 |
| `--throttling.cpuSlowdownMultiplier=` | CPU 降速倍率（4 = 移动） |
| `--form-factor=` | `mobile`（默认）/ `desktop` |
| `--screen-emulation.disabled` | 关闭屏幕模拟 |

### 输出 / 浏览器

| flag | 作用 |
| --- | --- |
| `--output=` | `json` / `html` / `csv`（可多值） |
| `--output-path=` | 文件路径；`stdout` 输出到标准输出 |
| `--view` | 跑完自动开浏览器 |
| `--chrome-flags=` | 如 `--headless --no-sandbox` |
| `--port=` | Chrome DevTools 端口 |
| `--hostname=` | Chrome 远程主机 |
| `--extra-headers=` | 注入 Cookie / header（JSON 字符串） |

### 采集 / 审计分离

| flag | 作用 |
| --- | --- |
| `-G` | 仅采集 artifacts（存到 `./latest-run/`） |
| `-A` | 仅跑 audit（需先 `-G`） |
| `-GA` | 全跑并存盘（便于同 artifact 多次重审） |

## LHCI 配置速查

**配置文件优先级**：`.lighthouserc.js` > `.lighthouserc.cjs` > `.lighthouserc.json` > `.lighthouserc.yml/.yaml`（不支持向上目录查找，可用 `--config=` 显式指定）。

**命令链**：`lhci healthcheck` → `lhci collect`（多次跑取中位数）→ `lhci assert` → `lhci upload`。

**assertion level**

| level | 行为 |
| --- | --- |
| `off` | 不检查（缺省） |
| `warn` | stderr 输出，exit 0 |
| `error` | stderr 输出，exit 非零（CI 失败） |

**assertion 属性**

| 属性 | 作用 | 示例 |
| --- | --- | --- |
| `minScore` | 0–1 评分阈值 | `categories:performance` ≥ 0.9 |
| `maxNumericValue` | 毫秒 / 数值阈值 | `largest-contentful-paint` ≤ 2500 |
| `maxLength` | items 长度 | `resource-summary` 资源数 |

**aggregationMethod（默认 `optimistic`）**

| 方法 | 含义 |
| --- | --- |
| `optimistic` | 取所有 run 里最易过的值（默认，**陷阱**） |
| `pessimistic` | 最难过 |
| `median` | 中位数 |
| `median-run` | 按代表性 run 选关键指标（**官方推荐**） |

**upload target**：`temporary-public-storage`（临时公网链接）/ `lhci server`（自建）/ `github status check`（PR 状态检查）。

## Lighthouse 13 重要变化

### 新增 insights audits（替代旧 audit）

- `cls-culprits-insight`：列出每个布局偏移的贡献元素 + 偏移量
- `lcp-phases-insight`：LCP 拆成 TTFB / 资源加载 / 渲染阻塞 / 绘制 四阶段
- `lcp-discovery-insight`：LCP 元素的发现路径
- `render-blocking-insight`：渲染阻塞资源
- `interaction-to-next-paint-insight`：INP 慢的交互列表
- `document-latency-insight`：文档请求耗时
- `image-delivery-insight`：图像格式 / 压缩 / 懒加载
- `third-parties-insight`：第三方资源影响

### 移除 / 废弃的 audit

下列 audit 在 v13+ 已移除，LHCI 断言引用会失效：

- `first-meaningful-paint`（FMP）
- `font-size`
- `no-document-write`
- `offscreen-images`
- `preload-fonts`
- `third-party-facades`
- `uses-passive-event-listeners`
- `uses-rel-preload`

### 评分变化（近期）

- **Lighthouse 10**：废弃 TTI 作为评分指标
- **Lighthouse 12.0.0**（2024-04-22）：报告默认视图切到 insights；INP 进入 Performance 评分（10%）
- **2024-03-12**：INP 正式取代 FID 成为 Core Web Vital
- **Lighthouse 13**（2025-10-10）：要求 Node 22.19+，insights audits 大规模铺开

## 版本与运行环境

| 项 | 取值 |
| --- | --- |
| 当前稳定版 | **Lighthouse 13**（2025-10-10） |
| Node 要求 | ≥ 22.19 |
| 报告默认视图 | insights（v12+） |
| Core Web Vitals | LCP / INP / CLS（2024-03-12 起 INP 替 FID） |
| 性别曲线 | log-normal，HTTP Archive 真实数据 |

## 官方资源

- 文档总入口：[https://developer.chrome.com/docs/lighthouse/overview](https://developer.chrome.com/docs/lighthouse/overview)
- Performance 评分：[https://developer.chrome.com/docs/lighthouse/performance/performance-scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)
- CLI 文档：[https://googlechrome-lighthouse.mintlify.app/running/cli](https://googlechrome-lighthouse.mintlify.app/running/cli)
- LHCI 配置：[https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md)
- GitHub：[https://github.com/GoogleChrome/lighthouse](https://github.com/GoogleChrome/lighthouse)
- LHCI GitHub：[https://github.com/GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci)
- PageSpeed Insights：[https://pagespeed.web.dev](https://pagespeed.web.dev)
- web.dev 指标深度页：[/articles/lcp](https://web.dev/articles/lcp) · [/articles/inp](https://web.dev/articles/inp) · [/articles/cls](https://web.dev/articles/cls) · [/articles/fcp](https://web.dev/articles/fcp)
- Scoring Calculator：[https://googlechrome.github.io/lighthouse/scorecalc](https://googlechrome.github.io/lighthouse/scorecalc)
