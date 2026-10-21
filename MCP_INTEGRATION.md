# 麦当劳 MCP 实际接入

Node 端使用 `@modelcontextprotocol/sdk` 连接 `https://mcp.mcd.cn`（Streamable HTTP），调用 `listTools()` 后调用 `list-nutrition-foods`，参数 `{}`。认证来自 `MCD_MCP_TOKEN`，以 Bearer 请求头发送。浏览器只读取白名单快照，不访问 MCP 或 Token。

## 实际证据与响应

项目 SDK 于 **2026-10-21T03:20:35.542Z** 真实同步成功，返回160条，完全重复项合并后158条。未来以快照 meta 为准。

优先入口是 `structuredContent: {success, code, data}`，data 为 TOON 表格：

```text
[N]{productName,nutritionDescription,energyKj,energyKcal,protein,fat,carbohydrate,sodium,calcium}:
  ...
```

严格解码检查字段、行数和转义。仅结构化内容缺失时，读取文本 `## Original Response` 后的 JSON。存在但无效的结构化内容直接失败，不用另一份文本掩盖错误。禁止执行返回文本。

| 接口字段 | 内部字段 | 边界 |
|---|---|---|
| productName | name/originalName | 保留规格文字，类别本地推断 |
| energyKcal | kcal | 字段明确为 kcal，未说明计量基准 |
| protein/fat/carbohydrate | proteinG/fatG/carbsG | 内部名为预期单位，当前仅展示原始值 |
| sodium/calcium | sodiumMg/calciumMg | 单位待核实，不换算 |
| nutritionDescription | 只参与去重 | 不作为份量或医学结论证据 |

当前官方记录 `basis.unitsVerified=false`，不能从内部字段名推导 g/mg，也不声称每份或每100克。异常数值保留 null 并告警，合法零值保留。同名不同数值记录独立保留，完全重复项合并并记录次数。公开快照不保存 traceId、Token、账号或完整原始响应。

## 复现与失败处理

按[官方指南](https://github.com/M-China/mcd-mcp-server)申请 Token，设置 `MCD_MCP_TOKEN` 或被忽略的 `.env.local`，安装依赖后执行 `pnpm sync:mcd`。成功后原子替换 `public/data/nutrition.snapshot.json`，只输出日期、数量和告警。

单次 HTTP 超时30秒，最多三次尝试，有限退避，Retry-After 等待上限30秒；401不重试。未知格式、网络错误和空数据均不替换旧快照。普通 CI 使用提交的快照和合成夹具，不依赖个人 Token。

## 数据价值与算法

五种透镜、星球大小、邻居、BFS航线和发现卡片均由真实数据驱动。对有效值 log1p 后按全快照线性插值 P5/P95 缩放，退化列0.5。权重热量0.30、蛋白质0.25、其余各0.15；共同有效维度至少三项，重归一权重。相近度 `100 * exp(-distance / 0.5)`。

每节点取分数≥50的Top3，取无向边并集，度数可超过三；并列按稳定ID排序。航线为最少跳数，不强行补边。双生星取跨类别且分数≥80的前五对；孤独星球取完整数据中最近邻相似度最低的五个。过滤与透镜不改变计算基准。

网页、CLI、Skill 复用纯 TypeScript 算法，不依赖运行时大模型。这些是工程探索结果，非官方分类、健康评价、当前供应信息或等重量比较。
