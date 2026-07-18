---
layout: doc
---

# Google DeepMind Science Skills

Google DeepMind Science Skills（`google-deepmind/science-skills`）是 Google DeepMind 官方出品的一组面向科学研究任务的 AI agent 技能集，遵循 agentskills.io 开放格式，软件部分 Apache-2.0 开源。它把结构生物学、基因组学、化学与药物、文献检索、序列分析、分子可视化等领域的科研工作流，打包成可按需调用的技能——从「给我这个 UniProt ID 的 AlphaFold 结构并分析 pLDDT」（`alphafold_database_fetch_and_analyze`），到「分析这个变异对基因表达的影响」（`alphagenome_single_variant_analysis`），再到「搜 arXiv/bioRxiv 文献」「拉 ClinVar/gnomAD/dbSNP 变异注释」「用 PyMOL 渲染蛋白结构」。不是通用 prompt，而是 DeepMind 科研团队沉淀的、有明确触发条件与领域分类的科研工具集，覆盖 38 个 skill。

## 评价

**优点**

- **官方沉淀**：Google DeepMind 出品，覆盖 AlphaFold DB / AlphaGenome / Foldseek / RCSB PDB / UniProt 等核心科研数据库与工具
- **领域全**：38 个 skill 横跨结构生物学、基因组学、化学与药物、文献检索、序列分析、分子可视化、API 凭据管理
- **工作流导向**：每个 skill 有 SKILL.md 主指令 + `scripts/` 辅助脚本 + `references/` 支撑文档；脚本统一用 `uv run` 隔离依赖
- **rate-limit 内建**：脚本自动 enforce 各数据库 API 的速率限制（如 arXiv 1 req / 3s），不用自己写节流
- **凭据安全**：`credentials` skill 用统一协议管理 API key（AlphaGenome / OpenAlex 必须、ClinVar 等可选）
- **Antigravity 集成**：装 Google Antigravity 后，首次触发科研技能自动装 `uv` 依赖管理器

**缺点 / 边界**

- **各数据库许可异**：Apache-2.0 仅覆盖 skill 软件本身，调用的数据库（AlphaFold DB / gnomAD / ClinVar / ENCODE 等）各有自己的许可与使用条款，使用者需自行合规
- **API key 门槛**：AlphaGenome、OpenAlex 必须有 key；部分数据库（ClinVar）有 key 可提速率
- **偏生物学/医学**：覆盖的数据库几乎全是生命科学领域，物理/化学/材料科学覆盖薄（仅化学信息学 ChEMBL/PubChem/openFDA）
- **强依赖 `uv`**：所有脚本经 `uv run`，首次装约 10s 拉依赖
- **不是 AlphaFold 模型本身**：`alphafold_database_fetch_and_analyze` 只查 DB 已预测结构，不能对自定义序列跑推理

## 适用场景

- 拿 UniProt ID 查 AlphaFold 预测结构、读 pLDDT 置信度、判刚性域边界
- 分析非编码区变异对基因表达/染色质/剪接的影响（AlphaGenome）
- 搜学术文献与预印本（arXiv / bioRxiv / Europe PMC / OpenAlex）
- 查变异临床意义、群体频率、调控元件（ClinVar / gnomAD / dbSNP / ENCODE cCREs / JASPAR / GTEx）
- 化学信息学检索（ChEMBL / PubChem / openFDA）
- 用 PyMOL 渲染蛋白结构图（cartoon / surface / pLDDT 着色 / 配体互作）
- 多序列比对、序列相似性搜索、NCBI/Ensembl/UniProt 序列检索

## 边界

- **软件 Apache-2.0 ≠ 数据自由**：每个数据库有独立许可，需查 `SKILL_LICENSES.md`
- **AlphaGenome 必须有 API key**：免费但需在 DeepMind 站注册
- **不能跑 AlphaFold/AlphaGenome 推理**：skill 只调数据库/API，不在本地跑模型
- **rate-limit 严格**：如 arXiv 1 req/3s、很多 API 有日配额，大批量需分页慢拉
- **PyMOL 软件渲染**：用 OSMesa 无需 GPU，但大表面渲染慢且占内存

## 官方文档

[Science Skills 仓库](https://github.com/google-deepmind/science-skills) ｜ [Antigravity Science 用例](https://antigravity.google/use-cases/science) ｜ [DeepMind 技术报告](https://storage.googleapis.com/deepmind-media/papers/google_deepmind_science_skills_for_antigravity_towards_efficient_and_reliable_scientific_workflows.pdf) ｜ [skills.sh · deepmind](https://skills.sh/google-deepmind/science-skills)

## GitHub 地址

[google-deepmind/science-skills](https://github.com/google-deepmind/science-skills)（Apache-2.0，数据源各库独立许可）

## 内容地图

- [入门](./getting-started) —— `npx skills add` / Antigravity 安装、38 skill 速览、`uv` 与 API key 前置
- [指南](./guide-line) —— 按科研领域（结构生物学/基因组/化学药物/文献/序列/可视化）+ 工作流 + 反模式
- [参考](./reference) —— 38 skill 全表（按领域）+ 许可 + 安装 + 目录结构

## 幻灯片地址

<a href="/SlideStack/deepmind-science-skills-slide/" target="_blank">Google DeepMind Science Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=658" target="_blank" rel="noopener noreferrer">Google DeepMind Science Skills 测试题</a>

