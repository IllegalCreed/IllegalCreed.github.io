---
layout: doc
outline: [2, 3]
---

# 选择类控件

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- `<select>` + `<option>`：下拉单选；`<option>` 的 `value` 是提交值，省略则提交其文本内容
- `<option selected>` 预选；不写则默认选中第一个；`<optgroup label="…">` 给选项分组
- `<select multiple>` 变成可多选列表框，`size` 控制可见行数；多选提交为 `name=a&name=b`
- `<datalist>` + 输入框 `list` 属性：给输入框加**建议项**，但**不限制**只能选这些（与 `select` 的本质区别）
- `<textarea>`：多行文本；**初始值写在标签之间**，没有 `value` 属性；`rows` / `cols` 定尺寸
- `<button type="submit|reset|button">`：比 `<input>` 按钮更灵活，内容可含图标 / 富文本
- `<output>`：展示计算结果，是 `aria-live` 实时区域；**不随表单提交**
- `<meter>`：已知范围内的测量值（仪表盘），用 `value` / `min` / `max` / `low` / `high` / `optimum`
- `<progress>`：任务完成进度；有 `value` 为确定进度，省略为不确定（滚动动画）

## `<select>`：下拉选择

`<select>` 提供一个选项菜单，每个选项是一个 `<option>`：

```html
<label for="pet">选择宠物</label>
<select id="pet" name="pet" required>
  <option value="">请选择</option>
  <option value="dog">狗</option>
  <option value="cat" selected>猫</option>
  <option value="fish" disabled>鱼（暂缺）</option>
</select>
```

要点：

- `<option>` 的 **`value`** 是提交到服务器的值；**若省略 `value`，则提交该选项的文本内容**；
- `selected` 让某项默认选中；**若没有任何 `selected`，浏览器默认选中第一个 `<option>`**——所以「请选择」这种占位项常放第一个并给空 `value`，配合 `required` 强制用户真正做出选择；
- `disabled` 让某个选项不可选；
- `<select>` 自身可用 `name`（提交字段名）、`required`（必选）、`disabled`、`form`、`autocomplete`、`autofocus`。

### `<optgroup>` 分组

选项多时用 `<optgroup>` 按类目分组，`label` 是组标题（加粗、选项缩进）：

```html
<select name="food">
  <optgroup label="水果">
    <option value="apple">苹果</option>
    <option value="banana">香蕉</option>
  </optgroup>
  <optgroup label="蔬菜">
    <option value="broccoli">西兰花</option>
  </optgroup>
</select>
```

`<optgroup>` 也支持 `disabled`（禁用整组）。

### 多选：`multiple` + `size`

加上 `multiple` 后，`<select>` 从下拉框变成**可多选的列表框**，`size` 指定可见行数：

```html
<select name="langs" multiple size="4">
  <option value="js">JavaScript</option>
  <option value="ts">TypeScript</option>
  <option value="py">Python</option>
</select>
```

用户按住 Ctrl / Cmd 或 Shift 多选；多选结果提交为 `langs=js&langs=ts` 这样的重复 `name`。

::: tip select 难以样式化？
`<select>` 历来很难用 CSS 美化。早期手段有限（盒模型、字体、`appearance` 去掉系统外观）。近年新增的**可定制 select**（customizable select）配合 `appearance: base-select`、`:open` 伪类、`field-sizing` 等，正在让原生下拉更可控——但属较新能力，跨浏览器前先查 Baseline，必要时仍以渐进增强方式使用。
:::

## `<datalist>`：输入建议而非限制

`<datalist>` 给一个普通输入框附上一组**建议项**：输入框用 `list` 属性指向 `<datalist>` 的 `id`：

```html
<label for="flavor">口味</label>
<input list="flavors" id="flavor" name="flavor" />
<datalist id="flavors">
  <option value="巧克力"></option>
  <option value="香草"></option>
  <option value="草莓"></option>
</datalist>
```

它与 `<select>` 的**本质区别**：

| | `<datalist>` | `<select>` |
| --- | --- | --- |
| 角色 | 给某个输入框提供建议 | 它本身就是控件 |
| 限制取值 | **不限制**，用户仍可输入列表外的任何值 | 只能选预设选项 |
| 适用 | 「常见值 + 允许自定义」（如城市、标签） | 「必须从固定集合里选」 |

