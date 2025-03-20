---
layout: doc
outline: [2, 3]
---

# 配置文件

## 速查

- 打印宽度：`printWidth：80`
- 缩进宽度：`tabWidth：2`
- 分号：`semi：true`
- 字符串引号：`singleQuote：false`
- 属性名引号：`consistent："as-needed"`
- JSX 引号：`jsxSingleQuote：false`
- 尾随逗号：`trailingComma："all"`
- 括号间距：`bracketSpacing：true`
- 对象换行：`objectWrap："preserve"`
- 闭合尖括号位置：`bracketSameLine：false`
- 箭头函数参数括号：`arrowParens："always"`
- 局部格式化：`--range-start 0 --range-end Infinity`
- 解析器：`--parser <string>`
- 文件路径：`--stdin-filepath <string>`
- 仅格式化 Pragma 注释的文件：`requirePragma: false`
- 自动插入 Pragma 注释：`insertPragma: false`
- Markdown 中纯文本换行方式：`proseWrap: "preserve"`
- HTML 空白敏感性：`htmlWhitespaceSensitivity: "css"`
- vue单文件组件中的缩进：`vueIndentScriptAndStyle: false`
- 行尾字符：`endOfLine: "lf"` && `.gitattributes`：`* text=auto eol=lf`
- 嵌入代码格式化：`embeddedLanguageFormatting: "auto"`
- 标记语言中每个属性是否独占一行：`singleAttributePerLine: false`

## 配置项

建议优先通过配置项修改配置，这样 `CLI` 和 `编辑器插件` 就可以读取您的自定义配置了。

### 实验性三元运算符格式

本条规则前提是表达式超出 `printWidth` 限制，需要换行的情况下触发。

**有效值：**

- `true`: 启用新颖三元运算符格式。
- `false`: 保留传统格式。`?` 与真值同行，`:` 与假值同行。

| Default | CLI Override | API Override |
| --- | --- | --- |
| `false` | `--experimental-ternaries` | `experimentalTernaries: <bool>` |

::: tip **关于新颖三元运算符格式**

**核心规则基于“提问-回答-否则”的逻辑：**

- 每行以 `?` 结尾表示“if”（条件）。
- 每行以 `:` 开头表示“else”（否则）。
- 不以 `?` 结尾或 `:` 开头的行表示“then”（结果/真值）。
- 未超 `printWidth` 时，保持单行不变。

**示例：**

```yaml
// "Questioning" ternaries for simple ternaries:
const content = 
  children && !isEmptyChildren(children) ? 
    render(children) 
  : renderDefaultChildren();

// "Case-style" ternaries for chained ternaries:
const message =
  i % 3 === 0 && i % 5 === 0 ? "fizzbuzz"
  : i % 3 === 0 ? "fizz"
  : i % 5 === 0 ? "buzz"
  : String(i);
  
// Smoothly transitions between "case-style" and "questioning" when things get complicated:
const reactRouterResult = 
  children && !isEmptyChildren(children) ? children 
  : props.match ?
    component ? React.createElement(component, props)
    : render ? render(props)
    : null
  : null
```

> **注意：社区有些人对此格式不能接受，讨论还在继续。** https://github.com/prettier/prettier/pull/13183

:::

### 实验性运算符位置

控制换行后运算符出现的位置

**有效值：**

- `start`：运算符被放在新行的开头
- `end`：运算符被放在前一行的末尾

| Default | CLI Override | API Override |
| --- | --- | --- |
| `"end"` | `--experimental-operator-position <start\|end>` | `experimentalOperatorPosition: "<start\|end>"` |

### **打印宽度**

该选项表示首选需要换行的宽度。

| Default | CLI Override | API Override |
| --- | --- | --- |
| `80` | `--print-width <int>` | `printWidth: <int>` |

::: tip **为了保持代码的可读性，推荐不要设置超过 `80` 个字符**

在许多代码风格指南中，最大行长度通常设为 100 或 120 字符。但人类编写代码时，不会刻意让每行都达到最大长度，而是会通过空格或换行来提高可读性，实际平均行长往往远低于最大值

不要等同于 ESLint 的 `max-len`。Prettier 会生成比 `printWidth` 短的行（如果内容简单）。也可能生成稍长的行（如果无法合理换行）。但总体上，它会尽量接近你指定的 `printWidth`。

:::

### 缩进宽度

每个缩进界别的空格数量。

| Default | CLI Override | API Override |
| --- | --- | --- |
| `2` | `--tab-width <int>` | `tabWidth: <int>` |

### 是否使用制表符

是否使用制表符代替空格进行缩进。

**有效值：**

- `true`: 缩进使用制表符（`\t`）
- `false`: 缩进使用空格

| Default | CLI Override | API Override |
| --- | --- | --- |
| `false` | `--use-tabs` | `useTabs: <bool>` |

