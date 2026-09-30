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
- 运营看板 docs/ops/overview/index.html（已 commit），0.0.0.0:8792 nohup python http.server → http://moneyflow-wsl.tailf1c73f.ts.net:8792/（重启机器需重起）
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

## 进行中 / 下一步（goal 模式：T4–T8 待做）

- [ ] T4 公开 JSON API /api/v1/tools
- [ ] T5 MCP 服务器 /api/mcp
- [ ] T6 审核脚本 review-submissions
- [ ] T7 本地每日 enrich（新工具展示名 + alternatives）
- [ ] T8 related_tools 填充
- [ ] 查 daily-update 463/464 中失败的 1 个仓库
- [ ] X 首帖：等用户在 Telegram 确认后再发
- [ ] Product Hunt：用户个人号（Google 登录 tensam.th@gmail.com），10/10 后再用
- [ ] PeerPush 改用户名（@hello2502）；其余目录提交
- [ ] 看板接入漏斗数据

## 等待用户（跨项目资源必须用户本人发放）

- X 首帖确认（草稿已在 Telegram）
- Stripe：是否共用 TENSO LLC + 建受限 key（T10）
- 重复工具删除批准（T11：embedchain≡mem0、gpt-index≡llama-index）
- Cloudflare zone token；个人 Reddit / HN 账号是否可用

## 旧待办（降级）

- 对比页 "X vs Y" 继续扩充（唯一有效 SEO 页型）；类目过粗
