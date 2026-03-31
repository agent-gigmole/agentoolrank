# Tool Intelligence 生成流程（Claude Code 本地分析）

## 方法

使用 Claude Code subagent 的自身分析能力（非外部 LLM API）分析 GitHub README 生成结构化 intelligence JSON。

## 为什么不用外部 API

- DeepSeek 分析能力不够，生成的 intelligence 质量差
- Claude API 需要额外成本
- Claude Code Max Plan 的 subagent 直接分析 README 质量最好，且已包含在订阅内

## 批处理参数

- 每个 subagent 处理 **20 个工具**（太多会超 context，太少效率低）
- 并行 **3 个 subagent**（避免过度占用资源）
- 每批完成后验证质量再启动下一批

## Subagent Prompt 模板

```
你是 Tool Intelligence 分析师。对以下工具生成结构化 intelligence JSON 并写入 Turso。

工作目录：/home/qmt/workspace/ai-directory

## 工具列表
{tools_json}

## 每个工具的执行步骤

### 1. 获取 README
curl -sL "https://raw.githubusercontent.com/{owner}/{repo}/main/README.md" | head -c 10000
404 则试 master。如果 README < 200 字符，跳过该工具。

### 2. 分析生成 JSON

基于 README 内容生成：
{
  "capabilities": ["3-8项，英文，具体描述不要泛泛"],
  "integrations": ["README 明确提到的集成服务/工具"],
  "sdk_languages": ["支持的编程语言"],
  "deployment": ["具体部署方式"],
  "pricing_detail": {"free_tier": "...", "paid_starts_at": "..."},
  "limitations": ["2-4个真实具体限制"],
  "best_for": ["2-3个专属最佳场景"],
  "not_for": ["1-2个不适合场景，提到替代方案"],
  "key_differentiator": "一句话 vs 竞品核心区别，必须提具体竞品名"
}

质量红线：
- ❌ 泛泛的 "LLM/模型集成与调用" → ✅ 具体的 "Visual workflow builder with 400+ integrations"
- ❌ 模板化 "社区支持为主" → ✅ 具体的 "No built-in auth; requires external service for multi-tenant"
- ❌ 千篇一律 "构建自主 AI 智能体" → ✅ 专属的 "Fine-tuning LLMs with LoRA on consumer GPUs"
- ❌ "活跃社区" → ✅ "Unlike LangChain, focuses on visual debugging with time-travel replay"

### 3. 写入 Turso

创建 /tmp/write-intel-batch.ts：
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });

// 批量写入所有工具
for (const [id, intel] of Object.entries(results)) {
  await db.execute({
    sql: "UPDATE tools SET intelligence = ?, updated_at = datetime('now') WHERE id = ?",
    args: [JSON.stringify(intel), id]
  });
}

## 输出格式

处理完后打印表格：
| 工具 | Caps | Integrations | Key Differentiator (前80字符) |
成功/失败/跳过 计数
```

## 质量验证

每批完成后抽查 2 个工具：
- capabilities 是否具体
- integrations 是否真实
- key_differentiator 是否提到竞品
- best_for/not_for 是否专属于该工具
