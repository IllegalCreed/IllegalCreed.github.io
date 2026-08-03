---
layout: doc
outline: [2, 3]
---

# 参考：Go 核心概念、并发原语与易错点速查

> 基于进阶语言 · 核于 2026-08

## 速查

- **定位**：编译型、静态类型、带 GC 的系统级语言，简洁哲学，goroutine + channel 的 CSP 并发。
- **goroutine**：`go f()` 启动的轻量协程，M:N 调度（GMP），初始栈 ~2-8KB。
- **channel**：类型安全管道。无缓冲（会合同步）/ 有缓冲（异步）。发送方关闭。
- **select**：多路复用，ready 随机选；`default` 非阻塞；`time.After` 超时。
- **CSP**：「通过通信共享内存」而非「共享内存通信」。
- **显式错误**：`(result, error)`，`if err != nil`，无异常。
- **Go modules**：`go.mod` + `go.sum`，`go mod init/tidy/get`。
- **go test**：`Test`/`Benchmark`/`Example`，`-race`/`-bench`/`-cover`。
- **静态单二进制**：`go build`，`GOOS/GOARCH` 交叉编译。
- **云原生生态**：Docker/K8s/etcd/Prometheus/Hugo/Caddy/Traefik/Terraform 全是 Go。
- **TS7 基于 Go**：tsc 用 Go 重写，提速 10×。
- **与 Rust**：Go 简单 + GC + CSP；Rust 安全 + 所有权 + 无 GC。

## 一、并发原语对比

| 原语 | 作用 | 典型场景 |
| --- | --- | --- |
| `go f()` | 启动 goroutine | 一连接/任务一 goroutine |
| `chan T` | 类型安全通信 | goroutine 间传值、协调 |
| `select` | 多路复用 | 多 channel 监听、超时 |
| `sync.Mutex` | 互斥锁 | 保护临界区 |
| `sync.RWMutex` | 读写锁 | 读多写少 |
| `sync.WaitGroup` | 等待一组 goroutine | 批量并发收口 |
| `sync.Once` | 单次执行 | 初始化、单例 |
| `sync.Map` | 并发安全 map | 并发读写 map |
| `sync.Pool` | 对象池 | 减少 GC 压力 |
| `context.Context` | 取消/超时/值传播 | 跨 goroutine 树形控制 |
| `atomic` 包 | 原子操作 | 简单计数/标志 |

## 二、channel 语义速查

| 操作 | 无缓冲 channel | 有缓冲 channel（容量 n） |
| --- | --- | --- |
| 发送 `ch <- v` | 无接收方 → 阻塞 | 缓冲满 → 阻塞；否则入队 |
| 接收 `v := <-ch` | 无发送方 → 阻塞 | 缓冲空 → 阻塞；否则出队 |
| 关闭 `close(ch)` | 之后发送 panic，接收返零值 | 同左 |
| `v, ok := <-ch` | ok=false 表关闭且空 | 同左 |
| `for v := range ch` | 遍历至关闭 | 遍历至关闭 |
| 零值 `nil` channel | 发送/接收永久阻塞 | 同左（可用于 select 禁用分支） |

**关闭规则**：只应由**发送方**关闭，表示「不再发」；关闭后再发 → panic。

## 三、GMP 调度模型

| 组件 | 含义 |
| --- | --- |
| **G（goroutine）** | 用户协程，存栈/PC/状态 |
| **M（Machine）** | OS 线程，执行载体 |
| **P（Processor）** | 逻辑处理器，持本地 G 队列，数量 = GOMAXPROCS |
| 全局队列 | P 本地空时取 G |
| work-stealing | P 互相偷 G，负载均衡 |
| syscall 阻塞 | M 与 P 解绑，P 找新 M 继续 |

## 四、错误处理速查

```go
// 多返回值
func sqrt(x float64) (float64, error) {
    if x < 0 { return 0, errors.New("负数") }
    return math.Sqrt(x), nil
}

// 自定义错误类型
type MyError struct { Code int; Msg string }
func (e *MyError) Error() string { return fmt.Sprintf("%d: %s", e.Code, e.Msg) }

// 错误包装（1.13+）
if err := step1(); err != nil {
    return fmt.Errorf("step1 failed: %w", err)   // %w 包装
}
// 解包
var target *MyError
if errors.As(err, &target) { /* 类型匹配 */ }
if errors.Is(err, os.ErrNotExist) { /* 值匹配 */ }

// panic/recover（仅严重错误）
defer func() {
    if r := recover(); r != nil { log.Println("recovered:", r) }
}()
```

- **panic**：严重错误（数组越界、nil 解引用、显式 panic），默认 unwind 栈。`recover` 可在 defer 中捕获（仅当前 goroutine）。
- **不要用 panic 做正常错误处理**——用 error 值。

## 五、接口（interface）

