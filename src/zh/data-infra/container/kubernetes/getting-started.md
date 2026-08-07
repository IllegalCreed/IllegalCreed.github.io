---
layout: doc
outline: [2, 3]
---

# 入门：容器编排、控制面与声明式 API

> 基于 Kubernetes 1.36 · 核于 2026-08

## 速查

- **一句话**：Kubernetes（K8s）是**容器编排平台**——用**声明式 API** 描述「我要 N 个副本的应用」，**控制器**持续把实际状态往期望状态拉（reconcile），节点挂了自动重调度、副本少了自动补齐。
- **架构两平面**：**控制面（Control Plane）** = 大脑（apiserver / etcd / scheduler / controller-manager）；**工作节点（Worker Node）** = 干活的机器（每个节点跑 kubelet + kube-proxy + 容器运行时 containerd）。
- **最小调度单位 = Pod**，不是容器：一个 Pod 装 1 个或多个**紧密耦合**的容器（共享网络命名空间/存储卷），K8s 调度、伸缩、销毁都以 Pod 为单位。
- **声明式 vs 命令式**：你不写「启动 3 个 nginx」，而是提交一份 YAML 描述「期望 3 个副本」，控制器自己凑齐——这让系统**自愈**且**可重入**。
- **reconcile 控制循环**：控制器周期性对比「期望状态（spec）」与「实际状态（status）」，有差异就动作（拉起/删除 Pod）。**这是 K8s 自愈的本质**。
- **跑一个应用**：`kubectl create deployment web --image=nginx:alpine --replicas=3`，再 `kubectl expose deployment web --port=80` 暴露 Service。
- **看状态**：`kubectl get pods,svc,deploy`（`-o wide` 详情、`-w` 持续 watch）；`kubectl describe pod <名>` 看事件排查问题。
- **进 Pod**：`kubectl exec -it <pod> -- sh`；看日志 `kubectl logs -f <pod>`。
- **声明式更新**：`kubectl apply -f deploy.yaml`（幂等，可重复跑）；删除 `kubectl delete -f deploy.yaml`。
- **扩缩容**：`kubectl scale deployment web --replicas=5`；回滚 `kubectl rollout undo deployment web`。
- **Helm**：K8s 的「包管理器」，用 Chart（模板 + values）一键装复杂应用（如 `helm install my-release bitnami/redis`）。
- **坑**：Pod 是临时的（重启后 IP 变、本地存储丢），要稳定访问靠 **Service**；配置别硬编码进镜像，用 **ConfigMap/Secret** 挂载。

## 一、为什么需要容器编排

Docker 解决了「单机怎么跑容器」，但当应用拆成几十个微服务、要跑几百上千个容器、横跨多台机器时，纯 Docker 就力不从心了：

- 某台机器挂了，上面的容器要**手动**在别的机器拉起吗？
- 流量高峰到了，某个服务要**自动扩容** 3→10 个副本吗？
- 新版本发布，怎么**滚动更新**且出问题能**回滚**？
- 容器之间怎么**按名字互访**（容器 IP 一直在变）？

这些问题就是**容器编排（container orchestration）**要解决的。Kubernetes 用「**声明式 API + 控制循环**」给出了答案：你描述「我要什么状态」，集群自己把现实往这个状态拉。

## 二、架构：控制面与工作节点

K8s 是**主从架构**，一个集群由**控制面（Control Plane，旧称 master）**和若干**工作节点（Worker Node）**组成：

```
┌──────────────────────── 控制面 (Control Plane) ────────────────────────┐
│  kube-apiserver   ← 唯一入口，所有组件/客户端都经它读写                  │
│  etcd             ← 分布式 KV，存全部集群状态（Pod/Service/... 的真相）  │
│  kube-scheduler   ← 决定新 Pod 落到哪个节点（资源/亲和/Taint）           │
│  kube-controller-manager ← 跑各种控制器（Deployment/ReplicaSet/Node...）│
│  cloud-controller-manager ← 与云厂商交互（LB/存储/路由）                 │
└────────────────────────────────────────────────────────────────────────┘
                              ▲
                              │  kubelet 上报状态、拉取指令
┌───────────────────── 工作节点 (Worker Node) ───────────────────────────┐
│  kubelet          ← 节点代理，管本节点 Pod 生命周期，向 apiserver 汇报   │
│  kube-proxy       ← 维护 Service 的网络规则（iptables/ipvs）            │
│  容器运行时 (CRI)  ← containerd / CRI-O（runc/crun 真正跑容器）          │
│  Pod Pod Pod ...  ← 你的应用跑在这里                                     │
└────────────────────────────────────────────────────────────────────────┘
```

- **kube-apiserver** 是**唯一入口**：`kubectl`、控制器、kubelet 都通过它读写集群状态。它做认证/授权/准入，再把数据写进 etcd。
- **etcd** 是「**集群的大脑记忆**」——所有对象（Pod/Service/Deployment...）的「真相」都存在这里。etcd 挂了没备份 = 集群失忆。所以 etcd 要**奇数节点（3/5）高可用**，并定期备份。
- **kube-scheduler**：新 Pod 创建后，scheduler 根据**资源请求、节点亲和性、Taint/Toleration、Selector** 决定它落到哪个节点。
- **控制器（Controller）**：跑在 controller-manager 里，每个控制器盯一类对象——Deployment 控制器盯 Deployment，保证它名下的 ReplicaSet 副本数达标；Node 控制器盯节点，节点失联标记 NotReady。
- **kubelet**：每个工作节点上的代理，听 apiserver 指令在本节点**真正启动/停止 Pod**（调用容器运行时），并周期上报节点状态。
- **kube-proxy**：每节点一个，负责把 **Service 的虚拟 IP** 规则写进 iptables/ipvs，让发往 Service IP 的流量被负载均衡到后端 Pod。

