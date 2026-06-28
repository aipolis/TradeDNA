const { openOfficialAccount } = require('../../utils/follow')
const { DIFF_DIMS, poleLabel } = require('../../utils/dimensions')
const { getProfile } = require('../../utils/userProfile')
const { logout } = require('../../utils/auth')
const { getHistory } = require('../../utils/api')
const { getPersonality } = require('../../utils/personalities')

// 把后端 dimensions(分组对象)还原成本地 score(R/X/T/E/C/G/D/F 扁平)
function dimensionsToScore(dimensions){
  const d = dimensions || {}
  const info = d.information || {}
  const emo = d.emotion || {}
  const risk = d.risk || {}
  const exe = d.execution || {}
  return {
    R: info.R || 0, X: info.X || 0,
    T: emo.T || 0,  E: emo.E || 0,
    C: risk.C || 0, G: risk.G || 0,
    D: exe.D || 0,  F: exe.F || 0
  }
}

function cloudRowToHistory(row){
  const extra = row.extra || {}
  return {
    code: row.dna_code,
    cognitiveCode: extra.cognitiveCode || '',
    behaviorCode: extra.behaviorCode || '',
    name: (getPersonality(row.dna_code) || {}).name || '',
    timestamp: new Date(row.created_at).getTime()
  }
}

function cloudRowToResult(row){
  const code = row.dna_code
  const extra = row.extra || {}
  return {
    code,
    cognitiveCode: extra.cognitiveCode || '',
    behaviorCode: extra.behaviorCode || '',
    score: dimensionsToScore(row.dimensions),
    personality: getPersonality(code),
    timestamp: new Date(row.created_at).getTime(),
    restoredFromCloud: true
  }
}

function diffCodes(latest, prev){
  if(!latest || !prev) return []
  const dims = DIFF_DIMS
  const out = []
  for(let i=0;i<4;i++){
    if(latest[i] !== prev[i]){
      out.push({
        dim: dims[i],
        from: poleLabel(prev[i]) || prev[i],
        to: poleLabel(latest[i]) || latest[i]
      })
    }
  }
  return out
}

function fmtTime(ts){
  if(!ts) return ''
  const d = new Date(ts)
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${d.getFullYear()}-${m}-${day}`
}

Page({
  data:{
    hasResult:false, result:null, p:null,
    history:[], historyCount:0, diffList:[], hasDiff:false,
    isLoggedIn:false
  },

  onShow(){
    const profile = getProfile()
    const isLoggedIn = !!(profile && profile.loggedIn)

    const result = wx.getStorageSync('tradeDNAResult')
    const rawHist = wx.getStorageSync('tradeDNAHistory') || []

    this._render(result, rawHist, isLoggedIn)

    // 本地空但已登录 → 异步从云端恢复,失败静默
    if(isLoggedIn && !result && !rawHist.length){
      this._restoreFromCloud()
    }
  },

  _render(result, rawHist, isLoggedIn){
    const history = (rawHist || []).slice(0, 5).map(h => ({
      ...h,
      timeText: fmtTime(h.timestamp)
    }))
    let diffList = []
    if((rawHist || []).length >= 2){
      diffList = diffCodes(rawHist[0].code, rawHist[1].code)
    }
    if(result && result.code){
      this.setData({
        hasResult:true, result, p:result.personality,
        history, historyCount: (rawHist || []).length,
        diffList, hasDiff: diffList.length > 0,
        isLoggedIn
      })
    } else {
      this.setData({
        hasResult:false, result:null, p:null,
        history:[], historyCount:0, diffList:[], hasDiff:false,
        isLoggedIn
      })
    }
  },

  _restoreFromCloud(){
    getHistory(20).then(res => {
      if(!res || !res.ok || !Array.isArray(res.data) || !res.data.length) return
      const cloudList = res.data
      const localHistory = cloudList.map(cloudRowToHistory)
      wx.setStorageSync('tradeDNAHistory', localHistory.slice(0, 20))
      const latest = cloudList[0]
      const restoredResult = cloudRowToResult(latest)
      wx.setStorageSync('tradeDNAResult', restoredResult)
      const profile = getProfile()
      const isLoggedIn = !!(profile && profile.loggedIn)
      this._render(restoredResult, localHistory, isLoggedIn)
      wx.showToast({ title:'已从云端恢复', icon:'success' })
    }).catch(err => {
      console.warn('[mine] restoreFromCloud skipped', err && err.message)
    })
  },

  start(){ wx.reLaunch({ url:'/pages/intro/intro' }) },
  retake(){ wx.reLaunch({ url:'/pages/intro/intro' }) },
  viewReport(){ wx.navigateTo({ url:'/pages/result/result' }) },
  followOfficial(){ openOfficialAccount() },

  clearHistory(){
    wx.showModal({
      title:'清除所有测评记录？',
      content:'包括最新一次报告，无法恢复',
      confirmText:'清除',
      confirmColor:'#e0644f',
      success: r => {
        if(r.confirm){
          wx.removeStorageSync('tradeDNAResult')
          wx.removeStorageSync('tradeDNAHistory')
          wx.removeStorageSync('tradeDNAProgress')
          this.onShow()
          wx.showToast({ title:'已清除', icon:'success' })
        }
      }
    })
  },

  onLogout(){
    wx.showModal({
      title:'退出登录？',
      content:'将清除本地登录态与测评记录（云端数据已留存）。',
      confirmText:'退出',
      confirmColor:'#e0644f',
      success: r => {
        if(r.confirm){
          logout({ redirect:'/pages/index/index' })
        }
      }
    })
  }
})
