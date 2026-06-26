---
title: Unreal Engine 5 核心架构
created: 2026-06-08
updated: 2026-06-08
tags: [游戏, Unreal, 架构, 引擎核心, 虚幻引擎]
related: "[[AI_Learning_Roadmap_MOC]]"
---

# Unreal Engine 5 核心架构

## 一、引擎整体架构

```
Unreal Engine 5 架构
    │
    ├── 核心层 (Core)
    │       ├── 基础类型系统
    │       ├── 反射系统 (UProperty/UFunction)
    │       ├── 垃圾回收 (GC)
    │       ├── 序列化
    │       ├── 数学库 (Math/Vector/Matrix)
    │       └── 容器 (TArray/TMap/TSet)
    │
    ├── 渲染层 (Rendering)
    │       ├── Nanite（虚拟几何体）
    │       ├── Lumen（实时全局光照）
    │       ├── Temporal Super Resolution（时序超采样）
    │       ├── Niagara（粒子系统）
    │       └── Post Processing（后处理）
    │
    ├── 游戏框架层 (Game Framework)
    │       ├── GameMode / GameState
    │       ├── Pawn / Character / Controller
    │       ├── PlayerState
    │       ├── Actor / Component 体系
    │       └── UObject 体系
    │
    ├── 编辑器层 (Editor)
    │       ├── Level Editor（关卡编辑器）
    │       ├── Blueprint Editor（蓝图编辑器）
    │       ├── Material Editor（材质编辑器）
    │       ├── Animation Editor（动画编辑器）
    │       ├── Sequencer（过场动画编辑器）
    │       └── Niagara Editor（粒子编辑器）
    │
    └── 平台抽象层 (Platform)
            ├── RHI (Rendering Hardware Interface)
            ├── 音频后端
            ├── 输入系统
            └── 文件/网络抽象层
```

## 二、核心设计理念

### 2.1 对象体系 (UObject)

```
UObject ── 所有对象的基类
    │
    ├── 自动 GC（垃圾回收）
    ├── 反射 (Reflection)
    │       ├── UPROPERTY()
    │       ├── UFUNCTION()
    │       └── UCLASS()
    ├── 序列化 (Serialize/Load)
    ├── 网络复制 (Replication)
    ├── 编辑器集成
    └── Config 系统
```

| 宏 | 用途 | 示例 |
|----|------|------|
| `UCLASS()` | 标记类可被引擎管理 | `UCLASS(Blueprintable)` |
| `UPROPERTY()` | 标记属性支持 GC/序列化/编辑 | `UPROPERTY(EditAnywhere, BlueprintReadOnly)` |
| `UFUNCTION()` | 标记函数支持蓝图调用/网络复制 | `UFUNCTION(BlueprintCallable, Server)` |

```cpp
// UObject 声明示例
UCLASS(Blueprintable)
class MYGAME_API AMyCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
    float Health;

    UPROPERTY(Replicated, BlueprintReadOnly, Category = "Stats")
    float MaxHealth;

    UFUNCTION(BlueprintCallable, Category = "Gameplay")
    void TakeDamage(float DamageAmount);

    UFUNCTION(Server, Reliable, WithValidation)
    void ServerRequestAttack();
};
```

### 2.2 Actor 组件体系

```
Actor ── 场景中的对象
    │
    ├── RootComponent（根组件）
    │       └── 确定 Transform
    │
    ├── SceneComponent
    │       ├── 有位置/旋转/缩放
    │       ├── 可嵌套父子关系
    │       └── StaticMeshComponent / SkeletalMeshComponent
    │
    ├── ActorComponent
    │       ├── 无位置信息
    │       ├── 处理逻辑
    │       └── UCharacterMovementComponent / UAudioComponent
    │
    └── UActorComponent (C++ 逻辑组件)
```

### 2.3 游戏框架

```
游戏实例 (UGameInstance)
    │
    ├── 全局数据（跨关卡）
    └── 管理器单例
    │
    ▼
关卡 (UWorld / ULevel)
    │
    ├── GameMode（游戏规则）
    │       ├── 只在服务器上运行
    │       ├── 定义游戏胜负条件
    │       └── 控制生成点
    │
    ├── GameState（全局状态）
    │       ├── 复制到所有客户端
    │       └── 全局共享数据
    │
    ├── PlayerController（玩家控制器）
    │       ├── 输入处理
    │       ├── HUD 控制
    │       └── 每个玩家一个
    │
    ├── Pawn / Character（角色）
    │       ├── 玩家或 AI 控制的对象
    │       ├── Character 继承 Pawn（带运动组件）
    │       └── PlayerState 存储个人数据
    │
    └── AIController（AI 控制器）
            ├── 行为树 (Behavior Tree)
            ├── 环境查询 (EQS)
            └── 感知系统
```

## 三、渲染系统

### 3.1 渲染整体架构

