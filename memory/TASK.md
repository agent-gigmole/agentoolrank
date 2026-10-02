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

### T17 反链飞轮：给已上榜工具作者发徽章邀请（邮件/Issue 模板先给用户过目）
- 状态: 发送就绪（10-02），第一批定 10-02 22:00 CST（美东 10:00）10 封，先 --dry-run 看名单与实时排名
- 10-02 进展：[x] Brevo 手机验证（实体 SIM 收码线②）[x] API key 入 ~/.config/secrets/brevo-api-key [x] 域名 DKIM/SPF/DMARC 认证 [x] 模板走 bin/write（drafts/outreach-maker-v2.md → src/lib/outreach.ts）[x] scripts/send-outreach.ts（≤10/天、一人一封、optout、实时重算排名、List-Unsubscribe、--test/--dry-run）[x] 自测进 Gmail 收件箱 [ ] 22:00 第一批 [ ] 徽章嵌入数追踪
- 依赖: -
- 验收: 模板经用户同意；每天 ≤10 封限速发送；徽章嵌入数（GitHub 代码搜索 agentoolrank.com/api/badge）可追踪
- 闸: human（对外发送）
- 失败: 0
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
- 状态: in_progress（日语 198/200 上线 10-02；日语开工 0fd2ce1；中文工具页 200/200 已上线 2026-10-02：d9b44c7 / d8b8f09 / 9bc019e / f50bd74 / 2f68e4e / d86b75e / a66f08e / e33c5e1 / 6da708d）
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
- [x] **第二门语言抽象（共享组件+字典）**（10-02，0fd2ce1）：src/lib/tool-i18n.ts（COPY zh/ja + wan + localToolTitle/localStatus/localToolFaq）+ src/components/LocalizedToolPage.tsx + 薄路由 /zh|/ja/tool/[slug]；hreflang 由 translatedLangs 全互指；sitemap 按语言列表派生；143 测试全绿，/zh/tool/dify 输出不变。原计划条目：i18n 字典 + 语言页登记表 + /[lang]/ 薄路由；hreflang 全互指（含自引用 + x-default）；sitemap 从登记表派生；付款回跳同语言页（白名单）
- [ ] 译文：模板/界面文案逐条人工核；标语/简介用 LLM + 术语表，前 50 页逐页核，其余抽查 10% 并跑脚本检查（术语、长度、残留英文）；专有名词/数字/日期不译；按 owner-goal #23 加第二模型回译比对（回译与英文原文语义偏差大的条目进人工复核）；审校 prompt 单列「情态方向核对」：逐句列原文/译文的 must / must not / need not / may / should 对照（中文：必须/不得/不必/可以/应当；日语：なければならない/てはいけない/なくてもよい/てもよい/べき），方向不一致即退回（agentkit 10-02，imagehub 意大利语 non devono 事故）
- [x] **中文读者付款能力已核实（待老板开 Alipay/WeChat）**（10-02）：TENSO LLC 美国账户 card_payments/link active（银联卡走卡通道）；alipay/wechat_pay 在 Default payment_method_configuration 为 off；checkout 用动态支付方式 → 后台开启即可，无需改代码；已报 agentkit 09:30 汇总、看板已记。原要求：核实 Stripe（TENSO LLC 美国账户）能否为大陆用户开通支付宝/微信支付/银联卡，结论写进看板单独跟踪（agentkit 10-02 要求）
- [x] 抽象剩余项（本次未涉及，待核）：付款回跳同语言页（白名单）；确认 hreflang 含 x-default（核实：localizedAlternates 已带 x-default，单测覆盖）；回跳：zh/ja 页面的 CTA 指向英文 /submit，结账不经过本地化页面，所以目前没有回跳问题，以后做本地化 /submit 时再加白名单
- [x] **日语 198/200 上线**（10-02 09:20，原定 10-09 提前约一周）：首轮 approved 168 / failed 32，--retry-failed 再过 15；前 50 逐篇读 level 1，其余 133 抽 14 读 level 2 整批；17 失败中 --override 放行 15（promptfoo 源文确为 "now backed by OpenAI"），退回 2；/ja/tool/langchain、/ja/tool/dify 200，hreflang en/ja/zh/x-default 全互指
- [ ] residualEnglish 加单个常见英文词检测（数字词、冠词等；现只查连续 ≥4 英文词，漏了 ekko-studio 的 "seven"）
- [ ] siyuan：清理英文源 tagline 里混入的中文副本后重译 → 人读 → 发布（顺带扫一遍其他中英混合 tagline）
- [ ] ekko-studio 重译 → 人读 → 发布
- [ ] 西语 10-30 看 GSC（墨西哥/阿根廷）后再定
- 闸: auto（不整站机翻；不新增事实）
- 失败: 0

