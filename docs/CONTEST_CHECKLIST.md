# 比赛交付清单

- [x] Public 仓库 McCosmos，产品 McCosmos · 麦门星图。
- [x] README 包含用途、目标用户、安装、示例、来源和边界。
- [x] 官方参赛声明原始字节副本，CI 校验 Git blob SHA。
- [x] MCP_INTEGRATION 说明真实工具、流程和价值。
- [x] 网页、同步工具、CLI、Skill，官方/合成来源分开。
- [x] CI 不需要个人 Token，浏览器不访问凭据。
- [x] main Actions 全部通过，实际证据见实施记录。
- [x] 人工审阅桌面/平板/手机四档截图与比较/任务 PNG，保存在 docs/screenshots。
- [x] 在线部署 https://mccosmos.pages.dev ，页面/脚本/营养快照可访问。
- [x] 报名 Issue 前重新核对官方规则及声明原文。
- [x] 按四行纯文本格式提交[参赛 Issue #960](https://github.com/M-China/mcd-developer-innovation-challenge/issues/960)。

2026-10-21 已将仓库由 `ayingQAQ/MCD` 更名为 `ayingQAQ/McCosmos`，保持 Public 和 main 分支，项目地址为 https://github.com/ayingQAQ/McCosmos 。Issue 已提交；报名是否成功以主办方系统回复为准。

按当前官方规则，报名截止北京时间2026-10-25 23:59；提交前再次核对。项目地址使用纯URL。构建工作流不会自动报名、发布Issue或兑奖。

2.0 完成五页导航、共享收藏、营养实验室和三类每日任务。约60秒演示与12条验收路径见 [USER_JOURNEYS.md](USER_JOURNEYS.md)；42项单测、29项浏览器测试与发布证据见 [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md)。

## 2026-10-24 Skill 核心优化

- [x] Skill 支持自然语言餐品对比、热量条件筛选和有解释依据的相似替代，复用原有算法。
- [x] 发布 [skill-v1.0.0 独立包](https://github.com/ayingQAQ/McCosmos/releases/tag/skill-v1.0.0)，Node.js 24 即可运行，不依赖网页或仓库。
- [x] README、GitHub About 优先介绍 Skill；网页保留为可视化入口。
- [x] 来源/获取时间、原值单位、规格消歧、缺失/零值、无结果与失败不回退均有实现和测试。
- [x] 全量 [Actions #40034749294](https://github.com/ayingQAQ/McCosmos/actions/runs/40034749294)：68 项单测与62项浏览器回归通过；独立包七场景执行通过。
- [x] 新上下文 Agent 已独立选参并在远程实际调用，详见 [验收记录](SKILL_ACCEPTANCE.md)。此记录不替代每种客户端的安装与自动发现验证。
- [x] 重新读取官方报名回复，#960 已收到官方“成功参赛”通知；最终资格核验仍以官方规则为准。
- [x] 新参赛简介已整理为 [草稿](CONTEST_SUBMISSION_DRAFT.md)，没有自动修改官方报名 Issue。
