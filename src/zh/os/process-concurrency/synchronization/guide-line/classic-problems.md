---
layout: doc
outline: [2, 3]
---

# 经典同步问题：生产者-消费者、读者-写者、哲学家就餐

> 基于通用操作系统概念 · 核于 2026-08

## 速查

- **三大经典问题**：生产者-消费者（有界缓冲）、读者-写者（读共享/写独占）、哲学家就餐（多资源互斥，易死锁）——几乎所有同步考点都围绕它们展开。
- **生产者-消费者（有界缓冲）**：3 个信号量——`empty`（空槽位，初值 N）、`full`（已有数据，初值 0）、`mutex`（缓冲区互斥，初值 1）。生产者 P(empty)→P(mutex)→放→V(mutex)→V(full)；消费者 P(full)→P(mutex)→取→V(mutex)→V(empty)。**顺序不能错**：先 P 资源信号量再 P mutex，否则死锁。
- **读者-写者**：写者必须独占（与任何读者/其他写者互斥），读者可并发。**读者优先**：写者可能饿死；**写者优先**：新读者要等已有写者，牺牲读者并发换写者公平。
- **读者-写者（读者优先）**：用 `readcount`（当前读者数）+ `rmutex`（保护 readcount）+ `mutex`（写互斥）。第一个读者 P(mutex) 锁住写者，最后一个读者 V(mutex) 放开。
- **哲学家就餐**：5 个哲学家、5 把叉子，每人需**左右两把**叉子才能吃饭。朴素方案（各拿左手再拿右手）会**死锁**（同时都拿起左手，再等右手）。解法：①**限制同时进餐人数**（最多 4 人）；②**奇偶号拿叉顺序不同**（破除环路等待）；③**同时拿两把**（原子）。
- **死锁四必要条件**：互斥、占有并等待、不可剥夺、**循环等待**——破任一即可防死锁。哲学家就餐的经典解法就是**破循环等待**（统一拿叉顺序）。
- **进阶顺序**：[管程、优先级反转与 Peterson 算法](./advanced) → [参考](../reference)。

## 一、生产者-消费者：有界缓冲

**问题**：一群生产者往**有界缓冲区**（容量 N）放数据，一群消费者从中取数据。约束：缓冲区满时生产者必须**等**（有空位）；缓冲区空时消费者必须**等**（有数据）；且对缓冲区的访问必须**互斥**（不能两个生产者同时写同一格子）。

**信号量配置**：

| 信号量 | 初值 | 含义 |
| --- | --- | --- |
| `empty` | N | 空槽位数（还能放几个） |
| `full` | 0 | 已有数据数（能取几个） |
| `mutex` | 1 | 缓冲区访问互斥 |

**伪代码**：

```c
semaphore empty = N;   // 空位
semaphore full  = 0;   // 有数据
semaphore mutex = 1;   // 互斥

void producer() {
    while (1) {
        item = produce();
        P(empty);     // ① 等空位（资源信号量先 P）
        P(mutex);     // ② 再 P 互斥锁
        put(item);    // 临界区：放入缓冲区
        V(mutex);     // ③ 先 V 互斥锁
        V(full);      // ④ 再 V 资源信号量（通知有数据）
    }
}

void consumer() {
    while (1) {
        P(full);      // ① 等数据
        P(mutex);     // ② P 互斥锁
        item = get(); // 临界区：取出
        V(mutex);     // ③ V 互斥锁
        V(empty);     // ④ V 空位（通知有空位）
    }
}
```

**关键点**：

- **P 顺序不能颠倒**：必须**先 P 资源信号量（empty/full）再 P mutex**。若先 P(mutex) 再 P(empty)，生产者拿了 mutex 后发现缓冲区满（P(empty) 阻塞），而消费者要取数据需先 P(mutex)——于是生产者占着 mutex 等 empty，消费者等 mutex，**死锁**。
- **V 顺序无所谓**（一般先 V mutex 再 V 资源，但不影响正确性）。
- `empty + full = N` 恒成立（不计临界区内瞬间）。

## 二、读者-写者：读共享与写独占

**问题**：一个共享文件，多个读者/写者访问。约束：①**读-读兼容**（多个读者可同时读）；②**读-写互斥**（写时不能有读者）；③**写-写互斥**（写者之间串行）。

### 读者优先（Reader Priority）

经典方案让读者**优先**——只要有读者在读，新读者可直接加入，写者必须等所有读者离开：

```c
int readcount = 0;        // 当前读者数
semaphore rmutex = 1;     // 保护 readcount
semaphore mutex = 1;      // 读-写、写-写互斥（写者锁）

void reader() {
    P(rmutex);
    readcount++;
    if (readcount == 1)   // 第一个读者：锁住写者
        P(mutex);
    V(rmutex);

    read();               // 读（多个读者可并发）

    P(rmutex);
    readcount--;
    if (readcount == 0)   // 最后一个读者：放开写者
        V(mutex);
    V(rmutex);
}

void writer() {
    P(mutex);             // 独占
    write();
    V(mutex);
}
```

