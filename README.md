项目概述
这是一个基于 React + TypeScript 的在线视频编辑器，支持字幕编辑、文字元素、动画效果、音频配音、B-roll 视频、媒体贴纸等功能。
核心特性

✅ 字幕编辑：富文本编辑、样式定制、动画效果
✅ 文字元素：独立文字层，支持拖拽、缩放、旋转
✅ 音频系统：背景音乐、字幕配音、音频库
✅ B-roll 视频：为字幕片段添加视频素材
✅ 媒体资源：贴纸、GIF、自定义上传
✅ 历史记录：撤销/重做功能
✅ 时间轴：可视化编辑时间线


技术栈
技术版本用途React18.3.1UI 框架TypeScript5.6.2类型系统Vite5.4.8构建工具Zustand5.0.1状态管理Immer10.1.1不可变数据TailwindCSS3.4.14样式方案Heroicons2.2.0图标库

核心架构调整
🔄 重大变更：Store 拆分
变更原因：

原 useProjectStore 职责过重，包含字幕、文字元素、项目设置等多种数据
导致状态管理混乱，难以维护和扩展

解决方案：按功能领域拆分 Store
拆分前（旧架构）
typescript// ❌ 所有数据都在 useProjectStore 中
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
拆分后（新架构）
typescript// ✅ 按职责分离

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
}

useTextElementStore {
  // 仅负责：文字元素的所有操作
  textElements
  addTextElement, updateTextElement, deleteTextElement
}

useHistoryStore {
  // 仅负责：历史记录管理
  past, future
  undo, redo, pushState
}
```

---

## 目录结构
```

