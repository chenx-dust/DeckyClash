import os
from pathlib import Path
import re
from typing import Any, Dict, List, Optional
import urllib.parse

LOG_LEVELS = ("DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL")
_LOG_LEVEL_ALIASES = {
    "WARN": "WARNING",
    "FATAL": "CRITICAL",
}

DEFAULT_MAX_LINES = 300
MIN_MAX_LINES = 1
MAX_MAX_LINES = 2000
DEFAULT_MAX_BYTES = 256 * 1024

_ANSI_ESCAPE_RE = re.compile(r"\x1b\[[0-9;]*[a-zA-Z]")


def _default_log_dir() -> str:
    import decky

    return decky.DECKY_PLUGIN_LOG_DIR


def _default_current_log() -> Optional[str]:
    import decky

    return getattr(decky, "DECKY_PLUGIN_LOG", None)


def normalize_log_level(level: Any) -> Optional[str]:
    """Normalize a log level string to a canonical Python logging level name."""
    if not isinstance(level, str):
        return None
    normalized = level.strip().upper()
    normalized = _LOG_LEVEL_ALIASES.get(normalized, normalized)
    if normalized in LOG_LEVELS:
        return normalized
    return None


def build_content_disposition(filename: str) -> str:
    """Build an HTTP Content-Disposition attachment header safe for arbitrary filenames."""
    clean = filename.replace("\r", "").replace("\n", "")
    if not clean:
        clean = "log.txt"
    ascii_name = "".join(
        "_" if (ord(ch) < 32 or ord(ch) > 126 or ch in ('"', "\\", ";")) else ch
        for ch in clean
    ) or "log.txt"
    utf8_name = urllib.parse.quote(clean, safe="")
    return f'attachment; filename="{ascii_name}"; filename*=UTF-8\'\'{utf8_name}'


def resolve_log_path(name: str, log_dir: Optional[str] = None) -> Path:
    """Resolve and validate a log file path inside the plugin log directory."""
    base_dir = _default_log_dir() if log_dir is None else log_dir
    if (
        not isinstance(name, str)
        or not name
        or "\x00" in name
        or "\\" in name
        or os.path.isabs(name)
        or name.startswith("/")
    ):
        raise ValueError("Invalid log filename")

    parts = name.split("/")
    if any(part in ("", ".", "..") for part in parts):
        raise ValueError("Invalid log filename")

    if not base_dir or not os.path.isdir(base_dir):
        raise FileNotFoundError(f"Log file not found: {name}")

    candidate = base_dir
    for part in parts:
        candidate = os.path.join(candidate, part)
        if os.path.islink(candidate):
            raise ValueError("Invalid log filename")

    real_dir = os.path.realpath(base_dir)
    real_target = os.path.realpath(candidate)
    if os.path.commonpath([real_dir, real_target]) != real_dir or real_target == real_dir:
        raise ValueError("Invalid log filename")

    if not os.path.isfile(real_target):
        raise FileNotFoundError(f"Log file not found: {name}")

    return Path(real_target)


def list_logs(
    log_dir: Optional[str] = None,
    current_plugin_log: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List regular non-hidden log files in log_dir sorted by priority and mtime."""
    if log_dir is None:
        log_dir = _default_log_dir()
        if current_plugin_log is None:
            current_plugin_log = _default_current_log()

    if not log_dir or not os.path.isdir(log_dir):
        return []

    current_abs = os.path.abspath(current_plugin_log) if current_plugin_log else None
    files: List[Dict[str, Any]] = []

    with os.scandir(log_dir) as entries:
        for entry in entries:
            if entry.name.startswith("."):
                continue
            try:
                if not entry.is_file(follow_symlinks=False):
                    continue
                stat_res = entry.stat(follow_symlinks=False)
            except OSError:
                continue

            files.append({
                "name": entry.name,
                "size": stat_res.st_size,
                "mtime": stat_res.st_mtime,
                "is_current": bool(current_abs and os.path.abspath(entry.path) == current_abs),
                "is_core": entry.name == "core.log",
            })

    files.sort(key=lambda item: item["name"], reverse=True)
    files.sort(
        key=lambda item: (
            0 if item["is_current"] else (1 if item["is_core"] else 2),
            -item["mtime"],
        )
    )
    return files


list_log_files = list_logs


def read_log_content(
    name: str,
    max_lines: Optional[int] = None,
    max_bytes: int = DEFAULT_MAX_BYTES,
    log_dir: Optional[str] = None,
) -> Dict[str, Any]:
    """Read the tail of a log file safely with ANSI stripping."""
    target = resolve_log_path(name, log_dir=log_dir)
    clamped_bytes = max(1024, int(max_bytes))

    with open(target, "rb") as f:
        stat_res = os.fstat(f.fileno())
        file_size = stat_res.st_size
        mtime = stat_res.st_mtime
        if file_size > clamped_bytes:
            f.seek(file_size - clamped_bytes)
            raw = f.read(clamped_bytes)
            truncated = True
            if b"\n" in raw:
                raw = raw.split(b"\n", 1)[1]
        else:
            raw = f.read()
            truncated = False

    text = _ANSI_ESCAPE_RE.sub("", raw.decode("utf-8", errors="replace"))
    lines = text.splitlines()
    if max_lines is not None:
        clamped_lines = max(MIN_MAX_LINES, min(int(max_lines), MAX_MAX_LINES))
        if len(lines) > clamped_lines:
            lines = lines[-clamped_lines:]
            truncated = True

    return {
        "name": name,
        "content": "\n".join(lines),
        "line_count": len(lines),
        "size": file_size,
        "mtime": mtime,
        "truncated": truncated,
        "max_bytes": clamped_bytes,
    }


def read_log_file(
    log_dir: str,
    filename: str,
    max_lines: int = DEFAULT_MAX_LINES,
    max_bytes: int = DEFAULT_MAX_BYTES,
) -> Dict[str, Any]:
    """Read the tail of filename inside log_dir."""
    return read_log_content(
        filename,
        max_lines=max_lines,
        max_bytes=max_bytes,
        log_dir=log_dir,
    )
