---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 google-deepmind/science-skills 的 README、SKILL_LICENSES.md 与各 skills/SKILL.md 编写。

## 速查

- **6 大领域**：结构生物学 / 基因组学 / 化学与药物 / 文献检索 / 序列分析 / 分子可视化
- **AlphaFold 流程**：给 UniProt ID → 拉 mmCIF + PAE → 自动判 pLDDT 置信 + 域边界 + 无序区
- **AlphaGenome**：chr:pos:ref>alt 变异 → 表达/染色质/剪接预测；先 `score_variant` 广撒发现、再聚焦疾病相关组织
- **文献**：arXiv/bioRxiv 预印本、Europe PMC/OpenAlex/PubMed 全文与引用图谱
- **PyMOL**：OSMesa 软件渲染无 GPU；每脚本必带 init 样板 + `cmd.quit()` + 同时输出 PNG 与 .pse
- **统一**：`uv run` 跑所有 Python；脚本自动 rate-limit；每次首次落 `.licenses/<skill>_LICENSE.txt`
- 软件 Apache-2.0；各数据库许可异（查 `SKILL_LICENSES.md`）

## 结构生物学：AlphaFold → Foldseek → PyMOL

`alphafold_database_fetch_and_analyze` 是核心入口。给它一个 **UniProt ID**（如 P00520），它会：

1. `fetch_structure.py` 拉 mmCIF 结构文件、PAE JSON、API metadata JSON
2. `analyze_plddt.py` 出全局 pLDDT 置信评估（structured / disordered / mixed）
3. `analyze_pae.py` 用滑动窗口 PAE 启发式检测**刚性域边界**

**关键规则**：

- 只接受 UniProt ID，给蛋白名/基因名/氨基酸序列要先去 UniProt 查 ID
- 不要自己算域边界或评估无序——必须依赖脚本输出
- 大蛋白（>2700 AA）会触发 fragment fallback，脚本输出 `[!] WARNING` 必须 relay 给用户
- 高度无序蛋白（<50 pLDDT 占比高）要明确警告用户**别**直接拿去做 Foldseek/docking
- 想找结构同源 → **Foldseek**（按结构而非序列搜）；想要实验结构 → **pdb_database**；想跑自定义序列推理 → 这套技能不支持

拿到结构后，配 **`pymol` skill** 渲染：

- OSMesa 软件渲染，无需 GPU/X server
- 必须带 init 样板（`finish_launching()` 后才 `from pymol import cmd`）
- 用 `cmd.png()` 出图，**别**用 `cmd.ray()`/`cmd.draw()` 硬件加速（OSMesa 不支持）
- 同时输出 `.pse` session 文件让用户在本地 PyMOL 继续调
- 必调 `cmd.quit()` 否则进程卡死

## 基因组学：AlphaGenome 变异工作流

`alphagenome_single_variant_analysis` 是研究**非编码变异**对调控影响的利器。给它 `chr:pos:ref>alt` 格式变异，可预测对 RNA-seq 表达、DNASE 染色质可及性、ChIP 组蛋白标记、转录因子结合的影响。

**关键规则**：

- **必须 API key**：`ALPHAGENOME_API_KEY`，通过 `credentials` skill 安全获取
- **必须 `uv run`**：禁止裸 `python3`/`python3 -c`，系统 Python 没装 pandas/numpy
- **离线基因查找**：用本地 GTF 的 `lookup_gene_info.py`，禁止外部 MyGene.info/Ensembl REST
- **先广撒再聚焦**：
  1. `score_variant` 跨**差分 scorer**跑，发现意外组织效应
  2. 按疾病关键词（如 `liver`、`hepatocyte`）筛 hits
  3. 用 `predict_variant` 加 `ontology_terms` 深入
- **必读模板**：用 `docs/report-templates.md` 出报告，必含 top hits 表

**配套基因组数据库 skill**：

- `clinvar_database` —— 临床意义（致病/良性/VUS）
- `gnomad_database` —— 群体频率（罕见病必查）
- `dbsnp_database` —— 已知变异注释（rsID）
- `jaspar_database` —— 转录因子 motif（变异是否破 motif）
- `encode_ccres_database` —— 调控元件（cCRE）
- `gtex_database` —— 组织表达（变异在哪个组织重要）
- `ensembl_database` —— 基因组注释、VEP

## 化学与药物

3 个数据库 skill：