### 分号

是否在语句的末尾打印分号。

**有效值：**

- `true`: 在每个语句的末尾添加一个分号
- `false`: 仅在可能引入 ASI 失败的行的开头添加分号

| Default | CLI Override | API Override |
| --- | --- | --- |
| `true` | `--no-semi` | `semi: <bool>` |

### **字符串引号**

格式化字符串时使用单引号（`'`）还是双引号（`"`）

**有效值：**

- `true`: 使用单引号（`'`）格式化字符串。
- `false`: 使用双引号（`"`）格式化字符串。

| Default | CLI Override | API Override |
| --- | --- | --- |
| `false` | `--single-quote` | `singleQuote: <bool>` |

::: warning **不影响 JSX 中的属性引号**

JSX 的引号由另一个独立选项 `jsx-single-quote` 控制

:::

::: tip **智能引号选择**

如果字符串中包含嵌套引号，Prettier 会根据“哪种引号更少”的原则，自动选择外层引号的类型，以减少转义符（\）的使用。

**示例：**

- 输入: `"I'm double quoted"`
    - 输出（singleQuote: false）: `"I'm double quoted"`
    - 输出（singleQuote: true）: `"I'm double quoted"`
    - 解释: 字符串中有单引号 `'`, 为避免转义，外层仍用双引号，即使设置了 `singleQuote: true`，因为这是智能选择的结果。
- 输入: `"This \"example\" is single quoted"`
    - 输出（singleQuote: false）: `'This "example" is single quoted'`
    - 输出（singleQuote: true）: `'This "example" is single quoted'`
    - 解释: 字符串中有双引号 `"`, 为避免转义，外层用单引号，即使默认是双引号，也会智能调整。

:::

### 对象属性名引号

在格式化对象属性名时，是否以及何时添加引号

**有效值：**

- `as-needed`：仅在必要时为对象属性名添加引号
- `consistent`：如果对象中至少有一个属性名需要引号，则为所有属性名添加引号，保持一致性
- `preserve`：保留输入时对象属性名的引号使用方式，不做额外调整

| Default | CLI Override | API Override |
| --- | --- | --- |
| `"as-needed"` | `--quote-props <as-needed\|consistent\|preserve>` | `quoteProps: "<as-needed\|consistent\|preserve>"` |

::: warning **例外情况**

当使用 **TypeScript/Flow/Angular/Vue** 时，不会移除数字属性名的引号。

:::

::: tip **关于属性名称何时需要加引号**

仅当属性名称是数字文本或有效的标识符名称时，才能省略引号。详情参见：https://mathiasbynens.be/notes/javascript-properties

**示例：**

```jsx
var object = {
	// `abc` is a valid identifier; no quotes are needed
	abc: 1,
	// `123` is a numeric literal; no quotes are needed
	123: 2,
	// `012` is an octal literal with value `10` and thus isn’t allowed in strict mode; but if you insist on using it, quotes aren’t needed
	012: 3,
	// `π` is a valid identifier; no quotes are needed
	π: Math.PI,
	// `var` is a valid identifier name (although it’s a reserved word); no quotes are needed
	var: 4,
	// `foo bar` is not a valid identifier name; quotes are required
	'foo bar': 5,
	// `foo-bar` is not a valid identifier name; quotes are required
	'foo-bar': 6,
	// the empty string is not a valid identifier name; quotes are required
	'': 7
};
```

:::

### **JSX 引号**

是否使用单引号替换 JSX 中的双引号

**有效值：**

- `true`: 在 JSX 属性中使用单引号（`'`）
- `false`: 在 JSX 属性中使用双引号（`"`）

| Default | CLI Override | API Override |
| --- | --- | --- |
| `false` | `--jsx-single-quote` | `jsxSingleQuote: <bool>` |

### **尾后逗号（Trailing Commas）**

控制 Prettier 在多行、逗号分隔的语法结构中是否添加尾后逗号。（单行结构永远不加尾后逗号）

**有效值：**

- `all`：在所有可能的地方添加尾后逗号，包括`对象`、`数组`、`函数参数`、`函数调用参数`和 `TypeScript 类型参数`。需要 ES2017+ 环境（Node.js 8+ 或现代浏览器）或底层编译支持
- `es5`：在 ES5 合法的地方添加尾后逗号，即 `对象` 和 `数组`；
- `none`：不加任何尾后逗号

| Default | CLI Override | API Override |
| --- | --- | --- |
| `"all"` | `--trailing-comma <all\|es5\|none>` | `trailingComma: "<all\|es5\|none>"` |

> **注意：JSON 在任何情况下都不会添加尾后逗号**

### 括号间距

格式化对象字面量时，是否在对象的花括号（`{}`）与内容之间添加空格

**有效值：**

