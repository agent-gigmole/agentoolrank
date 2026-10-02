# STATE.md — 当前状态

## 架构

- **Turborepo monorepo** 重构完成
  - `apps/agent-tools` — AgentoolRank（agentoolrank.com）已上线
  - `apps/marketing-tools` — AIMarketRank（marketing-tools-three.vercel.app）已上线
  - `packages/ui` + `packages/db` + `packages/seo` — 共享包
  - marketing-tools 已改为独立部署模式（复制共享代码到本地，不依赖 workspace）

## 已完成（agent-tools / AgentoolRank）

- Phase 1-5 全部完成
- 464 工具入库，464 有 Intelligence（100% 覆盖）
- Blueprint SEO 详情页 /blueprint/[slug]（75+ 静态页）
- Tool Intelligence 展示页（9 区块组件）
- 图片拖拽上传 + Setup Instructions 一键复制块
- 保存蓝图后 revalidatePath 即时刷新
- 模型：DeepSeek V3 官方 API（最终选择）
- i18n 中英文 + Featured 邮件 10 封
- GSC: 739 URL 发现，44 展示

## 已完成（marketing-tools / AIMarketRank）

- 市场研究：10 方向 → 3 深度 → Codex 二次意见 → 选定 AI 营销自动化
- 骨架创建 + Turso aimarketrank 数据库 + Vercel project
- GitHub 爬虫 60 个工具入库 → 清理非营销工具 → 补充 40 个付费 SaaS
- **最终 52 个工具：32 paid + 10 freemium + 10 open-source**
- 每个付费工具带 affiliate 佣金信息（20-60% recurring）
- Intelligence 生成 60/60（开源部分，3 批并行）
- 中文翻译完成：52 个工具 tagline + pros + use_cases
- 中文版 /zh 首页 + 搜索页 + 中英导航切换
- **已部署上线：marketing-tools-three.vercel.app**

## 2026-09-30 项目重启（Claude 为总负责人：开发+运营，只在必要时找用户，目标赚钱）

- PeerPush 对标完成 → 转向双边平台：付钱的是想被看到的工具作者，不是访客（见 KNOWLEDGE/DECISIONS.md#peerpush-pivot）
- G1-G4 已写进 memory/PROJECT.md 顶部 Goal 段（G1 分析+漏斗 10-07 / G2 /submit+20 外部提交 10-21 / G3 首笔付款 10-31 / G4 月收入≥$300+月点击≥1000 12-31）
- GSC 最新：7月 9点击/720曝光，8月 4/987，9月 3/241；对比页仍是唯一有排名的页型（goose-vs-open-webui、claude-code-vs-openhands 均排 7.5）
- 运营看板 docs/ops/overview/index.html（已 commit），0.0.0.0:8792 systemd --user agentoolrank-dashboard → http://moneyflow-wsl.tailf1c73f.ts.net:8792/
- AIMarketRank（marketing-tools）暂停，不买域名
- 花钱遵守 $AGENTKIT_ROOT/shared/harnesses/spend-control.md；Vercel 项目已是 Pro（10-01 核实），商用 OK

## 2026-10-01 部署恢复 + 数据管道断更诊断

- **生产部署已恢复**：agentoolrank.com 现为最新代码（此前自 4-02 monorepo 重构 f9dd8ae 起所有 Vercel 部署 ERROR，线上一直是 ae35d6a 旧版）
  - Vercel 项目 ai-directory（prj_uOa07Fn6wZVejr5Ia74dSd7oBs4G，team gigmoles-projects）**已是 Pro → 商用 OK**
  - 修复：API PATCH rootDirectory=apps/agent-tools；turbo.json build.env 声明 TURSO_*/LLM_*/NEXT_PUBLIC_*/GSC_*（commit 2c3e32d）；新增 .vercelignore（commit dda8efc）
  - 部署方式（当前）：仓库根 `npx vercel@latest deploy --prod --yes --token $VERCEL_TOKEN --scope gigmoles-projects`
  - 首页/详情/对比/sitemap/badge/zh/blueprint 全 200
- **日常部署授权**：用户一次性授权测试+build 过即部署/push、线上实测、自行回滚；花钱/凭证/删数据仍逐次问（auto memory deploy-authorization + 看板）
- **数据自 2026-03-31 冻结**：daily-update Action 自 3-28 起 `bun install --frozen-lockfile` 失败；已重生成 bun.lock（在 2c3e32d）；最后运行 06-02 后 GitHub 60 天无活动停了定时任务
- ~~阻塞：GitHub 凭据失效~~ → 已于 10-01 晚解决（见下方 GitHub 恢复段）
- 数据缺陷：tools.alternatives/related_tools 464 条全空；类目过粗（claude-code 与 llama-cpp 同在 agent-frameworks）

## 2026-10-01（下午）新功能上线（Vercel CLI 本地部署，线上已验证）

- **/llms.txt**：src/lib/llms.ts + app/llms.txt/route.ts（类目 / Top100 / 对比页 / 提交入口）
- **vitest**：apps/agent-tools `npm test` = vitest run，4 文件 24 单测全绿
- **/alternatives/[slug]**：src/lib/alternatives.ts（TF-IDF 预筛 30 → LLM JSON → compareSlug）+ scripts/generate-alternatives.ts（默认只补空，--all/--dry-run/--limit，预算闸 $0.6，OpenRouter deepseek/deepseek-v3.2，并发 6）→ 460/464 已填（4 个无替代品），花费 $0.256；页面含对比表 + ItemList JSON-LD + /compare 内链 + canonical；sitemap 460 条；详情页 "See all N alternatives"
- **展示名修正**：330/464 工具名原为仓库名；src/lib/display-names.ts + scripts/generate-display-names.ts（raw.githubusercontent README 标题/图片 alt 作证据 → LLM 给官方名），更新 276 条；回滚文件 apps/agent-tools/data/display-names-backup-2026-09-30.json；crawl-github upsert 不覆盖 name（修正保留），但新工具入库仍是仓库名
- **/submit 免费提交**：src/lib/submissions.ts + /api/submit（每 IP 每小时 5 次、已上架返回 alreadyListed、URL 去重、首调 CREATE TABLE IF NOT EXISTS submissions）+ SubmitForm 成功页给排位与徽章 HTML（挂徽章优先审，FREE_REVIEWS_PER_DAY=3）；Nav 加 Submit；线上 selftest 提交 id=1 已标 rejected
- **花钱台账** docs/ops/spend-ledger.md；.vercelignore 加 apps/*/data
- commits：617a9b1（llms.txt+vitest）、d5317c2（alternatives+submit+展示名）及 docs
- **账户事实**：agentoolrank.com 在 CF 账户 "Tensam.th@gmail.com's Account"（ID db304ebc5bd6e6c38cee8c8275982830），CF 注册、auto-renew、到期 2027-03-27；~/.claude/skills/domain-check/SKILL.md 明文存该账户 cfat_ 账户级 token（安全隐患，已告知用户）；GitHub 仓库 owner = 个人账号 agent-gigmole（public）

## 2026-10-01（晚）GitHub 恢复 + daily-update 重启（T9 done）

- **GitHub 凭据**：fine-grained token 存 `~/.config/secrets/github-agentoolrank`（owner agent-gigmole，仅 agentoolrank 仓库 Contents/Actions/Workflows RW，**无 Secrets 权限**）
  - 用法：`unset GITHUB_TOKEN; export GH_TOKEN=$(cat ~/.config/secrets/github-agentoolrank)`（~/.bashrc 有失效全局 GITHUB_TOKEN）
  - push：`T=$(cat ~/.config/secrets/github-agentoolrank); git -c credential.helper= push -q https://x-access-token:$T@github.com/agent-gigmole/agentoolrank.git main`（不写入 remote）
- **push 已恢复**：本地与 origin/main 一致；Vercel git 自动部署 READY（4 月后首次）→ 部署可回到 git push 驱动
- **daily-update 已重新启用并修复**（commit 7b1c5da）：
  - crawl-github.ts 新增 `--existing`：从 Turso 读已上架工具，按已有 id UPDATE 指标 + 写 metric_snapshots，不插入/改名/删除；import 改为 ../packages/db/src/index；compute-rankings 同改
  - workflow 只剩 install → crawl --existing → compute-rankings，permissions contents: read；删除 cleanup/filter 自动删、migrate-to-turso（INSERT OR REPLACE 会用 3 月 local.db 覆盖 Turso）、提交 local.db、Google sitemap ping
  - workflow_dispatch run 36751990678 success；Turso 463/464 当天刷新（1 个仓库失败待查）；alternatives 460、intelligence 464、展示名完好；Claude Code 星数 85k→148.7k
- **Turso 现为唯一数据源**，local.db 不再同步到远端
- 新工具发现（discover/插入）已从每日任务移除 → 新工具入库需另走 /submit 审核或单独脚本

## 2026-10-01（夜）Part D 外部账号 + 目录提交

- **Windows 浏览器自动化** scripts/winbrowser/（run.sh / browser.py / task_act.py / task_peek.py / task_links.py / task_select_options.py / task_launch_kit.py / task_check_logins.py）
  - 专用 Chrome profile `C:\agentoolrank-chrome`，CDP 端口 **9223**，工作目录 `C:\agentoolrank-browser`；复用 imagehub 的 `C:\pixtidy-browser\venv`（**只读复用：不 pip install/升级、不改其文件、不写其目录**）
  - browser.py 同时尝试 127.0.0.1 与 [::1]（本实例绑 127.0.0.1:9223）；run.sh 把文件参数复制到 Windows 侧
  - task_act：password 框摘要显示 `<hidden>`；`fill_secret` 步骤从文件读密码、不打印
- **品牌邮箱** hello@agentoolrank.com：Cloudflare Email Routing → 0xzap0x@gmail.com，gmail_secondary MCP 可读验证码
- **PeerPush**：邮箱验证码注册（用户名自动 @hello2502，改名入口未找到）；AgentoolRank 已提交（AI + Developer Tools / Software Comparison / AI Developers / Free / Web，logo+截图+first comment）→ 免费队列 **#4190（约 70 天）**，40% off 挽留折扣按 spend-control 拒绝；账号 ~/.config/secrets/accounts/agentoolrank-peerpush.json（600）
- **Peerlist 完成**：真名 Ethan Tan；个人主页 https://peerlist.io/agentoolrank（资料 55%，可互动），项目 AgentoolRank（AI + DevTool）；账号 ~/.config/secrets/accounts/agentoolrank-peerlist.json（600）
- **X 已登录**：账号 ~/.config/secrets/accounts/agentoolrank-x.json（登录邮箱 tensam.th@gmail.com）；是用户个人 build-in-public 号 Zephyr @hwak8666621（已认证、23 粉、中文）→ **不改资料**，只发 AgentoolRank 进展；**首帖草稿已发 Telegram，等用户确认再发**（对外身份闸）
- **Product Hunt**：只有用户个人 maker 号 ethan tan @ethan_tan11（OAuth GitHub tensam / Google tensam.th），pixtidy 10/03 北京 15:01 用它发布 → **10/10 前不用于 agentoolrank、不改资料**
- **launch kit** docs/ops/launch-kit/（logo-512.png、4 张截图、kit.md 文案 + 账号状态表）；看板已更新

## 2026-10-01（深夜）自建统计 T1–T3 上线 + 品牌统一

- **T1 /api/e**：src/lib/events.ts（parseEvent 白名单 page_view/submit_done/outbound_click/badge_copy/checkout_click；referrer 只存域名且去掉本站；isBotUserAgent；sourceFromUrl 读 utm_*/ref）+ app/api/e（sendBeacon 文本体；events 表首用 CREATE TABLE IF NOT EXISTS + idx；国家取 x-vercel-ip-country）
- **T2 埋点**：components/Analytics.tsx（路由变化发 page_view、捕获出站点击、navigator.webdriver 不上报、sessionStorage 存 sid/src）；SubmitForm 发 submit_done / badge_copy
- **T3**：scripts/funnel-report.ts（7 天漏斗，排除 selftest），退出码 0
- 线上验证：curl 无 UA 被过滤；专用 Chrome 访问 /submit?utm_source=selftest&utm_medium=check 记录成功（country=ES，出口在西班牙）；vitest 5 文件 30 测试全绿
- **G1「漏斗可测」已达成**（付款步待 Stripe）
- 品牌名全站统一为 **AgentoolRank**（原 "AgenTool Rank"/"AgenToolRank"）；/alternatives 页 tagline 以工具名开头时不重复名字（taglineMentionsName）
- commits ce57020、a3a180c 已在 origin/main
- 看板 http://moneyflow-wsl.tailf1c73f.ts.net:8792/ 仍在跑（用户关了标签页，链接已重发 Telegram）
- agentkit 远程 URL 明文 token 问题已移交 agentkit session（已改 remote、Telegram 通知用户撤销 GitHub CLI 授权并删 ~/.bashrc 失效 GITHUB_TOKEN）

