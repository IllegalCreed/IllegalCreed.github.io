---
layout: doc
outline: [2, 3]
---

# 并发模型：goroutine、channel 与 select

> 基于进阶语言 · 核于 2026-08

## 速查

- **CSP 哲学**：「不要通过共享内存通信，而通过通信共享内存」。goroutine 各持私有数据，通过 channel 传值交换——所有权随值转移，天然避免竞态。
- **goroutine**：`go f()` 启动的轻量用户态协程，初始栈 ~2-8KB 可动态增长，M:N 调度，启动成本极低（一连接一 goroutine 是常态）。
- **channel**：类型安全管道 `chan T`。无缓冲（`make(chan T)`）会合同步；有缓冲（`make(chan T, n)`）异步，满则发阻塞、空则收阻塞。
- **关闭 channel**：`close(ch)`，接收端 `v, ok := <-ch`（ok=false 表关闭且空）或 `for v := range ch` 遍历至关闭。**只应由发送方关闭**（接收方关闭会致发送方 panic）。
- **方向性 channel**：`chan<- T`（只发）/ `<-chan T`（只收），约束方向、编译期保证。
- **select**：多路复用，同时监听多 channel，ready 的随机选一个执行（避免饥饿）；`default` 实现非阻塞；`time.After` 实现超时。
- **GMP 调度模型**：G（goroutine）M（OS 线程）P（逻辑处理器，持本地 G 队列，默认数量 = GOMAXPROCS = CPU 核数）。P 绑 M 执行 G；空闲 P 用 **work-stealing** 偷别人的 G。
- **goroutine 泄漏**：goroutine 阻塞在 channel 且无人唤醒 → 永久泄漏（内存不释放）。要确保所有 channel 有对应发送/接收或超时退出。
- **sync 包**：`sync.Mutex`/`RWMutex`（互斥锁）、`sync.WaitGroup`（等待一组 goroutine）、`sync.Once`（单次执行）、`sync.Pool`（对象池）、`sync.Map`（并发安全 map）。
- **`go test -race`**：竞态检测器，运行时插桩检测数据竞争，开发必备。
- **data race vs CSP**：data race 是多个 goroutine 无同步地读写同一变量；CSP 通过 channel 让「同一时刻只有一个 goroutine 拥有该数据」来避免。

## 一、goroutine 与 GMP 调度

`go f()` 把 `f` 作为 goroutine 调度执行。Go 运行时的 GMP 模型把海量 goroutine 高效映射到少量 OS 线程：

```
       G   G   G   G   G   G   G   G   ...  （goroutine，海量）
       │   │   │   │   │   │   │   │
   ┌───┴───┴───┴───┴───┴───┴───┴───┴───┐
   │          全局运行队列              │
   └───────────────┬───────────────────┘
                   │ work-stealing
   ┌────────┐  ┌───┴────┐  ┌────────┐
   │  P  ─ M│  │  P ─ M │  │  P ─ M │   （P=逻辑处理器，M=OS 线程）
   │ [G][G] │  │ [G][G] │  │ [G][G] │     P 的本地队列
   └────────┘  └────────┘  └────────┘
        │           │           │
       CPU0       CPU1        CPU2
```

- **G（goroutine）**：每个 `go f()` 一个 G，存栈、PC、状态。
- **M（Machine）**：OS 线程，真正执行 G 的载体。
- **P（Processor）**：逻辑处理器，持本地 G 队列，GOMAXPROCS 决定数量。P 必须绑定 M 才能执行 G。
- **work-stealing**：P 本地队列空时，从全局队列或其他 P 偷 G 来执行，实现负载均衡。
- **阻塞的处理**：goroutine 发起 syscall 阻塞时，运行时把 M 与 P 解绑，P 去找别的 M 继续调度其他 G——避免一个阻塞 syscall 卡住整个 P。

```go
// 启动 10 万 goroutine 毫无压力
for i := 0; i < 100000; i++ {
    go func(i int) {
        // do work
    }(i)
}
```

## 二、channel：无缓冲 vs 有缓冲

```go
// 无缓冲 channel：会合同步（发送与接收必须同时就绪）
unbuf := make(chan int)
go func() { unbuf <- 1 }()   // 阻塞直到有人 <-unbuf
v := <-unbuf                 // 接收，发送方解除阻塞

// 有缓冲 channel：异步（缓冲区满前发送不阻塞）
buf := make(chan int, 2)
buf <- 1   // 不阻塞（缓冲有位）
buf <- 2   // 不阻塞
// buf <- 3 // 阻塞（缓冲满）
fmt.Println(<-buf)  // 1
fmt.Println(<-buf)  // 2
```

| | 无缓冲 `make(chan T)` | 有缓冲 `make(chan T, n)` |
| --- | --- | --- |
| 同步性 | 同步（会合） | 异步（缓冲未满/空时不阻塞） |
| 容量 | 0 | n |
| 典型用途 | 同步握手、信号通知 | 解耦生产消费速率、削峰 |
| 发送阻塞 | 无接收方时阻塞 | 缓冲满时阻塞 |
| 接收阻塞 | 无发送方时阻塞 | 缓冲空时阻塞 |

**关闭 channel 的规则**：
- **应由发送方关闭**——表示「不会再发数据了」。接收方关闭会导致发送方后续发送 panic。
- 关闭后再发送 → `panic: send on closed channel`；关闭后再接收 → 返回零值（`ok=false`）。
- **关闭不是必需**——若不关闭，goroutine 退出、channel 无引用时会被 GC 回收。关闭主要用于通知接收方「结束了」（如 `for range` 遍历）。

## 三、channel 的常见模式

