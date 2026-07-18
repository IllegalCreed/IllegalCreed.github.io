---
layout: doc
---

# 按需引入

「按需引入」（On-Demand Import）是前端工程化里**削减产物体积**的核心手段之一：只把代码真正用到的模块、组件、方法、图表类型打包进最终产物，把剩余代码在构建阶段（tree-shaking）或编译阶段（unplugin 自动导入 + 按需Resolver）剪掉。它由三件事共同成就——**ES Module 静态结构**（导入关系在编译期可分析）+ **package.json 的 sideEffects 字段**（标记哪些文件有副作用不能剪）+ **bundler tree-shaking 能力**（Vite/Rollup/Webpack 5+）。落到日常开发，最常见的三类按需引入场景是：**Element Plus 等 UI 库的组件按需**、**lodash-es 等工具库的方法按需**、**ECharts 等图表库的「核心 + 图表 + 组件 + 渲染器」五件套按需**，分别对应 `unplugin-vue-components`/`unplugin-auto-import` 自动导入、ESM 命名导入、`echarts.use([...])` 显式注册三种范式。截至 2026-07，Element Plus 2.14.3、Apache ECharts 6.1.0（与 v5 tree-shaking API 完全一致）、unplugin-vue-components 32.1.0、unplugin-auto-import 21.0.0、lodash/lodash-es 同步到 4.18.1（修复了 4.17.22 之前原型污染漏洞），是当前推荐组合。

## 评价

**优点**

- **体积收益立竿见影**：lodash 全量 ≈ 70KB（gzip 25KB），命名引入 `debounce` 单方法 gzip 后仅几百字节；Element Plus 全量样式 ≈ 300KB，按需后只引用到的组件
- **ESM 原生能力**：tree-shaking 是 ES Module 标准化静态结构带来的红利，不需要额外插件就能享受（前提是库本身正确声明 sideEffects）
- **自动导入体验好**：unplugin-vue-components + unplugin-auto-import 让 `<el-button>` 与 `ElMessage()` 即写即用，省去手写 import 与维护注册清单
- **细粒度可控**：ECharts 的 core + charts + components + features + renderers 五件套能精确到「只用 SVG 渲染 + 折线 + Tooltip」就只打包这些代码
- **类型友好**：ECharts 的 `ComposeOption` 可按已注册组件拼接最小 Option 类型，编译期就能查「用了未注册的组件」

**缺点**

- **前提条件多**：必须 ESM、必须正确 sideEffects、bundler 必须支持，缺一就退化为整包引入（CJS 的 lodash 即如此）
- **配置门槛**：Element Plus 按需是 AutoImport + Components 双插件并用，少装一个就缺命令式 API 或缺组件；ECharts 按需的 `use([...])` 必须显式注册，漏注册会静默失效
- **类型文件需提交**：`auto-imports.d.ts` / `components.d.ts` 要 commit 到仓库，CI 与新同事拉代码即有类型；简单 .gitignore 会让 IDE 满屏红线
- **主题定制有坑**：Element Plus 用 `importStyle: 'sass'` 改 SCSS 变量时，`additionalData` 会注入每个组件 scss，业务/变量 scss 必须分离，否则热更新极慢
- **库作者易踩 sideEffects**：把整包 `sideEffects: false` 设错，会误删 CSS 注入、polyfill 等副作用代码

## 文档地址

- [Element Plus Quick Start（Auto Import / Manually Import）](https://element-plus.org/en-US/guide/quickstart)
- [Apache ECharts Handbook · Import ECharts](https://apache.github.io/echarts-handbook/en/basics/import/)
- [ECharts 6 升级指南](https://echarts.apache.org/handbook/en/basics/release-note/v6-upgrade-guide/)
- [unplugin-vue-components](https://github.com/unplugin/unplugin-vue-components)
- [unplugin-auto-import](https://github.com/unplugin/unplugin-auto-import)
- [lodash 仓库（Module Formats 段说明 lodash-es / 子路径）](https://github.com/lodash/lodash)

## GitHub地址

- [element-plus/element-plus](https://github.com/element-plus/element-plus)
- [apache/echarts](https://github.com/apache/echarts)
- [unplugin/unplugin-vue-components](https://github.com/unplugin/unplugin-vue-components)
- [unplugin/unplugin-auto-import](https://github.com/unplugin/unplugin-auto-import)
- [lodash/lodash](https://github.com/lodash/lodash)

## 幻灯片地址

<a href="/SlideStack/on-demand-import-slide/" target="_blank">按需引入</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=667" target="_blank" rel="noopener noreferrer">按需引入 测试题</a>