- `chembl_database` —— 药物样化合物活性、靶点、IC50
- `pubchem_database` —— 化合物结构与性质（CID/SMILES）
- `openfda_database` —— FDA 不良反应、召回、标签

加上 `clinical_trials_database`（ClinicalTrials.gov）和 `opentargets_database`（靶点-疾病关联），可串起「靶点 → 化合物 → 临床试验 → 不良反应」药物再利用工作流。

## 文献检索：4 + 1 个来源

| skill | 用途 |
| --- | --- |
| `literature_search_arxiv` | 物理/CS/数学/生物预印本，含 query 语法（au/ti/abs）、PDF/HTML/LaTeX 源码下载 |
| `literature_search_biorxiv` | 生物预印本 |
| `literature_search_europepmc` | 全文聚合（含 PubMed Central） |
| `literature_search_openalex` | 开放引用图谱，找「这篇被谁引」（需 key） |
| `pubmed_database` | 生物医学文献摘要 |

**arXiv 规则**：

- 必须 ≤ **1 req / 3s**，脚本自动节流
- 大批结果先写文件再解析（>100 条 JSON 撑爆 context）
- LaTeX 源码解压前 `mkdir paper_source && tar -xzf source.tar.gz -C paper_source`，**绝不**直接在工作目录解压

## 序列分析

- `ncbi_sequence_fetch` —— 从 NCBI 拉核酸/蛋白序列
- `protein_sequence_msa` —— Clustal Omega 多序列比对（EBI JDispatcher）
- `protein_sequence_similarity_search` —— BLAST（EBI）+ ColabFold 同源建模入口

## 分子可视化：PyMOL 详解

`pymol` 是渲染与几何分析工具，覆盖 cartoon / surface / 静电表面 / B-factor 着色 / 距离测量 / 多结构对齐 RMSD / 配体互作 / 诱变等 14+ 现成 recipe。

**关键陷阱**：

- `cmd.load()` 后必须 `cmd.count_atoms("all")` 校验，0 atoms 立即 `cmd.quit()` 报错
- 大表面渲染可能超 `--max_output_mb`（默认 500MB），用 `--max_output_mb=1000` 放宽
- 跑前必须确认结构文件已下载到本机（Pre-Flight File Check）
- **不要**用于 docking / 分子动力学 / 纯序列分析

## 科研工作流编排

把多个 skill 串成端到端流程，例如「靶点 → 药物」：

```text
opentargets_database       # 找疾病相关靶点
  ↓
alphafold_database_fetch_and_analyze   # 看靶点蛋白结构
  ↓
pymol                       # 渲染口袋、找活性残基
  ↓
chembl_database / pubchem_database     # 找已知配体
  ↓
openfda_database            # 查不良反应
  ↓
clinical_trials_database    # 看临床试验进度
```

或「变异 → 表型」：

```text
clinvar_database            # 临床意义
  ↓
alphagenome_single_variant_analysis   # 调控机制
  ↓
gnomad_database             # 群体频率
  ↓
gtex_database               # 哪个组织
  ↓
opentargets_database        # 关联疾病
```

`workflow_skill_creator` skill 可帮你把这种多步流程固化成新的自定义 skill。

## 反模式

- **跳过 `uv run`** —— 系统 Python 没依赖，必崩
- **直接调数据库 API** —— 绕过脚本意味着没 rate-limit，会被封 IP（arXiv 等）
- **手硬编码 API key** —— 用 `credentials` skill 的安全协议
- **拿无序区蛋白做 docking** —— pLDDT < 50 的区域不该参与下游结构分析
- **改 Antigravity plugin 目录文件** —— 会被下次 plugin 更新覆盖
- **裸 `python3`** —— alphagenome 明确禁止，必走 `uv run`
- **忽略 `.licenses/` 落盘** —— 每个 skill 首次使用必须创建 LICENSE 提醒文件

## 与相邻叶的边界

- 本叶专讲 **DeepMind 官方科研 skill 集**（38 skill）；通用的 agent skill 生态（CLI、find-skills、Antfu/Vercel 等其它厂商出的技能集）在 [Skills CLI 与 find-skills](../skills-cli-find-skills/) 叶
- AlphaFold 模型推理（本地跑）不在本 skill 范围，本 skill 只查数据库与调 API

## 下一步

- [参考](./reference) —— 38 skill 全表 + 触发词 + 各数据库许可 + 安装与目录结构
- 上游：[Science Skills 仓库](https://github.com/google-deepmind/science-skills)
