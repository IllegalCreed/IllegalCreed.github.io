---
layout: doc
outline: [2, 3]
---

# 统计与数据框：R 的核心

> 基于进阶语言 · 核于 2026-08

## 速查

- **数据框（data.frame）**：R 的核心表格结构，每列可不同类型；`df$col` 取列，`df[i,j]` 索引，`subset()` 筛选。
- **dplyr 管道 `%>%`**：现代 R 数据变换标准——`filter`（筛选）、`mutate`（新增列）、`select`（选列）、`group_by`（分组）、`summarise`（聚合）、`arrange`（排序），用 `%>%` 串联成流水线。
- **统计函数原生内置**：`t.test`（t 检验）、`wilcox.test`（非参数）、`chisq.test`（卡方）、`var.test`（F 检验）、`cor`（相关）、`aov`（方差分析）。
- **回归建模**：`lm(y ~ x, data)` 线性回归、`glm(y ~ x, family)` 广义线性模型（逻辑/泊松）；`summary()` 看结果，`predict()` 预测。
- **公式语法 `y ~ x`**：R 独有的统计模型表示——`y ~ x1 + x2`（多变量）、`y ~ .`（所有变量）、`y ~ x - 1`（无截距）。
- **分布函数**：`rnorm`/`dnorm`/`pnorm`/`qnorm`（生成/密度/累积/分位数），`r/d/p/q` + 分布名是统一命名规律。
- **CRAN 包生态**：`install.packages("pkg")` 安装、`library(pkg)` 加载；近两万个统计专用包。
- **因子（factor）**：分类变量的专用类型（有有序/无序之分），统计建模中自动正确处理分类变量。

## 一、数据框与索引

数据框是 R 处理表格数据的基础，类似数据库表：

```r
# 创建数据框（每列可不同类型）
df <- data.frame(
  id = c(1, 2, 3),
  name = c("Alice", "Bob", "Carol"),
  age = c(25, 30, 35),
  score = c(85.5, 92.0, 78.5),
  stringsAsFactors = FALSE
)

# 索引方式
df$age                    # 取列（$ 语法，最常用）
df[["age"]]               # 取列（等价于 $）
df[, "age"]               # 取列（矩阵式索引）
df[1, ]                   # 取第 1 行
df[1:2, c("name", "age")] # 前 2 行、name 和 age 列
df[df$age > 28, ]         # 筛选年龄大于 28 的行
nrow(df); ncol(df)        # 行数、列数
```

- **`$` 取列最常用**：`df$age` 比 `df[, "age"]` 简洁，自动补全支持好。
- **逻辑筛选**：`df[df$age > 28, ]` 用逻辑向量筛选行——与 MATLAB/NumPy 的逻辑索引一致。

## 二、dplyr：现代数据变换的利器

dplyr 是 tidyverse 生态的核心包，用管道 `%>%` 把数据变换串成清晰的流水线：

```r
library(dplyr)

result <- df %>%
  filter(age > 28, score > 80) %>%              # 筛选行（类似 SQL WHERE）
  mutate(grade = ifelse(score >= 90, "A", "B")) %>%  # 新增列（类似 mutate）
  select(name, age, grade) %>%                  # 选择列
  group_by(grade) %>%                           # 分组（类似 GROUP BY）
  summarise(
    count = n(),                                # 每组计数
    mean_age = mean(age)                        # 每组平均年龄
  ) %>%
  arrange(desc(mean_age))                       # 排序（降序）

# 等价的 SQL：SELECT grade, COUNT(*), AVG(age) FROM ... WHERE ... GROUP BY grade ORDER BY mean_age DESC
```

- **核心动词**：`filter`（筛选行）、`mutate`（新增/修改列）、`select`（选列）、`group_by`（分组）、`summarise`（聚合）、`arrange`（排序）——覆盖 SQL 的核心操作。
- **`%>%` 管道**：把左边的结果作为右边函数的第一个参数——`x %>% f()` 等价于 `f(x)`，`x %>% f() %>% g()` 等价于 `g(f(x))`。让代码从「嵌套调用」变成「从上到下流水线」，可读性大增。
- **vs Pandas**：dplyr 的管道与 Pandas 的链式（`.query().assign().groupby()`）理念相似，但 dplyr 的语法更声明式、更一致。Pandas 有 `.pipe()` 但不如 `%>%` 自然。

## 三、统计函数：R 的杀手锏

R 的统计函数原生内置，无需安装第三方库——这是 Python（要 SciPy/statsmodels）最大的劣势：

