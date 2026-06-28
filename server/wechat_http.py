# -*- coding: utf-8 -*-
"""调用微信开放接口(api.weixin.qq.com)
当前 MVP 不强依赖,云调用 wx.cloud.callContainer 会注入 X-WX-OPENID,无需自己换 code。
此模块保留,留待后续:发送订阅消息、生成小程序码、批量取 unionid 等场景。
"""
from __future__ import annotations

import logging
import os
from typing import Any, Optional

import httpx

try:
    import certifi
except ImportError:
    certifi = None

log = logging.getLogger("tradedna.wechat_http")


def _is_ssl_error(exc: BaseException) -> bool:
    msg = str(exc).lower()
    if "certificate" in msg or "ssl" in msg:
        return True
    cause = getattr(exc, "__cause__", None)
    return bool(cause and _is_ssl_error(cause))


def _verify_candidates() -> list[Any]:
    flag = os.getenv("WECHAT_HTTP_VERIFY", "auto").lower()
    if flag in ("0", "false", "no"):
        return [False]
    if flag in ("1", "true", "yes"):
        return [certifi.where() if certifi else True]
    strict = certifi.where() if certifi else True
    return [strict, False]


async def _request(method: str, url: str, *, params=None, json_body=None, timeout: float = 15):
    last_exc: Optional[BaseException] = None
    for verify in _verify_candidates():
        try:
            async with httpx.AsyncClient(timeout=timeout, verify=verify) as client:
                if method == "GET":
                    return await client.get(url, params=params or {})
                return await client.post(url, json=json_body or {})
        except Exception as exc:
            last_exc = exc
            if verify is not False and _is_ssl_error(exc):
                continue
            raise
    if last_exc:
        raise last_exc
    raise RuntimeError("wechat http request failed")


async def wechat_get(url: str, *, params=None, timeout: float = 15) -> dict:
    r = await _request("GET", url, params=params, timeout=timeout)
    return r.json()


async def wechat_post(url: str, *, json_body=None, timeout: float = 15):
    return await _request("POST", url, json_body=json_body, timeout=timeout)