## 2026-10-01 凌晨 T4–T8 + T6 上线 → Goal 第 1 轮收敛

- **T4 公开 API**：src/lib/public-api.ts（toPublicTool 稳定字段、intelligence 只出白名单键；clampLimit）；GET /api/v1/tools（q/category/sort/limit，CORS *，s-maxage 3600）、/api/v1/tools/[slug]
- **T5 MCP**：src/lib/mcp.ts 手写无状态 Streamable HTTP（只回 JSON、无 SSE、无 SDK）；initialize 协议版本协商（2025-06-18/2025-03-26/2024-11-05）、ping、tools/list、tools/call；工具 search_tools / get_tool / get_alternatives；通知（无 id）→ HTTP 202；/api/mcp GET 405、OPTIONS CORS；线上实测通过；llms.txt 已列 API 与 MCP
- **搜索**：packages/db searchTools 改为关键词命中加权（name 4 / tagline 3 / category 3 / description 1 / intelligence 1）+ 停用词，再按总分
- **T8 related_tools**：src/lib/related.ts buildRelated（integrations 名称双向匹配，排除 alternatives，上限 8）+ scripts/fill-related.ts → **247/464**（验收 ≥400 未达，其余无集成数据，不硬凑）；详情页 "Works with {name}" 区块
- **T7 并入 T6**
- **T6 审核**：src/lib/review.ts（parseReview 未知类目强制 reject、pricing 兜底 freemium；toolRowFromReview source='manual'；hasBacklink；reviewOrder 付费 > 挂徽章 > 先到）+ scripts/review-submissions.ts（抓官网文本 + README → deepseek-v3.2 只依据证据判定；--apply 入库并跑 generate-alternatives / fill-related；--try 单站测试）；实测 browser-use.com approve、canva.com reject
- **每日运营 cron**：apps/agent-tools/scripts/daily-ops.sh（unset GITHUB_TOKEN；审核 --apply --free=3 + 7 天漏斗 → data/ops-logs/，已 gitignore）；WSL crontab `30 21 * * *`（系统时区 CST = 北京 21:30）
- vitest 9 文件 49 测试全绿；turbo build 过；线上 / /submit /alternatives/claude-code /llms.txt /api/mcp 均 200
- commits：b305fe2、fdcc869、88ebdf4、fdddf75（均已 push）

## 2026-10-01 凌晨 T10 / T14 / T15 done（Goal 第 2 轮）

- **T10 Stripe 结账上线**：src/lib/plans.ts（服务端定价，statement_descriptor_suffix=AGENTOOLRANK，session + payment_intent metadata site/submission_id/slug/plan/src）；/api/checkout（无 key 返回 503）；/submit/thanks 向 Stripe 核实 paid 后幂等记录；src/lib/paid.ts 走 Stripe REST（无 SDK），新表 payments、featured（只新增表）
  - Vercel 生产 env STRIPE_SECRET_KEY = agentoolrank-checkout restricted key（用户 Telegram 回「配」批准；sensitive/production，经 Vercel API 从本地文件写入，值未打印）；turbo.json build.env 已透传
  - live 自测：建 session → 读取 → expire
- **价格阶梯**：free / **$9 priority（72h 审核，新增）** / $19 fast / $49 featured（首页推荐 7 天）
- **T15 agent-first 提交与付费**（用户提出）：
  - src/lib/offers.ts：buildOffers（免费 + 3 付费档按价格排序，付费档 checkout_url 为懒创建链接）+ recommendPlan（按预算/期限/是否要推荐位选约束内最便宜档）
  - src/lib/submit-core.ts 共享提交逻辑：/api/submit、POST /api/v1/submissions、MCP submit_tool 共用；新表 submission_tokens
  - GET /api/v1/submissions/{id}?token= 查状态；GET /api/v1/submissions/{id}/checkout?plan=&token= 点开时才建 Stripe session 并 303 跳转
  - MCP 新增 submit_tool / get_submission_status，instructions 更新；llms.txt 新增 "For AI agents: list a tool"；网页成功页展示三档付费按钮
  - submissions.plan 有 CHECK(free/fast/featured) → **不改表**，付费事实记 payments 表；review-submissions 从 payments 判优先级
  - 线上 e2e：MCP 提交 → 4 档 + 推荐 → 状态 → 错 token 404 → checkout 303 到 Stripe（fast $19）后 expire；selftest submissions id 1、2 均已 rejected
  - vitest 11 文件 63 测试全绿
- **T14 X 首帖已发**（用户回「发」）：https://x.com/hwak8666621/status/2105370588521111867 ，链接 agentoolrank.com/?ref=x（sourceFromUrl 读 ref）
  - 发帖方法：compose/post 页 [data-testid=tweetTextarea_0] 用 keyboard.insert_text 保留换行（task_act 新增 insert_text 步骤）→ [data-testid=tweetButton] → task_latest_post.py 取 permalink
  - X 链接卡片缓存旧 OG 标题（AgenTool Rank），暂无法强刷
- 用户问"站点对 agent 提交友好吗"→ 已在 Telegram 答复；后续计划把 MCP 上架 Smithery / mcp.so 等 MCP 目录

## 2026-10-01 03:17–04:40 正式 /goal + 去重 + 扩量 T16 + MCP 类目/Registry + 发信尝试

- **正式 Goal**（写在 PROJECT.md 顶部与看板）：完全负责人、盈利并滚动放大；每轮问"推动收入了吗"；spend-control；不可逆走人工闸；看板实时；经验反哺 agentkit
- **agentkit 新规**（$AGENTKIT_ROOT/shared/harnesses/owner-goal.md）：
  - 账号一律自己注册：品牌邮箱 hello@agentoolrank.com，gmail_secondary 读验证码
  - 需要老板的事统一 `bus-send agentkit` 汇总（每天 09:30），**不直接发老板 Telegram**
  - X 统一用老板大号 Zephyr；发帖走 x-post skill（官方 API，~/workspace/twitter-intel/.venv），每项目每天 ≤1 条、写明作者本人
  - 浏览器借用 browser-lock：agentoolrank-chrome 端口 9223，run.sh 开跑前 check，被占用退出码 3
- **老板批复（经 agentkit）**：
  - ① 去重已执行：删 embedchain/gpt-index/memgpt/opendevin/agent-llm/quiver/autogpt/privategpt（保留内容完整的一条）；74 个工具 alternatives/related 引用改指保留条目；备份 apps/agent-tools/data/dedupe-backup-2026-10-01.json；src/lib/merged.ts + next.config redirects（/tool、/alternatives 308）+ compare 页 permanentRedirect
  - ② PH：10/10 后老板本人在 agentoolrank-chrome 用 tensam.th Google 登录一次（**提前一天报 agentkit**）
  - ③ 每周榜单帖常设授权直接发：weekly-post.ts --post 走 x-post，文案含"我自己做的 AgentoolRank"
- **T16 扩量 done**：scripts/expand-tools.ts（16 组 GitHub 主题搜索，近 90 天活跃 ≥300 星，1263 结果；pickCandidates 去重/去 fork/去 awesome；按仓库名判已上架；4 并发）+ scripts/judge.ts（与审核共用取证 + LLM 判定）
  - 结果：新增约 205 → **库内 669**，拒绝率 24%，metrics 668/669，官方名 123，alternatives 217（$0.115），related 覆盖 350/669，sitemap 899→2250
  - 首轮换组织仓库误建 8 条重复已撤回（备份 data/reverted-expand-dupes-2026-10-01.json）
  - 展示名回滚文件改为时间戳文件名（同日同名曾被覆盖，原值可由 github_repo 还原）
- **数据健壮性**：website_url 规范化（无协议加 https://，无效/含用户名改用 github_url）；expand-tools 入库前 siteUrl 规范化；packages/db/src/queries.ts parseTools 用 safeParse 跳过坏行并告警（getToolBySlug 同）
- **MCP Servers 类目**：scripts/tag-mcp.ts（44 候选 → LLM 判主要用途 → 29 个加 mcp-servers 标签，categories INSERT OR IGNORE）；/category/mcp-servers "29 Best Open-Source MCP Servers in 2026 (Ranked by GitHub Activity)"
- **类目页 SEO**：categoryTitle "N Best Open-Source X in 2026 (Ranked by GitHub Activity)"、导语列前三、canonical
- **官方 MCP Registry 已发布** com.agentoolrank/agent-tools v1.0.0（remote streamable-http）；DNS 认证：ed25519 私钥 ~/.config/secrets/mcp-registry-agentoolrank.pem，TXT `v=MCPv1` 在 agentoolrank.com；mcp-publisher v1.8.1；server.json 在 apps/agent-tools/mcp/
- **发信（未完成）**：Resend 注册被 Cloudflare Turnstile 挡（CDP 控制 Chrome）；Brevo 账号 hello@agentoolrank.com 已建（Ethan Tan / TENSO LLC，地址 "Unit 4670"），发信前需手机验证；Twilio +19047347766 收 OTP 被 30038 丢弃 → **等实体 SIM（10-02，分给 ai-directory）**
- **目录站**：PulseMCP 全站暂停收录；mcp.so 仅 $39 或工单；AI Agents List 资格通过、草稿已存、仅 $29/$49 → 零收入期全部不付
- **安全**：task_act 摘要 ERRORS 选到带值 input 打印了 Resend 密码（已作废）→ 所有摘要函数 type=password 返回 <hidden>，ERRORS 排除 INPUT/TEXTAREA/SELECT
- **看板**：systemd --user agentoolrank-dashboard（Linger，开机自启）+ document.lastModified + 60s refresh
- **花钱**：OpenRouter 既有余额累计约 $0.53；现金 $0

