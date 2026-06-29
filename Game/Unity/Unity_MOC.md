---
title: Unity 知识库（MOC）
created: 2026-06-26
updated: 2026-06-26
tags: [MOC, Unity, 游戏引擎, 知识地图]
related: "[[AI_Learning_Roadmap_MOC]]"
---

# Unity 知识库（MOC）

> `Game/Unity/` 目录下的所有 Unity 笔记索引。
> Unity 完整指南（README）作为概述入口，各架构文档展开具体系统。

---

## 文档一览

| 文件 | 内容 | 状态 |
|------|------|------|
| [[Unity_README]] | Unity 完整指南——编辑器基础、脚本、物理、动画、UI、音频、粒子、光照、场景、资源、性能优化、跨平台发布概览 | ✅ |
| [[Unity_Architecture_Overview]] | Unity 引擎核心架构——编辑器层 / 运行时层 / 渲染管线 / 平台抽象 | ✅ |
| [[Unity_CSharp_Scripting_Architecture]] | C# 脚本系统——MonoBehaviour 生命周期、事件系统、协程、序列化 | ✅ |
| [[Unity_Physics_Architecture]] | 物理系统——碰撞检测、刚体、触发器、物理材质、Layer | ✅ |
| [[Unity_Animation_Architecture]] | 动画系统——Animator、Animation Clip、状态机、Blend Tree、IK | ✅ |
| [[Unity_UI_Architecture]] | UI 系统——Canvas、RectTransform、UGUI 组件、布局、事件 | ✅ |
| [[Unity_Audio_Architecture]] | 音频系统——AudioSource、AudioClip、混音器、3D 音效 | ✅ |
| [[Unity_Particle_Architecture]] | 粒子系统——ParticleSystem、模块、Shader、GPU 粒子 | ✅ |
| [[Unity_Lighting_Rendering_Architecture]] | 光照与渲染——光源类型、光照贴图、渲染路径、后处理 | ✅ |
| [[Unity_Scene_Resource_Architecture]] | 场景与资源管理——Scene 加载、AssetBundle、Addressables、Resources | ✅ |
| [[Unity_Performance_Optimization]] | 性能优化——Profiler、Draw Call、GC、LOD、遮挡剔除、内存管理 | ✅ |
| [[Unity_Action_Combat_System]] | 3D RPG 动作战斗系统——输入缓冲、状态机、连招、命中判定、伤害系统、AI、打击感 | ✅ |
| [[Unity_Open_World_Architecture]] | 开放世界地图技术方案——地形、流式加载、植被、LOD、NavMesh、天气、性能预算 | ✅ |
| [[Unity_Save_Quest_System]] | 存档 / 任务系统架构——ISaveable、序列化、加密、版本迁移、EventBus、任务分支 | ✅ |
| [[Unity_Art_Style_Unification]] | 美术风格统一实战——Art Bible、色板、光照、Shader、贴图、模型、UI、后处理 | ✅ |

---

## 知识关系图

```
Unity 引擎知识体系
    │
    ├── 入门入口
    │   └── [[Unity_README]] (综合指南，带内部锚点导航)
    │
    ├── 核心架构
    │   └── [[Unity_Architecture_Overview]] (引擎整体骨架)
    │
    ├── 编程层
    │   └── [[Unity_CSharp_Scripting_Architecture]] (MonoBehaviour/事件/协程)
    │
    ├── 子系统
    │   ├── [[Unity_Physics_Architecture]]        ← 物理
    │   ├── [[Unity_Animation_Architecture]]      ← 动画
    │   ├── [[Unity_UI_Architecture]]             ← UI
    │   ├── [[Unity_Audio_Architecture]]          ← 音频
    │   ├── [[Unity_Particle_Architecture]]       ← 粒子
    │   └── [[Unity_Lighting_Rendering_Architecture]]  ← 光照/渲染
    │
    ├── 资源与场景
    │   └── [[Unity_Scene_Resource_Architecture]] (场景/AB/Addressables)
    │
    ├── 性能
    │   └── [[Unity_Performance_Optimization]] (Profiler/DC/GC/LOD)
    │
    └── 实战专题
        ├── [[Unity_Action_Combat_System]] (3D RPG 动作战斗系统)
        ├── [[Unity_Open_World_Architecture]] (开放世界地图技术方案)
        ├── [[Unity_Save_Quest_System]] (存档/任务系统架构)
        └── [[Unity_Art_Style_Unification]] (美术风格统一实战)
```

---

## 相关索引

- [[AI_Learning_Roadmap_MOC]] — 主知识库入口
