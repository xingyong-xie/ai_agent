---
title: Unity 粒子系统架构
created: 2026-06-08
updated: 2026-06-08
tags: [游戏, Unity, 架构, 粒子系统]
---

# Unity 粒子系统架构

## 一、粒子系统整体架构

```
Unity Particle System (粒子系统)
    │
    ├── 核心模块 (Always Active)
    │       ├── Main（主模块）
    │       ├── Emission（发射模块）
    │       └── Shape（形状模块）
    │
    ├── 生命周期模块 (Lifetime)
    │       ├── Velocity over Lifetime（速度）
    │       ├── Limit Velocity over Lifetime（限速）
    │       ├── Force over Lifetime（力）
    │       ├── Color over Lifetime（颜色）
    │       ├── Size over Lifetime（大小）
    │       ├── Rotation over Lifetime（旋转）
    │       └── Noise over Lifetime（噪波）
    │
    ├── 渲染模块
    │       ├── Renderer（渲染器）
    │       ├── Trail（拖尾）
    │       ├── Lights（灯光）
    │       └── Collision（碰撞）
    │
    └── 附加模块
            ├── Sub Emitters（子发射器）
            ├── Texture Sheet Animation（纹理动画）
            ├── Custom Data（自定义数据）
            └── Triggers（触发器）
```

## 二、Core 模块详解

### 2.1 Main（主模块）

```
Main Module
    │
    ├── Duration（持续时间）
    │       └── 粒子系统播放时长（Looping 时无效）
    │
    ├── Looping（循环）
    │       └── 是否循环播放
    │
    ├── Prewarm（预暖）
    │       └── 启动时模拟已播放一段时间（需 Looping）
    │
    ├── Start Delay（启动延迟）
    │       └── 启动后等待多久才开始发射
    │
    ├── Start Lifetime（初始生命周期）
    │       ├── Constant（常数）    例: 5
    │       ├── Random Between Two Constants（区间随机）
    │       └── Curve（曲线）
    │
    ├── Start Speed（初始速度）
    │       └── 粒子生成时的速度
    │
    ├── Start Size（初始大小）
    │       └── 粒子生成时的大小
    │
    ├── Start Color（初始颜色）
    │       ├── Color（单色）
    │       ├── Random Between Two Colors（随机）
    │       └── Gradient（渐变色）
    │
    ├── Gravity Modifier（重力修正）
    │       └── 粒子受重力影响的程度（0=无重力, 1=正常）
    │
    ├── Simulation Speed（模拟速度）
    │       └── 粒子模拟的快慢（0.5=慢速, 2=快速）
    │
    ├── Max Particles（最大粒子数）
    │       └── 同时存在的粒子数上限
    │
    └── Auto Random Seed（随机种子）
            └── 每次播放是否使用不同随机种子
```

### 2.2 Emission（发射模块）

```
Emission Module
    │
    ├── Rate over Time（时间速率）
    │       └── 每秒发射粒子数
    │
    ├── Rate over Distance（距离速率）
    │       └── 每单位移动距离发射粒子数（移动时拖尾）
    │
    └── Bursts（爆发）
            │
            ├── Time（时间点）
            │       └── 在哪个时间点爆发
            ├── Count（数量）
            │       └── 爆发发射的粒子数
            ├── Cycles（循环次数）
            └── Interval（爆发间隔）
    
    示例: 爆炸效果
    Burst at 0.0s: 50 particles × 1 cycle
```

### 2.3 Shape（形状模块）

| 形状 | 说明 | 适用场景 |
|------|------|---------|
| **Sphere** | 球体表面/体积发射 | 爆炸、魔法爆发 |
| **Hemisphere** | 半球发射 | 地面爆发、喷泉基础 |
| **Cone** | 锥体发射 | 火焰、喷泉、喷射 |
| **Box** | 方盒区域发射 | 烟雾发生器范围 |
| **Mesh** | 网格表面发射 | 物体燃烧、附着特效 |
| **Circle** | 圆形发射 | 环形特效、光环 |
| **Edge** | 边缘发射 | 边缘火焰、线状特效 |

## 三、生命周期模块体系

### 3.1 模块作用图

```
粒子生命周期：
生成 ──> 运动 ──> 变化 ──> 消亡
 │        │        │        │
 │    Velocity    Color    Size
 │    Force       Size    Rotation
 │    Limit       Rotation Alpha
 │    Noise       ...
 └─────────── 时间线 ──────────→
```

### 3.2 各模块详解

| 模块 | 作用 | 典型值/用法 |
|------|------|------------|
| **Velocity over Lifetime** | 随时间改变速度方向 | 螺旋运动、吸引效果 |
| **Limit Velocity over Lifetime** | 限制最大速度 | 控制粒子不过快飞出 |
| **Force over Lifetime** | 持续施加力 | 风、重力区域 |
| **Color over Lifetime** | 颜色渐变 | Alpha 渐隐（最常见） |
| **Size over Lifetime** | 大小变化 | 从小到大再缩小 |
| **Rotation over Lifetime** | 旋转速度 | 不规则旋转增强真实感 |
| **Noise over Lifetime** | 不规则扰动 | 烟雾/火焰的自然感 |

