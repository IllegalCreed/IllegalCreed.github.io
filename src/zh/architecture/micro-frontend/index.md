---
layout: doc
---

# 微前端框架

把多个可独立开发、独立部署的前端应用组合成一个整体产品的架构方案。本章先用两叶讲透框架无关的通论——微前端的动机与反判据、组合模式，以及沙箱 / 样式隔离 / 通信 / 依赖共享四大核心机制；再逐个展开 2026 年仍值得投入的五条技术路线：single-spa（生命周期编排鼻祖）、qiankun（国内存量最大）、wujie（iframe 沙箱路线）、micro-app（组件化接入）、Module Federation（模块联邦主线）。

## 本章地图

> 按「概念 → 机制 → 框架」排列。已产出的叶子可点击，其余正在陆续产出。

**通论**

- [微前端基础](./mfe-basics/) —— 定义动机 / 判据与反判据 / 组合模式 / 2026 选型全景
- [微前端核心机制](./mfe-mechanisms/) —— JS 沙箱 / 样式隔离 / 通信 / 依赖共享 / 性能代价

**框架与路线**

- [single-spa](./single-spa/) —— 生命周期协议 / root config / import maps 工作流
- [qiankun](./qiankun/) —— 三沙箱 / 样式隔离 / HTML entry / Vite 之痛
- **wujie** —— iframe 沙箱 + WebComponent 容器 / 保活预加载（正在产出）
- [micro-app](./micro-app/) —— CustomElement 组件化接入 / 双沙箱模式
- [Module Federation](./module-federation/) —— 联邦架构 / shared 治理 / MF 2.0 运行时生态
