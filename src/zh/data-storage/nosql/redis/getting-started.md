---
layout: doc
outline: [2, 3]
---

# 入门：内存模型、数据结构与持久化

> 基于 Redis 7.x · 核于 2026-08

## 速查

- **定义**：Redis（**Re**mote **Di**ctionary **S**erver）是**内存键值数据结构存储**——数据放物理内存，单线程事件循环处理命令，单实例十万级 QPS、微秒级延迟。2009 年由 Salvatore Sanfilippo（antirez）开源。
- **为什么快**：①**纯内存**（无磁盘寻道）；②**单线程 + IO 多路复用**（epoll，无锁无上下文切换）；③**简单协议**（RESP，文本易解析）；④**高效数据结构**（SDS、跳表、压缩列表）。单线程不是瓶颈——因为快所以不阻塞，不阻塞所以快。
- **六大核心数据结构**：①**strings**（最基础，缓存/计数器）；②**hashes**（对象字段）；③**lists**（双向链表/quicklist，队列）；④**sets**（去重集合）；⑤**sorted sets**（跳表，排行榜）；⑥**streams**（5.0 新增，消息流，带消费组）。另有 bitmaps/hyperloglog/geospatial 派生自 strings/zset。
- **持久化**：①**RDB**（快照，bgsave fork 子进程 dump 二进制，体积小恢复快，但两次快照间会丢数据）；②**AOF**（追加写命令日志，everysec 策略最多丢 1 秒，要 `BGREWRITEAOF` 压缩）；③**混合持久化**（4.0 起，AOF 文件 = RDB 增量 + 增量命令，兼顾恢复速度与安全）。
- **发布订阅（Pub/Sub）**：`PUBLISH`/`SUBSCRIBE` 多对多消息广播，**不持久化**（离线订阅者丢消息），消息量大时占 CPU。需要可靠投递用 **Stream**（5.0+，带消费组、ACK、持久化）。
- **Lua 脚本**：`EVAL` 在服务端原子执行多命令（CAS、限流、库存扣减），Redis 保证脚本执行期间不被中断。7.0 起推荐用 Functions（带名字、可复用）。
- **事务（MULTI/EXEC）**：只是「打包顺序执行」，**不支持回滚**（命令语法错才不执行，运行时错如对 string 做 INCR 会跳过继续）——要真原子性用 Lua。
- **过期与淘汰**：key 可设 `EXPIRE`/`TTL`；过期策略是**惰性删除**（访问时查过期则删）+ **定期删除**（周期抽样）。内存满时按 `maxmemory-policy` 淘汰：`noeviction`（拒绝写）、`allkeys-lru`、`volatile-lru`（只淘汰有过期时间的）、`allkeys-lfu`（4.0+）等。
- **单线程的真相**：Redis 「单线程」指**命令执行**单线程；6.0 起**网络 IO 用多线程**（io-threads）读写客户端 buffer，命令仍单线程串行——所以「大 key 阻塞全实例」的坑依然存在。
- **进阶顺序**：[数据结构与持久化详解](./guide-line/data-structures-and-persistence) → [集群、哨兵、缓存模式与 Valkey](./guide-line/clustering-and-caching) → [参考](./reference)。

## 一、Redis 是什么：内存数据结构服务器

Redis 不是「带数据结构的缓存」这么简单，它的本质是「**放在内存里的、带丰富数据结构的、可持久化的数据结构服务器**」。三个关键词：

1. **内存（in-memory）**：整个数据集常驻物理内存（不是 page cache，是真实 RAM）。读一个 key 不走磁盘寻道，只在内存里查哈希表，所以延迟稳定在微秒级。代价是**单位存储成本高**——1GB 内存能存的数据，磁盘能存几十倍，所以 Redis 通常只放「热数据」。
2. **数据结构服务器**：value 不只是 bytes，而是 **strings/hashes/lists/sets/sorted sets/streams** 等结构。你 `LPUSH queue task` 再 `BRPOP queue 0`，就是在用一个**线程安全的链表队列**；`ZADD rank 100 alice` 再 `ZREVRANGE rank 0 9`，就是在用一个**自动排序的排行榜**。这些操作都在服务端原子完成，应用层不必加锁手搓。
3. **可持久化**：内存数据易失（断电就没），Redis 提供 RDB（快照）和 AOF（日志）两种持久化，让内存数据可以落盘重启恢复——但**默认不是实时同步**，所以 Redis 通常**不当唯一真相源**，而是配合 MySQL/PostgreSQL 当缓存或计算层。

一句话：**Redis 是「快、富、能持久化」的内存数据库，最常当缓存，但远不止缓存。**

