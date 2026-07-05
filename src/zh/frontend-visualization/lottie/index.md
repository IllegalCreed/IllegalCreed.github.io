---
layout: doc
---

# Lottie

Lottie 是把 **Adobe After Effects 动画通过 Bodymovin 插件导出为 JSON**，再由跨平台运行时（`lottie-web`、`lottie-android`、`lottie-ios`、`lottie-react-native` 等）**原生解析渲染**的动画方案——本质是"设计师在 AE 里做动画，导出即交付，工程师不用再拿 CSS/代码手工复刻一遍"。核心运行时 **`lottie-web`**（Airbnb 官方出品，MIT 协议）npm 实测最新版 **5.13.0**，GitHub 最近一次 push 在 2025-09、849 个 open issues，属于"装机量最大但发版低频"的成熟期经典库（上一版 5.12.2 到 5.13.0 间隔近两年）。与此同时，LottieFiles 官方研发重心已转向下一代 **dotLottie** 生态：核心播放器 `@lottiefiles/dotlottie-web` 最新 **0.76.0**，GitHub 2 天前刚 push，是眼下高频活跃开发的主推路线，内核为 Rust + WASM（`dotlottie-rs`）搭配统一的 **ThorVG** 矢量渲染引擎。2026 年新项目官方推荐路径是 dotLottie，但存量教程/项目仍大量基于 `lottie-web`，两套 API 都需要掌握。

## 评价

**优点**

- **矢量 + 跨平台像素级一致**：AE 直接导出 JSON，Web/iOS/Android/React Native 视觉表现完全一致，工程师无需用代码重新实现一遍动效
- **体积与画质优于位图方案**：矢量描述通常远小于同等复杂度的视频/GIF，原生支持真彩色 + 半透明 alpha 通道（GIF 只有 256 色调色板 + 1-bit 透明）
- **运行时可编程控制**：速度、方向、跳转/分段播放、动态换色、事件回调，这是"黑盒播放"的视频/GIF 完全不具备的能力
- **生态成熟**：LottieFiles 平台的 Creator（在线编辑）、海量现成动画市场、Figma/Webflow/Framer 等 Integrations 插件，把"设计到工程"链路铺得很顺
- **dotLottie 四项升级**：体积（压缩 + 多动画共享资源）、多动画打包、主题切换（深色模式/品牌换色免重新导出）、原生状态机交互，且新旧运行时对 `.json`/`.lottie` 两种格式都兼容

**局限**

- **JSON 非声明式描述**：内容是"图层树 + 关键帧"，AE 的部分高级特性（expressions 表达式、3D 图层、部分蒙版/混合模式）并非全平台/全渲染器等价支持，设计师导出前需了解目标运行时能力边界
- **生态迁移期认知负担重**：`lottie-web` 与 dotLottie 两套 API 长期并存，Web Component 播放器还经历了三代命名演进（`<lottie-player>` → `<dotlottie-player>` → `<dotlottie-wc>`，前两者均已废弃）
- **简单场景不划算**：hover 变色、渐显等几行 CSS 就能搞定的过渡，上 Lottie 反而是不必要的 JSON 解析开销
- **性能宣传数字需谨慎对待**：ThorVG 相对经典渲染器"2-3x 更快""70% 内存降低"等具体倍数均来自 LottieFiles 官方/合作方案例，不是独立第三方基准，选型时仅供方向参考

## 本叶地图

- [入门](./getting-started) —— 定位（AE 导出 JSON 矢量动画 vs GIF/视频/CSS）、AE + Bodymovin 工作流、lottie-web `loadAnimation` 第一个动画、容器尺寸坑
- [loadAnimation 与渲染器](./guide-line/loadanimation-and-renderer) —— `loadAnimation` 全参数、svg/canvas/html 渲染器能力矩阵与选型、`rendererSettings`、体积优化
- [播放控制与事件](./guide-line/playback-and-events) —— `play`/`goToAndStop`/`playSegments`/`setSpeed` 等播放方法、完整事件列表
- [dotLottie 与播放器](./guide-line/dotlottie-and-players) —— `.lottie` 压缩容器格式、`dotlottie-web` 播放器 API、Web Component 三代演进、状态机 State Machine
- [框架集成与性能优化](./guide-line/framework-and-optimization) —— `lottie-react`、`lottie-interactivity`、Vue 集成、性能优化全景与故障排查
- [参考](./reference) —— API/事件/dotLottie 速查表 + 选型对比 + 资源链接

## 文档地址

[Airbnb Lottie](https://airbnb.io/lottie/) ｜ [LottieFiles 开发者文档](https://developers.lottiefiles.com)

## GitHub 地址

[airbnb/lottie-web](https://github.com/airbnb/lottie-web)

## 幻灯片地址

<a href="/SlideStack/lottie-slide/" target="_blank">Lottie</a>
