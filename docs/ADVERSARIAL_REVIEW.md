# Adversarial Review — agentoolrank.com

> 2026-03-31 | Codex 对抗性审查 + Claude 修复方案

---

## 一、代码问题（可立即修复）

### C1. [CRITICAL] Intelligence → System Prompt 的 Prompt Injection 链
- **现状**：`intelligence` JSON 从 GitHub README 生成后直接拼入 system prompt，无过滤
- **风险**：恶意工具作者在 README 里埋指令可污染推荐结果
- **修复**：对 intelligence 字段做结构化提取，过滤 instruction-like 文本，限制每个字段长度

### C2. [CRITICAL] 无输入预算控制，成本 DoS
- **现状**：不限消息条数/长度/总 token，每次读全表 461 工具拼入 prompt
- **风险**：攻击者构造超长对话刷爆 LLM 成本
- **修复**：加消息条数上限(10条)、单条长度上限(2000字符)、总 token 预算

### C3. [CRITICAL] 速率限制可绕过
- **现状**：进程内 Map + x-forwarded-for，冷启动重置
- **风险**：伪造 IP 绕过，Serverless 多实例放大
- **修复**：改用 Turso 持久化限流，只信任 Vercel 提供的真实 IP

### C4. [HIGH] Blueprint JSON 输出全靠模型自觉
- **现状**：system prompt 要求 fenced JSON，但无服务端校验
- **风险**：Kimi 输出非标格式时 Blueprint UI 降级为纯文本
- **修复**：前端增加 JSON 解析容错 + 降级提示

### C5. [HIGH] getValidToolIds() 取了但没用
- **现状**：代码取了合法 ID 集合，但未校验 LLM 输出
- **风险**：幻觉 tool_id 变成死链接
- **修复**：删除无用代码，或在前端做 ID 校验（已有工具→链接，未知→标记 External）

### C6. [HIGH] 错误处理泄漏内部信息
- **现状**：`err.message` 直接返回客户端
- **修复**：返回统一错误码，服务端记录详细日志

### C7. [HIGH] save-stack 无鉴权无限流
- **现状**：任何人可批量写入垃圾蓝图
- **修复**：复用 IP 限流 + schema 校验 + 字段长度限制

### C8. [MEDIUM] 外部工具走 Google btnI 跳转
- **现状**：External 工具链接到 Google "I'm Feeling Lucky"
- **修复**：维护外部工具 URL 白名单，未知工具显示纯文本

---

## 二、战略问题（需方案规划）

### S1. [HIGH] "Blueprint 是差异化" 缺乏证据
- **诊断**：当前只测量曝光/访问/upvote，没有 outcome metric
- **修复方案**：
  1. 加埋点：blueprint-save → tool-click → outbound-click（affiliate）→ 7日回访
  2. 定义北极星指标：**Blueprint-to-Tool-Click Rate**（蓝图产生的实际工具访问）
  3. 每周复盘：哪些蓝图类型转化最高？哪些工具被点最多？
  4. 用数据证明或证伪 Blueprint 的价值，而不是凭直觉

### S2. [HIGH] Tool Intelligence 是 README 二次蒸馏，不构成壁垒
- **诊断**：README 是厂商自述，二次摘要不是新事实，抽样 QA 浅
- **修复方案**：
  1. **短期**：给每条 intelligence 加 `source`（readme/user/community）和 `confidence` 分
  2. **中期**：引入真实信号 — GitHub issue 响应速度、PR merge 率、npm 下载趋势、文档完整度评分
  3. **长期**：UGC 层 — 让用户提交使用体验/踩坑记录，这才是竞品无法复制的数据
  4. **护城河公式**：Intelligence = 自动采集基础数据 + 社区贡献使用经验 + 时间序列变化

### S3. [MEDIUM] 增长策略依赖创始人分发，护城河为零
- **诊断**：渠道全是 X/Reddit/HN/PH，newsletter 0 订阅
- **修复方案**：
  1. **Blueprint 模板库**：把高质量蓝图沉淀为可搜索的模板库（SEO 长尾页）
  2. **嵌入式分发**：Featured Badge 让工具方主动引流（已有，需推广）
  3. **社区贡献**：允许用户提交/修改蓝图，形成 UGC 飞轮
  4. **邮件资产**：每周 "Top Blueprints" newsletter 积累自有渠道
  5. **API 化**：开放 Blueprint API 让其他工具/IDE 接入

### S4. [MEDIUM] 产品容易被复制
- **诊断**：prompt + JSON renderer + 公共工具目录，技术壁垒低
- **修复方案**：
  1. **数据壁垒**：真实使用数据 > README 摘要（参考 S2）
  2. **网络效应**：用户生成蓝图越多 → 推荐越准 → 更多用户来
  3. **品牌壁垒**：成为 "AI 工具选型" 品类的第一联想词
  4. **速度壁垒**：保持数据更新频率（每日）> 所有竞品

---

## 三、优先级排序

### 立即修复（本周）
1. C2 — 输入预算控制（防止成本爆炸）
2. C3 — 持久化限流（防止滥用）
3. C6 — 错误信息脱敏
4. C7 — save-stack 加限流和校验

### 短期修复（2周内）
5. C1 — Intelligence 字段过滤（防投毒）
6. C5 — 删除或使用 validToolIds
7. C4 — JSON 解析容错
8. S1 — 加埋点（blueprint-save → tool-click 漏斗）

### 中期规划（1-2月）
9. S2 — Intelligence 引入真实信号
10. S3 — Blueprint 模板库 + newsletter
11. C8 — 外部工具 URL 白名单
12. S4 — UGC 蓝图提交功能
