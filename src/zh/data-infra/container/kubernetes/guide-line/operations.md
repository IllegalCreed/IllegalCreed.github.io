---
layout: doc
outline: [2, 3]
---

# 运维与扩展：kubectl、Helm、RBAC 与自动伸缩

> 基于 Kubernetes 1.36 · 核于 2026-08

## 速查

- **kubectl 八件套**：`get`（看对象）、`describe`（看事件排查）、`apply -f`（声明式提交）、`delete -f`（删）、`logs`（看日志）、`exec`（进容器）、`scale`（改副本数）、`rollout`（发布/回滚）。日常运维几乎全在这几个命令上。
- **Context 与 Namespace**：`kubectl config use-context prod` 切换**集群/用户**（Context = cluster + user + namespace 的组合）；`-n <ns>` 或 `kubectl config set-context --current --namespace=app` 切 Namespace——多集群/多租户**必备**，否则误操作的代价巨大。
- **声明式 vs 命令式**：`kubectl apply -f`（声明式，可版本化、可重入，**生产首选**）vs `kubectl run/create/expose`（命令式，仅快速实验）。改对象优先 `apply`，避免 `edit`（无版本痕迹）。
- **Helm**：K8s 的「**包管理器**」。Chart = 模板 + values；`helm install my bitnami/redis` 一行装好一个含主从/PV/Service 的复杂应用。生产装中间件几乎全用 Helm。
- **ConfigMap/Secret**：把配置/敏感数据从镜像剥离——ConfigMap 存明文配置，Secret 存密码/密钥（base64 编码，**不是加密**，要加密用 KMS/Sealed Secrets/External Secrets）。两者都可作环境变量或文件挂载进 Pod。
- **RBAC**：基于角色的访问控制。**Role**（Namespace 内权限）+ **RoleBinding**（绑给用户/ServiceAccount）；跨 Namespace 用 **ClusterRole** + **ClusterRoleBinding**。动词如 `get/list/watch/create/update/delete`。
- **ServiceAccount**：Pod 在集群里的「**身份**」——Pod 默认用一个 ServiceAccount，调 apiserver 时的身份与权限由它 + RBAC 决定。生产建议**为每个应用单独建 SA**并最小权限，别用默认 SA。
- **HPA（HorizontalPodAutoscaler）**：按 CPU/内存或自定义指标**水平扩缩** Pod 副本数。需要 **Metrics Server**（CPU/内存）或 **KEDA**（自定义/事件指标，如消息队列深度）。
- **VPA**：垂直扩缩（改 Pod 的 requests/limits），需重启 Pod，不如 HPA 常用。
- **etcd 是命脉**：所有集群状态的「**唯一真相**」。要**奇数节点（3/5）**高可用、**定期快照备份**、磁盘用 SSD（etcd 对 IO 延迟敏感）。
- **「去 ZooKeeper」趋势与 K8s 的关系**：K8s **自身用 etcd**（不用 ZooKeeper），不受 Kafka/Cassandra 那波「去 ZK」直接影响；但 K8s 生态里跑的 Kafka（Strimzi）/HBase 等正通过 Operator 走 KRaft/去 ZK 路线，降低 K8s 上有状态应用的运维负担。

## 一、kubectl：日常运维的瑞士军刀

kubectl 是与 apiserver 交互的唯一命令行入口。掌握下面这套命令，绝大多数运维任务都能覆盖：

```bash
# —— 看状态 ——
kubectl get pods,svc,deploy -n app           # 一组对象
kubectl get pod -o wide                       # 含节点/IP 详情
kubectl get pod -l app=web                    # 按 Label 过滤
kubectl get pod -w                            # 持续 watch 变化

# —— 排查问题（最重要）——
kubectl describe pod <name>                   # 看 Events 区，90% 问题在这
kubectl logs <pod> -c <container>             # 看日志（多容器要 -c）
kubectl logs <pod> --previous                 # 看上个崩溃容器的日志
kubectl exec -it <pod> -- sh                  # 进容器调试

# —— 声明式管理 ——
kubectl apply -f deploy.yaml                  # 创建/更新（幂等）
kubectl delete -f deploy.yaml                 # 按 yaml 删
kubectl diff -f deploy.yaml                   # apply 前看差异（先 -k/Server-side）

# —— 发布与扩缩 ——
kubectl scale deployment web --replicas=5
kubectl rollout status deployment/web         # 看滚动进度
kubectl rollout undo deployment/web           # 回滚到上一版
kubectl rollout history deployment/web        # 看版本历史
```

- **`describe` 的 Events 区是排查金矿**：Pod 卡 Pending、镜像拉不下来、调度失败、探针失败——事件都记在 `describe` 末尾，按时间倒序，先看这里。
- **命令式 vs 声明式**：`kubectl run/create/scale/expose` 是**命令式**（不留 YAML 痕迹），`kubectl apply -f` 是**声明式**（YAML 进 Git，可审计可重入）。**生产一律用 apply**，命令式仅用于快速验证。
- **`--dry-run=client -o yaml`**：把命令式的产物导出成 YAML，例如 `kubectl create deployment web --image=nginx --dry-run=client -o yaml > web.yaml`，再改改 apply，是快速起手 YAML 的技巧。

