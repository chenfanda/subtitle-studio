项目概述
这是一个基于 React + TypeScript 的在线视频编辑器，支持字幕编辑、文字元素、动画效果、音频配音、B-roll 视频、媒体贴纸等功能。
核心特性

✅ 字幕编辑：富文本编辑、样式定制、动画效果
✅ 文字元素：独立文字层，支持拖拽、缩放、旋转
✅ **统一音频系统**：三合一面板，支持字幕配音 (含TTS)、背景音乐和音效
✅ B-roll 视频：为字幕片段添加视频素材
✅ 媒体资源：贴纸、GIF、自定义上传
✅ 历史记录：撤销/重做功能（最多保存5个操作）
✅ 时间轴：可视化编辑时间线
✅ 视频画面交互：快速工具栏、拖动优化、防误删保护


技术栈
技术版本用途React18.3.1UI 框架TypeScript5.6.2类型系统Vite5.4.8构建工具Zustand5.0.1状态管理Immer10.1.1不可变数据TailwindCSS3.4.14样式方案Heroicons2.2.0图标库

核心架构调整
🔄 重大变更：Store 拆分
变更原因：

原 useProjectStore 职责过重，包含字幕、文字元素、项目设置等多种数据
导致状态管理混乱，难以维护和扩展

解决方案：按功能领域拆分 Store
拆分前（旧架构）
```typescript
// ❌ 所有数据都在 useProjectStore 中
useProjectStore {
  // 项目基础信息
  title, videoUrl, duration, currentTime
  
  // 字幕数据
  subtitles, updateSubtitle, deleteSubtitle...
  
  // 文字元素数据
  textElements, addTextElement, deleteTextElement...
  
  // 历史记录
  past, future, undo, redo...
}
// ✅ 按职责分离

useProjectStore {
  // 仅负责：项目基础信息、播放控制
  title, videoUrl, duration, currentTime
  appStage, saveStatus
  togglePlayback, setCurrentTime
}

useSubtitleStore {
  // 仅负责：字幕相关的所有操作
  subtitles
  updateSubtitle, deleteSubtitle, duplicateSubtitle
  setSubtitleBroll, setSubtitleAudio
  // setSubtitleSoundEffect, removeSubtitleSoundEffect
}

useTextElementStore {
  // 仅负责：文字元素的所有操作
  textElements
  addTextElement, updateTextElement, deleteTextElement
}

// useVoiceoverStore {
  // 仅负责：字幕配音对话框的 UI 状态
  dialogView, sourceView, selectedAudio
  generateTTS, applyToSubtitle, resetDialog
}

useHistoryStore {
  // 仅负责：历史记录管理
  past, future
  undo, redo, pushState
}
统一音频系统
功能特性：

三任务切换器：AudioPanel 提供 "字幕配音" | "背景音乐" | "音效" 三种模式。

状态管理：useAudioStore 使用 activeAudioTask 状态来驱动 UI 切换。

任务详情：

字幕配音 (Voiceover):

UI：使用 VoiceoverTaskPanel，模仿 BrollPanel 的字幕列表布局。

工作流：点击字幕打开 VoiceoverDialog，支持 "TTS 生成"、"音频库" 和 "本地上传" 三种来源。

数据：配音数据存储在 subtitle.audioTrack 属性中。

时间轴：由 VoiceoverIdentifierTrack 渲染。

背景音乐 (BGM):

UI：使用 AudioLibrary 和 BgmCategoryTabs（原 AudioPanel 的分类栏）。

工作流：点击 AudioCard 将音频应用为全局背景音乐。

数据：BGM 数据存储在 useAudioStore.backgroundMusic 中。

时间轴：由 BackgroundMusicTrack 渲染（贯穿全片）。

音效 (SFX):

UI：使用 AudioLibrary 和新的 SoundEffectCategoryTabs。

工作流：必须先选中字幕，然后点击 AudioCard 将音效附加到所选字幕的开头。

数据：音效数据存储在 subtitle.soundEffect 属性中。

时间轴：由 SoundEffectIdentifierTrack 渲染（时长由音频自身决定，而非字幕）。

附件面板逻辑 (EditingStage.tsx)：

useUIStore.selectedAttachment 状态被扩展，以区分三种附件类型：

type: 'audio' -> 渲染 VoiceoverSettingsPanel

type: 'soundEffect' -> 渲染 SoundEffectSettingsPanel

type: 'backgroundMusic' -> 渲染 BackgroundMusicSettingsPanel

---

## 目录结构
public/
└── fonts/                          # 字体文件
    ├── AlibabaPuHuiTi-3-105-Heavy.woff2
    ├── AlibabaPuHuiTi-3-115-Black.woff2
    ├── ZCOOL_Addict_Italic.woff2
    ├── ZcoolKuaiLe-Regular.woff2
    ├── ZcoolkuheiT-Regular.woff2
    ├── ZcoolQingKeHuangYou-Regular.woff2
    ├── ZcoolwenyiT-Regular.woff2
    ├── Zcoolxiaowei-LOGOT.woff2
    ├── ZcoolYuYangT-Bold.woff2
    └── ZcoolYuYangT-Regular.woff2

src/
├── components/                      # 组件目录
│   ├── audio/                      # 音频相关组件
│   │   ├── AudioCard.tsx           # ⭐ (已改造) BGM/SFX 通用音频卡片
│   │   ├── AudioLibrary.tsx        # ⭐ (已重构) BGM/SFX 统一列表渲染器
│   │   ├── AudioPanel.tsx          # ⭐ (已重构) 三任务切换器 (配音/BGM/SFX)
│   │   ├── BackgroundMusicSettingsPanel.tsx # BGM 设置面板
│   │   ├── SoundEffectCategoryTabs.tsx    # SFX 分类标签
│   │   ├── SoundEffectSettingsPanel.tsx   # SFX 设置面板
│   │   ├── VoiceoverDialog.tsx          # 配音对话框 (模仿 BrollDialog)
│   │   ├── VoiceoverEditView.tsx        # 配音编辑视图 (模仿 BrollEditView)
│   │   ├── VoiceoverSettingsPanel.tsx   # ⭐ (重命名) 原 AudioSettingsPanel
│   │   ├── VoiceoverSourceView.tsx      # 配音来源视图 (TTS, 库, 上传)
│   │   └── VoiceoverTaskPanel.tsx       # 配音任务面板 (模仿 BrollPanel)
│   │   # (已废弃: AudioCategoryTabs.tsx, AudioUpload.tsx, BackgroundMusicControl.tsx)
│   │
│   ├── broll/                      # B-roll 视频组件
│   │   ├── BrollDialog.tsx
│   │   ├── BrollEditView.tsx
│   │   ├── BrollPanel.tsx
│   │   ├── BrollSearchView.tsx
│   │   ├── BrollVideoCard.tsx
│   │   ├── BrollVideoPlayer.tsx
│   │   └── BrollTransitionSelector.tsx
│   │
│   ├── common/                     # 通用组件
│   │   ├── RichTextEditor.tsx             # 富文本编辑器
│   │   ├── TransformBorder.tsx            # 变换边框
│   │   ├── Watermark.tsx
│   │   ├── Modal.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Tabs.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Loading.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── TemplateQuickAccess.tsx
│   │   ├── BasicEffectsSection.tsx        # ⭐ 基础效果 (已更新 FONT_OPTIONS)
│   │   ├── AlignmentSection.tsx
│   │   ├── HighlightColorSection.tsx
│   │   ├── StrokeSection.tsx
│   │   ├── ShadowSection.tsx
│   │   └── BackgroundSection.tsx
│   │
│   ├── export/                     # 导出相关组件
│   │   ├── ExportModal.tsx
│   │   ├── ExportPreview.tsx
│   │   ├── ExportSettings.tsx
│   │   └── ExportProgress.tsx
│   │
│   ├── layout/                     # 布局组件
│   │   ├── HeaderBar.tsx                  # ⭐ 顶部栏（撤销/重做按钮）
│   │   ├── LeftSidebar.tsx
│   │   ├── RightSidebar.tsx
│   │   ├── VideoArea.tsx                  # ⭐ 视频区域（点击空白清除选择）
│   │   ├── TimelineArea.tsx
│   │   └── BottomBar.tsx
│   │
│   ├── media/                      # 媒体资源组件
│   │   ├── MediaPanel.tsx
│   │   ├── MediaElement.tsx
│   │   ├── MediaOverlay.tsx
│   │   ├── MediaUpload.tsx
│   │   ├── StickerLibrary.tsx
│   │   ├── StickerCard.tsx
│   │   ├── GifsLibrary.tsx
│   │   └── GifCard.tsx
│   │
│   ├── pages/                      # 页面组件
│   │   ├── EditingStage.tsx             # ⭐ (已改造) 渲染所有设置面板
│   │   ├── ProcessingStage.tsx
│   │   └── UploadStage.tsx
│   │
│   ├── settings/                   # 设置相关组件
│   │   ├── SettingsModal.tsx
│   │   ├── GeneralSettings.tsx
│   │   ├── VideoSettings.tsx
│   │   ├── SubtitleSettings.tsx
│   │   ├── WatermarkSettings.tsx
│   │   └── ShortcutSettings.tsx
│   │
│   ├── subtitle/                   # 字幕组件
│   │   ├── SubtitleEditor.tsx             # ⭐ 字幕编辑器（双击编辑弹窗）
│   │   ├── SubtitleList.tsx               # ⭐ 字幕列表（点击选择）
│   │   ├── SubtitlePanel.tsx              # 字幕面板 (渲染 Editor 和 List)
│   │   ├── SubtitleToolbar.tsx            # 字幕工具栏 (合并, 分割, 编辑)
│   │   ├── SubtitleItem.tsx
│   │   └── SubtitleImport.tsx
│   │
│   ├── templates/                  # 模板组件
│   │   ├── EffectPreviewCard.tsx
│   │   ├── TemplatePanel.tsx
│   │   ├── TemplateLibrary.tsx
│   │   ├── TemplateCategoryTabs.tsx
│   │   └── AnimationPreview.tsx
│   │
│   ├── text/                       # 文字组件
│   │   ├── StylePreviewCard.tsx
│   │   ├── TextStylePanel.tsx
│   │   ├── TextCategoryTabs.tsx
│   │   └── FontPicker.tsx                 # (此文件在原始 README 中, 尽管你提到它不存在)
│   │
│   ├── timeline/                   # 时间轴组件
│   │   ├── Timeline.tsx                 # ⭐ (已改造) 渲染所有音轨
│   │   ├── SubtitleTrack.tsx              # ⭐ 字幕轨道（点击选择）
│   │   ├── TextElementTrack.tsx
│   │   ├── MediaTrack.tsx
│   │   ├── VoiceoverIdentifierTrack.tsx   # ⭐ (重命名) 原 AudioIdentifierTrack
│   │   ├── SoundEffectIdentifierTrack.tsx # 音效轨道
│   │   ├── BackgroundMusicTrack.tsx     # 背景音乐轨道
│   │   ├── TimelineRuler.tsx
│   │   ├── AudioWaveform.tsx
│   │   ├── PlayheadIndicator.tsx
│   │   ├── TimelineZoom.tsx
│   │   └── TimelineScroll.tsx
│   │   # (已废弃: AudioTrack.tsx)
│   │
│   └── video/                      # 视频组件
│       ├── VideoPlayer.tsx
│       ├── VideoControls.tsx              # ⭐ 播放控制（删除按钮防误删）
│       ├── VideoUpload.tsx
│       ├── SubtitleOverlay.tsx            # ⭐ 字幕叠加层（拖动、选择、工具栏）
│       ├── TextElementOverlay.tsx         # ⭐ 文字元素叠加层（拖动、选择、工具栏）
│       ├── QuickToolbar.tsx               # ⭐ 快速工具栏 (已更新 FONT_OPTIONS 和渲染)
│       └── VideoPreview.tsx
│
├── stores/                         # 状态管理（Zustand + Immer）
│   ├── useProjectStore.ts                 # ⭐ 项目基础状态
│   ├── useSubtitleStore.ts                # ⭐ (已改造) 字幕状态
│   ├── useTextElementStore.ts             # ⭐ 文字元素状态
│   ├── useHistoryStore.ts                 # ⭐⭐ 历史记录管理
│   ├── useUIStore.ts                      # ⭐⭐ (已改造) UI 状态
│   ├── useTimelineStore.ts
│   ├── useTextStyleStore.ts               # ⭐ 文字样式状态
│   ├── useTemplateStore.ts
│   ├── useAudioStore.ts                   # ⭐ (已改造) 音频状态
│   ├── useVoiceoverStore.ts               # 配音对话框状态
│   ├── useBrollStore.ts
│   ├── useMediaStore.ts
│   ├── useSettingsStore.ts
│   └── useExportStore.ts
│
├── types/                          # TypeScript 类型定义
│   ├── project.ts
│   ├── subtitle.ts                        # ⭐ (已改造) 字幕类型
│   ├── textElement.ts                     # 文字元素类型
│   ├── history.ts
│   ├── animation.ts
│   ├── textStyle.ts
│   ├── audio.ts                           # ⭐ (已改造) 音频类型
│   ├── broll.ts
│   ├── media.ts
│   ├── ui.ts                              # ⭐ (已改造) UI 类型
│   ├── timeline.ts
│   ├── settings.ts
│   ├── export.ts
│   └── common.ts
│
├── utils/                          # 工具函数
│   ├── subtitleParser.ts
│   ├── textStyleUtils.ts                  # ⭐ (包含字体修复所需的工具函数)
│   ├── animationUtils.ts
│   ├── audioUtils.ts
│   ├── brollUtils.ts
│   ├── timelineUtils.ts
│   ├── videoUtils.ts
│   ├── exportUtils.ts
│   ├── storageUtils.ts
│   ├── validationUtils.ts
│   ├── formatUtils.ts
│   ├── colorUtils.ts
│   ├── mathUtils.ts
│   └── fileUtils.ts
│
├── constants/                      # 常量配置
│   ├── animationTemplates.ts
│   ├── textStyleTemplates.ts
│   ├── audioCategories.ts               # ⭐ BGM 分类
│   ├── sfxCategories.ts                 # SFX 分类
│   ├── mediaLibrary.ts
│   ├── defaultStyles.ts
│   ├── shortcuts.ts
│   ├── exportPresets.ts
│   └── config.ts
│
├── hooks/                          # 自定义 React Hooks
│   ├── useKeyboardShortcuts.ts
│   ├── useAutoSave.ts
│   ├── useDebounce.ts
│   ├── useThrottle.ts
│   ├── useLocalStorage.ts
│   ├── useVideoPlayer.ts
│   ├── useTimeline.ts
│   └── useUndo.ts
│
└── index.css                       # ⭐ 全局样式 (新增 @font-face 规则)
---
Store,职责,关键方法
useProjectStore,项目信息、播放控制,"togglePlayback, setCurrentTime"
useSubtitleStore,"字幕 CRUD, 配音, B-roll, 音效","updateSubtitle, setSubtitleAudio, setSubtitleSoundEffect"
useTextElementStore,文字元素 CRUD,"addTextElement, deleteTextElement"
useVoiceoverStore,配音对话框 UI 状态,"generateTTS, applyToSubtitle, resetDialog"
useHistoryStore,历史记录,"pushState, undo, redo"
useUIStore,UI 状态,"setVideoToolbar, setSelectedSubtitles, setSelectedAttachment"
useMediaStore,媒体资源,"placeOnTimeline, removeMedia"
useBrollStore,B-roll 管理,"placeOnTimeline, removeBroll"
useAudioStore,"音频任务, BGM","setActiveAudioTask, setBackgroundMusic"
