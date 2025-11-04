项目概述这是一个基于 React + TypeScript 的在线视频编辑器，支持字幕编辑、文字元素、动画效果、音频配音、B-roll 视频、媒体贴纸等功能。核心特性✅ 字幕编辑：富文本编辑、样式定制、动画效果✅ 文字元素：独立文字层，支持拖拽、缩放、旋转✅ 统一音频系统：三合一面板，支持字幕配音 (含TTS)、背景音乐和音效✅ 统一剪辑面板 (新)：双模式序列编辑器，支持“字幕序列”（含插入空白片段）和“视频序列”（独立视频插入）✅ B-roll 视频：为字幕片段添加视频素材✅ 媒体资源：贴纸、GIF、自定义上传✅ 历史记录：撤销/重做功能（最多保存20个操作）✅ 时间轴：可视化编辑时间线✅ 视频画面交互：快速工具栏、拖动优化、防误删保护技术栈技术版本用途React18.3.1UI 框架TypeScript5.6.2类型系统Vite5.4.8构建工具Zustand5.0.1状态管理Immer10.1.1不可变数据TailwindCSS3.4.14样式方案Heroicons2.2.0图标库lucide-react0.408.0图标库核心架构调整🔄 重大变更：Store 拆分变更原因：原 useProjectStore 职责过重，包含字幕、文字元素、项目设置等多种数据导致状态管理混乱，难以维护和扩展解决方案：按功能领域拆分 Store拆分前（旧架构）TypeScript// ❌ 所有数据都在 useProjectStore 中
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
拆分后（新架构）TypeScript// ✅ 按职责分离

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
  // (新) insertBlankSubtitle
  setSubtitleBroll, setSubtitleAudio
  setSubtitleSoundEffect, removeSubtitleSoundEffect
}

useTextElementStore {
  // 仅负责：文字元素的所有操作
  textElements
  addTextElement, updateTextElement, deleteTextElement
}

// (新)
useVideoSequenceStore {
  // 仅负责：独立视频插入片段的管理
  clips
  addClip, removeClip, updateClip
}

useVoiceoverStore {
  // 仅负责：字幕配音对话框的 UI 状态
  dialogView, sourceView, selectedAudio
  generateTTS, applyToSubtitle, resetDialog
}