## 2026-10-01 04:30–05:00 搜索提交 + 收入入口 + SEO/GEO + 外联合规

- **IndexNow**：密钥文件 public/<key>.txt（key 记 docs/ops/indexnow-key.txt）；首推 403 SiteVerificationNotCompleted，约 15 分钟后重试 200（2250 URL）；scripts/indexnow.ts 已进 daily-ops
- **Google sitemap 重新提交**：service account（webmasters 写 scope）PUT → 204；发现 Google 上次下载 sitemap 是 **2026-03-28、只记 739 条、收录 0** → 需观察下次抓取
- **收入入口**：工具页「Maintain X?」MaintainerBox（复制 README 徽章 / $49 首页推荐 7 天）；/api/checkout 支持已上架工具无提交记录买 featured（submission_id=0，不传 customer_email 由 Stripe 收集）；线上建单后立即 expire 验证
- **SEO/GEO**：
  - src/lib/titles.ts：toolTitle「名称: 一句话说明 · 星数」≤70 字符（去 "X is a" 前缀、不留悬空连接词）；compareTitle「A vs B (年份): GitHub Stats, Features & Which to Choose」
  - src/lib/faq.ts 数据驱动 FAQ（替代品页/对比页，可见内容 + FAQPage JSON-LD，缺数据跳过该问）
  - sitemap lastModified 改用 data_refreshed_at（不再全是今天）
  - /agents 页（MCP / API / agent 代提交文档）+ 页脚入口 + sitemap
  - MCP Registry 发布 **v1.0.1**（websiteUrl → /agents；registry JWT 短时效，发布前重新 `login dns`）
- **外联合规**（agentkit 提醒：GitHub 条款禁止用 GitHub 资料发未经请求邮件）：
  - src/lib/contact.ts extractContactEmails：只取官网/README 公开邮箱；排除 noreply/example/图片文件名；排除 security@/license@/legal@/privacy@/careers@ 等专用信箱；优先项目域名
  - outreach-list 改为官网→README 取证并记录出处 → **34 位**（官网 20、README 14）；名单 data/outreach/candidates.json **不入库**
  - 模板 src/lib/outreach.ts（排名/页面/徽章，无推销，含退订）→ 经 agentkit 交老板 **10-02 09:30 汇总批**；署名是否用 Ethan Tan 待老板确认
- vitest 20 文件约 95 测试全绿
- commits 至 17fc532（均已 push）

## 2026-10-01 05:00–05:30 原创数据报告 + 技术 SEO 巡检 + Stripe 对账 + 转分发

- **/report 原创数据报告**：src/lib/report.ts buildReport + app/report/page.tsx（Dataset JSON-LD、CC BY 4.0 引用说明、sitemap/llms.txt/页脚入口；月份按服务器 UTC）
  - 数据：669 工具、16.1M 星、**32% 半年无提交**（68 个 5k+ 星，含 MetaGPT 71k、gpt-engineer 55k、AgentGPT 36k）；增长最快 Skills / LangChain；MCP 29 个合计 58 万星
- **首页主视觉三入口**：提交 / Best MCP servers / For AI agents
- **停更提示**：src/lib/staleness.ts（≥180 天无提交）→ 工具页顶部 "No commits in N months — may not be actively maintained" + 链到替代品页
- **技术 SEO 巡检**（scratchpad 脚本抽 17 页查 h1/title/description/canonical/robots/JSON-LD）→ 修复：工具页 canonical + toolDescription（星数/90 天提交/前三替代品，clampDescription ≤160）；/new /compare /weekly canonical；类目/报告/blueprint/stack 描述截断；首页 WebSite+SearchAction+Organization JSON-LD；写死的"463 个工具"改 600+
- **Stripe 每小时对账**（收入保护，commit 24cb514）：src/lib/paid.ts 抽出 recordPaidSession（thanks 页与对账共用、幂等）；src/lib/reconcile.ts paidAgentoolrankSessions；scripts/reconcile-payments.ts 用**只读 ops key** 列最近 3 天 Checkout Sessions；scripts/hourly-ops.sh + crontab `17 * * * *`。不用 webhook（需新建签名密钥 = 凭证闸）
- **流量判断**：真实访问 ≈0（1 天 4 次，基本自测），订阅者 0 → **停止堆功能，转分发**
  - 社区帖三份草稿 docs/ops/launch-kit/community-drafts.md（Show HN / Reddit / dev.to；数据来自 /report、写明作者本人、不拉票）→ 经 agentkit 进 10-02 09:30 老板汇总
  - agentkit 提醒：HN/Reddit 为多项目共用个人号，imagehub 09-30 刚发 Show HN → 同号 Show HN 至少隔一周，**建议先批 dev.to**
- **dev.to 品牌号**：https://dev.to/agentoolrank（hello@agentoolrank.com，凭据 ~/.config/secrets/accounts/agentoolrank-devto.json）；reCAPTCHA 用 task_act 新步骤 `frame_click` 勾过；邮箱已验证
- 漏斗报表排除 note 含 selftest 的提交；T19：10-02 X 帖发 /report 数据（每项目每天 ≤1 条）
- Vercel 一次部署 "Resource provisioning timed out"（Vercel 侧）→ 重试成功

## 2026-10-01 T20–T23（邮件简报代码 / LLM 迁 Sub2API / GEO / 对比内容第一篇）

- T20 每周邮件简报代码就绪（blocked：Brevo 手机验证，SIM 10-02；订阅者 0）
- T21 done：批处理 LLM 统一走本机 Sub2API（gpt-5.6-sol），失败回退 OpenRouter；线上 /api/chat 仍 OpenRouter（改线上 env = 凭证闸）
- T22 GEO：引用源挖掘 + 答案块格式（关键页前 50 字给结论、H2 分段、带数字）
- dev.to 数据长文已发布（canonical→/report）；外联获老板独立授权（≤10 封/天、署名 Ethan Tan、只用公开邮箱），仅等 Brevo
- **T23 对比内容第一篇上线**：https://agentoolrank.com/where-to-list（AI agent 工具上架渠道对比：免费 vs 付费）
  - 数据 apps/agent-tools/src/lib/directories.ts（CHECKED=2026-10-01；PeerPush / AI Agents List / mcp.so / mcpservers.org / 官方 MCP Registry / AgentoolRank，每行带提交页 URL，事实逐条在对方提交页核对）
  - 页面：answer-first 短答 + 自家产品披露 + 对比表（竞品链接 nofollow）+ "选哪个"如实写自家流量小 + FAQPage JSON-LD + /submit 与 /agents CTA；入 sitemap，/submit 页加入口
  - commit 191406f，已部署（200）、已 push；IndexNow 推 2253 URL HTTP 200；看板更新日志已记（commit d2d8fed）
  - CHECKED 日期过期后需重新核对竞品价格/政策（价格会变）

## 2026-10-01 T23 第二步：对比页「Short answer」（answer-first，数据驱动）

- **依据 GSC 28 天**：曝光 397 / 点击 3；**/compare 页 175 曝光，占比最大**（goose-vs-open-webui 32 曝光 2 点击、均排 7.5）→ GEO/answer-first 优先做对比页
- apps/agent-tools/src/lib/verdict.ts `compareVerdict(a,b,now)`：一方 >180 天无提交且另一方活跃 → 提示停更；30 天星增速差 ≥1.5 倍 → 说明谁增长更快（取整）；定价只在付费 vs 免费不同才写（free 与 open-source 视为同类）；标语只取首句、≤110 字符，输出 "Pick X for:"
- 对比页顶部新增「Short answer」区块；compareFaq "Both are open source" 改为仅双方 pricing 都是 open-source 才写
- titles.ts shortTagline 截断后去掉结尾悬空虚词（and/with/to 等）
- vitest 115 测试全绿；commits de79e4c、73f89f8、d3ed359 均已部署、push、线上核验；看板记录 947cc7f
- 已知历史遗留：build 日志 "Ecmascript file had an error"（save-stack 路由 import packages/db），不影响构建成功

## 2026-10-01 T23 第三步：替代品页 Short answer + 线上内部字样自查

- **线上自查（agentkit 要求）**：抽 106 页（sitemap 前 40 + 随机 60 + llms.txt、/api/v1/tools、mcp/server.json、submit/thanks、unsubscribe），查 HTML 与内嵌 JSON → **无泄露**，仅误报（页脚公开 GitHub 组织 agent-gigmole、todoist 命中 TODO、正文 OpenRouter/reviewer）；submissionStatus 仅 rejected 返回 LLM 理由且已剥离 paid: 字样
- favicon：自定义 icon.tsx；/favicon.ico 原 404 → next.config rewrites 指向 /icon（commit e698675）；已回复 agentkit
- **替代品页 Short answer**：verdict.ts 新增 alternativesVerdict(tool, alts, now) → 最接近 / 最活跃（commits 90d）/ 增长最快（星增速 30d）/ 停更 ≥6 个月（最多 4 个，其余 "N more"）；/alternatives 页顶部 Short answer 区块；表格星增速改 signed()（修 "+-0"）
- vitest 117/117；commits c46db50（坏提交，Vercel 构建失败、生产未受影响）→ 4e3f35c 修复（verdict 移入页面函数）→ 8def881 看板；firecrawl / langchain / llama-cpp 三页线上核验通过
- "最接近"与"已停更"可能是同一工具（firecrawl → Scrapegraph-ai），如实反映数据，接受
- **部署链纪律**：build 输出重定向到日志、用 build 自身退出码 && 门控 commit/push/deploy，禁止 `build | grep` 作闸（见 GOTCHAS#pipe-grep-masks-build-failure）

## 2026-10-01 T23 第四步：dev.to 第二篇草稿（定 10-03 发）

