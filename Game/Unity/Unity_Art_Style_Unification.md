# Unity 美术风格统一实战技巧

> 游戏美术风格统一是**项目成败的关键之一**——技术再强，美术割裂就是"业余感"。本文从**风格定位、色彩、光照、模型、贴图、后处理**全链路讲解工业级统一方案。

---

## 🎨 一、为什么风格统一这么重要？

### 风格不统一的典型表现

| 现象 | 后果 |
|------|------|
| 写实角色 + 卡通场景 | 玩家出戏 |
| 不同模型多边形密度差 10 倍 | 视觉跳跃 |
| 贴图分辨率从 512 到 4K 混用 | 一眼劣质感 |
| 光照参数随意，每个场景一种风 | 整体凌乱 |
| 字体、UI 风格不统一 | 业余气息 |

> 💡 **核心定律**：**一致的低质感 > 不一致的高质感**
> 例：Among Us 全程简陋图形，但风格高度统一 → 全球爆款

---

## 🎯 二、第一步：建立 Art Bible（美术圣经）

### Art Bible 是什么？

项目美术的**唯一真理来源**，所有美术决策的依据。AAA 项目都有。

### Art Bible 核心内容（推荐模板）

```
📘 项目美术圣经.md / .pdf

1️⃣ 风格定位
   - 参考游戏：原神 + 风之旅人
   - 一句话风格：东方奇幻卡渲，明亮治愈

2️⃣ 色彩方案
   - 主色板（5-7 色 HEX 码）
   - 辅助色板
   - 禁用色（如：纯黑、荧光绿）

3️⃣ 光照规范
   - 主光强度区间
   - 阴影颜色
   - 时间段色温变化

4️⃣ 模型规范
   - 主角面数：30k-50k
   - 杂兵：5k-10k
   - 场景物件：500-3000
   - 拓扑要求（四边面、布线规范）

5️⃣ 贴图规范
   - 角色：2K
   - 场景大件：1K
   - 小物件：512
   - PBR 流程：金属度/粗糙度

6️⃣ UI 规范
   - 字体（标题/正文）
   - 圆角半径
   - 阴影/描边规则

7️⃣ 特效规范
   - 粒子风格：实心色块 / 渐变软边
   - 火/水/电的统一表现

8️⃣ 反面教材
   - "不能这样做" 的具体例子
```

### 工具推荐

| 工具 | 用途 |
|------|------|
| **Notion / Confluence** | 团队协作文档 |
| **PureRef** ⭐ | 参考图收集神器（免费） |
| **Miro / FigJam** | 风格情绪板 |
| **Figma** | UI 规范 |

---

## 🌈 三、色彩管理（最重要！）

### 为什么色彩是统一的核心？

**90% 的"美术不统一"问题，本质是色彩问题。**

### 色彩三大要素

```
色相（Hue）       → 红/黄/蓝
饱和度（Saturation）→ 鲜艳 vs 灰
明度（Value）      → 亮 vs 暗
```

### 色板设计原则

#### 1. 主辅色比例：**60-30-10 法则**

```
主色  60%  ████████████  环境主调（草地绿/沙漠黄）
辅色  30%  ██████        次要元素（建筑/服装）
点缀  10%  ██            UI/特效/重点物件
```

#### 2. 经典色板示例

| 风格 | 主色 | 辅色 | 点缀 |
|------|------|------|------|
| **奇幻治愈**（原神） | #87CEEB 天蓝 | #F5DEB3 米色 | #FF6B6B 珊瑚红 |
| **黑暗哥特**（黑魂） | #1A1A2E 深蓝 | #4A4A4A 灰 | #DAA520 金 |
| **赛博朋克**（CP2077） | #0A0E27 深紫 | #00FFFF 青 | #FF00FF 品红 |
| **像素温馨**（星露谷） | #87CEEB 天蓝 | #228B22 草绿 | #FFD700 金黄 |

### 工具：色板生成

| 工具 | 用途 |
|------|------|
| **Adobe Color** 🔗 color.adobe.com | 自动生成调和色板 |
| **Coolors.co** ⭐ | 一键生成 5 色板 |
| **Khroma** | AI 色板生成（基于喜好训练） |
| **Paletton** | 经典色彩理论生成器 |

