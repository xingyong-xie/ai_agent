---
title: Cocos Creator 3.x 核心架构
created: 2026-06-08
updated: 2026-06-08
tags: [游戏, Cocos, 架构, 引擎核心]
---

# Cocos Creator 3.x 核心架构

## 一、引擎整体架构

```
Cocos Creator 3.x 架构
    │
    ├── 核心层 (Core)
    │       ├── 对象管理 (RefCounted/CCObject)
    │       ├── 事件系统 (EventTarget)
    │       ├── 资源管理 (AssetManager)
    │       ├── Math / Vec3 / Mat4 / Quat
    │       └── 容器/工具函数
    │
    ├── 场景层 (Scene Graph)
    │       ├── Node（节点）
    │       ├── Component（组件）
    │       ├── Scene（场景）
    │       └── Entity-Component 模式
    │
    ├── 渲染系统 (Cocos Renderer)
    │       ├── Cocos2d 渲染 (2D)
    │       ├── Cocos3d 渲染 (3D)
    │       ├── 渲染管线
    │       ├── 材质系统 (Material)
    │       ├── 效果系统 (Effect)
    │       └── Spine/DragonBones 支持
    │
    ├── 编辑器层 (Editor)
    │       ├── 场景编辑器 (2D/3D)
    │       ├── 资源管理器
    │       ├── 动画编辑器
    │       ├── UI 编辑器
    │       ├── 材质编辑器
    │       └── 构建发布面板
    │
    └── 平台发布层
            ├── Web (H5 / 小游戏)
            ├── Android / iOS
            ├── Windows / macOS
            ├── 微信小游戏 / 支付宝小游戏
            ├── 字节跳动小游戏 / OPPO / vivo
            └── 原生引擎 (Native)
```

## 二、核心设计理念

### 2.1 组件化架构 (Component-Based)

```
Node + Component 模式
    │
    ├── Node（节点）
    │       ├── 位置/旋转/缩放 (Transform)
    │       ├── 父子层级
    │       ├── 名称/UUID
    │       └── 活跃状态 (active)
    │
    └── Component（组件）
            ├── 挂载在节点上的功能模块
            ├── 生命周期回调
            ├── 编辑器属性序列化
            └── ccclass 装饰器声明
```

```typescript
// 组件声明示例
import { _decorator, Component, Node, Vec3, Animation } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {
    // 编辑器属性
    @property({ type: Node })
    targetNode: Node | null = null;

    @property({ type: Number })
    speed: number = 200;

    @property
    isPlayer: boolean = false;

    // 私有属性
    private _anim: Animation | null = null;

    // 生命周期
    onLoad() {
        // 初始化（类似 Unity Awake）
        this._anim = this.getComponent(Animation);
    }

    start() {
        // 第一帧前调用（类似 Unity Start）
        console.log('Game started');
    }

    update(deltaTime: number) {
        // 每帧调用（类似 Unity Update）
        const pos = this.node.position.clone();
        pos.x += this.speed * deltaTime;
        this.node.position = pos;
    }

    lateUpdate(deltaTime: number) {
        // 所有 update 后调用
    }

    onDestroy() {
        // 组件销毁时
    }
}
```

### 2.2 组件生命周期

```
组件生命周期 (Cocos Creator)
    │
    ├── onLoad()
    │       ├── 节点首次激活时调用
    │       ├── 保证所有组件和节点树已建立
    │       └── 适合: getComponent, 初始化引用
    │
    ├── onEnable()
    │       ├── enabled 变为 true 时
    │       └── 或父节点 active 变为 true
    │
    ├── start()
    │       ├── 第一次 update 前调用
    │       ├── 比 onLoad 延迟一帧
    │       └── 适合: 依赖于其他组件已初始化的逻辑
    │
    ├── update(dt)
    │       ├── 每帧调用
    │       └── 适合: 游戏逻辑更新
    │
    ├── lateUpdate(dt)
    │       ├── 所有 update 后调用
    │       └── 适合: 相机跟随
    │
    ├── onDisable()
    │       └── enabled 或 active 变为 false
    │
    └── onDestroy()
            └── 组件/节点销毁
```

## 三、场景与节点系统

### 3.1 场景层级

