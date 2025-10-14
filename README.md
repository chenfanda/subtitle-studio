ubtitle-studio/
├── src/
│   ├── components/                     # UI布局层 - 页面布局和交互
│   │   ├── pages/                      # ✅ 已实现 - 页面级组件
│   │   │   ├── UploadStage.tsx         # ✅ 文件上传页面
│   │   │   ├── ProcessingStage.tsx     # ✅ AI处理等待页面
│   │   │   └── EditingStage.tsx        # ✅ 编辑页面 (已集成AudioPlayer)
│   │   │
│   │   ├── layout/                     # ✅ 已实现 - 基础布局组件
│   │   │   ├── AppLayout.tsx           # ✅ 页面路由器
│   │   │   ├── HeaderBar.tsx           # ✅ 顶部标题栏
│   │   │   ├── LeftSidebar.tsx         # ✅ 已集成 - 左侧边栏容器 (已添加BrollPanel路由)
│   │   │   ├── VideoArea.tsx           # ✅ 已集成 - 视频区域 (已添加BrollVideoPlayer)
│   │   │   └── TimelineArea.tsx        # ✅ 时间轴区域容器
│   │   │
│   │   ├── video/                      # ✅ 已实现 - 视频相关组件
│   │   │   ├── VideoPlayer.tsx         # ✅ 视频播放器组件
│   │   │   ├── VideoControls.tsx       # ✅ 播放控制栏
│   │   │   ├── SubtitleOverlay.tsx     # ✅ 字幕叠加层 (已支持富文本渲染、快速工具栏、缩放控制)
│   │   │   ├── SubtitleQuickToolbar.tsx # ✅ 快速编辑工具栏 (发光颜色+亮度控制、字体选择) 🔧 已修复
│   │   │   ├── MediaOverlay.tsx        # ✅ 媒体叠加层 (贴纸+GIF叠加)
│   │   │   └── EffectOverlay.tsx       # ❌ 待开发 - 特效叠加层
│   │   │
│   │   ├── timeline/                   # ✅ 已实现 - 时间轴组件
│   │   │   ├── Timeline.tsx            # ✅ 时间轴主组件
│   │   │   ├── TimelineRuler.tsx       # ✅ 时间刻度标尺
│   │   │   ├── PlayheadIndicator.tsx   # ✅ 播放指示器
│   │   │   ├── SubtitleTrack.tsx       # ✅ 字幕轨道
│   │   │   └── AudioWaveform.tsx       # ✅ 音频波形
│   │   │
│   │   ├── subtitle/                   # ⚠️ 部分实现 - 字幕编辑组件
│   │   │   ├── SubtitleList.tsx        # ✅ 字幕列表面板
│   │   │   ├── SubtitleEditor.tsx      # ⚠️ 需集成 - 富文本字幕编辑器 (需添加媒体插入功能)
│   │   │   ├── SubtitlePanel.tsx       # ✅ 字幕面板容器
│   │   │   └── SubtitleToolbar.tsx     # ✅ 字幕工具栏
│   │   │
│   │   ├── text/                       # ✅ 已实现 - 文字样式相关组件
│   │   │   ├── TextPanel.tsx           # ✅ 文字样式面板容器
│   │   │   ├── BasicStylesTab.tsx      # ✅ "基本"分类 - 基础文字样式模板
│   │   │   ├── SocialMediaTab.tsx      # ✅ "社交媒体"分类 - 社交平台样式模板
│   │   │   ├── TitleStylesTab.tsx      # ✅ "标题"分类 - 标题类样式模板
│   │   │   ├── NoteStylesTab.tsx       # ✅ "便签"分类 - 便签/标注样式模板
│   │   │   └── StylePreviewCard.tsx    # ✅ 样式模板预览卡片
│   │   │
│   │   ├── templates/                  # ✅ 已实现 - 动态效果模板相关组件
│   │   │   ├── TemplatePanel.tsx       # ✅ 动态效果模板面板容器
│   │   │   ├── CustomEffectsTab.tsx    # ✅ "自定义"标签 - 用户自定义动态效果
│   │   │   ├── FeaturedEffectsTab.tsx  # ✅ "精选"标签 - 官方推荐动态效果
│   │   │   ├── AdvancedEffectsTab.tsx  # ✅ "高级"标签 - 高级动画效果
│   │   │   ├── BasicEffectsTab.tsx     # ✅ "基本"标签 - 基础动画效果
│   │   │   ├── EffectPreviewCard.tsx   # ✅ 动态效果预览卡片
│   │   │   └── AnimationPreview.tsx    # ✅ 动画效果实时预览组件
│   │   │
│   │   ├── audio/                      # ✅ 已实现 - 音频库相关组件
│   │   │   ├── AudioPanel.tsx          # ✅ 音频面板容器 (6个分类标签页)
│   │   │   ├── AudioLibrary.tsx        # ✅ 音频网格展示容器
│   │   │   ├── AudioCard.tsx           # ✅ 单个音频卡片 (悬停播放+点击应用配音)
│   │   │   ├── AudioPlayer.tsx         # ✅ 音频播放引擎 (HTML5 Audio封装)
│   │   │   ├── UploadAudioCard.tsx     # ✅ 音频上传卡片 (集成在自定义分类)
│   │   │   ├── LikeAudioTab.tsx        # ✅ Like分类音频展示
│   │   │   ├── EpicAudioTab.tsx        # ✅ Epic分类音频展示
│   │   │   ├── AmbientAudioTab.tsx     # ✅ Ambient分类音频展示
│   │   │   ├── AcousticAudioTab.tsx    # ✅ Acoustic分类音频展示
│   │   │   ├── ElectronicAudioTab.tsx  # ✅ Electronic分类音频展示
│   │   │   └── CustomAudioTab.tsx      # ✅ 自定义分类 (上传+已上传音频)
│   │   │
│   │   ├── media/                      # ✅ 已实现 - 媒体素材相关组件
│   │   │   ├── MediaPanel.tsx          # ✅ 媒体面板容器 (贴纸+GIF分类标签)
│   │   │   ├── StickerLibrary.tsx      # ✅ Giphy Sticker库展示
│   │   │   ├── GifsLibrary.tsx         # ✅ Giphy GIFS库展示
│   │   │   ├── StickerCard.tsx         # ✅ 贴纸卡片组件 (点击应用到视频画面)
│   │   │   ├── GifCard.tsx             # ✅ GIF卡片组件 (点击应用到视频画面)
│   │   │   ├── MediaSearch.tsx         # ✅ 媒体搜索组件 (搜索历史+关键词)
│   │   │   ├── MediaUpload.tsx         # ✅ 媒体上传组件 (拖拽+文件选择)
│   │   │   └── MediaElement.tsx        # ✅ 视频画面媒体元素 (拖拽+缩放+旋转+删除) 🆕 已集成TransformBorder
│   │   │
│   │   ├── broll/                      # ✅ 已实现 - B-roll相关组件 🆕
│   │   │   ├── BrollPanel.tsx          # ✅ B-roll面板容器 (字幕列表展示)
│   │   │   ├── BrollDialog.tsx         # ✅ B-roll搜索弹窗 (两层视图切换)
│   │   │   ├── BrollSearchView.tsx     # ✅ 搜索视图 (素材库/本地标签)
│   │   │   ├── BrollEditView.tsx       # ✅ 编辑视图 (预览+过渡+应用)
│   │   │   ├── BrollLibrary.tsx        # ✅ B-roll视频网格容器
│   │   │   ├── BrollCard.tsx           # ✅ B-roll视频卡片
│   │   │   ├── BrollLocalView.tsx      # ✅ 本地上传视图 (拖拽+文件上传)
│   │   │   ├── BrollTransitionSelector.tsx # ✅ 过渡动画选择器 (无/淡入/光晕)
│   │   │   └── BrollVideoPlayer.tsx    # ✅ B-roll视频播放器 (视频替换+过渡效果)
│   │   │
│   │   ├── sidebar/                    # ✅ 已实现 - 侧边栏组件
│   │   │   └── SidebarTabs.tsx         # ✅ 工具栏 (已支持7个工具图标)
│   │   │
│   │   ├── common/                     # ✅ 已实现 - 通用组件 🆕
│   │   │   ├── TransformBorder.tsx     # ✅ 变换控制边框 (缩放+旋转控制点) 🆕 核心组件
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
│   │   ├── useProjectStore.ts          # ✅ 项目状态 (已扩展B-roll管理、字幕缩放、容器宽度) 🔧 已扩展
│   │   ├── useUIStore.ts               # ✅ UI状态管理 (富文本选择、面板控制)
│   │   ├── useTimelineStore.ts         # ✅ 时间轴状态
│   │   ├── useSettingsStore.ts         # ✅ 用户设置
│   │   ├── useTextStyleStore.ts        # ✅ 文字样式状态管理
│   │   ├── useTemplateStore.ts         # ✅ 动效模板状态管理
│   │   ├── useAudioStore.ts            # ✅ 音频素材状态管理 (完整音频播放控制)
│   │   ├── useMediaStore.ts            # ✅ 媒体素材状态管理 (贴纸+GIF管理、scaleX/scaleY) 🔧 已修改
│   │   └── useBrollStore.ts            # ✅ B-roll素材状态管理 (搜索+选择+过渡+应用)
│   │
│   ├── utils/                          # ✅ 工具函数层 - 纯功能函数，无状态
│   │   ├── fileUpload.ts               # ✅ 文件上传工具函数
│   │   ├── videoUtils.ts               # ✅ 视频播放工具函数
│   │   ├── subtitleParser.ts           # ✅ SRT字幕解析工具
│   │   ├── timelineUtils.ts            # ✅ 时间轴工具函数
│   │   ├── textStyleUtils.ts           # ✅ 文字样式+富文本处理工具 (shadow深度合并) 🔧 已修复
│   │   ├── animationUtils.ts           # ✅ 动画效果工具
│   │   ├── previewUtils.ts             # ✅ 预览渲染工具
│   │   ├── audioUtils.ts               # ✅ 音频处理工具 (完整音频处理功能)
│   │   ├── mediaUtils.ts               # ✅ 媒体处理工具 (文件验证+时间计算+显示判断)
│   │   ├── giphyApi.ts                 # ✅ Giphy API模拟工具 (前端模拟数据)
│   │   ├── brollUtils.ts               # ✅ B-roll处理工具 (搜索+上传+过渡样式)
│   │   └── exportUtils.ts              # ❌ 导出格式转换工具
│   │
│   ├── types/                          # ✅ 类型定义
│   │   ├── project.ts                  # ✅ 项目类型
│   │   ├── subtitle.ts                 # ✅ 字幕类型 (已扩展brollVideo、scale、width支持) 🔧 已扩展
│   │   ├── timeline.ts                 # ✅ 时间轴类型
│   │   ├── ui.ts                       # ✅ UI类型
│   │   ├── textStyle.ts                # ✅ 文字样式类型定义
│   │   ├── animation.ts                # ✅ 动画效果类型定义
│   │   ├── audio.ts                    # ✅ 音频素材类型定义 (已扩展custom分类)
│   │   ├── media.ts                    # ✅ 媒体素材类型定义 (scaleX/scaleY) 🔧 已修改
│   │   └── broll.ts                    # ✅ B-roll类型定义 (已扩展BrollTransition和BrollVideoData)
│   │
│   ├── constants/                      # ✅ 常量配置
│   │   ├── config.ts                   # ✅ 应用配置
│   │   ├── keymap.ts                   # ✅ 快捷键映射
│   │   ├── styles.ts                   # ✅ 样式常量
│   │   ├── textStyleTemplates.ts       # ✅ 文字样式模板数据
│   │   ├── animationTemplates.ts       # ✅ 动画效果模板数据
│   │   ├── audioCategories.ts          # ✅ 音频分类配置 (已添加custom分类和完整数据)
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