### Unity 色彩管理

```csharp
// 全局色彩管理 ScriptableObject
[CreateAssetMenu(menuName = "Art/Color Palette")]
public class ColorPalette : ScriptableObject
{
    [Header("主色板")]
    public Color primary = new Color(0.53f, 0.81f, 0.92f);
    public Color secondary = new Color(0.96f, 0.87f, 0.70f);
    public Color accent = new Color(1f, 0.42f, 0.42f);

    [Header("UI 色板")]
    public Color uiBackground;
    public Color uiText;
    public Color uiHighlight;

    [Header("功能色")]
    public Color hpRed = Color.red;
    public Color mpBlue = Color.blue;
    public Color expGold = Color.yellow;
}
```

### URP/HDRP 色彩空间

```
Project Settings → Player → Other Settings
└── Color Space: Linear  ⭐ (绝对不要用 Gamma)
```

> ⚠️ **Linear 色彩空间是 PBR 渲染的基础**，新项目必选

---

## 💡 四、光照统一（决定项目质感）

### 一致光照的核心：**Lighting Profile**

每个场景使用统一光照参数，避免每个关卡风格不同。

### 关键光照参数清单

```csharp
[CreateAssetMenu(menuName = "Art/Lighting Profile")]
public class LightingProfile : ScriptableObject
{
    [Header("主光（太阳）")]
    public float sunIntensity = 1.2f;
    public Color sunColor = new Color(1f, 0.95f, 0.85f);
    public Vector3 sunRotation = new Vector3(45, -30, 0);

    [Header("环境光")]
    public AmbientMode ambientMode = AmbientMode.Trilight;
    public Color skyColor;
    public Color equatorColor;
    public Color groundColor;
    public float ambientIntensity = 1f;

    [Header("雾效")]
    public bool fogEnabled = true;
    public Color fogColor = new Color(0.7f, 0.8f, 0.9f);
    public float fogDensity = 0.005f;
    public FogMode fogMode = FogMode.ExponentialSquared;

    [Header("反射")]
    public Cubemap skyboxReflection;
    public float reflectionIntensity = 1f;

    public void Apply()
    {
        RenderSettings.ambientMode = ambientMode;
        RenderSettings.ambientSkyColor = skyColor;
        RenderSettings.fogColor = fogColor;
        RenderSettings.fogDensity = fogDensity;
        // ...
    }
}
```

### 光照风格分类

| 风格 | 主光特点 | 阴影 | 雾效 |
|------|---------|------|------|
| **明亮卡通** | 高强度暖色 | 软阴影、彩色 | 浅蓝雾 |
| **写实日间** | 自然色温 | 硬阴影 | 远雾 |
| **黑暗恐怖** | 低强度冷色 | 浓重黑影 | 浓雾 |
| **奇幻梦幻** | 紫粉色光 | 软阴影、彩色 | 体积雾 |

### Unity 光照设置最佳实践

```
Window → Rendering → Lighting

Scene 标签页：
├── Skybox Material        → 全项目统一 Skybox
├── Sun Source             → 指定主光
├── Realtime Lighting      → Realtime GI (动态时关闭)
├── Mixed Lighting         → Baked Indirect (推荐)
└── Lightmapping Settings
    ├── Lightmapper        → Progressive GPU
    ├── Lightmap Resolution → 40 (移动) / 60-80 (PC)
    ├── Lightmap Size      → 1024 (默认) / 2048 (高品质)
    └── Compress Lightmaps → 必开
```

### 反射探针（Reflection Probes）

```csharp
// 自动放置反射探针的脚本
public class AutoReflectionPlacer : MonoBehaviour
{
    [SerializeField] private float spacing = 20f; // 每 20m 一个
    [SerializeField] private LayerMask groundLayer;

    void Place()
    {
        for (float x = -100; x < 100; x += spacing)
        for (float z = -100; z < 100; z += spacing)
        {
            if (Physics.Raycast(new Vector3(x, 100, z), Vector3.down,
                out var hit, 200, groundLayer))
            {
                var probe = new GameObject("ReflectionProbe");
                probe.transform.position = hit.point + Vector3.up * 2;
                probe.AddComponent<ReflectionProbe>();
            }
        }
    }
}
```

---

