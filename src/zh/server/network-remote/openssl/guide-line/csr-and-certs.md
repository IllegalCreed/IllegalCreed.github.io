---
layout: doc
outline: [2, 3]
---

# CSR 与证书：req、x509、SAN 与自签

> 基于 OpenSSL · 核于 2026-08

## 速查

- **CSR 流程**：`openssl req` 生成私钥 + CSR → 提交 CA → CA 签名 → 得到证书 → 配到 Web 服务器。
- **req 核心选项**：`-new` 新建、`-newkey rsa:2048` 自动生私钥、`-nodes` 私钥不加密、`-subj` 非交互填主题、`-keyout/-out` 输出。
- **x509 检查**：`-text -noout` 看全部、`-dates` 看有效期、`-issuer/-subject` 看颁发者/主体、`-modulus` 看模数（验匹配）。
- **SAN 必需**：现代浏览器强制要求 SAN，仅 CN 报错。用 `-addext`（1.1.1+）或配置文件加 subjectAltName。
- **自签**：`openssl req -x509 -newkey ... -days 365` 自己签名产出证书，内网/开发用，浏览器警告。
- **签名算法**：现代用 sha256WithRSAEncryption；SHA-1 已不安全，被浏览器拒绝。

## 一、openssl req 详解

`openssl req` 既可生成 CSR（证书签名请求），也可生成自签证书（加 -x509）。

### 1.1 生成 CSR 的完整选项

```bash
openssl req -new -newkey rsa:2048 -nodes \
  -keyout domain.key -out domain.csr \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=MyCorp/OU=IT/CN=example.com" \
  -addext "subjectAltName=DNS:example.com,DNS:www.example.com"
```

| 选项 | 作用 |
| --- | --- |
| `-new` | 创建新的 CSR（非读取已有） |
| `-newkey rsa:2048` | 自动生成 2048 位 RSA 私钥（与 CSR 一起） |
| `-nodes` | 私钥不加密（No DES），生产 Web 服务器常用，避免重启输密码 |
| `-keyout file` | 私钥输出文件 |
| `-out file` | CSR 输出文件 |
| `-subj "/C=.../CN=..."` | 非交互式填主题（Country/State/Org/CN） |
| `-addext "ext"` | 添加扩展（如 subjectAltName），OpenSSL 1.1.1+ |
| `-config file` | 用配置文件（含扩展），老版本或复杂场景 |

- **`-subj` 主题字段**：`C` 国家代码（两字母如 CN/US）、`ST` 州/省、`L` 城市、`O` 组织、`OU` 部门、`CN` Common Name（主域名）。CA 对这些字段有要求（如 EV 证书要求 O 必须是合法注册公司）。
- **`-nodes` 的取舍**：Web 服务器（Nginx/Apache）重启时要能自动读私钥，所以生产私钥通常不加密（-nodes）。若加密了，每次重启服务都要手动输 passphrase，不现实。私钥的安全改由文件权限（600）和服务器本身的访问控制保障。

### 1.2 已有私钥只生成 CSR

```bash
openssl req -new -key existing.key -out domain.csr -subj "/CN=example.com"
```

用 `-key existing.key` 指定已有私钥（不再 -newkey 生成新的），只产出 CSR。

### 1.3 查看 CSR 内容

```bash
openssl req -in domain.csr -text -noout        # 看全部（含 SAN 扩展）
openssl req -in domain.csr -subject -noout     # 只看主题
openssl req -verify -in domain.csr             # 验证 CSR 签名
```

提交 CSR 给 CA 前，务必用 `-text -noout` 检查域名、组织、SAN 是否正确——一旦提交 CA 签名，改起来麻烦。

## 二、openssl x509 详解

`openssl x509` 用于查看和处理 X.509 证书。

### 2.1 查看证书信息

```bash
openssl x509 -in domain.crt -text -noout       # 全部字段（最常用）
openssl x509 -in domain.crt -dates -noout      # 有效期 notBefore/notAfter
openssl x509 -in domain.crt -issuer -noout     # 颁发者（哪个 CA 签的）
openssl x509 -in domain.crt -subject -noout    # 主体（证书属于谁）
openssl x509 -in domain.crt -serial -noout     # 序列号
openssl x509 -in domain.crt -fingerprint -noout  # 指纹
openssl x509 -in domain.crt -ext subjectAltName -noout  # 只看 SAN
```

- **`-text -noout` 的关键字段**：
  - **Issuer**：颁发者（如 Let's Encrypt Authority X3）。
  - **Validity**：`notBefore`（生效时间）/`notAfter`（过期时间）。证书过期后浏览器报错，需续期。
  - **Subject**：主体，证书所属的域名/组织。
  - **Subject Alternative Name**：SAN 域名列表（现代浏览器看这里而非 CN）。
  - **Public Key Algorithm**：公钥算法（rsaEncryption）+ 大小（2048 bit）。
  - **Signature Algorithm**：签名算法（sha256WithRSAEncryption 是现代标准；sha1WithRSA 已不安全）。

