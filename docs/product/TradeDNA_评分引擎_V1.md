# TradeDNA 评分引擎 V1.0 ⚠️ 已废弃

> **本文档已被 V3 替代**：见 [TradeDNA_评分引擎_V3.md](TradeDNA_评分引擎_V3.md)
>
> V1 基于旧四维（决策 A/B + 周期 S/L + 风险 C/G + 执行 D/F），已于 2026-06-23 全面改造为 V3 维度（信息 R/X + 情绪 T/E + 风险 C/G + 执行 D/F）。字母全集、维度 key、行为题打分字典均已变更。本文档仅作历史归档。

---



## 维度

- A/B：决策方式，分析驱动 / 直觉驱动
- S/L：交易周期，短线 / 长线
- C/G：风险偏好，保守 / 进攻
- D/F：执行能力，纪律 / 灵活

## 题目分组

- Q1-Q5：决策方式
- Q6-Q10：交易周期
- Q11-Q15：风险偏好
- Q16-Q20：执行能力
- Q21-Q25：行为题（原"校验题"，模拟真实场景，权重 0.5，检测主测维度答案与实际行为一致性）

## 算法

每个选项对应一个或多个得分项。

示例：

```js
{ key:'A', text:'先研究逻辑', score:{A:1} }
{ key:'B', text:'先小仓试试', score:{B:1} }
```

校验题支持小数权重：

```js
{ key:'B', text:'想追进去', score:{G:.5,F:.5} }
```

最终：

```js
decision = score.A >= score.B ? 'A' : 'B'
cycle = score.S >= score.L ? 'S' : 'L'
risk = score.C >= score.G ? 'C' : 'G'
execution = score.D >= score.F ? 'D' : 'F'
code = decision + cycle + risk + execution
```

## 代码位置

- 题库：`miniprogram/utils/questions.js`
- 评分：`miniprogram/utils/scoring.js`
- 人格库：`miniprogram/utils/personalities.js`