```
场景 (Scene) ── 游戏关卡/界面的容器
    │
    ├── Canvas（2D 渲染根节点）
    │       ├── Widget（对齐布局）
    │       ├── Sprite（精灵）
    │       ├── Label（文本）
    │       ├── Button（按钮）
    │       └── ...
    │
    ├── 3D 节点
    │       ├── Camera（相机）
    │       ├── Light（光源）
    │       ├── MeshRenderer（网格渲染）
    │       ├── Model（模型）
    │       └── ParticleSystem（粒子）
    │
    └── 其他
            ├── AudioSource（音源）
            ├── Animation（动画）
            ├── UITransform（UI 变换）
            └── Collider（碰撞体）
```

### 3.2 节点操作 API

```typescript
// 节点的创建与操作
const { Node, Vec3 } = cc;

// 创建节点
const node = new Node('MyNode');
this.node.addChild(node);

// 查找节点
const child = this.node.getChildByName('ChildName');
const child2 = this.node.getChildByPath('a/b/c');
const target = find('Canvas/Button');  // 全局查找

// Transform 操作
node.setPosition(100, 200, 0);
node.setRotationFromEuler(0, 0, 45);
node.setScale(2, 2, 2);
node.setWorldPosition(new Vec3(10, 20, 30));

// 平移/旋转
node.translate(new Vec3(100, 0, 0));
node.rotate(90, new Vec3(0, 0, 1));

// 父子关系
node.parent = parentNode;
node.removeFromParent();
node.destroy();  // 销毁
```

## 四、脚本与资源系统

### 4.1 TypeScript 脚本架构

```typescript
// 组件间通信方式

// 1. 直接引用
@property({ type: PlayerController })
player: PlayerController | null = null;

// 2. getComponent
const anim = this.getComponent(Animation);
const list = this.getComponents(Animation);

// 3. 事件系统
// 发射事件
this.node.emit('custom-event', arg1, arg2);
// 监听事件
this.node.on('custom-event', this.onCustomEvent, this);
// 一次性监听
this.node.once('custom-event', this.onCustomEvent, this);
// 关闭监听
this.node.off('custom-event', this.onCustomEvent, this);

// 4. 全局事件
EventTarget.dispatchEvent('global-event');
EventTarget.on('global-event', callback, this);

// 5. cc.director 事件
director.on(cc.Director.EVENT_AFTER_UPDATE, callback);
```

### 4.2 资源管理

```typescript
// 资源加载（Cocos Creator 3.x）
import { resources, assetManager, Asset } from 'cc';

// 同步加载
const prefab = resources.get('prefabs/Player', Prefab);

// 异步加载
resources.load('prefabs/Player', Prefab, (err, prefab) => {
    if (!err) {
        const node = instantiate(prefab);
        this.node.addChild(node);
    }
});

// Promise 方式
async loadPrefab() {
    try {
        const prefab = await new Promise<Prefab>((resolve, reject) => {
            resources.load('prefabs/Player', Prefab, (err, asset) => {
                err ? reject(err) : resolve(asset);
            });
        });
        return instantiate(prefab);
    } catch (e) {
        console.error('加载失败', e);
        return null;
    }
}

// 场景切换
director.loadScene('Level2');
director.preloadScene('Level3', () => {
    console.log('场景预加载完成');
});

// Bundle 管理（分包）
assetManager.loadBundle('game', (err, bundle) => {
    bundle.load('textures/icon', SpriteFrame, (err, spriteFrame) => {
        this.sprite.spriteFrame = spriteFrame;
    });
});
```

## 五、渲染系统

### 5.1 渲染管线架构

```
Cocos Creator 渲染系统
    │
    ├── 2D 渲染
    │       ├── Canvas 渲染
    │       ├── Sprite 精灵渲染
    │       ├── Label 文本渲染
    │       ├── Graphics 矢量渲染
    │       ├── Spine / DragonBones 骨骼动画
    │       └── Particle2D
    │
    ├── 3D 渲染
    │       ├── Forward Rendering（前向渲染）
    │       ├── PBR 材质流水线
    │       ├── 光源 (Directional/Point/Spot)
    │       ├── 阴影 (Shadow Map)
    │       ├── 雾效 (Fog)
    │       └── 后处理 (HDR/Bloom/Tonemapping)
    │
    └── 底层
            ├── GFX (Graphics Abstraction Layer)
            ├── WebGL 1.0 / 2.0
            ├── Vulkan / Metal
            └── OpenGL ES 3.0
```

### 5.2 材质与 Effect 系统

