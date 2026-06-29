# Unity 3D RPG 动作战斗系统实现细节

> 完整的 Unity 动作战斗系统技术方案，覆盖**输入响应、动画衔接、伤害判定、AI、反馈**全链路。

---

## 🏗️ 一、核心架构设计

### 系统分层

```
┌─────────────────────────────────────────┐
│         Input Layer（输入层）           │  ← Unity Input System
├─────────────────────────────────────────┤
│      Command Buffer（指令缓冲）         │  ← 输入预输入/连招
├─────────────────────────────────────────┤
│    State Machine（状态机）              │  ← Animator + 自定义FSM
├─────────────────────────────────────────┤
│  Combat Logic（战斗逻辑）│ Animation     │
│  - 伤害计算              │  - 动画事件   │
│  - 命中判定              │  - Root Motion│
├─────────────────────────────────────────┤
│        Feedback Layer（反馈层）         │  ← 特效/音效/震屏/顿帧
└─────────────────────────────────────────┘
```

### 推荐架构模式

| 模式 | 用途 |
|------|------|
| **状态机（FSM）** | 角色状态：Idle/Move/Attack/Hit/Dead |
| **行为树（BT）** | AI 决策（推荐 Behavior Designer） |
| **命令模式（Command）** | 输入指令缓冲，连招判定 |
| **观察者模式** | 伤害事件、UI 更新 |
| **对象池** | 特效、伤害数字、子弹 |

---

## 🎮 二、输入系统（Input System）

### 使用 Unity New Input System

```csharp
// PlayerInputHandler.cs
using UnityEngine.InputSystem;

public class PlayerInputHandler : MonoBehaviour
{
    [SerializeField] private float bufferTime = 0.2f; // 输入缓冲窗口
    private Queue<InputCommand> commandBuffer = new();

    public void OnAttack(InputAction.CallbackContext ctx)
    {
        if (ctx.performed)
            BufferCommand(InputCommand.Attack);
    }

    public void OnDodge(InputAction.CallbackContext ctx)
    {
        if (ctx.performed)
            BufferCommand(InputCommand.Dodge);
    }

    private void BufferCommand(InputCommand cmd)
    {
        commandBuffer.Enqueue(cmd);
        Invoke(nameof(RemoveOldCommand), bufferTime);
    }

    public InputCommand? ConsumeCommand()
    {
        return commandBuffer.Count > 0 ? commandBuffer.Dequeue() : null;
    }
}

public enum InputCommand { Attack, HeavyAttack, Dodge, Block, Skill1, Skill2 }
```

### ⭐ 关键点：输入缓冲（Input Buffering）

**为什么需要**：玩家在动画未结束时按下下一个攻击，系统应"记住"这个输入，等当前动作结束自动衔接 —— **这是动作游戏手感的核心**。

| 游戏 | 缓冲窗口 |
|------|---------|
| 鬼泣 5 | 约 0.2-0.3 秒 |
| 黑暗之魂 | 约 0.3 秒 |
| 怪物猎人 | 约 0.5 秒（节奏慢） |

---

## 🤖 三、状态机设计

### 方案 A：Animator State Machine（推荐新手）

利用 Unity 内置 Animator 的状态机，通过 Parameters 驱动。

```csharp
public class PlayerCombat : MonoBehaviour
{
    private Animator animator;
    private int comboIndex = 0;
    private bool canCombo = false; // 动画事件控制

    public void TryAttack()
    {
        if (canCombo || comboIndex == 0)
        {
            comboIndex++;
            animator.SetInteger("ComboIndex", comboIndex);
            animator.SetTrigger("Attack");
            canCombo = false;
        }
    }

    // 动画事件回调：在攻击动画的"取消窗口"调用
    public void OnComboWindowOpen() => canCombo = true;
    public void OnComboWindowClose() => canCombo = false;
    public void OnAttackEnd() => comboIndex = 0;
}
```

**Animator 配置**：
```
[Idle] → [Attack1] → [Attack2] → [Attack3] → [Idle]
   ↑         ↓ ComboIndex==2     ↓ ComboIndex==3
   └─────────┴────────────────────┘
```