- `true`：在对象字面量的花括号 { 和 } 与键值对之间添加一个空格
- `false`：在对象字面量的花括号 { 和 } 与键值对之间不添加空格

| Default | CLI Override | API Override |
| --- | --- | --- |
| `true` | `--no-bracket-spacing` | `bracketSpacing: <bool>` |

### 对象换行

格式化对象字面量（object literals）时，如何处理那些既可以单行表示又可以多行表示的情况

**有效值：**

- `preserve`：如果输入的对象在开括号 `{` 和第一个属性之间有换行，则保持多行格式，即使内容能在单行内适应 `printWidth`
- `collapse`：尽可能将对象压缩为单行，只要内容能在 printWidth 内适应，无论输入是否有换行

| Default | CLI Override | API Override |
| --- | --- | --- |
| `"preserve"` | `--object-wrap <preserve\|collapse>` | `objectWrap: "<preserve\|collapse>"` |

::: tip **单行变多行不可逆**

当你因为添加属性导致对象超长自动转为多行后，即使你再删除新增的属性，对象也无法恢复为单行。这可能导致无意义的提交，但官方也并没有想出更好的解决方案。

:::

### 闭合尖括号位置

格式化多行 HTML 及其衍生语法（如 JSX、Vue、Angular）的元素时，结束标签的尖括号 `>` 的位置。只影响多行非自闭合元素。

**有效值：**

- `true`：将结束标签的 `>` 放在最后一行的末尾，与最后一个属性或内容同行
- `false`：将结束标签的 `>` 单独放在下一行，与最后一个属性或内容分隔开

| Default | CLI Override | API Override |
| --- | --- | --- |
| `false` | `--bracket-same-line` | `bracketSameLine: <bool>` |

**示例：**

```jsx
// bracketSameLine: **true**
<button
  className="prettier-class"
  id="prettier-id"
  onClick={this.handleClick}>
  Click Here
</button>

// bracketSameLine: false
<button
  className="prettier-class"
  id="prettier-id"
  onClick={this.handleClick}
>
  Click Here
</button>
```

### JSX 中闭合尖括号位置（已废弃）

格式化多行 JSX 元素时，结束标签的尖括号 `>` 的位置。此选项在 v2.4.0 中已弃用，请改用 `--bracket-same-line`

**有效值：**

- `true`：将 JSX 元素的结束标签 `>` 放在最后一行的末尾，与最后一个属性同行
- `false`：将 JSX 元素的结束标签 `>` 单独放在下一行，与最后一个属性分隔开

| Default | CLI Override | API Override |
| --- | --- | --- |
| `false` | `--jsx-bracket-same-line` | `jsxBracketSameLine: <bool>` |

### 箭头函数参数括号

用于控制 Prettier 在格式化箭头函数（arrow functions）时，是否为单一参数添加括号

**有效值：**

- `always`：总是为箭头函数的单一参数添加括号，无论是否必要
- `avoid`：在可能的情况下省略单一参数的括号，仅当语法要求时添加（例如多参数或默认值）

| Default | CLI Override | API Override |
| --- | --- | --- |
| `"always"` | `--arrow-parens <always\|avoid>` | `arrowParens: "<always\|avoid>"` |

**示例：**

```js
// arrowParens：always
const fn = (x) => x;
const fn2 = (a) => a * 2;

// arrowParens：avoid
const fn = x => x;
const fn2 = a => a * 2;

// 多参数，必须加括号
const fn = (x, y) => x + y;

// 默认值，必须加括号
const fn2 = (x = 1) => x;

// 类型注释，必须加括号
const fn = (x: number) => x;
```

### 局部格式化

允许用户指定文件的某个字符范围（character offset），Prettier 只格式化这个范围内的代码，而不是整个文件

它通过两个子选项实现：

- `-range-start`: 格式化范围的起始字符位置（包含该位置）。
- `-range-end`: 格式化范围的结束字符位置（不包含该位置）。

**扩展行为**:

- **向回扩展**: 从指定的 `--range-start` 开始，扩展到包含该位置的第一行的行首字符。
- **向前扩展**: 从指定的 `--range-end` 开始，扩展到包含该位置的语句的结尾。

**使用场景**：用于搭配编辑器插件用来做局部格式化

| Default | CLI Override | API Override |
| --- | --- | --- |
| `0` | `--range-start <int>` | `rangeStart: <int>` |
| `Infinity` | `--range-end <int>` | `rangeEnd: <int>` |

### 解析器

用于指定 Prettier 使用哪个解析器来处理输入文件的语法。Prettier 会根据输入文件的路径（扩展名）自动推断合适的解析器，因此通常不需要手动设置这个选项

**有效值：**

