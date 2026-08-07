---
layout: doc
outline: [2, 3]
---

# 数据结构与持久化详解

> 基于 Redis 7.x · 核于 2026-08

## 速查

- **strings**：最基础结构，最大 512MB。`SET key val [EX s] [NX]`、`GET`、`INCR`/`DECR`（原子计数）、`APPEND`、`SETRANGE`。承载计数器、缓存 JSON、分布式锁、限流（INCR + EXPIRE）。**派生**：bitmaps（`SETBIT`/`BITCOUNT` 做活跃用户统计）、hyperloglog（`PFADD`/`PFCOUNT`，12KB 估亿级 UV）。
- **hashes**：字段-值映射，适合存对象。`HSET`/`HGET`/`HGETALL`/`HDEL`/`HINCRBY`/`HLEN`。小 hash（字段数与值长度都小于阈值）用 **listpack**（7.0 起，原 ziplist）省内存，超阈值自动升级为 hashtable。
- **lists**：按插入顺序的字符串链表，底层 3.2 起是 **quicklist**（双向链表 + 每节点 ziplist/listpack）。`LPUSH`/`RPUSH`/`LPOP`/`RPOP`（两端 O(1)）、`LRANGE`（范围 O(M)）、`BLPOP`/`BRPOP`（阻塞弹出，做队列）。**不支持 ACK**，消费者崩溃消息丢——要可靠用 stream。
- **sets**：无序去重字符串集合。`SADD`/`SREM`/`SMEMBERS`/`SISMEMBER`/`SCARD`、集合运算 `SINTER`/`SUNION`/`SDIFF`。做标签、共同好友、去重。整数集（intset）小集合省内存。
- **sorted sets**：每个元素带 score，按 score 排序，底层**跳表 + 哈希表**。`ZADD`/`ZSCORE`/`ZRANK`/`ZRANGE`/`ZRANGEBYSCORE`/`ZREVRANGE`（O(logN+M)）。排行榜、延迟队列（score = 执行时间戳）、带权重集合。
- **streams**（5.0+）：消息日志，ID 形如 `时间戳-序号`。`XADD`（追加）/`XLEN`/`XRANGE`/`XREAD`（阻塞读）/`XREADGROUP`（消费组）/`XACK`（确认）/`XPENDING`/`XCLAIM`（接管未确认消息）。持久化 + 消费组 + 重放，Redis 的「靠谱队列」。
- **RDB**：快照。`SAVE`（阻塞禁用）/`BGSAVE`（fork 子进程 + COW）。配置 `save 900 1`（900s 内 1 次改就触发）。体积小、恢复快，但两次快照间会丢数据。fork 大实例会瞬间暂停（复制页表）+ 内存可能翻倍（COW）。
- **AOF**：追加写命令日志。`appendfsync` 三档：`always`（每条同步，最安全最慢）/ `everysec`（默认，最多丢 1 秒）/ `no`（OS 决定）。体积大要 `BGREWRITEAOF`（fork 子进程按当前数据重写最小命令集）压缩。**auto-aof-rewrite-percentage/min-size** 自动触发重写。
- **混合持久化（4.0+，5.0 默认开）**：`aof-use-rdb-preamble yes`——AOF 重写时子进程先 dump RDB 二进制做开头，后续增量命令追加。重启先 load RDB（快）再 replay 增量 AOF（少），**兼顾速度与安全**，生产推荐。
- **过期与内存淘汰**：`EXPIRE`/`TTL`/`PERSIST`。删除策略 = **惰性**（访问时查过期才删）+ **定期**（每 100ms 抽样删过期 key）。`maxmemory` 满时按 `maxmemory-policy` 淘汰：`noeviction`（拒写）/`allkeys-lru`/`volatile-lru`/`allkeys-lfu`（4.0+）/`volatile-ttl` 等。生产缓存常用 `allkeys-lru` 或 `volatile-lru`。

## 一、strings：万能基础

strings 是 Redis 最基础的结构——一个 key 对应一个二进制安全的字符串（最大 512MB），其他 5 种结构都是在 strings 之上「长」出来的能力。

```bash
# 基本读写
SET user:1 '{"name":"alice","age":30}' EX 3600   # 带 3600 秒过期
GET user:1                                        # 取值
SET lock:order "owner1" NX EX 10                  # NX 不存在才设 = 分布式锁

# 原子计数（INCR/DECR 是原子的，并发安全）
INCR counter:page:home       # +1，返回新值
INCRBY stock:sku1 -1         # 扣库存
INCRBYFLOAT rate:usd 0.05    # 浮点自增

# 限流（固定窗口）：1 分钟内最多 100 次
count = INCR ratelimit:user:1
if count == 1: EXPIRE ratelimit:user:1 60
if count > 100: 拒绝
```