## 🎨 五、Shader 统一

### 风格统一的关键：**所有物体用同一套 Shader**

不要让美术随便选 Shader！必须统一管控。

### 主流风格 Shader 方案

#### 1. 卡渲（Toon Shading）⭐ 二次元/卡通游戏首选

```hlsl
// 简化版 Toon Shader 核心
float NdotL = dot(normalize(normal), normalize(lightDir));
float toonShade = step(0.5, NdotL); // 硬边阶梯
fixed3 color = lerp(shadowColor, baseColor, toonShade);
```

**推荐插件**：
- **Unity Toon Shader (UTS3)**（免费 ⭐ 官方出品）
- **Lily Toon Shader**（免费，VRChat 标准）
- **MK Toon Shader**（$30）

**代表游戏**：原神、塞尔达 BoTW、崩坏星穹铁道

#### 2. PBR 写实

```
Standard Shader (Built-in)
URP/Lit
HDRP/Lit + Subsurface Scattering
```

**关键统一参数**：
- 金属度（Metallic）的全局校准
- 粗糙度（Roughness）的最小/最大值

#### 3. 低多边形（Low Poly）

```hlsl
// 平面着色：去除顶点法线插值
float3 flatNormal = normalize(cross(ddy(worldPos), ddx(worldPos)));
```

### Shader 库统一管理

```
Assets/
└── _Art/
    └── Shaders/
        ├── Character/
        │   ├── Character_Toon.shader      ⭐ 角色统一用此
        │   └── Character_Hair.shader
        ├── Environment/
        │   ├── Env_Standard.shader        ⭐ 场景统一
        │   ├── Env_Water.shader
        │   └── Env_Foliage.shader
        ├── Effects/
        │   ├── VFX_Toon.shader
        │   └── VFX_Dissolve.shader
        └── UI/
            └── UI_Outline.shader
```

> 💡 **强制规范**：通过 Shader Graph 创建主 Master Shader，所有变体从这里继承

---

## 🖼️ 六、贴图规范

### 分辨率分级（必须严格遵守！）

| 物体类型 | 分辨率 | 备注 |
|---------|--------|------|
| **主角** | 2K (2048) | 高品质 PBR |
| **重要 NPC** | 1K-2K | |
| **杂兵** | 512-1K | |
| **场景大物件**（建筑） | 1K-2K | 多套 UV |
| **道具/小物件** | 256-512 | |
| **UI** | 由屏幕尺寸决定 | 一般 1K 内 |
| **Skybox** | 2K-4K | HDR EXR 格式 |

### PBR 贴图规范

```
统一命名约定：
{物体名}_{贴图类型}.{格式}

[角色名]_BaseColor.png      ← 漫反射
[角色名]_Normal.png         ← 法线
[角色名]_Metallic.png       ← 金属度
[角色名]_Roughness.png      ← 粗糙度
[角色名]_AO.png             ← 环境光遮蔽
[角色名]_Emissive.png       ← 自发光
```

### 通道打包（性能优化）

```
传统：4 张贴图，4 次采样
优化：1 张 Mask 贴图，1 次采样
└── R 通道：金属度 (Metallic)
└── G 通道：粗糙度 (Roughness)
└── B 通道：AO
└── A 通道：自定义（如 Emission Mask）
```

```csharp
// Unity Sample
fixed4 mask = tex2D(_MaskMap, uv);
float metallic = mask.r;
float roughness = mask.g;
float ao = mask.b;
```

### Texture Streaming（开放世界必备）

```
Project Settings → Quality → Texture Streaming
└── Streaming Mipmaps: Enabled  ⭐
└── Memory Budget: 4096 MB
```

---

## 🔷 七、模型规范

### 多边形预算

| 类型 | 推荐面数 | 上限 |
|------|---------|------|
| **主角（PC）** | 30k-50k | 80k |
| **主角（移动）** | 8k-15k | 25k |
| **NPC** | 10k-20k | |
| **杂兵** | 3k-8k | |
| **大型 Boss** | 50k-100k | |
| **建筑（单体）** | 5k-15k | |
| **小道具** | 200-1000 | |
| **环境装饰** | 100-500 | |

### 拓扑规范

