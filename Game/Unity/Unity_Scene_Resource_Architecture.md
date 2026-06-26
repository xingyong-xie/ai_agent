---
title: Unity 场景与资源管理架构
created: 2026-06-08
updated: 2026-06-08
tags: [游戏, Unity, 架构, 场景管理, 资源管理]
related: "[[Unity_MOC]]"
---

# Unity 场景与资源管理架构

## 一、场景管理系统架构

### 1.1 SceneManager 整体架构

```
Unity 场景系统
    │
    ├── Scene（场景对象）
    │       ├── name（名称）
    │       ├── path（路径）
    │       ├── buildIndex（Build Settings 索引）
    │       ├── isLoaded（是否已加载）
    │       ├── rootCount（根对象数）
    │       └── GetRootGameObjects()（获取根对象列表）
    │
    ├── SceneManager（场景管理器）
    │       ├── LoadScene / LoadSceneAsync（加载）
    │       ├── UnloadSceneAsync（卸载）
    │       ├── MergeScenes（合并场景）
    │       ├── MoveGameObjectToScene（移动对象）
    │       ├── sceneLoaded/unloaded（事件回调）
    │       └── activeSceneChanged（事件回调）
    │
    └── LoadSceneMode（加载模式）
            ├── Single（单场景模式——卸载全部再加载）
            └── Additive（叠加模式——保留现有场景）
```

### 1.2 场景加载流程

```csharp
// ===== 加载模式 =====

// 单场景加载（切换关卡）
SceneManager.LoadScene("Level2");
SceneManager.LoadScene(1);  // 通过 Build Index

// 异步加载（带进度条）
public IEnumerator LoadSceneAsync(string sceneName)
{
    AsyncOperation operation = SceneManager.LoadSceneAsync(sceneName);
    
    // 加载完成后自动激活
    operation.allowSceneActivation = false;  // 阻止自动激活
    
    while (!operation.isDone)
    {
        // progress 在 0.9 后是激活阶段
        float progress = Mathf.Clamp01(operation.progress / 0.9f);
        progressBar.fillAmount = progress;
        progressText.text = $"{progress * 100:F0}%";
        
        yield return null;
    }
    
    // 手动激活（隐藏的加载完成状态）
    operation.allowSceneActivation = true;
}

// 叠加加载（如：UI 层、角色系统）
SceneManager.LoadScene("UISystem", LoadSceneMode.Additive);

// 异步叠加加载
AsyncOperation op = SceneManager.LoadSceneAsync("LevelAddon", LoadSceneMode.Additive);
```

### 1.3 场景事件体系

```csharp
public class SceneEventManager : MonoBehaviour
{
    void OnEnable()
    {
        // 注册场景事件
        SceneManager.sceneLoaded += OnSceneLoaded;
        SceneManager.sceneUnloaded += OnSceneUnloaded;
        SceneManager.activeSceneChanged += OnActiveSceneChanged;
    }

    void OnDisable()
    {
        SceneManager.sceneLoaded -= OnSceneLoaded;
        SceneManager.sceneUnloaded -= OnSceneUnloaded;
        SceneManager.activeSceneChanged -= OnActiveSceneChanged;
    }

    void OnSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        Debug.Log($"场景加载完成: {scene.name}, 模式: {mode}");
        // 初始化场景特定系统
    }

    void OnSceneUnloaded(Scene scene)
    {
        Debug.Log($"场景已卸载: {scene.name}");
    }

    void OnActiveSceneChanged(Scene from, Scene to)
    {
        Debug.Log($"活跃场景: {from.name} → {to.name}");
    }
}
```

### 1.4 多场景架构设计模式

```
推荐的多场景架构：
    │
    ├── BootScene（启动场景）
    │       ├── 初始化管理器
    │       └── 加载持久化场景
    │
    ├── PersistentScene（持久场景）
    │       ├── MonoBehaviour 单例管理类
    │       ├── AudioManager
    │       ├── GameManager
    │       └── EventSystem
    │
    ├── UIScene（UI 场景）
    │       ├── Canvas / EventSystem
    │       └── HUD / Menu / Dialog
    │
    └── LevelScene（关卡场景）
            ├── 关卡地形、碰撞体
            ├── 敌人/NPC
            ├── 光照数据
            └── 关卡特定逻辑
```

