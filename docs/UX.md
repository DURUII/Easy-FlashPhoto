# ImageGlitch UX Specification

## User Journey

1. 首次引导 → 用户知道怎么做
2. 点击元素 → 左边显示 mask，右边显示抠图预览
3. 迭代优化 → 加点扩充区域 / 撤销
4. 完成一个主体 → 继续抠下一个
5. 预览效果 → 配合 BGM 预览
6. 组合/复制/删除 → 调整最终输出
7. 导出 → 选择格式和内容

---

## Page Layout

| SOURCE (50%) | SUBJECTS (50%)   |
| ------------ | ---------------- |
| 实时编辑区        | subject 列表 + 操作区 |

---

## SELECT Step（核心交互）

### 交互状态机（明确模式，减少误操作）

> 目标：用户始终知道“我现在在编辑哪个 subject / 下一次点击会发生什么”。

* **Idle（未编辑）**

  * 无 active subject（或上一 subject 已 DONE）
  * 点击 SOURCE：创建新 subject，并进入 Editing
* **Editing（编辑中）**

  * 有 active subject
  * 点击 SOURCE：给 active subject 添加正向点并更新 mask
  * DONE：退出 Editing 回到 Idle
  * CLEAR：重置当前 active subject（仅清点，不删除 card）
* **Previewing（预览中）**

  * 禁止编辑、拖拽、删除、复制等所有会改变状态的操作
  * 预览结束后回到进入预览前的状态（通常回到 Idle）

UI 表达：

* SOURCE header 常驻状态文案：`READY` / `EDITING: SUB_XX` / `PREVIEWING`
* SUBJECTS 列表 active card 高亮，并与 SOURCE 叠加层一致

---

### 左侧 SOURCE 区域

* 点击图片添加**正向点**，自动生成 mask 高亮显示
* 实时显示当前编辑 subject 的 mask 叠加层
* **只支持正向点，不提供负点交互**
* 撤销：Cmd+Z / 重做：Cmd+Shift+Z
* 点击 DONE 完成当前 subject，继续点选下一个
* 点击 CLEAR 重新开始当前 subject

  * **CLEAR 语义：清空 points + 清空 mask + 清空 preview（保留该 subject card）**
* 点击区域准确性：

  * 点击坐标基于图片实际显示区域（letterbox 之外点击不触发）
  * 触控板/触屏端不依赖右键（仅单击 + 显式按钮 DONE/CLEAR）

---

### 右侧 SUBJECTS 区域

* Subject Card 结构：**序号 + 颜色 picker + 抠图预览 + 置信度**
* 序号 = 通电展示顺序，拖拽调整顺序（Apple 图标式自然补齐动画）
* 颜色 picker：默认预设颜色，用户可自定义

  * 改色不需要重新跑 SAM：仅重绘 overlay（基于 mask 数据重新着色）
* 去掉 2pt 显示
* 置信度显示在每个 card 右下方（建议显示为百分比整数/一位小数）
* Duplicate：复制该 subject，插入原位置下方

  * 副本继承原 subject 的所有属性（mask、颜色、点、预览、置信度）
  * **副本必须拥有新 id**
* 删除：点击删除按钮移除该 subject

  * 如果删除的是 active subject：自动退出 Editing → Idle，并清除 SOURCE overlay

交互约束：

* Editing 状态下拖拽排序禁用（或仅允许拖拽手柄触发排序），避免误操作

---

### 预览模式

* 点击播放按钮触发预览
* 所有 subject 按顺序依次闪烁（默认使用 brightened 效果）
* 配合 BGM 节奏，默认每个 subject **0.1s**，总时长 **N * 0.1s**
* 预览时禁止编辑操作

音频规则（当前 Web 端约束）：

* BGM 可选固定曲库（当前前端时长为占位符；实际曲目最长约 6 秒）
* 支持“无音频”预览
* **Loop 开关（新增）**

  * 默认：关闭（只播一遍，时长 N * 0.1s）
  * 开启：序列循环播放；音频按曲目循环（或无音频则仅序列循环）

---

### 快捷键面板

* Header 右侧常驻 ? 按钮，点击弹出 modal 显示所有快捷键
* 快捷键列表：

  * Cmd+Z：Undo
  * Cmd+Shift+Z：Redo
  * Enter：DONE（仅 Editing 状态有效）
  * Delete/Backspace：Delete Subject（聚焦在列表时）
  * Cmd+D：Duplicate（选中 subject 时）
  * ?（帮助按钮）：打开快捷键面板

