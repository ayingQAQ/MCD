# McCosmos 2.0 升级基线

2026-10-21，基线提交 `3348262`。需求依据仓库根目录 `McCosmos 2.0.md`。

## 当前证据

- 已实际访问 https://mccosmos.pages.dev/ ，页面成功加载。线上仍为此前发布的单页版本。
- `src/app/App.tsx` 集中包含数据加载、筛选、发现弹窗、航线与详情，未安装路由库，没有五个产品页面。
- `GalaxyCanvas.tsx` 已实现 Pointer Events 拖动、双指缩放、滚轮、命中测试、镜头定位、透镜半径过渡；不能把这些现成功能说成缺失。线上实际点击放大按钮成功，快照显示缩放控件与可操作入口。
- `PlanetDetails.tsx` 已有真实营养值、前三邻居、起终点与 PNG 导出；缺少收藏、实验室、跨页深链。
- 当前图鉴是折叠文字列表，不支持独立路由、排序、收藏或营养比较；没有任务与本地进度。
- `loadData.ts`、`schema.ts`、`graph/analysis.ts`、MCP 同步模块及 158 条官方快照均可复用。原有 CI 已覆盖 31 单测和 13 浏览器场景。
- 原创 31 个 SVG 通用食物示例可复用，不应按插画推断商品配方。

初始桌面与手机截图：`.superpowers/upgrade-baseline-desktop.png`、`.superpowers/upgrade-baseline-mobile.png`。后续交互、响应式与深链验证由 Actions 留存 `browser-evidence`。

## 执行约定

按用户已有要求全部在 main 实施，不本地启动、构建或跑测试；使用线上基线操作与 GitHub Actions 替代任务书建议的本地运行。遵循现有单位边界：官方接口未声明 g/mg 或每份，实验室显示接口原始值与差值，不擅自改成“每份 g/mg”。

## 实施方案

使用 React Router 声明式路由，FoodProvider 统一加载/分析数据；URL 保存选中餐品与航线参数，本地版本化存储保存收藏、实验台、最近查看与每日任务进度。保留原有图算法、星图绘制及 MCP 通道。五页共享餐品插画与完整档案，独立插画图库保持可用。
