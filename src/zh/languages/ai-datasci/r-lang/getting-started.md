---
layout: doc
outline: [2, 3]
---

# 入门：R 定位、统计为核心与数据框

> 基于进阶语言 · 核于 2026-08

## 速查

- **定位**：R 是**专为统计计算与数据分析而生**的语言，核心是统计建模与可视化。开源免费（GPL），由新西兰奥克兰大学的 Ross Ihaka 和 Robert Gentleman 于 1993 年创建（基于 S 语言）。
- **核心思想「统计是一等公民」**：假设检验（`t.test`）、回归（`lm`/`glm`）、方差分析（`aov`）、时间序列等统计函数原生内置——这是 Python（要 SciPy/statsmodels）不如 R 的地方。
- **数据框（data.frame）是核心结构**：类似数据库表/Excel，每列可以是不同类型（数值/字符/因子）；配合 `dplyr` 的管道（`%>%`）做数据变换。
- **赋值用 `<-`**：R 的赋值是 `x <- 5`（不是 `=`，虽然 `=` 也能用但社区惯例是 `<-`），这是 R 最独特的语法之一。
- **向量化运算**：R 像 MATLAB 一样对向量天然支持向量化（`c(1,2,3) * 2` 得 `c(2,4,6)`），无需循环。
- **ggplot2 图形语法**：`ggplot(data) + geom_point() + geom_smooth()` 声明式叠加图层，产出学术出版级图表，可视化能力顶级。
- **CRAN 生态**：Comprehensive R Archive Network，近两万个统计专用包（生物信息 Bioconductor、空间 sf、时间序列 forecast、贝叶斯 Stan）。
- **与 Python 对比**：R 统计与可视化强但通用编程弱（循环慢、字符串弱）；Python 通用且 AI 强。统计味重的场景选 R，工程化/AI 选 Python。
- **与 MATLAB 对比**：R 以数据框和统计为核心；MATLAB 以矩阵和工程仿真为核心。R 开源，MATLAB 商业付费。
- **进阶顺序**：[统计与数据框](./guide-line/statistics-and-dataframe) → [ggplot2 与对比](./guide-line/ggplot2-and-comparison) → [参考](./reference)。

## 一、R 是什么：统计计算的语言与环境

R 的设计目标是「让统计学家用最自然的方式做数据分析」——它不是通用编程语言，而是**统计领域的专用语言**。从数据载入、清洗、变换、建模、检验到可视化，全在 R 内完成：

```r
# 经典统计分析流程：载入 → 探索 → 建模 → 可视化
data(iris)                          # 内置鸢尾花数据集
summary(iris)                       # 描述性统计（每列的最小/最大/均值/分位数）

model <- lm(Sepal.Length ~ Species, data = iris)   # 线性回归：花萼长度 vs 物种
anova(model)                        # 方差分析表
summary(model)                      # 回归结果（系数/p 值/R²）

library(ggplot2)
ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point() +                    # 散点图层
  geom_smooth(method = "lm")        # 拟合线层
```

同样的流程用 Python 要导入 pandas + scipy.stats + statsmodels + matplotlib/seaborn 四五个库，R 是原生的。R 的价值在于**统计建模与可视化的原生深度**——假设检验、回归诊断、生存分析、贝叶斯推断，这些在 R 里是一行函数调用，且输出格式直接适合学术报告。

R 的两大定位：①**统计分析的标准工具**——统计学家、生物医学研究者（临床试验、基因组学）、社会科学家的首选；②**数据可视化的标杆**——ggplot2 的图形语法影响了 Python 的 plotnine、seaborn 等库的设计。对开发者而言，理解 R 的价值是**「掌握统计建模思维、产出 publication-ready 图表」**。

## 二、统计是一等公民：R 的核心设计

R 与通用语言（Python/JS）最大的区别是**统计函数原生内置**，无需安装第三方库：

```r
# 假设检验（Python 要 SciPy，R 原生）
t.test(x, y)                 # 两样本 t 检验（均值差异）
wilcox.test(x, y)            # 非参数 Wilcoxon 检验
chisq.test(table)            # 卡方检验（独立性）
var.test(x, y)               # F 检验（方差齐性）

# 回归分析（Python 要 statsmodels，R 原生）
fit <- lm(y ~ x1 + x2, data = df)   # 线性回归
glm(y ~ x, family = binomial, data = df)   # 逻辑回归
summary(fit)                          # 系数/标准误/t 值/p 值/R²

# 方差分析
aov(y ~ group, data = df)    # 单因素方差分析
TukeyHSD(aov(...))           # 事后多重比较

# 分布与抽样
rnorm(100, mean = 0, sd = 1) # 生成 100 个正态分布随机数
pnorm(1.96)                  # 累积概率（P(X <= 1.96)）
qnorm(0.975)                 # 分位数（97.5% 分位点 ≈ 1.96）
```

- **统计函数返回完整对象**：`lm()` 返回的模型对象含系数、残差、R²、拟合值等，可用 `summary()`/`predict()`/`plot()` 进一步分析，设计上为统计工作流优化。
- **公式语法 `y ~ x`**：R 独有的统计公式表示法，`y ~ x1 + x2` 表示 y 由 x1、x2 解释，`y ~ .` 表示用所有其他变量——简洁地表达统计模型。

## 三、数据框：R 的核心数据结构

数据框（data.frame）是 R 处理表格数据的基础，类似数据库表或 Excel 表格——每列可以是不同类型（数值/字符/因子/逻辑），每行是一个观测：

