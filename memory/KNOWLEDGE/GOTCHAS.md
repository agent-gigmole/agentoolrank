# GOTCHAS.md — 坑点 / 踩雷记录

## whois-unreliable
- `whois` 命令对 .ai / .dev / .tools 等新 TLD 返回格式不一致，经常误判"可用"
- 正确做法：用 Cloudflare Registrar API `/check` 端点，返回精确的 available/premium/price
- domain-check skill 已升级到 v2.0 使用 Cloudflare API

## vercel-sqlite-path
- Vercel serverless 函数的工作目录不是项目根目录
- `file:./db/local.db` 在 Vercel 上找不到文件
- 修复：用 `join(process.cwd(), "db", "local.db")` 解析绝对路径
- 还需要 `next.config.ts` 的 `outputFileTracingIncludes` 把 db 文件打包进函数

## vercel-env-newline
- Vercel 环境变量通过 CLI 设置时可能带入换行符
- 导致 sitemap.xml 中 URL 被换行断裂，Google Search Console 报"无法抓取"
- 修复：`echo "value" | tr -d '\n' | vercel env add`

## github-graphql-rate-limit
- GitHub GraphQL API 用的是点数制（point-based），不是请求数
- 一次查询 100 个 repo 不只消耗 1 点，每个 node/connection 各消耗点数
- 500 个 repo 一轮约消耗 2000-3000 点（上限 5000/hr）
- 需要分优先级轮换更新

## create-next-app-interactive
- `npx create-next-app` 即使加了 `--no-git --use-bun` 等参数，仍有交互问题
- React Compiler? AGENTS.md? 等新选项会阻塞非交互模式
- 修复：`yes "n" | npx create-next-app ...` 全部回答 No

## zod-nullable-vs-optional
- SQLite 返回的 NULL 值在 Zod 中不匹配 `z.string().optional()`（optional 只接受 undefined）
- 需要用 `z.string().nullish()`（接受 null + undefined）
- affiliate_url 等可空字段都要用 nullish

## github-search-api-language-filter
- GitHub Search API 的 `language:Python OR language:TypeScript` 语法返回 0 结果
- OR 连接多个 language 过滤器不工作，需要分开多次查询或使用其他格式
- 替代方案：awesome-list 爬取效果更好，一次可获得 700+ repo links

## metric-snapshots-fk-constraint
- tools 表有 metric_snapshots 外键约束
- 删除工具时必须先删 metric_snapshots 再删 tools，否则报 FK constraint error
- cleanup-tools.ts 中需要 `DELETE FROM metric_snapshots WHERE tool_id = ?` 先于 `DELETE FROM tools`

## slug-collision-with-repo-name-only
- makeSlug 只用 repo name（不含 owner）会导致 slug 冲突
- 例如：多个 org 都有叫 `agent` 或 `framework` 的 repo
- 25 个 slug 冲突，ON CONFLICT 导致后入库的覆盖先入库的
- 修复：makeSlug 改用 `owner-name` 格式可避免冲突

## awesome-list-noise
- awesome-list 中大量 repo 不是 AI agent 工具（模型权重、教程、资源列表、论文等）
- 需要 blocklist pattern 过滤（如 `awesome-*`, `*-tutorial`, `*-papers` 等）
- cleanup-tools.ts 用 description 关键词 + 低星过滤可清理约 20%
- 建议：爬取后增加 LLM 分类步骤判断是否为"工具"
- 最佳实践：两层过滤（cleanup blocklist + filter-relevance 关键词），从 578 清到 463

## claude-cli-pipe-speed
- `claude -p "prompt"` 每个工具约 20 秒处理时间
- 50 个工具约 17 分钟，不如直接调 API 快但不需要 API key
- 批量生成时考虑并行（但 Claude Code CLI 似乎有并发限制）
- 大批量（300+）建议用 API 直接调用

## turso-schema-mismatch
- 本地 SQLite 数据库可能有 schema.sql 中未定义的列（如 stacks 表的 tags 列）
- 迁移到 Turso 时，需先在 Turso 端 ALTER TABLE ADD COLUMN 补齐缺失列，再导入数据
- 否则 INSERT 会因列数不匹配失败
- 教训：schema.sql 必须和实际数据库结构保持同步

## ai-sdk-v6-breaking-changes
- AI SDK v6（@ai-sdk/react, ai 包）有大量 breaking changes：
  - `handleSubmit` → `sendMessage({ text: input })`
  - `useChat({ api: "/path" })` → `useChat({ transport: new DefaultChatTransport({ api: "/path" }) })`
  - `message.content`（字符串）→ `message.parts`（数组，需迭代 part.type === "text"）
  - `toDataStreamResponse()` → `toUIMessageStreamResponse()`
  - `maxTokens` 参数已移除（不再支持）
- 从 @ai-sdk/react 需要额外导入 DefaultChatTransport
- 影响范围：所有使用 useChat hook 和 streamText 的代码

## vercel-env-preview-branch
- `vercel env add` 对 preview 环境会询问分支名，非交互模式需加 --yes 参数
- 或显式指定 `--git-branch main`

## libsql-row-type-assertion
- libsql/turso 的 Row 类型不能直接 `as T` 断言
- 需要 `as unknown as T` 双重断言才能通过 TypeScript 编译
- 原因：Row 是类数组类型，与普通对象接口不兼容
- 影响所有从 db.execute() 返回的 rows 遍历

