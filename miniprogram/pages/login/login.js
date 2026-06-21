const { completeLogin } = require('../../utils/auth')
const { getProfile } = require('../../utils/userProfile')

Page({
  data:{
    avatarUrl:'', nickName:'', redirect:'/pages/intro/intro', submitting:false
  },

  onLoad(options){
    const redirect = options.redirect ? decodeURIComponent(options.redirect) : '/pages/intro/intro'
    const p = getProfile()
    this.setData({
      redirect,
      avatarUrl: p.avatarUrl || '',
      nickName: p.nickName || ''
    })
  },

  onChooseAvatar(e){
    const avatarUrl = e.detail && e.detail.avatarUrl
    if(avatarUrl) this.setData({ avatarUrl })
  },

  onNicknameInput(e){
    this.setData({ nickName: (e.detail.value || '').trim() })
  },

  submitLogin(){
    if(this.data.submitting) return
    const { avatarUrl, nickName } = this.data
    if(!avatarUrl){
      wx.showToast({ title:'请先选择头像', icon:'none' })
      return
    }
    if(!nickName){
      wx.showToast({ title:'请填写昵称', icon:'none' })
      return
    }

    this.setData({ submitting:true })
    wx.showLoading({ title:'准备中…', mask:true })

    completeLogin({ avatarUrl, nickName })
      .then(()=>{
        wx.hideLoading()
        this.setData({ submitting:false })
        const url = this.data.redirect || '/pages/intro/intro'
        if(url.indexOf('/pages/quiz/quiz') >= 0){
          wx.redirectTo({ url })
        } else {
          wx.reLaunch({ url })
        }
      })
      .catch(err=>{
        console.error('[login] fail', err)
        wx.hideLoading()
        this.setData({ submitting:false })
        wx.showToast({ title:'登录失败，请重试', icon:'none' })
      })
  }
})
