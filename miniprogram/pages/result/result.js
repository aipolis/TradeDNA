const { calculateResult } = require('../../utils/scoring')
const { openOfficialAccount } = require('../../utils/follow')
const { DIM_META } = require('../../utils/dimensions')

const dimMeta = DIM_META

function buildDim4(score, result){
  const out = []
  const pairs = [
    ['information','R','X'],
    ['emotion','T','E'],
    ['risk','C','G'],
    ['execution','D','F']
  ]
  pairs.forEach(([dim,k1,k2])=>{
    const meta = dimMeta[dim]
    const v1 = score[k1]||0, v2 = score[k2]||0
    const sum = v1+v2 || 1
    const winner = result[dim]
    const winVal = winner===k1 ? v1 : v2
    const pct = Math.round(winVal/sum*100)
    out.push({ name: meta.name, tag: meta[winner], pct })
  })
  return out
}

function drawRadar(ctx, w, h, scoreList){
  const cx = w/2, cy = h/2 + 6
  const R = Math.min(w,h)*0.34
  const n = scoreList.length
  const RADAR_BG = '#08172a'
  ctx.fillStyle = RADAR_BG
  ctx.fillRect(0, 0, w, h)

  const bg = ctx.createRadialGradient(cx, cy, 10, cx, cy, R * 1.4)
  bg.addColorStop(0, 'rgba(247,198,106,0.12)')
  bg.addColorStop(1, RADAR_BG)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // rings
  for(let k=1;k<=4;k++){
    ctx.beginPath()
    for(let i=0;i<n;i++){
      const a = -Math.PI/2 + i*2*Math.PI/n
      const r = R*k/4
      const x = cx+Math.cos(a)*r, y = cy+Math.sin(a)*r
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y)
    }
    ctx.closePath()
    ctx.strokeStyle = `rgba(247,198,106,${0.10 + k*0.04})`
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // axes
  ctx.strokeStyle = 'rgba(143,176,208,0.22)'
  ctx.lineWidth = 1
  for(let i=0;i<n;i++){
    const a = -Math.PI/2 + i*2*Math.PI/n
    ctx.beginPath()
    ctx.moveTo(cx,cy)
    ctx.lineTo(cx+Math.cos(a)*R, cy+Math.sin(a)*R)
    ctx.stroke()
  }

  // data polygon
  ctx.beginPath()
  scoreList.forEach((s,i)=>{
    const a = -Math.PI/2 + i*2*Math.PI/n
    const r = (s.value/5)*R
    const x = cx+Math.cos(a)*r, y = cy+Math.sin(a)*r
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y)
  })
  ctx.closePath()
  const grad = ctx.createLinearGradient(cx-R,cy-R,cx+R,cy+R)
  grad.addColorStop(0,'rgba(247,198,106,0.55)')
  grad.addColorStop(1,'rgba(47,140,255,0.30)')
  ctx.fillStyle = grad
  ctx.fill()
  ctx.strokeStyle = '#f7c66a'
  ctx.lineWidth = 1.8
  ctx.shadowColor = 'rgba(247,198,106,0.6)'
  ctx.shadowBlur = 14
  ctx.stroke()
  ctx.shadowBlur = 0

  // vertex dots
  scoreList.forEach((s,i)=>{
    const a = -Math.PI/2 + i*2*Math.PI/n
    const r = (s.value/5)*R
    const x = cx+Math.cos(a)*r, y = cy+Math.sin(a)*r
    ctx.beginPath()
    ctx.arc(x,y,4,0,Math.PI*2)
    ctx.fillStyle = '#ffe39a'
    ctx.shadowColor = 'rgba(247,198,106,0.9)'
    ctx.shadowBlur = 10
    ctx.fill()
    ctx.shadowBlur = 0
  })

  // labels
  ctx.font = '600 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  scoreList.forEach((s,i)=>{
    const a = -Math.PI/2 + i*2*Math.PI/n
    const lx = cx+Math.cos(a)*(R+24)
    const ly = cy+Math.sin(a)*(R+22)
    ctx.fillStyle = '#dcecff'
    ctx.fillText(s.name, lx, ly)
    ctx.fillStyle = '#f7c66a'
    ctx.font = '700 11px sans-serif'
    ctx.fillText(s.value+'★', lx, ly+16)
    ctx.font = '600 12px sans-serif'
  })
}

Page({
  data:{ result:{code:'RTGD'}, p:{}, scoreList:[], dim4:[], mentorList:[] },
  onLoad(){
    const result = wx.getStorageSync('tradeDNAResult')
    if(!result || !result.code){
      wx.showToast({ title:'还没有测评结果', icon:'none' })
      setTimeout(()=>wx.reLaunch({ url:'/pages/intro/intro' }), 800)
      return
    }
    // 用 result.code 重新查最新 personality,避免旧 storage 里的旧人格数据
    const { getPersonality } = require('../../utils/personalities')
    const p = getPersonality(result.code) || result.personality
    result.personality = p
    const scoreList = Object.keys(p.scores).map(k=>({ name:k, value:p.scores[k] })).sort((a,b)=>b.value-a.value)
    const dim4 = buildDim4(result.score||{}, result)
    const { getMentorAvatar } = require('../../utils/mentorAvatar')
    const mentorList = (p.mentors||[]).map(m=>({
      name: m.name,
      title: m.title,
      bio: m.bio,
      lesson: m.lesson,
      avatar: getMentorAvatar(m.name),
      initial: m.name ? m.name.charAt(0) : ''
    }))
    this.setData({ result, p, scoreList, dim4, mentorList }, ()=>this.renderRadar(scoreList))
  },
  renderRadar(scoreList){
    const tryRender = (attempt)=>{
      const q = this.createSelectorQuery()
      q.select('#radarCanvas').fields({ node:true, size:true }).exec(res=>{
        if(!res || !res[0] || !res[0].node || !res[0].width || !res[0].height){
          if(attempt < 6){
            setTimeout(()=>tryRender(attempt+1), 120)
          } else {
            console.warn('[result] radar canvas not ready after retries')
          }
          return
        }
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio) || 2
        const w = res[0].width, h = res[0].height
        canvas.width = w*dpr; canvas.height = h*dpr
        ctx.scale(dpr, dpr)
        drawRadar(ctx, w, h, scoreList)
      })
    }
    tryRender(0)
  },
  again(){
    wx.removeStorageSync('tradeDNAProgress')
    wx.reLaunch({ url:'/pages/quiz/quiz' })
  },
  poster(){ wx.navigateTo({ url:'/pages/poster/poster' }) },
  followOfficial(){ openOfficialAccount() },
  onShareAppMessage(){
    const code = (this.data.result||{}).code || 'RTGD'
    const name = (this.data.p||{}).name || ''
    return { title:`我的交易DNA是 ${code} · ${name}`, path:'/pages/index/index' }
  }
})
