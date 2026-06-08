---
title: Unity 音频系统架构
created: 2026-06-08
updated: 2026-06-08
tags: [游戏, Unity, 架构, 音频系统]
---

# Unity 音频系统架构

## 一、音频系统整体架构

```
Unity 音频系统
    │
    ├── AudioSource（音源）—— 发声者
    │       ├── 3D 音源（空间音频）
    │       ├── 2D 音源（全局声音）
    │       └── 混合模式
    │
    ├── AudioListener（听者）—— 接收者
    │       ├── 通常在 Camera 上
    │       └── 场景中只能有一个活跃
    │
    ├── AudioClip（音频片段）—— 音频数据
    │       ├── 导入设置 (Load Type/Format)
    │       ├── 压缩类型
    │       └── 加载策略
    │
    ├── AudioMixer（音频混合器）
    │       ├── Groups（分组）
    │       ├── Snapshot（快照）
    │       ├── Effects（效果器）
    │       └── Send/Return（发送/返回）
    │
    └── Spatial Audio（空间音频）
            ├── 距离衰减
            ├── 多普勒效应
            └── 环境混响
```

## 二、三要素核心架构

### 2.1 AudioSource（音源）

```
AudioSource
    │
    ├── 基本属性
    │       ├── AudioClip ── 播放的音频文件
    │       ├── Output ──── 输出到 AudioMixer Group
    │       ├── Mute ────── 静音
    │       ├── Bypass FX ── 绕过效果器
    │       └── Play On Awake ── 启动时播放
    │
    ├── 3D 音频设置
    │       ├── Spatial Blend ── 3D/2D 混合比例 (0=2D, 1=3D)
    │       ├── Min Distance ─── 最小距离（音量最大）
    │       ├── Max Distance ─── 最大距离（听不见）
    │       ├── Spread ───────── 声场扩散角度
    │       ├── Doppler Level ── 多普勒效应强度
    │       └── Volume Rolloff ── 衰减模式
    │               ├── Logarithmic（对数衰减）── 现实感
    │               └── Linear（线性衰减）────── 可预测
    │
    └── 播放控制
            ├── Play / Stop / Pause / UnPause
            ├── PlayOneShot ── 播放一次（可叠加）
            ├── PlayClipAtPoint ── 在位置播放（自动创建隐藏音源）
            └── time / timeSamples ── 播放进度
```

### 2.2 AudioListener（听者）

```
AudioListener
    │
    ├── 场景中必须存在且唯一
    ├── 默认挂载在主 Camera 上
    ├── 决定 3D 音源的空间定位
    │
    └── 工作原理
            ├── 计算音源到听者的距离 → 音量衰减
            ├── 计算音源到听者的方向 → 立体声/环绕定位
            ├── 计算相对速度 → 多普勒效应
            └── 障碍物计算 → 遮挡效果
```

### 2.3 AudioClip（音频数据）

| 属性 | 说明 | 建议 |
|------|------|------|
| **Load Type** | 加载方式 | 长音乐流式加载，短音效 Decompress |
| **Compression Format** | 压缩格式 | PCM（无损）/ Vorbis（压缩）/ ADPCM（语音） |
| **Quality** | Vorbis 质量 | 0~100，音效用 80%~100%，对话用 60%~80% |
| **Force To Mono** | 强制单声道 | 3D 音效推荐单声道 |
| **Load In Background** | 后台加载 | 大文件勾选，避免卡顿 |

## 三、音频播放 API

```csharp
public class AudioManager : MonoBehaviour
{
    public AudioSource musicSource;
    public AudioSource sfxSource;
    public AudioClip bgmClip;
    public AudioClip[] sfxClips;

    void Start()
    {
        // 播放背景音乐（循环）
        musicSource.clip = bgmClip;
        musicSource.loop = true;
        musicSource.Play();
    }

    // 播放音效（可叠加）
    public void PlaySFX(int index)
    {
        sfxSource.PlayOneShot(sfxClips[index]);
    }

    // 在世界空间播放
    public void PlayAtPoint(AudioClip clip, Vector3 position)
    {
        // 自动创建 GameObject，播放后销毁
        AudioSource.PlayClipAtPoint(clip, position, volume: 1.0f);
    }

    // 控制
    public void PauseAll()
    {
        musicSource.Pause();
        sfxSource.Pause();
    }

    public void ResumeAll()
    {
        musicSource.UnPause();
        sfxSource.UnPause();
    }

    public void StopAll()
    {
        musicSource.Stop();
        sfxSource.Stop();
    }

    // 淡入淡出
    public IEnumerator FadeOut(float duration)
    {
        float startVolume = musicSource.volume;
        while (musicSource.volume > 0)
        {
            musicSource.volume -= startVolume * Time.deltaTime / duration;
            yield return null;
        }
        musicSource.Stop();
        musicSource.volume = startVolume;
    }
}
```

