# 目录提交套件（Submit Kit）评估：一页结论

2026-10-03 · AgentoolRank 负责人 · 回应老板 10-02 23:45 的想法

## 结论

**做，但先用两天做一个能收钱的最小版本，用预售验证需求，不先投入大开发。** 套件挂在 AgentoolRank 品牌和现有 MCP 下，不另起品牌。卖的是"我们亲手跑过的站点档案 + 每站的提交配方"，客户在自己电脑上用自己的 agent 提交。14 天内卖出至少 3 单，再做完整 CLI 和持续更新；卖不出就停，只留免费版给 AgentoolRank 引流。

## 市场：同类的价格和差异

| 类型 | 代表 | 价格 | 弱点 |
|---|---|---|---|
| 代提交服务 | ListingBott、SubmitSaaS、List My Site、Orbator | $49–$499（ListingBott 涨价后 $999） | 贵；客户看不到过程；对 AI 工具类不一定对口 |
| 目录清单 | ScrollLaunch（1,018 个站，免费，带 DR）、SubmitSaaS 数据库、RocketHub、Gumroad 表格 | 免费–$29 | 只有"有没有、免不免费"，没有怎么填、哪里会卡住 |
| agent 自动提交 | Apify Product Directory Submitter（MCP） | 约 $0.9/站 | 通用浏览器 agent 硬闯：9 个用户，成功率 0% |
| 带 MCP 的 SEO 工具 | MyBacklinks | 按额度计费 | 管外链数据，不提供每站配方 |

我们能占的位置：清单便宜但浅，代提交贵且不透明，通用 agent 闯不过去。缺的是**能让客户的 agent 一次跑通的配方**。这正是我们三个项目今天边做边记下来的东西：登录方式、验证码类型、要不要徽章、表单字段的坑、实测是 dofollow 还是 nofollow。

## 家底（如实）

- 共享日志 296 个域名、654 条记录，但**真正打开、走过提交流程的只有约 101 个**，其余是桌面判断。对外不能说"几百个实测"，只能说"100+ 个实测、近 300 个已筛"。
- DR、月访问量来自 columbus 付费数据，**不能放进产品**。我们只卖自己实测的字段，DR 让客户自己查，或者只给"高 / 中 / 低"这种我们自己的判断。
- 档案会过期：站会改版、关站、改收费。每条都标"最后核实日期"，超过 60 天就显示"待复核"。

## MVP（2 个工作日）

1. **免费层**（第 1 天）：/where-to-list 升级成可筛选的站点表，约 100 个实测站，筛选项包括免费/付费、dofollow、登录方式、验证码、徽章。每站只显示结论，不含配方。作用是 SEO 和引流，也给 AgentoolRank 的目录对比页加内容。
2. **付费层**（第 2 天）：
   - 每站一份提交配方：字段怎么对应、一步步怎么填、会卡在哪、遇到验证码时交给人处理。
   - 在现有 AgentoolRank MCP 里加 3 个工具：`list_directories(filters)`、`get_recipe(domain)`、`log_submission(domain, result)`。提交记录存在客户自己的电脑上，也就是 dirsub 的精简版。
   - 用 license key 解锁。Stripe 一次性付款已经接好，直接复用。
3. **红线**：不绕验证码，遇到验证码就交给客户本人；不承诺排名和收录；不带 columbus 字段；不代客户登录任何账号。

## 定价

- **$39 一次性**，含 12 个月档案更新。前 50 单早鸟价 $19，同时作为预售价。
- 定价理由：比清单（免费–$29）多了配方和 agent 接入，比代提交（$49–$499）便宜很多，而且过程透明、账号在客户自己手里。
- 套餐：Submit Kit + AgentoolRank Featured 收录 = $59，比分开买（$39 + $49）便宜。

## 第一个付费客户从哪里来

1. **AgentoolRank 已有的提交者**：提交成功页和 `message_for_human` 里加一行"还想上其他目录？"。这些人正在做外链，最对口。目前每天进来的提交者还很少（G2 外部提交 1/20）。
2. **原创数据文章**：标题类似"我们实测了 100 个目录站：X% 要挂徽章，Y% 名为 dofollow 实为 nofollow"。发 dev.to 和 Indie Hackers，按日历用老板的 X 号发。这类数据本身就是传播点，文末放预售链接。
3. **MCP 目录**：AgentoolRank 已经上了 Smithery。更新描述，把 Submit Kit 写进去。
4. **不做**：不用冷外联推销这个产品。外联渠道只用来讲 AgentoolRank 的排名，混用会伤害送达率。

## 和主线冲不冲突

基本不冲突，还能互相带：

- **外联**：照常每晚 10 封，不受影响。
- **目录提交（T25，每天至少 20 个）**：这本来就是生产配方的过程。今后每提交一个站，都按配方格式记录，相当于边干活边攒产品。
- **类目审计、多语言**：有 2 天开发和它们抢时间。处理方式是类目审计 dry-run 照跑，人工抽查顺延半天；多语言的下一批页型推到下周。
- **风险**：AgentoolRank 本身付费单还是 0，再开一条线可能分散精力。所以只做 2 天，用预售数据决定是否继续。

## 时间表

- 10-03：回复老板，开始写免费层；当天的 20 个目录照做。
- 10-04：付费层（配方、MCP 工具、license），预售上线。
- 10-05 至 10-18：发数据文章，看预售。10-18 出结论：≥3 单就继续投入，否则冻结付费层、保留免费层。

来源：[ListingBott 定价](https://coldiq.com/tools/listingbott)、[同类工具价格对比](https://www.orbator.io/best-directory-submission-tools)、[目录清单与代提交价格](https://www.scrolllaunch.com/directories)、[SubmitSaaS 数据库](https://submitsaas.com/directories)、[Apify Directory Submitter](https://apify.com/prodmarkllc/product-directory-submitter)、[MyBacklinks MCP](https://hekmon8.github.io/mybacklinks-tools/)