```
✅ 必须：四边面（quad-based）拓扑
✅ 必须：变形区域加密布线（关节/面部）
✅ 必须：UV 不重叠，余量充足
❌ 禁止：N-gon（5边及以上）
❌ 禁止：三角面（变形区）
❌ 禁止：UV 拉伸严重
```

### LOD 模型规范

```
LOD 0 (近)：100% 面数
LOD 1 (中)：50%
LOD 2 (远)：20%
LOD 3 (极远)：5% 或 Impostor
```

### 推荐建模工具

| 工具 | 用途 | 价格 |
|------|------|------|
| **Blender** ⭐ | 全能免费 | 免费 |
| **Maya** | 行业标准 | $1700/年 |
| **3ds Max** | 游戏行业 | $1700/年 |
| **ZBrush** | 雕刻、高模 | $895 |
| **MarvelousDesigner** | 布料模拟 | $50/月 |

---

## 🎬 八、动画风格统一

### 动画时长 / 节奏规范

| 动作类型 | 帧数（30fps） | 说明 |
|---------|--------------|------|
| 待机循环 | 90-120 帧 | 3-4 秒 |
| 走路循环 | 30-40 帧 | 1秒 1.3 步 |
| 跑步循环 | 20-26 帧 | 1秒 1.5 步 |
| 轻攻击 | 25-40 帧 | 快节奏 |
| 重攻击 | 50-80 帧 | 有蓄力 |
| 死亡 | 60-120 帧 | 慢 |

### 风格归一化

**问题**：从 Mixamo 下载的动画 + 自制动画 = 风格不一致

**解决**：
1. **统一骨骼**（Humanoid Rig）
2. **统一动画曲线风格**（卡通用阶梯曲线、写实用平滑曲线）
3. **统一根骨节奏**（重心起伏幅度）

### Animation Retargeting

```
所有角色用 Humanoid Rig
→ 同一套动画可用于所有人形角色
→ 风格自然统一
```

---

## ✨ 九、特效统一（VFX）

### 特效是最容易破坏统一性的地方！

```
❌ 错误：火焰用写实粒子，魔法用卡通色块
✅ 正确：火焰和魔法用相同的视觉语言
```

### 风格化粒子规范

```
卡通风格 VFX 特征：
- 边缘清晰（无柔光）
- 高饱和色彩
- 形状简洁（圆形/星形）
- 颜色梯度统一（如：黄→橙→红）

写实风格 VFX 特征：
- 柔和边缘（高斯模糊）
- 物理正确的光效
- 复杂粒子（火苗细节）
- 真实物理（重力/湍流）
```

### 颜色统一规则

```
火系 → 用色板中的"暖色组"（红/橙/黄）
冰系 → 用色板中的"冷色组"（蓝/青/白）
雷系 → 用色板中的"高亮组"（黄/紫）
治疗 → 用色板中的"治愈组"（绿/金）
```

### 推荐 VFX 工具

| 工具 | 用途 |
|------|------|
| **Unity VFX Graph** ⭐ | GPU 高性能粒子（URP/HDRP） |
| **Unity Shuriken** | 传统粒子系统 |
| **Houdini** | 工业级 VFX 制作 |
| **EmberGen** | 实时火焰流体 |

---

## 🎭 十、UI 风格统一

### UI 是最容易"露馅"的地方

```
游戏内画面：写实奇幻
UI：扁平 Material Design
→ 出戏 ❌
```

### UI 设计令牌（Design Tokens）

```csharp
[CreateAssetMenu(menuName = "UI/Design Tokens")]
public class UIDesignTokens : ScriptableObject
{
    [Header("颜色")]
    public Color primary;
    public Color secondary;
    public Color background;
    public Color text;

    [Header("间距")]
    public float spacingXS = 4;
    public float spacingSM = 8;
    public float spacingMD = 16;
    public float spacingLG = 32;

    [Header("圆角")]
    public float radiusSmall = 4;
    public float radiusMedium = 8;
    public float radiusLarge = 16;

    [Header("字体")]
    public TMP_FontAsset fontTitle;
    public TMP_FontAsset fontBody;
    public int fontSizeBody = 14;
    public int fontSizeTitle = 24;
}
```

### UI 统一原则

