---
title: Unity 引擎核心架构概述
created: 2026-06-08
updated: 2026-06-08
tags: [游戏, Unity, 架构, 引擎核心]
related: "[[Unity_MOC]]"
---

# Unity 引擎核心架构概述

## 一、引擎整体架构

```
┌─────────────────────────────────────────────────┐
│                  Unity 引擎架构                    │
├─────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  编辑器层  │ │ 运行时层  │ │  工具链 & 服务   │ │
│  ├──────────┤ ├──────────┤ ├──────────────────┤ │
│  │ Scene   │ │  Game    │ │  Asset Store     │ │
│  │ Inspector│ │  Physics │ │  Unity Cloud     │ │
│  │ Hierarchy│ │  Audio   │ │  Analytics       │ │
│  │ Project  │ │  Animation│ │  Ads / IAP      │ │
│  │ Console  │ │  Rendering│ │  Multiplay      │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
├─────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐   │
│  │          渲染管线 (Render Pipeline)       │   │
│  │  ┌────────┐ ┌──────┐ ┌────────┐          │   │
│  │  │Built-in│ │ URP  │ │ HDRP  │          │   │
│  │  └────────┘ └──────┘ └────────┘          │   │
│  └──────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐   │
│  │           平台抽象层 (Platform Abstraction) │   │
│  │  Windows │ Mac │ Linux │ iOS │ Android   │   │
│  │  PS │ Xbox │ Switch │ WebGL │ VR/AR      │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## 二、核心设计理念

### 2.1 组件化架构 (Component-Based Architecture)

Unity 采用 **Entity-Component** 模式（非传统 ECS），核心设计：

| 概念 | 说明 |
|------|------|
| **GameObject** | 场景中所有对象的容器实体 |
| **Component** | 附加到 GameObject 上的可复用功能模块 |
| **Transform** | 每个 GameObject 必须有的位置/旋转/缩放组件 |
| **MonoBehaviour** | 所有 C# 脚本组件的基础类 |

**组件挂载流程：**
```
GameObject ──> Add Component ──> 功能组合
   │                │
   │     ┌──────────┴──────────┐
   │     │ MonoBehaviour 脚本   │
   │     │ Rigidbody 物理      │
   │     │ Collider 碰撞       │
   │     │ AudioSource 音频    │
   │     │ Animator 动画      │
   │     │ ...               │
   │     └─────────────────────┘
   │
   └──> Transform (强制存在)
```

### 2.2 预制体体系 (Prefab System)

```
Prefab (模板)
    │
    ├── Prefab Instance A ──> Override 属性
    ├── Prefab Instance B ──> Override 属性
    └── Prefab Instance C ──> Override 属性
         │
   嵌套 Prefab Variant (变体)
```

- **Prefab**: 可复用的 GameObject 模板，修改模板自动同步所有实例
- **Prefab Variant**: 基于已有 Prefab 创建变体，支持层级嵌套
- **Nested Prefab**: Prefab 中嵌套其他 Prefab

### 2.3 场景管理架构

```
项目
 ├── Scene A (关卡1)
 │    ├── GameObject ├── Component
 │    │              ├── Component
 │    │              └── Component
 │    ├── GameObject (Prefab Instance)
 │    └── Light / Camera / UI Canvas
 ├── Scene B (关卡2)
 └── Scene C (UI 系统)
```

## 三、渲染管线架构

### 3.1 三种渲染管线对比

| 维度 | Built-in | URP (通用渲染管线) | HDRP (高清渲染管线) |
|------|----------|-------------------|-------------------|
| **性能** | 中等 | 高（优化好） | 较低（GPU 开销大） |
| **画质** | 中等 | 高 | 顶级 |
| **目标平台** | 全平台 | 移动端 + PC | PC / 主机 |
| **SRP 支持** | 否 | 是（可编程） | 是（可编程） |
| **Shader Graph** | 有限支持 | 完整支持 | 完整支持 |
| **后处理** | 内置（有限） | Volume 框架 | Volume 框架 |
| **光照** | 传统 | 正向/延迟渲染 | 延迟渲染 |
| **适用场景** | 简单/遗留项目 | 新项目首选 | 3A 画质项目 |

### 3.2 SRP（可编程渲染管线）

```
SRP (Scriptable Render Pipeline)
    │
    ├── RenderPipelineAsset (配置资源)
    │       ├── 质量设置
    │       ├── 阴影设置
    │       ├── 后处理配置
    │       └── 各平台参数
    │
    └── RenderPipeline (渲染循环)
            ├── Culling (剔除)
            ├── Rendering (渲染)
            └── Post Processing (后处理)
```

## 四、跨平台架构

### 4.1 平台抽象层

```
Unity 跨平台架构
    │
    ├── 平台无关层（C# 脚本 + 引擎核心）
    │       ├── 游戏逻辑
    │       ├── 物理、音频、动画
    │       └── 通用 API
    │
    └── 平台适配层（Platform Specific）
            ├── Input System（输入适配）
            ├── Graphics API（图形 API 封装）
            ├── Audio Backend（音频后端）
            └── File I/O / Network（文件/网络适配）
```

### 4.2 支持的平台

| 类别 | 平台 |
|------|------|
| PC | Windows、macOS、Linux |
| 移动 | iOS、Android |
| 主机 | PlayStation、Xbox、Nintendo Switch |
| 网页 | WebGL、WebGPU |
| VR/AR | Meta Quest、Apple Vision Pro、HoloLens、PICO |
| 其他 | 车载系统、智能电视 |

## 五、核心组件体系

| 组件 | 功能定位 | 所属系统 |
|------|---------|---------|
| Transform | 位置/旋转/缩放 | 引擎核心 |
| Rigidbody | 物理模拟 | 物理系统 |
| Collider | 碰撞检测 | 物理系统 |
| Animator | 动画控制 | 动画系统 |
| AudioSource | 音频播放 | 音频系统 |
| Camera | 场景渲染 | 渲染系统 |
| Light | 光源 | 光照系统 |
| Canvas | UI 渲染 | UI 系统 |
| ParticleSystem | 粒子效果 | 粒子系统 |
| NetworkTransform | 网络同步 | 网络系统 |

## 六、架构设计原则

1. **组合优于继承**：通过 Component 组合实现功能，而非继承
2. **数据与逻辑分离**：Component 持有数据，MonoBehaviour 方法处理逻辑
3. **面向接口编程**：通过 C# 接口实现系统间解耦
4. **分层设计**：引擎核心 → 系统模块 → 游戏逻辑 → 平台适配
5. **资源独立于逻辑**：资源（模型/贴图/音频）与代码逻辑分离管理

---

*本文档基于 Unity 6 (2024 LTS) 整理*
