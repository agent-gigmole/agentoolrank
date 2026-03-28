# DECISIONS.md — 关键决策记录

## vertical-direction
- **背景**: 选择 AI 导航站的垂直方向，四个候选：AI Agent 工具 / AI 量化金融 / AI 电商 / AI 开发者工具(MCP)
- **选项**:
  - A. AI Agent 工具导航 — 正在爆发期，大站覆盖不深，自己是重度用户
  - B. AI 量化/金融工具 — 自己最懂但受众太窄
  - C. AI 电商工具 — 付费意愿强但需了解行业
  - D. AI 开发者工具 — 极度垂直但受众偏技术
- **结论**: A — AI Agent 工具导航。理由：赛道爆发期 + 现有大站覆盖不深 + 自己是重度用户有判断力
- **日期**: 2026-03-27

## content-strategy
- **背景**: 如何生产工具内容 — 人工测评 vs 自动化
- **选项**:
  - 人工逐个测评 — 质量高但不可规模化
  - 数据驱动自动化 — 爬虫 + LLM + cron，80%自动 20%人工审核
- **结论**: 数据驱动自动化。与论文扫描同一套路。差异化靠数据新鲜度和排序质量，不靠人工测评深度
- **日期**: 2026-03-27

## scope-strategy
- **背景**: MVP scope — 方案 A(数据引擎优先 1-2w) vs B(完整MVP 3-4w) vs C(Stack Graph 6-8w)
- **结论**: B，但 Week 2 先部署。autoplan 5 个声音都建议 A 先上但最终选 B+早部署折中
- **日期**: 2026-03-27

## database-choice
- **背景**: 数据存储 — JSON 文件 vs SQLite vs Turso vs Supabase
- **结论 v1**: SQLite 本地开发 + Vercel 打包部署（临时方案）。autoplan 建议 Turso，实际 SQLite+outputFileTracingIncludes 能工作但不是长期方案。P1 迁移 Supabase
- **日期**: 2026-03-27
- **结论 v2**: Phase 3 评估后决定不迁移 Supabase — SQLite + GitHub Actions 完全够用
- **日期**: 2026-03-28
- **结论 v3（当前）**: Phase 5 翻转决定 — 全量迁移 Turso（不是 Supabase）。原因：AI 搜索需要服务端写入（embedding 存储 + 用户数据），SQLite 打包模式不支持运行时写入。选 Turso 而非 Supabase 因为 Turso 兼容 libsql（项目已用），迁移成本最低
- **日期**: 2026-03-28

## embedding-storage
- **背景**: 向量存储方案 — 专用向量数据库(Pinecone/Weaviate) vs SQLite 列存储
- **结论**: SQLite BLOB 列 + 暴力扫描。463 工具规模下暴力扫描足够快（<50ms），不值得引入额外向量数据库依赖
- **日期**: 2026-03-28

## ai-gateway-auth
- **背景**: AI API 调用认证方案
- **结论**: AI Gateway + OIDC 认证。统一管理 API key、限流、监控
- **日期**: 2026-03-28

## ranking-algorithm
- **背景**: 排名公式 — min-max 归一化 vs percentile rank
- **结论**: percentile rank。autoplan Eng review 指出 min-max 在极端分布下崩溃（LangChain 效应）
- **日期**: 2026-03-27

## llm-content-generation
- **背景**: LLM 内容生成通路 — Anthropic API key vs Claude Code CLI
- **结论**: Claude Code CLI (`claude -p`)。用户有 Max plan 无需额外 API key。Sonnet 4 模型
- **日期**: 2026-03-27

## domain-name
- **背景**: 域名选择。"agent" 前缀几乎全被抢注
- **选项**: agentpulse.com(taken) / agentradar.com(taken) / agentoolrank.com(available $10.46)
- **结论**: agentoolrank.com — "agent+tool+rank" 三个 SEO 关键词，.com 最优 TLD
- **工具经验**: whois 命令不可靠（显示可用但实际已注册），Cloudflare API /check 端点最准
- **日期**: 2026-03-28