## 二、为什么快：单线程的真相

很多人误以为「Redis 单线程所以慢」，恰恰相反——**单线程是它快的部分原因**：

```
        客户端请求命令（RESP 文本）
              │
   ┌──────────┴──────────┐
   │  IO 多路复用（epoll） │  ← 单线程监听千万 socket
   │  6.0 起 IO 线程读 buffer│     （命令执行仍单线程）
   └──────────┬──────────┘
              ▼
   ┌──────────────────────┐
   │  命令分发 + 执行       │  ← 单线程，串行
   │  （无锁、无竞态）      │     内存操作是纳秒级
   └──────────┬──────────┘
              ▼
        回复客户端
```

- **纯内存**：内存访问约 100ns，磁盘寻道约 10ms，差 10 万倍。Redis 的快首先来自「不碰磁盘」。
- **单线程无锁**：多线程要加锁同步（互斥、CAS 重试、上下文切换），锁竞争本身就是开销。Redis 单线程串行执行命令，**天然无锁无竞态**——因为快所以不阻塞，因为不阻塞所以单线程够用。
- **IO 多路复用（epoll/kqueue/select）**：单线程同时监听几万个连接，哪个 socket 有数据就处理哪个，不阻塞等待——这是 Redis 能扛高并发的网络层基础。6.0 起 IO 线程（`io-threads`）把「读客户端 buffer / 写回复」这部分并行化，但**命令执行依然单线程**。
- **高效数据结构**：strings 用 SDS（带长度的字符串，O(1) 取长度、二进制安全）；sorted set 用跳表（O(logN) 插入查找，范围操作高效）；小 hash/list/zset 用压缩列表（ziplist/listpack，省内存）。
- **代价**：单线程意味着**一条慢命令会拖累整个实例**。对百万元素的 zset 做 `SORT`、`KEYS *` 扫全库、大 key 的 `DEL`，都会阻塞几秒——这是「大 key」「慢查询」问题的根源。

## 三、六大核心数据结构

Redis 的 value 是带类型的数据结构，每种结构有一组原子子命令：

| 结构 | 典型命令 | 复杂度 | 典型用途 |
| --- | --- | --- | --- |
| **strings** | `SET`/`GET`/`INCR`/`APPEND` | O(1) | 缓存 JSON、计数器、分布式锁、限流 |
| **hashes** | `HSET`/`HGET`/`HGETALL`/`HINCRBY` | O(1) 单字段 | 对象（用户信息：name/age/email） |
| **lists** | `LPUSH`/`RPOP`/`LRANGE`/`BRPOP` | O(1) 两端 / O(M) 范围 | 消息队列、最新动态、安全队列 |
| **sets** | `SADD`/`SMEMBERS`/`SINTER`/`SISMEMBER` | O(1) 单元素 | 标签、去重、共同好友 |
| **sorted sets** | `ZADD`/`ZRANGE`/`ZRANGEBYSCORE` | O(logN) | 排行榜、延迟队列、带权重的集合 |
| **streams** | `XADD`/`XREAD`/`XREADGROUP`/`XACK` | O(1) 追加 / O(N) 范围 | 消息队列（持久化 + 消费组） |

- **strings 是万能基础**：一个 string 最大 512MB，可以存缓存 JSON、计数器（`INCR`）、分布式锁（`SET key val NX EX 10`）。strings 还是 bitmaps（位操作 `SETBIT`/`GETBIT`，做活跃用户统计）和 hyperloglog（`PFADD`/`PFCOUNT`，基数统计，固定 12KB 算亿级 UV）的载体。
- **hashes 适合存对象**：用户 `user:1` 有 name/age/email，用 hash 比 string 存 JSON 更省内存（小 hash 用 ziplist），且能单独改一个字段（`HINCRBY user:1 age 1`）不必读出整个对象。
- **lists 当队列**：`LPUSH` + `BRPOP` 实现阻塞队列（消费者无数据时阻塞，省轮询）。但**不支持 ACK**——消费者取出后崩溃消息就丢了，要可靠队列用 stream。
- **sorted sets 当排行榜**：`ZADD rank 100 alice` 自动按 score 排序，`ZREVRANGE rank 0 9 WITHSCORES` 取 Top 10。跳表 + 哈希表实现，O(logN) 插入。延迟队列也用它：score 存「执行时间戳」，定时 `ZRANGEBYSCORE` 取到期任务。
- **streams 是 5.0 的「正经消息队列」**：带消费组（`XGROUP`）、消费确认（`XACK`）、持久化、可重放——补上了 lists 当队列「无 ACK 易丢消息」的短板，对标 Kafka 但更轻。

