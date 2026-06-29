# Unity 开放世界地图技术方案

> 完整的 Unity 开放世界（Open World）地图技术实现方案，覆盖**地形、流式加载、植被、寻路、LOD、性能优化**全链路。

---

## 🌍 一、核心技术挑战

开放世界 vs 传统关卡 —— **5 大核心难题**：

| 挑战 | 问题描述 | 主流解决方案 |
|------|---------|------------|
| **超大地图** | 单场景 64km² 起步 | 分块（Tile）+ 流式加载 |
| **内存爆炸** | 一次性加载 GB 级资源 | Streaming + LOD |
| **绘制调用** | 数十万棵植被 | GPU Instancing + Impostor |
| **物理性能** | 大量碰撞体 | 远距离禁用物理 |
| **寻路烦恼** | NavMesh 烘焙超时 | NavMesh 分块 + 动态烘焙 |

---

## 🗺️ 二、地图规模参考

### 主流游戏地图尺寸对比

| 游戏 | 地图面积 | 技术方案 |
|------|---------|---------|
| **塞尔达：荒野之息** | 64 km² | Chunk + Cell（自研引擎） |
| **塞尔达：王国之泪** | 64 km² × 3 层 | 多层世界叠加 |
| **荒野大镖客 2** | 75 km² | RAGE 引擎流式加载 |
| **GTA V** | 75 km² | RAGE 流式加载 |
| **巫师 3** | 136 km² | REDengine 区块加载 |
| **原神** | 77 km² | Unity + 自研区块系统 |
| **艾尔登法环** | 90 km² | 自研区块 + Open Field 概念 |
| **微软飞行模拟** | 全球（510 M km²） | Azure 云端流式 |

> 💡 **独立游戏目标**：1-10 km² 已属较大规模，足够 20+ 小时游玩内容

---

## 🏗️ 三、地形系统（Terrain）

### 方案对比

| 方案 | 优点 | 缺点 | 适用 |
|------|------|------|------|
| **Unity Terrain（原生）** | 内置工具完整、易上手 | 性能一般、风格固定 | 中小项目 |
| **MicroSplat** ⭐ | 16+ 层混合、PBR、性能好 | 学习曲线 | 中大项目 |
| **Mesh Terrain** | 自由度最高 | 需自研工具链 | AAA 项目 |
| **Voxel Terrain** | 可破坏（我的世界风） | 性能挑战 | 沙盒类 |
| **Houdini → Unity** | 程序化生成 | Houdini 收费 | 工业级流程 |

### Unity Terrain 优化配置

```csharp
// 关键 Terrain 配置（代码可设置）
TerrainData terrainData = terrain.terrainData;

// 1. 地形尺寸（每块建议 512×512 或 1024×1024）
terrainData.size = new Vector3(1024, 600, 1024);

// 2. 高度图分辨率（影响精度，越高越吃内存）
terrainData.heightmapResolution = 1025;  // 1024+1

// 3. 细节分辨率（草、小物件）
terrainData.SetDetailResolution(1024, 32);

// 4. Alphamap（贴图混合层）
terrainData.alphamapResolution = 512;

// 5. 基础贴图分辨率
terrainData.baseMapResolution = 1024;

// 6. 树木 / 细节距离剔除
terrain.treeDistance = 2000;        // 树渲染距离
terrain.detailObjectDistance = 80;  // 草渲染距离
terrain.heightmapPixelError = 5;    // LOD 精度（越大性能越好，但变形）
```

### 多 Terrain 拼接（Tile 系统）