---

## 首次引导设计

* 页面加载时显示简短产品介绍 + 操作提示
* 提示内容：左键点击选择区域 → DONE 完成 → 继续选择下一个
* 用户看完后手动关闭或自动消失
* 支持跳过，后续可在帮助中重新查看
* 引导需明确：

  * Idle vs Editing 状态差异
  * Undo 是安全网（鼓励用户探索）

---

## GLITCH STYLE（颜色系统）

### 当前支持

* HIGHLIGHT（高亮）：mask 区域亮度 +100
* SOLID COLOR（颜色填充）：mask 区域填充纯色（用户可调色）

### 可扩展接口（预留）

后续可添加：

* 曲线调整
* 故障偏移
* 文字叠加
* 漩涡效果

### 设计原则

* 保持简单，默认只显示高亮和颜色填充
* 高级功能预留接口，不增加当前交互复杂度

---

## 导出设计

### 导出按钮

* 底部或右上角一个 CONTINUE / EXPORT 按钮
* 点击弹出 modal 选择导出内容

### 导出选项（主路径：视频）

* 视频：MP4 / GIF / Live Photo（带平滑补间动画）

### 抠图导出（可选能力）

* 抠图（透明背景）：

  * A：裁剪的主体（紧贴主体边缘）
  * B：主体在原图片尺度下的透明背景
* **导出形式：ZIP（仅当用户选择“抠图导出”时）**

  * 目录结构建议：

    * `/A_cropped/`（按 subject 命名输出）
    * `/B_fullsize/`（按 subject 命名输出）

### 导出弹窗结构

* 标题：EXPORT
* 格式选择：MP4 / GIF / Live Photo / 抠图
* 如果选择抠图：显示"裁剪"和"原尺度"两个选项
* 确认按钮：DOWNLOAD
* 取消按钮：CANCEL

---

## 交互细节

### 拖拽排序动画

* 拖拽时其他 item 自动让出位置
* 拖拽结束后 item 平滑移动到新位置（spring 动画）
* 序号实时更新反映新顺序
* Editing 状态排序禁用（或仅拖拽手柄触发）

### Duplicate 操作

* 选中 subject 或快捷键 Cmd+D
* 在原位置下方插入完全相同的副本
* 副本继承原 subject 的所有属性（mask、颜色、点、预览、置信度）

### 预览动画时长

* 默认每个 subject 显示 0.1 秒，总时长 N * 0.1s
* Loop 开关控制是否循环播放（默认关闭）

---

## 状态反馈

### 处理中状态

* SAM 模型加载：Header 进度条
* 图像编码：显示 ANALYZING IMAGE
* Mask 生成：显示 GENERATING MASK

### 完成状态

* 每个 subject 生成完成后自动显示抠图预览
* 置信度数值显示在 card 右下方

---

## Undo/Redo 约束（必须写入约束，保证一致性）

* **任何改变 subjects 列表或其关键属性的操作都必须可 Undo / Redo：**

  * 新建 subject（Add）
  * 添加点（Edit）
  * CLEAR（Reset points）
  * 删除（Delete）
  * Duplicate（Copy）
  * 拖拽排序（Reorder）
  * 改色（Change color）

---

## 跨端一致性（Web → Android/iOS/鸿蒙）

* 不依赖右键交互；所有关键操作必须是显式按钮或可触达手势
* 模式（Idle/Editing/Previewing）在所有端保持一致
* 快捷键在 Web 端提供；移动端以同等能力的 UI 控件替代（DONE/CLEAR/Duplicate/Delete/Undo/Redo/Preview）
* 预览时禁止编辑为跨端统一规则
* 导出选项保持一致；平台差异（如 Live Photo）在技术评估后确定支持范围

---

## 组件拆分计划

* SubjectCard.tsx：单个 subject card 组件
* SubjectList.tsx：subject 列表容器
* ColorPicker.tsx：颜色选择器（使用现代 UI 库）
* PreviewModal.tsx：预览弹窗
* ExportModal.tsx：导出弹窗
* ShortcutsModal.tsx：快捷键帮助弹窗
* OnboardingOverlay.tsx：首次引导遮罩
