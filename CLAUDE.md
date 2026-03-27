# CLAUDE.md

## CHECKPOINT — 每完成一步必须执行（不可跳过）

**完成任何代码修改、调试、或决策后，立即派后台 agent 更新 memory + 提炼评估，再做下一步。**

### 执行方式：用 Agent 工具 `run_in_background: true` 派出后台 agent

```yaml
Agent(
  subagent_type: "general-purpose",
  run_in_background: true,
  prompt: "你是 memory writer + refiner。
    先读取 ~/.config/agentkit/config 获取 AGENTKIT_ROOT 的值。

    根据以下完成情况：
    【这一步做了什么：...】
    【关键发现/坑点：...】

    === 第一阶段：项目 memory 更新（在项目仓库执行）===
    1. 覆盖 memory/STATE.md → 写入当前状态
    2. 追加 memory/LOG.md → 一条记录（日期 + 做了什么 + 结果）
    3. 更新 memory/TASK.md → 勾选已完成步骤
    4. 如有坑点/技巧 → 写入 memory/KNOWLEDGE/*.md + INDEX.md
    5. git add memory/ → git commit -m 'memory: 简要描述'

    === 第二阶段：提炼评估（每次必执行，不可跳过）===
    6. 强制分类 Checklist — 对本步骤逐项回答：
       □ 失败模式：是否发现了新的失败模式/踩坑？
       □ 验证方法：是否建立或使用了新的验证/测试方法？
       □ 数据/API坑：是否发现了外部数据源/API 的非显然行为？
       □ 流程改进：是否发现了现有工作流程的缺陷或更好的执行顺序？
       □ 认知修正：是否推翻了之前记录在 harness/domain 中的结论？
       每项回答"否"必须附一句理由。回答"是"的条目进入步骤 7。

    7. 对回答"是"的条目 + 步骤 4 中的新 KNOWLEDGE：
       a. 读取 project.config.yml 的 harness 字段
       b. IF 有 harness → 加载 $AGENTKIT_ROOT/shared/harnesses/<harness>.md
          检查是否已覆盖，未覆盖 → 直接追加到 harness 对应段落
       c. 读取 $AGENTKIT_ROOT/shared/domains/INDEX.md
          检查是否有匹配的 domain 文件需要追加
       d. 对新 KNOWLEDGE（如有）：
          - 读取 PROMOTION_LOG.md 检查候选/晋升
          - 无类似 → 追加[候选]
          - 有类似 → 执行晋升
    8. IF 步骤 7 有任何文件变更：
       git -C $AGENTKIT_ROOT add shared/
       - 如仅追加候选 → git -C $AGENTKIT_ROOT commit -m 'memory: 提炼候选 - 简要描述'
       - 如执行了晋升/追加/修正 → git -C $AGENTKIT_ROOT commit -m 'harness: 简要描述'
  "
)
```

### 纪律

- **完成一步派一次** — 不攒着批量写
- **说"我会更新"但没有派 agent = 违规**
- 代码文件单独 commit，memory 由后台 agent commit
- 会话即将结束时：确保后台 agent 已完成，STATE.md + LOG.md 已 commit

### 遇错先查经验（LOOKUP-BEFORE-FIX）

**遇到任何错误/异常/非预期结果时，禁止直接尝试修复。必须先执行：**

1. **STOP** — 不动手
2. **MEMSEARCH** — 用 Bash 调 `memsearch search "错误信息或关键词" --top-k 5` 语义搜索跨项目知识库
3. **LOCAL SEARCH** — 查本项目 GOTCHAS.md + INDEX.md + harness 失败模式
4. **THEN FIX** — 有记录按记录来，无记录自行排查后写入 GOTCHAS

**反模式**：连续尝试 2+ 种方案而不查经验 = 违规。用户提醒才查 = 违规。跳过 memsearch 直接猜 = 违规。

---

## 通讯规则（仅在 communication.enabled = true 时生效）

**如果 project.config.yml 的 `communication.enabled` 为 `true`：**

- 任何任务完成后，必须通过消息总线通知目标 session。不通知 = 违规。
- 端点和目标从 `communication.endpoint` / `communication.target` 读取。
- `on_checkpoint: true` → CHECKPOINT 完成后也必须通知
- `on_idle: true` → 进入 idle/等待状态时也必须通知
- 禁止只在本地输出结果不发消息总线
- 禁止写文件到 bus_outbox（必须用 API）

```bash
# 示例（实际值从 project.config.yml 读取）
curl -s -X POST $ENDPOINT \
  -H "Content-Type: application/json" \
  -d '{"from":"你的session名","to":"$TARGET","message":"结论内容"}'
```

**如果 `communication.enabled` 为 `false` 或字段缺失 → 跳过所有通讯步骤。**

---

## Mandatory Workflow

- **First**: read `~/.config/agentkit/config` to get `AGENTKIT_ROOT` path (used below for framework/shared references).
- Before any work: read memory/PROJECT.md, memory/STATE.md, memory/TASK.md, memory/LOG.md
- Also consult memory/KNOWLEDGE/INDEX.md for project-specific tips/links.
- Read $AGENTKIT_ROOT/shared/domains/INDEX.md for cross-project domain knowledge (load specific domains on demand).
- If project.config.yml has a harness field, load $AGENTKIT_ROOT/shared/harnesses/<harness>.md as execution baseline.
- **memsearch** 是全局语义搜索引擎（CLI），覆盖所有项目的 memory/KNOWLEDGE + shared/domains。遇到不确定的技术问题时，用 `memsearch search "关键词" --top-k 5` 搜索。
- Follow TDD: tests first → minimal implementation → refactor → checkpoint.

## Knowledge Capture Rule

当发现任何"以后会再用到的技巧/坑/链接"，在 checkpoint 时一并告知后台 agent 写入 memory/KNOWLEDGE/ 对应文件 + INDEX.md。

## Project Config

- See project.config.yml for commands, entry points, and success criteria.

## Reusable Framework

- Follow engineering rules in $AGENTKIT_ROOT/FRAMEWORK.md
- Follow work cadence in $AGENTKIT_ROOT/WORKFLOW.md

## Skill 接管规则

当 Skill 接管工作流时，Skill 自身不包含 memory 更新逻辑。**Skill 执行完毕后，仍需执行 CHECKPOINT。** 不因 Skill 接管而跳过 memory 更新。

## Project-Specific Rules

- 必须使用 Next.js App Router + Tailwind CSS，部署目标 Vercel
- 禁止手动编写工具数据 — 所有工具信息必须通过爬虫/API 自动采集或 LLM 生成
- SEO 是生命线 — 每个页面必须有正确的 meta tags、structured data、语义化 HTML
- 详情页是长尾 SEO 主力 — 每个工具详情页必须独立可索引、有唯一 URL
- 数据更新频率 > 竞品 — 目标每日自动刷新，不接受手动批量更新

## gstack

Use the /browse skill from gstack for all web browsing, never use mcp__claude-in-chrome__* tools.

Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release, /codex, /cso, /autoplan, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade
