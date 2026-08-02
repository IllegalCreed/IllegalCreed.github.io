---
layout: doc
outline: [2, 3]
---

# 入门：OpenSSL 证书与密钥操作

> 基于 OpenSSL · 核于 2026-08

## 速查

- **OpenSSL 是什么**：TLS/SSL 工具箱与密码学瑞士军刀。申请 HTTPS 证书、检查证书、生成自签证书、转换密钥格式，都是它。
- **CSR 与证书的关系**：**CSR**（Certificate Signing Request，证书签名请求）= 你的公钥 + 域名/组织信息，提交给 **CA**（证书颁发机构）；CA 验证你的身份后用自己的私钥给 CSR 签名，产出**证书**（CRT/CER）。CSR 是「申请表」，证书是「盖了章的批文」。
- **核心命令三件套**：`openssl req`（生成 CSR 或自签证书）、`openssl x509`（查看/处理证书）、`openssl rsa`（查看/处理 RSA 私钥）。
- **CSR 生成**：`openssl req -new -newkey rsa:2048 -nodes -keyout domain.key -out domain.csr -subj "/CN=example.com"`。-newkey 自动生成 RSA 私钥，-nodes 不加密私钥。
- **检查证书**：`openssl x509 -in domain.crt -text -noout` 看颁发者/有效期/SAN/签名算法；`openssl x509 -in domain.crt -dates -noout` 只看有效期。
- **检查私钥**：`openssl rsa -in domain.key -check -noout` 验证私钥完整性；`openssl rsa -in domain.key -text -noout` 看模数/指数。
- **SAN（Subject Alternative Names）**：现代浏览器**要求**证书含 SAN 扩展，一个证书覆盖多个域名/IP。CN（Common Name）已废弃，仅 CN 无 SAN 的证书浏览器报错。
- **自签证书**：`openssl req -x509 -newkey rsa:2048 -nodes -keyout key -out crt -days 365 -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost"`，用于内网/开发，浏览器会警告不受信任。
- **格式**：PEM（Base64 文本，最常用，`-----BEGIN CERTIFICATE-----`）、DER（二进制）、PKCS#12（.p12/.pfx，含证书+私钥，Windows 常用）。
- **边界**：TLS 协议理论（握手/加密套件）归网络章；本叶只讲 CSR/证书/密钥的**工具操作**。
- **进阶顺序**：[CSR 与证书详解](./guide-line/csr-and-certs) → [密钥管理详解](./guide-line/key-management) → [参考](./reference)。

## 一、CSR 与证书：申请 HTTPS 的流程

理解 OpenSSL 证书操作，先要厘清 CSR、私钥、证书三者的关系：

```
① 生成私钥 + CSR                      ② CA 验证身份并签名           ③ 部署
┌──────────────────────┐           ┌──────────────────────┐    ┌─────────────────┐
│ openssl req -newkey  │  提交 CSR │  CA 用自己的私钥      │    │ 私钥 + 证书     │
│  → domain.key（私钥）│ ────────→ │  给 CSR 签名         │ ─→ │  配到 Nginx     │
│  → domain.csr（CSR） │           │  → domain.crt（证书）│    │  开启 HTTPS     │
└──────────────────────┘           └──────────────────────┘    └─────────────────┘
   你本地生成                        CA 服务器（Let's Encrypt      你的 Web 服务器
   私钥永不外传                       等），CA 的公钥预置在浏览器    对外提供 HTTPS
```

- **私钥（domain.key）**：你本地生成，**永不外传**。对应 HTTPS 握手中的服务端私钥。
- **CSR（domain.csr）**：包含你的**公钥**（从私钥推导）+ 域名/组织信息。提交给 CA，是「申请书」。
- **证书（domain.crt）**：CA 用自己的私钥给 CSR 签名后的产物，证明「这个公钥确实属于 example.com」。浏览器信任是因为它预置了 CA 的根证书。

自签证书则是「自己当 CA」——用自己的私钥给 CSR 签名，省去 CA 验证步骤，但浏览器不信任（除非手动导入你的根证书）。

## 二、openssl req：生成 CSR

```bash
# 一行生成私钥 + CSR（推荐，-nodes 表示私钥不加密）
openssl req -new -newkey rsa:2048 -nodes \
  -keyout domain.key -out domain.csr \
  -subj "/C=CN/ST=Beijing/O=MyCorp/CN=example.com"

# 交互式（逐步问 Country/Org/CN 等）
openssl req -new -newkey rsa:2048 -nodes -keyout domain.key -out domain.csr

# 已有私钥，只生成 CSR
openssl req -new -key domain.key -out domain.csr -subj "/CN=example.com"

# 查看生成的 CSR 内容
openssl req -in domain.csr -text -noout
```

