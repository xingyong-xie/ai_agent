# Unity 存档 / 任务系统架构设计

> 完整的 Unity RPG **存档系统 + 任务系统**架构方案，工业级可落地实现。

---

# 第一部分：存档系统（Save System）

## 💾 一、核心设计原则

| 原则 | 说明 |
|------|------|
| **数据与表现分离** | 存档只存数据，不存 GameObject 引用 |
| **版本兼容** | 老存档能在新版本游戏中读取（向后兼容） |
| **防作弊** | 加密 / 校验和 |
| **多存档槽** | 支持 N 个存档位 + 自动存档 |
| **异步保存** | 不卡游戏主线程 |
| **断电安全** | 写入失败不破坏旧存档 |

---

## 🏗️ 二、存档系统架构

### 分层设计

```
┌────────────────────────────────────────┐
│   ISaveable 接口（业务对象实现）       │  ← Player/Inventory/Quest...
├────────────────────────────────────────┤
│   SaveManager（保存协调器）            │  ← 收集/分发数据
├────────────────────────────────────────┤
│   SaveData（数据容器）                 │  ← 纯数据结构
├────────────────────────────────────────┤
│   ISerializer（序列化层）              │  ← JSON / Binary / MessagePack
├────────────────────────────────────────┤
│   IStorage（存储层）                   │  ← LocalFile / Cloud / PlayerPrefs
└────────────────────────────────────────┘
```

---

## 📦 三、数据结构设计

### 顶层存档结构

```csharp
[Serializable]
public class SaveFile
{
    // 元数据（用于存档列表显示）
    public SaveMetadata metadata;

    // 实际数据
    public PlayerData player;
    public WorldData world;
    public QuestData quests;
    public InventoryData inventory;
    public Dictionary<string, EntitySaveData> entities; // NPC/敌人状态
    public Dictionary<string, object> customData;       // 扩展用
}

[Serializable]
public class SaveMetadata
{
    public string saveId;          // GUID，唯一标识
    public string playerName;
    public int playerLevel;
    public string sceneName;
    public string playTime;        // "12小时34分钟"
    public DateTime savedAt;
    public string thumbnailBase64; // 截图缩略图
    public string gameVersion;     // 游戏版本号
    public int saveVersion;        // 存档格式版本
}
```

### 玩家数据

```csharp
[Serializable]
public class PlayerData
{
    public Vector3Data position;
    public QuaternionData rotation;
    public float currentHP, currentMP;
    public int level, experience;
    public CharacterStats stats;
    public List<string> learnedSkills;
    public Dictionary<string, int> reputations; // 阵营声望
}

// Unity Vector3 不能直接序列化，需要包装
[Serializable]
public struct Vector3Data
{
    public float x, y, z;
    public Vector3Data(Vector3 v) { x = v.x; y = v.y; z = v.z; }
    public Vector3 ToVector3() => new Vector3(x, y, z);
}
```

### 世界状态数据

```csharp
[Serializable]
public class WorldData
{
    public float gameTime;                              // 游戏内时间
    public string currentScene;
    public WeatherType weather;
    public HashSet<string> visitedAreas;                // 探索区域
    public Dictionary<string, bool> worldFlags;         // 世界状态标志
    public Dictionary<string, int> enemyKillCounts;     // 击杀计数
    public Dictionary<string, ChestState> chestStates;  // 宝箱状态
    public List<string> destroyedObjects;               // 已破坏物体
}
```

---

## 🔌 四、ISaveable 接口设计

### 核心接口

```csharp
public interface ISaveable
{
    string SaveId { get; }            // 唯一标识
    object CaptureState();            // 收集状态
    void RestoreState(object state);  // 恢复状态
}
```

### 业务实现示例

