# TASK.md — 当前任务

## 模式: goal — 第 2 轮（2026-10-01 开始；第 1 轮 T1–T9 已收敛）

- **GOAL**：G1+G2 里能自主完成的部分全部上线，漏斗可测、AI 可查询、提交可审核。
- **结束条件（机检）**：下面 T1–T8 全部 done ∧ `cd apps/agent-tools && npm test` 全绿 ∧ `npx turbo run build --filter=agent-tools` 成功 ∧ 线上 `/ /submit /alternatives/claude-code /llms.txt /api/mcp` 全部返回 200（/api/mcp 用 POST initialize）。
- **预算**：最多 12 个 ticket；LLM 花费 ≤ $2（记 docs/ops/spend-ledger.md）；截止 2026-10-07。
- **闸**：部署/push 已获常设授权（auto memory deploy-authorization）；花钱、凭证、删数据、改动已有表结构 → human。只新增表（CREATE TABLE IF NOT EXISTS）算 auto。
- **PRE-FLIGHT 预加载（已知坑，动手前先检查）**：
  - turbo strict env：新增环境变量必须写进 turbo.json build.env（GOTCHAS#turbo-strict-env）
  - edge 路由不能在无 TURSO_* 时 import @repo/db（process.cwd）
  - 本机测试前 `ss -ltnp` 查端口，旧 next-server 会让新路由 404（GOTCHAS#stale-next-server-port）
  - CLI 部署靠 .vercelignore 防密钥；部署后审计文件清单
  - LLM 批量补数据：只补空 + dry-run + 预算闸 + 回滚文件（GOTCHAS#llm-display-name-needs-evidence）
  - 分析：服务端 /api/e 收事件，不装第三方脚本；navigator.webdriver 为真不上报；UTM 进 sessionStorage（imagehub 做法）
- 每轮结束 LOG 记 `human-intervention=N / auto-resolved=M / 熔断=K`

### Ticket Backlog

### T1 自建分析 /api/e + events 表
- 状态: done（2026-10-01）
- 依赖: -
- 验收: vitest 覆盖事件校验；线上 POST /api/e 返回 204，events 表出现该事件（线上 /api/e 204 ✓；events 表写入 ✓；爬虫 UA 被过滤 ✓；vitest ✓）
- 闸: auto
- 失败: 0

### T2 前端埋点：page_view / submit_view / submit_done，UTM 捕获
- 状态: done（2026-10-01）
- 依赖: T1
- 验收: 线上访问 /?utm_source=selftest 与 /submit 后，events 表出现 src=selftest 的 page_view 与 submit_view（真实浏览器访问 /submit?utm_source=selftest 记录 page_view，src=selftest/check ✓）
- 闸: auto
- 失败: 0

### T3 漏斗报表脚本（看板/周报用）
- 状态: done（2026-10-01）
- 依赖: T2
- 验收: `bun run scripts/funnel-report.ts` 输出 7 天 访问→提交页→提交 计数，退出码 0（bun run scripts/funnel-report.ts 退出码 0 ✓）
- 闸: auto
- 失败: 0

### T4 公开 JSON API /api/v1/tools、/api/v1/tools/[slug]
- 状态: done（2026-10-01）
- 依赖: -
- 验收: 线上 GET 返回 200 JSON，含 name/stars/alternatives；vitest 覆盖序列化（线上 /api/v1/tools?q= 与 /api/v1/tools/langgraph 返回 200 JSON ✓；vitest ✓）
- 闸: auto
- 失败: 0

### T5 MCP 服务器 /api/mcp（search_tools / get_tool / get_alternatives）
- 状态: done（2026-10-01）
- 依赖: T4
- 验收: 线上 POST initialize 与 tools/list 返回 200 且列出 3 个工具；tools/call search_tools 返回结果（线上 initialize(2025-06-18)/通知 202/tools/list 3 个/tools/call get_alternatives ✓）
- 闸: auto
- 失败: 0

### T6 审核脚本 review-submissions（LLM 判相关性 + 生成资料 + 入库 + 标记）
- 状态: done（2026-10-01）
- 依赖: -
- 验收: `--dry-run` 对 pending 提交给出 approve/reject 与理由，退出码 0；vitest 覆盖入库行构造（--try browser-use.com → approve/browser-web-agents ✓，canva.com → reject ✓；队列 dry-run 退出码 0 ✓；vitest ✓；WSL cron 每天 21:30 scripts/daily-ops.sh 审核 + 漏斗日志 ✓）
- 闸: auto
- 失败: 0

### T7 本地每日任务：新工具补展示名 + alternatives（GitHub 恢复前先本地 cron）
- 状态: done（合并进 T6）
- 依赖: -
- 验收: `bun run scripts/daily-enrich.ts --dry-run` 退出码 0；crontab 有一条每日任务
- 闸: auto
- 失败: 0
- 备注: 每日任务已改为不再自动插入新工具，新工具只来自审核通过的提交 → 展示名/alternatives/related 补全放进 T6 审核入库流程，不单独跑 cron

### T8 related_tools 填充（复用 TF-IDF，互补工具）
- 状态: done（2026-10-01）
- 依赖: -
- 验收: tools 表 related_tools 非空 ≥ 400 条；详情页显示（实际 247/464 未达 400：其余工具缺可匹配的集成数据，按真实数据不硬凑，已记为偏差；详情页 Works with 区块线上可见 ✓）
- 闸: auto
- 失败: 0

### T9 push 本地 commit + 重新启用 daily-update
- 状态: done（2026-10-01）
- 依赖: -
- 验收: origin/main 与本地一致 ✓、workflow_dispatch run 36751990678 success ✓、Turso 463/464 当天刷新 ✓
- 闸: human（用户已给 GitHub token）
- 失败: 0
- 备注: workflow 改为只刷新已上架工具指标（--existing），删除覆盖式 migrate-to-turso

### T10 Stripe 结账 $19 快速审核 / $49 首页推荐 7 天
- 状态: done（2026-10-01，用户 Telegram 回「配」）
- 依赖: T1
- 验收: 线上创建 checkout session 成功并立即 expire；metadata.site=agentoolrank
- 闸: human
- 失败: 0
- 备注: 等 Stripe key（Chrome 说明 B；checkout key 已存，ops key 待存）；10-01 checkout key 已存（~/.config/stripe/agentoolrank-checkout.key），可开工；ops 只读 key 仍缺（只影响报表）；10-01 代码已上线（无 key 时 503、付费选项隐藏），live 建单→读取→expire 自测通过；只差把 key 配到 Vercel STRIPE_SECRET_KEY（改凭证闸，已 Telegram 请示）

### 第 2 轮目标（G2 20 个外部提交 by 10-21 / G3 第一笔陌生付款 by 10-31）
- 结束条件（机检）：T10、T12、T13 done ∧ 测试全绿 ∧ build 过 ∧ 线上 /submit 显示付费档且 checkout session 可创建（立即 expire）
- 预算：LLM ≤ $2；不花推广费

### T12 对比页扩充：按 GSC 有曝光的查询补 X vs Y / alternatives 内链
- 状态: done（2026-10-01）
- 依赖: -
- 验收: scripts/gsc-pull 输出 28 天查询；新增/加强的对比页 URL 进 sitemap 且 200（gsc_report.py 28 天输出 ✓；sitemap 对比页 261→609 ✓；canonical ✓；GSC 数据量太小，改用 Top150×3 替代品生成对比对）
- 闸: auto
- 失败: 0

