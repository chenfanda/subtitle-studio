项目概述
这是一个基于 React + TypeScript 的在线视频编辑器，支持字幕编辑、文字元素、动画效果、音频配音、B-roll 视频、媒体贴纸等功能。
核心特性

✅ 字幕编辑：富文本编辑、样式定制、动画效果
✅ 文字元素：独立文字层，支持拖拽、缩放、旋转
✅ 音频系统：背景音乐、字幕配音、音频库
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
```

拆分后（新架构）
```typescript
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

## 🆕 核心功能说明

### 1. 撤销/重做系统

**功能特性**：
- 最多保存 5 个历史快照
- 支持字幕、文字元素、媒体、B-roll、音频的所有操作
- 拖动优化：移动超过 5px 才记录快照，避免点击误触发
- 批量操作：多个连续操作只记录一次快照

**支持的操作**：
- 字幕：添加、删除、修改、拆分、合并、位置、样式、动画
- 文字元素：添加、删除、修改、位置、变换
- 媒体：添加、删除、修改时间范围
- B-roll：添加、删除、修改时间范围
- 音频：添加、删除背景音乐

**快捷键**：
- `Ctrl+Z`：撤销
- `Ctrl+Y` 或 `Ctrl+Shift+Z`：重做

**实现原理**：
- 使用 `structuredClone()` 深拷贝快照，确保数据独立
- `isRestoring` 标志防止恢复时触发新的快照记录
- 限制历史栈大小为 5，自动移除最旧记录

---

### 2. 视频画面交互系统

#### 全局视频工具栏状态（`videoToolbar`）

**状态结构**：
```typescript
videoToolbar: {
  visible: boolean;           // 工具栏是否显示
  targetType: 'subtitle' | 'textElement' | null;  // 目标类型
  targetId: string | null;    // 目标元素ID
}
```

**核心原则**：
- 边框显示 = `videoToolbar.targetId` 匹配当前元素
- 工具栏显示 = 边框显示 + `videoToolbar.visible = true`
- 删除按钮激活 = 工具栏显示

#### 多来源选择机制

**选择来源**：
1. **视频画面点击**：显示边框 + 工具栏
2. **字幕列表点击**：不显示视频画面边框/工具栏，只高亮列表和时间轴
3. **时间轴点击**：不显示视频画面边框/工具栏，只高亮时间轴和列表

**状态关系**：
- `selectedSubtitleIds`：全局选中状态（用于列表、时间轴高亮、快捷键）
- `videoToolbar`：视频画面状态（用于边框、工具栏、删除按钮）
- 两者独立管理，互不影响

#### 防误删保护

**机制**：
1. 只有工具栏显示时，视频控制栏的删除按钮才激活
2. 关闭工具栏 = 边框消失 + 删除按钮禁用
3. 快捷键删除仍然可用（依赖 `selectedSubtitleIds`）

**工具栏关闭逻辑**：
- 无编辑器打开：清除 `videoToolbar` 状态，边框消失
- 有编辑器打开：只设置 `visible = false`，边框保持（用户知道在编辑哪个元素）

#### 快速工具栏

**功能**：
- 发光颜色：设置文字发光效果
- 亮度调节：调节发光强度
- 字体选择：快速切换字体
- 字号选择：快速调整大小
- 样式按钮：打开富文本编辑器
- 关闭按钮：关闭工具栏

**定位逻辑**：
- 相对于整个视频画面定位
- 使用 `left: x%, top: y% + 30px, transform: translateX(-50%)` 实现居中
- 字幕和文字元素使用相同的定位基准，确保对齐一致

**优化**：
- "样式"按钮添加 `whitespace-nowrap` 防止文字换行
- 工具栏距离元素边框 30px，适中的视觉间距

---

### 3. 拖动优化

**优化点**：
1. **移动阈值**：移动超过 5px 才记录快照
2. **点击保护**：纯点击不记录快照，避免浪费历史栈
3. **状态管理**：
   - `isDragging`：是否正在拖动
   - `hasMoved`：是否已移动超过阈值
   - `dragStartPos`：记录起始位置