```csharp
public class PlayerController : MonoBehaviour, ISaveable
{
    public string SaveId => "Player";

    public object CaptureState()
    {
        return new PlayerData
        {
            position = new Vector3Data(transform.position),
            rotation = new QuaternionData(transform.rotation),
            currentHP = health.Current,
            level = stats.Level,
            // ...
        };
    }

    public void RestoreState(object state)
    {
        var data = (PlayerData)state;
        transform.position = data.position.ToVector3();
        transform.rotation = data.rotation.ToQuaternion();
        health.Current = data.currentHP;
        stats.Level = data.level;
    }
}
```

### Saveable 实体（场景中物体）

```csharp
public class SaveableEntity : MonoBehaviour
{
    [SerializeField] private string saveId = Guid.NewGuid().ToString();
    public string SaveId => saveId;

    // 收集所有 ISaveable 组件的数据
    public Dictionary<string, object> CaptureState()
    {
        var state = new Dictionary<string, object>();
        foreach (var s in GetComponents<ISaveable>())
            state[s.GetType().Name] = s.CaptureState();
        return state;
    }

    public void RestoreState(Dictionary<string, object> state)
    {
        foreach (var s in GetComponents<ISaveable>())
            if (state.TryGetValue(s.GetType().Name, out var data))
                s.RestoreState(data);
    }

#if UNITY_EDITOR
    private void OnValidate()
    {
        if (string.IsNullOrEmpty(saveId))
            saveId = Guid.NewGuid().ToString();
    }
#endif
}
```

---

## 🎯 五、SaveManager 核心实现

```csharp
public class SaveManager : MonoBehaviour
{
    public static SaveManager Instance { get; private set; }

    private const string SAVE_FOLDER = "Saves";
    private const int CURRENT_VERSION = 1;
    private ISerializer serializer = new JsonSerializer();

    private string SavePath => Path.Combine(Application.persistentDataPath, SAVE_FOLDER);

    // 保存
    public async Task SaveAsync(int slot)
    {
        SaveFile save = new SaveFile
        {
            metadata = BuildMetadata(slot),
            player = CollectPlayerData(),
            world = CollectWorldData(),
            quests = QuestManager.Instance.GetSaveData(),
            inventory = InventoryManager.Instance.GetSaveData(),
            entities = CollectAllEntities()
        };

        await WriteToFileAsync(save, slot);
    }

    // 加载
    public async Task<bool> LoadAsync(int slot)
    {
        string path = GetSavePath(slot);
        if (!File.Exists(path)) return false;

        SaveFile save = await ReadFromFileAsync(path);

        // 版本迁移
        if (save.metadata.saveVersion < CURRENT_VERSION)
            save = MigrateSave(save);

        // 加载场景
        await SceneManager.LoadSceneAsync(save.metadata.sceneName);

        // 恢复数据
        RestorePlayer(save.player);
        RestoreWorld(save.world);
        QuestManager.Instance.LoadSaveData(save.quests);
        InventoryManager.Instance.LoadSaveData(save.inventory);
        RestoreAllEntities(save.entities);

        return true;
    }

    // 收集场景中所有 SaveableEntity
    private Dictionary<string, EntitySaveData> CollectAllEntities()
    {
        var result = new Dictionary<string, EntitySaveData>();
        foreach (var entity in FindObjectsOfType<SaveableEntity>())
        {
            result[entity.SaveId] = new EntitySaveData
            {
                sceneName = entity.gameObject.scene.name,
                position = new Vector3Data(entity.transform.position),
                components = entity.CaptureState()
            };
        }
        return result;
    }
}
```

### 异步写入（断电安全）

```csharp
private async Task WriteToFileAsync(SaveFile save, int slot)
{
    string path = GetSavePath(slot);
    string tempPath = path + ".tmp";
    string backupPath = path + ".bak";

    try
    {
        // 1. 先写临时文件
        string json = serializer.Serialize(save);
        byte[] data = Encoding.UTF8.GetBytes(json);

        // 可选：加密
        data = Encrypt(data);

        // 可选：计算校验和
        string hash = ComputeSHA256(data);
        save.metadata.checksum = hash;

        await File.WriteAllBytesAsync(tempPath, data);

        // 2. 备份旧存档
        if (File.Exists(path))
            File.Replace(tempPath, path, backupPath);
        else
            File.Move(tempPath, path);
    }
    catch (Exception e)
    {
        Debug.LogError($"保存失败：{e.Message}");
        if (File.Exists(tempPath)) File.Delete(tempPath);
        throw;
    }
}
```

