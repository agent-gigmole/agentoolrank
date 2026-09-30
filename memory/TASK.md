# TASK.md — 当前任务

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
- [ ] **阻塞：GitHub 凭据 → push 本地 7+ commit + 重新启用 daily-update 定时任务**（数据自 03-31 冻结）
- [x] 填充 tools.alternatives（460/464，2026-10-01）
- [ ] related_tools 填充 + 细化类目
- [x] /llms.txt + vitest 测试基建（2026-10-01）
- [x] 展示名修正（276 条，README 证据 + LLM）（2026-10-01）
- [ ] 每日管道接入 alternatives + 展示名脚本（新工具入库仍是仓库名）
- [ ] 重复工具清理（embedchain≡mem0、gpt-index≡llama-index，删数据待用户批准）

- [ ] /api/e 自建分析端点（服务端转发，过滤 webdriver，记录 UTM）
- [ ] 前端埋点：访问 → 提交页 → 提交 → 付款 四步事件
- [ ] 看板接入漏斗数据
- [ ] 把 AgentoolRank 免费提交到 PeerPush / Peerlist 等目录

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
- [ ] GitHub 凭据（push + Actions）
- [ ] PostHog project（可选）
- [ ] 个人 Reddit / HN 账号是否可用

## 暂停

- AIMarketRank（marketing-tools）全部待办暂停，不买域名，等主站跑通