```csharp
// 通过代码控制粒子模块
ParticleSystem ps = GetComponent<ParticleSystem>();

// Main 模块
var main = ps.main;
main.duration = 5.0f;
main.loop = true;
main.startLifetime = new ParticleSystem.MinMaxCurve(2f, 4f);
main.startSpeed = new ParticleSystem.MinMaxCurve(5f, 10f);
main.startSize = new ParticleSystem.MinMaxCurve(0.5f, 1.5f);
main.startColor = Color.red;
main.maxParticles = 1000;

// Emission 模块
var emission = ps.emission;
emission.rateOverTime = new ParticleSystem.MinMaxCurve(20);
emission.SetBurst(0, new ParticleSystem.Burst(0f, 50));

// Shape 模块
var shape = ps.shape;
shape.shapeType = ParticleSystemShapeType.Cone;
shape.angle = 25f;
shape.radius = 2f;

// Color over Lifetime
var colorOverLifetime = ps.colorOverLifetime;
colorOverLifetime.enabled = true;
Gradient gradient = new Gradient();
gradient.SetKeys(
    new GradientColorKey[] { 
        new GradientColorKey(Color.yellow, 0f),
        new GradientColorKey(Color.red, 1f)
    },
    new GradientAlphaKey[] {
        new GradientAlphaKey(1f, 0f),
        new GradientAlphaKey(0f, 1f)
    }
);
colorOverLifetime.color = new ParticleSystem.MinMaxGradient(gradient);
```

## 四、渲染与碰撞模块

### 4.1 Renderer（渲染器）

| 属性 | 说明 | 适用场景 |
|------|------|---------|
| **Render Mode** | 渲染模式 | Billboard（公告牌）/ Mesh / Stretch |
| **Billboard** | 始终面向相机 | 火焰、烟雾、默认模式 |
| **Stretched Billboard** | 拉伸公告牌 | 拖尾效果 |
| **Mesh** | 网格渲染 | 碎片、实体粒子 |
| **Material** | 材质（默认 Particle/Standard Surface）| 控制粒子外观 |
| **Sort Mode** | 排序模式 | 由近到远/由远到近/年龄 |
| **Sorting Fudge** | 排序偏移 | 调整粒子层级 |

### 4.2 Collision（碰撞）

| 属性 | 说明 |
|------|------|
| **Type** | World (世界碰撞) / Planes (平面碰撞) |
| **Dampen** | 碰撞后速度衰减 (0~1) |
| **Bounce** | 碰撞后反弹系数 (0~1) |
| **Lifetime Loss** | 碰撞损失的生命周期 (0~1) |
| **Send Collision Messages** | 是否发送碰撞消息 |

### 4.3 Trails（拖尾）

```
Trail Module
    │
    ├── Ratio ── 产生拖尾的粒子比例
    ├── Lifetime ── 拖尾存在时间
    ├── Min Vertex Distance ── 最小顶点间距
    ├── World Space ── 拖尾是否在世界空间
    └── Die with Particles ── 粒子销毁时拖尾是否一起销毁
    
    适用: 流星、弹道、魔法飞弹
```

## 五、Sub Emitters（子发射器）

```
主粒子
  │
  ├── 子发射器 (Birth) ── 粒子生成时触发
  │       └── 例: 火花伴随烟雾
  │
  ├── 子发射器 (Collision) ── 粒子碰撞时触发
  │       └── 例: 碰撞产生碎片效果
  │
  └── 子发射器 (Death) ── 粒子消亡时触发
          └── 例: 爆炸时产生扩散光圈
```

**典型组合效果：**

```
火箭弹 (主粒子)
  │
  ├── Birth: 尾部火焰（持续拖尾）
  ├── Collision: 碰撞爆炸（爆发粒子）
  └── Death: 碎片飞散（碎片粒子）
```

## 六、常见效果实现参数

### 6.1 火焰

| 参数 | 建议值 |
|------|--------|
| Shape | Cone, angle=15~25 |
| Rate | 20~50 |
| Start Lifetime | 1~2s |
| Start Size | 0.5~1.5 |
| Start Color | 黄→红→Alpha=0 |
| Size over Lifetime | 小→大 |
| Noise | 中强度 |

### 6.2 烟雾

| 参数 | 建议值 |
|------|--------|
| Shape | Box/Cone |
| Rate | 5~15 |
| Start Lifetime | 2~4s |
| Start Size | 1~3（随时间变大）|
| Start Color | 灰白→半透明 |
| Noise | 高强度（自然扰动）|
| Gravity | 轻微正向（上升）|

### 6.3 爆炸

| 参数 | 建议值 |
|------|--------|
| Shape | Sphere |
| Emission | 单次 Burst, 50~200 |
| Start Lifetime | 0.5~1.5s |
| Start Speed | 5~20 |
| Start Size | 0.1~1.0 |
| Start Color | 白→黄→红→透明 |
| Size over Lifetime | 大→小 |
| Sub Emitters | 烟雾碎片 |

### 6.4 下雨

| 参数 | 建议值 |
|--------|--------|
| Shape | Box (大范围) |
| Rate | 500~2000 |
| Start Speed | 20~30 |
| Start Size | 0.05~0.15 |
| Render Mode | Stretched Billboard |
| Gravity | 正常 |
| Color | 淡蓝半透明 |

---

*本文档基于 Unity 6 (2024 LTS) 整理*
