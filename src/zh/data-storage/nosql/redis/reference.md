---
layout: doc
outline: [2, 3]
---

# 参考：命令速查、持久化对比与易错点

> 基于 Redis 7.x · 核于 2026-08

## 速查

- **Redis 定义**：内存键值数据结构存储，单线程事件循环 + IO 多路复用，单实例十万级 QPS、微秒级延迟。
- **六大结构**：strings（缓存/计数）、hashes（对象）、lists（队列）、sets（去重/集合运算）、sorted sets（排行榜/延迟队列）、streams（持久化消息队列）。
- **持久化**：RDB（快照，小而快但丢数据）/ AOF（日志，everysec 丢 1 秒）/ 混合（4.0+，生产推荐）。
- **高可用**：主从（异步复制，读写分离）/ Sentinel（3+ 节点监控，自动故障转移，不分片）/ Cluster（16384 槽分片 + 高可用一体）。
- **缓存模式**：cache-aside（旁路，推荐）/ write-through（同步穿透）/ write-back（异步回写，可能丢数据）。
- **三大问题**：穿透（查不存在的，布隆过滤器）/ 击穿（热 key 过期，互斥锁）/ 雪崩（大量同时过期，过期加随机 + 高可用）。
- **Lua vs MULTI**：Lua 才是真原子；MULTI/EXEC 不支持回滚。
- **许可**：7.4 起改 RSALv2/SSPL（非 OSI 开源），Valkey（Linux 基金会 fork，BSD）是替代。

## 一、六大数据结构命令速查

| 结构 | 写 | 读 | 其他 |
| --- | --- | --- | --- |
| **strings** | `SET`/`SETEX`/`SETNX`/`INCR`/`APPEND` | `GET`/`STRLEN` | `SETBIT`/`BITCOUNT`（bitmap）/`PFADD`/`PFCOUNT`（hll） |
| **hashes** | `HSET`/`HSETNX`/`HINCRBY`/`HDEL` | `HGET`/`HMGET`/`HGETALL`/`HLEN` | `HSCAN`（增量遍历大 hash） |
| **lists** | `LPUSH`/`RPUSH`/`LPOP`/`RPOP`/`LSET` | `LRANGE`/`LINDEX`/`LLEN` | `BLPOP`/`BRPOP`（阻塞）/`LTRIM`（保留区间） |
| **sets** | `SADD`/`SREM`/`SMOVE` | `SMEMBERS`/`SISMEMBER`/`SCARD`/`SRANDMEMBER` | `SINTER`/`SUNION`/`SDIFF`/`SPOP` |
| **sorted sets** | `ZADD`/`ZINCRBY`/`ZREM` | `ZSCORE`/`ZRANK`/`ZREVRANK`/`ZRANGE`/`ZRANGEBYSCORE` | `ZPOPMIN`/`ZPOPMAX`/`BZPOPMAX` |
| **streams** | `XADD`（带 `MAXLEN ~ N`） | `XLEN`/`XRANGE`/`XREAD`/`XREADGROUP` | `XACK`/`XPENDING`/`XCLAIM`/`XGROUP` |

## 二、数据结构选型表

| 需求 | 选 | 命令示例 |
| --- | --- | --- |
| 缓存 JSON/HTML | strings | `SET page:home <html> EX 60` |
| 原子计数器/限流 | strings | `INCR count:user1` |
| 存对象（多字段） | hashes | `HSET user:1 name a age 30` |
| 消息队列（无 ACK） | lists | `LPUSH q task` + `BRPOP q 0` |
| 消息队列（可靠） | streams | `XADD` + `XREADGROUP` + `XACK` |
| 排行榜 | sorted sets | `ZADD rank 100 a` + `ZREVRANGE rank 0 9` |
| 延迟队列 | sorted sets | `ZRANGEBYSCORE delay 0 now` |
| 标签/共同好友 | sets | `SINTER`/`SUNION`/`SDIFF` |
| 活跃用户统计（位） | bitmaps | `SETBIT login:20260807 uid 1` |
| 去重基数（UV） | hyperloglog | `PFADD uv:20260807 uid` + `PFCOUNT` |
| 分布式锁 | strings + Lua | `SET lock v NX EX 10` + Lua 验证删 |

## 三、持久化对比

