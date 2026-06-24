# TradeDNA 评分引擎 V3.0

> 2026-06-24 V3 重写。基于四维改造（信息 R/X × 情绪 T/E × 风险 C/G × 执行 D/F）。
> 配套实现见 `miniprogram/utils/scoring.js` + `miniprogram/utils/questions.js` + `miniprogram/utils/dimensions.js`。
> 本文档为评分逻辑的技术规格说明——以代码为准，本文档为辅助阅读。

---

## 一、四维定义

| 维度 | key | 字母 | 含义 |
|---|---|---|---|
| 信息驱动 | `information` | R / X | 自主研究 / 跟随外部 |
| 情绪反应 | `emotion`     | T / E | 情绪稳态 / 情绪敏感 |
| 风险偏好 | `risk`        | C / G | 保守 / 进攻 |
| 执行能力 | `execution`   | D / F | 严守纪律 / 机会驱动 |

V3 维度文案统一来源：`miniprogram/utils/dimensions.js` 的 `DIM_META`，UI 层任何文案变更都修改这一处。

### V2 → V3 维度变更

| 旧 | 新 | 变更理由 |
|---|---|---|
| 决策方式 A/B（分析/直觉）| 信息驱动 R/X（自研/跟随）| A 股语境下"政策依赖+从众"是李心丹研究的最强行为偏差，海外 Big Five 框架未覆盖 |
| 交易周期 S/L（短/长）| 情绪反应 T/E（稳态/敏感）| S/L 是策略变量不是人格变量；处置效应=A 股第一行为偏差，需要专门的人格维度承接 |
| 风险偏好 C/G | 保留 | 金融学 risk tolerance 标准维 |
| 执行能力 D/F | 保留（F"灵活"修订为"机会驱动"）| Big Five Conscientiousness 强相关，所有交易心理研究指向核心 |

详见 `docs/product/TradeDNA_V2_四维改造方案.md`。

---

## 二、题目结构

总 25 题，分 5 组：

| 题号 | 维度 | 组别 | 权重 |
|---|---|---|---|
| Q1-Q5   | `information` | 主测·信息驱动 | 1.0 |
| Q6-Q10  | `emotion`     | 主测·情绪反应 | 1.0 |
| Q11-Q15 | `risk`        | 主测·风险偏好 | 1.0 |
| Q16-Q20 | `execution`   | 主测·执行能力 | 1.0 |
| Q21-Q25 | `behavior`    | 行为情境题    | 0.5（跨维度）|

行为题为**场景化跨维度题**——每个选项可同时给多个字母加分，用于：
1. 不让用户从题目维度反推"该选哪个"（去社会期许偏差）
2. 主测与行为题分轨打分，检测一致性（背离提示）

---

## 三、打分算法

### 3.1 选项 score 数据结构

每个选项的 `score` 是字母→分值的字典。

主测题示例（单字母，权重 1）：
```js
{ key:'R', text:'翻它的财报、行业逻辑，判断是不是真机会', score:{R:1} }
```

行为题示例（双字母，权重 0.5）：
```js
{ key:'X', text:'看群里和大V怎么说，跟着调整', score:{X:0.5, E:0.5} }
```

支持的字母全集：`R, X, T, E, C, G, D, F`。

### 3.2 累加打分

`sumScores(answers, questions)`：
- 初始化 `score = { R:0, X:0, T:0, E:0, C:0, G:0, D:0, F:0 }`
- 遍历每一题，把选中选项的 `score` 字典累加到总分上
- 跳过未作答的题（answers 中为 `undefined/null`）

### 3.3 取胜规则（每维取较大字母）

`deriveCode(score)`：
```js
{
  information: score.R >= score.X ? 'R' : 'X',
  emotion:     score.T >= score.E ? 'T' : 'E',
  risk:        score.C >= score.G ? 'C' : 'G',
  execution:   score.D >= score.F ? 'D' : 'F'
}
```

**平局规则**：相等时取左侧字母（R/T/C/D），即"研究/稳态/保守/纪律"优先——这是设计上的安全偏向。

### 3.4 最终 DNA 码拼接

```js
code = info + emotion + risk + execution
// 例：'RTCD' / 'XEGD' / 'XECF'
```

字母顺序固定为 **信息→情绪→风险→执行**，与维度展示顺序一致。

---

## 四、主测 vs 行为题双轨打分

### 4.1 双 code 计算

`calculateResult` 同时产出 3 个 code：
- `totalCode`：全 25 题打分 → 用作最终人格匹配
- `cognitiveCode`：仅前 20 题（主测）打分
- `behaviorCode`：仅后 5 题（行为）打分

### 4.2 背离检测

