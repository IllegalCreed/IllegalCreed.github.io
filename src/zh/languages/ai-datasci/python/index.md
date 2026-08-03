---
layout: doc
---

# Python

**Python** 是一门**动态类型、解释执行、强缩进**的通用编程语言——它以「**优雅、明确、简单**」（The Zen of Python）为设计哲学，用接近自然语言的语法和「**电池全齐（batteries included）**」的标准库，把开发者从语法细节中解放出来，专注解决问题本身。Python 由 Guido van Rossum 于 1989 年圣诞假期开始设计（1991 年开源），名字来自英国喜剧团体 Monty Python（不是蟒蛇）。今天它是**人工智能、数据科学、科学计算、自动化脚本**的事实标准语言——NumPy/Pandas/scikit-learn/PyTorch/TensorFlow 构成的生态，让 Python 成为「AI 时代的通用语」；同时它在 Web 后端（Django/FastAPI）、运维脚本、测试工具链也无处不在。对前端开发者而言，Python 是**读得懂 AI 论文配套代码、跑得通模型训练脚本、写得来数据处理 pipeline** 的必备第二语言。

Python 的全部考点围绕**「动态语言的工程化」**展开：①**语法基础（给 JS 开发者）**——缩进定义块、动态类型与鸭子类型、列表/字典/元组、列表推导式、装饰器与上下文管理器，这些是与 JS 心智差异最大的部分；②**工具链**——`pip` 安装包、`venv`/`virtualenv` 隔离环境（解决「项目 A 要 NumPy 1.x、项目 B 要 2.x」的依赖冲突，这是 Python 工程最痛的点）；③**异步**——`asyncio` + `async`/`await`（与 JS 的 Promise 类似但有事件循环差异）；④**AI 代码阅读能力**——能看懂 PyTorch 训练循环、Pandas 数据变换、装饰器标注（如 `@app.route`/`@torch.no_grad()`）、上下文管理器（`with torch.enable_grad():`），不必自己从零写，但要理解。**边界**：本叶只讲语言基础与 AI 代码阅读能力，Django/FastAPI 等 Web 框架不在本章（归后端框架章）。

## 评价

**优点**

- **语法简洁可读**：缩进强制代码整齐，接近伪代码，阅读和上手成本极低，适合快速原型与教学
- **生态无敌（AI/数据）**：NumPy/Pandas/scikit-learn/PyTorch/TensorFlow/Matplotlib 构成完整数据科学栈，几乎所有 AI 论文配套代码都是 Python
- **电池全齐的标准库**：os/sys/json/re/itertools/collections/asyncio 开箱即用，写脚本不必装一堆依赖
- **胶水语言**：能轻松调用 C/C++（ctypes/cython）、与其他语言互操作，适合做集成层与自动化
- **跨平台 + 解释执行**：开发→运行反馈快，无需编译，Windows/macOS/Linux 通用

**缺点**

- **运行速度慢**：解释执行 + 动态类型，比 C/Rust 慢 1-2 个数量级（靠 NumPy 调 C 才能做数值计算）
- **动态类型的坑**：无静态类型检查（需用 type hints + mypy 补），重构与大型项目维护成本高，运行时才发现 `AttributeError`
- **GIL（全局解释器锁）**：CPython 多线程不能真并行 CPU 任务，要用多进程或 C 扩展绕开
- **依赖管理混乱**：pip/conda/poetry/uv 多套方案并存，环境隔离（venv）是新手必踩的坑
- **打包分发难**：把 Python 程序打包成可执行文件（PyInstaller）体积大、跨平台问题多，不如 Go 单二进制方便

## 本叶地图

- [入门](./getting-started) —— Python 定位、语法基础（给 JS 开发者）、动态类型与鸭子类型、列表推导式、与 JS 对比
- [语法精要（给 JS 开发者）](./guide-line/syntax-for-js-devs) —— 缩进、装饰器、上下文管理器、列表推导式、asyncio 异步
- [工具链与 AI 代码阅读](./guide-line/tooling-and-ai) —— pip/venv/virtualenv 依赖管理、与 JS 工具链对比、读懂 PyTorch/Pandas 代码
- [参考](./reference) —— Python 核心概念速查、与 JS 差异表、内置函数清单、易错点

## 幻灯片地址

<a href="/SlideStack/python-slide/" target="_blank">Python</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Python" target="_blank" rel="noopener noreferrer">Python 测试题</a>
