---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> Nuxt/Nitro 生态里的角色、与 tsup/tsdown 的选型判断、monorepo 实践、常见坑清单与 obuild 动向。版本基线 **unbuild 3.6.1**（2026-06）。

## 一、在 Nuxt/Nitro/UnJS 生态的角色

- **UnJS 包的标准构建器**：ofetch、defu、h3 等包的 `build` 脚本就是一条 `unbuild`，Nitro 与 Nuxt 内核的大量包同样如此；
- **@nuxt/module-builder**：Nuxt 模块的官方构建器，1.x 把 unbuild 列为**运行时依赖**（封装其编程 API `build()`）；
- **为什么是 stub 而不是 watch**：Nuxt 级别的 monorepo 有几十个包互相引用，每包开 watch 就是几十个常驻进程；stub 把成本降为「每包桩化一次」——stub mode 正是在这个生态的痛点里长出来的；
- 规模感：周下载约 21 万（2026-06），不及 tsup 量级，但在 UnJS/Nuxt 系内是事实标准。

Nuxt 模块模板的开发闭环（stub 思路的典型落地）：

```jsonc
// Nuxt 模块模板的 scripts（节选）
{
  "scripts": {
    "dev": "nuxi dev playground",
    "dev:prepare": "nuxt-module-build build --stub && nuxi prepare playground"
  }
}
```

`dev:prepare` 本质就是对模块做一次 stub——之后改模块源码，playground 随改随跑，全程没有 watch 进程。

## 二、与 tsup / tsdown 选型

| 维度       | unbuild                          | tsup            | tsdown                                |
| ---------- | -------------------------------- | --------------- | -------------------------------------- |
| 引擎       | Rollup（JS）+ mkdist             | esbuild（Go）   | Rolldown（Rust）                       |
| 配置哲学   | **读 package.json 推断构建**     | 显式配置        | 构建后**写 package.json**（exports: true） |
| 开发直连   | **stub mode**                    | watch           | watch / devExports                     |
| bundleless | **mkdist（Vue SFC / postcss）**  | `bundle: false` | `unbundle: true`                       |
| 发布校验   | Secure builds（依赖校验内置）    | 无              | publint + attw 内置集成                |

判断准则：

- **UnJS/Nuxt 生态、重 stub 工作流、Vue 组件库 bundleless** → unbuild；
- **追求构建速度、要 publint/attw/workspace 内置、押注 Rolldown 主线** → tsdown；
- 存量 tsup 项目可原地不动，新项目不建议再入场（esbuild 系维护趋缓，生态共识的接班人是 tsdown）。

两种「配置哲学」值得细品：tsdown 用 `exports: true` 从构建结果生成 package.json；unbuild 反过来，把 package.json 当唯一事实源反推构建。前者「构建定义包」，后者「包定义构建」——unbuild 的方向天然杜绝「写了 exports 忘了配构建」的漂移。

另一面要听 tsdown 的反方陈词：它**有意不支持** stub，理由是导出列表变化后 stub 会陈旧失真、stub 转发绕过插件管线。重插件转换的库（构建期宏、代码注入）确实更适合 watch/unbundle 路线；纯 TS 源码的库则几乎吃不到这两个缺点。

## 三、monorepo 实践

```jsonc
// 每个包的 package.json
{
  "scripts": {
    "dev": "unbuild --stub",
    "build": "unbuild",
    "prepack": "unbuild"
  }
}
```

- **初始化**：`pnpm install` 后跑一次 `pnpm -r run dev`（逐包 stub），此后任何包改 src 全仓即时生效，无需任何 watch 进程；
- **导出列表变化**（新增/删除 export）记得对该包重跑 `--stub`——具名导出是 stub 时静态分析烤进去的；
- **CI**：保持 `failOnWarn: true`（默认），让 unused/implicit 依赖问题红在 CI；类型把关另跑 `tsc --noEmit`。

真实构建仍交 turbo/nx 编排（stub 是开发期一次性动作，不进流水线）：

```jsonc
// turbo.json（节选）
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] }
  }
}
```

## 四、常见坑

1. **CJS 默认导出互操作**：entry 同时有具名 + default 导出时，Rollup CJS 产物走 named 模式，`require()` 方要 `.default` 才拿得到默认导出；纯 default 导出则 `module.exports` 即本体（`output.exports: 'auto'` 的行为）。库的稳妥姿势：**纯具名导出**；
2. **.d.mts/.d.cts 没配进 exports**：compatible 产了三份声明，但 exports 里 `import`/`require` 条件没分别指向 `.d.mts`/`.d.cts`，Node16 解析下类型照样翻车——按进阶篇的完整形态写，再用 attw 校验一道；
3. **`declaration: 'node16'` 丢老用户**：没有裸 `.d.ts`，老式 `moduleResolution` 只读 `types` 字段的消费方会找不到类型——拿不准就 compatible；
4. **CI 退出码 1 但日志 Build succeeded**：不是构建挂了，是 Secure builds 的依赖校验警告 + `failOnWarn` 默认 true。修 package.json（补声明/删未用依赖），别急着 `failOnWarn: false` 关闸；
5. **stub 产物被发布**：dist 里是带本机绝对路径的 jiti 加载器，用户装上直接崩——`prepack: unbuild` 必配；
6. **指望 `--watch`**：experimental and incomplete，mkdist 入口干脆不支持；开发期用 stub，真离不开 watch 的工作流考虑 tsdown；
7. **想把 dependencies 打进产物**：`rollup.inlineDependencies` 管不了它们——externals 判定在前，deps/peerDeps 命中即 external。真要内联，先把它从 dependencies 挪出（如挪进 devDependencies）再用 inlineDependencies 表态。

## 五、何时不该用 unbuild

- **应用打包**：没有 dev server/HMR/代码分割调优，前端应用请回 Vite/webpack；
- **要 UMD/IIFE**：unbuild 只面向 ESM/CJS 的 npm 库，浏览器 `<script>` 直引场景换 Rollup 本体或 tsdown（iife/umd）；
- **构建速度是硬指标**：Rollup + esbuild 快于纯 tsc，但不及 Rolldown 底座的 tsdown——大仓高频全量构建时差距可感；
- **重 esbuild/Rolldown 插件生态**：unbuild 的插件面是 Rollup 插件（经 `rollup:options` 注入），别的生态插件不通用。

## 六、未来：obuild

unbuild README 官方注记：正实验基于 **Rolldown** 的 **obuild** 作为下一代后继者。截至 2026-06：obuild 仍是 0.4.x beta，unbuild 3.6.x 仍是现役标准。理性姿势：现在选 unbuild 不必担心「已废弃」；速度敏感、想押 Rust 主线的新项目，可以同时观察 tsdown 与 obuild 的成熟度再做迁移决策。

---

至此 unbuild 四篇完结。回到[入门](../getting-started)温习速查，或到[参考](../reference)查选项与 hooks 表。
