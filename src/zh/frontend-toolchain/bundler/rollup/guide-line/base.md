---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **rollup 4.61.x**。本篇把「能打包」用到「会配置」：input/output 细节、external 与 globals、tree-shaking 的基本行为、watch 工作流与 sourcemap。

## 一、input：入口的三种形式

```js
export default {
  input: "src/index.js",                      // ① 字符串：单入口
  // input: ["src/main.js", "src/worker.js"], // ② 数组：多入口，以文件名作 chunk 名
  // input: {                                 // ③ 对象：多入口 + 自定义命名
  //   main: "src/index.js",
  //   "admin/app": "src/admin.js",           //    key 含 / 可输出到子目录
  // },
};
```

对象形式的 **key 会替换 `entryFileNames` 模板里的 `[name]`**，是控制产物命名/目录结构的正路。注意 Rollup 核心**不解析 glob**，批量入口要自己用 `fast-glob` 之类生成对象。

## 二、output.file vs output.dir

| 配置 | 适用 | 说明 |
|---|---|---|
| `output.file` | **单 chunk** | 输出单个文件（CLI `-o`） |
| `output.dir` | **多 chunk** | 动态 `import()`、多入口、`preserveModules` 时必须用（CLI `-d`） |

一旦构建产生多个 chunk 还配着 `file`，Rollup 直接报错——这是新手最常撞的墙之一。

## 三、external + globals：库打包的边界控制

库不应把 peerDependencies 打进产物。`external` 声明「哪些模块不打包、保留导入语句、运行时由使用方提供」：

```js
export default {
  input: "src/index.js",
  external: ["vue", /^@vueuse\//, (id) => id.startsWith("lodash-es")],
  output: [
    { dir: "dist", format: "esm" },
    {
      file: "dist/my-lib.umd.js",
      format: "umd",
      name: "MyLib",            // umd/iife 有导出时必填：挂到全局的变量名
      globals: { vue: "Vue" },  // umd/iife 下 external 的全局变量映射
    },
  ],
};
```

两个 umd/iife 专属要点：

- **`output.name`**：产物在全局作用域暴露的变量名（支持 `'a.b.c'` 命名空间）；
- **`output.globals`**：无模块加载器的环境拿不到 import，external 依赖只能**从全局变量取**，`{ vue: 'Vue' }` 就是这张映射表。es/cjs 格式保留 import/require，**不需要** globals。

## 四、tree-shaking 的基本行为

Rollup 的 tree-shaking 默认开启（`treeshake: true`），几条基础认知：

```js
// 只 import 用到的绑定，未用的导出不会进产物
import { pick } from "./utils.js"; // utils 里其他函数被摇掉

// 纯副作用导入会被保留（默认假定模块有副作用）
import "./polyfill.js";

// 教程级例子：import JSON 也只打包用到的字段
import { version } from "./package.json" /* 配 @rollup/plugin-json */;
```

- 它发生在**构建期、基于静态分析**——所以 `require(dynamicName)` 这类动态结构无从分析；
- **副作用是边界**：Rollup 不敢删「可能有副作用」的代码，这也是进阶篇 `moduleSideEffects`、`/*@__PURE__*/`、`sideEffects` 字段要解决的问题；
- ES 模块语法页明确「**同一模块混用 default 与具名导出是坏实践**」——对库来说具名导出对 tree-shaking 与重构都更友好。

## 五、watch 工作流

```bash
rollup -c -w        # 监听重建
```

```js
export default {
  // ...
  watch: {
    include: "src/**",
    exclude: "node_modules/**",
    buildDelay: 100,      // 节流重建（ms）
    clearScreen: false,   // 保留控制台历史
  },
};
```

watch 模式下环境变量 **`ROLLUP_WATCH === 'true'`**，配置文件可据此区分开发/生产：

```js
const isWatch = process.env.ROLLUP_WATCH === "true";
export default {
  plugins: [!isWatch && terser()], // plugins 数组里 falsy 值被忽略 → 条件插件惯用法
};
```

CLI 还支持在事件点挂 shell 命令：`--watch.onEnd "npm run reload"` 等。

## 六、sourcemap 三种姿势

| 取值 | 行为 | 场景 |
|---|---|---|
| `true` | 独立 `.map` + 产物尾部注释指向 | 常规调试/发布 |
| `'inline'` | data URI 内联进产物 | 仅开发（产物显著变大） |
| `'hidden'` | 生成 `.map` 但**不写注释** | 错误监控平台还原堆栈、不向用户暴露 |

> ⚠️ 若构建链上有插件转换了代码却看到「Sourcemap is likely to be incorrect」警告，说明某插件 transform 没返回 map，按警告提示给该插件开 sourcemap 选项。

---

打包边界与基础行为掌握后，进入[指南 · 进阶](./advanced)：tree-shaking 的副作用模型、代码分割三板斧与库的输出策略。
