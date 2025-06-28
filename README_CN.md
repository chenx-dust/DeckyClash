<div align="center">
   <h1>
      <img src="./assets/gicat.svg" width="32" height="32">
      DeckyClash
   </h1>
</div>

*为 Steam OS 设计的轻量的 Clash/Mihomo 代理客户端*

**中文** | [EN](./README.md)

## 功能

- ✅ **功能齐全：** 内置 [Mihomo](https://github.com/MetaCubeX/mihomo) 核心
- 🚀 **极速体验：** 前端与后端均经过优化
- 📦 **易于使用：** 开箱即用，有订阅外部导入、安装引导等实用工具
- 🔒 **注重安全：** 随机生成的控制器密码、外部访问可选等
- ⚙️ **便于维护：** 使用 Python 与 Node.js（React & Vite）编写
- 💡 **保持更新：** 自带第三方资源更新工具，时刻保持最新状态
- 🌍 **多种语言：** 当前支持简体中文和英文

## 截图

![截图](./assets/screenshots-cn.png)

## 授权

本项目以 **BSD 3-Clause License** 授权。

## 安装

1. 安装 [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader)

   ```sh
   curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/install_release.sh | sh
   ```

2. 安装 DeckyClash

   ```sh
   curl -L https://github.com/chenx-dust/DeckyClash/raw/refs/heads/main/install.sh | bash
   ```

   安装脚本会从 Github 下载最新的发行版本，以及必要的第三方资源，如：最新的 Mihomo 核心、最新的 yq 处理器、推荐使用的 Dashboards 以及核心需要的 Geo 文件等。

   脚本包含下载 nightly 版本、更新第三方资源等功能，可以通过 `-h` 参数查看用法：

   ```sh
   curl -L https://github.com/chenx-dust/DeckyClash/raw/refs/heads/main/install.sh | bash -s -- -h
   ```

## 致谢

- [MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo): DeckyClash 由 Mihomo 提供支持。
- [mikefarah/yq](https://github.com/mikefarah/yq) DeckyClash uses yq as its YAML processor.
- [YukiCoco/ToMoon](https://github.com/YukiCoco/ToMoon): DeckyClash 是受 To Moon 启发而开发的。
