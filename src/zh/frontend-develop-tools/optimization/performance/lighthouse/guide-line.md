---
layout: doc
outline: [2, 3]
---

# 核心指标与审计

> 基于 Google Lighthouse 官方文档（developer.chrome.com/docs/lighthouse）+ web.dev/articles/{lcp,inp,fcp,cls} 编写，对照 Lighthouse 13 稳定版

## 速查

- **LCP**（加载）：最大图像 / 文本块 / 视频，Good ≤ 2.5s，主因「资源加载慢 / TTFB 高 / 渲染阻塞」
- **INP**（交互）：端到端 = input delay + processing + presentation delay，Good ≤ 200ms，2024-03-12 取代 FID
- **CLS**（视觉稳定）：累计布局偏移**分数**（非时间），Good ≤ 0.1，主因「无尺寸图片 / 字体 / 动态注入」
- **FCP**（首次绘制）：任意内容首次出现，Good ≤ 1.8s（与 LCP 区别：FCP 任意内容 vs LCP 最大块）
- **TBT**（阻塞）：主线程 > 50ms 任务的超时累加，仅 lab，Good ≤ 200ms，**INP 的代理指标**
- **TTFB**：首字节，audit 阈值 < 800ms，**不计入评分**，通过 FCP/LCP 间接影响
- 四类审计：Performance / Accessibility / Best Practices / SEO，每类 0–100
- 评分权重：TBT 30% / LCP 25% / CLS 15% / FCP 10% / SI 10% / INP 10%
- LHCI 三级：`off` / `warn`（exit 0）/ `error`（exit 非零）
- 反模式：单次跑分定结论、关节流刷高分、把 100 当目标、INP lab 值当真相

## 六大指标详解

### LCP（Largest Contentful Paint，最大内容绘制）

**含义**：页面最大「内容块」完成绘制的时刻——通常是 hero 图、最大文本块、或 `<video>` 的首帧 poster。

| 区间 | 等级 | 含义 |
| --- | --- | --- |
| ≤ 2.5s | Good | 大多数用户感受到「快」 |
| 2.5–4s | Needs Improvement | 有改进空间 |
| > 4s | Poor | 体验明显慢 |

**优化方向**

- **降低 TTFB**：CDN、SSR / 静态化、边缘渲染
- ** preload 关键资源**：`<link rel="preload" as="image" href="hero.webp">`
- **避免渲染阻塞**：移除阻塞 CSS / 同步 JS、压缩关键 CSS 内联
- **图像优化**：尺寸明确、用 `srcset`、WebP / AVIF、避免懒加载 hero
- **服务端推送**：HTTP/2 server push 或 103 Early Hints

> Lighthouse 13 起，`lcp-phases-insight` 把 LCP 拆成 TTFB / 资源加载 / 渲染阻塞 / 元素绘制 四阶段，定位元凶更精准。

### INP（Interaction to Next Paint，交互到下次绘制）

**含义**：用户从交互（点击 / 按键 / 输入）到浏览器**下次绘制**之间的端到端时间，覆盖整个页面生命周期所有交互，**取最差值**（不是平均）。

| 区间 | 等级 |
| --- | --- |
| ≤ 200ms | Good |
| 200–500ms | Needs Improvement |
| > 500ms | Poor |

**INP vs FID（重要区别）**

| 维度 | FID（已废弃） | INP（2024-03-12 取代） |
| --- | --- | --- |
| 测量对象 | 仅首次输入的 input delay | 全生命周期所有交互 |
| 测量阶段 | input delay 一段 | input delay + processing + presentation delay（端到端） |
| 取值 | 单次 | 高百分位（接近最差） |

**为何 Lighthouse lab 测不准 INP**