- **JavaScript 相关解析器**
    - **babel**：使用 @babel/parser，支持标准 JavaScript 特性（包括 Flow 类型注解）。
    - **babel-flow**：与 "babel" 相同，但明确启用 Flow 解析，避免歧义。
    - **babel-ts**：类似 "typescript"，但使用 Babel 的 TypeScript 插件解析。
    - **flow**：使用 flow-parser，专为 Flow 类型系统设计。
    - **typescript**：使用 @typescript-eslint/typescript-estree，专为 TypeScript 设计，经过广泛测试。
    - **espree**：使用 espree 解析器，轻量级 JavaScript 解析。
    - **meriyah**：使用 meriyah 解析器，另一种 JavaScript 解析选项。
    - **acorn**：使用 acorn 解析器，标准 JavaScript 解析。
- **样式相关解析器**
    - **css**：使用 postcss，解析标准 CSS。
    - **scss**：使用 postcss-scss，解析 SCSS（Sass 的变体）。
    - **less**：使用 postcss-less，解析 Less。
- **JSON 相关解析器**
    - **json**：使用 @babel/parser parseExpression，解析标准 JSON。
    - **json5**：与 "json" 同解析器，但输出为 JSON5 格式（支持注释、尾随逗号等）。
    - **jsonc**：与 "json" 同解析器，但输出为带注释的 JSON（JSON with Comments）。
    - **json-stringify**：与 "json" 同解析器，但输出模仿 JSON.stringify 的风格。
- **其他语言解析器**
    - **graphql**：使用 graphql/language，解析 GraphQL 查询语言。
    - **markdown**：使用 remark-parse，解析 Markdown。
    - **mdx**：使用 remark-parse 和 @mdx-js/mdx，解析 MDX（Markdown + JSX）。
    - **html**：使用 angular-html-parser，解析标准 HTML。
    - **vue**：与 "html" 同解析器，但支持 Vue 特定语法。
    - **angular**：与 "html" 同解析器，但通过 angular-estree-parser 支持 Angular 特定语法。
    - **lwc**：与 "html" 同解析器，但支持 Lightning Web Components (LWC) 的无引号模板属性。
    - **yaml**：使用 yaml 和 yaml-unist-parser，解析 YAML。

| Default | CLI Override | API Override |
| --- | --- | --- |
| None | `--parser <string>` | `parser: "<string>"` |

::: danger 

自定义解析器 API 已在 v3.0.0 中删除。请改用插件

:::

### 文件路径

用于指定一个文件名（包括扩展名），以便 Prettier 根据这个文件名推断应该使用哪个解析器（parser）来格式化代码

示例：

```bash
cat foo | prettier --stdin-filepath foo.css
```

| Default | CLI Override | API Override |
| --- | --- | --- |
| None | `--stdin-filepath <string>` | `filepath: "<string>"` |

::: warning 

仅针对CLI和API有该选项，配置文件中没有

:::

### 仅格式化用 Pragma 注释的文件

用于限制 Prettier 只格式化包含特定注释（称为 pragma）的文件

::: tip **Pragma**

一种特殊的注释，放在文件顶部，告诉 Prettier 该文件需要格式化

:::

有效的注释：

```js
/**
 * @prettier
 */

/**
 * @format
 */
```

**有效值：**

- `true`：Prettier 只格式化文件顶部包含特定 pragma 的文件
- `false`：Prettier 格式化所有文件，无论是否有 pragma

| Default | CLI Override | API Override |
| --- | --- | --- |
| `false` | `--require-pragma` | `requirePragma: <bool>` |

**使用场景**：**大型代码库逐步过渡到使用Prettier进行代码格式化**

在一个未使用 Prettier 格式化的大型代码库中，一次性格式化所有文件可能会导致大量更改，难以审查和管理。使用 `--require-pragma`，开发者可以逐步为需要格式化的文件添加 pragma，控制格式化的范围

### 自动插入 Pragma 注释

用于让 Prettier 在文件顶部自动插入一个特殊的 `@format` 标记（pragma），表明该文件已被 Prettier 格式化。

**有效值：**

- `true`：Prettier 在格式化文件时，会在文件顶部插入 `/** @format */`
- `false`：Prettier 不插入任何标记，保持文件顶部不变

| Default | CLI Override | API Override |
| --- | --- | --- |
| `false` | `--insert-pragma` | `insertPragma: <bool>` |

::: tip **与 `--require-pragma` 的协作**

如果同时使用 `--insert-pragma` 和 `--require-pragma`，`--require-pragma` 优先，`--insert-pragma` 会被忽略

:::

### Markdown 中纯文本换行方式

用于控制 Prettier 在格式化 Markdown 文件时，如何处理纯文本部分（不包括代码块、标题、列表等结构化部分）的换行。

**有效值：**

- `always`：如果散文内容超过 `printWidth`（默认 80 字符），Prettier 会自动换行，使每行长度尽量接近但不超过 `printWidth`
- `never`：Prettier 将每个散文块强制合并为单行，移除所有换行。
- `preserve`：不改变散文的换行，保持输入时的原样