```r
# 创建数据框
df <- data.frame(
  name = c("Alice", "Bob", "Carol"),
  age = c(25, 30, 35),
  city = c("NYC", "LA", "SF"),
  stringsAsFactors = FALSE
)

# 基本操作
df$age                        # 取列（$ 语法）
df[1, ]                       # 取第 1 行
df[, "age"]                   # 取 age 列
df[df$age > 28, ]             # 筛选年龄大于 28 的行
subset(df, age > 28, select = c(name, city))   # subset 函数

# 用 dplyr 管道（现代 R 数据变换的标准）
library(dplyr)
result <- df %>%
  filter(age > 28) %>%                    # 筛选
  mutate(age_group = ifelse(age > 32, "old", "mid")) %>%  # 新增列
  group_by(city) %>%                      # 分组
  summarise(mean_age = mean(age))         # 聚合
```

- **`$` 取列**：`df$age` 取名为 age 的列（类似 Python 的 `df.age` 或 `df["age"]`）。
- **`[行, 列]` 索引**：`df[1,2]` 取第 1 行第 2 列；`df[1,]` 取第 1 行全部列；`df[, "age"]` 取 age 列全部行。
- **dplyr 管道 `%>%`**：现代 R 的数据变换主力——把多个操作用管道串联，从上到下读像流水线，比嵌套函数调用清晰（`f(g(h(x)))` → `x %>% h() %>% g() %>% f()`）。

## 四、赋值与向量化：R 的独特语法

R 有几个让其他语言背景开发者意外的语法：

```r
# 赋值用 <-（箭头），不是 =（虽然 = 也能用）
x <- 5                        # 推荐写法（社区惯例）
y = 5                         # 合法但不推荐（易与函数参数 == 混淆）

# 向量化（类似 MATLAB/NumPy）
v <- c(1, 2, 3, 4, 5)         # c() 合并向量
v * 2                         # c(2, 4, 6, 8, 10)（每个元素乘 2）
v > 2                         # c(FALSE, FALSE, TRUE, TRUE, TRUE)（逻辑向量）
v[v > 2]                      # c(3, 4, 5)（逻辑索引筛选）
sum(v)                        # 15

# 向量循环（recycling）
c(1, 2, 3) + c(1, 2)          # c(2, 4, 4)：短的循环复用（3 个 + 2 个）

# 注释用 #（与 Python 一样）
# 这是注释
```

- **`<-` 赋值**：R 社区强烈推荐用 `<-` 而非 `=`（虽然两者在多数场景等价）。`=` 在函数参数传递时易混淆，`<-` 明确表示赋值。这是 R 最显眼的语法特征。
- **`c()` 函数**：combine，合并元素成向量——R 最基础的函数。
- **向量化**：R 像 MATLAB/NumPy 一样原生支持向量化运算，`v * 2` 不需循环。向量化是 R 性能的关键。
- **循环回收（recycling）**：两个向量运算时，短的会自动循环复用以匹配长的（`c(1,2,3) + c(1,2)` = `c(1,2,3) + c(1,2,1)`），有时方便有时易错。

## 五、ggplot2：图形语法的威力

ggplot2 是 R 最著名的可视化库，基于 Leland Wilkinson 的「图形语法」（Grammar of Graphics）——把图表分解为数据、几何对象、坐标、刻度等组件，声明式叠加：

```r
library(ggplot2)
ggplot(iris, aes(x = Sepal.Length, y = Petal.Length, color = Species)) +
  geom_point(size = 3) +              # 散点图层
  geom_smooth(method = "lm") +        # 拟合线
  labs(title = "花萼 vs 花瓣长度", x = "花萼长度", y = "花瓣长度") +
  theme_minimal()                     # 主题
```

- **`+` 叠加图层**：ggplot2 用 `+` 把图层、刻度、主题一个个叠加——这是「图形语法」的核心：先定义数据映射（aes），再加几何对象（geom_*），再加修饰。
- **`aes()` 映射**：把数据列映射到视觉属性（x/y/color/size/shape）。
- **geom_* 几何对象**：`geom_point`（散点）、`geom_line`（折线）、`geom_bar`（柱状）、`geom_histogram`（直方图）、`geom_boxplot`（箱线图）、`geom_smooth`（拟合线）。
- **产出学术级图表**：ggplot2 默认美观，稍加调整即可达到学术出版标准，是 R 在可视化上碾压 Python（matplotlib）的利器。

## 六、与 Python/MATLAB 的对比

R、Python、MATLAB 是数据科学/科学计算的三大语言，定位互补：

| 维度 | R | Python | MATLAB |
| --- | --- | --- | --- |
| 核心定位 | **统计分析** | 通用 + AI | 矩阵 + 工程 |
| 数据结构 | data.frame | DataFrame（Pandas） | 矩阵 |
| 统计函数 | **原生内置** | 需 SciPy/statsmodels | 较少 |
| 可视化 | **ggplot2 顶级** | matplotlib/seaborn | plot（成熟） |
| AI/深度学习 | 弱 | **极强**（PyTorch） | 弱 |
| 通用编程 | 弱（循环慢） | **强** | 弱（数值专精） |
| 价格 | **开源免费** | **开源免费** | 商业付费 |
| 典型用户 | 统计学家/生物医学 | 数据科学家/AI 工程师 | 工程师 |

- **R 占优**：统计建模深度、专业统计包（生物医学 Bioconductor）、ggplot2 可视化、学术出版图表。
- **Python 占优**：AI/机器学习、通用编程、工程化、大数据、社区规模。
- **MATLAB 占优**：矩阵/工程仿真、Simulink、控制/通信工具箱。

## 下一步

理解了 R 的统计优先范式后，下一步深入两个主题——[统计与数据框](./guide-line/statistics-and-dataframe)（dplyr 管道、统计函数、CRAN 包）与[ggplot2 与对比](./guide-line/ggplot2-and-comparison)（图形语法、图层叠加、与 Python/MATLAB 深度对比）。