```r
# —— 假设检验 ——
t.test(x, y, var.equal = TRUE)        # 两样本 t 检验（均值差异是否显著）
t.test(x, mu = 5)                     # 单样本 t 检验（均值是否等于 5）
t.test(pre, post, paired = TRUE)      # 配对 t 检验（前后对比）

wilcox.test(x, y)                     # 非参数 Wilcoxon 秩和检验
chisq.test(table(x, y))               # 卡方检验（两分类变量是否独立）
var.test(x, y)                        # F 检验（两样本方差是否相等）
cor.test(x, y)                        # 相关性检验（Pearson/Spearman）

# —— 方差分析（ANOVA）——
aov(score ~ group, data = df)         # 单因素方差分析
summary(aov(score ~ group, data = df))  # 看 F 值和 p 值
TukeyHSD(aov(score ~ group, data = df))  # 事后两两比较

# —— 相关性 ——
cor(x, y, method = "pearson")         # Pearson 相关系数
cor(df[, c("age", "score")])          # 相关系数矩阵
```

- **输出适合报告**：`t.test()` 的输出直接包含 t 值、自由度、p 值、置信区间、均值——格式适合学术报告，不像 Python 要手动拼接。
- **`p < 0.05` 判断显著性**：统计检验的核心——p 值小于 0.05 通常认为差异显著（拒绝原假设）。

## 四、回归建模：lm 与 glm

线性回归和广义线性模型是统计建模的核心，R 的 `lm()`/`glm()` 是经典实现：

```r
# 线性回归：score 由 age 和学习时长解释
fit <- lm(score ~ age + study_hours, data = df)
summary(fit)
# 输出：系数（估计值）、标准误、t 值、p 值（每个系数是否显著）
#       R²（拟合优度）、F 统计量（整体显著性）

# 预测
new_data <- data.frame(age = 28, study_hours = 5)
predict(fit, newdata = new_data, interval = "confidence")

# 回归诊断
plot(fit)          # 残差图、QQ 图等（检查模型假设）

# 广义线性模型（逻辑回归）
fit_logistic <- glm(binary_outcome ~ age + score,
                    data = df, family = binomial(link = "logit"))
summary(fit_logistic)
```

- **公式语法 `y ~ x`**：R 独有，简洁表达统计模型。`y ~ x1 + x2`（加性多变量）、`y ~ x1 * x2`（含交互项）、`y ~ .`（用所有变量）、`y ~ x - 1`（移除截距）。
- **`summary()` 是万能查看器**：对 lm/glm/aov 对象，`summary()` 输出完整的统计结果（系数/p 值/R²/F 值）。

## 五、分布函数的命名规律

R 的概率分布函数遵循统一的 `字母 + 分布名` 命名规律：

| 前缀 | 含义 | 示例 |
| --- | --- | --- |
| `r` | random（随机生成） | `rnorm(100)` 生成 100 个正态随机数 |
| `d` | density（概率密度） | `dnorm(0)` 标准正态在 0 处的密度 |
| `p` | probability（累积概率） | `pnorm(1.96)` ≈ 0.975（P(X<=1.96)） |
| `q` | quantile（分位数） | `qnorm(0.975)` ≈ 1.96（97.5% 分位点） |

- **常见分布**：`norm`（正态）、`unif`（均匀）、`binom`（二项）、`pois`（泊松）、`exp`（指数）、`gamma`、`beta`、`t`（学生 t）、`chisq`（卡方）、`f`（F 分布）。
- **记忆**：`r/d/p/q` + 分布名——四个字母覆盖生成、密度、累积、分位四种操作。

## 六、CRAN 包生态与因子

R 的生态由 **CRAN**（Comprehensive R Archive Network）仓库维护，有近两万个统计专用包：

```r
# 安装与加载
install.packages("dplyr")          # 从 CRAN 安装
library(dplyr)                     # 加载到当前会话

# 重要包生态
# - tidyverse：数据科学全家桶（dplyr/ggplot2/tidyr/readr）
# - data.table：大数据高性能表格处理
# - Bioconductor：生物信息学（基因组学/蛋白质组学）
# - caret/mlr3：机器学习框架
# - forecast：时间序列预测
# - sf/sp：空间数据分析
# - rstan/brms：贝叶斯统计（Stan）
# - shiny：交互式 Web 应用（无需 JS）
```

- **因子（factor）**：R 处理分类变量的专用类型——`factor(c("A","B","A"))` 存储 为整数 + 水平标签，统计建模时自动正确处理（如回归的哑变量编码）。有序因子（ordered factor）表示有顺序的分类（如低/中/高）。
- **`stringsAsFactors`**：R 4.0 之前，`data.frame()` 默认把字符串列转成因子（常引发 bug）；R 4.0+ 默认不转换（`FALSE`）。

## 下一步

掌握统计与数据框后，下一步进入[ggplot2 与对比](./ggplot2-and-comparison)——图形语法的图层叠加、典型图表，以及 R 与 Python/MATLAB 的深度对比。
