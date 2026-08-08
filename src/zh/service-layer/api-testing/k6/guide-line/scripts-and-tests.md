---
layout: doc
outline: [2, 3]
---

# 脚本与测试：JS 编写、HTTP 请求、检查与阈值

> 基于 k6 0.50+ · 核于 2026-08

## 速查

- **脚本结构**：k6 脚本是 ES Module，`import http from 'k6/http'` 引入内置模块，`export default function () { ... }` 是 VU 循环执行的请求逻辑，`export const options = {...}` 配置 VU/时长/阈值。
- **HTTP 请求**：`http.get(url)` / `http.post(url, body, params)`，返回 response 对象（含 status/body/headers/timings）；支持 header、cookies、认证、超时配置。
- **检查（checks）**：`check(res, { '断言名': fn })` 断言单次请求，类似测试框架 assert；统计通过率但**不影响退出码**（除非配合 threshold）。
- **阈值（thresholds）**：在 `options.thresholds` 定义性能红线（`http_req_duration: ['p(95)<500']`、`http_req_failed: ['rate<0.01']`），**不达标退出码非零**，是 CI 性能门禁的核心。
- **场景（stages）**：`options.stages` 定义 VU 随时间变化（ramp-up/ramp-down），如 `[{ duration: '30s', target: 20 }, { duration: '1m', target: 20 }, { duration: '30s', target: 0 }]`。
- **内置指标**：`http_req_duration`（延迟）、`http_req_failed`（失败率）、`http_reqs`（总请求数）、`iterations`、`vus`——thresholds 基于这些指标判定。
- **思考时间/睡眠**：`sleep(1)` 模拟用户思考间隔，避免 VU 死循环发请求把服务器打爆。
- **数据驱动**：用 `SharedArray` 从 CSV/JSON 加载测试数据，多个 VU 轮流用不同数据。

## 一、脚本基本结构

```js
import http from 'k6/http';        // 内置 HTTP 模块
import { check, sleep } from 'k6'; // 检查与睡眠

// 配置：VU 数、时长、阈值
export const options = {
  vus: 20,                          // 20 个并发虚拟用户
  duration: '30s',                  // 跑 30 秒
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% 请求延迟 < 500ms
    http_req_failed: ['rate<0.01'],   // 错误率 < 1%
  },
};

// VU 循环执行的请求逻辑
export default function () {
  const res = http.get('https://api.example.com/users/1');
  check(res, {
    'status 200': (r) => r.status === 200,
    '有 id 字段': (r) => r.json('id') !== undefined,
  });
  sleep(1); // 模拟用户思考 1 秒
}
```

- **`export default function`** 是 VU 每次迭代执行的逻辑，类似「一个用户的一次操作」。
- **`options`** 配置本次测试的全局参数（VU/时长/阈值/场景），与请求逻辑分离。

## 二、HTTP 请求

```js
// GET
const res1 = http.get('https://api.example.com/users', {
  headers: { Authorization: `Bearer ${__ENV.TOKEN}` },
});

// POST（JSON body）
const payload = JSON.stringify({ name: 'alice', age: 30 });
const res2 = http.post('https://api.example.com/users', payload, {
  headers: { 'Content-Type': 'application/json' },
});

// response 对象
res.status;     // 状态码，如 200
res.body;       // 响应体字符串
res.json();     // 解析成 JSON（带可选路径 res.json('data.id')）
res.headers;    // 响应头
res.timings;    // 各阶段耗时（DNS/connect/ttfb）
```

- **环境变量**：`__ENV.TOKEN` 读 `k6 run -e TOKEN=xxx` 传入的变量，避免脚本硬编码密钥。
- **批量请求**：`http.batch([...])` 并发发多个请求，模拟页面加载多资源。

## 三、检查（checks）

```js
check(res, {
  'status 200': (r) => r.status === 200,
  '响应时间 < 200ms': (r) => r.timings.duration < 200,
  'body 含 user': (r) => r.body.includes('user'),
});
```

- **作用**：断言单次请求，类似 assert；k6 统计每个 check 的通过率，终端报告展示。
- **不影响退出码**：checks 通过率低不会让 `k6 run` 失败——要让 check 失败阻断 CI，需配合 threshold（如基于 checks 的通过率阈值）。
- **用法**：checks 管「单次请求对不对」，thresholds 管「整体性能达不达标」。

## 四、阈值（thresholds）

```js
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'], // P95<500ms 且 P99<1500ms
    http_req_failed: ['rate<0.01'],                  // 错误率 < 1%
    checks: ['rate>0.95'],                           // check 通过率 > 95%
    iterations: ['count>1000'],                      // 总迭代数 > 1000
  },
};
```

- **作用**：定义性能红线，**任一不达标 → `k6 run` 退出码非零**，CI 据此阻断发布。这是 k6 做性能门禁的核心。
- **常用指标**：`http_req_duration`（延迟，支持 p(95)/p(99)/avg/max）、`http_req_failed`（失败率）、`checks`（检查通过率）、`iterations`（迭代数）。
- **delay 与 abort**：阈值可加 `{ delay: '10s', abortOnFail: true }`，让 k6 在阈值持续不达标一段时间后中止测试。

## 五、场景（stages）：ramp-up/ramp-down

```js
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // 30 秒内从 0 ramp-up 到 20 VU
    { duration: '1m', target: 20 },   // 维持 20 VU 跑 1 分钟
    { duration: '30s', target: 0 },   // 30 秒内 ramp-down 到 0
  ],
};
```

- **ramp-up**：逐步加压，避免瞬时打爆，观察系统在不同负载下的表现。
- **ramp-down**：逐步收尾，留时间让连接优雅关闭。
- **阶梯式 stress**：多个 stages 阶梯加压（20→40→60→80 VU），找拐点。

## 六、数据驱动与思考时间

```js
import { SharedArray } from 'k6/data';

const users = new SharedArray('users', () => {
  return open('users.csv').split('\n').map(line => {
    const [id, name] = line.split(',');
    return { id, name };
  });
});

export default function () {
  const user = users[Math.floor(Math.random() * users.length)];
  http.get(`https://api.example.com/users/${user.id}`);
  sleep(Math.random() * 2); // 随机思考 0-2 秒，更真实
}
```

- **SharedArray**：所有 VU 共享一份只读数据（从 CSV/JSON 加载），避免每个 VU 各读一份占内存。
- **思考时间（sleep）**：模拟真实用户操作间隔，不睡的话 VU 死循环发请求，压力远超真实流量。

## 七、VU 间状态隔离的坑

- 每个 VU 是独立 JS 上下文，**全局变量不跨 VU 共享**——在 default function 外定义的变量，每个 VU 各有一份。
- 跨 VU 共享只读数据用 `SharedArray`；跨 VU 共享可变状态要用 `exec` 或外部存储（Redis），但通常不推荐（破坏 VU 隔离）。
- 登录态：每个 VU 自己登录拿 token（在 `setup` 里批量登录，传给 VU），不要假设全局共享登录态。

## 下一步

掌握了脚本编写后，下一步看集成生态——[集成生态](./integrations)（Grafana/CI/与 JMeter 深度对比）。
