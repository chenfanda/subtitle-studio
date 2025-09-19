# Subtitle Studio - 完整代码目录结构 (更新版)

```
subtitle-studio/
├── src/
│   ├── components/                     # UI布局层 - 页面布局和交互
│   │   ├── pages/                      # ✅ 已实现 - 页面级组件
│   │   │   ├── UploadStage.tsx         # ✅ 文件上传页面
│   │   │   ├── ProcessingStage.tsx     # ✅ AI处理等待页面
│   │   │   └── EditingStage.tsx        # ✅ 编辑页面
│   │   │
│   │   ├── layout/                     # ✅ 已实现 - 基础布局组件
│   │   │   ├── AppLayout.tsx           # ✅ 页面路由器
│   │   │   ├── HeaderBar.tsx           # ✅ 顶部标题栏
│   │   │   ├── LeftSidebar.tsx         # ✅ 左侧边栏容器 (已集成TextPanel)
│   │   │   ├── VideoArea.tsx           # ✅ 视频区域 (已集成SubtitleOverlay)
│   │   │   └── TimelineArea.tsx        # ✅ 时间轴区域容器
│   │   │
│   │   ├── video/                      # ✅ 已实现 - 视频相关组件
│   │   │   ├── VideoPlayer.tsx         # ✅ 视频播放器组件
│   │   │   ├── VideoControls.tsx       # ✅ 播放控制栏
│   │   │   ├── SubtitleOverlay.tsx     # ✅ 字幕叠加层 (已支持样式应用和快速工具栏)
│   │   │   ├── SubtitleQuickToolbar.tsx # ✅ 快速编辑工具栏 (4按钮功能)
│   │   │   ├── StickerOverlay.tsx      # ❌ 待开发 - 贴纸叠加层
│   │   │   └── EffectOverlay.tsx       # ❌ 待开发 - 特效叠加层
│   │   │
│   │   ├── timeline/                   # ✅ 已实现 - 时间轴组件
│   │   │   ├── Timeline.tsx            # ✅ 时间轴主组件
│   │   │   ├── TimelineRuler.tsx       # ✅ 时间刻度标尺
│   │   │   ├── PlayheadIndicator.tsx   # ✅ 播放指示器
│   │   │   ├── SubtitleTrack.tsx       # ✅ 字幕轨道
│   │   │   └── AudioWaveform.tsx       # ✅ 音频波形
│   │   │
│   │   ├── subtitle/                   # ✅ 已实现 - 字幕编辑组件
│   │   │   ├── SubtitleList.tsx        # ✅ 字幕列表面板
│   │   │   ├── SubtitleEditor.tsx      # ✅ 字幕编辑器 (文字内容和时间编辑)
│   │   │   ├── SubtitlePanel.tsx       # ✅ 字幕面板容器
│   │   │   └── SubtitleToolbar.tsx     # ✅ 字幕工具栏
│   │   │
│   │   ├── text/                       # ✅ 已实现 - 文字样式相关组件
│   │   │   ├── TextPanel.tsx           # ✅ 文字样式面板容器
│   │   │   ├── BasicStylesTab.tsx      # ✅ "基本"分类 - 基础文字样式模板
│   │   │   ├── SocialMediaTab.tsx      # ✅ "社交媒体"分类 - 社交平台样式模板  
│   │   │   ├── TitleStylesTab.tsx      # ✅ "标题"分类 - 标题类样式模板
│   │   │   ├── NoteStylesTab.tsx       # ✅ "便签"分类 - 便签/标注样式模板
│   │   │   └── StylePreviewCard.tsx    # ✅ 样式模板预览卡片 (需优化背景填充)
│   │   │
│   │   ├── templates/                  # ❌ 待开发 - 动态效果模板相关组件  
│   │   │   ├── TemplatePanel.tsx       # ❌ 动态效果模板面板容器
│   │   │   ├── CustomEffectsTab.tsx    # ❌ "自定义"标签 - 用户自定义动态效果
│   │   │   ├── FeaturedEffectsTab.tsx  # ❌ "精选"标签 - 官方推荐动态效果
│   │   │   ├── AdvancedEffectsTab.tsx  # ❌ "高级"标签 - 高级动画效果
│   │   │   ├── BasicEffectsTab.tsx     # ❌ "基本"标签 - 基础动画效果
│   │   │   ├── EffectPreviewCard.tsx   # ❌ 动态效果预览卡片
│   │   │   └── AnimationPreview.tsx    # ❌ 动画效果实时预览组件
│   │   │
│   │   ├── audio/                      # ❌ 待开发 - 音频库相关组件
│   │   │   ├── AudioPanel.tsx          # ❌ 音频面板容器
│   │   │   ├── AudioCategories.tsx     # ❌ 音频分类（Like/Epic/Ambient/Acoustic/Electronic/Hip Hop）
│   │   │   ├── AudioLibrary.tsx        # ❌ 音频库网格展示
│   │   │   ├── AudioCard.tsx           # ❌ 单个音频卡片
│   │   │   ├── AudioPlayer.tsx         # ❌ 音频预听播放器
│   │   │   ├── AudioUpload.tsx         # ❌ 音频上传组件
│   │   │   └── AudioControls.tsx       # ❌ 音频控制（音量、淡入淡出）
│   │   │
│   │   ├── media/                      # ❌ 待开发 - 媒体素材相关组件
│   │   │   ├── MediaPanel.tsx          # ❌ 媒体面板容器
│   │   │   ├── StickerLibrary.tsx      # ❌ Giphy Sticker库
│   │   │   ├── GifsLibrary.tsx         # ❌ Giphy GIFS库
│   │   │   ├── StickerCard.tsx         # ❌ 贴纸卡片组件
│   │   │   ├── GifCard.tsx             # ❌ GIF卡片组件
│   │   │   ├── MediaSearch.tsx         # ❌ 媒体搜索组件
│   │   │   └── MediaUpload.tsx         # ❌ 媒体上传组件
│   │   │
│   │   ├── broll/                      # ❌ 待开发 - B-roll相关组件
│   │   │   ├── BrollPanel.tsx          # ❌ B-roll面板容器
│   │   │   ├── BrollRecommendations.tsx # ❌ AI推荐B-roll
│   │   │   ├── BrollLibrary.tsx        # ❌ B-roll素材库
│   │   │   ├── BrollCard.tsx           # ❌ B-roll视频卡片
│   │   │   ├── BrollSearch.tsx         # ❌ B-roll搜索
│   │   │   └── BrollPreview.tsx        # ❌ B-roll预览播放器
│   │   │
│   │   ├── sidebar/                    # ✅ 已实现 - 侧边栏组件
│   │   │   └── SidebarTabs.tsx         # ✅ 工具栏 (已支持5个工具图标)
│   │   │
│   │   ├── common/                     # ⚠️ 部分实现 - 通用组件
│   │   │   ├── Watermark.tsx           # ✅ 水印组件
│   │   │   ├── LoadingSpinner.tsx      # ❌ 加载动画
│   │   │   ├── SearchInput.tsx         # ❌ 搜索输入框
│   │   │   ├── ColorPicker.tsx         # ❌ 颜色选择器
│   │   │   └── DragDropZone.tsx        # ❌ 拖拽上传区域
│   │   │
│   │   └── icons/                      # ❌ 待开发 - 图标组件
│   │       ├── ToolIcons.tsx           # ❌ 工具栏图标集合
│   │       ├── TextIcons.tsx           # ❌ 文字样式图标
│   │       ├── AnimationIcons.tsx      # ❌ 动画效果图标
│   │       ├── AudioIcons.tsx          # ❌ 音频相关图标
│   │       └── MediaIcons.tsx          # ❌ 媒体相关图标
│   │
│   ├── stores/                         # ✅ 状态管理层 - 应用状态协调
│   │   ├── useProjectStore.ts          # ✅ 项目状态 + 应用阶段管理 (已支持位置和动画)
│   │   ├── useUIStore.ts               # ✅ UI状态管理
│   │   ├── useTimelineStore.ts         # ✅ 时间轴状态
│   │   ├── useSettingsStore.ts         # ✅ 用户设置
│   │   ├── useTextStyleStore.ts        # ✅ 文字样式状态管理 (已修复类型转换)
│   │   ├── useTemplateStore.ts         # ✅ 动效模板状态管理
│   │   ├── useAudioStore.ts            # ✅ 音频素材状态管理
│   │   ├── useMediaStore.ts            # ✅ 媒体素材状态管理
│   │   └── useBrollStore.ts            # ✅ B-roll素材状态管理
│   │
│   ├── utils/                          # ⚠️ 工具函数层 - 纯功能函数，无状态
│   │   ├── fileUpload.ts               # ✅ 文件上传工具函数
│   │   ├── videoUtils.ts               # ✅ 视频播放工具函数
│   │   ├── subtitleParser.ts           # ✅ SRT字幕解析工具
│   │   ├── timelineUtils.ts            # ✅ 时间轴工具函数
│   │   ├── textStyleUtils.ts           # ✅ 文字样式处理工具
│   │   ├── animationUtils.ts           # ✅ 动画效果工具
│   │   ├── previewUtils.ts             # ✅ 预览渲染工具 (已修复类型错误)
│   │   ├── audioUtils.ts               # ✅ 音频处理工具
│   │   ├── mediaUtils.ts               # ✅ 媒体素材工具
│   │   ├── mediaApi.ts                 # ✅ 媒体API集成 (已重构为通用API)
│   │   ├── brollUtils.ts               # ✅ B-roll处理工具 (已修复类型错误)
│   │   └── exportUtils.ts              # ❌ 导出格式转换工具
│   │
│   ├── types/                          # ✅ 类型定义
│   │   ├── project.ts                  # ✅ 项目类型
│   │   ├── subtitle.ts                 # ✅ 字幕类型 (已扩展fontWeight、fontStyle支持)
│   │   ├── timeline.ts                 # ✅ 时间轴类型
│   │   ├── ui.ts                       # ✅ UI类型
│   │   ├── textStyle.ts                # ✅ 文字样式类型定义
│   │   ├── animation.ts                # ✅ 动画效果类型定义
│   │   ├── audio.ts                    # ✅ 音频素材类型定义
│   │   ├── media.ts                    # ✅ 媒体素材类型定义
│   │   └── broll.ts                    # ✅ B-roll类型定义
│   │
│   ├── constants/                      # ✅ 常量配置
│   │   ├── config.ts                   # ✅ 应用配置
│   │   ├── keymap.ts                   # ✅ 快捷键映射
│   │   ├── styles.ts                   # ✅ 样式常量
│   │   ├── textStyleTemplates.ts       # ✅ 文字样式模板数据（基本/社交媒体/标题/便签）
│   │   ├── animationTemplates.ts       # ✅ 动画效果模板数据（自定义/精选/动态/基本）
│   │   ├── mediaCategories.ts          # ✅ 媒体分类配置
│   │   └── icons.ts                    # ❌ 图标映射配置
│   │
│   └── hooks/                          # ❌ 自定义Hooks
│       ├── useKeyboardShortcuts.ts     # ✅ 键盘快捷键系统
│       ├── useTextStylePreview.ts      # ❌ 文字样式预览Hook
│       ├── useAnimationPlayer.ts       # ❌ 动画播放Hook
│       ├── useAudioPlayer.ts           # ❌ 音频播放Hook
│       ├── useGiphyApi.ts              # ❌ Giphy API Hook
│       └── useBrollRecommendation.ts   # ❌ B-roll推荐Hook
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 核心架构原则

### 1. 分层架构清晰
- **工具函数层 (utils/)** - 纯功能函数，无状态，可测试复用
- **状态管理层 (stores/)** - 应用状态协调，业务逻辑控制  
- **UI布局层 (components/)** - 页面布局和交互，调用工具函数
- **页面级组件 (pages/)** - 完整页面的布局组合

### 2. 职责分离明确
```
用户操作 → UI组件交互 → 调用状态管理 → 更新项目数据 → 触发UI更新
```

### 3. 模块功能独立
每个功能模块都有独立的：
- **组件目录** - 负责该功能的UI展示和交互
- **状态管理** - 管理该功能的数据状态
- **工具函数** - 处理该功能的业务逻辑
- **类型定义** - 该功能的TypeScript类型
- **常量配置** - 该功能的配置数据

## 5个主要功能模块

### 1. **文字 (text/)** - 静态样式模板 ✅ 已完成
- 按应用场景分类：基本/社交媒体/标题/便签
- 提供预设的外观样式模板
- 支持样式预览和快速应用
- 集成快速编辑工具栏

### 2. **模板 (templates/)** - 动态效果模板 ❌ 待开发
- 按动效分类：自定义/精选/高级/基本
- 提供预设的动画效果组合
- 支持动画实时预览

### 3. **音频 (audio/)** - 背景音乐库 ❌ 待开发
- 6种音乐风格分类
- 音频上传、预听、控制功能

### 4. **媒体 (media/)** - 视觉素材库 ❌ 待开发
- Giphy Sticker和GIFS集成
- 搜索、预览、添加功能

### 5. **B-roll (broll/)** - 相关视频片段 ❌ 待开发
- AI推荐相关短片
- B-roll素材库和搜索

## 数据流架构

### 完整的状态管理体系
```
useProjectStore (全局项目状态)
├── 字幕数据 (支持位置、样式、动画)
├── 项目配置和播放状态
└── 数据持久化和同步

