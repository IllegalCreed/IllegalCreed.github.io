---
layout: doc
outline: [2, 3]
---

# 导入、命名空间与组织：Less 的模块化拼图

> 基于 Less 4.6.7 · 核于 2026-07

## 速查

- **`@import` 按扩展名**：`.less`/无扩展名 → **内联编译**；`.css` → 默认**原样保留**成 CSS 的 `@import`（不内联）。
- **`@import` 选项**（可组合，`@import (a, b) "x.less"`）：
  - `reference` —— 只引用不输出，仅被 extend/mixin 用到才产出（**控体积利器**）
  - `inline` —— 原样包含、不编译（塞入非标准/已压缩 CSS）
  - `less` / `css` —— 强制按 Less 编译 / 强制当 CSS 处理
  - `once`（默认）/ `multiple` —— 只引一次 / 允许多次引入
  - `optional` —— 文件缺失则跳过、不报错
- **命名空间**：`#lib() { .mix() {} }`，调用 `#lib.mix();`、取值 `#lib.colors[primary]`；带括号的命名空间**私有不输出**。
- **映射查找**（3.5+）：`@cfg: { a: 1; b: 2 }`，`@cfg[a]` 取值；命名空间也可当映射 `#lib.colors[primary]`。
- **脱离规则集**：`@rules: { ... };` 把「样式块」赋给变量，`@rules();` 调用或传给混合以包裹进特定上下文。
- **`:extend`**：`.a:extend(.b) {}` 或 `.a { &:extend(.b); }`——**合并选择器**（不复制属性）；`:extend(.b all)` 做非破坏性查找替换。
- **extend vs mixin**：extend 合并选择器、产物更小但改分组；mixin 复制声明、直观但可能膨胀。
- **组织建议**：入口 `index.less` 用 `@import (reference)` 汇聚变量/混合库，业务文件按需取用。

## 一、`@import` 与扩展名

`@import` 的行为取决于目标扩展名：

```less
@import "variables";        // 无扩展名 → 当 .less 内联编译
@import "mixins.less";      // .less → 内联编译
@import "reset.css";        // .css → 默认原样保留成 @import（不内联）
@import (less) "reset.css"; // 强制把 .css 也当 Less 内联进来
```

## 二、`@import` 选项详解

选项写在括号里，可组合：

```less
@import (reference) "toolkit.less";     // 只引用不输出
@import (inline) "legacy.css";          // 原样包含、不编译
@import (optional) "maybe-missing.less";// 缺失则跳过、不报错
@import (optional, reference) "a.less"; // 组合
```

| 选项 | 作用 |
| --- | --- |
| `reference` | 引入但**默认不输出**，仅被 `:extend`/mixin 用到的部分才产出 |
| `inline` | 把文件内容**原样包含**、不做 Less 编译 |
| `less` | 无视扩展名，**强制按 Less** 编译 |
| `css` | 强制当 CSS 处理，输出为原生 `@import` 语句 |
| `once` | **默认**：同一文件只引入一次 |
| `multiple` | 允许同一文件被引入多次 |
| `optional` | 文件不存在时**跳过而不报错**，继续编译 |

::: tip reference 是控体积关键
想复用一整套工具库（大量混合/占位规则）但**不想把它们全打进产物 CSS**，用 `@import (reference)`：库里的规则默认不输出，只有你实际 `.mixin()` 调用或 `:extend` 到的部分才产出。这是把「大型 Less 库」瘦身进最终 CSS 的标准手法。
:::

## 三、命名空间与访问器

把混合分组进命名空间，隔离命名、组织成「样式库」：

```less
#library() {           // 带括号 → 私有，不输出到 CSS
  .rounded(@r: 4px) { border-radius: @r; }
  .colors() { primary: #1677ff; danger: #ff4d4f; }
}

.card {
  #library.rounded(8px);            // 调用命名空间里的混合
  color: #library.colors[primary];  // 取命名空间里的值（当映射用）
}
```

命名空间让你像调用「库方法」一样使用混合，避免全局命名冲突。

## 四、映射（map）：按键取值（3.5+）

Less 3.5 起可把一组变量当映射，用 `[key]` 下标取值：

```less
@breakpoints: {
  mobile: 480px;
  tablet: 768px;
  desktop: 1024px;
};

@media (min-width: @breakpoints[tablet]) {
  .container { max-width: 720px; }
}
```

映射让相关常量集中管理、按键取用，弥补了 Less 早期缺少一等映射类型的短板（Sass 的 map 更成熟、可迭代）。

## 五、脱离规则集：把「样式块」当值传递

脱离规则集（detached ruleset）把一段规则赋给变量，之后可调用或**传给混合**，让混合决定把它包裹进什么上下文：

```less
// 把样式块作为参数，包进媒体查询
.desktop(@rules) {
  @media (min-width: 1200px) { @rules(); }
}

.header {
  .desktop({
    background: #fff;
    height: 80px;
  });
}
```

这实现了「把一整块样式当值传递」的高阶复用，是写响应式包装器、条件包裹的基础模式。

## 六、`:extend`：合并选择器而非复制声明

`:extend` 把当前选择器**追加**到目标选择器的选择器列表里，共享同一份声明——与 mixin「复制属性」形成对比：

```less
.message {
  padding: 12px;
  border: 1px solid #ccc;
}
.success {
  &:extend(.message);   // 或写 .success:extend(.message) {}
  border-color: green;
}
// 产物：.message, .success { padding: 12px; border: 1px solid #ccc; }
//       .success { border-color: green; }
```

加 `all` 关键字做**非破坏性查找替换**——凡是编译后 CSS 里 `.message` 作为片段出现的复合选择器，都追加把 `.message` 换成 `.success` 的版本：

```less
.success:extend(.message all) {}
// .message .icon 也会衍生出 .success .icon
```

### extend vs mixin 怎么选

| 维度 | `:extend` | mixin |
| --- | --- | --- |
| 机制 | 合并选择器，**共享**声明 | **复制**声明到调用处 |
| 产物体积 | 更小（不重复属性） | 可能膨胀（多处重复） |
| 副作用 | 会改变选择器分组与**源码顺序** | 无分组变化，位置直观 |
| 传参 | 不支持 | 支持参数 |
| 适用 | 大量共享同一组静态声明 | 需要参数化、位置可控 |

## 七、一个可维护的组织范式

```less
// index.less —— 入口，用 reference 汇聚库，避免重复输出
@import (reference) "variables.less";
@import (reference) "mixins.less";
@import "base.less";        // 需要真正输出的基础样式
@import "components/button.less";
@import "components/card.less";
```

业务文件里按需 `.mixin()` / `:extend()` / 取变量，既复用又不让工具库的规则无谓地进产物。

---

组织方式讲清后，进入 [Less vs Sass 与选型](./less-vs-sass)：客观对比两大预处理器的语法、求值、模块系统与生态定位，帮你在存量维护与新项目选型间做判断。
