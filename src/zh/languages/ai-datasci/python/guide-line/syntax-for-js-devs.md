---
layout: doc
outline: [2, 3]
---

# 语法精要（给 JS 开发者）：装饰器、上下文管理器与 asyncio

> 基于进阶语言 · 核于 2026-08

## 速查

- **缩进即块**：Python 用 4 空格缩进定义代码块（无 `{}`），混用 tab/空格报 `TabError`，缩进错报 `IndentationError`。PEP 8 规定统一 4 空格。
- **函数是一等公民**：函数可赋值给变量、当参数传递、当返回值——和 JS 一样。`def` 定义，`lambda` 写匿名函数（但只能单表达式，不如 JS 箭头函数强大）。
- **装饰器（Decorator）**：`@xxx` 是高阶函数的语法糖——`@logger` 等价于 `func = logger(func)`，在函数前后插入逻辑（日志/计时/缓存/权限/路由）。`@app.route("/")`/`@torch.no_grad()`/`@pytest.fixture` 都靠它。
- **上下文管理器（`with`）**：管理资源的进/出——`with open(f) as f:` 进入时打开文件、退出时自动关闭（即使抛异常）。靠 `__enter__`/`__exit__` 协议。PyTorch 的 `with torch.enable_grad():` 也靠它。
- **列表推导式进阶**：`[x*2 for x in nums if x>0]`（过滤+变换）；生成器表达式 `(x*2 for x in nums)` 惰性求值省内存。
- **迭代器与生成器**：`yield` 让函数变成生成器（惰性产出值，不一次算完），处理大数据流省内存。`for x in obj` 靠 `__iter__`/`__next__` 协议。
- **类与 `self`**：`class Dog:` 定义类，实例方法第一个参数必须是 `self`（类比 JS 的 `this` 但要显式写）。`__init__` 是构造函数（类比 constructor）。支持继承/多继承/mixin。
- **asyncio 异步**：`async def`/`await` 写协程（和 JS 的 async/await 语法几乎一样），但事件循环要手动跑（`asyncio.run(main())`）。单线程并发处理 IO。
- **GIL 限制**：CPython 多线程无法真并行 CPU 任务（一次只跑一个线程），CPU 密集要用 `multiprocessing`（多进程）或 C 扩展。

## 一、装饰器：函数的「包装器」

装饰器是 Python 实现横切逻辑（日志/计时/缓存/权限/路由）的核心机制。它本质是**接收函数返回函数的高阶函数**，`@decorator` 是它的语法糖：

```python
import time

# 定义装饰器：接收函数，返回包装后的新函数
def timer(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)    # 调用原函数
        print(f"{func.__name__} 耗时 {time.time()-start:.3f}s")
        return result
    return wrapper

# @timer 是语法糖，等价于 slow_func = timer(slow_func)
@timer
def slow_func():
    time.sleep(1)
    return "done"

slow_func()    # 输出：slow_func 耗时 1.001s
```

- **执行流程**：`@timer` → `timer(slow_func)` 返回 `wrapper` → 之后调用 `slow_func()` 实际调用 `wrapper()` → wrapper 内部调用原 `func`。
- **常见装饰器**：
  - `@app.route("/")`（Flask/FastAPI）：把函数注册成路由处理。
  - `@torch.no_grad()`（PyTorch）：在该函数内不计算梯度（推理时省内存）。
  - `@property`：把方法当属性访问（`obj.x` 而非 `obj.x()`）。
  - `@staticmethod`/`@classmethod`：静态方法/类方法。
  - `@functools.lru_cache`：自动缓存函数结果（记忆化）。
- **带参数的装饰器**：`@app.route("/users")` 要传参，需三层嵌套（`route(path)` 返回真正的装饰器）。

## 二、上下文管理器：自动资源管理

`with` 语句管理「进入-退出」成对的操作（开/关文件、获取/释放锁、开始/结束梯度），即使中间抛异常也能保证清理：

```python
# with 保证 f 一定被关闭，即使 read 抛异常
with open("data.txt", encoding="utf-8") as f:
    data = f.read()
# 离开 with 块，f.close() 自动调用

# PyTorch 推理：临时禁用梯度计算
with torch.no_grad():
    output = model(input)   # 不构建计算图，省内存
```

- **协议**：对象实现 `__enter__`（进入时调用，返回值赋给 `as` 变量）和 `__exit__`（退出时调用，负责清理）即可用于 `with`。
- **vs try/finally**：`with` 是 try/finally 的语法糖，但更简洁且不会忘写 finally。
- **`contextlib.contextmanager`**：用生成器简化自定义上下文管理器（不必写类）。

## 三、迭代器、生成器与 `yield`

生成器是「惰性产出的函数」——用 `yield` 而非 `return`，每次产出一个值后**暂停**，下次调用从暂停处继续。处理大数据流时避免一次性加载到内存：

```python
# 普通函数：一次性返回所有结果（占大内存）
def get_squares_list(n):
    return [i**2 for i in range(n)]    # 100 万元素 → 100 万内存

# 生成器函数：惰性产出，每次只算一个
def get_squares_gen(n):
    for i in range(n):
        yield i**2     # 产出一个值后暂停

gen = get_squares_gen(1000000)   # 几乎不占内存
for sq in gen:                   # 边迭代边计算
    if sq > 100:
        break
```