```
Material + Effect 系统
    │
    ├── Effect (.effect 文件)
    │       ├── 着色器代码 (GLSL)
    │       ├── Pass 定义 (渲染通道)
    │       ├── 属性定义
    │       └── 渲染状态设置
    │
    ├── Material（材质实例）
    │       ├── 引用 Effect
    │       ├── 设置属性值
    │       ├── 运行时修改
    │       └── 支持多 Pass
    │
    └── 内置材质
            ├── builtin-standard (PBR 标准)
            ├── builtin-unlit (无光照)
            ├── sprite (2D 精灵)
            └── particles (粒子)
```

## 六、UI 系统

### 6.1 UI 组件

```
Cocos UI 系统
    │
    ├── Canvas（画布根节点）
    │       ├── RenderMode: Overlay / Camera / World
    │       └── 自动适配屏幕分辨率
    │
    ├── Widget（对齐组件）
    │       ├── 左/右/上/下对齐
    │       ├── 百分比/像素偏移
    │       └── 适配不同屏幕尺寸
    │
    ├── 基础控件
    │       ├── Sprite（精灵/图片）
    │       ├── Label（文本）
    │       ├── Button（按钮）
    │       ├── Toggle（开关）
    │       ├── Slider（滑动条）
    │       ├── ProgressBar（进度条）
    │       ├── EditBox（输入框）
    │       ├── ScrollView（滚动视图）
    │       └── RichText（富文本）
    │
    └── 布局组件
            ├── Layout（自动排列）
            ├── UIOpacity（透明度控制）
            └── UITransform（UI 变换）
```

### 6.2 UI 适配策略

```typescript
// 多分辨率适配
// Project Settings → Project Config → Design Resolution

// 适配模式
// 1. FIXED_WIDTH  ── 固定宽度适配
// 2. FIXED_HEIGHT ── 固定高度适配
// 3. SHOW_ALL     ── 显示全部内容（可能有黑边）
// 4. EXACT_FIT    ── 拉伸填充

// Widget 对齐代码
const widget = this.node.getComponent(Widget);
widget.isAlignLeft = true;
widget.left = 20;          // 距左 20px
widget.isAlignRight = true;
widget.right = 20;         // 距右 20px
widget.isAlignTop = true;
widget.top = 10;           // 距顶 10px
widget.isAlignBottom = true;
widget.bottom = 10;        // 距底 10px
```

## 七、动画系统

### 7.1 动画架构

```
Cocos 动画系统
    │
    ├── Animation 组件
    │       ├── 挂载在节点上
    │       ├── 管理 AnimationClip
    │       └── 控制播放/暂停/停止
    │
    ├── AnimationClip（动画片段）
    │       ├── 属性动画
    │       ├── 关键帧
    │       ├── 曲线 (Linear/Step/Bezier)
    │       └── 事件
    │
    └── 动画类型
            ├── 节点属性动画 (position/rotation/scale)
            ├── 组件属性动画 (color/opacity)
            ├── 骨骼动画 (Spine/DragonBones)
            ├── 模型动画 (FBX 导入)
            └── 帧动画 (SpriteSheet)
```

```typescript
// 动画控制
const anim = this.node.getComponent(Animation);

// 播放
anim.play('walk');
anim.play('run', 0.5);      // 从 50% 开始播放

// 控制
anim.pause();
anim.resume();
anim.stop();

// 交叉淡入
anim.crossFade('run', 0.3);  // 0.3 秒过渡

// 事件
anim.on(Animation.EventType.PLAY, () => {});
anim.on(Animation.EventType.STOP, () => {});
anim.on(Animation.EventType.FINISHED, () => {});

// 创建程序化动画 (Tween)
import { tween } from 'cc';

tween(this.node)
    .to(1.0, { position: new Vec3(100, 200, 0) })
    .to(0.5, { scale: new Vec3(2, 2, 2) })
    .call(() => { console.log('完成'); })
    .start();
```

## 八、物理系统

### 8.1 物理引擎

```
Cocos 物理系统
    │
    ├── 2D 物理 (Box2D)
    │       ├── RigidBody2D（刚体）
    │       ├── Collider2D（碰撞体）
    │       │       ├── BoxCollider2D
    │       │       ├── CircleCollider2D
    │       │       ├── PolygonCollider2D
    │       │       └── ChainCollider2D
    │       ├── PhysicsJoint2D（关节）
    │       └── Contact（碰撞回调）
    │
    └── 3D 物理 (PhysX / Bullet / Cannon.js)
            ├── RigidBody（刚体）
            ├── Collider（碰撞体）
            │       ├── BoxCollider
            │       ├── SphereCollider
            │       ├── CapsuleCollider
            │       ├── CylinderCollider
            │       ├── ConeCollider
            │       └── MeshCollider
            ├── ConstantForce（恒力）
            └── Trigger（触发器）
```

