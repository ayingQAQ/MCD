# McCosmos 命令参考

下列 `CLI` 代表 `node "<skill-dir>/scripts/mccosmos.mjs"`；源码模式替换为 `pnpm --dir "<repo-dir>" cosmos:cli --`。参数值有空格时引用整个值。

| 任务 | 命令示例 |
| --- | --- |
| 名称模糊查询、选择实际杯型 | `CLI search --query="冰牛奶" --limit=10` |
| 早餐不超过400 kcal、按热量升序 | `CLI search --category=breakfast --max-kcal=400 --sort=kcal-asc --limit=20` |
| 两款餐品比较 | `CLI compare --from="巨无霸" --to="麦香鱼"` |
| 用稳定 ID 比较 | `CLI compare --from-id="food-..." --to-id="food-..."` |
| 同类别、热量更低的相近替代 | `CLI alternatives --name="巨无霸" --lower-kcal --limit=3` |
| 用户允许跨类别 | `CLI alternatives --id="food-..." --cross-category --max-kcal=400 --min-score=50 --limit=5` |
| 原有相似图邻居 | `CLI neighbors --name="巨无霸" --limit=3` |
| 最少关系跳数航线 | `CLI route --from="巨无霸" --to="双层吉士汉堡"` |
| 跨类别相似对 / 孤独星球 | `CLI discover --kind=twins` / `CLI discover --kind=lonely` |
| 全量原始规格 | `CLI list` 或 `CLI list --category=burger` |

类别：`burger / breakfast / side / drink / dessert / other`，均为本地推断。sort：`name / kcal-asc / kcal-desc / protein-desc`；蛋白质排序仅按接口原始值，不声称 g。limit：1–20，默认3，作用于 search/alternatives/neighbors；list 返回全量。

alternatives 默认同类别、相似度至少50；只在明确解释的探索需求下调整 min-score（0–100），不为了凑结果擅自降低。`--lower-kcal` 使用严格小于；`--max-kcal` 包含上限。缺失热量不满足热量限制。候选按全快照基准计算的相似度降序、稳定 ID 打破并列，包含原记录、差异和链接。它会搜索全部符合条件的餐品，不局限于图上前三条邻边。单位验证状态不同的餐品不作为相似替代候选。

compare 返回 `foods / rows / similarity / links / basisNote`；rows 含 `values / unit / delta / comparable`。delta 是第二项减第一项，缺失或已知单位与原值混用时为 null。原值差仅用于接口记录对照，未证明相同计量基准。不要把差异表自动转换成摄入建议。

## 数据输入

- 不传来源参数：读取包内快照，输出 `dataInput=bundled-snapshot`。
- `--data "/path/snapshot.json"`：读取符合项目 Dataset 模型的外部快照，保留 meta 中的来源与时间。
- `--response "/path/response.json" --fetched-at "2026-10-24T00:00:00Z"`：解析真实 `list-nutrition-foods` 工具响应，时间必须替换为该次实际获取时间，不要照抄示例。接受 `{structuredContent:{success:true,code:200,data:"[N]{...}:..."}}`，或原工具含 `## Original Response` 的 content。若宿主只返回 success/code/data 三字段，保存为 structuredContent 字段的值。不要把整个对话、认证配置或其他工具数据写入文件。
- `--demo`：显式合成演示，所有结果仍标注 synthetic-demo。外部合成快照也必须带 --demo。

--data 与 --response 互斥。--response 与 --demo 互斥。--fetched-at 只与 --response 使用。不会覆盖包内文件或线上数据；响应解析不会重置成“现在”的时间。快照没有门店在售、库存、价格或商品照片数据。

JSON 公共字段：`ok / mode / source / fetchedAt / warnings / dataInput / snapshotAgeHours / data或error`。读取失败时可能只有 ok/error，非零退出。错误码包括 `INVALID_ARGUMENT / NOT_FOUND / AMBIGUOUS / MISSING_BASELINE / NO_ROUTE / DATA_UNAVAILABLE`。`AMBIGUOUS` 的 candidates 是需要用户确认的 ID/名称，不是已经选定的答案。
