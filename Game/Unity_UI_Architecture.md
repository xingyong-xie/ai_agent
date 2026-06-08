---
title: Unity UI 系统架构
created: 2026-06-08
updated: 2026-06-08
tags: [游戏, Unity, 架构, UI系统]
---

# Unity UI 系统架构

## 一、UI 系统整体架构

```
Unity UI 系统 (UGUI)
    │
    ├── Canvas（画布）—— UI 根容器
    │       ├── Screen Space - Overlay（覆盖模式）
    │       ├── Screen Space - Camera（相机模式）
    │       └── World Space（世界空间模式）
    │
    ├── RectTransform（UI 变换组件）
    │       ├── Anchors（锚点）
    │       ├── Pivot（轴心）
    │       └── Offset（偏移）
    │
    ├── Visual Components（可视化组件）
    │       ├── Text / TextMeshPro（文本）
    │       ├── Image / RawImage（图片）
    │       ├── Mask（遮罩）
    │       └── Outline / Shadow（特效）
    │
    ├── Interaction Components（交互组件）
    │       ├── Button（按钮）
    │       ├── Toggle（开关）
    │       ├── Slider（滑动条）
    │       ├── Scrollbar / ScrollRect（滚动）
    │       ├── Dropdown（下拉菜单）
    │       ├── InputField（输入框）
    │       └── Selectable（基类）
    │
    ├── Layout System（布局系统）
    │       ├── Horizontal Layout Group（水平布局）
    │       ├── Vertical Layout Group（垂直布局）
    │       ├── Grid Layout Group（网格布局）
    │       ├── Layout Element（布局元素）
    │       └── Content Size Fitter（自适应）
    │
    └── Event System（事件系统）
            ├── EventSystem（管理器）
            ├── Standalone Input Module（输入模块）
            ├── Graphic Raycaster（射线检测）
            └── Physics Raycaster（物理射线）
```

## 二、Canvas 渲染模式

### 2.1 三种渲染模式对比

| 模式 | 说明 | 适用场景 | 特点 |
|------|------|---------|------|
| **Screen Space - Overlay** | 屏幕覆盖 | 主菜单、HUD、对话 | UI 永远在最上层；无需 Camera |
| **Screen Space - Camera** | 相机渲染 | 带特效的 UI | 可叠加后处理效果；需指定 Camera |
| **World Space** | 世界空间 | 3D 世界中的 UI | 可交互的 3D 对象；支持物理碰撞 |

```
Screen Space - Overlay:
┌─────────────────────────────────┐
│           Canvas                 │
│  ┌───────────┐  ┌───────────┐   │
│  │  HP Bar   │  │ Ammo      │   │
│  └───────────┘  └───────────┘   │
│                                 │
│      3D 场景 (在 Canvas 下层)     │
│                                 │
└─────────────────────────────────┘

Screen Space - Camera:
    Camera
      │
      ▼
  ┌─────────┐
  │ Canvas  │  ── 附着在 Camera 平面
  └─────────┘
      │
      ▼
  3D 场景（先渲染）
      然后 Camera 渲染 UI

World Space:
        ┌──────────┐
        │  Canvas  │  ── 场景中的 3D 对象
        │ ┌──────┐ │
        │ │ HP   │ │
        │ └──────┘ │
        └──────────┘
          ↑
      放置在 3D 坐标中
```

## 三、RectTransform 架构

### 3.1 RectTransform 锚点系统

```
锚点预设 (Anchor Presets)
    │
    ├── 固定锚点
    │       │
    │       ├── Top-Left ─── 左上角固定
    │       ├── Top-Center ─ 顶部居中
    │       ├── Top-Right ── 右上角固定
    │       ├── Middle-Left ─ 中间靠左
    │       ├── Center ───── 屏幕中心（默认）
    │       ├── Middle-Right ─ 中间靠右
    │       ├── Bottom-Left ─ 左下角固定
    │       ├── Bottom-Center ─ 底部居中
    │       └── Bottom-Right ─ 右下角固定
    │
    └── 拉伸锚点
            │
            ├── Stretch-Top ──── 水平拉伸，顶部固定
            ├── Stretch-Middle ─ 水平拉伸，垂直居中
            ├── Stretch-Bottom ─ 水平拉伸，底部固定
            ├── Stretch-Left ─── 垂直拉伸，左侧固定
            ├── Stretch-Right ── 垂直拉伸，右侧固定
            └── Stretch-Full ─── 全方向拉伸

```csharp
// RectTransform 关键属性
RectTransform rect = GetComponent<RectTransform>();

