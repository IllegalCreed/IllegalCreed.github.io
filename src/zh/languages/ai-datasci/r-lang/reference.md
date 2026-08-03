---
layout: doc
outline: [2, 3]
---

# 参考：R 速查、ggplot2 图层、与 Python 对照、易错点

> 基于进阶语言 · 核于 2026-08

## 速查

- **定位**：专为统计计算与数据分析而生，开源免费（GPL），统计建模与可视化的事实标准。
- **核心特征**：统计函数原生内置（t.test/lm/aov）、数据框 data.frame、ggplot2 图形语法、`<-` 赋值、CRAN 包生态。
- **赋值**：`<-`（箭头，推荐）或 `=`（合法但不推荐）；`c()` 合并向量。
- **索引**：`df$col`（取列）、`df[i,j]`（行列）、`df[df$col > v, ]`（逻辑筛选）；**从 1 开始**（与 Python 不同）。
- **管道 `%>%`**：`x %>% f()` 等价 `f(x)`，dplyr 数据变换的串联符。
- **ggplot2**：`ggplot(data, aes()) + geom_*()` 声明式图层叠加。
- **公式 `y ~ x`**：统计模型表示法（lm/glm/aov 用）。
- **分布函数**：`r/d/p/q` + 分布名（rnorm/dnorm/pnorm/qnorm）。

## 一、统计函数速查

| 类别 | 函数 | 用途 |
| --- | --- | --- |
| 描述统计 | `mean`/`median`/`sd`/`var` | 均值/中位数/标准差/方差 |
| 分布 | `summary`/`quantile` | 五数概括/分位数 |
| t 检验 | `t.test(x, y)` | 两样本均值差异 |
| t 检验 | `t.test(x, mu=5)` | 单样本均值等于 5 |
| t 检验 | `t.test(pre, post, paired=TRUE)` | 配对检验 |
| 非参数 | `wilcox.test(x, y)` | Wilcoxon 秩和 |
| 卡方 | `chisq.test(table)` | 独立性检验 |
| 方差齐 | `var.test(x, y)` | F 检验 |
| 相关 | `cor(x, y)`/`cor.test` | 相关系数/显著性 |
| 方差分析 | `aov(y ~ group)` | 单因素 ANOVA |
| 事后比较 | `TukeyHSD(aov(...))` | 两两比较 |
| 线性回归 | `lm(y ~ x, data)` | 线性模型 |
| 广义线性 | `glm(y ~ x, family)` | 逻辑/泊松回归 |
| 预测 | `predict(fit, newdata)` | 用模型预测 |
| 生成随机 | `rnorm(100, mean, sd)` | 正态随机数 |
| 密度 | `dnorm(x)` | 概率密度 |
| 累积 | `pnorm(x)` | P(X <= x) |
| 分位 | `qnorm(p)` | p 分位点 |

## 二、数据框与 dplyr 速查

| 操作 | R（base） | R（dplyr） | Python (Pandas) |
| --- | --- | --- | --- |
| 取列 | `df$col` / `df[, "col"]` | `pull(df, col)` | `df["col"]` / `df.col` |
| 筛选行 | `df[df$age>18,]` | `filter(df, age>18)` | `df[df.age>18]` |
| 新增列 | `df$new <- df$a+df$b` | `mutate(df, new=a+b)` | `df["new"]=df.a+df.b` |
| 选列 | `df[, c("a","b")]` | `select(df, a, b)` | `df[["a","b"]]` |
| 分组聚合 | `aggregate(y~g, df, mean)` | `group_by(g) %>% summarise(mean(y))` | `df.groupby("g").mean()` |
| 排序 | `df[order(df$age),]` | `arrange(df, age)` | `df.sort_values("age")` |
| 管道 | `%>%` | `%>%` | `.pipe()` |
| 行数/列数 | `nrow`/`ncol` | `nrow`/`ncol` | `len(df)` / `df.shape` |

## 三、ggplot2 图层速查

```r
# 基础模式
ggplot(data, aes(x=, y=, color=, size=, shape=)) +
  geom_*() +          # 几何对象
  scale_*() +         # 刻度
  coord_*() +         # 坐标
  facet_*() +         # 分面
  labs(title, x, y) + # 标注
  theme_*()           # 主题
```

| 几何对象 | 用途 | 示例 |
| --- | --- | --- |
| `geom_point` | 散点 | `geom_point(aes(color=g))` |
| `geom_line` | 折线 | `geom_line(aes(group=id))` |
| `geom_bar` | 柱状（计数） | `geom_bar()` |
| `geom_col` | 柱状（指定值） | `geom_col(aes(x, y))` |
| `geom_histogram` | 直方图 | `geom_histogram(bins=20)` |
| `geom_boxplot` | 箱线图 | `geom_boxplot(aes(x=g, y=v))` |
| `geom_density` | 密度图 | `geom_density(aes(fill=g))` |
| `geom_smooth` | 拟合线 | `geom_smooth(method="lm")` |
| `geom_abline` | 参考线 | `geom_hline(yintercept=0)` |