**实现**：
```typescript
// mousedown 时记录起始位置
dragStartPos.current = { x: e.clientX, y: e.clientY };

// mousemove 时判断是否超过阈值
if (!hasMoved && dragStartPos.current) {
  const deltaX = Math.abs(moveEvent.clientX - dragStartPos.current.x);
  const deltaY = Math.abs(moveEvent.clientY - dragStartPos.current.y);
  
  if (deltaX > 5 || deltaY > 5) {
    setHasMoved(true);
    useHistoryStore.getState().pushState();  // 只在这里记录一次
  }
}
```

---

### 4. 点击空白区域清除选择

**功能**：点击视频画面空白区域，清除所有选择和编辑状态

**清除内容**：
- 字幕选择（`selectedSubtitleIds`）
- 文字元素选择（`selectedTextElementIds`）
- 视频工具栏状态（`videoToolbar`）
- 富文本编辑器
- 编辑状态（`editingSubtitleId`, `editingTextElementId`）

**实现**：
```typescript
const handleClickOutside = (e: React.MouseEvent) => {
  if (e.target === e.currentTarget) {  // 确保点击的是容器本身
    clearSelectedSubtitles();
    clearSelectedTextElements();
    clearVideoToolbar();
    setShowRichTextEditor(false);
    setEditingSubtitle(null);
    setEditingTextElement(null);
  }
};
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
│   │   ├── HeaderBar.tsx                  # ⭐ 顶部栏（撤销/重做按钮）
│   │   ├── LeftSidebar.tsx                # 左侧边栏
│   │   ├── RightSidebar.tsx               # 右侧边栏
│   │   ├── VideoArea.tsx                  # ⭐ 视频区域（点击空白清除选择）
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
│   │   ├── SubtitleEditor.tsx             # ⭐ 字幕编辑器（双击编辑）
│   │   ├── SubtitleList.tsx               # ⭐ 字幕列表（点击选择）
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
│   │   ├── SubtitleTrack.tsx              # ⭐ 字幕轨道（点击选择）
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
│       ├── VideoControls.tsx              # ⭐ 播放控制（删除按钮防误删）
│       ├── VideoUpload.tsx                # 视频上传
│       ├── SubtitleOverlay.tsx            # ⭐ 字幕叠加层（拖动、选择、工具栏）
│       ├── TextElementOverlay.tsx         # ⭐ 文字元素叠加层（拖动、选择、工具栏）
│       ├── QuickToolbar.tsx               # ⭐ 快速工具栏（共用组件）
│       └── VideoPreview.tsx               # 视频预览
│
├── stores/                         # 状态管理（Zustand + Immer）
│   ├── useProjectStore.ts                 # ⭐ 项目基础状态（播放控制、项目信息）
│   ├── useSubtitleStore.ts                # ⭐ 字幕状态管理（CRUD、restore）
│   ├── useTextElementStore.ts             # ⭐ 文字元素状态管理（CRUD、restore）
│   ├── useHistoryStore.ts                 # ⭐⭐ 历史记录管理（全局快照、撤销/重做）
│   ├── useUIStore.ts                      # ⭐⭐ UI 状态管理（新增 videoToolbar）
│   ├── useTimelineStore.ts                # 时间轴状态
│   ├── useTextStyleStore.ts               # 文字样式状态（使用 useSubtitleStore）
│   ├── useTemplateStore.ts                # 动画模板状态（使用 useSubtitleStore）
│   ├── useAudioStore.ts                   # ⭐ 音频状态（新增 restoreBackgroundMusic）
│   ├── useBrollStore.ts                   # ⭐ B-roll 状态（新增 restorePlacedBrolls）
│   ├── useMediaStore.ts                   # ⭐ 媒体资源状态（新增 restorePlacedMedia）
│   ├── useSettingsStore.ts                # 设置状态
│   └── useExportStore.ts                  # 导出状态
│
├── types/                          # TypeScript 类型定义
│   ├── project.ts                         # 项目类型
│   ├── subtitle.ts                        # 字幕类型
│   ├── textElement.ts                     # 文字元素类型
│   ├── history.ts                         # ⭐ 历史记录类型（新增 isRestoring）
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
│   └── useUndo.ts                         # 撤销/重做 Hook
```

---

## 关键实现细节

### 1. Store 职责划分

