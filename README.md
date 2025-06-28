<div align="center">
   <h1>
      <img src="./assets/gicat.svg" width="32" height="32">
      DeckyClash
   </h1>
</div>

*Light-weight Clash/Mihomo proxy client for Steam OS*

*为 Steam OS 设计的轻量的 Clash/Mihomo 代理客户端*

**EN** | [中文](./README_CN.md)

## Features

- ✅ **Full featured:** [Mihomo](https://github.com/MetaCubeX/mihomo) core included
- 🚀 **Blazing fast:** optimized frontend and backend
- 📦 **Easy to use:** out of the box, with subscriptions importer and installation guide, etc.
- 🔒 **Focus on security:** random controller password, controllable outside access, etc.
- ⚙️ **Friendly to maintain:** written by Python and Node.js (React & Vite)
- 💡 **Keep update:** built-in upgrade tool to keep 3rd-party resources update
- 🌍 **I18n ready:** currently with Chinese (Simplified) and English support

## Screenshots

![Screenshots](./assets/screenshots.png)

## License

This project is licensed by **BSD 3-Clause License** .

## Installation

1. Install [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader)

   ```sh
   curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/install_release.sh | sh
   ```

2. Install DeckyClash

   ```sh
   curl -L https://github.com/chenx-dust/DeckyClash/raw/refs/heads/main/install.sh | bash
   ```

   The installation script will download the latest release from Github, as well as necessary third-party resources such as the latest Mihomo core, the latest yq processor, recommended Dashboards, and the Geo files required by the core.

   The script includes functions to download nightly versions and update third-party resources, which can be viewed through the `-h` parameter:

   ```sh
   curl -L https://github.com/chenx-dust/DeckyClash/raw/refs/heads/main/install.sh | bash -s -- -h
   ```

## Acknowledge

- [MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo): DeckyClash is powered by Mihomo.
- [mikefarah/yq](https://github.com/mikefarah/yq) DeckyClash uses yq as its YAML processor.
- [YukiCoco/ToMoon](https://github.com/YukiCoco/ToMoon): DeckyClash is inspired by To Moon.