---

## 🔐 六、加密与防作弊

### AES 加密

```csharp
public class EncryptedSerializer : ISerializer
{
    private readonly byte[] key;
    private readonly byte[] iv;

    public string Serialize<T>(T obj)
    {
        string json = JsonUtility.ToJson(obj);
        byte[] data = Encoding.UTF8.GetBytes(json);

        using var aes = Aes.Create();
        aes.Key = key;
        aes.IV = iv;

        using var encryptor = aes.CreateEncryptor();
        byte[] encrypted = encryptor.TransformFinalBlock(data, 0, data.Length);
        return Convert.ToBase64String(encrypted);
    }
}
```

### 校验和（防篡改）

```csharp
public string ComputeSHA256(byte[] data)
{
    using var sha = SHA256.Create();
    byte[] hash = sha.ComputeHash(data);
    return BitConverter.ToString(hash).Replace("-", "");
}

public bool VerifyChecksum(byte[] data, string expectedHash)
{
    return ComputeSHA256(data) == expectedHash;
}
```

> ⚠️ **注意**：加密只能防普通玩家，硬核破解者总能找到密钥。**单机游戏不必过度防御**。

---

## 🔄 七、版本迁移（向后兼容）

```csharp
public class SaveMigrator
{
    private Dictionary<int, Func<SaveFile, SaveFile>> migrations = new()
    {
        { 1, MigrateV1ToV2 },
        { 2, MigrateV2ToV3 },
    };

    public SaveFile Migrate(SaveFile save)
    {
        while (save.metadata.saveVersion < CURRENT_VERSION)
        {
            if (migrations.TryGetValue(save.metadata.saveVersion, out var migrate))
            {
                save = migrate(save);
                save.metadata.saveVersion++;
            }
        }
        return save;
    }

    private static SaveFile MigrateV1ToV2(SaveFile old)
    {
        // 例：v2 新增 reputation 字段
        if (old.player.reputations == null)
            old.player.reputations = new Dictionary<string, int>();
        return old;
    }
}
```

---

## 📊 八、序列化方案对比

| 方案 | 速度 | 体积 | 可读性 | 推荐度 |
|------|------|------|--------|--------|
| **JsonUtility**（Unity 内置） | 快 | 中 | ✅ | ⭐⭐⭐⭐ |
| **Newtonsoft.Json** | 中 | 中 | ✅ | ⭐⭐⭐⭐⭐ 推荐 |
| **BinaryFormatter** | 快 | 小 | ❌ | ⭐⭐ 已废弃 |
| **MessagePack** | 最快 | 最小 | ❌ | ⭐⭐⭐⭐ 大型项目 |
| **Protobuf** | 最快 | 最小 | ❌ | ⭐⭐⭐ 需 schema |
| **OdinSerializer** | 快 | 小 | ❌ | ⭐⭐⭐⭐⭐ Odin 用户 |

**推荐**：
- 小型项目 → **JsonUtility**
- 中大型项目 → **Newtonsoft.Json + AES**
- 性能极致 → **MessagePack**

---

## 🛠️ 九、Asset Store 存档插件

| 插件 | 价格 | 特点 |
|------|------|------|
| **Easy Save 3** ⭐⭐⭐⭐⭐ | $70 | 业界标准，几乎所有 RPG 都用 |
| **Save System Pro** | $30 | 轻量级 |
| **Odin Serializer**（免费） | 免费 | Odin 出品，序列化神器 |

> 💡 **Easy Save** 一行代码搞定：`ES3.Save("playerHP", 100);`

---

# 第二部分：任务系统（Quest System）

## 🎯 十、任务系统核心架构

### 系统组成

