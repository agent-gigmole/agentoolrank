# Launch Strategy — agentoolrank.com

> 日期：2026-03-30
> 产品：AI Project Blueprint Generator
> 定位：输入你想做的项目 → AI 出完整蓝图（执行计划 + 工具栈 + 风险提示 + 成本估算）

---

## 产品定位

- **核心价值：** 不是工具列表，是"从想法到执行方案"的一步生成
- **受众：** 独立开发者、AI 创业者、技术决策者、想用 AI 改造业务的中小企业
- **差异化：** TAAFT/Toolify 只做单工具推荐，没人做 Blueprint
- **数据基础：** 463 个 AI 工具，每日 GitHub 爬取更新

---

## ORB 渠道框架

### Owned（自有）
- 站点 agentoolrank.com
- Newsletter 后端（已建，0 订阅者）
- Weekly 页面
- GitHub 开源仓库 awesome-ai-agent-tools

### Rented（租用）
- Twitter/X（个人号 @hwak8666621，Premium）
- Reddit（r/artificial, r/SideProject）
- Hacker News

### Borrowed（借用）
- 工具方转发（Featured 邮件）
- Product Hunt launch
- 后续：播客、Newsletter 互推

---

## 两周执行计划

### Week 1：冷启动

| Day | 行动 | 渠道 | 目标 |
|-----|------|------|------|
| Day 1 | X Article 长文发布（已发） | Twitter/X | 首帖引流 |
| Day 1 | 置顶帖子 + 自己回复补链接 | Twitter/X | 提高点击 |
| Day 2 | Data Story 长文（463 工具数据分析） | Twitter/X | 数据权威性 |
| Day 2 | 给 top 30 工具方发 Featured 邮件 | Email | 反链 + 转发 |
| Day 3 | Reddit 帖子 r/artificial | Reddit | 技术社区 |
| Day 4 | Reddit 帖子 r/SideProject | Reddit | 独立开发者 |
| Day 5 | Show HN | Hacker News | 开发者流量 |
| Day 6 | LinkedIn post | LinkedIn | B2B 决策者 |
| Day 7 | 总结 Week 1 数据，调整策略 | - | 复盘 |

### Week 2：Product Hunt Launch

| Day | 行动 |
|-----|------|
| Day 8-9 | 准备 PH listing（tagline、截图、demo GIF、maker comment） |
| Day 10 | **Product Hunt Launch Day** — 全天在线回复 |
| Day 11 | 发 "thank you" 帖 + 分享成绩 |
| Day 12 | 给所有 PH 互动者发 follow-up |
| Day 13-14 | 转化互动者为 Newsletter 订阅 |

---

## 社交内容计划

### Content Pillars

| Pillar | 占比 | 内容 |
|--------|------|------|
| AI 工具洞察 | 35% | 工具对比、趋势数据、新工具发现 |
| Blueprint 展示 | 30% | 用户生成的蓝图展示 |
| Behind the scenes | 20% | 建站过程、技术细节 |
| 互动 | 15% | 投票、"你会怎么选" |

### 已准备的发帖内容

#### X Article（已发）
"I built a tool that turns 'I want to build X' into a complete AI project blueprint..."

#### Data Story（Day 2）
"I crawled 463 AI agent tools and ranked them by real GitHub activity..."
- Top 5 by stars
- Star velocity vs star count
- CTA: agentoolrank.com

#### Reddit（Day 3-4）
Title: "I built a free AI Blueprint Generator — describe your project, get a complete execution plan"

#### Show HN（Day 5）
Title: "Show HN: AI Blueprint Generator – describe your project, get execution plan + tool stack"

#### LinkedIn（Day 6）
"I spent a weekend building something I wish existed when I started my last AI project..."

---

## Featured 邮件模板

Subject: Your tool [TOOL_NAME] is featured on AgenTool Rank

```
Hi [NAME],

I'm building agentoolrank.com — a data-driven directory of AI agent tools,
ranked by real GitHub activity.

[TOOL_NAME] is in our database with [STARS] stars and is recommended in
[N] AI project blueprints.

Your tool page: https://agentoolrank.com/tool/[SLUG]

We have a "Featured on AgenTool Rank" badge you can add to your site/README:

<a href="https://agentoolrank.com/tool/[SLUG]">
  <img src="https://agentoolrank.com/api/badge/[SLUG]"
       alt="Featured on AgenTool Rank" />
</a>

No obligations — just thought you'd like to know.

Best,
Ethan
```

---

## 每日互动策略（10 分钟/天）

1. 回复自己帖子下的所有评论（3 分钟）
2. 搜索 AI tools / AI agent / tech stack 热帖（2 分钟）
3. 在 3-5 条热帖下写有价值的评论（5 分钟）
4. 评论要自然，不要硬推产品。先提供价值，偶尔提到"I built something for this"

---

## 徽章系统

API 已就绪：`/api/badge/[slug]`

嵌入代码：
```html
<a href="https://agentoolrank.com/tool/n8n">
  <img src="https://agentoolrank.com/api/badge/n8n"
       alt="Featured on AgenTool Rank" />
</a>
```

---

## 成功指标

### Week 1 目标
- X 帖子 impressions > 1,000
- 站点访问 > 100
- 至少 5 个工具方回复 Featured 邮件
- Reddit/HN 帖子 upvotes > 10

### Week 2 目标（Product Hunt）
- PH 当日 upvotes > 50
- 站点访问 > 500
- Newsletter 订阅 > 20
- 至少 3 个用户保存 Blueprint

### 月度目标
- GSC 索引 > 100 页面
- 自然搜索展示 > 500/天
- 首个点击来自 Google

---

## 执行日志

| 日期 | Day | 行动 | 渠道 | 链接 | 结果 |
|------|-----|------|------|------|------|
| 2026-03-30 | Day 1 | X Article 长文发布 + 置顶 | Twitter/X | https://x.com/hwak8666621/status/2038590711692419480 | 待观察 |

---

## 技术资产已就绪

- [x] AI Builder（Blueprint 格式）
- [x] 72 个预生成 stacks
- [x] OG 动态图（/api/og）
- [x] 徽章 API（/api/badge/[slug]）
- [x] UTM 追踪（所有外链）
- [x] GSC API 接入
- [x] Daily update CI
- [x] Rate limiting（20/IP/天）
