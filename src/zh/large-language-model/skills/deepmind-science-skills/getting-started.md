---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 google-deepmind/science-skills 主分支（2026-07）的 README、SKILL_LICENSES.md 与 skills/ 编写。

## 速查

- **装**：`npx skills add google-deepmind/science-skills`（Claude Code / Cursor / Codex / Antigravity 等）；或 Antigravity 在「Build with Google」勾选 Science
- **38 个 skill**：结构生物学（alphafold-db/foldseek/pdb/uniprot）、基因组（alphagenome/clinvar/gnomad/dbsnp/jaspar/encode-ccres/gtex/ensembl）、化学药物（chembl/pubchem/openfda）、文献（arxiv/biorxiv/europepmc/openalex/pubmed）、序列（ncbi-fetch/msa/similarity-search）、其它数据库（clinical-trials/opentargets/human-protein-atlas/interpro/quickgo/reactome/string/unibind/embl-ebi-ols/ucsc）、工具（pymol/predictingthepast/uv/workflow-skill-creator/credentials）
- **前置**：`uv` 包管理器（首次触发自动装）；AlphaGenome/OpenAlex 必须 API key，ClinVar 等有 key 提速
- **许可**：软件 Apache-2.0；调用的各数据库各有许可（见 `SKILL_LICENSES.md`）
- **统一模式**：每 skill = SKILL.md + scripts/ + references/；脚本统一 `uv run`，自动 rate-limit

## 安装

两种途径：

```bash
# 通用：skills.sh CLI
npx skills add google-deepmind/science-skills
```

或经 [Google Antigravity](https://antigravity.google/)：

- 新用户：下载 Antigravity 后在「Build with Google」步骤勾选 **Science**，即装整套 curated collection
- 老用户：设置 → Customizations → Build with Google Plugins → 下载 `Science` plugin

### Prerequisites

- **`uv` 包管理器**：所有脚本经 `uv run` 跑，首次触发某个 Science Skill 时 agent 会请求批准并装 `uv`，装完建议重启 Antigravity
- **API key（部分 skill 必须）**：AlphaGenome、OpenAlex 必须有 key 才能跑；ClinVar 等有 key 可提速率但非必须
- **写 key 的位置**：`~/.env`，例如 `echo "ALPHAGENOME_API_KEY=your_actual_api_key" >> ~/.env`
- **`credentials` skill**：用统一安全凭据协议请求/检查 key，不要手硬编码

### 自定义或新建 skill

不要直接改 Antigravity Science plugin 安装目录的文件（plugin 更新会覆盖），把自定义 skill 放在：

```text
~/.gemini/config/skills/
```

## 38 个 skill 分类速览

| 领域 | 代表 skill | 一句话 |
| --- | --- | --- |
| **结构生物学** | `alphafold_database_fetch_and_analyze` | 给 UniProt ID 拉 AlphaFold mmCIF + PAE，自动判 pLDDT/域边界 |
|  | `foldseek_structural_search` | 按结构（非序列）搜同源折叠 |
|  | `pdb_database` | 查 RCSB PDB 实验结构 |
|  | `uniprot_database` | 蛋白质序列与注释 |
| **基因组学** | `alphagenome_single_variant_analysis` | 非编码变异对表达/剪接/染色质的影响（需 key） |
|  | `clinvar_database` / `gnomad_database` / `dbsnp_database` | 临床意义 / 群体频率 / 已知变异 |
|  | `jaspar_database` / `encode_ccres_database` | 转录因子结合 motif / 顺式调控元件 |
|  | `gtex_database` / `ensembl_database` | 组织表达 / 基因组注释 |
| **化学/药物** | `chembl_database` / `pubchem_database` / `openfda_database` | 药物活性 / 化合物 / FDA 不良反应 |
| **文献检索** | `literature_search_arxiv` / `literature_search_biorxiv` | 预印本搜索与全文下载 |
|  | `literature_search_europepmc` / `literature_search_openalex` / `pubmed_database` | 全文/引用图谱/生物医学文献 |
| **序列分析** | `ncbi_sequence_fetch` / `protein_sequence_msa` / `protein_sequence_similarity_search` | 拉序列 / 多序列比对 / BLAST |
| **分子可视化** | `pymol` | 渲染蛋白结构（cartoon / pLDDT 着色 / 配体互作 / 表面） |
| **其它数据库** | `clinical_trials_database` / `opentargets_database` / `human_protein_atlas_database` / `interpro_database` / `quickgo_database` / `reactome_database` / `string_database` / `unibind_database` / `embl_ebi_ols` / `ucsc_conservation_and_tfbs` | 临床试验 / 靶点 / 蛋白图谱 / 结构域 / GO / 通路 / PPI / 调控 / 本体 / 保守性 |
| **基础设施** | `uv` / `credentials` / `workflow_skill_creator` / `predictingthepast` | 依赖管理 / 凭据 / 自建 skill / 古文本修复·断代（Aeneas/Ithaca） |

## 工作流速览：装好第一次用

1. **装**：`npx skills add google-deepmind/science-skills`
2. **触发**：自然语言描述任务，例如「给我 P00520 的 AlphaFold 结构并分析置信度」
3. **首次**：agent 申请装 `uv`（约 10s），之后脚本缓存秒开
4. **如需 key**：agent 引导你注册并写入 `~/.env`（AlphaGenome 等必须）
5. **跑**：agent 调对应 skill 的 `scripts/`，自动 rate-limit、产出文件与摘要
6. **合规提醒**：首次用某 skill，agent 在工作区 `.licenses/` 落 LICENSE.txt 并提醒你看上游条款

## 下一步

- [指南](./guide-line) —— 各领域深入、AlphaFold pLDDT/PAE 分析、AlphaGenome 变异工作流、PyMOL 渲染、科研工作流编排、反模式
- [参考](./reference) —— 38 skill 全表 + 触发词 + 各数据库许可