```
┌──────────────────────────────────────────┐
│       QuestManager（任务管理器）         │  ← 全局协调
├──────────────────────────────────────────┤
│  QuestDatabase  │  ActiveQuestTracker    │  ← 数据库 + 运行时
├──────────────────────────────────────────┤
│ QuestDefinition │ QuestObjective │ Reward│  ← 数据定义
├──────────────────────────────────────────┤
│       EventBus（事件总线）               │  ← 解耦核心
└──────────────────────────────────────────┘
              ▲
              │ 监听事件
   游戏世界各系统（战斗/对话/物品/移动）
```

### ⭐ 核心理念：**事件驱动**

任务系统不应主动轮询世界状态，而是订阅事件。

```
玩家击杀史莱姆 → 触发 EnemyKilledEvent("Slime")
                       ↓
              QuestManager 检查所有活跃任务
                       ↓
            匹配 "击杀10只史莱姆" 目标 → +1
                       ↓
                  达成条件 → 完成任务
```

---

## 📋 十一、任务数据结构

### ScriptableObject 任务定义

```csharp
[CreateAssetMenu(menuName = "RPG/Quest")]
public class QuestDefinition : ScriptableObject
{
    [Header("基础信息")]
    public string questId;
    public string title;
    [TextArea(3, 10)] public string description;
    public Sprite icon;
    public QuestType type;            // Main/Side/Daily/Hidden
    public int recommendedLevel;

    [Header("前置条件")]
    public List<string> prerequisiteQuestIds;
    public int requiredLevel;
    public List<QuestCondition> startConditions;

    [Header("目标")]
    public List<QuestObjective> objectives;
    public ObjectiveLogic logic = ObjectiveLogic.AllRequired; // 全部/任一

    [Header("奖励")]
    public List<QuestReward> rewards;
    public int expReward;
    public int goldReward;

    [Header("时间限制")]
    public bool hasTimeLimit;
    public float timeLimitMinutes;

    [Header("对话")]
    public DialogueData startDialogue;
    public DialogueData completeDialogue;
}

public enum QuestType { MainStory, SideQuest, Daily, Repeatable, Hidden, Event }
public enum ObjectiveLogic { AllRequired, AnyOne, Sequential }
```

### 目标定义（多态）

```csharp
[Serializable]
public abstract class QuestObjective
{
    public string id;
    public string description;
    public bool isOptional;
    public int currentProgress;
    public int targetProgress = 1;

    public bool IsComplete => currentProgress >= targetProgress;
    public abstract bool Match(IGameEvent gameEvent);
}

// 击杀目标
[Serializable]
public class KillObjective : QuestObjective
{
    public string enemyId;

    public override bool Match(IGameEvent ev)
    {
        if (ev is EnemyKilledEvent killEv && killEv.enemyId == enemyId)
        {
            currentProgress++;
            return true;
        }
        return false;
    }
}

// 收集目标
[Serializable]
public class CollectObjective : QuestObjective
{
    public string itemId;

    public override bool Match(IGameEvent ev)
    {
        if (ev is ItemAcquiredEvent itemEv && itemEv.itemId == itemId)
        {
            currentProgress = Mathf.Min(itemEv.totalCount, targetProgress);
            return true;
        }
        return false;
    }
}

// 到达目标
[Serializable]
public class ReachObjective : QuestObjective
{
    public string locationId;

    public override bool Match(IGameEvent ev)
    {
        if (ev is LocationReachedEvent locEv && locEv.locationId == locationId)
        {
            currentProgress = targetProgress;
            return true;
        }
        return false;
    }
}

// 对话目标
[Serializable]
public class TalkObjective : QuestObjective
{
    public string npcId;
    // 类似实现...
}
```

---

## 🎮 十二、QuestManager 实现

