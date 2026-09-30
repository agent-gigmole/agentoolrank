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

## turso-intelligence-data-loss
- Turso 上 444 个工具的 intelligence 列全空（length=0），数据丢失
- crawl-github.ts 的 ON CONFLICT DO UPDATE 语句没有覆盖 intelligence 列，排除爬虫覆盖
- 可能原因1：subagent batch 15 创建了错误的表 tool_intelligence（而非更新 tools.intelligence 列），数据从未成功迁移
- 可能原因2：某次 schema 操作（ALTER TABLE 或数据迁移脚本）意外清空了该列
- 教训：**批量 subagent 写入后必须立即验证数据完整性**
  - 验证 SQL：`SELECT COUNT(*) FROM tools WHERE LENGTH(intelligence) > 10`
  - 不能只看 subagent 报告"成功"，要用独立查询确认数据落盘
- 修复：需要重新运行 Claude subagent 深度分析 444 个工具

## concurrent-json-file-write
- 多个并行 subagent 同时写入同一个 JSON 备份文件会导致竞争条件
- 症状：文件中实际条目数少于预期（如 444 vs 464），部分写入被覆盖
- 原因：agent A 读取文件 → agent B 读取文件 → agent A 写入 → agent B 写入（覆盖 A 的数据）
- 修复方案：
  1. 最佳：每个 agent 写独立文件（如 `backup-batch-N.json`），最后合并
  2. 次佳：写完后用 sync 脚本从权威数据源（如 Turso DB）同步修复
  3. 避免：不要让多个 agent 读-改-写同一个文件
- 实际修复：创建 sync-backup.js 从 Turso 查询所有 intelligence 数据重建备份文件
- 适用范围：任何批量 subagent 需要共享输出文件的场景

## github-readme-branch-inconsistency
- GitHub README 获取时，默认分支可能是 main 或 master，部分项目使用其他分支
- 需要 main → master fallback 策略
- 部分项目 README 在子目录（如 monorepo），需检查根目录和子目录
- 部分项目已 archived/deprecated：sweep→JetBrains plugin, text-generation-inference→维护模式, swe-agent→mini-SWE-agent, gpt-pilot→Pythagora 商业化
- 应对：fetch README 失败时记录但不阻塞，基于已知信息生成最小 intelligence

## canonical-url-seo-migration
- URL 路径迁移（如 /stack/[slug] → /blueprint/[slug]）时，旧路径必须保留并设 canonical
- 直接删除旧路由会导致已索引页面 404，损失 SEO 权重
- 正确做法：旧路由页面添加 `<link rel="canonical" href="/blueprint/[slug]">` 指向新路由
- Sitemap 中新路由给高 priority（0.6-0.7），旧路由降级（0.4-0.5）
- Google 会逐渐合并权重到 canonical URL

## cross-project-credentials
- 跨项目资源（Stripe key、Cloudflare token、PostHog、品牌账号）不能从兄弟项目（如 imagehub/pixtidy）借用：对方明确不代发任何密钥，claude-ops.key 不得复用，品牌账号不跨品牌共用
- 必须由用户本人发放：Stripe 可共用 TENSO LLC 但需用户拍板 + 自建受限 key；checkout 用 statement_descriptor_suffix（≤22 字符）+ metadata.site 区分站点，UTM 写进 metadata.src
- agentoolrank.com 在用户另一个 Cloudflare 账户，需单独 zone token
- pixtidy 无发信服务（只有 CF Email Routing），发信要另找
- **Vercel Hobby 禁止商用**，站点开始收钱前必须升 Pro
- 花钱遵守 $AGENTKIT_ROOT/shared/harnesses/spend-control.md

## gsc-pull-pyjwt
- 本机没 bun 时，用 python pyjwt 签 service account JWT（gsc-service-account.json）换 access token 直接调 GSC searchAnalytics API；该 service account 有 agentoolrank.com 权限