- **派生：bitmaps**：strings 的位操作。`SETBIT login:20260807 12345 1`（标记用户 ID 12345 当天登录）、`BITCOUNT login:20260807`（统计当天登录人数）。1 亿用户只需 12MB，做活跃统计极省内存。
- **派生：hyperloglog**：基数估算结构，固定 12KB 估算亿级 UV，误差 0.81%。`PFADD uv:20260807 user123`/`PFCOUNT`/`PFMERGE`（合并多天）。比 set 存亿级用户省内存几个数量级，但**只能算基数不能取出具体元素**。

## 二、hashes：对象字段

hashes 是「字段-值」映射，一个 key 下存多个字段，**天然适合存对象**：

```bash
HSET user:1 name alice age 30 email alice@x.com  # 设多个字段
HGET user:1 age          # 取单个字段 → "30"
HINCRBY user:1 age 1     # 字段原子自增
HGETALL user:1           # 取全部字段
HDEL user:1 email        # 删字段
```

- **比 string 存 JSON 的优势**：①省内存（小 hash 用 listpack）；②能单独改一个字段（`HINCRBY`）不必读出整个对象反序列化再存回；③字段独立过期不支持的（hash 整体过期，不能字段级过期）。
- **编码升级**：`hash-max-listpack-entries`（默认 128）与 `hash-max-listpack-value`（默认 64）以内用 listpack 省内存，超过自动升级为 hashtable。生产存大对象时要注意阈值，避免反复编码转换。

## 三、lists 与 sets

**lists** 是按插入顺序的字符串链表，两端 O(1) 插入弹出，常当**队列**：

```bash
LPUSH queue:email task1 task2    # 左端入队
BRPOP queue:email 30             # 右端阻塞弹出（30 秒超时）
LRANGE queue:email 0 -1          # 查看全部
LLEN queue:email                 # 长度
```

- **当队列的坑**：`RPOP` 取出消息后，消费者处理崩溃消息就丢了（无 ACK 机制）。要可靠队列用 stream（带 `XACK`）或外接 RabbitMQ/Kafka。
- **阻塞读 `BRPOP`**：队列为空时消费者阻塞等待，省去轮询；多个消费者订阅同一队列 = 竞争消费（每条只被一个消费者取走）。

**sets** 是无序去重集合，支持集合运算：

```bash
SADD tags:article:1 redis db nosql
SADD tags:article:2 redis cache
SINTER tags:article:1 tags:article:2   # 交集 → redis
SUNION tags:article:1 tags:article:2   # 并集
SDIFF tags:article:1 tags:article:2    # 差集（前者有后者无）
SISMEMBER tags:article:1 redis          # 是否成员 → 1
```

做「共同关注」「共同好友」「标签筛选」极方便。小整数集合用 intset 省内存。

## 四、sorted sets：排行榜与延迟队列

sorted sets（zset）是 Redis 最有价值的结构之一——每个元素关联一个 score，元素按 score 自动排序，底层**跳表 + 哈希表**（跳表负责排序与范围查询，哈希表负责 O(1) 取 score/rank）：

```bash
ZADD rank 100 alice 90 bob 85 carol   # 加成员带 score
ZSCORE rank alice                       # 取 score → "100"
ZRANK rank alice                        # 升序排名（0 开始）
ZREVRANK rank alice                     # 降序排名（0 开始，Top1）
ZREVRANGE rank 0 9 WITHSCORES           # 取 Top 10（降序，带 score）
ZRANGEBYSCORE rank 80 100               # 按 score 范围 [80,100] 取
ZINCRBY rank 5 alice                    # score 原子 +5
```

- **排行榜**：游戏积分榜、热榜、点赞数排序。`ZREVRANGE rank 0 9` 取 Top 10 是 O(logN+M)，高效。
- **延迟队列**：score 存「任务应该执行的时间戳」，后台 worker 周期性 `ZRANGEBYSCORE delay_queue 0 now LIMIT 0 10` 取出到期任务，处理完 `ZREM`。
- **复杂度**：插入/删除/查分都是 O(logN)，范围查询 O(logN+M)。N 是元素数，百万元素级仍快——但**避免无界增长**，定期清理过期成员。

## 五、streams：靠谱的消息队列

streams 是 5.0 引入的「**带持久化的消息日志**」，对标 Kafka 的 consumer group，补上了 lists 当队列「无 ACK 易丢消息」的短板：

```bash
# 生产：* 表示让 Redis 自动生成 ID（时间戳-序号）
XADD orders * type create amount 100

# 消费组（一次性创建）
XGROUP CREATE orders order-group $ MKSTREAM

# 消费组消费：> 表示只取从未投递过的新消息
XREADGROUP GROUP order-group consumer-1 COUNT 10 BLOCK 5000 STREAMS orders >
# 处理完后确认
XACK orders order-group <消息ID>

# 消费者宕机后，未 ACK 的消息在 PEL，可被其他消费者接管
XPENDING orders order-group              # 查看 pending 消息
XCLAIM orders order-group consumer-2 60000 <消息ID>  # 接管空闲超 60s 的消息
```