### Context 与 Namespace：多集群/多租户导航

```bash
kubectl config get-contexts                   # 列所有 Context（含当前 *）
kubectl config use-context prod-cluster        # 切到生产集群
kubectl config set-context --current --namespace=payments  # 改当前默认 ns
```

- **Context = cluster + user + namespace 的组合**：一个 kubeconfig 文件可含多个 Context，切换 Context 就是切换「操作哪个集群、以谁的身份、在哪个 Namespace」。
- **危险操作护栏**：切到生产 Context 后，把默认 Namespace 设成具体的（不要 default），重要操作前先 `kubectl config current-context` 确认——**误删生产 Namespace 的事故**多因 Context 没看清。

## 二、Helm：K8s 的包管理器

手写 Deployment+Service+ConfigMap+Secret+PV+... 一大堆 YAML 装一个 Redis 又慢又错。Helm 把这些打包成 **Chart**，一行命令装好：

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install my-redis bitnami/redis \
  --set auth.password=secret \
  --set replica.replicaCount=3

helm list                                     # 看已装的 Release
helm upgrade my-redis bitnami/redis --set replica.replicaCount=5  # 改参数升级
helm rollback my-redis 2                      # 回滚到 revision 2
helm uninstall my-redis                       # 卸载（连带清掉资源）
```

- **Chart**：一组**模板（Go template）+ 默认 values**。模板里 `{{ .Values.replicaCount }}` 在安装时被 values 覆盖渲染成真实 YAML。
- **Release**：一次 `helm install` 产生一个具名 Release，可独立升级/回滚/卸载。同一 Chart 可在同集群装多个 Release（如 `redis-cache` 和 `redis-session`）。
- **values 覆盖**：`--set key=val`（命令行）或 `-f my-values.yaml`（文件）。生产通常维护一份自己的 values 文件进 Git。
- **为什么用 Helm**：① 复用社区成熟 Chart（Bitnami 有几百个）；② 参数化（一份 Chart 部署 dev/prod）；③ 升级/回滚有版本管理；④ 一键卸载不留残骸。
- **进阶：Kustomize**：K8s 内置（`kubectl apply -k`）的「**无模板**」配置分层工具——不写模板，用 overlay（base + patch）管理多环境差异。比 Helm 轻量，适合简单场景；复杂应用（含依赖、参数化模板）仍以 Helm 为主。

## 三、ConfigMap 与 Secret：配置与敏感数据

把配置硬编码进镜像会让镜像「环境绑定」（dev/prod 各打一份），违背「一次构建处处运行」。K8s 用 ConfigMap/Secret 把配置剥离出来：

```yaml
# ConfigMap：明文配置
apiVersion: v1
kind: ConfigMap
metadata: { name: app-config }
data:
  LOG_LEVEL: "info"
  config.yaml: |
    database:
      host: db.default.svc.cluster.local

---
# Pod 挂载：作为环境变量 或 文件
spec:
  containers:
    - name: app
      envFrom:
        - configMapRef: { name: app-config }   # 整个 CM 作为环境变量
      volumeMounts:
        - name: cfg
          mountPath: /etc/app                  # 作为文件挂载
  volumes:
    - name: cfg
      configMap: { name: app-config }
```

- **ConfigMap**：存明文配置（不加密，适合日志级别、配置文件）。
- **Secret**：存敏感数据（密码/密钥/证书）。**注意：Secret 默认只是 base64 编码，不是加密**——能 `base64 -d` 解出来。要真加密用 **KMS 插件**（云上托管密钥）、**Sealed Secrets**（GitOps 友好的加密提交）或 **External Secrets Operator**（从 Vault/AWS Secrets Manager 拉取）。
- **更新机制**：ConfigMap/Secret 更新后，作为**环境变量**注入的要重启 Pod 才生效；作为**文件挂载**的会自动同步（kubelet 周期 refresh，约 1 分钟），但应用要自己 watch 文件变化才能热加载。
- **最佳实践**：① 12-Factor——配置走环境变量；② 配置版本化（ConfigMap 也进 Git）；③ 敏感数据绝不进镜像/ConfigMap，必用 Secret + 加密方案。

## 四、RBAC：谁能干什么

K8s 的权限基于 **RBAC（Role-Based Access Control）**，四要素：**Role/ClusterRole**（定义权限）+ **RoleBinding/ClusterRoleBinding**（绑给主体）+ **主体（User/Group/ServiceAccount）**。

```yaml
# Role：payments Namespace 内只读权限
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: { name: reader, namespace: payments }
rules:
  - apiGroups: [""]
    resources: ["pods", "services"]
    verbs: ["get", "list", "watch"]

---
# RoleBinding：把 Role 绑给 ServiceAccount
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata: { name: reader-binding, namespace: payments }
subjects:
  - kind: ServiceAccount
    name: app-sa
