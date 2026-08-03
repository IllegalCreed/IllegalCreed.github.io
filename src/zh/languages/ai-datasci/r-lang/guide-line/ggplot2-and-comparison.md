---
layout: doc
outline: [2, 3]
---

# ggplot2 与对比：R 的可视化与生态定位

> 基于进阶语言 · 核于 2026-08

## 速查

- **ggplot2**：R 最著名的可视化库，基于 Leland Wilkinson 的「图形语法」（Grammar of Graphics）——把图表分解为数据、几何对象、坐标、刻度等组件，声明式叠加。
- **核心模式**：`ggplot(data, aes(映射)) + geom_几何对象() + 修饰层`——用 `+` 把图层一个个叠加。
- **`aes()` 映射**：把数据列映射到视觉属性（x/y/color/size/shape/alpha/linetype）。
- **`geom_*` 几何对象**：`geom_point`（散点）、`geom_line`（折线）、`geom_bar`（柱状）、`geom_histogram`（直方图）、`geom_boxplot`（箱线图）、`geom_smooth`（拟合线）、`geom_density`（密度图）、`geom_facet`（分面）。
- **图层叠加用 `+`**：先数据映射，再几何对象，再坐标/刻度/主题/标注——「从底到顶」构建图表。
- **分面（facet）**：`facet_wrap(~var)` 按某变量拆成多个子图，对比不同子群体。
- **与 Python 对比**：ggplot2 声明式 + 图层，更优雅一致；matplotlib 命令式，灵活但繁琐；seaborn 是统计图表的高级封装（受 ggplot2 影响）。Python 的 plotnine 是 ggplot2 的直接移植。
- **与 MATLAB 对比**：ggplot2 声明式图层 + 数据映射；MATLAB plot 命令式（plot(x,y)），更直接但扩展性弱。
- **R 占优**：统计可视化、学术出版级图表、统计建模、专业统计包（Bioconductor）。
- **Python 占优**：AI/机器学习、通用编程、大数据、工程化部署。

## 一、ggplot2 的图形语法

ggplot2 的核心理念是「图形语法」——一张图由数据、几何对象、坐标系统、刻度、主题等组件**组合**而成，用 `+` 声明式叠加：

```r
library(ggplot2)

# 基础模式：数据 + 映射 + 几何对象
ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point(size = 3, alpha = 0.7)      # 散点图层

# 叠加多个图层
ggplot(iris, aes(x = Sepal.Length, y = Petal.Length)) +
  geom_point(aes(color = Species), size = 3) +   # 散点（按物种着色）
  geom_smooth(method = "lm", se = TRUE) +        # 线性拟合线（含置信区间）
  labs(title = "花萼 vs 花瓣长度", x = "花萼长度", y = "花瓣长度") +
  theme_minimal()                                 # 极简主题
```

- **`ggplot(data, aes())`**：初始化，定义数据集和默认的视觉映射（aes = aesthetic）。此时还不画图，只设置基底。
- **`+ geom_*()`**：叠加几何对象图层。每个 `geom_*` 决定数据如何可视化（点/线/柱/箱）。
- **`aes()` 内 vs 外**：`aes(color = Species)` 把 Species 映射到颜色（每个物种一种颜色）；`color = "red"`（在 aes 外）则是固定颜色（全部红色）。

## 二、常见几何对象（geom）

```r
# 散点图（探索两变量关系）
ggplot(df, aes(x = age, y = score)) + geom_point()

# 折线图（时间序列）
ggplot(df, aes(x = date, y = value)) + geom_line()

# 柱状图（分类计数）
ggplot(df, aes(x = category)) + geom_bar()

# 直方图（数值分布）
ggplot(df, aes(x = score)) + geom_histogram(bins = 20)

# 箱线图（分组分布对比）
ggplot(df, aes(x = group, y = score, fill = group)) + geom_boxplot()

# 密度图（分布形状）
ggplot(df, aes(x = score, fill = group)) + geom_density(alpha = 0.5)

# 拟合线（趋势 + 置信区间）
ggplot(df, aes(x = age, y = score)) + geom_point() + geom_smooth(method = "lm")
```

- **每种 geom 解决一类问题**：散点看关系、直方图看分布、箱线图看分组分布、拟合线看趋势。
- **`fill` vs `color`**：`color` 是边框/线条/点的颜色，`fill` 是填充色（柱状图的填充、箱线图的内部）。

## 三、分面、坐标与主题

ggplot2 的强大还在于分面（小多图）和灵活的修饰：