- **持久化**：stream 是 Redis 的数据结构，写 XADD 会落 RDB/AOF，重启不丢。
- **消费组（consumer group）**：记录每个消费者读到的位置，未 `XACK` 的消息进 PEL，可重投。这是「**可靠投递**」的关键。
- **容量控制**：`XADD ... MAXLEN ~ 10000`（~ 表示近似裁剪，更高效）限制流长度，避免无限增长。
- **与 Kafka 对比**：stream 更轻（无需独立集群）、延迟更低（内存）；但容量受内存限制、吞吐不如 Kafka——适合中小规模消息流，超大规模仍用 Kafka。

## 六、RDB 与 AOF：两种持久化的取舍

| 维度 | RDB | AOF |
| --- | --- | --- |
| 触发 | `SAVE`/`BGSAVE`/`save` 配置 | 每条写命令后（按 fsync 策略） |
| 数据安全 | 两次快照间丢数据 | `everysec` 最多丢 1 秒 |
| 恢复速度 | **快**（load 二进制） | **慢**（重放命令日志） |
| 文件体积 | **小**（压缩） | **大**（需 rewrite） |
| fork 开销 | 每次 BGSAVE 都 fork | 仅 rewrite 时 fork |
| 可读性 | 二进制不可读 | 文本可读 |

- **RDB 的 fork 与 COW**：`BGSAVE` 调 `fork()`，子进程把父进程此刻的内存 dump 成 rdb。父进程继续服务，靠**写时复制**保证快照一致——但 fork 后父进程若大量写，COW 会复制大量内存页，**实例内存可能瞬间涨到接近 2 倍**，大实例（几十 GB）要预留内存。fork 本身复制页表也要时间（大实例 fork 会导致**主线程暂停几十到几百 ms**），是「**大实例 fork 卡顿**」坑的根源。
- **AOF 的 fsync 策略**：`appendfsync always` 最安全但每次写都 fsync 性能差；`everysec` 默认，每秒 fsync 一次最多丢 1 秒；`no` 交给 OS（约 30 秒 fsync 一次，丢得多）。生产用 `everysec` 平衡。
- **AOF 重写（rewrite）**：日志越积越大（`INCR c` 一万次就是一万行），`BGREWRITEAOF` 根据当前内存数据**重写**最小命令集（`SET c 10000` 一行替代），压缩体积。也用 fork + COW，重写期间新命令同时写旧 AOF 与缓冲，重写完原子替换。
- **混合持久化**：`aof-use-rdb-preamble yes`（5.0 默认开），重写时子进程先 dump RDB 做 AOF 开头，重写期间的增量命令以 AOF 格式追加。重启 load 时先读 RDB（快），再 replay 末尾 AOF（少）——**生产推荐**。

## 七、过期与内存淘汰

Redis 作为缓存，内存有限，必须管理 key 的生命周期：

- **设置过期**：`EXPIRE key 60`（60 秒后过期）、`SET key val EX 60`、`TTL key`（查剩余秒数）、`PERSIST key`（取消过期）。
- **过期删除策略**（双管齐下）：①**惰性删除**——每次访问 key 时检查是否过期，过期则删并返回 nil，保证「不访问不浪费 CPU」；②**定期删除**——Redis 每 100ms 随机抽样一批带过期的 key 检查，删掉过期的，若过期比例高则继续抽，控制内存里「过期但未访问」的 key 不堆积。两者结合兼顾 CPU 与内存。
- **内存淘汰（eviction）**：`maxmemory` 配额满了，按 `maxmemory-policy` 决定怎么办：
  - `noeviction`（默认）：拒绝新写，返回错误（适合当数据存储不是缓存）。
  - `allkeys-lru`：所有 key 里淘汰最久未用的（**缓存推荐**）。
  - `volatile-lru`：只淘汰设了过期的 key 里最久未用的。
  - `allkeys-lfu`/`volatile-lfu`（4.0+）：淘汰访问频率最低的（LFU 用频率更准）。
  - `volatile-ttl`：淘汰最快要过期的。
  - `allkeys-random`/`volatile-random`：随机淘汰。

## 交互演示

本叶无专门可视化，数据结构与持久化偏命令实操，建议本地起一个 Redis（`docker run -p 6379:6379 redis`）用 `redis-cli` 跑一遍上述命令加深印象。

## 下一步

数据结构与持久化讲完后，下一步进入生产关键话题——[集群、哨兵、缓存模式与 Valkey](./clustering-and-caching)，讲清主从复制、Sentinel 故障转移、Cluster 分片、cache-aside 等缓存模式，以及 2024 年 BSD → RSALv2/SSPL 的许可变更与 Valkey 分支。
