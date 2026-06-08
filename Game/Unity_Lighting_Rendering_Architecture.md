---
title: Unity 光照与渲染架构
created: 2026-06-08
updated: 2026-06-08
tags: [游戏, Unity, 架构, 光照系统, 渲染系统]
---

# Unity 光照与渲染架构

## 一、渲染管线架构总览

```
Unity 渲染体系
    │
    ├── 渲染管线 (Render Pipeline)
    │       ├── Built-in（内置/传统管线）
    │       ├── URP（通用渲染管线）
    │       └── HDRP（高清渲染管线）
    │
    ├── 光照系统 (Lighting System)
    │       ├── 光源类型
    │       ├── 光照模式 (Realtime/Baked/Mixed)
    │       ├── 全局光照 (GI)
    │       └── 阴影系统
    │
    ├── 材质与着色器 (Material & Shader)
    │       ├── 标准着色器
    │       ├── Shader Graph
    │       └── 自定义着色器
    │
    ├── 后处理 (Post Processing)
    │       ├── 颜色校正
    │       ├── 环境光遮蔽 (AO)
    │       ├── 泛光 (Bloom)
    │       └── 抗锯齿 (AA)
    │
    └── 渲染优化
            ├── 批处理 (Batching)
            ├── LOD
            ├── 遮挡剔除 (Occlusion Culling)
            └── 渲染队列
```

## 二、光源系统

### 2.1 光源类型

```
光源类型层级
    │
    ├── Directional Light（平行光）
    │       ├── 模拟太阳
    │       ├── 无位置概念，只有方向
    │       ├── 影响场景所有物体
    │       └── 性能开销最小
    │
    ├── Point Light（点光源）
    │       ├── 模拟灯泡/蜡烛
    │       ├── 从中心向四周发光
    │       ├── 有范围 (Range)
    │       └── 性能开销中等
    │
    ├── Spot Light（聚光灯）
    │       ├── 模拟手电筒
    │       ├── 锥形照明区域
    │       ├── 有角度 (Spot Angle)
    │       └── 性能开销中等
    │
    ├── Area Light（区域光）
    │       ├── 模拟面板灯/窗户
    │       ├── 仅支持烘焙 (Baked)
    │       └── 渲染质量最高
    │
    └── Ambient Light（环境光）
            ├── 模拟环境漫反射
            ├── 来自 Skybox
            └── 基础亮度来源
```

### 2.2 光源属性对比

| 属性 | Directional | Point | Spot | Area |
|------|------------|-------|------|------|
| Intensity | ✔ | ✔ | ✔ | ✔ |
| Range | - | ✔ | ✔ | - |
| Spot Angle | - | - | ✔ | - |
| Color | ✔ | ✔ | ✔ | ✔ |
| Shadows | ✔ | ✔ | ✔ | - |
| Cookie | ✔ | ✔ (Cube) | ✔ | - |
| Baked Only | - | - | - | ✔ |
| 实时性能 | ★★★★★ | ★★★★ | ★★★★ | - |

## 三、光照模式体系

### 3.1 三种光照模式

```
Realtime（实时光照）
    │
    ├── 光照实时计算每帧更新
    ├── 支持移动光源和动态物体
    ├── 性能开销大
    └── 效果最灵活
    │
────┼────
    │
Baked（烘焙光照）
    │
    ├── 光照预计算到 Lightmap
    ├── 仅影响静态物体（勾选 Contribute GI）
    ├── 运行时零开销
    └── 画质最高（包含漫反射和间接光）
    │
────┼────
    │
Mixed（混合光照）
    │
    ├── 混合实时和烘焙优势
    ├── 静态物体用烘焙阴影
    ├── 动态物体用实时阴影
    └── 适用于大部分场景
```

### 3.2 模式选择指导

