import { toaster } from "@decky/api";
import {
  DialogBody,
  DialogButton,
  DialogControlsSection,
  DialogControlsSectionHeader,
  DropdownItem,
  DropdownOption,
  Field,
  Focusable,
  GamepadButton,
  GamepadEvent,
  Spinner,
  ToggleField,
} from "@decky/ui";
import { t } from "i18next";
import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BsArrowClockwise, BsArrowDown, BsArrowUp, BsExclamationCircleFill } from "react-icons/bs";

import { backend, LogContent, LogFileInfo, LogLevel } from "../backend";
import { FullWidthFieldScope } from "../components";
import { L } from "../i18n";

const LOG_LEVELS: LogLevel[] = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];
const LOG_LEVEL_OPTIONS: DropdownOption[] = LOG_LEVELS.map((level) => ({
  label: level,
  data: level,
}));
const MAX_LINE_OPTIONS: DropdownOption[] = [100, 300, 500, 1000].map((count) => ({
  label: String(count),
  data: count,
}));
const AUTO_REFRESH_INTERVAL_MS = 3000;
const LOG_LEVEL_STORAGE_KEY = "decky-clash-log-level";

const formatFileSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0)
    return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let scaled = bytes;
  let index = 0;
  while (scaled >= 1024 && index < units.length - 1) {
    scaled /= 1024;
    index++;
  }
  return `${scaled.toFixed(index === 0 || scaled >= 100 ? 0 : 1)} ${units[index]}`;
};

const getLogLineColor = (line: string): string => {
  if (/\b(ERROR|CRITICAL|FATAL)\b|level=(error|fatal)/i.test(line))
    return "#ff6b6b";
  if (/\b(WARN|WARNING)\b|level=(warn|warning)/i.test(line))
    return "#ffd166";
  if (/\bDEBUG\b|level=debug/i.test(line))
    return "#8da4b8";
  return "#dce3ea";
};

const formatLogFileLabel = (file: LogFileInfo): string => {
  if (file.is_current)
    return `${file.name} (${t(L.LOG_CURRENT)})`;
  if (file.is_core)
    return `${file.name} (Mihomo)`;
  return file.name;
};

