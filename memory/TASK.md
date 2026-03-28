# TASK.md — 当前任务

## 当前阶段

Phase 5: AI-First 搜索推荐体验

## 目标

将现有关键词搜索升级为 AI-First 对话式搜索推荐体验，包含语义搜索、流式响应、多轮对话、个性化推荐。

## 已完成阶段

- [x] Phase 1: 数据引擎（爬虫 + 排名 + 基础页面 + 部署）
- [x] Phase 2: 完整 MVP（LLM 内容 + 对比页 + SEO + GSC）
- [x] Phase 3: 增长引擎（扩充 463 工具 + 开源仓库 + Newsletter + Weekly + 趋势图）
- [x] Phase 4: Stack Graph（15 个场景 + AI 搜索初版）
- [x] Phase 5 计划：CEO 审查完成，Spec 定稿

## Phase 5 — Phase 1: AI 核心

- [ ] Turso 全量迁移（本地 SQLite → Turso 云端）
- [ ] Embedding 生成（所有工具的 description/tagline 向量化）
- [ ] SQLite 列存储 embedding（BLOB 列 + 暴力扫描）
- [ ] 语义搜索 API 端点（/api/semantic-search）
- [ ] AI Gateway OIDC 认证配置
- [ ] 搜索结果融合（关键词 + 语义 hybrid search）

## Phase 5 — Phase 2: 对话式搜索体验

- [ ] 流式响应 UI（SSE/streaming）
- [ ] 搜索页重设计（AI-first 对话框 + 实时结果）
- [ ] 多轮对话上下文管理
- [ ] Stack 推荐整合（搜索 → 自动推荐相关 Stack）
- [ ] 个性化推荐（基于浏览历史/偏好）

## Phase 5 — Phase 3: UGC + 收尾

- [ ] 用户评价系统（工具评分 + 评论）
- [ ] 社区功能（用户提交工具 + 投票）
- [ ] 性能优化（缓存策略 + embedding 预计算）
- [ ] 监控 + 分析（搜索质量指标 + 用户行为）
- [ ] 文档更新 + 部署收尾

## 阻塞项

- 无（计划已定稿，可开始实施）
