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

export interface WebDAVConfig {
  url: string,
  username: string,
  password: string,
}

export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export interface LogFileInfo {
  name: string;
  size: number;
  mtime: number;
  is_current: boolean;
  is_core: boolean;
}

export interface LogContent {
  name: string;
  content: string;
  line_count: number;
  size: number;
  truncated: boolean;
}
