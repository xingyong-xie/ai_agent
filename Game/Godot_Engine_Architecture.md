---
title: Godot Engine 4 核心架构
created: 2026-06-08
updated: 2026-06-08
tags: [游戏, Godot, 架构, 引擎核心]
---

# Godot Engine 4 核心架构

## 一、引擎整体架构

```
Godot Engine 4 架构
    │
    ├── 核心层 (Core)
    │       ├── Variant / String / Math / RID
    │       ├── 对象系统 (Object/RefCounted)
    │       ├── 场景树 (SceneTree)
    │       ├── 信号系统 (Signal)
    │       ├── 资源管理
    │       └── 消息/通知体系
    │
    ├── 场景系统 (Scenes)
    │       ├── Node（节点基类）
    │       ├── Node2D / Control / Node3D
    │       ├── 场景 (PackedScene)
    │       ├── 资源 (Resource)
    │       └── 实例化/继承体系
    │
    ├── 渲染系统 (Rendering)
    │       ├── Forward+（前向渲染增强）
    │       ├── Mobile（移动端管线）
    │       ├── Compatibility（兼容 GLES3/GLES2）
    │       ├── Vulkan / OpenGL 3.3 / OpenGL ES
    │       └── 后处理
    │
    ├── 编辑器层 (Editor)
    │       ├── 主编辑器 (场景/脚本/资源)
    │       ├── 场景编辑器 (2D/3D)
    │       ├── 脚本编辑器 (内置/外部)
    │       ├── Shader / 材质编辑器
    │       ├── TileMap 编辑器
    │       ├── 动画编辑器
    │       └── 插件系统 (Plugin)
    │
    └── 跨平台层
            ├── 导出预设 (Export Templates)
            ├── 单线程架构 (主要)
            ├── Android / iOS / Web
            ├── Windows / macOS / Linux
            └── 主机平台 (社区)
```

## 二、核心设计理念

### 2.1 场景树与节点体系 (Scene Tree & Nodes)

```
Godot 最核心概念: 一切皆节点 (Node)
    │
    └── Scene Tree（场景树）
            │
            ├── Node (基类)
            │       ├── 名称
            │       ├── 子节点列表
            │       ├── 信号 / 组
            │       └── 编辑器属性
            │
            ├── Node2D（2D 基础）
            │       ├── position / rotation / scale
            │       ├── z_index / z_as_relatie
            │       └── 所有 2D 节点的基类
            │
            ├── Control（UI 基础）
            │       ├── rect_position / rect_size
            │       ├── anchor / margin / grow
            │       ├── theme / stylebox
            │       └── 信号 (pressed/mouse_entered/...)
            │
            └── Node3D（3D 基础）
                    ├── transform (position/rotation/scale)
                    ├── 空间坐标变换
                    └── 所有 3D 节点的基类
```

**场景（Scene）= 节点树结构 + 资源依赖**

```
场景文件 (.tscn) 示例:
```
Node (根节点)
├── Sprite2D
├── CollisionShape2D
└── CanvasLayer
    └── Label
```

### 2.2 信号系统（核心特色）

```
信号系统 ── Godot 的核心解耦机制
    │
    ├── 发送者: 定义并发射信号
    ├── 接收者: 连接信号到方法
    └── 解耦: 发送者不依赖接收者
```

```gdscript
# === 内置信号 ===
# Button 节点
button.pressed.connect(_on_button_pressed)
button.toggled.connect(_on_toggled)
button.button_down.connect(_on_down)

# Area2D
area.body_entered.connect(_on_body_entered)
area.area_entered.connect(_on_area_entered)

# === 自定义信号 ===
signal health_changed(old_health, new_health)
signal game_over(reason: String)

func take_damage(amount: int):
    var old = health
    health -= amount
    health_changed.emit(old, health)
    if health <= 0:
        game_over.emit("死亡")

# === 信号连接方式 ===
# 方式 1: 编辑器连接 (推荐)
# 节点面板 → 信号标签页 → 连接

# 方式 2: 代码连接
health_changed.connect(_on_health_changed)
health_changed.connect(_on_health_changed, CONNECT_ONE_SHOT)  # 一次性

# 方式 3: 使用 Callable
button.pressed.connect(Callable(self, "_on_pressed"))

# 方式 4: 匿名函数
health_changed.connect(func(old, new):
    print("血量: ", old, " -> ", new)
)