| Default | CLI Override | API Override |
| --- | --- | --- |
| `"preserve"` | `--prose-wrap <always\|never\|preserve>` | `proseWrap: "<always\|never\|preserve>"` |

### HTML 空白敏感性

用于控制 Prettier 在格式化 `HTML`、`Vue`、`Angular` 和 `Handlebars` 文件时，如何处理标签周围的空白（空格和换行）。

::: tip **HTML中的空白**

在 HTML 中，空白（空格、换行）有时会影响渲染（例如内联元素之间的空格），有时不会（例如块元素间的换行通常被忽略）

```html
<!-- 带空格 -->
1<b> 2 </b>3  <!-- 输出渲染：1 2 3 -->
<!-- 无空格 -->
1<b>2</b>3    <!-- 输出渲染：123 -->
```

:::

**有效值：**

- `css`：根据 CSS `display` 属性默认值决定空白是否重要，如果你改了默认的 `display`， 可以添加注释告诉 Prettier，例如：
    
    ```html
    <!-- 输入 -->
    <!-- display: block -->
    <span class="dolorum atque aspernatur">Est molestiae sunt facilis qui rem.</span>

    <!-- 输出 -->
    <!-- display: block -->
    <span class="dolorum atque aspernatur">
      Est molestiae sunt facilis qui rem.
    </span>
    ```
    
- `strict`：保留所有输入中的空格和换行
- `ignore`：Prettier 可自由换行或移除空白，按 `printWidth` 调整，不考虑渲染影响

| Default | CLI Override | API Override |
| --- | --- | --- |
| `"css"` | `--html-whitespace-sensitivity <css\|strict\|ignore>` | `htmlWhitespaceSensitivity: "<css\|strict\|ignore>"` |

### vue单文件组件中的缩进

用于控制 Prettier 在格式化 Vue 文件时，是否对 `<script>` 和 `<style>` 标签内的代码进行缩进

**有效值：**

- `false`：不缩进 `<script>` 和 `<style>` 标签内的代码，内容与标签对齐
- `true`：缩进 `<script>` 和 `<style>` 标签内的代码，通常相对于标签增加一级缩进

| Default | CLI Override | API Override |
| --- | --- | --- |
| `false` | `--vue-indent-script-and-style` | `vueIndentScriptAndStyle: <bool>` |

### 行尾字符

用于控制 Prettier 在格式化文件时使用的行尾字符（line ending）

::: tip **行尾类型**

- `\n`（LF，Line Feed）：常见于 Linux 和 macOS，以及 Git 仓库。
- `\r\n`（CRLF，Carriage Return + Line Feed）：常见于 Windows。
- `\r`（CR，Carriage Return）：极少使用。

:::

**有效值：**

- `lf`：只使用换行符 \n（Line Feed），Linux 和 macOS 标准
- `crlf`：使用回车加换行符 \r\n（Carriage Return + Line Feed），Windows 标准
- `cr`：只使用回车符 \r（Carriage Return），非常少见
- `auto`：保持文件现有的行尾类型。如果文件中混杂多种行尾，Prettier 会以第一行后的行尾为准规范化

| Default | CLI Override | API Override |
| --- | --- | --- |
| `"lf"` | `--end-of-line <lf\|crlf\|cr\|auto>` | `endOfLine: "<lf\|crlf\|cr\|auto>"` |

::: tip **Git配置行尾字符**

在 `.gitattributes` 添加，`create-vue` 初始化的 Vue 项目应该默认就有

```
* text=auto eol=lf
```

:::

### 嵌入代码格式化

用于控制 Prettier 是否格式化文件中嵌入的代码片段

::: tip **嵌入代码**

指在一种语言的文件中，以字符串形式包含的另一种语言的代码，例如 JavaScript 中的 HTML 模板字符串，或 Markdown 中的代码块

:::

**有效值：**

- `auto`：如果 Prettier 能自动识别嵌入的代码，就对其进行格式化
- `off`：完全禁用对嵌入代码的自动格式化，保持原始内容不变

| Default | CLI Override | API Override |
| --- | --- | --- |
| `"auto"` | `--embedded-language-formatting=<off\|auto>` | `embeddedLanguageFormatting: "<off\|auto>"` |

**示例：**

```js
// Input
html`
<p>
I am expecting this to come out exactly like it went in.
`;

// using --embedded-language-formatting=auto (or omitting this option)
html`
  <p>
    I am expecting this to come out exactly like it went in.
  </p>
`;

// using --embedded-language-formatting=off
html`
<p>
I am expecting this to come out exactly like it went in.
`;
```

### 标记语言中每个属性是否独占一行

用于控制 Prettier 在格式化 HTML、Vue 和 JSX 文件时，是否强制每个标签属性独占一行

**有效值：**