```csharp
public class QuestManager : MonoBehaviour
{
    public static QuestManager Instance { get; private set; }

    [SerializeField] private QuestDatabase database;
    private Dictionary<string, QuestInstance> activeQuests = new();
    private HashSet<string> completedQuests = new();
    private HashSet<string> failedQuests = new();

    // 事件
    public event Action<QuestInstance> OnQuestStarted;
    public event Action<QuestInstance> OnQuestUpdated;
    public event Action<QuestInstance> OnQuestCompleted;
    public event Action<QuestInstance> OnQuestFailed;

    private void Start()
    {
        // 订阅所有游戏事件
        EventBus.Subscribe<EnemyKilledEvent>(OnGameEvent);
        EventBus.Subscribe<ItemAcquiredEvent>(OnGameEvent);
        EventBus.Subscribe<LocationReachedEvent>(OnGameEvent);
        EventBus.Subscribe<NPCTalkedEvent>(OnGameEvent);
    }

    // 接受任务
    public bool StartQuest(string questId)
    {
        if (activeQuests.ContainsKey(questId) || completedQuests.Contains(questId))
            return false;

        var def = database.Get(questId);
        if (def == null) return false;

        // 检查前置条件
        if (!CheckPrerequisites(def)) return false;

        var instance = new QuestInstance(def);
        activeQuests[questId] = instance;
        OnQuestStarted?.Invoke(instance);

        // 起始对话
        if (def.startDialogue != null)
            DialogueManager.Instance.Play(def.startDialogue);

        return true;
    }

    // 事件处理
    private void OnGameEvent(IGameEvent gameEvent)
    {
        foreach (var quest in activeQuests.Values.ToList())
        {
            bool updated = false;
            foreach (var obj in quest.objectives)
            {
                if (!obj.IsComplete && obj.Match(gameEvent))
                    updated = true;
            }

            if (updated)
            {
                OnQuestUpdated?.Invoke(quest);
                CheckCompletion(quest);
            }
        }
    }

    // 完成判定
    private void CheckCompletion(QuestInstance quest)
    {
        bool allComplete = quest.definition.logic switch
        {
            ObjectiveLogic.AllRequired => quest.objectives.All(o => o.IsComplete || o.isOptional),
            ObjectiveLogic.AnyOne => quest.objectives.Any(o => o.IsComplete),
            _ => false
        };

        if (allComplete) CompleteQuest(quest);
    }

    public void CompleteQuest(QuestInstance quest)
    {
        activeQuests.Remove(quest.definition.questId);
        completedQuests.Add(quest.definition.questId);

        // 发放奖励
        foreach (var reward in quest.definition.rewards)
            reward.Grant();

        // 后续对话
        if (quest.definition.completeDialogue != null)
            DialogueManager.Instance.Play(quest.definition.completeDialogue);

        OnQuestCompleted?.Invoke(quest);

        // 检查后续任务自动解锁
        CheckUnlockQuests();
    }
}
```

### QuestInstance（运行时任务实例）

```csharp
[Serializable]
public class QuestInstance
{
    public QuestDefinition definition;
    public List<QuestObjective> objectives; // 深拷贝
    public DateTime startTime;
    public QuestStatus status;

    public QuestInstance(QuestDefinition def)
    {
        definition = def;
        objectives = def.objectives.Select(o => CloneObjective(o)).ToList();
        startTime = DateTime.Now;
        status = QuestStatus.Active;
    }
}

public enum QuestStatus { NotStarted, Active, Completed, Failed }
```

---

## 📡 十三、事件总线（EventBus）

**整个系统的核心解耦机制**

```csharp
public interface IGameEvent { }

public class EnemyKilledEvent : IGameEvent
{
    public string enemyId;
    public GameObject enemy;
    public Vector3 position;
}

public class ItemAcquiredEvent : IGameEvent
{
    public string itemId;
    public int count;
    public int totalCount;
}

public class LocationReachedEvent : IGameEvent
{
    public string locationId;
    public Vector3 position;
}

// 事件总线
public static class EventBus
{
    private static Dictionary<Type, List<Delegate>> handlers = new();

    public static void Subscribe<T>(Action<T> handler) where T : IGameEvent
    {
        var type = typeof(T);
        if (!handlers.ContainsKey(type)) handlers[type] = new List<Delegate>();
        handlers[type].Add(handler);
    }

    public static void Unsubscribe<T>(Action<T> handler) where T : IGameEvent
    {
        if (handlers.TryGetValue(typeof(T), out var list))
            list.Remove(handler);
    }

    public static void Publish<T>(T gameEvent) where T : IGameEvent
    {
        if (handlers.TryGetValue(typeof(T), out var list))
            foreach (var handler in list)
                ((Action<T>)handler).Invoke(gameEvent);
    }
}
```