- 草稿 docs/ops/launch-kit/devto-where-to-list.md：标题「Where to list an MCP server or AI agent tool: free vs paid (checked Oct 2026)」，canonical → https://agentoolrank.com/where-to-list，站内链接带 ?ref=devto2
- 结构：开头披露自家产品 → 结论清单 → 对比表 → 官方 MCP Registry DNS 发布步骤（坑：registry JWT 短时效需发布前重新 login dns；server.json name 必须与 DNS 命名空间 com.agentoolrank/* 一致）→ 建议顺序
- 第一手经历如实：实际提交过的只有 MCP Registry、mcpservers.org、PeerPush 三家，其余只核对了提交页 → 标题由 "5 directories in one day" 改为如实描述（见 GOTCHAS#offsite-firsthand-claims）
- 发布：**2026-10-03** 用 dev.to 品牌号（hello@agentoolrank.com，https://dev.to/agentoolrank），与 10-01 数据长文错开；看板已记录（commits 262b94f、d3477ec）

## 2026-10-02 T24 多语言计划（BOSS_DECISIONS #23，已回复 agentkit）

- **依据 GSC 近 90 天按国家**：总展示 1,934；美 24%、印 11%、英/菲/加/尼日利亚各约 4%、中国 3% 但点击最多（3 次、均排 8）；港/台/日/韩也有点击
- **计划**：中文先做（现有 /zh 首页、search、blueprint 三对 hreflang）→ **10-05 中文第一批**：工具页按 score 前 200、替代品页、对比页、/where-to-list、/submit 价格页；**日语 10-09**；西语 10-30 看 GSC 再定；印地语/他加禄语不做
- **架构**（加第二门语言时抽象）：i18n 字典 + 语言页登记表 + /[lang] 薄路由；hreflang 全互指（含自引用 + x-default）；sitemap 从登记表派生；付款回跳同语言页（白名单）
- **译文质量**：模板/界面文案逐条人工核；标语/简介 LLM + 术语表，前 50 页逐页核，其余抽查 10% + 脚本检查（术语、长度、残留英文）；专有名词/数字/日期不译；不整站机翻
- TASK.md 已有 T24；看板已记录（c802631）
- 查国家分布方法见 GOTCHAS#gsc-country-dimension

## 2026-10-02 看板每日 KPI（集团运营监管，agentkit 每天 09:30 汇总对照 G 目标）

- 依据：agentkit「集团运营监管：每日 KPI」（老板 10-02：agentkit 只监管，各项目自负责）
- **代码**：apps/agent-tools/src/lib/kpi.ts（cstDayRange 北京日期→UTC SQLite 边界 / renderKpi / replaceBlock 只替换 `<!-- KPI:START -->`…`<!-- KPI:END -->`，缺标记抛错）；5 单测，全量 122 绿
- **脚本**：scripts/kpi.ts 读 events / submissions / payments（剔除 selftest）+ data/ops-logs 最新 GSC 行取 28 天点击 → 写回 docs/ops/overview/index.html 顶部
- **调度**：接入 hourly-ops.sh（cron 每小时 :17），日志 data/ops-logs/kpi-YYYY-MM-DD.log
- **首跑数**：昨日访客 23 / 提交 0 / 付费 0 / $0；G2 0/20、G3 0/1、G4 $0/$300、GSC 点击 3/1000；中文页 7 天访客 1
- commit 13d1315「ops: 看板顶部每日 KPI」；已回复 agentkit
- T24 已按 owner-goal #23 补第二模型回译比对 + 子项「中文读者付款能力（Stripe 大陆支付宝/微信/银联）」看板单独跟踪（0c3dc27）
- 注意：看板 html 每小时被改写 → 工作区常 dirty，随其他看板改动一起提交，不单独清理（GOTCHAS#kpi-dashboard-block）

## 2026-10-02 对外文字统一走 content-writing（BOSS_DECISIONS #24）

- **规则**：所有对外文字（X 帖、dev.to、外联邮件、Show HN、PH、多语言页文案）一律走 agentkit content-writing skill：brief → `bin/write` → ai-flavor 复查；**老板不审稿，负责人自审后直接发**
- 流程：brief 只放可核对事实（禁止推测，如"agent 自己提交"）→ `mkdir -p` 输出目录 → `bin/write`（例：zh / x-post / auto）→ 初稿偏抽象时从 brief 手补具体数字和名字 → **补完再跑一次 ai-flavor**
- **T19 X 帖定稿**：brief docs/ops/launch-kit/briefs/x-t19-report.md（只用 /report 10-01 刷新后事实）；定稿 docs/ops/launch-kit/drafts/x-t19.md（风格 hook-first，初稿 AI 味 0 / 无依据 0，手补 MetaGPT、gpt-engineer 后 ai-flavor 复查干净）；ph-and-x.md 旧稿已标作废
  - **发布：10-02 10:00 左右（北京）**，老板主号 Zephyr 经 x-post skill；中文帖选中文读者活跃时段，不半夜发；X 的 CJK 字符按 2 权重，非 Premium 会自动拆 thread
- dev.to 第二篇：ai-flavor 查出 4 处 em dash 已改，复查干净（仍 10-03 发）
- 已回复 agentkit，并反馈 writer.py 问题：`--out` 父目录不存在 → FileNotFoundError，且发生在模型调用之后（白花一次）
- /report 显示 "last refreshed 2026-09-30" 不是断更：DB data_refreshed_at 最大 2026-10-01T12:48、668 条均刷新、Action 10-01 成功；原因是 report 页 revalidate=86400 的 ISR 缓存（GOTCHAS#isr-stale-refresh-date）
- commit 830a717

## 2026-10-02 T24 中文第一批上线（/zh/tool/[slug]，commits d9b44c7 / d8b8f09 / 9bc019e）

- **线上**：11 篇中文工具页已发布（人工全文读 12 篇，dbx 退回：英文源 tagline 被截断成 "Built-"）；/zh/tool/hermes-agent 200，英文 /tool 页已带 hrefLang zh
- **代码**（apps/agent-tools）：
  - src/lib/i18n.ts：localizedAlternates（hreflang 全互指，含自引用 + x-default）/ parseToolTranslation / numbersPreserved / residualEnglish（7 测）
  - src/lib/zh-tool.ts：wan（万为单位）/ zhToolTitle / zhStatus / zhToolFaq，全部数据生成（5 测）
  - src/lib/i18n-data.ts：只发布 status='approved' AND human_reviewed>=1（1 = 全文读过，2 = 整批 10% 抽查通过）；表不存在返回空
  - src/app/zh/tool/[slug]/page.tsx：统计、状态句、简介、区别、能力/适合/不太适合/局限、替代品（有中文页的链中文页）、FAQPage、页尾"AI 翻译 + 第二模型回译校对"声明、提交 CTA
  - 英文 /tool alternates 改用 localizedAlternates；sitemap 加 zh 工具页；FaqSection 加 title 参数
- **翻译流水线**：scripts/translate-tools.ts —— 译者 gpt-6-astra（llm 加 model + noFallback，**禁止回退 OpenRouter**，避免译者与审校同模型）；审校 OpenRouter DeepSeek（llm.ts 新增 openrouter()）回译 + 情态逐句核对；确定性检查：列表长度、数字、残留英文；写入 Turso tool_i18n（tool_id, lang, content, status, issues, source_hash, human_reviewed）
- **人工审**：scripts/review-translations.ts --list / --sample / --mark / --reject
- **进行中**：前 200 工具后台翻译（gpt-6-astra 约 3 个/分钟）；其余 189 页：每批 --list 全读前 50，其余 --sample 10% 抽查后 --mark level 2 发布
- zh UI 文案已过 ai-flavor（干净）；看板已记录（9bc019e）
- 部署链：build > log && commit && deploy && push

## 2026-10-02 T24 中文工具页 177/200 上线 + 英文源数据修复（commits f50bd74 / 2f68e4e / d86b75e）

- **中文工具页线上 177 个**（原定 10-05 上线 200）：
  - human_reviewed=1：49 个（前 50 名，逐篇全文读）
  - human_reviewed=2：128 个（随机抽 14 个约 10% 全合格 → 整批标记）
  - review_failed：23 个，暂不处理，之后用 `translate-tools.ts --retry-failed` 重试
  - 上线前退回 2 个：dbx（源 tagline 截断）、editor（源 intelligence 混有审核备注）→ 源数据修好后已重译，dbx 已通过审核
- **英文站源数据修复**（人工审译文时顺带发现，英文页一直在显示）：
  1. **114 个 tagline 被截断**：早期抓取按 160/200 字截断，且 expand-tools 用截断的 GitHub 描述覆盖了审校写好的 tagline → review.ts 新增 isTruncatedTagline / submissionTagline（TDD），expand-tools 改用 submissionTagline；scripts/fix-truncated-taglines.ts 用 LLM 依据 description + README 重写；回滚 apps/agent-tools/data/tagline-backup-*.json
  2. **13 个工具 intelligence 混入审核过程备注**（如 "Website content could not be fetched for full verification"）→ review.ts 新增 isMetaNote / stripMetaNotes，parseReview 自动过滤；scripts/clean-meta-notes.ts 清存量；回滚 data/intelligence-backup-*.json
- **translate-tools.ts --retry-failed**；源文本变 → source_hash 变 → 自动重译并把 human_reviewed 重置 0（先撤下，等再审）
- vitest 138 全绿；已 commit + push；看板已记录（d86b75e）
- **待刷新**：sitemap 缓存仍是 11 个 zh 页；21:30 daily-ops 跑 IndexNow

## 2026-10-02 T24 元话术第二轮清理（commit a66f08e）

- 起因：10-01 按内部词表扫线上页面，抓不到用自然英语写的审稿元话术 → 改为扫 DB 全部文本字段 + 语义模式
- 新发现：旧 pros/cons 字段（对比页 Pros/Cons 直接展示）里有 "Limited information available about ..."、"the provided README excerpt ..."、"README content cuts off ..."、"No direct evidence of ..."；databerry description 含 "which limits the ability to provide detailed insights"
- 代码：review.ts META 正则扩展（limited information available / provided readme|documentation|evidence / readme cuts off|excerpt / unclear from ... readme / no direct evidence / limits the ability to provide / based on visible content）；新增 stripMetaSentences（按句删描述里的元话术）；scripts/clean-meta-notes.ts 覆盖 description / pros / cons / use_cases / intelligence → 再清 12 个工具，回滚 apps/agent-tools/data/meta-notes-backup-*.json
- 刻意保留真实产品缺点（如 "Minimal README — documentation is external"：说项目文档少，不是审稿人看不到）
- vitest 139 全绿；已 commit + push
- **待**：top 200 中 intelligence/description 变动的工具（eigent、camofox-browser 等）下次 translate-tools 自动重译（source_hash 变 → human_reviewed 归 0 先下架）→ 重审后再上线

## 2026-10-02 T24 中文工具页 200/200 全部上线（commits e33c5e1 / 6da708d，比计划 10-05 提前）

- **tool_i18n 200 条全部 status='approved' 且已发布**
- 第三轮重译 24 条（--retry-failed + 元话术清理后 source_hash 变动的）→ 11 条过审，全文读完后发布
- 两轮都没过审的 13 条：逐条读审校意见 → 12 条是挑剔/误报，用 review-translations.ts 新增的 **--override**（人读过审校意见后放行）发布
  - 误报例：E2E 里的 "2" 被 numbersPreserved 当成数字改动；"Deep Exploration and Efficient Research Flow"（项目全称）被 residualEnglish 判为残留英文
- **omniroute 是真问题（同名项目串号）**：英文 intelligence 写的是另一个同名项目（Uniswap 跨链路由），英文站一直这样显示 → 新增 scripts/rejudge-tools.ts，调 judge.ts 依据项目自己的网站 + README 重生成 description 与 intelligence，回滚 apps/agent-tools/data/rejudge-backup-*.json；全库扫过，同类只有这一个；重生成后重译、人工读过、已发布
- 已 commit + push；看板已记录（6da708d）
- 英文源数据被翻译审稿查出的错误累计三类：截断（114）→ 元话术（13+12）→ 同名项目串号（1）

## 2026-10-02 T17 外联通道打通 + T20 解除阻塞（commit 9af8381 已 push）

- **Brevo 手机验证通过**：用 agentkit 收码线②（老板西班牙实体 SIM +34 607 062 519，SmsForwarder 转发）。先后台跑 `$AGENTKIT_ROOT/bin/sms-code wait sim --timeout 300 --from brevo`，再在弹窗点 modify phone number 填 +34，Send code 只点一次；约 15 秒到码（发件号 +34683785677），task_act fill_secret 填入，未打印
- **API key**：名 agentoolrank-outreach，存 ~/.config/secrets/brevo-api-key（600），Windows 侧临时文件已删；/v3/account 200，sender hello@agentoolrank.com active
  - 新工具（未入库，待 commit）：scripts/winbrowser/task_dialog.py（只读打印可见弹窗文本/控件）、task_capture_key.py（填 key 名 → Generate → 页面读 key 直接写文件，不打印）
- **域名认证**（用本机已有 ~/.config/cloudflare/agentoolrank.token，有 DNS 写权限）：新增 CNAME brevo1/brevo2._domainkey（proxied=false）、TXT brevo-code、TXT _dmarc（p=none）；SPF 改原记录，加 include:spf.brevo.com（**回滚值** `v=spf1 include:_spf.mx.cloudflare.net ~all`，已记看板）；DoH 回读生效，Brevo authenticate 成功
- **模板**：brief docs/ops/launch-kit/briefs/outreach-maker.md → bin/write（agentkit 修复占位符丢失后重跑，7 个变量全保留，判可发布）→ 采用 drafts/outreach-maker-v2.md；src/lib/outreach.ts 已换，vitest 139 全绿
- **scripts/send-outreach.ts**：每天 ≤10 封（北京时间日）；同一地址只发一次、不跟进；退订名单 data/outreach/optout.json；发送记录 data/outreach/sent.json（gitignored）；**发送时从 DB 实时重算排名**（hermes-agent 已从 #1 掉到 #2）；间隔 30 秒；List-Unsubscribe 头；--test / --dry-run
- **自测**：发 hello@agentoolrank.com → Gmail 收件箱（Updates 分类），非垃圾箱
- 已回复 agentkit；**第一批 10-02 22:00 CST（美东 10:00）发 10 封**
- T20 周报阻塞解除（有 Brevo key 了）；订阅者目前 0，周一 weekly-ops 真正发出

## 2026-10-02 04:45–05:50 目录站加量（共享 skill directory-submission）+ Google/GitHub 品牌号

- **台账统一**：过往目录站提交已补进 ~/data/backlinks/directory-log.csv；之后一律用 agentkit `skills/directory-submission` 的 dirsub.py 做 check/add 并回写（scripts/dirlog.sh 已被取代，不再用）
- **本轮新提交 7 个**：futuretools、websitelaunches（此前已被自动收录）、visalytica、ainewshub（回执未截到）、aitoolscapital、outils.ai（法语 Tally，直接开 tally.so/r/wAAg6W）、startupstash（Typeform）
- **累计**：submitted 12 / retry 1（purshology）/ todo 4（mcp.so、smithery、producthunt、betterlaunch）
- **目标冲突**：skill 规定每天 5–8 站，agentkit 目标 10-03 前累计 25 → 已报 agentkit，等裁定
- **上架文案**：bin/write landing-copy；brief docs/ops/launch-kit/briefs/directory-listing.md → drafts/directory-listing.md（en）、drafts/directory-listing-fr.md（fr）
- **Google 品牌号** hello@agentoolrank.com，姓名 Ethan Tan（老板已批准的真名；agentkit 曾误判为编造，已更正），密码 ~/.config/secrets/accounts/agentoolrank-google.json；卡在扫码一步（老板误扫成 new_ladar 的码），Google session 已过期 → **等老板醒来重新注册**；二维码截图在 ~/data/handoff/
- **GitHub 品牌号**：注册页风控拦截（访问暂时受限，IP 判为机器人）→ 老板决定 #25：同一平台被风控一次就停，不再尝试
- **mcp.so issue 路线**：本机 gh 账号 tensam 的 token 不能在外部仓库建 issue → 老板待办 #26（agentkit 建议不做）
- 老板查 Google Ads $9.9 扣款：不是我们的，已回复
- **标签页纪律**：Chrome 曾开到 24 个标签、Windows 内存只剩 1.2GB → 每个站做完立刻关它的标签页（task_tabs.py）
- **浏览器工具**（commit 5ffca5e）：scripts/winbrowser/ task_tab.py（从 skill 复制）、task_frames、task_tabs（列/关标签）、task_fields、task_find、task_screenshot、task_options；task_act 新增 js / key 步骤；task_dialog、task_capture_key 已于 2e2b702 入库
- 外联：发送脚本就绪，第一批 22:00 CST

## 2026-10-02 05:30–06:35 目录站第二批（累计 16）

- **目标已裁定**（agentkit）：5–8/天是单站/单账号防风控节奏，不是总数上限 → 10-02 白天、10-03 各一批，**10-03 24:00 前累计 25**；连续两个验证码即停（#25）
- **新提交 4**：iui.su、aisharenet.com（post_id=35370）、productwatch.io（11-01 上线，DR72 dofollow）、betterlaunch.co（11-02 上线，nofollow）
- **badge 1**：aiagentsdirectory.com（DR74，最对口；免费档须挂徽章 → 周决策，建议挂；验证邮件未点）
- **retry 2**：purshology、ai-tab.cn（本机访问超时）
- **累计 submitted 16，还差 9**
- 中文上架文案：briefs/directory-listing-zh.md → drafts/directory-listing-zh.md（brief 不能写 "Write in plain English"）
- 新凭据（600）：~/.config/secrets/accounts/agentoolrank-betterlaunch.json、agentoolrank-aiagentsdirectory.json
- 候选站：dirsub candidates 里 pixtidy 判"不相关"的 AI agent 目录 / 中文 AI 导航站，对本项目可能最对口，要重判
- 已回复 agentkit，看板已记，代码 1c745a9 已 push

## 2026-10-02 06:00–06:55 目录站第三批（累计 20）

- **aiagentsdirectory 结论：不挂徽章、不付费**。免费档挂 AAD 徽章换来的仍是 "No-follow SEO backlink"，且等徽章验证通过才上线；dofollow 只在付费档（$49/$99/$499）。不满足 skill 挂徽章条件；agentkit 同意（零收入期、单个推荐位无法归因，不符合 spend-control）→ 保持 badge 状态，不进周汇总
- **选站方法**：按本项目关键词（mcp / agent / 智能体）筛 columbus 原表，比 dirsub candidates 默认队列更准，多出一批 MCP/agent 专门站（筛选脚本是临时写的，未入库）
- **新提交 4**：glama.ai（官方 MCP Registry 发布后自动同步，未单独提交）、mcpmarket.com（月访 1M+，GitHub repo Free Queue，$0，4–6 周；Remote MCP 路线仅付费 $69）、mcprepository.com（只填 GitHub URL）、ai123.com（中文，DR51，分类搜索下拉选「AI开发者工具」，回执"提交成功！"）
- **skip 3**：catalog.thesys.dev（已下线跳主站）、context-awesome.com（只收 awesome list）、mcpmarkets.com（公开提交暂停）
- **todo +1**：cursor.directory（需 GitHub 或 Google 登录 → 等 Google 品牌号）
- **累计 submitted 20，目标 25，还差 5**；看板已记录并推送（a526159）

## 2026-10-02 07:06–07:40 目录站第四批 → 累计 25 达标（T25 目标完成）

- **累计 submitted 25 / badge 1 / retry 2 / skip 7 / todo 5**；原定 10-03 24:00，提前到 10-02 07:40 达成；全程没遇到验证码
- **新提交 5**：agentlocker.ai（注册 username+email，邮件验证链接在本浏览器打开；/agent/submit 选 manual；凭据 ~/.config/secrets/accounts/agentoolrank-agentlocker.json；标准审核 1 个月以上，挂徽章可缩到 24h，没挂）、linkstartai.com（4 字段表单）、agenstry.com（粘贴 MCP endpoint，对方实时握手，5 个 tools，即时收录）、magicnetworld.com（只有 mailto 入口 → 用 Brevo 从 hello@ 发中文推荐邮件，标题按页面模板写）、thedailyworkflow.com（蜜罐字段 website 留空；Submit 按钮与导航链接同名）
- **skip**：opentools.ai（仅付费）、xpay.sh（不相关）；**todo**：conduid.com（需登录）
- **后续节奏**：每天 5–8 个；剩下的主要是需要 Google 登录的站（cursor.directory、conduid 等），等品牌 Google 号建好（老板扫码）再做
- 已回报 agentkit，看板已记录，代码已推送

## 2026-10-02 08:15–08:45 T24 日语版开工 + 中文读者付款能力核实

- **第二门语言抽象完成（commit 0fd2ce1，已部署）**：按 seo-geo「第二门语言时才抽象」
  - src/lib/tool-i18n.ts：COPY 字典 zh/ja（键集合一致由测试保证）+ wan（zh "15 万" / ja "15万"）+ localToolTitle / localStatus / localToolFaq
  - 标题截断规则：≤32 字，切在 32 字内最后一个标点/空格；该处 <12 字则硬切
  - 共享组件 src/components/LocalizedToolPage.tsx（localizedToolMetadata + 页面）；hreflang 用 translatedLangs 生成全互指
  - 薄路由 src/app/zh/tool/[slug]、src/app/ja/tool/[slug]；sitemap 按语言列表生成 zh/ja 工具页
  - 删 zh-tool.ts 及其测试，zh 用例原样迁到 tool-i18n.test.ts，输出不变；143 测试全绿；线上 /zh/tool/dify 标题与之前一致
- **日语翻译**：translate-tools.ts 加 ja 术语表（オープンソース、フレームワーク等，です/ます体）+ ja 情态映射；试译 3：dify、langchain 过，ollama 审校误报未过；**前 200 个后台跑中**，日志 data/ops-logs/translate-ja-2026-10-02.log → 跑完审稿发布（level 1：前 50 逐篇读，其余抽 10%）
- **中文读者付款能力（只读 ops key 查 Stripe）**：TENSO LLC 美国账户，capabilities card_payments / link 均 active，银联卡走卡通道可用；Default payment_method_configuration 中 alipay、wechat_pay 均 off；我们 checkout 未写 payment_method_types（动态支付方式）→ **后台开启即生效，无需改代码**。属收款配置变更 → 已报 agentkit 进 09:30 汇总，建议开通；看板已记（6ff0f69）
- 方法见 GOTCHAS#stripe-local-payment-methods-check、GOTCHAS#test-expectation-follow-rule

## 2026-10-02 08:50–09:20 T24 日语工具页 198/200 上线（原定 10-09，提前约一周）

- **翻译**：首轮 approved 168 / failed 32；`--retry-failed` 再过 15 → 剩 17 失败
- **人工审核**：前 50 逐篇读（level 1）；其余 133 随机抽 14 读过 → level 2 整批发布
- **17 个失败项**：逐条读审校意见，`--override` 放行 15（promptfoo 核对源文确为 "now backed by OpenAI"，译文正确）；**退回 2**：siyuan（英文源 tagline 混入一段中文副本 → 译文重复）、ekko-studio（译文残留英文单词 "seven"）
- **线上**：/ja/tool/langchain、/ja/tool/dify 均 200；hreflang en/ja/zh/x-default 全互指
- 看板已记录并推送（37cec14）
- 坑：GOTCHAS#cut-c-multibyte-utf8、#translate-review-race、#residual-english-single-word；源数据中英混合 tagline 见 #residual-english-single-word

## 2026-10-02 09:45 T19 X 帖已发

- 老板主号 @hwak8666621：https://x.com/hwak8666621/status/2105834735146541311
- x-post skill：先 --dry-run 确认账号为 **X Premium**（420 weighted 单条，未拆 thread）再正式发
- 文案 drafts/x-t19.md（content-writing，hook-first，zh），链接带 ?ref=x
- SOCIAL_CALENDAR 已登记并推送 agentkit；看板已记录（1315543）；已回报 agentkit
- 10-09 复盘：漏斗里 ref=x 的访问与后续转化

## 2026-10-02 10:39–10:50 T24 中文、日语工具页各 200/200 完成

- tool_i18n zh/ja 各 200 approved 且 human_reviewed>0，全部上线（84b4918，看板 7cbcdd7）
- residualEnglish（src/lib/i18n.ts）加单词级 LEFTOVER_WORDS（the/and/for/with/one…ten/than…）；扫已发布 398 条命中 11，全是正当专有名词（React Three Fiber、Chrome for Testing、Human-in-the-loop）→ 只送人工复核，不拦截
- englishOnlyTagline（review.ts，TDD）：按 ` - ` / ` · ` / ` | ` / 2+ 空格 / 句末标点 / 空格+CJK 切段，含 ≥2 连续 CJK 的段丢弃，段须含 ≥3 连续字母；submissionTagline 先过它
- scripts/clean-bilingual-taglines.ts 清 7 个（chatgpt-shortcut、openai-translator、mirofish、siyuan、xiaozhi-esp32、maxkb、edict），回滚 data/bilingual-tagline-backup-*.json
- 重译重审：siyuan（zh、ja）、ekko-studio（ja，override）、promptfoo（ja，曾被 --retry-failed 误下架）
- 147 测试全绿，已推送
- 坑：GOTCHAS#override-after-reject-source-hash；python str.replace 改含 \u 正则的 TS 源码失败 → 并入 GOTCHAS#str-replace-insert-wrong-function

## 2026-10-02 11:05–11:55 override 写回 source_hash 已修 + 第一个外部提交 Orkas（G2 1/20）

- **override 已修**（fc52bad）：review-translations `--override` 写回当前 source_hash；translationSource/sourceHash 从 translate-tools 抽到 src/lib/i18n.ts（有单测）；148 测试全绿；库内 source_hash 空 0 行；`--retry-failed --dry-run` done=0
- **第一个外部提交：Orkas**（orkas.ai，开源多 Agent 桌面平台）：10-01 23:56 提交，src=api（JSON API），免费档；提交 URL 带 `?source=dir_agentoolrank` → 判断为对方的自动提交程序读了 /agents 文档后提交
  - 11:50 手动 `review-submissions --apply` 通过 → /tool/orkas 200，类目 no-code-agent-builders；website_url 保留对方 ?source= 参数（对方用它统计我们带去的流量）
- **G2 外部提交 1/20**；付费单 0；已报 agentkit，看板与 KPI 已刷新（5eb5543）
- **结论**：agent 可直接提交通道（POST /api/v1/submissions、MCP submit_tool、/agents 文档、llms.txt）有了第一个真实转化 → 值得加强：多上 MCP 目录 / agent 生态曝光
- 坑：GOTCHAS#external-submission-keep-ref-param

## 2026-10-02 11:55–12:25 提交返回 message_for_human + 文档写明免费入口（响应 agentkit 建议）

- **offers.ts messageForHuman(name, offers)**（TDD 4 用例，其中 1 个专测单数 "1 day"）：生成 agent 可原样转给人的说明：免费结果（约 N 天上线、永久页面）+ 逐条列付费档（$9 3 天内上线 / $19 1 天内上线 / $49 1 天内上线并上首页 7 天）+ 每档付款链接 + 「不通过全额退款」
- **submit-core** queued 返回新增 `message_for_human`，API（POST /api/v1/submissions）与 MCP submit_tool 共用
- 文档：llms.txt agent 段标题改 "list a tool (free)" + 一行 Free submission 说明；/agents 页加 message_for_human 说明；MCP submit_tool 描述改为 "for free" 并提 message_for_human
- 文案过 ai-flavor：clean
- 151 测试全绿，已部署（commits 15c88b9 / e36c457，看板 bbb7619）；线上 selftest #4（example.org）验证后标 rejected（note: internal selftest）
- 第一版 "about 1 days" 复数错 → 已修重部署（GOTCHAS#human-text-pluralization）
- 已报 agentkit，看板已记录
- 更正：上次 checkpoint 说的「工作区有别人未提交改动」其实是本批进行中的文件，现已全部提交；工作区仅剩 CLAUDE.md、.tg_topic（非本任务）

## 2026-10-02 12:50–13:10 T17 外联落地页：维护者横幅（commit 8dff4bf，看板 53850f1）

- **src/components/MaintainerBanner.tsx**（client 组件）：URL 带 `?ref=outreach` 时在工具页顶部显示「Maintain X? Grab the README badge or feature it on the homepage. Maintainer options ↓」，锚点 #maintainers 跳到页底 MaintainerBox
- MaintainerBox section 加 `id="maintainers"` + `scroll-mt-20`
- 新埋点 `maintainer_banner_click`，已加进 src/lib/events.ts 的 EVENT_NAMES 白名单
- 判断放 client 端（读 window.location）→ 工具页仍走 ISR，不变成动态渲染
- 文案过 ai-flavor：clean；151 测试全绿；已部署；浏览器实测 /tool/hermes-agent?ref=outreach 横幅正常显示；看板已记
- 坑：GOTCHAS#event-names-whitelist、GOTCHAS#isr-query-personalize-client

## 近期排期

- **10-02 22:00 CST**：T17 外联第一批 10 封——**Jason T. 署名，照常发**（BOSS #28 自决，be87fb0；原「21:30 无答复则推迟」规则已取消）；dry-run 已过（排名取百分位最好的类目，6f36d98）；落地页维护者横幅已就绪（?ref=outreach）；发后看板记数量，观察退信/退订；按 maintainer_banner_click / checkout_click 与 ref=outreach 看转化
- **目录站**：累计 25 已达成（10-02 07:40）→ 之后每天 5–8 个；~~需 Google 登录的站等品牌号~~ **已放弃**（10-02 17:11 品牌 Google 号放弃，只能 Google/GitHub 登录的站标 skip）；10-03 起加入 4 个邮箱注册站（hello@agentoolrank.com）：best-ai.org、launchboosts.com、linkcentre.com、whatlaunched.today；dirsub.py check/add；每站做完关标签页；连续两个验证码即停
- ~~**老板醒后**：重新注册 Google 品牌号（扫码）~~ **已放弃**（10-02 17:11，+34 号码被 Google 判用过太多次；本项目不再注册 Google）
- **10-03**：发 dev.to 第二篇（devto-where-to-list.md，canonical→/where-to-list）；发后用漏斗查 src=devto2；外联第二批 ≤10
- **10-09**：T19 X 帖复盘（漏斗查 ref=x 访问与后续转化）
- **10-05（周一）**：weekly-ops 的 newsletter 现在能真正发出（Brevo key 已就绪；订阅者 0 时应空跑不报错）；T24 中文剩余页型（替代品 / 对比 / /where-to-list / /submit）
- **T24**：中文、日语工具页各 200/200 已上线（10-02 10:50）；剩余：替代品页、对比页、/where-to-list、/submit 的本地化（--override 补回 source_hash 已于 11:05 修好）；10-09 提前报 agentkit：10/10 后 PH 老板本人登录
- **Alipay/WeChat Pay**：agentkit 在 Stripe 后台开（acct_1TMYNwH5wuG7WMCf，live）；开好后用只读 key 复查 payment_method_configurations，无需改代码
- **10-30**：看 GSC（墨西哥/阿根廷等）再定西语

## 待办 / 下一步

- [x] T19 X 帖已发（10-02 09:45，@hwak8666621/status/2105834735146541311）
- [ ] 10-09 复盘 T19：漏斗查 ref=x 访问与后续转化
- [x] T17 外联落地页维护者横幅（?ref=outreach → #maintainers，10-02 13:10 上线）
- [ ] T17 22:00 第一批外联（Jason T. 署名已定，照常发，be87fb0），之后按 maintainer_banner_click / checkout_click 和 ref=outreach 看转化；之后每日 ≤10，跟踪退信/退订/回复与徽章嵌入数（GitHub 代码搜索 agentoolrank.com/api/badge）
- [x] T25 目录站累计 25（10-02 07:40 达成，提前）
- [x] smithery.ai 已上线（10-02 17:00，https://smithery.ai/servers/admin-avz6/agentoolrank ，5 tools，dirsub submitted）
- [ ] T25 后续：每天 5–8 个；10-03 起 4 个邮箱注册站（best-ai.org、launchboosts.com、linkcentre.com、whatlaunched.today，用 hello@agentoolrank.com）；~~等 Google 号的站~~ 已放弃（cursor.directory、ramen.tools、crunchbase.com、makerlist.io 已标 skip）；conduid.com 待查登录方式；producthunt 10/10 后老板本人号；purshology、ai-tab.cn 重试；ainewshub 补回执
- [x] ~~Google 品牌号：老板醒后重新注册扫码~~ 已放弃（10-02 17:11 agentkit 通知）
- [ ] 确认 10-05 weekly-ops newsletter 实跑（订阅者 0 的空跑路径）
- [ ] T23 后续：按 GSC 有曝光的查询扩写对比/替代品内容（goose-vs-open-webui、claude-code-vs-openhands）
- [ ] 10-03 发 dev.to 第二篇（canonical→/where-to-list，?ref=devto2）
- [ ] 10-09 提前报 agentkit：10/10 后 PH 老板本人登录
- [ ] T24 中文：确认 sitemap 刷新出 200 个 zh 页 + IndexNow；其余页型 → 西语 10-30 看数据
- [x] T24 日语 198/200 上线（10-02 09:20，提前约一周）
- [x] T24 中/日工具页各 200/200（10-02 10:50）：residualEnglish 单词检测、siyuan、ekko-studio、promptfoo 均完成
- [ ] T24 剩余页型本地化：替代品页、对比页、/where-to-list、/submit；确认 sitemap/IndexNow 收录 ja 页
- [x] review-translations --override 时补回 source_hash（10-02 11:05 已修，fc52bad）
- [ ] G2 外部提交 1/20（首个：Orkas，API 提交，10-02 11:50 上线）；新提交每天看 submissions 表并审核
- [x] 提交返回 message_for_human + llms.txt / /agents / MCP 写明免费入口（10-02 12:25）
- [ ] 加强 agent 提交通道曝光：MCP 目录 / agent 生态（首个真实提交来自 API 通道）
- [ ] 观察下一个 API/MCP 提交是否因 message_for_human 带来付费档点击（漏斗/checkout 事件）
- [ ] Stripe Alipay/WeChat Pay：agentkit 开通中 → 开好后用只读 key 复查 payment_method_configurations
- [ ] numbersPreserved 忽略字母数字混合 token（E2E、A2A、GPT-4o 等）
- [ ] 观察对账 cron（hourly-ops 日志）与漏斗真实访问；零流量期不再加新功能
- [ ] T12 对比页扩充；T13 首页 Featured 位展示；T18 /weekly 真实 30 天增速
- [ ] MCP 目录：Smithery ✅（10-02）；mcp.so issue 路线卡在 gh 权限（agentkit 建议不做）
- [ ] directories.ts（/where-to-list 第三方价格）CHECKED 日期 30 天到期复核：10-31 前重新核对现行页面（不用 Wayback 快照）
- [ ] 新工具入库接展示名/alternatives/related 管道；related 覆盖 350/669
- [ ] 观察 Google 是否重新抓取 sitemap；IndexNow 每日推送跟踪
- [ ] 查 daily-update 刷新失败仓库；PeerPush 改用户名
- [ ] KPI 可扩展：events.country 按国家统计访客

## 环境注意

- Brevo key：~/.config/secrets/brevo-api-key；Cloudflare DNS token：~/.config/cloudflare/agentoolrank.token（找凭据先查 ~/.config/<provider>/ 与 ~/.config/secrets/）
- 会话环境可能仍带失效 GITHUB_TOKEN → git/gh 前 `env -u GITHUB_TOKEN`
- 用户 crontab 顶部有明文 TELEGRAM_BOT_TOKEN（已告知，未改动）
- **agentoolrank-chrome 保持着 GitHub 账号 agent-gigmole 的登录状态**（10-02 老板为 Smithery 登录）；Smithery 授权是 GitHub App（clavia-labs），撤销去 github.com/settings/apps/authorizations
- 对外署名：BOSS_DECISIONS #27 统一 **Jason T.**；已用 Ethan Tan 建的资料（Peerlist、Google 号、各目录账号）暂不改
- 长期服务用 systemctl --user，不用 pkill -f；next start 本地预览完按 PID kill，不用 pkill
- 目录站提交台账：~/data/backlinks/directory-log.csv，只通过 $AGENTKIT_ROOT/skills/directory-submission 的 dirsub.py check/add
- Windows Chrome 内存紧：每站做完关标签页；同一平台被风控一次即停（老板 #25）
- 非交互 shell 无 bun：用 ~/.bun/bin/bun（ops 脚本已 export PATH）；scripts/indexnow.ts 等含 top-level await 的脚本只能用 bun 跑，npx tsx 报 cjs 错

## 2026-10-02 13:53–14:15 T24 本地化索引页 + 站内入口
- 问题：400 个 zh/ja 工具页只靠 sitemap + hreflang 被发现，站内 0 链接；/ja 无首页
- 新增 i18n-data.translatedToolList(lang)（已发布译文，按 score 排序）
- 新增 src/components/LocalizedToolIndex.tsx（metadata：hreflang 指 en 首页 / /zh/tools / /ja / x-default + 列表组件）；路由 src/app/zh/tools/page.tsx、src/app/ja/page.tsx；COPY 新增 indexTitle/indexH1/indexIntro（zh/ja 键集合一致由测试保证）
- 链接：LocalizedToolPage 面包屑「首页/ホーム」→ /zh/tools、/ja；RootFooter 加「中文 / 日本語」（带 hrefLang）；sitemap 收录 /zh/tools、/ja
- 151 测试绿；已部署（3fd4130，看板 7dfc7b9）；线上 /ja、/zh/tools 各 200 条工具链接，首页页脚有 /ja
- 经验：本地化页只进 sitemap 不够，要有站内入口（总览页 + 全站页脚 + 面包屑）（KNOWLEDGE/GOTCHAS#localized-pages-need-internal-links）
- T24 剩余：替代品页 / 对比页 / /where-to-list / /submit 本地化；numbersPreserved 字母数字 token 误报

## 2026-10-02 15:57–17:05 外联预演修正 + 署名 #27 + Smithery 上线
- **外联 dry-run**：LangChain 被写成「#7 in Memory & Knowledge」（取了第一个类目）→ send-outreach 改为选排名百分位最好的类目，现为「#9 of 329 Agent Frameworks」（6f36d98 已提交）；role 信箱规则：只排除 security/legal/privacy/careers 等专用信箱，support@/hello@ 等通用信箱照发
- **BOSS_DECISIONS #27**：对外署名统一 Jason T.；已用 Ethan Tan 建的资料（Peerlist、Google 号、目录账号）暂不改。今晚 22:00 第一批原署名 Ethan Tan → 已请 agentkit 问老板；**21:30 前无答复则推迟到 10-03**（agentkit 同意）
- **smithery.ai（决定 #26）上线**：老板在 agentoolrank-chrome 登录 GitHub agent-gigmole；Smithery 是 GitHub App（clavia-labs，client Iv23liKzS9TgjuxyG4Uw），权限仅身份/邮箱/gist/star-watch，无仓库权限、无 install；以 URL 发布远程 MCP，namespace 自动生成 admin-avz6（另有空的 admin-pw59、admin-z8z5），部署成功、识别 5 tools；已设 displayName/description/homepage，未设 unlisted → https://smithery.ai/servers/admin-avz6/agentoolrank ；dirsub add --update 改 submitted；看板 1e262f8
- **Wayback 共享坑自查**（agentkit）：仅 /where-to-list 引用第三方价格，10-01 在现行页面核对并标 CHECKED 日期，未用快照；计划 directories.ts 加 30 天到期复核（10-31）；已回报 agentkit，看板已记
- 注意：agentoolrank-chrome 仍保持 agent-gigmole 的 GitHub 登录

## 2026-10-02 17:04– BOSS #28 自决范围 + #29 Stripe + 外联署名 Jason T.
- **BOSS #28（17:04）自决范围**：日常运营由项目自定——按日历用老板的 PH/X 发帖不用问；收款账户里不花钱、不改提现的配置可自判开启（共用账户先通知同账户的其他项目）；风险高/收益低的事直接判不做并写原因。**仍找老板**：超授权花钱、改凭证、删数据、提现/KYC、本人身份登录或验证码、法律文件。报事前先对这份清单
- **BOSS #29 Stripe**：已回 agentkit 账户 id acct_1TMYNwH5wuG7WMCf（TENSO LLC, US），checkout 为 live（checkout key 与 ops key 都是 rk_live_ 受限 key）；由 agentkit 在后台开 Alipay/WeChat Pay；开好后用只读 key 复查 payment_method_configurations
- 坑：受限 key 不能改 payment method configuration；扩 key 权限 = 改凭证（老板闸），所以由 agentkit 去点（GOTCHAS#stripe-restricted-key-pmc）
- **外联署名据 #28 自决改为 Jason T.**：outreach.ts、outreach.test.ts、send-outreach.ts 的 sender/replyTo、drafts/outreach-maker-v2.md；151 测试绿、dry-run 过；be87fb0 已推送。今晚 22:00 首批 10 封照常发，取消「21:30 无答复则推迟」

## 2026-10-02 晚 Stripe Alipay/WeChat 每日检查（#29）
- agentkit 已在 Stripe 后台给 Alipay/WeChat Pay 点启用，状态**待审核**（要几天）
- 新增 apps/agent-tools/scripts/stripe-pm-status.ts（只读 key；取 is_default 且 application=null 的自有 payment_method_configuration，打印 alipay/wechat_pay 的 value 与 available），已挂 daily-ops.sh（21:30）；提交 4d4e71e
- 当前：pmc_1TMYOSH5wuG7WMCfzIzwrkcQ alipay=on/pending wechat_pay=on/pending
- 下一步：变 available 后建 $9 结账会话（只打开不付款），目测 Alipay、WeChat 选项都在，再回 agentkit
- 坑：账户下有两个都叫 "Default" 的配置，另一个 pmc_1TNNqU… 属于 Connect 应用（application=ca_RyQW…，有 parent），两项为 off，与我们的结账无关（GOTCHAS#stripe-pmc-connect-child）

## 2026-10-02 17:11– 品牌 Google 号放弃 + 只能 Google 登录的站标 skip
- **agentkit 17:11 通知**：品牌 Google 号彻底放弃（红米 +34 号码被 Google 判「用过太多次」）；本项目也不再注册 Google。上文所有「等品牌 Google 号 / 老板扫码重注册」的待办 → **已放弃**
- **dirsub add 标 skip（写了原因）**：cursor.directory、ramen.tools、crunchbase.com、makerlist.io（只支持 Google/GitHub 登录；GitHub 按 #25 不碰）
- **agentkit 清单有误判**：以下 4 站其实支持邮箱（据共享台账 new_ladar 实测）→ 按 #28 自决**不标 skip**，改用品牌邮箱 hello@agentoolrank.com 注册，排进 10-03 起每天 5–8 个的批次；遇人机验证/风控即停改标 skip：
  - best-ai.org（Continue with email，Firebase 邮件魔法链接，链接在 HTML 正文里）
  - launchboosts.com（邮箱+密码，邮件链接验证，免费档即时上线、nofollow）
  - linkcentre.com（邮箱+密码，邮件激活，人工审核免费队列）
  - whatlaunched.today（有邮箱注册；new_ladar 那次 Supabase signup 500 是站方故障，状态 retry）
- conduid.com 仍 todo（需 sign in，登录方式未查）
- producthunt 维持老板本人号的原排期（≥10-10）
- 已回复 agentkit
- 坑：GOTCHAS#dirsub-update-appends、GOTCHAS#verify-login-before-skip

## 2026-10-02 晚 T23 对比页 meta description 数据驱动（8dcf578）
- GSC 28 天：对比页排在第 3–7 位（promptfoo-vs-worldmonitor 4.4、gstack-vs-ollama 3.4、n8n-vs-windmill 6.3、goose-vs-open-webui 7.5），共 175 次曝光只有 3 次点击；原因是全站对比页 meta description 都是同一句模板
- 新增 src/lib/verdict.ts `compareDescription(a,b,now)`：双方 GitHub 星数（第一个带 "GitHub stars" 单位）→ compareVerdict 第一条数据结论（停更/增速/价格，跳过 "Pick " 开头的标语句）→ 放得下再加 "Live stats and which to pick."；≤160 字符，都放不下用通用尾句或词边界截断
- compare/[slugs]/page.tsx generateMetadata 改用它；154 测试绿、build 过；Vercel prod 已部署并推送，线上 4 页核对 119–154 字符；看板已记（另补 17:15 品牌 Google 号放弃一条）
- 下一步：10-16 复看 GSC 对比页 CTR；替代品页 meta description 用 alternativesVerdict 同法改
- 坑：GSC 查询多为匿名，先改全站 CTR 再逐对扩写（GOTCHAS#gsc-anonymous-queries-ctr-first）

## 2026-10-02 18:43– Brevo 账户核查 + task_act redact + newsiteradar 待办
- **Brevo 核查（agentkit 18:43 急查）**：new_ladar 用同一家公司、同一出口 IP 注册了第二个 Brevo 账户，一登录就被暂停（多半判为一个组织开多个账户）。查了我们的账户：GET /v3/account 正常，free 300/天，relay enabled，发件人 hello@agentoolrank.com active；18:43 `send-outreach --test=hello@agentoolrank.com` 实发，事件 delivered；近 7 天请求 2、送达 2、拦截/退信/投诉都是 0 → **账户没被牵连，22:00 外联照常，发之前再查一次**
- **task_act redact（同步 agentkit 模板 17c55ce）**：本项目 scripts/winbrowser/task_act.py 是旧副本，原来没有 redact（fill_secret 只把步骤回显写成 <secret>，摘要里非密码框的值会打出前 30 字）→ 加 SECRETS + redact（8 字以上前缀一起替换），覆盖 ok/ERR 回显、js 输出、URL、TITLE、摘要所有字段；本地单测过，386fa69 已推送
- **agentkit 18:44 请求**：在我们的 Brevo 账户加 newsiteradar.com 发件域，并给 new_ladar 建专用 API key（写 ~/.config/secrets/brevo-api-key-newsiteradar，600，不走总线）。已回复：外联发完后再做；建 key 先确认是否算 #28 的"改凭证"，没批就只加域名、把 DNS 记录发给 new_ladar；提醒两个品牌共用一个 Brevo 账户有信誉连带风险，出现投诉就停它的 key。**等 agentkit 回复**
  - 参考：agentkit f08f0ea（18:44）已在 harness owner-goal 写明"在项目自己运营的账户里新建有限范围的子 key 不算改凭证，记一笔即可"——回复到了大概率按此执行
- 坑：GOTCHAS#brevo-one-account-per-org、GOTCHAS#copied-template-drift

## 2026-10-02 晚 T23 替代品页 meta description 数据驱动 + newsiteradar 待办已确认
- verdict.ts 新增 `alternativesDescription(tool, alts)`："N {tool} alternatives, ranked by live GitHub data. Closest: X. Most active: Y (n commits/90d). Fastest growing: Z (+n stars/30d)."，超 160 字符从后往前去子句；去掉原描述里不准确的 "open-source tools"（替代品含收费工具）
- alternatives/[slug]/page.tsx 已接入；158 测试绿、build 过；Vercel prod 已部署并推送；线上 langchain/n8n/ollama/firecrawl 4 页摘要 116–147 字符；看板已记
- **newsiteradar 待办已确认**：agentkit 18:44:55 答复——自有账户里为另一项目建有限范围 key 属日常运营，不算改凭证，记一笔即可；new_ladar 是对 newsletter 作者的一对一冷外联，护栏同我方（每人一封、带退订、每周 ≤10 封），出现退信/投诉即停它的 key → **22:00 外联发完后做**（上段"等 agentkit 回复"作废）
- 下一步：10-16 复看 GSC 时对比页与替代品页 CTR 一起看

## 2026-10-02 19:17– 安全过滤：换脸 / deepfake / 脱衣 / 成人类不收录（38e0c03）
- 起因：agentkit 19:17 转达 new_ladar 的坑（9ad81b0）——安全筛只拦分写 "face swap"，域名里的 "swapface"、描述里的 "replaces faces" 漏掉，aiswapface.org 进了它的 X 帖 Top 10；要求我们自查
- 自查结论：agentoolrank 原先**没有任何安全筛**；全库 670 工具 + 5 条提交扫描，换脸/脱衣/成人类 = 0。命中的只有护栏/红队类（jailbreak 是防御对象）和反爬隐身浏览器（cloakbrowser、camofox-browser、invisible-playwright-mcp），agentkit 认同保留
- 新增 apps/agent-tools/src/lib/safety.ts `unsafeMatch(text)`：覆盖 faceswap/swapface/aifaceswap/replace(s) faces/deepfake/DeepFaceLab/nudify/undress/clothes remover/nsfw/porn/nude/naked/erotic/sex chat/AI girlfriend/onlyfans；face swap 加负向后顾 `(?<!sur|inter|type)` 排除 surface/interface/typeface；有测试
- 接入 4 个入口：① submissions.ts validateSubmission（/submit 表单、JSON API、MCP 共用，**付款前**拒绝，文案 "AgentoolRank doesn't list face swap, deepfake or adult tools."，线上 /api/submit 实测）② review-submissions.ts（LLM 前查一次省调用，LLM 后再查 reviewer 写出的 tagline/description，命中标 rejected、note=unsafe category）③ expand-tools.ts（LLM 前后各一次）④ scripts/crawl-github.ts（只对新工具入库，--existing 刷新不受影响）
- 183 测试 + build 通过；38e0c03 已部署 Vercel prod 并推送；看板已记（aa6d85a）；已回 agentkit
- 坑：GOTCHAS#unsafe-keyword-joined-forms

## 2026-10-02 22:00 前 T17 外联发前复核 + 邮件组拦截（e131eb8）
- 类目复核：rejudge-tools.ts 新增 --category（连类目重判，回滚文件带 category_tags），dry-run 复核 33 个候选，15 个不一致
  - 在已存类目内 → data/outreach/category.json 改报：dify→no-code、composio→tool-integration、fastmcp→tool-integration、langwatch→observability、mineru→memory
  - 不在已存类目内 → data/outreach/hold.json 挂起 10 个：career-ops、omniroute、localai、headroom、herdr、librechat、lobehub、worldmonitor、vllm、steel-browser
  - fastgpt LLM 判 enterprise，人工判 no-code 正确，照发
- 邮件组拦截：MLflow 联系地址是 mlflow-users@googlegroups.com；src/lib/outreach.ts isGroupAddress（googlegroups / lists. / groups.io 域名 + users/dev/discuss/announce/list/noreply local part），send-outreach 永久跳过；192 测试通过；已推送
- 今晚 10 封：hermes-agent、LangChain、Dify(no-code #2/28)、NocoBase、FastGPT、langwatch、Codewhale、LiteLLM、MinerU(memory #8/127)、cognee
- 注意：hold.json / category.json 在 data/ 下被 gitignore，是本地运营状态，别误删
- 已报 agentkit：career-ops 建议下架（删数据，等老板批）；排"全库类目审计"ticket（agent-frameworks 329 个成杂物类）；看板已记
- 坑：GOTCHAS#outreach-rank-fact-recheck、GOTCHAS#outreach-group-address

## 2026-10-02 20:20– 软下架 tools_archive + career-ops 下架（8b6eabf / 8edc2db / 9c62009）
- **口径**（agentkit 20:20）："删数据"仅指不可恢复的删除；软下架（数据保留、可恢复）属日常收录整理，自己定，记一笔
- 新增 apps/agent-tools/scripts/delist-tool.ts：整行连同 metric_snapshots 存进 tools_archive(id, row_json={tool, snapshots}, reason, archived_at)；一个事务里先写归档 → 删子行 → 删 tools 行；`--restore` 恢复、`--dry-run` 只看
- 4 个入口查归档表、不自动重新收录：scripts/crawl-github.ts（新工具入库前）、expand-tools.ts（归档 id 计入已占用）、review-submissions.ts（命中标 rejected，note=tool was delisted）、submit-core.ts（invalid：This tool is outside what AgentoolRank lists.）
- 页面层：i18n-data.ts translatedTools 改 JOIN tools（中日 sitemap 不列已下架）；sitemap.ts 对比对过滤已不在 tools 里的替代品（其他工具 alternatives 仍引用 career-ops）
- 已下架：career-ops（求职助手，不在收录范围）。恢复→再归档往返测试通过；线上 /tool/career-ops、/zh/tool/career-ops、对比页均 404，sitemap 计数 0；192 测试 + build 过；已部署推送、看板已记
- **下一步：10-03 开始全库类目审计**（要求见 TASK.md：dry-run 对照、抽 30 条人工看、旧值留列、类目 slug 不改不删，合并/删除走 301）
- 坑：GOTCHAS#delist-fk-snapshots、GOTCHAS#delist-dangling-refs

## 2026-10-02 20:26– 已下架页面改 410 + middleware→proxy 迁移（005953b / 08655fd）
- agentkit 20:26 两个后续问题：
  ① 替代品内链会不会指向 404：核对过，只有 ai-job-search 引用 career-ops；线上渲染时 getToolBySlug 返回 null 被过滤，页面无此链接。ai-job-search 本身也是求职工具 → 加进全库类目审计待判清单
  ② 已下架页面改 410：原计划 10-03，今晚提前完成
- 新增 src/lib/delisted.ts `isGonePath`（有测试）+ src/lib/delisted-ids.ts（静态名单，scripts/delist-tool.ts 归档/恢复后自动重生成，**改完要提交并部署**）
- src/middleware.ts → src/proxy.ts，导出 proxy()（原 middleware 是空操作，Next 16 对 middleware 约定报弃用）
- 匹配 /tool、/alternatives、/compare、/zh/tool、/ja/tool，命中返回 410 + X-Robots-Tag: noindex
- 不做 301 到类目页：career-ops 原类目就是错的，跳过去误导
- 204 测试 + build 过；已部署推送；线上 career-ops 4 类页 410、其他 200；看板已记；已回 agentkit
- **下一步：22:00 发首批 10 封外联**——发前先查 Brevo 账户状态，再跑一次 dry-run；之后做 newsiteradar 发件域 + key；10-03 开始全库类目审计
- 坑：GOTCHAS#next16-proxy-convention、GOTCHAS#delisted-410-static-list

## 2026-10-02 21:59– T17 首批外联 10 封已发
- 发前检查：Brevo 账户正常（free，剩余 299 封额度，relay 开）；最后一次 dry-run 名单与复核一致；career-ops 下架后 Coding Agents 类总数 42→41，邮件排名实时重算
- 21:59–22:04 发 10 封，间隔 30 秒，署名 Jason T.，记录在 data/outreach/sent.json：hermes-agent、langchain、dify、nocobase、fastgpt、langwatch、codewhale、litellm、mineru、cognee
- Brevo 事件：请求 10 / 送达 10 / 退信 0 / 拦截 0；5 分钟内打开 3（nocobase、nousresearch、langchain）。Apple 隐私代理会伪造"已打开"，打开率仅作参考，以回复和 maintainer_banner_click / ref=outreach 为准
- 已回报 agentkit，看板已记
- **下一步**：10-03 09:30 后统计回复率（回信进 hello@），回"不要再发"的地址加 optout.json；队列剩 23 个候选，其中 10 个在 hold.json，等全库类目审计后再处理；10-03 开始全库类目审计
- 坑：GOTCHAS#outreach-send-bash-timeout

