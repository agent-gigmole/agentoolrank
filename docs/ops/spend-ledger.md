# AgentoolRank 花钱台账

规则：$AGENTKIT_ROOT/shared/harnesses/spend-control.md（零收入期能免费就免费；不为加速付钱；单渠道 ≤$50 先测后报）。

## 汇总
- 累计已付：$0.00（新增部分；OpenRouter 为既有预付余额的消耗）
- 已承诺：$0
- 最坏总损失：$0.30（已发生）
- 月固定成本：域名 agentoolrank.com（年费，已付）；Vercel Pro、Turso 为多项目共用，不计入边际成本

## 明细
| 日期 | 渠道 | 金额 | 用途 | 五问结论 | 封顶 / 止损 |
|---|---|---|---|---|---|
| 2026-10-01 | OpenRouter（既有余额 $22.05） | $0.26（实际）+ ≈$0.02 | deepseek-v3.2 生成 464 个工具的 alternatives，并修正 276 个展示名（内容生产） | 归因：alternatives 页的 GSC 点击；无免费替代（规则要求 LLM 生成）；最坏 $0.60；不适用回本 | 封顶 $0.60，超出即停脚本 |
