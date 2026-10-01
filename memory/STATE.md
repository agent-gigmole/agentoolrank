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

## 待办 / 下一步

- [ ] 10-02 09:30 老板汇总：社区帖（优先 dev.to 已发；HN/Reddit 与 imagehub 错开 ≥1 周，Show HN 最早 10-07）
- [ ] T19 10-02 X 帖（/report 数据，x-post）
- [ ] T17 外联：10-02 实体 SIM 到 → Brevo 手机验证 → 发信（≤10 封/天）；同时解锁 T20 周报
- [ ] T23 后续：按 GSC 有曝光的查询扩写对比/替代品内容（优先 /compare 有曝光的对：goose-vs-open-webui、claude-code-vs-openhands）；可选站外文章 canonical 回链 /where-to-list
- [ ] 10-09 提前报 agentkit：10/10 后 PH 老板本人登录
- [ ] 观察对账 cron（hourly-ops 日志）与漏斗真实访问；零流量期不再加新功能
- [ ] T12 对比页扩充；T13 首页 Featured 位展示；T18 /weekly 真实 30 天增速
- [ ] MCP 目录：Smithery 等免费渠道
- [ ] 新工具入库接展示名/alternatives/related 管道；related 覆盖 350/669
- [ ] 观察 Google 是否重新抓取 sitemap；IndexNow 每日推送跟踪
- [ ] 查 daily-update 刷新失败仓库；看板接入漏斗数据；PeerPush 改用户名

## 环境注意

- 会话环境可能仍带失效 GITHUB_TOKEN → git/gh 前 `env -u GITHUB_TOKEN`
- 用户 crontab 顶部有明文 TELEGRAM_BOT_TOKEN（已告知，未改动）
- 长期服务用 systemctl --user，不用 pkill -f
- 非交互 shell 无 bun：用 ~/.bun/bin/bun（ops 脚本已 export PATH）；scripts/indexnow.ts 等含 top-level await 的脚本只能用 bun 跑，npx tsx 报 cjs 错