| 维度 | 统一要求 |
|------|---------|
| **字体** | 全游戏 ≤ 2 种字体（标题 + 正文） |
| **图标** | 同一套图标包，不混用 |
| **按钮** | 统一形状（矩形/胶囊/圆角） |
| **颜色** | 主辅色板 + 功能色（成功绿/失败红） |
| **动效** | 统一缓动曲线（DOTween Ease） |
| **音效** | UI 点击/悬停统一音效 |

---

## 🎚️ 十一、后处理（Post-Processing）

### 后处理是统一画面的"魔法"

**所有场景共用一套基础 Volume → 自动统一**

### 必备后处理效果

```csharp
// URP Volume 配置
[CreateAssetMenu(menuName = "Art/Post Process Profile")]
public class PostProcessConfig : ScriptableObject
{
    [Header("Bloom（辉光）")]
    public float bloomIntensity = 0.5f;
    public float bloomThreshold = 1f;
    public Color bloomTint = Color.white;

    [Header("Color Adjustments")]
    public float postExposure = 0;
    public float contrast = 10;
    public Color colorFilter = Color.white;
    public float saturation = 0;

    [Header("Vignette（暗角）")]
    public float vignetteIntensity = 0.3f;
    public Color vignetteColor = Color.black;

    [Header("Tonemapping")]
    public TonemappingMode mode = TonemappingMode.ACES; // ⭐ 写实首选

    [Header("Color Grading")]
    public Texture2D LUT;  // 全局调色 LUT
}
```

### 风格化后处理推荐

| 风格 | 关键效果 |
|------|---------|
| **明亮卡通** | 高 Bloom + 暖调 LUT + 低饱和 |
| **写实** | ACES Tonemapping + 真实 Bloom |
| **复古胶片** | 颗粒 + 紫青分裂 + 暗角 |
| **赛博朋克** | 高 Bloom + 青粉 LUT + 色差 |
| **黑暗恐怖** | 低饱和 + 浓重暗角 + 噪点 |

### LUT（颜色查找表）⭐

**最强的风格统一武器**：一张图改变整个游戏色调

```
1. 在 PS 中调出心仪色调
2. 应用到 Neutral LUT（256×16 标准）
3. 导出为 LUT.png
4. 在 Volume → Color Lookup 加载
→ 整个游戏统一色调 ✅
```

---

## 🔧 十二、工具链与工作流

### 美术资源管线（Pipeline）

```
       概念设计（PureRef 参考图）
              ↓
      原画稿（PS / Procreate）
              ↓
   ┌──────────┼──────────┐
   ↓                     ↓
3D 建模              2D 贴图
 (Blender)         (Substance Painter)
   │                     │
   └──────────┬──────────┘
              ↓
         FBX / Texture
              ↓
      Unity 导入（带预设）
              ↓
        Prefab 配置
              ↓
        风格化校验 ⭐
```

### 推荐工具链

| 阶段 | 工具 |
|------|------|
| **参考收集** | PureRef、Milanote |
| **概念设计** | Photoshop、Procreate |
| **建模** | Blender、Maya、ZBrush |
| **贴图** | Substance Painter ⭐、Mari |
| **动画** | Maya、Blender |
| **VFX** | Houdini、EmberGen |
| **音效** | FMOD、Wwise |
| **协作** | Plastic SCM、Git LFS |

### Unity Import 预设统一

```csharp
// 自动应用导入设置
public class ArtImportPostProcessor : AssetPostprocessor
{
    void OnPreprocessTexture()
    {
        TextureImporter importer = assetImporter as TextureImporter;

        // 统一规则
        if (assetPath.Contains("/UI/"))
        {
            importer.textureType = TextureImporterType.Sprite;
            importer.spritePixelsPerUnit = 100;
            importer.filterMode = FilterMode.Bilinear;
            importer.maxTextureSize = 1024;
        }
        else if (assetPath.Contains("/Characters/"))
        {
            importer.maxTextureSize = 2048;
            importer.textureCompression = TextureImporterCompression.CompressedHQ;
        }
        else if (assetPath.Contains("/Environment/"))
        {
            importer.maxTextureSize = 1024;
            importer.textureCompression = TextureImporterCompression.Compressed;
        }
    }

    void OnPreprocessModel()
    {
        ModelImporter importer = assetImporter as ModelImporter;
        importer.animationType = ModelImporterAnimationType.Human; // 角色统一 Humanoid
        importer.materialImportMode = ModelImporterMaterialImportMode.None;
    }
}
```

