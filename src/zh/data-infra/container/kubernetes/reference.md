---
layout: doc
outline: [2, 3]
---

# 参考：K8s 对象、kubectl 与生态速查

> 基于 Kubernetes 1.36 · 核于 2026-08

## 速查

- **架构**：控制面（apiserver/etcd/scheduler/controller-manager）+ 工作节点（kubelet/kube-proxy/containerd）。
- **最小单位**：Pod（1+ 容器共享网络/存储），日常用 Deployment/StatefulSet/DaemonSet 托管。
- **网络抽象**：Service（ClusterIP/NodePort/LoadBalancer）= 稳定 IP+DNS+LB；Ingress/Gateway API = 七层入口。
- **配置存储**：ConfigMap（明文）/Secret（base64，非加密）；PV/PVC/StorageClass = 持久卷。
- **权限**：RBAC（Role/ClusterRole + Binding），ServiceAccount 是 Pod 身份。
- **伸缩**：HPA 水平（按 CPU/内存，需 Metrics Server）/ VPA 垂直 / KEDA 事件驱动（可缩到 0）。
- **包管理**：Helm（Chart + values）/ Kustomize（无模板 overlay）。
- **元数据存储**：etcd（K8s 自身用），与 Kafka「去 ZooKeeper（KRaft）」无关；K8s 生态里的 Kafka（Strimzi）跟随 KRaft 去 ZK。
- **版本**：2026 年 8 月标准维护 1.34/1.35/1.36，最新稳定 1.36.x；每年 3 个小版本。
- **核心范式**：声明式 + reconcile 控制循环 = 自愈。

## 一、工作负载对象速查

| 对象 | 适用 | 关键特性 |
| --- | --- | --- |
| Pod | 最小调度单位 | 1+ 容器共享网络/存储，临时性 |
| Deployment | 无状态应用（最常用） | 副本数 + 滚动更新 + 回滚 |
| ReplicaSet | Deployment 内部用 | 保证副本数恒定 |
| StatefulSet | 有状态应用（数据库主从） | 稳定网络名 + 稳定存储 + 有序启停 |
| DaemonSet | 每节点一个（agent） | 新节点自动起、移除自动清 |
| Job | 跑完即退 | 成功完成不再重试 |
| CronJob | 定时任务 | cron 表达式周期创建 Job |

## 二、Service 与 Ingress 速查

| 类型 | 作用 | 何时用 |
| --- | --- | --- |
| ClusterIP（默认） | 集群内虚拟 IP + DNS | 内部服务互访 |
| NodePort | 每节点开端口（30000-32767） | 无云 LB 时简单对外暴露 |
| LoadBalancer | 云厂商分配外部 IP | 云上对外暴露 |
| ExternalName | CNAME 到外部域名 | 集群内引用外部服务 |
| Headless（clusterIP: None） | DNS 直接返回 Pod IP | StatefulSet 给每个 Pod 稳定标识 |
| Ingress | 七层按域名/路径路由 | 省公网 IP，多 Service 共享入口 |
| Gateway API | Ingress 继任者 | 金丝雀/流量切分等高级场景 |

## 三、kubectl 命令清单

```bash
# —— 查看 ——
kubectl get pods,svc,deploy -n app [-o wide] [-w]
kubectl get pod -l app=web                  # Label 过滤
kubectl describe pod <name>                 # 看 Events 排查
kubectl logs <pod> [-c 容器] [--previous] [-f]
kubectl exec -it <pod> -- sh

# —— 声明式管理 ——
kubectl apply -f deploy.yaml                # 创建/更新（幂等）
kubectl delete -f deploy.yaml
kubectl diff -f deploy.yaml                 # apply 前看差异

# —— Context/Namespace ——
kubectl config get-contexts
kubectl config use-context prod-cluster
kubectl config set-context --current --namespace=app

# —— 发布 ——
kubectl scale deployment web --replicas=5
kubectl rollout status deployment/web
kubectl rollout undo deployment/web
kubectl rollout history deployment/web

# —— 快速起手 YAML ——
kubectl create deployment web --image=nginx --dry-run=client -o yaml > web.yaml

# —— 排查节点 ——
kubectl get nodes -o wide
kubectl describe node <name>                # 看资源/事件
kubectl cordon <node>                       # 标记不再调度
kubectl drain <node> --ignore-daemonsets    # 驱逐工作负载（维护前）
kubectl uncordon <node>                     # 恢复调度
```

## 四、Helm 速查

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo redis

helm install <release> <chart> -f values.yaml [--set key=val]
helm list                                  # 已装 Release
helm upgrade <release> <chart> -f values.yaml
helm rollback <release> <revision>
helm uninstall <release>
helm template <release> <chart> -f values.yaml  # 渲染成 YAML 不安装（审查用）
```

## 五、RBAC 速查

| 对象 | 范围 | 作用 |
| --- | --- | --- |
| Role | 单 Namespace | 定义权限 |
| ClusterRole | 集群级（含 Node/PV 等 + 可复用） | 定义权限 |
| RoleBinding | 单 Namespace | 把 Role/ClusterRole 绑给主体 |
| ClusterRoleBinding | 集群级 | 把 ClusterRole 绑给主体 |
| ServiceAccount | Namespace 内 | Pod 的机器身份 |

```yaml
rules:
  - apiGroups: ["", "apps"]               # ""=core, "apps"=Deployment 等
    resources: ["pods", "deployments"]
    verbs: ["get", "list", "watch"]       # 读权限