### 2.2 验证证书链

```bash
# 验证证书是否由受信任的 CA 签发
openssl verify -CAfile ca-bundle.crt domain.crt

# 验证中间证书链
openssl verify -CAfile root.crt -untrusted intermediate.crt domain.crt
```

- **证书链**：浏览器验证证书时，会从你的证书 → 中间证书 → 根证书逐级追溯，直到命中预置的受信任根 CA。配置时要把「你的证书 + 中间证书」合并成一个文件给 Nginx（`ssl_certificate`），否则部分客户端报「证书链不完整」。

## 三、SAN 证书（现代必需）

### 3.1 为什么 CN 不够了

历史上，证书的 Common Name (CN) 字段标明域名（如 CN=example.com）。但随着一个证书覆盖多域名需求增加，以及安全考虑，**RFC 6125（2011）规定浏览器应优先校验 SAN 而非 CN**。Chrome/Firefox/Safari 等现代浏览器**完全废弃了 CN 校验**，只看 SAN——如果你的证书只有 CN 没有 SAN 扩展，即使 CN 正确，浏览器也会报 `NET::ERR_CERT_COMMON_NAME_INVALID`。所以现代证书**必须**含 SAN。

### 3.2 用 -addext 生成 SAN（OpenSSL 1.1.1+，推荐）

```bash
openssl req -new -newkey rsa:2048 -nodes \
  -keyout domain.key -out domain.csr \
  -subj "/CN=example.com" \
  -addext "subjectAltName=DNS:example.com,DNS:www.example.com,DNS:api.example.com,IP:192.168.1.1"
```

- **DNS:域名**：覆盖的域名（可多个，逗号分隔）。
- **IP:地址**：覆盖的 IP（用于 IP 直连的 HTTPS，如 IP:192.168.1.1）。
- **通配符**：`DNS:*.example.com` 覆盖所有一级子域名（www/api/blog），但不覆盖 example.com 本身和二级子域（a.b.example.com）。

### 3.3 用配置文件（老版本 OpenSSL）

OpenSSL 1.1.1 之前的版本不支持 -addext，需用配置文件：

```
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = example.com

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = example.com
DNS.2 = www.example.com
DNS.3 = api.example.com
IP.1 = 192.168.1.1
```

```bash
openssl req -new -newkey rsa:2048 -nodes -keyout domain.key -out domain.csr -config san.cnf
```

## 四、自签证书

自签证书用于内网服务、本地开发、测试环境，不需要 CA：

```bash
# OpenSSL 1.1.1+，一行生成自签证书（带 SAN）
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout selfsigned.key -out selfsigned.crt \
  -days 365 -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:*.local,IP:127.0.0.1"

# 用 ECDSA（更现代，密钥更短）
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes \
  -keyout ec.key -out ec.crt -days 365 -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost"
```

- **`-x509`**：直接产出 X.509 证书（而非 CSR）。`-x509` 隐含 `-new`。
- **`-days 365`**：有效期 365 天。内网可设长（如 3650），公网不应用自签。
- **浏览器警告**：自签证书的颁发者是你自己，不在受信任 CA 列表。浏览器会显示「您的连接不是私密连接」警告。解决：①内网用户手动导入证书到系统信任列表；②开发时用 mkcert 工具（自动在本地信任）；③公网用 Let's Encrypt 等受信任 CA。

## 五、CSR/证书生成实战：从零配 HTTPS

一个完整的「生成 CSR → 申请证书 → 部署」流程：

```bash
# 1. 生成带 SAN 的私钥 + CSR
openssl req -new -newkey rsa:2048 -nodes \
  -keyout example.com.key -out example.com.csr \
  -subj "/C=CN/O=MyCorp/CN=example.com" \
  -addext "subjectAltName=DNS:example.com,DNS:www.example.com"

# 2. 检查 CSR 无误后，提交 example.com.csr 给 CA（Let's Encrypt/DigiCert）

# 3. CA 验证域名所有权后，签发并返回 example.com.crt（+ 中间证书 chain.crt）

# 4. 合并证书 + 中间证书（Nginx 需要）
cat example.com.crt chain.crt > fullchain.crt

# 5. 部署到 Nginx
# ssl_certificate     /path/fullchain.crt;
# ssl_certificate_key /path/example.com.key;

# 6. 测试
echo | openssl s_client -connect example.com:443 -servername example.com
```

## 下一步

CSR 与证书讲完后，下一个专题是[密钥管理](./key-management)——`openssl rsa` 检查私钥、PEM/DER/PKCS#12 格式转换、私钥加解密、密钥与证书匹配验证。
