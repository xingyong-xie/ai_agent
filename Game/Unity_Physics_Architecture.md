---
title: Unity 物理系统架构
created: 2026-06-08
updated: 2026-06-08
tags: [游戏, Unity, 架构, 物理系统]
---

# Unity 物理系统架构

## 一、物理系统整体架构

```
Unity 物理系统 (基于 NVIDIA PhysX)
    │
    ├── 刚体系统 (Rigidbody)
    │       ├── 动力学刚体（受物理影响）
    │       └── 运动学刚体（由程序控制位置）
    │
    ├── 碰撞系统 (Collider)
    │       ├── 基础碰撞体（Box/Sphere/Capsule）
    │       ├── 复杂碰撞体（Mesh/Terrain）
    │       ├── 复合碰撞体（多个子碰撞体组合）
    │       └── 触发器 (Trigger)
    │
    ├── 物理材质 (Physics Material)
    │       ├── 摩擦力（动态/静态）
    │       └── 弹力
    │
    ├── 关节系统 (Joint)
    │       ├── Fixed Joint（固定）
    │       ├── Hinge Joint（铰链）
    │       ├── Spring Joint（弹簧）
    │       ├── Configurable Joint（可配置）
    │       └── Character Joint（角色关节）
    │
    ├── 射线检测 (Physics Raycast)
    │       ├── Raycast（单点检测）
    │       ├── RaycastAll（多点检测）
    │       ├── SphereCast（球体扫描）
    │       ├── BoxCast（方盒扫描）
    │       ├── OverlapSphere（球体范围）
    │       └── OverlapBox（方盒范围）
    │
    └── 物理设置 (Physics Settings)
            ├── 重力（默认 -9.81 m/s²）
            ├── 碰撞矩阵 (Layer Collision Matrix)
            ├── 求解迭代次数
            └── 穿透容差
```

## 二、刚体系统 (Rigidbody)

### 2.1 刚体类型

| 类型 | isKinematic | 说明 | 适用场景 |
|------|-------------|------|---------|
| **动力学刚体** | false | 受重力/力/碰撞影响 | 掉落的物品、投掷物 |
| **运动学刚体** | true | 由代码/动画控制位置 | 角色、移动平台、门 |

### 2.2 刚体核心属性

```csharp
Rigidbody rb = GetComponent<Rigidbody>();

// 基本属性
rb.mass = 10f;              // 质量
rb.drag = 0.5f;             // 空气阻力
rb.angularDrag = 0.5f;      // 旋转阻力
rb.useGravity = true;       // 是否受重力
rb.isKinematic = false;     // 是否运动学
rb.freezeRotation = true;   // 锁定旋转

// 约束
rb.constraints = RigidbodyConstraints.FreezePositionX 
               | RigidbodyConstraints.FreezeRotationZ;

// 力与运动
rb.AddForce(Vector3.up * force);          // 施加力
rb.AddForceAtPosition(force, point);      // 在指定点施力
rb.AddTorque(torque);                     // 施加扭矩
rb.AddExplosionForce(force, origin, radius); // 爆炸力
rb.velocity = new Vector3(x, y, z);       // 直接设置速度
rb.MovePosition(newPos);                  // 运动学移动
rb.MoveRotation(newRot);                  // 运动学旋转
```

### 2.3 刚体状态管理

```
Sleep / Wake 机制
    │
    ├── 刚体静止后进入休眠 (Sleep)
    │   ├── 减少物理计算消耗
    │   └── Collision 事件仍会被检测
    │
    ├── 休眠条件
    │   ├── 速度 < sleepThreshold
    │   └── 角速度 < sleepThreshold
    │
    └── 唤醒条件
        ├── 施加力或碰撞
        ├── 调用 WakeUp()
        └── 改变碰撞体状态
```

## 三、碰撞系统 (Collider)

### 3.1 碰撞体类型对比

| 类型 | 形状 | 性能 | 精度 | 适用场景 |
|------|------|------|------|---------|
| **Box Collider** | 长方体 | ★★★★★ | ★★★ | 墙壁/地板/箱子 |
| **Sphere Collider** | 球体 | ★★★★★ | ★★★ | 球状物体 |
| **Capsule Collider** | 胶囊体 | ★★★★★ | ★★★ | 角色/柱子 |
| **Mesh Collider** | 网格形状 | ★★★ | ★★★★★ | 复杂地形/物体 |
| **Terrain Collider** | 地形 | ★★★ | ★★★★ | 地形表面 |
| **Wheel Collider** | 车轮 | ★★★ | ★★★ | 车辆轮胎 |
| **2D Collider** | 2D 形状 | ★★★★★ | ★★★ | 2D 游戏 |

### 3.2 碰撞检测模式

```
Collision Detection Mode
    │
    ├── Discrete（离散检测）── 默认模式
    │   ├── 每帧检测一次位置重叠
    │   ├── 性能最好
    │   └── 高速物体可能穿透
    │
    ├── Continuous（连续检测）
    │   ├── 对静止物体使用离散检测
    │   ├── 对动态物体使用连续扫查
    │   └── 防止高速穿透
    │
    ├── Continuous Dynamic（动态连续检测）
    │   ├── 对所有物体使用连续检测
    │   ├── 性能开销最大
    │   └── 适用于子弹/高速物体
    │
    └── Continuous Speculative（推测性连续）
            ├── 基于预测的碰撞检测
            ├── 性能折中
            └── 适合特定高速场景
```