- **机制**：用 `readcount` 数当前读者数，**第一个读者** `P(mutex)` 把写者挡住，**最后一个读者** `V(mutex)` 放开写者。中间的读者无需碰 `mutex`，故可并发。
- **缺点**：只要读者源源不断，写者会被**饿死**（永远等不到 `mutex`）。

### 写者优先（Writer Priority）

为避免写者饿死，引入**写者优先**：一旦有写者在等，新来的读者要排在写者后面：

```c
int readcount = 0, writecount = 0;
semaphore rmutex=1, wmutex=1;   // 保护两个计数
semaphore readblock=1;          // 挡读者
semaphore wrt=1;                // 写互斥（含首个读者）

void writer() {
    P(wmutex);
    writecount++;
    if (writecount == 1)        // 第一个写者：挡住新读者
        P(readblock);
    V(wmutex);

    P(wrt);
    write();
    V(wrt);

    P(wmutex);
    writecount--;
    if (writecount == 0)        // 最后一个写者：放开读者
        V(readblock);
    V(wmutex);
}

void reader() {
    P(readblock);               // 若有写者，在此阻塞
    P(rmutex);
    readcount++;
    if (readcount == 1)
        P(wrt);
    V(rmutex);
    V(readblock);               // 进入了即可放开 readblock

    read();

    P(rmutex);
    readcount--;
    if (readcount == 0)
        V(wrt);
    V(rmutex);
}
```

- **机制**：第一个写者 `P(readblock)` 挡住后续读者；写完后最后一个写者 `V(readblock)` 放开。读者进入时短暂持有 `readblock`，进入即放——避免读者长期占着 `readblock` 互相阻塞。
- **取舍**：牺牲读者并发（写者在等时新读者要排队），换写者公平。

## 三、哲学家就餐：死锁的经典舞台

**问题**（Dijkstra, 1965）：5 个哲学家围圆桌而坐，桌中央一盘通心粉，每人面前一只盘，**相邻两人之间一把叉子**（共 5 把）。哲学家交替**思考**和**吃饭**，吃饭需同时拿起**左右两把叉子**。如何保证他们都能吃到饭且不僵死？

### 朴素方案（会死锁）

最直觉的方案：每人**先拿左手叉子，再拿右手叉子**：

```c
semaphore fork[5] = {1,1,1,1,1};   // 5 把叉子，各初值 1

void philosopher(int i) {
    while (1) {
        think();
        P(fork[i]);          // 拿左
        P(fork[(i+1)%5]);    // 拿右
        eat();
        V(fork[i]);          // 放左
        V(fork[(i+1)%5]);    // 放右
    }
}
```

**致命问题**：若 5 人**同时**拿起左手叉子（各 `P(fork[i])` 成功），然后都去拿右手叉子——但右手叉子已被右邻拿走，于是**5 人都在等右手叉子，无人放下左手**，**死锁**！

这恰好满足**死锁四必要条件**：①互斥（叉子一次一人用）；②占有并等待（拿左等右）；③不可剥夺（不能抢）；④**循环等待**（0→1→2→3→4→0 形成环）。

### 解法一：限制同时进餐人数

最多允许 **4 个**哲学家同时尝试拿叉（5 人留 1 人空闲），保证至少有 1 人能拿到两把叉：

```c
semaphore room = 4;   // 最多 4 人同时进餐

void philosopher(int i) {
    while (1) {
        think();
        P(room);             // 申请"座位"（最多 4）
        P(fork[i]);
        P(fork[(i+1)%5]);
        eat();
        V(fork[(i+1)%5]);
        V(fork[i]);
        V(room);
    }
}
```

5 把叉子分给 4 人，必有一人能拿到两把——**破除"循环等待"**。

### 解法二：奇偶号拿叉顺序不同（破环路）

让**奇数号**先拿左手、**偶数号**先拿右手，打破环状等待：

```c
void philosopher(int i) {
    while (1) {
        think();
        if (i % 2 == 1) {            // 奇数：先左后右
            P(fork[i]);
            P(fork[(i+1)%5]);
        } else {                     // 偶数：先右后左
            P(fork[(i+1)%5]);
            P(fork[i]);
        }
        eat();
        V(fork[i]);
        V(fork[(i+1)%5]);
    }
}
```

- 如 0 号先拿 `fork[1]`、1 号先拿 `fork[1]`——两者竞争 `fork[1]`，必有一个拿不到，从而不会 5 人各持一把形成环。本质是**统一叉子的获取顺序**（都先拿编号小的），消除循环等待。

### 解法三：同时拿两把（原子）

把"拿两把叉"做成**原子操作**——要么都拿到，要么都不拿：

```c
semaphore mutex = 1;

void philosopher(int i) {
    while (1) {
        think();
        P(mutex);              // 互斥地拿两把
        P(fork[i]);
        P(fork[(i+1)%5]);
        V(mutex);
        eat();
        V(fork[i]);
        V(fork[(i+1)%5]);
    }
}
```

- 缺点：退化成串行，并发度极低——但绝对安全。

## 下一步

掌握了三大经典问题后，下一步看两个进阶主题——[管程、优先级反转与 Peterson 算法](./advanced)（管程封装信号量、Peterson 软件互斥、优先级反转与继承、自旋锁 vs 阻塞锁）。
