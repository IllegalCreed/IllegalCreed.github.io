---
layout: doc
outline: [2, 3]
---

# 入门：OpenSSH 密钥、配置与隧道

> 基于 OpenSSH · 核于 2026-08

## 速查

- **OpenSSH 是什么**：远程登录与加密传输的事实标准。`ssh` 登录、`scp`/`rsync` 拷文件、SSH 隧道穿透，背后都是它。
- **密钥认证 vs 密码**：公钥放服务器（`~/.ssh/authorized_keys`），私钥留本地（`~/.ssh/id_ed25519`）。免密登录 + 不可暴力破解，比密码更安全更便捷。
- **ed25519 是首选**：`ssh-keygen -t ed25519`。比 RSA 更短（公钥一行 80 字符）、更快、抗量子前景更好。RSA 仅在老系统不支持 ed25519 时用（选 RSA-4096）。
- **ssh-agent**：私钥若设了 passphrase，每次用都要输。`ssh-agent` + `ssh-add` 把解密后的私钥缓存在内存，会话内免再输。macOS 用 `ssh-add --apple-use-keychain` 接入钥匙串。
- **`~/.ssh/config`**：把 `ssh -i key -p 2222 user@host` 浓缩成 `ssh prod`。用 `Host` 起别名、`ProxyJump` 多跳登录、`LocalForward` 自动建隧道。
- **端口转发三件套**：`-L` 本地转发（把远程服务映射到本地端口）、`-R` 反向转发（把本地服务映射到远程端口）、`-D` 动态 SOCKS 代理。
- **权限是命门**：`~/.ssh` 必须 700，`~/.ssh/authorized_keys` 必须 600，私钥必须 600。权限过松 SSH 直接拒绝认证（静默失败，最难排查）。
- **scp/rsync 走 SSH**：`scp`/`rsync` 默认复用 SSH 通道，密钥与 config 配好后它们也自动免密。
- **边界**：SSH 协议握手/加密套件理论归网络章；本叶只讲 `ssh-keygen`/agent/config/转发的**工具操作**。
- **进阶顺序**：[密钥与配置详解](./guide-line/keys-and-config) → [隧道与端口转发](./guide-line/tunneling) → [参考](./reference)。

## 一、为什么用密钥而不是密码

密码认证的问题：①弱密码可被暴力破解（字典攻击）；②每次登录都要输，繁琐；③密码要在网络中传输（虽在 SSH 加密通道内，但一旦机器被入侵密码就泄露）。**密钥认证**用非对称加密彻底解决：

- **公钥**放服务器（`~/.ssh/authorized_keys`），**私钥**留在本地（`~/.ssh/id_ed25519`），登录时用私钥签名证明身份，服务器用公钥验证。
- 私钥**永不上传服务器**，也不在网络传输——即使服务器被攻破，攻击者也拿不到你的私钥。
- 一对密钥可复用到多台服务器，配置一次永久免密。

这种「私钥签名、公钥验证」的机制是 SSH 安全的基石，也是 Git（GitHub SSH key）、scp/rsync 加密传输的通用方案。

## 二、生成密钥：ssh-keygen

```bash
ssh-keygen -t ed25519 -C "alice@laptop"      # 首选 ed25519
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_github -C "github"   # 指定文件名（多账号）
ssh-keygen -t rsa -b 4096                     # 仅老系统不支持 ed25519 时用
```

- **`-t ed25519`**：算法选 ed25519（Edwards-curve Digital Signature Algorithm）。公钥约 80 字符一行，私钥文件几十行，比 RSA 短得多；签名验证速度快；安全性在同等密钥长度下优于 RSA。
- **`-C "comment"`**：注释，通常写邮箱标识这把钥匙的用途/所有者（不参与认证，纯备注）。
- **`-f`**：指定输出文件名，多账号场景（GitHub 个人号 + 公司号）用不同文件名区分。
- **passphrase**：私钥的二次密码保护。即使私钥文件被盗，没有 passphrase 也无法用。代价是每次用都要输——这正是 `ssh-agent` 要解决的问题。

生成后会有两个文件：
- **私钥** `~/.ssh/id_ed25519`（**保密**，权限 600，永不上传）。
- **公钥** `~/.ssh/id_ed25519.pub`（可公开，复制到服务器的 `authorized_keys`）。

## 三、部署公钥：免密登录

