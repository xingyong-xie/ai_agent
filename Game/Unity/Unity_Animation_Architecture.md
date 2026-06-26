---
title: Unity 动画系统架构
created: 2026-06-08
updated: 2026-06-08
tags: [游戏, Unity, 架构, 动画系统]
related: "[[Unity_MOC]]"
---

# Unity 动画系统架构

## 一、动画系统整体架构

```
Unity 动画系统
    │
    ├── Animator Controller（动画状态机）
    │       ├── Animation Clip 管理
    │       ├── 状态转换 (Transition)
    │       ├── 参数系统 (Parameters)
    │       ├── 混合树 (Blend Tree)
    │       └── 子状态机 (Sub-State Machine)
    │
    ├── Animation Clip（动画片段）
    │       ├── 关键帧动画 (.anim)
    │       ├── 导入动画 (.fbx animation)
    │       └── 程序化动画 (Runtime create)
    │
    ├── Avatar（骨骼映射）
    │       ├── Humanoid（人形骨骼）
    │       ├── Generic（通用骨骼）
    │       └── Avatar Mask（遮罩）
    │
    ├── Timeline（时间线）
    │       ├── Cinemachine（摄像机）
    │       ├── Signal（信号）
    │       └── 多轨编辑
    │
    └── 附加系统
            ├── IK Pass（反向动力学）
            ├── Animation Events（动画事件）
            ├── Root Motion（根运动）
            └── Animation Rigging（动画绑定）
```

## 二、Animator 状态机架构

### 2.1 状态机基本结构

```
Animator Controller
    │
    └── Layers（层）
            │
            ├── Base Layer（基础层）
            │       ├── Entry ──> Idle
            │       ├── Idle ──> Walk
            │       │   └── Condition: Speed > 0.1
            │       ├── Walk ──> Run
            │       │   └── Condition: Speed > 3.0
            │       ├── Any State ──> Hurt
            │       │   └── Condition: isHurt == true
            │       └── Idle, Walk, Run ──> Exit
            │
            └── UpperBody Layer（上半身层）
                    ├── 叠加动画
                    ├── 武器开火动画
                    └── 带有 Avatar Mask
```

### 2.2 状态转换 (Transition)

```
当前状态 ──> 过渡条件满足 ──> 下一个状态
    │                        │
    │  Has Exit Time         │
    │  (自然播放完)          │
    │                        │
    │  Conditions:           │
    │  Float / Int / Bool / Trigger
    │                        │
    │  Transition Duration:  │
    │  (过渡混合时间)        │
    │                        │
    ▼                        ▼
  状态A                  状态B
  (动画播放中)    ──>   (接管动画权重)
```

**转换设置参数：**

| 参数 | 说明 | 默认值 |
|------|------|--------|
| **Has Exit Time** | 是否等到当前动画播完再过渡 | true |
| **Exit Time** | 在动画哪个时间点退出（百分比） | 0.75 |
| **Transition Duration** | 过渡持续时长（秒或百分比） | 0.1 |
| **Transition Offset** | 目标状态开始播放的偏移 | 0 |
| **Interruption Source** | 是否可以被打断 | None |

### 2.3 参数系统

```csharp
Animator animator = GetComponent<Animator>();

// ===== 四种参数类型 =====
animator.SetFloat("Speed", 5.5f);         // Float 参数（带平滑过渡）
animator.SetInteger("WeaponType", 2);     // Int 参数
animator.SetBool("isGrounded", true);     // Bool 参数
animator.SetTrigger("Attack");            // Trigger 参数（自动复位）

// ===== 获取参数 =====
float speed = animator.GetFloat("Speed");
bool grounded = animator.GetBool("isGrounded");

// ===== 参数平滑过渡 =====
animator.SetFloat("Speed", value, dampTime: 0.1f, deltaTime: Time.deltaTime);

// ===== 跨层参数 =====
// 参数在所有 Layer 间共享
```

### 2.4 混合树 (Blend Tree)

```
Blend Tree 类型
    │
    ├── 1D Blend（一维混合）
    │   ├── Walk (0) ──> Jog (0.5) ──> Run (1.0)
    │   └── 参数: Speed
    │
    ├── 2D Simple Directional（二维定向）
    │   ├── 8 方向行走动画
    │   └── 参数: Horizontal, Vertical
    │
    ├── 2D Freeform Directional（自由定向）
    │   ├── 多方向动画
    │   └── 参数: MoveX, MoveY
    │
    └── 2D Freeform Cartesian（自由笛卡尔）
            ├── 左下/右下/左上/右上
            └── 参数: X, Y
```

## 三、Animation Clip 架构

### 3.1 动画属性绑定

```
Animation Clip
    │
    ├── 组件路径: "Player/Body/LeftArm"
    ├── 属性路径: "m_LocalPosition.x"
    ├── 关键帧序列
    │       ├── Time 0:  value = 0
    │       ├── Time 0.5: value = 10
    │       └── Time 1:   value = 0
    └── 曲线类型
            ├── 线性 (Linear)
            ├── 平滑 (Smooth)
            ├── 恒定 (Constant)
            └── 贝塞尔 (Bezier)
```