```go
type Shape interface {
    Area() float64
    Perimeter() float64
}

// 隐式实现：任何有 Area()/Perimeter() 的类型自动满足 Shape
type Circle struct{ R float64 }
func (c Circle) Area() float64      { return math.Pi * c.R * c.R }
func (c Circle) Perimeter() float64 { return 2 * math.Pi * c.R }

var s Shape = Circle{R: 1}
```

- **隐式实现**（鸭子类型）：无需 `implements` 声明，有方法即满足。
- **空接口 `interface{}`（1.18+ 写 `any`）**：任意类型，类似 Java Object。
- **类型断言**：`v, ok := s.(Circle)`。
- **type switch**：`switch v := s.(type) { case Circle: ... }`。
- **接口值 = (类型, 值) 二元组**：nil 接口 vs 接口持有 nil 值是常见陷阱。

## 六、Go vs Rust vs Java 速查

| 维度 | Go | Rust | Java |
| --- | --- | --- | --- |
| 内存管理 | GC | 所有权（无 GC） | GC |
| 并发 | goroutine + channel | 所有权 + Send/Sync | 线程 + 锁 |
| 编译速度 | 极快 | 慢 | 中 |
| 性能 | 良好 | 巅峰 | 中（JIT 优化后良好） |
| 学习曲线 | 平缓 | 陡峭 | 中 |
| 二进制 | 静态单文件 | 静态/动态 | 需 JVM |
| 错误处理 | error 值 | Result/Option | 异常 |
| 部署 | scp 一个文件 | scp 一个文件 | 装 JRE |
| 生态强项 | 云原生 | 系统/Web 工具 | 企业后端 |

## 七、易错点清单

- **「Go 有继承」**：错。Go 无继承，只有 struct embedding（组合），嵌入类型获得其字段方法，但不是 is-a。
- **「channel 应该总是关闭」**：错。关闭不是必需（GC 会回收），关闭主要用于通知接收方「结束」。且只应由发送方关闭。
- **「goroutine 像线程」**：概念不同。goroutine 是用户态轻量协程（M:N 调度），OS 线程由运行时管理；开十万个是 goroutine 不是线程。
- **「`if err != nil` 可以用异常替代」**：Go 无异常（panic 不是异常），错误必须显式检查——这是设计选择，换「错误不被忽略」。
- **「Go 没有泛型」**：1.18（2022）已引入泛型，老说法过时。
- **「`make(chan T)` 和 `make(chan T, 1)` 一样」**：不同。前者无缓冲（同步会合），后者有缓冲（异步），语义与阻塞行为完全不同。
- **「关闭的 channel 接收会阻塞」**：错。关闭后接收立即返回零值（ok=false），不阻塞；阻塞的是发送（会 panic）。
- **「nil channel 在 select 里没作用」**：错。nil channel 的发送/接收永久阻塞，可用于 select 中动态「禁用」某分支。
- **「GC 让 Go 不能做高并发」**：错。Go GC 经过多年优化，STW 已到亚毫秒级，绝大多数高并发服务不受影响；但硬实时场景确实受限。
- **「GOMAXPROCS 越大越好」**：错。默认等于 CPU 核数最优；设太大反而增加调度开销与上下文切换。
- **「goroutine 不会泄漏」**：错。goroutine 阻塞在无人唤醒的 channel 上会永久泄漏（栈与内存不释放），需用 context/超时/缓冲 channel 防范。
- **「interface 持有 nil 值等于 nil interface」**：错。`var s Shape = (*Circle)(nil)` 时 s ≠ nil（s 持有类型信息），这是经典陷阱，要用 `s == nil` 前确保类型也为 nil。
- **「TS7 选 Go 是因为 Rust 不够快」**：错。Rust 性能更极致，但 Microsoft 综合考虑学习曲线、开发速度、团队经验选了 Go——是「够快且简单」而非「Rust 不行」。
- **「Go 和 Rust 二选一」**：错。两者互补，很多团队同时用——Go 做业务服务，Rust 做性能关键组件。

## 八、进阶方向（链接其他叶）

- [Rust](../../rust/) —— 安全派代表，与 Go「简单派」对照（GC vs 所有权、CSP vs Send/Sync、简单 vs 安全）

## 权威链接

- [Go 官网](https://go.dev/)
- [Effective Go](https://go.dev/doc/effective_go)
- [Go by Example](https://gobyexample.com/)
- [Go 语言设计与实现（draveness）](https://draveness.me/golang/)
- [Go (programming language) - Wikipedia](https://en.wikipedia.org/wiki/Go_(programming_language))
- [Communicating Sequential Processes（Hoare 论文）](https://www.cs.cmu.edu/~crary/819-f09/Hoare78.pdf)
- [TypeScript 原生移植公告（Go）](https://devblogs.microsoft.com/typescript/typescript-native-port/)
- 本站幻灯片：<a href="/SlideStack/go-slide/" target="_blank">Go</a>
