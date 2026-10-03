# RECIPES.md — 操作配方

<!-- 可重复执行的操作步骤 -->

## boss-todo
要老板做 / 要老板协调的事（老板 2026-10-04 00:44 定）：
- 一律写进 agentkit 数据库：`$AGENTKIT_ROOT/bin/boss-todo add --project ai-directory --what "老板一眼能懂的话" --why "为什么只能老板做" [--tried …] [--due MM-DD] [--state open|waiting|memo]`，打印出的编号就是对外说的 #N
- 不用老板操作、只需汇总里顺带说明的事：`boss-todo note --project ai-directory "…"`（09:30 汇总发出）
- 急事加 `--urgent` 立即发 TG；00:30–08:30 静默时段只登记不发
- 查看/改/了结：`boss-todo list [--all] --project ai-directory`、`set <id> …`、`close <id> --decision "…"`
- agentkit 的 memory/BOSS_QUEUE.md 是 `boss-todo export` 生成的导出物，**不要手改**；本项目 TASK.md「等待用户」只作镜像，以库为准
- 2026-10-04 在库：#35 隐私/条款页、#36 MIT 许可证、#37 awesome 清单 PR（与 #36 一起批）；note：OpenRouter $5.55 差额
