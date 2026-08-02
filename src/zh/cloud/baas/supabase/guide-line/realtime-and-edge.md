---
layout: doc
outline: [2, 3]
---

# Realtime、Storage 与 Edge Functions

> 基于 Supabase · 核于 2026-08

## 速查

- **Realtime**：基于 WebSocket 的实时推送。订阅三类事件——**Postgres Changes**（表增删改）、**Presence**（谁在线）、**Broadcast**（客户端间广播）。
- **Postgres Changes 原理**：表变更产生 **WAL（Write-Ahead Log）**，Realtime 服务（Elixir/Phoenix Channels）通过**逻辑复制**消费 WAL，转成事件推给订阅的客户端。
- **订阅粒度**：可订阅全表 `postgres_changes(event='*')`，也可过滤到具体行（`filter=id=eq.1`）和事件类型（INSERT/UPDATE/DELETE）。
- **Presence**：跟踪"谁在线"——客户端心跳上报状态，服务端维护在线列表，断线自动剔除。聊天/协作里展示在线成员。
- **Broadcast**：客户端之间低延迟广播消息（不必落库），适合鼠标位置、临时通知。
- **Storage**：**S3 兼容**的对象存储（图片/视频/PDF/任意文件），底层用 AWS S3 或自托管（基于 S3 协议）。
- **Storage 的 RLS**：存储桶（bucket）和对象的访问**也由 RLS 策略控制**——上传/下载鉴权和数据库行级权限用**同一套机制**，不再是另写一套对象存储 ACL。
- **Edge Functions**：基于 **Deno** 运行时的无服务器函数，部署在**全球 CDN 边缘节点**（Deno Deploy），靠近用户执行，TypeScript 原生。
- **Edge Functions 用途**：Webhook、第三方 API 调用（绕过 CORS/密钥）、定时任务（Cron）、聚合查询、Stripe 集成。
- **定价亮点**：免费层**无限 API 请求**（不计调用次数）、500MB 数据库、1GB 存储、50k 月活用户、500MB Edge Functions 流量、2 个免费项目。
- **进阶顺序**：本叶讲实时/存储/函数 → [参考](../reference)（对比表/定价/易错点）。

## 一、Realtime：订阅 Postgres 变更

Supabase Realtime 让前端"数据一变，界面就更新"，无需轮询。它由三块组成：

### 1. Postgres Changes（数据变更）

订阅某张表的增删改：

```js
supabase
  .channel('todos-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'todos', filter: 'user_id=eq.10' },
    (payload) => console.log('变更:', payload)
  )
  .subscribe();
```

**原理**：

```
客户端 UPDATE todos SET done=true WHERE id=1
   → Postgres 写 WAL（逻辑复制需开启 replica identity）
   → Realtime 服务（Elixir/Phoenix Channels）消费 WAL
   → 转成 { eventType, table, oldRecord, newRecord } 事件
   → 通过 WebSocket 推给所有订阅该表/该行的客户端
```

- **filter**：可按列过滤（如只订阅自己的 todo），减少无关推送。
- **Replica Identity**：要拿到 UPDATE/DELETE 的**旧值**（oldRecord），表需设 `REPLICA IDENTITY FULL`（默认只记主键）。
- **权限**：Realtime 推送**同样受 RLS 约束**——客户端只能收到它有权读的行的变更。
- **吞吐上限**：免费层每秒事件数有上限；高并发（如万人协作）要升级或自己分片。

### 2. Presence（在线状态）

```js
const channel = supabase.channel('room-1', {
  config: { presence: { key: user.id } },
});
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState(); // 当前在线用户
});
channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') await channel.track({ name: user.name });
});
```

客户端定期心跳上报状态，服务端聚合在线列表并同步给所有人；断线超时自动剔除。用于聊天室在线成员、协作编辑光标。

### 3. Broadcast（消息广播）

客户端之间直接广播消息，**不必落库**：

```js
channel.on('broadcast', { event: 'cursor' }, ({ payload }) =>
  drawCursor(payload)
);
await channel.send({ type: 'broadcast', event: 'cursor', payload: { x, y } });
```

适合鼠标位置、临时通知等"过时即丢"的瞬时数据。

## 二、Storage：S3 兼容且受 RLS 保护

Supabase Storage 是**对象存储**（存图片/视频/PDF/任意二进制），两个关键特性：

### 1. S3 兼容

