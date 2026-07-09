---
layout: doc
---

# unbuild

UnJS 出品的**统一 JavaScript 构建系统**（**A unified JavaScript build system**），面向 **npm 库/包构建**这一场景：基于 **Rollup**（转译用 esbuild、声明打包用 rollup-plugin-dts）产出 **ESM/CJS 双格式 + 类型声明**。三大招牌：**Automated config**——entries 与输出格式直接从 package.json 的 `exports`/`main`/`types`/`bin` 反向推断到 `src/`，常可零配置；**mkdist bundleless 模式**——目录型入口逐文件转译、保留源码结构（支持 Vue SFC / postcss / 逐文件 d.ts），适合组件库；以及独一份的 **stub mode（passive watcher）**——`unbuild --stub` 一次后，dist 里是基于 **jiti** 的即时加载器而非真实产物，开发期改 `src` **免重建、免 watch 进程**即时生效。再加上 Secure builds（构建后校验 unused/implicit 依赖与 package.json 产物指向，`failOnWarn` 默认 true、警告即退出码 1），它是 Nuxt/Nitro 体系与 ofetch、defu、h3 等 UnJS 包的标准构建器（`@nuxt/module-builder` 1.x 直接把它列为运行时依赖）。**2026-06 现状**：latest **3.6.1**（rollup ^4.50 / jiti ^2.5 / mkdist ^2.3），周下载约 21 万；官方同时声明正实验基于 **Rolldown** 的下一代 **obuild**（仍 0.4.x beta），unbuild 仍是现役标准。

## 评价

**优点**

- **stub mode 独一份**：`--stub` 桩化一次，monorepo 里被 link 的包改源码即时生效，省掉一排 watch 进程——tsup/tsdown 都没有的工作流
- **零配置程度最高**：entries、ESM/CJS、声明生成全部可从 package.json 推断，包描述即构建配置，杜绝两边不一致
- **rollup 与 mkdist 双模式**：bundle 与 bundleless（保留目录结构、逐文件 d.ts、Vue SFC/postcss）一个 entries 数组里混用，组件库友好
- **declaration 策略细**：`compatible`（d.ts + d.mts + d.cts 三份）/`node16`（仅 d.mts + d.cts）/自动探测，把双格式类型解析的坑提前填平
- **Secure builds**：自动揪出「声明了没用的依赖」「用了没声明的依赖」「package.json 指向不存在的产物」，`failOnWarn` 默认让 CI 直接红
- **hooks/preset 体系**：hookable 驱动，`build:prepare/before/done`、`rollup:options` 等挂点齐全，连内置的 entries 推断都是一个 preset

**缺点**

- **构建速度非 Rust 档**：Rollup + esbuild 的组合快于纯 tsc，但比 Rolldown 底座的 tsdown 慢，UnJS 自己也在用 obuild 实验 Rolldown 化
- **watch 模式弱**：`--watch` 官方标注 experimental and incomplete，mkdist builder 至今不支持 watch——官方思路是用 stub 替代 watch
- **stub 产物不可发布**：桩文件依赖 jiti 运行时转译，性能与可移植性都不适合生产，发布前必须真实构建（`prepack: unbuild`）
- **文档单薄**：主要文档就是 README + 源码 types.ts 注释，hooks/选项细节常要翻源码
- **隐式内联有惊吓**：import 了未声明在 dependencies 的包会被默默打进产物（伴随警告），新手常被 `failOnWarn` 的退出码 1 困惑
- **不做应用打包**：没有 dev server/HMR/代码分割调优这些应用侧能力，定位就是库构建，选错场景会处处别扭

## 文档地址

[unbuild（GitHub README）](https://github.com/unjs/unbuild)

## GitHub 地址

[unjs/unbuild](https://github.com/unjs/unbuild)

## 幻灯片地址

<a href="/SlideStack/unbuild-slide/" target="_blank">unbuild</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=unbuild" target="_blank" rel="noopener noreferrer">unbuild 测试题</a>