### 方案 B：自定义代码状态机（推荐进阶）

```csharp
public abstract class CharacterState
{
    protected CharacterController ctrl;
    public abstract void Enter();
    public abstract void Update();
    public abstract void Exit();
}

public class AttackState : CharacterState
{
    private float timer;
    public override void Enter()
    {
        ctrl.Animator.Play("Attack_01");
        timer = 0;
    }

    public override void Update()
    {
        timer += Time.deltaTime;
        if (timer > 0.5f && ctrl.Input.HasCommand(InputCommand.Attack))
            ctrl.StateMachine.Change(new AttackState2());
    }

    public override void Exit() { }
}

public class StateMachine
{
    private CharacterState current;
    public void Change(CharacterState next)
    {
        current?.Exit();
        current = next;
        current.Enter();
    }
    public void Update() => current?.Update();
}
```

**优点**：完全可控、易调试、便于团队协作

---

## ⚔️ 四、连招系统（Combo System）

### 核心机制：动画取消窗口（Cancel Window）

每个攻击动画分为 **3 个阶段**：

```
┌───────────┬─────────────┬───────────┐
│  Startup  │   Active    │  Recovery │
│  (起手)   │   (生效)    │  (硬直)   │
├───────────┼─────────────┼───────────┤
│  0-0.2s   │  0.2-0.4s   │  0.4-0.8s │
│           │  ✅命中判定  │ ✅可取消   │
└───────────┴─────────────┴───────────┘
                              ↑
                    在此窗口按下攻击 → 进入下一段连招
```

### 动画事件标记（Animation Events）

在 Unity Animation 窗口添加事件：

```csharp
public class AnimationEventReceiver : MonoBehaviour
{
    [SerializeField] private PlayerCombat combat;
    [SerializeField] private WeaponHitbox hitbox;

    // ⭐ 关键事件
    public void OnHitboxEnable() => hitbox.Enable();    // Active 开始
    public void OnHitboxDisable() => hitbox.Disable();  // Active 结束
    public void OnComboOpen() => combat.canCombo = true;  // Recovery 开始
    public void OnComboClose() => combat.canCombo = false;
    public void OnFootstep() => AudioManager.PlayFootstep();
}
```

### 连招分支设计（树形结构）

```
        [攻击1]
           │
     ┌─────┼─────┐
   攻击   重攻   方向键+攻击
     │     │       │
   [攻击2] [蓄力斩] [浮空斩]
     │
   ┌─┴─┐
 攻击  重攻
   │    │
 [攻击3][终结技]
```

```csharp
public class ComboTree
{
    public Dictionary<(string state, InputCommand cmd), string> Transitions = new()
    {
        { ("Idle", InputCommand.Attack), "LightAttack_1" },
        { ("LightAttack_1", InputCommand.Attack), "LightAttack_2" },
        { ("LightAttack_1", InputCommand.HeavyAttack), "ChargedSlash" },
        { ("LightAttack_2", InputCommand.Attack), "LightAttack_3" },
        // ...
    };
}
```

---

## 💥 五、命中判定（Hit Detection）

### 三种主流方案对比

| 方案 | 精度 | 性能 | 适用场景 |
|------|------|------|---------|
| **武器 Trigger Collider** | 中 | 高 | 卡通/快节奏（鬼泣风） |
| **射线检测（Raycast）** | 高 | 高 | 远程武器、子弹 |
| **多点采样（Sweep Test）** ⭐ | 极高 | 中 | 写实风（魂系） |

### 方案 1：武器 Collider（最简单）

```csharp
public class WeaponHitbox : MonoBehaviour
{
    [SerializeField] private float damage = 10f;
    [SerializeField] private LayerMask enemyLayer;
    private Collider weaponCollider;
    private HashSet<Collider> hitTargets = new(); // 防止单次攻击重复命中

    public void Enable()
    {
        weaponCollider.enabled = true;
        hitTargets.Clear();
    }

    public void Disable() => weaponCollider.enabled = false;

    private void OnTriggerEnter(Collider other)
    {
        if (hitTargets.Contains(other)) return;
        if (((1 << other.gameObject.layer) & enemyLayer) == 0) return;

        hitTargets.Add(other);
        if (other.TryGetComponent<IDamageable>(out var target))
        {
            target.TakeDamage(new DamageInfo
            {
                amount = damage,
                hitPoint = other.ClosestPoint(transform.position),
                attacker = transform.root.gameObject
            });
        }
    }
}
```

