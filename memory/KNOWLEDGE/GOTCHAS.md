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