| 维度 | RDB | AOF（everysec） | 混合（4.0+） |
| --- | --- | --- | --- |
| 数据安全 | 两次快照间丢 | 最多丢 1 秒 | 最多丢 1 秒 |
| 恢复速度 | 快 | 慢 | 较快（RDB 主体） |
| 文件体积 | 小 | 大（要 rewrite） | 中 |
| fork 开销 | 每次快照 fork | 仅 rewrite fork | 仅 rewrite fork |
| 生产推荐 | 备份用 | 单用偏慢 | **推荐**（`aof-use-rdb-preamble yes`） |

## 四、三大缓存问题对策

| 问题 | 触发 | 对策 |
| --- | --- | --- |
| **穿透** | 查不存在的 key | 缓存空值（短过期）/ 布隆过滤器前置 |
| **击穿** | 单热 key 过期 | 互斥锁（setnx 抢锁查 DB 回填）/ 永不过期 + 异步更新 |
| **雪崩** | 大量同时过期 / Redis 挂 | 过期时间加随机值 / 多级缓存 / 限流降级 / 高可用（Sentinel/Cluster） |

## 五、易错点清单

- **「Redis 是多线程的」**：错。命令执行**单线程**；6.0 起仅网络 IO（读写 buffer）用多线程，命令仍串行。所以慢命令（KEYS、大 key 操作）阻塞全实例。
- **「MULTI/EXEC 是真事务」**：错。它只「打包顺序执行」，**不支持回滚**——某条命令运行时出错，后面的继续执行不回滚。要原子 + 条件判断用 Lua。
- **「RDB 一定丢数据」**：不完全对。RDB 在快照间隔会丢，但 `SAVE`（阻塞）或 `BGSAVE` + 频繁 save 配置可降低丢失。AOF everysec 也最多丢 1 秒，二者都不是零丢失。
- **「主从复制是强一致」**：错。复制是**异步**的，主写完立即回客户端，未同步到从的写在主挂时会丢——所以 Redis 复制是最终一致，不当金融真相源。
- **「Cluster 支持跨节点事务」**：错。Cluster 中**多 key 命令（MULTI/Lua）涉及的 key 必须在同一槽**（用 hash tag `{}` 保证），否则报错。跨节点无分布式事务。
- **「list 当队列消息可靠」**：错。`RPOP` 取出消息后消费者崩溃就丢（无 ACK）。要可靠用 stream（`XACK`）或外接 RabbitMQ/Kafka。
- **「set 过期会自动清理」**：部分对。Redis 用**惰性 + 定期**删除——惰性是访问时才删，定期是周期抽样。大量过期但不访问的 key 会占内存直到定期删到，要靠淘汰策略兜底。
- **「布隆过滤器能删除元素」**：错。标准布隆过滤器**不支持删除**（一位可能被多个元素共享）。要删除用 Counting Bloom Filter 或 Cuckoo Filter。
- **「Redis 7.4 还是 BSD 开源」**：错。7.4 起改 RSALv2/SSPL，**不被 OSI 认为是开源**。要纯开源选 Valkey（Linux 基金会 fork，BSD）。
- **「分布式锁 SETNX 就够了」**：错。`SETNX` + `EXPIRE` 两步非原子（SETNX 后崩溃则锁永不过期）。要用 `SET key val NX EX 10`（一条命令原子），释放锁用 Lua（验证持锁者再删，避免误删别人的锁）。

## 六、进阶方向

- [文档模型与索引](../../mongodb/guide-line/document-model-and-indexes) —— MongoDB 文档模型对比 KV
- [宽列模型与可调一致性](../../distributed-search/cassandra/guide-line/data-model-and-consistency) —— Cassandra 对比
- [Elasticsearch](../../distributed-search/)（占位） —— 搜索引擎与缓存分工

## 权威链接

- [Redis 官方文档](https://redis.io/docs/) —— 命令与配置权威
- [Redis Commands](https://redis.io/commands/) —— 全部命令速查
- [Redis Persistence](https://redis.io/docs/management/persistence/) —— RDB/AOF 官方说明
- [Redis Cluster Specification](https://redis.io/docs/reference/cluster-spec/) —— 槽位与 gossip
- [Valkey 官网](https://valkey.io/) —— Linux 基金会 fork
- [Redis license change (2024)](https://redis.io/blog/redis-adopts-dual-source-available-licensing/) —— 许可变更公告
- 本站幻灯片：<a href="/SlideStack/redis-slide/" target="_blank">Redis</a>