```csharp
public class TerrainTileManager : MonoBehaviour
{
    [SerializeField] private int gridSize = 8;         // 8x8 = 64 块
    [SerializeField] private float tileSize = 1024f;   // 每块 1024m
    [SerializeField] private Transform player;
    [SerializeField] private int loadRadius = 2;       // 加载半径（块数）

    private Dictionary<Vector2Int, Terrain> tiles = new();
    private Vector2Int currentTile;

    private void Update()
    {
        // 计算玩家当前所在 Tile
        Vector2Int newTile = new Vector2Int(
            Mathf.FloorToInt(player.position.x / tileSize),
            Mathf.FloorToInt(player.position.z / tileSize)
        );

        if (newTile != currentTile)
        {
            currentTile = newTile;
            UpdateLoadedTiles();
        }
    }

    private void UpdateLoadedTiles()
    {
        // 卸载远距离 Tile，加载附近 Tile
        var needed = new HashSet<Vector2Int>();
        for (int x = -loadRadius; x <= loadRadius; x++)
            for (int z = -loadRadius; z <= loadRadius; z++)
                needed.Add(currentTile + new Vector2Int(x, z));

        // 卸载
        foreach (var key in tiles.Keys.ToList())
            if (!needed.Contains(key)) UnloadTile(key);

        // 加载
        foreach (var key in needed)
            if (!tiles.ContainsKey(key)) LoadTileAsync(key);
    }
}
```

---

## 📦 四、流式加载（Streaming）

### 方案 A：Unity Scene Streaming（推荐 ⭐）

**SceneManager.LoadSceneAsync** + **Additive 模式**

```csharp
public class WorldStreamer : MonoBehaviour
{
    [SerializeField] private float streamRadius = 500f;
    [SerializeField] private Transform player;

    private Dictionary<string, AsyncOperation> loadingScenes = new();
    private HashSet<string> loadedScenes = new();

    private void Update()
    {
        // 每秒检查一次（不必每帧）
        if (Time.frameCount % 60 != 0) return;

        foreach (var chunk in worldChunks)
        {
            float dist = Vector3.Distance(player.position, chunk.center);

            if (dist < streamRadius && !loadedScenes.Contains(chunk.sceneName))
                StartCoroutine(LoadChunkAsync(chunk));
            else if (dist > streamRadius * 1.5f && loadedScenes.Contains(chunk.sceneName))
                UnloadChunk(chunk);
        }
    }

    private IEnumerator LoadChunkAsync(WorldChunk chunk)
    {
        var op = SceneManager.LoadSceneAsync(chunk.sceneName, LoadSceneMode.Additive);
        op.priority = chunk.priority;
        op.allowSceneActivation = false;

        // 等待加载到 90%
        while (op.progress < 0.9f) yield return null;

        // 等玩家不在战斗中才激活
        yield return new WaitUntil(() => !player.GetComponent<PlayerCombat>().InCombat);
        op.allowSceneActivation = true;

        loadedScenes.Add(chunk.sceneName);
    }
}
```

### 方案 B：Addressables（推荐 ⭐⭐⭐）

Unity 官方流式资源系统，**最佳实践**

```csharp
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class AddressableChunkLoader : MonoBehaviour
{
    private Dictionary<string, AsyncOperationHandle<GameObject>> loadedChunks = new();

    public async Task LoadChunk(string chunkKey, Vector3 position)
    {
        if (loadedChunks.ContainsKey(chunkKey)) return;

        var handle = Addressables.InstantiateAsync(chunkKey, position, Quaternion.identity);
        loadedChunks[chunkKey] = handle;

        await handle.Task;

        if (handle.Status == AsyncOperationStatus.Succeeded)
            Debug.Log($"Chunk loaded: {chunkKey}");
    }

    public void UnloadChunk(string chunkKey)
    {
        if (loadedChunks.TryGetValue(chunkKey, out var handle))
        {
            Addressables.ReleaseInstance(handle);
            loadedChunks.Remove(chunkKey);
        }
    }
}
```

**Addressables 优势**：
- ✅ 远程 CDN 加载（边玩边下载）
- ✅ 自动引用计数（无内存泄漏）
- ✅ 与 Unity Cloud Content Delivery 集成
- ✅ 支持热更新

### 方案 C：World Streamer（Asset Store 插件）

