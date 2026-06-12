---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

## 一、bundle：默认关闭的核心开关

esbuild 的一切围绕「是否打包」展开，而 **bundling 默认是关闭的**：

```bash
esbuild app.ts --outfile=out.js            # 只转换 app.ts 本身，import 原样保留
esbuild app.ts --bundle --outfile=out.js   # 递归内联依赖，输出自包含产物
```

- 不开 `--bundle`：行为接近 Babel/SWC 的单文件转译——剥 TS 类型、转 JSX、按 target 转语法，**依赖不被跟随**。
- 开 `--bundle`：从入口出发解析整个 import 图（ESM 与 CommonJS 都认），把依赖**递归内联**；`require()` 动态拼路径这类「不可静态分析」的导入无法打包，需 `--external` 处理。
- 输出：单入口用 `--outfile`；多入口或 splitting 必须 `--outdir`（可配 `--outbase` 控制目录结构、`entryPoints: [{ in, out }]` 自定义产物名）。

## 二、format × platform：输出形态的两个旋钮

```bash
esbuild app.ts --bundle --format=esm --outfile=out.js
esbuild app.ts --bundle --platform=node --outfile=out.js   # format 默认变 cjs
```

三种 format：

| format | 形态 | 适用 |
|---|---|---|
| `iife` | 立即执行函数，防全局污染，可配 `--global-name` 挂导出 | `<script>` 直接引入 |
| `cjs` | CommonJS，ESM 导出转为 getter | Node |
| `esm` | 保留 import/export | 现代浏览器 / Node ESM；**splitting、顶层 await 仅此格式** |

platform 决定一组**联动默认值**（不只是 format）：`browser`（默认）→ iife、exports 用 browser 条件、自动 define `process.env.NODE_ENV`（全 minify → `"production"`，否则 `"development"`）、转义 `</script>` 序列；`node` → cjs、**Node 内置模块自动 external**、node 条件、mainFields `main,module`；`neutral` → esm、无条件、mainFields 为空（最「裸」的行为）。

## 三、loader 与内容类型

esbuild 按扩展名把文件交给 loader，内置一整套（无需插件）：

```bash
esbuild app.ts --bundle --loader:.png=dataurl --loader:.frag=text --outfile=out.js
```

- **代码类**：`js`/`jsx`/`ts`/`tsx`。注意 **`.js` 默认不解析 JSX**，要 `--loader:.js=jsx`；`.ts` 与 `.tsx` 是两个不同 loader（`.tsx` 里 `<T>() => {}` 泛型箭头有 JSX 歧义）。
- **数据类**：`json`（对象 + 具名导出可摇树）、`text`（UTF-8 字符串）。
- **资源类**：`binary`（Uint8Array）、`base64`（纯字符串）、`dataurl`（含 MIME 内联）、`file`（拷贝到输出目录、导出文件名）、`copy`（拷贝并保留导入指向）、`empty`(当空模块排除)。
- **CSS**：一等公民——CSS 可作为**独立入口**；JS 里 `import './a.css'` 会把 CSS 收集为与 JS 并列的同名 `.css` 产物（**不是**运行时 style 注入）；`.module.css` 默认 **local-css**（CSS Modules，类名本地化，支持 `composes`、`:global()`）；按 target 自动加厂商前缀、降级嵌套等现代语法。

## 四、TypeScript：剥类型，不检查

```bash
esbuild app.ts --outfile=out.js   # 秒出 JS，但类型对错不知道
tsc --noEmit                      # 类型把关并行跑
```

官方原文：「esbuild **does not** do any type checking so you will still need to run `tsc -noEmit`」。逐文件独立编译模型带来的限制：

- 代码需满足 **isolatedModules** 约束（re-export 类型要用 `export type`）；
- **不支持 `emitDecoratorMetadata`**（依赖跨文件类型信息；NestJS/Angular DI 注意）；`experimentalDecorators` 旧装饰器支持（读 tsconfig）；
- **不生成 `.d.ts`**——库作者需 `tsc --emitDeclarationOnly` 补齐；
- 会读取 `tsconfig.json` 的少数编译选项（`jsx`、`useDefineForClassFields`、`experimentalDecorators`、`paths` 等），可用 `--tsconfig=` 指定。

## 五、target：语法转换的下限与 ES5 边界

```bash
esbuild app.ts --target=es2020 --outfile=out.js
esbuild app.ts --target=chrome58,firefox57,safari11,node12.19.0 --outfile=out.js
```

- 默认 **esnext**（基本不转）；可写 ES 版本或具体引擎版本，逗号组合取「全都兼容」的交集。
- esbuild 会把新语法**转换/降级**到 target（如可选链 `?.` 转成条件表达式），但**无法转换时直接报错**——最典型的就是 **ES5：不支持把 ES6+ 语法降到 ES5**，`--target=es5` 只保证「不往 ES5 代码里引入新语法」。
- **不注入 polyfill**：target 只管语法，`Promise`/`Array.prototype.at` 这类运行时 API 缺失要自己引 core-js——这是它与 `@babel/preset-env` 的本质差异。
- 细粒度控制用 `--supported:特性=false`（如声明目标不支持 `bigint`，esbuild 转不掉则报错提示）。

## 六、sourcemap 与 minify

```bash
esbuild app.ts --bundle --minify --sourcemap --outfile=out.js
```

- sourcemap 四模式：`linked`（默认，产 `.map` + 注释）、`inline`（map 内联）、`external`（产 `.map` 无注释，适合错误监控平台私有持有）、`both`；`--sources-content=false` 可去掉 map 内嵌源码。
- minify 三件事：**删空白、缩短标识符、改写更短语法**，可 `--minify-whitespace` / `--minify-identifiers` / `--minify-syntax` 单开；`--keep-names` 保留函数/类 `.name`；输出默认 ASCII（`--charset=utf8` 可改）。
- minify 不删 `console`（有副作用）——删它用 `--drop:console`（见进阶篇）。

## 七、入口与产物组织

```js
await esbuild.build({
  entryPoints: [
    'src/home.ts',
    { in: 'src/admin/main.ts', out: 'admin' },   // 自定义产物名
  ],
  bundle: true,
  outdir: 'dist',
  outbase: 'src',                                 // 控制输出目录层级的基准
  entryNames: '[dir]/[name]-[hash]',              // 产物命名模板（含指纹）
  assetNames: 'assets/[name]-[hash]',             // file loader 产物命名
  banner: { js: '/* my-app v1.0 */' },            // 产物首部注入
})
```

- 多入口时输出路径 = `outdir` + 相对 `outbase` 的目录结构；`{ in, out }` 形式可逐入口指定产物名；
- `entryNames` / `chunkNames` / `assetNames` 支持 `[dir]` `[name]` `[hash]` 占位符，`[hash]` 即内容指纹，配合长缓存；
- `banner` / `footer` 按 js/css 分别注入首尾内容（版权头、shim 等）；
- 产物默认**不会清空输出目录**，也允许用 `--allow-overwrite` 覆盖输入文件——清理 outdir 是你自己的事。

---

下一步：[指南 · 进阶](./advanced)——tree shaking、splitting、define/external、metafile、watch/serve 与 context API。