### 方案 2：多点 Sweep Test（推荐）⭐

**问题**：高速挥砍时，Collider 可能"穿过"敌人未触发碰撞（俗称"穿模"）

**解决**：在剑刃上设多个采样点，每帧做 `Physics.OverlapCapsule`

```csharp
public class SwordTrace : MonoBehaviour
{
    [SerializeField] private Transform tipPoint;    // 剑尖
    [SerializeField] private Transform basePoint;   // 剑柄
    [SerializeField] private float radius = 0.1f;
    [SerializeField] private LayerMask enemyLayer;

    private Vector3 prevTip, prevBase;
    private bool isActive;

    public void StartTrace()
    {
        isActive = true;
        prevTip = tipPoint.position;
        prevBase = basePoint.position;
    }

    private void LateUpdate()
    {
        if (!isActive) return;

        // 在前后两帧位置间扫掠
        Vector3 curTip = tipPoint.position;
        Vector3 curBase = basePoint.position;

        // 中点采样（采样数越多越精准）
        for (int i = 0; i <= 4; i++)
        {
            float t = i / 4f;
            Vector3 prev = Vector3.Lerp(prevBase, prevTip, t);
            Vector3 cur = Vector3.Lerp(curBase, curTip, t);

            if (Physics.CheckCapsule(prev, cur, radius, enemyLayer))
            {
                // 命中处理
                Collider[] hits = Physics.OverlapCapsule(prev, cur, radius, enemyLayer);
                foreach (var hit in hits) ProcessHit(hit);
                break;
            }
        }

        prevTip = curTip;
        prevBase = curBase;
    }
}
```

---

## 🎯 六、伤害系统

### 接口设计

```csharp
public interface IDamageable
{
    void TakeDamage(DamageInfo info);
}

public struct DamageInfo
{
    public float amount;
    public Vector3 hitPoint;
    public Vector3 hitDirection;
    public GameObject attacker;
    public DamageType type;          // 物理/魔法/真实
    public float poiseDamage;        // 削韧值
    public bool canCriticalHit;
    public HitReactionType reaction; // 受击反应类型
}

public enum DamageType { Physical, Fire, Ice, Lightning, True }
public enum HitReactionType { Light, Heavy, Knockback, Knockdown, Stagger }
```

### 伤害计算公式

```csharp
public class CombatCalculator
{
    public static float Calculate(DamageInfo info, CharacterStats attacker, CharacterStats defender)
    {
        // 基础伤害 = 武器攻击力 × (1 + 力量加成%)
        float baseDmg = info.amount * (1 + attacker.strength * 0.01f);

        // 暴击判定
        bool isCrit = info.canCriticalHit && Random.value < attacker.critRate;
        if (isCrit) baseDmg *= attacker.critMultiplier;

        // 防御减伤（公式：armor / (armor + K)）
        float reduction = defender.armor / (defender.armor + 100f);
        float finalDmg = baseDmg * (1 - reduction);

        // 元素抗性
        if (info.type != DamageType.True)
            finalDmg *= (1 - defender.GetResistance(info.type));

        // 至少 1 点伤害
        return Mathf.Max(1, finalDmg);
    }
}
```

### 受击反应（Hit Reaction）

```csharp
public class HealthComponent : MonoBehaviour, IDamageable
{
    [SerializeField] private float maxHP = 100f;
    [SerializeField] private float poise = 50f; // 韧性值
    private float currentHP, currentPoise;

    public void TakeDamage(DamageInfo info)
    {
        currentHP -= info.amount;
        currentPoise -= info.poiseDamage;

        // 削韧机制：韧性归零才进入硬直
        if (currentPoise <= 0)
        {
            PlayHitReaction(info.reaction);
            currentPoise = poise; // 重置
        }
        else
        {
            PlayHitReaction(HitReactionType.Light); // 轻微闪烁
        }

        // 反馈
        VFXManager.Spawn("HitSpark", info.hitPoint);
        DamageNumberUI.Show(info.amount, info.hitPoint);
        CameraShake.Shake(0.2f, 0.1f);

        if (currentHP <= 0) Die();
    }
}
```