| 插件 | 价格 | 特点 |
|------|------|------|
| **World Streamer 2** ⭐ | $45 | 老牌强大，支持多种模式 |
| **SECTR Complete** | $90 | 工业级流式加载方案 |
| **Sub Scene Manager** | 免费 | 基础流式加载 |

---

## 🎯 五、分块策略（Chunking）

### 网格分块（Grid-Based）⭐ 推荐

```
┌────┬────┬────┬────┐
│ A1 │ A2 │ A3 │ A4 │
├────┼────┼────┼────┤
│ B1 │ B2 │ B3 │ B4 │  ← 玩家在 B2，加载 3x3 范围
├────┼────┼────┼────┤
│ C1 │ C2 │ C3 │ C4 │
├────┼────┼────┼────┤
│ D1 │ D2 │ D3 │ D4 │
└────┴────┴────┴────┘
```

**优点**：实现简单、可预测
**缺点**：边界处可能突兀

### 八叉树分块（Octree）

适用于**垂直空间复杂**的场景（多层建筑、洞穴）

```csharp
public class OctreeNode
{
    public Bounds bounds;
    public OctreeNode[] children = new OctreeNode[8];
    public List<GameObject> objects = new();

    public void Insert(GameObject obj)
    {
        if (children[0] == null) Split();
        // 递归插入到对应子节点
    }
}
```

### 不规则分块（Cell-Based）

按**地理特征**划分（村庄、森林、洞穴），每个 Cell 是独立 Scene
- 优点：符合关卡设计
- 缺点：手动维护成本高
- **代表作**：《艾尔登法环》

---

## 🌲 六、植被系统（Vegetation）

### 植被规模参考

| 项目 | 树木数量 | 草数量 |
|------|---------|--------|
| **巫师 3** | ~100,000 | ~1,000,000 |
| **荒野大镖客 2** | ~500,000 | ~10,000,000 |
| **独立项目（建议）** | 1,000-10,000 | 100,000-1,000,000 |

### 渲染优化技术

#### 1. GPU Instancing ⭐（必备）

```csharp
public class GrassRenderer : MonoBehaviour
{
    [SerializeField] private Mesh grassMesh;
    [SerializeField] private Material grassMaterial;
    private Matrix4x4[] matrices = new Matrix4x4[1023]; // 单批最大 1023

    private void Update()
    {
        // 一次调用渲染 1023 棵草，仅 1 个 Draw Call
        Graphics.DrawMeshInstanced(grassMesh, 0, grassMaterial, matrices);
    }
}
```

#### 2. Indirect Instancing（百万级）⭐⭐

```csharp
// 适合 10w+ 实例，GPU 直接读取 ComputeBuffer
private ComputeBuffer instanceBuffer;
private ComputeBuffer argsBuffer;

private void Render()
{
    Graphics.DrawMeshInstancedIndirect(
        mesh, 0, material,
        new Bounds(Vector3.zero, Vector3.one * 10000),
        argsBuffer
    );
}
```

#### 3. Impostor（远距离公告板）

```
近距离（<50m）→ 完整 3D 模型
中距离（50-200m）→ 简化 LOD 模型
远距离（>200m）→ Impostor 公告板（一张图）
```

**Asset Store 工具**：
- **Amplify Impostors**（$50）⭐
- **GPU Instancer Pro** - 自动 LOD + Impostor

### 推荐插件

| 插件 | 价格 | 用途 |
|------|------|------|
| **Vegetation Studio Pro** ⭐ | $200 | 工业级植被系统（百万级草） |
| **GPU Instancer Pro** | $80 | 自动 Instancing |
| **Nature Renderer** | $80 | 替换 Unity Terrain 默认渲染 |
| **Amplify Impostors** | $50 | 自动生成 Impostor |
| **Polaris** | $30 | 地形 + 植被一体化 |

---

## 🎨 七、LOD 系统

### LOD（Level of Detail）层级设计

