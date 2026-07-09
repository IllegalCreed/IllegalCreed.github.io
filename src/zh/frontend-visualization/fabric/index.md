---
layout: doc
---

# Fabric.js

Fabric.js 是构建在 HTML5 Canvas 之上的**交互式对象模型库**——它把裸 Canvas 变成一棵可选中、可拖拽、可缩放旋转、可序列化的「对象树」，本质是给 Canvas 补上一层类似浏览器 DOM 的对象模型 + 事件系统，是浏览器端做图形编辑器、白板、海报设计工具、签名板的老牌事实标准之一。npm 实测当前最新版为 **v7.4.0**（2026-05-18 发布，MIT 协议，`homepage: http://fabricjs.com/`）：Fabric 已于 2025-12-22 发布 **v7.0.0**，v6 系列止步于 6.9.1（2025-12-15 发布），v7 线随后连续迭代到 7.4.0；v6 起「ESM 化 + 命名导出 + TypeScript 重写」是地基级变化，在 v7 中语法完全延续，v7 相对 v6 只是默认值反转、少量 API 改名/删除等「装修级」调整。Node 端 `engines.node` 要求 `>=20.0.0`（v7 起），可配合 `node-canvas` 走 `fabric/node` 子路径做无头渲染/服务端出图。

## 评价

**优点**

- **API 覆盖面极广**：对象模型、事件、动画、滤镜、SVG 双向转换、序列化都是一等公民
- **历史悠久（十余年）、生态案例多**，是图形编辑器/白板类应用的老牌选择
- **v6 起 TypeScript 原生重写**，DX 显著提升；子类化统一为标准 `class extends`，修复了 v5 时代原型共享、多实例互相污染的老问题
- **Node 端可无头渲染**：`fabric/node` 子路径 + `node-canvas` 依赖，适合服务端出图/批量生成

**缺点**

- **性能定位是「中等数量、属性丰富的对象」**，不是「海量对象/粒子」场景（那是 PixiJS 的地盘）
- **无官方 React/Vue 绑定**，集成需自己手写生命周期同步
- **文档深度不均**：文档站从旧版「Fabric intro part 1/2/3」教程迁移到新的 core-concepts 体系后，部分深度内容（如完整事件清单）官方明确表示「未系统整理」，需要靠 TS 类型提示或 demo 反查
- **历史上出现过 SVG 导出相关安全问题**：近两个大版本各修复一次 CVE（7.2.0 的 CVE-2026-27013 stored XSS、7.4.0 的 CVE-2026-44311 CSS 注入），均涉及 `toSVG()` 对不可信内容的处理

一句话选型判断：要做「少量、精细可编辑」的图形对象（设计工具/白板/证件照编辑器）选 **Fabric.js**；要做「海量、渲染优先」的场景（游戏、粒子特效、大数据点图）选 **PixiJS**；技术栈是 React 且看重与 React 结合的顺滑度时，**Konva**（`react-konva` 官方绑定）与 Fabric 定位几乎重叠，可作为二选一的备选。与更底层的 [Canvas](../canvas/) 相比，Fabric 是「给裸 Canvas 补上对象模型」的上层框架——只需要「画出来看」、不要求对象级选中拖拽交互时，原生 Canvas API 更轻量。

## 本叶地图

- [入门](./getting-started) —— 定位（Canvas 对象模型 vs 原生 Canvas/Konva/PixiJS）、安装与 ESM 命名导出（v6/v7 延续）、第一个可交互对象、对象心智模型
- [Canvas 与对象模型](./guide-line/canvas-and-objects) —— Canvas/StaticCanvas 三层继承、FabricObject 通用属性与方法、内置形状、变换矩阵与坐标系
- [文本、图片与群组](./guide-line/text-image-group) —— Text/IText/Textbox 三层关系、图片异步加载与滤镜、Group/ActiveSelection 群组选择
- [交互与事件](./guide-line/interaction-and-events) —— 控件 controls 自定义、事件系统（对象级/画布级）、自由绘制、动画 API
- [序列化与自定义](./guide-line/serialization-and-custom) —— toObject/toJSON/loadFromJSON/toSVG、自定义属性登记、子类化 classRegistry、性能与缓存
- [参考](./reference) —— 类/属性/事件/API 速查表 + 选型对比 + 资源链接

## 文档地址

[Fabric.js 官方文档](http://fabricjs.com)

## GitHub 地址

[fabricjs/fabric.js](https://github.com/fabricjs/fabric.js)

## 幻灯片地址

<a href="/SlideStack/fabric-slide/" target="_blank">Fabric.js</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=fabric-js" target="_blank" rel="noopener noreferrer">Fabric.js 测试题</a>
