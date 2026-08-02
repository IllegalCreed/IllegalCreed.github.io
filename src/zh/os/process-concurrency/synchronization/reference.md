---
layout: doc
outline: [2, 3]
---

# 参考：互斥原语对比、信号量配置与易错点

> 基于通用操作系统概念 · 核于 2026-08

## 速查

- **竞态条件**：并发访问共享可变变量 + 至少一个写 → 结果依赖时序。治法：临界区互斥。
- **临界区四条件**：互斥、前进、有限等待、让权等待。
- **互斥锁 mutex**：二元、有所有权（谁 lock 谁 unlock），主用互斥。
- **信号量 semaphore**：P/V、整数、无所有权，可互斥（初值 1）也可计数/同步（初值 N）。
- **mutex vs semaphore**：mutex 有所有权，semaphore 无；mutex 只互斥，semaphore 还能同步。
- **管程 monitor**：语言级封装，自动互斥 + 条件变量 wait/signal。
- **生产者-消费者**：`empty=N, full=0, mutex=1`，先 P 资源后 P mutex。
- **读者-写者**：读者优先易饿死写者；写者优先牺牲读者并发。
- **哲学家就餐**：破循环等待（限 4 人 / 奇偶顺序 / 原子拿两把）。
- **优先级反转**：低持锁 + 高等锁 + 中抢占低 → 高被拖。解法：优先级继承/天花板。
- **自旋锁 vs 阻塞锁**：短临界区自旋（无切换）、长临界区阻塞（不占 CPU）。

## 一、互斥原语对比

| 维度 | mutex（互斥锁） | semaphore（信号量） | monitor（管程） |
| --- | --- | --- | --- |
| **本质** | 二元状态变量 | 整型变量 + 计数 | 数据 + 操作的封装 |
| **所有权** | ✅ 有（加锁者解锁） | ❌ 无（任意线程可 V） | 由管程自动持锁 |
| **状态** | 锁定/未锁定 | 整数（可 >1） | 互斥由编译器保证 |
| **互斥能力** | ✅ | ✅（初值 1 时） | ✅（自动） |
| **同步/计数能力** | ❌ | ✅（初值 N） | ✅（条件变量） |
| **操作** | `lock`/`unlock` | `P`/`V`（`wait`/`signal`） | `wait(c)`/`signal(c)` |
| **谁保证互斥** | 程序员配对调用 | 程序员配对 P/V | 运行时自动 |
| **易错性** | 中（忘记解锁） | 高（P/V 顺序错→死锁） | 低（封装好） |
| **典型代表** | pthread_mutex、Java 对象锁 | POSIX semaphore、System V | Java `synchronized`、Hoare 管程 |
| **优先级继承** | 通常支持 | 一般不支持 | 取决于实现 |

## 二、经典问题信号量配置速查

| 问题 | 信号量/变量 | 初值 | 作用 |
| --- | --- | --- | --- |
| **生产者-消费者** | `empty` | N | 空槽位数（资源信号量） |
| | `full` | 0 | 已有数据数 |
| | `mutex` | 1 | 缓冲区互斥 |
| **读者-写者（读者优先）** | `readcount` | 0 | 当前读者数（普通变量） |
| | `rmutex` | 1 | 保护 readcount |
| | `mutex` | 1 | 读-写、写-写互斥 |
| **读者-写者（写者优先）** | `writecount` | 0 | 当前/等待的写者数 |
| | `wmutex` | 1 | 保护 writecount |
| | `readblock` | 1 | 挡住新读者 |
| | `wrt` | 1 | 写互斥（含首读者） |
| **哲学家就餐（限人数）** | `fork[5]` | 各 1 | 5 把叉子互斥 |
| | `room` | 4 | 最多 4 人同时进餐 |

## 三、代码模板

### mutex 保护临界区

```c
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
pthread_mutex_lock(&lock);
// ─── 临界区：访问共享数据 ───
counter++;
// ─────────────────────────────
pthread_mutex_unlock(&lock);
```

### 计数信号量（资源池）

```c
sem_t pool;                        // 连接池，最多 N 个
sem_init(&pool, 0, N);

// 借连接
sem_wait(&pool);                   // P：有空闲连接？
conn = get_conn();
// 用 conn ...
// 还连接
return_conn(conn);
sem_post(&pool);                   // V：通知有空闲
```

### 生产者-消费者（信号量版）

```c
sem_t empty, full, mutex;
sem_init(&empty, 0, N);            // N 个空位
sem_init(&full,  0, 0);            // 0 个数据
sem_init(&mutex, 0, 1);            // 互斥

// 生产者
sem_wait(&empty);    // 先 P 资源
sem_wait(&mutex);    // 再 P 互斥
put(item);
sem_post(&mutex);
sem_post(&full);

// 消费者
sem_wait(&full);
sem_wait(&mutex);
item = get();
sem_post(&mutex);
sem_post(&empty);
```