## turbo-strict-env
- Turborepo 2.x 默认 strict env 模式：任务只能看到 turbo.json 中 `env`/`globalEnv` 声明的变量，Vercel 注入的 TURSO_* 等被静默过滤
- 症状：packages/db 拿不到 TURSO_DATABASE_URL，回退 `${process.cwd()}/db/local.db`，edge 路由在 "Collecting page data" 报 `process.cwd not supported in Edge Runtime`
- 修复：turbo.json `tasks.build.env` 声明 `TURSO_*`、`LLM_*`、`NEXT_PUBLIC_*`、`GSC_*`（通配符可用）

## vercel-monorepo-rootdir
- 单 repo 多 app 的 Vercel 项目必须设 rootDirectory（如 apps/agent-tools），否则在根目录跑 `turbo run build` 构建全部 app，任一暂停/坏掉的 app 失败即整个部署 ERROR
- 设置：Vercel API `PATCH /v9/projects/{id}` body `{"rootDirectory":"apps/agent-tools"}`
- 教训：重构后没人看部署状态，线上旧版挂了半年——重构后必须 `vercel ls` / 实测线上版本

## vercel-cli-deploy-vercelignore
- `vercel deploy` 从本地上传整个目录（不看 .gitignore 以外的保护），.env*、service account JSON、local.db 会被上传
- 先写 .vercelignore 排除 .env*、*service-account*.json、memory/、docs/、data/、*.db，再用 `vercel deploy --prod --yes --token $VERCEL_TOKEN --scope <team>` 部署；可先审计上传文件列表
- Vercel API 从 gitSource 创建部署只能部署已 push 的 commit；本地 git push 不可用时只能 CLI 本地部署

## gh-actions-schedule-60day-disable
- 公开仓库 60 天无 commit 活动，GitHub 自动停用 schedule 触发的 workflow；需 push 新 commit 并在 Actions 页面/`gh workflow enable` 重新启用
- 本项目 daily-update 最后运行 2026-06-02；且 3-28 起已因 bun.lock 不同步（#bun-lock-sync）连续失败——定时任务要有失败告警，否则静默断更

## stale-next-server-port
- 本机起 dev/start 时若端口已被旧 next-server 占用，新进程可能没真正接管，请求打到旧进程 → 新加的路由全 404，误以为代码有 bug
- 先 `ss -ltnp | grep <port>` 查占用进程，kill 旧进程或换端口，再验证

## llm-display-name-needs-evidence
- 让 LLM 从仓库名推官方产品名，没有证据时会张冠李戴（mem0→embedchain、lobehub→Lobe Chat）
- 必须先抓 README 标题 / 首图 alt 作为证据喂给 LLM；raw.githubusercontent.com/<owner>/<repo>/HEAD/README.md 无需 token、不占 GitHub API 限额
- 批量改名前写回滚备份文件（本项目 apps/agent-tools/data/display-names-backup-2026-09-30.json）
- crawl-github upsert 不覆盖 name，但新入库工具仍是仓库名 → 每日管道需接入改名脚本

## bang-prefix-no-stdin
- Claude Code 里用 `!` 前缀运行的命令没有交互 stdin：`read -s` 之类的存密钥脚本收不到键盘输入，会静默存空/失败
- 需要用户输入密钥的脚本，一律让用户在**普通 WSL 终端**运行，文档里不要写 `! save-secret ...`

## stale-global-github-token
- ~/.bashrc 导出了失效的全局 GITHUB_TOKEN，gh 优先用它 → 401，即使另有有效 token
- 用法：`unset GITHUB_TOKEN; export GH_TOKEN=$(cat ~/.config/secrets/github-agentoolrank)`
- push 不写入 remote：`T=$(cat ~/.config/secrets/github-agentoolrank); git -c credential.helper= push -q https://x-access-token:$T@github.com/agent-gigmole/agentoolrank.git main`（勿打印 token）
- token 权限：仅 agentoolrank 仓库 Contents/Actions/Workflows RW，无 Secrets 权限（改 repo secrets 需用户）