---

## 🎬 七、动画系统进阶

### Animator 配置要点

```
Base Layer    → 主体动作（待机、移动、攻击）
Upper Body    → 上半身（边跑边攻击）
Additive      → 受击反应叠加
```

### Root Motion vs In-Place

| 模式 | 优点 | 缺点 | 适用 |
|------|------|------|------|
| **Root Motion** ⭐ | 位移精准（动捕） | 难配合移动控制 | 攻击位移、翻滚 |
| **In-Place** | 灵活控制 | 需手动位移 | 行走、跑步 |

**最佳实践**：移动用 In-Place，攻击/翻滚用 Root Motion

```csharp
private void OnAnimatorMove()
{
    if (currentState is AttackState || currentState is DodgeState)
    {
        // 使用 Root Motion
        transform.position += animator.deltaPosition;
        transform.rotation *= animator.deltaRotation;
    }
}
```

### Animation Rigging（IK）⭐

```csharp
// 让角色头部 / 武器朝向目标
using UnityEngine.Animations.Rigging;

public class AimIK : MonoBehaviour
{
    [SerializeField] private MultiAimConstraint headAim;
    [SerializeField] private Transform target;

    private void Update()
    {
        if (target != null)
        {
            headAim.weight = Mathf.Lerp(headAim.weight, 1, Time.deltaTime * 5);
            headAim.data.sourceObjects[0].transform.position = target.position;
        }
    }
}
```

---

## 🎯 八、目标锁定系统（Lock-On）

```csharp
public class TargetLockSystem : MonoBehaviour
{
    [SerializeField] private float lockRange = 15f;
    [SerializeField] private LayerMask enemyLayer;
    private Transform currentTarget;

    public void ToggleLock()
    {
        if (currentTarget != null) { currentTarget = null; return; }

        // 查找最近的敌人（且在摄像机视野内）
        var enemies = Physics.OverlapSphere(transform.position, lockRange, enemyLayer);
        float minAngle = float.MaxValue;
        Camera cam = Camera.main;

        foreach (var enemy in enemies)
        {
            Vector3 viewport = cam.WorldToViewportPoint(enemy.transform.position);
            if (viewport.z < 0) continue; // 摄像机后方

            float angle = Vector2.Distance(new Vector2(viewport.x, viewport.y), Vector2.one * 0.5f);
            if (angle < minAngle)
            {
                minAngle = angle;
                currentTarget = enemy.transform;
            }
        }
    }

    private void LateUpdate()
    {
        if (currentTarget != null)
        {
            // 角色朝向目标
            Vector3 dir = currentTarget.position - transform.position;
            dir.y = 0;
            transform.rotation = Quaternion.Slerp(transform.rotation,
                Quaternion.LookRotation(dir), Time.deltaTime * 10);

            // 摄像机锁定（用 Cinemachine LookAt）
        }
    }
}
```

**摄像机配合**：使用 `Cinemachine Virtual Camera`，动态切换 LookAt 目标

---

## 🛡️ 九、防御 / 闪避系统

### 闪避（Dodge）

```csharp
public class DodgeAction
{
    [SerializeField] private float dodgeDistance = 3f;
    [SerializeField] private float dodgeDuration = 0.4f;
    [SerializeField] private float iFrameStart = 0.05f;  // 无敌帧开始
    [SerializeField] private float iFrameEnd = 0.3f;     // 无敌帧结束

    public IEnumerator Execute(Transform character)
    {
        Vector3 dodgeDir = GetDodgeDirection();
        float elapsed = 0;

        while (elapsed < dodgeDuration)
        {
            // 无敌帧
            character.GetComponent<HealthComponent>().Invincible =
                (elapsed >= iFrameStart && elapsed <= iFrameEnd);

            // 曲线位移（开头快，结束慢）
            float t = dodgeCurve.Evaluate(elapsed / dodgeDuration);
            character.position += dodgeDir * dodgeDistance * Time.deltaTime;

            elapsed += Time.deltaTime;
            yield return null;
        }
    }
}
```

