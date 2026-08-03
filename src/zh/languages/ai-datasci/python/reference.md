---
layout: doc
outline: [2, 3]
---

# 参考：Python 概念速查、与 JS 差异表、易错点

> 基于进阶语言 · 核于 2026-08

## 速查

- **定位**：动态类型、解释执行、强制缩进的通用语言，AI/数据科学事实标准。
- **四大内置结构**：list（可变序列）、tuple（不可变序列）、dict（键值对）、set（去重集合）。
- **鸭子类型**：不查类型只查方法（有 `__len__` 就能 `len()`），错误延迟到运行时。
- **装饰器**：`@x` 是高阶函数语法糖（`func = x(func)`），用于日志/路由/缓存/权限。
- **上下文管理器**：`with` 自动管理资源进/出（`__enter__`/`__exit__`），即使抛异常也清理。
- **GIL**：CPython 全局锁，多线程无法真并行 CPU 任务，用多进程绕开。
- **工具链**：pip（装包）+ venv（隔离环境，手动激活）+ requirements.txt（清单）；现代用 uv/poetry。
- **与 JS 核心差异**：缩进（非 `{}`）、`None`（无 undefined）、强类型（`1+"1"` 报错）、`True/False`（大写）、`self`（显式）。

## 一、Python 与 JavaScript 语法差异全表

| 维度 | JavaScript | Python | 备注 |
| --- | --- | --- | --- |
| 代码块 | `{ }` | **缩进**（4 空格） | Python 缩进错即语法错 |
| 语句结尾 | `;`（可省） | 无分号 | 换行即结束 |
| 空值 | `null` / `undefined` | **`None`** | Python 只有一个空值 |
| 布尔 | `true`/`false` | **`True`/`False`** | Python 首字母大写 |
| 类型转换 | 弱（`1+"1"→"11"`） | **强**（`1+"1"`→TypeError） | Python 不隐式转换 |
| 相等 | `==`/`===` | `==`/`is` | Python `is` 判同一对象 |
| 数组 | `Array` | **`list`** + **`tuple`** | Python 多了不可变元组 |
| 对象 | `{k:v}` | **`dict`** | Python 字典保序（3.7+） |
| 变量声明 | `let`/`const` | 直接赋值 | Python 无声明关键字 |
| this/self | `this`（隐式） | **`self`**（显式首参） | Python 要手写 self |
| 注释 | `//` `/* */` | `#` `""" """` | Python 无多行注释符 |
| 字符串模板 | `` `${x}` `` | **f`{x}``** | f-string（3.6+） |
| 箭头函数 | `(x)=>x*2` | `lambda x: x*2` | lambda 只能单表达式 |
| 异步 | `async`/`await` | `async`/`await` | Python 需 `asyncio.run()` |
| 导出导入 | `export`/`import` | 无（用模块文件） | Python 模块即文件 |

## 二、四大数据结构对比

| 类型 | 语法 | 可变 | 类比 JS | 常用操作 |
| --- | --- | --- | --- | --- |
| `list` | `[1,2,3]` | 是 | Array | `.append()` `.pop()` `[1:3]` 切片 |
| `tuple` | `(1,2,3)` | 否 | 无 | 解包 `x,y=p`、做字典键 |
| `dict` | `{"k":v}` | 是 | Object/Map | `.items()` `.keys()` `d[k]` |
| `set` | `{1,2,3}` | 是 | Set | 去重、`&` 交 `\|` 并 `-` 差 |

## 三、常用内置函数

| 函数 | 作用 | 类比 JS |
| --- | --- | --- |
| `len(x)` | 长度（list/str/dict） | `.length` |
| `range(n)` | 0 到 n-1 序列 | `Array(n).keys()` |
| `enumerate(lst)` | 带索引遍历 | 手动 `i++` |
| `zip(a,b)` | 并行遍历多序列 | 无原生 |
| `map(fn,lst)`/`filter` | 映射/过滤 | `.map()`/`.filter()` |
| `sorted(lst,key=)` | 排序（返回新） | `.sort()`（原地） |
| `sum`/`max`/`min` | 聚合 | `.reduce()` |
| `type(x)`/`isinstance` | 类型查询 | `typeof`/`instanceof` |
| `open(f)` | 打开文件 | `fs.readFile` |
| `print()` | 输出 | `console.log` |

## 四、易错点清单

- **「缩进随便用 tab 或空格」**：错。混用报 `TabError`。统一 4 空格（PEP 8）。编辑器设「tab 转 4 空格」。
- **「`==` 比较值就够了」**：对数字字符串够，但比 `None` 要用 `is None`（`==` 在某些自定义类会被覆写）。比身份（同一对象）用 `is`。
- **「函数默认参数用可变对象没问题」**：**大坑**！`def f(x=[])` 的 `[]` 只在函数定义时创建一次，多次调用共享同一个列表。要用 `None` 哨兵：`def f(x=None): x = x or []`。
- **「多线程能加速 CPU 任务」**：错（GIL）。CPU 密集多线程不快反慢，用 `multiprocessing`。
- **「list 推导式一定比 for 快」**：多数情况略快（C 层优化），但复杂逻辑可读性差，该用 for 就用 for。
- **「`is` 和 `==` 一样」**：错。`==` 比值，`is` 比身份（同一对象）。`a=[1]; b=[1]; a==b` 真（值同），`a is b` 假（不同对象）。小整数缓存（-5 到 256）让 `a=1;b=1;a is b` 恰好真，但这是实现细节别依赖。
- **「没激活 venv 就 pip install」**：装到全局，污染所有项目。先 `source .venv/bin/activate`。
- **「`/` 除法返回 int」**：错。Python 3 的 `/` 总返回 float（`7/2=3.5`），要整除用 `//`（`7//2=3`）。
- **「闭包捕获循环变量没问题」**：**坑**！`funcs=[lambda: i for i in range(3)]`，三个函数都返回 2（捕获的是变量引用不是值）。要 `lambda i=i: i` 默认参数固化。
- **「字符串格式化用 `%` 或 format」**：能用但老。现代用 f-string（`f"{name}"`，3.6+），最简洁最快。
- **「Python 不能做类型检查」**：错。type hints + mypy/pyright 能静态检查，大型项目必加。