## 核心架构原则

### 1. 分层架构清晰
- **工具函数层 (utils/)** - 纯功能函数，无状态，可测试复用
- **状态管理层 (stores/)** - 应用状态协调，业务逻辑控制  
- **UI布局层 (components/)** - 页面布局和交互，调用工具函数
- **页面级组件 (pages/)** - 完整页面的布局组合

### 2. 职责分离明确
用户操作 → UI组件交互 → 调用状态管理 → 更新项目数据 → 触发UI更新

### 3. 模块功能独立
每个功能模块都有独立的：
- **组件目录** - 负责该功能的UI展示和交互
- **状态管理** - 管理该功能的数据状态
- **工具函数** - 处理该功能的业务逻辑
- **类型定义** - 该功能的TypeScript类型
- **常量配置** - 该功能的配置数据

## 7个主要功能模块

### 1. **文字 (text/)** - 静态样式模板 ✅ 已完成
- 按应用场景分类：基本/社交媒体/标题/便签
- 提供预设的外观样式模板
- 支持样式预览和快速应用
- 集成快速编辑工具栏

### 2. **模板 (templates/)** - 动态效果模板 ✅ 已完成
- 按动效分类：自定义/精选/高级/基本
- 提供预设的动画效果组合
- 支持动画实时预览

