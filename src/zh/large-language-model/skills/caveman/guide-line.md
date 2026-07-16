---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 JuliusBrussee/caveman 的 `skills/caveman/SKILL.md`、README 与 `docs/HONEST-NUMBERS.md` 编写。

## 速查

- **核心规则**：删冠词/filler/寒暄/hedging；片段 OK；短同义词（big 不 extensive）；代码/命令/错误逐字保留
- **tokenizer 洞察**：**禁自造缩写**（cfg/impl/req/res/fn）——tokenizer 拆分和全词一样、零省 token，反损可读性
- **禁因果箭头**（X → Y）——箭头自成一个 token，省不了还牺牲清晰
- **6 档**：lite / full / ultra / wenyan-lite / wenyan-full / wenyan-ultra
- **保留语言**：压缩风格不翻译语言；wenyan 是刻意例外
- **Auto-Clarity**：安全/不可逆/多步歧义时退出 caveman，清晰后恢复
- **诚实**：只省输出，skill 自身加 ~1–1.5k 输入/轮，整会话可能净负；价值在可读性/速度

## 核心规则

Caveman 的 `SKILL.md` 只有一句纲领：「Respond terse like smart caveman. All technical substance stay. Only fluff die.」（像聪明穴居人般简短回答，技术实质全留，只有废话去死。）具体：

- **删**：冠词（a/an/the）、filler（just/really/basically/actually/simply）、寒暄（sure/certainly/happy to）、hedging
- **片段 OK**：不必完整句
- **短同义词**：big 不 extensive、fix 不「implement a solution for」
- **不动**：技术术语精确、代码块不变、错误逐字引用、API 名/CLI 命令/commit 类型（feat/fix）逐字保留
- **无工具调用旁白、无装饰性表格/emoji、不倾倒长原始错误日志**（只引最短决定性那行）

模式：`[thing] [action] [reason]. [next step].`

> ❌「Sure! I'd be happy to help. The issue is likely caused by...」
> ✅「Bug in auth middleware. Token expiry check use `<` not `<=`. Fix:」

## tokenizer 洞察：为什么禁自造缩写

这是 Caveman 最有技术含量的一条规则：**绝不自造新缩写**（cfg / impl / req / res / fn / auth）。原因是——**tokenizer 把它们拆分成和全词一样的 token，零 token 节省**，读者还要多一步解码。全词**又便宜又清晰**。同理**禁因果箭头**（X → Y）：箭头自成一个 token，省不了还牺牲可读性。

> 这条规则背后是对「表面变短 ≠ token 变少」的清醒认识：省 token 要顺着 tokenizer 的粒度来，而非凭直觉缩写。

## wenyan 文言文：极限压缩

`wenyan` 系列是给中文的彩蛋，也是真本事——古文每 token 载义最多：

| 档 | 特点 |
| --- | --- |
| `wenyan-lite` | 半文言，删 filler/hedging 但保留语法结构、古典语域 |
| `wenyan-full` | 最大古典简洁，完全文言文，**80–90% 字符缩减**，动词先于宾语、常省主语、用古典虚词（之/乃/為/其） |
| `wenyan-ultra` | 极限缩写，保留古典韵味，最大压缩 |

例——「为什么 React 组件重渲染？」：

- full：`New object ref each render. Inline object prop = new ref = re-render. useMemo.`
- wenyan-full：`每繪新生對象參照，故重繪；以 useMemo 包之則免。`
- wenyan-ultra：`新參照則重繪。useMemo 包之。`

> `wenyan` 是「保留语言」规则的**刻意例外**：正常情况下 caveman 压缩风格不翻译语言，但古文因每 token 载义最多而被特批。

## Auto-Clarity：什么时候退出 caveman

极简有风险——省略连词/冠词可能让多步序列歧义。Caveman 内建 **Auto-Clarity**：以下情形**自动退出 caveman**、恢复正常清晰表达，清晰的部分做完再恢复 caveman：

- **安全警告**
- **不可逆操作确认**（如 `DROP TABLE`）
- **多步序列**里片段顺序或省略连词会误读
- **压缩本身制造技术歧义**（如「migrate table drop column backup first」没冠词/连词就顺序不清）
- 用户要求澄清或重复提问

> 这体现「简短服务于沟通，而非以牺牲正确性为代价」——该清楚的地方一定清楚。

## 诚实数字：别只冲着省钱

这是 Caveman 最值得敬佩的一点——作者在 `HONEST-NUMBERS.md` 里**主动泼冷水**：

- Caveman **只压缩输出 token**；**输入和推理 token 不动**，且 skill 自身每轮加 ~1–1.5k 输入 token
- 所以**整会话省得比 65% 少**，在已经很简洁的工作负载上甚至**可能净负**
- **真正的赢面是可读性与速度**，省钱是 bonus

基准（真实 Claude API 计数，可复现）：10 个 prompt 输出减少均值 **65%**（范围 22–87%）；`/caveman-compress` 改写记忆文件均减 **~46%** 输入 token（永久，每 session 生效）。

> 一个有意思的旁证：README 引 2026-03 一篇论文《Brevity Constraints Reverse Performance Hierarchies in LMs》——约束大模型给简短答案，在某些基准上**准确率提升约 26 分**。有时「少字 = 更对」。（这是他引用的研究结论，非本页断言。）

## 边界与持久性

- **ACTIVE EVERY RESPONSE**：一旦开启每条回复都生效，多轮后不 revert、不 filler 漂移；不确定时仍生效；仅「stop caveman / normal mode」关闭
- **代码/commit/PR 写正常**：只压缩散文，不动这些
- **无自我指涉**：绝不命名或宣布这个风格（不「me caveman think」），输出只有 caveman 内容

## 反模式

| 反模式 | 问题 |
| --- | --- |
| 冲着「省钱」装 caveman | 诚实看：整会话可能净负；价值在可读性/速度 |
| 自造缩写以为更省 | tokenizer 拆分同样长、零省 + 损可读性 |
| 安全/破坏性操作也硬压缩 | 应触发 Auto-Clarity 退出，别牺牲正确性 |
| 期望它压缩输入 token | 它只压输出，输入靠 `/caveman-compress` 改记忆文件 |
| 让它改写代码/命令/错误 | 明确禁止，这些逐字保留 |

## 下一步

- [参考](./reference) —— 7 技能全表、6 档对照、基准数据、跨 agent 安装、隐私
- 上游：[HONEST-NUMBERS.md](https://github.com/JuliusBrussee/caveman/blob/main/docs/HONEST-NUMBERS.md)
