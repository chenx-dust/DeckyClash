import base64
import random
from typing import Any, Optional

def rand_secret() -> str:
    return base64.encodebytes(random.randbytes(18)).decode()[:-1]

def not_none(x: Optional[Any]) -> Any:
    if x is None:
        raise ValueError('None is not allowed')
    return x
