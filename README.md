<div align="center">

# B站收藏夹整理工具

[![Version](https://img.shields.io/badge/version-1.1.2-blue.svg)](https://github.com/your-repo/bilibili-favorite)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/b%E7%AB%99%E6%94%B6%E8%97%8F%E5%A4%B9%E6%95%B4%E7%90%86%E5%B7%A5%E5%85%B7/kompiebhklojoioghbddednmmnebnkoc)

一款强大的 Chrome 扩展，帮助你高效管理和分析 Bilibili 收藏夹内容。

[功能特性](#-功能特性) • [安装指南](#-安装) • [使用说明](#-使用说明) • [隐私政策](#-隐私政策)

</div>

## 📸 产品预览

<p align="center">
  <img src="./readme/product.png" height="200" />
  <img src="./readme/fav-1.png" height="200" />
  <img src="./readme/fav-2.png" height="200" />
  <img src="./readme/ai-config.png" height="200" />
</p>

---

## ✨ 功能特性

### 📊 收藏内容分析

- **智能分析**：深度分析您的 B 站收藏内容分布情况
- **AI 驱动**：基于 GPT 的视频标题关键词提取，自动分类
- **可视化展示**：直观展示收藏内容类别占比和趋势
- **最近7天统计**：快速了解最近一周的收藏动态
- **数据缓存**：智能缓存机制（24小时有效期），减少重复请求，提升性能

![收藏分析1](./readme/fav-1.png)
![收藏分析2](./readme/fav-2.png)

### 🗂️ 智能整理

- **一键整理**：快速整理默认收藏夹中的视频内容
- **批量操作**：支持批量移动视频到指定收藏夹
- **自定义规则**：根据关键词匹配自动归类
- **关键词管理**：灵活配置和管理分类关键词
- **🤖 AI 智能整理**：使用 AI 自动分析视频标题，智能分类到对应收藏夹

![关键词管理](./readme/keyword-manager.png)

### ⚙️ 配置管理

- **灵活配置**：支持自定义 API Key 和模型选择
- **侧边栏模式**：在侧边栏中便捷访问
  ![配置](./readme/ai-config.png)
  推荐星火大模型，因为有免费的额度

---

## 📦 安装

### 方式一：从 Chrome Web Store 安装（推荐）

1. 访问 [Chrome Web Store - B站收藏夹整理工具](https://chromewebstore.google.com/detail/b%E7%AB%99%E6%94%B6%E8%97%8F%E5%A4%B9%E6%95%B4%E7%90%86%E5%B7%A5%E5%85%B7/kompiebhklojoioghbddednmmnebnkoc)
2. 点击"添加到 Chrome"按钮

### 方式二：本地安装

1. 下载最新版本的扩展压缩包
2. 打开 Chrome 浏览器，进入扩展管理页面（`chrome://extensions/`）
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择解压后的扩展文件夹

---

## 🚀 使用说明

### 基本使用

1. 点击浏览器工具栏中的扩展图标打开弹窗
2. 确保已登录 Bilibili 账号，并保持至少一个 B 站页面处于打开状态（如果仍提示需要登录，请刷新 B 站页面后重新打开插件）
3. 查看你的收藏夹分析数据
4. 根据需要进行收藏夹整理操作

### 收藏夹分析

在Options页面中点击收藏家分析查看收藏内容分布图表和收藏趋势，使用"刷新"按钮获取最新数据

### 收藏夹整理

1. 进入选项页面（点击扩展图标 → "设置"）
2. 切换到"整理收藏夹"标签
3. 选择源收藏夹（默认为"默认收藏夹"）
4. 选择目标收藏夹
5. 配置关键词匹配规则
6. 点击"开始整理"执行批量操作

### AI 关键词提取

1. 在配置Tab配置 OpenAI API Key
2. 进入"关键词管理"标签
3. 点击"AI 提取关键词"自动生成分类关键词
4. 手动调整和优化关键词列表

### 手动 关键词提取

项目提供本地算法提取关键字，使用**TF-IDF**算法

---

## 🔒 隐私政策

本扩展完全尊重您的隐私，承诺：

- ✅ **不收集**任何个人身份信息
- ✅ **不上传**用户数据到任何第三方服务器
- ✅ **所有数据**仅存储在您的浏览器本地（IndexedDB + Chrome Storage）
- ✅ **网络请求**仅用于访问 Bilibili 官方 API 和 OpenAI API（可选）

详细隐私声明请查看 [PRIVACY.md](./PRIVACY.md)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

如果您有好的想法或发现问题，欢迎：

1. 提交 [Issue](https://github.com/your-repo/bilibili-favorite/issues)
2. Fork 本仓库
3. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
4. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
5. 推送到分支 (`git push origin feature/AmazingFeature`)
6. 开启 Pull Request

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

---

## 🙏 致谢

感谢以下开源项目：

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [ECharts](https://echarts.apache.org/)
- [OpenAI](https://openai.com/)

---

<div align="center">

Made with ❤️ by [Radium](https://github.com/your-repo)

如果觉得这个项目对你有帮助，请给个 ⭐️ Star 支持一下！

</div>