## ci-fix-check-all-steps
- 修 CI 不能只修报错那一步：报错步骤后面的每一步都可能已坏（本项目 bun.lock 修好后，后续脚本 import ../src/lib/db 在 monorepo 重构后已不存在）
- 修前逐步审读 workflow 每一步的"现在还成立吗"，最好 workflow_dispatch 实跑验证

## remote-source-of-truth-no-overwrite-sync
- daily-update 原有 migrate-to-turso（INSERT OR REPLACE 以 local.db 整行覆盖 Turso）+ 提交 local.db；Turso 成为事实源（alternatives/展示名/intelligence 都只在 Turso）后，修通这条路径会用 3 月旧数据冲掉线上数据
- 规则：远端成为事实源后，所有"本地库→远端"覆盖式同步步骤必须删除；每日任务只对远端做按 id 的 UPDATE（crawl-github --existing），不插入/改名/删除

## cdp-loopback-v4-or-v6
- Windows Chrome `--remote-debugging-port` 实际监听地址不固定：imagehub 的实例在 `[::1]:9222`，本项目新开的实例在 `127.0.0.1:9223`
- browser.py 取 `/json/version` 时 127.0.0.1 与 [::1] 两个回环都试（无代理 opener），不要写死其一

## windows-python-wsl-paths
- WSL 调 Windows 侧 python.exe 时，脚本参数里的 WSL 路径（/home/...）Windows 读不到 → run.sh 先把文件参数复制到 Windows 工作目录（C:\agentoolrank-browser）再传 Windows 路径

## page-summary-leaks-input-values
- task_act 每步打印页面摘要时会输出 input 的 value → 填过的密码直接进会话输出/日志（Peerlist 密码泄露一次，已作废重生成）
- 修复：摘要里 `type=password` 的框显示 `<hidden>`；新增 `fill_secret` 步骤从 600 权限文件读密码填入，全程不打印
- 规则：任何"回显页面状态"的调试输出都要默认遮蔽密码/token 类字段；imagehub 的 task_act.py 同款问题（已建议，未改其文件）
- **第二入口（10-01 再踩，泄露 Resend 密码）**：摘要里的 ERRORS 段用 `[class*=error]` 选元素，选中了带 error 类的 input 本身并打印其 value → 所有摘要文本函数对 type=password 统一返回 <hidden>，ERRORS 排除 INPUT/TEXTAREA/SELECT。遮蔽要在"取文本"的公共函数做，而不是逐个输出段打补丁

## ui-automation-selectors-peerlist-peerpush
- headlessui combobox：选中后 placeholder 会变，别按 placeholder 重新定位；用 `click_role option`（get_by_role("option", name=...)）选
- Peerlist 表单 input 在摘要里显示的是 id 不是 name → 用 `#firstName` 定位
- 弹窗（modal）里的按钮与底层页面同名 → `css=button:has-text('X'):visible`

## personal-network-no-brand-persona
- Peerlist 等"个人职业网络"onboarding 要求真人姓名，"AgentoolRank Team" 被拒；用品牌冒充个人既违反平台规则也不合适
- 做法：停下问用户用谁的真名，产品以 Project 形式挂在真人账号下；不自造假名

## peerpush-free-queue-retention-offer
- PeerPush 选 "Join the free queue" 后会弹 40% off 挽留折扣；按 spend-control 拒绝，选 Wait ~70 days → 队列 #4190
- 注册用户名自动生成（@hello2502），设置里暂未找到改名入口

## shared-browser-venv-readonly
- 复用其他项目（imagehub/pixtidy）的 Windows venv（C:\pixtidy-browser\venv）时：只读复用，不 pip install/升级、不改其文件、不写其目录；自己用独立 Chrome profile + 端口 + 工作目录
- 共用账号（用户个人 PH maker 号）先问持有项目的发布排期，避开其发布窗口

## push-explicit-url-stale-tracking-ref
- `git push https://...@github.com/owner/repo.git main`（显式 URL，不经 remote 名）不会更新 `refs/remotes/origin/main` → `git status` 仍显示 "ahead N"，是假象
- 核实：`git fetch`（或 ls-remote）后再看；不要据此重复 push 或以为 push 失败

