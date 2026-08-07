---
layout: doc
---

# Kubernetes

**Kubernetes**（常缩写 **K8s**）是 Google 于 2014 年开源、CNCF（Cloud Native Computing Foundation）托管的**容器编排平台（container orchestration）**——它以「**声明式 API + 控制循环（reconcile loop）**」为核心范式，把「N 台机器上跑 M 个容器」这件运维噩梦，抽象成一组可描述、可自愈、可伸缩的**资源对象**：你告诉它「我要 3 个 nginx 副本」，**控制器**就会持续对比「期望状态」与「实际状态」，副本少了就拉起、节点挂了就重调度、流量来了就按 Service 负载均衡。K8s 把 Borg（Google 内部用了十年的集群管理器）的核心理念带到开源世界，靠 **Pod（最小调度单位，1 个或多个共享网络/存储的容器）**、**Deployment（声明副本数与滚动更新）**、**Service（稳定虚拟 IP + DNS + 负载均衡）**、**Ingress（七层流量入口）** 这套对象模型，让一个集群同时承载微服务、批处理、有状态应用（数据库/消息队列）。2026 年的现状是：K8s 已到 **1.36**，**每年轻微版本**（3 个并行维护），**Helm** 成为事实包管理器，**Gateway API** 正逐步替代 Ingress，**CRI/CSI/CNI** 三大接口让容器运行时、存储、网络插件化，**KEDA/Argo CD** 补齐事件驱动伸缩与 GitOps。

K8s 的全部考点围绕「**对象模型、调度、网络、运维、生态**」展开：①**核心对象**（Pod/ReplicaSet/Deployment/StatefulSet/DaemonSet/Job/CronJob）——回答「怎么描述我要跑什么」；②**网络与服务发现**（Service 的 ClusterIP/NodePort/LoadBalancer、Ingress、DNS、NetworkPolicy）——回答「流量怎么进来、容器之间怎么互访」；③**配置与存储**（ConfigMap/Secret/PV/PVC/StorageClass）——回答「配置和持久化数据怎么管」；④**调度与伸缩**（kubectl、Label/Selector、节点亲和性、HPA/VPA、Taint/Toleration）——回答「Pod 落到哪个节点、怎么自动扩缩」；⑤**安全与多租户**（Namespace、Context、RBAC 的 Role/ClusterRole/Binding、ServiceAccount）——回答「谁能干什么、怎么隔离」；⑥**生态与演进**（Helm 包管理、Operator/CRD 扩展、etcd 元数据存储、KRaft 在 Kafka 等 CNCF 项目中「去 ZooKeeper」的趋势对 K8s 生态的影响）。本叶是容器编排组的**第一站**，先讲清 K8s 的对象模型与核心资源，再讲日常运维与生态，最后与 Podman（单机 daemonless 运行时）对比。

## 评价

**优点**

- **声明式自愈**：控制器持续 reconcile 期望状态，节点故障自动重调度、副本缺失自动补齐——比脚本式运维健壮得多
- **水平扩展与负载均衡**：副本数一行命令伸缩、Service 自动负载均衡到健康端点，天然适合微服务高并发
- **标准化生态**：CRI/CSI/CNI 三大接口让运行时/存储/网络插件化，Helm/Operator/Argo CD 等工具链成熟，跨云可移植
- **滚动更新与回滚**：Deployment 内置 RollingUpdate 与历史版本回滚，发布风险可控

**缺点**

- **学习曲线陡**：对象模型庞大（Pod/Service/Ingress/ConfigMap/RBAC/HPA...）、YAML 嗨到爆，初学者上手成本高
- **资源开销大**：控制面（apiserver/etcd/scheduler/controller-manager）+ 每节点 kubelet/kube-proxy 常驻，小集群资源占用可观，单机用「杀鸡用牛刀」
- **运维复杂**：升级、证书、网络插件、存储插件、etcd 备份都有坑，生产 K8s 需要专门平台团队
- **有状态应用仍难**：StatefulSet + 持久卷虽支持有状态应用，但数据库类工作负载在 K8s 上仍是高级话题（运维复杂度 vs 云托管权衡）

## 本叶地图

- [入门](./getting-started) —— K8s 是什么、控制面/工作节点架构、Pod 与 Deployment 的关系、声明式与 reconcile、跑起第一个应用、kubectl 速通
- [核心概念](./guide-line/core-concepts) —— Pod/ReplicaSet/Deployment/StatefulSet/DaemonSet、Service（ClusterIP/NodePort/LoadBalancer）/Ingress/Gateway API、Namespace/Label/Selector
- [运维与扩展](./guide-line/operations) —— kubectl 进阶、Helm 包管理、RBAC（Role/ClusterRole/Binding/ServiceAccount）、HPA 自动伸缩、ConfigMap/Secret、etcd 与「去 ZooKeeper」趋势
- [参考](./reference) —— 对象速查、kubectl 命令清单、Helm/RBAC 速查、易错点、与 Docker Compose/Podman 对比

## 文档地址

[Kubernetes Documentation](https://kubernetes.io/docs/home/)

## 幻灯片地址

<a href="/SlideStack/kubernetes-slide/" target="_blank">Kubernetes</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Kubernetes" target="_blank" rel="noopener noreferrer">Kubernetes 测试题</a>
