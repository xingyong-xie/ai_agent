---
title: Unity 性能优化架构
created: 2026-06-08
updated: 2026-06-08
tags: [游戏, Unity, 架构, 性能优化]
related: "[[Unity_MOC]]"
---

# Unity 性能优化架构

## 一、性能优化框架总览

```
Unity 性能优化体系
    │
    ├── CPU 优化
    │       ├── 渲染优化（Draw Call 控制）
    │       ├── 脚本优化（Update 循环）
    │       ├── 物理优化（碰撞检测）
    │       └── 动画优化（骨骼计算）
    │
    ├── GPU 优化
    │       ├── 渲染管线优化
    │       ├── Shader 复杂度控制
    │       ├── 纹理内存管理
    │       └── 分辨率缩放
    │
    ├── 内存优化
    │       ├── 对象池（Object Pooling）
    │       ├── 资源生命周期管理
    │       ├── 纹理压缩与图集
    │       └── 垃圾回收 (GC) 控制
    │
    ├── 加载优化
    │       ├── 场景异步加载
    │       ├── LOD（细节层次）
    │       ├── 遮挡剔除
    │       └── Addressables 分块下载
    │
    └── 分析工具链
            ├── Profiler
            ├── Frame Debugger
            ├── Memory Profiler
            └── GPU Profiler
```

## 二、CPU 优化体系

### 2.1 Draw Call 优化

```
Draw Call 数量控制
    │
    ├── 什么是 Draw Call
    │       ├── CPU 向 GPU 发送渲染命令
    │       ├── 每个不同材质 = 1 个 Draw Call
    │       └── 目标: 移动端 < 100, PC < 500
    │
    ├── Static Batching（静态批处理）
    │       ├── 合并共享相同材质的静态物体
    │       ├── 开启: Static 复选框
    │       └── 效果: 显著减少 Draw Call
    │
    ├── Dynamic Batching（动态批处理）
    │       ├── 自动合并小物体（<300 顶点）
    │       ├── 限制: 顶点数、缩放影响
    │       └── 适用: 大量小物体（石子、碎片）
    │
    ├── GPU Instancing（实例化）
    │       ├── 相同网格 + 相同材质的物体
    │       ├── 一次提交渲染所有实例
    │       └── 适用: 大量相同的物体（树木、草丛）
    │
    └── SRP Batcher（SRP 批处理）
            ├── URP/HDRP 专用
            ├── 使用相同 Shader 变体的物体
            └── 效率极高，推荐开启
```

### 2.2 脚本性能优化

```csharp
// ===== 优化 Update 循环 =====

// ❌ 不推荐：每帧轮询
void Update()
{
    if (Input.GetKeyDown(KeyCode.Space))
        Jump();
}

// ✅ 推荐：使用事件或协程
void OnEnable() => InputHandler.OnJumpPressed += Jump;
void OnDisable() => InputHandler.OnJumpPressed -= Jump;

// ❌ 不推荐：每帧 Find / GetComponent
void Update()
{
    GameObject player = GameObject.Find("Player");  // 每帧查找！
}

// ✅ 推荐：在 Start 中缓存引用
private Transform playerTransform;
void Start() { playerTransform = GameObject.Find("Player").transform; }

// ===== 空 Update 的代价 =====
// ❌ 即使空的 Update 也有开销
void Update() { }  // 空方法 → Unity 仍需每帧调用

// ✅ 禁用未使用的 MonoBehaviour
// 取消勾选 Inspector 中的脚本启用复选框
// 或: this.enabled = false;

// ===== 避免每帧分配内存 =====
// ❌ 每帧分配字符串
void Update()
{
    scoreText.text = "Score: " + score.ToString();
}

// ✅ 使用 StringBuilder 或预分配
StringBuilder sb = new StringBuilder(32);
void Update()
{
    sb.Clear();
    sb.Append("Score: ");
    sb.Append(score);
    scoreText.text = sb.ToString();
}
```

### 2.3 物理性能优化

| 优化方法 | 说明 | 效果 |
|---------|------|------|
| **减少碰撞体数量** | 使用碰撞矩阵过滤 | ★★★ |
| **Mesh Collider → 基础 Collider** | 用多个 Box 近似 Mesh | ★★★★★ |
| **Collision Layer Matrix** | 不同层不碰撞 | ★★★★ |
| **降低 Fixed Timestep** | Time.fixedDeltaTime 增大 | ★★★ |
| **使用 Discrete 检测** | 非高速物体不用 Continuous | ★★★ |
| **休眠刚体** | Sleep 状态减少计算 | ★★★ |
| **减少 Overlap 检测** | 优化检测频率和范围 | ★★★ |

## 三、GPU 优化体系

### 3.1 渲染性能指标