| Store | 职责 | 关键方法 |
|-------|------|---------|
| `useProjectStore` | 项目信息、播放控制 | `togglePlayback`, `setCurrentTime` |
| `useSubtitleStore` | 字幕 CRUD | `updateSubtitle`, `deleteSubtitle`, `restoreSubtitles` |
| `useTextElementStore` | 文字元素 CRUD | `addTextElement`, `deleteTextElement`, `restoreTextElements` |
| `useHistoryStore` | 历史记录 | `pushState`, `undo`, `redo`, `collectCurrentSnapshot`, `restoreSnapshot` |
| `useUIStore` | UI 状态 | `setVideoToolbar`, `clearVideoToolbar`, `setSelectedSubtitles` |
| `useMediaStore` | 媒体资源 | `placeOnTimeline`, `removeMedia`, `restorePlacedMedia` |
| `useBrollStore` | B-roll 管理 | `placeOnTimeline`, `removeBroll`, `restorePlacedBrolls` |
| `useAudioStore` | 音频管理 | `setBackgroundMusic`, `restoreBackgroundMusic` |

### 2. 快照机制

**快照内容**（`ProjectSnapshot`）：
```typescript
{
  subtitles: SubtitleItem[];
  textElements: TextElement[];
  placedMedia: PlacedMediaItem[];
  placedBrolls: BrollPlacement[];
  backgroundMusic: AudioTrack | null;
  timestamp: number;
}
```

**收集逻辑**：
```typescript
collectCurrentSnapshot(): ProjectSnapshot {
  return structuredClone({
    subtitles: useSubtitleStore.getState().subtitles,
    textElements: useTextElementStore.getState().textElements,
    placedMedia: useMediaStore.getState().placedMedia,
    placedBrolls: useBrollStore.getState().placedBrolls,
    backgroundMusic: useAudioStore.getState().backgroundMusic,
    timestamp: Date.now()
  });
}
```

**恢复逻辑**：
```typescript
restoreSnapshot(snapshot: ProjectSnapshot) {
  isRestoring = true;  // 防止触发新快照
  
  useSubtitleStore.getState().restoreSubtitles(snapshot.subtitles);
  useTextElementStore.getState().restoreTextElements(snapshot.textElements);
  useMediaStore.getState().restorePlacedMedia(snapshot.placedMedia);
  useBrollStore.getState().restorePlacedBrolls(snapshot.placedBrolls);
  useAudioStore.getState().restoreBackgroundMusic(snapshot.backgroundMusic);
  
  // 清除选中状态
  useUIStore.getState().clearSelectedSubtitles();
  useUIStore.getState().clearSelectedTextElements();
  
  isRestoring = false;
}
```

### 3. 视频工具栏状态机

**状态转换**：
未选中 → 点击元素 → 显示边框+工具栏 (visible=true, targetId=id)
↓
关闭工具栏 → 边框消失 (visible=false, targetId=null)
↓
打开编辑器 → 工具栏消失但边框保持 (visible=false, targetId=id)
↓
点击空白区域 → 完全清除 (visible=false, targetId=null)
---

## 📝 开发规范

### 状态管理规范

1. **Store 职责单一**：每个 Store 只管理一类数据
2. **提供 restore 方法**：所有需要快照的 Store 必须提供 `restore()` 方法
3. **调用 pushState**：所有修改操作后调用 `useHistoryStore.getState().pushState()`
4. **批量操作**：使用 `startBatch()` 和 `endBatch()` 包裹批量操作

### 组件开发规范

1. **Overlay 组件**：
   - 工具栏必须渲染在组件外部，相对于整个视频画面定位
   - 使用全局 `videoToolbar` 状态判断边框和工具栏显示
   
2. **拖动优化**：
   - 记录起始位置，移动超过 5px 才记录快照
   - 使用 `isDragging` 和 `hasMoved` 状态管理

3. **选择逻辑**：
   - 点击元素时清除其他类型元素的选择
   - 设置 `videoToolbar` 状态

### 类型定义规范

1. 所有 Store 状态使用 TypeScript 严格类型
2. 组件 Props 使用 interface 定义
3. 快照类型与实际 Store 数据保持一致

---