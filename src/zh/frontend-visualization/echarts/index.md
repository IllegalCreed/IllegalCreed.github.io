---
layout: doc
---

# ECharts

Apache ECharts 是基于 zrender 渲染引擎的**声明式、配置驱动**图表库——用一个 option 对象描述整张图，Canvas/SVG 双渲染器，20+ 内置图表类型，是国内数据可视化的事实标准，也是前端面试图表库第一考点。它的优点是图表类型全、中文文档与示例生态最好、性能上限高（large / progressive / appendData 千万级点方案）、v6 起主题体系现代化且支持动态切换；代价是全量包体大（必须按需引入）、option 配置项极深（学习靠查文档）、命令式自由绘图弱于 D3（需 custom series / graphic 兜底）。选它 = 选「声明式配置 + 全场景覆盖」；不选它的理由通常是极致包体（Chart.js）或完全自由定制（D3）。

## 概述

- **架构分层**：ECharts（坐标系 / series / 组件 / 状态管理）→ zrender（2D 图形渲染引擎，统一抽象 Canvas 与 SVG 两种后端）→ 浏览器；`chart.getZr()` 可下探底层。
- **一切皆 option**：一个 option 就是一组组件声明（title / legend / tooltip / xAxis / yAxis / series…），数据更新也走 `setOption`（数据驱动，内部 diff + 过渡动画）。
- **按需引入是必修课**：`echarts/core` + `use([...])` 注册图表 / 组件 / 渲染器；全量引入包体大，漏注册组件则是最高频报错。
- **数据流推荐 dataset + encode**：数据与样式配置分离，一份数据多 series 复用，transform 做声明式过滤 / 排序。
- **性能方案分层**：large、progressive、appendData、sampling、useDirtyRect 各管一段，千万级数据点也有官方方案。
- **v6（2025-07 发布，当前 6.1）**：新默认主题 + `setTheme` 动态切换、和弦图、蜂群 / 抖动散点（轴级 jitter）、断轴、matrix 坐标系、thumbnail 缩略图、registerCustomSeries、轴标签防溢出 / 防重叠默认开启。

## 本叶地图

- [入门](./getting-started) —— 定位与架构、安装与按需引入（core + use）、init 与第一个图表、Canvas vs SVG 渲染器选型
- [实例与 option](./guide-line/instance-and-option) —— 实例生命周期、setOption 三种合并模式、resize 方案、clear vs dispose、option 心智模型与多轴多 grid
- [dataset 与系列](./guide-line/dataset-and-series) —— dataset + encode 数据流、transform 数据变换、line / bar / pie / scatter / candlestick 等常用系列关键配置
- [交互与视觉](./guide-line/interaction-and-visual) —— tooltip / legend / dataZoom / visualMap、事件系统与 dispatchAction、主题与深色模式、rich 与 graphic
- [性能与规模化](./guide-line/performance-and-scale) —— large / progressive / appendData / sampling、按需引入包体、SSR 全链路、地图与跨端
- [v6 新特性](./guide-line/v6-features) —— v6 新特性全景与 v5 → v6 升级要点（breaking changes 与回退开关）
- [参考](./reference) —— option 顶层结构速查、实例 API 表、资源链接

## 文档地址

- [Apache ECharts 官方文档](https://echarts.apache.org/zh/) —— 手册（handbook）、配置项手册、示例库
- [GitHub 仓库](https://github.com/apache/echarts) —— 源码与 release notes

## 幻灯片地址

- <a href="/SlideStack/echarts-slide/" target="_blank">ECharts</a>
