---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> Wasm 插件机制与版本耦合、自写插件 `VisitMut`、`parse` → `print` 同实例、与 Oxc 的竞争、spack/bundle 的局限。截至 2026-06：`@swc/core` 稳定在 1.15.x。

## 一、Wasm 插件机制与版本耦合

SWC 的扩展点是 **Wasm 插件**：用 Rust 写好转换逻辑，编译成 `.wasm`，在 `.swcrc` 里以 `[name, configJSON]` 元组挂载：

```jsonc
{
  "jsc": {
    "experimental": {
      "plugins": [
        ["@swc/plugin-styled-components", { "displayName": true }]
      ]
    }
  }
}
```

**最大的坑是版本耦合**。官方明示：**「Currently, the Wasm plugins are not backwards compatible.」** 插件依赖的 `swc_core`（Rust crate）必须**严格匹配宿主 `@swc/core` 的 ABI**——宿主升一个小版本，旧插件就可能加载失败。

- 选版本不要靠手记，用官方 webapp **[plugins.swc.rs](https://plugins.swc.rs)**：输入框架/宿主版本，它给出兼容的插件版本组合。
- 升级 `@swc/core`（或 Next.js 等内置 SWC 的框架）前，**先确认所有 Wasm 插件有匹配版本**，否则构建会断。

> 这是 SWC 相对 Babel 插件生态最痛的地方：Babel 插件是 JS、跨版本宽容；SWC Wasm 插件是 ABI 级耦合，无向后兼容承诺。

## 二、自写插件：VisitMut 访问器

SWC 插件的核心是实现 **`VisitMut`**（可变访问器）trait，遍历并改写 AST 节点：

```rust
use swc_core::ecma::ast::Program;
use swc_core::ecma::visit::{VisitMut, VisitMutWith};
use swc_core::plugin::{plugin_transform, proxies::TransformPluginProgramMetadata};

pub struct MyVisitor;

impl VisitMut for MyVisitor {
    // 例如改写每个标识符 / 调用表达式……
    fn visit_mut_ident(&mut self, n: &mut swc_core::ecma::ast::Ident) {
        n.visit_mut_children_with(self);
        // 在此修改 n
    }
}

#[plugin_transform]
pub fn process(mut program: Program, _: TransformPluginProgramMetadata) -> Program {
    program.visit_mut_with(&mut MyVisitor);
    program
}
```

- 关键依赖是 **`swc_core`**，其版本必须按 plugins.swc.rs 对齐目标宿主。
- `visit_mut_*` 系列方法对应各类 AST 节点；记得调 `visit_mut_children_with` 递归子节点。

## 三、parse → print：必须同一个 Compiler 实例

把 SWC 当 AST 工具链用时（解析 → 改 → 打印），`parse` 与 `print` **必须复用同一个 `Compiler` 实例**，否则两者持有的字符串/span 表（source map 上下文）对不上，`print` 出来会错乱：

```js
const swc = require("@swc/core");
const c = new swc.Compiler();      // 同一个实例

const ast = await c.parse(src, { syntax: "typescript" });
// ……遍历/修改 ast……
const { code } = await c.print(ast); // 复用同一个 c
```

> 旧 JS 端的 `plugins()` 接口与裸 `parse`/`print` 组合已被 `@deprecated`，扩展推荐走 Wasm 插件路线；确需在 JS 侧操作 AST 时，务必同实例 parse/print。

## 四、与 Oxc 的竞争

SWC 不再是「唯一的 Rust 前端工具」。**Oxc（The JavaScript Oxidation Compiler）**同样用 Rust，路线更激进的「全家桶」（parser / linter / resolver / transformer / minifier 一体），并被 Rolldown / Vite 生态采纳，与 SWC 形成**直接竞争**。

| | SWC | Oxc |
|---|---|---|
| 语言 | Rust | Rust |
| 定位 | 编译平台 + Wasm 插件扩展 | 更激进的一体化工具链 |
| 生态绑定 | Next.js / Parcel / Deno / Rspack | Rolldown / Vite 生态 |
| 扩展 | Wasm 插件（ABI 耦合） | 内置能力为主 |

> 两者都「快且不做类型检查」。选型上，SWC 的优势是**被 Next.js 等深度内置 + Wasm 可扩展**；Oxc 的优势是**更整合、更新的架构**。

## 五、spack / bundle 的局限

SWC 也提供打包能力（早期叫 **spack**，API 为 `bundle`），但**成熟度长期不足**：

- 功能与生态远不及 Webpack / Rspack / Rollup / Vite，code splitting、复杂资源处理等支持有限；
- 生产打包**仍应交给专门打包器**——而 SWC 的价值恰恰是作为这些打包器的**转译内核**（Rspack / Rsbuild 用 `swc-loader`、Next.js 内置 SWC）。

> 记忆点：**SWC 强在「转译 + 压缩」内核，弱在「打包」**。把它当 Babel 替代用，把打包留给打包器，是最稳的工程姿势。

## 六、专家级易错点

- **升级即断插件**：升 `@swc/core` / Next.js 前没核对 Wasm 插件版本 → 构建失败。永远先查 plugins.swc.rs。
- **`env` 与 `jsc.target` 同时写**：互斥，会冲突；二选一。
- **装饰器三开关漏配**：NestJS/TypeORM 需要 `parser.decorators` + `transform.legacyDecorator` + `transform.decoratorMetadata` 同时开。
- **`const enum` / `namespace` 在 file-by-file 下出错**：逐文件转译看不到跨文件信息，避免依赖跨文件内联的 TS 特性。
- **忘了类型检查**：SWC 测试/构建全绿 ≠ 类型正确，CI 必须另跑 `tsc --noEmit`。
- **parse/print 跨实例**：导致 source map / span 错乱，必须同一 `Compiler` 实例。

---

回到 [参考](../reference) 查 `.swcrc` 字段、CLI 与 API 速查表。
