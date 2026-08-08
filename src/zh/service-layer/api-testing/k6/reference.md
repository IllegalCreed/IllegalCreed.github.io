---
layout: doc
outline: [2, 3]
---

# 参考：k6 命令、脚本模板、阈值与易错点

> 基于 k6 0.50+ · 核于 2026-08

## 速查

- **k6 定义**：Grafana Labs 开发者优先负载测试工具，JS 脚本 + CLI 发起 VU 压测，阈值做门禁。
- **三大抽象**：VU（并发用户）、checks（单次断言）、thresholds（性能红线，影响退出码）。
- **脚本结构**：`import` 内置模块 → `export const options` 配 VU/时长/阈值 → `export default function` 写请求逻辑。
- **常用命令**：`k6 run script.js`、`k6 run --vus 50 --duration 1m script.js`、`k6 run -e TOKEN=xxx script.js`、`k6 run --out experimental-prometheus-rw=url script.js`。
- **场景**：smoke（少量快验）/ load（峰值）/ stress（找瓶颈）/ soak（长时查泄漏）/ spike（瞬时暴涨）。
- **集成**：Grafana + Prometheus 看结果；GitHub Actions / GitLab CI 做门禁；k6 Operator / Cloud 分布式。
- **与 JMeter**：k6 脚本即代码 + Go 轻量 + 开发者/CI 友好；JMeter GUI/XML + JVM + QA 专员。

## 一、命令速查

| 命令 | 作用 |
| --- | --- |
| `k6 run script.js` | 跑测试脚本 |
| `k6 run --vus 50 --duration 1m s.js` | 指定 50 VU 跑 1 分钟 |
| `k6 run -e TOKEN=xxx s.js` | 传环境变量（脚本里 `__ENV.TOKEN`） |
| `k6 run --stage 30s:20,1m:20 s.js` | 用 stage 配置 ramp-up |
| `k6 run --out json=result.json s.js` | 输出到 JSON 文件 |
| `k6 run --out experimental-prometheus-rw=url s.js` | 推 Prometheus |
| `k6 inspect s.js` | 检查脚本配置（不执行） |
| `k6 login cloud` | 登录 k6 Cloud |
| `k6 cloud s.js` | 在 k6 Cloud 跑分布式 |

## 二、脚本模板

### 基础负载测试

```js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get(`${__ENV.API_URL}/users/1`, {
    headers: { Authorization: `Bearer ${__ENV.TOKEN}` },
  });
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
```

### 阶梯式 stress 测试

```js
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // 2 分钟到 100 VU
    { duration: '5m', target: 100 },   // 维持 5 分钟
    { duration: '2m', target: 200 },   // 加压到 200 VU
    { duration: '5m', target: 200 },   // 维持找瓶颈
    { duration: '2m', target: 0 },     // ramp-down
  ],
};
```

## 三、阈值清单

| 指标 | 常用阈值 | 含义 |
| --- | --- | --- |
| `http_req_duration` | `p(95)<500` | 95% 请求延迟 < 500ms |
| `http_req_duration` | `p(99)<1500` | 99% 请求延迟 < 1500ms |
| `http_req_failed` | `rate<0.01` | 错误率 < 1% |
| `checks` | `rate>0.95` | 检查通过率 > 95% |
| `iterations` | `count>1000` | 总迭代数 > 1000 |

> 阈值不达标 → `k6 run` 退出码非零 → CI 阻断发布。

## 四、内置指标速查

| 指标 | 含义 |
| --- | --- |
| `http_reqs` | 总请求数 |
| `http_req_duration` | 请求总延迟（含 DNS/connect/ttfb/transfer） |
| `http_req_failed` | 失败请求比率 |
| `http_req_blocked` | 等待连接池的阻塞时间 |
| `http_req_connecting` | TCP 连接时间 |
| `http_req_tls_handshaking` | TLS 握手时间 |
| `http_req_waiting` | 等待服务器响应（TTFB）时间 |
| `http_req_receiving` | 接收响应体时间 |
| `iterations` | VU 执行 default function 的次数 |
| `vus` | 当前活跃 VU 数 |
| `data_sent` / `data_received` | 发送/接收字节数 |

## 五、易错点清单

- **「checks 失败会让 k6 run 退出码非零」**：错。checks 只统计通过率，不影响退出码；要让 check 失败阻断 CI，需配 `checks: ['rate>0.95']` 阈值。
- **「全局变量在 VU 间共享」**：错。每个 VU 是独立 JS 上下文，全局变量各有一份；跨 VU 共享只读数据用 SharedArray。
- **「不 sleep 也行」**：错。VU 死循环发请求，压力远超真实流量，会假性打爆服务器；sleep 模拟用户思考时间。
- **「k6 用 V8/Node，能 import 任意 npm 包」**：错。k6 用纯 JS 实现（非 V8/Node），不是所有 npm 包能用；特殊需求用 xk6 编译扩展。
- **「单 VU 顺序发请求 = 真实并发」**：错。要测并发必须多 VU（`--vus N`），单 VU 是顺序的。
- **「thresholds 只是统计不影响结果」**：错。thresholds 不达标退出码非零，是 CI 门禁的核心机制。
- **「JMeter 比 k6 更准」**：错。两者都是负载生成器，准确性取决于脚本设计；k6 的 VU 模型更轻量、单机能发更多并发。
- **「分布式压测必须上 k6 Cloud」**：错。可用 k6 Operator 在自建 K8s 上做分布式，Cloud 只是一键省心选项。

## 六、进阶方向（链接其他叶）

- [API 客户端](../../api-clients/) —— 单接口手动调试，与 k6 批量压测互补
- [Apollo Sandbox](../../apollo-sandbox/) —— GraphQL 接口调试，k6 可压测 GraphQL 端点

## 权威链接

- [k6 官方文档](https://k6.io/docs/)
- [k6 GitHub](https://github.com/grafana/k6)
- [k6 阈值文档](https://k6.io/docs/using-k6/thresholds/)
- [k6 Operator（K8s）](https://github.com/grafana/k6-operator)
- [k6 Cloud](https://k6.io/cloud/)
- [xk6 扩展](https://k6.io/docs/extensions/)
- [Grafana k6 看板](https://grafana.com/grafana/dashboards/2587-k6-load-testing-results/)
- 本站幻灯片：<a href="/SlideStack/k6-slide/" target="_blank">k6</a>