rect.anchorMin = new Vector2(0, 0);    // 锚点左下
rect.anchorMax = new Vector2(1, 1);    // 锚点右上
rect.offsetMin = new Vector2(10, 10);  // 下/左边距
rect.offsetMax = new Vector2(-10, -10);// 上/右边距
rect.pivot = new Vector2(0.5f, 0.5f); // 轴心（居中）
rect.sizeDelta = new Vector2(100, 50);// 尺寸偏移
```

### 3.2 锚点自适应原理

```
┌──────────────────────────────────────┐
│  Canvas                              │
│  ┌────────────────────────────────┐  │
│  │    Anchor (Stretch - Full)     │  │
│  │  ┌──────────────────────────┐  │  │
│  │  │      UI Element          │  │  │
│  │  └──────────────────────────┘  │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘

当 Canvas 缩放时：
    ├── 固定锚点 → 元素保持到锚点的距离
    └── 拉伸锚点 → 元素随 Canvas 按比例缩放
```

## 四、UI 组件体系

### 4.1 可视化组件

| 组件 | 用途 | 关键属性 |
|------|------|---------|
| **Text** | 文本显示（旧版） | text, font, fontSize, color, alignment |
| **TextMeshPro (TMP)** | 高质量文本（推荐） | text, fontAsset, fontSize, color, alignment |
| **Image** | 图片显示 | sprite, color, material, imageType(Simple/Sliced/Tiled/Filled) |
| **RawImage** | 原始纹理显示 | texture, uvRect |
| **Mask** | 遮罩裁剪子对象 | showMaskGraphic |
| **RectMask2D** | 矩形裁剪（性能好） | 无额外渲染 |

### 4.2 交互组件层级

```
Selectable (基类)
    │
    ├── 状态体系
    │       ├── Normal（正常）
    │       ├── Highlighted（悬停）
    │       ├── Pressed（按下）
    │       ├── Selected（选中）
    │       └── Disabled（禁用）
    │
    ├── 过渡方式
    │       ├── Color Tint（颜色变化）
    │       ├── Sprite Swap（图片切换）
    │       └── Animation（动画触发）
    │
    └── 子类组件
            ├── Button ──── onClick 事件
            ├── Toggle ──── onValueChanged 事件
            ├── Slider ──── onValueChanged 事件
            ├── Scrollbar ─ onValueChanged 事件
            ├── Dropdown ── onValueChanged 事件
            └── InputField ─ onEndEdit, onValueChanged 事件
```

### 4.3 Button 事件绑定

```csharp
public class UIManager : MonoBehaviour
{
    public Button startButton;
    public Button quitButton;
    public Toggle soundToggle;
    public Slider volumeSlider;

    void Start()
    {
        // 方法一：代码绑定
        startButton.onClick.AddListener(OnStartGame);
        startButton.onClick.AddListener(() => Debug.Log("开始游戏"));

        // 方法二：RemoveListener
        startButton.onClick.RemoveListener(OnStartGame);
        startButton.onClick.RemoveAllListeners();

        // Toggle 事件
        soundToggle.onValueChanged.AddListener(OnSoundToggle);

        // Slider 事件
        volumeSlider.onValueChanged.AddListener(OnVolumeChange);
    }

