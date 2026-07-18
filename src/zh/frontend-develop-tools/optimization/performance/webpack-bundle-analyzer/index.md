---
layout: doc
---

# Webpack Bundle Analyzer

Webpack Bundle Analyzer 是 **webpack-contrib 组织**（Webpack 官方贡献者组织）维护的 Webpack 插件与 CLI 工具，把打包产物（bundle）按模块体积可视化成一张**可缩放的 Treemap（矩形树图）**，让开发者一眼看出「哪个模块 / 哪个 npm 包 / 哪段代码吃掉了多少 KB」。它从 webpack stats 数据出发，提供 **stat / parsed / gzip / brotli 四档体积维度**，支持 **server（启动 HTTP 服务）/ static（生成单 HTML）/ json（生成 JSON）/ disabled（仅生成 stats）** 四种启动模式，是 Webpack 生态中事实标准的体积分析工具。当前稳定版 **5.3.0（2026-03-25 发布）**，每周下载量百万级。需要注意的是：它的可视化图表**仅 Treemap 一种**（社区常误传支持 sunburst / network，那是 bundle-stats、Statoscope 等竞品的特性）；且与 Vite 无官方关系——Vite 用 Rollup 打包，对应替代品是 `rollup-plugin-visualizer` 与零配置的 `vite-bundle-visualizer`。

## 评价

**优点**

- **官方背书、生态默认**：webpack-contrib 维护，Webpack 生态体积分析事实标准
- **四档体积可切**：stat / parsed / gzip / brotli 一键切换，区分「压缩器输入」「输出」「传输」三种维度
- **交互友好**：treemap 支持缩放、右键 Context Menu（Hide / Show chunks）、左侧 sidebar 勾选 chunk
- **CI 友好**：`analyzerMode: 'static'` 生成单 HTML 报告，可归档为构建产物
- **端口可自动分配**：`analyzerPort: 'auto'` 解决 CI / 容器化场景下的端口冲突
- **stats JSON 可独立产出**：`generateStatsFile: true` 给下游工具（bundle-stats、Statoscope）二次分析

**缺点**

- **仅一种视图**：只 treemap，无 sunburst / network（需换工具）
- **仅服务于 Webpack**：Vite / Rollup / esm 项目需换 `rollup-plugin-visualizer`
- **内存型构建下 CLI 模式受限**：webpack-dev-server 下 bundle 不落盘，CLI 拿不到 parsed/gzip，只能用插件模式
- **parsed 是默认档位**：直接拿报告体积汇报业务会有偏差（用户实际下载 gzip 后体积）
- **excludeAssets 只过滤展示**：不会让 webpack 真的不打包该资产，体积优化仍需在 webpack config 里处理

## 文档地址

[webpack-bundle-analyzer README](https://github.com/webpack-contrib/webpack-bundle-analyzer)

## GitHub地址

[webpack-contrib/webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)

## 幻灯片地址

<a href="/SlideStack/webpack-bundle-analyzer-slide/" target="_blank">Webpack Bundle Analyzer</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=672" target="_blank" rel="noopener noreferrer">Webpack Bundle Analyzer 测试题</a>

## 待回填

> 题库 `categories` 的 `技术方向` 叶子名待入库后回填至上面测试题链接的 `?category=` 参数（替换 `PENDING`）。入库前先用 `import:content:prod` 增量更新拿到 groupId，再回填此处的 slug。
