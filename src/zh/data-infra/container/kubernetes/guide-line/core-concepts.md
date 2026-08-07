---
layout: doc
outline: [2, 3]
---

# 核心概念：Pod、工作负载、Service 与 Namespace

> 基于 Kubernetes 1.36 · 核于 2026-08

## 速查

- **工作负载（Workload）对象**：Pod（最小单位，极少直接建）→ **Deployment**（无状态副本 + 滚动更新，最常用）→ **StatefulSet**（有状态：稳定网络名 + 稳定存储，如数据库主从）→ **DaemonSet**（每节点一个，如日志/网络 agent）→ **Job/CronJob**（跑完即退/定时）。
- **Deployment 内部**：Deployment 管 **ReplicaSet**，ReplicaSet 管 **Pod**；滚动更新 = 新建一个 ReplicaSet 逐步扩、旧 ReplicaSet 逐步缩到 0（保留 0 副本以便回滚）。
- **Service**：为一组动态变化的 Pod 提供**稳定的虚拟 IP（ClusterIP）+ DNS 名 + 负载均衡**——靠 **Label Selector** 选取后端 Pod。类型：**ClusterIP**（集群内，默认）/ **NodePort**（每节点开端口）/ **LoadBalancer**（云 LB）/ **ExternalName**（CNAME 到外部域名）。
- **Ingress**：七层（HTTP/HTTPS）流量入口，按域名/路径把流量路由到不同 Service——比 LoadBalancer 省公网 IP。**Gateway API**（HTTPRoute/Gateway）是其继任者，2024+ 进入 GA，表达能力更强。
- **Namespace**：**逻辑隔离**的命名空间（不是 Linux namespace），用于把一个物理集群切成多个虚拟集群（dev/test/prod 或多团队）。资源名在 Namespace 内唯一，跨 Namespace 可重名。
- **Label 与 Selector**：K8s 的「**关联机制**」——给对象打标签（`app=web, tier=frontend`），Service/Deployment 用 Selector（`app=web`）选取一组对象。**解耦**了「定义」与「关联」。
- **Pod 生命周期**：Pending → Running → Succeeded/Failed；重启策略 Always（默认，Deployment）/ OnFailure（Job）/ Never；**健康检查** livenessProbe（挂了重启容器）/ readinessProbe（没就绪摘出 Service）/ startupProbe（启动慢的应用用）。
- **Service 与 Pod 解耦**：Pod IP 随时变，Service IP 在其生命周期内稳定，DNS（`web.default.svc.cluster.local`）解析到 Service IP——**应用用 Service 名访问对方，绝不用 Pod IP**。
- **Headless Service**：`clusterIP: None` 的 Service，DNS 直接返回所有 Pod IP（不做负载均衡）——StatefulSet 用它给每个 Pod 一个**稳定的网络标识**（`web-0`、`web-1`）。
- **EndpointSlice**：Service 的实际后端列表（哪些 Pod 健康），kube-proxy 据此写 iptables/ipvs 规则做负载均衡。
- **坑**：Deployment 不适合有状态应用（Pod 名/IP/存储都变），上数据库用 StatefulSet；默认 Service 只集群内可达，对外要 NodePort/LoadBalancer/Ingress。

## 一、工作负载对象：怎么描述「跑什么」

K8s 用一组**工作负载（Workload）**对象来描述应用形态，按「有状态/无状态、常驻/批跑、每节点一个」分类：

| 对象 | 适用场景 | 关键特性 |
| --- | --- | --- |
| **Pod** | 最小单位，极少直接建（除非测试） | 1+ 容器共享网络/存储，临时性 |
| **Deployment** | **无状态**应用（web/api/worker），最常用 | 副本数 + 滚动更新 + 回滚，管 ReplicaSet |
| **ReplicaSet** | Deployment 内部用，少直接用 | 保证副本数恒定（少了补、多了删） |
| **StatefulSet** | **有状态**应用（数据库/消息队列主从） | 稳定网络名（`web-0/1/2`）+ 稳定存储 + 有序启停 |
| **DaemonSet** | 每个节点跑一个（日志收集/网络 CNI/监控 agent） | 新节点加入自动跑、节点移除自动清 |
| **Job** | 跑完即退的任务（数据迁移/批处理） | 成功完成即不再重试 |
| **CronJob** | 定时任务（cron 表达式） | 周期性创建 Job |