    void OnStartGame() { /* 加载游戏场景 */ }
    void OnSoundToggle(bool isOn) { AudioListener.volume = isOn ? 1 : 0; }
    void OnVolumeChange(float value) { AudioListener.volume = value; }
}
```

## 五、布局系统

### 5.1 布局组件

| 组件 | 说明 | 适用场景 |
|------|------|---------|
| **Horizontal Layout Group** | 水平排列子元素 | 按钮栏、标签栏 |
| **Vertical Layout Group** | 垂直排列子元素 | 列表、菜单 |
| **Grid Layout Group** | 网格排列子元素 | 背包、图鉴、关卡选择 |
| **Layout Element** | 强制布局元素尺寸 | 自定义布局控制 |
| **Content Size Fitter** | 根据内容自适应尺寸 | 文本框、聊天框 |
| **Aspect Ratio Fitter** | 保持宽高比 | 图片容器 |

### 5.2 布局属性

```csharp
// Vertical Layout Group 配置
VerticalLayoutGroup layout = GetComponent<VerticalLayoutGroup>();
layout.padding = new RectOffset(10, 10, 10, 10);  // 内边距
layout.spacing = 5f;                                // 间距
layout.childAlignment = TextAnchor.MiddleCenter;    // 对齐
layout.childControlSize = true;                     // 控制大小
layout.childForceExpand = true;                     // 强制扩展

// Content Size Fitter
ContentSizeFitter fitter = GetComponent<ContentSizeFitter>();
fitter.horizontalFit = ContentSizeFitter.FitMode.PreferredSize;
fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
```

## 六、事件系统架构

### 6.1 事件系统组件

| 组件 | 功能 |
|------|------|
| **EventSystem** | 事件系统核心，处理输入和事件分发 |
| **Standalone Input Module** | 键盘/鼠标/触摸输入处理 |
| **Touch Input Module** | 移动端触摸输入（已废弃） |
| **Input System UI Input Module** | 新输入系统模式下使用 |
| **Graphic Raycaster** | UI 射线碰撞检测（UGUI）|
| **Physics Raycaster** | 3D 物理射线检测 |
| **Physics2D Raycaster** | 2D 物理射线检测 |

### 6.2 事件接口

```csharp
// 实现拖拽接口
public class DragHandler : MonoBehaviour, 
    IBeginDragHandler, IDragHandler, IEndDragHandler
{
    public void OnBeginDrag(PointerEventData eventData)
    {
        // 开始拖拽
    }

    public void OnDrag(PointerEventData eventData)
    {
        // 拖拽中
        transform.position = eventData.position;
    }

    public void OnEndDrag(PointerEventData eventData)
    {
        // 结束拖拽
    }
}

// 全部指针事件接口
// IPointerEnterHandler  ── 指针进入
// IPointerExitHandler   ── 指针离开
// IPointerDownHandler   ── 指针按下
// IPointerUpHandler     ── 指针抬起
// IPointerClickHandler  ── 指针点击
// IBeginDragHandler     ── 开始拖拽
// IDragHandler          ── 拖拽中
// IEndDragHandler       ── 结束拖拽
// IDropHandler          ── 放置
// IScrollHandler        ── 滚轮
```

## 七、UI 性能优化

### 7.1 批次合并 (Batching)

```
Canvas 渲染批次
    │
    ├── Batch 合并条件
    │       ├── 同一 Canvas 下
    │       ├── 同一材质/Material
    │       ├── 同一纹理/Atlas
    │       └── 渲染顺序连续
    │
    └── 打断 Batch 的因素
            ├── 不同材质/纹理
            ├── 嵌套不同 Canvas
            ├── RectTransform 层级变化
            └── Mask / 矩形裁剪
```

### 7.2 优化策略

| 优化方法 | 说明 | 效果 |
|---------|------|------|
| **图集 (Sprite Atlas)** | 合并小图到大图 | 减少 Draw Call |
| **减少 Canvas 数量** | 避免过多的 Canvas | 减少重建次数 |
| **静态 UI** | 不变部分从 Layout 剥离 | 减少布局计算 |
| **对象池** | 复用 UI 元素 | 减少创建/销毁开销 |
| **禁用不可见 UI** | 隐藏时用 SetActive(false) | 减少每帧更新 |
| **文本缓存** | TextMeshPro 预生成 | 减少运行时字符生成 |
| **Canvas 层级规划** | 相近材质/纹理放同一 Canvas | 优化 Batch 合并 |

---

*本文档基于 Unity 6 (2024 LTS) 整理*