## x-login-flow
- 入口 /i/flow/login；输入邮箱后**按 Enter** 提交 —— 按文本匹配"继续"会误中"使用手机继续"
- 默认发邮箱验证码（到 tensam.th@gmail.com，Claude 的 gmail_secondary 是 0xzap0x，读不到）→ 点右上"使用密码"，用 fill_secret 填密码即可登录
- 该号是用户个人 build-in-public 号（Zephyr @hwak8666621），不改资料；每条对外发帖先经用户确认（对外身份闸）

## mcp-minimal-stateless-server
- 目录站 MCP 服务器无需 SDK：Next.js route 手写 JSON-RPC 即可（Streamable HTTP 允许只回 application/json、不开 SSE、无 session）
- 必做：initialize 回显客户端请求的协议版本（支持列表内则用它，否则回最新）、ping、tools/list、tools/call（结果放 content[{type:'text'}]）
- **通知（无 id，如 notifications/initialized）不能回 JSON-RPC 响应 → HTTP 202 空体**；GET 回 405（不支持 SSE 流）；OPTIONS 给 CORS
- 未知方法 -32601、参数错 -32602；工具业务错误用 result.isError=true 而非 JSON-RPC error

## search-or-like-ranks-generic-hits
- 多关键词 OR-LIKE 后按"总分/热度"排序 → 泛词（agent、ai）命中几乎所有工具，结果等于热度榜
- 修复：按字段加权计命中分（name 4 / tagline 3 / category 3 / description 1 / intelligence 1）+ 停用词过滤，先按命中分再按总分

## related-by-integrations-not-similarity
- "相关/互补工具"不要用 TF-IDF 相似度（那是替代品）；用 integrations 数据双向匹配名称、排除已在 alternatives 的 → 更可信
- 覆盖率受数据限制（247/464），不为达标硬凑

## crontab-plaintext-secrets
- 用户 crontab 顶部有明文 TELEGRAM_BOT_TOKEN，`crontab -l` 会打印进会话；编辑 crontab 时用 `crontab -l | grep -v ... ` 或只追加，避免整份回显；已告知用户，未改动

## check-constraint-new-enum-use-fact-table
- 已有表列带 CHECK（如 submissions.plan IN ('free','fast','featured')）挡住新枚举值（priority）时：SQLite 改 CHECK 要重建表 = 改表 = 人工闸
- 做法：不动旧表，另开事实表（payments：submission_id/plan/amount/stripe_session）记付费事实，读取方（review-submissions 排序）改从事实表判断

## agent-first-submit-and-pay
- 面向 AI agent 的提交/付费：一次返回全部档位（免费 + 付费，按价格排序，含交付期/权益），再给 recommendPlan（在预算/期限/是否需推荐位约束内选最便宜档）；**不做挽留弹窗/锚定话术**
- 付款链接**懒创建**：返回 `/api/v1/submissions/{id}/checkout?plan=&token=`，点开时才建 Stripe session 并 303 → 避免每次提交都生成一堆未用会话
- 提交返回 per-submission token（submission_tokens 表），状态/结账接口要 token，错 token 统一 404（不泄露存在性）
- 网页 /api/submit、REST POST /api/v1/submissions、MCP submit_tool 共用 submit-core，避免三处逻辑漂移；llms.txt 写明 agent 提交入口

## x-compose-post
- X 发帖：打开 compose/post，[data-testid=tweetTextarea_0] 用 keyboard.insert_text（type/fill 会丢换行或触发快捷键）→ [data-testid=tweetButton] → 从个人主页取最新 permalink（task_latest_post.py）
- X 链接卡片会缓存旧 OG 标题（改名后仍显示 AgenTool Rank），短期无法强刷；发帖前先确认 OG 正确

## stripe-key-via-vercel-api
- 生产密钥写入 Vercel：用 API 从本地文件读值，type=sensitive、target=production，不打印值；monorepo 还需 turbo.json build.env 声明，否则被 strict env 过滤
- Stripe 无 key 时 /api/checkout 返回 503（不崩）；live 自测建 session 后立即 expire

