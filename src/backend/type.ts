export enum EnhancedMode {
  RedirHost = "RedirHost",
  FakeIp = "FakeIp",
}

export interface Config {
  status: boolean,
  current: string | null,
  secret: string,
  override_dns: boolean,
  enhanced_mode: EnhancedMode,
  controller_port: number,
  allow_remote_access: boolean,
  dashboard: string | null,
}
