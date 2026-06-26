---
title: Unity 完整指南
created: 2025-04-10
updated: 2026-05-13
tags: [游戏, Unity, 引擎, C#]
related: "[[Unity_MOC]]"
---

# Unity 完整指南

本文档介绍 Unity 游戏引擎的各个方面，包括编辑器基础、C# 脚本编程、物理系统、动画系统、UI 系统、音频系统、粒子系统、光照系统、场景管理、资源管理、性能优化和跨平台发布。

---

## 目录

- [Unity 概述](#unity-概述)
- [编辑器基础](#编辑器基础)
- [C# 脚本编程](#c-脚本编程)
- [物理系统](#物理系统)
- [动画系统](#动画系统)
- [UI 系统](#ui-系统)
- [音频系统](#音频系统)
- [粒子系统](#粒子系统)
- [光照系统](#光照系统)
- [场景管理](#场景管理)
- [资源管理](#资源管理)
- [ScriptableObject](#scriptableobject)
- [性能优化](#性能优化)
- [跨平台发布](#跨平台发布)

---

## Unity 概述

### 基本信息

| 属性 | 说明 |
|------|------|
| **名称** | Unity |
| **出品方** | Unity Technologies |
| **类型** | 游戏引擎 / 跨平台开发框架 |
| **首次发布** | 2005 年（WWDC 大会） |
| **最新版本** | Unity 6 (2024 LTS) |
| **编程语言** | C# |
| **官网** | https://unity.com |
| **许可证** | 个人免费版 / Plus / Pro / Enterprise |

### 核心特点

| 特点 | 说明 |
|------|------|
| **跨平台** | 支持 20+ 平台（PC/Mobile/Console/Web/VR/AR） |
| **可视化编辑器** | 拖拽式场景编辑，所见即所得 |
| **C# 脚本** | 使用 C# 编写游戏逻辑 |
| **物理引擎** | 内置 PhysX 物理系统 |
| **动画系统** | Animator + Timeline + Cinemachine |
| **渲染管线** | URP / HDRP / Built-in 三种渲染管线 |
| **Asset Store** | 海量资源、插件、工具市场 |
| **多平台一键发布** | 一次开发，多平台部署 |

### 适用平台

| 平台类别 | 支持平台 |
|----------|---------|
| **PC** | Windows、macOS、Linux |
| **移动** | iOS、Android |
| **主机** | PlayStation、Xbox、Nintendo Switch |
| **网页** | WebGL、WebGPU |
| **VR/AR** | Meta Quest、Apple Vision Pro、HoloLens、PICO |
| **其他** | 车载信息娱乐系统、智能电视 |

### 渲染管线对比

| 渲染管线 | 说明 | 适用场景 |
|----------|------|---------|
| **Built-in** | 传统管线，兼容性好 | 简单项目、移动平台 |
| **URP** | 通用渲染管线，性能优先 | 移动端、性能优化项目 |
| **HDRP** | 高清渲染管线，画质优先 | PC/主机级高画质项目 |

### 核心组件

| 组件 | 说明 |
|------|------|
| **场景（Scene）** | 游戏关卡/界面的容器 |
| **GameObject** | 场景中所有对象的基类 |
| **Component** | 附加到 GameObject 的功能模块 |
| **Transform** | 位置、旋转、缩放 |
| **Rigidbody** | 物理刚体 |
| **Collider** | 碰撞检测 |
| **Material** | 材质，控制外观 |
| **Shader** | 着色器，定义渲染效果 |
| **Prefab** | 预制体，可复用的对象模板 |
| **Script** | C# 脚本，控制游戏逻辑 |

### Unity vs Unreal Engine 对比

| 维度 | Unity | Unreal Engine |
|------|-------|---------------|
| **编程语言** | C# | C++ / 蓝图（可视化） |
| **学习曲线** | 平缓，适合初学者 | 陡峭，学习成本高 |
| **渲染画质** | 中高质量 | 顶级画质（Nanite/Lumen） |
| **适用平台** | 移动端为主 | PC/主机为主 |
| **Asset Store** | 资源丰富 | Marketplace |
| **定价模式** | 按用户数/收入 | 免费，收入超过 100 万后抽成 5% |
| **适合项目** | 手游、独立游戏、2D 游戏 | 3A 大作、高画质项目 |

### 典型应用场景

| 应用领域 | 说明 | 代表作品 |
|----------|------|---------|
| **游戏开发** | 手游、PC/主机游戏 | 《原神》《王者荣耀》《Among Us》 |
| **VR/AR** | 虚拟现实/增强现实 | Meta Quest 应用、Pokémon GO |
| **建筑可视化** | 建筑效果图、虚拟漫游 | Unity Reflect |
| **影视动画** | 实时渲染动画 | 《The Book of Boba Fett》虚拟制片 |
| **汽车/工业** | 车载界面、数字孪生 | 车载 HMI、工厂模拟 |
| **教育/培训** | 模拟训练、互动学习 | 虚拟实验室、VR 培训 |
| **医疗健康** | 医学模拟、手术规划 | 医疗训练系统 |

---

## 编辑器基础

### 编辑器窗口布局

Unity 编辑器由多个可自定义的窗口组成，默认布局如下：

| 窗口 | 位置 | 说明 |
|------|------|------|
| **Scene 视图** | 左上 | 场景编辑，拖拽放置对象 |
| **Game 视图** | 右上 | 游戏预览，玩家看到的内容 |
| **Hierarchy 窗口** | 左侧 | 场景中所有游戏对象的层级列表 |
| **Inspector 窗口** | 右侧 | 选中对象的属性/组件编辑 |
| **Project 窗口** | 左下 | 所有资源（模型/贴图/脚本等）管理 |
| **Console 窗口** | 右下 | 日志、警告、错误信息 |

### 核心窗口详解

#### 1. Hierarchy（层级窗口）

| 功能 | 说明 |
|------|------|
| 显示场景中所有 GameObject | 树形结构 |
| 右键 → Create Empty | 创建空对象 |
| 右键 → 3D Object / UI | 创建预置对象 |
| 拖拽子对象 | 设置父子关系 |

#### 2. Scene（场景视图）

| 工具 | 快捷键 | 说明 |
|------|--------|------|
| **移动** | W | 沿轴向移动对象 |
| **旋转** | E | 沿轴向旋转对象 |
| **缩放** | R | 沿轴向缩放对象 |
| **平移** | Q / 鼠标中键 | 平移视图 |
| **框选** | Shift + 鼠标 | 多选对象 |

#### 3. Inspector（检查器窗口）

| 功能 | 说明 |
|------|------|
| 显示选中对象的组件 | 添加/删除/拖拽组件 |
| 修改属性值 | 实时预览效果 |
| 锁定面板 | 点击顶部小锁，防止误切换选中 |

#### 4. Project（项目窗口）

| 功能 | 说明 |
|------|------|
| 管理所有资源文件 | 类似文件夹浏览器 |
| 创建文件夹 | 右键 → Create → Folder |
| 导入资源 | 拖拽文件到窗口 |
| 搜索资源 | 右上角搜索框 |
| 查看资源属性 | 选中后在 Inspector 查看 |

#### 5. Game（游戏视图）

| 功能 | 说明 |
|------|------|
| 预览游戏运行效果 | 与 Scene 视图区分开 |
| 分辨率设置 | 下拉菜单选择 |
| 全屏预览 | 右上角全屏按钮 |

#### 6. Console（控制台窗口）

| 功能 | 说明 |
|------|------|
| 显示 Debug.Log 信息 | 日志输出 |
| 显示错误/警告 | 代码编译错误、运行时错误 |
| 过滤信息 | 错误/警告图标过滤 |

### 菜单栏

| 菜单 | 常用功能 |
|------|---------|
| **File** | New Scene、Save、Save As、Build Settings |
| **Edit** | Preferences、Project Settings、查找替换 |
| **Assets** | Import New Asset、Reimport、Create |
| **GameObject** | Create Empty、3D Object、Light、Camera |
| **Component** | 添加各种组件（Physics、Rendering、UI） |
| **Window** | 打开各种编辑器窗口 |
| **Help** | 文档、About |

### 创建第一个场景

#### 步骤 1：创建场景
```
File → New Scene → 3D Core Template → Create
```

#### 步骤 2：添加对象
```
Hierarchy → 右键 → 3D Object → Cube
```

#### 步骤 3：调整位置
```
Inspector → Transform → Position 修改数值
```

#### 步骤 4：添加材质
```
Project → 右键 → Create → Material
拖拽材质到对象
```

#### 步骤 5：运行游戏
```
点击编辑器顶部的 Play 按钮（三角形图标）
```

### Transform 组件（变换）

所有 GameObject 都必须有 Transform 组件：

| 属性 | 说明 | 类型 |
|------|------|------|
| **Position** | 对象在世界坐标中的位置 | Vector3(x, y, z) |
| **Rotation** | 对象绕各轴的旋转角度 | Vector3(x, y, z) |
| **Scale** | 对象的缩放比例 | Vector3(x, y, z) |

### Prefab（预制体）

| 概念 | 说明 |
|------|------|
| **预制体** | 可复用的对象模板 |
| **创建** | 从 Project 拖拽到 Scene 或右键 Create |
| **实例化** | 每次拖入场景都会创建新实例 |
| **修改** | 双击预制体进入编辑模式，修改后自动应用到所有实例 |

### 常用快捷键

| 功能 | Windows | Mac | 说明 |
|------|---------|-----|------|
| 播放/暂停 | Ctrl+P | Cmd+P | 运行游戏 |
| 保存场景 | Ctrl+S | Cmd+S | 保存 |
| 新建场景 | Ctrl+N | Cmd+N | 新场景 |
| 撤销 | Ctrl+Z | Cmd+Z | 撤销操作 |
| 复制 | Ctrl+D | Cmd+D | 复制选中对象 |
| 删除 | Delete | Delete | 删除选中对象 |
| 帧选中对象 | F | F | 视图聚焦 |
| 对齐到视图 | Ctrl+Shift+F | Cmd+Shift+F | 对齐 |

### 项目结构

```
Project/
├── Assets/
│   ├── Scripts/        # C# 脚本
│   ├── Scenes/         # 场景文件
│   ├── Prefabs/        # 预制体
│   ├── Materials/      # 材质
│   ├── Textures/       # 贴图
│   ├── Models/         # 3D 模型
│   ├── Audio/          # 音频
│   ├── UI/             # UI 资源
│   └── Settings/       # 配置文件
├── Library/            # 编辑器缓存（自动生成）
├── Packages/           # 包管理
└── ProjectSettings/    # 项目设置
```

### 常见操作

| 操作 | 方法 |
|------|------|
| 创建空对象 | Hierarchy → 右键 → Create Empty |
| 创建光源 | Hierarchy → 右键 → Light → Directional Light |
| 创建相机 | Hierarchy → 右键 → Camera |
| 创建 Canvas | Hierarchy → 右键 → UI → Canvas |
| 导入模型 | Project → 拖拽 .fbx/.obj 文件 |
| 添加物理组件 | Inspector → Add Component → Rigidbody |
| 打包发布 | File → Build Settings → Build |

---

## C# 脚本编程

### 脚本生命周期

```
Awake()           → 对象创建时调用（只一次）
OnEnable()        → 对象启用时调用
Start()           → 第一帧更新前调用（只一次）
    ↓
Update()          → 每帧调用（游戏逻辑）
FixedUpdate()     → 固定时间间隔调用（物理更新）
LateUpdate()      → 所有 Update 后调用（跟随相机）
    ↓
OnDisable()       → 对象禁用时调用
OnDestroy()       → 对象销毁时调用
```

### 常用脚本 API

| 类别 | 常用 API | 说明 |
|------|---------|------|
| **输入** | `Input.GetKey()`, `Input.GetAxis()`, `Input.touchCount` | 键盘/鼠标/触摸 |
| **时间** | `Time.deltaTime`, `Time.time`, `Time.timeScale` | 帧间隔/游戏时间/时间缩放 |
| **对象** | `GameObject.Find()`, `Instantiate()`, `Destroy()` | 查找/创建/销毁 |
| **数学** | `Vector3`, `Quaternion`, `Mathf` | 向量/四元数/数学函数 |
| **协程** | `StartCoroutine()`, `yield return` | 异步执行 |

### C# 脚本基础

```csharp
using UnityEngine;

public class Player : MonoBehaviour
{
    public float speed = 5f;
    public float jumpForce = 10f;
    
    private Rigidbody rb;
    
    void Start()
    {
        rb = GetComponent<Rigidbody>();
    }
    
    void Update()
    {
        // 移动
        float moveX = Input.GetAxis("Horizontal");
        float moveZ = Input.GetAxis("Vertical");
        Vector3 movement = new Vector3(moveX, 0, moveZ);
        transform.Translate(movement * speed * Time.deltaTime);
    }
    
    void FixedUpdate()
    {
        // 物理更新
    }
    
    void OnCollisionEnter(Collision collision)
    {
        // 碰撞检测
    }
}
```

### 协程示例

```csharp
IEnumerator WaitAndPrint()
{
    yield return new WaitForSeconds(2f);
    Debug.Log("2秒后执行");
    yield return new WaitForEndOfFrame();
    Debug.Log("本帧结束后执行");
}

// 启动协程
StartCoroutine(WaitAndPrint());
```

---

## 物理系统

### PhysX 物理引擎

| 组件 | 说明 |
|------|------|
| **Rigidbody** | 刚体，使对象受物理影响 |
| **Collider** | 碰撞体，定义对象的碰撞形状 |
| **Joint** | 关节，连接两个刚体 |
| **Physics Material** | 物理材质，控制摩擦力和弹力 |

### 碰撞体类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| **Box Collider** | 长方体 | 墙壁、地板、方块 |
| **Sphere Collider** | 球体 | 球、圆形物体 |
| **Capsule Collider** | 胶囊体 | 角色、柱子 |
| **Mesh Collider** | 网格 | 复杂形状 |
| **Terrain Collider** | 地形 | 地形表面 |

### 碰撞检测

```csharp
// 碰撞开始
void OnCollisionEnter(Collision collision)
{
    Debug.Log("撞到: " + collision.gameObject.name);
}

// 碰撞持续
void OnCollisionStay(Collision collision) { }

// 碰撞结束
void OnCollisionExit(Collision collision) { }

// 触发器
void OnTriggerEnter(Collider other)
{
    if (other.CompareTag("Player")) { }
}
```

### Is Trigger

| 状态 | 效果 |
|------|------|
| **未勾选** | 产生物理碰撞（弹开/阻挡） |
| **勾选** | 不产生物理碰撞，只触发 OnTriggerEnter/Exit |

---

## 动画系统

### Animator 组件

| 组件 | 说明 |
|------|------|
| **Animator Controller** | 动画状态机 |
| **Animation Clip** | 动画片段（.anim/.fbx） |
| **Avatar** | 骨骼映射 |

### Animator 状态机

```
[Idle] → [Walk] → [Run] → [Jump]
   ↓         ↓
[Attack]  [Attack]
```

### 常用动画 API

```csharp
Animator animator;

void Start()
{
    animator = GetComponent<Animator>();
}

// 切换状态
animator.Play("Walk");

// 设置参数
animator.SetBool("isWalking", true);
animator.SetFloat("speed", 5f);
animator.SetTrigger("attack");

// 获取参数
bool isWalking = animator.GetBool("isWalking");
```

### 动画类型

| 类型 | 说明 |
|------|------|
| **关键帧动画** | 手动设置关键帧 |
| **骨骼动画** | 通过骨骼绑定驱动 |
| **混合动画** | 多个动画混合（Blend Tree） |
| **倒序动画** | 反向播放 |

---

## UI 系统

### UGUI（Unity UI）

| 组件 | 说明 |
|------|------|
| **Canvas** | UI 的根容器 |
| **RectTransform** | UI 对象的位置/大小/锚点 |
| **Graphic** | 所有 UI 元素的基类 |

### 常用 UI 组件

| 组件 | 说明 |
|------|------|
| **Text / TextMeshPro** | 文本显示 |
| **Image** | 图片显示 |
| **Button** | 按钮，绑定点击事件 |
| **Toggle** | 开关，勾选/取消 |
| **Slider** | 滑动条 |
| **Scrollbar** | 滚动条 |
| **Dropdown** | 下拉菜单 |
| **InputField** | 输入框 |
| **ScrollView** | 滚动视图 |

### UI 代码示例

```csharp
using UnityEngine.UI;

public class UIManager : MonoBehaviour
{
    public Text scoreText;
    public Button startButton;
    public Slider healthSlider;
    
    void Start()
    {
        startButton.onClick.AddListener(OnStartClicked);
    }
    
    void OnStartClicked()
    {
        Debug.Log("开始游戏");
    }
    
    void UpdateScore(int score)
    {
        scoreText.text = "分数: " + score;
    }
}
```

### UI 锚点

| 锚点 | 说明 |
|------|------|
| **Stretch** | 拉伸填充父对象 |
| **Left/Right/Top/Bottom** | 固定在边缘 |
| **Center** | 居中 |
| **Custom** | 自定义位置 |

---

## 音频系统

### 音频组件

| 组件 | 说明 |
|------|------|
| **Audio Source** | 播放声音的对象 |
| **Audio Listener** | 接收声音的"耳朵"（默认在 Camera 上） |
| **Audio Clip** | 音频文件（.wav/.mp3/.ogg） |

### 音频代码

```csharp
AudioSource audioSource;
public AudioClip clip;

void Start()
{
    audioSource = GetComponent<AudioSource>();
}

// 播放
audioSource.Play();
audioSource.PlayOneShot(clip);

// 暂停/停止
audioSource.Pause();
audioSource.Stop();

// 调整音量
audioSource.volume = 0.5f;

// 循环播放
audioSource.loop = true;
```

---

## 粒子系统

### Particle System

| 属性 | 说明 |
|------|------|
| **Duration** | 粒子持续时间 |
| **Start Lifetime** | 粒子存活时间 |
| **Start Speed** | 粒子初始速度 |
| **Start Size** | 粒子初始大小 |
| **Start Color** | 粒子初始颜色 |
| **Emission** | 发射率 |
| **Shape** | 发射形状 |
| **Velocity over Lifetime** | 速度随时间变化 |
| **Color over Lifetime** | 颜色随时间变化 |
| **Size over Lifetime** | 大小随时间变化 |

### 常见粒子效果

| 效果 | 适用场景 |
|------|---------|
| **火焰** | 火把、爆炸 |
| **烟雾** | 烟雾效果 |
| **雨水** | 天气效果 |
| **雪花** | 冬季场景 |
| **爆炸** | 爆炸特效 |
| **魔法** | 魔法技能效果 |

---

## 光照系统

### 光源类型

| 类型 | 说明 |
|------|------|
| **Directional Light** | 平行光（太阳） |
| **Point Light** | 点光源（灯泡） |
| **Spot Light** | 聚光灯（手电筒） |
| **Area Light** | 区域光（面板灯，仅烘焙） |
| **Reflection Probe** | 反射探针 |

### 光照模式

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| **Realtime** | 实时计算，可动态 | 动态光源 |
| **Baked** | 预计算，静态 | 固定场景 |
| **Mixed** | 混合模式 | 部分动态 |

### 阴影设置

| 类型 | 说明 |
|------|------|
| **Hard Shadows** | 硬阴影，边缘锐利 |
| **Soft Shadows** | 软阴影，边缘模糊 |
| **Soft Shadows（High Quality）** | 高质量软阴影 |

---

## 场景管理

### SceneManager

```csharp
using UnityEngine.SceneManagement;

// 加载场景
SceneManager.LoadScene("Level1");
SceneManager.LoadSceneAsync("Level1");  // 异步加载

// 加载场景（Build Settings）
SceneManager.LoadScene(1);

// 获取当前场景
Scene currentScene = SceneManager.GetActiveScene();
Debug.Log(currentScene.name);

// 加载 Additive 场景
SceneManager.LoadScene("UI", LoadSceneMode.Additive);

// 卸载场景
SceneManager.UnloadSceneAsync("Level1");

// 场景变化回调
SceneManager.sceneLoaded += OnSceneLoaded;
void OnSceneLoaded(Scene scene, LoadSceneMode mode) { }
```

---

## 资源管理

### 资源加载

```csharp
// Resources.Load
GameObject prefab = Resources.Load<GameObject>("Prefabs/Player");
Instantiate(prefab);

// Addressables（推荐）
Addressables.LoadAssetAsync<GameObject>("PlayerPrefab");
Addressables.InstantiateAsync("PlayerPrefab");

// AssetBundle
AssetBundle bundle = AssetBundle.LoadFromFile("path/to/bundle");
GameObject prefab = bundle.LoadAsset<GameObject>("Player");
```

---

## ScriptableObject

### 创建

```csharp
[CreateAssetMenu(fileName = "GameData", menuName = "Game/Data")]
public class GameData : ScriptableObject
{
    public string gameName;
    public int maxScore;
    public List<PlayerStats> playerStats;
}
```

### 用途

| 用途 | 说明 |
|------|------|
| **数据容器** | 存储游戏配置数据 |
| **共享数据** | 多个对象共享数据 |
| **运行时数据** | 运行时修改不丢失 |

---

## 性能优化

### 优化方法

| 方法 | 说明 |
|------|------|
| **对象池** | 重复利用对象，避免频繁创建/销毁 |
| **静态/动态批处理** | 合并 Draw Call |
| **LOD** | 不同距离使用不同精度模型 |
| **遮挡剔除** | 不可见对象不渲染 |
| **纹理压缩** | 减小纹理内存 |
| **对象复用** | 减少 Instantiate/Destroy |
| **协程优化** | 避免频繁调用 |

### 分析工具

| 工具 | 说明 |
|------|------|
| **Profiler** | 性能分析 |
| **Frame Debugger** | 帧调试 |
| **Memory Profiler** | 内存分析 |
| **Unity Debugger** | 代码调试 |

---

## 跨平台发布

### 发布流程

```
1. File → Build Settings
2. 添加场景到 Build
3. 选择目标平台
4. Player Settings 配置
5. Build / Build And Run
```

### 常用平台设置

| 平台 | 说明 |
|------|------|
| **PC, Mac & Linux Standalone** | 桌面平台 |
| **Android** | 安卓 |
| **iOS** | 苹果 |
| **WebGL** | 网页 |
| **PS4/Xbox/Switch** | 主机 |

### 安装与使用

**安装：**
1. 下载 Unity Hub：https://unity.com/products/unity-hub
2. 注册 Unity ID
3. 通过 Hub 安装 Unity Editor 和 SDK

**创建项目：**
```
Unity Hub → New Project → 选择模板（2D/3D/URP/HDRP）
```

---

## 学习路线

```
1. Unity 编辑器基础
   ↓
2. C# 编程基础
   ↓
3. GameObject & Component
   ↓
4. 物理 & 碰撞
   ↓
5. UI 系统（UGUI / UI Toolkit）
   ↓
6. 动画系统（Animator）
   ↓
7. 音频 & 粒子系统
   ↓
8. 网络 & 多人游戏
   ↓
9. 性能优化 & 发布
```

---

## 参考链接

- [Unity 官网](https://unity.com)
- [Unity 文档](https://docs.unity3d.com)
- [Unity 学习平台](https://learn.unity.com)
- [Unity Asset Store](https://assetstore.unity.com)
- [Unity API 参考](https://docs.unity3d.com/ScriptReference/)

---

*文档更新时间：2026 年 4 月*
