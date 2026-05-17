# Frequently Asked Questions

## Installation Issues

### Q: Why does the "Github Error: XXX" error occur?

A: Decky Clash installation uses the Github API to obtain the latest version information. If the Github API request limit is exceeded, the request fails, or the returned data does not meet expectations, the latest version cannot be retrieved correctly, resulting in an error message. Please check whether your network environment can access the Github API. If you are using a proxy service, check whether the API limit has been exceeded due to multi-user sharing, or try again later. If necessary, you can use the offline installation method provided in the [README](../README.md) to obtain the latest version.

### Q: Should I use Decky Clash from the Decky Store?

A: Not recommended. Because the Decky Store review process is slow, updates are not timely, and built-in cores and other resource versions cannot be updated in real-time. Developers strongly recommend using the installation method provided in the [README](../README.md) to get the latest version of Decky Clash for more timely updates.

## General Issues

### Q: How to perform advanced settings?

A: If you need to customize User Agent or adjust log levels, you can edit the settings file `~/homebrew/settings/DeckyClash/config.json`. For specific settings, refer to the instructions in the [Development Guide](DEV_GUIDE.md).
Please ensure you save the file after editing and restart Decky Loader for the changes to take effect. You can restart Decky Loader by executing the following command:

```bash
sudo systemctl restart plugin_loader.service
```

### Q: How to obtain software logs?

A: Log files are located in the `~/homebrew/logs/DeckyClash` directory, named by date. You can open the latest log file with a text editor to view the software's operation status and error information. Notably, Mihomo core logs are located in the `core.log` file.

### Q: How to set the log level?

A: You can find the `log_level` option in the settings file `~/homebrew/settings/DeckyClash/config.json`. Common levels include DEBUG, INFO, WARN, and ERROR. Choose the log level that suits your needs; DEBUG records the most detailed information. If you need to report an issue to the developer, it is recommended to set it to DEBUG to provide more context.

## Subscription Issues

### Q: How to add a subscription?

A: For general users, use the Decky menu to enter the subscription import interface of the Decky Clash plugin, and input the subscription URL to add a new subscription. You can also enable the "External Import Panel" under the subscription page, scan a QR code or manually enter a URL to access the external panel, making it easy to import subscriptions. The subscription name will be automatically determined, and you can also modify it manually after import.
For advanced users, you can add subscriptions by editing the `subscriptions` field in the settings file `~/homebrew/settings/DeckyClash/config.json`. Each subscription requires a name and a corresponding URL. The URL can be an HTTP(S) link or a local file path (using the `file://` protocol). Subscription files will be saved in the `~/homebrew/settings/DeckyClash/subscriptions` directory, named `<SubscriptionName>.yaml`. Therefore, subscription names must be unique and valid.

### Q: How to override subscription configuration?

A: Decky Clash provides built-in override templates for TUN and DNS sections, as well as simple custom override support. However, developers recommend using Mihomo core's functionality with external subscriptions for more complex subscription override needs. For simple override requirements, you can add override rules in the `~/homebrew/plugins/DeckyClash/override.yaml` file. Refer to the comments in the file for specific syntax and examples. The store version may overwrite this file during updates.

### Q: Why are my subscription pull results inconsistent with other clients?

A: Decky Clash uses its own User Agent when pulling subscriptions, which may cause some subscription services to return different results. You can try adding or modifying the `user_agent_override` field in the settings file `~/homebrew/settings/DeckyClash/config.json` to set a custom User Agent to simulate the behavior of other clients. It is recommended to set `clash-verge/2.5.0 mihomo.party/v1.9.5 FlClash/v0.8.93`. Developers have taken all possible measures to ensure compatibility. If problems persist, feedback is welcome for improvement.

## Update Issues

### Q: How to update Decky Clash and Mihomo core?

A: When automatic update checking is enabled, Decky Clash will periodically check for updates and notify you via notifications when a new version is available. You can also manually check for updates by clicking the latest version button on the plugin's update page. If a new version is available, go to the update page and click the update button. If necessary, you can manually update using the same method as installation; for specific steps, refer to the instructions in the [README](../README.md).
If you are a store-installed user, Decky Clash updates will be automatically pushed to your device; you only need to click the update button in Decky Loader. The Mihomo core is only distributed with Decky Clash and will not be updated separately.

### Q: Why is my latest version showing a cross mark?

A: Decky Clash obtains the latest version information by checking the Github API. If the Github API request limit is exceeded, the request fails, or the returned data does not meet expectations, the latest version cannot be retrieved correctly, showing a cross mark. Please check whether your network environment can access the Github API. If you are using a proxy service, check whether the API limit has been exceeded due to multi-user sharing, or try again later. If necessary, you can use the offline installation method provided in the [README](../README.md) to obtain the latest version.

# 常见问题

## 安装问题

### 问：为什么会出现“Github Error: XXX”错误？

