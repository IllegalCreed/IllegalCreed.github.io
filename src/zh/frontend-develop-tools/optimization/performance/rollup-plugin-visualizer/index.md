---
layout: doc
---

# rollup-plugin-visualizer

rollup-plugin-visualizer 是 **btd**（Denis Beklarishvili）个人维护、长期为 Vite 官方文档推荐的 **Rollup 打包体积可视化插件**。它实现 Rollup 的 `generateBundle` 钩子，在打包结束时把 bundle 的每个 chunk 模块按体积渲染成一张可缩放的交互图，让开发者一眼看出「哪个模块 / 哪个 npm 包 / 哪段代码吃掉了多少 KB」。当前 npm 稳定版 **v7.x（要求 Node.js >= 22）**，提供 **8 种模板**（`treemap`(默认)、`sunburst`、`treemap-3d`、`network`、`flamegraph`、`raw-data`、`list`、`markdown`），既可输出 HTML 交互报告，也可输出 JSON/YAML/Markdown 供 CI 程序化分析与体积回归。与 Webpack 生态的 Webpack Bundle Analyzer（仅 Treemap）相比，它的最大差异是**多模板 + Rollup/Vite 原生**——是 Vite 项目分析包体积的事实标准。

## 评价

**优点**

- **多模板覆盖**：treemap / sunburst / network / flamegraph 等 8 种模板，远比 WBA 的单一 treemap 丰富
- **Vite/Rollup 原生**：官方推荐的体积分析插件，与 Vite 零摩擦集成
- **CI 友好**：`raw-data` 产 JSON、`list` 产 YAML、`markdown` 产 MD，程序化分析与 PR 体积回归
- **压缩体积可见**：`gzipSize` / `brotliSize` 选项在报告中追加压缩后体积，贴近线上传输
- **CLI 多份合并**：自带 CLI 可合并多份 `raw-data` JSON，适合多 entry / 多配置构建合并分析
- **sourcemap 还原**：`sourcemap:true` 用 sourcemap 计算模块体积，压缩后仍能还原真实占比

**缺点**

- **Node 版本门槛高**：v7 要求 Node.js >= 22（v5 支持 14、v6 支持 18），老项目需先升 Node
- **模板视觉不保证 SemVer**：network / treemap / sunburst / flamegraph 的视觉细节可在小版本间变动，截图测试不能假设像素级稳定
- **`json` 选项已软废弃**：每次构建打印 deprecation 警告，新代码须改用 `template: 'raw-data'`
- **`open` 在 CI 受限**：无头环境会尝试调起浏览器导致构建卡住
- **报告含路径元数据**：HTML 报告含目录结构信息，分享前需评估是否泄露项目结构

## 文档地址

[rollup-plugin-visualizer README](https://github.com/btd/rollup-plugin-visualizer)

## GitHub地址

[btd/rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer)

## npm 地址

[rollup-plugin-visualizer on npm](https://www.npmjs.com/package/rollup-plugin-visualizer)

## 幻灯片地址

<a href="/SlideStack/rollup-plugin-visualizer-slide/" target="_blank">rollup-plugin-visualizer</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=673" target="_blank" rel="noopener noreferrer">rollup-plugin-visualizer 测试题</a>

## 待回填

> 题库 `categories` 的 `技术方向` 叶子名待入库后回填至上面测试题链接的 `?category=` 参数（替换 `PENDING`）。入库前先用 `import:content:prod` 增量更新拿到 groupId，再回填此处的 slug。