功能模块状态管理：
├── useTextStyleStore (文字样式选择) ✅ 已完成
├── useTemplateStore (动效模板选择) ✅ 已完成
├── useAudioStore (音频管理和播放) ✅ 已完成
├── useMediaStore (媒体素材搜索和放置) ✅ 已完成
└── useBrollStore (B-roll管理和推荐) ✅ 已完成

UI状态管理：
├── useUIStore (界面状态) ✅ 已完成
├── useTimelineStore (时间轴状态) ✅ 已完成
└── useSettingsStore (用户设置) ✅ 已完成
```

### 用户操作数据流
```
1. 选择样式/效果 → 功能Store状态更新 → 应用到项目数据
2. 项目数据变更 → 触发组件重新渲染 → 实时预览更新
3. 最终导出 → 收集所有数据 → 后端服务处理
```

## 已实现的关键功能

### 字幕样式应用系统
- 文字样式模板选择和应用
- 实时样式预览和更新
- TextStyleConfig → SubtitleStyle 类型转换
- 字幕位置拖拽和样式同步

### 视频字幕交互系统
- 字幕选中状态管理
- 位置拖拽功能
- 快速编辑工具栏
- 双击进入详细编辑

### 快速编辑工具栏功能
- 高亮效果选择（多种发光颜色）
- 字体类型下拉选择
- 字体大小下拉选择
- 样式按钮跳转文字面板