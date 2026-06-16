---
layout: doc
outline: [2, 3]
---

# 基础

> 基于 Prettier v3.8.3 编写

## 速查

- 定位：唯一“全自动”格式化器；解析后按固定规则重排，消除团队风格争论
- 与 linter 分工：Prettier 管**格式规则**（行宽/空格/引号），linter 管**代码质量**（无用变量等）
- 配置哲学：“强势统一”，刻意极少配置，未来不再新增选项
- 合理选项：`trailingComma` / `proseWrap` / `htmlWhitespaceSensitivity` / `endOfLine` / `quoteProps`
- 争议选项（慎改）：`arrowParens` / `jsxSingleQuote` / `bracketSameLine` / `bracketSpacing`
- 核心规则：保证行为不变；默认双引号（按逃逸字符数选）；连续空行压缩为一行；`printWidth`（默认 80）是建议非硬性；分号默认加并在行首防 ASI 陷阱

## 设计理念

### 创建和强制执行风格指南

- 避免团队在代码风格上的无休止争论（比如缩进、换行）。
- Prettier 是唯一“完全自动”的格式化工具，不像其他风格指南需要手动调整。

### 帮助新人

- Prettier 可以帮助新手，尤其是从其他语言/风格转来的开发者，只需要聚焦于逻辑。

### 节省时间

- 无需手动格式化或在代码审查中挑剔细节。
- 解析代码并按固定规则重写，确保整个代码库风格统一。

### 易于采用

- 支持编辑器保存时格式化、Git 预提交钩子、CI 环境运行。

### 流行度

- Prettier 被各大主流框架和社区广泛采用。

## 对比其他 Lint 框架

- 关于格式规则: Prettier 完全取代 linters 的格式规则（如最大行宽、关键字间距），通过重印代码确保一致风格，消除此类错误。

- 关于代码质量规则: Prettier 对代码质量规则（如无用变量、隐式全局变量）无能为力，这些规则由 linters 检测并修复。

## 可配置性

Prettier 追求 `“ 强势统一 ”` ，尽量减少配置，现存的配置有些是必须的，另一些是历史遗留问题，不建议使用，未来也不会再增加配置项。

### 合理选项举例

**`--trailing-comma es5`**

- **含义**：控制是否在对象、数组等的最后一项后加逗号
- **评价**：这是一个技术驱动的选项，解决了实际问题，没引发太多风格争议。

**`--prose-wrap`**

- **含义**：控制 Markdown 中散文（prose）的换行方式（如 `always` 强制换行、`never` 不换行）。
- **评价**：这是因外部生态需求加的选项，实用且必要。

**-`-html-whitespace-sensitivity`**

- **含义**：控制 HTML 中空白的处理方式（如 `css` 按 CSS 规则、`strict` 严格保留）。
- **评价**：这是技术上的必需品，避免格式化破坏 HTML 语义。

**`--end-of-line`**

- **含义**：控制换行符类型（`lf`、`crlf`、`auto`）。
- **评价**：这是协作和兼容性需求的结果，减少了实际麻烦。

**`--quote-props`**

- **含义**：控制对象属性名是否加引号（如 `as-needed` 只在必要时加，`consistent` 强制一致）。
- **评价**：为特定工具链加的选项，有明确用例。

### 不合理选项举例

**`--arrow-parens`**

- **含义**：控制箭头函数单参数是否加括号（如 `x => x` 或 `(x) => x`）。
- **默认值**："`always`"，强制加括号。
- **评价**：纯粹的“bike-shedding”（无谓争议），增加了选择负担。

**`--jsx-single-quote`**

- **含义**：控制 JSX 属性是用单引号还是双引号，例如 `<div className='box' />` 或 `<div className="box" />`。
- **默认值**：`false`，使用双引号。
- **评价**：加剧了团队内部的格式战争，得不偿失。

**`--bracket-same-line`**

- **含义**：控制 JSX、HTML、Vue、Angular 闭合尖括号是否与开始标签同行
- **默认值**：`false`，闭合括号换行（不适用于自闭合元素）。
- **评价**：增加了配置复杂性，却没带来实质好处。

