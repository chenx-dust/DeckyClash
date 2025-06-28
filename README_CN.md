<div align="center">
   <h1>
      <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="32px" width="32px" xmlns="http://www.w3.org/2000/svg"><path d="M463.46 37.008l-30.694 50.738-7.043-2.28c-27.146-8.797-71.525-7.15-97.6.11L321.22 87.5l-28.68-48.543c-33.63 69.254-32.264 117.56-14.79 148.574 18.71 33.208 57.378 49.09 99.117 48.574 48.743-.606 88.968-19.665 107.035-54.194 16.918-32.332 15.684-80.456-20.443-144.902zM323.935 137.594c18.45.1 29.36 15.338 31.462 36.644-37.11 17.91-53.963 3.398-61.173-26.545 11.382-7.063 21.324-10.144 29.71-10.1zm109.26 0c8.385-.045 18.328 3.036 29.71 10.1-7.21 29.942-24.064 44.454-61.174 26.544 2.104-21.306 13.014-36.545 31.463-36.644zm-293.553 50.96c-1.226-.01-2.446-.003-3.66.018-30.175.536-56.142 10.59-75.743 26.574-43.444 35.43-57.27 100.752-12.824 166.192 20.293 33.995 44.432 54.24 70.797 64.187 32.85 12.395 66.655 8.823 99.94 4.114 33.284-4.71 65.854-10.63 96.896-8.42 31.04 2.212 62.09 10.18 90.505 41.165 19.374 21.125 46.887-1.627 23.82-24.156-35.024-34.207-72.527-47.42-109.377-50.04-36.85-2.62-72.2 4.698-104.207 9.228-32.007 4.53-60.272 6.552-84.558-2.61-14.39-5.43-28.308-14.802-41.55-31.142h351.744c13.673-52.293 14.867-106.368 1.873-142.072-19.765 8.49-42.412 12.9-66.2 13.197h-.002c-29.85.37-59.458-6.925-82.907-22.823-4.647 3.012-9.407 6.23-14.292 9.685l-5.734 4.057-5.49-4.382c-46.63-37.2-91.028-52.48-129.03-52.773z"></path></svg>
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
