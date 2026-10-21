# McCosmos 三维星系重构

本任务替代此前的二维和 2.5D 方案。采用 Three.js + WebGL2 + PerspectiveCamera，不使用 CSS 变换伪装三维；继续使用 React HTML 面板与现有真实营养业务。

1. 稳定布局：六个三维椭球星团，中心在 XYZ 上错开。通过固定 ID 排序、体积采样和三维最小距离约束生成坐标；切换透镜、筛选和详情时不重排。营养不用于推断配料或深度。
2. 渲染：共享轻量球几何、卡通漫反射和原创程序手绘纹理，球面与背面轮廓形成体积。背景使用一组批量三维粒子、雾与柔和天空；关闭高成本后处理，DPR 上限 1.5。
3. 相机：OrbitControls 左键旋转，右键平移、滚轮和双指改变真实相机位置；保留阻尼、限制探索边界与近距离碰撞。初始斜视局部星空，重置回出发视角，全景为单独的显式动作。
4. 联动：Raycaster 拾取球体和关系线；选择后插值移动 camera.position 和 controls.target，按侧栏占用调整透视视窗。进入详情前保存视角，关闭详情或返回漫游恢复。分类和三维星团标签可飞向对应体积；路线使用三维曲线。
5. 生命周期：可见页才渲染；移除监听和动画，释放 controls、geometry、material、texture 与 renderer。WebGL 不可用时显示明确说明并保留 HTML 餐品目录和详情，不伪称二维回退为三维。
6. 验证：真实 WebGL 浏览器、旋转视差、相机位移、Raycaster 点击、平滑聚焦/恢复、透镜稳定坐标、手机触控、GPU 资源清理。全部由 GitHub Actions 执行；本地仅编辑与安装依赖。

参考站 https://shiyun.cohenjikan.com/ 用于理解空间观察、靠近和前后遮挡；不复制其荧光配色、素材或源码。

## 代码入口与接入

- `src/components/GalaxyCanvas.tsx` 保留 React 接口，并按需加载三维模块；其他页面不必下载 Three.js。
- `src/galaxy/scene.ts` 管理真实相机、球体、三维关系线、Raycaster、视角保存与资源生命周期。
- `src/galaxy/materials.ts` 生成本地原创 UV 笔触和卡通光照材质；Canvas2D 只用于绘制材质纹理，不承担星系渲染。
- `src/graph/layout.ts` 生成稳定三维体积分布。当前最小球心间距 118，基础球体半径 21～41；缺失值使用单独的 16，不作为零值。
- 餐品插画后续可使用 `THREE.Sprite(new THREE.SpriteMaterial({map,depthTest:true}))` 挂到对应的 `planet.group`，以 `sprite.scale` 指定世界尺寸。现有标签已经采用这一真实世界坐标中的 Sprite 机制，不能另加屏幕空间食物贴图冒充三维。

GitHub Actions 使用 SwiftShader 软件 WebGL2 执行原生旋转、平移、双指缩放、拾取、聚焦/返回、分类联动、移动端深链接与 GPU 清理测试；截图案例使用较长预算。软件渲染验证不代表对所有真实设备帧率的承诺。


## 餐品视觉更新（2026-10-21）

暖色浅底替换深蓝背景。原创 SVG 通过构建脚本生成本地文件，以世界坐标 Sprite 展示餐品形态，启用透视、alphaTest、深度写入和雾化；相同母版共享纹理。营养大小和三维球体拾取代理保持一致。图鉴及档案使用单独的真实菜单图片映射，参见 [FOOD_IMAGES](FOOD_IMAGES.md)。
