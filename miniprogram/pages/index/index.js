Page({
  data:{},
  onReady(){ this.initDna() },
  onShow(){ if(this._canvas && !this._running) this.startLoop() },
  onHide(){ this.stopLoop() },
  onUnload(){ this.stopLoop(); this._canvas = null },

  stopLoop(){
    this._running = false
    if(this._rafId && this._canvas){
      this._canvas.cancelAnimationFrame(this._rafId)
      this._rafId = 0
    }
  },

  initDna(){
    const q = wx.createSelectorQuery()
    q.select('#dnaCanvas').fields({ node:true, size:true }).exec(res=>{
      if(!res || !res[0] || !res[0].node) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio) || 2
      const W = res[0].width, H = res[0].height
      canvas.width = W*dpr; canvas.height = H*dpr
      ctx.scale(dpr, dpr)
      this._canvas = canvas
      this._ctx = ctx
      this._W = W; this._H = H
      this._t = 0
      this.startLoop()
    })
  },

  startLoop(){
    if(this._running) return
    this._running = true
    const canvas = this._canvas, ctx = this._ctx
    const W = this._W, H = this._H
    let lastTs = 0
    const FRAME_MS = 1000/30 // 30fps，省电
    const draw = (ts)=>{
      if(!this._running) return
      if(ts - lastTs >= FRAME_MS){
        lastTs = ts
        this.render(ctx, W, H, this._t)
        this._t += 0.04
      }
      this._rafId = canvas.requestAnimationFrame(draw)
    }
    this._rafId = canvas.requestAnimationFrame(draw)
  },

  render(ctx, W, H, t){
    ctx.clearRect(0,0,W,H)
    const cx = W/2, cy = H/2
    const pulse = 0.82 + 0.18 * Math.sin(t * 2.2)

    const halo = ctx.createRadialGradient(cx,cy,30,cx,cy,W/2)
    halo.addColorStop(0,'rgba(255,220,120,0.38)')
    halo.addColorStop(0.32,'rgba(247,198,106,0.28)')
    halo.addColorStop(0.55,'rgba(47,140,255,0.20)')
    halo.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle = halo
    ctx.fillRect(0,0,W,H)

    const halo2 = ctx.createRadialGradient(cx,cy,W*0.08,cx,cy,W*0.48)
    halo2.addColorStop(0,'rgba(255,240,180,0.12)')
    halo2.addColorStop(0.6,'rgba(247,198,106,0.06)')
    halo2.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle = halo2
    ctx.fillRect(0,0,W,H)

    const N = 36
    const amp = W*0.22
    const len = W*0.66
    const x0 = cx - len/2
    for(let i=0;i<N;i++){
      const f = i/N
      const x = x0 + len*f
      const a = f*Math.PI*4 + t
      const y1 = cy + Math.sin(a)*amp
      const y2 = cy + Math.sin(a+Math.PI)*amp
      const z1 = (Math.sin(a)+1)/2
      const z2 = (Math.sin(a+Math.PI)+1)/2
      ctx.beginPath()
      ctx.arc(x,y1, 2.8 + z1*2.6, 0, Math.PI*2)
      ctx.fillStyle = `rgba(255,228,140,${0.58+z1*0.42})`
      ctx.shadowColor = 'rgba(255,220,100,0.95)'
      ctx.shadowBlur = 16 + 10*z1
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x,y2, 2.8 + z2*2.6, 0, Math.PI*2)
      ctx.fillStyle = `rgba(90,190,255,${0.52+z2*0.48})`
      ctx.shadowColor = 'rgba(60,175,255,0.95)'
      ctx.shadowBlur = 16 + 10*z2
      ctx.fill()
      if(i%3===0){
        ctx.shadowBlur = 0
        ctx.beginPath()
        ctx.moveTo(x,y1); ctx.lineTo(x,y2)
        const g = ctx.createLinearGradient(x,y1,x,y2)
        g.addColorStop(0,'rgba(255,228,120,0.82)')
        g.addColorStop(1,'rgba(70,185,255,0.82)')
        ctx.strokeStyle = g
        ctx.lineWidth = 1.15
        ctx.stroke()
      }
      ctx.shadowBlur = 0
    }

    ctx.beginPath()
    ctx.arc(cx,cy, W*0.38, 0, Math.PI*2)
    ctx.strokeStyle = `rgba(255,220,120,${0.28 + 0.12*pulse})`
    ctx.lineWidth = 1.4
    ctx.shadowColor = 'rgba(247,198,106,0.85)'
    ctx.shadowBlur = 22 * pulse
    ctx.stroke()
    ctx.shadowBlur = 0

    ctx.beginPath()
    ctx.arc(cx,cy, W*0.44, 0, Math.PI*2)
    ctx.strokeStyle = `rgba(70,180,255,${0.10 + 0.08*pulse})`
    ctx.lineWidth = 1
    ctx.shadowColor = 'rgba(47,140,255,0.7)'
    ctx.shadowBlur = 18 * pulse
    ctx.stroke()
    ctx.shadowBlur = 0
  },

  start(){
    const { isProfileReady } = require('../../utils/auth')
    const { getProfile } = require('../../utils/userProfile')
    const target = '/pages/intro/intro'
    if(isProfileReady(getProfile())){
      wx.reLaunch({ url: target })
      return
    }
    wx.navigateTo({ url: `/pages/login/login?redirect=${encodeURIComponent(target)}` })
  }
})