- **`yield` vs `return`**：`return` 结束函数返回一个值；`yield` 产出一个值但函数「冻结」，下次 `next()` 从 yield 下一行继续。
- **生成器表达式**：`(x**2 for x in range(n))` 是生成器的语法糖（圆括号，类比列表推导式的方括号）。
- **应用**：读大文件（`for line in open(f)` 逐行读不一次加载）、流式处理、无限序列（`def naturals(): i=0; while True: i+=1; yield i`）。

## 四、类与 `self`

Python 是多范式语言，支持面向对象。类用 `class` 定义，方法的第一个参数必须是 `self`（指向实例本身，类比 JS 的 `this` 但要显式写）：

```python
class Dog:
    # 类变量（所有实例共享）
    species = "Canis familiaris"

    # 构造函数（类比 JS constructor）
    def __init__(self, name, age):
        self.name = name    # 实例变量
        self.age = age

    # 实例方法（第一个参数必须是 self）
    def bark(self):
        return f"{self.name} says Woof!"

    # 类方法（操作类而非实例）
    @classmethod
    def from_dict(cls, d):
        return cls(d["name"], d["age"])

d = Dog("Rex", 3)            # 实例化（无 new 关键字）
print(d.bark())              # Rex says Woof!
d2 = Dog.from_dict({"name":"Buddy","age":2})   # 类方法调用
```

- **`self` 必须显式写**：JS 的 `this` 是隐式的，Python 要在每个方法第一个参数写 `self`（调用时不必传，Python 自动填）。
- **`__init__` 是构造函数**：类比 JS 的 `constructor`，实例化时自动调用。无 `new` 关键字（`Dog("Rex")` 即实例化）。
- **双下划线方法（dunder）**：`__init__`（构造）、`__str__`（转字符串）、`__len__`（len 调用）、`__eq__`（== 调用）——这是 Python 的「运算符重载」，让自定义类支持内置操作。
- **继承**：`class Puppy(Dog):` 继承 Dog，可覆写方法。支持**多继承**（`class A(B, C):`），通过 MRO（方法解析顺序）决定调用哪个父类。

## 五、asyncio：单线程并发

Python 3.5+ 引入 `async`/`await` 语法（和 JS 几乎一样），用于 IO 密集型并发（网络请求、数据库、文件 IO）：

```python
import asyncio

async def fetch(url):           # async def 定义协程
    print(f"请求 {url}")
    await asyncio.sleep(1)      # await 等待（非阻塞，类似 JS await）
    return f"{url} 的结果"

async def main():
    # 并发执行三个请求（总耗时约 1s，而非 3s）
    results = await asyncio.gather(
        fetch("api/users"),
        fetch("api/posts"),
        fetch("api/comments"),
    )
    print(results)

asyncio.run(main())    # 运行事件循环（JS 不需要，浏览器/Node 自带）
```

- **与 JS 的差异**：①语法几乎相同（`async def`/`await`）；②**事件循环要手动跑**——`asyncio.run(main())`，JS 的浏览器/Node 自动有事件循环；③Python 的 `await` 只能在 `async def` 内（同 JS）。
- **适用场景**：IO 密集（爬虫、API 调用、数据库）——等待时让出 CPU 给其他协程。CPU 密集无意义（GIL 限制，多线程也不行，要用多进程）。
- **库支持**：`aiohttp`（异步 HTTP）、`httpx`（同步异步都支持）、`asyncpg`（异步 PG）。注意：传统的 `requests` 库是同步的，在 async 函数里用会阻塞事件循环。

## 六、GIL：多线程的紧箍咒

CPython（最常用的 Python 实现）有**全局解释器锁（GIL）**——任何时刻只允许一个线程执行 Python 字节码。后果：

- **多线程无法真并行 CPU 任务**：开 10 个线程算质数，速度和一个线程差不多（甚至更慢，因为有切换开销）。
- **多线程适合 IO 密集**：一个线程等网络时，GIL 会释放给其他线程（`time.sleep`/网络请求/文件 IO 都会释放 GIL），所以爬虫用多线程有效。
- **CPU 密集怎么办**：用 `multiprocessing`（多进程，每个进程独立 GIL）或 C 扩展（NumPy 的矩阵运算在 C 层释放 GIL 真并行）。

```python
# CPU 密集 —— 多进程绕开 GIL
from multiprocessing import Pool
def heavy(x):
    return sum(i*i for i in range(x))

with Pool(4) as p:        # 4 个进程
    results = p.map(heavy, [10**7]*4)   # 真并行
```

- **历史**：GIL 是 CPython 早期为简化内存管理（引用计数）引入的。移除 GIL 的提案（PEP 703，no-GIL Python）已accepted，但全面落地还需数年。

## 下一步

掌握了 Python 的核心语法后，下一步进入[工具链与 AI 代码阅读](./tooling-and-ai)——理解 pip/venv 如何管理依赖、与 JS 工具链的对比、以及如何读懂 PyTorch/Pandas 的典型代码。