```
[LOD 0] 高模  - 距离 0-30m    - 100% 三角面
[LOD 1] 中模  - 距离 30-80m   - 60% 三角面
[LOD 2] 低模  - 距离 80-150m  - 30% 三角面
[LOD 3] 极简  - 距离 150-300m - 10% 三角面
[Culled]      - 距离 >300m    - 不渲染
```

### Unity LOD Group 配置

```csharp
public class AutoLODSetup : MonoBehaviour
{
    void Setup()
    {
        var lodGroup = gameObject.AddComponent<LODGroup>();

        LOD[] lods = new LOD[3];
        lods[0] = new LOD(0.6f, new Renderer[] { lod0Renderer });  // 60% 屏占比
        lods[1] = new LOD(0.3f, new Renderer[] { lod1Renderer });  // 30%
        lods[2] = new LOD(0.1f, new Renderer[] { lod2Renderer });  // 10%

        lodGroup.SetLODs(lods);
        lodGroup.RecalculateBounds();
    }
}
```

### HLOD（Hierarchical LOD）

**大型场景**优化技术：把一个区域内的多个低 LOD 物体**合并**成一个 Mesh

```
远处一座城堡 → 100 个独立物体 → 合并为 1 个简化 Mesh
            → 100 个 Draw Call → 1 个 Draw Call
```

**工具**：
- **AutoLOD**（Unity Labs 实验项目）
- **InstaLOD**（商业，AAA 级）
- **Simplygon**（微软收购的工具）

---

## 🛤️ 八、寻路系统（NavMesh）

### 挑战：开放世界 NavMesh 烘焙

| 问题 | 解决方案 |
|------|---------|
| 烘焙耗时几小时 | 分块烘焙 |
| NavMesh 数据过大 | 多个小 NavMesh + 动态加载 |
| 动态地形/物体 | NavMeshSurface + Local Avoidance |
| 大量 NPC 寻路 | 群体寻路算法（Flow Field） |

### NavMesh Components（推荐）⭐

```csharp
using UnityEngine.AI;

public class DynamicNavMesh : MonoBehaviour
{
    [SerializeField] private NavMeshSurface surface;

    // 运行时烘焙（适合分块加载）
    public void BakeNavMesh()
    {
        surface.BuildNavMesh();
    }

    // 增量烘焙（仅烘焙变化区域）
    public void UpdateLocalNavMesh(Bounds bounds)
    {
        var data = NavMesh.CalculateTriangulation();
        // 局部更新
    }
}
```

### 分块 NavMesh 策略

```csharp
public class ChunkedNavMesh : MonoBehaviour
{
    // 每个 Tile 一个 NavMeshSurface
    private Dictionary<Vector2Int, NavMeshSurface> navSurfaces = new();

    public void OnChunkLoaded(Vector2Int chunk)
    {
        var surface = chunkObjects[chunk].GetComponent<NavMeshSurface>();
        surface.BuildNavMeshAsync();  // Unity 2022.2+ 异步烘焙
    }

    public void OnChunkUnloaded(Vector2Int chunk)
    {
        navSurfaces[chunk].RemoveData();
    }
}
```

### A* Pathfinding Project Pro（替代方案）

**优点**：
- 支持点状网格（Grid）、节点（Point）、回收（Recast）三种
- 运行时动态生成
- 大世界性能优于内置 NavMesh

**适用**：大规模 RTS、开放世界 AAA 项目

---

## 🌊 九、天空与天气系统

### 动态天空（昼夜循环）

