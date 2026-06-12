---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 发布侧主场：exports 字段设计、dual package hazard、require(esm) 版本线与 ESM-only 决策、publint/attw 质检。版本基线 **2026-06**。

## 一、exports 字段：包的封装边界

`main` 只定义入口、全部文件裸奔可达；`exports`（Node v12.7+）一旦定义即**黑盒封装**——未列出的子路径一律 `ERR_PACKAGE_PATH_NOT_EXPORTED`，且**优先于 main**（main 只喂不认识 exports 的老工具）：

```jsonc
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",   // ① 必须最前
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"    // ② 必须殿后
    },
    "./package.json": "./package.json", // 习惯性放行（不少工具要读）
    "./features/*.js": "./src/features/*.js", // * 字符串替换，可跨层级
    "./internal/*": null                // null 显式封禁
  }
}
```

规则三条：**条件按对象键顺序匹配**（`types` 最前否则 TS 拿不到类型、`default` 殿后否则吞掉一切）；**target 必须 `./` 开头、禁 `..` 逃逸**；通配开放时用 `null` 挖掉私有目录。dual 发布时类型也要成对：`import`/`require` 分别配 `.d.mts`/`.d.cts`，共用一份 `.d.ts` 是 attw 高频报错。

## 二、dual package hazard：双格式的固有税

同包同时发 CJS + ESM 产物，应用依赖树里一半 `require`、一半 `import` —— **同一个包在内存里两份实例**：单例失效、`instanceof` 跨界失败、配置「设置了又丢」。Node 官方两条缓解：

1. **isolate state**：两份产物不共享可变状态（无状态库天然免疫）；
2. **薄包装**：一种格式只做另一种的 wrapper，状态单源。

但 2026 年更釜底抽薪的解法是：**别发两份了**。

## 三、require(esm)：改变发布格局的版本线

| 节点 | 版本 |
| --- | --- |
| 引入（`--experimental-require-module`） | v22.0 / v20.17 |
| **默认启用** | v23.0 / **v22.12 / v20.19** |
| 去实验警告 | v23.5 / v22.13 |
| **正式稳定** | **v25.4** |

约束与协议：模块图须**全同步**（含 Top-level await 抛 `ERR_REQUIRE_ASYNC_MODULE`）；返回**命名空间对象**（有 default 时带 `__esModule: true` 兼容标记）；想让 require 方拿到导出本体用字符串导出名：

```js
export default class Point {}
export { Point as "module.exports" }; // require("pkg") 直接得到 Point
```

关键推论：Node 18 已 EOL（2025-04），**所有在维 LTS 都默认支持 require(esm)** —— ESM-only 包对 CJS 用户开箱可用，dual 发布「为了 CJS 用户」的核心理由消失。

## 四、2026 ESM-only 决策框架

生态数据与机制同向：**npm top1000 约 42% 已 ESM-only、新发布包约 80% ESM-first**；Vite 等基础设施带头 ESM-only；Sindre Sorhus 系、e18e 社区持续推动。

| 你的情况 | 建议 |
| --- | --- |
| 新库、面向现代 Node（≥20.19）/打包器 | **ESM-only**（`"type": "module"`，只发 `import` + `types` 条件） |
| 必须支持 Node <20.19 / 老企业运行时 | dual（接受 hazard 税，配 attw 把关） |
| 库入口含 Top-level await | 要么去 TLA（移入懒加载函数），要么明示 CJS 用户走 `import()` |
| 浏览器直用场景 | ESM-only + CDN + import maps，天然契合 |

ESM-only 附带收益：产物×1、无 hazard、tree-shaking 最优（静态结构 + `"sideEffects": false`）、`exports` 简化为单条件。

## 五、publint + attw：发布质检进 CI

两道互补闸门：

- **[publint](https://publint.dev/)**：包结构层——exports/main/types 指的文件存在吗、声明格式与实际格式一致吗（`type: module` 包里 require 条件指了 ESM 文件这类错）、字段写法合规吗；
- **[attw](https://arethetypeswrong.github.io/)**（Are The Types Wrong）：类型解析层——模拟 TS 各解析模式（`node16` require/import、`bundler`…）逐一验证类型可达性，专抓「CJS 类型冒充 ESM」（masquerading）、types 条件错位等 dual 顽疾。

```jsonc
// CI 步骤（或用 tsdown 内置集成：publint/attw 均支持 "ci-only"）
{ "scripts": { "prepublishOnly": "publint && attw --pack ." } }
```

> 实操建议：能用现代库打包器（如 tsdown）就让 `exports: true` 自动回写导出映射——手写 exports 与产物不一致是发布事故第一来源。

---

至此 ES Module 三篇指南完结。互操作的另一半视角（require 解析算法、缓存、`require(esm)` 的 CJS 侧体验）见 [CommonJS 篇](../../commonjs/)；回到[参考](../reference)查语法与版本速查表。