把公钥复制到服务器的 `~/.ssh/authorized_keys` 即可实现免密：

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@host    # 自动追加到远程 authorized_keys
# 或手动
cat ~/.ssh/id_ed25519.pub | ssh user@host "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

- **`ssh-copy-id`**：自动完成「把本地公钥追加到远程 authorized_keys 并设好权限」，是最省事的方式。
- **权限是命门**（最容易踩的坑）：远程 `~/.ssh` 必须 700，`authorized_keys` 必须 600。权限过松（如 644/Group 可读），SSH 的 `sshd` 会**静默拒绝**密钥认证（不报错，直接回退到密码），让你以为密钥配错了却查不出原因。`ssh-copy-id` 会自动设对权限，手动操作时要 `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`。

## 四、ssh-agent：免输 passphrase

私钥设了 passphrase 后，每次 `ssh`/`scp`/`git push` 都要输，繁琐。`ssh-agent` 解决：

```bash
eval "$(ssh-agent -s)"            # 启动 agent（输出环境变量）
ssh-add ~/.ssh/id_ed25519         # 把私钥加入 agent（会问一次 passphrase）
ssh-add -l                        # 列出已加载的密钥指纹
ssh-add -D                        # 删除所有已加载的密钥
```

- **工作原理**：`ssh-agent` 是一个常驻进程，持有**已用 passphrase 解密**的私钥（在内存中）。`ssh` 连接时不再读私钥文件，而是找 `SSH_AUTH_SOCK` 指向的 agent，让 agent 代为签名——agent 已有解密后的私钥，无需再问 passphrase。
- **macOS 钥匙串**：`ssh-add --apple-use-keychain ~/.ssh/id_ed25519` 把 passphrase 存进 macOS 钥匙串，重启后自动加载，真正永久免输。
- **Linux**：配合 `AddKeysToAgent yes`（写在 `~/.ssh/config`）首次使用时自动加入 agent。

## 五、~/.ssh/config：消除重复参数

每次写 `ssh -i ~/.ssh/work_key -p 2222 alice@prod-server.company.com` 太长。`~/.ssh/config` 把它浓缩成 `ssh prod`：

```
Host prod
    HostName prod-server.company.com
    User alice
    Port 2222
    IdentityFile ~/.ssh/work_key

Host github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_github

Host bastion
    HostName jump.company.com
    User deploy

Host internal-*            # 通配符匹配所有 internal- 开头
    ProxyJump bastion      # 经跳板机登录
```

- **`Host`**：你自定义的别名，之后 `ssh 别名` 即用这些参数。
- **`HostName`**：真实地址（IP/域名）。
- **`IdentityFile`**：指定私钥文件（对应 `-i`）。
- **`ProxyJump`**：跳板机——先连 bastion，再从 bastion 连目标。比老的 `ProxyCommand` 简洁。
- **`LocalForward`**：连上后自动建本地转发隧道（见隧道节）。
- **通配符**：`Host internal-*` 匹配所有以 `internal-` 开头的别名，省去重复写 ProxyJump。

## 六、端口转发：三种隧道

SSH 隧道用加密通道转发 TCP 连接，是穿透防火墙、访问内网服务的利器。三种方向：

- **`-L`（Local，本地转发）**：把**远程**机器上的服务端口，映射到**本地**某个端口。`ssh -L 5432:db.internal:5432 user@bastion` 后，本地连 `localhost:5432` 实际访问 bastion 能到达的 `db.internal:5432`。用于**从本地访问内网数据库/服务**。
- **`-R`（Remote，反向转发）**：把**本地**机器上的服务端口，映射到**远程**某个端口。`ssh -R 8080:localhost:80 user@gateway` 后，远程 gateway 上的 `localhost:8080` 实际访问你本地的 80 端口。用于**把本地服务暴露给远程**（如内网穿透）。
- **`-D`（Dynamic，动态 SOCKS 代理）**：`ssh -D 1080 user@gateway` 在本地 1080 起一个 SOCKS 代理，所有走这个代理的流量经 gateway 转发。用于**通用代理**（翻墙/全局走远程出口）。

记忆口诀：**L = Local 端口在本地、R = Remote 端口在远程、D = Dynamic 动态代理**。

## 下一步

掌握密钥与配置基础后，下一步深入两个专题——[密钥与配置详解](./guide-line/keys-and-config)（ssh-keygen/agent/config 的完整语法与陷阱）与[隧道与端口转发](./guide-line/tunneling)（三种转发的方向语义与实战）。
