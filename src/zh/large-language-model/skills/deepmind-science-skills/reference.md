---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 google-deepmind/science-skills README、SKILL_LICENSES.md 与 skills/ 编写。

## 速查

- **装**：`npx skills add google-deepmind/science-skills` 或 Antigravity 「Build with Google」勾 Science
- **38 个 skill**，按领域分组见下表
- **每 skill**：`SKILL.md`（YAML frontmatter + 指令）+ `scripts/`（必）+ `references/`（可选）+ `docs/`（可选）
- **前置**：`uv`（首次自动装）、API key（AlphaGenome/OpenAlex 必须）
- 软件 Apache-2.0；CC-BY 4.0 文档；各数据库许可异（见 `SKILL_LICENSES.md`）

## 38 skill 全表（按领域）

### 结构生物学（4）

| skill | 触发 | 一句话 |
| --- | --- | --- |
| `alphafold_database_fetch_and_analyze` | 给 UniProt ID 查结构 | 拉 mmCIF + PAE，自动判 pLDDT/域边界/无序区 |
| `foldseek_structural_search` | 找结构同源 | 按折叠而非序列搜 |
| `pdb_database` | 想要实验结构 | RCSB PDB 查询 |
| `uniprot_database` | 蛋白注释 | 序列、功能、亚细胞定位 |

### 基因组学（9）

| skill | 一句话 |
| --- | --- |
| `alphagenome_single_variant_analysis` | 非编码变异对表达/剪接/染色质影响（必须 key） |
| `clinvar_database` | 临床意义（致病/良性/VUS） |
| `gnomad_database` | 群体等位基因频率 |
| `dbsnp_database` | dbSNP 已知变异（rsID） |
| `jaspar_database` | 转录因子结合 motif |
| `encode_ccres_database` | ENCODE 顺式调控元件 |
| `gtex_database` | GTEx 组织表达 |
| `ensembl_database` | Ensembl 基因组注释、VEP |
| `ucsc_conservation_and_tfbs` | UCSC 保守性与 TFBS |

### 化学与药物（3）

| skill | 一句话 |
| --- | --- |
| `chembl_database` | ChEMBL 药物活性化合物 |
| `pubchem_database` | PubChem 化合物结构与性质 |
| `openfda_database` | FDA 不良反应、召回、标签 |

### 文献检索（5）

| skill | 一句话 |
| --- | --- |
| `literature_search_arxiv` | arXiv 预印本搜索 + PDF/HTML/LaTeX 下载（1 req/3s） |
| `literature_search_biorxiv` | bioRxiv 生物预印本 |
| `literature_search_europepmc` | Europe PMC 全文聚合 |
| `literature_search_openalex` | OpenAlex 开放引用图谱（需 key） |
| `pubmed_database` | PubMed 生物医学摘要 |

### 序列分析（3）

| skill | 一句话 |
| --- | --- |
| `ncbi_sequence_fetch` | NCBI 核酸/蛋白序列 |
| `protein_sequence_msa` | Clustal Omega 多序列比对 |
| `protein_sequence_similarity_search` | BLAST 相似性搜索 |

### 注释与通路（7）

| skill | 一句话 |
| --- | --- |
| `interpro_database` | 蛋白结构域与家族 |
| `quickgo_database` | Gene Ontology 注释 |
| `reactome_database` | 生物通路 |
| `string_database` | 蛋白-蛋白互作 |
| `unibind_database` | TF-基因组结合 |
| `human_protein_atlas_database` | 人类组织蛋白图谱 |
| `embl_ebi_ols` | EBI 本体查询 |

### 靶点与临床（2）

| skill | 一句话 |
| --- | --- |
| `opentargets_database` | 靶点-疾病关联 |
| `clinical_trials_database` | ClinicalTrials.gov |

### 分子可视化与工具（5）

| skill | 一句话 |
| --- | --- |
| `pymol` | PyMOL 蛋白/分子渲染（OSMesa 软件渲染） |
| `predictingthepast` | 古文本修复/断代/归属（Aeneas 拉丁 · Ithaca 古希腊） |
| `uv` | `uv` 包管理器（所有脚本的前置） |
| `credentials` | API key 安全管理协议 |
| `workflow_skill_creator` | 把多步科研流程固化为自定义 skill |

## 各数据库许可摘要

> 完整列表见仓库 `SKILL_LICENSES.md`。软件 Apache-2.0 不覆盖这些数据源，使用者需自行合规。

