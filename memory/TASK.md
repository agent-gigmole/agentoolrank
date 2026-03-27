# TASK.md — 当前任务

## 当前任务

P0: 剩余 LLM 内容生成 + SEO 冷启动

## 目标

377 个工具完成 LLM 内容生成，重新提交 sitemap（648 URL），开源爬虫获取 backlinks

## 已完成步骤

- [x] AgentKit 框架部署
- [x] gstack 安装
- [x] /office-hours 设计文档
- [x] /autoplan 三阶段审查
- [x] 确定待决问题（域名 agentoolrank.com、11 个分类、英文优先）
- [x] 初始化 Next.js 项目
- [x] 设计数据模型（Zod schema + SQLite）
- [x] 实现核心页面路由（首页/分类/详情/对比/搜索/新增）
- [x] 搭建数据采集管道（GitHub GraphQL 爬虫 + 排名算法）
- [x] LLM 内容生成（43/44 工具 via Claude Code CLI）
- [x] SEO 配置（sitemap + robots + JSON-LD）
- [x] Vercel 部署 + Cloudflare DNS
- [x] Google Search Console sitemap 提交
- [x] 扩充到 200+ 工具（实际 463 个，五步管道：发现→爬取→清理→过滤→分类）
- [x] 自动生成 50+ 热门对比页（实际 170 个对比页 + 索引页）
- [x] LLM 批量生成部分工具内容（86/463 完成）

## 待完成步骤

- [ ] LLM 批量生成剩余 377 个工具内容
- [ ] 重新提交 sitemap 到 Google Search Console（648 URL）
- [ ] 开源爬虫到 GitHub 获取 backlinks
- [ ] Supabase 迁移（解决 SQLite/Vercel 架构问题）
- [ ] Newsletter 后端（接通 email capture）
- [ ] 详情页 star velocity 趋势图
- [ ] 自动化 "AI Agent Weekly" 周报
- [ ] 扩展第二个行业维度

## 阻塞项

- 无
