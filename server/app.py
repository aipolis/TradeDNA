# -*- coding: utf-8 -*-
"""TradeDNA API 服务"""
from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import ADMIN_SECRET, APP_ENV, RESULT_SCHEMA_VERSION, bj_now
from personality_store import (
    ensure_tables,
    get_history,
    get_latest_result,
    recent_results,
    save_result,
    stats_dna_distribution,
    upsert_user,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("tradedna.app")

app = FastAPI(title="TradeDNA API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- openid 解析 ----------

def _resolve_openid(
    x_wx_openid: Optional[str] = Header(default=None, alias="X-WX-OPENID"),
    x_wx_from_openid: Optional[str] = Header(default=None, alias="X-WX-FROM-OPENID"),
) -> Optional[str]:
    """优先取微信云调用注入的 X-WX-OPENID(可信)
    fallback X-WX-FROM-OPENID(分享场景)
    """
    return (x_wx_openid or x_wx_from_openid or "").strip() or None


def _require_openid(
    x_wx_openid: Optional[str] = Header(default=None, alias="X-WX-OPENID"),
    x_wx_from_openid: Optional[str] = Header(default=None, alias="X-WX-FROM-OPENID"),
) -> str:
    oid = _resolve_openid(x_wx_openid, x_wx_from_openid)
    if not oid:
        raise HTTPException(status_code=401, detail="missing X-WX-OPENID; must call via wx.cloud.callContainer")
    return oid


def _check_admin(x_admin_secret: Optional[str]) -> None:
    if not ADMIN_SECRET:
        raise HTTPException(status_code=503, detail="ADMIN_SECRET not configured")
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="invalid admin secret")


# ---------- 请求模型 ----------

class UserProfilePayload(BaseModel):
    nick_name: str = Field(default="", max_length=64)
    avatar_url: str = Field(default="", max_length=512)


class ResultPayload(BaseModel):
    dna_code: str = Field(min_length=4, max_length=4)
    dimensions: dict[str, Any]
    source: str = Field(default="quiz", max_length=32)
    client_uid: str = Field(default="", max_length=48)
    nick_name: str = Field(default="", max_length=64)
    avatar_url: str = Field(default="", max_length=512)
    extra: Optional[dict[str, Any]] = None


# ---------- 路由 ----------

@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "tradedna",
        "env": APP_ENV or "dev",
        "schema_version": RESULT_SCHEMA_VERSION,
        "time": bj_now().isoformat(),
    }


@app.post("/api/profile/sync")
def profile_sync(
    payload: UserProfilePayload,
    x_wx_openid: Optional[str] = Header(default=None, alias="X-WX-OPENID"),
):
    """用户登录后同步昵称/头像;openid 从可信 header 取"""
    openid = _require_openid(x_wx_openid)
    ok = upsert_user(
        openid,
        nick_name=payload.nick_name,
        avatar_url=payload.avatar_url,
    )
    return {"ok": ok, "openid_mask": openid[:4] + "…" + openid[-4:]}


@app.post("/api/result/submit")
def submit_result(
    payload: ResultPayload,
    x_wx_openid: Optional[str] = Header(default=None, alias="X-WX-OPENID"),
):
    """提交一次测评结果"""
    openid = _require_openid(x_wx_openid)

    # 顺手 upsert 用户基本信息(避免没调过 profile/sync 的用户没记录)
    upsert_user(
        openid,
        nick_name=payload.nick_name,
        avatar_url=payload.avatar_url,
    )

    ok = save_result(
        openid,
        dna_code=payload.dna_code,
        dimensions=payload.dimensions,
        source=payload.source,
        client_uid=payload.client_uid,
        extra=payload.extra,
    )
    if not ok:
        raise HTTPException(status_code=500, detail="save failed")
    return {"ok": True, "dna_code": payload.dna_code.upper()}


@app.get("/api/result/latest")
def latest_result(
    x_wx_openid: Optional[str] = Header(default=None, alias="X-WX-OPENID"),
):
    """取自己最近一次测评结果"""
    openid = _require_openid(x_wx_openid)
    row = get_latest_result(openid)
    return {"ok": True, "data": row}


@app.get("/api/result/history")
def result_history(
    limit: int = Query(default=20, ge=1, le=100),
    x_wx_openid: Optional[str] = Header(default=None, alias="X-WX-OPENID"),
):
    """取自己测评历史"""
    openid = _require_openid(x_wx_openid)
    rows = get_history(openid, limit=limit)
    return {"ok": True, "data": rows}


# ---------- 管理后台(运营看分布) ----------

@app.get("/api/admin/stats")
def admin_stats(x_admin_secret: Optional[str] = Header(default=None, alias="X-Admin-Secret")):
    """16 人格分布 + 总数(运营用)"""
    _check_admin(x_admin_secret)
    return {"ok": True, "data": stats_dna_distribution()}


@app.get("/api/admin/recent")
def admin_recent(
    limit: int = Query(default=50, ge=1, le=200),
    x_admin_secret: Optional[str] = Header(default=None, alias="X-Admin-Secret"),
):
    """最近 N 条测评(运营用,openid 脱敏)"""
    _check_admin(x_admin_secret)
    return {"ok": True, "data": recent_results(limit=limit)}


@app.on_event("startup")
def on_startup():
    try:
        ensure_tables()
        log.info("tradedna api started schema_version=%s env=%s", RESULT_SCHEMA_VERSION, APP_ENV or "dev")
    except Exception:
        log.exception("startup init failed (will retry on first request)")
