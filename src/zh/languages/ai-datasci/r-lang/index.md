---
layout: doc
---

# R 语言

**R** 是一门**专为统计计算与数据分析而生**的编程语言与环境——它的核心数据结构是**数据框（data.frame）**（类似数据库表/Excel 表格），原生内置数百种统计函数（假设检验、回归、方差分析、时间序列），配合 **ggplot2** 的「图形语法」可视化，使其成为**统计学家、生物医学研究者、数据分析师**的首选工具。R 由 Ross Ihaka 和 Robert Gentleman 在 1993 年于新西兰奥克兰大学创建（基于贝尔实验室的 S 语言），名字部分源自两位创始人名字首字母。它是**自由开源软件**（GPL 协议），由 R 基金会维护，依赖 **CRAN**（Comprehensive R Archive Network）仓库的近两万个统计专用包构成生态。与 Python 相比，R 在**统计建模深度、专业统计包、学术出版级图表**上更强；Python 在**通用编程、机器学习/AI、工程化、大数据**上更强——两者是数据科学的双璧，常互补使用。

R 的全部考点围绕**「统计优先的编程范式」**展开：①**数据框为核心**——`data.frame` 是 R 处理表格数据的基础（类似数据库表，每列可以是不同类型），配合 `dplyr` 的管道操作（`df %>% filter() %>% group_by() %>% summarise()`）做数据变换；②**统计分析为核心**——`t.test`/`aov`/`lm`/`glm` 等统计函数原生内置，假设检验、回归分析、方差分析是一等公民，这是 Python（需 SciPy/statsmodels）不如 R 原生的地方；③**ggplot2 可视化**——基于 Leland Wilkinson 的「图形语法」（Grammar of Graphics），用 `ggplot(data) + geom_point() + geom_smooth()` 声明式叠加图层，产出 publication-ready 的学术级图表；④**CRAN 包生态**——近两万个统计专用包（生物信息 Bioconductor、空间分析 sf、时间序列 forecast、贝叶斯 Stan），覆盖统计各细分领域；⑤**与 Python/MATLAB 对比**——R 统计与可视化强但通用编程弱（循环慢、字符串处理弱、Web/系统编程弱），Python 通用且 AI 强，MATLAB 矩阵与工程强。**适用场景**：统计分析、生物医学研究（临床试验、基因组学）、学术出版图表、数据可视化、统计建模——这些「统计味重」的领域 R 仍是首选。

## 评价

**优点**

- **统计计算之王**：原生内置数百种统计函数（假设检验/回归/方差分析/时间序列/贝叶斯），统计建模是一等公民
- **数据框原生支持**：`data.frame` 是核心结构，处理表格数据自然；配合 dplyr 管道操作优雅
- **ggplot2 图形语法**：声明式图层叠加，产出 publication-ready 学术级图表，可视化能力顶级
- **CRAN 专业包生态**：近两万个统计专用包，生物医学（Bioconductor）、空间、时间序列等细分领域覆盖深
- **开源免费**：GPL 协议，跨平台，学术界广泛使用

**缺点**

- **通用编程能力弱**：循环慢（解释执行）、字符串处理/文件 IO/Web/系统编程远不如 Python
- **学习曲线奇特**：语法怪异（`<-` 赋值、向量化的隐式规则、SE vs NSE 求值），编程背景的人不适应
- **工程化弱**：包管理（packrat/renv）、部署、生产化不如 Python 成熟，常用于研究而非生产
- **大数据性能差**：数据载入内存，处理超大数据集不如 Spark/Dask
- **内存模型**：数据全在内存，超大文件需特殊处理（data.table/database）

## 本叶地图

- [入门](./getting-started) —— R 定位、统计为核心的设计、数据框、ggplot2、CRAN 生态、与 Python 对比
- [统计与数据框](./guide-line/statistics-and-dataframe) —— data.frame、dplyr 管道、统计函数（t.test/lm/aov）、CRAN 包
- [ggplot2 与对比](./guide-line/ggplot2-and-comparison) —— 图形语法、图层叠加、与 Python/MATLAB 深度对比
- [参考](./reference) —— R 统计函数速查、ggplot2 图层清单、与 Python（Pandas）对照、易错点

## 幻灯片地址

<a href="/SlideStack/r-lang-slide/" target="_blank">R 语言</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=R" target="_blank" rel="noopener noreferrer">R 语言测试题</a>
