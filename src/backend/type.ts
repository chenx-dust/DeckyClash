export enum EnhancedMode {
  RedirHost = "redir-host",
  FakeIp = "fake-ip",
}

export enum ResourceType {
  PLUGIN = "plugin",
  CORE = "core",
}

export interface Config {
  status: boolean,
  current: string | null,
  secret: string,
  override_dns: boolean,
  enhanced_mode: EnhancedMode,
  allow_remote_access: boolean,
  dashboard: string | null,
  controller_port: number,
  autostart: boolean,
  skip_steam_download: boolean,
}
