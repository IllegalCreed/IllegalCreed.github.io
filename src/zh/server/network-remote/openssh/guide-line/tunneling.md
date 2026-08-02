---
layout: doc
outline: [2, 3]
---

# 隧道与端口转发：-L、-R 与 -D

> 基于 OpenSSH · 核于 2026-08

## 速查

- **三种转发**：`-L` 本地转发（远程服务→本地端口）、`-R` 反向转发（本地服务→远程端口）、`-D` 动态 SOCKS 代理。
- **`-L`**：`ssh -L 本地端口:目标主机:目标端口 user@跳板`，本地连 `localhost:本地端口` 经跳板到达目标。**访问内网服务**用。
- **`-R`**：`ssh -R 远程端口:目标主机:目标端口 user@远程`，远程连 `localhost:远程端口` 经你本地到达目标。**内网穿透/暴露本地服务**用。
- **`-D`**：`ssh -D 本地端口 user@远程`，本地起 SOCKS 代理，所有走代理的流量经远程出口。**通用代理**用。
- **方向记忆**：L = 端口开在**本地**（Local）；R = 端口开在**远程**（Remote）；D = **动态**（Dynamic）代理。
- **config 自动化**：`LocalForward`/`RemoteForward` 写进 `~/.ssh/config`，每次 `ssh` 自动建隧道。
- **ProxyJump**：`ssh -J bastion target` 或 config `ProxyJump bastion`，多跳登录比 ProxyCommand 简洁。

## 一、端口转发的本质

SSH 端口转发（port forwarding）= 用 SSH 的加密通道转发 TCP 连接。本质是在 SSH 连接的两端各开一个监听 socket，把到达一端口的流量，通过加密通道送到另一端，再转发给目标服务。

```
       本地机器                      SSH 加密通道              远程机器(bastion)
┌───────────────┐              ┌───────────────────┐         ┌─────────────────┐
│ 监听 :5432  ───┼──────────────┼──→ 加密传输 ───────┼─────────┼─→ 连 db:5432    │
└───────────────┘              └───────────────────┘         └─────────────────┘
   -L 5432:db:5432           （ssh 连接 bastion）              (bastion 能访问 db)
```

三种转发的区别在于「端口开在哪一端」和「流量最终去哪」。

## 二、-L：本地转发（最常用）

`-L` 把**远程**能到达的某个服务，映射到**本地**的一个端口：

```bash
# 通用语法
ssh -L [本地地址:]本地端口:目标主机:目标端口 user@ssh服务器

# 实战：经 bastion 访问内网 PostgreSQL
ssh -L 5432:db.internal:5432 user@bastion
# 之后本地 psql -h localhost -p 5432 实际访问 bastion 能到达的 db.internal:5432

# 绑定到所有网卡（默认只绑 127.0.0.1）
ssh -L 0.0.0.0:5432:db.internal:5432 user@bastion

# 后台运行（不打开 shell，纯建隧道）
ssh -fNL 5432:db.internal:5432 user@bastion
```

- **`目标主机` 是相对 ssh 服务器（bastion）的**：`db.internal` 由 bastion 解析，不是本地解析。这让本地能访问「只有 bastion 能到达」的内网地址。
- **`-fNL`**：`-f` 后台、`-N` 不执行远程命令（纯转发，不开 shell）、`-L` 本地转发。建纯隧道不交互时常用。
- **默认绑定 127.0.0.1**：只在本地回环监听，其他机器连不上（安全）。要让局域网其他机器用这个转发，写 `0.0.0.0:端口:...` 并确保 GatewayPorts 配置允许。
- **典型场景**：①开发时本地连云上 RDS（数据库只允许内网访问）；②访问公司内网的 Web 服务/Kibana/Jenkins。

## 三、-R：反向转发

`-R` 把**本地**的服务，映射到**远程**的一个端口：

```bash
# 通用语法
ssh -R [远程地址:]远程端口:目标主机:目标端口 user@ssh服务器

# 实战：把本地 8080 服务暴露到远程 gateway 的 9090
ssh -R 9090:localhost:8080 user@gateway
# 之后在 gateway 上 curl localhost:9090 实际访问你本地的 8080

# 远程端口绑定到所有网卡（需 gateway 的 GatewayPorts yes）
ssh -R 0.0.0.0:9090:localhost:8080 user@gateway
```