## 二、资源加载体系

### 2.1 三种资源加载方式对比

| 方式 | 特点 | 适用场景 | 管理粒度 |
|------|------|---------|---------|
| **Resources** | 简单直接 | 小项目/少量资源 | 粗粒度 |
| **Addressables** | 灵活、推荐 | 中大型项目 | 细粒度 |
| **AssetBundle** | 底层、灵活 | 热更新、自定义 | 自定义 |

```
资源加载策略选择：
    │
    ├── 小项目（< 100MB 资源）
    │       └── Resources 系统（够用）
    │
    ├── 中项目（100MB ~ 2GB）
    │       └── Addressables（推荐）
    │
    └── 大项目（> 2GB、热更新需求）
            └── Addressables + AssetBundle
```

### 2.2 Resources 系统

```
Resources 系统架构
    │
    ├── Resources 文件夹
    │       ├── 必须位于 Assets/Resources/
    │       └── 编译时全部打包进主程序
    │
    ├── 加载方法
    │       ├── Resources.Load<T>(path)
    │       ├── Resources.LoadAsync<T>(path)
    │       ├── Resources.LoadAll<T>(path)
    │       └── Resources.FindObjectsOfTypeAll<T>()
    │
    └── 卸载方法
            ├── Resources.UnloadAsset(asset)
            └── Resources.UnloadUnusedAssets()
    
    优点: 简单、API 直观
    缺点: 无法热更新、内存管理不灵活、启动时间长
```

```csharp
// Resources 加载示例
public class ResourceManager : MonoBehaviour
{
    // 同步加载
    GameObject prefab = Resources.Load<GameObject>("Prefabs/Player");
    Instantiate(prefab);

    // 异步加载
    IEnumerator LoadAsync()
    {
        ResourceRequest request = Resources.LoadAsync<GameObject>("Prefabs/Player");
        while (!request.isDone)
        {
            yield return null;
        }
        Instantiate(request.asset);
    }

    // 按类型加载
    AudioClip[] clips = Resources.LoadAll<AudioClip>("Audio/");

    // 卸载
    Resources.UnloadAsset(prefab);
    Resources.UnloadUnusedAssets();  // 建议在场景切换时调用
}
```

### 2.3 Addressables 系统（推荐）

```
Addressables 架构
    │
    ├── 资源寻址系统
    │       ├── 每个资源有唯一 Addressable Key
    │       ├── 支持按标签 (Label) 分组
    │       └── 运行时通过 Key 加载
    │
    ├── 远程内容分发 (Remote Content)
    │       ├── 资源上传到 CDN
    │       ├── 热更新支持
    │       └── 版本管理
    │
    └── 依赖管理
            ├── 自动处理依赖关系
            ├── 引用计数自动管理
            └── 智能内存释放
```

```csharp
// Addressables 加载示例
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class AddressableManager : MonoBehaviour
{
    // 加载单个资源
    IEnumerator LoadSingleAsset()
    {
        AsyncOperationHandle<GameObject> handle = 
            Addressables.LoadAssetAsync<GameObject>("PlayerPrefab");
        
        yield return handle;
        
        if (handle.Status == AsyncOperationStatus.Succeeded)
        {
            Instantiate(handle.Result);
        }
        
        // 用完后释放
        Addressables.Release(handle);
    }

    // 实例化（加载并实例化一步完成）
    IEnumerator InstantiateFromAddressable()
    {
        AsyncOperationHandle<GameObject> handle = 
            Addressables.InstantiateAsync("PlayerPrefab", 
                new Vector3(0, 0, 0), Quaternion.identity);
        
        yield return handle;
        
        // 销毁时自动释放
        Addressables.ReleaseInstance(handle.Result);
    }

    // 按标签批量加载
    IEnumerator LoadByLabel()
    {
        AsyncOperationHandle<IList<GameObject>> handle = 
            Addressables.LoadAssetsAsync<GameObject>(
                new List<string> { "UI", "Level1" }, 
                null, // 每个加载完成的回调
                Addressables.MergeMode.Intersection
            );
        
        yield return handle;
        
        foreach (var asset in handle.Result)
        {
            // 处理加载的资源
        }
    }

    // 检查资源更新
    IEnumerator CheckForUpdates()
    {
        AsyncOperationHandle<List<string>> checkHandle = 
            Addressables.CheckForCatalogUpdates();
        yield return checkHandle;
        
        if (checkHandle.Result.Count > 0)
        {
            // 有更新，下载新内容
            AsyncOperationHandle updateHandle = 
                Addressables.UpdateCatalogs(checkHandle.Result);
            yield return updateHandle;
        }
    }
}
```