### 格挡 / 完美格挡（Parry）

```csharp
public class BlockSystem
{
    private float parryWindow = 0.15f; // 完美格挡时间窗口
    private float blockStartTime;

    public void StartBlock() => blockStartTime = Time.time;

    public BlockResult ProcessIncoming(DamageInfo info)
    {
        float blockDuration = Time.time - blockStartTime;

        if (blockDuration <= parryWindow)
            return BlockResult.Parry;  // 完美格挡 → 反击窗口
        else if (IsFacingAttacker(info))
            return BlockResult.Block;  // 减伤 80%
        else
            return BlockResult.Failed; // 背刺，正常受伤
    }
}
```

---

## 🤖 十、敌人 AI 系统

### 行为树（Behavior Tree）推荐

使用 **Behavior Designer** 或 **NodeCanvas**

```
[Selector] 敌人主行为
├── [Sequence] 死亡
│   └── HP <= 0 → 播放死亡动画
├── [Sequence] 受击中
│   └── IsStaggered → 受击动作
├── [Sequence] 攻击玩家
│   ├── CanSeePlayer
│   ├── InAttackRange
│   └── [Selector] 攻击选择
│       ├── 30%概率 → 重攻击
│       └── 70%概率 → 轻攻击连段
├── [Sequence] 追击
│   ├── CanSeePlayer
│   ├── DistanceToPlayer < 10
│   └── MoveTowardsPlayer
└── [Sequence] 巡逻
    └── PatrolWaypoints
```

### AI 决策示例代码

```csharp
public class EnemyAI : MonoBehaviour
{
    private enum AIState { Idle, Patrol, Chase, Attack, Hit, Dead }
    private AIState state;
    private float lastAttackTime;
    private float attackCooldown = 2f;

    private void Update()
    {
        switch (state)
        {
            case AIState.Chase:
                MoveTo(player.position);
                if (Vector3.Distance(transform.position, player.position) < attackRange)
                    state = AIState.Attack;
                break;

            case AIState.Attack:
                if (Time.time - lastAttackTime > attackCooldown)
                {
                    // 随机选择攻击模式
                    int pattern = Random.Range(0, 3);
                    animator.SetTrigger($"Attack_{pattern}");
                    lastAttackTime = Time.time;
                }
                break;
        }
    }
}
```

### ⭐ 高级 AI：群体协调

```csharp
public class EnemyManager : MonoBehaviour
{
    private List<EnemyAI> enemies = new();
    private int maxAttackers = 2; // 同时只能 2 个敌人攻击玩家

    public bool RequestAttackPermission(EnemyAI requester)
    {
        int currentAttackers = enemies.Count(e => e.IsAttacking);
        return currentAttackers < maxAttackers;
    }
}
```

> 💡 **来源**：《最后生还者》《刺客信条》等 AAA 游戏标配机制，避免敌人 "围殴" 玩家

---

## 🎨 十一、打击感（Game Feel）

**打击感 = 视觉 + 听觉 + 触觉的综合反馈**，是动作游戏的灵魂。

### 七大要素

| 要素 | 实现 | 推荐度 |
|------|------|---------|
| **顿帧（Hit Stop）** | `Time.timeScale = 0.05f` 持续 0.05-0.1 秒 | ⭐⭐⭐⭐⭐ |
| **屏幕震动** | Cinemachine Impulse | ⭐⭐⭐⭐⭐ |
| **击中特效** | 火花/血液粒子 | ⭐⭐⭐⭐⭐ |
| **击中音效** | 多层叠加（金属+肉感） | ⭐⭐⭐⭐⭐ |
| **手柄震动** | Gamepad.SetMotorSpeeds | ⭐⭐⭐⭐ |
| **击退位移** | 攻击者 + 受击者反向位移 | ⭐⭐⭐⭐ |
| **数字飙血** | DOTween 跳字动画 | ⭐⭐⭐ |