## 三、Pod：最小调度单位

K8s 调度的最小单位是 **Pod**，不是容器。一个 Pod 内可装一个或多个**紧密耦合**的容器，它们**共享网络命名空间**（同一 IP、同一端口空间）和**存储卷**，看起来就像一台「逻辑主机」：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web                 # Pod 名
  labels:
    app: web                # 标签，供 Service/Deployment 选取
spec:
  containers:
    - name: nginx
      image: nginx:alpine
      ports:
        - containerPort: 80
    - name: log-sidecar     # 边车容器，与 nginx 共享网络/存储
      image: fluent-bit:2.2
```

- **为什么不是容器**：容器跨主机迁移、重启后 IP 变、伸缩要按组而非单容器——K8s 把「1 个或多个协同的容器 + 共享资源」打包成 Pod 作为调度原子。
- **边车模式（sidecar）**：主容器（如 nginx）+ 辅助容器（如日志收集、Service Mesh proxy）同处一个 Pod，共享网络/存储，是 Pod 多容器设计的主流用法。
- **Pod 是临时的**：Pod 重启/重调度后 IP 变、本地存储丢、名字也可能变——所以**别直接用 Pod 的 IP 访问**，要用 **Service** 提供稳定入口。
- **日常几乎不直接建 Pod**：而是用 **Deployment**（无状态）或 **StatefulSet**（有状态）这类高层控制器托管 Pod，让它们替你管理副本与重启。

## 四、声明式与控制循环：自愈的本质

理解 K8s 的关键是理解「**声明式（declarative）+ 控制循环（reconcile loop）**」这套范式，它与命令式运维截然不同：

- **命令式（Docker/脚本）**：你敲 `docker run`、`docker rm`——系统**只做你让它做的**，挂了不会自愈。
- **声明式（K8s）**：你提交一份 YAML 描述**期望状态**（「我要 3 个 nginx 副本，用 image:1.21」），控制器**周期性**对比期望与实际，有偏差就动作：

```
Deployment: replicas=3, image=nginx:1.21      ← 期望状态（spec）
   │
   ▼  controller-manager 里的 Deployment 控制器循环
当前实际: 3 个 Pod，但其中 1 个还在跑 nginx:1.20  ← 实际状态（status）
   │
   ▼  检测到偏差 → 创建 1 个 nginx:1.21 的新 Pod，逐步删旧 Pod
   ▼  直到 3 个全是 nginx:1.21
```

- **自愈**：若有人误删一个 Pod，Deployment 控制器发现「实际 2 个 < 期望 3 个」，**自动拉起第 3 个**。
- **节点故障**：Node 控制器标记失联节点 NotReady，对应 Pod 被驱逐，相关控制器在健康节点上重调度——**应用自动恢复**。
- **可重入**：`kubectl apply -f deploy.yaml` 幂等，重复执行结果一致——这是 GitOps（用 Git 仓库作为期望状态的唯一真相）的基础。

## 五、跑起第一个应用

把上述概念串起来，用一组命令跑一个 nginx 应用并暴露访问：

```bash
# 1. 创建 Deployment（3 个 nginx 副本）
kubectl create deployment web --image=nginx:alpine --replicas=3

# 2. 看状态
kubectl get deploy,rs,pod              # Deployment → ReplicaSet → Pod 的层级
kubectl describe deploy web            # 看事件、策略

# 3. 暴露 Service（让其他 Pod/外部能稳定访问）
kubectl expose deployment web --port=80 --type=LoadBalancer
kubectl get svc web                    # 拿到外部 IP（LoadBalancer 类型）

# 4. 进 Pod 调试
kubectl exec -it <pod-name> -- sh

# 5. 扩缩容
kubectl scale deployment web --replicas=5

# 6. 滚动更新镜像
kubectl set image deployment/web nginx=nginx:1.27
kubectl rollout status deployment/web  # 看滚动进度
kubectl rollout undo deployment/web    # 回滚到上一版本
```

实际生产中很少用 `kubectl create` 这种**命令式**命令，而是写 YAML 用 `kubectl apply -f` 声明式提交（可版本化进 Git）。命令式适合快速实验，声明式适合长期维护。

## 六、kubectl 与 Helm：日常工具链

- **kubectl**：K8s 的命令行客户端，所有操作经它走 apiserver。掌握 `get/describe/apply/delete/logs/exec/scale/rollout` 八件套就能日常干活。
- **Context 与 Namespace**：`kubectl config use-context prod-cluster` 切换集群；`-n kube-system` 指定命名空间——多集群/多租户环境的必备。
- **Helm**：K8s 的「包管理器」，把一组相关 YAML（Deployment+Service+ConfigMap+...）打包成 **Chart**，用 values 覆盖参数化。`helm install my bitnami/redis` 一行装好一个 Redis（含主从、PV、Service），比手写一堆 YAML 高效得多。
- **Operator / CRD**：当 Helm 不够（如需管理有状态应用的运维逻辑——备份、主从切换），用 **自定义资源（CRD）+ Operator**（一个跑在集群里、懂某应用运维的控制器）扩展 K8s。

## 下一步

理解了 K8s 的架构、Pod 与声明式范式后，下一步深入两类核心机制——[核心概念](./guide-line/core-concepts)（Pod/Deployment/StatefulSet/DaemonSet、Service/Ingress、Namespace/Label）与[运维与扩展](./guide-line/operations)（kubectl/Helm/RBAC/HPA/ConfigMap/Secret 与 etcd）。