### 2.4 AssetBundle 系统

```
AssetBundle 架构
    │
    ├── 打包
    │       ├── BuildPipeline.BuildAssetBundles()
    │       ├── 指定压缩方式 (LZMA/LZ4/Uncompressed)
    │       └── 生成 manifest 文件
    │
    ├── 加载方式
    │       ├── LoadFromFile（本地最快）
    │       ├── LoadFromMemory（内存加载）
    │       ├── LoadFromStream（流式加载）
    │       └── DownloadHandlerAssetBundle（网络下载）
    │
    └── 资产提取
            ├── AssetBundle.LoadAsset(name)
            ├── AssetBundle.LoadAllAssets()
            └── AssetBundle.LoadAssetAsync(name)
    
    优点: 完全控制、热更新
    缺点: 需手动管理依赖、API 复杂
```

## 三、ScriptableObject 架构

### 3.1 ScriptableObject 数据容器

```csharp
[CreateAssetMenu(fileName = "GameConfig", menuName = "Game/GameConfig")]
public class GameConfig : ScriptableObject
{
    public string gameName;
    public int maxLevel;
    public float playerSpeed;
    public float jumpForce;
    public List<EnemyConfig> enemies;
    public LevelConfig[] levels;
    
    [System.Serializable]
    public class EnemyConfig
    {
        public string name;
        public int health;
        public float speed;
        public GameObject prefab;
    }
}

// 使用
GameConfig config = Resources.Load<GameConfig>("Configs/GameConfig");
float speed = config.playerSpeed;
```

### 3.2 设计用途

| 用途 | 说明 | 相比其他方案的优势 |
|------|------|------------------|
| **游戏配置数据** | 角色属性、关卡参数 | 可视化编辑，不用硬编码 |
| **共享数据** | 多个对象引用同一数据 | 修改一处全部生效 |
| **事件通道** | 使用 ScriptableObject 做事件总线 | 解耦发送者和接收者 |
| **数据持久化** | 运行时数据保持 | 编辑器模式下也保留数据 |
| **编辑器工具** | 自定义资产类型 | 内置 UI 编辑支持 |

## 四、持久化数据系统

### 4.1 游戏数据持久化方案

| 方案 | 存储位置 | 适用场景 | 安全性 |
|------|---------|---------|--------|
| **PlayerPrefs** | 注册表/plist | 设置、音量、分辨率 | 低（明文） |
| **JSON** | Application.persistentDataPath | 存档进度、玩家数据 | 中（可加密） |
| **Binary** | 自定义文件 | 性能要求高 | 高（加密） |
| **SQLite** | 数据库文件 | 大量结构化数据 | 中 |
| **Cloud Save** | 远程服务器 | 跨设备同步 | 高 |

```csharp
// JSON 存档示例
[System.Serializable]
public class SaveData
{
    public int level = 1;
    public int score = 0;
    public float health = 100f;
    public List<string> inventory = new List<string>();
    public SerializableVector3 position;
}

[System.Serializable]
public struct SerializableVector3
{
    public float x, y, z;
    public SerializableVector3(Vector3 v) { x = v.x; y = v.y; z = v.z; }
    public Vector3 ToVector3() => new Vector3(x, y, z);
}

public class SaveManager : MonoBehaviour
{
    private string savePath => Application.persistentDataPath + "/save.json";

    public void SaveGame(SaveData data)
    {
        string json = JsonUtility.ToJson(data, prettyPrint: true);
        File.WriteAllText(savePath, json);
        Debug.Log($"游戏已保存: {savePath}");
    }

    public SaveData LoadGame()
    {
        if (File.Exists(savePath))
        {
            string json = File.ReadAllText(savePath);
            return JsonUtility.FromJson<SaveData>(json);
        }
        return new SaveData();  // 新存档
    }
}
```

---

*本文档基于 Unity 6 (2024 LTS) 整理*
