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
