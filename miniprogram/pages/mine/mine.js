const { openOfficialAccount } = require('../../utils/follow')

function diffCodes(latest, prev){
  if(!latest || !prev) return []
  const labels = {
    A:'分析型', B:'盘感型', S:'短线型', L:'长线型',
    C:'保守型', G:'进攻型', D:'纪律型', F:'灵活型'
  }
  const dims = ['决策','周期','风险','执行']
  const out = []
  for(let i=0;i<4;i++){
    if(latest[i] !== prev[i]){
      out.push({
        dim: dims[i],
        from: labels[prev[i]] || prev[i],
        to: labels[latest[i]] || latest[i]
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
    history:[], historyCount:0, diffList:[], hasDiff:false
  },

  onShow(){
    const result = wx.getStorageSync('tradeDNAResult')
    const rawHist = wx.getStorageSync('tradeDNAHistory') || []
    const history = rawHist.slice(0, 5).map(h => ({
      ...h,
      timeText: fmtTime(h.timestamp)
    }))

    let diffList = []
    if(rawHist.length >= 2){
      diffList = diffCodes(rawHist[0].code, rawHist[1].code)
    }

    if(result && result.code){
      this.setData({
        hasResult:true, result, p:result.personality,
        history, historyCount: rawHist.length,
        diffList, hasDiff: diffList.length > 0
      })
    } else {
      this.setData({
        hasResult:false, result:null, p:null,
        history:[], historyCount:0, diffList:[], hasDiff:false
      })
    }
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
  }
})