export const Logs: FC = () => {
  const storedLevel = window.localStorage.getItem(LOG_LEVEL_STORAGE_KEY);
  const initialLevel: LogLevel = LOG_LEVELS.includes(storedLevel as LogLevel)
    ? (storedLevel as LogLevel)
    : "INFO";

  const [logLevel, setLogLevel] = useState<LogLevel>(initialLevel);
  const [logFiles, setLogFiles] = useState<LogFileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [maxLines, setMaxLines] = useState<number>(300);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [logContent, setLogContent] = useState<LogContent | null>(null);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const logBoxRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(true);
  const shouldScrollToBottomRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchLogFiles = useCallback(async (): Promise<LogFileInfo[]> => {
    setLoadingFiles(true);
    try {
      const files = await backend.getLogFiles();
      if (!mountedRef.current)
        return [];
      setLogFiles(files);
      setSelectedFile((prev) => {
        if (prev && files.some((file) => file.name === prev))
          return prev;
        shouldScrollToBottomRef.current = true;
        return files[0]?.name ?? null;
      });
      return files;
    } catch (e) {
      if (mountedRef.current) {
        setErrorMessage(e instanceof Error ? e.message : String(e));
      }
      return [];
    } finally {
      if (mountedRef.current)
        setLoadingFiles(false);
    }
  }, []);

  const fetchLogContent = useCallback(async (
    filename: string,
    lines: number,
    forceScrollToBottom = false,
  ) => {
    const el = logBoxRef.current;
    const wasNearBottom = !el || el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    const requestId = ++requestIdRef.current;
    setLoadingContent(true);
    try {
      const [success, data, error] = await backend.getLogContent(filename, lines);
      if (!mountedRef.current || requestId !== requestIdRef.current)
        return;
      if (success && data) {
        shouldScrollToBottomRef.current = forceScrollToBottom || wasNearBottom;
        setLogContent(data);
        setErrorMessage(null);
      } else {
        setErrorMessage(error || t(L.LOG_READ_FAILED));
      }
    } catch (e) {
      if (!mountedRef.current || requestId !== requestIdRef.current)
        return;
      setErrorMessage(e instanceof Error ? e.message : String(e));
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current)
        setLoadingContent(false);
    }
  }, []);

  useLayoutEffect(() => {
    backend.getLogLevel().then((level) => {
      if (!mountedRef.current)
        return;
      if (LOG_LEVELS.includes(level)) {
        setLogLevel(level);
        window.localStorage.setItem(LOG_LEVEL_STORAGE_KEY, level);
      }
    }).catch((e) => {
      console.error("[Logs] Failed to fetch log level:", e);
    });
    fetchLogFiles();
  }, [fetchLogFiles]);

  useEffect(() => {
    if (selectedFile) {
      fetchLogContent(selectedFile, maxLines, true);
    } else {
      ++requestIdRef.current;
      setLogContent(null);
      setErrorMessage(null);
    }
  }, [selectedFile, maxLines, fetchLogContent]);

  useEffect(() => {
    if (!autoRefresh || !selectedFile)
      return;
    const timer = window.setInterval(() => {
      fetchLogContent(selectedFile, maxLines, false);
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [autoRefresh, selectedFile, maxLines, fetchLogContent]);

  useEffect(() => {
    if (shouldScrollToBottomRef.current && logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
      shouldScrollToBottomRef.current = false;
    }
  }, [logContent]);

  const handleLogLevelChange = async (option: DropdownOption) => {
    const nextLevel = option.data as LogLevel;
    if (nextLevel === logLevel)
      return;
    const prevLevel = logLevel;
    setLogLevel(nextLevel);
    try {
      const [success, error] = await backend.setLogLevel(nextLevel);
      if (!mountedRef.current)
        return;
      if (!success) {
        setLogLevel(prevLevel);
        toaster.toast({
          title: t(L.LOG_LEVEL_UPDATE_FAILED),
          body: error,
          icon: <BsExclamationCircleFill />,
        });
        return;
      }
      window.localStorage.setItem(LOG_LEVEL_STORAGE_KEY, nextLevel);
      const currentFile = logFiles.find((file) => file.name === selectedFile);
      if (currentFile?.is_current) {
        fetchLogContent(currentFile.name, maxLines, false);
      }
    } catch (e) {
      if (!mountedRef.current)
        return;
      setLogLevel(prevLevel);
      toaster.toast({
        title: t(L.LOG_LEVEL_UPDATE_FAILED),
        body: e instanceof Error ? e.message : String(e),
        icon: <BsExclamationCircleFill />,
      });
    }
  };

  const handleRefresh = async () => {
    const files = await fetchLogFiles();
    const targetFile = selectedFile && files.some((file) => file.name === selectedFile)
      ? selectedFile
      : files[0]?.name;
    if (targetFile && targetFile === selectedFile) {
      await fetchLogContent(targetFile, maxLines, false);
    }
  };

  const handleScrollTop = () => {
    if (logBoxRef.current) {
      shouldScrollToBottomRef.current = false;
      logBoxRef.current.scrollTop = 0;
    }
  };

  const handleScrollBottom = () => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  };

  const handleLogGamepadDirection = (evt: GamepadEvent) => {
    const el = logBoxRef.current;
    if (!el)
      return;
    if (evt.detail.button === GamepadButton.DIR_UP) {
      if (el.scrollTop > 0) {
        el.scrollTop = Math.max(0, el.scrollTop - 120);
        evt.preventDefault();
        evt.stopPropagation();
      }
    } else if (evt.detail.button === GamepadButton.DIR_DOWN) {
      if (el.scrollTop + el.clientHeight < el.scrollHeight - 1) {
        el.scrollTop = Math.min(el.scrollHeight, el.scrollTop + 120);
        evt.preventDefault();
        evt.stopPropagation();
      }
    }
  };

  const logFileOptions = useMemo<DropdownOption[]>(
    () => logFiles.map((file) => ({ label: formatLogFileLabel(file), data: file.name })),
    [logFiles],
  );

  const lines = useMemo(
    () => (logContent?.content ? logContent.content.split("\n") : []),
    [logContent],
  );

  const buttonStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    columnGap: "8px",
  };

  const renderLogBody = () => {
    if ((loadingFiles && logFiles.length === 0) || (loadingContent && !logContent && !errorMessage)) {
      return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <Spinner style={{ width: "24px" }} />
        </div>
      );
    }
    if (errorMessage) {
      return <div style={{ color: "#ff6b6b" }}>{errorMessage}</div>;
    }
    if (logFiles.length === 0) {
      return <div style={{ color: "#8da4b8", textAlign: "center" }}>{t(L.NO_LOGS)}</div>;
    }
    if (!logContent || lines.length === 0) {
      return <div style={{ color: "#8da4b8", textAlign: "center" }}>{t(L.LOG_EMPTY)}</div>;
    }
    return lines.map((line, index) => (
      <div key={index} style={{ color: getLogLineColor(line) }}>
        {line || " "}
      </div>
    ));
  };

  return (
    <DialogBody>
      <DialogControlsSection>
        <DialogControlsSectionHeader>
          {t(L.LOG_SETTINGS)}
        </DialogControlsSectionHeader>
        <DropdownItem
          label={t(L.LOG_LEVEL)}
          description={t(L.LOG_LEVEL_DESC)}
          rgOptions={LOG_LEVEL_OPTIONS}
          selectedOption={logLevel}
          onChange={handleLogLevelChange}
        />
      </DialogControlsSection>
      <DialogControlsSection>
        <DialogControlsSectionHeader>
          {t(L.LOG_VIEWER)}
        </DialogControlsSectionHeader>
        <FullWidthFieldScope>
          <DropdownItem
            label={t(L.LOG_FILE)}
            strDefaultLabel={t(L.SELECT_LOG_FILE)}
            rgOptions={logFileOptions}
            selectedOption={selectedFile}
            disabled={logFileOptions.length === 0}
            onMenuWillOpen={() => { fetchLogFiles(); }}
            onChange={(option) => {
              shouldScrollToBottomRef.current = true;
              setSelectedFile(option.data as string);
            }}
          />
          <DropdownItem
            label={t(L.LOG_MAX_LINES)}
            rgOptions={MAX_LINE_OPTIONS}
            selectedOption={maxLines}
            onChange={(option) => {
              shouldScrollToBottomRef.current = true;
              setMaxLines(option.data as number);
            }}
          />
          <ToggleField
            label={t(L.LOG_AUTO_REFRESH)}
            checked={autoRefresh}
            onChange={setAutoRefresh}
          />
          <Field childrenLayout="below">
            {/* @ts-expect-error */}
            <Focusable style={{
              display: "flex",
              flexWrap: "nowrap",
              columnGap: "10px",
            }}>
              <DialogButton
                style={buttonStyle}
                disabled={loadingFiles || loadingContent}
                onClick={handleRefresh}
              >
                <BsArrowClockwise /> {t(L.LOG_REFRESH)}
              </DialogButton>
              <DialogButton
                style={buttonStyle}
                disabled={!logContent || lines.length === 0}
                onClick={handleScrollTop}
              >
                <BsArrowUp /> {t(L.LOG_SCROLL_TOP)}
              </DialogButton>
              <DialogButton
                style={buttonStyle}
                disabled={!logContent || lines.length === 0}
                onClick={handleScrollBottom}
              >
                <BsArrowDown /> {t(L.LOG_SCROLL_BOTTOM)}
              </DialogButton>
            </Focusable>
          </Field>
          <Field childrenLayout="below" bottomSeparator="none">
            {logContent && (
              <div style={{
                fontSize: "12px",
                color: "#b8c2cc",
                marginBottom: "8px",
              }}>
                {`${formatFileSize(logContent.size)} · ${logContent.line_count} ${t(L.LOG_LINES)}${logContent.truncated ? ` · ${t(L.LOG_TRUNCATED)}` : ""}`}
              </div>
            )}
            {/* @ts-expect-error */}
            <Focusable
              ref={logBoxRef}
              onActivate={() => {}}
              onGamepadDirection={handleLogGamepadDirection}
              style={{
                height: "360px",
                overflowY: "auto",
                overflowX: "hidden",
                backgroundColor: "rgba(0, 0, 0, 0.35)",
                padding: "12px",
                fontFamily: "monospace",
                fontSize: "12px",
                lineHeight: "1.5",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                userSelect: "text",
                boxSizing: "border-box",
              }}
            >
              {renderLogBody()}
            </Focusable>
          </Field>
        </FullWidthFieldScope>
      </DialogControlsSection>
    </DialogBody>
  );
};
