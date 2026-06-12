---
layout: doc
outline: [2, 3]
---

# 参考

> 版本基线 **Node.js 22 LTS / 24 LTS**（2026-06）。require 家族、module 对象、解析算法与 require(esm) 速查。

## require 家族速查

| API                            | 作用                                                         |
| ------------------------------ | ------------------------------------------------------------ |
| `require(id)`                  | 解析 + 加载 + 执行模块，返回其 `module.exports`（同步）      |
| `require.resolve(id)`          | **只解析不加载**，返回绝对路径；找不到同样抛 MODULE_NOT_FOUND |
| `require.resolve.paths(id)`    | 返回查找目录数组；**核心模块返回 `null`**                    |
| `require.cache`                | 缓存对象，键为解析后的文件名；可删条目强制重载               |
| `require.main`                 | 进程入口脚本的 module 对象；`require.main === module` 判直接运行 |

## module 对象速查

| 属性                | 含义                                             |
| ------------------- | ------------------------------------------------ |
| `module.exports`    | 真正的导出对象，require 方拿到的就是它           |
| `exports`           | `module.exports` 的**别名参数**，重新赋值即失联  |
| `module.paths`      | 本模块的 node_modules 查找路径数组（逐级向上）   |
| `module.filename`   | 解析后的文件绝对路径（同 `__filename`）          |
| `module.loaded`     | 模块是否已执行完毕（循环依赖时为 false）         |
| `module.children`   | 本模块首次 require 的子模块列表                  |

## 解析算法速查

```text
require(X)（在路径 Y 的模块中）
1. X 是核心模块（fs/path/...）→ 直接返回
2. X 以 '/' 开头        → 按绝对路径走文件/目录加载
3. X 以 './' '../' 开头 → 相对当前模块文件所在目录：
   LOAD_AS_FILE → LOAD_AS_DIRECTORY
4. 裸名 → 逐级向上查 node_modules（LOAD_NODE_MODULES）
5. 都没有 → 抛 MODULE_NOT_FOUND

LOAD_AS_FILE(X)：X → X.js → X.json → X.node（.cjs 不补全）
LOAD_AS_DIRECTORY(X)：package.json 的 main → 失效则 index.js → index.json → index.node
LOAD_NODE_MODULES：从 dirname(Y) 逐级向上，每层拼 node_modules 尝试
  （最后兜底遗留 GLOBAL_FOLDERS：$HOME/.node_modules 等，不建议依赖）
```

## 模块判定速查

| 文件                            | 判定                                  |
| ------------------------------- | ------------------------------------- |
| `*.cjs`                         | 恒 CommonJS（优先级最高）             |
| `*.mjs`                         | 恒 ESM                                |
| `*.js` + type `"commonjs"`/缺省 | CommonJS（**默认地位**）              |
| `*.js` + type `"module"`        | ESM                                   |
| `*.js` 无 type + 纯 ESM 语法    | 语法检测按 ESM（v22.7.0/v20.19.0 默认）|

## require(esm) 速查

| 项           | 内容                                                              |
| ------------ | ----------------------------------------------------------------- |
| 前提         | 目标 ESM 依赖图**无顶层 await**（整图检查）                       |
| 返回值       | 模块命名空间对象；default 在 `.default`，并自动附 `__esModule: true` |
| 定制返回     | ESM 侧 `export { X as 'module.exports' }` → require 直接返回 X    |
| TLA 违例     | 抛 `ERR_REQUIRE_ASYNC_MODULE` → 改用动态 `import()`               |
| 旧错误       | `ERR_REQUIRE_ESM` 已弃用（转正后基本退场）                        |
| 特性检测     | `process.features.require_module`                                 |
| 管控旗标     | `--no-require-module` 禁用；`--trace-require-module` 打印使用位置；`--experimental-print-required-tla` 定位 TLA |

## 错误速查

| 错误                                          | 含义与处置                                              |
| --------------------------------------------- | ------------------------------------------------------- |
| `MODULE_NOT_FOUND`                            | 解析失败（require 与 require.resolve 都会抛）           |
| `ERR_REQUIRE_ASYNC_MODULE`                    | require 了**依赖图含顶层 await** 的 ESM → 改动态 `import()` |
| `ERR_REQUIRE_ESM`                             | **已弃用**的历史错误（require(esm) 转正前的拦截）       |
| `SyntaxError: Cannot use import statement...` | ESM 语法落进了被判定为 CJS 的文件（显式 type commonjs / 老版本无语法检测） |

## 版本现状（2026-06）

| 版本         | require(esm) 状态                                  |
| ------------ | --------------------------------------------------- |
| v22.0.0      | 引入，需 `--experimental-require-module` 旗标       |
| **v22.12.0** | **LTS 默认开启**（标志性解锁版本）；v20.19.0 获回携 |
| v23.5.0      | 默认不再打实验警告                                   |
| **v25.4.0**  | **标记 Stable**                                      |

> 语法检测（模糊 `.js` 自动识别 ESM）自 v22.7.0 / v20.19.0 起默认启用。条件导出（exports 的 `require`/`import` 条件）属于发布侧话题，见 [ES Module](../es-module/) 篇。
