---
layout: doc
outline: [2, 3]
---

# 入门：Python 定位、语法基础与与 JS 对比

> 基于进阶语言 · 核于 2026-08

## 速查

- **定位**：Python 是**动态类型、解释执行、强制缩进**的通用语言，哲学是「优雅、明确、简单」。AI/数据科学的事实标准（NumPy/Pandas/PyTorch），也是脚本/胶水语言之王。
- **与 JS 最大差异**：①**缩进定义代码块**（无 `{}`），缩进错就 `IndentationError`；②**动态类型 + 强类型**（`1 + "1"` 报 `TypeError`，不像 JS 隐式转换）；③`None` 替代 `null`/`undefined`（Python 只有一个空值）；④`True`/`False` 首字母大写；⑤**列表是数组**（`[1,2,3]`），但 Python 还有**元组（tuple，不可变）**和**集合/字典**。
- **鸭子类型（Duck Typing）**：「不关心它是什么，只关心它能做什么」——`len(x)` 只要 `x` 实现了 `__len__` 就行，不看类型。这是 Python 多态的核心，比接口/继承更灵活。
- **列表推导式（List Comprehension）**：`[x*2 for x in nums if x > 0]`——一行完成 filter+map，是 Python 最具标志性的语法，比 JS 的 `.filter().map()` 更简洁。
- **装饰器（Decorator）**：`@logger` 给函数套一层壳（高阶函数语法糖），`@app.route("/")`/`@torch.no_grad()` 都靠它。本质是 `func = logger(func)`。
- **上下文管理器（`with`）**：`with open(f) as f:` 自动管理资源（进/出时自动开/关），替代 try/finally。PyTorch 的 `with torch.enable_grad():` 也靠它。
- **工具链**：`pip`（装包，类似 npm）、`venv`（隔离环境，类似 node_modules 但要手动建）、`requirements.txt`（类似 package.json 的依赖清单）。
- **GIL**：CPython 的全局解释器锁——多线程无法真并行 CPU 任务（一次只跑一个线程），IO 密集用 asyncio/多线程，CPU 密集用多进程。
- **版本**：Python 2 已于 2020 年停止维护，现在用 **Python 3**（3.12+）。`python` vs `python3` 命令差异是历史包袱。
- **进阶顺序**：[语法精要（给 JS 开发者）](./guide-line/syntax-for-js-devs) → [工具链与 AI 代码阅读](./guide-line/tooling-and-ai) → [参考](./reference)。

## 一、Python 是什么：简洁至上的胶水语言

Python 的设计目标是「让开发者写得快、读得懂」。对比 C/Java 的繁琐，Python 用最少的语法表达最多的意思：

```python
# 读文件并统计行数 —— Python 版
with open("data.txt", encoding="utf-8") as f:
    lines = [line.strip() for line in f if line.strip()]
print(f"共 {len(lines)} 行非空")
```

同样的逻辑用 Java 要 15 行（BufferedReader + try-with-resources + ArrayList + for 循环）。Python 的简洁来自：①**缩进即块**（无 `{}`/`;`）；②**列表推导式**（一行 filter+map）；③**丰富的标准库**（`open` 自带）；④**f-string**（`f"共 {n} 行"`，比拼接字符串优雅）。

Python 的两大定位：①**AI/数据科学的标准语言**——NumPy（数值）、Pandas（表格）、Matplotlib（绘图）、scikit-learn（机器学习）、PyTorch/TensorFlow（深度学习）构成完整栈，几乎所有 AI 论文配套代码都是 Python；②**胶水/脚本语言**——写自动化脚本、运维工具、测试工具，调用 C/C++ 库做集成。对前端开发者，Python 的价值是**「读得懂 AI 代码、跑得通模型、写得来数据处理」**。

## 二、与 JavaScript 的核心语法差异

如果你会 JS，学 Python 最大的障碍不是「学新东西」，而是「**忘掉 JS 的习惯**」：

| 维度 | JavaScript | Python |
| --- | --- | --- |
| 代码块 | `{ }` 花括号 | **缩进**（4 空格，无花括号） |
| 语句结尾 | `;`（可省） | **无分号**（换行即结束） |
| 空值 | `null` + `undefined`（两个） | **`None`**（只有一个） |
| 布尔 | `true` / `false` | **`True` / `False`**（首字母大写） |
| 类型转换 | `1 + "1"` → `"11"`（隐式） | `1 + "1"` → **`TypeError`**（强类型，不转换） |
| 相等 | `==`（隐式）/ `===`（严格） | `==`（值相等，少用）/ **`is`**（同一对象） |
| 数组 | `Array`（可变） | **`list`**（`[1,2,3]`，可变）+ **`tuple`**（`(1,2,3)`，不可变） |
| 对象 | `{key: val}` | **`dict`**（`{"k": v}`，或 `dict(k=v)`） |
| 变量声明 | `let` / `const` / `var` | **直接赋值**（`x = 1`，无声明关键字） |
| this | 函数调用上下文相关 | **`self`**（类方法的第一个参数，必须显式写） |
| 注释 | `//` 单行，`/* */` 多行 | **`#`** 单行，`""" """` 多行（docstring） |

- **缩进是语法**：这是 Python 最容易让 JS 开发者翻车的地方。混用 tab 和空格会报 `TabError`，缩进不一致报 `IndentationError`。**统一用 4 个空格**（PEP 8 规范，编辑器会自动处理）。
- **强类型 vs 弱类型**：JS 是动态类型 + 弱类型（`1 + "1"` 隐式转成 `"11"`）；Python 是**动态类型 + 强类型**（`1 + "1"` 直接报错，不帮你转）。强类型能在运行前暴露更多类型 bug。
- **`None` 不是 `null`**：Python 只有一个空值 `None`（首字母大写）。判断用 `if x is None:`（用 `is` 不用 `==`，因为 `None` 是单例）。