- **`目标主机` 是相对本地（ssh 客户端所在机器）的**：`localhost:8080` 指本地机器的 8080。
- **典型场景**：①**内网穿透**——你在 NAT 后面的本地起了个 Web 服务，想临时让公网访问，用 `-R` 暴露到有公网 IP 的 gateway；②把本地开发服务暴露给远程 webhook 测试（如支付回调）。
- **GatewayPorts**：默认 `-R` 的远程端口也只绑在远程的 127.0.0.1，要让远程公网能访问，远程 `sshd_config` 需设 `GatewayPorts yes`（或 `clientspecified`），且命令用 `0.0.0.0:端口:...`。

## 四、-D：动态 SOCKS 代理

`-D` 在本地起一个 SOCKS5 代理，所有走这个代理的流量，经 SSH 远程出口转发：

```bash
# 在本地 1080 起 SOCKS5 代理，出口是 gateway
ssh -D 1080 user@gateway

# 后台纯代理
ssh -fND 1080 user@gateway
```

- **用法**：浏览器/应用配置 SOCKS5 代理为 `127.0.0.1:1080`，所有流量经 gateway 出去（对目标网站显示 gateway 的 IP）。
- **vs `-L`**：`-L` 是「一个端口转发到一个固定目标」，`-D` 是「一个代理端口转发到任意目标」——浏览器访问 google.com 走代理到 gateway 再到 google，访问 github.com 走代理到 gateway 再到 github，目标动态决定。
- **典型场景**：①通用翻墙/科学上网；②让本地所有流量走公司出口以访问公司内网；③临时把某台远程机器作为代理出口。

## 五、方向语义对比

| 维度 | `-L` 本地转发 | `-R` 反向转发 | `-D` 动态代理 |
| --- | --- | --- | --- |
| 监听端口在哪 | **本地** | **远程**（ssh 服务器端） | **本地** |
| 流量最终去哪 | 远程能到达的目标 | 本地能到达的目标 | 任意（由应用决定） |
| 典型场景 | 本地访问内网数据库 | 内网穿透/暴露本地服务 | 通用 SOCKS 代理 |
| 默认绑定 | 127.0.0.1（本地） | 127.0.0.1（远程） | 127.0.0.1（本地） |
| 语法 | `-L 本地:目标主机:目标端口` | `-R 远程:目标主机:目标端口` | `-D 本地端口` |

**方向记忆法**：
- 大写字母指「端口开在哪一端」——**L** 端口开在 **L**ocal，**R** 端口开在 **R**emote。
- `-D` 是 **D**ynamic，不固定目标，做通用代理。

## 六、config 自动化隧道

把隧道写进 `~/.ssh/config`，每次 `ssh 别名` 自动建立：

```
Host db-tunnel
    HostName bastion.company.com
    User deploy
    LocalForward 5432 db.internal:5432
    LocalForward 6379 redis.internal:6379

Host expose-local
    HostName gateway.example.com
    User deploy
    RemoteForward 9090 localhost:8080
```

- 之后 `ssh db-tunnel` 连上的同时，本地 5432（PostgreSQL）和 6379（Redis）隧道自动建好，无需每次手敲 `-L`。
- `ssh -N db-tunnel` 只建隧道不开 shell，适合纯转发用途。

## 七、ProxyJump：多跳登录

`ProxyJump`（`-J`）让 SSH 经一个或多个跳板机连到最终目标：

```bash
# 命令行
ssh -J bastion user@db.internal
# 多跳
ssh -J jump1,jump2 user@db.internal

# config
Host db-internal
    HostName 10.0.1.20
    User dbadmin
    ProxyJump bastion
```

- **工作原理**：SSH 先连 bastion，在 bastion 上建立到目标的 TCP 通道，再通过该通道完成到目标的 SSH 握手。整个链路全程加密。
- **vs ProxyCommand**：`ProxyJump` 是 OpenSSH 7.3+ 的简洁写法，等价于 `ProxyCommand ssh bastion -W %h:%p`，优先用前者。
- **多跳**：`-J jump1,jump2,target` 依次经 jump1、jump2 到 target，适合多层网络隔离的环境。

## 下一步

隧道讲完后，可回到[参考](../reference)查看 ssh 命令速查与易错点清单，或进入下一叶[OpenSSL](../../openssl/)学习 SSH 底层加密所依赖的证书与密钥管理。