## pkill-f-kills-own-shell
- `pkill -f "<pattern>"` 在 Claude Code 的 Bash 里会连同当前 shell 一起杀掉（当前 shell 的命令行里也含这个 pattern），表现为 Exit code 144、后续命令都没执行。10-01 踩了两次（crawl-github、http.server 8792）。
- 做法：用方括号技巧 `pgrep -f "http.serve[r] 8792"` / `pkill -f "crawl-githu[b]"`，或先 `pgrep` 拿到 PID 再 `kill <pid>`；长期服务交给 systemd --user 管理，用 `systemctl --user restart` 而不是 pkill。

## repo-renamed-org-dedupe
- GitHub 仓库换组织（block/goose → aaif-goose/goose）后，搜索结果里的 full_name 与库里 github_repo 不同 → 按 owner/repo 判"已上架"会漏判，slug 冲突时加组织前缀另起一条 → 8 条重复（已撤回）
- 做法：按**仓库名**（以及 API 返回的重定向后 full_name）判已上架；slug 冲突即视为已存在，不自动另起前缀 slug

## website-url-normalize-and-safeparse
- 爬虫/LLM 给的"官网"可能是裸域名（www.funasr.com）或邮箱 → Zod url() 校验失败 → SSG 预渲染（/new）抛 ZodError → 整个部署失败；同时去重删掉的旧 URL 在失败期间短暂 404
- 修复两层：①入库前规范化（无协议补 https://；无效或含用户名 → 回退 github_url）；②查询层 parseTools 用 safeParse，坏行跳过 + console.warn，getToolBySlug 同 → 单条坏数据不再拖垮构建
- 规则：SSG 构建读 DB 时，schema 校验必须是"逐行容错"，不是整批 parse

## rollback-file-timestamp
- 回滚/备份文件按日期命名（display-names-backup-YYYY-MM-DD.json）同日再跑会被覆盖，第一次的原值丢失（本次可由 github_repo 还原）
- 规则：备份文件名带时间戳到秒，且写入前若存在则不覆盖

## twilio-30038-otp-dropped
- 用 Twilio 号码接第三方（Brevo）手机验证 OTP：发送方显示已发，Twilio 日志错误码 30038（OTP 类消息被 Twilio 防滥用拦截丢弃）→ 虚拟号收不到验证码
- 不要反复重试（可能触发发送方风控）；改用实体 SIM（10-02 到，分给 ai-directory）

## captcha-turnstile-vs-recaptcha-cdp
- CDP 控制的 Chrome（专用 profile，端口 9223）：Cloudflare Turnstile（Resend 注册）一直不过；Google reCAPTCHA（Brevo）能过
- 选服务时优先 reCAPTCHA / 无验证码的；遇 Turnstile 直接换供应商或请人工，别死磕
- Brevo 地址栏不接受 "#" → 写 "Unit 4670"

## mcp-registry-dns-publish
- 官方 MCP Registry 发布（com.agentoolrank/agent-tools v1.0.0，remote streamable-http）流程：
  1. 生成 ed25519 私钥（~/.config/secrets/mcp-registry-agentoolrank.pem，600）
  2. 在 agentoolrank.com 加 TXT `v=MCPv1; k=ed25519; p=<公钥 base64>`
  3. `mcp-publisher login dns --domain agentoolrank.com --private-key <hex>`（v1.8.1）
  4. apps/agent-tools/mcp/server.json（name 用反向域名 com.agentoolrank/…，remotes type streamable-http + url）→ `mcp-publisher publish`
- DNS 认证无需 GitHub OAuth，适合品牌域名命名空间

## mcp-directories-status
- PulseMCP：全站暂停收录；mcp.so：仅 $39 付费或工单；AI Agents List：资格审核过但仅 $29/$49 档 → 零收入期按 spend-control 都不付

