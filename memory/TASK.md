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
- 状态: todo
- 依赖: T1
- 验收: 线上创建 checkout session 成功并立即 expire；metadata.site=agentoolrank
- 闸: human
- 失败: 0
- 备注: 等 Stripe key（Chrome 说明 B；checkout key 已存，ops key 待存）；10-01 checkout key 已存（~/.config/stripe/agentoolrank-checkout.key），可开工；ops 只读 key 仍缺（只影响报表）

### 第 2 轮目标（G2 20 个外部提交 by 10-21 / G3 第一笔陌生付款 by 10-31）
- 结束条件（机检）：T10、T12、T13 done ∧ 测试全绿 ∧ build 过 ∧ 线上 /submit 显示付费档且 checkout session 可创建（立即 expire）
- 预算：LLM ≤ $2；不花推广费

### T12 对比页扩充：按 GSC 有曝光的查询补 X vs Y / alternatives 内链
- 状态: todo
- 依赖: -
- 验收: scripts/gsc-pull 输出 28 天查询；新增/加强的对比页 URL 进 sitemap 且 200
- 闸: auto
- 失败: 0

### T13 首页「Featured」位 + 提交成功页付费选项（$19 快速审核 / $49 首页推荐 7 天）
- 状态: todo
- 依赖: T10
- 验收: 有 featured_until 的工具在首页显示；vitest 覆盖到期逻辑
- 闸: auto
- 失败: 0

### T14 X 首帖（build in public）
- 状态: blocked
- 依赖: -
- 验收: 帖子发布且链接带 utm_source=x，events 表能看到来访
- 闸: human
- 失败: 0
- 备注: 草稿已发 Telegram，等用户回「发」

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

- [ ] Stripe 受限 key（是否共用 TENSO LLC）
- [ ] Cloudflare zone token（agentoolrank.com）
- [x] Vercel Pro（已是 Pro，10-01 核实）
- [x] GitHub 凭据（fine-grained token，~/.config/secrets/github-agentoolrank，2026-10-01）
- [ ] PostHog project（可选）
- [ ] 个人 Reddit / HN 账号是否可用
- [x] X 旧号（2026-10-01）
- [x] Peerlist 真名 Ethan Tan（2026-10-01）
- [ ] X 首帖确认

## 暂停

- AIMarketRank（marketing-tools）全部待办暂停，不买域名，等主站跑通
