# PROJECT.md — 目标 / 约束 / 验收标准

## 目标

构建 AI Agent 工具导航站，通过数据驱动 + LLM 自动化内容生产，靠 SEO 吸引流量变现。垂直方向：AI Agent 工具。

## 必须复现的来源

- 对标站点：theresanaiforthat.com（780万月访问）、toolify.ai（510万月访问）、futurepedia.io
- 灵感线索 #10

## 约束

- 不做"测评网站"，做"数据驱动的导航站"
- 不手动编写工具数据 — 自动采集 + LLM 生成
- 不追求工具数量（28000+），追求筛选质量和数据新鲜度
- 技术栈锁定 Next.js + Tailwind + Vercel

## 成功标准

- 核心三页面（首页/分类页/详情页）可正常渲染且 SEO 友好
- 工具数据管道可运行：爬取 → LLM 生成 → 入库
- 每日自动更新数据
- Google 可索引所有详情页
- 第1个月有自然搜索流量进入

## 阶段规划（Roadmap）

### Phase 1: 数据引擎 ✅
> 基础版上线，验证管道可行性

- 爬虫 + GitHub GraphQL API 数据采集
- Percentile rank 排名算法
- 基础页面（首页/分类/详情）
- Vercel 部署 + 域名

### Phase 2: 完整 MVP ✅
> 内容补全 + SEO 基础设施

- LLM 内容生成管道（461/463 工具 via claude -p）
- 对比页（261 个 "X vs Y" 长尾 SEO 页面）
- SEO 配置（sitemap/robots/JSON-LD/面包屑/内链）
- Google Search Console 提交

### Phase 3: 增长引擎 ✅
> 扩量 + 留存 + 外链

- 工具扩充 44 → 463（五步管道：发现→爬取→清理→过滤→分类）
- 开源数据集仓库（backlinks）
- Newsletter 后端（email capture + 订阅 API）
- AI Agent Weekly 周报页
- Star Growth 趋势图
- 自动 ping Google sitemap

### Phase 4: Stack Graph ⬜ ← 当前
> 核心差异化 — 按任务/场景展示工具组合

竞品只告诉你"有什么工具"，Stack Graph 告诉你"搭建 X 需要哪些工具组合"。

核心概念：
- 用户选择一个任务/场景（如"搭 RAG chatbot"、"自动化代码审查"）
- 展示完成该任务需要的工具栈（framework + vector DB + embedding + UI + deploy）
- 每个位置推荐 2-3 个可选工具，附带对比链接
- 工具栈数据由 LLM 生成 + 人工审核
- 参考：Best of JS 的 stack 概念

产出页面：
- `/stack` — Stack Graph 索引（所有场景列表）
- `/stack/[slug]` — 具体场景的工具组合图

SEO 价值：
- 长尾关键词："best tools for building RAG chatbot"、"AI agent tech stack"
- 结构化数据增强（HowTo schema）
- 内链网络加密（每个 stack 链接到 5-8 个工具详情页）

### Phase 5: 行业维度 ⬜
> 从纯 Agent 工具 → 叠加行业视角

- 新增行业分类维度（电商 AI / 金融 AI / 教育 AI / 医疗 AI）
- 同一工具可以出现在多个行业场景下
- 行业专属 Stack Graph（"电商客服 AI 技术栈"）
- 行业报告页面（行业趋势 + 工具推荐）
- 变现切入点：行业定向广告 + 付费推荐位