src/
├── components/                      # 组件目录
│   ├── audio/                      # 音频相关组件
│   │   ├── AudioCard.tsx                  # 音频卡片（使用 useSubtitleStore）
│   │   ├── AudioLibrary.tsx               # 音频库
│   │   ├── AudioPanel.tsx                 # 音频面板
│   │   ├── AudioCategoryTabs.tsx          # 音频分类标签
│   │   ├── AudioUpload.tsx                # 音频上传
│   │   └── BackgroundMusicControl.tsx     # 背景音乐控制
│   │
│   ├── broll/                      # B-roll 视频组件
│   │   ├── BrollDialog.tsx                # B-roll 弹窗
│   │   ├── BrollEditView.tsx              # 编辑视图（使用 useSubtitleStore）
│   │   ├── BrollPanel.tsx                 # B-roll 面板（使用 useSubtitleStore）
│   │   ├── BrollSearchView.tsx            # 搜索视图
│   │   ├── BrollVideoCard.tsx             # B-roll 视频卡片
│   │   ├── BrollVideoPlayer.tsx           # B-roll 视频播放器
│   │   └── BrollTransitionSelector.tsx    # 转场效果选择器
│   │
│   ├── common/                     # 通用组件
│   │   ├── RichTextEditor.tsx             # 富文本编辑器（使用 useSubtitleStore + useTextElementStore）
│   │   ├── TransformBorder.tsx            # 变换边框
│   │   ├── Watermark.tsx                  # 水印
│   │   ├── Modal.tsx                      # 模态框
│   │   ├── Button.tsx                     # 按钮组件
│   │   ├── Input.tsx                      # 输入框组件
│   │   ├── Select.tsx                     # 选择器组件
│   │   ├── Tabs.tsx                       # 标签页组件
│   │   ├── Tooltip.tsx                    # 提示框组件
│   │   ├── Loading.tsx                    # 加载指示器
│   │   ├── ErrorBoundary.tsx              # 错误边界
│   │   ├── TemplateQuickAccess.tsx        # 模板快速访问
│   │   ├── BasicEffectsSection.tsx        # 基础效果区域
│   │   ├── AlignmentSection.tsx           # 对齐设置区域
│   │   ├── HighlightColorSection.tsx      # 高亮颜色区域
│   │   ├── StrokeSection.tsx              # 描边设置区域
│   │   ├── ShadowSection.tsx              # 阴影设置区域
│   │   └── BackgroundSection.tsx          # 背景设置区域
│   │
│   ├── export/                     # 导出相关组件
│   │   ├── ExportModal.tsx                # 导出模态框
│   │   ├── ExportPreview.tsx              # 导出预览
│   │   ├── ExportSettings.tsx             # 导出设置
│   │   └── ExportProgress.tsx             # 导出进度
│   │
│   ├── layout/                     # 布局组件
│   │   ├── HeaderBar.tsx                  # 顶部栏（使用 useHistoryStore）
│   │   ├── LeftSidebar.tsx                # 左侧边栏
│   │   ├── RightSidebar.tsx               # 右侧边栏
│   │   ├── VideoArea.tsx                  # 视频区域（使用 useSubtitleStore）
│   │   ├── TimelineArea.tsx               # 时间轴区域
│   │   └── BottomBar.tsx                  # 底部栏
│   │
│   ├── media/                      # 媒体资源组件
│   │   ├── MediaPanel.tsx                 # 媒体面板（使用 useSubtitleStore）
│   │   ├── MediaElement.tsx               # 媒体元素
│   │   ├── MediaOverlay.tsx               # 媒体叠加层
│   │   ├── MediaUpload.tsx                # 媒体上传
│   │   ├── StickerLibrary.tsx             # 贴纸库
│   │   ├── StickerCard.tsx                # 贴纸卡片
│   │   ├── GifsLibrary.tsx                # GIF 库
│   │   └── GifCard.tsx                    # GIF 卡片
│   │
│   ├── pages/                      # 页面组件
│   │   ├── EditingStage.tsx               # 编辑页面
│   │   ├── ProcessingStage.tsx            # 处理页面（使用 useSubtitleStore）
│   │   └── UploadStage.tsx                # 上传页面
│   │
│   ├── settings/                   # 设置相关组件
│   │   ├── SettingsModal.tsx              # 设置模态框
│   │   ├── GeneralSettings.tsx            # 通用设置
│   │   ├── VideoSettings.tsx              # 视频设置
│   │   ├── SubtitleSettings.tsx           # 字幕设置
│   │   ├── WatermarkSettings.tsx          # 水印设置
│   │   └── ShortcutSettings.tsx           # 快捷键设置
│   │
│   ├── subtitle/                   # 字幕组件
│   │   ├── SubtitleEditor.tsx             # 字幕编辑器（使用 useSubtitleStore）
│   │   ├── SubtitleList.tsx               # 字幕列表（使用 useSubtitleStore）
│   │   ├── SubtitlePanel.tsx              # 字幕面板
│   │   ├── SubtitleToolbar.tsx            # 字幕工具栏（使用 useSubtitleStore）
│   │   ├── SubtitleItem.tsx               # 字幕项
│   │   └── SubtitleImport.tsx             # 字幕导入
│   │
│   ├── templates/                  # 模板组件
│   │   ├── EffectPreviewCard.tsx          # 动效卡片（使用 useSubtitleStore）
│   │   ├── TemplatePanel.tsx              # 模板面板
│   │   ├── TemplateLibrary.tsx            # 模板库
│   │   ├── TemplateCategoryTabs.tsx       # 模板分类标签
│   │   └── AnimationPreview.tsx           # 动画预览
│   │
│   ├── text/                       # 文字组件
│   │   ├── StylePreviewCard.tsx           # 样式卡片（使用 useTextElementStore）
│   │   ├── TextStylePanel.tsx             # 文字样式面板
│   │   ├── TextCategoryTabs.tsx           # 文字分类标签
│   │   └── FontPicker.tsx                 # 字体选择器
│   │
│   ├── timeline/                   # 时间轴组件
│   │   ├── Timeline.tsx                   # 时间轴主组件
│   │   ├── SubtitleTrack.tsx              # 字幕轨道（使用 useSubtitleStore）
│   │   ├── TextElementTrack.tsx           # 文字元素轨道
│   │   ├── MediaTrack.tsx                 # 媒体轨道
│   │   ├── AudioTrack.tsx                 # 音频轨道
│   │   ├── TimelineRuler.tsx              # 时间标尺（使用 useSubtitleStore）
│   │   ├── AudioWaveform.tsx              # 音频波形（使用 useSubtitleStore）
│   │   ├── PlayheadIndicator.tsx          # 播放头指示器
│   │   ├── TimelineZoom.tsx               # 时间轴缩放控制
│   │   └── TimelineScroll.tsx             # 时间轴滚动控制
│   │
│   └── video/                      # 视频组件
│       ├── VideoPlayer.tsx                # 视频播放器
│       ├── VideoControls.tsx              # 播放控制（使用 useSubtitleStore + useTextElementStore）
│       ├── VideoUpload.tsx                # 视频上传
│       ├── SubtitleOverlay.tsx            # 字幕叠加层（使用 useSubtitleStore）
│       ├── TextElementOverlay.tsx         # 文字元素叠加层（使用 useTextElementStore）
│       ├── QuickToolbar.tsx               # 快速工具栏（使用 useSubtitleStore + useTextElementStore）
│       └── VideoPreview.tsx               # 视频预览
│
├── stores/                         # 状态管理（Zustand + Immer）
│   ├── useProjectStore.ts                 # ⭐ 项目基础状态（播放控制、项目信息）
│   ├── useSubtitleStore.ts                # ⭐ 字幕状态管理（新增）
│   ├── useTextElementStore.ts             # ⭐ 文字元素状态管理（新增）
│   ├── useHistoryStore.ts                 # ⭐ 历史记录管理（修改）
│   ├── useUIStore.ts                      # UI 状态管理
│   ├── useTimelineStore.ts                # 时间轴状态
│   ├── useTextStyleStore.ts               # 文字样式状态（使用 useSubtitleStore）
│   ├── useTemplateStore.ts                # 动画模板状态（使用 useSubtitleStore）
│   ├── useAudioStore.ts                   # 音频状态（使用 useSubtitleStore）
│   ├── useBrollStore.ts                   # B-roll 状态（使用 useSubtitleStore）
│   ├── useMediaStore.ts                   # 媒体资源状态
│   ├── useSettingsStore.ts                # 设置状态
│   └── useExportStore.ts                  # 导出状态
│
├── types/                          # TypeScript 类型定义
│   ├── project.ts                         # 项目类型
│   ├── subtitle.ts                        # 字幕类型
│   ├── textElement.ts                     # 文字元素类型（新增）
│   ├── history.ts                         # 历史记录类型
│   ├── animation.ts                       # 动画类型
│   ├── textStyle.ts                       # 文字样式类型
│   ├── audio.ts                           # 音频类型
│   ├── broll.ts                           # B-roll 类型
│   ├── media.ts                           # 媒体类型
│   ├── ui.ts                              # UI 类型
│   ├── timeline.ts                        # 时间轴类型
│   ├── settings.ts                        # 设置类型
│   ├── export.ts                          # 导出类型
│   └── common.ts                          # 通用类型
│
├── utils/                          # 工具函数
│   ├── subtitleParser.ts                  # 字幕解析工具（SRT、VTT）
│   ├── textStyleUtils.ts                  # 文字样式工具
│   ├── animationUtils.ts                  # 动画工具
│   ├── audioUtils.ts                      # 音频工具
│   ├── brollUtils.ts                      # B-roll 工具
│   ├── timelineUtils.ts                   # 时间轴工具
│   ├── videoUtils.ts                      # 视频工具
│   ├── exportUtils.ts                     # 导出工具
│   ├── storageUtils.ts                    # 本地存储工具
│   ├── validationUtils.ts                 # 验证工具
│   ├── formatUtils.ts                     # 格式化工具
│   ├── colorUtils.ts                      # 颜色工具
│   ├── mathUtils.ts                       # 数学工具
│   └── fileUtils.ts                       # 文件工具
│
├── constants/                      # 常量配置
│   ├── animationTemplates.ts              # 动画模板配置
│   ├── textStyleTemplates.ts              # 文字样式模板配置
│   ├── audioCategories.ts                 # 音频分类配置
│   ├── mediaLibrary.ts                    # 媒体库配置
│   ├── defaultStyles.ts                   # 默认样式配置
│   ├── shortcuts.ts                       # 快捷键配置
│   ├── exportPresets.ts                   # 导出预设配置
│   └── config.ts                          # 应用配置
│
├── hooks/                          # 自定义 React Hooks
│   ├── useKeyboardShortcuts.ts            # 快捷键 Hook
│   ├── useAutoSave.ts                     # 自动保存 Hook
│   ├── useDebounce.ts                     # 防抖 Hook
│   ├── useThrottle.ts                     # 节流 Hook
│   ├── useLocalStorage.ts                 # 本地存储 Hook
│   ├── useVideoPlayer.ts                  # 视频播放器 Hook
│   ├── useTimeline.ts                     # 时间轴 Hook
│   └── useUndo.ts                         # 撤销/重做 Hook项目概述
