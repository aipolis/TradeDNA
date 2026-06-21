const { loadCanvasImage } = require('../../utils/canvasImage')
const { openOfficialAccount } = require('../../utils/follow')
const { getProfile, saveProfile, getDisplayName } = require('../../utils/userProfile')
const { getMentorAvatar } = require('../../utils/mentorAvatar')

const TRAIT_MAP = {
  A:{ ico:'📊', text:'分析型', canvasChar:'析' },
  B:{ ico:'👁', text:'盘感型', canvasChar:'感' },
  S:{ ico:'⚡', text:'短线型', canvasChar:'短' },
  L:{ ico:'🌳', text:'长线型', canvasChar:'长' },
  C:{ ico:'🛡', text:'保守型', canvasChar:'守' },
  G:{ ico:'⚔', text:'进攻型', canvasChar:'进' },
  D:{ ico:'📏', text:'纪律型', canvasChar:'律' },
  F:{ ico:'🦋', text:'灵活型', canvasChar:'活' }
}

// 与 poster-shell 中段底色一致；真机 Canvas 2D 无透明通道，不能用 clearRect
const RADAR_BG = '#08172a'

// === 雷达绘制(预览 + 导出共用) ===
// opts.overlay: true=叠在海报中段上(不铺底)，false=独立 canvas(需铺不透明底)
function drawRadar(ctx, w, h, scoreList, opts){
  const o = opts || {}
  const cx = w/2, cy = h/2
  const R = Math.min(w,h)*0.40
  const n = scoreList.length
  if(!o.overlay){
    ctx.fillStyle = o.bgColor || RADAR_BG
    ctx.fillRect(0, 0, w, h)
    const bg = ctx.createRadialGradient(cx, cy, 4, cx, cy, R * 1.3)
    bg.addColorStop(0, 'rgba(247,198,106,0.12)')
    bg.addColorStop(1, RADAR_BG)
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
  }
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
  ctx.strokeStyle = 'rgba(143,176,208,0.22)'
  for(let i=0;i<n;i++){
    const a = -Math.PI/2 + i*2*Math.PI/n
    ctx.beginPath()
    ctx.moveTo(cx,cy)
    ctx.lineTo(cx+Math.cos(a)*R, cy+Math.sin(a)*R)
    ctx.stroke()
  }
  ctx.beginPath()
  scoreList.forEach((s,i)=>{
    const a = -Math.PI/2 + i*2*Math.PI/n
    const r = (s.value/5)*R
    const x = cx+Math.cos(a)*r, y = cy+Math.sin(a)*r
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y)
  })
  ctx.closePath()
  const grad = ctx.createLinearGradient(cx-R,cy-R,cx+R,cy+R)
  grad.addColorStop(0,'rgba(247,198,106,0.6)')
  grad.addColorStop(1,'rgba(47,140,255,0.30)')
  ctx.fillStyle = grad
  ctx.fill()
  ctx.strokeStyle = '#f7c66a'
  ctx.lineWidth = 1.6
  ctx.shadowColor = 'rgba(247,198,106,0.6)'
  ctx.shadowBlur = 10
  ctx.stroke()
  ctx.shadowBlur = 0
  scoreList.forEach((s,i)=>{
    const a = -Math.PI/2 + i*2*Math.PI/n
    const r = (s.value/5)*R
    const x = cx+Math.cos(a)*r, y = cy+Math.sin(a)*r
    ctx.beginPath()
    ctx.arc(x,y,3,0,Math.PI*2)
    ctx.fillStyle = '#ffe39a'
    ctx.fill()
  })
  const labelSize = o.labelSize || 10
  ctx.font = `600 ${labelSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#c8ddf5'
  scoreList.forEach((s,i)=>{
    const a = -Math.PI/2 + i*2*Math.PI/n
    const lx = cx+Math.cos(a)*(R+16)
    const ly = cy+Math.sin(a)*(R+14)
    ctx.fillText(s.name, lx, ly)
  })
}

// === 圆角矩形 ===
function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath()
  ctx.moveTo(x+r, y)
  ctx.lineTo(x+w-r, y)
  ctx.quadraticCurveTo(x+w, y, x+w, y+r)
  ctx.lineTo(x+w, y+h-r)
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h)
  ctx.lineTo(x+r, y+h)
  ctx.quadraticCurveTo(x, y+h, x, y+h-r)
  ctx.lineTo(x, y+r)
  ctx.quadraticCurveTo(x, y, x+r, y)
  ctx.closePath()
}

function drawQrBlock(ctx, W, fY, qrImg){
  const qrSize = 120
  const qrX = W - 50 - qrSize - 20
  const qrY = fY + 20
  const qrGrad = ctx.createLinearGradient(qrX, qrY, qrX+qrSize, qrY+qrSize)
  qrGrad.addColorStop(0,'#ffeaa3')
  qrGrad.addColorStop(1,'#c98a2c')
  ctx.fillStyle = qrGrad
  roundRect(ctx, qrX-4, qrY-4, qrSize+8, qrSize+8, 14)
  ctx.fill()
  ctx.fillStyle = '#fff'
  roundRect(ctx, qrX, qrY, qrSize, qrSize, 10)
  ctx.fill()
  const inner = qrSize - 8
  const ix = qrX + 4
  const iy = qrY + 4
  if(qrImg){
    ctx.drawImage(qrImg, ix, iy, inner, inner)
    return
  }
  ctx.fillStyle = '#eef3f8'
  ctx.fillRect(ix, iy, inner, inner)
  ctx.fillStyle = '#0d2238'
  ctx.font = '600 13px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('扫码关注', ix + inner/2, iy + inner/2 - 10)
  ctx.fillStyle = '#f7c66a'
  ctx.fillText('量化新手村', ix + inner/2, iy + inner/2 + 12)
}

// === 海报导出绘制 ===
function flushCanvas(canvas){
  return new Promise(resolve=>{
    if(canvas && canvas.requestAnimationFrame){
      canvas.requestAnimationFrame(()=>canvas.requestAnimationFrame(resolve))
    } else {
      setTimeout(resolve, 200)
    }
  })
}

function drawUserBlock(ctx, W, y, opt){
  const { avatarImg, nickName } = opt
  const name = (nickName || '交易者').slice(0, 16)
  const ax = 56
  const r = 36
  const cy = y + r

  ctx.beginPath()
  ctx.arc(ax + r, cy, r + 3, 0, Math.PI * 2)
  ctx.strokeStyle = '#f7c66a'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.save()
  ctx.beginPath()
  ctx.arc(ax + r, cy, r, 0, Math.PI * 2)
  ctx.clip()
  if(avatarImg){
    ctx.drawImage(avatarImg, ax, y, r * 2, r * 2)
  } else {
    ctx.fillStyle = '#1a2a3d'
    ctx.fillRect(ax, y, r * 2, r * 2)
    ctx.fillStyle = '#f7c66a'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(name.charAt(0) || '交', ax + r, cy)
  }
  ctx.restore()

  const tx = ax + r * 2 + 20
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.font = '900 30px sans-serif'
  ctx.fillText(name, tx, cy)
}

function drawMentorCard(ctx, W, opt){
  const { mentor, mentorAvatarImg } = opt
  if(!mentor || !mentor.name) return
  const mX = 70, mY = 410, mW = W - 140, mH = 110
  const mgrad = ctx.createLinearGradient(mX, mY, mX + mW, mY + mH)
  mgrad.addColorStop(0, 'rgba(247,198,106,0.22)')
  mgrad.addColorStop(1, 'rgba(47,140,255,0.06)')
  ctx.fillStyle = mgrad
  roundRect(ctx, mX, mY, mW, mH, 22)
  ctx.fill()
  ctx.strokeStyle = 'rgba(247,198,106,0.42)'
  ctx.lineWidth = 1
  ctx.stroke()

  // 左侧头像(若有)
  let textCenterX = W / 2
  if(mentorAvatarImg){
    const r = 38
    const cx = mX + 30 + r
    const cy = mY + mH/2
    // 金边
    ctx.beginPath()
    ctx.arc(cx, cy, r + 3, 0, Math.PI*2)
    ctx.strokeStyle = '#f7c66a'
    ctx.lineWidth = 2.5
    ctx.shadowColor = 'rgba(247,198,106,0.55)'
    ctx.shadowBlur = 14
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.shadowColor = 'rgba(0,0,0,0)'
    // 图像
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI*2)
    ctx.clip()
    // 放大裁剪源图,只取上中部头像区域(避开下方水印与边距)
    const sw = mentorAvatarImg.width || 200
    const sh = mentorAvatarImg.height || 200
    // 紧裁源图头部区域,让头几乎贴满圆形(消除上方空白)
    const sCropSize = Math.min(sw, sh) * 0.60
    const sx = (sw - sCropSize) / 2
    const sy = sh * 0.05
    ctx.drawImage(mentorAvatarImg, sx, sy, sCropSize, sCropSize, cx - r, cy - r, r*2, r*2)
    ctx.restore()
    // 文字区右移居中
    const textLeft = mX + 30 + r*2 + 20
    const textRight = mX + mW - 20
    textCenterX = (textLeft + textRight) / 2
  }

  // 顶部横排标签
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#9dccff'
  ctx.font = '600 18px sans-serif'
  ctx.fillText('—   同  类  导  师   —', textCenterX, mY + 22)

  // 名字(长度自适应字号,避免超长撞边)
  const nameStr = mentor.name || ''
  const nameFs = nameStr.length > 9 ? 24 : (nameStr.length > 6 ? 28 : 34)
  ctx.fillStyle = '#f7c66a'
  ctx.font = `900 ${nameFs}px sans-serif`
  ctx.fillText(nameStr, textCenterX, mY + 58)

  // 头衔
  ctx.fillStyle = '#dcecff'
  ctx.font = '600 17px sans-serif'
  ctx.fillText(mentor.title || '', textCenterX, mY + 90)
}

async function drawExportPoster(canvas, ctx, W, H, opt){
  const { code, name, traitTags, scoreList, logoImg, qrImg, avatarImg, nickName, mentor, mentorAvatarImg } = opt

  // 背景
  const bg = ctx.createLinearGradient(0,0,0,H)
  bg.addColorStop(0,'#0d2238')
  bg.addColorStop(0.55,'#08172a')
  bg.addColorStop(1,'#040d18')
  ctx.fillStyle = bg
  ctx.fillRect(0,0,W,H)

  // 顶部金光(柔化)
  const halo = ctx.createRadialGradient(W/2, 60, 10, W/2, 60, W*0.65)
  halo.addColorStop(0,'rgba(247,198,106,0.22)')
  halo.addColorStop(1,'rgba(0,0,0,0)')
  ctx.fillStyle = halo
  ctx.fillRect(0,0,W,H*0.45)

  // 金线顶边
  const topLine = ctx.createLinearGradient(0,0,W,0)
  topLine.addColorStop(0,'rgba(0,0,0,0)')
  topLine.addColorStop(0.3,'#f7c66a')
  topLine.addColorStop(0.7,'#2f8cff')
  topLine.addColorStop(1,'rgba(0,0,0,0)')
  ctx.fillStyle = topLine
  ctx.fillRect(0, 0, W, 2)

  // 内描边框
  ctx.strokeStyle = 'rgba(247,198,106,0.12)'
  ctx.lineWidth = 1
  roundRect(ctx, 24, 24, W-48, H-48, 30)
  ctx.stroke()

  drawUserBlock(ctx, W, 44, { avatarImg, nickName })

  // "我的交易DNA"
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#9dccff'
  ctx.font = '600 24px sans-serif'
  ctx.fillText('我  的  交  易  D  N  A', W/2, 152)

  // DNA 大码
  ctx.fillStyle = '#f7c66a'
  ctx.font = '900 120px sans-serif'
  ctx.strokeStyle = 'rgba(247,198,106,0.35)'
  ctx.lineWidth = 3
  ctx.strokeText(code, W/2, 262)
  ctx.fillText(code, W/2, 262)

  // 人格名
  ctx.fillStyle = '#fff'
  ctx.font = '900 46px sans-serif'
  ctx.fillText(name, W/2, 362)

  // 同类导师卡(增加转发共鸣)
  drawMentorCard(ctx, W, { mentor, mentorAvatarImg })

  // 中段卡(因名人卡占位,下移)
  const midX = 50, midY = 548, midW = W-100, midH = 440
  ctx.fillStyle = 'rgba(255,255,255,0.035)'
  roundRect(ctx, midX, midY, midW, midH, 22)
  ctx.fill()
  ctx.strokeStyle = 'rgba(247,198,106,0.10)'
  ctx.lineWidth = 1
  ctx.stroke()

  // 左侧雷达
  const radarSize = 360
  const radarX = midX + 20
  const radarY = midY + (midH - radarSize)/2
  ctx.save()
  ctx.translate(radarX, radarY)
  drawRadar(ctx, radarSize, radarSize, scoreList, { overlay:true, labelSize:11 })
  ctx.restore()

  // 右侧 4 基质
  const tx = midX + 410
  const ty = midY + 50
  ctx.fillStyle = '#f7c66a'
  ctx.font = '800 24px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('交 易 基 质', tx, ty)
  ctx.strokeStyle = 'rgba(247,198,106,0.25)'
  ctx.beginPath()
  ctx.moveTo(tx, ty + 36)
  ctx.lineTo(tx + 220, ty + 36)
  ctx.stroke()

  traitTags.forEach((t, i)=>{
    const ry = ty + 60 + i*78
    // 标签底
    const tagGrad = ctx.createLinearGradient(tx, ry, tx + 230, ry)
    tagGrad.addColorStop(0,'rgba(247,198,106,0.20)')
    tagGrad.addColorStop(1,'rgba(47,140,255,0.06)')
    ctx.fillStyle = tagGrad
    roundRect(ctx, tx, ry, 230, 66, 18)
    ctx.fill()
    ctx.strokeStyle = 'rgba(247,198,106,0.30)'
    ctx.lineWidth = 1
    ctx.stroke()
    // icon 圆
    const cgrad = ctx.createLinearGradient(tx+12, ry+12, tx+56, ry+54)
    cgrad.addColorStop(0,'#ffeaa3')
    cgrad.addColorStop(1,'#c98a2c')
    ctx.fillStyle = cgrad
    ctx.beginPath()
    ctx.arc(tx + 38, ry + 33, 22, 0, Math.PI*2)
    ctx.fill()
    // 真机 canvas 不渲染彩色 emoji，用汉字代替
    ctx.fillStyle = '#1a1208'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(t.canvasChar || t.text.charAt(0), tx + 38, ry + 33)
    // text
    ctx.fillStyle = '#ffe39a'
    ctx.font = '900 28px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(t.text, tx + 76, ry + 33)
  })

  // slogan
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#dcecff'
  ctx.font = '800 32px sans-serif'
  ctx.fillText('发 现 交 易 基 因', W/2, midY + midH + 75)
  ctx.fillStyle = '#f7c66a'
  ctx.fillText('找 到 最 适 合 你 的 交 易 体 系', W/2, midY + midH + 125)

  // footer 卡
  const fY = H - 240
  ctx.fillStyle = 'rgba(255,255,255,0.05)'
  roundRect(ctx, 50, fY, W-100, 160, 22)
  ctx.fill()
  ctx.strokeStyle = 'rgba(247,198,106,0.18)'
  ctx.stroke()

  // logo
  if(logoImg){
    ctx.save()
    ctx.beginPath()
    ctx.arc(110, fY+80, 38, 0, Math.PI*2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(logoImg, 72, fY+42, 76, 76)
    ctx.restore()
  }
  ctx.fillStyle = '#fff'
  ctx.font = '900 30px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('TradeDNA', 170, fY + 64)
  ctx.fillStyle = '#9dccff'
  ctx.font = '500 20px sans-serif'
  ctx.fillText('交易DNA测评', 170, fY + 96)

  drawQrBlock(ctx, W, fY, qrImg)
}

Page({
  data:{
    result:{code:'ASGD'}, p:{}, traitTags:[], scoreList:[],
    userProfile:{ avatarUrl:'', nickName:'交易者' },
    avatarInitial:'交', saving:false, sharing:false
  },

  onLoad(){
    const result = wx.getStorageSync('tradeDNAResult')
    if(!result || !result.code){
      wx.showToast({ title:'还没有测评结果', icon:'none' })
      setTimeout(()=>wx.reLaunch({ url:'/pages/intro/intro' }), 800)
      return
    }
    const code = result.code || ''
    // 用 code 重新查最新 personality,避免 storage 里的旧人格数据
    const { getPersonality } = require('../../utils/personalities')
    const p = getPersonality(code) || result.personality
    const traitTags = code.split('').map(c => TRAIT_MAP[c]).filter(Boolean)
    const scoreList = Object.keys(p.scores||{}).map(k=>({ name:k, value:p.scores[k] })).sort((a,b)=>b.value-a.value).slice(0,5)
    const userProfile = getProfile()
    const displayName = getDisplayName(userProfile)
    const mentorAvatar = p && p.mentor ? getMentorAvatar(p.mentor.name) : ''
    this.setData({
      result, p, traitTags, scoreList, userProfile, mentorAvatar,
      avatarInitial: displayName.charAt(0)
    }, ()=>this.renderRadar(scoreList))
    this.preloadAssets()
  },

  persistProfile(partial){
    const userProfile = saveProfile(partial)
    this.setData({
      userProfile,
      avatarInitial: getDisplayName(userProfile).charAt(0)
    })
  },

  onChooseAvatar(e){
    const avatarUrl = e.detail && e.detail.avatarUrl
    if(!avatarUrl) return
    this.persistProfile({ avatarUrl })
  },

  onNicknameInput(e){
    const nickName = (e.detail.value || '').trim()
    this.setData({
      'userProfile.nickName': nickName,
      avatarInitial: (nickName || getDisplayName(userProfile)).charAt(0)
    })
  },

  onNicknameBlur(e){
    const nickName = ((e.detail.value || this.data.userProfile.nickName || '').trim()) || getDisplayName()
    this.persistProfile({ nickName })
  },

  preloadAssets(){
    this._assetPaths = {}
    ;['/assets/logo.png', '/assets/qrcode.jpg'].forEach(src=>{
      wx.getImageInfo({
        src,
        success: res => { this._assetPaths[src] = res.path },
        fail: err => { console.warn('[poster] preload fail', src, err) }
      })
    })
  },

  ensureAssetPath(src){
    if(this._assetPaths && this._assetPaths[src]) return Promise.resolve(this._assetPaths[src])
    return new Promise((resolve, reject)=>{
      wx.getImageInfo({
        src,
        success: res => {
          if(!this._assetPaths) this._assetPaths = {}
          this._assetPaths[src] = res.path
          resolve(res.path)
        },
        fail: reject
      })
    })
  },

  renderRadar(scoreList){
    const tryRender = (attempt)=>{
      const q = this.createSelectorQuery()
      q.select('#posterRadar').fields({ node:true, size:true }).exec(res=>{
        if(!res || !res[0] || !res[0].node || !res[0].width || !res[0].height){
          if(attempt < 6){
            setTimeout(()=>tryRender(attempt+1), 120)
          } else {
            console.warn('[poster] radar canvas not ready after retries')
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

  back(){ wx.navigateBack({ delta:1 }) },
  followOfficial(){ openOfficialAccount() },

  savePoster(){
    if(this.data.saving || this.data.sharing) return
    this.setData({ saving:true })
    wx.showLoading({ title:'生成中…', mask:true })
    this.exportImage()
      .then(tmpPath => this.saveToAlbum(tmpPath))
      .catch(err => {
        console.error('[poster] save error', err)
        wx.showToast({ title:'生成失败,可截图保存', icon:'none', duration:2000 })
      })
      .then(()=>{
        wx.hideLoading()
        this.setData({ saving:false })
      })
  },

  sharePoster(){
    if(this.data.saving || this.data.sharing) return
    this.setData({ sharing:true })
    wx.showLoading({ title:'生成中…', mask:true })
    this.exportImage()
      .then(tmpPath => new Promise((resolve, reject)=>{
        wx.showShareImageMenu({
          path: tmpPath,
          success: resolve,
          fail: reject
        })
      }))
      .catch(err => {
        console.error('[poster] share error', err)
        const msg = (err && err.errMsg && err.errMsg.indexOf('cancel') >= 0)
          ? ''
          : '分享失败,可先保存到相册'
        if(msg) wx.showToast({ title: msg, icon:'none', duration:2000 })
      })
      .then(()=>{
        wx.hideLoading()
        this.setData({ sharing:false })
      })
  },

  exportImage(){
    return new Promise((resolve, reject)=>{
      const q = wx.createSelectorQuery()
      q.select('#exportCanvas').fields({ node:true, size:true }).exec(async res=>{
        if(!res || !res[0] || !res[0].node) return reject('canvas not found')
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const W = 750, H = 1500
        canvas.width = W * 2
        canvas.height = H * 2
        ctx.scale(2, 2)

        try {
          let logoImg = null
          let qrImg = null
          let avatarImg = null
          let mentorAvatarImg = null
          const { avatarUrl, nickName } = this.data.userProfile || {}
          const mentorAvatarSrc = this.data.mentorAvatar
          if(mentorAvatarSrc){
            try {
              const mPath = await this.ensureAssetPath(mentorAvatarSrc)
              mentorAvatarImg = await loadCanvasImage(canvas, mPath)
            } catch(e){
              console.warn('[poster] mentor avatar load fail', e)
            }
          }
          try {
            const logoPath = await this.ensureAssetPath('/assets/logo.png')
            logoImg = await loadCanvasImage(canvas, logoPath)
          } catch(e){
            console.warn('[poster] logo load fail', e)
          }
          try {
            const qrPath = await this.ensureAssetPath('/assets/qrcode.jpg')
            qrImg = await loadCanvasImage(canvas, qrPath)
          } catch(e){
            console.warn('[poster] qrcode load fail', e)
          }
          if(avatarUrl){
            try {
              avatarImg = await loadCanvasImage(canvas, avatarUrl)
            } catch(e){
              console.warn('[poster] avatar load fail', e)
            }
          }
          await drawExportPoster(canvas, ctx, W, H, {
            code: this.data.result.code,
            name: this.data.p.name,
            traitTags: this.data.traitTags,
            scoreList: this.data.scoreList,
            mentor: this.data.p.mentor,
            mentorAvatarImg,
            logoImg, qrImg, avatarImg,
            nickName: getDisplayName(this.data.userProfile)
          })
          await flushCanvas(canvas)
          const hasImg = qrImg || avatarImg
          await new Promise(r => setTimeout(r, hasImg ? 320 : 120))
          wx.canvasToTempFilePath({
            canvas, x:0, y:0, width:W*2, height:H*2,
            destWidth:W*2, destHeight:H*2,
            fileType:'png', quality:1,
            success: r => resolve(r.tempFilePath),
            fail: reject
          }, this)
        } catch(e){ reject(e) }
      })
    })
  },

  saveToAlbum(tmpPath){
    return new Promise((resolve)=>{
      wx.getSetting({
        success: setting => {
          const authed = setting.authSetting['scope.writePhotosAlbum']
          if(authed === false){
            // 之前拒绝过,引导打开设置
            wx.showModal({
              title:'需要相册权限',
              content:'请允许保存图片到相册',
              confirmText:'去开启',
              success: r => {
                if(r.confirm) wx.openSetting()
                resolve()
              }
            })
            return
          }
          wx.saveImageToPhotosAlbum({
            filePath: tmpPath,
            success: ()=>{
              wx.showToast({ title:'已保存到相册', icon:'success', duration:1800 })
              resolve()
            },
            fail: err => {
              console.warn('[poster] save fail', err)
              wx.showToast({ title:'保存失败,可长按图片', icon:'none' })
              resolve()
            }
          })
        }
      })
    })
  },

  onShareAppMessage(){
    const code = (this.data.result||{}).code || 'ASGD'
    const name = (this.data.p||{}).name || ''
    const mentor = ((this.data.p||{}).mentor||{}).name || ''
    const nick = (this.data.userProfile||{}).nickName || ''
    const who = nick && nick !== '交易者' ? nick : '我'
    const title = mentor
      ? `${who}的交易DNA是 ${code} · ${name},同类导师 ${mentor}`
      : `${who}的交易DNA是 ${code} · ${name}`
    return { title, path:'/pages/index/index' }
  }
})
