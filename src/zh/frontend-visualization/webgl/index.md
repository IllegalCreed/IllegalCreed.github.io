---
layout: doc
---

# WebGL

WebGL 不是一个"3D 库"，而是浏览器暴露的**底层光栅化 API**——基于 OpenGL ES 的 GPU 状态机，只认点、线、三角形，三维效果（透视、光照、动画）全靠开发者手写的着色器程序（GLSL）"算出来"；它是 `<canvas>` 的另一种上下文（与 Canvas 2D 并列而非从属），Three.js、Babylon.js、PixiJS 等库都是在其之上封装出场景图、相机、材质、资源管理的更高层框架。能力上限很高——GPU 并行光栅化可支撑游戏级 3D、百万级粒子、实时图像滤镜，但抽象层级极低：没有场景图，没有相机/材质/灯光的内建概念，矩阵运算要自己写或引入 gl-matrix，纯状态机式 API（"当前绑定谁，后续操作就作用于谁"）极易写出"忘记切换绑定导致状态泄漏"的隐藏 bug。**WebGL 1.0**（基于 OpenGL ES 2.0）自 2015 年起已 Widely available，**WebGL 2.0**（基于 OpenGL ES 3.0，完全向后兼容 WebGL1）自 2021 年起也已 Widely available、全球可用率 94.44%；下一代的 **WebGPU** 虽已在 2025 年内被三大浏览器引擎全部首发支持，但截至 2026 年 Baseline 状态仍处于"Newly"（预计 2028 年前后才到"Widely"），当前是与 WebGL 共存的过渡期，而非替代关系。

## 概述

- **心智模型：光栅化引擎**：webglfundamentals.org 原话「WebGL is just a rasterization engine」——三维效果全部是开发者用顶点/片元着色器"算出来"的，WebGL 本身不理解"3D"，只认裁剪空间里的三角形。
- **两个版本**：WebGL1（OpenGL ES 2.0）2015-07 起 Widely；WebGL2（OpenGL ES 3.0）2021-09 起 Widely、caniuse 94.44% 可用，且**完全向后兼容** WebGL1（WebGL1 代码可直接在 `webgl2` 上下文运行）。
- **渲染管线固定顺序**：顶点数据 → 顶点着色器 → 图元装配 → 裁剪 → 光栅化 → 片元着色器 → 逐片元操作 → 帧缓冲；只有顶点/片元着色器阶段可编程，其余阶段固定但可配置行为。
- **着色器三件套**：`attribute`（逐顶点，WebGL2 改名 `in`）/ `uniform`（全局不变）/ `varying`（顶点→片元自动插值，WebGL2 拆成 `out`/`in`），是 CPU 与 GPU 之间唯一的数据桥梁。
- **WebGL2 新增能力原生化**：VAO、实例化绘制、多渲染目标、UBO、变换反馈、采样器对象等在 WebGL1 时代多数只能靠扩展模拟。
- **状态机脾气**：任何操作都作用于"当前绑定"的 buffer/texture/framebuffer/program，忘记切换绑定是最隐蔽的 bug 来源；GPU 资源需显式 `delete*()`，没有自动垃圾回收。
- **与 WebGPU 的关系是过渡共存**：MDN 定性 WebGPU 为 WebGL 的"继任者"，但截至 2026 生态仍是渐进增强姿态（如 Three.js `WebGPURenderer` 自动回退 WebGL2），并非替代当天生效。
- **面试三条主线**：渲染管线心智模型、着色器数据流（attribute/uniform/varying）、WebGL1 与 WebGL2 的能力/语法差异——比背具体函数第几个参数更重要。

## 本叶地图

- [入门](./getting-started) —— 定位（底层光栅化 vs 封装库）、获取上下文、渲染管线概览、第一个三角形（管线最小闭环）
- [渲染管线与着色器](./guide-line/pipeline-and-shaders) —— 渲染管线全景、GLSL 顶点/片元着色器、attribute/uniform/varying、WebGL1/2 语法差异、编译链接四步
- [缓冲区与绘制](./guide-line/buffers-and-draw) —— Buffer 与顶点属性、VAO、drawArrays/drawElements、图元类型
- [纹理与变换](./guide-line/textures-and-transforms) —— 纹理加载与采样、MVP 矩阵、深度测试/面剔除/混合
- [WebGL2 与进阶](./guide-line/webgl2-and-advanced) —— WebGL2 新特性、FBO 离屏渲染、性能与调试、上下文丢失、vs WebGPU
- [参考](./reference) —— API/GLSL/常量速查表 + 选型对比 + 资源链接

## 文档地址

- [MDN WebGL_API](https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL_API) —— 教程与参考的主信源（含 8 篇官方教程系列 + Constants/Types 等参考页）
- [WebGL Fundamentals](https://webglfundamentals.org) —— 原理向权威教程，"WebGL 是光栅化引擎"心智模型出处
- [Khronos WebGL](https://www.khronos.org/webgl/) —— 规范维护方官方页

## 幻灯片地址

- <a href="/SlideStack/webgl-slide/" target="_blank">WebGL</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=webgl" target="_blank" rel="noopener noreferrer">WebGL 测试题</a>
