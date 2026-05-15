export type ClashMode = "rule" | "global" | "direct";

const CLASH_MODES: ClashMode[] = ["rule", "global", "direct"];

interface ClashConfigs {
  mode?: string;
}

const getConfigsUrl = (controllerPort: number) => {
  return `http://127.0.0.1:${controllerPort}/configs`;
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
  const response = await fetch(getConfigsUrl(controllerPort), {
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
  const response = await fetch(getConfigsUrl(controllerPort), {
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