- `false`：不强制每个属性独占一行，Prettier 根据 printWidth（默认 `80` 字符）决定是否换行，多个属性可能在一行
- `true`：强制每个属性独占一行，无论是否超过 printWidth，只要标签有多个属性，就逐行排列

| Default | CLI Override | API Override |
| --- | --- | --- |
| `false` | `--single-attribute-per-line` | `singleAttributePerLine: <bool>` |

## 配置文件

### 配置文件类型及优先级

- `package.json` 或 `package.yaml` 中的 `"prettier"` 键
- `.prettierrc`（JSON 或 YAML 格式）
- `.prettierrc.json`, `.prettierrc.yml`, `.prettierrc.yaml`, `.prettierrc.json5`
- `.prettierrc.js`, `prettier.config.js`, `.prettierrc.ts`, `prettier.config.ts`
- `.prettierrc.mjs`, `prettier.config.mjs`, `.prettierrc.mts`, `prettier.config.mts`
- `.prettierrc.cjs`, `prettier.config.cjs`, `.prettierrc.cts`, `prettier.config.cts`
- `.prettierrc.toml`

**路径解析:**

从被格式化的文件位置开始，向上搜索文件树，直到找到配置文件或到达根目录。换句话说就是文件格式化依赖和它最近的配置文件

::: warning **无全局配置**

Prettier 故意不支持全局配置文件，确保项目复制到其他电脑时，格式化行为一致，避免团队间结果差异

:::

### TypeScript 配置文件的特殊要求

TypeScript 配置文件（`.prettierrc.ts`, `prettier.config.ts` 等）需要 Node.js 支持。要求：

- Node.js 版本 >= `22.6.0`。
- 使用 `--experimental-strip-types` 标志。

**运行方式：**

```bash
node --experimental-strip-types node_modules/prettier/bin/prettier.cjs . --write
```

```bash
NODE_OPTIONS="--experimental-strip-types" prettier . --write
```

### 配置示例

**JSON:**

```json
{
  "trailingComma": "es5",
  "tabWidth": 4,
  "semi": false,
  "singleQuote": true
}
```

**JS (ES Modules):**

```js
// prettier.config.js, .prettierrc.js, prettier.config.mjs, or .prettierrc.mjs
/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  trailingComma: "es5",
  tabWidth: 4,
  semi: false,
  singleQuote: true,
};

export default config;
```

**JS (CommonJS):**

```js
// prettier.config.js, .prettierrc.js, prettier.config.cjs, or .prettierrc.cjs
/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  trailingComma: "es5",
  tabWidth: 4,
  semi: false,
  singleQuote: true,
};

module.exports = config;
```

**TypeScript (ES Modules):**
```tsx
// prettier.config.ts, .prettierrc.ts, prettier.config.mts, or .prettierrc.mts

import { type Config } from "prettier";

const config: Config = {
  trailingComma: "none",
};

export default config;
```

**TypeScript (CommonJS):**

```tsx
// prettier.config.ts, .prettierrc.ts, prettier.config.cts, or .prettierrc.cts
import { type Config } from "prettier";

const config: Config = {
  trailingComma: "none",
};

module.exports = config;
```

**YAML:**

```yaml
# .prettierrc or .prettierrc.yaml
trailingComma: "es5"
tabWidth: 4
semi: false
singleQuote: true
```

**TOML:**

```toml
# .prettierrc.toml
trailingComma = "es5"
tabWidth = 4
semi = false
singleQuote = true
```

### 配置覆盖

允许你在 Prettier 配置文件中为不同的文件类型、文件夹或具体文件指定特殊的格式化选项，覆盖全局配置

**基本格式：** 

- `files`： 必需，指定适用文件的模式（字符串或字符串数组）。
- `options`： 指定该规则的格式化选项。
- `excludeFiles`： 可选，排除某些文件的模式（字符串或字符串数组）。

**示例：**

```json
{
  "semi": false,
  "overrides": [
    {
      "files": "*.test.js",
      "options": {
        "semi": true
      }
    },
    {
      "files": ["*.html", "legacy/**/*.js"],
      "options": {
        "tabWidth": 4
      }
    }
  ]
}
```

```yaml
semi: false
overrides:
  - files: "*.test.js"
    options:
      semi: true
  - files:
      - "*.html"
      - "legacy/**/*.js"
    options:
      tabWidth: 4
```

### 设置解析器选项

通过 `parser` 选项指定 Prettier 使用的解析器，决定如何解析文件的语法。默认 Prettier 会根据文件扩展名自动推断解析器

**使用场景：**

当 Prettier 无法识别文件扩展名或需要更改默认解析器时，通过 `overrides` 设置

**示例：**

为 `.prettierrc` 设置 JSON 解析器

```json
{
  "overrides": [
    {
      "files": ".prettierrc",
      "options": { "parser": "json" }
    }
  ]
}
```

