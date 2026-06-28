# -*- coding: utf-8 -*-
"""TradeDNA 服务端配置"""
import os
from datetime import datetime, timezone, timedelta

BJT = timezone(timedelta(hours=8))


def bj_now() -> datetime:
    return datetime.now(BJT)


HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# 云托管 MySQL(控制台 MySQL 页 → 内网地址 + 账号)
MYSQL_ADDRESS = os.getenv("MYSQL_ADDRESS", "")
MYSQL_USERNAME = os.getenv("MYSQL_USERNAME", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "tradedna")

# 小程序凭证(后续如需 code 换 openid 用,目前云调用自动注入 openid 不必需要)
WX_APPID = os.getenv("WX_APPID", "")
WX_SECRET = os.getenv("WX_SECRET", "")

# 管理接口鉴权(查 16 人格分布、最近测评等)
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "")

# 生产环境标识
APP_ENV = os.getenv("APP_ENV", os.getenv("ENV", "")).lower()

# 数据上报版本(改 personalities.js 维度结构时升一档,方便后续筛选)
RESULT_SCHEMA_VERSION = os.getenv("RESULT_SCHEMA_VERSION", "v3")