## mcp-category-by-llm-purpose
- "名字含 MCP"≠MCP server（很多是客户端/框架）→ tag-mcp.ts 先关键词取候选（44）再让 LLM 判主要用途，只给 29 个加 mcp-servers 标签；类目表 INSERT OR IGNORE

## indexnow-key-verification-delay
- 新 IndexNow 密钥文件（public/<key>.txt）部署后首次推送返回 403 SiteVerificationNotCompleted —— 搜索引擎还没抓密钥文件；约 15 分钟后重试即 200。不要改 key/换方案，等一会再推
- key 记 docs/ops/indexnow-key.txt；scripts/indexnow.ts 进 daily-ops 每日推

## google-sitemap-resubmit-service-account
- GSC sitemap 重新提交：service account 需 webmasters（写）scope，`PUT https://www.googleapis.com/webmasters/v3/sites/{site}/sitemaps/{feedpath}` → 204
- 先 GET sitemaps 看 lastDownloaded/contents：本站发现 Google 上次下载是 03-28、只记 739 条、收录 0 —— 站点扩量后 Google 并不会自动知道，要主动重提交

## sitemap-lastmodified-real-dates
- sitemap lastModified 全写"今天"会被搜索引擎当噪音忽略；改用数据真实刷新时间（data_refreshed_at）

## mcp-registry-jwt-short-lived
- mcp-publisher 的 registry JWT 很快过期；每次 publish 前重新 `mcp-publisher login dns ...`，否则 401

## outreach-github-tos-public-contact
- GitHub 条款禁止把 GitHub 上的用户资料（含 commit/profile 邮箱）用于未经请求的邮件 → 外联邮箱只能来自项目官网或 README 中公开写出的联系方式，并记录出处
- 过滤：noreply/example/图片文件名（logo@2x.png 类误匹配）；排除 security@/license@/legal@/privacy@/careers@ 等专用角色信箱（用途不符）；多个候选时优先项目自有域名
- 模板无推销、给具体排名/页面/徽章、含退订；名单文件（含邮箱）不入库；发之前经老板批

## seo-title-length-test-sample
- 标题测试失败时先核对样例本身：一次失败是测试样例期望值超 70 字符，实现截断正确 → 改样例。判断标准是"预期行为是否被正确编码"，不是哪边好改

## recaptcha-checkbox-frame-click
- CDP 控制的 Chrome（agentoolrank-chrome 9223）：Google reCAPTCHA v2 复选框可直接勾过、不弹图片题（dev.to、Brevo 均过）；Cloudflare Turnstile（Resend）则一直被拒 → 见 #captcha-turnstile-vs-recaptcha-cdp
- 勾法：task_act `frame_click` 步骤 = `page.frame_locator("iframe[title='reCAPTCHA']").locator('#recaptcha-anchor').click()`
- **先勾验证码再填表/提交**：dev.to 未勾就提交会被拒且**已填字段全部清空**，需整表重填

## stripe-reconcile-readonly-key
- 买家付款后若关掉页面，/submit/thanks 不会执行 → 单丢。无 webhook（新建签名密钥属凭证闸）时：只读 restricted key 每小时列最近 3 天 Checkout Sessions，按 metadata.site 过滤 paid 的，调同一个幂等 recordPaidSession 补记
- 代码：src/lib/paid.ts recordPaidSession、src/lib/reconcile.ts、scripts/reconcile-payments.ts、scripts/hourly-ops.sh（crontab `17 * * * *`）

## vercel-provisioning-timeout
- Vercel 部署偶发 "Resource provisioning timed out"（平台侧，非代码）→ 直接重试即可，别改代码排查

## zero-traffic-stop-building
- 真实访问≈0（1 天 4 次基本自测、订阅 0）时继续加功能不推动收入 → 转分发（社区帖 / 品牌号 / X 数据帖），用原创数据页（/report）当分发素材
- 多项目共用个人号（HN/Reddit）：同号 Show HN 至少隔一周，先走品牌号渠道（dev.to）

## seo-audit-script-ssl-timeout
- 自写 Python urllib 巡检脚本偶发 SSL 握手超时 → 用 curl 复核再判定页面问题，别误报
