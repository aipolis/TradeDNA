/**
 * TradeDNA 云托管接口封装
 *
 * 使用 wx.cloud.callContainer 调用云托管,微信自动注入 X-WX-OPENID(可信)。
 * 所有方法都返回 Promise。失败时通过 catch 静默,不阻塞用户流程。
 */
const cloud = require('../config/cloud')

function isReady(){
  return !!(cloud.enabled && wx.cloud && wx.cloud.callContainer)
}

function callContainer(path, options = {}){
  if(!isReady()){
    return Promise.reject(new Error('cloud disabled or callContainer unavailable'))
  }
  const params = {
    path,
    method: options.method || 'POST',
    header: Object.assign(
      { 'content-type': 'application/json', 'X-WX-SERVICE': cloud.service },
      options.header || {}
    ),
    data: options.data || {},
    timeout: options.timeout || 15000
  }
  if(cloud.env){
    params.config = { env: cloud.env }
  }
  return wx.cloud.callContainer(params).then(res => {
    if(res.statusCode !== 200){
      const err = new Error(`api ${path} statusCode=${res.statusCode}`)
      err.statusCode = res.statusCode
      err.body = res.data
      throw err
    }
    return res.data
  })
}

/**
 * 把 calculateResult 的扁平 score(R/X/T/E/C/G/D/F)转成后端期望的分维结构
 */
function buildDimensions(score){
  const s = score || {}
  return {
    information: { R: s.R || 0, X: s.X || 0 },
    emotion:     { T: s.T || 0, E: s.E || 0 },
    risk:        { C: s.C || 0, G: s.G || 0 },
    execution:   { D: s.D || 0, F: s.F || 0 }
  }
}

// ---- 业务方法 ----

function submitResult(opts){
  const { code, score, source, clientUid, nickName, avatarUrl, extra } = opts || {}
  return callContainer('/api/result/submit', {
    data: {
      dna_code: code,
      dimensions: buildDimensions(score),
      source: source || 'quiz',
      client_uid: clientUid || '',
      nick_name: nickName || '',
      avatar_url: avatarUrl || '',
      extra: extra || null
    }
  })
}

function syncProfile(opts){
  const { nickName, avatarUrl } = opts || {}
  return callContainer('/api/profile/sync', {
    data: { nick_name: nickName || '', avatar_url: avatarUrl || '' }
  })
}

function getLatestResult(){
  return callContainer('/api/result/latest', { method: 'GET' })
}

function getHistory(limit){
  const n = Math.max(1, Math.min(parseInt(limit || 20, 10) || 20, 100))
  return callContainer('/api/result/history?limit=' + n, { method: 'GET' })
}

function health(){
  return callContainer('/api/health', { method: 'GET' })
}

module.exports = {
  isReady,
  callContainer,
  submitResult,
  syncProfile,
  getLatestResult,
  getHistory,
  health
}