```

## 六、HPA 速查

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  scaleTargetRef: { kind: Deployment, name: web }
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
```

- 前置：**Metrics Server**（CPU/内存）或 **KEDA**（自定义/事件指标，可缩到 0）。

## 七、ConfigMap/Secret 挂载方式

```yaml
spec:
  containers:
    - name: app
      # 方式一：作为环境变量（更新需重启 Pod）
      envFrom:
        - configMapRef: { name: app-config }
        - secretRef: { name: app-secret }
      # 方式二：作为文件挂载（CM 更新自动同步，约 1 分钟）
      volumeMounts:
        - name: cfg
          mountPath: /etc/app
  volumes:
    - name: cfg
      configMap: { name: app-config }
```

- **Secret 默认 base64 编码非加密**——要加密用 KMS 插件 / Sealed Secrets / External Secrets Operator。

## 八、易错点清单

- **"Pod 就是容器"**：错。Pod 是 1+ 容器的组合（共享网络/存储），是 K8s 最小调度单位。
- **"直接用 Pod IP 访问"**：错。Pod IP 随重启/重调度变化，要用 **Service 名**（DNS 稳定）。
- **"Deployment 适合所有应用"**：错。有状态应用（数据库主从）Pod 名/IP/存储会变，要用 **StatefulSet**。
- **"Secret 是加密的"**：错。Secret 默认只是 **base64 编码**，`base64 -d` 即可还原。要加密须配 KMS/Sealed Secrets。
- **"ConfigMap 改了应用立刻生效"**：作为环境变量注入的要**重启 Pod**；作为文件挂载的会自动同步，但应用要 watch 才能热加载。
- **"HPA 装上就能用"**：需要先装 **Metrics Server**，否则 HPA 拿不到 CPU/内存指标。自定义指标要用 KEDA/Prometheus Adapter。
- **"requests 没用"**：错。requests 是**调度依据**（scheduler 据此选节点），不设会被随机调度、可能挤垮节点。生产 requests/limits 都要设。
- **"用 cluster-admin 给应用最省事"**：极大风险。应用一旦被攻破，整个集群沦陷。要**最小权限**，为每个应用单独建 SA + 精确 RBAC。
- **"K8s 要去 etcd（去 ZooKeeper 趋势）"**：误解。「去 ZooKeeper（KRaft）」是 Kafka 的事，与 K8s 无关。**K8s 自身用 etcd**，生产主流仍是 etcd；只有 k3s 等轻量发行版用 Kine 适配到 SQLite/MySQL。
- **"Ingress 自己能转发"**：错。Ingress 只是规则，需要 **Ingress Controller**（nginx-ingress/Traefik）真正转发。
- **"etcd 单点也行"**：生产绝不可。etcd 要**奇数节点（3/5）**Raft 高可用 + 定期快照备份 + 独占 SSD。

## 九、与 Docker Compose / Podman 对比

| 维度 | Docker Compose | Podman | Kubernetes |
| --- | --- | --- | --- |
| 规模 | 单机多容器 | 单机/小集群（pod 概念） | 跨多机的集群 |
| 定位 | 开发/小部署 | daemonless 运行时 | 容器编排平台 |
| 架构 | 单进程 | 无 daemon（fork-exec） | 控制面 + 工作节点 |
| 自愈 | 无（容器挂要手动起） | 无（靠 systemd 单元重启） | 有（控制器 reconcile） |
| 服务发现 | 服务名解析（compose DNS） | pod 内共享网络 | Service DNS + ClusterIP |
| 自动伸缩 | 无 | 无 | HPA/KEDA |
| 包管理 | Compose 文件 | Compose / Quadlet | Helm Chart |
| 学习成本 | 低 | 中（CLI 兼容 Docker） | 高 |
| 适用 | 本地开发、小工具 | 单机生产、rootless 安全 | 微服务集群、需高可用 |

## 权威链接

- [Kubernetes 官方文档](https://kubernetes.io/docs/home/)
- [kubectl 速查表](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Helm 官方文档](https://helm.sh/docs/)
- [Kubernetes API 参考](https://kubernetes.io/docs/reference/kubernetes-api/)
- [Gateway API](https://gateway-api.sigs.k8s.io/)
- [KEDA（事件驱动伸缩）](https://keda.sh/)
- [etcd 官方文档](https://etcd.io/docs/)
- [Strimzi（Kafka on K8s）](https://strimzi.io/)
- 本站幻灯片：<a href="/SlideStack/kubernetes-slide/" target="_blank">Kubernetes</a>