## 三、动态类型与鸭子类型

Python 是**动态类型**——变量没有固定类型，类型跟着值走：

```python
x = 10          # x 现在是 int
x = "hello"     # x 现在是 str（合法！）
x = [1, 2, 3]   # x 现在是 list
```

这和 JS 一样。但 Python 的多态靠**鸭子类型（Duck Typing）**：「如果它走起来像鸭子、叫起来像鸭子，那它就是鸭子」——不检查对象的类型，只检查它有没有需要的方法：

```python
def print_len(obj):
    print(len(obj))     # 只要有 __len__ 方法就行，不管 obj 是什么类型

print_len("abc")        # str，3
print_len([1, 2, 3])    # list，3
print_len({"a": 1})     # dict，1
# print_len(123)        # ❌ int 没有 __len__，运行时 TypeError
```

- **vs Java/TS 的接口**：Java/TS 要先定义 `interface HasLength { length: number }`，对象显式声明实现；Python 不需要——只要运行时有 `__len__` 方法就能传进去，更灵活但**错误延迟到运行时**。
- **type hints（类型注解）**：Python 3.5+ 支持可选的类型标注（`def f(x: int) -> str:`），但**只是提示，运行时不检查**——要用 `mypy` 静态检查。大型项目都加 hints 提升可维护性。

```python
def greet(name: str, times: int = 1) -> str:
    return (f"Hello, {name}! " * times).strip()

names: list[str] = ["Alice", "Bob"]   # 类型注解
```

## 四、核心数据结构：列表、元组、字典、集合

Python 内置四大数据结构，比 JS 丰富（JS 主要靠 Array 和 Object）：

| 类型 | 语法 | 可变？ | 类比 JS | 用途 |
| --- | --- | --- | --- | --- |
| **list（列表）** | `[1, 2, 3]` | 可变 | `Array` | 有序序列，最常用 |
| **tuple（元组）** | `(1, 2, 3)` | **不可变** | 无（const Array 勉强） | 固定结构、函数多返回值、字典键 |
| **dict（字典）** | `{"k": v}` | 可变 | `Object` / `Map` | 键值对，3.7+ 保持插入顺序 |
| **set（集合）** | `{1, 2, 3}` | 可变 | `Set` | 去重、集合运算（交/并/差） |

```python
# 列表（类比 JS Array）
nums = [1, 2, 3]
nums.append(4)          # 尾部添加
nums[0] = 10            # 修改
sliced = nums[1:3]      # 切片 [2, 3]（JS 无原生切片）

# 元组（不可变，常做多返回值）
point = (3, 4)
x, y = point            # 解包（JS 无原生解构但类似）
def min_max(lst):
    return min(lst), max(lst)   # 返回元组
lo, hi = min_max([3, 1, 2])     # 解包接收

# 字典（类比 JS Object/Map）
person = {"name": "Alice", "age": 30}
person["email"] = "a@b.com"     # 添加
for k, v in person.items():      # 遍历键值对
    print(k, v)

# 集合（去重神器）
unique = set([1, 1, 2, 3, 3])   # {1, 2, 3}
```

- **元组为什么存在**：①不可变更安全（做字典键、函数参数）；②多返回值（`return a, b` 本质返回元组）；③解包语法（`x, y = point`）让代码简洁。
- **切片 `[start:stop:step]`**：`nums[1:3]` 取索引 1-2（不含 3）；`nums[::-1]` 反转列表；`nums[::2]` 每隔一个取。这是 Python 处理序列的利器，JS 要用 `.slice()` 但无 step。

## 五、列表推导式：Python 的标志性语法

列表推导式（List Comprehension）用一行完成「过滤 + 变换」，是 Python 最优雅的特性：

```python
nums = [1, -2, 3, -4, 5]

# JS 写法：nums.filter(x => x > 0).map(x => x * 2)
# Python 列表推导式：
doubled_pos = [x * 2 for x in nums if x > 0]   # [2, 6, 10]

# 嵌套循环（扁平化二维列表）
matrix = [[1, 2], [3, 4]]
flat = [n for row in matrix for n in row]       # [1, 2, 3, 4]

# 字典推导式 / 集合推导式
squares = {x: x**2 for x in range(5)}           # {0:0, 1:1, 2:4, ...}
unique_len = {len(w) for w in ["a", "bb", "a"]} # {1, 2}
```

- **语法**：`[表达式 for 变量 in 可迭代对象 if 条件]`——读作「对每个 x，满足条件就放入表达式结果」。
- **生成器表达式**：把 `[]` 换成 `()` 变成惰性求值（不立即生成列表，节省内存）：`(x*2 for x in nums)`。处理大数据时用生成器避免 OOM。
- **何时别用**：逻辑太复杂（多层嵌套 + 多条件）时，可读性反而差，不如老老实实写 for 循环。

## 下一步

理解了 Python 的定位和与 JS 的核心差异后，下一步深入两个主题——[语法精要（给 JS 开发者）](./guide-line/syntax-for-js-devs)（装饰器、上下文管理器、asyncio 异步）与[工具链与 AI 代码阅读](./guide-line/tooling-and-ai)（pip/venv 依赖管理、读懂 PyTorch/Pandas 代码）。