### 业务层发布事件

```csharp
public class Enemy : MonoBehaviour
{
    [SerializeField] private string enemyId;

    public void Die()
    {
        EventBus.Publish(new EnemyKilledEvent
        {
            enemyId = enemyId,
            enemy = gameObject,
            position = transform.position
        });
    }
}
```

> 💡 **优势**：QuestManager **完全不知道** Enemy / Item / Location 的存在，纯通过事件解耦

---

## 🎨 十四、奖励系统（Reward）

### 多态奖励

```csharp
[Serializable]
public abstract class QuestReward
{
    public abstract void Grant();
    public abstract string Describe();
}

[Serializable]
public class ItemReward : QuestReward
{
    public string itemId;
    public int count;

    public override void Grant()
        => InventoryManager.Instance.AddItem(itemId, count);

    public override string Describe()
        => $"{ItemDatabase.Get(itemId).name} × {count}";
}

[Serializable]
public class GoldReward : QuestReward
{
    public int amount;
    public override void Grant() => PlayerWallet.Instance.AddGold(amount);
    public override string Describe() => $"金币 × {amount}";
}

[Serializable]
public class ExperienceReward : QuestReward
{
    public int amount;
    public override void Grant() => PlayerLevel.Instance.AddExp(amount);
    public override string Describe() => $"经验 × {amount}";
}

[Serializable]
public class UnlockReward : QuestReward
{
    public string skillId;
    public override void Grant() => SkillManager.Instance.Unlock(skillId);
    public override string Describe() => $"解锁技能：{SkillDatabase.Get(skillId).name}";
}
```

---

## 🌲 十五、任务链与分支

### 树形任务结构

```
[主线-序章]
    ↓
[主线-第一章]
    ↓ ↘
[支线A] [主线-第二章]
    ↓       ↓ ↘
[支线B] [选择] [选择]
            ↓     ↓
        [结局A][结局B]
```

### 分支任务实现

```csharp
[Serializable]
public class QuestChoice
{
    public string choiceId;
    public string description;
    public List<string> unlockQuestIds;     // 解锁后续任务
    public List<string> failQuestIds;       // 失败的互斥任务
    public List<QuestReward> additionalRewards;
}

public class BranchingQuest : QuestDefinition
{
    public List<QuestChoice> choices;

    public void MakeChoice(string choiceId)
    {
        var choice = choices.Find(c => c.choiceId == choiceId);

        foreach (var id in choice.unlockQuestIds)
            QuestManager.Instance.UnlockQuest(id);

        foreach (var id in choice.failQuestIds)
            QuestManager.Instance.FailQuest(id);

        foreach (var reward in choice.additionalRewards)
            reward.Grant();
    }
}
```

---

## 📍 十六、任务追踪 UI

```csharp
public class QuestTrackerUI : MonoBehaviour
{
    [SerializeField] private GameObject objectiveItemPrefab;
    [SerializeField] private Transform listContainer;
    private QuestInstance trackedQuest;

    private void Start()
    {
        QuestManager.Instance.OnQuestUpdated += OnQuestUpdated;
        QuestManager.Instance.OnQuestStarted += OnQuestStarted;
    }

    public void TrackQuest(QuestInstance quest)
    {
        trackedQuest = quest;
        RefreshDisplay();
    }

    private void RefreshDisplay()
    {
        foreach (Transform child in listContainer)
            Destroy(child.gameObject);

        foreach (var obj in trackedQuest.objectives)
        {
            var item = Instantiate(objectiveItemPrefab, listContainer);
            var text = item.GetComponentInChildren<TMP_Text>();

            string status = obj.IsComplete ? "✅" : "▢";
            text.text = $"{status} {obj.description} ({obj.currentProgress}/{obj.targetProgress})";
        }
    }
}
```