## 五、Python 在 AI/数据科学的位置

| 领域 | 核心库 | 用途 |
| --- | --- | --- |
| 数值计算 | **NumPy** | n 维数组、向量化运算（C 层实现，快） |
| 表格数据 | **Pandas** | DataFrame（类 Excel/SQL），清洗变换 |
| 绘图 | **Matplotlib**/seaborn | 折线/柱状/散点图 |
| 机器学习 | **scikit-learn** | 分类/回归/聚类（传统 ML） |
| 深度学习 | **PyTorch**/TensorFlow | 神经网络训练 |
| 数据可视化 | plotly/bokeh | 交互式图表 |
| 大数据 | PySpark/Dask | 分布式计算 |

- **为什么 Python 是 AI 语言**：不是它快（很慢），而是**生态完整 + 语法简洁 + 胶水能力**——研究者用 Python 调底层 C/CUDA（NumPy/TensorFlow 的核心是 C/CUDA），既享受 Python 易用又获得 C 性能。

## 权威链接

- [Python 官方文档](https://docs.python.org/3/)
- [PEP 8 — Python 风格指南](https://peps.python.org/pep-0008/)
- [The Zen of Python（PEP 20）](https://peps.python.org/pep-0020/)
- [Real Python 教程](https://realpython.com/)
- [uv — 极速 Python 包管理器](https://docs.astral.sh/uv/)
- [PyPI — Python 包索引](https://pypi.org/)
- 本站幻灯片：<a href="/SlideStack/python-slide/" target="_blank">Python</a>