| 场景类型 | 推荐模式 | 原因 |
|---------|---------|------|
| 固定场景（室内） | Baked | 高质量无需动态 |
| 昼夜循环（室外） | Mixed | 太阳移动需实时 |
| 大量移动光源 | Realtime | 动态光照需求 |
| 移动游戏 | Baked为主 | 性能优先 |
| 3A 主机游戏 | Mixed/Baked | 画质与性能平衡 |

## 四、全局光照系统 (GI)

### 4.1 GI 架构

```
全局光照 (Global Illumination)
    │
    ├── 直接光照 (Direct Light)
    │       └── 光源直接照射到物体
    │
    └── 间接光照 (Indirect Light)
            ├── 光在物体间反弹
            ├── 颜色溢出 (Color Bleeding)
            └── 环境遮挡 (Ambient Occlusion)
    
    实现方式:
    ├── Baked GI（烘焙 GI） 
    │       └── 使用 Progressive Lightmapper 预计算
    │
    └── Realtime GI（实时 GI）- 已弃用
            └── 使用 Enlighten（旧版）/ 不推荐
```

### 4.2 Lightmap 流程

```
1. 标记静态物体
   └── Inspector: Static 复选框 → Contribute GI

2. 配置光照参数
   └── Lighting Settings Asset
        ├── Lightmapper: Progressive GPU/CPU
        ├── Lightmap Resolution: 20~50 texels/unit
        ├── Lightmap Size: 1024/2048/4096
        ├── Directional Mode: Non-Directional/Chemical
        └── Indirect Resolution: 间接光照质量

3. 烘焙 (Generate Lighting)
   └── Window → Rendering → Lighting

4. 输出
   ├── Lightmap-*.exr（光照贴图）
   └── *.lmi（光照数据文件）
```

## 五、阴影系统

### 5.1 阴影类型

| 类型 | 说明 | 性能 | 画质 |
|------|------|------|------|
| **No Shadows** | 无阴影 | ★★★★★ | 无 |
| **Hard Shadows** | 硬阴影 | ★★★★ | 边缘锐利 |
| **Soft Shadows** | 软阴影 | ★★★ | 边缘柔和 |
| **Soft Shadows (High)** | 高质量软阴影 | ★★ | 最佳效果 |

### 5.2 阴影设置

```csharp
// 通过代码设置光源阴影
Light sunLight = GetComponent<Light>();
sunLight.shadows = LightShadows.Soft;
sunLight.shadowStrength = 1.0f;     // 阴影强度 (0~1)
sunLight.shadowBias = 0.05f;        // 偏移（防止阴影闪烁）
sunLight.shadowNormalBias = 0.4f;   // 法线偏移
sunLight.shadowResolution = UnityEngine.Rendering.LightShadowResolution.Medium;

// Project Settings 中的阴影设置
// Quality Settings → Shadows
// Shadow Resolution: Low/Medium/High/Ultra
// Shadow Projection: Close Fit / Stable Fit
// Shadow Cascade: 1~4 cascades（级联阴影）
// Shadow Distance: 阴影可见距离
```

### 5.3 级联阴影映射 (Cascaded Shadow Maps)

```
Shadow Cascade 原理
    │
    ├── Cascade 1 (近处) ── 高分辨率
    ├── Cascade 2 (中距) ── 中等分辨率
    ├── Cascade 3 (远处) ── 低分辨率
    └── Cascade 4 (最远) ── 最低分辨率
    
    目的: 近处阴影清晰，远处性能优化
    设置: Quality Settings → Shadow Cascades
    推荐: 4 Cascades（高质量）/ 2 Cascades（性能）
```

## 六、后处理系统 (Post Processing)

### 6.1 后处理效果栈

```
Post Processing Stack
    │
    ├── 色调/颜色
    │       ├── Color Grading（颜色校正）
    │       ├── White Balance（白平衡）
    │       ├── Tonemapping（色调映射）
    │       └── Lift/Gamma/Gain（升降/伽马/增益）
    │
    ├── 图像效果
    │       ├── Bloom（泛光/辉光）
    │       ├── Depth of Field（景深）
    │       ├── Motion Blur（运动模糊）
    │       └── Lens Distortion（镜头畸变）
    │
    ├── 空间效果
    │       ├── Ambient Occlusion（环境光遮蔽）
    │       ├── Screen Space Reflections（屏幕空间反射）
    │       └── Screen Space Shadows（屏幕空间阴影）
    │
    └── 抗锯齿
            ├── FXAA（快速近似抗锯齿）
            ├── SMAA（子像素抗锯齿）
            └── TAA（时间抗锯齿）
```

