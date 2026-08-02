---
layout: doc
---

# OpenSSH

**OpenSSH**（Open Secure Shell）是远程登录与加密传输的事实标准——SSH 进服务器、scp/rsync 拷贝文件、SSH 隧道穿透防火墙，背后都是它。本叶聚焦 OpenSSH 的**日常高频操作**：密钥管理（`ssh-keygen` 生成 ed25519 密钥、`ssh-agent`/`ssh-add` 托管私钥）、配置文件（`~/.ssh/config` 用 `Host`/`ProxyJump`/`LocalForward` 消除重复参数）、端口转发（`-L`/`-R`/`-D` 三种隧道）。掌握这些，远程操作效率提升一个量级。

OpenSSH 的全部考点围绕**免密与隧道**展开：①**密钥认证**（ed25519 取代 RSA，公钥放服务器、私钥留本地，告别密码）；②**ssh-agent**（私钥解密后的口令缓存在内存，避免每次输 passphrase）；③**配置文件**（`~/.ssh/config` 把 `ssh -i key -p 2222 user@host` 浓缩成 `ssh prod`）；④**端口转发**（`-L` 本地转发访问内网数据库、`-R` 反向转发把内网服务暴露出来、`-D` 动态 SOCKS 代理）。本叶是「网络与远程」子组的**安全通道核心**——前置[网络工具](../network-tools/)叶的 scp/rsync 都走 SSH，后接[OpenSSL](../openssl/)叶讲 SSH 底层依赖的 TLS/证书体系。**边界**：SSH 协议理论（握手/加密套件）归网络章，本叶只讲工具操作。

## 评价

**优点**

- **密钥认证免密**：ed25519 公钥认证一次配置永久免密，比密码更安全（不可暴力破解）也更便捷
- **配置文件消除重复**：`~/.ssh/config` 把冗长的 `-i/-p/user@host` 浓缩成别名，`ssh prod` 即可
- **隧道穿透灵活**：`-L/-R/-D` 三种转发让 SSH 成为万能隧道，访问内网、暴露服务、动态代理一站搞定
- **传输加密**：所有 SSH 流量（登录/scp/rsync/隧道）端到端加密，公网传输也安全

**缺点**

- **密钥管理易出错**：权限错误（`.ssh` 非 700、`authorized_keys` 非 600）是认证失败的头号原因
- **RSA 老密钥仍泛滥**：旧资料推荐 RSA-2048，但 ed25519 更短更快更安全，迁移有认知成本
- **端口转发概念绕**：`-L/-R/-D` 的「本地/远程/动态」方向易混，初学者常建错方向
- **agent 转发有风险**：`ForwardAgent yes` 在不可信跳板机上可能被恶意 root 盗用私钥，需谨慎

## 本叶地图

- [入门](./getting-started) —— OpenSSH 定位、ed25519 密钥生成、ssh-agent 托管、`~/.ssh/config` 速查、三种端口转发总览
- [密钥与配置](./guide-line/keys-and-config) —— `ssh-keygen` 详解、`ssh-agent`/`ssh-add` 工作机制、`~/.ssh/config` 的 Host/ProxyJump/LocalForward 完整语法
- [隧道与端口转发](./guide-line/tunneling) —— `-L` 本地转发、`-R` 反向转发、`-D` 动态 SOCKS 代理的方向语义与实战
- [参考](./reference) —— ssh 命令速查、`~/.ssh/config` 指令表、权限要求、易错点清单

## 幻灯片地址

<a href="/SlideStack/openssh-slide/" target="_blank">OpenSSH</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=OpenSSH" target="_blank" rel="noopener noreferrer">OpenSSH 测试题</a>
