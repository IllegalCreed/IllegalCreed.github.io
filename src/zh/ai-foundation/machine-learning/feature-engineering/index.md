---
layout: doc
---

# 特征工程

特征工程（Feature Engineering）是把原始数据转化为模型能高效利用的特征的过程，业界有一句共识：「数据决定了模型的上限，算法只是逼近这个上限」。它涵盖数值特征处理（缩放/分箱/变换）、类别特征编码（OneHot/Target/Hash 编码）、时间特征提取、文本特征构造、缺失值处理、特征选择（Filter/Wrapper/Embedded）与特征交叉七大主题。核心工具链是 **scikit-learn preprocessing**（StandardScaler/OneHotEncoder/PowerTransformer 等统一 `fit/transform` API）、**feature-engine**（专攻特征工程的 sklearn 兼容库，按列名操作，覆盖编码/填补/分箱/变换/异常值/特征选择全流程）、**category_encoders**（专注类别编码，提供 TargetEncoder/CatBoostEncoder/GLMMEncoder 等监督编码器）。特征工程的工程红线是**防数据泄漏**——所有学习参数（缩放的均值方差、Target 编码的类别均值、填补值）都**只能在训练集上 fit**，再 transform 到测试集；且在交叉验证中必须用 Pipeline 包裹让这些步骤在折内进行。深度学习时代虽减少了手工特征（CNN 自动学图像特征），但**表格数据**上特征工程仍是拉开性能差距的关键，也是模型可解释性的重要来源。

## 评价

**优点**

- **提升性能上限最直接**：好的特征工程常比换算法提升更大，尤其在表格数据上往往是「调特征 > 调模型」
- **降低模型复杂度需求**：用业务知识构造强特征后，简单模型（线性/浅树）也能达到复杂模型的效果，训练快、可解释
- **融入领域知识**：把人类专家的先验知识（如「最近 7 天均值」「价格/销量比」）编码为特征，是机器无法自动学到的
- **改善数值分布**：对偏态分布做对数变换、对异常值做 Winsorizer 截断，让线性模型/神经网络学得更稳
- **处理混合类型数据**：OneHot/Target 编码让类别特征能被数值算法使用，时间特征提取让模型捕捉周期性
- **可解释性来源**：人工构造的特征本身就有业务含义（如「用户活跃度」），比原始字段的黑盒输出更易解释

**缺点**

- **高度依赖领域知识**：没有业务背景很难构造出强特征，自动化特征生成（如 Featuretools）易产生大量噪声特征
- **耗时耗力**：特征工程常占整个 ML 项目 60-80% 时间，是数据科学家最重的劳动
- **易引入数据泄漏**：在全量数据上 fit 缩放器/Target 编码器是经典陷阱，会让评估虚高
- **特征爆炸**：OneHot 高基数类别、PolynomialFeatures、交叉特征会产生成百上千甚至上万维，需配合特征选择
- **泛化性弱**：为某数据集精心构造的特征迁移到新场景往往失效，每个项目几乎要从头做
- **自动化困难**：AutoFE（自动特征工程）研究进展缓慢，目前仍以人工经验为主，难以像模型架构那样标准化

## 文档地址

- [scikit-learn 预处理（preprocessing）](https://scikit-learn.org/stable/modules/preprocessing.html)
- [scikit-learn 缺失值填补（imputation）](https://scikit-learn.org/stable/modules/impute.html)
- [scikit-learn 特征选择（feature_selection）](https://scikit-learn.org/stable/modules/feature_selection.html)
- [feature-engine 官方文档](https://feature-engine.trainindata.com/en/latest/)
- [category_encoders 官方文档](https://contrib.scikit-learn.org/category_encoders/)

## GitHub地址

[scikit-learn/scikit-learn](https://github.com/scikit-learn/scikit-learn)

[feature-engine/feature_engine](https://github.com/feature-engine/feature_engine)

[jc-heo/category_encoders](https://github.com/scikit-learn-contrib/category_encoders)

## 幻灯片地址

<a href="/SlideStack/feature-engineering-slide/" target="_blank">特征工程</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">特征工程测试题</a>