### 顿帧（Hit Stop）实现 ⭐

```csharp
public class HitStop : MonoBehaviour
{
    public static IEnumerator Freeze(float duration)
    {
        Time.timeScale = 0.05f;
        yield return new WaitForSecondsRealtime(duration);
        Time.timeScale = 1f;
    }
}

// 使用
public void OnHit()
{
    StartCoroutine(HitStop.Freeze(0.08f));
}
```

> 💡 **黄金参数**：轻击 0.05s，重击 0.1s，必杀 0.2s

### 屏幕震动（Cinemachine）

```csharp
using Cinemachine;

public class CameraShake : MonoBehaviour
{
    [SerializeField] private CinemachineImpulseSource impulseSource;

    public void Shake(float intensity)
    {
        impulseSource.GenerateImpulse(Vector3.one * intensity);
    }
}
```

### 手柄震动

```csharp
using UnityEngine.InputSystem;

public void RumbleController(float low, float high, float duration)
{
    if (Gamepad.current != null)
    {
        Gamepad.current.SetMotorSpeeds(low, high);
        StartCoroutine(StopRumble(duration));
    }
}
```

---

## 📦 十二、特效与对象池

### VFX 对象池

```csharp
public class VFXPool : MonoBehaviour
{
    private static Dictionary<string, Queue<GameObject>> pools = new();

    public static GameObject Spawn(string id, Vector3 pos, Quaternion rot)
    {
        if (!pools.ContainsKey(id)) pools[id] = new Queue<GameObject>();

        GameObject obj;
        if (pools[id].Count > 0)
        {
            obj = pools[id].Dequeue();
            obj.transform.SetPositionAndRotation(pos, rot);
            obj.SetActive(true);
        }
        else
        {
            obj = Instantiate(Resources.Load<GameObject>($"VFX/{id}"), pos, rot);
        }
        return obj;
    }

    public static void Recycle(string id, GameObject obj)
    {
        obj.SetActive(false);
        pools[id].Enqueue(obj);
    }
}
```

---

## 🎵 十三、音效系统

### 多层音效叠加（提升打击感）

```csharp
public class CombatAudio
{
    public void PlayHitSound(DamageType type, float intensity)
    {
        // 第1层：武器击中音（金属碰撞）
        AudioManager.Play($"Weapon_Hit_{weaponType}");

        // 第2层：受击材质音（皮肉/盔甲/石头）
        AudioManager.Play($"Flesh_{enemyMaterial}", volume: intensity);

        // 第3层：暴击额外音
        if (isCrit) AudioManager.Play("CriticalHit");

        // 第4层：低频冲击音（提升力量感）
        AudioManager.Play("Impact_Low", pitch: Random.Range(0.9f, 1.1f));
    }
}
```

> 💡 **黑魂/只狼** 的剑击音都是 **3-5 层音效叠加** 出来的

---

## 🚀 十四、性能优化要点

| 优化项 | 方法 |
|--------|------|
| **特效对象池** | 避免频繁 Instantiate/Destroy |
| **伤害数字 UI** | UI Toolkit + 对象池 |
| **物理判定** | 攻击瞬间才启用 Collider |
| **AI 更新频率** | 远处敌人降低 Tick 频率（每 0.5 秒一次） |
| **动画 LOD** | 远处敌人用 Animator Culling Mode = Cull Update Transforms |
| **粒子 LOD** | URP Particle System Force Field 控制密度 |

---

## 📚 十五、推荐学习资源

### 必看 GDC 演讲（YouTube）⭐

| 演讲 | 主题 |
|------|------|
| **"The Animation of God of War"** | Root Motion + Hit Reaction |
| **"Sekiro's Sword Combat"**（非官方分析） | 完美格挡设计 |
| **"Devil May Cry 5 - Combat Design"** | 连招系统 |
| **"The Art of Screenshake"** by Jan Willem Nijman | 打击感圣经 |

