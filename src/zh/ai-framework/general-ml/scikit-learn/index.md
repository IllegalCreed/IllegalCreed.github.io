---
layout: doc
---

# scikit-learn

scikit-learn 是基于 NumPy/SciPy 的 Python 机器学习库，定位于**传统（非深度学习）机器学习的算法与工程化工具集**。它的核心不是某一类算法，而是**统一的 Estimator API**：所有模型——分类器、回归器、聚类器、预处理变换器——都遵循同一套契约：构造时传超参 `Estimator(param=...)`，训练用 `fit(X, y)`，预测用 `predict(X)`，变换用 `transform(X)`，评分用 `score(X, y)`，参数读写用 `get_params()` / `set_params()`。这种一致性使任意模型都能装进 **Pipeline**（串联预处理 + 模型，防止交叉验证时的数据泄漏）和 **ColumnTransformer**（对异构列做差异化预处理：数值列标准化、类别列独热编码，并行拼接送入下游），并统一接受 **GridSearchCV / RandomizedSearchCV** 的超参搜索。围绕这套约定，sklearn 还提供 ensemble（RandomForest、GradientBoosting、受 LightGBM 启发的 **HistGradientBoosting**）、calibration（概率校准）、model_selection（交叉验证、successive halving）、preprocessing、decomposition、cluster 等十几个模块。它是 Python 数据栈（pandas + NumPy + sklearn）的事实标准，与「AI 基础」章讲算法原理不同，本叶聚焦 **sklearn 工具 API 与工程化实践**。截至 2026 年 7 月，稳定版为 **1.9.0**（2026 年 6 月发布），开发版 1.10。信源 scikit-learn.org/stable/ 官方文档。

## 评价

**优点**

- **统一的 Estimator API**：所有模型 fit/predict/transform/score 同构，换模型只改一行 import，学习与迁移成本极低
- **Pipeline + ColumnTransformer 工程化**：把预处理到建模封装为单一可序列化对象，天然防数据泄漏，CV 时自动正确处理
- **超参搜索完整**：GridSearchCV / RandomizedSearchCV / HalvingGridSearchCV（successive halving，快得多）覆盖从穷举到高效的搜索策略
- **HistGradientBoosting 性能强**：直方图梯度提升受 LightGBM 启发，原生支持缺失值与类别特征，大数据集上比原版 GradientBoosting 快一个数量级
- **生态零摩擦**：与 NumPy / SciPy / pandas / joblib 深度集成，模型可 joblib.dump 序列化，与 Jupyter / scikit-learn-compatible 生态（imbalanced-learn、category-encoders 等）无缝
- **文档与示例业界标杆**：每个算法都有「User Guide + 参数表 + 可运行示例」三件套，文档质量是 Python 库的范本

**缺点**

- **深度学习缺位**：不提供神经网络（MLPClassifier 仅浅层），LLM/CV/Audio 深度模型需转 PyTorch；skorch 等桥接只是补丁
- **单机内存瓶颈**：fit 需把全部数据装入内存，超大规模数据要靠 partial_fit 增量学习或转 Spark/Dask
- **GPU 不能用**：除实验性 Array API 后端外，sklearn 本体跑在 CPU；要 GPU 加速需 cuML/RAPIDS
- **部分先进算法落后于社区**：如类别编码不如 category-encoders 全、梯度提升不如 LightGBM/XGBoost 的工程化细节多（HistGB 弥补了大部分但非全部）
- **HalvingSearchCV 仍实验性**：需 `from sklearn.experimental import enable_halving_search_cv` 显式开启，API 可能变

## 文档地址

- [scikit-learn 官方文档（stable）](https://scikit-learn.org/stable/)
- [User Guide（按主题分章）](https://scikit-learn.org/stable/user_guide.html)
- [API Reference（按模块）](https://scikit-learn.org/stable/modules/classes.html)
- [Combining Estimators（Pipeline/ColumnTransformer/FeatureUnion）](https://scikit-learn.org/stable/modules/compose.html)
- [Tuning the hyper-parameters（GridSearch/HalvingSearch）](https://scikit-learn.org/stable/modules/grid_search.html)

## GitHub地址

[scikit-learn/scikit-learn](https://github.com/scikit-learn/scikit-learn)

## 幻灯片地址

<a href="/SlideStack/scikit-learn-slide/" target="_blank">scikit-learn</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=scikit-learn" target="_blank" rel="noopener noreferrer">scikit-learn 测试题</a>