# 断开连接
health_changed.disconnect(_on_health_changed)
health_changed.is_connected(_on_health_changed)
```

### 2.3 场景实例化与继承

```
场景继承 (Scene Inheritance)
    │
    └── BaseCharacter.tscn (基础角色)
            │
            ├── Player.tscn (继承 BaseCharacter)
            │       ├── 新增: Camera2D
            │       └── 重写: 移动逻辑
            │
            └── Enemy.tscn (继承 BaseCharacter)
                    ├── 新增: PathFollow2D
                    └── 重写: AI 逻辑

场景实例化:
    ├── preload("res://Player.tscn")  ── 编译时加载
    ├── load("res://Player.tscn")      ── 运行时加载
    └── .instance() 或 .instantiate()  ── 创建实例
```

## 三、脚本系统

### 3.1 支持的脚本语言

| 语言 | 性能 | 类型系统 | 适用场景 | 特点 |
|------|------|---------|---------|------|
| **GDScript** | 中等 | 渐进类型 | 游戏逻辑、快速原型 | Python 风格、深度集成 |
| **C#** | 高 | 强类型 | 复杂逻辑、性能关键 | .NET 生态、结构体 |
| **VisualScript** | 中等 | 可视化 | 非程序员（已弃用） | 节点化编程 |
| **C++ (GDExtension)** | 最高 | 强类型 | 引擎核心、重度计算 | 原生性能、热加载 |

### 3.2 GDScript 特性

```gdscript
# 类型标注
extends Node2D

@export var speed: float = 200.0
@export var health := 100          # := 类型推断
@onready var sprite := $Sprite2D   # 延迟初始化

# 生命周期
func _init():
    # 构造函数（对象创建时）
    pass

func _enter_tree():
    # 进入场景树时
    pass

func _ready():
    # 所有子节点 ready 后（类似 Unity Start）
    pass

func _process(delta: float):
    # 每帧调用
    position += direction * speed * delta

func _physics_process(delta: float):
    # 固定频率物理帧（默认 60 FPS）
    pass

func _exit_tree():
    # 退出场景树
    pass

# 信号定义与发射
signal attacked(target: Node, damage: int)
signal_attacked.emit(enemy, 10)

# 组系统
add_to_group("enemies")
get_tree().call_group("enemies", "take_damage", 10)

# 自动加载 (AutoLoad)
# Project Settings → AutoLoad → 选择脚本
# 全局访问: GameManager.some_method()
```

### 3.3 C# 在 Godot 中

```csharp
using Godot;
using System;

public partial class Player : CharacterBody2D
{
    [Export]
    public float Speed { get; set; } = 200.0f;

    [Export]
    public PackedScene BulletScene { get; set; }

    private AnimatedSprite2D _sprite;
    private Timer _shootTimer;

    public override void _Ready()
    {
        _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
        _shootTimer = GetNode<Timer>("ShootTimer");
    }

    public override void _Process(double delta)
    {
        // 输入处理
        Vector2 direction = Input.GetVector("move_left", "move_right", 
                                           "move_up", "move_down");
        Velocity = direction * Speed;
        MoveAndSlide();
    }

    private void OnShootTimerTimeout()
    {
        // 发射子弹
        Bullet bullet = BulletScene.Instantiate<Bullet>();
        AddChild(bullet);
    }
}
```

## 四、渲染系统

### 4.1 渲染管线

```
Godot 渲染管线
    │
    ├── Forward+ (Vulkan)
    │       ├── 默认渲染器
    │       ├── 前向渲染增强
    │       ├── 支持 GL 级功能
    │       ├── 自动批处理
    │       └── 目标: PC/主机
    │
    ├── Mobile (Vulkan)
    │       ├── 移动端优化
    │       ├── 降低显存和带宽消耗
    │       ├── 减少 Pass 数量
    │       └── 目标: 移动设备
    │
    └── Compatibility (OpenGL 3.3/GLES 3.0)
            ├── 最广泛的兼容性
            ├── Web 导出
            ├── 不支持 SDFGI
            └── 目标: 老旧设备/Web