useHistoryStore {
  // 仅负责：历史记录管理 (已更新)
  // (新) 通过 collectCurrentSnapshot 统一管理所有数据 store 的快照
  past, future
  undo, redo, pushState
}
统一音频系统功能特性：三任务切换器：AudioPanel 提供 "字幕配音" | "背景音乐" | "音效" 三种模式。状态管理：useAudioStore 使用 activeAudioTask 状态来驱动 UI 切换。任务详情：字幕配音 (Voiceover):UI：使用 VoiceoverTaskPanel，模仿 BrollPanel 的字幕列表布局。工作流：点击字幕打开 VoiceoverDialog，支持 "TTS 生成"、"音频库" 和 "本地上传" 三种来源。数据：配音数据存储在 subtitle.audioTrack 属性中。时间轴：由 VoiceoverIdentifierTrack 渲染。背景音乐 (BGM):UI：使用 AudioLibrary 和 BgmCategoryTabs（原 AudioPanel 的分类栏）。工作流：点击 AudioCard 将音频应用为全局背景音乐。数据：BGM 数据存储在 useAudioStore.backgroundMusic 中。时间轴：由 BackgroundMusicTrack 渲染（贯穿全片）。音效 (SFX):UI：使用 AudioLibrary 和新的 SoundEffectCategoryTabs。工作流：必须先选中字幕，然后点击 AudioCard 将音效附加到所选字幕的开头。数据：音效数据存储在 subtitle.soundEffect 属性中。时间轴：由 SoundEffectIdentifierTrack 渲染（时长由音频自身决定，而非字幕）。附件面板逻辑 (EditingStage.tsx)：useUIStore.selectedAttachment 状态被扩展，以区分三种附件类型：type: 'audio' -> 渲染 VoiceoverSettingsPaneltype: 'soundEffect' -> 渲染 SoundEffectSettingsPaneltype: 'backgroundMusic' -> 渲染 BackgroundMusicSettingsPanel统一剪辑面板 (Unified Clips Panel) ✂️ (新)功能特性：双任务切换器：ClipsPanel 提供 "字幕序列" | "视频序列" 两种模式。状态管理：useUIStore 使用 activeClipTask 状态来驱动 UI 切换。任务详情：字幕序列 (Subtitle Sequence):UI：使用 SubtitleSequencePanel，重用 SubtitleToolbar 和 SubtitleList。工作流：管理字幕的时序结构。支持分割、合并、复制，以及新增的“插入空白片段”功能（用于创建 B-roll/配音的“容器”）。数据：由 useSubtitleStore.subtitles 驱动。视频序列 (Video Sequence):UI：使用 VideoSequencePanel，包含独立的 VideoSequenceToolbar 和 VideoSequenceList。工作流：实现独立的“视频插入”（如广告）。在主视频轨道 (useProjectStore.videoUrl) 之上播放一个独立的视频源。数据：由新的 useVideoSequenceStore.clips 驱动。时间轴：由 VideoInsertTrack 渲染。播放器逻辑：VideoPlayer.tsx 被重构为“双播放器切换”模型，由 useVideoSourceSwitcher hook 驱动，以实现无缝的源切换，避免黑屏和缓冲
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
│   │   ├── AudioCard.tsx
│   │   ├── AudioLibrary.tsx
│   │   ├── AudioPanel.tsx
│   │   ├── BackgroundMusicSettingsPanel.tsx
│   │   ├── SoundEffectCategoryTabs.tsx
│   │   ├── SoundEffectSettingsPanel.tsx
│   │   ├── VoiceoverDialog.tsx
│   │   ├── VoiceoverEditView.tsx
│   │   ├── VoiceoverSettingsPanel.tsx
│   │   ├── VoiceoverSourceView.tsx
│   │   └── VoiceoverTaskPanel.tsx
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
│   ├── clips/                      # (新) 剪辑面板组件
│   │   ├── ClipsPanel.tsx
│   │   ├── ClipsTaskSwitcher.tsx
│   │   ├── SubtitleSequencePanel.tsx
│   │   ├── VideoSequenceList.tsx
│   │   ├── VideoSequencePanel.tsx
│   │   └── VideoSequenceToolbar.tsx
│   │
│   ├── common/                     # 通用组件
│   │   ├── RichTextEditor.tsx
│   │   ├── TransformBorder.tsx
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
│   │   ├── BasicEffectsSection.tsx
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
│   │   ├── HeaderBar.tsx
│   │   ├── LeftSidebar.tsx
│   │   ├── RightSidebar.tsx
│   │   ├── VideoArea.tsx
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
│   │   ├── EditingStage.tsx
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
│   │   ├── SubtitleEditor.tsx
│   │   ├── SubtitleList.tsx
│   │   ├── SubtitlePanel.tsx
│   │   ├── SubtitleToolbar.tsx
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
│   │   └── FontPicker.tsx
│   │
│   ├── timeline/                   # 时间轴组件
│   │   ├── Timeline.tsx
│   │   ├── SubtitleTrack.tsx
│   │   ├── TextElementTrack.tsx
│   │   ├── MediaTrack.tsx
│   │   ├── VoiceoverIdentifierTrack.tsx
│   │   ├── SoundEffectIdentifierTrack.tsx
│   │   ├── BackgroundMusicTrack.tsx
│   │   ├── VideoInsertTrack.tsx    # (新) 视频序列轨道
│   │   ├── TimelineRuler.tsx
│   │   ├── AudioWaveform.tsx
│   │   ├── PlayheadIndicator.tsx
│   │   ├── TimelineZoom.tsx
│   │   └── TimelineScroll.tsx
│   │
│   └── video/                      # 视频组件
│       ├── VideoPlayer.tsx         # (已重构为双播放器)
│       ├── VideoControls.tsx
│       ├── VideoUpload.tsx
│       ├── SubtitleOverlay.tsx
│       ├── TextElementOverlay.tsx
│       ├── QuickToolbar.tsx
│       └── VideoPreview.tsx
│
├── stores/                         # 状态管理 (Zustand + Immer)
│   ├── useProjectStore.ts
│   ├── useSubtitleStore.ts         # (已修改)
│   ├── useTextElementStore.ts
│   ├── useHistoryStore.ts          # (已修改)
│   ├── useUIStore.ts               # (已修改)
│   ├── useTimelineStore.ts
│   ├── useTextStyleStore.ts
│   ├── useTemplateStore.ts
│   ├── useAudioStore.ts
│   ├── useVoiceoverStore.ts
│   ├── useVideoSequenceStore.ts  # (新)
│   ├── useBrollStore.ts
│   ├── useMediaStore.ts
│   ├── useSettingsStore.ts
│   └── useExportStore.ts
│
├── types/                          # TypeScript 类型定义
│   ├── project.ts
│   ├── subtitle.ts
│   ├── textElement.ts
│   ├── history.ts                  # (已修改)
│   ├── animation.ts
│   ├── textStyle.ts
│   ├── audio.ts
│   ├── broll.ts
│   ├── media.ts
│   ├── ui.ts                       # (已修改)
│   ├── timeline.ts
│   ├── videoSequence.ts          # (新)
│   ├── settings.ts
│   ├── export.ts
│   └── common.ts
│
├── utils/                          # 工具函数
│   ├── subtitleParser.ts
│   ├── textStyleUtils.ts
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
│   ├── audioCategories.ts
│   ├── sfxCategories.ts
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
│   ├── useVideoSourceSwitcher.ts # (新)
│   ├── useTimeline.ts
│   └── useUndo.ts
│
└── index.css                       # 全局样式
---
Store,职责,关键方法
useProjectStore,项目信息、播放控制,"togglePlayback, setCurrentTime"
useSubtitleStore,"字幕 CRUD, 配音, B-roll, 音效","updateSubtitle, setSubtitleAudio, insertBlankSubtitle"
useTextElementStore,文字元素 CRUD
useVideoSequenceStore,(新) 视频序列 (插入),"addClip, removeClip, updateClip"
useVoiceoverStore,配音对话框 UI 状态,"generateTTS, applyToSubtitle, resetDialog"
useHistoryStore,历史记录,"pushState, undo, redo"
useUIStore,UI 状态,"setVideoToolbar, setSelectedSubtitles, setActiveClipTask"
useMediaStore,媒体资源,"placeOnTimeline, removeMedia"
useBrollStore,B-roll 管理,"placeOnTimeline, removeBroll"
useAudioStore,"音频任务, BGM","setActiveAudioTask, setBackgroundMusic"
