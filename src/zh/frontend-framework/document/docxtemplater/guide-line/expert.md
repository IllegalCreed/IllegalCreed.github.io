---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **3.69.0**。深入边界与权衡：免费 vs 商业模块、open-core 授权（MIT/GPLv3）含义、模板结构边界、raw XML 的限制、实例生命周期、与 `docx` / SheetJS 的选型。

## 速查

- 免费核心：docx/pptx 的占位符、循环/条件、表格行循环、raw XML；xlsx、图片、HTML、图表等依赖商业模块
- expressions 适配器免费，但 `angular-expressions` 要单独安装并至少使用 1.5.2
- 3.69.0 能识别同一段内跨多个 run 的普通标签；单个标签的字符不能跨段落/单元格，区块开闭标签可各占一段
- raw XML 标签必须独占段落；它不负责图片关系或商业模块提供的高级表格逻辑
- 每个 Docxtemplater 实例只能 render 一次；每个模块实例也只挂一个文档
- `renderAsync` 只把数据解析阶段 Promise 化；大模板/批量生成仍要用 Worker/任务队列控制 CPU 与内存

## 一、免费边界：算清这条线

docxtemplater 是 **open core（开放核心）**——这是用它前**必须算清**的一件事。

**免费核心 + 免费 expressions 解析器**能做：

- 占位符替换 `{name}`
- 循环 `{#}{/}` 与反向条件 `{^}{/}`
- 表格行循环（标签放进表格行）
- raw XML `{@}`（段落级）
- 自定义分隔符、`nullGetter`
- 点号嵌套、运算、比较、三元、过滤器、`$index`、赋值（expressions 解析器）

**商业模块**（下表为代表性能力；模块清单、套餐和价格以官方 pricing 为准）：

| 模块 | 解决的事 |
|---|---|
| image | 往文档里插入图片 |
| html | 把 HTML 作为富文本插入 |
| chart | 把数据绑定进原生图表 |
| xlsx | 操作 Excel 单元格 |
| slides | PPT 幻灯片复制/拆分 |
| table | 复杂表格（跨行合并/嵌套） |
| styling | 动态样式 |
| footnotes | 脚注 |
| subtemplate | 子模板嵌入 |
| error-location | 错误在模板中的精确定位 |

**经验法则**：纯文本 + 表格行 + 条件 + 表达式的报表/合同 → **免费搞定**；一旦要**插图片 / 插 HTML / 画图表 / 写 xlsx 单元格** → 需对应付费模块。

## 二、授权：MIT 还是 GPLv3

核心库是 **MIT / GPLv3 双许可（dual licensed）**：

- 选 **MIT**：可用于闭源商用，并保留许可与版权声明。
- 选 **GPLv3**：按 GPLv3 的 copyleft 条款履行相应义务。

> 双许可意味着你**可以按 MIT 闭源商用核心库**，不必开源自己的代码。付费的是**功能模块**与商业支持，不是核心本身。

## 三、标签拆成 run：先区分可识别与真边界

Word 常把一段文字按格式拆成多个 `<w:r>`。这并不等于标签必然失效：3.69.0 会在同一段落的文本节点间识别普通标签；本地用 `{na` 与 `me}` 两个不同格式的 TextRun 生成模板，仍能正确渲染 `{name}`。

真正容易产生 `unopened_tag` / `unclosed_tag` 的情况是：

- 单个标签从 `{` 到 `}` 的字符跨越了**不同段落、表格单元格或文本容器**，无法组成同一条可解析文本流。区块的 `{#items}` 与 `{/items}` 是两个完整标签，仍可各占一个段落并包裹中间内容。
- 混入全角花括号、智能标点、不间断空格等不可见字符。
- 区块标签本身不配对，或在表格中跨了不允许的结构层级。

排错时先看 `error.properties.id` 与 `explanation`，再解压 docx 检查 `word/document.xml` 的结构边界；不要仅凭“被拆成 run”就重做模板。

## 四、raw XML 的限制

免费的 `{@rawXml}` 很有用，但有明确边界：

- 它主要在**段落级**工作，适合插入一段段落级的原始 OOXML。
- `{@rawXml}` 必须是所在段落的**唯一文本内容**，不能和普通文字并排。
- 它不会替你创建图片等多部件关系；手写表格 OOXML 虽有可能，但脆弱且不等同于商业 table 模块提供的高级表格逻辑。
- 它**不转义**内容（这正是「raw」的含义），插入非法 XML 会破坏文档。

## 五、性能与稳健

- **缓存原始模板，不缓存可变实例**：可缓存模板 Buffer/ArrayBuffer；每份输出重新创建 PizZip、模块对象与 Docxtemplater。实例第二次 render 会直接报错。
- **分清 I/O 与 CPU**：`renderAsync` 会 resolve Promise 数据，但最终 compile/render 仍同步执行；浏览器用 Worker，服务端用任务队列/Worker 线程并限制并发。
- **错误兜底**：生产环境务必 try/catch 并遍历 `error.properties.errors`，把模板错误转成对用户友好的提示，而不是把 MultiError 直接抛给前端。

## 六、选型：docxtemplater vs docx vs SheetJS

| 维度 | **docxtemplater** | **docx（dolanmiu）** | **SheetJS / ExcelJS** |
|---|---|---|---|
| 范式 | **模板填充** | 编程式构造 | 表格读写 |
| 样式来源 | **模板（Office 里排版）** | 代码 | 数据/代码 |
| 适合 | 已有精美模板、只缺数据 | 完全代码生成 Word | 电子表格数据 |
| 非程序员可维护模板 | **可** | 否 | — |
| 关键能力收费 | **部分模块付费** | 免费 | SheetJS 样式需 Pro |

**怎么选**：

- 有**设计好的 Word/PPT 模板**、只想填后端数据 → **docxtemplater**（最佳场景）。
- 要**用代码从零拼**复杂 Word 结构、不想做模板 → **docx**。
- 主要是**电子表格数据读写** → **SheetJS / ExcelJS**（见同区笔记）。

## 七、免费边界再强调

最后回到那条贯穿全篇的红线：**核心免费、功能模块付费**。

> 立项时先列清楚要用到哪些能力：若出现「插图片 / 插 HTML / 画图表 / 写 xlsx 单元格 / 子模板」，就要核对当前商业模块与授权成本；纯 docx/pptx 文本、表格行、条件和表达式通常可由免费核心 + expressions 解析器完成。

---

回到 [入门](../getting-started) 复习第一次填充，或查 [参考](../reference) 速览标签、选项、错误结构与模块归属。
