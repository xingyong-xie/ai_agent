---
title: Unity C# 脚本架构与生命周期
created: 2026-06-08
updated: 2026-06-08
tags: [游戏, Unity, 架构, C#, 脚本]
related: "[[Unity_MOC]]"
---

# Unity C# 脚本架构与生命周期

## 一、脚本整体架构

```
Unity C# 脚本系统
    │
    ├── MonoBehaviour（脚本基类）
    │       ├── 生命周期方法
    │       ├── 事件回调
    │       ├── 协程支持
    │       └── 编辑器集成
    │
    ├── 引擎 API 体系
    │       ├── Input API（输入系统）
    │       ├── Physics API（物理系统）
    │       ├── SceneManagement（场景管理）
    │       ├── UI API（UI 系统）
    │       └── Audio API（音频系统）
    │
    ├── 数据管理
    │       ├── MonoBehaviour 字段序列化
    │       ├── ScriptableObject
    │       ├── PlayerPrefs
    │       └── 持久化数据
    │
    └── 异步模型
            ├── 协程 (Coroutine)
            ├── AsyncOperation
            ├── C# Task/async-await
            └── Addressables Async
```

## 二、MonoBehaviour 生命周期

### 2.1 生命周期流程图

```
对象被创建 / 场景加载
        │
        ▼
    Awake()
    ──────────────────────────────────────
    • 对象实例化时立即调用（仅一次）
    • 无论脚本是否启用都会执行
    • 适合：初始化引用、注册事件
        │
        ▼
    OnEnable()
    ──────────────────────────────────────
    • 对象变为启用状态时调用
    • 每次 enabled = true 时都会触发
    • 适合：订阅事件、重置状态
        │
        ▼
    Start()
    ──────────────────────────────────────
    • 第一帧 Update 之前调用（仅一次）
    • 在所有 Awake 之后执行
    • 适合：初始化游戏状态、获取组件引用
        │
        ▼
┌─── Update() ──── 每帧执行 ────┐
│   • 游戏逻辑更新               │
│   • 输入检测                   │
│   • 非物理运动                 │
└───────────────────────────────┘
        │
        ▼
┌─── FixedUpdate() ── 固定间隔 ──┐
│   • 物理更新（默认 0.02s）     │
│   • Rigidbody 操作            │
│   • 碰撞检测逻辑               │
└───────────────────────────────┘
        │
        ▼
┌─── LateUpdate() ── Update 后 ──┐
│   • 所有 Update 执行完后调用   │
│   • 跟随相机逻辑               │
│   • 动画 IK 设置              │
└───────────────────────────────┘
        │
        ▼
    OnDisable()
    ──────────────────────────────────────
    • 对象变为禁用状态时调用
    • 适合：取消事件订阅
        │
        ▼
    OnDestroy()
    ──────────────────────────────────────
    • 对象被销毁时调用
    • 适合：清理资源、保存状态
```

### 2.2 执行顺序控制

```
Script Execution Order Settings
(Project Settings → Script Execution Order)

默认执行顺序:
    ├── 正数: 后执行
    │       Default Time (0)
    └── 负数: 先执行
```

### 2.3 各阶段注意事项

| 阶段 | 可访问对象 | 不可访问对象 | 注意事项 |
|------|-----------|-------------|---------|
| Awake | 自身组件 | 其他对象的组件可能未初始化 | 不要在其他对象上执行操作 |
| OnEnable | 所有已初始化的对象 | 尚未调用 Start 的对象 | 每次启用都调用 |
| Start | 所有场景对象 | 动态实例化的对象 | 适合做最终初始化 |
| Update | 全部 | - | 依赖 Time.deltaTime |
| FixedUpdate | 全部 | - | 不要依赖 Time.deltaTime |
| LateUpdate | 全部 | - | 适合相机逻辑 |

## 三、脚本 API 体系

### 3.1 API 类别总览

| API 类别 | 核心类/命名空间 | 用途 |
|---------|---------------|------|
| **GameObject 操作** | GameObject, Object | 创建/销毁/查找对象 |
| **Transform 操作** | Transform, Vector3, Quaternion | 位置/旋转/缩放控制 |
| **输入系统** | Input | 键盘/鼠标/触摸/陀螺仪 |
| **时间系统** | Time | 帧时间/缩放/固定间隔 |
| **物理系统** | Rigidbody, Collider, Physics | 刚体/碰撞/射线检测 |
| **场景管理** | SceneManager | 场景加载/卸载 |
| **资源管理** | Resources, Addressables | 资源加载/卸载 |
| **UI 系统** | UnityEngine.UI, TMP | UI 组件操作 |
| **音频系统** | AudioSource, AudioClip | 音频播放 |
| **协程** | MonoBehaviour | 异步执行 |
| **数学** | Mathf, Vector3, Quaternion | 数学运算 |

### 3.2 常用 API 速查

```csharp
// ===== 对象操作 =====
GameObject go = new GameObject("Name");
GameObject clone = Instantiate(prefab, position, rotation);
Destroy(gameObject, 2f);           // 2秒后销毁
DestroyImmediate(gameObject);       // 立即销毁（编辑器）
GameObject.Find("Name");           // 按名称查找（性能差）
FindObjectOfType<Player>();        // 按类型查找

// ===== Transform =====
transform.position = new Vector3(1, 2, 3);
transform.Translate(Vector3.forward * speed * Time.deltaTime);
transform.Rotate(Vector3.up, angle);
transform.LookAt(target);
Vector3 dir = (target - transform.position).normalized;

// ===== 输入 =====
float h = Input.GetAxis("Horizontal");
bool jump = Input.GetKeyDown(KeyCode.Space);
bool fire = Input.GetButtonDown("Fire1");
Vector2 touch = Input.GetTouch(0).position;

// ===== 时间 =====
float dt = Time.deltaTime;
float fixedDt = Time.fixedDeltaTime;
float gameTime = Time.time;
float unscaledTime = Time.unscaledTime;
Time.timeScale = 0.5f;    // 慢动作
Time.timeScale = 0f;      // 暂停

// ===== 物理 =====
rb.AddForce(Vector3.up * force);
rb.AddTorque(Vector3.forward * torque);
rb.velocity = new Vector3(x, rb.velocity.y, z);
bool hit = Physics.Raycast(origin, direction, out hitInfo, maxDist);
Collider[] hits = Physics.OverlapSphere(pos, radius);
```

## 四、协程架构详解

### 4.1 协程执行模型

```
启动协程 (StartCoroutine)
    │
    ▼
IEnumerator 函数开始执行
    │
    ▼
yield return <指令> ──> 暂停执行
    │                      │
    │              ┌───────┴───────┐
    │              │ 等待条件满足  │
    │              └───────┬───────┘
    │                      │
    └──── 恢复执行 ◄───────┘
    │
    ▼
   继续到下一个 yield
    │
    ▼
  ... 循环 ...
    │
    ▼
 执行完毕（自动终止）
```

### 4.2 yield 指令类型

| 指令 | 行为 | 适用场景 |
|------|------|---------|
| `yield return null` | 下一帧继续 | 分散耗时操作 |
| `yield return new WaitForSeconds(n)` | 等待 n 秒 | 计时器、延迟 |
| `yield return new WaitForSecondsRealtime(n)` | 等待实际 n 秒（不受 Time.timeScale 影响） | UI 动画、暂停菜单 |
| `yield return new WaitForEndOfFrame()` | 等本帧渲染结束 | 截屏、帧末操作 |
| `yield return new WaitForFixedUpdate()` | 等下个 FixedUpdate | 物理同步 |
| `yield return new WaitUntil(() => condition)` | 等到条件为 true | 条件等待 |
| `yield return new WaitWhile(() => condition)` | 等到条件为 false | 条件等待 |
| `yield return StartCoroutine(other)` | 等待另一个协程完成 | 协程链 |
| `yield return new WWW(url)` | 等待网络请求（旧版） | 网络加载 |
| `yield return request` | 等待 AsyncOperation | 场景/资源加载 |

### 4.3 协程控制

```csharp
// 启动
Coroutine c = StartCoroutine(MyCoroutine());

// 停止特定协程
StopCoroutine(c);
StopCoroutine("MyCoroutine");

// 停止所有协程
StopAllCoroutines();

// 协程嵌套
IEnumerator RootCoroutine()
{
    Debug.Log("开始");
    yield return StartCoroutine(SubCoroutine());
    Debug.Log("子协程完成");
}

IEnumerator SubCoroutine()
{
    yield return new WaitForSeconds(1f);
    Debug.Log("子协程执行");
}
```

## 五、消息与事件架构

### 5.1 Unity 内置消息

| 消息方法 | 触发时机 |
|---------|---------|
| `Awake()` | 对象实例化 |
| `Start()` | 第一帧前 |
| `Update()` | 每帧 |
| `FixedUpdate()` | 固定间隔 |
| `LateUpdate()` | 每帧（Update 后） |
| `OnEnable()` | 启用时 |
| `OnDisable()` | 禁用时 |
| `OnDestroy()` | 销毁时 |
| `OnCollisionEnter/Stay/Exit()` | 碰撞事件 |
| `OnTriggerEnter/Stay/Exit()` | 触发事件 |
| `OnMouseDown/Drag/Enter/Exit()` | 鼠标事件 |
| `OnApplicationPause/Quit()` | 应用生命周期 |

### 5.2 自定义事件体系

```csharp
// 1. C# 委托事件
public delegate void OnScoreChanged(int score);
public event OnScoreChanged ScoreChanged;

// 2. UnityEvent（可视化绑定）
public UnityEvent onGameStart;
public UnityEvent<int> onScoreChanged;

// 3. 消息系统 (SendMessage)
gameObject.SendMessage("MethodName", param);
gameObject.BroadcastMessage("MethodName", param);
gameObject.SendMessageUpwards("MethodName", param);

// 4. C# Action 委托
public static Action OnGameOver;
public static Action<int> OnScoreUpdate;
```

---

*本文档基于 Unity 6 (2024 LTS) 整理*