### T23 对比内容：上架渠道对比 + X vs Y / alternatives 长文
- 状态: in_progress（/where-to-list 191406f；对比页 Short answer de79e4c..d3ed359；替代品页 Short answer c46db50/4e3f35c，2026-10-01）
- [x] /where-to-list AI agent 工具上架渠道对比（免费 vs 付费，事实逐条核对注明日期，自家短板 + FAQPage，sitemap + /submit 入口，IndexNow 已推）
- [x] 对比页 Short answer（answer-first，数据驱动；verdict.ts compareVerdict，commits de79e4c/73f89f8/d3ed359，2026-10-01）
- [x] 替代品页 Short answer（verdict.ts alternativesVerdict：最接近/最活跃/增长最快/停更≤4+N more；星增速 signed() 修 "+-0"；commits c46db50/4e3f35c/8def881，117 测试，线上 3 页核验，2026-10-01）
- [x] 线上内部字样自查（agentkit 要求）：106 页 HTML+内嵌 JSON 无泄露，仅误报；/favicon.ico 404 → rewrites 到 /icon（e698675），已回复 agentkit
- [ ] 根据 GSC 有曝光的查询扩写对比/替代品内容（GSC 28 天 /compare 175/397 曝光；先做 goose-vs-open-webui、claude-code-vs-openhands 等有曝光的对）
- [ ] 站外文章：草稿 docs/ops/launch-kit/devto-where-to-list.md 已写好（canonical→/where-to-list），定于 2026-10-03 用 dev.to 品牌号发布，与 10-01 长文错开
- [ ] 更多 X vs Y / alternatives 对比内容（按 GSC 有曝光查询选题）
- [ ] directories.ts CHECKED 过期后重新核对竞品价格/政策
- 闸: auto（不得冒充第三方；竞品事实必须有来源与核对日期）
- 失败: 0

### T25 目录站加量（共享 skill：$AGENTKIT_ROOT/skills/directory-submission）
- 状态: in_progress（2026-10-02 起）— **目标 25 已达成（10-02 07:40）**，转入每天 5–8 个的常规节奏
- 台账: ~/data/backlinks/directory-log.csv，只用 dirsub.py check/add 读写（scripts/dirlog.sh 已废弃）
- 进度: 累计 submitted 25 / badge 1 / retry 2 / skip 7 / todo 5（10-02 07:40，全程无验证码）
  - 10-02 第四批新提交 5：agentlocker.ai（审核 1 月+，徽章可缩 24h，没挂）、linkstartai.com、agenstry.com（MCP endpoint 握手即时收录）、magicnetworld.com（仅 mailto → Brevo 推荐邮件）、thedailyworkflow.com；skip：opentools.ai（仅付费）、xpay.sh（不相关）；todo：conduid.com（需登录）
  - 10-02 第三批新提交 4：glama.ai（官方 Registry 自动同步）、mcpmarket.com（GitHub repo Free Queue $0，4–6 周）、mcprepository.com、ai123.com（中文 DR51）；skip 3：catalog.thesys.dev、context-awesome.com、mcpmarkets.com
  - aiagentsdirectory 结论：免费档挂徽章仍是 nofollow 且须验证后上线，dofollow 仅付费 $49/$99/$499 → 不挂不付（agentkit 同意），保持 badge，不进周汇总
  - 10-02 第二批新提交 4：iui.su（腾讯问卷）、aisharenet.com（WP 投稿 post_id=35370）、productwatch.io（11-01 上线，DR72 dofollow）、betterlaunch.co（Clerk，11-02 上线，nofollow）
  - badge：aiagentsdirectory.com（DR74，免费档须挂徽章 → 周决策，建议挂；验证邮件未点）
  - 10-02 新提交 7：futuretools、websitelaunches（之前已被自动收录）、visalytica、ainewshub（回执未截到）、aitoolscapital、outils.ai（法语 Tally）、startupstash（Typeform）
  - retry：purshology、ai-tab.cn（本机访问超时）
  - todo：mcp.so（issue 路线卡 gh 权限，老板待办 #26，agentkit 建议不做）、smithery、producthunt（10/10 后老板本人号）、cursor.directory（需 GitHub/Google 登录）
  - 选站：按 mcp / agent / 智能体 关键词筛 columbus 原表
- 目标: 10-03 24:00 前累计 25（agentkit 已裁定：5–8/天是单站/单账号防风控节奏，非总数上限；10-02 白天、10-03 各一批；连续两个验证码即停）
- 文案: brief docs/ops/launch-kit/briefs/directory-listing.md → drafts/directory-listing.md（en）/ directory-listing-fr.md（fr）；中文单独 brief directory-listing-zh.md → drafts/directory-listing-zh.md；bin/write landing-copy
- [x] 历史提交补录台账 [x] 换用 dirsub.py [x] 浏览器工具补齐（task_tab/frames/tabs/fields/find/screenshot/options，task_act js/key，5ffca5e）
- [x] 第二批（累计 16）[x] 中文上架文案 [x] 第三批（累计 20）[x] 累计 25（10-02 07:40 达成，提前）[ ] 之后每天 5–8 个[x] aiagentsdirectory 徽章决策（不挂不付） [ ] purshology / ai-tab.cn 重试 [ ] ainewshub 补回执 [ ] 每周查收录/反链
- 等 Google 号的待办: cursor.directory、conduid.com、smithery 等需 Google/GitHub 登录的站 → 品牌 Google 号建好（老板扫码）后做；producthunt 10/10 后老板本人号
- 规矩: 每站做完立刻关标签页；同一平台被风控一次即停（老板 #25）；表单坑见 GOTCHAS#directory-form-pitfalls
- 相关账号: Google 品牌号 hello@agentoolrank.com（Ethan Tan，老板已批真名）卡扫码，等老板醒后重注册；GitHub 品牌号被风控 → 按 #25 停
- 闸: auto（用老板已批准的品牌身份；花钱的付费上架逐次问）
- 失败: 0

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
- [ ] 审核脚本 review-submissions
- [ ] 免费队列 + 点评/积分换排位机制
- [ ] 付费档位设计：$19 快速上线 / $49 首页推荐 7 天（Stripe 待用户 key）
- [~] 徽章 HTML 已在提交成功页给出（挂徽章优先审）；上榜作者邮件未做
- [ ] 日/周榜页
- [x] /alternatives/[slug] 页（460 条 sitemap）
- [ ] 对比页扩充
- [ ] MCP 服务器 / API（让 AI 可查询）
- [ ] 外联：向工具作者发邀请提交

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