---

## 🎯 十三、风格统一审查流程（QA Review）

### 双周风格审查会

```
✅ 准备：所有新美术资源拼图
✅ 召集：美术总监 + 主程 + 制作人
✅ 检查清单：
   ├── 与 Art Bible 一致？
   ├── 色板符合规范？
   ├── 模型面数达标？
   ├── 贴图分辨率合规？
   ├── 在游戏中实际表现？
   └── 与既有资源融合度？

✅ 结果：
   ├── 通过 → 入库
   ├── 修改 → 标注问题点
   └── 重做 → 严重不符
```

### 自动化检查工具

```csharp
public class ArtAssetValidator : EditorWindow
{
    [MenuItem("Art/验证资源规范")]
    static void Validate()
    {
        var issues = new List<string>();

        // 检查所有 Prefab
        foreach (var guid in AssetDatabase.FindAssets("t:Prefab"))
        {
            var path = AssetDatabase.GUIDToAssetPath(guid);
            var go = AssetDatabase.LoadAssetAtPath<GameObject>(path);

            // 检查多边形数
            int totalTris = 0;
            foreach (var mf in go.GetComponentsInChildren<MeshFilter>())
                totalTris += mf.sharedMesh.triangles.Length / 3;

            if (path.Contains("/Characters/") && totalTris > 80000)
                issues.Add($"⚠️ {path} 三角面过高: {totalTris}");

            // 检查 Material 是否用了规范 Shader
            foreach (var mr in go.GetComponentsInChildren<MeshRenderer>())
            {
                foreach (var mat in mr.sharedMaterials)
                {
                    if (!mat.shader.name.StartsWith("MyGame/"))
                        issues.Add($"⚠️ {path} 用了非规范 Shader: {mat.shader.name}");
                }
            }
        }

        Debug.Log($"找到 {issues.Count} 个问题:\n" + string.Join("\n", issues));
    }
}
```

---

## 💎 十四、外包美术管控

### 外包流程关键节点

```
1. 立项前：给外包方 Art Bible
2. 试做阶段：小样确认风格
3. 正式开工：分阶段交付
4. 验收：用自动化工具检测
5. 整合：项目内实际表现验证
```

### 外包合同关键条款

```
✅ 文件格式：FBX 2020 / PNG 16bit
✅ 命名规范：项目前缀_类别_物件_变体
✅ 多边形预算：硬指标
✅ UV 规范：余量、不重叠
✅ 贴图规范：分辨率、PBR 通道
✅ 修改次数：3 次内免费，超出收费
✅ 版权归属：买断 + 独占
```

---

## 🎮 十五、不同风格的统一案例

### 案例 1：原神 - 卡通渲染统一秘诀

```
✅ Custom Toon Shader（自研）
✅ 统一 Tonemapping
✅ 强烈的环境色（饱和度高）
✅ 统一阴影颜色（紫蓝偏向）
✅ 统一描边算法
✅ 角色与场景共用同一套色板
```

### 案例 2：星露谷物语 - 像素风格统一秘诀

```
✅ 16×16 像素网格（绝对统一）
✅ 32 色色板（NES 风格）
✅ Bilinear → Point Filter
✅ 整数像素移动（无亚像素插值）
✅ 统一光照（无 3D 光照系统）
```

### 案例 3：极限竞速地平线 - 写实统一秘诀

```
✅ HDR 工作流（>1 的颜色值）
✅ 统一 PBR 校准（金属度参考表）
✅ 全局光照统一（GI Lighting）
✅ 物理正确的镜头效果
✅ 统一胶片 LUT
```

---

## ⚠️ 十六、避坑指南

| 坑 | 后果 | 规避 |
|----|------|------|
| **没有 Art Bible** | 团队各做各的 | 立项前先做 Bible |
| **美术随意改 Shader** | 风格爆炸 | Shader 权限管控 |
| **贴图分辨率混乱** | VRAM 撑爆 + 视觉跳跃 | 强制分级 |
| **角色用 Humanoid，敌人用 Generic** | 动画无法复用 | 统一 Rig |
| **每个场景独立调光** | 切场景突兀 | 共用 Lighting Profile |
| **粒子各做各的** | 战斗特效乱七八糟 | VFX 模板库 |
| **UI 字体随意** | 视觉割裂 | 全项目 ≤ 2 字体 |
| **没有后处理统一** | 同场景明暗不同 | 全局 Volume |

