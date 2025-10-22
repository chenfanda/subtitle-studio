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
│   │   ├── AudioCategoryTabs.tsx
│   │   ├── AudioUpload.tsx
│   │   └── BackgroundMusicControl.tsx
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
│   │   ├── Timeline.tsx
│   │   ├── SubtitleTrack.tsx              # ⭐ 字幕轨道（点击选择）
│   │   ├── TextElementTrack.tsx
│   │   ├── MediaTrack.tsx
│   │   ├── AudioTrack.tsx
│   │   ├── TimelineRuler.tsx
│   │   ├── AudioWaveform.tsx
│   │   ├── PlayheadIndicator.tsx
│   │   ├── TimelineZoom.tsx
│   │   └── TimelineScroll.tsx
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
│   ├── useSubtitleStore.ts                # ⭐ 字幕状态 (已修复 updateSubtitle)
│   ├── useTextElementStore.ts             # ⭐ 文字元素状态 (已修复 updateTextElement)
│   ├── useHistoryStore.ts                 # ⭐⭐ 历史记录管理
│   ├── useUIStore.ts                      # ⭐⭐ UI 状态 (管理 videoToolbar, editingSubtitleId)
│   ├── useTimelineStore.ts
│   ├── useTextStyleStore.ts               # ⭐ 文字样式状态
│   ├── useTemplateStore.ts
│   ├── useAudioStore.ts
│   ├── useBrollStore.ts
│   ├── useMediaStore.ts
│   ├── useSettingsStore.ts
│   └── useExportStore.ts
│
├── types/                          # TypeScript 类型定义
│   ├── project.ts
│   ├── subtitle.ts                        # 字幕类型
│   ├── textElement.ts                     # 文字元素类型
│   ├── history.ts
│   ├── animation.ts
│   ├── textStyle.ts
│   ├── audio.ts
│   ├── broll.ts
│   ├── media.ts
│   ├── ui.ts                              # ⭐ UI 类型 (定义 UIState, editingSubtitleId)
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
│   ├── audioCategories.ts
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