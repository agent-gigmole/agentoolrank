# TASK.md — 当前任务

## 当前阶段

运营观察期（Phase 5 基本完成，等待 GSC 数据积累）

## 目标

等待 Google 索引数据积累 1-2 周，根据数据调整 SEO 策略；观察 AI 搜索使用情况，优化推荐质量。

## 已完成阶段

- [x] Phase 1: 数据引擎（爬虫 + 排名 + 基础页面 + 部署）
- [x] Phase 2: 完整 MVP（LLM 内容 + 对比页 + SEO + GSC）
- [x] Phase 3: 增长引擎（扩充 463 工具 + 开源仓库 + Newsletter + Weekly + 趋势图）
- [x] Phase 4: Stack Graph（15 个场景 + AI 搜索初版）
- [x] Phase 5 计划：CEO 审查完成，Spec 定稿

## Phase 5 — Phase 1: AI 核心 ✅

- [x] Turso 全量迁移（本地 SQLite → Turso 云端）
- [x] AI 搜索核心代码（DeepSeek + AI SDK v6 + 流式响应）
- [x] 搜索页接入 AI 实时 stack 生成
- [x] Vercel 部署 + 环境变量配置

## Phase 5 — Phase 2: 对话式搜索体验 ✅

- [x] 流式响应 UI（SSE/streaming）— 分阶段状态指示器
- [x] 搜索页重设计（AI-first 对话框 + 实时结果）
- [x] UX 修复（工具链接新窗口打开 + 防止后退重复生成）
- [x] DeepSeek provider 修复（Responses API → Chat Completions API）
- [x] convertToModelMessages 转换（UIMessage → ModelMessage）
- [x] 前端 /browse 自测验证通过
- [x] UTM 追踪（所有外链加 utm_source=agentoolrank）
- [x] IP 限流（每 IP 每天 20 次）
- [x] 两阶段对话（AI 先问 3-5 问题再推荐）
- [x] 防闲聊边界控制
- [x] GSC API 接入（Service Account + gsc-report.ts）
- [x] CI 修复（bun.lock + Turso 同步 + contents:write 权限）

## 运营阶段待办

- [ ] 等 GSC 数据积累 1-2 周（当前 739 URL 发现，0 索引）
- [ ] 根据 GSC 索引数据分析哪些页面类型优先被索引
- [ ] 观察 AI 搜索使用数据，优化推荐质量
- [ ] 考虑 backlink 建设策略（开源仓库、社区分享等）

## Phase 5 — Phase 3: UGC + 收尾（可选，按需启动）

- [ ] 用户评价系统（工具评分 + 评论）
- [ ] 社区功能（用户提交工具 + 投票）
- [ ] 性能优化（缓存策略 + embedding 预计算）
- [ ] 监控 + 分析（搜索质量指标 + 用户行为）

## 阻塞项

- GSC 索引需要时间（新站 1-2 周正常）