```
Unreal 渲染管线 (UE5)
    │
    ├── Nanite（虚拟几何体系统）
    │       ├── 自动 LOD，无需手动设置
    │       ├── 像素级精度的细节
    │       ├── 支持几十亿三角形场景
    │       ├── 来源: Quixel Megascans 原生支持
    │       └── 限制: 不支持变形/蒙皮/透明
    │
    ├── Lumen（实时全局光照）
    │       ├── 无限次光线反弹
    │       ├── 间接光照实时更新
    │       ├── 支持软阴影/半透明 GI
    │       ├── 无需 Lightmap 烘焙
    │       └── 可选: Software Ray Tracing / Hardware RT
    │
    ├── Temporal Super Resolution (TSR)
    │       ├── 时序超采样上采样
    │       ├── 从低分辨率重建高分辨率
    │       ├── 类似 DLSS/FSR2 的技术
    │       └── 大幅提升帧率
    │
    ├── World Partition（世界分区）
    │       ├── 自动分割大型世界
    │       ├── 流式加载区域
    │       └── 让开放世界开发更高效
    │
    └── One File Per Actor (OFPA)
            ├── 每个 Actor 独立文件
            ├── 多人协作不冲突
            └── 更优的版本控制
```

### 3.2 渲染层级

```
RHI (Render Hardware Interface)
    │
    ├── 抽象底层图形 API
    │       ├── DirectX 12
    │       ├── Vulkan
    │       ├── Metal
    │       └── OpenGL
    │
    ├── RDG (Render Dependency Graph)
    │       ├── 自动管理渲染资源
    │       ├── 优化 Pass 合并
    │       └── 自动障碍检测
    │
    └── 渲染特性
            ├── Deferred Shading（延迟渲染）
            ├── Forward Shading（前向渲染 - VR）
            ├── Distance Field（距离场）
            └── Ray Tracing（硬件光追）
```

## 四、蓝图系统

### 4.1 蓝图类型

| 蓝图类型 | 说明 | 用途 |
|---------|------|------|
| **关卡蓝图 (Level Blueprint)** | 关卡级别的事件 | 关卡触发器、过场动画 |
| **类蓝图 (Blueprint Class)** | 可复用的 Actor 类 | 角色、道具、武器 |
| **动画蓝图 (Animation Blueprint)** | 动画控制 | 状态机、IK、混合 |
| **控件蓝图 (Widget Blueprint)** | UI 开发 | HUD、菜单、游戏内 UI |
| **材质蓝图 (Material Blueprint)** | 材质节点 | PBR 材质、特效材质 |
| **Niagara 蓝图** | 粒子效果 | 视觉特效 |
| **工具蓝图 (Editor Utility)** | 编辑器工具 | 批处理、自定义工具 |

### 4.2 C++ 与蓝图双轨制

```
性能关键路径 ←── C++
    │
    ├── 核心游戏逻辑
    ├── 网络复制
    ├── 大量计算
    └── 底层系统
    │
────┼────
    │
设计迭代 ——→ 蓝图
    │
    ├── 游戏玩法配置
    ├── AI 行为树
    ├── UI 逻辑
    ├── 事件触发
    └── 快速原型
```

```cpp
// C++ 暴露给蓝图的模式
UCLASS(Blueprintable, BlueprintType)
class UMyAbility : public UObject
{
    GENERATED_BODY()

public:
    // C++ 实现，蓝图不可覆盖
    UFUNCTION(BlueprintPure)
    float CalculateDamage() const;

    // C++ 默认实现，蓝图可覆盖
    UFUNCTION(BlueprintNativeEvent)
    void OnAbilityActivated();
    virtual void OnAbilityActivated_Implementation();
    
    // 蓝图必须实现
    UFUNCTION(BlueprintImplementableEvent)
    void OnAbilityFinished();
};
```

## 五、物理系统

| 组件 | 说明 | UE4/UE5 |
|------|------|---------|
| **Chaos Physics** | UE5 默认物理引擎 | 替换了 PhysX |
| **Chaos Destruction** | 网格破坏系统 | 支持几何体破碎 |
| **Chaos Cloth** | 布料模拟 | 替代 APEX |
| **Chaos Vehicle** | 车辆物理 | 替代 PhysX Vehicle |
| **约束系统** | 关节/弹簧 | PhysicsConstraintComponent |

```cpp
// Chaos 物理基础组件
UPrimitiveComponent* Root = GetRootComponent();

// 添加物理
Root->SetSimulatePhysics(true);
Root->SetMassInKg(50.0f);
Root->SetEnableGravity(true);

// 施加力
Root->AddForce(FVector(0, 0, 5000));
Root->AddImpulse(GetActorForwardVector() * 1000);
Root->AddTorqueInDegrees(FVector(0, 0, 500));
```

## 六、动画系统

### 6.1 动画架构

```
Animation Blueprint
    │
    ├── 状态机 (State Machine)
    │       ├── Locomotion（移动状态）
    │       ├── Action（动作状态）
    │       └── Reaction（反应状态）
    │
    ├── 混合空间 (Blend Space)
    │       ├── 1D Blend: 速度 → Walk/Jog/Run
    │       └── 2D Blend: 方向+速度
    │
    └── 动画图表 (Anim Graph)
            ├── 骨骼控制 (Control Rig)
            ├── IK（Full Body IK）
            ├── 分层动画 (Layered Animations)
            └── 动画蒙太奇 (Anim Montage)
```