```go
// 1. 等待一组 goroutine 完成（WaitGroup 替代）
func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for j := range jobs {
        results <- j * j
    }
}

// 2. fan-out / fan-in（扇出扇入）
func fanOutFanIn(inputs []int) []int {
    out := make(chan int)
    for _, in := range inputs {
        go func(i int) { out <- process(i) }(in)   // fan-out：多个 worker
    }
    results := make([]int, len(inputs))
    for i := range results {
        results[i] = <-out                          // fan-in：汇聚
    }
    return results
}

// 3. 信号通知（done channel）
done := make(chan struct{})
go func() {
    // long work
    close(done)   // 通知完成
}()
<-done   // 阻塞直到完成

// 4. pipeline（流水线）
stage1 := generate()       // chan int
stage2 := square(stage1)   // chan int
stage3 := filter(stage2)   // chan int
for v := range stage3 { fmt.Println(v) }
```

## 四、select：多路复用

```go
func main() {
    ch1 := work1()
    ch2 := work2()
    for i := 0; i < 5; i++ {
        select {
        case v := <-ch1:
            fmt.Println("from ch1:", v)
        case v := <-ch2:
            fmt.Println("from ch2:", v)
        case <-time.After(1 * time.Second):
            fmt.Println("timeout")
            return
        }
    }
}
```

**select 语义**：
- 多个 case ready → **随机**选一个（公平，避免饥饿）。
- 无 case ready 且无 `default` → 阻塞等待。
- 无 case ready 且有 `default` → 执行 default（实现非阻塞发送/接收）。
- **`time.After`**：实现超时——若 N 时间内无任何 case，触发超时分支。

```go
// 非阻塞接收
select {
case v := <-ch:
    fmt.Println(v)
default:
    fmt.Println("无数据，不阻塞")
}
```

## 五、共享内存与 sync：channel 之外的武器

并非所有场景都该用 channel。简单共享计数、缓存等用 `sync` 包更直接：

```go
// Mutex：互斥锁
var (
    counter int
    mu      sync.Mutex
)
func inc() { mu.Lock(); defer mu.Unlock(); counter++ }

// WaitGroup：等待一组 goroutine
var wg sync.WaitGroup
for i := 0; i < 10; i++ {
    wg.Add(1)
    go func() { defer wg.Done(); /* work */ }()
}
wg.Wait()

// Once：单次初始化（单例）
var (
    instance *Config
    once     sync.Once
)
func GetConfig() *Config {
    once.Do(func() { instance = loadConfig() })
    return instance
}
```

| 工具 | 用途 |
| --- | --- |
| `sync.Mutex` | 互斥锁（独占） |
| `sync.RWMutex` | 读写锁（多读单写） |
| `sync.WaitGroup` | 等待一组 goroutine 完成 |
| `sync.Once` | 单次执行（初始化、单例） |
| `sync.Map` | 并发安全 map（读多写少场景） |
| `sync.Pool` | 对象池（减少 GC 压力） |
| `sync.Cond` | 条件变量 |

**何时用 channel，何时用锁**：
- **架构级协调、所有权转移、流水线** → channel。
- **保护一个具体变量/临界区** → mutex。
- **Go 社区共识**：默认倾向 channel，简单场景别抗拒 mutex。

## 六、竞态与 goroutine 泄漏

**数据竞争（data race）**：两个以上 goroutine 无同步地访问同一变量，至少一个写。会导致未定义行为、结果不确定。**用 `go test -race` 检测**。

```go
// ❌ 有数据竞争
var x int
go func() { x++ }()   // 写
go func() { x++ }()   // 写
fmt.Println(x)        // 读，结果不确定（可能 1 或 2）

// ✅ 用 Mutex 或 atomic 或 channel
var x int64
go func() { atomic.AddInt64(&x, 1) }()
go func() { atomic.AddInt64(&x, 1) }()
```

**goroutine 泄漏**：goroutine 永久阻塞（如等待一个永远不会来的 channel 值），占用栈与内存，GC 无法回收。常见原因：

```go
// ❌ 泄漏：没人接收，goroutine 永远阻塞
func leak() {
    ch := make(chan int)
    go func() {
        ch <- 1   // 无缓冲，无接收方 → 永久阻塞 → 泄漏
    }()
    // 函数返回，ch 局部，但 goroutine 还活着等接收
}

// ✅ 用 context 或 buffered channel 或超时
func noLeak() {
    ch := make(chan int, 1)   // 缓冲 1，发送不阻塞
    go func() { ch <- 1 }()
}
```

**避免泄漏**：①有缓冲 channel 防止发送阻塞；②用 `context.Context` 传递取消信号；③goroutine 必须有「退出路径」（超时/关闭/context.Done）。

## 七、context：取消与超时传播

`context.Context` 是 Go 并发的标准取消/超时/值传递机制，跨 goroutine 树形传播：

```go
func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()

    go worker(ctx)

    select {
    case <-ctx.Done():
        fmt.Println("主：超时或取消", ctx.Err())
    }
}

func worker(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():   // 接到取消/超时，优雅退出
            return
        default:
            // do a chunk of work
        }
    }
}
```

- **`WithCancel`/`WithTimeout`/`WithDeadline`**：派生可取消/带期限的 context。
- **`WithValue`**：传递请求作用域的值（如 trace ID）。
- **规则**：所有可能阻塞的操作应接受 `ctx` 参数，并在 `ctx.Done()` 时退出。

## 下一步

掌握了并发模型后，下一步看[生态与工具链](./ecosystem-and-tools)——Go modules、go test、云原生生态（Docker/K8s/Hugo/Caddy/Traefik）、TS7 基于 Go，以及 Go 与 Rust 的工程取舍对照。