```csharp
public class DayNightCycle : MonoBehaviour
{
    [SerializeField] private Light sun;
    [SerializeField] private Light moon;
    [SerializeField] private float dayDuration = 1200f; // 20 分钟一天
    [SerializeField] private Gradient skyTint;
    [SerializeField] private AnimationCurve sunIntensity;

    private float timeOfDay = 0.3f; // 0-1，0.5 = 正午

    private void Update()
    {
        timeOfDay += Time.deltaTime / dayDuration;
        if (timeOfDay > 1) timeOfDay -= 1;

        // 太阳旋转（围绕东西轴）
        sun.transform.rotation = Quaternion.Euler(timeOfDay * 360 - 90, 170, 0);
        sun.intensity = sunIntensity.Evaluate(timeOfDay);

        // 天空颜色
        RenderSettings.ambientLight = skyTint.Evaluate(timeOfDay);
    }
}
```

### 推荐插件

| 插件 | 价格 | 特点 |
|------|------|------|
| **Enviro 3 - Sky and Weather** ⭐ | $80 | 完整天气系统 |
| **AzureSky Dynamic Sky System** | $70 | 高质量天空 |
| **TrueSky** | 免费/付费 | 真实云层模拟 |
| **Time of Day** | $40 | 经典老牌 |
| **Buto Volumetric Light** | $30 | 体积光（晨雾、丁达尔） |

---

## 💧 十、水体系统

### 河流 / 湖泊

| 方案 | 特点 |
|------|------|
| **Unity Water Shader**（内置） | 基础，性能好 |
| **Crest Ocean System** ⭐ | 开源海洋系统（顶级） |
| **R.A.M (River Auto Material)** | $40，自动河道生成 |
| **KWS Water System** | $60，写实水体 |
| **HDRP Water System**（2022.2+） | Unity 官方高级水系统 |

### Crest Ocean System（开源）⭐

GitHub: https://github.com/wave-harmonic/crest
- 海洋波浪 FFT 模拟
- 实时反射、折射
- 浮力系统
- 浪花、泡沫

---

## 🎯 十一、性能预算（重要！）

### 开放世界性能目标参考

| 设备 | 目标帧率 | Draw Call | 三角面 |
|------|---------|----------|--------|
| **PC 高配** | 60+ FPS | <5000 | <3M |
| **PC 中配** | 60 FPS | <3000 | <2M |
| **PS5/XSX** | 60 FPS | <4000 | <2.5M |
| **PS4/XB1** | 30 FPS | <2000 | <1M |
| **手机高端** | 30-60 FPS | <500 | <500K |
| **Switch** | 30 FPS | <1500 | <800K |

### 性能预算分配（每帧 16.6ms @ 60FPS）

```
渲染（Rendering）   →  8 ms  ████████
脚本逻辑（Scripts） →  3 ms  ███
物理（Physics）     →  2 ms  ██
动画（Animation）   →  2 ms  ██
UI                  →  1 ms  █
其他                →  0.6ms ▌
─────────────────────────────────
                      16.6 ms = 60 FPS
```

---

## 🚀 十二、综合架构示例

### 完整开放世界管理器

```csharp
public class OpenWorldManager : MonoBehaviour
{
    [Header("核心组件")]
    [SerializeField] private Transform player;
    [SerializeField] private TerrainTileManager terrainMgr;
    [SerializeField] private AddressableChunkLoader chunkLoader;
    [SerializeField] private VegetationStudioManager vegMgr;
    [SerializeField] private DayNightCycle dayNight;

    [Header("参数")]
    [SerializeField] private float chunkSize = 256f;
    [SerializeField] private int viewDistanceChunks = 3;

    private Vector2Int currentChunk;
    private HashSet<Vector2Int> loadedChunks = new();

    private void Start()
    {
        // 初始化
        StartCoroutine(InitWorld());
    }

    private void Update()
    {
        // 每 0.5 秒检查一次玩家位置
        if (Time.frameCount % 30 == 0)
        {
            Vector2Int newChunk = WorldToChunk(player.position);
            if (newChunk != currentChunk)
            {
                currentChunk = newChunk;
                UpdateStreaming();
            }
        }
    }

    private Vector2Int WorldToChunk(Vector3 worldPos)
    {
        return new Vector2Int(
            Mathf.FloorToInt(worldPos.x / chunkSize),
            Mathf.FloorToInt(worldPos.z / chunkSize)
        );
    }

    private async void UpdateStreaming()
    {
        var needed = new HashSet<Vector2Int>();
        for (int x = -viewDistanceChunks; x <= viewDistanceChunks; x++)
        for (int z = -viewDistanceChunks; z <= viewDistanceChunks; z++)
            needed.Add(currentChunk + new Vector2Int(x, z));

        // 卸载远离的 Chunk
        var toUnload = loadedChunks.Except(needed).ToList();
        foreach (var key in toUnload)
        {
            chunkLoader.UnloadChunk($"Chunk_{key.x}_{key.y}");
            loadedChunks.Remove(key);
        }

        // 按距离优先级加载
        var toLoad = needed.Except(loadedChunks)
            .OrderBy(c => Vector2Int.Distance(c, currentChunk))
            .ToList();

        foreach (var key in toLoad)
        {
            await chunkLoader.LoadChunk($"Chunk_{key.x}_{key.y}",
                ChunkToWorld(key));
            loadedChunks.Add(key);
        }
    }
}
```

