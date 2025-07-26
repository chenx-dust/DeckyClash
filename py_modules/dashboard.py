import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import decky
from decky import logger


DASHBOARD_DIR = Path(decky.DECKY_PLUGIN_RUNTIME_DIR) / "dashboard"

BUILTIN_DASHBOARDS: Dict[str, str] = {
    "yacd-meta": "https://github.com/MetaCubeX/yacd/archive/gh-pages.zip",
    "metacubexd": "https://github.com/MetaCubeX/metacubexd/archive/refs/heads/gh-pages.zip",
    "zashboard": "https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip",
}

def get_dashboard_list() -> List[str]:
    dashboard_list = []
    if not DASHBOARD_DIR.is_dir():
        logger.error(f"dashboard_dir_path not exists: {DASHBOARD_DIR}")
        return []

    try:
        for path in DASHBOARD_DIR.iterdir():
            if path.is_dir() and (path / "index.html").exists():
                dashboard_list.append(path.name)

        return dashboard_list
    except Exception as e:
        logger.error(f"error during get_dashboard_list: {e}")
        return []