### 管程（Java synchronized）

```java
class Buffer {
    private final List<Integer> buf = new ArrayList<>();
    private final int N = 10;

    public synchronized void put(int item) throws InterruptedException {
        while (buf.size() == N) wait();    // 满 → 等待（释放锁）
        buf.add(item);
        notifyAll();                       // 通知消费者
    }

    public synchronized int get() throws InterruptedException {
        while (buf.isEmpty()) wait();      // 空 → 等待
        int item = buf.remove(0);
        notifyAll();                       // 通知生产者
        return item;
    }
}
```

## 四、易错点清单

- **"`i++` 是原子的"**：错。`i++` 是"读-改-写"三步，并发会丢失更新——必须加锁或用原子指令（`atomic_int`/`__sync_fetch_and_add`）。
- **"mutex 和二元信号量完全一样"**：不完全。mutex 有**所有权**（谁 lock 谁 unlock），二元信号量无所有权（任意线程可 V）——拿信号量当 mutex 用，若非所有者误 V 会破坏互斥。
- **"生产者-消费者里 P(empty) 和 P(mutex) 顺序无所谓"**：错。必须**先 P 资源信号量（empty/full）再 P mutex**，否则死锁（生产者持 mutex 等 empty，消费者等 mutex）。
- **"读者优先方案没有问题"**：有。读者源源不断时**写者会饿死**——需写者优先或读写公平方案。
- **"哲学家都先拿左手叉子很安全"**：不安全。5 人同时拿左手会**死锁**（各持一把等右手）。解法是限人数、奇偶顺序或原子拿两把。
- **"条件变量的 signal 会累加计数"**：错。条件变量**无计数**，无人 wait 时 signal 丢失；所以 `wait` 必须用 `while` 循环重新检查条件（Mesa 语义下可能虚假唤醒）。
- **"Peterson 算法在现代 CPU 上直接可用"**：需加**内存屏障**。弱内存模型下 `flag`/`turn` 的读写可能被重排，破坏正确性。
- **"自旋锁比阻塞锁快"**：不一定。临界区短用自旋锁省切换开销；临界区长自旋锁空转浪费 CPU 远超切换开销。单核自旋锁还可能死等。
- **"优先级反转只会拖慢低优先级"**：错。它拖慢的是**高优先级**线程——被中优先级间接阻塞，可能导致实时任务超时（火星探路者号事故）。
- **"管程需要程序员手动加锁"**：错。管程由编译器/运行时**自动**保证互斥，开发者只需用条件变量 wait/signal 协调顺序。
- **"信号量的 P 操作忙等"**：经典定义是忙等，但**现代实现**（POSIX semaphore）在 `S<=0` 时让线程**阻塞睡眠**，不占 CPU——不要混淆定义与实现。

## 五、死锁与同步故障分类

| 故障 | 定义 | 典型例子 |
| --- | --- | --- |
| **竞态条件** | 结果依赖时序 | `i++` 丢失更新 |
| **死锁（Deadlock）** | 互相等待，永不解开 | 哲学家各持左手等右手 |
| **活锁（Livelock）** | 不断改变状态却无进展 | 两人互相让路来回闪避 |
| **饿死（Starvation）** | 一直等不到资源 | 读者优先下写者饿死 |
| **优先级反转** | 高被低（经中）间接阻塞 | 火星探路者号 |

## 六、进阶方向（链接其他叶）

- [进程与线程基础](../../process-thread-basics/) —— 线程为何共享地址空间（并发的前提）
- [CPU 调度](../../cpu-scheduling/) —— 优先级反转与调度策略的耦合
- [死锁](../deadlock/) —— 死锁四条件、银行家算法
- [进程间通信 IPC](../ipc/) —— 信号量/共享内存的系统调用接口

## 权威链接

- [Race condition - Wikipedia](https://en.wikipedia.org/wiki/Race_condition)
- [Mutual exclusion - Wikipedia](https://en.wikipedia.org/wiki/Mutual_exclusion)
- [Semaphore (programming) - Wikipedia](https://en.wikipedia.org/wiki/Semaphore_(programming))
- [Monitor (synchronization) - Wikipedia](https://en.wikipedia.org/wiki/Monitor_(synchronization))
- [Peterson's algorithm - Wikipedia](https://en.wikipedia.org/wiki/Peterson%27s_algorithm)
- [Priority inversion - Wikipedia](https://en.wikipedia.org/wiki/Priority_inversion)
- [Dining philosophers problem - Wikipedia](https://en.wikipedia.org/wiki/Dining_philosophers_problem)
- [Producer-consumer problem - Wikipedia](https://en.wikipedia.org/wiki/Producer%E2%80%93consumer_problem)
- [Readers-writers problem - Wikipedia](https://en.wikipedia.org/wiki/Readers%E2%80%93writers_problem)
- 本站幻灯片：<a href="/SlideStack/synchronization-slide/" target="_blank">同步与互斥</a>