---

## 🛠️ 十三、推荐工具链

### 美术工具

| 工具 | 用途 |
|------|------|
| **World Creator** | 程序化地形生成 |
| **Gaea** ⭐ | 顶级地形雕刻工具（替代 World Machine） |
| **Houdini** | 程序化场景（AAA 标配） |
| **WorldMachine** | 老牌地形生成 |
| **Quixel Megascans** ⭐ | 免费扫描素材（Epic 收购后） |

### Unity 插件全家桶

```
地形生成    → Gaia Pro 2023 ($120)
植被系统    → Vegetation Studio Pro ($200)
水体        → Crest Ocean System (免费)
天气        → Enviro 3 ($80)
流式加载    → Addressables (官方免费) / World Streamer 2 ($45)
GPU 实例    → GPU Instancer Pro ($80)
LOD         → AutoLOD / InstaLOD
寻路        → A* Pathfinding Pro ($100)
─────────────────────────────────
总计：约 $625（独立开发者可选购）
```

---

## 🎮 十四、AAA 工作流参考

### 巫师 3 / 赛博朋克 2077（CDPR）方案

```
1. WorldMachine 生成基础地形
2. REDengine 编辑器手工雕刻
3. SpeedTree 制作植被
4. Houdini 程序化生成河流/道路
5. 分块流式加载（约 400×400m 一块）
6. 烘焙光照贴图 + 反射探针
7. NavMesh 离线烘焙
```

### 原神（米哈游）Unity 方案

```
1. Unity Terrain + 自研工具链
2. 自研区块系统（Block）
3. SpeedTree → 转 Unity 格式
4. GPU Instancing 渲染植被
5. 自研天气 + 昼夜系统
6. NavMesh 分块烘焙
7. Addressables 资源管理
```

---

## ✅ 十五、实施 Checklist

### 阶段 1：基础地形（Week 1-2）
- [ ] 地形规模规划（1km² / 4km² / 16km²）
- [ ] 选定方案：Unity Terrain / MicroSplat / Mesh
- [ ] 灰盒（Whitebox）大致地貌
- [ ] 多 Terrain 拼接测试

### 阶段 2：流式加载（Week 3-4）
- [ ] 接入 Addressables
- [ ] 分块策略设计（Grid Size = 256m / 512m）
- [ ] 异步加载 + 优先级排序
- [ ] 卸载策略（距离 + 内存压力）

### 阶段 3：植被与 LOD（Week 5-6）
- [ ] Vegetation Studio Pro 接入
- [ ] LOD Group 自动生成
- [ ] GPU Instancing 测试
- [ ] Impostor 远景优化

### 阶段 4：寻路与 AI（Week 7-8）
- [ ] NavMesh 分块烘焙
- [ ] 动态加载 NavMesh 数据
- [ ] AI 群体行为测试
- [ ] 跨 Chunk 路径规划

