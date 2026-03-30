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

## 2026-03-28 批量工具扩充（44 → 578）
- 创建 discover-repos.ts：GitHub Search API + awesome-list 爬取 + curated 列表
- 发现 740 个新 repo（awesome-list 贡献最多）
- 修改 crawl-github.ts 支持 --discovered 模式，批量爬取 716 个成功入库
- 创建 cleanup-tools.ts：过滤非工具/低星/重复项，删除 138 个
- 最终结果：578 个工具入库（从 44 扩展到 578）
- 踩坑：GitHub Search API OR 语法不工作、FK 约束删除顺序、slug 冲突、awesome-list 噪音
- 待办：535 个工具 pending LLM 内容、inferCategories 分类精度低

## 2026-03-28 深度清洗 + LLM 内容 + 对比页（578 → 463）
- 创建 filter-relevance.ts：基于 tagline 关键词过滤非 AI agent 工具，移除 115 个
- 创建 reclassify-tools.ts：改进分类正则，减少默认分类堆积
- LLM 内容生成：48 个新工具完成（claude -p CLI，~20秒/个）
- 对比页：/compare 索引页 + sitemap 添加 170 个对比 URL
- Nav 添加 Compare 链接
- 最终：463 工具 | 86 complete 内容 | 648 sitemap URL | 170 对比页
- 关键数据变化：44→463 工具 | 58→648 sitemap URL | 43→86 LLM 内容 | 0→170 对比页
- 踩坑：claude -p ~20秒/个（50个≈17分钟）、libsql Row 需要 as unknown as T 双重断言

## 2026-03-28 LLM 内容全量完成 + SEO 优化
- LLM 内容生成：461/463 完成（99.6%），从 86 → 461
- Supabase 迁移评估：决定不做，SQLite + GitHub Actions 完全够用
- SEO 优化一揽子上线：
  - 面包屑导航组件 + BreadcrumbList JSON-LD structured data
  - 分类页 CollectionPage schema
  - 工具详情页 JSON-LD 增强为 SoftwareApplication
  - 详情页底部添加对比页内链（提升内链密度 + 长尾 SEO）
- 已部署 Vercel 上线
- 待办：手动提交 GSC sitemap 反映最新变更

## 2026-03-28 全部规划任务完成，进入运营阶段
- Star Growth 趋势图：纯 SVG sparkline 实现，零外部依赖，详情页展示 star 增长趋势
- Newsletter 后端：创建 subscribers 表 + /api/subscribe 端点 + NewsletterForm 客户端组件，前后端打通
- AI Agent Weekly 周报：/weekly 页面上线，展示趋势 Top 15 + 新增工具，为 SEO 长尾内容
- 开源数据集仓库：github.com/agent-gigmole/awesome-ai-agent-tools，为获取 backlinks 准备
- SEO 全套收尾：面包屑导航、JSON-LD structured data、内链优化、自动 ping Google 索引
- 全部 v1 规划任务完成，项目从开发阶段转入运营阶段

## 2026-03-28 Phase 4 Stack Graph 完成
- stacks 表 + stack_tools 关联表，15 个场景入库
- 场景覆盖：RAG chatbot, coding assistant, multi-agent, 客服机器人等
- /stack 索引页 + /stack/[slug] 15 个详情页
- HowTo JSON-LD + BreadcrumbList structured data
- Sitemap 从 648 扩展至 756 URLs（+108 stack 相关 URL）
- Nav 添加 Stacks 入口
- Phase 4 全部步骤完成

## 2026-03-28 Phase 5 AI-First 搜索 — CEO 审查 + Spec 定稿
- CEO 审查完成，选择 SCOPE EXPANSION 模式 → 完整 C 方案（全量 AI-First）
- 关键决策：
  - 全量迁移 Turso（翻转之前"不迁移 Supabase"的决定，但用 Turso 不用 Supabase）
  - SQLite 列 + 暴力扫描存 embedding（不引入向量数据库，463 工具规模够用）
  - AI Gateway OIDC 认证
- 发现现有 AI 搜索代码（Phase 4 的 StackGenerator + generate-stack API）体验弱：关键词搜索 + 手动点按钮 + 非流式
- Spec review 初评 5/10，修复 8 个问题后文档完善
- 分三阶段实施：Phase 1 AI 核心 → Phase 2 对话式体验 → Phase 3 UGC + 收尾
- 状态：计划完成，待开始实施

## 2026-03-28 Phase 5 Phase 1 完成 — AI 核心代码 + Turso 迁移
- Turso 全量迁移完成：本地 SQLite 数据 → Turso 云端
  - 坑：stacks 表有 tags 列但 schema.sql 未定义，需先 ALTER TABLE ADD COLUMN 再迁移
