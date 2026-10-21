# McCosmos 餐品插画系统

## 范围与依据

原创 React/SVG 组件，统一入口位于 `src/components/food-illustrations/index.ts`。图库独立入口为 `/illustrations.html`，不加入产品导航。已在原 `PlanetStamp` 的餐品展示分支接入，详情卡注明“通用食物造型示意 · 非商品配方图”。营养计算、MCP、图算法、航线和 Canvas 均未修改。Canvas 分享图仍使用原来的绘图流程。

手绘语言参考 [Wired Elements](https://github.com/rough-stuff/wired-elements)、[PaperCSS](https://github.com/papercss/papercss)、[Rough.js](https://github.com/rough-stuff/rough)：自然圆角、不完全对称的轮廓、克制的手绘线与纸张控件。食物路径、配料形状和构图原创，没有引入 Wired/Lit 或整套 PaperCSS。复用项目已有 Rough.js，仅为少量内部线条生成固定种子的路径。

现有菜单提供名称、类别与营养字段，没有可认证的配料清单或商品实物依据。因此本批 **31 个 Preset 全部是通用示例，真实配方映射为 0**。名称解析只选择通用形态，不能作为商品配料说明；不使用营养数据推断配料。板烧等未确认形态的鸡肉汉堡、不认识的带骨小食等回退为待确认纸袋。

## 设计规范

| 项目 | 实现 |
| --- | --- |
| 坐标与背景 | `viewBox="0 0 160 160"`，透明背景 |
| 轮廓 | 暖棕 `#684536`，圆头圆角；主轮廓约 3.2，内部线约 1.5–2.5 |
| 颜色 | 共用 `palette.ts`；自然食物色，容器用柔和红、蓝、绿 |
| 光影 | 实色阴影、奶油色不规则高光，无滤镜、复杂渐变或图片 |
| 食物结构 | 配料分层、局部遮挡、不同剪影；鸡排与牛肉饼使用不同路径 |
| 表情 | 7 种；可关闭；位置与比例随母版变化 |
| 宇宙装饰 | 可选轨道、卫星、星形发卡、小旗；默认关闭 |
| 稳定性 | 固定 Preset 与种子；不在渲染时调用无约束随机数 |
| 尺寸 | ≤64 简化细碎纹理，96 使用中等细节，≥128 完整细节 |
| 动画 | 默认关闭；轻微 CSS 位移，尊重 `prefers-reduced-motion`；导出时强制关闭 |

## 调用与扩展

```tsx
import {
  FoodIllustration,
  resolveFoodIllustration,
  downloadFoodIllustrationSvg,
  type FoodIllustrationPreset,
} from './components/food-illustrations';

<FoodIllustration
  foodId="burger-double"
  size={160}
  expression="happy"
  cosmic
  animated={false}
  title="双层牛肉汉堡 · 通用造型示例"
  className="my-food"
/>

// 真实菜单只按已有名称/类别选择通用形态，旁边应保留示意说明。
const match = resolveFoodIllustration({ id: food.id, name: food.name, category: food.category });
<FoodIllustration foodId={match.presetId} size={96} decorative />;

// 自定义组合：layers 自上而下排列，优先于 ingredients。
const example: FoodIllustrationPreset = {
  id: 'example-burger', name: '自定义蛋层示例', family: 'burger', variant: 'custom',
  bun: 'flat',
  layers: [{ kind: 'egg', thickness: 16 }, { kind: 'cheese', offsetX: -2 }, { kind: 'beef', thickness: 18 }],
  expression: 'curious', decorations: ['orbit'], layoutSeed: 83,
  mapping: 'generic-example', notes: '自定义通用组合，非商品配方。',
};
<FoodIllustration preset={example} size={256} />;

await downloadFoodIllustrationSvg({ foodId: 'burger-double', size: 256, cosmic: true });
```

`size` 支持任意正数；图库提供 48、64、96、128、160、256。支持 `title`、`aria-label`，默认输出可访问标题；旁边已有等价名称时可用 `decorative`。未注册 `foodId` 回退纸袋。示例兼容别名 `big-mac` 指向通用三片面包叠叠堡，**不表示已验证巨无霸配方**。

新增插画优先在 `presets/foods.ts` 组合已有食材/容器；新结构才扩展 `templates/`，新颜色先加入统一调色板。`colors` 只接受六位十六进制实色。自定义厚度应保持整体在 160 坐标内，过高汉堡需调整层厚，不能无限堆叠。

## 已覆盖的 31 个示例

| 母版 | 数量 | 造型与变化 |
| --- | ---: | --- |
| 汉堡 | 6 | 单层、双层、垂角芝士、酥脆鸡排、三片面包叠层、长面包培根蛋 |
| 薯条 | 3 | 小、中、大份；长度、角度、密度及盒身比例变化 |
| 饮品 | 5 | 冷饮纸杯、冰块透明杯、热饮杯盖、陶杯奶咖、小浓缩杯 |
| 鸡块小食 | 3 | 不规则单块、三块盒装蘸酱、纸袋堆叠 |
| 甜品 | 7 | 香草甜筒、巧克力淋面、草莓高脚杯、原味高脚杯、曲奇纸杯、封边派、切口果馅派 |
| 早餐 | 4 | 扁圆麦芬、蛋层麦芬、培根蛋层麦芬、煎蛋吐司餐盘 |
| 卷类 | 2 | 露馅鸡肉卷、隐藏馅料折角卷 |
| 回退 | 1 | 待确认封口纸袋 |

尚未专门绘制：带骨鸡翅/鸡腿、烤鸡排汉堡、沙拉、粥、瓶装/盒装饮品，以及其他没有可靠结构依据的商品。没有官方包装 Logo，也没有把这批通用组合标为真实餐品复刻。

## 图库与独立导出

图库支持类别筛选、变体选择、六档尺寸、七种表情、普通/宇宙模式、选中项轻动画，以及浅色、深色、棋盘背景。每项显示名称、类别、Preset ID、映射状态和装饰模式。

“导出独立 SVG”会直接序列化组件，携带命名空间、尺寸及全部路径，无外部 CSS、图片、字体服务或 React 运行依赖。`renderFoodIllustrationSvg` 可获取字符串，`downloadFoodIllustrationSvg` 用于浏览器下载。

CI 执行 `pnpm illustrations:export`，产出 `food-illustrations-svg` Artifact：

- `plain/*.svg`：31 张普通模式。
- `cosmic/*.svg`：31 张宇宙模式。
- `manifest.json`：名称、类别、变体与映射状态。
- `index.html`：可离线打开的双模式总览。

## 验证记录

所有测试、类型检查、Lint、构建和浏览器运行均在 GitHub Actions 执行，没有在本地构建或跑测试。

[基础完整验证 39543894701](https://github.com/ayingQAQ/McCosmos/actions/runs/39543894701) 已通过：31 项单元测试、13 项 Playwright 浏览器测试、类型检查、Lint、生产构建、62 份静态 SVG 导出与比赛数据验证。首次接口测试先确认失败，再实现母版与导出。

已人工查看 CI 提供的浅色/深色整页图库、64px 移动端甜品与导出后独立打开的 SVG 截图。最终提交继续由同一工作流验证，并补充全部 48px 无表情、160px 宇宙模式截图；截图位于 `browser-evidence` Artifact。测试覆盖稳定结构、差异化、表情、尺寸细节、回退、命名空间、无外部依赖、下载、减少动态效果及移动端无横向溢出。原有营养、筛选、图谱、航线等浏览器用例保留。