| 修饰 | 用途 |
| --- | --- |
| `facet_wrap(~var)` | 按变量分面 |
| `facet_grid(row~col)` | 两变量网格分面 |
| `coord_flip()` | 翻转坐标 |
| `scale_color_manual()` | 自定义颜色 |
| `theme_minimal()`/`theme_bw()` | 主题 |
| `labs(title, x, y)` | 标注 |

## 四、与 Python/MATLAB 对照

| 概念 | R | Python | MATLAB |
| --- | --- | --- | --- |
| 赋值 | `<-` | `=` | `=` |
| 注释 | `#` | `#` | `%` |
| 合并向量 | `c(1,2,3)` | `[1,2,3]`/`np.array` | `[1 2 3]` |
| 索引起点 | **1** | 0 | **1** |
| 数据框 | `data.frame` | Pandas `DataFrame` | `table`（弱） |
| 统计检验 | **原生** `t.test` | `scipy.stats.ttest_ind` | 无原生 |
| 回归 | `lm(y~x)` | `statsmodels`/`sklearn` | `\` 左除 |
| 可视化 | **ggplot2** | matplotlib/seaborn | plot |
| 管道 | `%>%` | `.pipe()` | 无 |
| 价格 | **开源** | **开源** | 商业付费 |

## 五、易错点清单

- **「赋值用 `=` 就行」**：能用但 R 社区强烈推荐 `<-`。`=` 在函数参数列表里易与 `==` 混淆，`<-` 明确表示赋值。这是 R 最显眼的惯例。
- **「R 索引从 0 开始」**：错。R 索引**从 1 开始**（与 Python 不同）。`df[1,]` 是第 1 行，不是第 0 行。
- **「`==` 比较 NA 也行」**：错。`NA == NA` 结果是 `NA`（不是 TRUE），判断 NA 要用 `is.na(x)`。NA 在 R 是特殊的缺失值，任何与 NA 的运算都返回 NA。
- **「因子（factor）就是字符串」**：错。factor 是分类变量（存为整数+水平标签），不是字符串。`data.frame` 在 R 4.0 前默认把字符串转因子（常引发 bug），4.0+ 默认不转。
- **「for 循环和向量化一样快」**：错。R 的 for 循环慢（解释执行），向量化（apply 家族或向量化运算）快。处理大数据用 `*apply` 或向量化。
- **「`c()` 是 concatenate（拼接）」**：不完全是。`c()` 是 combine（合并），把元素合并成向量，是 R 最基础的函数。
- **「管道 `%>%` 是 R 自带的」**：原生 R（4.1+）的 `|>` 才是自带；`%>%` 来自 magrittr/dplyr 包（需 library）。多数 R 代码仍用 `%>%`。
- **「ggplot2 用 `+` 是因为它是数学加法」**：不是。`+` 在 ggplot2 是图层叠加运算符（重载），把新图层加到现有图上，与数学加法无关。
- **「`summary()` 只是看前几行」**：错。对数据框 `summary()` 输出每列的分布统计（min/median/mean/max）；对 lm 对象输出回归结果（系数/p 值/R²）。`head()` 才是看前几行。
- **「R 能高效处理超大数据」**：相对弱。R 默认数据全载入内存，处理超 GB 级数据要特殊工具（data.table 高效、或连数据库）。Spark 有 R 接口（sparklyr）。
- **「R 适合做深度学习」**：弱。虽有 torch/keras 包，但远不如 Python 的 PyTorch/TensorFlow 主流和丰富。深度学习选 Python。

## 六、R 在数据科学领域的定位

| 领域 | R 角色 | 替代可能 |
| --- | --- | --- |
| 统计建模 | **主流**（原生 lm/glm/aov） | Python（statsmodels） |
| 生物医学/基因组学 | **主流**（Bioconductor） | Python（部分） |
| 学术出版可视化 | **主流**（ggplot2） | Python（plotnine/seaborn） |
| 生存分析/贝叶斯 | **主流**（survival/rstan） | Python（部分） |
| 机器学习/AI | 弱 | **Python 主流**（scikit-learn/PyTorch） |
| 大数据工程 | 弱 | Python（Spark/Dask） |
| Web 部署/生产 | 弱（shiny 交互应用） | **Python 主流** |

## 权威链接

- [R 官方网站](https://www.r-project.org/)
- [R 语言官方文档](https://cran.r-project.org/manuals.html)
- [CRAN 包仓库](https://cran.r-project.org/)
- [ggplot2 官方文档](https://ggplot2.tidyverse.org/)
- [R for Data Science（免费在线书）](https://r4ds.had.co.nz/)
- [tidyverse 官网](https://www.tidyverse.org/)
- 本站幻灯片：<a href="/SlideStack/r-lang-slide/" target="_blank">R 语言</a>