### Unity 实战教程

| 资源 | 链接 |
|------|------|
| **Code Monkey - Combat System** | YouTube |
| **iHeartGameDev - Souls-like Combat** | YouTube ⭐ |
| **GameDev.tv - RPG Core Combat** | Udemy |
| **Lyger - Animator Combo System** | YouTube |

### Asset Store 战斗框架（避免造轮子）

| 插件 | 推荐度 |
|------|-------|
| **Invector Third Person Controller** | ⭐⭐⭐⭐⭐ 最佳 RPG 战斗框架 |
| **Opsive Ultimate Character Controller** | ⭐⭐⭐⭐ 功能最全 |
| **GameCreator 2 + Melee Module** | ⭐⭐⭐⭐ 可视化开发 |

---

## 🎯 完整 Demo 项目结构

```
Assets/
├── _Project/
│   ├── Scripts/
│   │   ├── Combat/
│   │   │   ├── PlayerCombat.cs
│   │   │   ├── WeaponHitbox.cs
│   │   │   ├── DamageInfo.cs
│   │   │   ├── HealthComponent.cs
│   │   │   ├── ComboSystem.cs
│   │   │   └── HitStop.cs
│   │   ├── Input/
│   │   │   ├── PlayerInputHandler.cs
│   │   │   └── PlayerInput.inputactions
│   │   ├── StateMachine/
│   │   │   ├── StateMachine.cs
│   │   │   ├── States/
│   │   │   │   ├── IdleState.cs
│   │   │   │   ├── MoveState.cs
│   │   │   │   ├── AttackState.cs
│   │   │   │   └── DodgeState.cs
│   │   ├── AI/
│   │   │   ├── EnemyAI.cs
│   │   │   ├── EnemyManager.cs
│   │   │   └── BehaviorTrees/
│   │   ├── Camera/
│   │   │   └── TargetLockSystem.cs
│   │   ├── Feedback/
│   │   │   ├── CameraShake.cs
│   │   │   ├── VFXPool.cs
│   │   │   └── DamageNumberUI.cs
│   ├── Animations/
│   │   ├── Player/
│   │   ├── Enemies/
│   │   └── AnimatorControllers/
│   ├── Prefabs/
│   │   ├── Characters/
│   │   ├── Weapons/
│   │   └── VFX/
│   └── ScriptableObjects/
│       ├── WeaponData/
│       ├── CharacterStats/
│       └── ComboData/
```

---

## ✅ 实现检查清单（Checklist）

### 基础功能
- [ ] 输入系统接入（Input System）
- [ ] 输入缓冲（0.2 秒窗口）
- [ ] 状态机搭建（Idle/Move/Attack/Hit/Dead）
- [ ] 基础 3 连击
- [ ] 武器 Trigger 命中判定
- [ ] 伤害计算 + 受击反应

### 手感打磨
- [ ] 顿帧（Hit Stop）
- [ ] 摄像机震动（Cinemachine Impulse）
- [ ] 击中特效（粒子 + Decal）
- [ ] 多层击中音效
- [ ] 手柄震动反馈
- [ ] 伤害数字飘字

### 进阶系统
- [ ] 目标锁定（Lock-On）
- [ ] 闪避 + 无敌帧
- [ ] 格挡 + 完美格挡
- [ ] 削韧机制（Poise）
- [ ] Root Motion 攻击位移
- [ ] 武器 Trail 拖尾效果

### AI 系统
- [ ] 敌人状态机 / 行为树
- [ ] 视野检测（FOV）
- [ ] 群体攻击协调
- [ ] 攻击模式随机化

---

## 🔗 相关文档

- [[Unity_Animation_Architecture]] - Unity 动画系统架构
- [[Unity_Physics_Architecture]] - Unity 物理系统架构
- [[Unity_CSharp_Scripting_Architecture]] - C# 脚本架构
- [[Unity_Particle_Architecture]] - 粒子特效系统
- [[Unity_Audio_Architecture]] - 音频系统架构
- [[Unity_Performance_Optimization]] - 性能优化
- [[Unity_MOC]] - Unity 知识地图