---

## ✅ 十七、风格统一实施 Checklist

### 项目启动期
- [ ] 确定一句话风格定位
- [ ] 收集 50+ 张参考图（PureRef）
- [ ] 制定 Art Bible 文档
- [ ] 确定色板（5-7 主色）
- [ ] 选定主 Shader 方案

### 开发中期
- [ ] Shader 库统一管理
- [ ] 贴图分辨率规范
- [ ] 模型面数规范
- [ ] 动画风格规范
- [ ] Lighting Profile 统一
- [ ] 自动化导入预设
- [ ] LUT 全局调色

### 后期打磨
- [ ] 全场景巡检
- [ ] 后处理参数微调
- [ ] 视觉一致性测试（玩家盲测）
- [ ] 外包资源融合度检查

---

## 📚 十八、推荐学习资源

### 必读书籍

| 书 | 内容 |
|----|------|
| **《Color and Light》** by James Gurney ⭐ | 色彩光影圣经 |
| **《Framed Ink》** by Marcos Mateu-Mestre | 视觉构图 |
| **《Designing Games》** by Tynan Sylvester | 整体游戏设计 |

### 必看 GDC 演讲

| 演讲 | 内容 |
|------|------|
| **"The Art of Genshin Impact"** | 米哈游卡渲技术 |
| **"Stylized Rendering in Spider-Man: Into the Spider-Verse"** | 漫画风格化 |
| **"Concept Art and Style Guide of Hades"** | Supergiant 风格化 |
| **"Cuphead's Inking Pipeline"** | 1930 动画风 |

### YouTube 频道

- **Stylized Station** ⭐ - 风格化美术专门频道
- **Blender Guru** - Blender 教程
- **Imphenzia** - 低多边形美术教程
- **CG Cookie** - 综合美术教程

---

## 🎯 十九、推荐技术栈

### 💎 独立小团队

```
风格定位：Low Poly / 像素风（容易统一）
建模：Blender（免费）
贴图：Krita / Aseprite
Shader：URP/Lit + Toon Shader
后处理：URP Volume + 自定义 LUT
工具：PureRef + Notion
────────────────────────
预算：< $200
```

### 💎 中型团队（5-10 人）

```
风格定位：卡通写实 / 卡渲
建模：Blender + ZBrush
贴图：Substance Painter
Shader：URP/HDRP + 自研 Toon
后处理：完整 Volume Profile + 多 LUT
工具：PureRef + Confluence + Plastic SCM
────────────────────────
预算：~$3000（含订阅）
```

### 💎 大型项目

```
风格定位：自研风格 / 工业写实
建模：Maya + ZBrush + Marvelous
贴图：Substance + Mari
Shader：自研渲染管线
工具：完整 Pipeline + 自研 Tool
────────────────────────
团队：20+ 人，专职 TA（技术美术）
```

---

## 🔑 二十、核心心法

> **统一比"好看"更重要**
>
> **简化比"丰富"更重要**
>
> **规范比"自由"更重要**

### 三大铁律

1. **任何资源入库前必须经过审查**
2. **Art Bible 是唯一真理**
3. **宁可重做，不可妥协**

---

## 🔗 相关文档

- [[Unity_Lighting_Rendering_Architecture]] - 光照与渲染架构
- [[Unity_Scene_Resource_Architecture]] - 场景与资源管理
- [[Unity_UI_Architecture]] - UI 系统
- [[Unity_Particle_Architecture]] - 粒子特效系统
- [[Unity_Animation_Architecture]] - 动画系统
- [[Unity_Performance_Optimization]] - 性能优化
- [[Unity_Action_Combat_System]] - 动作战斗系统
- [[Unity_Open_World_Architecture]] - 开放世界地图技术方案
- [[Unity_Save_Quest_System]] - 存档/任务系统架构
- [[Unity_MOC]] - Unity 知识地图