- 底层可用 **AWS S3**（官方云）或**自托管 S3 协议存储**；API 兼容 S3，能用 `aws-sdk`/`rclone` 直接操作。
- 组织成 **bucket（桶）→ 对象**。桶分 **public**（公开读）和 **private**（需鉴权）。

### 2. 由 RLS 策略保护

最特别的一点：**Storage 的访问鉴权用和数据库同一套 RLS 机制**。Storage 内部有 `storage.buckets` / `storage.objects` 表，对这些表写策略即可：

```sql
-- 用户只能读写自己前缀下的对象
create policy "用户自己的文件"
  on storage.objects for all
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

效果：前端 `supabase.storage.from('avatars').list()` 只返回当前用户有权读的对象——**文件权限和行权限统一**，这是 Firebase Storage 的 Security Rules 之外、Supabase 把权限收口到 Postgres 一层的体现。

```js
// 上传
await supabase.storage.from('avatars').upload(`${user.id}/face.png`, file);
// 下载（私有桶生成限时签名 URL）
const { data } = supabase.storage.from('avatars').createSignedUrl(path, 60);
// public 桶直接拼公开 URL
```

- **Public 桶**：对象有公开 URL，任何人能读（如网站静态图）。
- **Private 桶**：每次下载生成**签名 URL**（限时），或经 SDK 带 JWT 下载。
- **变换（Transformations）**：官方云支持图片实时变换（缩放/裁剪/格式转换），按 URL 参数 `?width=200`。

## 三、Edge Functions：Deno 全球边缘

Edge Functions 是 Supabase 的**无服务器函数**，三个要点：

### 1. 基于 Deno，全球边缘

- 运行时是 **Deno**（不是 Node）——TypeScript 原生、用 URL 导入依赖、启动快。
- 部署在 **Deno Deploy** 的全球 **CDN 边缘节点**（全球 30+ 区域），请求**就近处理**——比 AWS Lambda 的"区域集中"延迟更低。
- 冷启动快（毫秒级，远低于 Lambda 的百毫秒级）。

### 2. 典型用途

```ts
// deno 标准库 + Supabase SDK
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

serve(async (req) => {
  const supabase = createClient(URL, ANON_KEY, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } },
  });
  // 用调用者的 JWT 访问数据库（受 RLS 约束）
  const { data } = await supabase.from('profiles').select('*');
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
});
```

- **Webhook 处理**：Stripe 支付回调、GitHub 事件。
- **绕过 CORS/密钥**：在边缘调用第三方 API，密钥不暴露给前端。
- **聚合查询**：多表 JOIN/RPC 在函数里执行，避免前端多次往返。
- **定时任务（Cron）**：配 `pg_cron` 或 Supabase 的 Schedule 定时触发函数。

### 3. 与 Lambda 的差异

| 维度 | Supabase Edge Functions | AWS Lambda |
| --- | --- | --- |
| 运行时 | Deno（TS 原生） | Node/Python/Java/... |
| 部署位置 | 全球 CDN 边缘（就近） | 单区域 |
| 冷启动 | 毫秒级 | 百毫秒级（Node） |
| 适合 | 轻量、全球、低延迟 | 重计算、长任务、生态丰富 |

Edge Functions 不适合长任务（默认超时短，免费层 150s）；重计算/大数据处理仍用 Lambda 或单独的后端。

## 四、定价：免费层无限 API 调用

Supabase 定价的核心吸引力：**免费层不限 API 请求次数**（与 Firebase 按读写计次不同）。

| 项 | 免费层 | Pro（$25/月） |
| --- | --- | --- |
| 项目数 | 2 个 | 8 个 |
| **API 请求** | **无限** | 无限 |
| 数据库 | 500MB | 8GB |
| 存储 | 1GB | 100GB |
| 月活用户（MAU） | 50k | 100k |
| Edge Functions 调用 | 500k/月 | 2M/月起 |
| Edge Functions 流量 | 500MB | 250GB |
| Realtime 并发连接 | 200 | 500+ |
| PITR（时间点恢复） | 无 | 有 |

- **免费层风险**：项目 **7 天无活动会暂停**（数据保留，可唤醒）；适合个人/原型。
- **超额计费**：Pro 超出额度按量计费（如每 GB 存储、每 MAU）。
- **vs Firebase 计费**：Firebase 按 Firestore 读写次数、带宽、函数调用计费，**流量大了账单不可控**；Supabase 免费层无限 API 调用，对读多场景更友好。

## 下一步

掌握三大产品后，进入 [参考](../reference)——Supabase vs Firebase 完整对比大表、产品矩阵、易错点清单与权威链接，把整个能力图景收口。