| skill | 上游许可/条款源 |
| --- | --- |
| alphafold-db | alphafold.ebi.ac.uk |
| alphagenome | deepmind.google.com/science/alphagenome |
| gnomad | gnomad.broadinstitute.org/policies |
| clinvar | ncbi.nlm.nih.gov/clinvar |
| gtex | gtexportal.org/home/license |
| encode-ccres | encodeproject.org/help/rest-api |
| opentargets | platform-docs.opentargets.org/licence |
| pdb | rcsb.org/pages/usage-policy |
| uniprot | uniprot.org/help/license |
| chembl | chembl.gitbook.io |
| pubchem | pubchem.ncbi.nlm.nih.gov/docs/pug-rest |
| openfda | open.fda.gov/license |
| arxiv | info.arxiv.org/help/api/index.html |
| openalex | developers.openalex.org |
| reactome | reactome.org/license |
| jaspar | jaspar.elixir.no/api/ |
| ensembl | useast.ensembl.org/index.html |
| string-db | string-db.org/cgi/access |
| human-protein-atlas | proteinatlas.org/about/licence |
| pymol | pymol.org |

## 安装与目录结构

```bash
# 通用 CLI
npx skills add google-deepmind/science-skills

# Antigravity 路径
设置 → Customizations → Build with Google Plugins → Science
```

```text
science-skills/
├── skills/                              # 38 个 skill 目录
│   ├── alphafold_database_fetch_and_analyze/
│   │   ├── SKILL.md                     # 主指令（YAML frontmatter）
│   │   ├── scripts/                     # 辅助脚本（必）
│   │   └── references/                  # 支撑文档（可选）
│   ├── alphagenome_single_variant_analysis/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   ├── docs/                        # API/解读/报告模板
│   │   └── examples/                    # 金标准示例
│   ├── pymol/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   └── references/PYMOL_REFERENCE.md, RECIPES.md
│   └── ...                              # 其余 35 个
├── README.md                            # Apache-2.0 + CC-BY 声明
├── SKILL_LICENSES.md                    # 各数据库许可映射
├── LICENSE                              # Apache-2.0 全文
├── CONTRIBUTING.md
└── plugin.json                          # Antigravity plugin 元信息
```

## 关键命令

```bash
# AlphaFold 结构拉取与分析
uv run scripts/fetch_structure.py P00520 -o /abs/path/
uv run scripts/analyze_plddt.py ./data/AF-P00520-F1-metadata.json
uv run scripts/analyze_pae.py ./data/AF-P00520-F1-predicted_aligned_error_v6.json

# arXiv 搜索 + 下载
uv run scripts/search_arxiv.py --query "ti:attention" --max_results 5
uv run scripts/download_paper.py --id 1706.03762 --format pdf --output attention.pdf

# PyMOL 渲染（OSMesa headless）
uv run render.py    # 必须设 PYOPENGL_PLATFORM=osmesa
```

## 关键陷阱

| 陷阱 | 正确做法 |
| --- | --- |
| 裸 `python3`/`python3 -c` | 一律 `uv run`（系统 Python 无 pandas/numpy） |
| 直接调数据库 API | 走 skill 提供的 `scripts/`，自动 rate-limit |
| 手硬编码 API key | 用 `credentials` skill 协议；写 `~/.env` |
| 改 Antigravity plugin 目录文件 | 放 `~/.gemini/config/skills/` |
| 大蛋白整段做 docking | 先看 pLDDT，无序区警告后只取有序域 |
| PyMOL 用 `cmd.ray()` | OSMesa 不支持，用 `cmd.png()` |
| arXiv 解压源码到工作目录 | 必 `mkdir paper_source && tar -xzf ... -C paper_source` |
| 忽略 `.licenses/` 落盘 | 首次用 skill 必须创建 `<skill>_LICENSE.txt` |

## 资源链接

- 仓库：[google-deepmind/science-skills](https://github.com/google-deepmind/science-skills)
- Antigravity 用例：[antigravity.google/use-cases/science](https://antigravity.google/use-cases/science)
- 技术报告：[DeepMind Science Skills paper](https://storage.googleapis.com/deepmind-media/papers/google_deepmind_science_skills_for_antigravity_towards_efficient_and_reliable_scientific_workflows.pdf)
- skills.sh：[google-deepmind/science-skills](https://skills.sh/google-deepmind/science-skills)
- 相关叶：[Skills CLI 与 find-skills](../skills-cli-find-skills/) · [Vercel Agent Skills](../vercel-agent-skills/)