为 `.js` 文件使用 Flow 解析器

```json
{
  "overrides": [
    {
      "files": "*.js",
      "options": {
        "parser": "flow"
      }
    }
  ]
}
```

::: warning **不能全局设置 parser**

顶层设置会禁用 Prettier 的自动推断，强制对所有文件使用指定解析器，可能导致错误

:::

### 配置 Schema

指的是一个 JSON Schema 文件，用于定义 Prettier 配置文件的结构和合法值，帮助用户验证配置是否正确。用户可以用它验证 `.prettierrc`（或其他格式转换后的 JSON）是否符合 Prettier 的配置要求。

**位置**

提供一个官方外部链接：`https://json.schemastore.org/prettierrc`。

**示例**

```json
{
  "$schema": "https://json.schemastore.org/prettierrc",
  "semi": false,
  "singleQuote": true,
  "printWidth": 100
}
```

### 与 EditorConfig 集成

如果项目中有 `.editorconfig` 文件，Prettier 会读取并将其属性映射到自己的配置选项。

**优先级**: `.editorconfig` 的设置会被 `.prettierrc` 等配置文件覆盖。

::: tip **EditorConfig**

一个通用的配置文件格式，用于定义代码编辑器的格式化规则（如缩进、行尾），被许多编辑器和工具支持

:::

::: tip **个人建议**

用户应将 `.editorconfig` 的设置转移到 `.prettierrc`，统一使用 Prettier 的配置，丢弃 `.editorconfig`。

:::

## 可共享的 Prettier 配置文件

通过创建一个可共享的 Prettier 配置文件（作为一个 npm 包），在多个项目中复用相同的格式化选项。避免在每个项目中复制粘贴相同的 `.prettierrc` 配置，提高效率和一致性。

### 创建共享配置

**前提条件**

- 在 `npmjs.com` 上有账户以发布包。
- 了解如何创建 Node.js 模块的基本知识。

**初始化包**

推荐使用作用域包名，例如 `@username/prettier-config`。创建目录结构：

```bash
prettier-config/
├── index.js
└── package.json
```

`package.json` 示例

```json
{
  "name": "@username/prettier-config",
  "version": "1.0.0",
  "description": "My personal Prettier config",
  "type": "module",
  "exports": "./index.js",
  "license": "MIT",
  "publishConfig": {
    "access": "public"
  },
  "peerDependencies": {
    "prettier": ">=3.0.0"
  }
}
```

`index.js` 示例

```js
const config = {
  trailingComma: "es5",
  tabWidth: 4,
  singleQuote: true,
};
export default config;
```

::: tip **Monorepo**

文件结构如下

```bash
config/
├── packages/
│   ├── prettier-config/          # Prettier 共享配置子包
│   │   ├── index.js             # 配置入口
│   │   └── package.json         # 子包配置
│   └── (其他子包，例如 prettier-config-strict/)
├── package.json                  # 根 package.json
├── .gitignore                    # Git 忽略文件
└── (可选) lerna.json / pnpm-workspace.yaml  # Monorepo 管理工具配置
```

根 `package.json`

```json
{
  "name": "@username/config",
  "version": "1.0.0",
  "private": true,
  "description": "Monorepo for configurations",
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "publish": "npm publish --workspaces"
  },
  "devDependencies": {
    "prettier": ">=3.0.0"
  }
}
```

:::

### 发布共享配置

**登录 npm**

```bash
npm login
```

**导航到包目录**

```bash
cd /config/packages/prettier-config
```

**发布**

```bash
npm publish
```

如果是 **Monorepo** 可以直接运行脚本

```bash
npm run publish
```

**验证**：访问 `https://npmjs.com/package/@username/prettier-config`，确认包为公开包

### 安装并使用共享配置

**安装**

```bash
pnpm add -D @username/prettier-config
```

**引用共享配置**

```json
// package.json
{
  "name": "my-cool-library",
  "version": "1.0.0",
  "prettier": "@username/prettier-config"
}
```

**扩展共享配置**

```js
// .prettierrc.mjs
import usernamePrettierConfig from "@username/prettier-config";

/**
 * @type {import("prettier").Config}
 */
const config = {
  ...usernamePrettierConfig,
  semi: false,
};

export default config;
```

### 使用类型注解

在共享配置中添加 JSDoc 类型注解，提供类型安全和编辑器自动补全支持

```js
/**
 * @type {import("prettier").Config}
 */
const config = {
  trailingComma: "es5",
  tabWidth: 4,
  semi: false,
  singleQuote: true,
};
export default config;
```

修改 `package.json`

```json
{
  "name": "@username/prettier-config",
  "version": "1.0.0",
  "description": "My personal Prettier config",
  "type": "module",
  "exports": "./index.js",
  "license": "MIT",
  "publishConfig": {
    "access": "public"
  },
  "peerDependencies": {
    "prettier": ">=3.0.0"
  },
  "devDependencies": {
    "prettier": "^3.5.2"
  }
}
```

