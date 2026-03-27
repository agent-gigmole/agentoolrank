# STATE.md — 当前状态

## 已完成

- AgentKit 框架部署
- gstack 工具集安装
- /office-hours 产品设计（设计文档 APPROVED）
- /autoplan 三阶段审查（CEO + Design + Eng，25 个决策）
- Next.js 15 + Tailwind v4 项目初始化
- Zod 数据契约 + Turso/SQLite 数据库 schema
- 11 个 Agent 工具分类（调研驱动）
- GitHub GraphQL 爬虫 + 44 个种子工具入库
- Percentile rank 排名算法
- LLM 内容生成（43/44 工具，via Claude Code Max plan）
- 9 个页面路由（首页/分类/详情/对比/搜索/新增/sitemap/robots/404）
- 全局导航 + newsletter email capture（前端）
- GitHub Actions daily cron workflow
- 域名 agentoolrank.com 注册（Cloudflare）
- Vercel 部署上线 + Cloudflare DNS
- Google Search Console sitemap 提交成功（58 页发现）
- Telegram topic「目录站」绑定
- 批量工具扩充：44 → 578 个工具入库
  - discover-repos.ts: GitHub Search API + awesome-list 爬取 + curated 列表
  - crawl-github.ts --discovered 模式批量爬取（716/740 成功）
  - cleanup-tools.ts 过滤非工具/低星/重复项（删除 138 个）

## 进行中

- 535 个工具 pending LLM 内容生成（578 总工具 - 43 已有内容）
- inferCategories 分类精度低（365/578 归到默认 agent-frameworks），需改进

## 已知最佳结果

- 站点在线：https://agentoolrank.com
- 578 个工具入库，43 个有完整 LLM 内容
- Top 3: n8n (★181k), dify (★135k), langchain (★131k)
- Google Search Console: 58 页已发现（待重新提交 sitemap 反映 578 工具）

## 下一步

- P0: LLM 批量生成 535 个工具的内容
- P0: 改进 inferCategories 分类准确度（正则太粗糙）
- P0: 修复 slug 冲突问题（makeSlug 改用 owner-name 格式）
- P1: 自动生成 50+ 热门对比页
- P1: 重新提交 sitemap 到 Google Search Console
- P2: 开源爬虫获取 backlinks
