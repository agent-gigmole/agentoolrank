# 技术决策记录

## 2026-03-31 — LLM 模型切换：DeepSeek V3 → Kimi K2.5

**背景**：需要评估是否有更好的模型用于 Blueprint Generator

**对比测试**：6 模型 × 2 场景（中文量化 + 英文独立站）
- GPT-4o: $0.205/次, 质量最差（不懂A股、英文啰嗦）
- Kimi K2.5: $0.021-0.035/次, 质量最佳（领域知识强、指令遵循好）
- DeepSeek V3: $0.022/次, 最快(2s)、性价比好
- Qwen3 Max: $0.066/次, 无明显优势
- MiniMax M2.7: $0.024/次, 英文好但爱自作主张
- MiniMax M2.5: $0.016/次, 最便宜但慢

**决策**：切换到 Kimi K2.5 直连（api.moonshot.ai）
- 费用和 DeepSeek 几乎一样（$0.021 vs $0.022）
- 质量明显更好：中英文都是最佳
- 严格遵循 system prompt 的两阶段工作流

**API 配置**：
- Base URL: https://api.moonshot.ai/v1（注意需要 /v1）
- Model ID: kimi-k2.5
- Temperature: 只支持 1（不能设 0.3）
- 注意 thinking 模式：content 可能为空，reasoning_content 有值

## 2026-03-31 — LLM 模型二次切换：Kimi K2.5 → GLM-5 (OpenRouter)

**背景**：Kimi K2.5 上线后发现速度太慢（12-38s），测试了 GLM 系列

**对比**：
- Kimi K2.5: $0.021/次, 12-38s, 中英文质量最佳但慢
- GLM-5: $0.021/次, 1-3s, 中文量化问题比 Kimi 更专业
- GLM-4.7-Flash: $0.002/次, 1-4s, 质量稍弱但极便宜

**决策**：切换到 GLM-5 via OpenRouter
- 速度提升 10 倍（1-3s vs 12-38s）
- 中文场景问题更有深度（提到 AI 分析层次、GPU vs 云端部署权衡）
- 走 OpenRouter 而非智谱官方 API（官方 429 限流严重，速度慢 10 倍）

**API 配置**：
- Base URL: https://openrouter.ai/api/v1
- Model ID: z-ai/glm-5
- API Key: OpenRouter key（非智谱 key）

## 2026-03-31 — i18n 多语言方案

**背景**：需要在中文媒体（掘金/V2EX/即刻）推广，需要中文版

**方案选择**：B 方案（标准版）— UI + 首页 + 蓝图 + 搜索翻译，工具详情保持英文
- 不用 [locale] 动态段（避免迁移所有路由）
- 英文无前缀，中文 /zh/ 前缀
- 工具数据保持英文（开发者都看得懂，翻译 463 条 ROI 太低）

**路由**：/zh、/zh/blueprint、/zh/search

## 2026-03-31 — Blueprint JSON 解析：前端容错 vs 服务端结构化

**背景**：Codex 审查建议用 AI SDK Output.object() 做服务端结构化生成

**决策**：选择前端容错（双层 fallback），不做服务端结构化
- Kimi K2.5 不支持 response_format: json_object
- structured output 会丧失流式体验
- 前端双层解析（fenced JSON → 裸 JSON）已足够覆盖大部分情况
