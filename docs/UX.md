# ImageGlitch UX Specification

## User Journey

1. 上传图片 → 提供样例图片（已有，无需修改，重构为组件即可）
2. 点击元素 → 左边实时生成 mask，右侧生成抠图预览并进入资产
3. 迭代优化 → 加点扩充区域 / 撤销
4. 提交一个主体 → 继续抠下一个 / 或退出进入编排
5. 预览效果 → 配合 BGM 预览（播放进度从灰到白）
6. 编排（排序/时长/复制/删除）→ 调整最终输出
7. 导出 → 选择格式和内容

---

## Page Layout（重点）

> 核心直觉：**左侧做（编辑）→ 中间交付（提交）→ 右侧排（编排/时间线）**
> 避免 Done/Clear “突然出现”：所有关键动作在固定区域出现/禁用。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Top Bar: Logo/Project  Undo⟲ Redo⟳    Play␣  Loop☐   Help?            Export│
├───────────────────────────────┬───────────────┬─────────────────────────────┤
│           CANVAS (4:3)        │  Commit Dock  │        ASSETS / TIMELINE     │
│  MiniMap + Viewport box       │  ✅ Add       │  Global: Style ▾  BGM ▾      │
│  Image + Mask overlay + Points│  ⟲ Reset      │  DefaultDur: 0.10s Step:0.05 │
│  Border: subject color        │  ✕ Exit       │  (EDITING时右侧🔒不可拖拽)    │
│  Badge: EDITING / READY       │               │  Rows: Subject + Duration     │
└───────────────────────────────┴───────────────┴─────────────────────────────┘
```

### 顶部 Top Bar（全局工具带）

* **Undo / Redo**：全局可见（状态不满足时禁用）
* **Play（Space）**：空格触发播放/暂停
* **Loop 开关**：默认关闭
* **Help (?)**：打开快捷键与手势说明
* **Export**：进入导出弹窗/页

> 注：Upload/Select/Export 三步导航在编辑模式下不显示（或弱化为单一页面入口），避免占用宝贵顶部区域。

---

## SELECT Step（核心交互）

### 交互状态机（明确模式，减少误操作）

> 目标：用户始终知道“我现在在编辑哪个 subject / 下一次点击会发生什么”。

* **Editing（编辑中 / Staging）**

  * 左侧 Canvas 存在一个“当前 staging subject”（可为空/灰态）
  * 点击 Canvas：给 staging subject 添加正向点并更新 mask
  * 中间 Commit Dock 可用：✅ Add / ⟲ Reset / ✕ Exit
  * 右侧 Assets 被锁定（🔒不可拖拽），避免边编辑边编排
* **Arrange（编排中）**

  * 不再接收 Canvas 点选（或点选会进入新一轮 Editing，见下）
  * 右侧 Assets 解锁（↕可拖拽排序、可调时长、可复制/删除）
* **Previewing（预览中）**

  * 禁止一切会改变状态的操作（编辑/拖拽/删除/复制/改时长）
  * 播放结束回到进入预览前的状态（Editing 或 Arrange）

UI 表达：

* Canvas 外框使用当前 subject 色；未开始编辑时为中性灰
* Canvas 右上角 Badge：`EDITING` / `ARRANGE` / `PREVIEWING`
* 右侧面板 Header 显示锁状态：`🔒 Locked while Editing` / `↕ Reorder enabled`

---

## 左侧 CANVAS（竖屏图为主，容器 4:3）

### 基础编辑

* 点击图片添加**正向点**，自动生成 mask 高亮显示
* 实时显示 staging subject 的 mask 叠加层与点位标记
* **只支持正向点，不提供负点交互**
* 点击区域准确性：

  * 点击坐标基于图片实际显示区域（letterbox 之外点击不触发）

### MiniMap（小预览框）

* Canvas 左上角一个小预览框（MiniMap）

  * 显示整张图缩略图
  * 叠加一个视窗框（表示当前画布视野位置/缩放）
* 支持：滚轮缩放、拖拽平移（Space+Drag / 触控板双指拖）

### 视觉反馈（编辑熟悉感）

* 进入 Editing 时：

  * Canvas 外框与 staging subject 颜色一致
  * 右上角 Badge 显示 `EDITING`（带底色）
* 未开始编辑（staging 为空）时：

  * Canvas 边框为灰色
  * Hint：`Click on image to start a new subject`

---

## 中间 Commit Dock（固定三键，不“突然冒出来”）

> Commit Dock 是工作流收口：**把左侧编辑结果交付到右侧资产**。

* **✅ Add（加入）**

  * 将当前 staging subject 提交到右侧 Assets 列表
  * 提交后：

    * staging subject 清空（回到灰态等待下一次点选）
    * 自动保持 Editing 状态（方便继续抠下一个）
* **⟲ Reset（清空）**

  * 仅清空当前 staging subject：points/mask/preview 全部归零
  * 不影响右侧已提交的 assets
* **✕ Exit（退出）**

  * 退出 Editing → 进入 Arrange（右侧解锁可拖拽排序/调整时长等）
  * staging subject 清空

可用性规则：

* staging 为空时：✅ Add、⟲ Reset 禁用（仍显示）
* Previewing 时：三键全部禁用

---

## 右侧 ASSETS / TIMELINE（Subject 列表 + 时间线）

### 顶部全局设置（预览上下文）

* **Style（预览风格）**：`Highlight` / `Solid Color`

  * 默认：Highlight
  * Style 是全局预览设置（影响播放效果）
* **BGM**：固定曲库 + `None`

  * 当前前端时长为占位符；实际曲目最长约 6 秒
* **Default Duration**：默认每个 subject 0.10s
* **Step**：0.05s（时长调整步进，固定）

### 列表行（每个 subject 一行）

每行包含：

* 序号（播放顺序）
* 缩略图（抠图预览或 mask 预览）
* 置信度（右下角）
* **时长控制**：`0.10  [-]  [+]`（按 0.05 步进增减）
* 操作：Duplicate / Delete（可在行尾图标或“⋯”菜单）

### 拖拽排序

* **Editing 状态：右侧🔒锁定不可拖拽**
* **Arrange 状态：解锁可拖拽**

  * 拖拽时其他项自动让位
  * 放手后 spring 动画回弹
  * 序号实时更新

### 播放进度可视化（灰 → 白）

* Previewing 时：

  * 列表从上到下依次高亮当前播放行
  * 当前行背景/进度条由灰渐变到白（与该行时长匹配）
  * 播放完成后恢复列表常态

---

## 预览模式（Previewing）

* 触发：

  * Top Bar Play 按钮
  * 空格 Space（播放/暂停）
* 行为：

  * 所有 subject 按顺序依次闪烁（默认 Highlight 效果）
  * 每个 subject 按行内时长播放（默认 0.10s，可调）
* 预览时锁定：

  * 禁止编辑（Canvas 点击无效）
  * 禁止排序/调时长/复制/删除
  * Commit Dock 禁用
* Loop：

  * 默认关闭：播一遍，结束即停（时长 = Σ subject durations）
  * 开启：循环播放；音频按曲目循环（无音频则仅循环视觉序列）

---

## 快捷键面板（Help）

* Top Bar 右侧常驻 `?` 按钮打开 modal
* 快捷键：

  * Cmd+Z：Undo
  * Cmd+Shift+Z：Redo
  * Space：Play / Pause（Preview）
  * Enter：✅ Add（仅 Editing 且 staging 非空时）
  * Esc：✕ Exit（退出 Editing → Arrange）
  * Delete / Backspace：Delete Subject（Arrange 且列表聚焦时）
  * Cmd+D：Duplicate（Arrange 且选中行时）

---

## 首次引导设计（Onboarding）

* 首次进入页面显示遮罩 + 3 步提示：

  1. 点击左侧 Canvas 开始一个主体（生成 mask）
  2. 满意后点 ✅ Add 加入右侧资产
  3. 点 ✕ Exit 进入编排，空格预览
* 支持跳过；可在 Help 中重新查看

---

## GLITCH STYLE（颜色系统）

### 当前支持

* HIGHLIGHT（高亮）：mask 区域亮度 +100
* SOLID COLOR（颜色填充）：mask 区域填充纯色（用户可调色）

### 设计原则

* 默认只显示高亮和颜色填充
* 高级功能预留接口，不增加当前交互复杂度

---

## 导出设计

### 导出按钮

* Top Bar 右侧 `Export` 按钮
* 点击进入导出弹窗

### 导出选项（主路径：视频）

* MP4 / GIF / Live Photo

### 抠图导出（可选）

* 仅当用户选择“抠图导出”时导出 ZIP：

  * `/A_cropped/`（裁剪主体）
  * `/B_fullsize/`（原图尺度透明背景）

### 导出弹窗结构

* 标题：EXPORT
* 格式选择：MP4 / GIF / Live Photo / 抠图
* 抠图：选择“裁剪 / 原尺度”
* DOWNLOAD / CANCEL

---

## Undo/Redo 约束（必须写入约束，保证一致性）

* **任何改变 subjects 列表或其关键属性的操作都必须可 Undo / Redo：**

  * 添加点（Edit staging）
  * ✅ Add（Commit 到 assets）
  * ⟲ Reset（清空 staging）
  * ✕ Exit（模式切换不必入栈，但其带来的状态变更需一致）
  * 删除（Delete）
  * Duplicate（Copy）
  * 拖拽排序（Reorder）
  * 改色（Change color）
  * 时长调整（Duration +/-）

---

## 跨端一致性（Web → Android/iOS/鸿蒙）

* 保持同一信息架构：**左 Canvas / 中提交 / 右资产时间线**

  * 移动端可将“中提交”并入 Canvas 下沿或底部操作条，但动作语义一致（✅ Add / Reset / Exit）
* 模式一致：Editing / Arrange / Previewing
* 不依赖右键；关键操作用显式按钮
* 预览时锁定编辑为跨端统一规则

---

## 组件拆分计划（包括但不限于）

* Canvas.tsx：图片显示、mask overlay、点位标记、MiniMap、缩放平移
* CommitDock.tsx：✅ Add / ⟲ Reset / ✕ Exit（含禁用状态）
* AssetsTimeline.tsx：列表 + 拖拽排序 + 时长 stepper + 播放进度
* TransportBar.tsx（或 TopBar 内）：Play/Loop/BGM/Style/Export/Help
* ShortcutsModal.tsx：快捷键帮助弹窗
* ExportModal.tsx：导出弹窗

# ImageGlitch 动效规范

> 目标：让用户“看得懂正在发生什么”，并且保持专业工具的**空间连续性**与**状态确定性**。

## 动效

1. **一次性 Encoding（约 20s，带 CRT Scan）**

* 发生在 Upload → Select 之后的首次进入（或更换图片后）
* 重点：建立“正在分析整张图”的感知

2. **每次点击后的 Decoding（约 5s，不用 CRT Scan）**

* 发生在用户点选（添加点）之后
* 重点：建立“我这一击正在生成/优化 mask”的感知（更局部、更快）

## 全局动效原则

* **不闪烁、不抖动**：避免强烈 glitch（容易廉价/易疲劳/易引发不适）
* **空间连续**：上传框 morph 成 Canvas；右侧 Assets 从右滑入（Web 的直觉）
* **状态强提示**：Encoding / Decoding 期间明确锁定交互（避免误触）
* **遵循 reduced motion**：减少扫描带/位移，用淡入淡出替代

---

## 1) Upload（用前端平滑掉模型下载加载等待时间）

### 触发

* 用户拖拽/选择图片成功，或点击 “Use Sample Image”
* 进入 Editor 工作区

### 分镜与时间轴（建议）

**T0（0–120ms）：确认输入**

* Upload 框内文案淡出，框内出现图片缩略（可先模糊/低清，慢慢清晰对应模型加载下载的过程）
* 边框轻微脉冲一次

**T1（120–520ms）：Morph**

* Upload 大框 **缩小 + 平移**，落位到左侧 **Canvas（4:3 容器）**
* 右侧 **Assets/Timeline 面板**从右侧滑入（延迟 80ms，让用户先跟住画布）
* 中间 **Commit Dock**淡入出现，但按钮初始为 **disabled 灰态**（因为还没可提交的 subject）

**T2（520ms+）：进入 Encoding 阶段（见第 2 节）**

* Canvas 上出现 CRT Encoding overlay（仅作用于左侧 Canvas）

> 动效参数：Morph 360–420ms；Assets slide-in 280–320ms；easing：`cubic-bezier(0.2,0.8,0.2,1)`。

---

## 2) 伪 Encoding 阶段（约 12 s，CRT Scan 仅作用于 Canvas）

### 触发

* 首次进入 Select 且需要对整张图 Encoding
* 或用户更换图片后

### 交互锁定规则

* **Canvas 点选：禁用**（避免用户以为点了会立即生成）
* **Commit Dock：禁用**
* **Assets：显示但锁定**
* 提供清晰的“正在分析”态

### CRT Encoding Overlay 视觉构成（只覆盖 Canvas）

* **Scanlines**：低对比的细条纹（静态或轻微漂移）
* **Scan Band（扫描带）**：一条柔和亮带自上而下循环（周期 ~2.2s）
* **Soft Pulse（轻呼吸遮罩）**：轻微暗角/亮度脉冲（幅度小）
* **Phase Label + 进度**：左下角显示阶段文字 + 百分比；底部一条进度条

> 强约束：不要闪白、不要高频抖动；保持“仪器感/专业感”。

### Encoding Phase（1–5）分段与进度分配

> 注：以下是**体验层的节奏分配**，不要求严格匹配真实耗时；但阶段切换必须“可信”。

#### Phase 1 — Initializing encoder（0% → 8%）

* **时长**：~1.5s
* **动效**：scanlines 出现；扫描带首次扫过；进度条从 0 缓慢起步
* **文案**：`INITIALIZING ENCODER`

#### Phase 2 — Loading model weights（8% → 28%）

* **时长**：~4s
* **动效**：扫描带节奏略稳定；轻微噪点（极弱）可出现
* **文案**：`LOADING MODEL WEIGHTS`

#### Phase 3 — Encoding image（28% → 62%）

* **时长**：~7s（主段）
* **动效**：进度条推进更明显；扫描带循环保持
* **文案**：`ENCODING IMAGE`

#### Phase 4 — Extracting features（62% → 84%）

* **时长**：~4.5s
* **动效**：扫描带变“更细/更快一点点”（微调即可）；进度推进略放缓（显得更精细）
* **文案**：`EXTRACTING FEATURES`

#### Phase 5 — Building embeddings（84% → 100%）

* **时长**：~3s
* **动效**：扫描带最后一次扫过后逐渐弱化；进度到 100% 后停留 200–300ms
* **文案**：`BUILDING EMBEDDINGS`

### Encoding 结束收尾（100% → 可交互）

* Overlay 在 250–350ms 内淡出
* Canvas 右上角 badge 切换：`READY`（等待点击创建 subject）或直接 `EDITING`（若你们决定自动进入 staging）
* Assets 仍保持（因为进入 Editing 模式后锁定）

---

## 3) 每次点击后的 Decoding 阶段（约 5s，不使用 CRT Scan）

### 触发

* 用户在 Canvas 点击添加点（正向点）
* 进入一次 5s 的“生成/更新 mask”流程

### 交互锁定规则（5s 内）

* **Canvas 再次点击：禁用**（避免堆叠请求）
* **Commit Dock：禁用（或仅 Reset 可用，视实现）**
* **Assets：锁定（🔒）**
* 允许用户按 Esc 中断（如果你们愿意实现取消）；否则至少明确“处理中”

### Decoding 动效风格（与 Encoding 明确区分）

* 不用 CRT scanlines/扫描带
* 更“局部、更即时”的反馈：

  * 在点击点附近出现一个小的 **progress ring** 或 **spinner**
  * Canvas 左下角显示阶段文案 + 小进度条（更轻量）

---

### Decoding Phase（7–10）分段与进度分配（5s）

#### Phase 7 — Decoding masks（0% → 45%）

* **时长**：~2.2s
* **动效**：点附近 progress ring 开始转；mask overlay 以低 opacity “浮现轮廓”
* **文案**：`DECODING MASKS`

#### Phase 8 — Refining boundaries（45% → 70%）

* **时长**：~1.2s
* **动效**：mask 边缘轻微“收紧/平滑”（可通过两次 alpha/blur 过渡表现）
* **文案**：`REFINING BOUNDARIES`

#### Phase 9 — Scoring candidates（70% → 88%）

* **时长**：~0.9s
* **动效**：置信度标签区域（右侧未来会显示的 score）短暂出现 skeleton/闪一下（很轻）
* **文案**：`SCORING CANDIDATES`

#### Phase 10 — Rendering mask（88% → 100%）

* **时长**：~0.7s
* **动效**：最终 mask 以 150–220ms 的淡入稳定下来；点位保持可见
* **文案**：`RENDERING MASK`

### Decoding 完成收尾

* 局部 ring 消失
* Commit Dock 恢复（如果 staging 非空，✅Add 变为可用）
* 右侧当前 staging 的预览（如果你们做 staging preview）可以在 200ms 内出现

---

## 4) 状态文案与位置（统一规范）

### Canvas 右上角 Badge（带底色）

* `ENCODING`（20s 阶段）
* `READY`（等待第一次点选）
* `EDITING: SUB_XX`（已有 staging/当前编辑对象）
* `PREVIEWING`（播放中）

### Canvas 左下角 Status（短句 + 进度）

* Encoding：显示 Phase + 百分比 + 长进度条
* Decoding：显示 Phase + 百分比 + 短进度条（更轻量）

---

## 5) Reduced Motion（必须支持）

当 `prefers-reduced-motion` 或用户开关开启：

* Encoding：取消扫描带（scan band），只保留静态暗角 + 进度条
* Morph：减少位移，改为淡入淡出 + 小幅缩放（150–220ms）
* Decoding：只用小进度条/百分比，不做环形旋转

---

## 6) 工程对接建议（状态映射）

建议前端状态字段（示意）：

* `samStatus`: `loading_model | encoding | decoding | ready`
* `phaseLabel`: string（上面 1–5 / 7–10）
* `phaseProgress`: 0..1（阶段内）
* `overallProgress`: 0..1（encoding 总进度 or decoding 总进度）
* `uiLock`: boolean（锁住点击/拖拽/提交）

---

## 7) 体验校验点（验收标准）

* 用户能明确区分：
  **“整图分析（20s）”** vs **“一次点击生成（5s）”**
* 用户不会在处理期间误以为系统卡死：
  任何 > 800ms 的等待必须有可见反馈（phase + progress）
* 动效不会抢戏：
  扫描线/扫描带对比度必须克制，避免眩晕与廉价感