- AI 搜索核心代码：DeepSeek via @ai-sdk/openai（OpenAI-compatible provider）
- AI SDK v6 breaking changes 大量：
  - handleSubmit → sendMessage({ text })
  - api 参数 → transport: new DefaultChatTransport
  - message.content → message.parts 迭代
  - toDataStreamResponse → toUIMessageStreamResponse
  - maxTokens 参数已移除
- 搜索页接入流式 AI Stack 生成（/api/generate-stack）
- Vercel 环境变量配置：preview 环境需 --yes 参数或指定 branch
- db.ts 已有 Turso 支持（检查 TURSO_DATABASE_URL 环境变量），迁移只需设置 env var

## 2026-03-29 Phase 5 Phase 2 基本完成 — 流式指示器 + UX 修复
- 流式状态指示器：根据 AI 回复文本内容判断当前阶段（分析中→选型中→构建中→渲染中）
- UX 修复：工具链接 target="_blank" 防止用户离开 AI 页面丢失结果
- useRef 防止后退导航重复触发 sendMessage
- DeepSeek provider 修复：createOpenAI 默认用 Responses API（新），DeepSeek 不支持 → 用 provider.chat(modelId) 走 Chat Completions API
- convertToModelMessages 是必须的：useChat 发 UIMessage 格式（parts），streamText 需要 ModelMessage 格式
- compatibility:"compatible" 参数在某些版本不存在，TypeScript build 失败 → 只用 .chat() 就行
- /browse 前端自测验证通过（API 200 不代表前端正常工作，必须用 browse 测前端）
- 成本分析：DeepSeek 单次推荐 ¥0.007，完整 3 轮对话 ¥0.011

## 2026-03-29~30 Phase 5 收尾 — UTM/限流/两阶段/GSC/CI
- UTM 追踪：所有外链自动加 utm_source=agentoolrank，追踪导流效果
- CI 修复：bun.lock 与 package.json 不同步 → 重新生成；Turso 数据库同步步骤添加；GitHub Actions 需 contents:write 权限
- 两阶段对话：AI 先问 3-5 个澄清问题（使用场景/技术栈/团队规模等），再给出精准推荐
- 防闲聊边界控制：拒绝与 AI Agent 工具无关的问题，引导用户回到工具选型
- IP 限流：每 IP 每天 20 次请求，防止滥用，控制 API 成本
- GSC API 接入：创建 Service Account + gsc-report.ts 脚本，可程序化获取索引状态
- GSC 状态：739 URL 已发现，0 已索引（新站正常，需等 1-2 周）
- typo sitemap 已删除（之前提交了拼错域名的 sitemap）
- 成本分析完善：单次推荐 ¥0.007，1000 用户/天约 ¥326/月（含两阶段 3 轮对话）

## 2026-03-30 Launch 准备 + Blueprint 升级 + Tool Intelligence
- Blueprint 升级：从 Stack Generator 升级为 Blueprint Generator
  - 新增 execution_plan（实施步骤）+ failure_points（常见失败点）+ project_tags 字段
  - 混合推荐：AI 工具 + 外部行业标准工具（ext 标签区分内外部工具）
  - Codex 建议定位 "AI Project Blueprint"，不叫 Playbook，不承诺赚钱
  - 保留工具目录做 SEO 基础，Blueprint 做社交传播层
- OG 动态图：/api/og 端点，左右分栏布局，用于社交分享预览
- 徽章 API：/api/badge/[slug] 端点，供工具作者嵌入 README
- 72 个 stack 重新生成：使用 Claude Opus 提升质量
- 工具信息加厚：全量 463 工具补充 pros/use_cases 字段
- Tool Intelligence Layer：脚本写好，用 subagent 读 GitHub README 深度分析
  - 为每个工具生成 capabilities/integrations/limitations 档案
  - 不用 DeepSeek（分析能力不够），用 Claude subagent
  - top 50 工具正在分析中
- Launch Strategy 文档落盘
- X Article 已发布（Day 1 Launch）
- X 互动评论开始（主动回复相关话题）
- 下一步：Day 2 Data Story + Featured 邮件

## 2026-03-29 Tool Intelligence Layer 完成

- Claude Opus 直接分析 top 50 工具的 GitHub README（不使用外部 LLM API）
- 每个工具生成 9 字段结构化 JSON：capabilities, integrations, sdk_languages, deployment, pricing_detail, limitations, best_for, not_for, key_differentiator
- 50/50 全部成功写入 Turso 数据库 intelligence 字段
- 分析质量远超 DeepSeek：
  - integrations 具体到服务名（如 PostgreSQL, Chroma, LangChain 而非 "various databases"）
  - limitations 基于 README 实际内容（如 "Fair-code license restricts commercial redistribution"）
  - key_differentiator 有竞品对比（如 "Unlike LangChain which is code-first, Dify provides..."）
  - best_for 和 not_for 互斥且具体
- 工作流程：fetch README → Claude 分析 → 生成 JSON → 写入 DB（无 LLM API 调用）