roleRef:
  kind: Role
  name: reader
  apiGroup: rbac.authorization.k8s.io
```

- **Role vs ClusterRole**：Role 是 **Namespace 级**（只管某 ns 内的资源）；ClusterRole 是**集群级**（可管集群范围资源如 Node/PV，也可被所有 ns 复用）。常用做法：定义一个 ClusterRole（如「只读」），再用 RoleBinding 在各 ns 里绑给不同人——**权限复用 + 范围限定**。
- **verbs**：`get/list/watch`（读）、`create/update/patch/delete`（写）、`*`（全部）。生产遵循**最小权限**：应用 SA 只给真正需要的 verbs/resources。
- **ServiceAccount（SA）**：Pod 在集群里的**机器身份**（区别于 User 的人类身份）。每个 Pod 默认挂一个 SA（`default`），它的 token 让应用能调 apiserver。**生产为每个应用单独建 SA**并精确授权，别用默认 SA（默认 SA 通常权限过宽或被滥用）。
- **常见坑**：CI 部署用 SA 没配 RBAC → `forbidden` 报错；用 `cluster-admin` 这种超管权限给应用 → 一旦应用被攻破整个集群沦陷。

## 五、HPA：自动水平伸缩

**HPA（HorizontalPodAutoscaler）**按指标自动调整 Deployment/StatefulSet 的副本数：

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: web }
spec:
  scaleTargetRef: { kind: Deployment, name: web }
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
```

- **前置依赖**：HPA 需要 **Metrics Server**（提供 CPU/内存指标）部署在集群里，否则 HPA 拿不到数据无法伸缩。
- **缩放算法**：目标副本数 = ceil(当前副本数 × 当前指标 / 目标指标)。CPU 超 70% 就扩，回落就缩（有冷却时间防抖动）。
- **KEDA（事件驱动伸缩）**：原生 HPA 只支持 CPU/内存/自定义指标；**KEDA**（CNCF 项目）扩展到**事件源**——按 Kafka lag、RabbitMQ 队列深度、Prometheus 指标、Cron 等伸缩，甚至能**缩到 0**（无流量时省资源），是 Serverless on K8s 的事实方案。
- **VPA（垂直伸缩）**：改 Pod 的 requests/limits（如自动调内存），需重启 Pod，不如 HPA 普及，且与 HPA 不能同对象同资源并用。

## 六、etcd 与「去 ZooKeeper」趋势

### etcd：K8s 的大脑记忆

**etcd** 是 K8s 唯一的**强一致 KV 存储**，存着集群全部对象（Pod/Service/...）的真相。所有读写经 apiserver 转发到 etcd。**etcd 的健康 = 集群的命脉**：

- **高可用**：部署**奇数节点**（3 或 5），Raft 协议选主，容忍 (N-1)/2 节点故障。
- **磁盘敏感**：etcd 用 Raft，对 fsync 延迟极敏感——磁盘要**独占 SSD**，慢盘会让 apiserver 请求超时、整个集群变卡。
- **必须备份**：定期 `etcdctl snapshot save` 备份，异地保存。etcd 数据损坏没备份 = 集群重建。
- **托管 K8s 的省心之处**：GKE/EKS/ACK 等托管 K8s 由云厂商运维控制面（含 etcd），用户只需关心工作节点与应用——自建 K8s 的 etcd 是最大运维负担。

### 「去 ZooKeeper」趋势对 K8s 生态的影响

需要厘清一个常见混淆：**K8s 自身用 etcd，不用 ZooKeeper**，所以 Kafka 那波「KRaft 去 ZooKeeper」与 K8s 控制面无直接关系。但这股趋势**实实在在地影响着 K8s 上跑的有状态应用生态**：

- **Kafka on K8s**：Strimzi（Kafka Operator）以前要在 K8s 里同时跑 Kafka + ZooKeeper 两套集群，运维复杂；**KRaft 模式**让 Kafka 自管元数据、去掉 ZK，Operator 部署链路简化、资源占用降低。
- **HBase/Cassandra 等大数据栈**：原本依赖 ZK 做协调，在 K8s 上多一层依赖；新一代设计（如 Kafka 的 KRaft、Cassandra 4.x 的内部协调增强）倾向**减少外部协调依赖**，让 Operator 部署更轻。
- **K8s 自身的方向**：虽然 etcd 仍是标准，但社区有 **Kine**（让 K8s 用 SQLite/MySQL/PostgreSQL 替代 etcd 的适配层，用于 k3s 等轻量发行版）、**etcd 替代探索**等讨论，但**生产主流仍是 etcd**。

一句话：**K8s 控制面 = etcd（不受「去 ZK」影响）；K8s 上跑的有状态应用 = 跟着各自社区的「去 ZK/简化依赖」趋势走**。

## 下一步

核心对象与日常运维讲完后，进入[参考](../reference)：对象速查、kubectl 命令清单、Helm/RBAC 速查、易错点，以及与 Docker Compose/Podman 的对比。