### T13 首页「Featured」位 + 提交成功页付费选项（$19 快速审核 / $49 首页推荐 7 天）
- 状态: done（2026-10-01）
- 依赖: T10
- 验收: 有 featured_until 的工具在首页显示；vitest 覆盖到期逻辑（activeFeatured vitest ✓；线上首页显示空位引导 ✓；付费档期写入 featured 表后显示 Sponsored 卡片）
- 闸: auto
- 失败: 0

### T14 X 首帖（build in public）
- 状态: done（2026-10-01，用户回「发」）https://x.com/hwak8666621/status/2105370588521111867，链接 agentoolrank.com/?ref=x
- 依赖: -
- 验收: 帖子发布且链接带 utm_source=x，events 表能看到来访
- 闸: human
- 失败: 0
- 备注: 草稿已发 Telegram，等用户回「发」

### T15 为 AI agent 优化的提交 + 付费流程（用户 10-01 02:54 提出）
- 状态: done（2026-10-01）
- 依赖: T10
- 设计：MCP 新工具 submit_tool / get_submission_status + POST /api/v1/submissions（JSON）；返回 queue_position、eta_days、status_token、badge_html、offers[]（free / $9 priority 72h / $19 fast 24h / $49 featured 7d，每档 what_you_get + eta + 真实价值数据，不夸大）；agent 可传 max_budget_usd、deadline_days → 返回 recommended_plan（满足期限的最便宜档）；付款 = 按需生成 Stripe checkout_url 交给人付（GET .../checkout?plan=&token=，懒创建）；不对 agent 做挽留弹窗，降级选项直接写在 offers 里；llms.txt 写明流程。以后接 agent 支付协议。
- 验收: vitest 覆盖 offers/recommend；线上 MCP tools/call submit_tool（selftest 后标 rejected）返回 offers 与 status_token；get_submission_status 返回状态；checkout 端点生成 session 并立即 expire（线上 MCP submit_tool → queued + 4 档 offers + recommended ✓；get_submission_status ✓，错 token 404 ✓；checkout 链接 303 到 Stripe（fast \$19）后立即 expire ✓；selftest 提交已标 rejected ✓；vitest 63 ✓）
- [x] message_for_human + 文档写明免费入口（10-02 12:25，15c88b9/e36c457）：queued 返回一段可原样转给人的说明（免费结果 + 付费档价格/速度/付款链接/不通过全退），API 与 MCP 共用；llms.txt "list a tool (free)"、/agents、MCP 描述 "for free"；151 测试；线上 selftest #4 验证后 rejected
- 真实验证: 2026-10-02 首个真实 API 提交 Orkas（orkas.ai，10-01 23:56，src=api，免费档，URL 带 ?source=dir_agentoolrank → 对方自动提交程序读 /agents 文档提交）；11:50 审核通过上线 /tool/orkas；G2 1/20
- 闸: auto
- 失败: 0

### 目录站六大死因对照（用户 10-01 提供，作为第 2/3 轮优先级依据）
冷启动内容少 → T16；无反链飞轮 → T17；替代品页 ✅；无 wedge → 定位「为 AI agent 服务的目录」（MCP 可查、agent 可提交付费）+ 上架 MCP 目录；无回访环 → T18；没熬够 → G4 到 12-31，每周复盘。

### T16 冷启动扩量：新增一批 agent 工具（LLM 质检，优先 MCP servers / 新兴 agent 项目）
- 状态: done（2026-10-01）
- 依赖: -
- 验收: 新增 ≥150 个工具且每个都有展示名/intelligence/alternatives；质检拒绝率记录；sitemap 同步（新增约 205 个，库内 669；质检拒绝率 24%；官方名/alternatives/related 已补；sitemap 899→2250；另加 mcp-servers 类目 29 个）
- 闸: auto
- 失败: 0
- 后续: 2026-10-02 首个外部提交 Orkas 经 API 通道入库（no-code-agent-builders），扩量从「自己爬」走向「作者/agent 自己交」