### 6.2 Volume 框架 (URP/HDRP)

```
Volume 系统 ── 场景空间后处理控制
    │
    ├── Global Volume（全局）
    │       └── 影响整个场景
    │
    ├── Local Volume（局部区域）
    │       ├── 使用 Collider 定义区域
    │       └── 进入/离开区域渐变
    │
    └── Volume Profile（效果配置资源）
            ├── 可复用
            ├── 运行时切换
            └── Blend 混合
```

## 七、渲染管线对比 (详)

### 7.1 Built-in vs URP vs HDRP

| 维度 | Built-in | URP | HDRP |
|------|----------|-----|------|
| **推出时间** | Unity 5 (2015) | Unity 2019.3 | Unity 2019.3 |
| **可编程** | 不原生支持 | SRP 基础 | SRP 基础 |
| **前向渲染** | ✔ | ✔ | ✔ |
| **延迟渲染** | ✔ | 部分平台 | ✔ |
| **Shader Graph** | 有限 | ✔ | ✔ |
| **后处理** | 需导入 Post FX | Volume 内置 | Volume 内置 |
| **LOD Crossfade** | ✔ | ✔ | ✔ |
| **GPU Instancing** | ✔ | ✔ | ✔ |
| **Lightmap** | ✔ | ✔ | ✔ |
| **Shadow Mask** | ✔ | ✔ | ✔ |
| **Screen Space AO** | 额外 | 可选 | ✔ |
| **SSR** | 额外 | - | ✔ |
| **SSS (子表面散射)** | - | - | ✔ |
| **Decal** | 额外 | 可选 | ✔ |
| **Tessellation** | ✔ | - | ✔ |
| **TAA** | - | - | ✔ |
| **VR** | ✔ | ✔ | ✔ |
| **移动端优化** | 一般 | 优秀 | 不推荐 |
| **代码复杂度** | 简单 | 中等 | 高 |

### 7.2 选择建议

```
你的项目属于哪一类？
    │
    ├── 新项目 → URP（通用推荐）
    │       ├── 移动端项目 ── URP
    │       ├── PC 独立游戏 ── URP
    │       └── 主机/3A ── 考虑 HDRP 或 URP
    │
    ├── 旧项目升级
    │       ├── Built-in → URP（较容易迁移）
    │       └── Built-in → HDRP（资产需要重做材质）
    │
    └── 特殊需求
            ├── 极致画质 → HDRP
            ├── 最广兼容 → Built-in（不推荐新项目）
            └── 性能优先 → URP
```

## 八、渲染队列体系

### 8.1 渲染队列

```
渲染队列 (Render Queue)
    │
    ├── Background (1000) ── 背景/Skybox
    ├── Geometry (2000) ──── 不透明物体（默认）
    ├── AlphaTest (2450) ─── Alpha 测试（植被）
    ├── GeometryLast (2500) ─ 最后渲染的几何体
    ├── Transparent (3000) ── 透明物体
    └── Overlay (4000) ───── 屏幕特效/UI
```

### 8.2 渲染顺序

```
1. 不透明物体渲染 (Geometry Queue)
   │ 从近到远排序
   │ Overdraw 优化
   ▼

2. 天空盒渲染（可选）

3. 透明物体渲染 (Transparent Queue)
   │ 从远到近排序
   │ 正确透明度混合
   ▼

4. Overlay 渲染 (Overlay Queue)
   │ UI / 屏幕特效
   ▼

Final Image
```

---

*本文档基于 Unity 6 (2024 LTS) 整理*
