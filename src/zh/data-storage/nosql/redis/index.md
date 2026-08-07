---
layout: doc
---

# Redis

**Redis**（**Re**mote **Di**ctionary **S**erver）是意大利开发者 Salvatore Sanfilippo（antirez）于 2009 年开源的**内存（in-memory）键值数据结构存储**——它把整个数据集放在**物理内存**里，用单线程事件循环处理命令，以「微秒级延迟、单机十万级 QPS」的极致性能，成为现代互联网架构的「**瑞士军刀**」。Redis 不只是简单的 KV（key-value）缓存，它的核心价值在于**丰富的数据结构**——strings/hashes/lists/sets/sorted sets/streams/bitmaps/hyperloglog/geospatial，每种都对应一组合子命令（如 `LPUSH`/`BRPOP`/`ZRANGEBYLEX`），让你不必在应用层手搓队列、排行榜、去重集合，一条命令搞定。这让它同时胜任**缓存**、**会话存储**、**消息队列**（发布订阅 + Stream）、**排行榜**（sorted set）、**限流器**（incr + expire）、**分布式锁**（set nx + lua）等多重角色。理解 Redis 的关键是理解「**纯内存 + 单线程 + 数据结构服务器**」这三件事如何共同造就了它的快，以及持久化（RDB/AOF）、复制、哨兵（Sentinel）、集群（Cluster）如何让一份内存数据具备**生产级的可靠性与可扩展性**。

Redis 的全部考点围绕「**快、持久、高可用、用对**」展开：①**数据结构与命令**——六大核心结构的语义、复杂度、典型用法（list 当队列、zset 当排行榜、stream 当消息流）；②**持久化**——RDB（快照、体积小、恢复快但可能丢数据）vs AOF（追加日志、丢得少但体积大、要 rewrite），以及 4.0 起的混合持久化；③**高可用**——主从复制（异步、读写分离）、Sentinel（自动故障转移）、Cluster（分片 + 高可用一体，16384 槽位）；④**缓存模式**——cache-aside（旁路缓存，最常用）、write-through/write-back（穿透/回写）、三大缓存问题（穿透/击穿/雪崩）及布隆过滤器、互斥锁、过期时间随机化等对策；⑤**Lua 脚本与事务**——`MULTI/EXEC` 是假事务（不支持回滚），Lua 才是原子性保证；⑥**2024 许可变更**——Redis 7.4 起从 BSD 改为 **RSALv2/SSPL 双协议**（不再 OSI 认可的开源），引发 **Linux 基金会fork 出 Valkey**（AWS/Google/Oracle 联合背书），这是当下选型必须知道的「**Redis 还是 Valkey**」分叉。本叶从数据结构与持久化讲起，串联集群、哨兵、缓存模式与许可变更，帮你既会用 Redis、也会选 Redis（或 Valkey）。

## 评价

**优点**

- **极致性能**：纯内存 + 单线程无锁 + IO 多路复用，单实例十万级 QPS、微秒级延迟，远超磁盘数据库
- **丰富的数据结构**：strings/hashes/lists/sets/sorted sets/streams，每种都有原子子命令，避免应用层手搓队列、排行榜
- **多面手**：一份实例同时充当缓存、会话、消息队列、排行榜、限流器、分布式锁，降低架构复杂度
- **生态成熟**：主从复制 + Sentinel 故障转移 + Cluster 分片，已被 Twitter/微博/淘宝在海量场景验证

**缺点**

- **内存成本高**：全数据驻留内存，单位存储成本远高于磁盘数据库，不适合存冷数据/海量数据
- **持久化有窗口**：RDB 快照间隔会丢数据，AOF 即使 everysec 也可能丢 1 秒——不能当唯一真相源做金融强一致
- **单线程瓶颈**：命令在主线程串行执行，大 key（如对百万元素 zset 做 `SORT`）会阻塞全实例；集群前单实例写入上限明显
- **2024 许可变更**：RSALv2/SSPL 不再是 OSI 开源，云厂商与部分企业需评估合规，催生 Valkey 分支带来生态分裂

## 本叶地图

- [入门](./getting-started) —— Redis 定义、内存模型、六大核心数据结构、RDB/AOF 持久化、发布订阅、Lua 脚本与事务
- [数据结构与持久化](./guide-line/data-structures-and-persistence) —— strings/hashes/lists/sets/sorted sets/streams 命令与复杂度、RDB 触发与 fork、AOF 重写、混合持久化、Pub/Sub 与 Stream、Lua 原子性
- [集群、哨兵、缓存模式与 Valkey](./guide-line/clustering-and-caching) —— 主从复制、Sentinel 故障转移、Cluster 16384 槽位与 gossip、cache-aside/write-through/write-back、穿透/击穿/雪崩、2024 许可变更与 Valkey
- [参考](./reference) —— 命令速查、数据结构选型表、持久化对比、缓存问题对策、易错点清单、权威链接

## 幻灯片地址

<a href="/SlideStack/redis-slide/" target="_blank">Redis</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Redis" target="_blank" rel="noopener noreferrer">Redis 测试题</a>