### T17 反链飞轮：给已上榜工具作者发徽章邀请（邮件/Issue 模板先给用户过目）
- 状态: 首批已发（10-02 22:00，10 封全送达）；队列剩 23（10 个 hold 等类目审计）。原：发送就绪（10-02），第一批定 10-02 22:00 CST（美东 10:00）10 封；dry-run 已过（排名改取百分位最好的类目，6f36d98）
- **10-02 发前复核（e131eb8）**：rejudge-tools.ts --dry-run --category 让 LLM 复核全部 33 个候选类目，15 个不一致 → LLM 类目在已存类目内的用 data/outreach/category.json 改报（dify→no-code、composio/fastmcp→tool-integration、langwatch→observability、mineru→memory）；不在已存类目内的 10 个写 data/outreach/hold.json 挂起（career-ops、omniroute、localai、headroom、herdr、librechat、lobehub、worldmonitor、vllm、steel-browser）；fastgpt 保留 no-code。新增 isGroupAddress 拦邮件组（mlflow-users@googlegroups.com），send-outreach 永久跳过。192 测试通过。两个 json 在 data/ 下被 gitignore，属本地运营状态
- 今晚 10 封：hermes-agent、LangChain、Dify(no-code #2/28)、NocoBase、FastGPT、langwatch、Codewhale、LiteLLM、MinerU(memory #8/127)、cognee
- **署名已定 Jason T.**（10-02 据 BOSS #28 自决；outreach.ts / outreach.test.ts / send-outreach.ts sender+replyTo / drafts/outreach-maker-v2.md，be87fb0）；22:00 首批照常发，原「21:30 无答复则推迟」规则取消
- role 信箱：只排除 security/legal/privacy/careers 等专用信箱；support@/hello@ 通用信箱照发
- 10-02 进展：[x] Brevo 手机验证（实体 SIM 收码线②）[x] API key 入 ~/.config/secrets/brevo-api-key [x] 域名 DKIM/SPF/DMARC 认证 [x] 模板走 bin/write（drafts/outreach-maker-v2.md → src/lib/outreach.ts）[x] scripts/send-outreach.ts（≤10/天、一人一封、optout、实时重算排名、List-Unsubscribe、--test/--dry-run）[x] 自测进 Gmail 收件箱 [x] 外联落地页维护者横幅（?ref=outreach → #maintainers，埋点 maintainer_banner_click，10-02 13:10 上线 8dff4bf）[x] 首批 10 封已发（10-02 21:59–22:04，送达 10/10，退信 0，sent.json）[ ] 10-03 09:30 后统计回复率（hello@ 回信；退订加 optout.json），之后按 maintainer_banner_click / checkout_click 和 ref=outreach 看转化 [ ] 徽章嵌入数追踪
- 依赖: -
- 验收: 模板经用户同意；每天 ≤10 封限速发送；徽章嵌入数（GitHub 代码搜索 agentoolrank.com/api/badge）可追踪
- 闸: human（对外发送）
- 失败: 0
- **外联放量计划（W41 押注①，10-03）**：每天 10 → 15 封（10-08 起）→ 20 封（10-12 起）；放量前提 0 退信 + 0 投诉，任一出现即退回上一档。首批 10 封带来 4 次访问（约 40%）、0 退信。预期一周 100 封 → 约 35 次访问、≥5 个工具提交、≥1 单付费，截止 10-11。send-outreach 限速上限需同步调整
- 10-01 14:26 老板 #22：外联由我自定自发（≤10 封/天、不跟进、可退订、署名 Ethan Tan、只用公开邮箱）；仅等 Brevo 手机验证（SIM 10-02）
- 10-02 #24：邮件模板发之前要走 bin/write outreach-email（content-writing skill），自审后发
- 进展 10-01：模板 + 候选名单（41 位公开邮箱）就绪，已经 agentkit 请老板批；发信依赖 Brevo 手机验证（实体 SIM 10-02）

### T18 回访环：每周增长榜 /weekly 用真实 30 天增速重做 + 每周 X 帖草稿自动生成
- 状态: todo
- 依赖: -
- 验收: /weekly 显示本周星数增长前 20（来自 metric_snapshots）；scripts 生成 X 帖草稿并发 Telegram
- 闸: auto（发帖本身仍需用户确认或事先授权）
- 失败: 0

### T19 10-02 X 帖：/report 数据发现（每天 ≤1 条，已用完 10-01 的额度）
- 状态: done（2026-10-02 09:45 老板主号 @hwak8666621 发出：https://x.com/hwak8666621/status/2105834735146541311；Premium 单条 420 weighted 未拆 thread；SOCIAL_CALENDAR 已登记，看板已记，已回报 agentkit）
- [ ] 10-09 复盘 ref=x：漏斗查 ref=x 访问与后续转化
- 定稿 docs/ops/launch-kit/drafts/x-t19.md；brief docs/ops/launch-kit/briefs/x-t19-report.md；ph-and-x.md 旧稿作废
- 依赖: -
- 内容要点：669 个开源 agent 工具里 32% 半年无提交（含 68 个 5k+ 星项目），星数≠还在维护；最快增长 Skills / LangChain；链接 agentoolrank.com/report?ref=x，写明作者本人
- 验收: x-post 发布成功，看板记链接；events 表出现 src=x 的访问
- 闸: auto（老板 10-01 授权大号发帖规则：每天 ≤1 条、真实有用、写明作者本人）
- 失败: 0

### 社交账号排期（agentkit 统一登记，SOCIAL_CALENDAR.md）
- 老板 HN/Reddit/PH/X 都是多项目共用；发前经总线向 agentkit 登记（X 每日常设帖除外）
- ai-directory：Show HN 最早 10-07（需老板先批草稿）；PH 最早 10-10；Reddit 每天 ≤1 条带链接帖、同 subreddit 隔 14 天
- 发完把链接回 agentkit

### T20 每周邮件简报（代码已就绪 10-01）
- 状态: 阻塞已解除（10-02 Brevo key 就绪 + 域名认证完成）；订阅者目前 0，10-05 周一 weekly-ops 首次真发
- scripts/weekly-newsletter.ts（无 key 只出预览）+ /unsubscribe（subscriber_tokens 新表）；weekly-ops.sh 周一自动发
- 闸: auto（发给主动订阅者的交易性质邮件）

### T21 LLM 迁到本机 Sub2API key（老板决定 #9，BOSS_DECISIONS.md）
- 状态: done（2026-10-01，批处理脚本已迁；线上 /api/chat 仍用 OpenRouter，改线上 env 属凭证闸，暂不动）
- 范围: scripts/judge.ts、generate-alternatives、generate-display-names、tag-mcp 等批处理用 OpenRouter → Sub2API；线上 /api/chat 的 LLM 评估迁到本机批处理或保留
- 闸: auto（凭据已在 ~/.config/secrets/sub2api-openai-key；改线上 env 属改凭证闸）

### T22 GEO：引用源挖掘 + 答案块格式（agentkit 10-01 补充 seo-geo）
- 状态: todo
- ① 定期问 ChatGPT/Perplexity/Claude「best open-source AI agent framework / MCP servers / X alternatives」，记录被引用的第三方页面域名 Top N，作为外联/收录/写更具体同主题页的目标
- ② 关键页前 50 字给结论、H2 分段、每段 ≤3 句带具体数字；Rich Results Test 验证 FAQ/ItemList/Dataset
- 禁止：用 AI 冒充真实用户在 Reddit/Quora 埋品牌词（BOSS_DECISIONS #16）
- 闸: auto

### T24 多语言（BOSS_DECISIONS #23）：中文 → 日语 → 西语（看数据）
- 状态: in_progress（**中文、日语工具页各 200/200 已上线 10-02 10:50**（84b4918 / 7cbcdd7）；剩余页型：替代品页、对比页、/where-to-list、/submit 本地化；日语开工 0fd2ce1；中文工具页 200/200 已上线 2026-10-02：d9b44c7 / d8b8f09 / 9bc019e / f50bd74 / 2f68e4e / d86b75e / a66f08e / e33c5e1 / 6da708d）
- 依据: GSC 90 天 1,934 次展示，美 24%、印 11%；中国 3%，但点击最多（3 次，排名 8）；港/台/日/韩有点击。现有 /zh 首页、search、blueprint 三对 hreflang
- [x] 中文工具页第一批上线（10-02）：/zh/tool/[slug] 11 篇（人工全文读 12，dbx 因英文源 tagline 截断 "Built-" 退回）；hreflang 双向 + sitemap；只发布 approved 且 human_reviewed>=1
- [x] 翻译流水线：scripts/translate-tools.ts（gpt-6-astra 译、noFallback；OpenRouter DeepSeek 回译 + 情态逐句审校；列表长度/数字/残留英文确定性检查；Turso tool_i18n）+ scripts/review-translations.ts（--list/--sample/--mark/--reject）
- [x] 中文工具页 177/200 上线（10-02）：human_reviewed=1 共 49（前 50 逐篇读）+ =2 共 128（随机抽 14 个约 10% 全合格整批标记）；上线前退回 dbx、editor（源数据问题），修源后重译，dbx 已过审
- [x] 英文源数据修复（截断 tagline、审核备注）：114 个截断 tagline 由 LLM 依据 description/README 重写（isTruncatedTagline / submissionTagline，expand-tools 不再用截断 GitHub 描述覆盖；回滚 data/tagline-backup-*.json）；13 个 intelligence 审核过程备注清除（isMetaNote / stripMetaNotes，parseReview 自动过滤；回滚 data/intelligence-backup-*.json）；translate-tools --retry-failed，源 hash 变自动重译并 human_reviewed 归 0
- [x] 源数据元话术第二轮清理（12 个，10-02，a66f08e）：扫 DB 全文本字段，META 正则扩展 + stripMetaSentences；clean-meta-notes 覆盖 description/pros/cons/use_cases/intelligence；回滚 data/meta-notes-backup-*.json
- [x] 重跑 translate-tools 刷新受元话术清理影响的译文 → 重审后再上线（10-02）
- [x] review_failed 重试补满 200（10-02）
- [x] **中文工具页 200/200**（10-02，e33c5e1 / 6da708d）：第三轮重译 24 → 11 过审全文读后发布；两轮不过 13 条逐条读审校意见，12 条误报用 review-translations --override 放行；omniroute 同名项目串号 → scripts/rejudge-tools.ts 按项目自身网站/README 重生成（回滚 data/rejudge-backup-*.json），重译人读后发布
- [ ] numbersPreserved 忽略字母数字混合 token（E2E、A2A 等），减少审校数字误报
- [ ] 确认 sitemap 刷新出全部 200 个 zh 工具页 + IndexNow 推送（21:30 daily-ops）
- [ ] 中文其余页型：替代品页、对比页（GSC 有展示的）、/where-to-list、/submit 价格页
- [x] **本地化索引页 + 站内入口**（10-02，3fd4130）：/zh/tools、/ja 索引页（translatedToolList 按 score，各 200 条）；面包屑首页指本语言索引；全站页脚「中文 / 日本語」；sitemap 收录
- [x] **第二门语言抽象（共享组件+字典）**（10-02，0fd2ce1）：src/lib/tool-i18n.ts（COPY zh/ja + wan + localToolTitle/localStatus/localToolFaq）+ src/components/LocalizedToolPage.tsx + 薄路由 /zh|/ja/tool/[slug]；hreflang 由 translatedLangs 全互指；sitemap 按语言列表派生；143 测试全绿，/zh/tool/dify 输出不变。原计划条目：i18n 字典 + 语言页登记表 + /[lang]/ 薄路由；hreflang 全互指（含自引用 + x-default）；sitemap 从登记表派生；付款回跳同语言页（白名单）
- [ ] 译文：模板/界面文案逐条人工核；标语/简介用 LLM + 术语表，前 50 页逐页核，其余抽查 10% 并跑脚本检查（术语、长度、残留英文）；专有名词/数字/日期不译；按 owner-goal #23 加第二模型回译比对（回译与英文原文语义偏差大的条目进人工复核）；审校 prompt 单列「情态方向核对」：逐句列原文/译文的 must / must not / need not / may / should 对照（中文：必须/不得/不必/可以/应当；日语：なければならない/てはいけない/なくてもよい/てもよい/べき），方向不一致即退回（agentkit 10-02，imagehub 意大利语 non devono 事故）
- [x] **中文读者付款能力已核实（待老板开 Alipay/WeChat）**（10-02）：TENSO LLC 美国账户 card_payments/link active（银联卡走卡通道）；alipay/wechat_pay 在 Default payment_method_configuration 为 off；checkout 用动态支付方式 → 后台开启即可，无需改代码；已报 agentkit 09:30 汇总、看板已记。原要求：核实 Stripe（TENSO LLC 美国账户）能否为大陆用户开通支付宝/微信支付/银联卡，结论写进看板单独跟踪（agentkit 10-02 要求）
- [ ] **Alipay/WeChat Pay：每日自动检查已上线，available 后做 $9 会话目测**（BOSS #29，10-02）：agentkit 已在 Stripe 后台点启用（acct_1TMYNwH5wuG7WMCf，TENSO LLC，live），状态待审核（数日）；apps/agent-tools/scripts/stripe-pm-status.ts 已挂 daily-ops.sh（21:30），只看 is_default 且 application=null 的自有配置（pmc_1TMYOSH5wuG7WMCfzIzwrkcQ），10-02 结果 alipay=on/pending wechat_pay=on/pending。待办：两项 available=true 后建一个 $9 结账会话，只打开不付款，确认 Alipay 和 WeChat 选项都显示，再回 agentkit（见 GOTCHAS#stripe-pmc-connect-child）
- [x] 抽象剩余项（本次未涉及，待核）：付款回跳同语言页（白名单）；确认 hreflang 含 x-default（核实：localizedAlternates 已带 x-default，单测覆盖）；回跳：zh/ja 页面的 CTA 指向英文 /submit，结账不经过本地化页面，所以目前没有回跳问题，以后做本地化 /submit 时再加白名单
- [x] **日语 198/200 上线**（10-02 09:20，原定 10-09 提前约一周）：首轮 approved 168 / failed 32，--retry-failed 再过 15；前 50 逐篇读 level 1，其余 133 抽 14 读 level 2 整批；17 失败中 --override 放行 15（promptfoo 源文确为 "now backed by OpenAI"），退回 2；/ja/tool/langchain、/ja/tool/dify 200，hreflang en/ja/zh/x-default 全互指
- [x] residualEnglish 加单个常见英文词检测（10-02，84b4918）：src/lib/i18n.ts LEFTOVER_WORDS（the/and/for/with/one…ten/than…）；扫已发布 398 条命中 11，全是正当专有名词（React Three Fiber、Chrome for Testing、Human-in-the-loop）→ 只作人工复核门槛，不硬拦截
- [x] siyuan：清理英文源 tagline 里混入的中文副本后重译 → 人读 → 发布（10-02）。englishOnlyTagline（review.ts，TDD；submissionTagline 先过它）+ scripts/clean-bilingual-taglines.ts 清 7 个（chatgpt-shortcut、openai-translator、mirofish、siyuan、xiaozhi-esp32、maxkb、edict；回滚 data/bilingual-tagline-backup-*.json）；siyuan zh/ja 重译重审
- [x] ekko-studio 重译 → 人读 → 发布（10-02，ja，--override）；promptfoo（ja）被 --retry-failed 误下架后重译重审
- [x] review-translations --override 时补回当前 source_hash（reject 会清空 source_hash，override 后再跑 --retry-failed 会当作源已变重译并 human_reviewed 归 0 → 下架；见 GOTCHAS#override-after-reject-source-hash）（10-02 11:05 已修：--override 写回当前 hash；source/hash 抽到 lib/i18n，148 测试绿；库内 source_hash 为空的行 0 条）
- [ ] 西语 10-30 看 GSC（墨西哥/阿根廷）后再定
- 闸: auto（不整站机翻；不新增事实）
- 失败: 0

### T23 对比内容：上架渠道对比 + X vs Y / alternatives 长文
- 状态: in_progress（/where-to-list 191406f；对比页 Short answer de79e4c..d3ed359；替代品页 Short answer c46db50/4e3f35c，2026-10-01）
- [x] /where-to-list AI agent 工具上架渠道对比（免费 vs 付费，事实逐条核对注明日期，自家短板 + FAQPage，sitemap + /submit 入口，IndexNow 已推）
- [x] 对比页 Short answer（answer-first，数据驱动；verdict.ts compareVerdict，commits de79e4c/73f89f8/d3ed359，2026-10-01）
- [x] 替代品页 Short answer（verdict.ts alternativesVerdict：最接近/最活跃/增长最快/停更≤4+N more；星增速 signed() 修 "+-0"；commits c46db50/4e3f35c/8def881，117 测试，线上 3 页核验，2026-10-01）
- [x] 线上内部字样自查（agentkit 要求）：106 页 HTML+内嵌 JSON 无泄露，仅误报；/favicon.ico 404 → rewrites 到 /icon（e698675），已回复 agentkit
- [x] 对比页 meta description 数据驱动（verdict.ts compareDescription：星数 + 首条数据结论 + 可选尾句，≤160 字符；GSC 对比页排名 3–7 但 175 曝光仅 3 点击；8dcf578，线上 4 页 119–154 字符，2026-10-02）
- [ ] 2026-10-16 复看 GSC 对比页 + 替代品页 CTR（替代品页 10-02 晚改 meta，需记基线）（基线：28 天 175 曝光 / 3 点击，排名 3–7）
- [x] 替代品页 meta description 同法数据驱动（alternativesDescription，10-02 晚已部署）
- [ ] 根据 GSC 有曝光的查询扩写对比/替代品内容（GSC 28 天 /compare 175/397 曝光；先做 goose-vs-open-webui、claude-code-vs-openhands 等有曝光的对）
- [ ] 站外文章：草稿 docs/ops/launch-kit/devto-where-to-list.md 已写好（canonical→/where-to-list），定于 2026-10-03 用 dev.to 品牌号发布，与 10-01 长文错开
- [x] /where-to-list 实测表上线（2026-10-03）：h2「101 directories we actually submitted to」+ 汇总数字（nofollow 注明样本偏差）+ TestedDirectoryTable 4 个筛选开关；线上核对 101 行、gotchas 未泄露
- [ ] 数据文章「实测 101 个目录站」10-07 用 dev.to 品牌号发（brief docs/ops/launch-kit/briefs/devto-101-directories.md → drafts/devto-101-directories.md，bin/write longform + 手改 2 处，ai-flavor clean，CTA → /where-to-list；与 10-03 devto-where-to-list 错开）
- [ ] 更多 X vs Y / alternatives 对比内容（按 GSC 有曝光查询选题）
- [ ] directories.ts CHECKED 过期后重新核对竞品价格/政策
- 闸: auto（不得冒充第三方；竞品事实必须有来源与核对日期）
- 失败: 0

### T25 目录站加量（共享 skill：$AGENTKIT_ROOT/skills/directory-submission）
- 状态: in_progress（2026-10-02 起）— **10-03 达标 20 后暂停扩张（agentkit 10-03 05:28），只做日常补漏；原「每天 ≥20」口径暂停**（agentkit 10-02 23:40 转达老板，取代原 5–8 个/天）
- **10-03 进度：已达标 20/20**（04:40–05:28 两批，dirsub 已逐条回写）
  - 提交 15：[x] saashub [x] viesearch [x] servicelist [x] best-ai [x] linkcentre [x] launchboosts（已上线，实测 rel=nofollow）[x] aitoolsrecap [x] comparateur-ia [x] askmatchbox（邮件）[x] imyshare（邮件）[x] alternative.me [x] webcatalog [x] foundr [x] conduid（已上线 https://conduid.com/servers/agentoolrank ，信任分 54，被误归 Files 类）[x] cursor.directory（插件安全扫描中，扫完才公开）
  - retry 2：whatlaunched（站方 Supabase 发信故障）、store.app（/list 502）
  - skip 3：51tool（强制 ICP 备案）、ai-kit.cn（只能加微信）、10words（排队 2602 天）
  - 邮件投稿：文案 bin/write，Brevo 从 hello@ 发，tag directory-submit，草稿 docs/ops/launch-kit/drafts/submit-email-*.md
  - 新账号凭据 ~/.config/secrets/accounts/agentoolrank-*.json（600）
  - **候选 101 已全部处理**，仅剩 3 个等 #36（libhunt、openalternative、sourceforge）；默认条件（DR≥30、导航目录、表单/邮件）下无新候选
  - **暂停扩张（agentkit 05:28 更正，取代「明天放宽候选」）**：不放宽到客座投稿或 DR 20–30，只做日常补漏（等 #36、重试 whatlaunched/store.app、复查已上线站点链接）。理由：imagehub 提交 30 站 14 天仅 1 访客，外链对 SEO 作用未验证，等 GSC 2–4 周数据再定是否扩张；省下的时间投外联回复、提交通道付费转化、中日文页面流量
  - [ ] 10-09 前复查已上线站点的链接（launchboosts、conduid、cursor.directory 等是否在、rel 是什么）
  - [ ] whatlaunched / store.app 重试
  - MCP 目录站 GitHub OAuth 规则（agentkit 05:23，已入 owner-goal「老板不用管」）：专用 Chrome 里 agent-gigmole 的 GitHub，只许身份+邮箱权限；不绑仓库、不 fork、不建仓；授权页出现仓库读写**或任何 org 权限（read:org 及以上）**即取消跳过（05:28 更正：conduid 这次授权了 read:org，会暴露 agent-gigmole 组织成员关系，算例外，以后不再这样；cursor.directory 仅邮箱只读）
  - [ ] 素材包数字和署名更新：docs/ops/launch-kit 的 directory-listing 素材仍写 669 工具 / Ethan Tan → 593 工具 / Jason T.（提交时文案实时取数）
  - [ ] llms.txt 类目计数过期待查（Agent Frameworks 仍 329，审计前旧值，疑似缓存）
  - 等老板：**#35** /privacy、/terms 上线（草稿 docs/legal/privacy-draft.md、terms-draft.md 已提交）；**#36** 仓库许可证（agentkit 拟建议代码 MIT、数据/文案保留版权）
- 10-02 晚桌面分诊（23:43 agentkit 抽查后修正）：候选 101 = skip 77 + captcha 3（alternativeto、promoteproject、startups.gallery）+ **待 10-03 浏览器/邮件提交 21 个**：
  - [x] saashub [x] viesearch [x] linkcentre [~] whatlaunched(retry) [~] store.app(retry) [x] askmatchbox [x] best-ai [x] comparateur-ia [x] servicelist [x] launchboosts [x] aitoolsrecap
  - 开源类：[ ] libhunt [ ] openalternative [ ] sourceforge — **等许可证决定（BOSS #36）**：仓库公开但无 LICENSE，法律上不算开源（10-03 更正）
  - 中文站用 /zh 页：[x] imyshare（邮件 niceso@163.com 投稿）[-] 51tool(skip ICP) [-] ai-kit.cn(skip 微信)
  - 最后做 nofollow 4 个：[x] alternative.me [x] webcatalog [x] foundr [-] 10words(skip 排队 2602 天)
  - 规则：他项目 skip 只沿用全局原因（只收费/关站/表单坏/链接农场/只收徽章/刷票门槛/人机验证/要交凭证），「不相关」按本项目重判；每批 skip 后复跑 candidates 对账
- 台账: ~/data/backlinks/directory-log.csv，只用 dirsub.py check/add 读写（scripts/dirlog.sh 已废弃）
- 进度: 累计 submitted 25 / badge 1 / retry 2 / skip 7 / todo 5（10-02 07:40，全程无验证码）
  - 10-02 第四批新提交 5：agentlocker.ai（审核 1 月+，徽章可缩 24h，没挂）、linkstartai.com、agenstry.com（MCP endpoint 握手即时收录）、magicnetworld.com（仅 mailto → Brevo 推荐邮件）、thedailyworkflow.com；skip：opentools.ai（仅付费）、xpay.sh（不相关）；todo：conduid.com（需登录）
  - 10-02 第三批新提交 4：glama.ai（官方 Registry 自动同步）、mcpmarket.com（GitHub repo Free Queue $0，4–6 周）、mcprepository.com、ai123.com（中文 DR51）；skip 3：catalog.thesys.dev、context-awesome.com、mcpmarkets.com
  - aiagentsdirectory 结论：免费档挂徽章仍是 nofollow 且须验证后上线，dofollow 仅付费 $49/$99/$499 → 不挂不付（agentkit 同意），保持 badge，不进周汇总
  - 10-02 第二批新提交 4：iui.su（腾讯问卷）、aisharenet.com（WP 投稿 post_id=35370）、productwatch.io（11-01 上线，DR72 dofollow）、betterlaunch.co（Clerk，11-02 上线，nofollow）
  - badge：aiagentsdirectory.com（DR74，免费档须挂徽章 → 周决策，建议挂；验证邮件未点）
  - 10-02 新提交 7：futuretools、websitelaunches（之前已被自动收录）、visalytica、ainewshub（回执未截到）、aitoolscapital、outils.ai（法语 Tally）、startupstash（Typeform）
  - retry：purshology、ai-tab.cn（本机访问超时）
  - [x] smithery.ai done（10-02 17:00，决定 #26）：GitHub App 登录 agent-gigmole，URL 发布远程 MCP，namespace admin-avz6，5 tools → https://smithery.ai/servers/admin-avz6/agentoolrank ，dirsub submitted
  - todo：mcp.so（issue 路线卡 gh 权限，老板待办 #26，agentkit 建议不做）、producthunt（10/10 后老板本人号）、cursor.directory（需 GitHub/Google 登录 → 10-02 已标 skip）
  - 选站：按 mcp / agent / 智能体 关键词筛 columbus 原表
- 目标: 10-03 24:00 前累计 25（agentkit 已裁定：5–8/天是单站/单账号防风控节奏，非总数上限；10-02 白天、10-03 各一批；连续两个验证码即停）
- 文案: brief docs/ops/launch-kit/briefs/directory-listing.md → drafts/directory-listing.md（en）/ directory-listing-fr.md（fr）；中文单独 brief directory-listing-zh.md → drafts/directory-listing-zh.md；bin/write landing-copy
- [x] 历史提交补录台账 [x] 换用 dirsub.py [x] 浏览器工具补齐（task_tab/frames/tabs/fields/find/screenshot/options，task_act js/key，5ffca5e）
- [x] 第二批（累计 16）[x] 中文上架文案 [x] 第三批（累计 20）[x] 累计 25（10-02 07:40 达成，提前）[ ] 之后每天 5–8 个[x] aiagentsdirectory 徽章决策（不挂不付） [ ] purshology / ai-tab.cn 重试 [ ] ainewshub 补回执 [ ] 每周查收录/反链
- 10-03 邮箱注册站（hello@agentoolrank.com，排进当天 5–8 个；遇人机验证/风控即停改标 skip）:
  - [x] best-ai.org（Firebase 邮件魔法链接）
  - [ ] launchboosts.com（邮箱+密码）
  - [x] linkcentre.com（邮箱+密码；入口 /addurl/）
  - [ ] whatlaunched.today（邮箱注册；new_ladar 遇站方 500，为 retry）
- 已 skip（10-02，品牌 Google 号放弃，只支持 Google/GitHub 登录）: cursor.directory、ramen.tools、crunchbase.com、makerlist.io；conduid.com 待查登录方式；producthunt 10/10 后老板本人号
- 规矩: 每站做完立刻关标签页；同一平台被风控一次即停（老板 #25）；表单坑见 GOTCHAS#directory-form-pitfalls
- 相关账号: Google 品牌号已放弃（10-02 17:11，+34 号码被 Google 判用过太多次，不再注册）；GitHub 品牌号被风控 → 按 #25 停；目录站账号一律用邮箱 hello@agentoolrank.com
- 闸: auto（用老板已批准的品牌身份；花钱的付费上架逐次问）
- 失败: 0

### T26 directories.ts CHECKED 30 天到期复核
- 状态: todo，截止 10-31
- 内容: /where-to-list 引用的第三方价格（directories.ts）10-01 在现行页面核对、标了 CHECKED 日期；给 CHECKED 加 30 天到期检查（过期测试失败/提醒），10-31 前重新在现行页面核对（不用 Wayback 快照，见 agentkit 共享坑）
- 闸: auto

### T27 目录提交套件（Submit Kit）评估
- 状态: in_progress（2026-10-02 23:45 起，老板产品想法经 agentkit 转达）
- [x] 一页评估初稿 docs/ops/product/directory-submit-kit.md（8eb540a，已推送，摘要已发 agentkit）
- [ ] 10-03 10:00 前收齐 imagehub / new_ladar / domain-invest 建议（各 ≤8 行）
- [ ] **10-03 12:00 前交定稿**：吸收三方建议 + agentkit 建议（先做 1 个 MCP 工具：按产品类型返回 30 站 + 提交要点，免费 10 个、完整版收费；暂不做全自动提交），写明采纳/未采纳及原因
- [ ] 定稿后才开工 MVP（初稿方案：2 天最小可收钱版本 + 预售；14 天内 ≥3 单才继续投入，否则冻结付费层）
- [x] 自有数据集已完成（2026-10-03 02:50）：scripts/build-directory-dataset.ts（a3d192d）→ data/directories-verified.json（101 站，data/ 在 gitignore；只用自家 directory-log detail，不含 columbus 字段）；供 /where-to-list 免费表、「实测目录站」文章、Submit Kit 共用
- [x] 免费层表格已上线（2026-10-03）：scripts/export-tested-directories.ts → src/lib/directories-tested.json（只导出 free/conditions/queue/paidFrom/link(仅实测)/login/captcha/human/verified；gotchas、success_signal 留付费层，内部 outcome/项目名不公开）；/where-to-list 101 行可筛选表
- 约束: columbus 的 DR/访问量不进产品；家底照实说（共享日志 296 域名，实走提交流程约 101）；不冷外联；不挤占 T25 每天 ≥20 个目录处理
- 闸: auto（方向由负责人定，定稿 12:00 前交 agentkit/老板知悉；收费复用现有 Stripe 一次性付款，新增价格不花钱、不改提现，按 #28 属日常运营，不必逐次问）

### T28 每周经营（owner-goal 4c/4d，agentkit 33c24f4）
- 状态: in_progress（2026-10-03 01:45 起，老板 10-03 01:44 要求主动经营，不等点题）
- 要求：每周一交一页「本周经营」= 记分牌（收入、付费单数、利润、漏斗，对比上周和目标）+ 竞品扫描（对标站 + ≥3 个同类站）+ 新数据源 1 个 + 新渠道 1 个 + 副产品变现 + 下周 3 个押注（带数字和截止日期）+ 上周押注复盘；老板问过一次的问题变成看板固定指标；资源随业绩分配
- [x] 草案 docs/ops/weekly/2026-W41-draft.md（c1dcfc2，已推送）：7 天漏斗 会话 51（约 7/天 < 10/天阈值）、/submit 访问 1、提交 2、付费 0；来源 direct 43 / outreach 4 / devto 2。押注 ①外联放量 10→15→20 封/天（截止 10-11）②数据文章分发 dev.to /where-to-list（10-03）+「实测 100 个目录站」（10-07），≥50 访问 ③Submit Kit 预售 ≥3 单（截止 10-18）
- [ ] **10-05（周一）交第一份**
- [ ] 草案补洞察（10-03 06:30）：付费档卖的是曝光，但流量不足——10-02 晚 10 封外联带来 4 个会话（cognee、langchain、hermes-agent），全是 page_view，0 次维护者横幅点击 / 徽章复制 / checkout；约 8.5 小时无回信。首页每天个位数访客，$49 首页推荐作者不会买。推论：Submit Kit 卖数据和配方，本身有价值、不依赖我们的流量，作为周一摘要要点 + Submit Kit 论据
- [ ] 看板加「本周经营」固定栏 + 三个固定指标，自动出数：目录提交（已提交/已上线/成功率）、对标差距、外联漏斗
- [ ] 周一前补：竞品扫描（对标站 + ≥3 个同类站）、新数据源 1 个、新渠道 1 个
- 约束: 瓶颈在分发；零流量期不再堆功能（已承认这两天犯过一部分）
- 闸: auto

### T29 Jev 第二意见接入（外联类目复核；安全筛语义题待测）
- 状态: todo（2026-10-03 起）
- [x] 评测 scripts/eval-typesafe-scope.ts（42f498c）：147 条人工标注，收录判断最高约 84%（DeepSeek 约 97%，不替换）；12 选 1 类目 88%（65/74）；平均 236ms
- [ ] 外联发前类目复核：Jev choice 与 judge 主类目不一致 → 人工看/挂起
- [ ] 安全筛语义补充：先建小样本测准确率，达标再接
- [ ] 周一（10-05）写进本周经营
- 约束: 只做第二意见，不替代 DeepSeek judge；边界模糊题不用 Jev
- 闸: auto

### T11 重复工具清理（embedchain、gpt-index）
- 状态: blocked
- 依赖: -
- 验收: 两条记录不存在，旧 URL 301 到新页
- 闸: human
- 失败: 0
- 备注: 删数据，等用户批准；另发现 Letta 出现两条、部分名字仍小写（ragflow/voltagent 可能也是重复行），清理前先列清单给用户


## 当前阶段

重启：双边平台转向 + G1-G4（2026-09-30 起，Claude 为总负责人）

## 目标（详见 memory/PROJECT.md 顶部 Goal）

- G1 站内分析 + 提交漏斗全程可测（2026-10-07）
- G2 /submit 上线，20 个外部提交（2026-10-21）
- G3 第一笔陌生人付款（2026-10-31）
- G4 月收入 ≥ $300；Google 月点击 ≥ 1000（2026-12-31）

## 已完成（重启准备）

- [x] PeerPush 对标调研 + 双边平台转向决策
- [x] 新 GSC 快照（7-9 月）
- [x] G1-G4 写进 PROJECT.md
- [x] 运营看板 docs/ops/overview/index.html（:8792 Tailscale 可访问）
- [x] 经消息总线向 imagehub 询资源（结论：密钥不代发，需用户本人发放）

## G1 任务清单（截止 2026-10-07）

- [x] 生产部署恢复（rootDirectory + turbo env + .vercelignore，CLI 本地部署，2026-10-01）
- [x] Vercel 商用资格核实：已是 Pro（2026-10-01）
- [x] daily-update 失败根因：bun.lock 不同步（已重生成，待 push）
- [x] GitHub 凭据 → push 本地 commit + 重新启用 daily-update（2026-10-01，run 36751990678 success，Turso 463/464 刷新）
- [ ] daily-update 有 1 个仓库刷新失败待查（463/464）
- [x] 填充 tools.alternatives（460/464，2026-10-01）
- [ ] related_tools 填充 + 细化类目
- [x] /llms.txt + vitest 测试基建（2026-10-01）
- [x] 展示名修正（276 条，README 证据 + LLM）（2026-10-01）
- [ ] 每日管道接入 alternatives + 展示名脚本（新工具入库仍是仓库名）
- [ ] 重复工具清理（embedchain≡mem0、gpt-index≡llama-index，删数据待用户批准）

- [x] /api/e 自建分析端点（T1，2026-10-01）
- [x] 前端埋点：访问 → 提交页 → 提交（T2，2026-10-01；付款步待 Stripe）
- [x] 漏斗报表 scripts/funnel-report.ts（T3）
- [x] **G1「漏斗可测」已达成**（2026-10-01）
- [ ] 看板接入漏斗数据
- [~] 把 AgentoolRank 免费提交到 PeerPush / Peerlist 等目录
  - [x] PeerPush 提交 → 免费队列 #4190（2026-10-01）
  - [ ] PeerPush 改用户名（@hello2502 → agentoolrank，入口未找到）
  - [ ] 评估 PeerPush 点评积分换排位（注意 seo-geo：互评刷票类不做）
  - [x] Peerlist：Ethan Tan 个人主页 + AgentoolRank 项目（2026-10-01）
  - [x] X：已登录用户个人号 Zephyr @hwak8666621（不改资料）
  - [ ] X 首帖：草稿已发 Telegram，等用户确认后再发
  - [ ] Product Hunt：用户个人号 @ethan_tan11（Google 登录 tensam.th），10/10 后再用（pixtidy 10/03 发布占用）
  - [x] launch kit docs/ops/launch-kit/（logo、4 截图、kit.md）+ scripts/winbrowser（2026-10-01）
- [x] /alternatives 页 tagline 以工具名开头时省略名字（2026-10-01）
- [x] 全站品牌名统一 AgentoolRank（2026-10-01）

## G2 任务清单（截止 2026-10-21）

- [x] /submit 页面 + /api/submit + submissions 表（2026-10-01 上线）
- [x] 审核脚本 review-submissions（T6；10-02 11:50 首次审外部提交 Orkas → /tool/orkas）
- [~] **外部提交进度 1/20**（10-02：Orkas，src=api 免费档；付费 0）
- [ ] 免费队列 + 点评/积分换排位机制
- [ ] 付费档位设计：$19 快速上线 / $49 首页推荐 7 天（Stripe 待用户 key）
- [~] 徽章 HTML 已在提交成功页给出（挂徽章优先审）；上榜作者邮件未做
- [ ] 日/周榜页
- [x] /alternatives/[slug] 页（460 条 sitemap）
- [ ] 对比页扩充
- [x] MCP 服务器 / API（让 AI 可查询）（T15；10-02 首个真实 API 提交 Orkas 验证通道有效）
- [ ] 外联：向工具作者发邀请提交
- [x] newsiteradar.com 接入 Brevo：**完成（10-02 22:07）**——DNS 由 new_ladar 加好，PUT .../newsiteradar.com/authenticate 返回 authenticated=true、verified=true；scripts/brevo-tag-health.ts 按 tag 每日监控已挂 daily-ops.sh 21:30（5dfc46d）。发件域 id 6abfb9f2daf63ed95f090051；key "newsiteradar-outreach" 在 ~/.config/secrets/brevo-api-key-newsiteradar。规则：tag=newsiteradar 出 ALERT → Brevo 后台停用该 key + 通知 new_ladar。new_ladar 自建发件人 jason@newsiteradar.com，护栏：每人一封、带退订、每周 ≤10 封、先 --test
- [x] Brevo SMTP 供老板 Gmail 代发（10-03 02:20 agentkit 转达）：新建 SMTP key "gmail-send-as"（~/.config/secrets/brevo-smtp-key，600，仅登录测试未发信）；smtp-relay.brevo.com:587 STARTTLS，登录名 bbef73001@smtp-brevo.com；发件人 hello@agentoolrank.com(id1)、jason@newsiteradar.com(id2)、hello@newsiteradar.com(id3，API 新加，已 active)；已回 agentkit 并提醒共用 300 封/天额度与信誉、无 tag
- [ ] brevo-tag-health 加一行账户总量（不分 tag），覆盖 Gmail 代发等不带 tag 的发信
- [x] pixtidy.com 接入 Brevo（imagehub 10-03 06:30 请求，agentkit：一个公司一个账户）：POST /v3/senders/domains 已添加；DNS 记录已发 imagehub（DKIM CNAME×2、brevo-code TXT、SPF 原记录加 include:spf.brevo.com、新增 _dmarc）；专用 key「pixtidy-outreach」存 ~/.config/secrets/brevo-pixtidy-key（600，测试 200）；已给外联脚本路径、--test 用法和护栏；brevo-tag-health 加 pixtidy、directory-submit 两个 tag（18f1406）
- [x] **pixtidy DNS 后认证（10-03 06:35 完成）**：imagehub 06:33 加好 5 条 DNS，PUT /v3/senders/domains/pixtidy.com/authenticate 返回 authenticated=true、verified=true；已通知 imagehub 建发件人 launch@pixtidy.com
- 注意：一个 Brevo 账户现跑 agentoolrank、newsiteradar、pixtidy 三个品牌 + 老板 Gmail 代发，共用 300 封/天额度和账户信誉

- [x] 类目审计 dry-run 完成（10-02 23:xx–10-03 00:xx，scripts/audit-categories.ts 只读 → data/category-audit-2026-10-02.csv，670 条，$0）：在范围内 575（类目不变 364 / 变化 211）、被拒 95
- [x] 抽查 30 条（每类随机 10）：不变 10/10 对；变化 10 条新类目都更准；被拒 9/10 对，误判 react-agent（对口，官网坏了）→ 以「官网打不开/404」为理由的拒绝不能直接下架
  - 被拒 95 拆三组：①真正超出范围 75（课程论文、通用模型 qwen3/flux/grok-1、微调库 peft/llama-factory、终端应用 jan/chatbox/siyuan 等）②官网或证据有问题 13：agent、colossalai、pezzo、langchaingo、taskingai、autonomous-hr-chatbot、gpteam、llm-chain、ai-getting-started、prompt2ui、react-agent、developer、audiogpt（不下架，修 URL 后重判）③已停更或弃用 7：llama-agents、roo-code、vision-agent、hands-on-llms、langchain-serve、turbopilot、llama3
- [x] 应用方案（10-03 已上线，agentkit 23:54 同意并补 3 点要求）：
  - [x] tools 表新增 category_tags_old 列（回滚：UPDATE tools SET category_tags = category_tags_old WHERE category_tags_old IS NOT NULL）
  - [x] 320 个工具改为 judge 主类目（scripts/apply-category-audit.ts；应用前检查任一类目被清空即中止，防类目页 404）
  - [x] 软下架 74 个（delist-tool.ts；delisted-ids.ts 共 75 个 id，含 career-ops）；③组用 GitHub API archived 核对：roo-code（2026-05-15 已归档）、hands-on-llms、langchain-serve、turbopilot、llama3 下架
  - [x] GSC 近 90 天有展示的保留：pydantic 24、buzz 33、chatgpt-next-web 20、mergekit 6（data/category-audit-gsc-hits.json）
  - [x] 收录规则写到 /submit#what-we-list
  - [x] 类目 slug 不改不删；线上核对 qwen3/jan/roo-code 410，pydantic/llama-agents/langchain/各类目页/submit 200，sitemap 无下架工具；204 测试 + build 通过，已部署推送
  - [x] 外联挂起解除：hold.json、category.json 改名 *-2026-10-02.json.bak；下一批 dry-run 类目与审计一致，career-ops 自动跳过
- [ ] 类目审计遗留：
  - [x] 修 URL 15 个（原②组 13 个 + autogpt-js、langstream——官网被劫持成博彩站，工具本身对口）修完后重判
    - 10-03 完成：官网 404/打不开/被劫持成博彩站（autogpt-js、langstream、gpteam）/只是社交主页（developer）/HF Space 报错（audiogpt）的，website_url 改为 github_url（旧值备份 data/fixurl-backup-2026-10-03.json）；rejudge-tools --category 重判 12 个在范围内并改类目；colossalai、ai-getting-started、prompt2ui 链接正常但超范围 → 软下架，下架共 78（含 career-ops）
  - [x] llama-agents（未归档，9-25 仍有推送）、vision-agent（未归档）复核
    - 10-03 结论：judge 两次判弃用，但 README 当前版本无 deprecat 字样、未归档（llama-agents 现为活跃的 LlamaIndex 文档类 agent 框架）→ judge 误判，两个都保留（人工覆盖）
  - [ ] GSC 有展示而保留的 4 个（pydantic、buzz、chatgpt-next-web、mergekit）另议
- [ ] 官网健康定期扫描（状态码 + 博彩关键词）：全库 website_url 定期查状态码与页面内容（博彩/赌博关键词、跳转到无关域名），命中的改用 github_url 或转复核；10-03 已发现 3 个被劫持（autogpt-js、langstream、gpteam）
- [x] **全库类目审计**（10-03 应用上线；10-02 外联复核发现类目普遍偏，agent-frameworks 329 个成了杂物类）：rejudge-tools.ts --category 分批跑（先 --dry-run，保留回滚文件，含 category_tags），LLM 重判不手改数据；审完再逐个解除 data/outreach/hold.json 的挂起
  - agentkit 要求（10-02 20:20，10-03 开始）：① 先 dry-run，输出新旧类目对照 ② 抽 30 条人工看 ③ 旧值留一列，便于回滚 ④ 类目页 URL 不能 404：类目 slug 不改名、不删除，只调整工具归属；如要合并或删除类目，做 301
  - 待判清单：ai-job-search（也是求职工具，替代品里引用 career-ops；线上渲染时 getToolBySlug 返回 null 已过滤，无 404 链接）——审计时与 career-ops 同口径判是否软下架
- [x] career-ops 软下架（LLM 判为求职助手、不在收录范围）：agentkit 20:20 口径——"删数据"仅指不可恢复删除，软下架（归档表、可恢复）属日常整理，自己定、记一笔。delist-tool.ts → tools_archive（含 metric_snapshots），4 个入口拦重新收录，sitemap 过滤；线上 404 已验证（10-02）
- [x] 已下架页面 410 / 301（原计划 10-03，10-02 晚提前完成，005953b）：src/proxy.ts（原 middleware.ts 迁移）对 /tool、/alternatives、/compare、/zh/tool、/ja/tool 命中已下架 slug 返回 410 + X-Robots-Tag: noindex；名单 src/lib/delisted-ids.ts 由 delist-tool.ts 归档/恢复后自动重生成（需提交+部署）；**不做 301**（career-ops 原类目本身错，跳过去误导）；线上 4 类页 410、其他 200
- [x] 安全过滤：换脸/deepfake/脱衣/成人类工具一律不收录（src/lib/safety.ts unsafeMatch；提交付款前、review-submissions、expand-tools、crawl-github 新工具 4 处接入；38e0c03，10-02）

## 等待用户

- [x] Stripe 受限 key（checkout + ops 均已存并验证，10-01）
- [x] Cloudflare zone token（~/.config/cloudflare/agentoolrank.token，到期 2026-12-29，10-01 验证）
- [x] Vercel Pro（已是 Pro，10-01 核实）
- [x] GitHub 凭据（fine-grained token，~/.config/secrets/github-agentoolrank，2026-10-01）
- [ ] PostHog project（可选）
- [ ] 个人 Reddit / HN 账号是否可用
- [x] X 旧号（2026-10-01）
- [x] Peerlist 真名 Ethan Tan（2026-10-01）
- [ ] X 首帖确认

## 暂停

- AIMarketRank（marketing-tools）全部待办暂停，不买域名，等主站跑通