## 四、AudioMixer 混合器架构

### 4.1 混合器层级结构

```
AudioMixer
    │
    └── Master Group（主控组）
            │
            ├── Music Group（音乐组）
            │       ├── BGM Sub-Group
            │       └── Ambience Sub-Group
            │
            ├── SFX Group（音效组）
            │       ├── Footstep Sub-Group
            │       ├── Weapon Sub-Group
            │       └── UI Sub-Group
            │
            └── Voice Group（语音组）
                    ├── Dialogue Sub-Group
                    └── Character Voice Sub-Group
```

### 4.2 快照系统 (Snapshot)

```
Snapshot（音频快照）—— 状态预设
    │
    ├── Default (默认状态)
    │       ├── Master: 0dB
    │       ├── Music: -6dB
    │       ├── SFX: 0dB
    │       └── Voice: 0dB
    │
    ├── Paused (暂停状态)
    │       ├── Master: -6dB
    │       ├── Music: -20dB
    │       ├── SFX: -10dB
    │       └── Voice: 0dB
    │
    └── LowHealth (低血量状态)
            ├── Master: -3dB
            ├── Music: -12dB (低通滤波)
            ├── SFX: 0dB
            └── Voice: 0dB
```

```csharp
public class AudioMixerController : MonoBehaviour
{
    public AudioMixer audioMixer;
    public AudioMixerSnapshot defaultSnapshot;
    public AudioMixerSnapshot pausedSnapshot;
    public AudioMixerSnapshot lowHealthSnapshot;

    // 切换快照（带过渡时间）
    public void SwitchToPaused()
    {
        pausedSnapshot.TransitionTo(transitionTime: 0.5f);
    }

    public void SwitchToDefault()
    {
        defaultSnapshot.TransitionTo(1.0f);
    }

    // 通过暴露参数控制
    public void SetMasterVolume(float volume)
    {
        // volume 范围: 0.001 ~ 1.0
        audioMixer.SetFloat("MasterVolume", Mathf.Log10(volume) * 20);
    }

    public void SetMusicVolume(float volume)
    {
        audioMixer.SetFloat("MusicVolume", Mathf.Log10(volume) * 20);
    }
}
```

### 4.3 效果器 (Effects)

| 效果器 | 说明 | 适用场景 |
|-------|------|---------|
| **Lowpass (低通滤波)** | 减弱高频 | 水下、隔墙效果 |
| **Highpass (高通滤波)** | 减弱低频 | 电话声收音机 |
| **Echo (回声)** | 回声效果 | 山洞、空旷大厅 |
| **Reverb (混响)** | 环境混响 | 室内/室外环境模拟 |
| **Compressor (压缩)** | 动态范围压缩 | 控制最大音量 |
| **Chorus (合唱)** | 合唱效果 | 特殊音效 |
| **Pitch Shift (音调)** | 音高调整 | 角色变声、慢动作 |
| **Normalize (归一化)** | 音量标准化 | 统一音量 |

## 五、3D 空间音频系统

### 5.1 距离衰减模型

```
音量
  │
1.0│      ┌─ Log 对数衰减
  │     ╱        Min Distance ← 音量保持最大
  │    ╱          Max Distance ← 音量归零
  │   ╱
  │  ╱
 0.0└─────────────────── 距离
       Min         Max
```

### 5.2 音频遮挡系统

```
音源 ──[障碍物]── 听者

无遮挡:      音量 100%, 全部频段
局部遮挡:    音量 60%,  衰减高频（墙壁阻挡效果）
完全遮挡:    音量 20%,  大幅衰减高频（厚重墙体效果）

实现方式:
1. Raycast 检测音源到听者路径
2. 调整 AudioSource 的 volume 和 AudioLowPassFilter
3. 根据遮挡程度渐变
```

## 六、音频系统架构设计原则

| 原则 | 说明 | 实现方式 |
|------|------|---------|
| **单一 AudioManager** | 全局统一管理音频播放 | 单例 + DontDestroyOnLoad |
| **音频池** | 预创建多 AudioSource 实例 | 对象池模式 |
| **分类通道** | 不同类别使用不同 AudioSource | Music/SFX/Voice 分离 |
| **3D/2D 分离** | 世界音效和 UI 音效分开管理 | Spatial Blend 控制 |
| **动态加载** | 按需加载音频资源 | Resource/Addressables |
| **音量持久化** | 用户音量设置保存 | PlayerPrefs |

---

*本文档基于 Unity 6 (2024 LTS) 整理*