**`--no-bracket-spacing`**

- **含义**：控制对象字面量括号内是否有空格（如 `{foo: 1}` 或 `{ foo: 1 }`）。
- **默认值**：`true`，加空格。
- **评价**：增加了配置复杂性，却没带来实质好处。

## 核心规则

### 正确性

**首要原则**：格式化后的代码必须有效且行为不变

### 字符串

**引号选择**

- 默认使用双引号（`singleQuote: false`），当出现嵌套引号时，根据逃逸字符数量选择：
    - 若单引号逃逸更少，用单引号；否则用双引号。
    - 示例：`"It's gettin' better!"`（双引号逃逸少），而非 `'It\'s gettin\' better!'`。
- 无引号或平局时，默认双引号，可通过 `singleQuote` 选项更改。

**JSX 引号**

- JSX 有独立选项 `jsxSingleQuote`，默认双引号（`false`）。
- 理由：HTML 传统和浏览器开发者工具常用双引号。

**逃逸保留**

- 保留原始字符串的逃逸方式，不转换（如 "🙂" 不变为 "`\uD83D\uDE42`"）。

### 空行

**策略**：保留原始代码中的空行，但有以下规则：

- 多个连续空行压缩为一行。
- 移除块（如函数）和文件开头结尾的空行。
- 文件始终以单一换行符结束。

### 多行对象

**默认行为**：

- 单行对象若适合（未超 `printWidth`），保持单行。
- 若原始代码中 `{` 和第一个键之间有换行，则保持多行。
- 长单行对象会自动扩展为多行（超过 `printWidth`），短多行对象不会自动折叠为单行。

**示例**：

- 单行
    
    ```ts
    const user = { name: "John", age: 30 };
    ```
    
- 保持多行
    
    ```ts
    const user = {
    	name: "John",
    	age: 30
    }; 
    ```
    

**选项**：可通过 `objectWrap: "collapse"` 在能放下时折回单行（默认 `"preserve"`，保持多行）。

**提示**：手动调整  `{` 后的换行可控制单行/多行。

::: warning **非可逆性问题**

多行对象不会自动折叠回单行，可能导致格式不可逆。这会导致如果你临时添加了一个对象字面量属性，执行格式化后有可能变为多行，当你再删除它的时候，他无法变回单行。这可能导致无异议的提交。团队仍在寻找更好的启发式规则。

:::

### 装饰器 (Decorators)

- **定位规则**

    - 函数/方法：会尽量保持你的原始写法，但若一行放不下则换行。
    - 类：装饰器始终独占一行。

- **示例**：
    - 保持同行
        
        ```ts
        @Output() change = new EventEmitter();
        ```
        
    - 保持单独一行
        
        ```ts
        // 原始
        @observer class Foo {}
        
        // 格式化后
        @observer
        class Foo {}
        ```
        
### 模板字面量 (Template literals)

- **换行规则**：
    - 仅当插值 `${...}` 内有物理换行时，Prettier 才会将整个模板字面量拆成多行，并对插值部分进行缩进对齐。
    - 否则即使你的单行长度超过 `printWidth` 也不会自动换行。
- **理由**：换行取决于语义，Prettier 缺乏判断依据，依赖原始格式是当前最佳启发式方法。

### 分号 (Semicolons)

- **默认行为**：添加分号（ `semi: true` ）。
- **ASI 预防**：在可能引发自动分号插入（ ASI ）问题的行首（如 `[` 前加分号，即使 `semi: false`。
    - 示例：
        
        ```tsx
        // 原始代码
        if (x) { 
            [-1, 1].forEach(delta => delta) 
        } 

        // 格式化后输出（即使 noSemi）
        if (x) { 
            ;[-1, 1].forEach(delta => delta) 
        }
        ```
        

::: tip **什么是 ASI ？**

默认情况下 JavaScript 可以自动识别哪里需要分号，并自动在执行时帮你加上，基本原则就是如果不加分号则会引发语法错误。