### 3.2 动画事件

```csharp
// === 在 Animation Clip 时间轴上添加事件 ===
// 在动画的特定时间点触发函数调用

// 在脚本中接收事件
public void OnFootstep()
{
    // 播放脚步声
    AudioSource.PlayClipAtPoint(footstepSound, transform.position);
}

public void OnAttackHit()
{
    // 攻击判定
    damageCollider.enabled = true;
}

public void OnAnimationEnd()
{
    // 动画结束
    animator.SetBool("isAttacking", false);
}
```

## 四、Avatar 与骨骼系统

### 4.1 Avatar 类型对比

| 类型 | 说明 | 适用场景 | 支持 IK |
|------|------|---------|--------|
| **Humanoid** | 人形骨骼映射 | 人类角色 | 是 |
| **Generic** | 通用骨骼 | 非人形角色/物体 | 否 |

### 4.2 Humanoid 骨骼映射

```
Avatar (Humanoid)
    │
    ├── 身体映射 (Body Map)
    │       ├── Spine（脊柱）
    │       ├── Head（头部）
    │       ├── Left/Right Arm（手臂）
    │       └── Left/Right Leg（腿部）
    │
    ├── 手指映射 (Finger Map)
    │       ├── Thumb（拇指）
    │       ├── Index（食指）
    │       └── ...
    │
    └── 好处
            ├── 多人角色动画复用（重定向）
            ├── IK 支持
            ├── 肌肉控制
            └── 动画重定向 (Animation Retargeting)
```

### 4.3 动画重定向 (Retargeting)

```
动画源角色 ──> 骨骼映射 ──> 目标角色
    
Humanoid Avatar
    │
    ├── 不同体型角色共享同一组动画
    ├── 无需单独制作每个角色的动画
    └── 手臂/腿长差异自动适配
```

## 五、IK 反向动力学 (Inverse Kinematics)

### 5.1 IK 工作原理

```
FK (正向动力学): 骨骼 ──> 末端位置
    肩膀 ──> 手肘 ──> 手腕 ──> 手掌 ──> 指尖

IK (反向动力学): 末端位置 ──> 骨骼
    指尖 ──> 手掌 ──> 手腕 ──> 手肘 ──> 肩膀
```

### 5.2 Unity IK 使用

```csharp
void OnAnimatorIK(int layerIndex)
{
    Animator animator = GetComponent<Animator>();
    
    // 设置 IK 权重
    animator.SetIKPositionWeight(AvatarIKGoal.LeftHand, 1f);
    animator.SetIKRotationWeight(AvatarIKGoal.LeftHand, 1f);
    
    // 设置目标位置/旋转
    animator.SetIKPosition(AvatarIKGoal.LeftHand, target.position);
    animator.SetIKRotation(AvatarIKGoal.LeftHand, target.rotation);
    
    // 头部 IK
    animator.SetLookAtWeight(1f, 0.3f, 0.5f, 0.5f);
    animator.SetLookAtPosition(lookTarget.position);
    
    // 脚部 IK
    animator.SetIKPosition(AvatarIKGoal.LeftFoot, footTarget.position);
}
```

## 六、Timeline 与 Cinemachine

### 6.1 Timeline 架构

```
Timeline Asset
    │
    ├── Animation Track（动画轨道）
    │       ├── 控制角色动画
    │       └── 支持多 Clip 叠加
    │
    ├── Cinemachine Track（摄像机轨道）
    │       ├── 切换虚拟摄像机
    │       └── 镜头过渡效果
    │
    ├── Signal Track（信号轨道）
    │       ├── 发送信号
    │       └── 触发事件
    │
    ├── Audio Track（音频轨道）
    │       └── 音频播放
    │
    └── Activation Track（激活轨道）
            └── 对象激活/禁用
```

### 6.2 应用场景

| 场景 | 说明 |
|------|------|
| **过场动画** | 角色动作 + 镜头运动 + 对话 |
| **QTE 事件** | 指定时间点触发交互 |
| **Boss 出场** | 镜头轨道 + 动画轨道 |
| **UI 动画** | UI 元素 + 信号触发 |
| **对话系统** | 角色动画 + 镜头切换 |

## 七、Root Motion 根运动

```
Root Motion 原理
    │
    ├── 动画驱动位置/旋转（而非代码）
    ├── 动画文件包含根骨骼变换数据
    ├── 勾选 Apply Root Motion
    └── 角色移动由动画决定
```

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| **代码控制移动** | transform.Translate 驱动 | 精确控制移动 |
| **Root Motion** | 动画驱动移动 | 自然位移（翻滚/击退） |
| **混合模式** | 部分动画 + 部分代码 | 大多数游戏 |

---

*本文档基于 Unity 6 (2024 LTS) 整理*
