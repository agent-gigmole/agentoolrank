# Tool Intelligence Layer — 工具深度分析计划

## 目标

为每个工具生成结构化"智能档案"，让 AI 推荐时不只看名字和简介，而是真正了解每个工具能做什么、怎么集成、有什么限制。

## 当前问题

AI 推荐时只能看到：
```
n8n | Fair-code workflow automation | open-source | ★181k | Pros: 可视化 | Uses: 自动化
```

不知道：
- n8n 能原生集成哪些服务
- 支持什么编程语言 SDK
- 部署方式（Docker/Cloud/Self-hosted）
- 免费版有什么限制
- 和竞品的关键区别

## 方案

### 数据采集

对每个工具，读取以下来源：
1. GitHub README.md（最重要 — 功能描述、安装方式、集成列表）
2. GitHub repo 的 package.json / requirements.txt（判断技术栈）
3. 官网首页（定价、特性列表）

### 输出格式

每个工具生成一个 JSON 档案：

```json
{
  "tool_id": "n8n",
  "intelligence": {
    "capabilities": ["workflow automation", "API integration", "webhook triggers", "scheduled tasks"],
    "integrations": ["shopify", "stripe", "slack", "github", "google-sheets", "postgres"],
    "sdk_languages": ["typescript", "javascript"],
    "deployment": ["self-hosted", "cloud", "docker"],
    "pricing_detail": {
      "free_tier": "Community edition, unlimited workflows, self-hosted",
      "paid_starts_at": "$20/mo for cloud hosted"
    },
    "limitations": ["Cloud version has execution limits", "Complex workflows need technical knowledge"],
    "best_for": ["Non-technical automation", "Connecting multiple SaaS tools", "ETL pipelines"],
    "not_for": ["Real-time streaming", "Sub-second latency requirements"],
    "key_differentiator": "Visual workflow builder with 400+ pre-built integrations, fair-code license"
  }
}
```

### 存储

- DB: tools 表加 `intelligence` TEXT 列（JSON）
- 或者单独的 `tool_intelligence` 表

### 使用

推荐时，从 DB 读取 intelligence 字段，替代现在的一行 tagline：
```
n8n | Capabilities: workflow automation, API integration | Integrations: shopify, stripe, slack | Deploy: self-hosted/cloud/docker | Best for: non-technical automation | NOT for: real-time streaming
```

AI 拿到这些信息后推荐会精准很多。

## 执行方式

用 Claude Code CLI 批量分析：

```bash
# 对每个工具：
# 1. 读 GitHub README
# 2. 用 Claude 分析生成 intelligence JSON
# 3. 写入 DB

bun run scripts/generate-intelligence.ts --limit=50
```

### 脚本逻辑

```
for each tool:
  1. fetch GitHub README via API (raw.githubusercontent.com)
  2. fetch package.json / setup.py (判断技术栈)
  3. 构建 prompt: "Analyze this tool's README and generate structured intelligence..."
  4. 调用 Claude Code CLI: claude -p < prompt
  5. 解析 JSON 输出
  6. INSERT INTO tools SET intelligence = ? WHERE id = ?
```

### 优先级

先做 top 50（按 score 排序），这些是最常被推荐的工具。
剩余 413 个可以后续慢慢补。

### 预估

- 每个工具：README fetch (~1s) + Claude 分析 (~20s) = ~21s
- Top 50：~18 分钟
- 全量 463：~2.7 小时
- Claude Code CLI 成本：约 $2-5（取决于 README 长度）

## 验证

完成后对比：
1. 用同一个 query 生成 Blueprint（有 intelligence vs 没有）
2. 看推荐的 integration 准确性是否提升
3. 看 failure_points 是否更具体