### 地图标记（Quest Marker）

```csharp
public class QuestMarkerSystem : MonoBehaviour
{
    public void ShowMarkerForQuest(QuestInstance quest)
    {
        foreach (var obj in quest.objectives)
        {
            if (obj.IsComplete) continue;

            Vector3? location = GetObjectiveLocation(obj);
            if (location.HasValue)
            {
                CreateMapMarker(location.Value, obj.description);
                CreateWorldArrow(location.Value); // 3D 世界中的指示箭头
            }
        }
    }

    private Vector3? GetObjectiveLocation(QuestObjective obj)
    {
        return obj switch
        {
            KillObjective k => EnemySpawner.GetNearestSpawn(k.enemyId),
            ReachObjective r => LocationDatabase.GetPosition(r.locationId),
            TalkObjective t => NPCManager.GetNPCPosition(t.npcId),
            _ => null
        };
    }
}
```

---

## 💾 十七、任务数据存档集成

```csharp
public class QuestManager : MonoBehaviour, ISaveable
{
    public string SaveId => "QuestManager";

    public object CaptureState()
    {
        return new QuestSaveData
        {
            activeQuests = activeQuests.Values.Select(q => new QuestSnapshot
            {
                questId = q.definition.questId,
                objectiveProgress = q.objectives.Select(o => new ObjectiveSnapshot
                {
                    id = o.id,
                    progress = o.currentProgress
                }).ToList(),
                startTime = q.startTime
            }).ToList(),
            completedQuests = completedQuests.ToList(),
            failedQuests = failedQuests.ToList()
        };
    }

    public void RestoreState(object state)
    {
        var data = (QuestSaveData)state;
        activeQuests.Clear();

        foreach (var snap in data.activeQuests)
        {
            var def = database.Get(snap.questId);
            var instance = new QuestInstance(def);

            // 恢复进度
            foreach (var objSnap in snap.objectiveProgress)
            {
                var obj = instance.objectives.Find(o => o.id == objSnap.id);
                if (obj != null) obj.currentProgress = objSnap.progress;
            }

            activeQuests[snap.questId] = instance;
        }

        completedQuests = new HashSet<string>(data.completedQuests);
        failedQuests = new HashSet<string>(data.failedQuests);
    }
}
```

---

## 🛠️ 十八、推荐工具

### 任务系统插件

| 插件 | 价格 | 特点 |
|------|------|------|
| **Quest Machine** ⭐ | $80 | 业界标准 |
| **Dialogue System for Unity** | $80 | 对话+任务一体（PixelCrushers） |
| **GameCreator 2 - Quest Module** | $50 | 可视化 |
| **Articy:draft + Articy Importer** | 免费 | 专业剧本工具 → Unity |

### 编辑器扩展（自研推荐）

使用 **Odin Inspector** 制作可视化任务编辑器：

```csharp
[CreateAssetMenu]
public class QuestDefinition : ScriptableObject
{
    [BoxGroup("基础信息")]
    [PreviewField(80)] public Sprite icon;

    [BoxGroup("目标")]
    [ListDrawerSettings(ShowIndexLabels = true)]
    [SerializeReference]  // 关键：支持多态序列化
    public List<QuestObjective> objectives;

    [BoxGroup("奖励")]
    [SerializeReference]
    public List<QuestReward> rewards;

    [Button("测试任务流程")]
    private void TestQuest()
    {
        QuestManager.Instance.StartQuest(questId);
    }
}
```

---

## 🎯 十九、完整系统集成示例

### 任务工作流