### 8.2 碰撞处理

```typescript
// 开启物理分组碰撞
// Project Settings → Physics → Collision Matrix

// 碰撞回调
@Component
export class Player extends Component {
    // 注册碰撞事件
    onLoad() {
        const collider = this.getComponent(Collider);
        collider.on('onTriggerEnter', this.onTriggerEnter, this);
        collider.on('onTriggerStay', this.onTriggerStay, this);
        collider.on('onTriggerExit', this.onTriggerExit, this);
        collider.on('onCollisionEnter', this.onCollisionEnter, this);
    }
    
    onTriggerEnter(other: Collider) {
        console.log('触发器进入:', other.node.name);
    }
    
    onCollisionEnter(event: ICollisionEvent) {
        console.log('碰撞:', event.otherCollider.node.name);
    }
}
```

## 九、音频系统

| 组件 | 说明 |
|------|------|
| **AudioSource** | 音源组件，挂载到节点上播放音频 |
| **AudioClip** | 音频资源 (mp3/ogg/wav/aac) |
| **AudioListener** | 听者（3D 音效时使用） |

```typescript
const audioSource = this.node.getComponent(AudioSource);
// 或
import { AudioClip, resources } from 'cc';

// 播放
audioSource.play();
audioSource.playOneShot(audioClip, 1.0);  // 一次性播放

// 控制
audioSource.pause();
audioSource.resume();
audioSource.stop();

// 属性
audioSource.volume = 0.5;      // 音量
audioSource.loop = true;       // 循环
audioSource.clip = audioClip;  // 设置片段

// 全局音频管理器
import { sys } from 'cc';
sys.__audioManager?.setMusicVolume(0.5);
sys.__audioManager?.setEffectVolume(0.8);
```

## 十、小游戏生态（核心优势）

### 10.1 平台支持

```
Cocos Creator 的小游戏优势
    │
    ├── 微信小游戏
    │       ├── 一键发布到微信开发者工具
    │       ├── 微信开放数据域
    │       ├── 微信登录/支付/云开发
    │       └── SubContext 排行榜
    │
    ├── 字节跳动小游戏
    │       └── 抖音/头条平台
    │
    ├── 支付宝小游戏
    │
    ├── OPPO / vivo / 华为小游戏
    │
    └── H5 (HTML5)
            ├── 手机浏览器
            └── Facebook Instant Game
```

### 10.2 引擎包体优化

| 优化项 | 说明 |
|-------|------|
| **引擎模块裁剪** | 按需移除未使用的引擎模块 |
| **Asset Bundle 分包** | 按功能分包，按需下载 |
| **Texture 压缩** | ASTC/ETC2/PVRTC 格式适配 |
| **静态合并** | SpriteFrame 自动合图 |
| **远程资源** | 资源放置 CDN，运行时加载 |
| **代码压缩** | 混淆/压缩 JS 代码 |
| **首包控制** | 首包 < 4MB（微信要求） |

## 十一、Cocos vs 其他引擎对比

| 维度 | Cocos Creator 3.x | Unity | Unreal 5 |
|------|------------------|-------|----------|
| **核心市场** | 小游戏 / H5 / 手游 | 手游 / PC/主机 | 3A 大作 |
| **脚本语言** | TypeScript / JavaScript | C# | C++ / 蓝图 |
| **2D 能力** | ★★★★★ | ★★★★ | ★★★ |
| **3D 能力** | ★★★ 发展中 | ★★★★ | ★★★★★ |
| **小游戏** | ★★★★★ 最强 | ★★ | ✘ |
| **Web 导出** | ★★★★★ 原生 | ★★★ | ★★ |
| **包体大小** | 极小 (1~5MB) | 较大 (20~100MB) | 巨大 |
| **学习曲线** | ★★ 平缓 | ★★★ | ★★★★★ |
| **免费程度** | 完全免费 | 收入分成 | 收入分成 |
| **国内生态** | ★★★★★ 最强 | ★★★★ | ★★★ |
| **渲染画质** | ★★★ | ★★★★ | ★★★★★ |
| **编辑器体验** | ★★★ 简洁 | ★★★★★ | ★★★★ |

---

*本文档基于 Cocos Creator 3.8+ 整理*