但某些情况下，省略分号并不会产生语法错误，无法触发 ASI ，则可能产生不可预期的BUG。

**例如：**

```tsx
// 原始代码
let a = "hello"
[1, 2, 3].forEach(console.log)

// 无语法错误，不会自动添加分号
let a = "hello"[1, 2, 3].forEach(console.log);

// 导致行为不符合预期
```
<br>

```tsx
// 原始代码
function foo() {
  return
  "hello"
}
console.log(foo());

// 在某些特定语法（如 return、break、continue、throw 等）后直接换行时，
// ASI 会插入分号，即使下一行看起来是延续
function foo() {
  return;
  "hello";
}

// 输出 undefined，结果不符合预期
```
<br>

```tsx
// 原始代码
for (let i = 0, j = 0 i < 3; i++)
console.log(i, j)

// ASI 不会帮你在 j = 0 后自动添加分号，最终导致语法错误
```

:::

::: warning **维持程序原本行为，不会帮你修复BUG**

如果你的程序存在BUG，例如：

```tsx
console.log('Running a background task')
(async () => {
  await doBackgroundWork()
})()
```

理论上应该在 `console.log()` 后添加分号才是正确的行为，但 Prettier 仅仅会帮你格式化，让该处错误变得显而易见，但不会改变你的代码逻辑

```tsx
// 格式化后
console.log("Running a background task")(async () => {
  await doBackgroundWork();
})();
```

:::

### 打印宽度 (Print width)

- **指导性而非硬性**：`printWidth`（默认 `80`）是建议值，Prettier 尽量接近但不严格遵守。
- **例外情况**：
    - 不可拆分的元素（如长字符串、正则、注释）可能超长。
    - 深层嵌套导致缩进占主导。

- **特殊超长场景**（故意超 `printWidth`）：

    - **导入语句**：单元素导入保持单行。
        - 示例：
            
            ```tsx
            import { CollectionDashboard } from "../components/collections/collection-dashboard/main";
            ```
            
    - **测试函数描述**：如 it 的长描述保持单行。
        - 示例：
            
            ```tsx
            describe("NodeRegistry", () => {
            it("makes no request if there are no nodes to prefetch, even if the cache is stale", async () => {
                // The above line exceeds the print width but stayed on one line anyway.
            });
            });
            ```
        
### JSX

- **括号包装**：`return` 或 `yield` 中的 JSX 强制加括号。

    - 示例：
        
        ```tsx
        // 原始代码
        return <div>content</div>
        
        // 格式化
        return (<div>content</div>);
        ```
        
- **理由**：

    - 遵循常见社区习惯。
    - 防止遗留分号变成文本（如 `<div>text;</div>`）。
    
- **换行**：多子节点 JSX 换行并缩进。

### 注释 (Comments)

- **内容保留**：注释内容不格式化，仅 JSDoc（`*` 开头）缩进可调整。
- **位置保留**：尽量保持原始位置，但可能因换行调整。
- **最佳实践**：建议独占行注释，避免行尾注释。

::: tip **魔法注释问题**

长表达式换行可能使注释失效，需手动调整。

```tsx
// 原始代码
// eslint-disable-next-line no-eval
const result = safeToEval ? eval(input) : fallback(input);

// 修改后
// eslint-disable-next-line no-eval
const result = safeToEval && settings.allowNativeEval ? eval(input) : fallback(input);

// 格式化后
// eslint-disable-next-line no-eval
const result =
  safeToEval && settings.allowNativeEval ? eval(input) : fallback(input);

// 您需要手动调整魔法注释位置，保证原有行为不变
const result =
  // eslint-disable-next-line no-eval
  safeToEval && settings.allowNativeEval ? eval(input) : fallback(input);

```

:::

### 非标准语法与机器生成文件

- **非标准语法**：支持实验性语法（如 ECMAScript 提案），但兼容性可能变更。
- **机器生成文件**（如 `package.json`）：使用 `JSON.stringify` 格式化，去除垂直空白，避免与工具冲突。