## ai-sdk-v6-responses-api-default
- AI SDK v6 的 createOpenAI() 默认使用 OpenAI Responses API（新版），而非 Chat Completions API
- DeepSeek 等 OpenAI-compatible 提供商不支持 Responses API，会返回 404
- 修复：使用 `provider.chat(modelId)` 强制走 Chat Completions API
- `compatibility: "compatible"` 参数在某些版本不存在，会导致 TypeScript build 失败
- 只用 `.chat()` 即可，不需要额外参数

## convert-to-model-messages-required
- useChat hook 发送的是 UIMessage 格式（包含 parts 数组）
- streamText 需要 ModelMessage 格式（纯 content 字符串）
- 必须用 `convertToModelMessages()` 转换，否则 API 返回 200 但 AI 不回复
- 这个坑特别隐蔽：API 层面没有报错，只是前端无响应

## browse-frontend-testing
- API 返回 200 不代表前端正常工作
- 前端问题（如 convertToModelMessages 缺失）不会体现在 API 层面
- 每次代码改动后必须用 /browse 测前端，不能只测 API
- 尤其是涉及 useChat / 流式 UI 的改动，前后端交互链路必须端到端验证

## bun-lock-sync
- 每次 npm install / pnpm add 新包后，必须运行 `bun install` 更新 bun.lock
- 否则 CI 的 `bun install --frozen-lockfile` 会因 lockfile 与 package.json 不同步而失败
- 症状：本地开发正常，CI 构建失败报 frozen-lockfile 错误
- 修复：`bun install` 重新生成 bun.lock，提交到 git

## subagent-rule-engine-trap
- 子 agent 被指示"分析工具"时，可能用关键词匹配/规则引擎代替实际 LLM 分析
- 症状：所有工具的 key_differentiator/best_for 都是相同的模板文本（如"构建自主 AI 智能体"）
- 检测方法：批量完成后查 `SELECT intelligence FROM tools WHERE intelligence LIKE '%构建自主%'` 计数
- 预防：prompt 中明确禁止模板/规则引擎，要求引用 README 具体内容
- 影响范围：394 个工具全部需要重做

## subagent-wrong-table-creation
- 子 agent 操作 Turso 远程 DB 时，可能创建新表（如 tool_intelligence）而不是更新已有列（tools.intelligence）
- 原因：agent 没有 schema 上下文，自行决定数据存储方式
- 检测：`SELECT name FROM sqlite_master WHERE type='table'` 检查意外表
- 预防：prompt 中提供完整 schema + 明确指定"UPDATE tools SET intelligence = ? WHERE slug = ?"
- 修复：从错误表迁移数据到正确列，再 DROP 错误表

## batch-subagent-parameters
- 批量 subagent 分析最佳参数：每 agent 20 个工具，并行 3-6 个 agent
- 太多工具/agent：容易超时或内存不足
- 太少：效率低
- 需要 quality gate：批次完成后抽检，发现低质量立即停止后续批次
- 流程参考：scripts/generate-intelligence-claude.md

## claude-cli-background
- `claude -p "prompt"` 在后台进程（无 TTY）会卡死不返回
- 原因：CLI 可能尝试读取终端输入或检测 TTY 状态
- 修复：用 Claude Code subagent（Agent 工具 + run_in_background）替代 `claude -p`
- 适用场景：批量分析、后台任务等需要 LLM 处理的自动化流程

## vercel-env-echo-newline
- `echo "value" | vercel env add` 会在值末尾带 `\n` 换行符
- 导致 API key 等敏感值包含不可见换行符，API 认证失败
- 修复：必须用 `printf '%s' "value" | vercel env add`
- 影响范围：所有通过 CLI 管道设置的 Vercel 环境变量
- 区别于 vercel-env-newline（那个是 URL 换行问题），这个是值本身带换行

## kimi-k25-api-quirks
- Kimi K2.5（api.moonshot.ai）只支持 temperature=1，设 0.3 会报错
- API 基础 URL 需要 /v1 路径前缀：`https://api.moonshot.ai/v1`（DeepSeek 是 `https://api.deepseek.com`，不需要 /v1）
- 默认开启 thinking 模式（响应含 reasoning_content 字段），content 字段可能为空字符串
- 处理方式：检查 content 是否为空，若空则取 reasoning_content 或等后续 chunk
- 注意：api.moonshot.ai（国际）vs api.moonshot.cn（国内），不要搞混

## openrouter-allowed-providers
- OpenRouter 的 Allowed Providers 设置：留空 = 允许所有 provider
- 如果添加了任何 provider，则变成白名单模式（只允许列表中的 provider）
- 直觉陷阱：以为"不设置 = 全部禁止"，实际是"不设置 = 全部允许"

## npx-tsx-env-local
- `npx tsx -e "..."` 不会自动加载 `.env.local` 文件
- 导致查询 Turso 等依赖环境变量的操作返回空结果
- 容易误判为"数据库没数据"，实际只是缺 env
- 修复方式：用 `env-cmd -f .env.local npx tsx -e "..."` 或在脚本中手动 `dotenv.config()`
- 注意：Next.js dev server 会自动加载 .env.local，但 tsx 直接执行不会

## canonical-url-seo-migration
- URL 路径迁移（如 /stack/[slug] → /blueprint/[slug]）时，旧路径必须保留并设 canonical
- 直接删除旧路由会导致已索引页面 404，损失 SEO 权重
- 正确做法：旧路由页面添加 `<link rel="canonical" href="/blueprint/[slug]">` 指向新路由
- Sitemap 中新路由给高 priority（0.6-0.7），旧路由降级（0.4-0.5）
- Google 会逐渐合并权重到 canonical URL
