# McCosmos · 已确认设计

视觉细则见根目录 McCosmos.md，以下已批准修订优先：

- 温暖、明亮、留白的卡通宇宙绘本。参考 Wired Elements、PaperCSS、Rough.js 的线条性格，布局与星球原创。
- 官方 MCP → Node 严格适配 → 白名单快照 → 网页/CLI 共用纯 TypeScript 算法，无运行时大模型或前端 Token。
- 未确认单位与计量基准不得补造；记录级来源区分官方和合成。
- log1p、线性插值P5/P95、退化列0.5、tau=0.5、阈值50；Top3取无向并集；双生星阈值80；并列稳定ID排序；BFS最少跳数。
- 筛选只影响显示；航线可临时展示筛选外星球。透镜不改变计算基准或坐标。
- 五透镜、详情/邻居、航线、双生星、孤独星球、中文PNG、可访问图鉴与移动布局为必做。
- 离线包包含数据与字体，以本地Node HTTP启动；无Service Worker。
- 用户要求所有代码在main，GitHub Actions执行测试/类型检查/lint/构建/浏览器验收。
- Node24、pnpm11.21.0、React、Canvas2D、自绘SVG、d3-force、Rough.js、Zod、TOON、MCP SDK。