```

### 4.2 2D 渲染特色

```
Godot 2D 引擎特色
    │
    ├── 像素级完美渲染
    │       ├── 使用 2D 坐标系统 (像素)
    │       ├── 无 3D 坐标转换开销
    │       └── 自动纹理过滤控制
    │
    ├── 专用 2D 光照
    │       ├── PointLight2D
    │       ├── DirectionalLight2D
    │       └── 阴影 (Shadow2D)
    │
    ├── TileMap 系统
    │       ├── 多层自动贴图
    │       ├── 随机/模式化放置
    │       ├── 地形自动拼接
    │       └── 运行时修改
    │
    └── CanvasLayer
            ├── 独立视口层
            ├── 不受相机影响
            └── 适用: HUD、UI
```

### 4.3 3D 渲染能力

| 特性 | Godot 4 | UE5 | Unity |
|------|--------|-----|-------|
| SDFGI (有符号距离场 GI) | ✔ | - | - |
| Voxel GI | ✔ | - | - |
| Lightmap GI | ✔ | ✔ | ✔ |
| SSR (屏幕空间反射) | ✔ | ✔ | ✔ |
| SSAO | ✔ | ✔ | ✔ |
| SSIL | ✔ | - | - |
| Glow/Bloom | ✔ | ✔ | ✔ |
| 体积雾 | ✔ | ✔ | ✔ |
| 软阴影 | ✔ | ✔ | ✔ |
| 点/聚/平行光阴影 | ✔ | ✔ | ✔ |
| 实时 GI | ✔ (SDFGI) | ✔ (Lumen) | ✘ |
| Nanite 级别几何体 | ✘ | ✔ | ✘ |

## 五、物理系统

### 5.1 物理架构

```
Godot 物理系统
    │
    ├── 2D Physics
    │       ├── Area2D（区域检测）
    │       ├── RigidBody2D（刚体）
    │       ├── CharacterBody2D（角色体）
    │       ├── StaticBody2D（静态体）
    │       ├── CollisionShape2D（碰撞形状）
    │       └── PhysicsMaterial2D（物理材质）
    │
    └── 3D Physics
            ├── Area3D
            ├── RigidBody3D
            ├── CharacterBody3D
            ├── StaticBody3D
            ├── CollisionShape3D / CollisionPolygon3D
            └── PhysicalMaterial
```

### 5.2 物理体类型对比

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| **StaticBody** | 不受物理影响 | 地面、墙壁、静态障碍物 |
| **RigidBody** | 受物理影响（质量/力/碰撞） | 物理道具、掉落物 |
| **CharacterBody** | 用户控制移动（无物理影响） | 玩家角色、NPC（推荐） |
| **Area** | 区域检测（不碰撞） | 触发区域、收集范围、伤害区域 |

```gdscript
# CharacterBody2D 移动示例
extends CharacterBody2D

@export var speed := 300.0
@export var jump_velocity := -400.0
@export var gravity := 980.0

func _physics_process(delta: float):
    # 水平移动
    var direction := Input.get_axis("ui_left", "ui_right")
    velocity.x = direction * speed
    
    # 重力
    if not is_on_floor():
        velocity.y += gravity * delta
    
    # 跳跃
    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = jump_velocity
    
    # 应用运动
    move_and_slide()
```

## 六、UI 系统

### 6.1 控件节点体系

```
Control (UI 基类)
    │
    ├── Container（布局容器）
    │       ├── HBoxContainer（水平排列）
    │       ├── VBoxContainer（垂直排列）
    │       ├── GridContainer（网格排列）
    │       ├── CenterContainer（居中）
    │       ├── MarginContainer（边距）
    │       └── PanelContainer（面板容器）
    │
    ├── 基础控件
    │       ├── Button / TextureButton / LinkButton
    │       ├── Label / RichTextLabel
    │       ├── TextureRect / ColorRect
    │       ├── LineEdit / TextEdit / CodeEdit
    │       ├── Slider / HSlider / VSlider
    │       ├── ProgressBar
    │       ├── OptionButton / CheckButton
    │       └── ItemList / Tree
    │
    └── 高级控件
            ├── TabContainer（标签页）
            ├── SplitContainer（分割面板）
            ├── ScrollContainer（滚动）
            └── GraphNode（节点图）