```r
# 分面：按 Species 拆成 3 个子图（小多图对比）
ggplot(iris, aes(x = Sepal.Length)) +
  geom_histogram() +
  facet_wrap(~ Species, scales = "free")    # 每个物种一个直方图

# 网格分面（两变量交叉）
ggplot(df, aes(x = x, y = y)) +
  geom_point() +
  facet_grid(group1 ~ group2)               # 行按 group1、列按 group2

# 坐标翻转（横向柱状图）
ggplot(df, aes(x = category)) + geom_bar() + coord_flip()

# 主题
ggplot(df, aes(x, y)) + geom_point() + theme_bw()         # 黑白主题
ggplot(df, aes(x, y)) + geom_point() + theme_minimal()    # 极简主题
```

- **`facet_wrap(~var)`**：按一个变量拆成多个子图（自动排列）——「小多图」（small multiples）是数据对比的利器。
- **`facet_grid(row ~ col)`**：按两个变量交叉拆分（行 × 列网格）。
- **`coord_flip()`**：翻转坐标轴（如横向柱状图，长标签更易读）。

## 四、与 Python 可视化的对比

| 维度 | R ggplot2 | Python matplotlib | Python seaborn |
| --- | --- | --- | --- |
| 范式 | **声明式**（图层叠加） | **命令式**（一步步画） | 高级封装（受 ggplot2 影响） |
| 数据映射 | `aes(color=col)` 自动 | 手动指定颜色 | 类似（`hue=`） |
| 多图层 | `+ geom_*()` 叠加 | `plt.plot` 叠加 | 内置组合 |
| 统计图表 | 原生（`geom_smooth`） | 需手动算 | 内置（`regplot`） |
| 默认美观 | **publication-ready** | 一般（要调） | 较好 |
| 灵活度 | 中（受语法约束） | **高**（完全自由） | 中 |
| 学习曲线 | 中（图形语法） | 高（命令式繁琐） | 低（封装好） |

- **ggplot2 的优势**：声明式 + 数据映射 + 图层，画统计图表极其自然一致，默认美观适合出版。
- **matplotlib 的优势**：命令式完全自由，能画 ggplot2 难画的特殊图（如复杂子图布局、自定义形状）。
- **plotnine**：Python 的 ggplot2 直接移植，语法几乎一致——如果你喜欢 ggplot2 但要用 Python，可用 plotnine。

## 五、与 Python/MATLAB 的整体对比

R、Python、MATLAB 在数据科学领域的定位：

| 维度 | R | Python | MATLAB |
| --- | --- | --- | --- |
| 核心定位 | **统计分析** | 通用 + AI | 矩阵 + 工程 |
| 统计函数 | **原生内置**（数百种） | 需 SciPy/statsmodels | 较少 |
| 数据框 | data.frame + dplyr | **Pandas** DataFrame | table（较弱） |
| 可视化 | **ggplot2 顶级** | matplotlib/seaborn | plot（成熟） |
| 矩阵运算 | 弱（base R 矩阵） | NumPy（强） | **最强**（核心） |
| AI/深度学习 | 弱（keras/torch 包） | **极强**（PyTorch/TensorFlow） | 弱 |
| 工程仿真 | 无 | 较弱 | **Simulink 无替代** |
| 通用编程 | 弱（循环慢） | **强** | 弱（数值专精） |
| 包管理 | CRAN（统一） | PyPI（分散） | Toolbox（付费） |
| 价格 | **开源免费** | **开源免费** | 商业付费 |
| 典型场景 | 统计/生物医学/学术 | AI/数据科学/工程 | 工程/控制/通信 |

- **何时选 R**：统计分析、生物医学研究（临床试验/基因组学）、学术出版图表、贝叶斯统计、生存分析。
- **何时选 Python**：机器学习/AI、数据工程、大数据处理、通用编程、Web 部署。
- **何时选 MATLAB**：控制系统、通信仿真、信号处理、汽车/航空（Simulink）、矩阵密集计算。
- **混合使用**：Python 可通过 rpy2 调 R，R 也可调 Python（reticulate 包）——统计建模用 R，工程化部署用 Python 是常见组合。

## 六、tidyverse：R 的现代数据科学全家桶

tidyverse 是 Hadley Wickham 推动的 R 包集合，共享一致的设计哲学（管道、整洁数据、声明式）：

| 包 | 用途 |
| --- | --- |
| **dplyr** | 数据变换（filter/mutate/group_by/summarise） |
| **ggplot2** | 可视化（图形语法） |
| **tidyr** | 数据整理（长宽格式转换 pivot） |
| **readr** | 高速读写 CSV/TSV |
| **purrr** | 函数式编程（map/reduce，替代循环） |
| **stringr** | 字符串处理 |
| **forcats** | 因子处理 |
| **lubridate** | 日期时间处理 |

- **`library(tidyverse)`** 一次加载上述所有包，是现代 R 数据分析的标准起点。
- **设计哲学**：所有包共享管道 `%>%`、整洁数据（tidy data：每变量一列、每观测一行）、一致的 API 设计。

## 下一步

掌握 ggplot2 与对比后，进入[参考](../reference)速查 R 统计函数、ggplot2 图层、与 Python（Pandas）的对照表和易错点清单。
