# STATE.md — 当前状态

## 已完成

- AgentKit 框架部署
- gstack 工具集安装
- /office-hours 产品设计（设计文档 APPROVED）
- /autoplan 三阶段审查（CEO + Design + Eng，25 个决策）
- Next.js 15 + Tailwind v4 项目初始化
- Zod 数据契约 + Turso/SQLite 数据库 schema
- 11 个 Agent 工具分类（调研驱动）
- GitHub GraphQL 爬虫 + 44 个种子工具入库
- Percentile rank 排名算法
- LLM 内容生成：461/463 工具完成（99.6%）
- 9 个页面路由（首页/分类/详情/对比/搜索/新增/sitemap/robots/404）
- 全局导航 + newsletter email capture（前端）+ Compare 导航链接
- GitHub Actions daily cron workflow
- 域名 agentoolrank.com 注册（Cloudflare）
- Vercel 部署上线 + Cloudflare DNS
- Google Search Console sitemap 提交成功（58 页发现）
- Telegram topic「目录站」绑定
- 工具扩充管道完成（740 发现 → 716 爬取 → 清理/过滤 → 463 入库）
- 对比页索引 /compare + sitemap 添加 170 个对比 URL
- 最终数据：463 工具 | 648 sitemap URL | 461 complete 内容 | 170 对比页
- Supabase 迁移评估：决定不做（SQLite + GitHub Actions 够用）
- SEO 优化已上线：面包屑 + BreadcrumbList JSON-LD + CollectionPage schema + SoftwareApplication JSON-LD + 详情页→对比页内链
- Star Growth 趋势图：纯 SVG sparkline，零依赖
- Newsletter 后端：subscribers 表 + /api/subscribe + NewsletterForm 客户端组件
- AI Agent Weekly 周报：/weekly 页面，趋势 Top 15 + 新增工具
- 开源数据集仓库：github.com/agent-gigmole/awesome-ai-agent-tools
- SEO 全套收尾：面包屑、JSON-LD、内链、自动 ping Google

- Phase 4 Stack Graph 完成：stacks 表 + 15 个场景详情页
  - /stack 索引页 + /stack/[slug] 15 个详情页
  - HowTo JSON-LD + BreadcrumbList structured data
  - Nav 添加 Stacks 入口
  - Sitemap 扩展至 756 URLs

- Phase 5 AI-First 搜索基本完成
  - Turso 全量迁移（本地 SQLite → Turso 云端，stacks 表 tags 列修复）
  - AI SDK v6 集成 + DeepSeek provider（@ai-sdk/openai OpenAI-compatible 模式）
  - 对话式搜索体验：流式 AI Stack 生成
  - 流式状态指示器：分阶段显示（分析中/选型中/构建中/渲染中）
  - UX 修复：target="_blank" + 防后退重复生成
  - convertToModelMessages 修复（UIMessage → ModelMessage）
  - DeepSeek provider 修复（Responses API → .chat() Chat Completions API）
  - UTM 追踪：所有外链自动加 utm_source=agentoolrank
  - IP 限流：每 IP 每天 20 次请求
  - 两阶段对话：AI 先问 3-5 个问题再推荐工具
  - 防闲聊边界控制：拒绝与 AI Agent 工具无关的问题
  - GSC API 接入：Service Account + gsc-report.ts 报告脚本
  - CI 修复：bun.lock 同步 + Turso 同步 + contents:write 权限
  - 成本分析：单次推荐 ¥0.007，1000 用户/天 ¥326/月

## 进行中

- 运营阶段：等待 GSC 数据积累（739 URL 已发现，0 已索引 — 新站正常）
- typo sitemap 已删除（agentoolrank.com 拼错版本）

## 关键决策（Phase 5）

- 全量迁移 Turso（翻转之前"不迁移"的决定）
- SQLite 列 + 暴力扫描存 embedding（不引入向量数据库）
- AI Gateway OIDC 认证
- CEO 审查选了 SCOPE EXPANSION 模式 → 完整 C 方案（全量 AI-First）
- Spec review 评分 5/10 → 修复 8 个问题后文档已完善
- DeepSeek 作为 AI 提供商：成本极低（单次 ¥0.007），通过 @ai-sdk/openai 的 OpenAI-compatible 模式接入
- 两阶段问答模式：先澄清需求再推荐，提升推荐精准度
- IP 限流 20 次/天：防止滥用，控制成本

## 已知最佳结果

- 站点在线：https://agentoolrank.com
- 463 个工具入库，461 个有完整 LLM 内容（99.6%）
- 756 个 sitemap URL（工具页 + 对比页 + 分类页 + Stack 页 + 静态页）
- 15 个 Stack Graph 场景（RAG chatbot, coding assistant, multi-agent 等）
- Top 3: n8n (★181k), dify (★135k), langchain (★131k)
- Newsletter 后端已接通，可接收订阅
- /weekly 周报页面上线
- 开源数据集仓库已创建
- AI 搜索流式体验上线，带分阶段状态指示器 + 两阶段问答
- GSC：739 URL 已发现，0 已索引（新站 1-2 周内正常）

## 下一步

- 等 GSC 数据积累 1-2 周，根据索引数据调整 SEO 策略
- 观察 AI 搜索使用数据，优化推荐质量
- Phase 5 Phase 3（可选）：UGC + 用户评价 + 社区功能