### Deployment：无状态应用的主力

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3                         # 期望副本数
  selector:
    matchLabels: { app: web }         # 选取哪些 Pod 归它管
  strategy:
    type: RollingUpdate               # 滚动更新策略
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
  template:                           # Pod 模板
    metadata:
      labels: { app: web }
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
          resources:
            requests: { cpu: 100m, memory: 128Mi }
            limits:   { cpu: 500m, memory: 256Mi }
          livenessProbe:              # 存活探针：失败重启容器
            httpGet: { path: /, port: 80 }
          readinessProbe:             # 就绪探针：失败摘出 Service
            httpGet: { path: /healthz, port: 80 }
```

- **层级**：Deployment →（管）ReplicaSet →（管）Pod。Deployment 控制器创建 ReplicaSet，ReplicaSet 保证 Pod 数。
- **滚动更新**：改 `image: nginx:1.27` → Deployment 新建一个 ReplicaSet（v2），按 `maxSurge`/`maxUnavailable` 逐步把 v2 扩到 3、v1 缩到 0。旧 ReplicaSet **保留 0 副本**（用于回滚）。
- **回滚**：`kubectl rollout undo deployment/web`——把上一个 ReplicaSet 重新扩起来、当前的缩下去。
- **资源 requests/limits**：`requests` 是调度依据（scheduler 找资源够的节点）；`limits` 是硬上限（超了被 OOMKill/CPU 限流）。**生产必须设**，否则一个 Pod 能吵醒整台机器。

### StatefulSet：有状态应用

StatefulSet 解决 Deployment 无法处理有状态应用的痛点——它保证每个 Pod 有**稳定的网络标识**（`web-0`、`web-1`）和**独立的持久存储**（即使 Pod 重调度，它绑定的 PV 跟着走）：

- **有序**：启动按 0→1→2，停止按 2→1→0——适合主从数据库（先起主、再起从）。
- **稳定网络名**：配合 **Headless Service**（`clusterIP: None`），每个 Pod 有稳定 DNS：`web-0.web.default.svc.cluster.local`——主从互相找得到对方。
- **稳定存储**：每个 Pod 绑定独立的 PVC（`data-web-0`、`data-web-1`），Pod 重调度后挂回原来的卷，数据不丢。

这是 K8s 跑 MySQL/PostgreSQL/Kafka 主从的基础，但运维复杂度高——生产建议优先用**云托管数据库**或成熟的 **Operator**（如 Strimzi Kafka Operator）。

### DaemonSet：每节点一个

DaemonSet 保证**每个节点**都跑一个 Pod 副本（新节点加入自动起、节点移除自动清）。典型用途全是「节点级 agent」：

- **日志收集**：Fluent Bit / Filebeat，收集本节点所有容器日志发往中心。
- **网络插件（CNI）**：Calico/Cilium 的 agent，配置本节点网络规则。
- **监控**：Node Exporter，上报本节点指标。
- **存储**：某些 CSI 驱动的节点侧组件。

## 二、Service 与 Ingress：流量怎么进出

Pod IP 随时变（重启、扩缩容、重调度），应用之间不能直接用 Pod IP 互访。K8s 用 **Service** 提供稳定抽象：

### Service 的类型

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector: { app: web }        # 选取带此标签的 Pod 作为后端
  type: ClusterIP               # 默认：集群内虚拟 IP
  ports:
    - port: 80                  # Service 端口
      targetPort: 80            # Pod 端口
```

| 类型 | 作用 | 何时用 |
| --- | --- | --- |
| **ClusterIP**（默认） | 集群内可达的虚拟 IP + DNS | 内部服务互访（最常用） |
| **NodePort** | 在每个节点开一个端口（30000-32767）转发到 Service | 简单对外暴露（无云 LB 时） |
| **LoadBalancer** | 调用云厂商 LB，分配一个外部 IP | 云上对外暴露服务 |
| **ExternalName** | CNAME 到外部域名（不走 Pod） | 集群内引用外部服务 |

