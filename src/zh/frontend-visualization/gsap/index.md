---
layout: doc
---

# GSAP

GSAP（GreenSock Animation Platform）是一个**框架无关**的专业级 JavaScript 动画引擎——官方一句话定位：「a framework-agnostic JavaScript animation library that turns developers into animation superheroes」，几乎能为 JS 触达的任何东西（DOM、CSS、SVG、Canvas、WebGL、任意数值对象属性）提供高性能、跨浏览器一致的动画能力。核心心智模型只有两个词：**Tween（补间）** 定义"从哪到哪、多久、什么节奏"，**Timeline（时间线）** 把多个 Tween 编排成有顺序、有重叠、有标签的复杂动画序列。GSAP 本体历史悠久（npm 包创建于 2014-08），**2024-10-15 被 Webflow 收购**，收购公告承诺「will continue to be publicly available for everyone to use on the wider web」；**2025-04-29（v3.13）起 100% 全免费**——ScrollTrigger、SplitText、MorphSVGPlugin、Draggable、Flip 等原本仅 Club GreenSock 付费会员可用的插件全部开放，含商业项目使用，无需注册或购买授权。当前版本 **v3.15**（2026-04-13 发布，npm 实测），新增 `easeReverse`（为反向播放单独指定缓动，正式取代已弃用的 `yoyoEase`）。

## 评价

**优点**

- **性能极高**：自研渲染引擎，用 `x`/`y`/`rotation` 等独立属性直接写值，避免"写入 CSS transform 字符串 → 浏览器解析生成 matrix() → 再读取"的额外开销
- **跨浏览器兼容性历史悠久且稳定**：多年精力填平浏览器差异，是同类动画库中打磨最久的一个
- **API 一致优雅**：`to`/`from`/`fromTo`/`set` 四件套 + 链式 `Timeline`，心智模型简单但表达力强
- **插件生态成熟**：ScrollTrigger 是滚动驱动叙事（scrollytelling）的事实标准，MotionPath/MorphSVG 等 SVG 专项能力同类中最专精
- **2025-04 起全免费无商业限制**：此前需付费/注册会员的插件现在开箱即用
- **文档质量高**：官方提供 Ease Visualizer、MotionPathHelper 等交互式可视化调参工具

**缺点**

- **不是声明式框架绑定库**：需要手动管理副作用与清理，React 等框架里要靠 `useGSAP`/`gsap.context` 兜底
- **没有开箱即用的布局动画**：相比 Framer Motion（已更名 Motion）的 `layout` prop 与原生手势系统，GSAP 更偏"命令式脚本"风格
- **插件按需引入有学习成本**：核心库虽可 tree-shaking，但功能面广，插件注册机制（`registerPlugin`）需要额外认知
- **不直接输出 React 组件化 API**：与框架状态/生命周期的融合程度不如原生声明式库高

**适用场景**

- 需要精细时间线编排的复杂交互动画
- 滚动驱动叙事（scrollytelling）、SVG/MotionPath 路径动画
- 需要极致性能的高频动画（鼠标跟随、拖拽物理）
- 任何不想被绑定在单一框架内的动画需求

## 本叶地图

- [入门](./getting-started) —— 定位（专业动画库 vs CSS/WAAPI/Framer Motion）、安装与全插件免费现状、`gsap.to` 第一个动画、`registerPlugin` 插件注册
- [Tween 与 Ease](./guide-line/tween-and-ease) —— `to`/`from`/`fromTo`/`set` 四大方法、vars 配置对象全解、transform 属性简写、内置缓动族与自定义 ease
- [Timeline 与 stagger](./guide-line/timeline-and-stagger) —— 位置参数编排、Timeline 控制方法与回调、stagger 交错动画三种写法
- [ScrollTrigger 与插件生态](./guide-line/scrolltrigger-and-plugins) —— ScrollTrigger 全配置、pin/snap/batch、SplitText/Draggable/Flip/MotionPath/MorphSVG/Observer/ScrollSmoother/InertiaPlugin
- [框架集成与性能](./guide-line/framework-and-performance) —— `useGSAP()`、`gsap.context()`、`gsap.matchMedia()`、`quickTo`/`quickSetter` 性能优化、易错点
- [参考](./reference) —— Tween/Timeline/ScrollTrigger/Ease/插件/工具方法速查表 + 选型对比 + 易错点清单 + 资源链接

## 文档地址

[GSAP 官网](https://gsap.com) ｜ [文档](https://gsap.com/docs/v3/)

## GitHub 地址

[greensock/GSAP](https://github.com/greensock/GSAP)

## 幻灯片地址

<a href="/SlideStack/gsap-slide/" target="_blank">GSAP</a>
