# -*- coding: utf-8 -*-
"""云托管 MySQL 连接 + schema 初始化"""
from __future__ import annotations

import logging
import time
from contextlib import contextmanager
from typing import Any, Callable, Optional

import pymysql

from config import MYSQL_ADDRESS, MYSQL_DATABASE, MYSQL_PASSWORD, MYSQL_USERNAME

log = logging.getLogger("tradedna.db")

MYSQL_CHARSET = "utf8mb4"
MYSQL_COLLATE = "utf8mb4_unicode_ci"
_schema_ready = False


def mysql_enabled() -> bool:
    return bool(MYSQL_ADDRESS and MYSQL_USERNAME and MYSQL_PASSWORD)


def _parse_address() -> tuple[str, int]:
    addr = (MYSQL_ADDRESS or "").strip()
    if not addr:
        return "", 3306
    if ":" in addr:
        host, port_s = addr.rsplit(":", 1)
        return host.strip(), int(port_s)
    return addr, 3306


def _is_resume_error(exc: BaseException) -> bool:
    msg = str(exc).lower()
    return "resuming" in msg or "try connecting again" in msg


def _connect(*, use_db: bool = True):
    host, port = _parse_address()
    kwargs: dict[str, Any] = {
        "host": host,
        "port": port,
        "user": MYSQL_USERNAME,
        "password": MYSQL_PASSWORD,
        "charset": MYSQL_CHARSET,
        "connect_timeout": 15,
        "read_timeout": 60,
        "write_timeout": 60,
        "cursorclass": pymysql.cursors.DictCursor,
        "autocommit": False,
    }
    if use_db and MYSQL_DATABASE:
        kwargs["database"] = MYSQL_DATABASE
    return pymysql.connect(**kwargs)


@contextmanager
def db_connection(*, use_db: bool = True):
    conn = _connect(use_db=use_db)
    try:
        yield conn
    finally:
        conn.close()


def with_retry(fn: Callable, retries: int = 6):
    """fn(conn) -> result;云托管 MySQL 冷启动时会自动等唤醒重试"""
    delay = 1.0
    last_exc: Optional[BaseException] = None
    for attempt in range(retries):
        try:
            with db_connection() as conn:
                return fn(conn)
        except Exception as exc:
            last_exc = exc
            if _is_resume_error(exc) and attempt < retries - 1:
                log.warning("mysql waking up, retry in %.1fs (%s)", delay, exc)
                time.sleep(delay)
                delay = min(delay * 1.6, 10.0)
                continue
            raise
    if last_exc:
        raise last_exc


def ensure_schema() -> bool:
    """首次访问时创建 database;表创建延后到各 store 模块的 ensure_*_table"""
    global _schema_ready
    if _schema_ready or not mysql_enabled():
        return _schema_ready

    def _run(conn):
        with conn.cursor() as cur:
            cur.execute(
                f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}` "
                f"DEFAULT CHARACTER SET {MYSQL_CHARSET} COLLATE {MYSQL_COLLATE}"
            )
        conn.select_db(MYSQL_DATABASE)

    try:
        # 第一次连不带库名,因为库可能还没建
        with _connect(use_db=False) as conn:
            _run(conn)
        _schema_ready = True
        log.info("schema ready db=%s", MYSQL_DATABASE)
        return True
    except Exception:
        log.exception("schema init failed")
        return False
