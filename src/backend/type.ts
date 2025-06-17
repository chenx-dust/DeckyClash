export enum EnhancedMode {
  RedirHost = "redir-host",
  FakeIp = "fake-ip",
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
}