### 3. **音频 (audio/)** - 背景音乐库 ✅ 已完成
- 7种音乐风格分类 (Like/Epic/Ambient/Acoustic/Electronic/Hip Hop/自定义)
- 悬停音频预览，点击配音应用
- 音频上传、管理和配音到字幕功能

### 4. **媒体 (media/)** - 视觉素材库 ✅ 已完成
- Giphy Sticker和GIFS集成
- 搜索、预览、添加功能
- 支持自定义上传
- **支持缩放和旋转控制** 🆕

### 5. **B-roll (broll/)** - 视频画面替换 ✅ 已完成 🆕
- 搜索B-roll视频素材
- 本地上传视频文件
- 过渡动画效果（无/淡入/光晕）
- 视频画面替换字幕时段
- 保持字幕和配音不变

### 6. **变换控制 (TransformBorder)** - 通用变换组件 ✅ 已完成 🆕
- **字幕模式**：6个控制点
  - 4个角控制点：等比缩放字幕
  - 2个边控制点（左/右）：调整容器宽度（文字居中，改变位置）
- **媒体模式**：8个控制点
  - 4个角控制点：等比缩放图片/GIF
  - 4个边控制点（上下左右）：非等比缩放（拉伸变形）
- **核心特性**：
  - 边框跟随对象缩放
  - 控制点实时响应
  - 支持最小/最大缩放约束
  - 统一的白色控制点样式

### 7. **快速工具栏 (SubtitleQuickToolbar)** - 字幕快速编辑 ✅ 已完成 🔧
- 发光颜色选择（7种预设颜色）
- 发光亮度调节（5-30范围）
- 字体选择（5种字体）
- 字号调整（12-48px）
- **已修复**：发光亮度调节问题

## 数据流架构

### 完整的状态管理体系