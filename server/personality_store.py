# -*- coding: utf-8 -*-
"""TradeDNA 测评结果存储"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, Optional

from config import RESULT_SCHEMA_VERSION, bj_now
from db_store import MYSQL_CHARSET, MYSQL_COLLATE, ensure_schema, mysql_enabled, with_retry

log = logging.getLogger("tradedna.personality")

TABLE_USERS = "td_users"
TABLE_RESULTS = "td_results"
_users_ready = False
_results_ready = False


# ---------- 表结构 ----------

def _ensure_users_table() -> bool:
    global _users_ready
    if _users_ready:
        return True
    if not mysql_enabled() or not ensure_schema():
        return False

    def _run(conn):
        with conn.cursor() as cur:
            cur.execute(
                f"""
                CREATE TABLE IF NOT EXISTS `{TABLE_USERS}` (
                    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    openid VARCHAR(64) NOT NULL,
                    unionid VARCHAR(64) NULL,
                    nick_name VARCHAR(64) NOT NULL DEFAULT '',
                    avatar_url VARCHAR(512) NOT NULL DEFAULT '',
                    first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
                    test_count INT NOT NULL DEFAULT 0,
                    latest_dna VARCHAR(8) NOT NULL DEFAULT '',
                    UNIQUE KEY uk_openid (openid),
                    KEY idx_last_seen (last_seen_at),
                    KEY idx_latest_dna (latest_dna)
                ) ENGINE=InnoDB DEFAULT CHARSET={MYSQL_CHARSET} COLLATE={MYSQL_COLLATE}
                """
            )
        conn.commit()

    try:
        with_retry(_run)
        _users_ready = True
        return True
    except Exception:
        log.exception("td_users table init failed")
        return False


def _ensure_results_table() -> bool:
    global _results_ready
    if _results_ready:
        return True
    if not mysql_enabled() or not ensure_schema():
        return False

    def _run(conn):
        with conn.cursor() as cur:
            cur.execute(
                f"""
                CREATE TABLE IF NOT EXISTS `{TABLE_RESULTS}` (
                    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    openid VARCHAR(64) NOT NULL,
                    dna_code CHAR(4) NOT NULL,
                    dimensions JSON NOT NULL,
                    schema_version VARCHAR(8) NOT NULL,
                    source VARCHAR(32) NOT NULL DEFAULT 'quiz',
                    client_uid VARCHAR(48) NULL,
                    extra JSON NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    KEY idx_openid_created (openid, created_at),
                    KEY idx_dna_code (dna_code),
                    KEY idx_created (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET={MYSQL_CHARSET} COLLATE={MYSQL_COLLATE}
                """
            )
        conn.commit()

    try:
        with_retry(_run)
        _results_ready = True
        return True
    except Exception:
        log.exception("td_results table init failed")
        return False


def ensure_tables() -> bool:
    return _ensure_users_table() and _ensure_results_table()


# ---------- 用户操作 ----------

def upsert_user(
    openid: str,
    *,
    nick_name: str = "",
    avatar_url: str = "",
    unionid: str = "",
) -> bool:
    if not openid or not ensure_tables():
        return False

    nick = (nick_name or "")[:64]
    avatar = (avatar_url or "")[:512]
    uid_str = (unionid or "")[:64]

    def _run(conn):
        with conn.cursor() as cur:
            cur.execute(
                f"""
                INSERT INTO `{TABLE_USERS}` (openid, unionid, nick_name, avatar_url)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    nick_name = IF(VALUES(nick_name)='', nick_name, VALUES(nick_name)),
                    avatar_url = IF(VALUES(avatar_url)='', avatar_url, VALUES(avatar_url)),
                    unionid = IF(VALUES(unionid)='', unionid, VALUES(unionid)),
                    last_seen_at = CURRENT_TIMESTAMP
                """,
                (openid, uid_str, nick, avatar),
            )
        conn.commit()

    try:
        with_retry(_run)
        return True
    except Exception:
        log.exception("upsert_user failed openid=%s", openid[:8])
        return False


# ---------- 测评结果操作 ----------

def save_result(
    openid: str,
    *,
    dna_code: str,
    dimensions: dict[str, Any],
    source: str = "quiz",
    client_uid: str = "",
    extra: Optional[dict] = None,
) -> bool:
    if not openid or not dna_code or not ensure_tables():
        return False

    dna = (dna_code or "")[:4].upper()
    dims_json = json.dumps(dimensions or {}, ensure_ascii=False)
    extra_json = json.dumps(extra or {}, ensure_ascii=False) if extra else None
    src = (source or "quiz")[:32]
    cuid = (client_uid or "")[:48]

    def _run(conn):
        with conn.cursor() as cur:
            cur.execute(
                f"""
                INSERT INTO `{TABLE_RESULTS}`
                    (openid, dna_code, dimensions, schema_version, source, client_uid, extra)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (openid, dna, dims_json, RESULT_SCHEMA_VERSION, src, cuid, extra_json),
            )
            cur.execute(
                f"""
                UPDATE `{TABLE_USERS}`
                SET test_count = test_count + 1,
                    latest_dna = %s,
                    last_seen_at = CURRENT_TIMESTAMP
                WHERE openid = %s
                """,
                (dna, openid),
            )
        conn.commit()

    try:
        with_retry(_run)
        return True
    except Exception:
        log.exception("save_result failed openid=%s dna=%s", openid[:8], dna)
        return False


def _parse_json_field(row: dict, key: str) -> None:
    """安全把 JSON 字符串字段解析成 dict"""
    val = row.get(key)
    if isinstance(val, str) and val:
        try:
            row[key] = json.loads(val)
        except Exception:
            pass


def get_latest_result(openid: str) -> Optional[dict]:
    if not openid or not ensure_tables():
        return None

    def _run(conn):
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT id, dna_code, dimensions, schema_version, source, extra, created_at
                FROM `{TABLE_RESULTS}`
                WHERE openid = %s
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (openid,),
            )
            row = cur.fetchone()
        return row

    try:
        row = with_retry(_run)
        if row:
            _parse_json_field(row, "dimensions")
            _parse_json_field(row, "extra")
        return row
    except Exception:
        log.exception("get_latest_result failed")
        return None


