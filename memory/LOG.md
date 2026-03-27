# LOG.md — 变更日志

## 2026-03-27 AgentKit 框架部署
- 完成 AgentKit 框架初始化部署
- 从 discussion_notes.md 提取项目信息填充 memory 文件
- 垂直方向确定：AI Agent 工具导航
- 技术栈：Next.js + Tailwind + Vercel
- 差异化策略：数据驱动（GitHub 活跃度排序 + LLM 自动生成 + 每日更新）

## 2026-03-27 gstack 安装 + /office-hours 设计
- 安装 bun + gstack（28 个 skills）
- 运行 /office-hours Builder mode，产出设计文档
- 垂直方向从纯 Agent → Agent + 行业维度预留（电商/投资）
- Codex 第二意见：提出 Stack Graph 概念，Best of JS 作为开源参考
- 设计文档通过 adversarial review（6.5/10 → 修复 8 个问题）

## 2026-03-27 /autoplan 三阶段审查
- CEO review：5 个 premise 确认，对比页提前到 v1，加 newsletter
- Design review：信息层级、交互状态、响应式策略全部需要补充
- Eng review：SQLite+Vercel 架构矛盾（Critical），LLM prompt injection（Critical）
- 25 个决策全部 approved
- 关键修正：SQLite→Turso、对比页 v1、percentile rank、Zod schema、prompt injection 防御

## 2026-03-27 MVP 开发（一次性完成）
- Next.js 15 + Tailwind v4 初始化
- Zod 数据契约（Tool/Category/MetricSnapshot/SearchItem）
- SQLite 数据库 schema + 11 个分类入库（调研驱动：StackOne 报告 + GitHub + 竞品）
- GitHub GraphQL 爬虫：47 个种子 repo，44 个成功入库，API 消耗 47 点/5000
- Percentile rank 排名算法（star velocity 35% + commits 30% + releases 20% + recency 15%）
- LLM 内容生成：Claude Code CLI Max plan 通路，43/44 工具完成
- 9 个页面：首页/分类/详情/对比/搜索/新增/sitemap/robots/404
- ToolCard 组件 + JSON-LD structured data
- 全局导航 + newsletter email capture（前端 only）
- GitHub Actions daily cron

## 2026-03-27~28 域名 + 部署 + 上线
- 域名搜索：whois 不可靠，改用 Cloudflare API /check 端点精准查询
- "agent" 前缀域名几乎全被抢注，最终选 agentoolrank.com ($10.46/yr)
- domain-check skill 升级为 Cloudflare API v2.0
- Vercel 部署：outputFileTracingIncludes 解决 SQLite 路径问题
- Cloudflare DNS: A record → 76.76.21.21
- sitemap.xml 修复：环境变量换行导致 URL 断裂
- Google Search Console: sitemap 提交成功，58 页发现
- Telegram topic「目录站」创建并绑定

## 2026-03-28 /agentkit-save checkpoint
- MVP 完成，站点上线 agentoolrank.com
- 自检结果：补了大量遗漏（STATE/LOG/TASK/KNOWLEDGE/DECISIONS 全部过期）
- 状态：idle，等待 P0（扩充工具 + 对比页 + backlinks）