## 四、持久化：RDB 与 AOF

内存数据断电就没，Redis 提供两种持久化（可单独或组合用）：

| 维度 | RDB（快照） | AOF（日志） |
| --- | --- | --- |
| **原理** | 把某一刻的**全部数据**二进制 dump 成 `dump.rdb` | 把每条**写命令**追加到 `appendonly.aof` |
| **触发** | `SAVE`（阻塞）/ `BGSAVE`（fork 子进程）/ 按配置 `save 900 1` | 每次写命令后，按 `appendfsync` 策略刷盘 |
| **数据安全** | 两次快照之间会丢数据（默认最坏丢 15 分钟） | `always`（每次同步，最安全最慢）/ `everysec`（默认，最多丢 1 秒）/ `no`（交给 OS） |
| **恢复速度** | **快**（直接 load 二进制） | **慢**（要重放全部命令日志） |
| **文件体积** | **小**（二进制压缩） | **大**（命令日志累积，需 `BGREWRITEAOF` 压缩） |
| **可读性** | 不可读 | 可读（文本命令） |

- **RDB 用 fork + COW**：`BGSAVE` 调 `fork()` 创建子进程，子进程把内存数据写成 rdb。父进程继续服务，靠**写时复制（COW）**保证子进程看到的是 fork 那一刻的快照——但若 fork 后父进程大量写，COW 会复制大量页，内存可能涨到 2 倍。
- **AOF 重写（rewrite）**：AOF 文件会越积越大（`INCR count` 执行 1000 次就是 1000 行命令），`BGREWRITEAOF` fork 子进程，根据当前内存数据**重新生成**最小命令集（1000 次 INCR 变成 1 条 `SET count 1000`），压缩体积。
- **混合持久化（4.0+，5.0 默认开）**：AOF 重写时，子进程先 dump 一份 RDB 二进制作为 AOF 文件开头，重写期间父进程的新增命令以 AOF 格式追加在后面。重启时先 load RDB（快），再 replay 增量 AOF（少）——**兼顾恢复速度与数据安全**，是生产推荐配置（`aof-use-rdb-preamble yes`）。

## 五、发布订阅与 Stream

Redis 的「消息」有两套机制，按可靠性需求选：

- **Pub/Sub（发布订阅）**：`SUBSCRIBE channel` 订阅，`PUBLISH channel msg` 发布。多对多广播，**消息不持久化**——一个订阅者断开期间的消息全部丢失。适合**实时在线通知**（聊天室、推送），不适合可靠任务队列。
- **Stream（5.0+）**：`XADD stream * field value` 追加消息（自动递增 ID = 时间戳-序号），`XREAD` 拉取，`XREADGROUP` 用消费组消费，`XACK` 确认。消息**持久化**，消费组记录每个消费者的消费位置，未 ACK 的消息进 **PEL（pending list）**，可被其他消费者 `XPENDING`/`XCLAIM` 接管——对标 Kafka 的 consumer group。这是 Redis 自带的「**靠谱**」消息队列。

## 六、Lua 脚本与事务

要把多条命令「**原子地**」执行（中间不被其他客户端插入），Redis 提供两条路：

- **Lua 脚本（`EVAL`）**：在服务端执行一段 Lua，整个脚本期间 Redis **不接受其他命令**（等价于把脚本里的命令打包原子执行）。典型场景：**限流**（取计数-判断-自增-设过期一气呵成）、**库存扣减**（查余量-扣减-记录）、**分布式锁释放**（验证持锁者再删，避免误删）。7.0 起推荐用 **Functions**（`FUNCTION LOAD`）——带名字、可复用、可热更新，比裸 `EVAL` 字符串更可维护。
- **事务（`MULTI`/`EXEC`）**：`MULTI` 开启，后续命令入队不执行，`EXEC` 一次性顺序执行。**关键坑：不支持回滚**——如果队列里某条命令运行时出错（如对一个 string 做 `INCR` 字母），Redis 会跳过它继续执行下一条，**不回滚已执行的**。所以 `MULTI/EXEC` 只是「打包顺序执行」，不是真事务。要原子性 + 条件判断，用 Lua。

## 下一步

理解了 Redis 的内存模型、六大结构、持久化与 Lua 后，下一步深入两个生产关键话题——[数据结构与持久化详解](./guide-line/data-structures-and-persistence)（每种结构的命令细节、复杂度、坑）与[集群、哨兵、缓存模式与 Valkey](./guide-line/clustering-and-caching)（主从/Sentinel/Cluster、cache-aside 等缓存模式、2024 许可变更）。