| 指标 | 移动端目标 | PC 目标 | 说明 |
|------|-----------|---------|------|
| **顶点数** | < 100k | < 500k | 每帧渲染的顶点数 |
| **三角面数** | < 150k | < 1M | 三角形数量 |
| **填充率** | 适中 | 高 | 像素填充速率 |
| **Overdraw** | < 2x | < 3x | 同一像素多次绘制 |
| **Draw Call** | < 100 | < 500 | CPU→GPU 命令数 |

### 3.2 渲染优化策略

```
渲染优化分级
    │
    ├── 几何体优化
    │       ├── LOD（细节层次）
    │       ├── 减面优化
    │       └── 合并网格
    │
    ├── 纹理优化
    │       ├── 纹理压缩 (ASTC/ETC2/PVRTC)
    │       ├── Mipmap（纹理级联）
    │       ├── 图集 (Sprite Atlas)
    │       └── 最大纹理尺寸限制
    │
    ├── Shader 优化
    │       ├── 减少复杂数学运算
    │       ├── 减少 Shader 变体
    │       ├── 使用移动端优化的 Shader
    │       └── 避免多重纹理采样
    │
    └── 后处理优化
            ├── 降低后处理分辨率
            ├── 选择性开启效果
            ├── 移动端避免高开销效果
            └── URP 后处理 Quality 降级
```

### 3.3 LOD 系统

```
LOD Group 组件
    │
    ├── LOD 0: 最高精度（完整网格）
    │       └── 远近距离: 0% ~ 30%
    │
    ├── LOD 1: 中等精度（简化网格）
    │       └── 远近距离: 30% ~ 60%
    │
    ├── LOD 2: 低精度（高度简化）
    │       └── 远近距离: 60% ~ 80%
    │
    └── Culled（完全隐藏）
            └── 大于 80% 的距离

LOD Bias 设置（Quality Settings）:
    ├── 值 < 1: 更倾向低模（性能优先）
    └── 值 > 1: 更倾向高模（画质优先）
```

## 四、内存优化体系

### 4.1 对象池模式

```csharp
// 通用对象池
public class ObjectPool<T> where T : MonoBehaviour
{
    private Stack<T> pool = new Stack<T>();
    private T prefab;
    private Transform parent;

    public ObjectPool(T prefab, int preloadCount, Transform parent = null)
    {
        this.prefab = prefab;
        this.parent = parent;
        
        // 预创建对象
        for (int i = 0; i < preloadCount; i++)
        {
            T obj = CreateNew();
            obj.gameObject.SetActive(false);
            pool.Push(obj);
        }
    }

    private T CreateNew()
    {
        T obj = GameObject.Instantiate(prefab, parent);
        obj.gameObject.name = prefab.name + "_" + pool.Count;
        return obj;
    }

    public T Get()
    {
        if (pool.Count == 0)
        {
            pool.Push(CreateNew());
        }
        T obj = pool.Pop();
        obj.gameObject.SetActive(true);
        return obj;
    }

    public void Return(T obj)
    {
        obj.gameObject.SetActive(false);
        pool.Push(obj);
    }
}

// 使用示例
public class BulletPool : MonoBehaviour
{
    [SerializeField] private Bullet bulletPrefab;
    private ObjectPool<Bullet> pool;

    void Start()
    {
        pool = new ObjectPool<Bullet>(bulletPrefab, preloadCount: 20, transform);
    }

    public Bullet SpawnBullet(Vector3 pos, Quaternion rot)
    {
        Bullet bullet = pool.Get();
        bullet.transform.position = pos;
        bullet.transform.rotation = rot;
        bullet.Initialize();
        return bullet;
    }

    public void ReturnBullet(Bullet bullet)
    {
        pool.Return(bullet);
    }
}
```

### 4.2 内存管理策略

| 策略 | 说明 | 实施方法 |
|------|------|---------|
| **即时加载** | 需要时加载 | Resources.Load / Addressables |
| **预加载** | 提前加载到内存 | 场景加载时预加载资源 |
| **懒加载** | 按需延迟加载 | 接近时才触发加载 |
| **分帧加载** | 分散加载到多帧 | 协程 + 每帧限制加载量 |
| **引用计数** | 自动管理生命周期 | Addressables 自动管理 |
| **场景切换清理** | 切换时卸载旧资源 | Resources.UnloadUnusedAssets |

### 4.3 GC 优化

```csharp
// ===== GC 触发原因 =====
// 1. 字符串拼接
// 2. LINQ 查询（产生临时对象）
// 3. foreach（产生 Enumerator）
// 4. 匿名方法 / Lambda 闭包
// 5. 装箱操作（值类型转 object）
// 6. 频繁的 new 临时对象

// ===== 优化技巧 =====

// ✅ 预分配 List
List<Enemy> enemyList = new List<Enemy>(100);  // 预分配容量

// ✅ 使用 StringBuilder 替代字符串拼接
StringBuilder sb = new StringBuilder();

// ✅ 使用结构体替代类（栈分配）
struct DamageInfo
{
    public float amount;
    public int sourceId;
    public DamageType type;
}

// ✅ 缓存委托
private System.Action cachedDelegate;
void Start()
{
    cachedDelegate = () => Debug.Log("click");
    button.onClick.AddListener(cachedDelegate);
}

// ✅ 协程内避免频繁 yield return new
private WaitForSeconds wait = new WaitForSeconds(1f);
IEnumerator UpdateLoop()
{
    yield return wait;  // 复用对象，不 new
}

// ✅ 手动触发 GC（仅在合适时机）
// 场景加载完成后
System.GC.Collect();
```