def get_history(openid: str, *, limit: int = 20) -> list[dict]:
    if not openid or not ensure_tables():
        return []
    n = max(1, min(int(limit or 20), 100))

    def _run(conn):
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT id, dna_code, dimensions, schema_version, source, extra, created_at
                FROM `{TABLE_RESULTS}`
                WHERE openid = %s
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (openid, n),
            )
            return list(cur.fetchall() or [])

    try:
        rows = with_retry(_run)
        for r in rows:
            _parse_json_field(r, "dimensions")
            _parse_json_field(r, "extra")
        return rows
    except Exception:
        log.exception("get_history failed")
        return []


# ---------- 管理后台统计 ----------

def stats_dna_distribution() -> dict:
    """16 人格当前分布(以每用户最新结果为准)"""
    if not ensure_tables():
        return {}

    def _run(conn):
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT latest_dna AS dna, COUNT(*) AS n
                FROM `{TABLE_USERS}`
                WHERE latest_dna != ''
                GROUP BY latest_dna
                ORDER BY n DESC
                """
            )
            rows = list(cur.fetchall() or [])
            cur.execute(f"SELECT COUNT(*) AS total FROM `{TABLE_USERS}`")
            total_users = (cur.fetchone() or {}).get("total", 0)
            cur.execute(f"SELECT COUNT(*) AS total FROM `{TABLE_RESULTS}`")
            total_results = (cur.fetchone() or {}).get("total", 0)
        return {
            "total_users": total_users,
            "total_results": total_results,
            "distribution": rows,
        }

    try:
        return with_retry(_run)
    except Exception:
        log.exception("stats_dna_distribution failed")
        return {}


def recent_results(limit: int = 50) -> list[dict]:
    if not ensure_tables():
        return []
    n = max(1, min(int(limit or 50), 200))

    def _run(conn):
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT r.id, r.openid, r.dna_code, r.source, r.created_at,
                       u.nick_name, u.test_count
                FROM `{TABLE_RESULTS}` r
                LEFT JOIN `{TABLE_USERS}` u ON r.openid = u.openid
                ORDER BY r.created_at DESC
                LIMIT %s
                """,
                (n,),
            )
            return list(cur.fetchall() or [])

    try:
        rows = with_retry(_run)
        # 脱敏 openid 仅返回前 4 后 4
        for r in rows:
            oid = r.get("openid") or ""
            r["openid_mask"] = (oid[:4] + "…" + oid[-4:]) if len(oid) > 8 else oid
            r.pop("openid", None)
        return rows
    except Exception:
        log.exception("recent_results failed")
        return []
