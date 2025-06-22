import asyncio
from enum import Enum
import os
import shutil
from typing import List, Optional

import decky

YQ_PATH = os.path.join(decky.DECKY_PLUGIN_DIR, 'bin', 'yq')
OVERRIDE_YAML = os.path.join(decky.DECKY_PLUGIN_DIR, 'override.yaml')

class EnhancedMode(Enum):
    RedirHost = 'redir-host'
    FakeIP    = 'fake-ip'


async def generate_config(
        ori_config: str,
        new_config: str,
        secret: str,
        override_dns: bool,
        enhanced_mode: EnhancedMode,
        controller_port: int,
        allow_remote_access: bool,
        dashboard_dir: str,
        dashboard: str,
        ) -> None:
    shutil.copyfile(ori_config, new_config)
    if override_dns:
        cmd = 'select(fi==0).dns = select(fi==1).dns-override | ' \
            f'select(fi==0).dns += select(fi==1).{enhanced_mode.value}-dns | ' \
            'select(fi==0)'
        await _edit_in_place_with_ref(new_config, OVERRIDE_YAML, cmd)

    cmd = '.external-controller = ' \
        f'"{"0.0.0.0" if allow_remote_access else "127.0.0.1"}' \
        f':{controller_port}" | ' \
        f'.secret = "{secret}" | ' \
        f'.external-ui = "{dashboard_dir}" | ' \
        f'.external-ui-name = "{dashboard}"'
    await _edit_in_place(new_config, cmd)

    cmd = 'select(fi==0).tun = select(fi==1).tun-override | ' \
        'select(fi==0) += select(fi==1).always-override | ' \
        'select(fi==0)'
    await _edit_in_place_with_ref(new_config, OVERRIDE_YAML, cmd)

# use yq to edit the config
async def _exec_yq(cmd: List[str]) -> Optional[str]:
    command = [YQ_PATH, *cmd]
    print_cmd = "'" + "' '".join(command) + "'"
    decky.logger.debug(f'exec_yq: {print_cmd}')
    process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
    return_code = await process.wait()
    stdout, stderr = await process.communicate()
    if return_code != 0:
        raise Exception(f'yq error: {stderr.decode()}')
    if stderr is not None and len(stderr) > 0:
        decky.logger.warning(f'yq warning: {stderr.decode()}')
    if stdout is not None and len(stderr) > 0:
        decky.logger.debug(f'yq output: {stdout.decode()}')
        return stdout.decode()
    else:
        return None

async def _edit_in_place(path: str, cmd: str) -> None:
    await _exec_yq([
            '-i',
            cmd,
            path,
        ])

async def _edit_in_place_with_ref(path: str, ref_path: str, cmd: str) -> None:
    await _exec_yq([
            'eval-all',
            '-i',
            cmd,
            path,
            ref_path,
        ])
