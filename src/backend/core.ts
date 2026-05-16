export type ClashMode = "rule" | "global" | "direct";

const CLASH_MODES: ClashMode[] = ["rule", "global", "direct"];

interface ClashConfigs {
  mode?: string;
}

export interface Traffic {
  up: number;
  down: number;
  upTotal: number;
  downTotal: number;
}

export interface Memory {
  inuse: number;
  oslimit: number;
}

const getControllerUrl = (controllerPort: number, path: string) => {
  return `http://127.0.0.1:${controllerPort}${path}`;
};

const getHeaders = (secret: string): HeadersInit => {
  return {
    "Authorization": `Bearer ${secret}`,
  };
};

const normalizeClashMode = (mode: unknown): ClashMode | null => {
  if (typeof mode !== "string")
    return null;
  const normalized = mode.toLowerCase();
  if (!CLASH_MODES.includes(normalized as ClashMode))
    return null;
  return normalized as ClashMode;
};

export const getClashMode = async (controllerPort: number, secret: string): Promise<ClashMode | null> => {
  const response = await fetch(getControllerUrl(controllerPort, "/configs"), {
    method: "GET",
    headers: getHeaders(secret),
  });
  if (!response.ok)
    throw new Error(`GET /configs failed: ${response.status}`);

  const configs = await response.json() as ClashConfigs;
  return normalizeClashMode(configs.mode);
};

export const setClashMode = async (
  controllerPort: number,
  secret: string,
  mode: ClashMode,
): Promise<void> => {
  const response = await fetch(getControllerUrl(controllerPort, "/configs"), {
    method: "PATCH",
    headers: {
      ...getHeaders(secret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mode }),
  });
  if (!response.ok)
    throw new Error(`PATCH /configs failed: ${response.status}`);
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object";
};

const normalizeTraffic = (value: unknown): Traffic | null => {
  if (!isObject(value) || typeof value.up !== "number" || typeof value.down !== "number" || typeof value.upTotal !== "number" || typeof value.downTotal !== "number")
    return null;
  return {
    up: value.up,
    down: value.down,
    upTotal: value.upTotal,
    downTotal: value.downTotal,
  };
};

const normalizeMemory = (value: unknown): Memory | null => {
  if (!isObject(value) || typeof value.inuse !== "number" || typeof value.oslimit !== "number")
    return null;
  return {
    inuse: value.inuse,
    oslimit: value.oslimit,
  };
};

const streamJsonLines = async (
  controllerPort: number,
  secret: string,
  path: string,
  signal: AbortSignal,
  callback: (value: unknown) => void,
): Promise<void> => {
  const response = await fetch(getControllerUrl(controllerPort, path), {
    method: "GET",
    headers: getHeaders(secret),
    signal,
  });
  if (!response.ok)
    throw new Error(`GET ${path} failed: ${response.status}`);
  if (!response.body)
    throw new Error(`GET ${path} did not return a stream`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done)
      break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed)
        continue;
      console.trace(`controller from ${path} stream: ${trimmed}`);
      callback(JSON.parse(trimmed));
    }
  }

  const trimmed = buffer.trim();
  if (trimmed) {
    console.trace(`controller from ${path} stream: ${trimmed}`);
    callback(JSON.parse(trimmed));
  }
};

export const streamTraffic = async (
  controllerPort: number,
  secret: string,
  signal: AbortSignal,
  callback: (traffic: Traffic) => void,
): Promise<void> => {
  await streamJsonLines(controllerPort, secret, "/traffic", signal, (value) => {
    const traffic = normalizeTraffic(value);
    if (traffic)
      callback(traffic);
  });
};

export const streamMemory = async (
  controllerPort: number,
  secret: string,
  signal: AbortSignal,
  callback: (memory: Memory) => void,
): Promise<void> => {
  await streamJsonLines(controllerPort, secret, "/memory", signal, (value) => {
    const memory = normalizeMemory(value);
    if (memory)
      callback(memory);
  });
};