### 3.3 触发器 (Trigger)

```
Collider (碰撞体)
    │
    ├── isTrigger = false
    │   ├── 物理碰撞（弹开/阻挡）
    │   ├── OnCollisionEnter/Stay/Exit
    │   └── 需要 Rigidbody
    │
    └── isTrigger = true
        ├── 穿透无物理阻挡
        ├── OnTriggerEnter/Stay/Exit
        └── 可用于非物理检测
```

```csharp
// 碰撞事件
void OnCollisionEnter(Collision collision)
{
    // 碰到的对象
    GameObject other = collision.gameObject;
    // 接触点
    ContactPoint contact = collision.contacts[0];
    // 相对速度
    float impactForce = collision.relativeVelocity.magnitude;
    
    Debug.Log($"撞到: {other.name}, 力度: {impactForce}");
}

// 触发事件
void OnTriggerEnter(Collider other)
{
    if (other.CompareTag("Player"))
    {
        Debug.Log("玩家进入触发区域");
    }
}
```

### 3.4 碰撞矩阵 (Layer Collision Matrix)

```
Physics Settings → Layer Collision Matrix

           │ Layer0 │ Layer1 │ Layer2 │ Layer3
───────────┼────────┼────────┼────────┼───────
Layer0     │   ✔    │   ✔    │   ✘    │   ✘
Layer1     │   ✔    │   ✔    │   ✘    │   ✘
Layer2     │   ✘    │   ✘    │   ✔    │   ✔
Layer3     │   ✘    │   ✘    │   ✔    │   ✔

用途: 不同层级对象间选择性碰撞
示例: Player 层不与 Pickup 层碰撞
```

## 四、物理材质系统

### 4.1 物理材质属性

| 属性 | 说明 | 值范围 | 效果 |
|------|------|--------|------|
| **Dynamic Friction** | 动摩擦系数 | 0 ~ 1 | 运动时的摩擦力 |
| **Static Friction** | 静摩擦系数 | 0 ~ 1 | 启动时的摩擦力 |
| **Bounciness** | 弹力系数 | 0 ~ 1 | 碰撞后的反弹程度 |
| **Friction Combine** | 摩擦组合模式 | Average/Min/Max/Multiply | 两个材质摩擦力如何合并 |
| **Bounce Combine** | 弹力组合模式 | Average/Min/Max/Multiply | 两个材质弹力如何合并 |

### 4.2 摩擦力与弹力

```csharp
// 创建物理材质
PhysicsMaterial mat = new PhysicsMaterial();
mat.dynamicFriction = 0.6f;
mat.staticFriction = 0.8f;
mat.bounciness = 0.3f;

// 应用到碰撞体
collider.material = mat;
collider.sharedMaterial = mat;  // 共享材质（不自动创建实例）
```

## 五、关节系统 (Joint)

| 关节类型 | 自由度 | 说明 | 适用场景 |
|---------|--------|------|---------|
| **Fixed Joint** | 0 | 两个刚体固定在一起 | 组合物体 |
| **Hinge Joint** | 1（旋转） | 绕一个轴旋转 | 门/摆锤/车轮 |
| **Spring Joint** | 弹性连接 | 弹簧效果 | 弹性绳索 |
| **Configurable Joint** | 6（全可配） | 完全可配置关节 | 复杂机械系统 |
| **Character Joint** | 可配 | 基于 Hinge 的角色关节 | Ragdoll 物理 |

## 六、射线检测系统

### 6.1 检测方法分类

```csharp
// ===== 单点检测 =====
bool hit = Physics.Raycast(origin, direction, maxDistance);
bool hit = Physics.Raycast(origin, direction, out RaycastHit info, maxDistance, layerMask);

// ===== 多点检测 =====
RaycastHit[] hits = Physics.RaycastAll(origin, direction, maxDistance, layerMask);

// ===== 范围检测 =====
Collider[] colliders = Physics.OverlapSphere(center, radius, layerMask);
Collider[] colliders = Physics.OverlapBox(center, halfExtents, rotation, layerMask);

// ===== 扫描检测 =====
bool hit = Physics.SphereCast(origin, radius, direction, out RaycastHit info, maxDist);
bool hit = Physics.BoxCast(center, halfExtents, direction, out RaycastHit info, maxDist);

// ===== 最近距离 =====
float dist = Physics.ComputePenetration(colliderA, posA, rotA, colliderB, posB, rotB, out dir, out depth);
```

### 6.2 LayerMask 过滤

```csharp
// 定义 Layer
[SerializeField] private LayerMask groundLayer;
[SerializeField] private LayerMask enemyLayer;

// 使用 LayerMask
int mask = LayerMask.GetMask("Ground", "Enemy");
// 等价于: 1 << LayerMask.NameToLayer("Ground") | 1 << LayerMask.NameToLayer("Enemy")

if (Physics.Raycast(origin, direction, out RaycastHit hit, 100f, mask))
{
    // 只检测 Ground 和 Enemy 层
}
```

---

*本文档基于 Unity 6 (2024 LTS) 整理*
