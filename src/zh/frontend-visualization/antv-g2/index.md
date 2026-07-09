---
layout: doc
---

# AntV G2

蚂蚁集团 AntV 出品的「简洁的渐进式可视化语法」（当前 **v5.4.x**，MIT 协议）：名字与设计理念直接来自 Wilkinson 的《The Grammar of Graphics》（与 ggplot2 / Vega-Lite 同源谱系），**拒绝枚举图表类型**，用标记（Mark）+ 编码（Encode）+ 转换（Transform）+ 比例尺（Scale）+ 坐标系（Coordinate）等基本单元的**组合**来描述一切图表——柱状图、条形图、饼图、玫瑰图在 G2 里是同一个 `interval` 标记在不同坐标系下的呈现。底层渲染引擎为 `@antv/g`（Canvas 内置默认，SVG / WebGL 可切换），面向报表搭建、数据探索与可视化叙事。v5 于 2023 年发布，与 v4 **完全不兼容**（架构重写），提供 options 声明式与函数式链两种**完全等价**的 API 风格。

## 评价

**优点**

- **图形语法的组合能力**：「画一个 ECharts 没有的图」在 G2 里往往只是换一个 coordinate 或 transform；分面、视图复合、坐标系变换原生支持，小倍数图、散点相关性矩阵（SPLOM）是一等公民
- **声明式统计变换内置**：`binX` 分箱、`group` 聚合、`normalizeY` 归一化等直接在图形层声明，多数聚合不需要业务侧预处理数据
- **动画即编码通道**：`enterDuration` / `enterDelay` 可绑定数据字段与比例尺，数据驱动动画与关键帧 morphing 是 v5 特色能力
- **双 API 等价可混用**：options 声明式（官方主推）与函数式链声明可视化的能力完全等价
- **国内生态友好**：中文文档完善；React 技术栈有 Ant Design Charts（2.x 底层已升级为 G2 v5）承接开箱即用需求

**缺点**

- **上手门槛高于配置式**：须先理解 mark / encode / transform / scale / coordinate 语法模型，不像 ECharts 查配置项文档拼 option 即可出活
- **v4 → v5 断代**：网上大量老教程失效，搜到 `position('x*y')` 写法的一律是 v4 资料，对新人干扰大
- **图表广度有取舍**：统计图表深，但地图弱（AntV 另有 L7 承接）、3D 有限；追求大屏全家桶开箱效果不如 ECharts
- **社区规模小于 ECharts**：主题 / 示例 / 第三方资源数量差距明显

## 本叶地图

- [入门](./getting-started) —— 图形语法理念（vs 配置式 ECharts）、安装与第一个图表、Chart 实例与生命周期、双 API 风格、React / Vue 集成
- [标记与编码](./guide-line/marks-and-encode) —— Mark 体系全览（没有图表只有标记）、复合标记、Encode 视觉通道、编码值四形式、数组通道
- [转换与坐标系](./guide-line/transform-and-coordinate) —— mark transform 三类、data.transform 分工、坐标系全表、饼图 / 条形 / 玫瑰的本质
- [比例尺与组件](./guide-line/scales-and-components) —— Scale 三大家族与类型推断、比例尺同步、axis / legend / tooltip / label 配置与防重叠
- [复合、交互与动画](./guide-line/composition-interaction-animation) —— spaceLayer / facet / repeatMatrix、双轴图、交互与状态、事件联动、动画编排
- [参考](./reference) —— mark / transform / coordinate / interaction 速查表、v4→v5 迁移对照、SSR 与生态选型、易错点清单

## 文档地址

[AntV G2 官方文档](https://g2.antv.antgroup.com)

## GitHub 地址

[antvis/G2](https://github.com/antvis/G2)

## 幻灯片地址

<a href="/SlideStack/antv-g2-slide/" target="_blank">AntV G2</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=antv-g2" target="_blank" rel="noopener noreferrer">AntV G2 测试题</a>