- lab 默认无真实交互，跑出来的 INP 经常没值或意义不大
- field 数据用 [`web-vitals` 库](https://github.com/GoogleChrome/web-vitals) 的 `onINP()` 采集，或看 PSI 的 CrUX

**优化方向**：拆长任务（`scheduler.yield()`、`requestIdleCallback`）、Web Worker、防抖、减少主线程工作。

> TBT 是 INP 的 lab 代理指标——压低主线程 > 50ms 长任务能间接改善 INP。

### CLS（Cumulative Layout Shift，累计布局偏移）

**含义**：页面生命周期内**布局偏移分数的累计**（不是时间），分数 = 影响比例 × 距离比例。

| 区间 | 等级 |
| --- | --- |
| ≤ 0.1 | Good |
| 0.1–0.25 | Needs Improvement |
| > 0.25 | Poor |

**常见成因**

- 图片 / iframe / 广告位**无 width/height**：加载完后撑开布局
- **字体加载**导致文本位移：`font-display`、`size-adjust`、`preload` 字体
- **动态注入**内容（弹窗、广告、cookie banner）把已有内容推开
- SSR hydration 后客户端再二次插入节点

**优化方向**：所有视觉元素都给尺寸（`aspect-ratio`）、字体 `font-display: optional` 或 `preload`、动态内容用 `min-height` 占位、避免在已有内容上方插入。

> Lighthouse 13 的 `cls-culprits-insight` 直接列出每个偏移的贡献元素 + 偏移量。

### FCP（First Contentful Paint，首次内容绘制）

**含义**：浏览器首次绘制**任意**内容（文本、图像、SVG、非白色 canvas）的时刻。

| 区间 | 等级 |
| --- | --- |
| ≤ 1.8s | Good |
| 1.8–3s | Needs Improvement |
| > 3s | Poor |

**FCP vs LCP**

- FCP = **任意**内容首次出现（小图标、一段文字都算）
- LCP = **最大**内容块完成（通常是 hero 元素）

> FCP 早不一定 LCP 早——如果 hero 图加载慢，FCP 早但 LCP 拖到很晚。

### TBT（Total Blocking Time，总阻塞时间）

**含义**：FCP 与 TTI 之间，主线程上**超过 50ms 的任务**的超时部分累加。例：一个 200ms 任务贡献 150ms（200 − 50）。

| 区间 | 等级 |
| --- | --- |
| ≤ 200ms | Good |
| 200–600ms | Needs Improvement |
| > 600ms | Poor |

**关键性质**

- **仅 lab 指标**：field 没有 TBT，它是 INP 的代理——主线程阻塞越多，用户交互越慢
- **权重最高**（30%）：降 TBT 是 Performance 评分最高性价比的优化

**优化方向**：拆长任务（`await scheduler.yield()`）、代码分割、`requestIdleCallback`、Web Worker、defer / async script。

### TTFB（Time to First Byte，首字节时间）

**含义**：从请求发起到浏览器收到第一个字节的时间。Lighthouse 里仅作为 **audit**（不直接计入评分），但通过 FCP / LCP 间接影响分数。

| 区间 | 等级 |
| --- | --- |
| < 800ms | Good |
| 800–1800ms | Needs Improvement |
| > 1800ms | Poor |

**优化方向**：CDN、SSR / SSG、HTTP/2、缓存、避免重定向、靠近用户的边缘节点。

## 四类审计深度

### Performance（性能）

权重汇总指标见上一节。两类辅助清单：

- **Opportunities**：列出可节省时间的优化项（未压缩图像、阻塞资源、未用 CSS…），每条带「节省 X 秒」估算
- **Diagnostics**：解释为何分数低但不直接给分（DOM 大小、第三方代码、长任务列表…），是改进路线图

### Accessibility（可访问性）

检查残障用户能否使用：颜色对比度、`alt` 文本、表单 `label`、`tabindex`、ARIA、焦点可见、文档语言、`viewport` meta。常见低分原因：装饰图缺 `alt=""`、按钮无文本、对比度不足 4.5:1。

### Best Practices（最佳实践）

工程规范：HTTPS、无 console error、图像有明确尺寸、缓存头合理、避免 `document.write`、JS 监听器内存泄漏、Geolocation API 权限合理。

### SEO（搜索引擎优化）

抓取友好性：`<title>` 与 `<meta description>` 存在且有效、`robots.txt` 可访问、移动友好（`viewport`）、`hreflang` 正确、无阻塞爬取的 JS 错误、链接带描述性文本。

## 使用方式深入

### Chrome DevTools 面板

打开 DevTools → 面板栏 `»` → **Lighthouse** → 选类别（Performance / Accessibility / Best Practices / SEO / Progressive Web App）和设备（Mobile / Desktop）→ Generate report。跑完直接在 DevTools 内看报告，可导出 HTML / JSON / 报告链接。

### CLI

```bash
# 仅 Performance，桌面模式，输出 html + json
npx lighthouse https://example.com \
  --preset=desktop \
  --only-categories=performance \
  --output=html --output=json \
  --output-path=./report

# 关闭节流（仅诊断用，别和默认 simulate 比）
npx lighthouse https://example.com --throttling-method=provided

# 自定义配置（节流、采集、audit 启停）
npx lighthouse https://example.com --config-path=./lighthouse.config.cjs

# 仅采集 artifacts（不跑 audit），便于后续多次重审
npx lighthouse https://example.com -G           # 存到 ./latest-run/
npx lighthouse https://example.com -A           # 仅跑 audit（需先 -G）
```

**关键 flag 速查**

| flag | 作用 |
| --- | --- |
| `--only-categories=` | 限定类别（performance / accessibility / best-practices / seo / pwa） |
| `--preset=` | `perf` / `experimental` / `desktop` |
| `--throttling-method=` | `simulate`（默认）/ `devtools` / `provided` |
| `--output=` | `json` / `html` / `csv`（可多值） |
| `--output-path=` | 文件路径；`stdout` = 输出到标准输出 |
| `--view` | 跑完自动开浏览器看报告 |
| `--form-factor=` | `mobile`（默认）/ `desktop` |
| `--screen-emulation.disabled` | 关闭屏幕模拟 |
| `-G` / `-A` | 仅采集 artifacts / 仅跑 audit |
| `--chrome-flags=` | 如 `--headless --no-sandbox` |

### Node Module

集成进自己的工具 / pipeline：

```js
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
const result = await lighthouse("https://example.com", {
  port: chrome.port,
  output: "json",
  onlyCategories: ["performance"],
});
await chrome.kill();
console.log(result.lhr.categories.performance.score);
```

### Lighthouse CI（LHCI）

CI 防回归的官方方案，命令链：`lhci healthcheck` → `lhci collect` → `lhci assert` → `lhci upload`。

`.lighthouserc.json` 最小配置：

```json
{
  "ci": {
    "collect": {
      "url": ["https://example.com"],
      "numberOfRuns": 5,
      "settings": { "preset": "desktop" }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

**assertions 三级 level**

| level | 行为 |
| --- | --- |
| `off` | 不检查（缺省即 off） |
| `warn` | stderr 输出但 exit 0 |
| `error` | stderr 输出且 exit 非零，**CI 失败** |

**属性**

- `minScore`（0–1）：类别分阈值，如 `categories:performance` ≥ 0.9
- `maxNumericValue`：指标阈值，如 `largest-contentful-paint` ≤ 2500（ms）
- `maxLength`：items 长度上限

**aggregationMethod（4 种）**

- `optimistic`（默认）：取所有 run 里最易过的值——**陷阱**：单次好就让 CI 过
- `pessimistic`：最难过
- `median`：中位数
- `median-run`：按代表性 run 选（官方推荐，对应真实分数）

> CI 防回归应改用 `median` 或 `median-run`，否则单次抖动会让回归被掩盖。

### PageSpeed Insights（PSI）

[pagespeed.web.dev](https://pagespeed.web.dev) 同时给：

- **Lab 数据**：Lighthouse 跑出来的 Performance / Accessibility / Best Practices / SEO 评分
- **Field 数据**：CrUX 真实用户的 LCP / INP / CLS / FCP 的 **p75 分位数**，按月聚合

> Lab 高 Field 低 = 真实用户分布比模拟环境差；Lab 低 Field 高 = 你的环境偏慢或测试样本不典型。

## 反模式（避坑）

- **把 lab 分当真实用户体验**：Lighthouse 是单次模拟，分数会因 A/B 测试、广告、网络路由、设备差异、浏览器扩展、杀软波动；CrUX 才是 field 真实 p75
- **关节流刷高分再去和默认比**：节流方式直接改变指标值（issue #14810），跨运行对比必须固定 `--throttling-method`
- **把 100 当目标**：官方明说 100 极难且不必要，99→100 ≈ 90→94 的改进量，性价比极低
- **用 Lighthouse 测 INP**：lab 通常不模拟真实交互，无交互则无 INP 值；认为 INP 是 0/很好可能是没触发交互，要靠 `onINP` 在 field 测
- **混淆 FID 与 INP**：FID 仅首次输入的 input delay（且 2024-03-12 已从 CWV 移除），INP 测整个生命周期的端到端延迟
- **混淆指标阈值与评分**：LCP ≤ 2.5s 是 Good，但对应 Performance 分数约 90 分（green 控制点），不是 100
- **以为 TTFB 直接计入评分**：TTFB 只是 audit，通过 FCP/LCP 间接影响
- **忽视 Node 版本**：Lighthouse 13 需 Node 22.19+，低版本会启动失败
- **继续依赖 v13 已移除的 audit**：`first-meaningful-paint`、`font-size`、`no-document-write`、`offscreen-images`、`preload-fonts`、`third-party-facades`、`uses-passive-event-listeners`、`uses-rel-preload` 等 ID 在 v13+ 已删，LHCI 断言引用会失效
- **把跑分波动当回归**：先排除 A/B、广告、流量路由、扩展、杀软、设备差异等环境因素，再下回归结论
- **LHCI assertion 不指定 aggregationMethod**：默认 `optimistic`（取所有 run 里最易过的值），CI 防回归应改用 `median` 或 `median-run`

## 下一步

- [参考](./reference.md)：完整阈值表、CLI 命令清单、版本变化、官方资源