答：Decky Clash 安装通过 Github API 来获取最新版本信息，如果 Github API 请求次数超限、请求失败或者返回的数据不符合预期，就会导致无法正确获取最新版本，从而显示错误信息。请检查你的网络环境是否能够访问 Github API，如有使用代理服务，请检查是否因多人共用导致 API 超限，或者稍后再试。如有必要，可以采用 [README](../README_CN.md) 中提供的离线安装方法来获取最新版本。

### 问：我应该使用 Decky Store 中的 Decky Clash 吗？

答：不推荐。因为 Decky Store 审核流程较慢，更新不及时，且内置的核心和其他资源版本无法实时更新。开发者强烈建议使用 [README](../README_CN.md) 中提供的安装方法来获取最新版本的 Decky Clash，以获得更及时的更新。

## 通用问题

### 问：如何进行高级设置？

答：如果你需要自定义 User Agent 或调整日志级别等操作，可以编辑设置文件 `~/homebrew/settings/DeckyClash/config.json`。具体设置项可以参考 [开发指南](DEV_GUIDE.md) 中的说明。

请确保在编辑后保存文件，并重新启动 Decky Loader 以使更改生效。可以执行如下命令重启 Decky Loader：

```bash
sudo systemctl restart plugin_loader.service
```

### 问：如何获取软件日志？

答：日志文件位于 `~/homebrew/logs/DeckyClash` 目录下，按照照日期命名。你可以使用文本编辑器打开最新的日志文件来查看软件的运行情况和错误信息。特别的，Mihomo 核心的日志位于 `core.log` 文件中。

### 问：如何设置日志级别？

答：你可以在设置文件 `~/homebrew/settings/DeckyClash/config.json` 中找到日志级别 `log_level` 选项，通常有 DEBUG、INFO、WARN、ERROR 等级别。选择适合你的需求的日志级别，DEBUG 会记录最详细的信息。如果需要反馈问题给开发者，建议设置为 DEBUG 以提供更多的上下文信息。

## 订阅问题

### 问：如何添加订阅？

答：对于一般用户，请利用 Decky 的菜单进入 Decky Clash 插件的订阅导入界面，输入订阅 URL 以添加新的订阅。也可以启用订阅页面下的“外部导入面板”，扫描二维码或者手动输入 URL 进入外部面板，即可轻松导入订阅。订阅命名会自动确定，也可以在导入后手动修改。

对于高级用户，可以通过编辑设置文件 `~/homebrew/settings/DeckyClash/config.json` 中的 `subscriptions` 字段来添加订阅。每个订阅需要一个名称和对应的 URL，URL 可以是 HTTP(S) 链接或者本地文件路径（使用 `file://` 协议）。订阅文件会保存在 `~/homebrew/settings/DeckyClash/subscriptions` 目录下，命名为 `<订阅名称>.yaml`。因此订阅名必须唯一且合法。

### 问：如何覆写订阅配置？

答：Decky Clash 提供自带的 TUN 和 DNS 部分的内置覆写模板，和简单的自定义覆写支持，但开发者更建议利用 Mihomo 核心功能利用外部订阅来实现更复杂的订阅覆写需求。对于简单的覆写需求，可以在 `~/homebrew/plugins/DeckyClash/override.yaml` 文件中添加覆写规则。具体语法和示例可以参考文件中注释的说明。商店版本可能会在更新时覆盖此文件。

### 问：为什么我的订阅拉取结果和其他客户端不一致？

答：Decky Clash 拉取订阅时采用了自己的 User Agent，可能会导致某些订阅服务返回不同的结果。你可以尝试在设置文件 `~/homebrew/settings/DeckyClash/config.json` 中添加或修改 `user_agent_override` 字段，设置一个自定义的 User Agent 来模拟其他客户端的行为，推荐设置 `clash-verge/2.5.0 mihomo.party/v1.9.5 FlClash/v0.8.93`。开发者已经采取尽可能的措施来保证兼容性，如果依然存在问题，欢迎提供反馈以便改进。

## 更新问题

### 问：如何更新 Decky Clash 和 Mihomo 核心？

答：在自动检查更新开启时，Decky Clash 会定期检查更新，并在有新版本时通过通知提示。你也可以手动检查更新，在插件的更新页面点击最新版本的按钮来触发更新检查。如果有新版本可用，进入更新页面按照点击更新按钮即可。在必要时，可以采用与安装相同的方法手动更新，具体步骤可以参考 [README](../README_CN.md) 中的说明。

如果你是通过商店安装的用户，Decky Clash 更新会自动推送到你的设备上，只需要在 Decky Loader 中点击更新按钮即可。Mihomo 核心只会随 Decky Clash 分发，不会单独更新。

### 问：为什么我的最新版本显示为叉号？

答：Decky Clash 通过检查 Github API 来获取最新版本信息，如果 Github API 请求次数超限、请求失败或者返回的数据不符合预期，就会导致无法正确获取最新版本，从而显示为叉号。请检查你的网络环境是否能够访问 Github API，如有使用代理服务，请检查是否因多人共用导致 API 超限，或者稍后再试。如有必要，可以采用 [README](../README_CN.md) 中提供的离线安装方法来获取最新版本。