```
1. 玩家走近 NPC
    ↓ NPCDialogue 组件检测交互
2. 打开对话窗口
    ↓ DialogueManager 显示
3. 玩家选择"接受任务"
    ↓ QuestManager.StartQuest("quest_001")
4. 任务激活，UI 出现追踪
    ↓ QuestTrackerUI 订阅 OnQuestStarted
5. 玩家击杀史莱姆
    ↓ Enemy.Die() → EventBus.Publish(EnemyKilledEvent)
6. QuestManager 接收事件
    ↓ KillObjective.Match() → 进度 +1
7. UI 实时更新
    ↓ OnQuestUpdated 触发
8. 完成全部目标
    ↓ QuestManager.CompleteQuest()
9. 发放奖励、播放对话
    ↓ 解锁后续任务
```

---

## ✅ 二十、实施 Checklist

### 存档系统
- [ ] SaveFile 数据结构设计
- [ ] ISaveable 接口实现
- [ ] SaveManager 单例
- [ ] JSON / Newtonsoft 序列化
- [ ] AES 加密（可选）
- [ ] 校验和（可选）
- [ ] 异步保存（不卡帧）
- [ ] 临时文件 + 备份（断电安全）
- [ ] 多存档槽 UI
- [ ] 自动存档机制
- [ ] 版本迁移系统
- [ ] 缩略图截图

### 任务系统
- [ ] QuestDefinition ScriptableObject
- [ ] QuestObjective 多态目标
- [ ] EventBus 事件总线
- [ ] QuestManager 核心
- [ ] 业务系统接入事件发布
- [ ] 任务追踪 UI
- [ ] 任务日志界面
- [ ] 地图标记系统
- [ ] 任务奖励系统
- [ ] 任务分支与选择
- [ ] 前置条件检查
- [ ] 时间限制任务
- [ ] 存档集成
- [ ] 任务编辑器（Odin/自研）

---

## 📚 二十一、参考资源

### 推荐学习

| 资源 | 内容 |
|------|------|
| **GameDev.tv - RPG Quest System Course** | Udemy 完整教程 |
| **Pixel Crushers Documentation** | Quest Machine 官方文档 |
| **Brackeys - Save & Load System** | YouTube 入门 |
| **Code Monkey - Quest System** | YouTube 实战 |

### GitHub 开源项目

- **Unity Open Project - Chop Chop**（含任务系统）
- **uMMORPG**（含完整任务）
- **opsive/Quest System**

---

## ⚠️ 二十二、避坑指南

| 坑 | 后果 | 规避 |
|----|------|------|
| **存档存 GameObject 引用** | 序列化失败 | 只存 ID + 数据 |
| **同步保存大数据** | 卡顿 1+ 秒 | 用 async/await |
| **覆盖原文件失败** | 存档损坏 | 临时文件 + 备份 |
| **不做版本管理** | 老存档无法打开 | 加 saveVersion 字段 |
| **任务系统硬编码** | 添加任务要改代码 | ScriptableObject + 事件 |
| **任务直接 FindObjectOfType** | 性能差、耦合高 | 事件总线 |
| **目标只用 string 匹配** | 易出错 | 用 enum 或 ID 数据库 |

---

## 🎯 推荐技术栈

### 💎 独立开发者方案

```
存档：Easy Save 3（$70）
任务：自研 ScriptableObject + EventBus
对话：Dialogue System for Unity（$80）
编辑：Odin Inspector（$60）
────────────────────────────
约 $210，可做完整中型 RPG
```

### 💎 商业项目方案

```
存档：自研 + Newtonsoft.Json + AES
任务：Quest Machine（$80）
对话：Articy:draft（免费导入器）
编辑：自研 Odin 扩展
────────────────────────────
工业化标准流程
```

---

## 🔗 相关文档

- [[Unity_Scene_Resource_Architecture]] - 场景与资源管理
- [[Unity_CSharp_Scripting_Architecture]] - C# 脚本架构
- [[Unity_Action_Combat_System]] - 动作战斗系统
- [[Unity_Open_World_Architecture]] - 开放世界地图技术方案
- [[Unity_UI_Architecture]] - UI 系统
- [[Unity_MOC]] - Unity 知识地图