```

### 6.2 主题系统

```
Theme（主题系统）
    │
    ├── 样式箱 (StyleBox)
    │       ├── StyleBoxFlat（纯色/渐变）
    │       ├── StyleBoxTexture（纹理）
    │       └── StyleBoxLine（线条）
    │
    ├── 字体 (Font)
    │       ├── 系统字体
    │       └── 自定义字体 (Bitmap/Dynamic)
    │
    ├── 颜色常量
    │       ├── 字体颜色
    │       ├── 背景颜色
    │       └── 图标颜色
    │
    └── 图标
```

## 七、音频系统

```
Audio System
    │
    ├── AudioStreamPlayer（2D 音源）
    │       └── 全局位置无关播放
    │
    ├── AudioStreamPlayer2D（2D 空间音源）
    │       ├── 距离衰减
    │       ├── 左右声道
    │       └── 多普勒效应
    │
    ├── AudioStreamPlayer3D（3D 空间音源）
    │
    └── AudioBus（音频总线系统）
            ├── Master
            ├── Music / SFX / Voice
            ├── 效果器 (Reverb/Delay/Filter/Compress)
            └── 发送与路由
```

## 八、插件与工具链

### 8.1 插件系统

```
Godot 插件架构
    │
    ├── Editor Plugin（编辑器插件）
    │       ├── 自定义面板
    │       ├── 自定义 Inspector
    │       ├── 自定义节点
    │       └── 编辑器工具脚本
    │
    ├── Android / iOS 插件
    │       ├── Java/Kotlin (Android)
    │       ├── Swift/ObjC (iOS)
    │       └── 原生库调用
    │
    └── GDExtension (C++ 扩展)
            ├── 二进制插件
            ├── 不重新编译引擎
            └── 高性能
```

### 8.2 内置开发工具

| 工具 | 功能 |
|------|------|
| **调试器** | 断点/步进/变量检查/栈跟踪 |
| **帧性能图** | 实时 CPU/GPU 性能分析 |
| **内存监视器** | 对象计数/内存泄漏检测 |
| **网络监视器** | 多人游戏数据包监控 |
| **Remote Inspector** | 真机调试场景树 |
| **Profiler** | 脚本/物理/渲染性能分析 |
| **Visual Shader Editor** | 可视化着色器编辑 |

## 九、导出与部署

### 9.1 导出预设

| 平台 | 渲染器 | 注意事项 |
|------|--------|---------|
| **Windows** | Forward+ / Compatibility | 单 exe 或 pck 分包 |
| **macOS** | Forward+ / Compatibility | 需要签名 |
| **Linux** | Forward+ / Compatibility | X11/Wayland |
| **Android** | Mobile | AAB / APK |
| **iOS** | Mobile | 需要 Xcode + 签名 |
| **Web** | Compatibility | WASM + WebGL |

### 9.2 Godot 优势

| 优势 | 说明 |
|------|------|
| **完全开源** | MIT 许可证，无版权费用 |
| **轻量级** | 引擎体积 ~50MB，编辑器启动快 |
| **原生 2D** | 真正的 2D 引擎（非 3D 投影） |
| **场景继承** | 独有的场景继承系统 |
| **信号系统** | 内置信号解耦机制 |
| **热加载** | 编辑时实时修改实时生效 |
| **跨平台导出** | 一键导出到各大平台 |

## 十、Godot vs Unity vs Unreal

| 维度 | Godot 4 | Unity | Unreal 5 |
|------|---------|-------|----------|
| **许可证** | MIT (免费) | 按收入收费 | 5% 分成 (>100万$) |
| **脚本语言** | GDScript/C#/C++ | C# | C++/蓝图 |
| **2D 能力** | ★★★★★ 原生 | ★★★★ | ★★★ |
| **3D 能力** | ★★★★ 快速进步 | ★★★★ | ★★★★★ |
| **编辑体验** | ★★★★ 轻量 | ★★★★★ | ★★★★ 重型 |
| **学习曲线** | ★★ 最平缓 | ★★★ | ★★★★★ |
| **移动端** | ★★★★ | ★★★★★ | ★★★ |
| **3A 画质** | ★★★ | ★★★★ | ★★★★★ |
| **社区生态** | ★★★ 增长中 | ★★★★★ | ★★★★★ |
| **资源商店** | ★★ 较少 | ★★★★★ | ★★★★ |
| **引擎大小** | ~50MB | ~2GB | ~60GB+ |
| **启动速度** | 秒级 | 十秒级 | 分钟级 |

---

*本文档基于 Godot 4.3+ 整理*
