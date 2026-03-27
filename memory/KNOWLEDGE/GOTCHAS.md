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