遍历 4 个维度，若 `cognitiveCode[dim] !== behaviorCode[dim]` → 记录一条 divergence：

```js
{
  dimension: 'execution',
  dimName: '执行能力',
  cognitive: '纪律',       // 主测：你以为自己怎么想
  behavior:  '机会驱动'    // 行为：你实际怎么做
}
```

UI 在结果页用 ⚠️ 卡片展示，文案："你的主测结果是 X，但行为题表现更接近 Y"。

**设计意图**：捕捉"自报-实操错配"——A 股最常见的偏差是 XECF 自以为是 RTCF（"我有体系")或 XEGF 自以为是 XEGD（"我有纪律"）。

---

## 五、效度警告（Validity Warnings）

`detectValidityWarnings(timings, mainScore, divergenceCount)` 输出 0-2 条警告。

### 5.1 反应时过快

- 触发条件：超过 60% 的题目用时 < 1 秒
- 文案：⚠️ 你的答题速度过快，结果仅供参考，建议重测
- 目的：识别"随手乱点"的无效答卷

### 5.2 极端+背离

- 触发条件：4 个维度的主测得分全部 5-0 极端（任一维度都是满分一致）**且** 行为题与主测至少有 1 维背离
- 文案：⚠️ 你的答题模式接近随机/极端，结果仅供参考，建议重测
- 目的：识别"全选 A 或全选 B"的对抗式答卷

警告只提示不阻断——用户依然能看到结果。

---

## 六、结果数据结构

`calculateResult` 返回：

```js
{
  code:           'RTGD',      // 总 DNA 码
  score:          {R, X, T, E, C, G, D, F},
  information:    'R',         // 各维度独立字母
  emotion:        'T',
  risk:           'G',
  execution:      'D',
  personality:    {...},       // 来自 personalities[code]
  cognitiveCode:  'RTGD',      // 主测 code
  behaviorCode:   'RTGF',      // 行为 code（可能与 cognitive 背离）
  divergence:     [...],       // 0-4 条背离记录
  validityWarnings: [...],     // 0-2 条效度警告
  timestamp:      1718956800000
}
```

存储在 `wx.setStorageSync('tradeDNAResult', result)`，由 result/poster/mine 页消费。

---

## 七、人格匹配

`getPersonality(code)`：
- 查 `personalities[code]`
- 找不到时 fallback 到默认 `'RTGD'`（数据狙击手）——选 RTGD 而非中间值是因为它是 V3 命名变更最少的格之一

老用户 storage 里若有 V1 旧 code（ASGD/BLCF 等），会触发 fallback——结果页显示 RTGD 而非报错。建议在 `mine` 页加"老用户重测"提示。

---

## 八、关键文件清单

| 文件 | 职责 |
|---|---|
| `miniprogram/utils/questions.js`     | 25 题题库 + 选项 + 评分字典 |
| `miniprogram/utils/scoring.js`       | sumScores / deriveCode / calculateResult / detectValidityWarnings |
| `miniprogram/utils/dimensions.js`    | DIM_META / QUIZ_DIM / TRAIT_TAG / poleLabel —— 维度文案的唯一来源 |
| `miniprogram/utils/personalities.js` | 16 人格库 + 多导师 + 警醒文案（XECF）|
| `miniprogram/utils/shuffle.js`       | 题目乱序（同维度内 + 选项内）+ 行为题尾置 |
| `miniprogram/utils/mentorAvatar.js`  | 导师头像映射，缺图降级首字圈 |

---

## 九、与 V1 文档对照

V1 评分引擎文档基于旧维度（A/B + S/L + C/G + D/F），已废弃。V3 主要变化：
- 字母全集变更：A,B,S,L → R,X,T,E
- 维度 key 变更：decision/cycle → information/emotion
- 新增维度常量模块 `dimensions.js`（V1 时代分散在各文件）
- 新增主测/行为双轨打分（V1 已有，本档明确）
- 新增效度警告（V1 已有，本档明确）
- 行为题 score 字典使用 V3 字母

V1 文档保留为历史归档，见 `TradeDNA_评分引擎_V1.md`（已加废弃标记）。

---

## 十、扩展点（未来版本）

预留但当前未启用：

- **权重个性化**：当前 4 维等权，未来可按用户画像调整（如基民用户对 emotion 维赋更高权重）
- **置信区间**：当前直接取较大字母，未来可输出 "RTCD 85% 置信 / RTCF 12% 置信" 的概率分布
- **跨次稳定性**：当前每次测评独立，未来可对比同一用户多次测评的 DNA 漂移
- **题库 AB 测试**：当前 25 题固定，未来可做 ABC 三套题库的等效性测试

这些都是产品功能而非评分逻辑——本档不展开。