支持 `list` 的输入类型有：`text` / `search` / `url` / `tel` / `email` / `number` / `range`（显示为刻度）/ `color` / 以及各 `date` 时间类型——并非全部类型都支持。

## `<textarea>`：多行文本

`<textarea>` 是多行纯文本编辑控件，和 `<input>` 有两点关键不同：**它能换行**，且**初始值写在开闭标签之间**（没有 `value` 属性）：

```html
<label for="msg">留言</label>
<textarea id="msg" name="msg" rows="5" cols="40" maxlength="500" placeholder="说点什么…">
默认内容写在这里
</textarea>
```

常用属性：

- `rows` / `cols`：可见行数（默认 2）/ 列宽字符数（默认 20）；视觉尺寸更推荐用 CSS 控制；
- `maxlength` / `minlength`：长度限制；`required`、`readonly`、`disabled`、`placeholder`、`name`、`autocomplete`、`spellcheck`；
- `wrap`：换行提交方式——`soft`（默认，不插入换行）、`hard`（按宽度自动插入换行，需配 `cols`）、`off`（不换行、横向滚动）。

用 CSS `resize: none` 可禁止用户拖拽改变大小（默认可调）。脚本里用 `.value` 读写当前内容、`.defaultValue` 读初始内容。

## `<button>`：比 `<input>` 按钮更灵活

`<button>` 是更现代的按钮元素，**内容区可放图标、富文本**，比 `<input type="submit">` 灵活得多。它的 `type` 有三个值：

```html
<button type="submit">提交</button>  <!-- 提交表单（也是默认值） -->
<button type="reset">重置</button>    <!-- 重置为初始值 -->
<button type="button">展开更多</button> <!-- 无默认行为，靠 JS -->
```

::: warning 表单里务必写明 button 的 type
`<button>` 在 `<form>` 内若**不写 `type`，默认就是 `submit`**——一个本想用作「展开 / 切换」的按钮会意外提交整个表单。**养成永远显式写 `type` 的习惯。**
:::

## `<output>`：展示计算结果

`<output>` 用于显示由用户操作或脚本计算得出的结果。它是 `aria-live` 实时区域，内容变化时辅助技术会自动播报，无需移动焦点：

```html
<form>
  <input type="range" id="a" name="a" value="50" /> +
  <input type="number" id="b" name="b" value="10" /> =
  <output name="sum" for="a b">60</output>
</form>
```

```js
const form = document.querySelector("form");
form.addEventListener("input", () => {
  form.sum.value = form.a.valueAsNumber + form.b.valueAsNumber;
});
```

- `for`：空格分隔的、参与计算的控件 `id` 列表（语义关联）；
- `name` / `form` 也支持，但 **`<output>` 的内容不会随表单提交**——它纯粹用于展示。

## `<meter>` 与 `<progress>`：两种「条」

这两个看起来都是「一条」，但语义完全不同：

```html
<!-- meter：已知范围内的「测量值」，像仪表盘 -->
<label for="disk">磁盘占用</label>
<meter id="disk" min="0" max="100" low="33" high="66" optimum="20" value="82">82%</meter>

<!-- progress：任务「完成进度」 -->
<label for="dl">下载进度</label>
<progress id="dl" max="100" value="40">40%</progress>
```

| | `<meter>` | `<progress>` |
| --- | --- | --- |
| 表达 | 已知范围内的**测量值**（仪表） | 任务的**完成进度** |
| 属性 | `value` / `min`（默认0）/ `max`（默认1）/ `low` / `high` / `optimum` | `value` / `max`（默认1） |
| 典型 | 磁盘占用、电量、温度、评分 | 文件下载、表单步骤、安装进度 |
| 缺省值 | 必须给 `value` | 省略 `value` → 不确定进度（动画） |

`<meter>` 的 `low` / `high` / `optimum` 让浏览器据「当前值落在低 / 中 / 高哪段、离最优值远近」给出不同颜色（如磁盘快满时变红）。

::: tip 别拿 meter 当进度条
`<meter>` 表示「一个值在范围中的位置」，不表示「进展」。下载进度、安装进度请用 `<progress>`；磁盘占用、电池电量这类「静态测量」才用 `<meter>`。
:::

## 小结

`<select>` / `<datalist>` / `<textarea>` 是 `<input>` 之外的主力采集控件，`<output>` / `<meter>` / `<progress>` 则负责展示结果与状态。控件齐了，下一页进入表单最有价值的一环——浏览器内置的 [约束校验](./constraint-validation)。