### 阶段 5：天气与水体（Week 9-10）
- [ ] 昼夜循环
- [ ] 动态天气（雨/雪/雾）
- [ ] 河流/湖泊系统
- [ ] 体积光、雾效

### 阶段 6：性能优化（持续）
- [ ] Profiler 定位瓶颈
- [ ] Draw Call 控制 <3000
- [ ] 内存控制 <4GB（PC）
- [ ] GC 优化（避免每帧分配）
- [ ] Frame Debugger 检查批处理

---

## 📚 十六、推荐学习资源

### 必看演讲

| 演讲 | 内容 |
|------|------|
| **GDC: "Building the World of Horizon Zero Dawn"** | Guerrilla Games 工作流 |
| **GDC: "Streaming the Open World in Spider-Man"** | Insomniac 流式加载 |
| **Unity Unite: "Open World with Addressables"** | 官方最佳实践 |
| **CDPR Tech Talk: "Cyberpunk 2077 Streaming"** | AAA 项目经验 |

### 书籍

- **《Real-Time Rendering 4th》** - 渲染圣经
- **《Game Engine Architecture》** - 引擎架构
- **《Mathematics for 3D Game Programming》** - 数学基础

### 开源项目参考

- **Unity Open Project - Chop Chop** - 官方完整项目
- **Realistic FPS Prefab**（GitHub） - 流式加载示例
- **MapMagic 2** - 程序化地图生成

---

## ⚠️ 十七、避坑指南

| 坑 | 后果 | 规避 |
|----|------|------|
| **单 Scene 装所有内容** | 加载几分钟、内存爆炸 | 必须分块 |
| **忽略 LOD** | Draw Call 飙升 | 所有模型 3 级 LOD 起 |
| **NavMesh 一次性烘焙** | 烘焙超时崩溃 | 分块烘焙 |
| **植被不用 Instancing** | 10 棵树 = 10 DC | 必开 GPU Instancing |
| **物理体太多** | CPU 卡死 | 远距禁用 Rigidbody |
| **直接用大贴图** | VRAM 撑爆 | Texture Streaming |
| **不做 Profiler 分析** | 盲目优化 | 用数据说话 |

---

## 🎯 推荐技术栈组合

### 💎 方案 A：独立开发者（预算紧凑）

```
地形：Unity Terrain + MicroSplat
植被：GPU Instancer Pro
水体：Crest Ocean（免费）
天气：自研昼夜 + 简单粒子雨雪
流式：Addressables
寻路：Unity NavMesh
工具：Gaea（地形生成）
────────────────────────
约 $200，可做 4km² 中型世界
```

### 💎 方案 B：商业项目（推荐 ⭐）

```
地形：MicroSplat + Gaia Pro 2023
植被：Vegetation Studio Pro
水体：Crest Ocean
天气：Enviro 3
流式：Addressables + World Streamer 2
寻路：A* Pathfinding Pro
LOD：Amplify Impostors
────────────────────────
约 $700，可做 16km² 大世界
```

### 💎 方案 C：AAA 级（需要团队）

```
渲染：HDRP + 自研 Shader
地形：自研 Mesh Terrain + Houdini 工作流
植被：自研 GPU Instancing 系统
流式：自研 Streaming + Addressables
工具：Megascans + Substance Designer
LOD：InstaLOD（自动）
────────────────────────
需要 10+ 人团队 + 1-2 年开发
```

---

## 🔗 相关文档

- [[Unity_Scene_Resource_Architecture]] - 场景与资源管理
- [[Unity_Performance_Optimization]] - 性能优化
- [[Unity_Lighting_Rendering_Architecture]] - 光照与渲染
- [[Unity_Action_Combat_System]] - 动作战斗系统
- [[Unity_Physics_Architecture]] - 物理系统
- [[Unity_MOC]] - Unity 知识地图
