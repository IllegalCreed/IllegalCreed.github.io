---
layout: doc
---

# tsup

**零配置的 TypeScript 库打包器**（官方定位：「**Bundle your TypeScript library with no config, powered by esbuild**」），面向 npm 库作者：一条命令把 `.ts` 源码产出 esm/cjs/iife 产物与 `.d.ts` 声明文件。主打包引擎是 Go 实现的 **esbuild**，但 tsup 本质是「**调度多引擎的指挥家**」——声明文件由**真 TypeScript 编译器 + rollup-plugin-dts** 生成打包，`--treeshake` 借 **Rollup** 做更彻底的摇树，遇到 `emitDecoratorMetadata` 装饰器再按需切 **SWC**。它不是应用打包器：没有 dev server、HMR 与 HTML 处理，也**不做类型检查**。**2026-06 现状**：npm `latest` 停在 **8.5.1**（2025-11 发布），README 官宣「**This project is not actively maintained anymore. Please consider using tsdown instead.**」——官方点名 [tsdown](../tsdown/index)（Rolldown 系）接班；但周下载仍约 **600 万+**，依旧是 esbuild 系库打包的事实标准。存量项目继续用没有问题，新库建议直接从 tsdown 起步。

## 评价

**优点**

- **真·零配置起步**：`tsup src/index.ts` 即得产物；`--format esm,cjs --dts` 一条命令产出「双格式 + 各自声明」的库发布三件套
- **快**：esbuild（Go）驱动转译与打包，JS 链路秒级；`--watch` + `onSuccess` 串起「重建即重启」的开发工作流
- **库语义默认值**：`dependencies`/`peerDependencies` 始终外部化，运行时依赖交使用方安装，天然符合发包预期
- **双格式互操作配套全**：扩展名按 package.json `type` 自动切换（`.js`/`.mjs`/`.cjs`）、`cjsInterop` 修 default 导出体验、`shims` 互垫 `__dirname`/`import.meta.url`
- **逃生门多**：`outExtension`/`--legacy-output` 自定义扩展名，`esbuildPlugins`/`esbuildOptions` 直通底层，`--treeshake` 借 Rollup 兜底摇树
- **存量生态巨大**：周下载约 600 万，社区问答与项目示例最丰富，遇坑基本都有现成答案

**缺点**

- **维护放缓（选型关键）**：README 官宣不再积极维护并推荐 tsdown，`latest` 停在 8.5.1；新项目押注需慎重
- **dts 链路慢**：声明走「真 TS 编译器 + rollup-plugin-dts」管线，大项目慢且吃内存，与 esbuild 的 JS 链路差一个量级
- **不生成 declaration map**：`.d.ts.map` 需另跑 tsc 补（issue #564）；`--dts` 构建也不支持 source map
- **格式天花板**：不支持 UMD（esbuild 限制）；CJS 代码分割只有实验性 `--splitting`
- **默认值偏旧**：format 默认 `cjs`、`clean` 默认关、无入口推断——2026 视角下与 ESM-first 潮流相反（tsdown 已全部翻转）
- **devDependencies 无豁免**：被 import 的 dev 依赖会被打进产物，外部化名单只认 deps/peerDeps，需要自己留意

## 文档地址

[tsup](https://tsup.egoist.dev/)

## GitHub 地址

[egoist/tsup](https://github.com/egoist/tsup)

## 幻灯片地址

<a href="/SlideStack/tsup-slide/" target="_blank">tsup</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=tsup" target="_blank" rel="noopener noreferrer">tsup 测试题</a>
