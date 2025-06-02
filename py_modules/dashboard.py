import os
from pathlib import Path
from typing import List

import decky
from decky import logger


DASHBOARD_DIR = Path(decky.DECKY_PLUGIN_RUNTIME_DIR) / "dashboard"

def get_dashboard_list() -> List[str]:
    dashboard_list = []
    if not DASHBOARD_DIR.is_dir():
        logger.error(f"dashboard_dir_path not exists: {DASHBOARD_DIR}")
        return []

    try:
        # 遍历 dashboard_dir 下深度 1 的路径, 如果存在 xxx/index.html 则认为是一个 dashboard
        for path in DASHBOARD_DIR.iterdir():
            if path.is_dir() and (path / "index.html").exists():
                dashboard_list.append(path.name)

        return dashboard_list
    except Exception as e:
        logger.error(f"error during get_dashboard_list: {e}")
        return []