### 6.2 动画蒙太奇

```
Anim Montage ── 可中断的动画片段
    │
    ├── Slot（插槽）—— 插入覆盖动画
    │       ├── 上半身插槽: 射击/挥手
    │       └── 下半身插槽: 走路保持
    │
    ├── Section（分段）—— 分段播放控制
    │       ├── Start → Middle → End
    │       └── 可跳转到任意 Section
    │
    ├── Notify（通知）
    │       ├── 脚步事件
    │       ├── 攻击判定时间点
    │       └── 音效触发
    │
    └── Branching Point（分支点）
            └── 根据条件选择分支
```

## 七、UI 系统 (UMG)

```
UMG (Unreal Motion Graphics)
    │
    ├── 控件蓝图 (Widget Blueprint)
    │       ├── 可视化编辑
    │       ├── 控件层级
    │       └── 动画支持
    │
    ├── 常用控件
    │       ├── Canvas Panel（画布）
    │       ├── Horizontal/Vertical Box（布局）
    │       ├── Grid Panel（网格）
    │       ├── Overlay（叠加）
    │       ├── Image / Text / Button
    │       ├── Progress Bar / Slider
    │       └── Scroll Box / List View
    │
    └── 开发模式
            ├── Widget Blueprint（蓝图）
            ├── C++ UWidget 子类化
            ├── Common UI Plugin（通用 UI 框架）
            └── Procedural Widget（运行时生成）
```

## 八、网络与多人架构

### 8.1 复制体系

```
服务器权威模型 (Server Authoritative)
    │
    ├── Server ── 权威逻辑运行
    │       ├── GameMode（仅服务器）
    │       ├── GameState（复制到全体）
    │       └── 所有 Actor 的 Replicated 属性
    │
    ├── Client 1 ── 玩家 1
    │       ├── PlayerController
    │       ├── 模拟 (Simulated Proxy)
    │       └── 自主 (Autonomous Proxy)
    │
    └── Client 2 ── 玩家 2
            ├── PlayerController
            ├── 模拟 (Simulated Proxy)
            └── 自主 (Autonomous Proxy)
```

### 8.2 属性复制

```cpp
// 属性复制声明
UPROPERTY(Replicated)
bool bIsAlive;

UPROPERTY(ReplicatedUsing = OnRep_HealthChanged)
float Health;

UFUNCTION()
void OnRep_HealthChanged();

// 注册复制属性
void AMyCharacter::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    DOREPLIFETIME(AMyCharacter, Health);
    DOREPLIFETIME_CONDITION(AMyCharacter, Ammo, COND_OwnerOnly);
}
```

## 九、UE4 vs UE5 核心差异

| 维度 | Unreal Engine 4 | Unreal Engine 5 |
|------|----------------|----------------|
| **几何体** | 传统 LOD 手动设置 | Nanite 自动虚拟几何体 |
| **全局光照** | Lightmap 烘焙 / 实时 GI | Lumen 实时全局光照 |
| **渲染** | 传统前向/延迟 | Nanite + Lumen + TSR |
| **物理** | PhysX | Chaos Physics（全物理） |
| **世界构建** | Level Streaming | World Partition |
| **模型源** | 手动建模 | Quixel Megascans + 摄影测量 |
| **音频** | 传统音频 | MetaSounds（程序化音频） |
| **角色动画** | 传统骨骼动画 | Control Rig + Full Body IK |
| **编辑器** | 传统编辑器 | 重新设计的编辑器 + 协作 |
| **材质** | 传统材质系统 | Substrate（分层材质） |

## 十、Unreal vs Unity 架构对比

| 维度 | Unreal Engine | Unity |
|------|--------------|-------|
| **核心语言** | C++ | C# |
| **脚本系统** | 蓝图 + C++ (编译型) | C# + 可视化 (IL2CPP/Mono) |
| **对象模型** | UObject 体系 (反射) | MonoBehaviour (组件) |
| **渲染** | 延迟渲染为主 | 前向/延迟/可编程管线 |
| **GI** | Lumen (实时) / 烘焙 | 烘焙为主 / 实时有限 |
| **物理** | Chaos Physics (自研) | PhysX (第三方) |
| **粒子** | Niagara | Particle System / VFX Graph |
| **UI** | UMG / Slate | UGUI / UI Toolkit |
| **网络** | 内置多人框架 | Mirror / Netcode / Photon |
| **Open World** | World Partition 原生支持 | 需自行管理 |
| **学习曲线** | 较陡峭 | 较平缓 |
| **3A 适用度** | 非常适合 | 适合 (可做 3A) |
| **移动端** | 一般 (偏重 PC/主机) | 优秀 |
| **源码** | 开放 C++ 源码 | 源码需付费 |
| **社区生态** | 3A 为主 | 独立/手游为主 |

---

*本文档基于 Unreal Engine 5.4+ 整理*
