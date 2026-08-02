---
layout: doc
---

# OpenSSL

**OpenSSL** 是 TLS/SSL 工具箱与密码学瑞士军刀——你申请 HTTPS 证书、检查证书过期、生成自签证书、转换密钥格式，背后都是它。本叶聚焦 OpenSSL 的**证书与密钥操作**：用 `openssl req` 生成 CSR（证书签名请求）向 CA 申请证书、用 `openssl x509`/`rsa` 检查证书与私钥的详细信息、为现代浏览器配置 SAN（Subject Alternative Names）多域名证书、以及用 `openssl req -x509` 一行命令生成自签证书用于内网/开发环境。

OpenSSL 的全部考点围绕**证书生命周期**展开：①**CSR 生成**（`openssl req` 把你的公钥 + 域名/组织信息打包成 CSR，提交给 CA 签名换正式证书）；②**证书检查**（`openssl x509 -text` 看证书的颁发者/有效期/SAN/签名算法，`openssl rsa -check` 验证私钥完整性）；③**SAN 证书**（现代浏览器要求证书必须含 SAN 扩展，否则报错；一个证书可覆盖多个域名/IP）；④**自签证书**（`openssl req -x509` 自己当 CA 签证书，用于内网/测试，浏览器会警告「不受信任」）。本叶是「网络与远程」子组的**密码学工具核心**——前置[OpenSSH](../openssh/)叶的密钥、后接 HTTPS Web 服务。**边界**：TLS 协议理论（握手/加密套件/密钥交换）归网络章，本叶只讲**工具操作**（CSR/证书管理）。

## 评价

**优点**

- **一站式密码学**：CSR 生成、证书签发、密钥检查、格式转换、调试 TLS 连接，一个工具全覆盖
- **事实标准**：Nginx/Apache/curl 等几乎所有 HTTPS 配置都直接消费 OpenSSL 生成的证书与密钥
- **CSR 流程标准化**：`openssl req` 生成的 CSR 符合 PKCS#10 标准，可提交给任意 CA（Let's Encrypt/DigiCert）

**缺点**

- **命令晦涩**：`openssl req -newkey rsa:2048 -nodes -keyout -out -subj` 一长串选项，无 GUI，上手陡
- **SAN 陷阱**：旧教程用 Common Name (CN) 配域名，但现代浏览器要求 SAN 扩展，CN-only 证书会报 NET::ERR_CERT_COMMON_NAME_INVALID
- **版本分裂**：OpenSSL 1.x 与 3.x、LibreSSL、BoringSSL 行为有细微差异，跨平台踩坑
- **错误信息不友好**：`unable to load certificate` 等错误不指明根因（多为 PEM 格式/编码问题），需经验排查

## 本叶地图

- [入门](./getting-started) —— OpenSSL 定位、CSR 与证书的关系、req/x509/rsa 核心命令、SAN 与自签速查
- [CSR 与证书](./guide-line/csr-and-certs) —— `openssl req` 生成 CSR、`x509` 检查证书、SAN 多域名证书配置、自签证书完整流程
- [密钥管理](./guide-line/key-management) —— `openssl rsa` 检查私钥、PEM/DER/PKCS 格式转换、私钥加解密、密钥与证书匹配验证
- [参考](./reference) —— OpenSSL 命令速查、证书字段速查、格式对照、易错点清单

## 幻灯片地址

<a href="/SlideStack/openssl-slide/" target="_blank">OpenSSL</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=OpenSSL" target="_blank" rel="noopener noreferrer">OpenSSL 测试题</a>