## 五、加载与流式优化

### 5.1 分帧加载技术

```csharp
// 分帧加载大量对象
public class FrameLoadManager : MonoBehaviour
{
    public List<GameObject> objectsToLoad;
    public int objectsPerFrame = 5;

    void Start()
    {
        StartCoroutine(FrameLoad());
    }

    IEnumerator FrameLoad()
    {
        int loadedCount = 0;
        foreach (GameObject obj in objectsToLoad)
        {
            obj.SetActive(true);
            loadedCount++;

            // 每帧最多加载 objectsPerFrame 个
            if (loadedCount >= objectsPerFrame)
            {
                loadedCount = 0;
                yield return null;  // 等待下一帧
            }
        }
    }
}
```

### 5.2 Addressables 分批下载

```csharp
// 分批次下载资源
IEnumerator DownloadLevelContent()
{
    // 获取依赖大小
    AsyncOperationHandle<long> sizeHandle = 
        Addressables.GetDownloadSizeAsync("Level1Assets");
    yield return sizeHandle;
    
    long totalSize = sizeHandle.Result;
    Debug.Log($"需要下载: {totalSize / 1048576f:F1} MB");
    
    // 分批下载
    AsyncOperationHandle downloadHandle = 
        Addressables.DownloadDependenciesAsync("Level1Assets");
    
    while (!downloadHandle.IsDone)
    {
        // 获取下载进度
        DownloadStatus status = downloadHandle.GetDownloadStatus();
        float progress = (float)status.DownloadedBytes / status.TotalBytes;
        progressBar.fillAmount = progress;
        yield return null;
    }
}
```

## 六、分析工具链

### 6.1 工具使用场景

| 工具 | 定位问题 | 使用时机 |
|------|---------|---------|
| **Profiler** | CPU / GPU / Memory / Rendering | 性能瓶颈定位 |
| **Frame Debugger** | Draw Call 细节、渲染过程 | 渲染调试 |
| **Memory Profiler** | 内存泄漏、对象引用 | 内存问题排查 |
| **GPU Profiler** | Shader 性能、渲染带宽 | GPU 瓶颈 |
| **Physics Debugger** | 碰撞体、物理性能 | 物理问题 |
| **Profiler Markers** | 自定义性能标记 | 脚本性能分析 |

### 6.2 Profiler 使用流程

```
性能优化流程
    │
    1. 设定性能目标
       ├── 移动端: 30 FPS, < 100 Draw Call, < 200MB 内存
       └── PC: 60 FPS, < 500 Draw Call, < 1GB 内存
    │
    2. Profiler 采样
       ├── 真机采样最准确
       ├── Deep Profile（脚本详查方法耗时）
       └── 记录性能瓶颈帧
    │
    3. 分析瓶颈
       ├── CPU: 脚本耗时 / 渲染 / 物理 / 动画
       ├── GPU: 渲染带宽 / Shader / 填充率
       └── Memory: 纹理 / 网格 / 运行时对象
    │
    4. 优化 → 重新采样
       └── 迭代直至达到目标
```

### 6.3 常用 Profiler 标记

```csharp
// 使用 Profiler 标记自定义性能区域
using UnityEngine.Profiling;

void Update()
{
    // 标记一段代码的性能
    Profiler.BeginSample("ComplexCalculation");
    ComplexCalculation();
    Profiler.EndSample();

    // 条件标记（仅在 Profiler 打开时工作）
    Profiler.BeginSample("UpdateAI");
    UpdateAI();
    Profiler.EndSample();
}
```

## 七、各平台优化目标

| 指标 | 低端移动 | 高端移动 | PC | 主机 |
|------|---------|---------|----|------|
| **目标帧率** | 30 FPS | 60 FPS | 60+ FPS | 30~60 FPS |
| **Draw Calls** | < 50 | < 150 | < 500 | < 300 |
| **三角面数** | < 50k | < 150k | < 1M | < 500k |
| **内存使用** | < 200MB | < 500MB | < 2GB | < 4GB |
| **纹理分辨率** | 1024 max | 2048 max | 4096 | 4096 |
| **后处理** | 禁用 | 部分开启 | 全部开启 | 全部开启 |
| **阴影** | 禁用/硬阴影 | 硬阴影/级联 | 高质量阴影 | 高质量阴影 |
| **抗锯齿** | FXAA | SMAA | TAA/4x MSAA | TAA |

---

*本文档基于 Unity 6 (2024 LTS) 整理*
