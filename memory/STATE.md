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
- **阻塞：GitHub 凭据失效**（git push / gh / env GITHUB_TOKEN 全 401）→ 本地 7+ commit 未 push，无法重启 daily-update
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
- **GitHub 仍无法 push**，部署仍走 CLI 本地部署

## 进行中 / 下一步

- [ ] 每日管道接入 generate-alternatives + generate-display-names（新工具入库仍是仓库名、无替代品）
- [ ] 审核脚本 review-submissions（处理 submissions 队列）
- [ ] /api/e 自建分析（服务端转发、webdriver 不上报、UTM 带进 Stripe metadata.src）
- [ ] MCP 服务器 / API
- [ ] 重复工具清理（待用户批准删数据）：embedchain≡mem0、gpt-index≡llama-index 指向同一仓库
- [ ] 把 AgentoolRank 免费提交到 PeerPush / Peerlist 等目录

## 等待用户（跨项目资源必须用户本人发放）

- Stripe：是否共用 TENSO LLC + 建受限 key（checkout 用 statement_descriptor_suffix ≤22 字符 + metadata.site）
- Cloudflare zone token（agentoolrank.com 在 CF 账户 Tensam.th@gmail.com，账户已定位）
- **GitHub 凭据（gh auth / PAT）→ push + 重新启用 daily-update**（最高优先）
- PostHog project（如不用自建 /api/e）
- 个人 Reddit / HN 账号是否可用于发帖

## 旧待办（降级）

- 对比页 "X vs Y" 继续扩充（唯一有效 SEO 页型，优先级上升）
- agent-tools Launch Day 3-7 社区分享