### 在共享配置中包含插件

**index.js：**

```js
const config = {
  singleQuote: true,
  plugins: ["prettier-plugin-xml"],
};
export default config;
```

**package.json：**

```json
{
  "name": "@username/prettier-config",
  "version": "1.0.0",
  "description": "My personal Prettier config",
  "type": "module",
  "exports": "./index.js",
  "license": "MIT",
  "publishConfig": {
    "access": "public"
  },
  "dependencies": {
    "prettier-plugin-xml": "3.4.1"
  },
  "peerDependencies": {
    "prettier": ">=3.0.0"
  }
}
```

::: tip **依赖选择**

插件可放在 `dependencies` 或 `peerDependencies`

- **dependencies**: 插件随配置包安装，版本固定。
- **peerDependencies**: 使用者需单独安装插件，版本灵活。
:::

## 忽略文件 `.prettierignore`

- 在项目根目录创建 `.prettierignore` 文件
- 语法与 `.gitignore` 一致

示例：

```bash
# 忽略构建产物
build
coverage

# 忽略所有HTML文件
**/*.html
```

**默认忽略**：

- 版本控制系统目录（如`.git`, `.svn`, `.hg`）和 `node_modules`。
- 如果存在 `.gitignore` 文件，Prettier 会自动遵循其中的规则。
- 使用 `--with-node-modules` 命令行选项可以取消对 `node_modules` 的忽略。

## 忽略注释 `prettier-ignore`

通过注释 `prettier-ignore` 来跳过部分代码的格式化行为，在不同语言中注释的方式各不相同。

### JavaScript

使用 `// prettier-ignore` ，忽略抽象语法树中的下一个节点。

```js
// 原始代码
matrix(
  1, 0, 0,
  0, 1, 0,
  0, 0, 1
)

// 格式化后
matrix(1, 0, 0, 0, 1, 0, 0, 0, 1);

// prettier-ignore
matrix(
  1, 0, 0,
  0, 1, 0,
  0, 0, 1
)
```

### JSX

使用 `{/* prettier-ignore */}`，忽略后续代码块。

```jsx
<div>
  {/* prettier-ignore */}
  <span     ugly  format=''   />
</div>
```

### HTML

- 使用 `<!-- prettier-ignore -->`，忽略后续代码块。
- 使用 `<!-- prettier-ignore-attribute -->` 忽略所有属性，或 `<!-- prettier-ignore-attribute (属性名) -->` 忽略特定属性。

```html
<!-- prettier-ignore -->
<div         class="x"       >hello world</div            >

<!-- prettier-ignore-attribute -->
<div
  (mousedown)="       onStart    (    )         "
  (mouseup)="         onEnd      (    )         "
></div>

<!-- prettier-ignore-attribute (mouseup) -->
<div
  (mousedown)="onStart()"
  (mouseup)="         onEnd      (    )         "
></div>
```

### CSS

使用 `/* prettier-ignore */`，忽略后续规则。

```css
/* prettier-ignore */
.my    ugly rule
{

}
```

### Markdown

使用 `<!-- prettier-ignore -->`，忽略后续内容。

```markdown
<!-- prettier-ignore -->
Do   not    format   this
```

::: tip **忽略一段连续内容**

- 使用 `<!-- prettier-ignore-start -->` 和 `<!-- prettier-ignore-end -->` 包裹需要忽略的部分
- 在这两个注释之必须各有一个空行，否则Prettier无法识别
- 常用于保留工具生成的 Markdown 内容格式（如 `all-contributors` 或 `markdown-toc` 生成的表格）

```markdown

<!-- prettier-ignore-start -->
<!-- SOMETHING AUTO-GENERATED BY TOOLS - START -->

| MY | AWESOME | AUTO-GENERATED | TABLE |
|-|-|-|-|
| a | b | c | d |

<!-- SOMETHING AUTO-GENERATED BY TOOLS - END -->
<!-- prettier-ignore-end -->
```

:::

### YAML

使用 `# prettier-ignore`，放在被忽略节点的上方一行。

```yaml
# prettier-ignore
key  : value
hello: world
```

### GraphQL

使用 `# prettier-ignore`，忽略后续查询。

```graphql
{
  # prettier-ignore
  addReaction(input:{superLongInputFieldName:"MDU6SXNzdWUyMzEzOTE1NTE=",content:HOORAY}) {
    reaction {content}
  }
}
```

### **命令行文件模式**

在一次性命令中，使用否定模式排除文件，而无需修改 `.prettierignore`

```bash
prettier . "!**/*.{js,jsx,vue}" --write
```

匹配模式依赖于 [fast-glob](https://github.com/mrmlnc/fast-glob)