- **`-newkey rsa:2048`**：自动生成一个 2048 位 RSA 私钥（与 CSR 一起）。也可 `rsa:4096` 或 `ec` 参数选其他算法。
- **`-nodes`**：No DES，即私钥**不加密码**（不加密）。Web 服务器重启时无需输密码，生产常用；若不加 -nodes，私钥会被 passphrase 加密，每次重启服务都要输。
- **`-subj`**：非交互式填主题信息。`/C=国家/ST=省/O=组织/CN=域名`。CN 是 Common Name，填**主域名**。
- **`-keyout`/`-out`**：私钥输出文件 / CSR 输出文件。

## 三、openssl x509：检查证书

```bash
# 看证书全部信息（颁发者/主体/有效期/SAN/签名算法/公钥）
openssl x509 -in domain.crt -text -noout

# 只看有效期
openssl x509 -in domain.crt -dates -noout

# 只看颁发者
openssl x509 -in domain.crt -issuer -noout

# 只看主体（域名/组织）
openssl x509 -in domain.crt -subject -noout

# 验证证书链（against CA bundle）
openssl verify -CAfile ca-bundle.crt domain.crt
```

- **`-text -noout`**：最常用，打印证书所有字段（不输出原始 PEM）。重点看：Issuer（颁发者）、Validity（有效期 notBefore/notAfter）、Subject（主体）、Subject Alternative Name（SAN 域名列表）、Signature Algorithm（签名算法，sha256WithRSAEncryption 是现代标准）。
- **`-dates`**：只看有效期，排障「证书是否过期」第一手段。`notAfter` 是过期时间。

## 四、SAN：多域名证书（现代浏览器必需）

**SAN（Subject Alternative Name）** 扩展让一个证书覆盖多个域名和 IP。现代浏览器（Chrome/Firefox/Safari）**强制要求** SAN：仅用 CN（Common Name）而不带 SAN 的证书，浏览器会报 `NET::ERR_CERT_COMMON_NAME_INVALID` 错误。

```bash
# 用配置文件生成带 SAN 的 CSR（推荐）
cat > san.cnf <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
[req_distinguished_name]
CN = example.com
[v3_req]
subjectAltName = @alt_names
[alt_names]
DNS.1 = example.com
DNS.2 = www.example.com
DNS.3 = api.example.com
IP.1 = 192.168.1.1
EOF

openssl req -new -newkey rsa:2048 -nodes -keyout domain.key -out domain.csr \
  -config san.cnf
```

OpenSSL 1.1.1+ 支持更简洁的 `-addext`：

```bash
openssl req -new -newkey rsa:2048 -nodes -keyout domain.key -out domain.csr \
  -subj "/CN=example.com" \
  -addext "subjectAltName=DNS:example.com,DNS:www.example.com,DNS:api.example.com,IP:192.168.1.1"
```

## 五、自签证书：内网/开发用

自签证书（self-signed）= 自己用私钥给 CSR 签名，不需要 CA。用于内网服务、本地开发、测试环境：

```bash
# 一行生成自签证书（OpenSSL 1.1.1+，推荐 -addext 加 SAN）
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout selfsigned.key -out selfsigned.crt \
  -days 365 -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:*.local,IP:127.0.0.1"

# 老版本 OpenSSL 用 -config + -extensions v3_req 加 SAN
```

- **`-x509`**：输出 X.509 证书（而非 CSR），即直接产出证书。
- **`-days 365`**：有效期 365 天。
- **浏览器警告**：自签证书的颁发者是你自己，不在浏览器的受信任 CA 列表，所以浏览器会警告「不安全/不受信任」。内网用可手动导入证书到信任列表；公网服务必须用受信任 CA 签发的证书（如 Let's Encrypt 免费）。

## 六、openssl rsa：检查私钥

```bash
# 验证私钥完整性（OK 表示私钥有效）
openssl rsa -in domain.key -check -noout

# 看私钥详细信息（模数/公钥指数/大小）
openssl rsa -in domain.key -text -noout

# 看私钥的公钥部分
openssl rsa -in domain.key -pubout

# 验证私钥与证书是否匹配（比对模数）
openssl rsa -in domain.key -modulus -noout | openssl md5
openssl x509 -in domain.crt -modulus -noout | openssl md5
# 两个 md5 相同 = 私钥与证书匹配
```

## 下一步

掌握 CSR/证书/私钥的核心操作后，下一步深入两个专题——[CSR 与证书详解](./guide-line/csr-and-certs)（req/x509/SAN/自签的完整流程）与[密钥管理详解](./guide-line/key-management)（rsa 检查、PEM/DER/PKCS 格式转换、密钥与证书匹配）。