- **负载均衡**：发往 Service IP 的流量被 kube-proxy（iptables/ipvs 规则）负载均衡到**就绪**的后端 Pod（readinessProbe 通过的）。
- **DNS**：CoreDNS 给每个 Service 自动建 DNS 记录（`web.default.svc.cluster.local`），Pod 用 Service 名就能访问对方。
- **Headless Service**（`clusterIP: None`）：不做负载均衡，DNS 直接返回所有 Pod IP——StatefulSet 用它给每个 Pod 稳定标识。

### Ingress：七层流量入口

Service（ClusterIP/NodePort/LoadBalancer）主要做**四层**（TCP/UDP）转发。要做**七层**（按 HTTP 域名/路径路由）就用 **Ingress**：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /users
            backend: { service: { name: user-svc, port: { number: 80 } } }
          - path: /orders
            backend: { service: { name: order-svc, port: { number: 80 } } }
```

- **省公网 IP**：一个 Ingress Controller（nginx-ingress / Traefik）对外一个 LB，按域名/路径分发到几十个内部 Service。
- **Gateway API（继任者）**：Ingress 表达力有限（难描述金丝雀、流量切分），**Gateway API**（HTTPRoute/Gateway/GatewayClass）2024+ 进入 GA，是 Ingress 的官方继任者，新的部署建议优先 Gateway API。

## 三、Namespace、Label 与 Selector

### Namespace：逻辑隔离

Namespace 把一个物理集群切成多个**逻辑隔离**的虚拟集群：

- **多环境/多团队**：`dev`/`staging`/`prod` 或 `team-a`/`team-b` 各自一个 Namespace，资源名互不冲突。
- **资源配额**：ResourceQuota 限制某 Namespace 的 CPU/内存/Pod 数上限，防一个团队吃光集群。
- **不是强隔离**：Namespace 是**逻辑边界**（名/权限/配额隔离），**不是安全边界**——同集群 Pod 默认网络互通，要网络级隔离用 **NetworkPolicy**。

### Label 与 Selector：关联机制

K8s 没有「外键」，对象之间的关联全靠 **Label**（标签）+ **Selector**（选择器）：

```yaml
# Pod 打标签
metadata:
  labels: { app: web, tier: frontend, env: prod }

# Service 用 selector 选取
spec:
  selector: { app: web, tier: frontend }   # 选取同时满足的 Pod
```

- **解耦**：Service 不需要知道 Pod 名/IP，只要「带这些标签的 Pod」——Pod 扩缩容、重启，Service 自动跟上。
- **等式与集合选择器**：`app=web`（等式）、`env in (prod, staging)`（集合）、`tier notin (db)`（排除）。
- **Label vs Annotation**：Label 用于**选取对象**（参与 Selector）；Annotation 用于**附加任意元数据**（如构建信息、给工具读的配置），不参与 Selector。

## 四、探针：让 K8s 知道应用是否健康

控制器要「自愈」得先知道 Pod 健不健康，靠三类**探针（Probe）**：

| 探针 | 失败后果 | 用途 |
| --- | --- | --- |
| **livenessProbe** | 重启该容器 | 容器死锁/僵死（进程还在但无法服务），K8s 杀掉重启 |
| **readinessProbe** | 从 Service 后端摘除 | 暂时不可用（如启动中/依赖未就绪），流量不进来但不重启 |
| **startupProbe** | 在它成功前禁用上面两个 | 启动慢的应用（如 JVM），避免被 livenessProbe 误杀 |

探针类型：HTTP GET（2xx/3xx 算成功）、TCP socket（能连接算成功）、exec（命令退出码 0 算成功）。

## 下一步

核心对象讲完，下一步进入日常运维——[运维与扩展](./operations)：kubectl 进阶、Helm 包管理、RBAC 权限、HPA 自动伸缩、ConfigMap/Secret 配置管理，以及 etcd 与「去 ZooKeeper」趋势对 K8s 生态的影响。
