from enum import Enum
import os
from typing import Optional

from dashboard import BUILTIN_DASHBOARDS
from ruamel.yaml import YAML
import decky
from decky import logger
from ruamel.yaml.comments import CommentedMap

OVERRIDE_YAML = os.path.join(decky.DECKY_PLUGIN_DIR, 'override.yaml')

yaml = YAML()
yaml.width = float("inf")
yaml.preserve_quotes = True

class EnhancedMode(Enum):
    RedirHost = 'redir-host'
    FakeIP    = 'fake-ip'


async def generate_config(
        ori_path: str,
        new_path: str,
        secret: str,
        override_dns: bool,
        enhanced_mode: EnhancedMode,
        controller_port: int,
        allow_remote_access: bool,
        dashboard_dir: str,
        dashboard: Optional[str],
        skip_steam_download: bool,
        ) -> None:
    with open(ori_path) as f:
        config = yaml.load(f)
    logger.debug(f'generate_config: config: {config}')
    with open(OVERRIDE_YAML) as f:
        override_config = yaml.load(f)
    logger.debug(f'generate_config: override_config: {override_config}')
    if override_dns:
        config['dns'] = override_config['dns-override']
        _merge_dict(config['dns'], override_config[f'{enhanced_mode.value}-dns'])
    if skip_steam_download:
        config['rules'] = override_config['skip-steam-rules'] + config['rules']

    config['external-controller'] = f'{"0.0.0.0" if allow_remote_access else "127.0.0.1"}:{controller_port}'
    config['secret'] = secret
    config['external-ui'] = dashboard_dir
    if dashboard is not None:
        config['external-ui-name'] = dashboard
        if dashboard in BUILTIN_DASHBOARDS:
            config['external-ui-url'] = BUILTIN_DASHBOARDS[dashboard]

    config['tun'] = override_config['tun-override']
    _merge_dict(config, override_config['always-override'])
    with open(new_path, 'w') as f:
        yaml.dump(config, f)

def _merge_dict(a: CommentedMap, b: CommentedMap) -> None:
    for k, v in b.items():
        a[k] = v
